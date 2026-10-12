import * as React from 'react';
import Link from 'next/link';
import { FileText, ShieldAlert, Scale, CheckCircle2 } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { COPY } from '@/lib/copy';
import { Badge } from '@/components/ui/badge';

export default function SyaratPage() {
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
          Syarat & Ketentuan Penggunaan {APP_NAME}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Harap membaca syarat dan ketentuan berikut secara saksama sebelum mengakses atau menggunakan platform {APP_NAME}. Dengan mendaftar atau menggunakan layanan, Anda menyetujui kewajiban etika dan batasan hukum berikut.
        </p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm sm:text-base text-foreground/90 leading-relaxed font-sans">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
            1. Definisi dan Ruang Lingkup Layanan
          </h2>
          <p>
            {APP_NAME} adalah perangkat lunak berbasis komputasi web yang dirancang khusus untuk memfasilitasi pengolahan data kuesioner skala Likert melalui formula statistik standar (seperti uji validitas, reliabilitas, uji asumsi klasik, dan regresi berganda) serta menyediakan draf kalimat interpretasi hasil pengolahan.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
            2. Tanggung Jawab & Integritas Akademik Peneliti
          </h2>
          <p>
            Pengguna adalah peneliti independen yang memikul tanggung jawab penuh secara akademik dan moral atas karya ilmiah yang disusun. Pengguna berjanji dan menjamin bahwa:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
            <li><strong className="text-foreground">Orisinalitas Data:</strong> Seluruh baris data yang diunggah ke platform bersumber dari instrumen kuesioner asli yang dibagikan secara sah kepada responden penelitian.</li>
            <li><strong className="text-foreground">Bebas Fabrikasi:</strong> Pengguna tidak menggunakan layanan ini untuk mengunggah data fiktif, data hasil rekayasa, atau manipulasi guna memaksakan signifikansi hipotesis.</li>
            <li><strong className="text-foreground">Verifikasi Mandiri:</strong> Pengguna wajib memvalidasi kembali kecocokan angka, tingkat signifikansi, dan narasi penjelasan dengan pedoman penulisan skripsi perguruan tinggi masing-masing.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
            3. Batasan Layanan dan Penafian (Disclaimer)
          </h2>
          <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-xs sm:text-sm">
            <p className="font-semibold text-foreground">
              PERHATIAN KHUSUS MENGENAI KELULUSAN DAN KEPUTUSAN SIDANG:
            </p>
            <p className="text-muted-foreground">
              {APP_NAME} merupakan sarana bantu pengolahan data statistik semata. {APP_NAME} tidak bertindak sebagai jasa pembuatan skripsi (joki), tidak menuliskan isi Bab 4 secara keseluruhan, dan sama sekali tidak menjamin kelulusan sidang ujian skripsi atau persetujuan dosen pembimbing.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
            4. Karakteristik Mesin Hitung & Narasi AI
          </h2>
          <p>
            Pengguna memahami bahwa platform membedakan secara tegas antara:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
            <li><strong className="text-foreground">Mesin Statistik:</strong> Menghasilkan nilai numerik eksak melalui algoritma deterministik matematis standar industri riset.</li>
            <li><strong className="text-foreground">Penjelasan AI:</strong> Berfungsi sebagai draf paragraf interpretasi bahasa Indonesia yang merujuk pada tabel hitung tersebut. AI tidak menciptakan fakta di luar angka tabel dan wajib ditinjau oleh peneliti sebelum disalin ke skripsi.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
            5. Akun, Hak Akses, dan Berlangganan
          </h2>
          <p>
            Pengguna bertanggung jawab menjaga kerahasiaan kredensial akun. Paket langganan berbayar memberikan hak pemakaian fitur sesuai batasan paket yang tertera pada halaman Harga. Pembayaran yang telah diproses tidak dapat dikembalikan setelah analisis berhasil dijalankan dan diunduh.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
            6. Hukum yang Mengatur
          </h2>
          <p>
            Syarat dan ketentuan ini diatur dan ditafsirkan berdasarkan hukum Negara Kesatuan Republik Indonesia. Setiap perselisihan yang timbul akan diupayakan diselesaikan terlebih dahulu melalui musyawarah untuk mufakat.
          </p>
        </section>
      </div>

      <div className="pt-6 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
        <Link href="/privasi" className="hover:text-foreground underline">
          ← Lihat Kebijakan Privasi
        </Link>
        <Link href="/" className="hover:text-foreground">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
