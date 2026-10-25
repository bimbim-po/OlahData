import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const videosDir = path.resolve('public/videos');
fs.mkdirSync(videosDir, { recursive: true });

console.log('--- Merekam Video Motion Graphics Format 9:16 (TikTok / Reels / Shorts) ---');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: videosDir,
      size: { width: 720, height: 1280 }
    },
    viewport: { width: 720, height: 1280 }
  });

  const page = await context.newPage();
  const fileUrl = 'file:///' + path.resolve('public/motion-ad.html').replace(/\\/g, '/');
  await page.goto(fileUrl);

  // Switch to 9:16
  await page.evaluate(() => {
    setAspectRatio('9:16');
    restartVideo();
  });

  console.log('Merekam animasi 9:16 selama 30 detik...');
  await page.waitForTimeout(31000);

  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();

  if (video) {
    const videoPath = await video.path();
    const finalWebm = path.resolve('public/iklan-olahdata-9-16.webm');
    fs.copyFileSync(videoPath, finalWebm);
    console.log('Video 9:16 tersimpan di:', finalWebm);
  }

  console.log('--- Selesai Merekam 9:16! ---');
})();
