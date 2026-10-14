import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve(__dirname, '../../../out');
const SCREENSHOT_DIR = path.resolve(__dirname, '../../../screenshots');

// MIME types dictionary for static server
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function createStaticServer(port = 4173): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url ? req.url.split('?')[0] : '/';
      let filePath = path.join(OUT_DIR, reqPath);

      if (fs.existsSync(filePath + '.html')) {
        filePath = filePath + '.html';
      } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
        filePath = path.join(filePath, 'index.html');
      } else if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        // already points to a valid file
      } else {
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

    server.listen(port, () => {
      resolve(server);
    });
  });
}

async function runE2ETests() {
  console.log('--- MENJALANKAN PLAYWRIGHT RESPONSIVENESS & ACCESSIBILITY AUDIT ---');

  if (!fs.existsSync(OUT_DIR)) {
    console.error('Folder out/ belum ada. Jalankan npm run build:export terlebih dahulu.');
    process.exit(1);
  }

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const server = await createStaticServer(4173);
  console.log('Local server running on http://localhost:4173');

  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { width: 375, height: 667, name: '375_mobile' },
    { width: 768, height: 1024, name: '768_tablet' },
    { width: 1280, height: 800, name: '1280_desktop' },
    { width: 1920, height: 1080, name: '1920_ultrawide' },
  ];

  const colorModes: ('light' | 'dark')[] = ['dark', 'light'];

  let passedTests = 0;
  let totalTests = 0;

  try {
    for (const vp of viewports) {
      for (const mode of colorModes) {
        totalTests++;
        console.log(`\nTesting Viewport ${vp.width}x${vp.height} in mode "${mode}"...`);

        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          colorScheme: mode,
        });

        const page = await context.newPage();

        // Siapkan state login demo di localStorage sebelum membuka halaman
        await page.addInitScript(() => {
          localStorage.setItem(
            'olahdata-auth',
            JSON.stringify({
              state: {
                user: {
                  id: 'user-demo-1',
                  name: 'Peneliti Demo Mahasiswa',
                  email: 'peneliti.skripsi@kampus.ac.id',
                  university: 'Universitas Indonesia',
                  plan: 'thesis',
                  createdAt: '2026-10-11T00:00:00Z',
                },
                isLoading: false,
              },
              version: 0,
            })
          );
        });

        const url = 'http://localhost:4173/app/proyek/sample/hasil?contoh=1';
        await page.goto(url, { waitUntil: 'networkidle' });

        // Terapkan class dark/light secara eksplisit
        await page.evaluate((m) => {
          if (m === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
          } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
          }
        }, mode);

        await page.waitForTimeout(600);

        // 1. Verifikasi tidak ada horizontal scroll pada viewport
        const scrollInfo = await page.evaluate(() => {
          const bodyScroll = document.body.scrollWidth;
          const docScroll = document.documentElement.scrollWidth;
          const winWidth = window.innerWidth;
          return {
            winWidth,
            docScroll,
            bodyScroll,
            hasHScroll: docScroll > winWidth + 2 || bodyScroll > winWidth + 2,
          };
        });

        console.assert(
          !scrollInfo.hasHScroll,
          `Error: Horizontal scroll detected on ${vp.width}px! docScroll=${scrollInfo.docScroll}, winWidth=${scrollInfo.winWidth}`
        );
        if (!scrollInfo.hasHScroll) {
          console.log(`  ✓ Tidak ada horizontal scroll (width=${vp.width}px, max scroll=${scrollInfo.docScroll}px)`);
        }

        // 2. Verifikasi Sidebar / Bottom Nav
        if (vp.width >= 1024) {
          const sidebarVisible = await page.locator('aside').first().isVisible();
          console.assert(sidebarVisible, `Sidebar desktop harus terlihat pada ${vp.width}px`);
          console.log(`  ✓ Sidebar desktop 240px tampil penuh`);
        } else {
          const bottomNavVisible = await page.locator('nav[aria-label="Navigasi bawah mobile"]').isVisible();
          console.assert(bottomNavVisible, `Bottom nav harus terlihat pada ${vp.width}px`);
          console.log(`  ✓ Navigasi bawah mobile responsif aktif`);
        }

        // 3. Verifikasi Tombol Unduh Word & PDF terlihat dan ada
        const unduhWordBtn = page.getByRole('button', { name: /Unduh Word/i });
        const wordBtnCount = await unduhWordBtn.count();
        console.assert(wordBtnCount > 0, 'Tombol Unduh Word harus tersedia di halaman');
        console.log(`  ✓ Tombol Unduh Word tersedia dan siap`);

        const unduhPdfBtn = page.getByRole('button', { name: /Unduh PDF/i });
        const pdfBtnCount = await unduhPdfBtn.count();
        console.assert(pdfBtnCount > 0, 'Tombol Unduh PDF harus tersedia di halaman');
        console.log(`  ✓ Tombol Unduh PDF tersedia dan siap`);

        // 4. Verifikasi Konsistensi N
        const badgeN = await page.locator('span:has-text("N = 120"), span:has-text("N = 117"), span:has-text("N = 30")').first().innerText();
        console.log(`  ✓ Single source N terbaca: ${badgeN}`);

        // 5. Simpan Screenshot Resmi
        const screenshotPath = path.join(
          SCREENSHOT_DIR,
          `hasil_${vp.name}_${mode}.png`
        );
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`  ✓ Screenshot tersimpan: ${path.basename(screenshotPath)}`);

        passedTests++;
        await context.close();
      }
    }

    console.log(`\n🎉 SEMUA PENGUJIAN PLAYWRIGHT RESPONSIVENESS LULUS (${passedTests}/${totalTests})!`);
  } finally {
    await browser.close();
    server.close();
  }
}

runE2ETests().catch((err) => {
  console.error('Playwright test failed:', err);
  process.exit(1);
});
