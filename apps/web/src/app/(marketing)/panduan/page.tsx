'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Upload,
  CheckCircle2,
  GitBranch,
  BarChart3,
  FileText,
  FileSpreadsheet,
  Download,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Workflow,
  BookOpen,
  Info,
  ChevronDown,
} from 'lucide-react';
import { APP_NAME, APP_VERSION } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumb } from '@/components/breadcrumb';
import { PageActions } from '@/components/page-actions';

interface AccordionItemProps {
  question: string;
  answer: React.ReactNode;
}

function AccordionItem({ question, answer }: AccordionItemProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-colors">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
      >
        <span>{question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
          aria-hidden="true"
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/50">
          <div className="pt-3 space-y-2">{answer}</div>
        </div>
      )}
    </div>
  );
}

export default function PanduanPenggunaanPage() {
  const wizardSteps = [
    {
      step: '1',
      title: 'Unggah Berkas Tabulasi Kuesioner',
      icon: Upload,
      description:
        'Unggah lembar respons kuesioner dalam format Excel (.xlsx, .xls) atau CSV. Setiap baris mewakili 1 responden dan setiap kolom mewakili butir pertanyaan atau skor total indikator.',
      tips: 'Pastikan baris pertama berisi kode butir (misal: X1.1, X1.2, Y1.1) tanpa baris kosong di atasnya.',
    },
    {
      step: '2',
      title: 'Validasi Data Otomatis & Pembersihan',
      icon: CheckCircle2,
      description:
        'Sistem memeriksa kelengkapan data responden: mendeteksi baris dengan respons kosong (missing values), varians nol (jawaban lurus tanpa variasi), dan skor di luar rentang skala Likert.',
      tips: 'Anda dapat mengecualikan responden yang tidak lengkap dengan 1 klik tanpa mengubah berkas Excel asli Anda.',
    },
    {
      step: '3',
      title: 'Petakan Variabel Bebas & Terikat',
      icon: GitBranch,
      description:
        'Kelompokkan butir-butir pertanyaan ke dalam konstruk penelitian Anda (misalnya Variabel Bebas X1: Kualitas Layanan, X2: Kepercayaan, dan Variabel Terikat Y: Kepuasan).',
      tips: 'Beri label nama variabel yang jelas agar judul tabel dan narasi Bab 4 langsung mencerminkan topik skripsi Anda.',
    },
    {
      step: '4',
      title: 'Pilih Metode Uji Statistik',
      icon: BarChart3,
      description:
        'Centang uji yang disyaratkan oleh dosen pembimbing: Statistik Deskriptif, Uji Validitas (Pearson), Uji Reliabilitas (Cronbach’s Alpha), Uji Asumsi Klasik (Normalitas, Multikolinearitas, Heteroskedastisitas), serta Regresi Linier.',
      tips: 'Sistem memberikan rekomendasi otomatis sesuai susunan hipotesis penelitian Anda.',
    },
    {
      step: '5',
      title: 'Peroleh Hasil Tabel Bab 4 & Jejak Hitung',
      icon: FileText,
      description:
        'Dapatkan tabel ilmiah standar APA 7th Edition tanpa garis vertikal, draf interpretasi naratif bahasa Indonesia, dan Jejak Hitung matematis yang menjamin transparansi di hadapan dewan penguji.',
      tips: 'Salin langsung ke naskah Word atau ekspor naskah Bab 4 lengkap beserta draf pernyataan penggunaan alat.',
    },
  ];

  const glossaryItems = [
    {
      term: 'Validitas (Pearson Product Moment)',
      rule: 'r-hitung > r-tabel (atau Sig. < 0,05)',
      desc: 'Menguji apakah setiap butir pertanyaan kuesioner benar-benar mengukur konstruk yang hendak diukur. Butir dengan r-hitung di bawah r-tabel dinyatakan gugur (drop) dan tidak diikutsertakan dalam skor total variabel.',
    },
    {
      term: 'Reliabilitas (Cronbach’s Alpha)',
      rule: 'Alpha > 0,70 (standar kuat) atau > 0,60',
      desc: 'Mengukur keandalan dan konsistensi internal kuesioner. Jika seluruh butir dalam satu variabel menghasilkan Alpha di atas ambang batas, instrumen dinyatakan reliabel untuk digunakan berulang kali.',
    },
    {
      term: 'Uji Normalitas Residual',
      rule: 'Nilai Sig. Asymp (2-tailed) > 0,05',
      desc: 'Memastikan residual dari model regresi berdistribusi normal dengan uji Kolmogorov-Smirnov atau Saphiro-Wilk sehingga uji signifikansi F dan t dapat diinterpretasikan secara sahih.',
    },
    {
      term: 'Uji Multikolinearitas',
      rule: 'VIF < 10 dan Tolerance > 0,10',
      desc: 'Memastikan tidak ada korelasi sempurna atau sangat tinggi antar variabel bebas (X) di dalam model regresi berganda yang dapat mendistorsi koefisien regresi.',
    },
    {
      term: 'Uji Heteroskedastisitas (Glejser)',
      rule: 'Nilai Sig. seluruh variabel X > 0,05',
      desc: 'Memastikan tidak ada ketidaksamaan varians residual antar satu pengamatan ke pengamatan lain. Jika nilai Sig. regresi residual absolut di atas 0,05, maka model bebas gejala heteroskedastisitas.',
    },
    {
      term: 'Koefisien Determinasi (R² / R-Square)',
      rule: 'Rentang nilai 0,000 s.d. 1,000 (0% s.d. 100%)',
      desc: 'Menunjukkan seberapa besar persentase variasi variabel terikat (Y) yang mampu dijelaskan secara bersama-sama oleh kombinasi variabel bebas (X) dalam penelitian Anda.',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 space-y-12">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Panduan Penggunaan', href: '/panduan' }]} />

      {/* Hero Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="mint" className="text-xs font-semibold py-0.5 px-2.5">
            Panduan Resmi
          </Badge>
          <Badge variant="outline" className="text-xs">
            Alur 5 Langkah Wisaya
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">
            {APP_NAME} v{APP_VERSION}
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.2]">
          Panduan Penggunaan Meja Kerja {APP_NAME}
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-[76ch]">
          Pelajari cara mengolah tabulasi data kuesioner skripsi kuantitatif mulai dari penyiapan berkas Excel/CSV hingga menghasilkan tabel Bab 4 berstandar APA 7th Edition dan draf narasi interpretasi akademik yang siap disalin ke naskah skripsi Anda.
        </p>

        {/* CTA Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button asChild size="default" className="font-semibold text-xs sm:text-sm px-5 h-11 min-h-[44px] rounded-[10px] shadow-xs">
            <Link href="/app/proyek/baru?contoh=1">
              <span>Coba Langsung dengan Data Contoh</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>

          <Button asChild variant="outline" size="default" className="text-xs sm:text-sm px-4 h-11 min-h-[44px] rounded-[10px] gap-2">
            <a href="/data-contoh/data_kuesioner_pemasaran_100_responden.xlsx" download>
              <Download className="h-4 w-4 text-primary" />
              <span>Unduh Templat Kuesioner (.xlsx)</span>
            </a>
          </Button>
        </div>
      </div>

      {/* Bagian 1: Alur Kerja 5 Langkah */}
      <section className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <Workflow className="h-3.5 w-3.5" />
            <span>Alur Sistematis</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Alur Pengolahan Data 5 Langkah
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-[70ch]">
            Dirancang agar mahasiswa tingkat akhir dapat menyelesaikan bab hasil penelitian tanpa kerumitan instalasi SPSS atau sintaks kode.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {wizardSteps.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.step} className="border-border bg-card rounded-[14px] shadow-2xs">
                <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-base sm:text-lg">
                    {item.step}
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h3 className="font-bold text-base sm:text-lg text-foreground flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        <span>{item.title}</span>
                      </h3>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        Langkah {item.step} dari 5
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                    <div className="rounded-lg bg-muted/40 border border-border/60 p-2.5 text-xs text-foreground/90 flex items-start gap-2">
                      <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="leading-snug">
                        <strong className="font-medium text-foreground">Tip: </strong>
                        {item.tips}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Bagian 2: Panduan Format Berkas Excel / CSV */}
      <section className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Format Tabulasi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Standar Penyiapan Berkas Kuesioner
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-[70ch]">
            Agar kalkulasi deterministik berjalan lancar, pastikan tabulasi data kuesioner Anda memenuhi standar format berikut:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border bg-card rounded-[14px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Format yang Dianjurkan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="font-bold text-foreground shrink-0">•</span>
                <span>Berkas berekstensi <strong>.xlsx</strong>, <strong>.xls</strong>, atau <strong>.csv</strong> (Maksimal 15 MB).</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-foreground shrink-0">•</span>
                <span>Baris 1 berisi nama variabel/kode butir: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-xs">X1.1, X1.2, X1.3, Y1.1</code>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-foreground shrink-0">•</span>
                <span>Baris 2 ke bawah berisi angka skala Likert (misal 1 sampai 5) dari masing-masing responden.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-foreground shrink-0">•</span>
                <span>Pemisah desimal berupa tanda titik (.) atau koma (,) keduanya didukung otomatis.</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card rounded-[14px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Hal yang Perlu Dihindari</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="font-bold text-destructive shrink-0">✕</span>
                <span>Menyertakan judul penelitian atau tabel pengantar di baris 1-3 sebelum header kolom.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-destructive shrink-0">✕</span>
                <span>Menggabungkan sel (Merged Cells) pada baris header butir pertanyaan.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-destructive shrink-0">✕</span>
                <span>Menyertakan baris rata-rata (Average) atau Total di bagian bawah data responden.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-destructive shrink-0">✕</span>
                <span>Data teks seperti &ldquo;Sangat Setuju&rdquo; (konversikan terlebih dahulu menjadi angka 1-5).</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Download Box */}
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-sm sm:text-base text-foreground">
              Ingin melihat contoh struktur tabulasi yang benar?
            </h4>
            <p className="text-xs text-muted-foreground">
              Unduh templat spreadsheet kuesioner 100 responden dengan 3 variabel bebas &amp; 1 variabel terikat.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Button asChild size="sm" variant="default" className="font-medium text-xs">
              <a href="/data-contoh/data_kuesioner_pemasaran_100_responden.xlsx" download>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                <span>Unduh Excel (.xlsx)</span>
              </a>
            </Button>
            <Button asChild size="sm" variant="outline" className="font-medium text-xs">
              <a href="/data-contoh/data_kuesioner_pemasaran_100_responden.csv" download>
                <span>Unduh CSV</span>
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Bagian 3: Glosarium Statistik Skripsi */}
      <section className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Kaidah Uji</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Glosarium Kriteria Kelulusan Uji Statistik
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-[70ch]">
            Pedoman interpretasi angka statistik yang lazim digunakan dalam sidang skripsi dan naskah Bab 4:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {glossaryItems.map((item, idx) => (
            <Card key={idx} className="border-border bg-card rounded-[14px] shadow-2xs">
              <CardContent className="p-4 sm:p-5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug">
                    {item.term}
                  </h3>
                  <Badge variant="outline" className="text-[11px] font-mono text-primary border-primary/30 shrink-0">
                    {item.rule}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Bagian 4: Tanya Jawab Praktis (FAQ) */}
      <section className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Tanya Jawab</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Pertanyaan Praktis Penggunaan
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-[70ch]">
            Jawaban langsung untuk pertanyaan teknis seputar pengolahan kuesioner:
          </p>
        </div>

        <div className="space-y-3">
          <AccordionItem
            question="Bagaimana jika kuesioner saya memiliki butir yang tidak valid (r hitung < r tabel)?"
            answer={
              <p>
                Jika ada butir pertanyaan yang gugur, Anda cukup kembali ke Langkah 3 (Petakan Variabel) lalu hapus centang pada butir tersebut. Mesin akan menghitung ulang skor total variabel dan reliabilitas secara otomatis tanpa perlu mengubah berkas kuesioner asli.
              </p>
            }
          />

          <AccordionItem
            question="Apakah saya bisa menguji regresi linier berganda dengan lebih dari 2 variabel bebas?"
            answer={
              <p>
                Bisa. Meja Kerja {APP_NAME} mendukung regresi linier sederhana (1 variabel bebas X) maupun regresi linier berganda dengan beberapa variabel bebas (X1, X2, X3, dst.) terhadap 1 variabel terikat (Y).
              </p>
            }
          />

          <AccordionItem
            question="Bagaimana cara menyalin tabel ke Microsoft Word agar formatnya rapi?"
            answer={
              <p>
                Pada setiap kartu tabel hasil di halaman Hasil Analisis, klik tombol <strong>Salin untuk Word</strong>. Buka Microsoft Word Anda lalu tekan Ctrl+V (atau Cmd+V). Tabel akan otomatis tertempel dengan garis horizontal standar APA 7th Edition tanpa garis vertikal.
              </p>
            }
          />

          <AccordionItem
            question="Apakah angka statistik dihasilkan oleh AI atau rumus matematika deterministik?"
            answer={
              <p>
                Seluruh angka statistik dihitung oleh mesin kalkulasi deterministik menggunakan rumus matematika baku (OLS, Pearson, Cronbach&apos;s Alpha). Kecerdasan buatan (AI) hanya digunakan untuk menyusun draf narasi penjelasan yang menyambungkan angka-angka terhitung tersebut ke dalam kalimat bahasa Indonesia baku.
              </p>
            }
          />
        </div>
      </section>

      {/* Bagian 5: Integritas Akademik & Link ke Pernyataan Penggunaan */}
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <ShieldCheck className="h-5 w-5" />
          <span>Integritas Akademik &amp; Transparansi</span>
        </div>
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
          Butuh Pernyataan Penggunaan Alat untuk Lampiran Skripsi?
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[72ch]">
          Untuk menjaga kejujuran ilmiah dan kepatuhan terhadap pedoman penulisan karya ilmiah di perguruan tinggi Anda, kami menyediakan templat baku <em>Pernyataan Penggunaan Alat</em> yang dapat Anda lampirkan bersama lembar Jejak Hitung.
        </p>
        <div className="pt-2">
          <Button asChild variant="outline" size="default" className="font-semibold text-xs sm:text-sm h-10 rounded-[10px] gap-2">
            <Link href="/pernyataan-penggunaan">
              <span>Buka Draf Pernyataan Penggunaan Alat</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* PageActions Navigasi Halaman */}
      <PageActions
        prevHref="/harga"
        prevLabel="Kembali ke Pilihan Harga"
        nextHref="/pernyataan-penggunaan"
        nextLabel="Lanjut ke Pernyataan Penggunaan Alat"
      />
    </div>
  );
}
