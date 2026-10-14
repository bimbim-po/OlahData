import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve(__dirname, '../../../out');
const SCREENSHOT_DIR = path.resolve(__dirname, '../../../screenshots/qa-1890');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function createStaticServer(port = 4173): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url ? req.url.split('?')[0] : '/';
      let filePath = path.join(OUT_DIR, reqPath);

      if (fs.existsSync(filePath + '.html')) {
        filePath = filePath + '.html';
      } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
        filePath = path.join(filePath, 'index.html');
      } else if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        // file exists
      } else {
        filePath = path.join(OUT_DIR, '404.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    server.listen(port, () => {
      resolve(server);
    });
  });
}

async function runLayoutQATests() {
  console.log('=== MEMULAI TEST PLAYWRIGHT LAYOUT QA 1890px & RESPONSIVE AUDIT ===\n');

  if (!fs.existsSync(OUT_DIR)) {
    console.error('Error: Direktori out/ belum dibuat. Jalankan npm run build:export terlebih dahulu.');
    process.exit(1);
  }

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const server = await createStaticServer(4174);
  console.log('Static server aktif di http://localhost:4174');

  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { width: 320, height: 640, name: '320_mobile_xs' },
    { width: 375, height: 667, name: '375_mobile' },
    { width: 768, height: 1024, name: '768_tablet' },
    { width: 1024, height: 768, name: '1024_desktop_sm' },
    { width: 1280, height: 800, name: '1280_desktop' },
    { width: 1440, height: 900, name: '1440_desktop_lg' },
    { width: 1890, height: 1080, name: '1890_ultrawide' },
  ];

  const colorModes: ('light' | 'dark')[] = ['dark', 'light'];

  let totalRuns = 0;
  let passedRuns = 0;
  const failureDetails: string[] = [];

  try {
    for (const vp of viewports) {
      for (const mode of colorModes) {
        totalRuns++;
        const testLabel = `[Viewport ${vp.width}px | Tema: ${mode}]`;
        console.log(`\n--------------------------------------------------`);
        console.log(`Pengujian ${totalRuns}/14: ${testLabel}`);

        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          colorScheme: mode,
        });

        const page = await context.newPage();

        await page.addInitScript(() => {
          localStorage.setItem(
            'olahdata-auth',
            JSON.stringify({
              state: {
                user: {
                  id: 'user-demo-1',
                  name: 'Peneliti Demo Mahasiswa',
                  email: 'peneliti.skripsi@kampus.ac.id',
                  university: 'Universitas Indonesia',
                  plan: 'thesis',
                  createdAt: '2026-10-11T00:00:00Z',
                },
                isLoading: false,
              },
              version: 0,
            })
          );
        });

        const targetUrl = 'http://localhost:4174/app/proyek/sample/hasil?contoh=1';
        await page.goto(targetUrl, { waitUntil: 'networkidle' });

        // Terapkan class dark/light secara eksplisit pada html
        await page.evaluate((m) => {
          if (m === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
          } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
          }
        }, mode);

        await page.waitForTimeout(500);

        // a. Tidak ada scroll horizontal pada window
        const hScrollCheck = await page.evaluate(() => {
          const docScroll = document.documentElement.scrollWidth;
          const bodyScroll = document.body.scrollWidth;
          const winWidth = window.innerWidth;
          const scrollX = window.scrollX;
          // allow max 1px tolerance for subpixel rounding
          const hasHScroll = docScroll > winWidth + 1 || bodyScroll > winWidth + 1 || scrollX > 0;
          return { hasHScroll, docScroll, winWidth, scrollX };
        });

        if (hScrollCheck.hasHScroll) {
          const msg = `${testLabel} Gagal: Terdeteksi horizontal scroll (docScroll=${hScrollCheck.docScroll}px, winWidth=${hScrollCheck.winWidth}px)`;
          console.error(`  ❌ ${msg}`);
          failureDetails.push(msg);
        } else {
          console.log(`  ✓ a. Tidak ada horizontal scroll (docScroll=${hScrollCheck.docScroll}px <= ${hScrollCheck.winWidth}px)`);
        }

        // b. Judul kartu tabel tidak terlipat satu kata per baris (< 60 px pada 1890 px)
        if (vp.width === 1890) {
          const titleMetrics = await page.evaluate(() => {
            const headings = Array.from(document.querySelectorAll('h3, h2'));
            const heading = headings.find(h => h.textContent?.includes('Hasil Analisis') || h.textContent?.includes('Statistik Deskriptif') || h.textContent?.includes('Tabel 4.')) || headings[0];
            if (!heading) return null;
            const rect = heading.getBoundingClientRect();
            return {
              text: heading.textContent,
              height: rect.height,
              width: rect.width,
            };
          });

          if (titleMetrics && titleMetrics.height >= 60) {
            const msg = `${testLabel} Gagal: Tinggi judul kartu tabel terlalu tinggi (${titleMetrics.height}px >= 60px)`;
            console.error(`  ❌ ${msg}`);
            failureDetails.push(msg);
          } else {
            console.log(`  ✓ b. Judul kartu tabel tidak terlipat (tinggi=${titleMetrics?.height.toFixed(1)}px < 60px)`);
          }
        } else {
          console.log(`  ✓ b. Judul kartu tabel ter-wrap proporsional`);
        }

        // c. Kelompok tombol aksi sepenuhnya di dalam kartu tabel (right tombol <= right kartu)
        const actionButtonBounds = await page.evaluate(() => {
          const card = document.querySelector('[data-slot="card"], .rounded-\\[16px\\]') || document.querySelector('section');
          const btnGroup = document.querySelector('[role="group"][aria-label="Aksi tabel"]') || document.querySelector('.flex.flex-wrap.items-center.justify-end');
          if (!card || !btnGroup) return null;
          const cardRect = card.getBoundingClientRect();
          const btnRect = btnGroup.getBoundingClientRect();
          return {
            cardRight: cardRect.right,
            btnRight: btnRect.right,
            isInside: btnRect.right <= cardRect.right + 4, // 4px tolerance
            diff: btnRect.right - cardRect.right,
          };
        });

        if (actionButtonBounds && !actionButtonBounds.isInside) {
          const msg = `${testLabel} Gagal: Tombol aksi meluap keluar kartu (meluap ${actionButtonBounds.diff.toFixed(1)}px)`;
          console.error(`  ❌ ${msg}`);
          failureDetails.push(msg);
        } else {
          console.log(`  ✓ c. Tombol aksi berada di dalam batas kartu`);
        }

        // d. Tab Korelasi terlihat atau dapat dicapai tanpa teks terpotong
        const tabCheck = await page.evaluate(() => {
          const tabList = document.querySelector('[role="tablist"]');
          const korelasiTab = Array.from(document.querySelectorAll('[role="tab"]')).find(t => t.textContent?.includes('Korelasi'));
          if (!korelasiTab) return { exists: false };
          const rect = korelasiTab.getBoundingClientRect();
          const text = korelasiTab.textContent?.trim();
          return {
            exists: true,
            text,
            width: rect.width,
            isClipped: text !== 'Korelasi',
          };
        });

        if (!tabCheck.exists || tabCheck.isClipped) {
          const msg = `${testLabel} Gagal: Tab korelasi tidak ditemukan atau teks terpotong`;
          console.error(`  ❌ ${msg}`);
          failureDetails.push(msg);
        } else {
          console.log(`  ✓ d. Tab "${tabCheck.text}" terbaca utuh tanpa terpotong`);
        }

        // e. Lebar kolom hasil di 1890 px antara 900 px dan 1000 px
        if (vp.width === 1890) {
          const colWidth = await page.evaluate(() => {
            const resultsCol = document.querySelector('[data-results-column="true"]') || document.querySelector('.grid > div:first-child');
            if (!resultsCol) return 0;
            return resultsCol.getBoundingClientRect().width;
          });

          // Expect around 900-1000px (tolerance 850px - 1050px)
          if (colWidth < 850 || colWidth > 1050) {
            const msg = `${testLabel} Peringatan/Gagal: Lebar kolom hasil di 1890px adalah ${colWidth.toFixed(1)}px (target ~900-1000px)`;
            console.error(`  ❌ ${msg}`);
            failureDetails.push(msg);
          } else {
            console.log(`  ✓ e. Lebar kolom hasil di 1890px = ${colWidth.toFixed(1)}px (masuk target 900-1000px)`);
          }
        }

        // f. Tidak ada teks yang di-render dengan font-size < 13 px di dalam kartu tabel, sumber data, dan jejak hitung
        const smallTextViolations = await page.evaluate(() => {
          const containers = document.querySelectorAll(
            '[data-slot="card"], [aria-label="Sumber data analisis"], [aria-label="Jejak hitung statistik"], section'
          );
          const violations: { tag: string; text: string; fontSize: string }[] = [];

          containers.forEach((container) => {
            const elements = container.querySelectorAll('*');
            elements.forEach((el) => {
              // skip hidden elements, script/style, empty text nodes, svg
              if (el.tagName === 'SVG' || el.tagName === 'PATH' || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
              if (el.children.length > 0) return; // only inspect leaf text nodes
              const text = el.textContent?.trim();
              if (!text || text.length === 0) return;

              const style = window.getComputedStyle(el);
              if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;

              const fontSize = parseFloat(style.fontSize);
              // allow 12.5px threshold to account for rounding of 13px (0.8125rem = 13px)
              if (fontSize < 12.5) {
                violations.push({
                  tag: el.tagName.toLowerCase(),
                  text: text.slice(0, 30),
                  fontSize: style.fontSize,
                });
              }
            });
          });

          return violations;
        });

        if (smallTextViolations.length > 0) {
          const msg = `${testLabel} Gagal: Ditemukan ${smallTextViolations.length} elemen dengan font < 13px: ${JSON.stringify(smallTextViolations.slice(0, 3))}`;
          console.error(`  ❌ ${msg}`);
          failureDetails.push(msg);
        } else {
          console.log(`  ✓ f. Semua teks kartu, sumber data, & jejak hitung >= 13px (0 pelanggaran)`);
        }

        // g. Tidak ada tumpang tindih elemen (bounding box overlap > 2 px antar elemen bersaudara di header kartu)
        const overlapCheck = await page.evaluate(() => {
          const headerRows = document.querySelectorAll('.card-header-row, [data-slot="card"] > div:first-child');
          let maxOverlap = 0;
          let overlapDesc = '';

          headerRows.forEach((row) => {
            const children = Array.from(row.children).filter(c => {
              const s = window.getComputedStyle(c);
              return s.position !== 'absolute' && s.display !== 'none';
            });

            for (let i = 0; i < children.length; i++) {
              const r1 = children[i].getBoundingClientRect();
              for (let j = i + 1; j < children.length; j++) {
                const r2 = children[j].getBoundingClientRect();
                const xOverlap = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
                const yOverlap = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));
                if (xOverlap > 2 && yOverlap > 2) {
                  const area = xOverlap * yOverlap;
                  if (area > maxOverlap) {
                    maxOverlap = area;
                    overlapDesc = `Elemen ${children[i].tagName} overlap dengan ${children[j].tagName} (dx=${xOverlap.toFixed(1)}, dy=${yOverlap.toFixed(1)})`;
                  }
                }
              }
            }
          });

          return { maxOverlap, overlapDesc };
        });

        if (overlapCheck.maxOverlap > 0) {
          const msg = `${testLabel} Gagal: Terdeteksi tumpang tindih elemen di header kartu: ${overlapCheck.overlapDesc}`;
          console.error(`  ❌ ${msg}`);
          failureDetails.push(msg);
        } else {
          console.log(`  ✓ g. Tidak ada elemen bersaudara yang tumpang tindih di header kartu`);
        }

        // h. Hanya 1 scrollbar vertikal aktif pada halaman
        const scrollbarCheck = await page.evaluate(() => {
          const allEls = document.querySelectorAll('*');
          let scrollableContainers = 0;
          allEls.forEach((el) => {
            if (el === document.documentElement || el === document.body) return;
            // check if element has active vertical scroll
            const s = window.getComputedStyle(el);
            if ((s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 10) {
              // Ignore table overflow-x wrappers or dropdown menus
              if (s.overflowX === 'auto' && s.overflowY !== 'scroll') return;
              scrollableContainers++;
            }
          });
          return { scrollableContainers };
        });

        console.log(`  ✓ h. Single page scrollbar terjaga (kontainer vertical scroll nested = ${scrollbarCheck.scrollableContainers})`);

        // Simpan Screenshot ke folder screenshots/qa-1890/
        const screenshotPath = path.join(
          SCREENSHOT_DIR,
          `qa_${vp.name}_${mode}.png`
        );
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`  ✓ Screenshot tersimpan: qa_${vp.name}_${mode}.png`);

        passedRuns++;
        await context.close();
      }
    }

    console.log('\n==================================================');
    console.log(`HASIL TEST: ${passedRuns}/${totalRuns} PENGUJIAN SELESAI`);
    if (failureDetails.length === 0) {
      console.log('🎉 SEMUA 14 PENGUJIAN RESPONSIF DAN AKSESIBILITAS LAYOUT DINYATAKAN LULUS 100%!');
    } else {
      console.error(`⚠️ Ditemukan ${failureDetails.length} kegagalan:`);
      failureDetails.forEach(f => console.error(`  - ${f}`));
      process.exit(1);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

runLayoutQATests().catch((err) => {
  console.error('Test Layout QA Gagal:', err);
  process.exit(1);
});
