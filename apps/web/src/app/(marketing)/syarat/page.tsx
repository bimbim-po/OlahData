import * as React from 'react';
import Link from 'next/link';
import { FileText, ShieldAlert, Scale, CheckCircle2, AlertTriangle, Mail } from 'lucide-react';
import { APP_NAME, BUILD_DATE } from '@/lib/constants';
import { COPY } from '@/lib/copy';
import { CONTACT_EMAIL } from '@/lib/plans';
import { LEGAL_CONFIG } from '@/lib/legal-config';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/breadcrumb';
import { PageActions } from '@/components/page-actions';

export const metadata = {
  title: `Syarat & Ketentuan Layanan | ${APP_NAME}`,
  description: 'Syarat dan ketentuan layanan OlahData untuk pengolahan data kuesioner skripsi kuantitatif. Menjunjung integritas akademik dan transparansi riset mahasiswa.',
  openGraph: {
    title: `Syarat & Ketentuan Layanan | ${APP_NAME}`,
    description: 'Syarat dan ketentuan layanan OlahData untuk pengolahan data kuesioner skripsi kuantitatif. Menjunjung integritas akademik dan transparansi riset mahasiswa.',
    url: `${LEGAL_CONFIG.domain}/syarat`,
    siteName: APP_NAME,
    locale: 'id_ID',
    type: 'website',
  },
};

export default function SyaratPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 space-y-10">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Syarat & Ketentuan', href: '/syarat' }]} />

      {/* Header with Status Badge */}
      <div className="space-y-4 border-b border-border pb-8">
        <div className="flex items-center gap-2">
          <Badge variant="mint" className="text-xs font-semibold px-2.5 py-0.5">
            Ketentuan Layanan Resmi
          </Badge>
          <span className="text-xs text-muted-foreground">
            Terakhir diperbarui: {LEGAL_CONFIG.effectiveDate}
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Syarat dan Ketentuan Penggunaan {APP_NAME}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-[70ch]">
          Harap membaca syarat dan ketentuan berikut secara saksama sebelum mengakses atau menggunakan platform {APP_NAME}. Dengan mendaftar atau menggunakan layanan, Anda menyetujui kewajiban etika riset dan batasan hukum berikut.
        </p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm sm:text-base text-foreground/90 leading-relaxed font-sans">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
            1. Definisi dan Ruang Lingkup Layanan
          </h2>
          <p>
            {APP_NAME} adalah perangkat lunak komputasi web yang dirancang khusus untuk memfasilitasi pengolahan data kuesioner skala Likert melalui formula statistik baku (mencakup uji validitas, reliabilitas, uji asumsi klasik, dan regresi linier berganda).
          </p>
          <p>
            {APP_NAME} menghitung angka dan menyusun draf interpretasi dari angka tersebut. Draf wajib Anda periksa dan tulis ulang dengan bahasa Anda sendiri sebelum dimasukkan ke dalam naskah skripsi.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
            2. Tanggung Jawab dan Integritas Akademik Peneliti
          </h2>
          <p>
            Pengguna adalah peneliti independen yang memikul tanggung jawab penuh secara akademik dan moral atas karya ilmiah yang disusun. Pengguna berjanji dan menjamin bahwa:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Orisinalitas Data:</strong> Seluruh baris data yang diunggah ke platform bersumber dari instrumen kuesioner asli yang dibagikan secara sah kepada responden penelitian.
            </li>
            <li>
              <strong className="text-foreground">Bebas Fabrikasi:</strong> Pengguna tidak menggunakan layanan ini untuk mengunggah data fiktif, data hasil rekayasa, atau manipulasi guna memaksakan signifikansi hipotesis. {APP_NAME} tidak menyediakan fitur apa pun untuk membuat, mengisi otomatis, atau mengubah tanggapan responden.
            </li>
            <li>
              <strong className="text-foreground">Verifikasi Mandiri:</strong> Pengguna wajib memvalidasi kembali kecocokan angka, tingkat signifikansi, dan narasi penjelasan dengan pedoman penulisan skripsi perguruan tinggi masing-masing.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
            3. Batasan Layanan dan Penafian (Disclaimer)
          </h2>
          <div className="rounded-xl border border-border bg-card p-5 space-y-2.5 text-xs sm:text-sm">
            <p className="font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>KOMITMEN KEJUJURAN ILMIAH dan BATASAN LAYANAN:</span>
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {APP_NAME} menghitung angka dan menyusun draf interpretasi dari angka tersebut. Draf wajib Anda periksa dan tulis ulang dengan bahasa Anda sendiri. {APP_NAME} merupakan sarana bantu kalkulasi statistik matematis, bukan jasa joki skripsi, dan tidak memberikan jaminan kelulusan sidang atau persetujuan dosen pembimbing.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
            4. Karakteristik Mesin Hitung dan Narasi AI
          </h2>
          <p>
            Pengguna memahami dan menyetujui pembagian kerja sistem dalam platform:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Mesin Statistik Deterministik:</strong> Angka-angka statistik dihitung secara pasti menggunakan rumus matematika baku (Python SciPy/NumPy/Statsmodels) yang dapat dicek ulang di SPSS atau JASP, bukan oleh kecerdasan buatan (AI).
            </li>
            <li>
              <strong className="text-foreground">Draf Interpretasi Berbantuan AI:</strong> Kalimat penjelasan interpretasi disusun dengan bantuan AI semata-mata dari angka tabel yang telah terhitung. AI tidak menciptakan angka atau asumsi baru, dan draf tersebut wajib Anda telaah secara kritis.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
            5. Akun, Hak Akses, dan Kebijakan Pengembalian Dana (Refund)
          </h2>
          <p>
            Pengguna bertanggung jawab menjaga kerahasiaan kredensial akun masing-masing. Hak akses fitur dan kuota proyek mengikuti ketentuan paket yang dipilih pada halaman Harga.
          </p>
          <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-xs sm:text-sm">
            <h3 className="font-semibold text-foreground">Kebijakan Pengembalian Dana (Refund):</h3>
            <p className="text-muted-foreground leading-relaxed">
              Pengembalian dana hanya dapat diajukan jika terjadi kegagalan teknis pada sistem yang menyebabkan proses analisis tidak dapat diselesaikan sama sekali. Pembayaran yang telah diproses <strong>tidak dapat dikembalikan</strong> apabila:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>
                <strong className="text-foreground">Analisis Berhasil:</strong> Kondisi ketika sistem telah menyelesaikan kalkulasi statistik dan menampilkan tabel hasil serta draf interpretasi pada antarmuka pengguna tanpa galat fatal sistem.
              </li>
              <li>
                <strong className="text-foreground">Diunduh:</strong> Kondisi ketika pengguna telah mengekspor berkas naskah (.docx / .pdf), menyalin tabel atau penjelasan ke papan klip (clipboard), atau memanfaatkan luaran hasil olah data.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 6 */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
            6. Hukum yang Mengatur dan Forum Penyelesaian Sengketa
          </h2>
          <p>
            Syarat dan ketentuan ini diatur dan ditafsirkan berdasarkan hukum Negara Kesatuan Republik Indonesia. Setiap perselisihan yang timbul dari atau sehubungan dengan penggunaan layanan akan diupayakan untuk diselesaikan secara musyawarah untuk mufakat terlebih dahulu.
          </p>

          <div className="rounded-xl border border-primary/20 bg-muted/40 p-5 space-y-2.5 text-xs sm:text-sm">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-foreground min-w-[150px]">Penyelenggara:</span>
              <span className="font-medium text-foreground">{LEGAL_CONFIG.companyName} ({LEGAL_CONFIG.operatorName})</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-foreground min-w-[150px]">Alamat Operasional:</span>
              <span className="font-medium text-foreground">{LEGAL_CONFIG.address}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-foreground min-w-[150px]">Surel Bantuan Hukum:</span>
              <span className="font-mono text-primary">{LEGAL_CONFIG.contactEmail}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-foreground min-w-[150px]">Yurisdiksi Sengketa:</span>
              <span className="font-medium text-foreground">{LEGAL_CONFIG.jurisdiction}</span>
            </div>
          </div>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
            7. Ketentuan Transisi Beta dan Daftar Tunggu (Tanpa Payment Gateway)
          </h2>
          <p>
            Saat ini, seluruh tingkatan paket berbayar beroperasi dalam status daftar tunggu (waitlist) beta. Platform tidak memproses transaksi pembayaran kartu kredit atau gateway otomatis secara sepihak. Pengguna dapat mendaftar daftar tunggu secara gratis dan admin dapat memberikan akses paket pengujian secara manual.
          </p>
        </section>
      </div>

      {/* PageActions Navigasi Halaman */}
      <PageActions
        prevHref="/privasi"
        prevLabel="Kembali ke Kebijakan Privasi"
        nextHref="/pernyataan-penggunaan"
        nextLabel="Lanjut ke Panduan Penggunaan"
      />
    </div>
  );
}
