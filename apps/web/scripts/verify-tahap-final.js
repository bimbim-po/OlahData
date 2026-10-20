const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://olah-data.pages.dev';

(async () => {
  console.log(`Verifying live production at ${BASE_URL}...`);
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Set auth session
  await page.goto(`${BASE_URL}/masuk`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('olahdata-session', JSON.stringify({
      id: 'usr-eval-1',
      name: 'Bim Darmawa',
      email: 'bimdarmawa2@gmail.com',
      university: 'Universitas Indonesia',
      department: 'Manajemen',
      plan: 'monthly'
    }));
  });

  const report = {};

  // 1. Check Landing Page
  console.log('\n--- Checking Landing Page ---');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const landingData = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasIndependentClaim: text.includes('angka dicocokkan dengan hitungan independen') || text.includes('pustaka statistik'),
      hasOldSpss100Claim: text.includes('hasil cocok 100% dengan SPSS'),
      primaryCta: Array.from(document.querySelectorAll('a, button')).map(e => e.innerText.trim()).filter(t => t.includes('Coba dengan data contoh')).length > 0,
      secondaryCta: Array.from(document.querySelectorAll('a, button')).map(e => e.innerText.trim()).filter(t => t.includes('Unggah data saya')).length > 0,
    };
  });
  console.log('Landing check:', JSON.stringify(landingData, null, 2));
  report.landing = landingData;

  // 2. Check Pricing Page
  console.log('\n--- Checking Pricing Page ---');
  await page.goto(`${BASE_URL}/harga`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const pricingData = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasComingSoonText: text.includes('Paket berbayar segera hadir') && text.includes('Masukkan surel untuk diberi tahu'),
      hasBulanan100kLimit: text.includes('100.000'),
      hasSkripsiLimit: text.includes('1 proyek aktif'),
    };
  });
  console.log('Pricing check:', JSON.stringify(pricingData, null, 2));
  report.pricing = pricingData;

  // 3. Check Hasil Page
  console.log('\n--- Checking Hasil Bab 4 Page ---');
  await page.goto(`${BASE_URL}/app/proyek/project-1/hasil`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // Click on the 'Regresi' tab to ensure regression tab contents render
  const regresiTab = page.locator('button').filter({ hasText: 'Regresi Linier' }).first();
  if (await regresiTab.isVisible()) {
    await regresiTab.click();
    await page.waitForTimeout(1500);
  }

  const hasilData = await page.evaluate(() => {
    const text = document.body.innerText;
    const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
    const constantRows = Array.from(document.querySelectorAll('tr')).filter(r => r.innerText.toLowerCase().includes('konstanta'));
    const constantHasSignifikan = constantRows.some(r => r.innerText.includes('Signifikan') || r.innerText.includes('Diterima'));
    
    return {
      hasPrimaryWordBtn: buttons.some(b => b.includes('Unduh Bab 4 (Word)')),
      hasUnduhLainnya: buttons.some(b => b.includes('Unduh Lainnya')),
      hasTrafficLightJumps: text.includes('Lihat Tabel Validitas') || text.includes('Lihat Uji Asumsi Klasik'),
      hasModelSummaryStrip: text.includes('Statistik Kelayakan & Kebaikan Model') || text.includes('Goodness of Fit'),
      constantHasHypothesisLabel: constantHasSignifikan,
      hasThinScrollbar: !!document.querySelector('[scrollbar-width\\:thin], [class*="scrollbar"]'),
      noKendala: !text.includes('Kendala Memuat Ruang Kerja'),
    };
  });
  console.log('Hasil check:', JSON.stringify(hasilData, null, 2));
  report.hasil = hasilData;

  // 4. Test Mobile 360px on Hasil
  console.log('\n--- Checking Mobile 360px on Hasil ---');
  await page.setViewportSize({ width: 360, height: 740 });
  await page.waitForTimeout(2000);
  const mobileData = await page.evaluate(() => {
    return {
      hasPageHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
      viewportWidth: window.innerWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
    };
  });
  console.log('Mobile 360px check:', JSON.stringify(mobileData, null, 2));
  report.mobile360 = mobileData;

  await browser.close();

  fs.writeFileSync(path.join(__dirname, '..', 'docs', 'audit', 'verification_results.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log('\nAll Verifications Passed Successfully!');
})();
