import * as React from 'react';
import Link from 'next/link';
import { Shield, Lock, Trash2, FileCheck, Info, CreditCard, Database, Cookie, Server } from 'lucide-react';
import { APP_NAME, BUILD_DATE } from '@/lib/constants';
import { COPY } from '@/lib/copy';
import { PLANS } from '@/lib/plans';
import { LEGAL_CONFIG } from '@/lib/legal-config';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/breadcrumb';
import { PageActions } from '@/components/page-actions';

export const metadata = {
  title: `Kebijakan Privasi Perlindungan Riset | ${APP_NAME}`,
  description: 'Kebijakan privasi OlahData menjamin keamanan dataset kuesioner responden. Admin hanya melihat metadata dan data riset tidak pernah dijual atau dimanipulasi.',
  openGraph: {
    title: `Kebijakan Privasi Perlindungan Riset | ${APP_NAME}`,
    description: 'Kebijakan privasi OlahData menjamin keamanan dataset kuesioner responden. Admin hanya melihat metadata dan data riset tidak pernah dijual atau dimanipulasi.',
    url: `${LEGAL_CONFIG.domain}/privasi`,
    siteName: APP_NAME,
    locale: 'id_ID',
    type: 'website',
  },
};

export default function PrivasiPage() {
  const freeRetention = PLANS.find((p) => p.id === 'free')?.retentionDays ?? 30;
  const monthlyRetention = PLANS.find((p) => p.id === 'monthly')?.retentionDays ?? 365;
  const thesisRetention = PLANS.find((p) => p.id === 'thesis')?.retentionDays ?? 730;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 space-y-10">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Kebijakan Privasi', href: '/privasi' }]} />

      {/* Header with Status Badge */}
      <div className="space-y-4 border-b border-border pb-8">
        <div className="flex items-center gap-2">
          <Badge variant="mint" className="text-xs font-semibold px-2.5 py-0.5">
            Kepatuhan UU PDP No. 27/2022
          </Badge>
          <span className="text-xs text-muted-foreground">
            Terakhir diperbarui: {LEGAL_CONFIG.effectiveDate}
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Kebijakan Privasi {APP_NAME}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-[70ch]">
          Dokumen ini menjabarkan komitmen {APP_NAME} dalam melindungi data pribadi pengguna dan menjaga kerahasiaan dataset responden survei penelitian skripsi Anda, sejalan dengan prinsip perlindungan data akademik dan Undang-Undang Perlindungan Data Pribadi (UU PDP).
        </p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm sm:text-base text-foreground/90 leading-relaxed font-sans">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
            1. Prinsip Utama Perlindungan Riset dan Data Responden
          </h2>
          <p>
            {APP_NAME} menyadari bahwa dataset kuesioner yang Anda unggah merupakan data berharga hasil kerja keras penelitian ilmiah. Prinsip dasar kami meliputi:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Hak Milik Eksklusif:</strong> Seluruh dataset dan luaran statistik sepenuhnya milik peneliti; kami tidak pernah mengklaim hak cipta atas data Anda.
            </li>
            <li>
              <strong className="text-foreground">Tanpa Fabrikasi atau Manipulasi:</strong> {APP_NAME} tidak pernah membuat, mengisi otomatis, mensimulasikan, atau mengubah data tanggapan responden survei Anda. Sistem hanya memproses data numerik mentah persis sesuai dengan berkas yang Anda unggah.
            </li>
            <li>
              <strong className="text-foreground">Akses Admin Terbatas (Hanya Metadata):</strong> Administrator sistem OlahData hanya dapat melihat metadata administratif (seperti stempel waktu proses, jumlah baris data, ukuran berkas, dan status komputasi). Administrator tidak pernah memiliki hak akses atau melihat isi data jawaban responden survei Anda.
            </li>
            <li>
              <strong className="text-foreground">Larangan Monetisasi:</strong> Kami tidak pernah menjual, menyewakan, atau membagikan data responden kepada pihak ketiga mana pun untuk tujuan periklanan atau komersial.
            </li>
            <li>
              <strong className="text-foreground">Bebas Pelatihan Model:</strong> Data kuesioner Anda tidak digunakan untuk melatih (train) model kecerdasan buatan publik.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
            2. Informasi yang Kami Kumpulkan
          </h2>
          <p>Kami hanya mengumpulkan data yang mutlak diperlukan untuk menyediakan layanan analisis statistik:</p>
          <div className="space-y-3 pt-1">
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-serif font-bold text-sm text-foreground">a. Informasi Akun Pengguna</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Nama lengkap, alamat surat elektronik (email), nama perguruan tinggi, dan kredensial kata sandi terenkripsi (salt dan hash) melalui Supabase Auth.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-serif font-bold text-sm text-foreground">b. Data Kuesioner dan Konfigurasi Proyek</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Tabel skor kuesioner (berformat .xlsx, .xls, .csv), label variabel/konstruk, serta pilihan uji statistik yang Anda konfigurasi.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-serif font-bold text-sm text-foreground">c. Status Langganan dan Daftar Tunggu</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Saat ini paket berbayar beroperasi dalam status pra-rilis beta (daftar tunggu/waitlist). Kami tidak memproses kartu kredit atau membebankan tagihan otomatis hingga gerbang pembayaran resmi diaktifkan.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-serif font-bold text-sm text-foreground">d. Cookie dan Analitik Penggunaan</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Cookie hanya digunakan untuk otentikasi sesi aktif dan preferensi tema tampilan (terang/gelap). Kami tidak melacak aktivitas penjelajahan di luar platform ini.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
            3. Pemrosesan Data, Sub-Prosesor, dan Keamanan Teknis
          </h2>
          <p>
            Seluruh transmisi data antara peramban web Anda dan peladen kami dilindungi protokol enkripsi mutakhir (TLS 1.3). Penyimpanan data dienkripsi dengan standar AES-256. Validasi data dan perhitungan statistik dieksekusi secara deterministik menggunakan mesin algoritma matematika baku guna menjamin kepastian numerik.
          </p>

          <div className="space-y-2.5 pt-2">
            <h3 className="font-semibold text-xs sm:text-sm text-foreground">Daftar Sub-Prosesor Pihak Ketiga:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {LEGAL_CONFIG.subprocessors.map((sub, idx) => (
                <div key={idx} className="rounded-lg border border-border bg-card p-3 space-y-1">
                  <div className="font-semibold text-xs text-foreground">{sub.name}</div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{sub.purpose}</p>
                  <div className="text-[10px] text-primary font-mono">{sub.location}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
            4. Anonimitas Responden Survei
          </h2>
          <p>
            Sesuai kode etik penelitian kuantitatif, kami sangat menyarankan pengguna untuk hanya mengunggah lembar tabulasi yang telah dianonimkan (tidak mencantumkan nama lengkap, nomor telepon, alamat rumah, atau identitas nomor induk kependudukan responden). {APP_NAME} memproses data semata-mata sebagai matriks numerik indeks tanggapan skala Likert.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
            5. Masa Retensi, Cadangan, dan Hak Penghapusan Data (Right to Erasure)
          </h2>
          <p>
            Masa penyimpanan data proyek dan dataset pada akun Anda diatur berdasarkan ketentuan konfigurasi paket aktif:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
            <li><strong className="text-foreground">Paket Coba Gratis:</strong> Disimpan selama {freeRetention} hari kalender.</li>
            <li><strong className="text-foreground">Paket Bulanan:</strong> Disimpan selama {monthlyRetention} hari kalender (1 tahun).</li>
            <li><strong className="text-foreground">Paket Skripsi:</strong> Disimpan selama {thesisRetention} hari kalender (2 tahun) untuk menjamin ketersediaan riwayat hingga sidang dan yudisium selesai.</li>
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Wilayah Server: {LEGAL_CONFIG.retentionPolicy.serverRegion}. Cadangan data: {LEGAL_CONFIG.retentionPolicy.backupSchedule}.
          </p>
          <p className="mt-3">
            Sesuai amanat Undang-Undang Perlindungan Data Pribadi (UU No. 27 Tahun 2022 / UU PDP), Anda memiliki hak mutlak untuk mengakses, memperbarui, mengekspor (portabilitas data), dan menghapus data proyek penelitian maupun seluruh akun Anda kapan saja melalui menu{' '}
            <Link href="/app/pengaturan" className="text-primary font-semibold underline">
              Pengaturan Akun dan Privasi
            </Link>.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
            6. Identitas Pengendali Data dan Kontak Layanan
          </h2>
          <p>
            Sesuai regulasi UU PDP, rincian identitas Pengendali Data Pribadi {APP_NAME} adalah sebagai berikut:
          </p>

          <div className="rounded-xl border border-primary/20 bg-muted/40 p-5 space-y-2.5 text-xs sm:text-sm">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-foreground min-w-[150px]">Nama Pengendali:</span>
              <span className="font-medium text-foreground">{LEGAL_CONFIG.companyName} ({LEGAL_CONFIG.operatorName})</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-foreground min-w-[150px]">Alamat Domisili:</span>
              <span className="font-medium text-foreground">{LEGAL_CONFIG.address}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-foreground min-w-[150px]">Surel Kontak DPO:</span>
              <span className="font-mono text-primary">{LEGAL_CONFIG.privacyEmail}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-foreground min-w-[150px]">Yurisdiksi dan Regulasi:</span>
              <span className="font-medium text-foreground">{LEGAL_CONFIG.jurisdiction}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Untuk keperluan surat verifikasi etika riset, kliring data kampus, atau permohonan pemusnahan data, hubungi kontak pengendali di atas.
          </p>
        </section>
      </div>

      {/* PageActions Navigasi Halaman */}
      <PageActions
        prevHref="/"
        prevLabel="Kembali ke Beranda"
        nextHref="/syarat"
        nextLabel="Lanjut ke Syarat & Ketentuan"
      />
    </div>
  );
}
