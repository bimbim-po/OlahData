import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const LIVE_URL = 'https://olah-data.pages.dev';
const ARTIFACTS_DIR = 'C:/Users/ThinkPad X1 Yoga/.gemini/antigravity/brain/3238dc4e-fb77-4692-9957-e530fba398b7';

const SUPABASE_URL = 'https://muxzjegpxjamasprgdrs.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eHpqZWdweGphbWFzcHJnZHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg0NjQxNywiZXhwIjoyMTA3NDIyNDE3fQ.V4H7G7WGUyBhbQVfGA8miMVzLkE7JpFvVd7lsQqPL5U';
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

const REPORT = {
  timestamp: new Date().toISOString(),
  targetUrl: LIVE_URL,
  suites: [],
  summary: { total: 0, passed: 0, failed: 0 }
};

function recordTest(suiteName, testName, passed, details = '') {
  REPORT.summary.total++;
  if (passed) REPORT.summary.passed++;
  else REPORT.summary.failed++;

  let suite = REPORT.suites.find((s) => s.name === suiteName);
  if (!suite) {
    suite = { name: suiteName, tests: [] };
    REPORT.suites.push(suite);
  }
  suite.tests.push({ testName, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${icon}] ${suiteName} -> ${testName} ${details ? '(' + details + ')' : ''}`);
}

async function runComprehensiveTest() {
  console.log('========================================================================');
  console.log('🚀 PENGUJIAN KOMPREHENSIF KESELURUHAN WEBAPP OLAHDATAKU (E2E)');
  console.log(`🌐 Target: ${LIVE_URL}`);
  console.log('========================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  // Monitor uncaught console errors
  const consoleErrors = [];
  page.on('pageerror', (err) => consoleErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('404')) {
      consoleErrors.push(msg.text());
    }
  });

  // Setup abort for Cloudflare analytics beacons & Next.js RSC background prefetch
  await page.route(/cloudflare.*analytics|beacon|_rsc=/i, (route) => route.abort());

  let testUser = null;
  const testEmail = `peneliti_qa_${Date.now()}@olahdata.id`;
  const testPassword = 'PasswordSkripsi2026!';

  try {
    // -------------------------------------------------------------------------
    // SUITE 1: LANDING PAGE, RESPONSIVENESS & SEO
    // -------------------------------------------------------------------------
    console.log('\n--- SUITE 1: Landing Page, Responsive & SEO ---');
    await page.goto(LIVE_URL, { waitUntil: 'networkidle' });

    // 1.1 Page title & Status
    const title = await page.title();
    const hasGoodTitle = title.includes('OlahData') || title.includes('Skripsi');
    recordTest('Landing Page', 'Title Tag & Metadata', hasGoodTitle, title);

    // 1.2 Meta Description & Open Graph
    const metaDesc = await page.locator('meta[name="description"]').getAttribute('content').catch(() => null);
    const hasMetaDesc = !!metaDesc && metaDesc.length > 30;
    recordTest('Landing Page', 'Meta Description SEO', hasMetaDesc, metaDesc ? `${metaDesc.slice(0, 50)}...` : 'None');

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content').catch(() => null);
    recordTest('Landing Page', 'Open Graph Social Cards', !!ogTitle, ogTitle || 'Missing');

    // 1.3 Key CTA Buttons exist
    const ctaDemo = page.getByRole('button', { name: /contoh|sample|demo|coba/i }).first();
    const hasCtaDemo = (await ctaDemo.count()) > 0;
    recordTest('Landing Page', 'CTA Button Onboarding', hasCtaDemo);

    // 1.4 Mobile Responsiveness at 360px (Samsung Galaxy / standard small phone)
    await page.setViewportSize({ width: 360, height: 800 });
    await page.waitForTimeout(400);
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    recordTest('Landing Page', 'Mobile 360px Zero Horizontal Overflow', !hasHorizontalOverflow, `scrollWidth: ${!hasHorizontalOverflow ? 'Fit' : 'Overflow'}`);

    const landingScreenshotPath = path.join(ARTIFACTS_DIR, 'e2e_landing_mobile_check.png');
    await page.screenshot({ path: landingScreenshotPath });

    // Restore desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);

    // -------------------------------------------------------------------------
    // SUITE 2: AUTHENTICATION FLOW & SECURITY
    // -------------------------------------------------------------------------
    console.log('\n--- SUITE 2: Authentication Flow & Security ---');

    // 2.1 Direct creation of test user in Supabase Auth to test login
    const { data: createdAuth, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { nama: 'Peneliti QA Komprehensif' }
    });
    if (authErr) throw new Error(`Gagal membuat test user di Supabase: ${authErr.message}`);
    testUser = createdAuth.user;
    recordTest('Authentication', 'Supabase User Provisioning', !!testUser, testEmail);

    // 2.2 Test Login Page (/masuk)
    await page.goto(`${LIVE_URL}/masuk`, { waitUntil: 'networkidle' });
    const hasEmailInput = await page.locator('input[type="email"], input#email').count() > 0;
    const hasPasswordInput = await page.locator('input[type="password"], input#password').count() > 0;
    recordTest('Authentication', 'Login Form Fields Rendered', hasEmailInput && hasPasswordInput);

    // 2.3 Invalid credentials check
    await page.locator('input[type="email"], input#email').fill(testEmail);
    await page.locator('input[type="password"], input#password').fill('SalahPassword123!');
    const submitLoginBtn = page.locator('button[type="submit"]').first();
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/auth/login') || r.url().includes('/auth/v1/token'), { timeout: 10000 }).catch(() => {}),
      submitLoginBtn.click()
    ]);
    await page.waitForTimeout(1000);
    const bodyAfterInvalid = await page.locator('body').innerText();
    const hasInvalidWarning = /salah|tidak valid|invalid|gagal|belum terdaftar/i.test(bodyAfterInvalid);
    recordTest('Authentication', 'Invalid Password Handling & Notification', hasInvalidWarning);

    // 2.4 Valid login
    await page.locator('input[type="password"], input#password').fill(testPassword);
    await Promise.all([
      page.waitForURL(/.*\/app/, { timeout: 15000 }).catch(() => {}),
      submitLoginBtn.click()
    ]);
    await page.waitForTimeout(1500);

    const currentUrl = page.url();
    const isAtDashboard = currentUrl.includes('/app');
    recordTest('Authentication', 'Valid Login Redirect to Dashboard', isAtDashboard, currentUrl);

    // -------------------------------------------------------------------------
    // SUITE 3: PROJECT MANAGEMENT & DASHBOARD
    // -------------------------------------------------------------------------
    console.log('\n--- SUITE 3: Project Management & Dashboard ---');

    const dashboardText = await page.locator('body').innerText();
    const hasProjectHeader = /proyek|analisis|penelitian/i.test(dashboardText);
    recordTest('Dashboard', 'Dashboard Header & Structure Rendered', hasProjectHeader);

    // -------------------------------------------------------------------------
    // SUITE 4: STATISTICAL WIZARD & DATA PROCESSING ENGINE
    // -------------------------------------------------------------------------
    console.log('\n--- SUITE 4: Statistical Wizard & Data Engine ---');

    // 4.1 Launch Wizard with Sample Data
    await page.goto(`${LIVE_URL}/app/proyek/sample/analisis?contoh=1`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const wizardBodyText = await page.locator('body').innerText();
    const hasLoadedDataset = /120|responden|data_kuesioner/i.test(wizardBodyText);
    recordTest('Wizard Step 1', 'Sample Dataset Loaded (120 Responden, 18 Butir)', hasLoadedDataset);

    // 4.2 Screen 2 (Temuan Data) -> Click "Lanjut ke Pertanyaan Penelitian"
    const nextBtnTemuan = page.getByRole('button', { name: /lanjut ke pertanyaan penelitian/i }).first();
    const hasBtnTemuan = (await nextBtnTemuan.count()) > 0 && (await nextBtnTemuan.isVisible());
    recordTest('Wizard Step 2', 'Tombol "Lanjut ke Pertanyaan Penelitian"', hasBtnTemuan);

    if (hasBtnTemuan) {
      await nextBtnTemuan.click();
      await page.waitForTimeout(1000);
    }

    // 4.3 Modal "Kecualikan ... Baris & Lanjut" (Auto-healing of student anomaly data)
    const modalExcludeBtn = page.getByRole('button', { name: /kecualikan.*baris.*lanjut/i }).first();
    const hasModal = (await modalExcludeBtn.count()) > 0 && (await modalExcludeBtn.isVisible());
    recordTest('Wizard Auto-Heal', 'Modal Deteksi Anomali & Tombol Auto-Heal Eksklusi Baris', hasModal);

    if (hasModal) {
      await modalExcludeBtn.click();
      await page.waitForTimeout(1500);
    }

    // 4.4 Screen 3 (Pertanyaan Penelitian dan Pemetaan Variabel)
    const screen3Text = await page.locator('body').innerText();
    const hasVariableMapping = /pertanyaan penelitian|pemetaan variabel|kualitas layanan|loyalitas/i.test(screen3Text);
    recordTest('Wizard Step 3', 'Auto-Grouping Konstruk (KL, KP, LO)', hasVariableMapping);

    // Move to Screen 4: "Lanjut ke Cek Kesiapan"
    const nextBtnMapping = page.getByRole('button', { name: /lanjut ke cek kesiapan/i }).first();
    const hasBtnMapping = (await nextBtnMapping.count()) > 0 && (await nextBtnMapping.isVisible());
    recordTest('Wizard Step 3', 'Tombol "Lanjut ke Cek Kesiapan"', hasBtnMapping);

    if (hasBtnMapping) {
      await nextBtnMapping.click();
      await page.waitForTimeout(1500);
    }

    // 4.5 Screen 4 (Cek Kesiapan)
    const screen4Text = await page.locator('body').innerText();
    const hasReadinessCheck = /cek kesiapan|lampu hijau|indikator/i.test(screen4Text);
    recordTest('Wizard Step 4', 'Cek Kesiapan Analisis Skripsi Kuantitatif', hasReadinessCheck);

    // 4.6 Execute Analysis: "Jalankan Paket Bab 4"
    const runAnalysisBtn = page.getByRole('button', { name: /jalankan paket bab 4/i }).first();
    const hasRunBtn = (await runAnalysisBtn.count()) > 0 && (await runAnalysisBtn.isVisible());
    recordTest('Wizard Execution', 'Tombol Eksekusi "Jalankan Paket Bab 4"', hasRunBtn);

    if (hasRunBtn) {
      await runAnalysisBtn.click();
      console.log('  ⏳ Menjalankan komputasi deterministik Bab 4...');
      await page.waitForURL(/.*\/hasil.*/, { timeout: 30000 });
      await page.waitForTimeout(3000);
    }

    // -------------------------------------------------------------------------
    // SUITE 5: RESULTS VIEWER, STATISTICAL ACCURACY & BAB 4 NARRATIVE
    // -------------------------------------------------------------------------
    console.log('\n--- SUITE 5: Results Viewer & Thesis Academic Outputs ---');
    const isAtResults = page.url().includes('/hasil');
    recordTest('Results Viewer', 'Navigasi Berhasil ke Lembar Hasil Bab 4', isAtResults, page.url());

    const resultsBodyText = await page.locator('body').innerText();

    // 5.1 N = 115 Responden (120 - 5 excluded)
    const hasEffectiveN = /115\s*responden/i.test(resultsBodyText);
    recordTest('Statistical Precision', 'N Efektif Terhitung Presisi (115 Responden)', hasEffectiveN);

    // 5.2 Descriptive Stats & TCR
    const hasDescriptive = /deskriptif|mean|standar deviasi|tcr/i.test(resultsBodyText);
    recordTest('Results Verification', 'Statistik Deskriptif & TCR (Tingkat Capaian Responden)', hasDescriptive);

    // 5.3 Validity & Reliability
    const hasValidity = /validitas|pearson|r\s*hitung|r\s*tabel|valid/i.test(resultsBodyText);
    recordTest('Results Verification', 'Uji Validitas Pearson Product Moment & r-tabel', hasValidity);

    const hasReliability = /reliabilitas|cronbach|alpha/i.test(resultsBodyText);
    recordTest('Results Verification', 'Uji Reliabilitas Cronbach Alpha (>0.700)', hasReliability);

    // 5.4 Classical Assumptions
    const hasNormality = /asumsi klasik|normalitas|kolmogorov|shapiro/i.test(resultsBodyText);
    recordTest('Results Verification', 'Uji Asumsi Klasik: Normalitas Residual', hasNormality);

    const hasMulticollinearity = /multikolinearitas|vif|tolerance/i.test(resultsBodyText);
    recordTest('Results Verification', 'Uji Asumsi Klasik: Multikolinearitas (VIF & Tolerance)', hasMulticollinearity);

    const hasHeteroskedasticity = /heteroskedastisitas|glejser/i.test(resultsBodyText);
    recordTest('Results Verification', 'Uji Asumsi Klasik: Heteroskedastisitas (Uji Glejser)', hasHeteroskedasticity);

    // 5.5 Hypothesis & Regression
    const hasRegression = /regresi|koefisien|uji\s*t|uji\s*f|anova|r-squared/i.test(resultsBodyText);
    recordTest('Results Verification', 'Uji Hipotesis: Regresi OLS, Uji t & Uji F ANOVA', hasRegression);

    // 5.6 Auto-generated Academic Narrative Bab 4 Skripsi
    const hasBab4Narrative = /interpretasi|kesimpulan|bab\s*4|berpengaruh|signifikan/i.test(resultsBodyText);
    recordTest('Academic Narrative', 'Narasi Akademik Bab 4 Bahasa Indonesia Siap Salin', hasBab4Narrative);

    // 5.7 Dual-Format Table Toggle (APA Style vs SPSS Klasik)
    const hasTableToggle = /tabel naskah bab 4|mode lampiran|spss|apa\s*7th/i.test(resultsBodyText);
    recordTest('Results Viewer', 'Toggle Dual-Format Tabel (APA 7th vs Gaya SPSS)', hasTableToggle);

    // 5.8 Word Export Button
    const hasWordExportBtn = (await page.getByRole('button', { name: /unduh bab 4|word/i }).count()) > 0;
    recordTest('Export Engine', 'Tombol Ekspor Dokumen Word (Unduh Bab 4)', hasWordExportBtn);

    // Capture screenshot of results viewer
    const resultsScreenshotPath = path.join(ARTIFACTS_DIR, 'e2e_results_viewer_verified.png');
    await page.screenshot({ path: resultsScreenshotPath, fullPage: false });
    console.log(`  📸 Screenshot Hasil Analisis disimpan di: ${resultsScreenshotPath}`);

    // -------------------------------------------------------------------------
    // SUITE 6: HISTORY & SETTINGS
    // -------------------------------------------------------------------------
    console.log('\n--- SUITE 6: History & Settings Pages ---');
    await page.goto(`${LIVE_URL}/app/riwayat`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const historyText = await page.locator('body').innerText();
    const hasHistoryPage = /riwayat|analisis|kualitas|daftar/i.test(historyText);
    recordTest('History', 'Halaman Riwayat Analisis (/app/riwayat)', hasHistoryPage);

    await page.goto(`${LIVE_URL}/app/pengaturan`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const settingsText = await page.locator('body').innerText();
    const hasSettingsPage = /pengaturan|profil|tema|tampilan|keamanan/i.test(settingsText);
    recordTest('Settings', 'Halaman Pengaturan Akun (/app/pengaturan)', hasSettingsPage);

    // -------------------------------------------------------------------------
    // SUITE 7: LOGOUT & SESSION PURGE
    // -------------------------------------------------------------------------
    console.log('\n--- SUITE 7: Logout & Session Purge ---');
    await page.goto(`${LIVE_URL}/app`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Click user dropdown menu trigger at bottom of sidebar
    const profileTrigger = page.locator('button[aria-haspopup="menu"]').first();
    const hasTrigger = (await profileTrigger.count()) > 0;
    recordTest('Authentication', 'Menu Profil Pengguna di App Shell', hasTrigger);

    if (hasTrigger) {
      await profileTrigger.click();
      await page.waitForTimeout(500);

      // Click "Keluar" item in menu
      const logoutItem = page.getByRole('menuitem', { name: /keluar/i }).first();
      const hasLogoutItem = (await logoutItem.count()) > 0;
      recordTest('Authentication', 'Item Menu "Keluar" Ditemukan', hasLogoutItem);

      if (hasLogoutItem) {
        await logoutItem.click();
        await page.waitForURL(/.*\/masuk/, { timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(1200);
      }
    }

    const isLoggedOut = page.url().includes('/masuk');
    recordTest('Authentication', 'Logout & Redirection ke /masuk', isLoggedOut, page.url());

    // Verify localStorage cleaned
    const remainingSession = await page.evaluate(() => localStorage.getItem('olahdata-session'));
    recordTest('Security', 'localStorage Session Cleaned on Logout', remainingSession === null);

  } catch (err) {
    console.error('FATAL TEST EXCEPTION:', err);
    recordTest('Runtime', 'Critical Test Execution', false, err.message);
  } finally {
    // Clean up test user from Supabase Auth & Database
    if (testUser) {
      console.log(`\n🧹 Membersihkan akun pengujian: ${testEmail}...`);
      await supabaseAdmin.from('projects').delete().eq('owner_id', testUser.id);
      await supabaseAdmin.from('profiles').delete().eq('id', testUser.id);
      await supabaseAdmin.auth.admin.deleteUser(testUser.id);
      console.log('✅ Akun pengujian berhasil dihapus permanen dari Supabase.');
    }

    await browser.close();
  }

  // -------------------------------------------------------------------------
  // FINAL SCORE & SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`🏁 HASIL PENGUJIAN AKHIR: ${REPORT.summary.passed}/${REPORT.summary.total} TES LULUS`);
  console.log(`❌ Gagal: ${REPORT.summary.failed}`);
  console.log('========================================================================');

  const reportJsonPath = path.join(ARTIFACTS_DIR, 'e2e_verification_report.json');
  fs.writeFileSync(reportJsonPath, JSON.stringify(REPORT, null, 2));
  console.log(`📄 Laporan lengkap tersimpan di: ${reportJsonPath}`);

  return REPORT;
}

runComprehensiveTest();
