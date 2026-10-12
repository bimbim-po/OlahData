import * as React from 'react';
import Link from 'next/link';
import { Shield, Lock, Trash2, FileCheck, Info } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { COPY } from '@/lib/copy';
import { Badge } from '@/components/ui/badge';

export default function PrivasiPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 space-y-10">
      {/* Header with Draft Badge */}
      <div className="space-y-4 border-b border-border pb-8">
        <div className="flex items-center gap-2">
          <Badge variant="amber" className="text-xs font-semibold px-2.5 py-0.5">
            {COPY.badges.draft}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Terakhir diperbarui: 1 Oktober 2024
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Kebijakan Privasi {APP_NAME}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Dokumen ini menjabarkan komitmen {APP_NAME} dalam melindungi data pribadi pengguna dan menjaga kerahasiaan dataset responden survei penelitian skripsi Anda, sejalan dengan prinsip perlindungan data akademik dan Undang-Undang Perlindungan Data Pribadi (UU PDP).
        </p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm sm:text-base text-foreground/90 leading-relaxed font-sans">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
            1. Prinsip Utama Perlindungan Riset
          </h2>
          <p>
            {APP_NAME} menyadari bahwa dataset kuesioner yang Anda unggah merupakan data berharga hasil kerja keras penelitian ilmiah. Prinsip dasar kami meliputi:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
            <li><strong className="text-foreground">Hak Milik Eksklusif:</strong> Seluruh dataset dan luaran statistik sepenuhnya milik peneliti; kami tidak pernah mengklaim hak cipta atas data Anda.</li>
            <li><strong className="text-foreground">Larangan Monetisasi:</strong> Kami tidak pernah menjual, menyewakan, atau membagikan data responden kepada pihak ketiga mana pun untuk tujuan periklanan atau komersial.</li>
            <li><strong className="text-foreground">Bebas Pelatihan Model:</strong> Data kuesioner Anda tidak digunakan untuk melatih (train) model kecerdasan buatan publik.</li>
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
                Nama lengkap, alamat surat elektronik (email), nama perguruan tinggi, dan preferensi kata sandi terenkripsi (salt & hash).
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-serif font-bold text-sm text-foreground">b. Data Kuesioner & Konfigurasi Proyek</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Tabel skor kuesioner (berformat .xlsx, .xls, .csv), label variabel/konstruk, serta pilihan uji statistik yang Anda konfigurasi.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
            3. Pemrosesan Data & Keamanan Teknis
          </h2>
          <p>
            Seluruh transmisi data antara peramban web Anda dan peladen kami dilindungi protokol enkripsi mutakhir (TLS 1.3). Penyimpanan data dienkripsi dengan standar AES-256. Validasi data dan perhitungan statistik primer dioptimalkan sedemikian rupa guna meminimalkan eksposur transmisi yang tidak perlu.
          </p>
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
            5. Hak Penghapusan Data (Right to Erasure)
          </h2>
          <p>
            Anda memiliki hak mutlak untuk menghapus proyek penelitian, dataset terunggah, maupun akun Anda kapan saja melalui panel Pengaturan. Setelah dihapus oleh Anda, data akan terhapus secara permanen dari sistem aktif kami tanpa pencadangan residual.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
            6. Hubungi Kami
          </h2>
          <p>
            Jika Anda memiliki pertanyaan terkait privasi riset atau memerlukan surat verifikasi keamanan data untuk keperluan sidang etik universitas, silakan hubungi tim kami di{' '}
            <a href="mailto:privasi@olahdata.id" className="text-primary underline">
              privasi@olahdata.id
            </a>.
          </p>
        </section>
      </div>

      <div className="pt-6 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
        <Link href="/syarat" className="hover:text-foreground underline">
          Lihat Syarat & Ketentuan →
        </Link>
        <Link href="/" className="hover:text-foreground">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
