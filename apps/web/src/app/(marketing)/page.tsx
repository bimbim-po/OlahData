import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Upload,
  FileText,
  ShieldAlert,
  ArrowRight,
  BookOpen,
  ChevronDown,
  Table as TableIcon,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { COPY } from '@/lib/copy';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bab4Preview } from '@/components/bab4-preview';
import { PricingCards } from '@/components/pricing-cards';
import { cn } from '@/lib/utils';
import { LiveDemo } from '@/components/live-demo';

export const metadata: Metadata = {
  title: `${APP_NAME} — Olah Data Kuesioner Skripsi Kuantitatif Tanpa SPSS`,
  description: 'Olah data kuesioner skripsi kuantitatif mudah dan akurat. Hasilkan tabel Bab 4 standar APA 7th serta draf penjelasan otomatis tanpa software statistik rumit.',
  openGraph: {
    title: `${APP_NAME} — Olah Data Kuesioner Skripsi Kuantitatif Tanpa SPSS`,
    description: 'Olah data kuesioner skripsi kuantitatif mudah dan akurat. Hasilkan tabel Bab 4 standar APA 7th serta draf penjelasan otomatis tanpa software statistik rumit.',
    url: 'https://olahdata.id',
    siteName: APP_NAME,
    locale: 'id_ID',
    type: 'website',
  },
};

export default function MarketingPage() {
  return (
    <div className="flex flex-col gap-12 sm:gap-16 pb-16">
      {/* 1. HERO 5 DETIK PERTAMA: DUA KOLOM DESKTOP & DEMO TRANSFORMATIF */}
      <section className="relative pt-4 sm:pt-6 lg:pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start lg:items-center">
          {/* Kolom Kiri: Teks Rata Kiri & Aksi Cepat (Terbaca Penuh < 0,3s) */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-3.5 sm:space-y-4">
            <div className="inline-flex items-center gap-1.5 border border-border bg-muted/60 px-2.5 py-1 text-xs text-foreground font-medium rounded-[6px] w-fit">
              <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Meja Kerja Analisis Skripsi Kuantitatif</span>
            </div>

            <h1 className="text-xl sm:text-3xl lg:text-[2.15rem] font-bold tracking-tight text-foreground leading-[1.22]">
              {COPY.hero.title}
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[54ch]">
              {COPY.hero.subtitle}
            </p>

            <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              <Button asChild size="default" className="font-semibold text-xs px-5 min-h-[44px] h-11 rounded-[10px] shadow-xs">
                <Link href="/app/proyek/baru?contoh=1">
                  <span>{COPY.hero.ctaPrimary}</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="default" className="text-xs px-4 min-h-[44px] h-11 rounded-[10px]">
                <Link href="/app/proyek/baru">
                  {COPY.hero.ctaSecondary}
                </Link>
              </Button>
            </div>

            <div className="pt-0.5 text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
              <span>{COPY.hero.microCopy}</span>
            </div>
          </div>

          {/* Kolom Kanan: Demo Hidup Bertransformasi (0,3s - 5,0s) */}
          <div className="lg:col-span-7 w-full">
            <LiveDemo />
          </div>
        </div>
      </section>

      {/* 2. ALUR KERJA METODOLOGI (EDITORIAL CHECKLIST, NOT 01-04 SAAS CARDS) */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="border-t border-border/80 pt-10">
          <div className="max-w-2xl mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {COPY.howItWorks.title}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
              Empat tahapan sistematis dari tabulasi mentah hingga lembar lampiran skripsi siap sidang.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {COPY.howItWorks.steps.map((step) => (
              <div
                key={step.number}
                className="rounded-[16px] border border-border bg-card p-5 flex flex-col justify-between space-y-3 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mb-2">
                    <span className="font-semibold text-primary">Langkah {step.number}</span>
                    <span>Tahap {step.number} dari 4</span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1.5 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-[68ch]">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CONTOH TABEL BAB 4 DENGAN PENJELASAN (INTERACTIVE DEMO) */}
      <section id="contoh-hasil" className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full scroll-mt-20">
        <div className="border-t border-border/80 pt-10 mb-6">
          <div className="max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Format Tabel Bab 4 Siap Salin ke Word
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-[68ch]">
              Tabel jurnal ilmiah standar APA 7th Edition tanpa garis vertikal, dilengkapi interpretasi naratif bahasa Indonesia baku.
            </p>
          </div>
        </div>

        {/* Interactive Bab 4 Preview Component */}
        <Bab4Preview />
      </section>

      {/* 4. DAFTAR UJI STATISTIK YANG DIDUKUNG */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="border-t border-border/80 pt-10 mb-6">
          <div className="max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {COPY.availableTests.title}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-[68ch]">
              Seluruh pengujian statistik yang dipersyaratkan dalam skripsi kuantitatif manajemen, psikologi, pendidikan, dan ilmu sosial.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COPY.availableTests.tests.map((test, index) => (
            <Card
              key={index}
              className="border border-border bg-card shadow-xs rounded-[16px]"
            >
              <CardHeader className="p-4 sm:p-5 pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">
                  {test.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-0">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {test.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 5. YANG TIDAK KAMI LAKUKAN (KOMITMEN INTEGRITAS AKADEMIK) */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="rounded-[16px] border border-[#F7B3AF] dark:border-red-800/60 bg-[#FDEEED]/40 dark:bg-red-950/20 p-5 sm:p-7 space-y-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-[#E8574F] shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A1E18] dark:text-red-300 mb-0.5">
                Komitmen Integritas Akademik
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                {COPY.notDoing.title}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-[68ch]">
                Kejujuran ilmiah adalah landasan kelulusan Anda. {APP_NAME} memegang teguh batasan etika penelitian berikut:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {COPY.notDoing.items.map((item, idx) => (
              <div
                key={idx}
                className="rounded-[10px] border border-border/80 bg-card p-4 space-y-1.5 shadow-2xs"
              >
                <div className="flex items-center gap-1.5 text-[#E8574F] text-xs font-semibold">
                  <span>✕</span>
                  <h3 className="text-foreground font-semibold text-xs">
                    {item.title}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-border/60 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              Ingin menyertakan lembar keterangan transparan di lampiran skripsi Anda?
            </span>
            <Button asChild variant="link" className="text-xs font-semibold text-primary">
              <Link href="/pernyataan-penggunaan">
                Lihat Format Pernyataan Penggunaan Alat &rarr;
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 6. PRICING SECTION PREVIEW */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="border-t border-border/80 pt-10 mb-6">
          <div className="max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {COPY.pricing.title}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-[68ch]">
              {COPY.pricing.subtitle}
            </p>
          </div>
        </div>

        <PricingCards />
      </section>

      {/* 7. FAQ SECTION */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
        <div className="border-t border-border/80 pt-10 mb-6">
          <div className="max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {COPY.faq.title}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-[68ch]">
              Hal-hal yang sering ditanyakan mahasiswa sebelum memulai analisis kuesioner.
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {COPY.faq.items.map((item, idx) => (
            <details
              key={idx}
              className="group rounded-[10px] border border-border bg-card overflow-hidden transition-colors shadow-2xs"
              open={idx === 0}
            >
              <summary className="w-full p-4 text-left flex items-center justify-between gap-4 text-xs sm:text-sm font-semibold text-foreground cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                  {item.q}
                </h3>
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 group-open:rotate-180 group-open:text-primary"
                  aria-hidden="true"
                />
              </summary>
              <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-3 max-w-[68ch]">
                <p>{item.a}</p>
                {idx === 0 && (
                  <div className="mt-2.5 pt-2 border-t border-border/40">
                    <Link
                      href="#contoh-hasil"
                      className="inline-flex items-center gap-1 text-primary font-medium hover:underline text-xs"
                    >
                      Lihat contoh cara memeriksa hasil di tabel Bab 4 &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* 8. CTA FOOTER SECTION */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="rounded-[16px] border border-border bg-card p-6 sm:p-8 text-center space-y-4 shadow-xs">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Buka meja kerja skripsi Anda hari ini
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Tanpa instalasi perangkat lunak berat, tanpa lisensi mahal, dan tanpa rumus yang membingungkan. Mulai dengan dataset kuesioner Anda sendiri atau pelajari data simulasi.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="default" className="w-full sm:w-auto font-semibold text-xs px-5 h-10 rounded-[10px]">
              <Link href="/app/proyek/baru?contoh=1">
                <span>Coba Gratis (Data Contoh 60 Detik)</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="default" className="w-full sm:w-auto text-xs h-10 rounded-[10px]">
              <Link href="/pernyataan-penggunaan">
                Format Lampiran Skripsi
              </Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            {COPY.reassurance.saved}
          </p>
        </div>
      </section>
    </div>
  );
}
