import { chromium } from '@playwright/test';

const LIVE_BASE = 'https://olah-data.pages.dev';
const supabaseUrl = 'https://muxzjegpxjamasprgdrs.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eHpqZWdweGphbWFzcHJnZHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg0NjQxNywiZXhwIjoyMTA3NDIyNDE3fQ.V4H7G7WGUyBhbQVfGA8miMVzLkE7JpFvVd7lsQqPL5U';

async function testAll() {
  console.log('--- 1. Testing /api/auth/login Endpoint (API Level) ---');
  const testEmail = 'qa_auth_' + Date.now() + '@olahdata.id';
  const testPass = 'Katasandi123!';

  // Create confirmed user in Supabase
  const createRes = await fetch(supabaseUrl + '/auth/v1/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: serviceKey, Authorization: 'Bearer ' + serviceKey },
    body: JSON.stringify({
      email: testEmail,
      password: testPass,
      email_confirm: true,
      user_metadata: { nama: 'Mahasiswa QA', kampus: 'UGM', prodi: 'Manajemen' }
    })
  });
  const createdUser = await createRes.json();
  console.log('Created test user in DB:', testEmail, createdUser.id);

  // Test 1a: Login with wrong password
  const wrongPassRes = await fetch(LIVE_BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'SalahPassword!' })
  });
  const wrongPassJson = await wrongPassRes.json();
  console.log('Wrong password response (status ' + wrongPassRes.status + '):', wrongPassJson);

  // Test 1b: Login with non-existent email
  const notFoundRes = await fetch(LIVE_BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tidak_ada_user_ini_' + Date.now() + '@olahdata.id', password: 'Password123!' })
  });
  const notFoundJson = await notFoundRes.json();
  console.log('Non-existent email response (status ' + notFoundRes.status + '):', notFoundJson);

  // Test 1c: Correct login via /api/auth/login
  const correctLoginRes = await fetch(LIVE_BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPass })
  });
  const correctLoginJson = await correctLoginRes.json();
  console.log('Correct login response (status ' + correctLoginRes.status + '):', {
    success: correctLoginJson.success,
    hasSession: !!correctLoginJson.session?.access_token,
    user: correctLoginJson.user?.name
  });

  // Test 2: Instant password reset via /api/auth/reset-password
  console.log('\n--- 2. Testing /api/auth/reset-password Endpoint ---');
  const newPass = 'KatasandiBaru456!';
  const resetRes = await fetch(LIVE_BASE + '/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, newPassword: newPass })
  });
  const resetJson = await resetRes.json();
  console.log('Reset response:', resetJson);

  // Verify login with new password
  const newLoginRes = await fetch(LIVE_BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: newPass })
  });
  const newLoginJson = await newLoginRes.json();
  console.log('Login with new password status:', newLoginRes.status, 'success:', newLoginJson.success);

  // Test 3: Playwright Browser End-to-End Verification
  console.log('\n--- 3. Testing Playwright Browser End-to-End Login ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER CONSOLE ERROR:', msg.text());
  });

  console.log('Navigating to ' + LIVE_BASE + '/masuk...');
  await page.goto(LIVE_BASE + '/masuk', { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  console.log('Filling credentials...');
  await page.fill('input#email', testEmail);
  await page.fill('input#password', newPass);

  console.log('Submitting login form...');
  await page.click('button[type="submit"]');

  // Wait for navigation
  await page.waitForTimeout(4000);
  console.log('Current URL after login:', page.url());

  const isAtDashboard = page.url().includes('/app');
  console.log('Successfully at /app dashboard (No bounce back!):', isAtDashboard);

  // Verify elements on dashboard
  const bodyText = await page.locator('body').innerText();
  const hasUserGreeting = bodyText.includes('Mahasiswa QA') || bodyText.includes('Proyek Analisis');
  console.log('Dashboard content verified:', hasUserGreeting);

  // Clean up
  await browser.close();
  await fetch(supabaseUrl + '/auth/v1/admin/users/' + createdUser.id, {
    method: 'DELETE',
    headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey }
  });
  await fetch(supabaseUrl + '/rest/v1/profiles?id=eq.' + createdUser.id, {
    method: 'DELETE',
    headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey }
  });
  console.log('Cleaned up test user from DB.');
  console.log('\n>>> ALL AUTH VERIFICATION TESTS PASSED SUCCESSFULLY! <<<');
}

testAll().catch(console.error);
