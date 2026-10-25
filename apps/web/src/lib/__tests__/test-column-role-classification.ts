import { detectColumnRole } from '../dataset-parser';
import { detectMetadataAndPiiColumns } from '../google-forms-recode';

async function runRoleClassificationTests() {
  console.log('====================================================================');
  console.log(' TEST SUITE: AI COLUMN ROLE CLASSIFICATION');
  console.log(' Memisahkan ID Responden, Pertanyaan Terbuka, Demografi, & Instrumen');
  console.log('====================================================================\n');

  let passed = 0;
  let total = 0;

  function assertRole(colName: string, values: unknown[], expected: string, description: string) {
    total++;
    const role = detectColumnRole(colName, values);
    if (role === expected) {
      console.log(`  [PASS] ${description}: '${colName}' -> '${role}'`);
      passed++;
    } else {
      console.error(`  [FAIL] ${description}: '${colName}' diharapkan '${expected}', tetapi terdeteksi '${role}'`);
      process.exitCode = 1;
    }
  }

  // 1. KASUS UTAMA DARI SCREENSHOT PENGGUNA
  console.log('--- 1. Kolom Persis Sesuai Screenshot Pengguna ---');
  assertRole(
    'No',
    [1, 2, 3, 4, 5],
    'id',
    'Nomor urut'
  );

  assertRole(
    'Timestamp',
    ['2026/10/21 10:30:15 PM', '2026/10/21 10:31:00 PM', '2026/10/21 10:32:45 PM'],
    'ignored',
    'Cap Waktu Google Forms (tidak boleh terdeteksi sebagai Pertanyaan Terbuka)'
  );

  assertRole(
    'Score',
    [80, 90, 85, 70, 95],
    'ignored',
    'Skor kontinu kuis'
  );

  assertRole(
    'Email',
    ['budi.santoso@students.ac.id', 'siti.nurhaliza.safitri@students.ac.id'],
    'ignored',
    'Email responden (PII, tidak boleh terdeteksi sebagai Pertanyaan Terbuka)'
  );

  assertRole(
    'Nama Lengkap',
    ['Muhammad Rizky Pratama', 'Siti Nurhaliza Safitri', 'Budi Santoso'],
    'ignored',
    'Nama Lengkap responden (PII, tidak boleh terdeteksi sebagai Pertanyaan Terbuka)'
  );

  assertRole(
    'NIM',
    ['20210801001', '20210801002', '20210801003', '20210801004'],
    'id',
    'NIM Responden'
  );

  assertRole(
    'Program Studi',
    ['Sistem Informasi', 'Teknik Informatika', 'Sistem Informasi'],
    'demographic',
    'Program Studi'
  );

  assertRole(
    'P1',
    [4, 5, 4, 3, 5],
    'item',
    'Butir instrumen P1'
  );

  assertRole(
    'P2',
    [5, 4, 4, 5, 4],
    'item',
    'Butir instrumen P2'
  );

  assertRole(
    'P3',
    [4, 4, 5, 4, 5],
    'item',
    'Butir instrumen P3'
  );

  // 2. DEMOGRAFI RESPONDEN
  console.log('\n--- 2. Klasifikasi Demografi Responden ---');
  assertRole(
    'Jenis Kelamin',
    ['Laki-laki', 'Perempuan', 'Laki-laki', 'Perempuan'],
    'demographic',
    'Jenis Kelamin'
  );

  assertRole(
    'Usia',
    [21, 22, 23, 21, 20],
    'demographic',
    'Usia responden'
  );

  assertRole(
    'Pekerjaan',
    ['Karyawan Swasta', 'PNS', 'Wiraswasta', 'Mahasiswa'],
    'demographic',
    'Pekerjaan'
  );

  assertRole(
    'Penghasilan',
    ['Rp 3.000.000 - Rp 5.000.000', '> Rp 5.000.000'],
    'demographic',
    'Penghasilan'
  );

  assertRole(
    'Fakultas',
    ['Fakultas Ilmu Komputer', 'Fakultas Ekonomi dan Bisnis'],
    'demographic',
    'Fakultas'
  );

  // 3. BUTIR INSTRUMEN PENELITIAN (LIKERT)
  console.log('\n--- 3. Klasifikasi Butir Instrumen Penelitian ---');
  assertRole(
    'X1_1',
    [4, 5, 4, 5, 3],
    'item',
    'Kode indikator X1_1'
  );

  assertRole(
    'Y1',
    [5, 4, 5, 4, 5],
    'item',
    'Kode variabel terikat Y1'
  );

  assertRole(
    'KL1',
    [3, 4, 4, 5, 4],
    'item',
    'Kode konstruk KL1'
  );

  assertRole(
    'Item_Kepuasan_1',
    ['Sangat Setuju', 'Setuju', 'Sangat Setuju', 'Netral'],
    'item',
    'Butir dengan teks jawaban skala Likert'
  );

  // 4. PERTANYAAN TERBUKA (KUALITATIF / SARAN / MASUKAN)
  console.log('\n--- 4. Klasifikasi Pertanyaan Terbuka ---');
  assertRole(
    'Saran',
    ['Mohon antrean loket kasir dipercepat saat jam makan siang', 'Fasilitas pendingin ruangan sudah memadai'],
    'open_question',
    'Kolom Saran naratif'
  );

  assertRole(
    'Kritik & Masukan',
    ['Aplikasi sering logout sendiri saat koneksi tidak stabil', 'Semoga ditambah metode pembayaran QRIS'],
    'open_question',
    'Kolom Kritik & Masukan'
  );

  assertRole(
    'Alasan Memilih Produk Ini',
    ['Karena harganya terjangkau dan kualitas bahan sangat baik', 'Rekomendasi dari keluarga dekat'],
    'open_question',
    'Kolom Alasan responden'
  );

  assertRole(
    'Apa kendala yang Anda hadapi?',
    ['Waktu tunggu proses verifikasi akun agak lama', 'Belum menemukan kendala berarti'],
    'open_question',
    'Pertanyaan terbuka diawali kata tanya'
  );

  // 5. TEST DETECT METADATA AND PII HELPER
  console.log('\n--- 5. Pengujian Google Forms Recode Helper ---');
  const helperResults = detectMetadataAndPiiColumns([
    'Timestamp',
    'Nama Lengkap',
    'Email',
    'NIM',
    'No',
    'No HP',
    'Score',
  ]);

  const piiMap = new Map(helperResults.map((r) => [r.column, r.role]));
  total += 4;
  if (piiMap.get('Timestamp') === 'ignored') {
    console.log("  [PASS] Helper: 'Timestamp' terdeteksi 'ignored'");
    passed++;
  } else {
    console.error(`  [FAIL] Helper: 'Timestamp' terdeteksi '${piiMap.get('Timestamp')}'`);
    process.exitCode = 1;
  }

  if (piiMap.get('Nama Lengkap') === 'ignored' && piiMap.get('Email') === 'ignored') {
    console.log("  [PASS] Helper: 'Nama Lengkap' & 'Email' terdeteksi 'ignored'");
    passed++;
  } else {
    console.error("  [FAIL] Helper: Nama/Email gagal diabaikan");
    process.exitCode = 1;
  }

  if (piiMap.get('NIM') === 'id' && piiMap.get('No') === 'id') {
    console.log("  [PASS] Helper: 'NIM' & 'No' terdeteksi sebagai 'id'");
    passed++;
  } else {
    console.error(`  [FAIL] Helper: NIM (${piiMap.get('NIM')}) atau No (${piiMap.get('No')}) bukan 'id'`);
    process.exitCode = 1;
  }

  if (piiMap.get('Score') === 'ignored') {
    console.log("  [PASS] Helper: 'Score' terdeteksi 'ignored'");
    passed++;
  } else {
    console.error(`  [FAIL] Helper: 'Score' terdeteksi '${piiMap.get('Score')}'`);
    process.exitCode = 1;
  }

  console.log('\n====================================================================');
  console.log(` HASIL PENGUJIAN: ${passed} dari ${total} pengujian lulus!`);
  console.log('====================================================================\n');
}

runRoleClassificationTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
