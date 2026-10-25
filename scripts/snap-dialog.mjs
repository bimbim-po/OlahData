import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUT_DIR = path.resolve(__dirname, '../apps/web/out');
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function createStaticServer(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const rawPath = req.url ? req.url.split('?')[0] : '/';
      let filePath = path.join(OUT_DIR, rawPath);
      if (fs.existsSync(filePath + '.html')) {
        filePath = filePath + '.html';
      } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
        filePath = path.join(filePath, 'index.html');
      } else if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        filePath = path.join(OUT_DIR, '404.html');
      }
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end('Not Found');
      }
    });
    server.listen(port, () => resolve(server));
    server.on('error', reject);
  });
}

async function run() {
  const server = await createStaticServer(4222);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto('http://localhost:4222/app/proyek/sample/analisis?contoh=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);

  // Click on "Lanjut ke Pertanyaan Penelitian"
  const lanjutBtn = page.getByRole('button', { name: /Lanjut ke Pertanyaan Penelitian/i });
  await lanjutBtn.click();
  await page.waitForTimeout(500);

  const destPath = 'C:/Users/ThinkPad X1 Yoga/.gemini/antigravity/brain/3238dc4e-fb77-4692-9957-e530fba398b7/dialog_critical_error_resolution.png';
  await page.screenshot({ path: destPath });
  console.log('Saved dialog screenshot to:', destPath);

  await browser.close();
  server.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
