import { chromium } from '@playwright/test';

const LIVE_BASE = 'https://olah-data.pages.dev';
const supabaseUrl = 'https://muxzjegpxjamasprgdrs.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eHpqZWdweGphbWFzcHJnZHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg0NjQxNywiZXhwIjoyMTA3NDIyNDE3fQ.V4H7G7WGUyBhbQVfGA8miMVzLkE7JpFvVd7lsQqPL5U';

async function verifyIsolation() {
  console.log('=== MULTI-USER DATA ISOLATION & RLS VERIFICATION ===');
  const now = Date.now();
  const emailA = `peneliti_a_${now}@olahdata.id`;
  const emailB = `peneliti_b_${now}@olahdata.id`;
  const password = 'PasswordSuperAman123!';

  // 1. Create User A in DB
  const resA = await fetch(supabaseUrl + '/auth/v1/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: serviceKey, Authorization: 'Bearer ' + serviceKey },
    body: JSON.stringify({ email: emailA, password, email_confirm: true, user_metadata: { nama: 'Peneliti Akun A', kampus: 'ITB', prodi: 'Manajemen' } })
  });
  const userA = await resA.json();
  console.log('1. User A Created in DB:', emailA, userA.id);

  // 2. Create User B in DB
  const resB = await fetch(supabaseUrl + '/auth/v1/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: serviceKey, Authorization: 'Bearer ' + serviceKey },
    body: JSON.stringify({ email: emailB, password, email_confirm: true, user_metadata: { nama: 'Peneliti Akun B', kampus: 'UGM', prodi: 'Akuntansi' } })
  });
  const userB = await resB.json();
  console.log('2. User B Created in DB:', emailB, userB.id);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[BROWSER CONSOLE ERROR]:', msg.text());
  });

  try {
    // 3. User A Logs In
    console.log('\n3. Logging in as User A...');
    await page.goto(LIVE_BASE + '/masuk', { waitUntil: 'load' });
    await page.waitForTimeout(1000);
    await page.fill('input#email', emailA);
    await page.fill('input#password', password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/app**', { timeout: 8000 });
    console.log('User A successfully at:', page.url());

    // 4. User A Creates a Project: "Skripsi Eksklusif User A"
    console.log('User A creating new project...');
    await page.goto(LIVE_BASE + '/app/proyek/baru', { waitUntil: 'load' });
    await page.waitForTimeout(1500);

    await page.fill('#title', 'Skripsi Eksklusif User A');
    await page.fill('#department', 'Manajemen Bisnis');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/analisis**', { timeout: 10000 });
    const userAProjectUrl = page.url();
    const userAProjectId = userAProjectUrl.split('/proyek/')[1].split('/')[0];
    console.log('User A Project Created with ID:', userAProjectId, 'URL:', userAProjectUrl);

    // Verify on User A dashboard
    await page.goto(LIVE_BASE + '/app', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const bodyUserA = await page.locator('body').innerText();
    const userAHasOwnProject = bodyUserA.includes('Skripsi Eksklusif User A');
    console.log('User A dashboard shows own project:', userAHasOwnProject);

    // 5. User A Logs Out
    console.log('\n5. User A logging out...');
    await page.evaluate(() => {
      localStorage.removeItem('olahdata-session');
      window.location.href = '/masuk';
    });
    await page.waitForTimeout(2000);
    console.log('Logged out, currently at:', page.url());

    // 6. User B Logs In on the SAME browser
    console.log('\n6. Logging in as User B on same browser...');
    await page.goto(LIVE_BASE + '/masuk', { waitUntil: 'load' });
    await page.waitForTimeout(1000);
    await page.fill('input#email', emailB);
    await page.fill('input#password', password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/app**', { timeout: 8000 });
    console.log('User B successfully logged in at:', page.url());

    // 7. CRITICAL TEST: Does User B see User A's project?
    console.log('\n7. [CRITICAL CHECK] Inspecting User B dashboard for leaks...');
    await page.waitForTimeout(2000);
    const bodyUserB = await page.locator('body').innerText();
    const leakDetected = bodyUserB.includes('Skripsi Eksklusif User A');
    console.log('Leaked User A project visible on User B dashboard?:', leakDetected);

    if (leakDetected) {
      throw new Error('SECURITY VIOLATION: User A project leaked onto User B dashboard!');
    }
    console.log('>>> PASSED: 0 LEAKS DETECTED! User B dashboard is completely isolated! <<<');

    // 8. User B Creates Own Project: "Tesis Independen User B"
    console.log('\n8. User B creating own project...');
    await page.goto(LIVE_BASE + '/app/proyek/baru', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    await page.fill('#title', 'Tesis Independen User B');
    await page.fill('#department', 'Akuntansi Keuangan');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/analisis**', { timeout: 10000 });
    const userBProjectUrl = page.url();
    const userBProjectId = userBProjectUrl.split('/proyek/')[1].split('/')[0];
    console.log('User B Project Created with ID:', userBProjectId);

    // Verify User B dashboard has only User B project
    await page.goto(LIVE_BASE + '/app', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const bodyUserB2 = await page.locator('body').innerText();
    console.log('User B dashboard has User B project:', bodyUserB2.includes('Tesis Independen User B'));
    console.log('User B dashboard STILL DOES NOT HAVE User A project:', !bodyUserB2.includes('Skripsi Eksklusif User A'));

    // 9. Unauthorized Cross-Access Attempt: User B tries to open User A's project URL directly
    console.log('\n9. [CRITICAL CHECK] User B attempting unauthorized URL access to User A project...');
    await page.goto(LIVE_BASE + `/app/proyek/${userAProjectId}/analisis`, { waitUntil: 'load' });
    await page.waitForTimeout(2000);

    const crossAccessBody = await page.locator('body').innerText();
    const leakedContentInWizard = crossAccessBody.includes('Skripsi Eksklusif User A');
    console.log('Could User B view User A project content via direct URL?:', leakedContentInWizard);

    if (leakedContentInWizard) {
      throw new Error('SECURITY VIOLATION: User B accessed User A project via direct URL!');
    }
    console.log('>>> PASSED: Unauthorized cross-project access was successfully blocked! <<<');

  } finally {
    await browser.close();
    // Clean up test users from Supabase
    await fetch(supabaseUrl + '/auth/v1/admin/users/' + userA.id, { method: 'DELETE', headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey } });
    await fetch(supabaseUrl + '/auth/v1/admin/users/' + userB.id, { method: 'DELETE', headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey } });
    await fetch(supabaseUrl + '/rest/v1/projects?owner_id=eq.' + userA.id, { method: 'DELETE', headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey } });
    await fetch(supabaseUrl + '/rest/v1/projects?owner_id=eq.' + userB.id, { method: 'DELETE', headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey } });
    console.log('\nCleaned up all test accounts from database.');
    console.log('=== VERIFICATION COMPLETED SUCCESSFULLY ===');
  }
}

verifyIsolation().catch((err) => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
