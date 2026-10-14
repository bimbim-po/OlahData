'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  BookOpen,
  UploadCloud,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle,
  HelpCircle,
  Download,
  Copy,
  Mail,
  ChevronDown,
  Timer,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Table,
  Check,
  FileText,
  Sliders,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageActions } from '@/components/page-actions';
import { useToast } from '@/components/ui/toaster';
import { SUPPORT_EMAIL } from '@/lib/plans';
import { APP_NAME, APP_VERSION } from '@/lib/constants';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

const FAQ_LIST: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Metodologi',
    question: 'Mengapa hasil olah data di OlahData bisa dijamin deterministik?',
    answer:
      'Setiap kalkulasi angka (seperti Mean, r Pearson, Alfa Cronbach, F hitung, dan R-squared) dihitung oleh pustaka matematika dan statistik deterministik terverifikasi, bukan oleh model bahasa generatif (AI). AI pada OlahData hanya bertugas merangkai draf teks penjelasan dalam kalimat ilmiah Bab 4 berdasarkan angka riil yang telah diuji oleh number guard.',
    keywords: ['deterministik', 'angka', 'ai', 'kalkulasi', 'keaslian'],
  },
  {
    id: 'faq-2',
    category: 'Reliabilitas',
    question: 'Berapa batas nilai Alfa Cronbach agar instrumen dinyatakan reliabel?',
    answer:
      'Sesuai kaidah metodologi penelitian kuantitatif (Nunnally & Bernstein), instrumen penelitian dinyatakan andal (reliabel) jika nilai Alfa Cronbach > 0,70. Nilai antara 0,60–0,70 masih dapat diterima dalam penelitian eksploratif, sedangkan nilai di atas 0,90 menandakan indikator butir sangat kuat atau kemungkinan terdapat butir yang redundan.',
    keywords: ['reliabilitas', 'cronbach', 'alfa', 'reliabel', '0.70', 'nunnally'],
  },
  {
    id: 'faq-3',
    category: 'Validitas',
    question: 'Bagaimana cara menentukan apakah butir kuesioner valid?',
    answer:
      'Validitas butir diuji dengan membandingkan nilai r hitung (korelasi Pearson antara skor butir dengan total skor konstruk) dengan r tabel pada tingkat signifikansi α = 0,05 dan derajat kebebasan df = N - 2. Jika r hitung > r tabel dan bernilai positif, butir dinyatakan Valid. Jika r hitung ≤ r tabel, butir dinyatakan Gugur dan perlu dievaluasi atau dikeluarkan.',
    keywords: ['validitas', 'r hitung', 'r tabel', 'valid', 'gugur', 'pearson'],
  },
  {
    id: 'faq-4',
    category: 'Asumsi Klasik',
    question: 'Apa yang harus dilakukan jika uji normalitas residual tidak signifikan (p < 0,05)?',
    answer:
      'Jika data berdistribusi tidak normal, periksa apakah terdapat data pencilan (outliers). Di OlahData, Anda dapat melihat rekomendasi pembersihan baris pencilan pada menu Pemetaan & Validasi. Setelah baris pencilan dikecualikan, jalankan analisis ulang untuk melihat perbaikan normalitas residual.',
    keywords: ['normalitas', 'asumsi klasik', 'outlier', 'residual', 'pencilan'],
  },
  {
    id: 'faq-5',
    category: 'Format Data',
    question: 'Mengapa file Excel saya tidak terbaca saat diunggah?',
    answer:
      'Pastikan file menggunakan format .xlsx, .xls, atau .csv dengan ukuran di bawah 10 MB. Baris pertama (baris 1) harus berisi nama kolom/indikator (tanpa penggabungan sel/merge cells), dan baris-baris berikutnya hanya berisi data skor angka. Pastikan tidak ada karakter aneh atau rumus rusak di dalam file.',
    keywords: ['unggah', 'excel', 'csv', 'gagal', 'format', 'merge'],
  },
  {
    id: 'faq-6',
    category: 'Ekspor Dokumen',
    question: 'Apakah hasil ekspor Word sudah sesuai dengan format baku skripsi universitas?',
    answer:
      'Ya! Ekspor Microsoft Word (.docx / format tabel HTML APA) menerapkan aturan baku tabel ilmiah tiga garis (three-line table APA 7th Edition) tanpa garis vertikal. Tabel dapat langsung Anda salin (Ctrl+C) dan tempelkan (Ctrl+V) ke berkas Microsoft Word tanpa merusak format margin lembar kerja.',
    keywords: ['ekspor', 'word', 'apa', 'tabel', 'tiga garis', 'format skripsi'],
  },
];

const GLOSSARY_TERMS = [
  {
    term: 'N (Ukuran Sampel / Responden)',
    def: 'Jumlah total responden yang datanya lengkap, valid, dan diikutsertakan dalam kalkulasi analisis statistik.',
  },
  {
    term: 'Mean (Rata-rata Hitung)',
    def: 'Jumlah seluruh nilai data dibagi dengan jumlah responden (N). Digunakan untuk melihat kecenderungan umum penilaian responden.',
  },
  {
    term: 'Std Dev (Standar Deviasi)',
    def: 'Ukuran persebaran atau variasi data dari rata-rata. Semakin kecil nilai simpangan baku, semakin homogen jawaban responden.',
  },
  {
    term: 'r Hitung (Korelasi Pearson)',
    def: 'Koefisien korelasi momen hasil hitung antara butir pertanyaan dengan skor total konstruk. Nilai berkisar antara -1 hingga +1.',
  },
  {
    term: 'r Tabel',
    def: 'Nilai ambang batas kritis dari tabel distribusi r Pearson pada tingkat signifikansi 5% (α = 0,05) dan derajat kebebasan df = N - 2.',
  },
  {
    term: 'Alfa Cronbach (Cronbach’s Alpha)',
    def: 'Koefisien konsistensi internal instrumen kuesioner. Standar umum penelitian skripsi mensyaratkan nilai > 0,70 agar instrumen reliabel.',
  },
  {
    term: 'R-Squared (R² / Koefisien Determinasi)',
    def: 'Persentase variasi variabel dependen yang dapat dijelaskan secara simultan oleh variabel-variabel independen dalam model regresi.',
  },
  {
    term: 'Uji F (Simultan)',
    def: 'Pengujian untuk membuktikan apakah seluruh variabel independen secara bersama-sama berpengaruh signifikan terhadap variabel dependen (p < 0,05).',
  },
  {
    term: 'Uji t (Parsial)',
    def: 'Pengujian untuk mengetahui pengaruh masing-masing variabel independen secara individu terhadap variabel dependen.',
  },
  {
    term: 'Multikolinearitas (VIF & Tolerance)',
    def: 'Kondisi adanya korelasi kuat antar variabel independen. Model yang baik bebas multikolinearitas (VIF < 10 dan Tolerance > 0,10).',
  },
];

const TOC_SECTIONS = [
  { id: 'mulai-cepat', title: 'Mulai Cepat 60 Detik' },
  { id: 'format-berkas', title: 'Format Berkas & Kuesioner' },
  { id: 'pemetaan-variabel', title: 'Pemetaan Variabel & Butir' },
  { id: 'panduan-hasil', title: 'Panduan Membaca Hasil Bab 4' },
  { id: 'validitas', title: 'Uji Validitas Butir' },
  { id: 'reliabilitas', title: 'Uji Reliabilitas Instrumen' },
  { id: 'asumsi-klasik', title: 'Uji Asumsi Klasik' },
  { id: 'regresi', title: 'Analisis Regresi Linier' },
  { id: 'pemecahan-masalah', title: 'Pemecahan Masalah' },
  { id: 'faq', title: 'Pertanyaan Umum (FAQ)' },
  { id: 'glosarium', title: 'Glosarium Istilah' },
  { id: 'kebijakan', title: 'Integritas Ilmiah & Privasi' },
  { id: 'kontak', title: 'Hubungi Bantuan' },
];

export default function HelpCenterPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAccordion, setActiveAccordion] = useState<string | null>('faq-1');
  const [diagnosticCode, setDiagnosticCode] = useState('');

  // Buat kode diagnosa otomatis saat halaman dimuat
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const code = `OLAH-${Date.now().toString(36).toUpperCase()}-${navigator.userAgent.slice(0, 15).replace(/[^a-zA-Z0-9]/g, '')}-V${APP_VERSION}`;
      setDiagnosticCode(code);
    }
  }, []);

  const handleCopyDiagnostic = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(diagnosticCode);
      toast({
        title: 'Kode Diagnosa Disalin',
        description: `Kode ${diagnosticCode} berhasil disalin ke papan klip.`,
        variant: 'success',
      });
    }
  };

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return FAQ_LIST;
    return FAQ_LIST.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords.some((kw) => kw.includes(q))
    );
  }, [searchQuery]);

  const filteredGlossary = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return GLOSSARY_TERMS;
    return GLOSSARY_TERMS.filter(
      (item) => item.term.toLowerCase().includes(q) || item.def.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const isContactConfigured = SUPPORT_EMAIL && SUPPORT_EMAIL !== '[ISI OLEH PEMILIK]';
  const mailtoHref = isContactConfigured
    ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
        `[Bantuan OlahData] Kendala Analisis Skripsi - ${diagnosticCode}`
      )}&body=${encodeURIComponent(
        `Halo Tim Dukungan OlahData,\n\nSaya mahasiswa pengguna OlahData dan mengalami kendala sebagai berikut:\n\n[Tuliskan deskripsi masalah Anda di sini]\n\n-------------------------\nKode Diagnosa: ${diagnosticCode}\nVersi Aplikasi: ${APP_VERSION}\nPeramban: ${
          typeof navigator !== 'undefined' ? navigator.userAgent : ''
        }\n-------------------------`
      )}`
    : '#kontak';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-12 font-sans">
      {/* Hero Header Pusat Bantuan */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[13px] font-semibold">
            <BookOpen className="h-4 w-4" />
            <span>Pusat Bantuan &amp; Dokumentasi Mahasiswa</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            Panduan Lengkap Olah Data &amp; Penulisan Bab 4
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Temukan panduan langkah demi langkah, interpretasi hasil uji statistik standar akademik,
            pemecahan masalah data kuesioner, dan bantuan teknis deterministik.
          </p>

          {/* Search Box Instan */}
          <div className="pt-3 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari panduan (mis. reliabilitas, r hitung, regresi, normalitas, csv)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-sm bg-background border-border rounded-xl focus:ring-2 focus:ring-primary"
                aria-label="Kotak pencarian panduan bantuan"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-foreground p-1"
                >
                  Bersihkan
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-xs text-primary font-medium mt-2">
                Menampilkan hasil pencarian untuk kata kunci: &quot;{searchQuery}&quot; ({filteredFaqs.length} FAQ, {filteredGlossary.length} istilah)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Navigasi Sticky di Desktop & Konten Artikel */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-8 items-start">
        {/* Sticky Sidebar Navigasi Cepat (Desktop) / Dropdown (Mobile) */}
        <aside className="lg:sticky lg:top-24 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground mb-3 px-2">
              Daftar Isi Bantuan
            </h2>

            {/* Mobile Dropdown Select */}
            <div className="block lg:hidden mb-2">
              <label htmlFor="mobile-toc" className="sr-only">Pilih topik bantuan</label>
              <select
                id="mobile-toc"
                onChange={(e) => {
                  const target = document.querySelector(e.target.value);
                  target?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full h-11 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Pilih Topik Panduan --</option>
                {TOC_SECTIONS.map((sec) => (
                  <option key={sec.id} value={`#${sec.id}`}>
                    {sec.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex flex-col space-y-1 text-sm">
              {TOC_SECTIONS.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="px-2.5 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors text-[13px] font-medium"
                >
                  {sec.title}
                </a>
              ))}
            </nav>
          </div>

          {/* Quick Support Card */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <HelpCircle className="h-4 w-4 shrink-0" />
              <span>Butuh Bantuan Langsung?</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tim akademik dan teknis siap membantu kendala pengolahan data skripsi Anda.
            </p>
            <Button asChild size="sm" className="w-full text-xs font-semibold">
              <a href="#kontak">Hubungi Kami</a>
            </Button>
          </div>
        </aside>

        {/* Content Articles Area */}
        <div className="space-y-10 min-w-0">
          {/* 1. Mulai Cepat 60 Detik */}
          <section id="mulai-cepat" className="scroll-mt-24 space-y-4">
            <div className="border-b border-border pb-3">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Timer className="h-6 w-6 text-primary" />
                <span>Mulai Cepat 60 Detik</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Lima langkah ringkas untuk menyelesaikan olah data kuesioner skripsi Anda.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border-border">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs">1</span>
                    <span>Unggah Berkas</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-1 text-xs text-muted-foreground leading-relaxed">
                  Unggah kuesioner dalam format CSV atau Excel (.xlsx/.xls). Sistem otomatis memvalidasi kebersihan baris dan mendeteksi kolom.
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs">2</span>
                    <span>Petakan Variabel</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-1 text-xs text-muted-foreground leading-relaxed">
                  Tentukan variabel independen (X) dan dependen (Y), lalu kelompokkan butir indikatornya (mis. X1.1–X1.5) dengan mudah.
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs">3</span>
                    <span>Pilih Pengujian</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-1 text-xs text-muted-foreground leading-relaxed">
                  Centang uji yang dibutuhkan: Deskriptif, Validitas, Reliabilitas, Asumsi Klasik (Normalitas, Multikol, Hetero), dan Regresi.
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs">4</span>
                    <span>Lihat Hasil Bab 4</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-1 text-xs text-muted-foreground leading-relaxed">
                  Periksa tabel tiga garis APA, nilai N valid, jejak hitung matematika deterministik, dan draf narasi interpretasi akademik.
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs">5</span>
                    <span>Unduh Word / PDF</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-1 text-xs text-muted-foreground leading-relaxed">
                  Salin tabel langsung ke Microsoft Word (Ctrl+V) atau unduh laporan lengkap berserta lembar pernyataan etika penggunaan alat.
                </CardContent>
              </Card>

              {/* Action Tile */}
              <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Ingin Langsung Mencoba?</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Gunakan 100 data contoh mahasiswa pemasaran yang telah disiapkan secara otomatis.
                  </p>
                </div>
                <Button asChild size="sm" className="mt-3 w-full font-semibold">
                  <Link href="/app/proyek/baru?contoh=1">
                    Coba dengan Data Contoh
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* 2. Format Berkas & Kuesioner */}
          <section id="format-berkas" className="scroll-mt-24 space-y-4">
            <div className="border-b border-border pb-3">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
                <span>Format Berkas &amp; Data Kuesioner</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Aturan format berkas spreadsheet agar pembacaan kolom dan baris responden 100% akurat.
              </p>
            </div>

            <div className="space-y-4 text-sm text-foreground">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-border bg-card space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Format Didukung</span>
                  <p className="font-bold text-base text-foreground">.CSV, .XLSX, .XLS</p>
                  <p className="text-xs text-muted-foreground">Ekstensi file spreadsheet standar.</p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-card space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Batas Ukuran</span>
                  <p className="font-bold text-base text-foreground">Maksimal 10 MB</p>
                  <p className="text-xs text-muted-foreground">Cukup untuk puluhan ribu responden.</p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-card space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Susunan Baris 1</span>
                  <p className="font-bold text-base text-foreground">Nama Kolom Saja</p>
                  <p className="text-xs text-muted-foreground">Tanpa judul bertingkat / merge cells.</p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <h3 className="font-semibold text-base">Contoh Tata Letak Tabel Kuesioner yang Benar</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 font-semibold">
                        <th className="p-2.5">No_Resp</th>
                        <th className="p-2.5">X1.1</th>
                        <th className="p-2.5">X1.2</th>
                        <th className="p-2.5">X1.3</th>
                        <th className="p-2.5">Y1.1</th>
                        <th className="p-2.5">Y1.2</th>
                        <th className="p-2.5">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      <tr>
                        <td className="p-2.5 font-mono">1</td>
                        <td className="p-2.5 font-mono">4</td>
                        <td className="p-2.5 font-mono">5</td>
                        <td className="p-2.5 font-mono">4</td>
                        <td className="p-2.5 font-mono">5</td>
                        <td className="p-2.5 font-mono">4</td>
                        <td className="p-2.5 text-muted-foreground">Angka Likert (1–5)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono">2</td>
                        <td className="p-2.5 font-mono">3</td>
                        <td className="p-2.5 font-mono">4</td>
                        <td className="p-2.5 font-mono">3</td>
                        <td className="p-2.5 font-mono">4</td>
                        <td className="p-2.5 font-mono">4</td>
                        <td className="p-2.5 text-muted-foreground">Angka Likert (1–5)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Unduh file contoh untuk dijadikan acuan struktur tabel kuesioner Anda:
                  </p>
                  <Button asChild variant="outline" size="sm" className="text-xs font-semibold gap-1.5">
                    <a
                      href="/data-contoh/data_kuesioner_pemasaran_100_responden.xlsx"
                      download="data_kuesioner_pemasaran_100_responden.xlsx"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Unduh Templat Excel
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Pemetaan Variabel */}
          <section id="pemetaan-variabel" className="scroll-mt-24 space-y-4">
            <div className="border-b border-border pb-3">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Sliders className="h-6 w-6 text-primary" />
                <span>Pemetaan Variabel &amp; Butir Indikator</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Cara mengelompokkan butir kuesioner ke dalam variabel laten untuk analisis regresi.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 space-y-3 text-sm leading-relaxed">
              <p>
                Pada tahap <strong>Pemetaan Variabel</strong> di halaman analisis, sistem memungkinkan Anda:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                <li>
                  <strong>Menentukan Variabel Bebas (Independen / X):</strong> Misalnya Kualitas Layanan (X1) yang terdiri atas butir KL1 sampai KL6.
                </li>
                <li>
                  <strong>Menentukan Variabel Terikat (Dependen / Y):</strong> Misalnya Loyalitas Pelanggan (Y) yang terdiri atas butir LP1 sampai LP6.
                </li>
                <li>
                  <strong>Memilih Kolom ID / Demografi:</strong> Kolom seperti Nomor Responden, Usia, atau Jenis Kelamin dapat ditandai sebagai data profil agar tidak dihitung dalam regresi.
                </li>
              </ul>
              <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground">
                <strong className="text-foreground">Tips:</strong> Skor total variabel akan dihitung otomatis oleh mesin dari rata-rata butir indikator valid saat pengujian regresi dijalankan.
              </div>
            </div>
          </section>

          {/* 4. Panduan Membaca Hasil Bab 4 */}
          <section id="panduan-hasil" className="scroll-mt-24 space-y-4">
            <div className="border-b border-border pb-3">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Table className="h-6 w-6 text-primary" />
                <span>Panduan Membaca Hasil Bab 4</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Interpretasi nilai statistik deskriptif dan skala Likert menurut standar metodologi kuantitatif.
              </p>
            </div>

            <div className="space-y-4 text-sm text-foreground">
              <Card className="border-border">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-base font-bold font-serif">
                    1. Arti N (Jumlah Sampel Valid)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-2 text-muted-foreground leading-relaxed">
                  <p>
                    <strong>N</strong> mewakili jumlah responden yang digunakan dalam perhitungan statistik. Jika berkas kuesioner awal memiliki 120 baris dan sistem mengecualikan 3 baris karena jawaban tidak lengkap atau data pencilan ekstrim, maka <strong>N valid = 117</strong>.
                  </p>
                  <p className="text-xs bg-muted/30 p-2.5 rounded-md border border-border">
                    Derajat kebebasan (df) regresi dihitung dari rumus: <code className="font-mono text-foreground font-semibold">df_res = N - k - 1</code>, di mana k adalah jumlah variabel bebas.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-base font-bold font-serif">
                    2. Interval Kategori Skala Likert 1 Sampai 5
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Dihitung berdasarkan rumus panjang interval: <code className="font-mono text-foreground">(Nilai Maks - Nilai Min) / 5 = (5 - 1) / 5 = 0,80</code>
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 font-semibold">
                          <th className="p-2.5">Rentang Rata-rata (Mean)</th>
                          <th className="p-2.5">Kategori Persepsi</th>
                          <th className="p-2.5">Kategori Alternatif</th>
                          <th className="p-2.5">Makna Akademik</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        <tr>
                          <td className="p-2.5 font-mono font-semibold">1,00 – 1,80</td>
                          <td className="p-2.5"><Badge variant="outline" className="text-destructive border-destructive/30">Sangat Rendah</Badge></td>
                          <td className="p-2.5 text-muted-foreground">Sangat Buruk / Sangat Tidak Setuju</td>
                          <td className="p-2.5 text-muted-foreground">Persepsi responden sangat mengecewakan.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-mono font-semibold">1,81 – 2,60</td>
                          <td className="p-2.5"><Badge variant="outline" className="text-amber-600 border-amber-500/30">Rendah</Badge></td>
                          <td className="p-2.5 text-muted-foreground">Buruk / Tidak Setuju</td>
                          <td className="p-2.5 text-muted-foreground">Tanggapan responden cenderung negatif.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-mono font-semibold">2,61 – 3,40</td>
                          <td className="p-2.5"><Badge variant="outline" className="text-blue-600 border-blue-500/30">Cukup</Badge></td>
                          <td className="p-2.5 text-muted-foreground">Sedang / Netral</td>
                          <td className="p-2.5 text-muted-foreground">Persepsi responden berada pada taraf menengah.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-mono font-semibold">3,41 – 4,20</td>
                          <td className="p-2.5"><Badge variant="outline" className="text-emerald-600 border-emerald-500/30">Tinggi</Badge></td>
                          <td className="p-2.5 text-muted-foreground">Baik / Setuju</td>
                          <td className="p-2.5 text-muted-foreground">Persepsi responden tergolong positif.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-mono font-semibold">4,21 – 5,00</td>
                          <td className="p-2.5"><Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-500/30">Sangat Tinggi</Badge></td>
                          <td className="p-2.5 text-muted-foreground">Sangat Baik / Sangat Setuju</td>
                          <td className="p-2.5 text-muted-foreground">Responden sangat puas dan sepakat penuh.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* 5. Uji Validitas Butir */}
          <section id="validitas" className="scroll-mt-24 space-y-4">
            <div className="border-b border-border pb-3">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                <span>Uji Validitas Butir (Pearson Product Moment)</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Mengukur apakah butir-butir pertanyaan benar-benar mampu merefleksikan konstruk yang diteliti.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <h4 className="font-bold text-foreground">Kapan Dipakai?</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sebelum melakukan analisis regresi, seluruh butir kuesioner instrumen harus diuji validitasnya untuk memastikan kuesioner layak digunakan sebagai alat ukur.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <h4 className="font-bold text-foreground">Syarat Data &amp; Kriteria Keputusan</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Data skala Likert (interval). Bandingkan nilai <strong className="text-foreground">r hitung</strong> dengan <strong className="text-foreground">r tabel</strong> pada α = 0,05 (df = N - 2).
                  <br />• <strong>Valid:</strong> r hitung &gt; r tabel dan positif.
                  <br />• <strong>Gugur:</strong> r hitung ≤ r tabel.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <h4 className="font-bold text-foreground">Cara Membaca di Bab 4</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  &quot;Berdasarkan Tabel 4.2, seluruh butir instrumen variabel Kualitas Layanan (KL1 sampai KL6) memiliki nilai r hitung antara 0,642 hingga 0,812 yang lebih besar dari r tabel (0,1816), sehingga seluruh butir dinyatakan valid.&quot;
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <h4 className="font-bold text-foreground">Kesalahan Umum Mahasiswa</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Menghitung r hitung terhadap total seluruh kuesioner (bukan terhadap total konstruk variabel terkait), atau tetap memasukkan butir yang gugur ke dalam kalkulasi regresi.
                </p>
              </div>
            </div>
          </section>

          {/* 6. Uji Reliabilitas */}
          <section id="reliabilitas" className="scroll-mt-24 space-y-4">
            <div className="border-b border-border pb-3">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <span>Uji Reliabilitas Instrumen (Alfa Cronbach)</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Menguji keandalan dan konsistensi internal jawaban kuesioner jika diukur secara berulang.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <h4 className="font-bold text-foreground">Kapan Dipakai?</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Dilakukan setelah uji validitas, hanya pada butir-butir indikator yang berstatus <strong>Valid</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <h4 className="font-bold text-foreground">Ambang Batas Keputusan</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Standar baku (Nunnally &amp; Bernstein, 1994):
                  <br />• <strong>Alfa Cronbach &gt; 0,70:</strong> Sangat Reliabel / Handal.
                  <br />• <strong>Alfa Cronbach 0,60 – 0,70:</strong> Cukup Reliabel (penelitian eksploratif).
                  <br />• <strong>Alfa Cronbach &lt; 0,60:</strong> Tidak Reliabel.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <h4 className="font-bold text-foreground">Cara Membaca di Bab 4</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  &quot;Hasil pengujian reliabilitas pada Tabel 4.3 menunjukkan nilai Alfa Cronbach untuk variabel Kepuasan Pelanggan sebesar 0,845 (&gt; 0,70), membuktikan instrumen memiliki keandalan yang tinggi.&quot;
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <h4 className="font-bold text-foreground">Kesalahan Umum Mahasiswa</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Memasukkan butir yang sudah gugur pada uji validitas ke dalam perhitungan reliabilitas, sehingga nilai alfa menurun drastis.
                </p>
              </div>
            </div>
          </section>

          {/* 7. Uji Asumsi Klasik */}
          <section id="asumsi-klasik" className="scroll-mt-24 space-y-4">
            <div className="border-b border-border pb-3">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                <span>Uji Asumsi Klasik OLS</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Syarat mutlak sebelum penarikan kesimpulan pada Analisis Regresi Linier Berganda.
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground">A. Uji Normalitas Residual</h4>
                  <Badge variant="outline">Kolmogorov-Smirnov / Shapiro-Wilk</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Menguji apakah nilai residual dari model regresi terdistribusi secara normal.
                  <br />• <strong>Kriteria:</strong> Nilai Asymp. Sig. (2-tailed) &gt; 0,05 menandakan data residual berdistribusi normal.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground">B. Uji Multikolinearitas</h4>
                  <Badge variant="outline">VIF &amp; Tolerance</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Menguji apakah terdapat korelasi sempurna antar variabel bebas (X).
                  <br />• <strong>Kriteria Bebas Multikol:</strong> Nilai <strong className="text-foreground">VIF &lt; 10,00</strong> dan nilai <strong className="text-foreground">Tolerance &gt; 0,10</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground">C. Uji Heteroskedastisitas</h4>
                  <Badge variant="outline">Uji Glejser / Scatterplot</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Menguji apakah terjadi ketidaksamaan varians dari residual satu pengamatan ke pengamatan lain.
                  <br />• <strong>Kriteria Homoskedastisitas (Bagus):</strong> Nilai signifikansi uji Glejser antara variabel bebas terhadap nilai absolut residual &gt; 0,05.
                </p>
              </div>
            </div>
          </section>

          {/* 8. Analisis Regresi Linier */}
          <section id="regresi" className="scroll-mt-24 space-y-4">
            <div className="border-b border-border pb-3">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                <span>Analisis Regresi Linier Berganda</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Kunci pengujian hipotesis penelitian skripsi kuantitatif.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">1. Uji F (Simultan)</span>
                <p className="font-bold text-sm text-foreground">F hitung vs F tabel</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Jika F hitung &gt; F tabel dan <strong>nilai-p &lt; 0,05</strong>, maka seluruh variabel independen (X) berpengaruh signifikan secara bersama-sama terhadap variabel dependen (Y).
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">2. Uji t (Parsial)</span>
                <p className="font-bold text-sm text-foreground">t hitung vs t tabel</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Jika t hitung &gt; t tabel dan <strong>nilai-p &lt; 0,05</strong>, maka variabel independen tersebut secara individu memiliki pengaruh nyata terhadap variabel dependen.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">3. R² (Determinasi)</span>
                <p className="font-bold text-sm text-foreground">Koefisien Determinasi</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Misalnya R² = 0,548 berarti <strong>54,8%</strong> variasi variabel dependen dapat dijelaskan oleh variabel independen dalam model, sedangkan sisanya dipengaruhi faktor lain.
                </p>
              </div>
            </div>
          </section>

          {/* 9. Pemecahan Masalah (Troubleshooting) */}
          <section id="pemecahan-masalah" className="scroll-mt-24 space-y-4">
            <div className="border-b border-border pb-3">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
                <span>Pemecahan Masalah (Troubleshooting)</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Solusi praktis untuk kendala umum yang sering ditemui saat mengolah data.
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <h4 className="font-bold text-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Unggahan Berkas Gagal
                </h4>
                <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
                  <p><strong>Penyebab Umum:</strong> File terkunci karena sedang dibuka di Microsoft Excel, terdapat baris kosong di bagian atas tabel, atau ukuran file melebihi 10 MB.</p>
                  <p><strong>Langkah Perbaikan:</strong> Tutup Microsoft Excel, pastikan nama kolom berada di baris pertama (A1), dan simpan ulang sebagai berkas .CSV (Comma delimited) atau .XLSX.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <h4 className="font-bold text-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Jumlah Responden (N) Berbeda dengan File Asli
                </h4>
                <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
                  <p><strong>Penyebab Umum:</strong> Beberapa responden tidak mengisi kuesioner dengan lengkap (missing values) atau baris tersebut merupakan outlier yang telah dikecualikan pada versi turunan.</p>
                  <p><strong>Langkah Perbaikan:</strong> Periksa panel <em>Sumber Data</em> di bagian atas hasil analisis untuk melihat nomor baris mana saja yang dikecualikan secara transparan.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <h4 className="font-bold text-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Tombol Unduh Dokumen Word / PDF Tidak Aktif
                </h4>
                <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
                  <p><strong>Penyebab Umum:</strong> Belum ada seksi tabel yang dipilih di dialog ekspor, atau kalkulasi analisis masih dalam proses berjalan.</p>
                  <p><strong>Langkah Perbaikan:</strong> Pastikan status proyek adalah <em>Selesai</em>, buka dialog ekspor, centang seksi yang ingin disertakan (mis. Statistik Deskriptif dan Regresi), lalu klik Unduh.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <h4 className="font-bold text-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Batas Kuota Proyek Habis
                </h4>
                <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
                  <p><strong>Penyebab Umum:</strong> Paket Coba Gratis memiliki batas 1 proyek aktif secara bersamaan.</p>
                  <p><strong>Langkah Perbaikan:</strong> Anda dapat mengarsipkan proyek lama dari Meja Kerja Skripsi atau beralih ke Paket Skripsi / Bulanan untuk kapasitas proyek tanpa batas.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 10. Pertanyaan Umum (FAQ) */}
          <section id="faq" className="scroll-mt-24 space-y-4">
            <div className="border-b border-border pb-3">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-primary" />
                <span>Pertanyaan Umum (FAQ)</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Jawaban atas pertanyaan yang paling sering ditanyakan oleh mahasiswa tingkat akhir.
              </p>
            </div>

            {filteredFaqs.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-border bg-card text-muted-foreground">
                <p>Tidak ada pertanyaan yang sesuai dengan kata kunci pencarian Anda.</p>
                <Button variant="link" onClick={() => setSearchQuery('')} className="mt-2 text-primary">
                  Tampilkan seluruh FAQ
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFaqs.map((faq) => {
                  const isOpen = activeAccordion === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className="rounded-xl border border-border bg-card overflow-hidden transition-all shadow-2xs"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(isOpen ? null : faq.id)}
                        className="w-full p-4 text-left flex items-center justify-between gap-3 font-semibold text-sm hover:bg-muted/40 transition-colors cursor-pointer"
                        aria-expanded={isOpen}
                      >
                        <span className="flex items-center gap-2 text-foreground">
                          <Badge variant="secondary" className="text-[11px] font-normal">
                            {faq.category}
                          </Badge>
                          <span>{faq.question}</span>
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${
                            isOpen ? 'rotate-180 text-primary' : ''
                          }`}
                        />
                      </button>
                      <div
                        className={`px-4 pb-4 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 ${
                          isOpen ? 'block' : 'hidden'
                        }`}
                      >
                        {faq.answer}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 11. Glosarium Istilah */}
          <section id="glosarium" className="scroll-mt-24 space-y-4">
            <div className="border-b border-border pb-3">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <span>Glosarium Istilah Statistik Sederhana</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Kamus istilah statistik penting dalam bahasa yang mudah dipahami mahasiswa.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {filteredGlossary.map((item) => (
                <div key={item.term} className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                  <h4 className="font-semibold text-foreground text-xs sm:text-sm">{item.term}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.def}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 12. Kebijakan & Integritas Ilmiah */}
          <section id="kebijakan" className="scroll-mt-24 space-y-4">
            <div className="border-b border-border pb-3">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <span>Integritas Ilmiah &amp; Privasi Data</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Komitmen etika akademik dan perlindungan privasi data kuesioner mahasiswa.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 space-y-4 text-sm leading-relaxed">
              <div className="space-y-2">
                <h4 className="font-bold text-foreground">3 Pilar Integritas OlahData:</h4>
                <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground text-xs sm:text-sm">
                  <li>
                    <strong>Angka 100% Deterministik:</strong> Angka hasil uji dihitung murni oleh algoritma statistik matematika deterministik (SciPy, Pandas, Statsmodels), tidak pernah dihalusinasi oleh AI.
                  </li>
                  <li>
                    <strong>AI Hanya Menulis Draf Teks:</strong> Model bahasa hanya membantu menyusun kalimat penjelasan ilmiah yang diverifikasi oleh number guard sebelum ditampilkan.
                  </li>
                  <li>
                    <strong>Privasi Data Responden Terjaga:</strong> Seluruh data mentah tersimpan dalam bucket privat terenkripsi. Administrator hanya dapat melihat metadata analisis, tidak pernah melihat isi data responden kuesioner Anda.
                  </li>
                </ul>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border text-xs">
                <span className="text-muted-foreground">Baca dokumen kebijakan resmi:</span>
                <Link href="/privasi" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                  <span>Kebijakan Privasi</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
                <span className="text-border">•</span>
                <Link href="/syarat" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                  <span>Syarat &amp; Ketentuan</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
                <span className="text-border">•</span>
                <Link href="/pernyataan-penggunaan" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                  <span>Pernyataan Penggunaan Alat</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </section>

          {/* 13. Hubungi Bantuan & Kode Diagnosa */}
          <section id="kontak" className="scroll-mt-24 space-y-4">
            <div className="border-b border-border pb-3">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Mail className="h-6 w-6 text-primary" />
                <span>Hubungi Bantuan Dukungan</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Kirim pesan bantuan dengan kode diagnosa otomatis untuk penanganan cepat.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Kode Diagnosa Peramban Anda
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyDiagnostic}
                    className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Salin Kode Diagnosa
                  </Button>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border font-mono text-sm font-bold text-primary select-all">
                  {diagnosticCode || 'MEMUAT-KODE-DIAGNOSA...'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sertakan kode di atas saat menghubungi tim kami agar kami dapat mengidentifikasi versi peramban Anda dengan tepat tanpa melihat isi data kuesioner Anda.
                </p>
              </div>

              <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground block">Alamat Surel Dukungan Resmi:</span>
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {SUPPORT_EMAIL}
                  </span>
                </div>

                {isContactConfigured ? (
                  <Button asChild className="gap-2 font-semibold">
                    <a href={mailtoHref}>
                      <Mail className="h-4 w-4" />
                      Kirim Email Bantuan
                    </a>
                  </Button>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-xs text-muted-foreground font-medium border border-border">
                    <span>Surel kontak belum dikonfigurasi di lingkungan sistem.</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Navigasi Bawah PageActions */}
          <div className="pt-6 border-t border-border">
            <PageActions
              prevHref="/app"
              prevLabel="Kembali ke Meja Kerja"
              nextHref="/app/proyek/baru"
              nextLabel="Mulai Proyek Baru"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
