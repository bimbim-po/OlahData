import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to live sample with ?contoh=1...');
  await page.goto('https://olah-data.pages.dev/app/proyek/sample/hasil?contoh=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // If redirected to masuk, click 'Coba Data Contoh ->'
  const demoBtn = page.locator('button:has-text("Coba Data Contoh"), a:has-text("Coba Data Contoh")').first();
  if (await demoBtn.isVisible()) {
    console.log('Clicking Coba Data Contoh...');
    await demoBtn.click();
    await page.waitForTimeout(3000);
  }

  // Click on validity tab
  const validityTab = page.locator('button:has-text("Validitas")').first();
  if (await validityTab.isVisible()) {
    await validityTab.click();
    await page.waitForTimeout(1000);
  }

  // Scroll to Tabel 4.4
  const validityTable = page.locator('text=Tabel 4.4').first();
  if (await validityTable.isVisible()) {
    await validityTable.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
  }

  const outPath1 = 'C:/Users/ThinkPad X1 Yoga/.gemini/antigravity/brain/3238dc4e-fb77-4692-9957-e530fba398b7/live_validity_realtime_toggle.png';
  await page.screenshot({ path: outPath1, fullPage: false });
  console.log('Saved validity screenshot:', outPath1);

  // Click on assumptions tab
  const assumptionsTab = page.locator('button:has-text("Asumsi Klasik")').first();
  if (await assumptionsTab.isVisible()) {
    await assumptionsTab.click();
    await page.waitForTimeout(1000);
  }

  // Scroll to Asisten Penyembuh Asumsi
  const remediesHeader = page.locator('text=1. Deteksi dan Eliminasi Outlier Residual').first();
  if (await remediesHeader.isVisible()) {
    await remediesHeader.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
  }

  const outPath2 = 'C:/Users/ThinkPad X1 Yoga/.gemini/antigravity/brain/3238dc4e-fb77-4692-9957-e530fba398b7/live_assumptions_outlier_toggle.png';
  await page.screenshot({ path: outPath2, fullPage: false });
  console.log('Saved assumptions screenshot:', outPath2);

  await browser.close();
})();
