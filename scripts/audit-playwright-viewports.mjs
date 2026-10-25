import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'apps', 'web', 'out');
const screenshotDir = path.join(rootDir, 'docs', 'audit', 'screenshots');

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ico': 'image/x-icon',
  };
  return map[ext] || 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';

  let filePath = path.join(outDir, reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  if (fs.existsSync(filePath + '.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(filePath + '.html').pipe(res);
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const indexPath = path.join(filePath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(indexPath).pipe(res);
      return;
    }
  }

  const notFoundPath = path.join(outDir, '404.html');
  if (fs.existsSync(notFoundPath)) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(notFoundPath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = 3777;

server.listen(PORT, async () => {
  console.log(`================================================================`);
  console.log(`📱 PLAYWRIGHT RESPONSIVE AUDIT (360, 390, 768, 1024, 1440 PX)`);
  console.log(`   Server running at http://localhost:${PORT}`);
  console.log(`================================================================\n`);

  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { name: '360px', width: 360, height: 740 },
    { name: '390px', width: 390, height: 844 },
    { name: '768px', width: 768, height: 1024 },
    { name: '1024px', width: 1024, height: 768 },
    { name: '1440px', width: 1440, height: 900 },
  ];

  const routes = [
    { path: '/', name: 'Landing / Beranda' },
    { path: '/harga', name: 'Harga & Paket' },
    { path: '/panduan', name: 'Panduan' },
    { path: '/masuk', name: 'Masuk (Login)' },
    { path: '/daftar', name: 'Daftar (Register)' },
    { path: '/pernyataan-penggunaan', name: 'Pernyataan Penggunaan' },
    { path: '/privasi', name: 'Kebijakan Privasi' },
    { path: '/syarat', name: 'Syarat & Ketentuan' },
    { path: '/app', name: 'Dashboard Meja Kerja' },
    { path: '/app/proyek/baru?contoh=1', name: 'Proyek Baru' },
    { path: '/app/proyek/sample/analisis?contoh=1', name: 'Wizard Analisis' },
    { path: '/app/proyek/sample/hasil?contoh=1', name: 'Hasil Bab 4' },
    { path: '/app/bantuan', name: 'Bantuan' },
    { path: '/app/pengaturan', name: 'Pengaturan' },
    { path: '/app/riwayat', name: 'Riwayat & Audit' },
  ];

  const auditLog = [];

  try {
    for (const r of routes) {
      console.log(`Memeriksa Rute: ${r.name} (${r.path})`);

      for (const vp of viewports) {
        const page = await browser.newPage({
          viewport: { width: vp.width, height: vp.height },
        });

        // Set auth session in localStorage so app pages load smoothly
        await page.addInitScript(() => {
          localStorage.setItem(
            'olahdata-session',
            JSON.stringify({
              id: 'usr-audit',
              name: 'Mahasiswa Peneliti',
              email: 'peneliti@ui.ac.id',
              university: 'Universitas Indonesia',
              department: 'Manajemen',
              plan: 'monthly',
            })
          );
        });

        const targetUrl = `http://localhost:${PORT}${r.path}`;
        const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(300);

        const status = response ? response.status() : 0;
        const is404 = status === 404;

        // Check horizontal scroll
        const scrollData = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientWidth = docEl.clientWidth;
          return {
            scrollWidth,
            clientWidth,
            hasOverflow: scrollWidth > clientWidth + 1,
          };
        });

        // Capture screenshot
        const safeRoute = r.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const screenshotPath = path.join(screenshotDir, `${safeRoute}_${vp.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });

        const pass = !is404 && !scrollData.hasOverflow;
        auditLog.push({
          route: r.path,
          name: r.name,
          viewport: vp.name,
          width: vp.width,
          status,
          scrollWidth: scrollData.scrollWidth,
          clientWidth: scrollData.clientWidth,
          hasOverflow: scrollData.hasOverflow,
          pass,
        });

        const icon = pass ? '✓' : '❌';
        console.log(`  ${icon} [${vp.name}] Status: ${status}, Scroll: ${scrollData.scrollWidth}/${scrollData.clientWidth}px`);

        await page.close();
      }
    }

    // Write Markdown report
    const reportPath = path.join(rootDir, 'docs', 'audit', 'audit_viewports_report.md');
    let md = `# Laporan Audit Responsif & Tampilan Lintas Layar OlahData\n\n`;
    md += `Tanggal: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n`;
    md += `Ukuran viewport diuji: 360px, 390px, 768px, 1024px, 1440px\n\n`;
    md += `| Rute | Nama Halaman | Viewport | Status | Lebar Gulir / Layar | Scroll Horizontal | Status |\n`;
    md += `|---|---|---|---|---|---|---|\n`;

    let totalPassed = 0;
    auditLog.forEach((item) => {
      if (item.pass) totalPassed++;
      const resText = item.pass ? '✅ Lolos' : '❌ Gagal';
      const overflowText = item.hasOverflow ? '⚠️ Ya (Meluap)' : 'Tidak (Pas)';
      md += `| \`${item.route}\` | ${item.name} | ${item.viewport} | ${item.status} | ${item.scrollWidth}px / ${item.clientWidth}px | ${overflowText} | ${resText} |\n`;
    });

    md += `\n**Total Pengujian**: ${auditLog.length}\n`;
    md += `**Lulus**: ${totalPassed} / ${auditLog.length}\n`;

    fs.writeFileSync(reportPath, md, 'utf-8');
    console.log(`\n================================================================`);
    console.log(`Hasil Lengkap Disimpan ke: ${reportPath}`);
    console.log(`Ringkasan: ${totalPassed} / ${auditLog.length} pengujian lolos.`);
    console.log(`================================================================\n`);

  } catch (err) {
    console.error('Audit encountered error:', err);
  } finally {
    await browser.close();
    server.close();
  }
});
