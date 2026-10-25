import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateOgImage() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 630 });

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      body {
        width: 1200px;
        height: 630px;
        background: linear-gradient(135deg, #090e17 0%, #0f172a 45%, #1e293b 100%);
        color: #f8fafc;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 56px 64px;
        position: relative;
        overflow: hidden;
      }
      .glow {
        position: absolute;
        width: 650px;
        height: 650px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(2, 132, 199, 0.22) 0%, rgba(2, 132, 199, 0) 70%);
        top: -160px;
        right: -80px;
        pointer-events: none;
      }
      .glow-bottom {
        position: absolute;
        width: 450px;
        height: 450px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(56, 189, 248, 0) 70%);
        bottom: -150px;
        left: 200px;
        pointer-events: none;
      }
      .header {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .logo-box {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: #0284c7;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 24px;
        color: white;
        box-shadow: 0 4px 14px rgba(2, 132, 199, 0.45);
      }
      .brand-name {
        font-size: 28px;
        font-weight: 800;
        letter-spacing: -0.5px;
        color: #ffffff;
      }
      .brand-tag {
        background: rgba(14, 165, 233, 0.15);
        color: #38bdf8;
        border: 1px solid rgba(14, 165, 233, 0.35);
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        margin-left: 10px;
      }
      .content {
        margin-top: 10px;
      }
      .title {
        font-size: 48px;
        font-weight: 800;
        line-height: 1.15;
        letter-spacing: -1px;
        color: #ffffff;
        max-width: 950px;
      }
      .title span {
        color: #38bdf8;
      }
      .subtitle {
        font-size: 21px;
        color: #94a3b8;
        line-height: 1.45;
        margin-top: 16px;
        max-width: 860px;
      }
      .features {
        display: flex;
        gap: 12px;
        margin-top: 36px;
        flex-wrap: wrap;
      }
      .feature-pill {
        background: rgba(30, 41, 59, 0.9);
        border: 1px solid rgba(148, 163, 184, 0.3);
        padding: 10px 18px;
        border-radius: 12px;
        font-size: 15px;
        font-weight: 600;
        color: #e2e8f0;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      .feature-pill .check {
        color: #38bdf8;
        font-weight: bold;
      }
      .footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-top: 1px solid rgba(148, 163, 184, 0.2);
        padding-top: 24px;
        font-size: 14px;
        color: #64748b;
      }
      .url {
        font-weight: 700;
        color: #38bdf8;
        font-size: 16px;
      }
    </style>
  </head>
  <body>
    <div class="glow"></div>
    <div class="glow-bottom"></div>
    <div class="header">
      <div class="logo-box">OD</div>
      <div class="brand-name">OlahData</div>
      <div class="brand-tag">Platform Olah Data Skripsi Kuantitatif</div>
    </div>
    
    <div class="content">
      <h1 class="title">Dari Kuesioner ke <span>Bab 4 Otomatis</span>, Tanpa SPSS.</h1>
      <p class="subtitle">Otomatis uji validitas, reliabilitas, asumsi klasik, regresi linier berganda, dan ekspor tabel Word standar jurnal ilmiah.</p>
      
      <div class="features">
        <div class="feature-pill"><span class="check">✓</span> 100% Deterministik Rumus Baku</div>
        <div class="feature-pill"><span class="check">✓</span> Uji Validitas & Cronbach's Alpha</div>
        <div class="feature-pill"><span class="check">✓</span> Asumsi Klasik (KS, VIF, Glejser)</div>
        <div class="feature-pill"><span class="check">✓</span> Dual-Format APA 7th & SPSS</div>
        <div class="feature-pill"><span class="check">✓</span> Ekspor Dokumen Word (.docx)</div>
      </div>
    </div>
    
    <div class="footer">
      <span>Standar Metodologi Penelitian Skripsi Kuantitatif Indonesia</span>
      <span class="url">https://olah-data.pages.dev</span>
    </div>
  </body>
  </html>
  `;

  await page.setContent(html);
  const outputPath = path.resolve(__dirname, '../apps/web/public/og-image.png');
  await page.screenshot({ path: outputPath });
  console.log(`og-image.png generated successfully at ${outputPath}`);
  await browser.close();
}

generateOgImage().catch((err) => {
  console.error('Failed to generate og-image:', err);
  process.exit(1);
});
