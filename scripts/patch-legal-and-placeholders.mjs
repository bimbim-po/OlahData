import fs from 'fs';
import path from 'path';

const root = path.resolve('C:/Users/ThinkPad X1 Yoga/.gemini/antigravity/scratch/olahdata');

// 1. Patch apps/web/src/lib/copy.ts
{
  const p = path.join(root, 'apps/web/src/lib/copy.ts');
  let content = fs.readFileSync(p, 'utf8');
  
  const targetPattern = /template:\s*`PERNYATAAN PENGGUNAAN PERANGKAT LUNAK[\s\S]*?`,\s*},/;
  const replacement = `template: \`PERNYATAAN PENGGUNAAN PERANGKAT LUNAK & INTEGRITAS RISET ILMIAH

Judul Penelitian : Pengaruh Kualitas Layanan dan Kepuasan terhadap Loyalitas Pelanggan
Nama Peneliti    : Peneliti / Mahasiswa Penyusun Skripsi
NIM / NRP        : Nomor Pokok Mahasiswa
Program Studi    : Program Studi dan Fakultas Terkait
Perguruan Tinggi : Nama Perguruan Tinggi / Universitas
Dosen Pembimbing : Dosen Pembimbing Utama dan Pendamping

Dengan ini peneliti menyatakan secara terbuka dan jujur bahwa:
1. Orisinalitas Data: Seluruh data numerik yang dianalisis bersumber murni dari jawaban responden asli kuesioner penelitian tanpa manipulasi, pengisian otomatis, atau fabrikasi data.
2. Komputasi Deterministik: Kalkulasi statistik (Validitas Pearson, Reliabilitas Cronbach's Alpha, Asumsi Klasik, dan Regresi Linier Berganda) diproses secara deterministik menggunakan mesin statistik \${APP_NAME} (versi 2.0.0) berbasis modul komputasi ilmiah baku (SciPy, statsmodels, dan NumPy).
3. Transparansi AI: Draf interpretasi teks disusun dengan bantuan modul perumusan narasi kaidah Bab 4 terverifikasi (number guard) dan telah saya periksa, cermati, serta tuliskan kembali menggunakan pemahaman mandiri saya sebagai peneliti.
4. Lampiran Jejak Hitung: Seluruh nilai tabel r, t, dan F serta jejak verifikasi dataset dilampirkan secara transparan pada Lampiran Hasil Analisis Statistik.\`,
  },`;

  if (targetPattern.test(content)) {
    content = content.replace(targetPattern, replacement);
    fs.writeFileSync(p, content, 'utf8');
    console.log('✓ apps/web/src/lib/copy.ts patched successfully');
  } else {
    console.warn('! target pattern not found in copy.ts');
  }
}

// 2. Patch apps/web/src/app/(marketing)/pernyataan-penggunaan/page.tsx
{
  const p = path.join(root, 'apps/web/src/app/(marketing)/pernyataan-penggunaan/page.tsx');
  let content = fs.readFileSync(p, 'utf8');
  
  content = content.replace(
    /Tip: Ganti <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">\[NOMOR LAMPIRAN\]<\/code> dengan nomor lampiran aktual di naskah skripsi Anda \(misalnya: Lampiran 4 atau Lampiran C\)\./,
    'Tip: Sesuaikan nomor lampiran dan identitas penelitian Anda dengan buku pedoman penulisan skripsi perguruan tinggi Anda.'
  );

  fs.writeFileSync(p, content, 'utf8');
  console.log('✓ apps/web/src/app/(marketing)/pernyataan-penggunaan/page.tsx patched successfully');
}

// 3. Patch apps/web/src/app/app/bantuan/page.tsx
{
  const p = path.join(root, 'apps/web/src/app/app/bantuan/page.tsx');
  let content = fs.readFileSync(p, 'utf8');
  
  content = content.replace(
    "const isContactConfigured = SUPPORT_EMAIL && SUPPORT_EMAIL !== '[ISI OLEH PEMILIK]';",
    'const isContactConfigured = Boolean(SUPPORT_EMAIL);'
  );
  content = content.replace(
    '[Tuliskan deskripsi masalah Anda di sini]',
    'Saya ingin berkonsultasi mengenai kendala pengolahan data kuesioner skripsi saya.'
  );

  fs.writeFileSync(p, content, 'utf8');
  console.log('✓ apps/web/src/app/app/bantuan/page.tsx patched successfully');
}
