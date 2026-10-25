/**
 * Konfigurasi Tunggal Kepemilikan, Kontak, dan Kepatuhan Hukum OlahData
 * Seluruh halaman legal (/privasi, /syarat, /pernyataan-penggunaan, /harga)
 * membaca data dari satu sumber konfigurasi ini untuk mencegah perbedaan informasi.
 */

export const LEGAL_CONFIG = {
  companyName: 'OlahData Indonesia',
  brandName: 'OlahData',
  operatorName: 'Pengelola OlahData',
  domain: 'https://olahdata.id',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || 'kontak@olahdata.id',
  supportEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || 'bantuan@olahdata.id',
  privacyEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || 'privasi@olahdata.id',
  jurisdiction: 'Republik Indonesia (UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi / PDP)',
  address: 'Jakarta, Indonesia',
  effectiveDate: '15 Oktober 2026',
  appVersion: '2.0.0',
  engineVersion: '2.0.0',
  subprocessors: [
    {
      name: 'Supabase Inc.',
      purpose: 'Penyimpanan basis data relasional PostgreSQL, manajemen sesi autentikasi, dan penyimpanan berkas terenkripsi.',
      location: 'Singapura (AWS Region ap-southeast-1)',
      retention: 'Sepanjang akun aktif atau hingga dihapus manual oleh pengguna.',
    },
    {
      name: 'Cloudflare, Inc.',
      purpose: 'Penyedia CDN, proteksi firewall DDoS, dan komputasi edge untuk aset statis Next.js.',
      location: 'Global Edge Anycast (termasuk PoP Jakarta)',
      retention: 'Cache sementara selama sesi transfer data.',
    },
    {
      name: 'Functional Software, Inc. (Sentry)',
      purpose: 'Pemantauan galat runtime aplikasi untuk perbaikan bug teknis, tanpa menyimpan data kuesioner responden.',
      location: 'Amerika Serikat (enkripsi transit TLS 1.3)',
      retention: 'Maksimal 30 hari untuk log galat teknis.',
    },
  ],
  retentionPolicy: {
    freeUserDays: 30,
    paidUserDays: 365,
    backupSchedule: 'Cadangan otomatis terenkripsi harian dengan retensi rotasi 7 hari.',
    serverRegion: 'Singapura (Asia Tenggara, AWS ap-southeast-1)',
    dataPurgeNote: 'Data kuesioner mentah dan derived dataset dihapus tuntas dari sistem saat pengguna menghapus proyek.',
  },
} as const;
