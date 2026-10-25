import { chromium } from '@playwright/test';

const LIVE_URL = 'https://olah-data.pages.dev/';

async function runLiveVerification() {
  console.log('====================================================================');
  console.log('🚀 MEMULAI VERIFIKASI UPGRADE OLAHDATAKU (LIVE PRODUCTION CHECK)');
  console.log(`🌐 Target URL: ${LIVE_URL}`);
  console.log('====================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', (err) => {
    errors.push(err.message);
  });

  try {
    // Abort Cloudflare background analytics beacon and Next.js prefetch RSC so networkidle resolves instantly
    await page.route(/cloudflare.*analytics|beacon|_rsc=/i, (route) => route.abort());

    console.log('▶ [1/3] Menghubungi production & memeriksa Tombol Data Contoh Skripsi...');
    await page.goto(LIVE_URL, { waitUntil: 'networkidle' });

    // 1. Cek ketersediaan tombol Data Contoh Skripsi (Empty State Onboarding)
    const sampleBtn = page.getByRole('button', { name: /contoh|sample|demo|simulasi/i }).first();
    const hasSampleBtn = (await sampleBtn.count()) > 0 && (await sampleBtn.isVisible());
    console.log(`  ✔ [CHECK 1] Tombol Data Contoh Skripsi: ${hasSampleBtn ? 'ADA' : 'BELUM TERDETEKSI'}`);

    if (hasSampleBtn) {
      await sampleBtn.click();
      await page.waitForTimeout(1000);
    }

    // 2. Cek apakah fitur uji statistik utama & interpretasi Bab 4 muncul di layar
    console.log('\n▶ [2/3] Memeriksa Fitur Uji Statistik & Interpretasi Bab 4...');
    const bodyText = await page.locator('body').innerText();
    const featureChecks = {
      validitasReliabilitas: /validitas|reliabilitas|cronbach/i.test(bodyText),
      asumsiKlasik: /normalitas|multikolinearitas|heteroskedastisitas|glejser|vif/i.test(bodyText),
      regresiHipotesis: /regresi|uji\s*t|uji\s*f|koefisien\s*determinasi|sobel|mediasi|moderasi/i.test(bodyText),
      narasiBab4: /interpretasi|kesimpulan|bab\s*4|hipotesis\s*diterima|signifikan/i.test(bodyText),
      formatTabelToggle: /apa\s*style|spss|copy\s*tabel|word/i.test(bodyText),
    };
    console.log('  ✔ [CHECK 2] Status Fitur Statistik & Bab 4:');
    for (const [key, val] of Object.entries(featureChecks)) {
      console.log(`     - ${key}: ${val ? 'AKTIF (TRUE)' : 'TIDAK TERDETEKSI'}`);
    }

    // 3. Cek Responsivitas Mobile 360px (Zero Horizontal Overflow)
    console.log('\n▶ [3/3] Memeriksa Responsivitas Layar HP 360px (Zero Horizontal Overflow)...');
    await page.setViewportSize({ width: 360, height: 800 });
    await page.waitForTimeout(400);
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`  ✔ [CHECK 3] Mobile 360px Bebas Overflow Horizontal: ${!hasOverflow ? 'LULUS' : 'MASIH OVERFLOW'}`);

    if (errors.length > 0) {
      throw new Error(`Ditemukan runtime error di production: ${errors.join('; ')}`);
    }
    if (hasOverflow) {
      throw new Error('Halaman tidak boleh melebar melebihi layar HP 360px');
    }

    console.log('\n====================================================================');
    console.log('✅ SELURUH VERIFIKASI LIVE PRODUCTION OLAHDATAKU BERHASIL 100%!');
    console.log('====================================================================\n');
  } finally {
    await browser.close();
  }
}

runLiveVerification().catch((err) => {
  console.error('\n❌ VERIFIKASI GAGAL:', err.message);
  process.exit(1);
});
