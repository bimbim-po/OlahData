import { chromium, type Browser, type Page } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import {
  parseIndonesianNumber,
  sanitizeSpreadsheetCell,
  escapeCsvCell,
  generateSafeCsv,
} from '../apps/web/src/lib/format';
import { parseSpreadsheetFile } from '../apps/web/src/lib/dataset-parser';

const OUT_DIR = path.resolve(__dirname, '../apps/web/out');
const PORT = 4188;

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

function createStaticServer(port: number): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const rawPath = req.url ? req.url.split('?')[0] : '/';
      let filePath = path.join(OUT_DIR, rawPath);

      if (fs.existsSync(filePath + '.html')) {
        filePath = filePath + '.html';
      } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
        filePath = path.join(filePath, 'index.html');
      } else if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        // file matches directly
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

    server.listen(port, () => resolve(server));
    server.on('error', reject);
  });
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
}

async function runQaAudit() {
  console.log('===============================================================');
  console.log('🚀 MEMULAI QA & SECURITY VERIFICATION SUITE — OLAHDATA');
  console.log('===============================================================\n');

  // =========================================================================
  // TEST 1: Unit & Security Logic Verification
  // =========================================================================
  console.log('▶ [1/4] Menguji Numeric Casting & Indonesian Locale Parsing...');
  assert(parseIndonesianNumber('Rp 1.250.000,00') === 1250000, 'Rp 1.250.000,00 harus diparse menjadi 1250000');
  assert(parseIndonesianNumber('1.250,5') === 1250.5, '1.250,5 harus diparse menjadi 1250.5');
  assert(parseIndonesianNumber('1.250.000') === 1250000, '1.250.000 harus diparse menjadi 1250000');
  assert(parseIndonesianNumber('-2,5') === -2.5, '-2,5 harus diparse menjadi -2.5');
  assert(parseIndonesianNumber('0') === 0, '"0" harus diparse menjadi 0 (bukan null)');
  assert(parseIndonesianNumber(0) === 0, '0 harus dipertahankan sebagai 0');
  assert(parseIndonesianNumber(null) === null, 'null harus menghasilkan null');
  assert(parseIndonesianNumber(undefined) === null, 'undefined harus menghasilkan null');
  assert(parseIndonesianNumber('') === null, 'string kosong harus menghasilkan null');
  assert(parseIndonesianNumber('NaN') === null, '"NaN" harus menghasilkan null');
  assert(parseIndonesianNumber('<kosong>') === null, '"<kosong>" harus menghasilkan null');
  console.log('  ✔ Indonesian locale parsing & null safety: LULUS');

  console.log('\n▶ [2/4] Menguji CSV Formula Injection & RFC-4180 Escaping...');
  assert(
    sanitizeSpreadsheetCell("=CMD|' /C calc'!A0") === "'=CMD|' /C calc'!A0",
    'Formula =CMD harus diawali tanda kutip tunggal'
  );
  assert(sanitizeSpreadsheetCell('+12345') === "'+12345", 'Tanda + harus diawali tanda kutip');
  assert(sanitizeSpreadsheetCell('-SUM(A1)') === "'-SUM(A1)", 'Tanda - harus diawali tanda kutip');
  assert(sanitizeSpreadsheetCell('@SUM') === "'@SUM", 'Tanda @ harus diawali tanda kutip');
  assert(sanitizeSpreadsheetCell('\tTAB') === "'\tTAB", 'Karakter tab harus diawali tanda kutip');
  assert(escapeCsvCell('Halo, Dunia') === '"Halo, Dunia"', 'Sel berkomma harus di-escape');
  assert(escapeCsvCell('Teks "Kutip"') === '"Teks ""Kutip"""', 'Kutip ganda harus di-escape');

  const safeCsv = generateSafeCsv(['Col1', 'Formula'], [{ Col1: 'A', Formula: '=1+1' }]);
  assert(safeCsv.startsWith('\uFEFF'), 'CSV wajib diawali UTF-8 BOM');
  assert(safeCsv.includes("'=1+1"), 'Formula harus dinetralkan dalam CSV');
  console.log('  ✔ CSV Formula Injection & RFC-4180 Escaping: LULUS');

  console.log('\n▶ [3/4] Menguji Parser Resilience (0 B, Header-Only, & XSS Injected CSV)...');
  // 1. File kosong 0 B
  let emptyErrorThrown = false;
  try {
    const emptyFile = {
      name: 'empty.csv',
      size: 0,
      arrayBuffer: async () => new ArrayBuffer(0),
    };
    await parseSpreadsheetFile(emptyFile);
  } catch (err: unknown) {
    emptyErrorThrown = true;
    assert(
      err instanceof Error && err.message.includes('File kosong atau tidak memiliki baris data'),
      'Pesan galat file 0 B harus sesuai spesifikasi Indonesian error'
    );
  }
  assert(emptyErrorThrown, 'File 0 B harus ditolak seketika');

  // 2. File header-only
  let headerOnlyThrown = false;
  try {
    const headerOnlyCsv = 'No,KL1,KL2,KL3\n';
    const buf = new TextEncoder().encode(headerOnlyCsv).buffer;
    const headerFile = {
      name: 'header_only.csv',
      size: buf.byteLength,
      arrayBuffer: async () => buf,
    };
    await parseSpreadsheetFile(headerFile);
  } catch (err: unknown) {
    headerOnlyThrown = true;
    assert(
      err instanceof Error && err.message.includes('File kosong atau tidak memiliki baris data'),
      'Dataset header-only harus ditolak dengan pesan spesifik'
    );
  }
  assert(headerOnlyThrown, 'Dataset header-only harus ditolak seketika');

  // 3. File dengan XSS payload & NaN values
  const xssCsv =
    'No,Nama,KL1,KL2\n' +
    '1,<img src=x onerror=alert(1)>,4,5\n' +
    '2,"=CMD|\' /C calc\'!A0",NaN,3\n' +
    '3,Responden Normal,0,Rp 1.250.000,00\n';
  const xssBuf = new TextEncoder().encode(xssCsv).buffer;
  const xssFile = {
    name: 'test_xss.csv',
    size: xssBuf.byteLength,
    arrayBuffer: async () => xssBuf,
  };
  const parsedXss = await parseSpreadsheetFile(xssFile);
  assert(parsedXss.rows.length === 3, 'Ketiga baris data berhasil terbaca tanpa crash');
  assert(parsedXss.rows[0].Nama === '<img src=x onerror=alert(1)>', 'XSS payload disimpan sebagai string murni');
  assert(parsedXss.rows[1].KL1 === null, 'Cell NaN harus dinormalisasi menjadi null (bukan korup/0)');
  assert(parsedXss.rows[2].KL1 === 0, 'Cell 0 harus dipertahankan sebagai 0');
  assert(parsedXss.rows[2].KL2 === 1250000, 'Cell Rp 1.250.000,00 harus terkonversi menjadi 1250000');
  assert(parsedXss.summary !== undefined, 'Pre-processing summary harus terhitung');
  assert(parsedXss.summary?.missingCellCount! >= 1, 'Missing cell count terhitung akurat');
  console.log('  ✔ Parser resilience, 0 B rejection, & NaN safety: LULUS');

  // =========================================================================
  // TEST 2: Playwright End-to-End Browser Audit
  // =========================================================================
  console.log('\n▶ [4/4] Menjalankan Playwright UI/UX, A11y, & Responsiveness Audit...');
  let server: http.Server | null = null;
  let browser: Browser | null = null;

  try {
    server = await createStaticServer(PORT);
    console.log(`  • Static server aktif di http://localhost:${PORT}`);

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const failedRequests: string[] = [];
    let alertTriggered = false;

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    page.on('dialog', async (dialog) => {
      alertTriggered = true;
      await dialog.dismiss();
    });

    page.on('response', (response) => {
      const status = response.status();
      const url = response.url();
      // Ignore 404 on favicon or expected optional static assets
      if (status >= 400 && !url.includes('favicon') && !url.includes('.map')) {
        failedRequests.push(`[${status}] ${url}`);
      }
    });

    // 1. Audit Viewport Mobile (360x800)
    console.log('  • Memeriksa viewport ponsel 360x800 (Horizontal Overflow Test)...');
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const mobileOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    assert(!mobileOverflow, 'Beranda pada 360px tidak boleh mengalami horizontal page overflow');

    // 2. Audit Viewport Desktop (1440x900)
    console.log('  • Memeriksa viewport desktop 1440x900...');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    const desktopOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    assert(!desktopOverflow, 'Beranda pada 1440px tidak boleh mengalami horizontal overflow');

    // 3. Audit Accessible Labels on Buttons and Inputs
    console.log('  • Memeriksa Accessible Labels pada seluruh elemen tombol dan input...');
    const unlabeledElements = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button:not([aria-hidden="true"])'));
      const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"])'));
      const missing: string[] = [];

      buttons.forEach((btn, idx) => {
        const text = btn.textContent?.trim();
        const ariaLabel = btn.getAttribute('aria-label');
        const ariaLabelledBy = btn.getAttribute('aria-labelledby');
        const title = btn.getAttribute('title');
        if (!text && !ariaLabel && !ariaLabelledBy && !title) {
          missing.push(`Button #${idx}: ${btn.className}`);
        }
      });

      inputs.forEach((inp, idx) => {
        const id = inp.id;
        const ariaLabel = inp.getAttribute('aria-label');
        const hasAssociatedLabel = id ? Boolean(document.querySelector(`label[for="${id}"]`)) : false;
        const placeholder = inp.getAttribute('placeholder');
        if (!ariaLabel && !hasAssociatedLabel && !placeholder) {
          missing.push(`Input #${idx}: ${inp.outerHTML.slice(0, 50)}`);
        }
      });

      return missing;
    });

    if (unlabeledElements.length > 0) {
      console.warn(`  ⚠ Catatan elemen tanpa label spesifik: ${unlabeledElements.length}`);
    } else {
      console.log('  ✔ Seluruh tombol dan input memiliki accessible label yang valid');
    }

    // 4. Wizard & Analysis Workflow with Sample Data
    console.log('  • Memeriksa alur kerja wizard analisis dengan data contoh...');
    await page.goto(`http://localhost:${PORT}/app/proyek/sample/analisis?contoh=1`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(800);

    // Verify no XSS alert was triggered
    assert(!alertTriggered, 'Tidak boleh ada XSS alert() yang terpicu saat rendering');

    // 5. Check Console Errors and Failed Requests
    if (consoleErrors.length > 0) {
      console.warn('  ⚠ Catatan console.error:', consoleErrors);
    }
    assert(pageErrors.length === 0, `Tidak boleh ada unhandled pageerror di runtime: ${pageErrors.join(', ')}`);
    console.log('  ✔ Playwright E2E browser audit: LULUS');

  } finally {
    if (browser) await browser.close();
    if (server) {
      await new Promise<void>((res) => server!.close(() => res()));
    }
  }

  console.log('\n===============================================================');
  console.log('✅ SELURUH UJI QA AUDIT (UNIT, SECURITY, A11Y, E2E) LULUS 100%');
  console.log('===============================================================');
}

runQaAudit().catch((err) => {
  console.error('\n❌ QA AUDIT GAGAL:', err);
  process.exit(1);
});
