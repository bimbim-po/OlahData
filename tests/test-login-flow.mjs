import { chromium } from '@playwright/test';

const url = 'https://muxzjegpxjamasprgdrs.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eHpqZWdweGphbWFzcHJnZHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg0NjQxNywiZXhwIjoyMTA3NDIyNDE3fQ.V4H7G7WGUyBhbQVfGA8miMVzLkE7JpFvVd7lsQqPL5U';

async function run() {
  const testEmail = 'playwright_test_' + Date.now() + '@olahdata.id';
  const testPass = 'Rahasia123!';

  // 1. Create confirmed user
  const createRes = await fetch(url + '/auth/v1/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: serviceKey, Authorization: 'Bearer ' + serviceKey },
    body: JSON.stringify({
      email: testEmail,
      password: testPass,
      email_confirm: true,
      user_metadata: { nama: 'Pengguna Uji', kampus: 'UI', prodi: 'Manajemen' }
    })
  });
  const created = await createRes.json();
  console.log('Created test user:', testEmail, 'id:', created.id);

  // 2. Launch browser
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  page.on('response', resp => {
    if (resp.url().includes('supabase') || resp.url().includes('/api/') || resp.url().includes('/masuk') || resp.url().includes('/app')) {
      console.log('RESPONSE:', resp.status(), resp.url());
    }
  });

  console.log('Navigating to https://olah-data.pages.dev/masuk...');
  await page.goto('https://olah-data.pages.dev/masuk', { waitUntil: 'load' });
  await page.waitForTimeout(2000);

  console.log('Filling form...');
  await page.fill('input#email', testEmail);
  await page.fill('input#password', testPass);
  
  console.log('Submitting form...');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(4000);
  console.log('Current URL after submit:', page.url());
  
  const toastText = await page.locator('[role="status"], [role="alert"], .toast, [data-sonner-toast]').allInnerTexts().catch(() => []);
  console.log('Toasts/alerts visible:', toastText);

  const bodySnippet = (await page.locator('body').innerText()).slice(0, 300);
  console.log('Body snippet:', bodySnippet);

  // Clean up
  await browser.close();
  await fetch(url + '/auth/v1/admin/users/' + created.id, {
    method: 'DELETE',
    headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey }
  });
  await fetch(url + '/rest/v1/profiles?id=eq.' + created.id, {
    method: 'DELETE',
    headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey }
  });
  console.log('Test completed and cleaned up.');
}

run().catch(console.error);
