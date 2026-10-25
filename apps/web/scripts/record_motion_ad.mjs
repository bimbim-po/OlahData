import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const videosDir = path.resolve('public/videos');
fs.mkdirSync(videosDir, { recursive: true });

console.log('--- Memulai Perekaman Video Motion Graphics dengan Playwright ---');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: videosDir,
      size: { width: 1280, height: 720 }
    },
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();
  const fileUrl = 'file:///' + path.resolve('public/motion-ad.html').replace(/\\/g, '/');
  console.log('Membuka file:', fileUrl);
  await page.goto(fileUrl);

  // Klik play jika belum otomatis berjalan
  try {
    await page.evaluate(() => {
      if (typeof togglePlay === 'function' && !isPlaying) {
        togglePlay();
      }
    });
  } catch (e) {
    // ignore
  }

  console.log('Merekam animasi selama 30 detik...');
  await page.waitForTimeout(31000);

  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();

  if (video) {
    const videoPath = await video.path();
    const finalWebm = path.resolve('public/iklan-olahdata-16-9.webm');
    fs.copyFileSync(videoPath, finalWebm);
    console.log('Video tersimpan di:', finalWebm);
  }

  console.log('--- Perekaman Berhasil Selesai! ---');
})();
