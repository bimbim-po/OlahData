import { chromium } from '@playwright/test';

const url = 'https://muxzjegpxjamasprgdrs.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eHpqZWdweGphbWFzcHJnZHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg0NjQxNywiZXhwIjoyMTA3NDIyNDE3fQ.V4H7G7WGUyBhbQVfGA8miMVzLkE7JpFvVd7lsQqPL5U';

async function run() {
  const testEmail = 'reg_check_' + Date.now() + '@olahdata.id';
  const testPass = 'Rahasia123!';

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  page.on('response', resp => {
    if (resp.url().includes('supabase') || resp.url().includes('/api/') || resp.url().includes('/daftar') || resp.url().includes('/masuk') || resp.url().includes('/app')) {
      console.log('RESPONSE:', resp.status(), resp.url());
    }
  });

  console.log('1. Navigating to https://olah-data.pages.dev/daftar...');
  await page.goto('https://olah-data.pages.dev/daftar', { waitUntil: 'load' });
  await page.waitForTimeout(2000);

  console.log('2. Filling registration form...');
  await page.fill('input#name', 'Budi Mahasiswa');
  await page.fill('input#email', testEmail);
  await page.fill('input#password', testPass);
  await page.fill('input#university', 'Universitas Gadjah Mada');
  // Click checkbox agreeTerms
  await page.click('#agreeTerms, label[for="agreeTerms"]');

  console.log('3. Submitting registration...');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(4000);
  console.log('URL after register submit:', page.url());

  const toastText = await page.locator('[role="status"], [role="alert"], .toast, [data-sonner-toast]').allInnerTexts().catch(() => []);
  console.log('Toasts after register:', toastText);

  // Now logout or clear storage and try to login with this registered account!
  console.log('4. Navigating to /masuk to test login...');
  await page.goto('https://olah-data.pages.dev/masuk', { waitUntil: 'load' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(1000);

  console.log('5. Filling login form with newly registered user...');
  await page.fill('input#email', testEmail);
  await page.fill('input#password', testPass);
  await page.click('button[type="submit"]');

  await page.waitForTimeout(4000);
  console.log('URL after login:', page.url());
  const toastTextLogin = await page.locator('[role="status"], [role="alert"], .toast, [data-sonner-toast]').allInnerTexts().catch(() => []);
  console.log('Toasts after login:', toastTextLogin);

  // Clean up
  await browser.close();
  // Find and delete the created user
  const listRes = await fetch(url + '/auth/v1/admin/users', {
    headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey }
  });
  const listData = await listRes.json();
  const u = listData.users?.find(x => x.email === testEmail);
  if (u) {
    await fetch(url + '/auth/v1/admin/users/' + u.id, {
      method: 'DELETE',
      headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey }
    });
    await fetch(url + '/rest/v1/profiles?id=eq.' + u.id, {
      method: 'DELETE',
      headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey }
    });
    console.log('Cleaned up registered test user:', u.id);
  }
}

run().catch(console.error);
