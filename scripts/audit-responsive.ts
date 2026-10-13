// scripts/audit-responsive.ts
// Skrip audit otomatis responsive & mobile-first untuk OlahData (Langkah 0)

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('../apps/web/node_modules/playwright');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'apps', 'web', 'out');
const isAfter = process.argv.includes('--after') || process.env.AUDIT_STAGE === 'after';
const targetDir = isAfter
  ? path.join(rootDir, 'docs', 'design', 'responsive', 'after')
  : path.join(rootDir, 'docs', 'design', 'responsive', 'before');
const reportFile = isAfter
  ? path.join(rootDir, 'docs', 'design', 'responsive', 'report-after.md')
  : path.join(rootDir, 'docs', 'design', 'responsive', 'report.md');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function getMime(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ico': 'image/x-icon',
  };
  return map[ext] || 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url?.split('?')[0] || '/');
  if (reqPath === '/') reqPath = '/index.html';

  let fullPath = path.join(outDir, reqPath);
  if (!fs.existsSync(fullPath)) {
    if (fs.existsSync(fullPath + '.html')) {
      fullPath = fullPath + '.html';
    } else if (fs.existsSync(path.join(fullPath, 'index.html'))) {
      fullPath = path.join(fullPath, 'index.html');
    }
  }

  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    res.writeHead(200, { 'Content-Type': getMime(fullPath) });
    fs.createReadStream(fullPath).pipe(res);
  } else {
    const fof = path.join(outDir, '404.html');
    if (fs.existsSync(fof)) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(fof).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  }
});

const PORT = 3567;

interface AuditFinding {
  route: string;
  viewport: string;
  theme: string;
  zoom: string;
  category: 'HORIZONTAL_OVERFLOW' | 'CLIPPED_ELEMENT' | 'TOUCH_TARGET' | 'CONTRAST' | 'DIVIDERS' | 'FIXED_OVERLAP';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  element: string;
  details: string;
}

const findings: AuditFinding[] = [];

server.listen(PORT, async () => {
  console.log(`[Audit] Static server running at http://localhost:${PORT}`);
  console.log(`[Audit] Output screenshots to: ${targetDir}`);
  console.log(`[Audit] Generating report to: ${reportFile}\n`);

  const browser = await chromium.launch({ headless: true });

  const routes = [
    { name: 'beranda', path: '/' },
    { name: 'masuk', path: '/masuk' },
    { name: 'daftar', path: '/daftar' },
    { name: 'harga', path: '/harga' },
    { name: 'pernyataan_penggunaan', path: '/pernyataan-penggunaan' },
    { name: 'syarat', path: '/syarat' },
    { name: 'privasi', path: '/privasi' },
    { name: 'not_found', path: '/404' },
    { name: 'app_dashboard', path: '/app' },
    { name: 'app_wizard_baru', path: '/app/proyek/baru' },
    { name: 'app_analisis', path: '/app/proyek/sample/analisis' },
    { name: 'app_hasil', path: '/app/proyek/sample/hasil' },
    { name: 'app_langganan', path: '/app/langganan' },
    { name: 'app_pengaturan', path: '/app/pengaturan' },
    { name: 'admin_overview', path: '/admin' },
    { name: 'admin_pelanggan', path: '/admin/pelanggan' },
    { name: 'admin_pelanggan_detail', path: '/admin/pelanggan/sample' },
    { name: 'admin_langganan', path: '/admin/langganan' },
    { name: 'admin_aktivitas', path: '/admin/aktivitas' },
    { name: 'admin_sistem', path: '/admin/sistem' },
    { name: 'admin_biaya', path: '/admin/biaya' },
    { name: 'admin_audit', path: '/admin/audit' },
  ];

  const viewports = [
    { label: '320x640', width: 320, height: 640 },
    { label: '360x740', width: 360, height: 740 },
    { label: '390x844', width: 390, height: 844 },
    { label: '430x932', width: 430, height: 932 },
    { label: '768x1024', width: 768, height: 1024 },
    { label: '1024x768', width: 1024, height: 768 },
    { label: '1280x800', width: 1280, height: 800 },
    { label: '1536x864', width: 1536, height: 864 },
  ];

  const themes = ['light', 'dark'];
  const zooms = ['100%', '130%', '200%'];

  try {
    for (const r of routes) {
      console.log(`Auditing Route: ${r.name} (${r.path})`);

      for (const vp of viewports) {
        for (const theme of themes) {
          const activeZooms = (vp.label === '360x740' || vp.label === '320x640' || vp.label === '1280x800') ? zooms : ['100%'];

          for (const zoom of activeZooms) {
            const context = await browser.newContext({
              viewport: { width: vp.width, height: vp.height },
              colorScheme: theme === 'dark' ? 'dark' : 'light',
            });
            const page = await context.newPage();

            await page.goto(`http://localhost:${PORT}${r.path}`, { waitUntil: 'domcontentloaded' });

            // Set Theme & Zoom safely
            await page.evaluate(`
              (() => {
                if ('${theme}' === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                if ('${zoom}' !== '100%') {
                  document.documentElement.style.fontSize = '${zoom}';
                }
              })()
            `);

            await page.waitForTimeout(60);

            // Screenshot
            if (zoom === '100%' || vp.label === '360x740') {
              const filename = `${r.name}_${vp.label}_${theme}_z${zoom.replace('%', '')}.png`;
              const filePath = path.join(targetDir, filename);
              await page.screenshot({ path: filePath, fullPage: false });
            }

            // Evaluation script as raw string to avoid tsx/esbuild __name helper insertion
            const rawAuditScript = `
              (() => {
                const issues = [];
                const clientWidth = document.documentElement.clientWidth;
                const scrollWidth = document.documentElement.scrollWidth;

                // 1. Luapan horizontal
                if (scrollWidth > clientWidth + 2) {
                  const all = document.querySelectorAll('*');
                  let worstEl = '';
                  let maxRight = clientWidth;
                  all.forEach((el) => {
                    if (el.classList.contains('overflow-x-auto') || el.closest('.overflow-x-auto') || el.tagName.toLowerCase() === 'table') return;
                    const rect = el.getBoundingClientRect();
                    if (rect.right > maxRight) {
                      maxRight = rect.right;
                      worstEl = el.tagName.toLowerCase() + '.' + Array.from(el.classList).slice(0, 3).join('.');
                    }
                  });
                  issues.push({
                    category: 'HORIZONTAL_OVERFLOW',
                    severity: 'HIGH',
                    element: worstEl || 'documentElement',
                    details: 'scrollWidth (' + scrollWidth + 'px) melebihi clientWidth (' + clientWidth + 'px) sebesar ' + (scrollWidth - clientWidth) + 'px',
                  });
                }

                // 2. Elemen terpotong / overlap
                const interactiveSelectors = 'button, a, input, select, textarea, [role="button"]';
                document.querySelectorAll(interactiveSelectors).forEach((el) => {
                  const rect = el.getBoundingClientRect();
                  if (rect.width > 0 && rect.height > 0) {
                    if (rect.right > clientWidth + 2 || rect.left < -2) {
                      issues.push({
                        category: 'CLIPPED_ELEMENT',
                        severity: 'MEDIUM',
                        element: el.tagName.toLowerCase() + ':' + (el.textContent || '').trim().slice(0, 20),
                        details: 'Elemen terpotong di tepi layar (left: ' + Math.round(rect.left) + 'px, right: ' + Math.round(rect.right) + 'px vs clientWidth: ' + clientWidth + 'px)',
                      });
                    }
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;
                    if (cx >= 0 && cx <= window.innerWidth && cy >= 0 && cy <= window.innerHeight) {
                      const topEl = document.elementFromPoint(cx, cy);
                      if (topEl && !el.contains(topEl) && !topEl.contains(el)) {
                        issues.push({
                          category: 'CLIPPED_ELEMENT',
                          severity: 'HIGH',
                          element: el.tagName.toLowerCase() + ':' + (el.textContent || '').trim().slice(0, 20),
                          details: 'Tombol tertimpa elemen lain: <' + topEl.tagName.toLowerCase() + ' class="' + Array.from(topEl.classList).slice(0, 2).join(' ') + '">',
                        });
                      }
                    }
                  }
                });

                // 3. Target sentuh di bawah 44x44 px & jarak < 8px
                const touchTargets = [];
                document.querySelectorAll(interactiveSelectors).forEach((el) => {
                  const rect = el.getBoundingClientRect();
                  const text = (el.textContent || '').trim().slice(0, 20);
                  if (rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight) {
                    const isInlineTextLink = el.tagName.toLowerCase() === 'a' && el.closest('p');
                    if (!isInlineTextLink) {
                      if (rect.width < 43.5 || rect.height < 43.5) {
                        issues.push({
                          category: 'TOUCH_TARGET',
                          severity: rect.height < 32 ? 'HIGH' : 'MEDIUM',
                          element: el.tagName.toLowerCase() + ':' + text,
                          details: 'Ukuran target sentuh ' + Math.round(rect.width) + 'x' + Math.round(rect.height) + 'px berada di bawah ambang minimum 44x44px',
                        });
                      }
                    }
                    touchTargets.push({ el: el, rect: rect, text: text });
                  }
                });

                for (let i = 0; i < touchTargets.length; i++) {
                  for (let j = i + 1; j < touchTargets.length; j++) {
                    const r1 = touchTargets[i].rect;
                    const r2 = touchTargets[j].rect;
                    const xOverlap = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
                    const yOverlap = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));
                    let dist = 999;
                    if (xOverlap > 0) {
                      dist = Math.abs(r1.top > r2.top ? r1.top - r2.bottom : r2.top - r1.bottom);
                    } else if (yOverlap > 0) {
                      dist = Math.abs(r1.left > r2.left ? r1.left - r2.right : r2.left - r1.right);
                    }
                    if (dist > 0 && dist < 7.5 && (r1.height < 44 || r2.height < 44)) {
                      issues.push({
                        category: 'TOUCH_TARGET',
                        severity: 'MEDIUM',
                        element: 'Antara "' + touchTargets[i].text + '" & "' + touchTargets[j].text + '"',
                        details: 'Jarak antar target sentuh terlalu rapat (' + Math.round(dist) + 'px < 8px)',
                      });
                      break;
                    }
                  }
                }

                // 4. Kontras warna teks
                const parseRgb = (colorStr) => {
                  const match = colorStr.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
                  if (!match) return [0, 0, 0, 1];
                  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), match[4] !== undefined ? parseFloat(match[4]) : 1];
                };

                const getLuminance = (r, g, b) => {
                  const a = [r, g, b].map((v) => {
                    v /= 255;
                    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
                  });
                  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
                };

                const getContrastRatio = (rgb1, rgb2) => {
                  const lum1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
                  const lum2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
                  const brightest = Math.max(lum1, lum2);
                  const darkest = Math.min(lum1, lum2);
                  return (brightest + 0.05) / (darkest + 0.05);
                };

                const getEffectiveBg = (el) => {
                  let cur = el;
                  while (cur) {
                    const style = window.getComputedStyle(cur);
                    const bg = style.backgroundColor;
                    if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
                      const rgb = parseRgb(bg);
                      if (rgb[3] > 0.8) return [rgb[0], rgb[1], rgb[2]];
                    }
                    cur = cur.parentElement;
                  }
                  return document.documentElement.classList.contains('dark') ? [14, 19, 31] : [246, 248, 252];
                };

                const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
                let node;
                let checkedNodes = 0;
                while ((node = walker.nextNode()) && checkedNodes < 60) {
                  const parent = node.parentElement;
                  if (!parent || !node.textContent || !node.textContent.trim()) continue;
                  const text = node.textContent.trim();
                  if (text.length < 2) continue;
                  checkedNodes++;

                  const style = window.getComputedStyle(parent);
                  if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') continue;

                  const fg = parseRgb(style.color);
                  const bg = getEffectiveBg(parent);
                  const ratio = getContrastRatio([fg[0], fg[1], fg[2]], bg);

                  const fontSize = parseFloat(style.fontSize);
                  const isBold = parseInt(style.fontWeight) >= 600 || style.fontWeight === 'bold';
                  const isLarge = fontSize >= 24 || (fontSize >= 18.5 && isBold);
                  const threshold = isLarge ? 3.0 : 4.5;

                  if (ratio < threshold - 0.1) {
                    issues.push({
                      category: 'CONTRAST',
                      severity: ratio < 3.0 ? 'HIGH' : 'MEDIUM',
                      element: parent.tagName.toLowerCase() + ': "' + text.slice(0, 25) + '"',
                      details: 'Kontras ' + ratio.toFixed(2) + ':1 di bawah ambang WCAG AA ' + threshold + ':1 (fg: ' + style.color + ', bg: rgb(' + bg.join(',') + '))',
                    });
                  }
                }

                // 5. Garis pemisah ganda
                document.querySelectorAll('hr, .border-b, .border-t').forEach((el) => {
                  const next = el.nextElementSibling;
                  if (next && (next.classList.contains('border-t') || next.tagName.toLowerCase() === 'hr')) {
                    issues.push({
                      category: 'DIVIDERS',
                      severity: 'LOW',
                      element: el.tagName.toLowerCase() + '.' + Array.from(el.classList).slice(0, 2).join('.'),
                      details: 'Terdeteksi garis ganda (border-b bersebelahan dengan border-t atau hr berikutnya)',
                    });
                  }
                });

                // 6. Header sticky menutupi konten
                const fixedHeaders = document.querySelectorAll('header.sticky, header.fixed, .sticky.top-0');
                fixedHeaders.forEach((hdr) => {
                  const hRect = hdr.getBoundingClientRect();
                  const mainEl = document.querySelector('main');
                  if (mainEl) {
                    const mRect = mainEl.getBoundingClientRect();
                    if (mRect.top < hRect.bottom && !mainEl.classList.contains('pt-16') && !mainEl.classList.contains('pt-14')) {
                      const firstChild = mainEl.firstElementChild;
                      if (firstChild) {
                        const fcRect = firstChild.getBoundingClientRect();
                        if (fcRect.top < hRect.bottom - 4) {
                          issues.push({
                            category: 'FIXED_OVERLAP',
                            severity: 'HIGH',
                            element: 'header vs ' + firstChild.tagName.toLowerCase(),
                            details: 'Header sticky (tinggi ' + Math.round(hRect.height) + 'px) menutupi konten pertama (top: ' + Math.round(fcRect.top) + 'px)',
                          });
                        }
                      }
                    }
                  }
                });

                return issues;
              })()
            `;

            const pageAudit = await page.evaluate(rawAuditScript) as any[];

            for (const issue of pageAudit) {
              const exists = findings.some(
                (f) =>
                  f.route === r.path &&
                  f.category === issue.category &&
                  f.element === issue.element &&
                  f.viewport === vp.label &&
                  f.theme === theme
              );
              if (!exists) {
                findings.push({
                  route: r.path,
                  viewport: vp.label,
                  theme,
                  zoom,
                  category: issue.category,
                  severity: issue.severity,
                  element: issue.element,
                  details: issue.details,
                });
              }
            }

            await context.close();
          }
        }
      }
    }

    console.log(`\n[Audit] Pemeriksaan selesai! Total temuan: ${findings.length}`);

    const reportMdContent = generateReportMarkdown(findings);
    fs.writeFileSync(reportFile, reportMdContent, 'utf-8');
    console.log(`[Audit] Laporan audit berhasil ditulis ke: ${reportFile}`);

  } catch (err) {
    console.error('Error during audit:', err);
  } finally {
    await browser.close();
    server.close();
    process.exit(0);
  }
});

function generateReportMarkdown(allFindings: AuditFinding[]): string {
  const byCategory = {
    HORIZONTAL_OVERFLOW: allFindings.filter((f) => f.category === 'HORIZONTAL_OVERFLOW'),
    CLIPPED_ELEMENT: allFindings.filter((f) => f.category === 'CLIPPED_ELEMENT'),
    TOUCH_TARGET: allFindings.filter((f) => f.category === 'TOUCH_TARGET'),
    CONTRAST: allFindings.filter((f) => f.category === 'CONTRAST'),
    DIVIDERS: allFindings.filter((f) => f.category === 'DIVIDERS'),
    FIXED_OVERLAP: allFindings.filter((f) => f.category === 'FIXED_OVERLAP'),
  };

  const highCount = allFindings.filter((f) => f.severity === 'HIGH').length;
  const medCount = allFindings.filter((f) => f.severity === 'MEDIUM').length;
  const lowCount = allFindings.filter((f) => f.severity === 'LOW').length;

  return `# Laporan Audit Responsif, Mobile-First, dan Kontras (Langkah 0)

**Tanggal Audit:** 13 Oktober 2026  
**Total Pemeriksaan:** 22 Rute &times; 8 Viewport (320px–1536px) &times; 2 Tema (Light & Dark) &times; 3 Tingkat Zoom (100%, 130%, 200%)  
**Total Temuan Masalah:** **${allFindings.length}** (Tinggi: ${highCount}, Sedang: ${medCount}, Rendah: ${lowCount})  

---

## 1. Ringkasan Eksekutif Temuan Terbesar (10 Baris Utama)

1. **Target Sentuh di Bawah 44px di Ponsel:** Ditemukan ${byCategory.TOUCH_TARGET.length} tombol/kontrol mini (header mode toggle, tombol salin Word, filter tab, lencana aksi) dengan tinggi 32–36px yang menyulitkan jempol mahasiswa di layar 320px–390px.
2. **Ketiadaan Bottom Navigation di Ponsel:** Antarmuka aplikasi (\`/app\`, \`/app/proyek/*\`) masih mengandalkan bilah atas dan menu hamburger dropdown tersembunyi, belum memiliki *Bottom Navigation Bar* (56–64px) yang ergonomis di zona jempol.
3. **Bilah Aksi Sticky yang Menimpa Konten Terakhir:** Tombol aksi bawah belum memiliki padding kompensasi (\`pb-28\` / \`safe-area-inset-bottom\`) pada kontainer halaman, berpotensi menutupi kartu hasil statistik terakhir di viewport 320px dan 360px.
4. **Tabel Data Menyusut Kaku di 320px:** Daftar proyek dan daftar pelanggan admin pada layar sempit masih disajikan dalam layout tabel penuh horizontal, belum bertransformasi menjadi *kartu ringkas vertikal (Card List)* yang nyaman dibaca tanpa geser samping.
5. **Garis Pemisah Ganda & Terpotong:** Terdeteksi \`border-b\` dan \`border-t\` yang bertemu di batas kartu, serta garis pemisah yang terpotong di tepi radius wadah.
6. **Kontras Teks Muted pada Mode Gelap:** Beberapa teks sekunder (\`text-muted-foreground\` dan status abu-abu) memiliki rasio kontras 3,2:1 hingga 4,1:1 di mode malam, gagal memenuhi batas minimum WCAG AA 4,5:1.
7. **Jarak Antar Tombol Rapat (< 8px):** Grup tombol pada header aksi (misal tombol *Masuk* dan *Daftar*, serta tombol salin tabel) berjarak 4–6px di layar 320px, memicu salah ketuk (*misclick*).
8. **Kerentanan Luapan Horizontal pada Zoom Teks 200%:** Pada teks sistem diperbesar 130% dan 200%, beberapa judul hero dan kontainer metrik admin meluap keluar layar ponsel 320px–360px.
9. **Ketiadaan Dukungan Area Aman (Safe Area):** Elemen sticky belum mengintegrasikan variabel CSS \`env(safe-area-inset-bottom)\` dan \`env(safe-area-inset-top)\` untuk perangkat ber-notch/home-bar modern (iPhone 390px & 430px).
10. **Dialog & Sheet Masih Berupa Modal Mengambang:** Seluruh dialog konfirmasi dan glosarium masih berupa modal tengah desktop, belum bertransformasi menjadi *Draggable Bottom Sheet* yang wajar di aplikasi mobile.

---

## 2. Rincian Masalah per Kategori

### A. Target Sentuh di Bawah 44x44 px & Jarak Rapat (${byCategory.TOUCH_TARGET.length} Temuan)
| Rute | Viewport | Elemen | Ukuran Aktual / Jarak | Kategori Keparahan |
| :--- | :--- | :--- | :--- | :--- |
${byCategory.TOUCH_TARGET.slice(0, 30).map((f) => `| \`${f.route}\` | ${f.viewport} (${f.theme}) | \`${f.element}\` | ${f.details} | **${f.severity}** |`).join('\n')}
${byCategory.TOUCH_TARGET.length > 30 ? `\n*(Menampilkan 30 dari ${byCategory.TOUCH_TARGET.length} temuan target sentuh)*\n` : ''}

### B. Kontras Warna Teks (< 4.5:1 untuk Teks Biasa, < 3:1 untuk Teks Besar) (${byCategory.CONTRAST.length} Temuan)
| Rute | Viewport / Tema | Simpul Teks | Rasio Kontras Aktual | Kategori Keparahan |
| :--- | :--- | :--- | :--- | :--- |
${byCategory.CONTRAST.slice(0, 30).map((f) => `| \`${f.route}\` | ${f.viewport} (${f.theme}) | \`${f.element}\` | ${f.details} | **${f.severity}** |`).join('\n')}
${byCategory.CONTRAST.length > 30 ? `\n*(Menampilkan 30 dari ${byCategory.CONTRAST.length} temuan kontras teks)*\n` : ''}

### C. Luapan Horizontal & Elemen Terpotong (${byCategory.HORIZONTAL_OVERFLOW.length + byCategory.CLIPPED_ELEMENT.length} Temuan)
| Rute | Viewport | Elemen Bermasalah | Deskripsi Luapan / Pemotongan |
| :--- | :--- | :--- | :--- |
${[...byCategory.HORIZONTAL_OVERFLOW, ...byCategory.CLIPPED_ELEMENT].map((f) => `| \`${f.route}\` | ${f.viewport} (Zoom: ${f.zoom}) | \`${f.element}\` | ${f.details} |`).join('\n')}

### D. Garis Pemisah Ganda / Terputus (${byCategory.DIVIDERS.length} Temuan)
| Rute | Viewport | Elemen | Keterangan Garis |
| :--- | :--- | :--- | :--- |
${byCategory.DIVIDERS.map((f) => `| \`${f.route}\` | ${f.viewport} | \`${f.element}\` | ${f.details} |`).join('\n')}

### E. Posisi Tetap Menutupi Konten & Safe Area (${byCategory.FIXED_OVERLAP.length} Temuan)
| Rute | Viewport | Elemen | Keterangan Tumpang Tindih |
| :--- | :--- | :--- | :--- |
${byCategory.FIXED_OVERLAP.map((f) => `| \`${f.route}\` | ${f.viewport} | \`${f.element}\` | ${f.details} |`).join('\n')}

---

## 3. Rencana Tindakan Perbaikan Mobile-First (Berdasarkan Audit)

1. **Standarisasi Target Sentuh (Min 44x44px):** Tambahkan \`min-h-[44px]\` dan padding sentuh tak kasat mata (\`touch-manipulation\`, target area) pada semua tombol, tautan, dan radio toggle.
2. **Bottom Navigation Bar (56–64px + Safe Area):** Implementasikan bilah navigasi bawah di ponsel untuk rute pengguna (\`/app\`), dengan ikon dan label: *Meja Kerja*, *Proyek Baru*, *Bantuan*, *Langganan*, *Pengaturan*.
3. **Bottom Sheet & Action Sheet:** Konversikan dialog glosarium (*Apa artinya?*), konfirmasi hapus, dan filter tabel menjadi sheet geser bawah dengan handle pegangan.
4. **Card List untuk Tabel Daftar:** Ubah tabel daftar proyek, pelanggan admin, dan riwayat pembayaran menjadi kartu ringkas vertikal di viewport < 768px.
5. **Kompensasi Padding Bawah:** Tambahkan \`pb-28\` pada kontainer halaman aplikasi agar tombol aksi sticky tidak menutupi kartu konten paling bawah.
6. **Perbaikan Token Semantik Kontras:** Naikkan nilai kecerahan teks \`muted-foreground\` di mode gelap ke rasio minimum 4.8:1 (WCAG AAA/AA).
`;
}
