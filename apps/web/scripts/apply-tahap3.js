const fs = require('fs');
const path = require('path');

const webDir = path.join(__dirname, '..');

// =============================================================================
// 1. UPDATE src/lib/copy.ts
// =============================================================================
const copyPath = path.join(webDir, 'src', 'lib', 'copy.ts');
let copyContent = fs.readFileSync(copyPath, 'utf8');

// Replace SPSS claim with independent statistical libraries on reference data
copyContent = copyContent.replace(
  "subtitle: 'Angka dihitung deterministik dengan rumus baku skripsi Indonesia—hasil cocok 100% dengan SPSS & pustaka acuan. Data responden asli Anda tidak pernah kami ubah atau manipulasi.',",
  "subtitle: 'Angka dihitung deterministik dengan rumus baku skripsi Indonesia—angka dicocokkan dengan hitungan independen (pustaka statistik) pada data acuan. Data responden asli Anda tidak pernah kami ubah atau manipulasi.',"
);

copyContent = copyContent.replace(
  "ctaSecondary: 'Unggah berkas sendiri',",
  "ctaSecondary: 'Unggah data saya',"
);

copyContent = copyContent.replace(
  "microCopy: 'Hasil cocok SPSS • Data responden tidak pernah diubah • Tanpa daftar untuk data contoh',",
  "microCopy: 'Angka terverifikasi data acuan • Data responden tidak pernah diubah • Tanpa login untuk data contoh',"
);

copyContent = copyContent.replace(
  "a: `${APP_NAME} memakai rumus baku yang dapat dicek ulang di SPSS atau JASP. Setiap hasil dilengkapi Jejak Hitung (rumus formula, derajat kebebasan df, nilai kritis pembanding) serta dokumen Pernyataan Penggunaan Alat yang dapat Anda lampirkan ke naskah skripsi.`,",
  "a: `${APP_NAME} memakai rumus baku deterministik; angka dicocokkan dengan hitungan independen (pustaka statistik) pada data acuan. Setiap hasil dilengkapi Jejak Hitung (rumus formula, derajat kebebasan df, nilai kritis pembanding) serta dokumen Pernyataan Penggunaan Alat resmi. Pelajari metodologi lengkap pada halaman panduan kami.`,",
);

fs.writeFileSync(copyPath, copyContent, 'utf8');
console.log('✓ Updated src/lib/copy.ts');

// =============================================================================
// 2. UPDATE src/lib/plans.ts
// =============================================================================
const plansPath = path.join(webDir, 'src', 'lib', 'plans.ts');
let plansContent = fs.readFileSync(plansPath, 'utf8');

plansContent = plansContent.replace(
  "quotaRespondentsLabel: 'Responden tak terbatas (batas wajar)',",
  "quotaRespondentsLabel: 'Hingga 100.000 responden',"
);

plansContent = plansContent.replace(
  "'Responden tak terbatas (batas wajar)',\r\n      'Semua uji statistik lengkap',",
  "'Hingga 100.000 data responden',\r\n      'Semua uji statistik lengkap',"
);

plansContent = plansContent.replace(
  "quotaProjectsLabel: 'Proyek tak terbatas (batas wajar)',",
  "quotaProjectsLabel: '1 proyek aktif (penggunaan wajar)',"
);

plansContent = plansContent.replace(
  "'Proyek tak terbatas (batas wajar)',\r\n      'Responden tak terbatas (batas wajar)',",
  "'1 proyek aktif (penggunaan wajar)',\r\n      'Responden batas wajar',"
);

fs.writeFileSync(plansPath, plansContent, 'utf8');
console.log('✓ Updated src/lib/plans.ts');

// =============================================================================
// 3. UPDATE src/components/pricing-cards.tsx
// =============================================================================
const pricingCardsPath = path.join(webDir, 'src', 'components', 'pricing-cards.tsx');
let pcContent = fs.readFileSync(pricingCardsPath, 'utf8');

pcContent = pcContent.replace(
  'Fitur analisis statistik inti sudah dapat digunakan gratis. Sistem pembayaran otomatis untuk paket berbayar sedang dalam tahap aktivasi.',
  'Paket berbayar segera hadir. Masukkan surel untuk diberi tahu. Fitur analisis data inti dapat dicoba langsung gratis tanpa login.'
);

fs.writeFileSync(pricingCardsPath, pcContent, 'utf8');
console.log('✓ Updated src/components/pricing-cards.tsx');

// =============================================================================
// 4. UPDATE src/app/(marketing)/harga/page.tsx
// =============================================================================
const hargaPagePath = path.join(webDir, 'src', 'app', '(marketing)', 'harga', 'page.tsx');
let hargaContent = fs.readFileSync(hargaPagePath, 'utf8');

const oldFaqRegex = /const pricingFaq = \[[\s\S]*?\];/;
const newFaq = `const pricingFaq = [
    {
      q: 'Bagaimana cara memesan paket berbayar?',
      a: 'Paket berbayar segera hadir. Masukkan surel Anda pada tombol daftar tunggu untuk menerima pemberitahuan pertama saat sistem langganan dibuka.',
    },
    {
      q: 'Berapa batasan kuota responden pada setiap paket?',
      a: 'Paket Bulanan mendukung hingga 5 proyek dan 100.000 responden. Paket Skripsi mendukung 1 proyek aktif dengan responden batas wajar dan riwayat versi dataset.',
    },
    {
      q: 'Apakah data saya hilang jika masa aktif habis?',
      a: 'Data dan seluruh riwayat analisis Anda tetap tersimpan aman di akun Anda dan dapat Anda buka kembali kapan pun Anda memperbarui paket.',
    },
  ];`;

if (oldFaqRegex.test(hargaContent)) {
  hargaContent = hargaContent.replace(oldFaqRegex, newFaq);
  fs.writeFileSync(hargaPagePath, hargaContent, 'utf8');
  console.log('✓ Updated src/app/(marketing)/harga/page.tsx pricing FAQ');
}

// =============================================================================
// 5. UPDATE src/components/bab4-preview.tsx
// =============================================================================
const bab4PreviewPath = path.join(webDir, 'src', 'components', 'bab4-preview.tsx');
let bab4Content = fs.readFileSync(bab4PreviewPath, 'utf8');

// Fix row 50 hardcoded 'Signifikan' in copyWordTable
bab4Content = bab4Content.replace(
  `        r.tHitung !== undefined ? formatNumber(r.tHitung, 3) : '-',
        r.pValue !== undefined ? formatNumber(r.pValue, 3) : '-',
        'Signifikan',`,
  `        r.tHitung !== undefined ? formatNumber(r.tHitung, 3) : '-',
        r.pValue !== undefined ? formatNumber(r.pValue, 3) : '-',
        r.variable.toLowerCase().includes('konstanta') ? '-' : 'Signifikan',`
);

// If it's the simpler map:
bab4Content = bab4Content.replace(
  `        formatNumber(r.tHitung, 3),
        formatNumber(r.pValue, 3),
        'Signifikan',`,
  `        formatNumber(r.tHitung, 3),
        formatNumber(r.pValue, 3),
        r.variable.toLowerCase().includes('konstanta') ? '-' : 'Signifikan',`
);

// Fix Table rendering row: constant should NOT have 'Signifikan' badge
bab4Content = bab4Content.replace(
  `<td className="py-2 px-3 text-center whitespace-nowrap">
                          <span className="text-[11px] font-semibold text-[#0E4331] bg-[#BFEBD9] px-2 py-0.5 rounded-[4px]">
                            Signifikan
                          </span>
                        </td>`,
  `<td className="py-2 px-3 text-center whitespace-nowrap">
                          {row.variable.toLowerCase().includes('konstanta') ? (
                            <span className="text-muted-foreground font-mono">-</span>
                          ) : (
                            <span className="text-[11px] font-semibold text-[#0E4331] bg-[#BFEBD9] px-2 py-0.5 rounded-[4px]">
                              Signifikan
                            </span>
                          )}
                        </td>`
);

// Fix Sig = 0,000 -> p < 0,001
bab4Content = bab4Content.replace(
  'F Hitung = <strong>70,824</strong> (Sig = 0,000)',
  'F Hitung = <strong>70,824</strong> (Sig < 0,001)'
);

// Ensure variable naming consistency in Bab4Preview:
bab4Content = bab4Content.replace(
  "['Kualitas Layanan (X1)', '8', '0,874', '0,700', 'Reliabel'],\r\n        ['Kepuasan Pelanggan (Y)', '7', '0,852', '0,700', 'Reliabel'],",
  "['Kualitas Layanan (X1)', '8', '0,874', '0,700', 'Reliabel'],\r\n        ['Kepuasan Pelanggan (X2)', '7', '0,852', '0,700', 'Reliabel'],\r\n        ['Loyalitas Pelanggan (Y)', '6', '0,881', '0,700', 'Reliabel'],"
);

fs.writeFileSync(bab4PreviewPath, bab4Content, 'utf8');
console.log('✓ Updated src/components/bab4-preview.tsx (constant label, p < 0,001, and variable consistency)');
