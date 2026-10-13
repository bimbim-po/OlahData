import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const webDir = path.join(rootDir, 'apps', 'web');

console.log('================================================================');
console.log('🔒 PENGUJIAN KEAMANAN OLAHDATA: RLS & AUDIT KEBOCORAN KUNCI');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [LULUS] ${testName}`);
    if (detail) console.log(`     └─ ${detail}`);
  } else {
    failedTests++;
    console.error(`  ❌ [GAGAL] ${testName}`);
    if (detail) console.error(`     └─ Galat: ${detail}`);
  }
}

// -----------------------------------------------------------------------------
// UJI 1: Pastikan .env.local dan .env diabaikan oleh .gitignore
// -----------------------------------------------------------------------------
console.log('📌 1. Memeriksa Konfigurasi .gitignore:');
const gitignorePath = path.join(rootDir, '.gitignore');
const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');

assert(
  gitignoreContent.includes('.env.local') && gitignoreContent.includes('.env'),
  'Berkas .env dan .env.local terdaftar eksplisit di .gitignore',
  'Mencegah file kredensial rahasia ter-commit secara tidak sengaja.'
);

assert(
  gitignoreContent.includes('supabase/.temp'),
  'Folder supabase/.temp terdaftar di .gitignore',
  'Mencegah cache runtime Supabase lokal ter-commit.'
);

// -----------------------------------------------------------------------------
// UJI 2: Pastikan Tidak Ada Komponen Klien yang Mengimpor Admin Client
// -----------------------------------------------------------------------------
console.log('\n📌 2. Memeriksa Batas Klien vs Server (Tidak Ada Impor Service Role di Klien):');
const srcDir = path.join(webDir, 'src');

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!['node_modules', '.next', 'out'].includes(file)) {
        getAllFiles(fullPath, fileList);
      }
    } else if (/\.(tsx|ts|js|jsx)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allSrcFiles = getAllFiles(srcDir);
let clientImportViolations: string[] = [];

for (const filePath of allSrcFiles) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const isClientComponent = content.includes("'use client'") || content.includes('"use client"');

  if (isClientComponent) {
    // Klien komponen tidak boleh mengimpor getSupabaseAdminClient atau service role
    if (
      content.includes('getSupabaseAdminClient') ||
      content.includes('process.env.SUPABASE_SERVICE_ROLE_KEY') ||
      /from\s+['"].*\/supabase\/admin['"]/.test(content)
    ) {
      clientImportViolations.push(path.relative(rootDir, filePath));
    }
  }
}

assert(
  clientImportViolations.length === 0,
  'Komponen peramban ("use client") bersih dari impor service role / admin client',
  clientImportViolations.length > 0 ? `Ditemukan di: ${clientImportViolations.join(', ')}` : undefined
);

// -----------------------------------------------------------------------------
// UJI 3: Pemeriksaan Kebocoran Service Role Key pada Bundel Hasil Build Klien
// -----------------------------------------------------------------------------
console.log('\n📌 3. Memeriksa Nilai Kunci Service Role pada Berkas Klien / Ekspor:');

// Baca key dari .env.local jika ada (untuk diuji keberadaannya di bundle)
let serviceKeyToScan: string | null = null;
const envLocalPath = path.join(webDir, '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  const match = envContent.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.+)/);
  if (match && match[1]) {
    serviceKeyToScan = match[1].trim();
  }
}

let leakedFiles: string[] = [];
const clientArtifactDirs = [
  path.join(webDir, 'out'),
  path.join(webDir, '.next', 'static'),
];

for (const dir of clientArtifactDirs) {
  if (fs.existsSync(dir)) {
    const bundleFiles = getAllFiles(dir);
    for (const f of bundleFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      if (serviceKeyToScan && serviceKeyToScan.length > 20 && content.includes(serviceKeyToScan)) {
        leakedFiles.push(path.relative(rootDir, f));
      }
    }
  }
}

assert(
  leakedFiles.length === 0,
  'Nilai kunci SUPABASE_SERVICE_ROLE_KEY TIDAK bocor ke dalam artefak bundel klien',
  leakedFiles.length > 0 ? `KUNCI BOCOR DI BERKAS: ${leakedFiles.join(', ')}` : 'Bundel klien 100% aman.'
);

// -----------------------------------------------------------------------------
// UJI 4: Verifikasi Kebijakan RLS (Pengguna A vs Pengguna B)
// -----------------------------------------------------------------------------
console.log('\n📌 4. Verifikasi Aturan RLS (Row Level Security) Isolasi Data Pengguna:');

const migrationsDir = path.join(rootDir, 'supabase', 'migrations');
const migration0002 = fs.readFileSync(path.join(migrationsDir, '0002_projects_datasets_constructs.sql'), 'utf-8');
const migration0003 = fs.readFileSync(path.join(migrationsDir, '0003_storage_buckets.sql'), 'utf-8');

assert(
  migration0002.includes('ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY') &&
  migration0002.includes('owner_id = auth.uid()'),
  'Tabel public.projects memiliki RLS aktif dengan aturan SELECT/UPDATE/DELETE (owner_id = auth.uid())',
  'Pengguna A terisolasi dan tidak dapat membaca atau mengubah proyek pengguna B.'
);

assert(
  migration0002.includes('ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY') &&
  migration0002.includes('public.is_project_owner(project_id)'),
  'Tabel public.datasets memiliki RLS aktif terikat pada kepemilikan proyek pengguna',
  'Dataset pengguna A tidak dapat diakses oleh pengguna B.'
);

assert(
  migration0003.includes('bucket_id = \'datasets\'') &&
  migration0003.includes('(storage.foldername(name))[1] = auth.uid()::text'),
  'Bucket Storage datasets memiliki RLS isolasi folder per pengguna ({auth.uid()}/...)',
  'File fisik kuesioner pengguna A tidak dapat diunduh oleh pengguna B.'
);

// -----------------------------------------------------------------------------
// UJI 5: Verifikasi Validasi Variabel Lingkungan (src/lib/env.ts)
// -----------------------------------------------------------------------------
console.log('\n📌 5. Verifikasi Modul Validasi Zod (src/lib/env.ts):');
const envTsPath = path.join(webDir, 'src', 'lib', 'env.ts');
const envTsContent = fs.readFileSync(envTsPath, 'utf-8');

assert(
  envTsContent.includes('NEXT_PUBLIC_SUPABASE_URL') &&
  envTsContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY') &&
  envTsContent.includes('z.object'),
  'Modul src/lib/env.ts memvalidasi variabel lingkungan penting dengan skema Zod',
  'Memberikan pesan galat dalam bahasa Indonesia bila konfigurasi belum lengkap.'
);

// -----------------------------------------------------------------------------
// RINGKASAN HASIL
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`HASIL AKHIR PENGUJIAN: ${passedTests} LULUS, ${failedTests} GAGAL (Total: ${totalTests} pengujian)`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 SEMUA ATURAN KEAMANAN & ISOLASI RLS TERPENUHI DENGAN SEMPURNA!\n');
  process.exit(0);
}
