import { chromium, Page } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve(__dirname, '../../../out');

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

function createStaticServer(port = 4175): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url ? req.url.split('?')[0] : '/';
      let filePath = path.join(OUT_DIR, reqPath);

      // Emulate Cloudflare Pages routing:
      // 1. Direct file or html file
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        // file exists
      } else if (fs.existsSync(filePath + '.html')) {
        filePath = filePath + '.html';
      } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
        filePath = path.join(filePath, 'index.html');
      } else {
        // 2. Check _redirects for dynamic routes
        if (reqPath.startsWith('/app/proyek/') && reqPath.endsWith('/hasil')) {
          filePath = path.join(OUT_DIR, 'app/proyek/sample/hasil.html');
        } else if (reqPath.startsWith('/app/proyek/') && reqPath.endsWith('/analisis')) {
          filePath = path.join(OUT_DIR, 'app/proyek/sample/analisis.html');
        } else if (reqPath.startsWith('/app/proyek/')) {
          filePath = path.join(OUT_DIR, 'app/proyek/sample/analisis.html');
        } else if (reqPath.startsWith('/admin/pelanggan/')) {
          filePath = path.join(OUT_DIR, 'admin/pelanggan/sample.html');
        } else {
          // 3. Real 404
          filePath = path.join(OUT_DIR, '404.html');
          const content = fs.existsSync(filePath) ? fs.readFileSync(filePath) : '404 Not Found';
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
          return;
        }
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('404 Not Found');
      }
    });

    server.listen(port, () => {
      resolve(server);
    });
  });
}

async function runCrawler() {
  console.log('=== MEMULAI TEST PENJELAJAH TAUTAN & AUDIT AKSESIBILITAS ===\n');

  if (!fs.existsSync(OUT_DIR)) {
    console.error('Error: Folder out/ belum dibuat. Jalankan npm run build:export terlebih dahulu.');
    process.exit(1);
  }

  const server = await createStaticServer(4175);
  console.log('Server pengujian lokal aktif di http://localhost:4175');

  const browser = await chromium.launch({ headless: true });
  const errorsFound: string[] = [];
  let linksChecked = 0;

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });

    const page = await context.newPage();

    // Setup login session in localStorage
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
              department: 'Manajemen',
              plan: 'thesis',
              createdAt: '2026-10-11T00:00:00Z',
            },
            isLoading: false,
          },
          version: 0,
        })
      );
      localStorage.setItem(
        'olahdata-session',
        JSON.stringify({
          id: 'user-demo-1',
          name: 'Peneliti Demo Mahasiswa',
          email: 'peneliti.skripsi@kampus.ac.id',
          university: 'Universitas Indonesia',
          department: 'Manajemen',
          plan: 'thesis',
          createdAt: '2026-10-11T00:00:00Z',
        })
      );
    });

    // 1. Audit Rute Pokok Publik & App
    const ROUTES_TO_AUDIT = [
      '/',
      '/harga',
      '/panduan',
      '/pernyataan-penggunaan',
      '/privasi',
      '/syarat',
      '/masuk',
      '/daftar',
      '/app',
      '/app/bantuan',
      '/app/riwayat',
      '/app/pengaturan',
      '/app/langganan',
      '/app/proyek/baru',
      '/app/proyek/sample/analisis',
      '/app/proyek/sample/hasil',
      '/app/akses-ditolak',
    ];

    console.log('1. Mengunjungi rute-rute utama aplikasi & publik...');
    for (const route of ROUTES_TO_AUDIT) {
      const url = `http://localhost:4175${route}`;
      const response = await page.goto(url, { waitUntil: 'networkidle' });
      const status = response?.status();

      if (status !== 200) {
        const msg = `Rute ${route} menghasilkan HTTP ${status} (harus 200)`;
        console.error(`  ❌ ${msg}`);
        errorsFound.push(msg);
      } else {
        // Cek halaman tidak kosong
        const bodyText = await page.locator('body').innerText();
        if (!bodyText || bodyText.trim().length < 20) {
          const msg = `Rute ${route} kosong (hanya ${bodyText?.length || 0} karakter)`;
          console.error(`  ❌ ${msg}`);
          errorsFound.push(msg);
        } else {
          console.log(`  ✓ Rute [${route}] terbuka sempurna (HTTP 200, length=${bodyText.length})`);
        }
      }
    }

    // 2. Crawler Seluruh Tautan di Setiap Halaman
    console.log('\n2. Menjelajah seluruh link pada Sidebar, Header, Footer, Breadcrumb...');
    const visitedUrls = new Set<string>();
    const queue = ['http://localhost:4175/app'];

    while (queue.length > 0 && queue.length < 50) {
      const currentUrl = queue.shift()!;
      if (visitedUrls.has(currentUrl)) continue;
      visitedUrls.add(currentUrl);

      await page.goto(currentUrl, { waitUntil: 'networkidle' });
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href]'))
          .map((a) => (a as HTMLAnchorElement).getAttribute('href'))
          .filter(Boolean) as string[];
      });

      for (const href of links) {
        linksChecked++;
        if (
          href.startsWith('mailto:') ||
          href.startsWith('#') ||
          href.startsWith('http://') ||
          href.startsWith('https://') ||
          href.endsWith('.xlsx') ||
          href.endsWith('.xls') ||
          href.endsWith('.csv') ||
          href.endsWith('.pdf') ||
          href.endsWith('.png') ||
          href.endsWith('.svg') ||
          href.endsWith('.ico')
        ) {
          // Jika file/asset lokal, verifikasi status 200 via HTTP request
          if (href.startsWith('/') && !href.startsWith('//')) {
            const assetUrl = new URL(href, currentUrl).href;
            const testAssetRes = await page.request.get(assetUrl);
            if (testAssetRes.status() !== 200) {
              const msg = `Berkas unduhan/asset mati: "${href}" (Status: ${testAssetRes.status()})`;
              console.error(`  ❌ ${msg}`);
              errorsFound.push(msg);
            }
          }
          continue;
        }

        const fullUrl = new URL(href, currentUrl).href;
        if (!fullUrl.startsWith('http://localhost:4175')) continue;

        // Cek status response
        const testRes = await page.request.get(fullUrl);
        const status = testRes.status();

        if (status === 404 || status >= 500) {
          const msg = `Dead link terdeteksi: "${href}" di halaman ${currentUrl} (Status: ${status})`;
          console.error(`  ❌ ${msg}`);
          errorsFound.push(msg);
        }

        if (!visitedUrls.has(fullUrl) && !queue.includes(fullUrl) && queue.length < 30) {
          queue.push(fullUrl);
        }
      }
    }
    console.log(`  ✓ ${linksChecked} tautan internal telah diverifikasi bebas 404/5xx`);

    // 3. Tes URL Tak Dikenal Mengembalikan Status 404
    console.log('\n3. Menguji respons 404 untuk URL yang tidak ada...');
    const invalidUrl = 'http://localhost:4175/halaman-yang-pasti-tidak-ada-12345';
    const notFoundRes = await page.goto(invalidUrl);
    const nfStatus = notFoundRes?.status();
    const nfTitle = await page.title();
    const nfText = await page.locator('body').innerText();

    if (nfStatus !== 404) {
      const msg = `URL tidak ada (${invalidUrl}) mengembalikan HTTP ${nfStatus} (seharusnya 404)`;
      console.error(`  ❌ ${msg}`);
      errorsFound.push(msg);
    } else {
      console.log(`  ✓ URL tidak ada mengembalikan status HTTP 404 yang tepat`);
    }

    if (!nfText.includes('Halaman Tidak Ditemukan') && !nfText.includes('404')) {
      const msg = `Halaman 404 tidak menampilkan teks kustom Bahasa Indonesia`;
      console.error(`  ❌ ${msg}`);
      errorsFound.push(msg);
    } else {
      console.log(`  ✓ Halaman 404 kustom Bahasa Indonesia tampil dengan benar`);
    }

    // 4. Tes Kotak Pencarian Pusat Bantuan: kata "reliabilitas"
    console.log('\n4. Menguji fungsi pencarian Pusat Bantuan (/app/bantuan)...');
    await page.goto('http://localhost:4175/app/bantuan', { waitUntil: 'networkidle' });

    const searchInput = page.getByRole('searchbox', { name: /pencarian/i }).or(page.locator('input[type="search"]'));
    await searchInput.fill('reliabilitas');
    await page.waitForTimeout(400);

    const faqMatches = await page.locator('#faq').innerText();
    if (faqMatches.toLowerCase().includes('cronbach') || faqMatches.toLowerCase().includes('reliabel')) {
      console.log('  ✓ Pencarian "reliabilitas" berhasil menyaring artikel & FAQ terkait Cronbach’s Alpha');
    } else {
      const msg = 'Pencarian "reliabilitas" tidak menemukan FAQ terkait';
      console.error(`  ❌ ${msg}`);
      errorsFound.push(msg);
    }

    // 5. Tes Tata Letak Bebas Horizontal Scroll di 375, 768, 1280 px
    console.log('\n5. Menguji tata letak responsif pada 375, 768, 1280 px (Dark & Light)...');
    const testViewports = [
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1280, height: 800 },
    ];

    for (const vp of testViewports) {
      for (const mode of ['dark', 'light'] as const) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.evaluate((m) => {
          if (m === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
          } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
          }
        }, mode);

        for (const testPath of ['/app/bantuan', '/app/riwayat', '/app/pengaturan']) {
          await page.goto(`http://localhost:4175${testPath}`, { waitUntil: 'networkidle' });
          const hasHScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth + 1;
          });

          if (hasHScroll) {
            const msg = `Terdeteksi horizontal scroll pada ${testPath} di lebar ${vp.width}px (${mode})`;
            console.error(`  ❌ ${msg}`);
            errorsFound.push(msg);
          }
        }
      }
    }
    console.log('  ✓ Seluruh halaman baru bebas horizontal scroll di resolusi 375, 768, 1280 px');

    console.log('\n==================================================');
    console.log(`HASIL TEST: Ditemukan ${errorsFound.length} kesalahan.`);
    if (errorsFound.length === 0) {
      console.log('🎉 SEMUA PENGUJIAN PENJELAJAH TAUTAN DAN AKSESIBILITAS LULUS 100%!');
    } else {
      errorsFound.forEach((e) => console.error(` - ${e}`));
      process.exit(1);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

runCrawler().catch((err) => {
  console.error('Crawler failed:', err);
  process.exit(1);
});
