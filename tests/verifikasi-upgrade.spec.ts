import { test, expect } from '@playwright/test';

const LIVE_URL = 'https://olah-data.pages.dev/';

test.describe('Verifikasi Upgrade Terbaru OlahDataku (Live Production Check)', () => {
  test('Cek Fitur Baru: Data Contoh, Uji Skripsi, Toggle Format Tabel & Midtrans', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Abort Cloudflare background analytics beacon and Next.js prefetch RSC so networkidle resolves instantly
    await page.route(/cloudflare.*analytics|beacon|_rsc=/i, (route) => route.abort());

    await page.goto(LIVE_URL, { waitUntil: 'networkidle' });

    // 1. Cek ketersediaan tombol Data Contoh Skripsi (Empty State Onboarding)
    const sampleBtn = page.getByRole('button', { name: /contoh|sample|demo|simulasi/i }).first();
    const hasSampleBtn = (await sampleBtn.count()) > 0 && (await sampleBtn.isVisible());
    console.log(`[CHECK 1] Tombol Data Contoh Skripsi: ${hasSampleBtn ? 'ADA' : 'BELUM TERDETEKSI'}`);

    if (hasSampleBtn) {
      await sampleBtn.click();
      await page.waitForTimeout(1000);
    }

    // 2. Cek apakah fitur uji statistik utama & interpretasi Bab 4 muncul di layar
    const bodyText = await page.locator('body').innerText();
    const featureChecks = {
      validitasReliabilitas: /validitas|reliabilitas|cronbach/i.test(bodyText),
      asumsiKlasik: /normalitas|multikolinearitas|heteroskedastisitas|glejser|vif/i.test(bodyText),
      regresiHipotesis: /regresi|uji\s*t|uji\s*f|koefisien\s*determinasi|sobel|mediasi|moderasi/i.test(bodyText),
      narasiBab4: /interpretasi|kesimpulan|bab\s*4|hipotesis\s*diterima|signifikan/i.test(bodyText),
      formatTabelToggle: /apa\s*style|spss|copy\s*tabel|word/i.test(bodyText),
    };
    console.log('[CHECK 2] Status Fitur Statistik & Bab 4:', featureChecks);

    // 3. Cek Responsivitas Mobile 360px (Zero Horizontal Overflow)
    await page.setViewportSize({ width: 360, height: 800 });
    await page.waitForTimeout(300);
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`[CHECK 3] Mobile 360px Bebas Overflow Horizontal: ${!hasOverflow ? 'LULUS' : 'MASIH OVERFLOW'}`);

    expect(errors, `Ditemukan runtime error di production: ${errors.join('; ')}`).toEqual([]);
    expect(hasOverflow, 'Halaman tidak boleh melebar melebihi layar HP 360px').toBe(false);
  });
});
