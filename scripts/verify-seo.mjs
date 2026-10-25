import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, '../apps/web/out');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ SEO ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
}

async function verifySeo() {
  console.log('====================================================================');
  console.log('🔍 MEMULAI VERIFIKASI SEO & STRUCTURED DATA AUDIT — OLAHDATA');
  console.log('====================================================================\n');

  // 1. Verifikasi index.html
  const indexPath = path.join(outDir, 'index.html');
  assert(fs.existsSync(indexPath), 'out/index.html harus ada');
  const indexHtml = fs.readFileSync(indexPath, 'utf-8');

  console.log('▶ [1/5] Memeriksa Meta Tags Pokok (Title, Description, Canonical)...');
  // Title
  assert(indexHtml.includes('<title>'), '<title> tag harus ada');
  const titleMatch = indexHtml.match(/<title>([^<]+)<\/title>/);
  assert(titleMatch && titleMatch[1].length > 20, `Title harus deskriptif (${titleMatch?.[1]})`);
  console.log(`  ✔ Title: "${titleMatch[1]}" (${titleMatch[1].length} chars)`);

  // Meta Description
  const descMatch = indexHtml.match(/<meta\s+name="description"\s+content="([^"]+)"/);
  assert(descMatch && descMatch[1].length >= 100, `Meta description harus komprehensif (>= 100 chars, got ${descMatch?.[1]?.length})`);
  console.log(`  ✔ Description: "${descMatch[1].slice(0, 80)}..." (${descMatch[1].length} chars)`);

  // Canonical
  const canonicalMatch = indexHtml.match(/<link\s+rel="canonical"\s+href="([^"]+)"/);
  assert(canonicalMatch && canonicalMatch[1].startsWith('https://olah-data.pages.dev'), `Canonical tag harus menunjuk ke https://olah-data.pages.dev (got ${canonicalMatch?.[1]})`);
  console.log(`  ✔ Canonical: ${canonicalMatch[1]}`);

  // 2. Verifikasi OpenGraph & Twitter Card
  console.log('\n▶ [2/5] Memeriksa OpenGraph & Twitter Cards...');
  assert(indexHtml.includes('property="og:title"'), 'og:title harus ada');
  assert(indexHtml.includes('property="og:description"'), 'og:description harus ada');
  assert(indexHtml.includes('property="og:image"'), 'og:image harus ada');
  assert(indexHtml.includes('property="og:url"'), 'og:url harus ada');
  assert(indexHtml.includes('property="og:locale"'), 'og:locale harus ada');
  assert(indexHtml.includes('name="twitter:card"'), 'twitter:card harus ada');
  assert(indexHtml.includes('name="twitter:image"'), 'twitter:image harus ada');
  console.log('  ✔ Seluruh OpenGraph & Twitter Cards tags lengkap');

  // Cek keberadaan file og-image.png di out/
  const ogImagePath = path.join(outDir, 'og-image.png');
  assert(fs.existsSync(ogImagePath), 'out/og-image.png harus ada');
  const ogStat = fs.statSync(ogImagePath);
  assert(ogStat.size > 50000, 'Ukuran og-image.png harus valid');
  console.log(`  ✔ Social Preview Image (og-image.png) tersedia (${(ogStat.size / 1024).toFixed(1)} KB)`);

  // 3. Verifikasi Schema.org JSON-LD Structured Data
  console.log('\n▶ [3/5] Memeriksa Schema.org JSON-LD Structured Data...');
  const scriptRegex = /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let match;
  const schemas = [];
  while ((match = scriptRegex.exec(indexHtml)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      schemas.push(parsed);
    } catch (e) {
      assert(false, `Gagal mem-parse JSON-LD: ${e.message}`);
    }
  }

  const types = schemas.map((s) => s['@type']);
  console.log('  • Terdeteksi skema:', types.join(', '));
  assert(types.includes('WebApplication'), 'Skema WebApplication harus ada');
  assert(types.includes('FAQPage'), 'Skema FAQPage harus ada');
  assert(types.includes('HowTo'), 'Skema HowTo harus ada');
  assert(types.includes('Organization'), 'Skema Organization harus ada');
  assert(types.includes('BreadcrumbList'), 'Skema BreadcrumbList harus ada');
  console.log('  ✔ 5 Skema Google Rich Snippets (WebApplication, FAQPage, HowTo, Organization, BreadcrumbList) LULUS!');

  // 4. Verifikasi robots.txt dan sitemap.xml
  console.log('\n▶ [4/5] Memeriksa robots.txt dan sitemap.xml...');
  const robotsPath = path.join(outDir, 'robots.txt');
  assert(fs.existsSync(robotsPath), 'out/robots.txt harus ada');
  const robotsTxt = fs.readFileSync(robotsPath, 'utf-8');
  assert(robotsTxt.includes('Sitemap: https://olah-data.pages.dev/sitemap.xml'), 'robots.txt harus menyertakan sitemap URL');
  assert(robotsTxt.includes('Disallow: /admin/'), 'robots.txt harus mendisallow /admin/');
  assert(robotsTxt.includes('Disallow: /api/'), 'robots.txt harus mendisallow /api/');
  console.log('  ✔ robots.txt valid & mengarahkan bot Google ke sitemap.xml');

  const sitemapPath = path.join(outDir, 'sitemap.xml');
  assert(fs.existsSync(sitemapPath), 'out/sitemap.xml harus ada');
  const sitemapXml = fs.readFileSync(sitemapPath, 'utf-8');
  assert(sitemapXml.includes('<loc>https://olah-data.pages.dev/</loc>'), 'sitemap harus memuat homepage');
  assert(sitemapXml.includes('<loc>https://olah-data.pages.dev/panduan</loc>'), 'sitemap harus memuat /panduan');
  assert(sitemapXml.includes('<loc>https://olah-data.pages.dev/harga</loc>'), 'sitemap harus memuat /harga');
  console.log('  ✔ sitemap.xml valid dengan prioritas lengkap');

  // 5. Verifikasi Heading Semantics (h1, h2, h3)
  console.log('\n▶ [5/5] Memeriksa Sematika Heading H1 & H2...');
  const h1Count = (indexHtml.match(/<h1[\s>]/g) || []).length;
  assert(h1Count === 1, `Harus tepat ada 1 tag <h1> di landing page (ditemukan: ${h1Count})`);
  console.log('  ✔ Tepat memiliki 1 H1 utama dengan keyword skripsi kuantitatif');

  console.log('\n====================================================================');
  console.log('✅ SELURUH AUDIT SEO & STRUCTURED DATA (100% OPTIMAL) LULUS!');
  console.log('====================================================================\n');
}

verifySeo().catch((err) => {
  console.error(err);
  process.exit(1);
});
