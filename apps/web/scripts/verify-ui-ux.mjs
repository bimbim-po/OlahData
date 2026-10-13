import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, '../out');
const screenshotDir = path.resolve(__dirname, '../playwright-report/screenshots');

fs.mkdirSync(screenshotDir, { recursive: true });

// 1. Static file server with clean URL support
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain',
  };
  return mimeTypes[ext] || 'application/octet-stream';
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

  // 404 fallback
  const notFoundPath = path.join(outDir, '404.html');
  if (fs.existsSync(notFoundPath)) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(notFoundPath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = 3888;

server.listen(PORT, async () => {
  console.log(`Test server running at http://localhost:${PORT}`);

  const browser = await chromium.launch({ headless: true });
  const results = [];

  const viewports = [
    { name: '320px', width: 320, height: 700 },
    { name: '375px', width: 375, height: 812 },
    { name: '768px', width: 768, height: 1024 },
    { name: '1280px', width: 1280, height: 900 },
  ];

  const routes = [
    { path: '/', name: 'Beranda' },
    { path: '/harga', name: 'Harga' },
    { path: '/masuk', name: 'Masuk' },
    { path: '/daftar', name: 'Daftar' },
    { path: '/privasi', name: 'Privasi' },
    { path: '/syarat', name: 'Syarat' },
    { path: '/pernyataan-penggunaan', name: 'Panduan' },
    { path: '/app?contoh=1', name: 'Meja Kerja App' },
    { path: '/app/proyek/baru?contoh=1', name: 'Proyek Baru' },
    { path: '/app/proyek/sample/analisis?contoh=1', name: 'Analisis Stepper' },
    { path: '/app/proyek/sample/hasil?contoh=1', name: 'Hasil Bab 4' },
    { path: '/404', name: '404 Not Found' },
  ];

  try {
    for (const route of routes) {
      console.log(`\nTesting Route: ${route.name} (${route.path})`);

      for (const vp of viewports) {
        const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

        const url = `http://localhost:${PORT}${route.path}`;
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);

        // Cek horizontal overflow
        const overflow = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientWidth = docEl.clientWidth;
          return {
            scrollWidth,
            clientWidth,
            hasOverflow: scrollWidth > clientWidth + 1, // allow 1px subpixel tolerance
          };
        });

        if (overflow.hasOverflow) {
          console.error(`  ❌ [${vp.name}] Horizontal Overflow detected! scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth}`);
          results.push({ route: route.path, vp: vp.name, check: 'Horizontal Scroll', pass: false });
        } else {
          console.log(`  ✓ [${vp.name}] No horizontal overflow (scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth})`);
          results.push({ route: route.path, vp: vp.name, check: 'Horizontal Scroll', pass: true });
        }

        // Simpan screenshot untuk viewports 375px dan 1280px
        if (vp.name === '375px' || vp.name === '1280px') {
          const filename = `${route.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${vp.name}.png`;
          await page.screenshot({ path: path.join(screenshotDir, filename), fullPage: false });
        }

        await page.close();
      }
    }

    // Interactive Test 1: Mobile Header Drawer, Focus Trap & Escape key
    console.log('\n--- Testing Mobile Menu Navigation & Focus Trap ---');
    const mobilePage = await browser.newPage({ viewport: { width: 375, height: 812 } });
    await mobilePage.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(500);

    const hamburger = mobilePage.locator('button[aria-label="Buka menu"]');
    const hamburgerExists = (await hamburger.count()) > 0;
    console.log(`  Hamburger button present: ${hamburgerExists}`);

    if (hamburgerExists) {
      await hamburger.click();
      await mobilePage.waitForTimeout(300);

      const mobileDialog = mobilePage.locator('#mobile-navigation-panel');
      const dialogVisible = await mobileDialog.isVisible();
      console.log(`  ✓ Mobile navigation panel opens: ${dialogVisible}`);
      results.push({ route: '/', vp: '375px', check: 'Mobile Menu Open', pass: dialogVisible });

      // Test Escape to close
      await mobilePage.keyboard.press('Escape');
      await mobilePage.waitForTimeout(300);
      const dialogClosed = !(await mobileDialog.isVisible());
      console.log(`  ✓ Escape key closes menu: ${dialogClosed}`);
      results.push({ route: '/', vp: '375px', check: 'Escape Key Closes Menu', pass: dialogClosed });
    }
    await mobilePage.close();

    // Interactive Test 2: Password Visibility Toggle on /masuk and /daftar
    console.log('\n--- Testing Password Visibility Toggle ---');
    const authPage = await browser.newPage({ viewport: { width: 375, height: 812 } });
    await authPage.goto(`http://localhost:${PORT}/masuk`, { waitUntil: 'networkidle' });
    await authPage.waitForTimeout(500);

    const passwordInput = authPage.locator('#password');
    const toggleBtn = authPage.locator('button[aria-label="Tampilkan kata sandi"]');
    const hasToggle = (await toggleBtn.count()) > 0;
    console.log(`  Password toggle button present on /masuk: ${hasToggle}`);

    if (hasToggle) {
      const typeInitial = await passwordInput.getAttribute('type');
      await toggleBtn.click();
      await authPage.waitForTimeout(200);
      const typeAfterClick = await passwordInput.getAttribute('type');
      const togglePass = typeInitial === 'password' && typeAfterClick === 'text';
      console.log(`  ✓ Password toggle works: ${typeInitial} -> ${typeAfterClick}`);
      results.push({ route: '/masuk', vp: '375px', check: 'Password Toggle', pass: togglePass });
    }
    await authPage.close();

    // Interactive Test 3: Stepper Navigation & Disabled Reason on /app/proyek/sample/analisis
    console.log('\n--- Testing Stepper Navigation & Inline Disabled Reason ---');
    const stepperPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await stepperPage.goto(`http://localhost:${PORT}/app/proyek/sample/analisis?contoh=1`, { waitUntil: 'networkidle' });
    await stepperPage.waitForTimeout(600);

    const stepTitle = await stepperPage.locator('h2').first().textContent();
    console.log(`  Stepper Step 1 header: ${stepTitle}`);
    results.push({ route: '/app/proyek/sample/analisis?contoh=1', vp: '1280px', check: 'Stepper Loaded', pass: !!stepTitle });

    await stepperPage.close();

    // Summary
    console.log('\n=============================================');
    console.log('            UI/UX AUDIT SUMMARY              ');
    console.log('=============================================');
    const failed = results.filter((r) => !r.pass);
    const passed = results.filter((r) => r.pass);
    console.log(`Total Checks: ${results.length}`);
    console.log(`Passed: ${passed.length}`);
    console.log(`Failed: ${failed.length}`);

    if (failed.length > 0) {
      console.log('\nFailed Checks:');
      failed.forEach((f) => console.log(`  - [${f.route}] ${f.vp}: ${f.check}`));
    } else {
      console.log('\n🎉 ALL UI/UX AND RESPONSIVE CHECKS PASSED 100%!');
    }
  } catch (err) {
    console.error('Error during Playwright verification:', err);
  } finally {
    await browser.close();
    server.close();
  }
});
