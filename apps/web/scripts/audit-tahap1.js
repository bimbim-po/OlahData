const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://olah-data.pages.dev';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'docs', 'audit', 'tahap1_screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: '360px', width: 360, height: 740 },
  { name: '390px', width: 390, height: 844 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1024px', width: 1024, height: 768 },
  { name: '1440px', width: 1440, height: 900 },
];

const ROUTES = [
  { path: '/', auth: false },
  { path: '/harga', auth: false },
  { path: '/panduan', auth: false },
  { path: '/masuk', auth: false },
  { path: '/daftar', auth: false },
  { path: '/pernyataan-penggunaan', auth: false },
  { path: '/privasi', auth: false },
  { path: '/syarat', auth: false },
  { path: '/app', auth: true },
  { path: '/app/proyek/baru', auth: true },
  { path: '/app/proyek/baru?contoh=1', auth: true },
  { path: '/app/proyek/project-1', auth: true },
  { path: '/app/proyek/sample/hasil?contoh=1', auth: true },
  { path: '/app/proyek/project-1/hasil', auth: true },
  { path: '/app/riwayat', auth: true },
  { path: '/app/pengaturan', auth: true },
  { path: '/app/bantuan', auth: true },
];

(async () => {
  console.log(`Starting Phase 1 Audit on ${BASE_URL}...`);
  const browser = await chromium.launch();
  const findings = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n=================== VIEWPORT: ${vp.name} (${vp.width}x${vp.height}) ===================`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });

    const page = await context.newPage();

    // Setup session if needed
    await page.goto(`${BASE_URL}/masuk`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('olahdata-session', JSON.stringify({
        id: 'usr-audit-1',
        name: 'Bim Darmawa',
        email: 'bimdarmawa2@gmail.com',
        university: 'Universitas Indonesia',
        department: 'Manajemen',
        plan: 'monthly'
      }));
    });

    for (const route of ROUTES) {
      const fullUrl = `${BASE_URL}${route.path}`;
      const safeName = route.path.replace(/[/\\?&=]/g, '_') || 'home';
      const screenshotFile = path.join(SCREENSHOT_DIR, `${safeName}_${vp.name}.png`);

      try {
        const response = await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(2000);

        const status = response ? response.status() : 0;
        if (status === 404) {
          findings.push({
            route: route.path,
            viewport: vp.name,
            issue: 'Status respons HTTP 404 (Halaman tidak ditemukan)',
            severity: 'Tinggi',
          });
        }

        // Check horizontal overflow
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });

        if (hasHorizontalScroll) {
          const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
          findings.push({
            route: route.path,
            viewport: vp.name,
            issue: `Scroll horizontal halaman terjadi (lebar konten ${scrollWidth}px > viewport ${vp.width}px)`,
            severity: 'Sedang',
          });
        }

        // Check raw markdown or unescaped bracket placeholders in visible text
        const pageText = await page.evaluate(() => document.body.innerText);
        if (/\[(ISI|TODO|Tambahkan|Nama|Email|Placeholder)[^\]]*\]/i.test(pageText)) {
          findings.push({
            route: route.path,
            viewport: vp.name,
            issue: 'Terdapat teks placeholder berkurung [ISI: ...] atau [TODO]',
            severity: 'Rendah',
          });
        }
        if (/```|##\s|###\s|\*\*([^*]+)\*\*/.test(pageText) && !route.path.includes('/panduan')) {
          findings.push({
            route: route.path,
            viewport: vp.name,
            issue: 'Terdapat sintaks markdown mentah terlihat di UI',
            severity: 'Sedang',
          });
        }

        // Check touch target sizes on mobile (< 44px)
        if (vp.width <= 768) {
          const smallTargets = await page.evaluate(() => {
            const clickables = Array.from(document.querySelectorAll('button, a, input, select'));
            let count = 0;
            const samples = [];
            for (const el of clickables) {
              const rect = el.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                if (rect.width < 40 || rect.height < 40) {
                  count++;
                  if (samples.length < 3) {
                    samples.push(`${el.tagName.toLowerCase()}.${el.className.split(' ')[0] || ''} (${Math.round(rect.width)}x${Math.round(rect.height)}px)`);
                  }
                }
              }
            }
            return { count, samples };
          });

          if (smallTargets.count > 5) {
            findings.push({
              route: route.path,
              viewport: vp.name,
              issue: `${smallTargets.count} elemen interaktif memiliki target sentuh < 44px (contoh: ${smallTargets.samples.join(', ')})`,
              severity: 'Rendah',
            });
          }
        }

        // Specific check on /app/proyek/[id]/hasil: regression constant label
        if (route.path.includes('/hasil')) {
          const constantHasSignificance = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('tr'));
            for (const row of rows) {
              const text = row.innerText.toLowerCase();
              if (text.includes('konstanta') && (text.includes('signifikan') || text.includes('diterima'))) {
                return true;
              }
            }
            return false;
          });
          if (constantHasSignificance) {
            findings.push({
              route: route.path,
              viewport: vp.name,
              issue: 'Konstanta regresi diberi label kesimpulan hipotesis / signifikan',
              severity: 'Tinggi',
            });
          }
        }

        // Take screenshot
        await page.screenshot({ path: screenshotFile, fullPage: false });
        console.log(`✓ Audited ${route.path} @ ${vp.name} -> Screenshot: ${path.basename(screenshotFile)}`);

      } catch (err) {
        console.error(`✗ Error auditing ${route.path} @ ${vp.name}:`, err.message);
        findings.push({
          route: route.path,
          viewport: vp.name,
          issue: `Error saat memuat halaman: ${err.message}`,
          severity: 'Tinggi',
        });
      }
    }

    await context.close();
  }

  await browser.close();

  // Save findings JSON
  const reportPath = path.join(__dirname, '..', 'docs', 'audit', 'audit_tahap1_findings.json');
  fs.writeFileSync(reportPath, JSON.stringify(findings, null, 2), 'utf8');
  console.log(`\nPhase 1 Audit Completed! Total issues found: ${findings.length}`);
  console.log(`Report saved to: ${reportPath}`);
})();
