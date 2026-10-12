// scripts/capture-audit-screenshots.mjs
// Mengambil tangkapan layar seluruh halaman pada 360, 768, dan 1280 px (terang dan gelap)
// untuk keperluan audit visual sebelum perombakan desain (Langkah 0).

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('../apps/web/node_modules/playwright');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'apps', 'web', 'out');
const targetDir = process.env.CAPTURE_TARGET_DIR || path.join(rootDir, 'docs', 'design', 'before');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 1. Static file server with clean URL resolution (.html fallback)
function getMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ico': 'image/x-icon',
  };
  return map[ext] || 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';

  let fullPath = path.join(outDir, reqPath);
  if (!fs.existsSync(fullPath)) {
    if (fs.existsSync(fullPath + '.html')) {
      fullPath = fullPath + '.html';
    } else if (fs.existsSync(path.join(fullPath, 'index.html'))) {
      fullPath = path.join(fullPath, 'index.html');
    }
  }

  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    res.writeHead(200, { 'Content-Type': getMime(fullPath) });
    fs.createReadStream(fullPath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

const PORT = 3456;

server.listen(PORT, async () => {
  console.log(`Static server running at http://localhost:${PORT}`);
  console.log(`Saving screenshots to: ${targetDir}`);

  const browser = await chromium.launch({ headless: true });

  const routes = [
    { name: 'beranda', path: '/' },
    { name: 'masuk', path: '/masuk' },
    { name: 'daftar', path: '/daftar' },
    { name: 'harga', path: '/harga' },
    { name: 'app_dashboard', path: '/app' },
    { name: 'app_wizard', path: '/app/proyek/baru' },
    { name: 'app_analisis', path: '/app/proyek/sample/analisis' },
    { name: 'app_hasil', path: '/app/proyek/sample/hasil' },
    { name: 'admin_overview', path: '/admin' },
    { name: 'admin_pelanggan', path: '/admin/pelanggan' },
  ];

  const viewports = [
    { label: '360', width: 360, height: 780 },
    { label: '768', width: 768, height: 1024 },
    { label: '1280', width: 1280, height: 800 },
  ];

  const themes = ['light', 'dark'];

  try {
    for (const r of routes) {
      console.log(`\nProcessing page: ${r.name} (${r.path})`);
      for (const vp of viewports) {
        for (const theme of themes) {
          const context = await browser.newContext({
            viewport: { width: vp.width, height: vp.height },
            colorScheme: theme,
          });
          const page = await context.newPage();

          await page.goto(`http://localhost:${PORT}${r.path}`, { waitUntil: 'networkidle' });

          // Force dark/light class on html element to match theme
          await page.evaluate((t) => {
            if (t === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }, theme);

          await page.waitForTimeout(350);

          const filename = `${r.name}_${vp.label}px_${theme}.png`;
          const filePath = path.join(targetDir, filename);

          await page.screenshot({ path: filePath, fullPage: false });
          console.log(`  ✓ Captured: ${filename}`);

          await context.close();
        }
      }
    }
    console.log('\nAll screenshots captured successfully!');
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    await browser.close();
    server.close();
    process.exit(0);
  }
});
