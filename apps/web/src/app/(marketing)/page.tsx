'use client';

import * as React from 'react';
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

export default function MarketingPage() {
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(0);
  const [demoHoveredNumber, setDemoHoveredNumber] = React.useState<string | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="flex flex-col gap-16 sm:gap-20 pb-16">
      {/* 1. HERO & INTERACTIVE WORKBENCH (ABOVE THE FOLD) */}
      <section className="relative pt-8 sm:pt-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Section Header */}
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-1.5 border border-border bg-muted/60 px-2.5 py-1 text-xs text-foreground font-medium rounded-[6px] mb-3">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span>Meja Kerja Analisis Data Kuesioner Skripsi Kuantitatif</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.18]">
            {COPY.hero.title}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-[68ch]">
            {COPY.hero.subtitle}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button asChild size="default" className="font-semibold text-xs px-4 h-10 rounded-[10px]">
              <Link href="/app/proyek/baru">
                <span>Coba dengan Data Contoh (60 Detik)</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="default" className="text-xs h-10 rounded-[10px]">
              <a href="#contoh-hasil">
                {COPY.hero.ctaSecondary}
              </a>
            </Button>
            <span className="text-xs text-muted-foreground ml-1 tabular-nums">
              Gratis 1 proyek aktif &bull; Tanpa kartu kredit
            </span>
          </div>
        </div>

        {/* Live Interactive Split Workbench Demonstration */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 rounded-[16px] border border-border bg-card p-5 sm:p-6 shadow-xs">
          {/* Left Column: Questionnaire Input Simulation */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4 border-b lg:border-b-0 lg:border-r border-border pb-5 lg:pb-0 lg:pr-5">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-border/60 mb-3">
                <div className="flex items-center gap-2">
                  <TableIcon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    Tabulasi Kuesioner (.xlsx / .csv)
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-muted/40 rounded-[6px]">
                  N = 120 Responden
                </Badge>
              </div>

              {/* Data Matrix Preview */}
              <div className="overflow-x-auto border border-border/70 rounded-[6px] bg-muted/20">
                <table className="table-journal w-full text-xs font-sans">
                  <thead>
                    <tr className="border-b border-border bg-muted/60 text-muted-foreground text-[11px]">
                      <th className="py-1.5 px-2 font-medium">Resp</th>
                      <th className="py-1.5 px-2 text-right font-medium">X1.1</th>
                      <th className="py-1.5 px-2 text-right font-medium">X1.2</th>
                      <th className="py-1.5 px-2 text-right font-medium">X1.3</th>
                      <th className="py-1.5 px-2 text-right font-medium font-semibold text-foreground">Total X1</th>
                      <th className="py-1.5 px-2 text-right font-medium font-semibold text-foreground">Y</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums text-foreground/80 text-[11px]">
                    <tr className="border-b border-border/50">
                      <td className="py-1.5 px-2 text-muted-foreground">R001</td>
                      <td className="py-1.5 px-2 text-right">4</td>
                      <td className="py-1.5 px-2 text-right">5</td>
                      <td className="py-1.5 px-2 text-right">4</td>
                      <td className="py-1.5 px-2 text-right font-semibold">13</td>
                      <td className="py-1.5 px-2 text-right">18</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-1.5 px-2 text-muted-foreground">R002</td>
                      <td className="py-1.5 px-2 text-right">3</td>
                      <td className="py-1.5 px-2 text-right">4</td>
                      <td className="py-1.5 px-2 text-right">3</td>
                      <td className="py-1.5 px-2 text-right font-semibold">10</td>
                      <td className="py-1.5 px-2 text-right">15</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-1.5 px-2 text-muted-foreground">R003</td>
                      <td className="py-1.5 px-2 text-right">5</td>
                      <td className="py-1.5 px-2 text-right">5</td>
                      <td className="py-1.5 px-2 text-right">5</td>
                      <td className="py-1.5 px-2 text-right font-semibold">15</td>
                      <td className="py-1.5 px-2 text-right">20</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2 text-muted-foreground">R004</td>
                      <td className="py-1.5 px-2 text-right">4</td>
                      <td className="py-1.5 px-2 text-right">4</td>
                      <td className="py-1.5 px-2 text-right">4</td>
                      <td className="py-1.5 px-2 text-right font-semibold">12</td>
                      <td className="py-1.5 px-2 text-right">17</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                Item kuesioner skala Likert otomatis dikelompokkan ke dalam konstruk variabel X dan Y.
              </p>
            </div>

            <div className="pt-2.5 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Punya berkas sendiri?</span>
              <Button asChild size="sm" variant="outline" className="text-xs h-8 rounded-[10px]">
                <Link href="/app/proyek/baru">Unggah Berkas</Link>
              </Button>
            </div>
          </div>

          {/* Right Column: Live Output Table with Connected Number Sync */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-border/60 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground">
                    Tabel 4.12 Hasil Uji Regresi Linier
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-muted/40 rounded-[6px]">
                  Format Baku APA 7th
                </Badge>
              </div>

              {/* Connected Table */}
              <div className="overflow-x-auto border border-border/70 rounded-[6px] bg-card">
                <table className="table-journal w-full text-xs font-sans">
                  <thead>
                    <tr className="border-b border-foreground text-[11px] font-semibold text-foreground">
                      <th className="py-2 px-2.5">Variabel</th>
                      <th className="py-2 px-2.5 text-right">Koefisien (B)</th>
                      <th className="py-2 px-2.5 text-right">t Hitung</th>
                      <th className="py-2 px-2.5 text-right">Sig. (p)</th>
                      <th className="py-2 px-2.5 text-center">Simpulan</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums text-xs">
                    <tr className="border-b border-border">
                      <td className="py-2 px-2.5 font-medium">Konstanta</td>
                      <td className="py-2 px-2.5 text-right">2,410</td>
                      <td className="py-2 px-2.5 text-right">3,124</td>
                      <td className="py-2 px-2.5 text-right">0,002</td>
                      <td className="py-2 px-2.5 text-center text-muted-foreground">-</td>
                    </tr>
                    <tr className="border-b-2 border-foreground">
                      <td className="py-2 px-2.5 font-medium">Motivasi Kerja (X1)</td>
                      <td
                        className={cn(
                          'py-2 px-2.5 text-right font-medium transition-all cursor-pointer',
                          demoHoveredNumber === '0,482' && 'bg-[#FFE14D] text-[#243044] font-bold ring-2 ring-[#FFE14D] rounded-[4px]'
                        )}
                        onMouseEnter={() => setDemoHoveredNumber('0,482')}
                        onMouseLeave={() => setDemoHoveredNumber(null)}
                      >
                        0,482
                      </td>
                      <td
                        className={cn(
                          'py-2 px-2.5 text-right font-medium transition-all cursor-pointer',
                          demoHoveredNumber === '4,819' && 'bg-[#FFE14D] text-[#243044] font-bold ring-2 ring-[#FFE14D] rounded-[4px]'
                        )}
                        onMouseEnter={() => setDemoHoveredNumber('4,819')}
                        onMouseLeave={() => setDemoHoveredNumber(null)}
                      >
                        4,819
                      </td>
                      <td
                        className={cn(
                          'py-2 px-2.5 text-right transition-all cursor-pointer',
                          demoHoveredNumber === '0,000' && 'bg-[#FFE14D] text-[#243044] font-bold ring-2 ring-[#FFE14D] rounded-[4px]'
                        )}
                        onMouseEnter={() => setDemoHoveredNumber('0,000')}
                        onMouseLeave={() => setDemoHoveredNumber(null)}
                      >
                        0,000
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <span className="text-[11px] font-semibold text-[#0E4331] bg-[#BFEBD9] px-2 py-0.5 rounded-[4px]">
                          Signifikan
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Connected Narrative Box */}
            <div className="rounded-[10px] border border-border/80 bg-muted/30 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground border-b border-border/40 pb-1.5">
                <span className="font-medium text-foreground">Interpretasi Narasi Bab 4 (Tersambung ke Sel):</span>
                <span>Rumus OLS α=0,05</span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed font-sans max-w-[68ch]">
                Nilai koefisien regresi variabel Motivasi Kerja (X1) adalah{' '}
                <button
                  type="button"
                  onMouseEnter={() => setDemoHoveredNumber('0,482')}
                  onMouseLeave={() => setDemoHoveredNumber(null)}
                  className={cn(
                    'inline-block px-1.5 py-0.5 rounded-[4px] font-semibold tabular-nums border border-border/80 cursor-pointer transition-all',
                    demoHoveredNumber === '0,482' ? 'bg-[#FFE14D] text-[#243044] border-[#FFE14D] ring-2 ring-[#FFE14D]' : 'bg-card'
                  )}
                >
                  0,482
                </button>
                {' '}dengan nilai t-hitung sebesar{' '}
                <button
                  type="button"
                  onMouseEnter={() => setDemoHoveredNumber('4,819')}
                  onMouseLeave={() => setDemoHoveredNumber(null)}
                  className={cn(
                    'inline-block px-1.5 py-0.5 rounded-[4px] font-semibold tabular-nums border border-border/80 cursor-pointer transition-all',
                    demoHoveredNumber === '4,819' ? 'bg-[#FFE14D] text-[#243044] border-[#FFE14D] ring-2 ring-[#FFE14D]' : 'bg-card'
                  )}
                >
                  4,819
                </button>
                {' '}dan signifikansi{' '}
                <button
                  type="button"
                  onMouseEnter={() => setDemoHoveredNumber('0,000')}
                  onMouseLeave={() => setDemoHoveredNumber(null)}
                  className={cn(
                    'inline-block px-1.5 py-0.5 rounded-[4px] font-semibold tabular-nums border border-border/80 cursor-pointer transition-all',
                    demoHoveredNumber === '0,000' ? 'bg-[#FFE14D] text-[#243044] border-[#FFE14D] ring-2 ring-[#FFE14D]' : 'bg-card'
                  )}
                >
                  0,000
                </button>
                . Karena t-hitung 4,819 &gt; 1,984 (t-tabel) dan nilai sig. 0,000 &lt; 0,05, maka hipotesis pertama diterima.
              </p>
            </div>
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
                <CardTitle className="text-sm font-semibold text-foreground flex items-center justify-between">
                  <span>{test.name}</span>
                  <span className="text-[11px] font-mono text-muted-foreground font-normal">
                    #{index + 1}
                  </span>
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
                Kejujuran ilmiah adalah landasan kelulusanmu. {APP_NAME} memegang teguh batasan etika penelitian berikut:
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
              Ingin menyertakan lembar keterangan transparan di lampiran skripsimu?
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
          {COPY.faq.items.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-[10px] border border-border bg-card overflow-hidden transition-colors shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 text-xs sm:text-sm font-semibold text-foreground cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150',
                      isOpen && 'rotate-180 text-primary'
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-3 max-w-[68ch]">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. CTA FOOTER SECTION */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="rounded-[16px] border border-border bg-card p-6 sm:p-8 text-center space-y-4 shadow-xs">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Buka meja kerja skripsimu hari ini
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Tanpa instalasi perangkat lunak berat, tanpa lisensi mahal, dan tanpa rumus yang membingungkan. Mulai dengan dataset kuesionermu sendiri atau pelajari data simulasi.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="default" className="w-full sm:w-auto font-semibold text-xs px-5 h-10 rounded-[10px]">
              <Link href="/app/proyek/baru">
                <span>Coba dengan Data Contoh (60 Detik)</span>
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
