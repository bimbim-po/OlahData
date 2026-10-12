'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Upload,
  Sliders,
  CheckCircle,
  FileText,
  ShieldAlert,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Sparkles,
  ChevronDown,
  Layers,
  Database,
  Calculator,
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { COPY } from '@/lib/copy';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Bab4Preview } from '@/components/bab4-preview';
import { PricingCards } from '@/components/pricing-cards';
import { cn } from '@/lib/utils';

export default function MarketingPage() {
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const stepIcons = [Upload, Sliders, Calculator, FileText];

  return (
    <div className="flex flex-col gap-20 sm:gap-28 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        {/* Subtle pill badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs sm:text-sm text-primary font-medium mb-6 animate-in fade-in">
          <BookOpen className="h-4 w-4" />
          <span>Khusus Analisis Kuesioner Skripsi Kuantitatif</span>
        </div>

        {/* Serif title */}
        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.15]">
          {COPY.hero.title}
        </h1>

        {/* Clear subtitle */}
        <p className="mt-6 text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          {COPY.hero.subtitle}
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Button asChild size="lg" className="w-full sm:w-auto font-semibold gap-2 shadow-sm">
            <Link href="/daftar">
              <span>{COPY.hero.ctaPrimary}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto text-foreground font-medium"
          >
            <a href="#contoh-hasil">
              {COPY.hero.ctaSecondary}
            </a>
          </Button>
        </div>

        {/* Academic Proof Points */}
        <div className="mt-12 pt-8 border-t border-border/60 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-1.5">
            <span className="font-semibold text-foreground">Formula Pasti</span> (Bukan tebakan AI)
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="font-semibold text-foreground">Format APA 7th</span> (Standar Bab 4)
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="font-semibold text-foreground">Jejak Hitung</span> Transparan
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="font-semibold text-foreground">Privasi Data</span> Terjaga Aman
          </div>
        </div>
      </section>

      {/* 2. 4-LANGKAH CARA KERJA */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <Badge variant="outline" className="mb-3 text-xs uppercase tracking-wider font-semibold">
            Alur Riset
          </Badge>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
            {COPY.howItWorks.title}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            Empat langkah terstruktur dari lembar tabulasi kuesioner hingga tabel siap dicetak.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {COPY.howItWorks.steps.map((step, idx) => {
            const Icon = stepIcons[idx] || CheckCircle;
            return (
              <div
                key={step.number}
                className="relative rounded-2xl border border-border bg-card p-6 flex flex-col justify-between transition-all hover:border-primary/50 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-serif text-3xl font-bold text-primary/40">
                      0{step.number}
                    </span>
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. CONTOH TABEL BAB 4 DENGAN PENJELASAN */}
      <section id="contoh-hasil" className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="outline" className="mb-3 text-xs uppercase tracking-wider font-semibold">
            Pratinjau Hasil
          </Badge>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
            Format Bab 4 yang Siap Salin ke Word
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            Bukan sekadar deretan angka mentah. Kami menyajikan tabel akademik baku lengkap dengan narasi interpretasi data.
          </p>
        </div>

        {/* Interactive Bab 4 Preview Component */}
        <Bab4Preview />
      </section>

      {/* 4. DAFTAR UJI YANG TERSEDIA */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <Badge variant="outline" className="mb-3 text-xs uppercase tracking-wider font-semibold">
            Cakupan Analisis
          </Badge>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
            {COPY.availableTests.title}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            Seluruh rangkaian pengujian statistik yang lazim dipersyaratkan dalam skripsi kuantitatif bidang sosial, manajemen, pendidikan, dan kesehatan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {COPY.availableTests.tests.map((test, index) => (
            <Card
              key={index}
              className="border border-border/80 bg-card hover:border-primary/40 transition-colors shadow-xs"
            >
              <CardHeader className="p-5 pb-2">
                <CardTitle className="font-serif text-base font-semibold text-foreground flex items-center justify-between">
                  <span>{test.name}</span>
                  <span className="text-xs font-mono text-muted-foreground font-normal">
                    #{index + 1}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {test.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 5. YANG TIDAK KAMI LAKUKAN (CRITICAL REQUIREMENT) */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="rounded-3xl border-2 border-destructive/30 bg-destructive/5 p-6 sm:p-10 dark:bg-destructive/10">
          <div className="flex flex-col sm:flex-row items-start gap-4 mb-8">
            <div className="rounded-xl bg-destructive/15 p-3 text-destructive">
              <ShieldAlert className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-destructive mb-1">
                Komitmen Integritas Akademik
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
                {COPY.notDoing.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Kejujuran ilmiah adalah landasan kelulusan Anda. {APP_NAME} memegang teguh batas-batas etika penelitian:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COPY.notDoing.items.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-destructive/20 bg-card/80 p-5 shadow-xs backdrop-blur"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive/15 text-destructive text-xs font-bold">
                    ✕
                  </span>
                  <h3 className="font-serif font-bold text-sm sm:text-base text-foreground">
                    {item.title}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-border bg-background p-4 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>
              Ingin menyertakan keterangan transparan di lampiran skripsi Anda?
            </span>
            <Button asChild variant="link" className="text-xs font-semibold text-primary">
              <Link href="/pernyataan-penggunaan">
                Lihat Panduan Pernyataan Penggunaan Alat →
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 6. PRICING SECTION PREVIEW */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="outline" className="mb-3 text-xs uppercase tracking-wider font-semibold">
            Pilihan Paket
          </Badge>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
            {COPY.pricing.title}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            {COPY.pricing.subtitle}
          </p>
        </div>

        <PricingCards />

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            {COPY.pricing.campusNote}{' '}
            <Link href="/harga" className="underline font-medium text-foreground hover:text-primary">
              Pelajari rincian perbandingan paket lengkap di halaman Harga.
            </Link>
          </p>
        </div>
      </section>

      {/* 7. FAQ SECTION */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="outline" className="mb-3 text-xs uppercase tracking-wider font-semibold">
            Tanya Jawab
          </Badge>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
            {COPY.faq.title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Pertanyaan yang kerap ditanyakan mahasiswa sebelum memulai analisis kuesioner.
          </p>
        </div>

        <div className="space-y-3">
          {COPY.faq.items.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-border bg-card overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-serif font-bold text-sm sm:text-base text-foreground cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                      isOpen && 'rotate-180 text-primary'
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. CTA BANNER AT BOTTOM */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="rounded-3xl border border-primary/30 bg-primary/10 dark:bg-primary/20 p-8 sm:p-12 text-center relative overflow-hidden">
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground">
            Mulai olah data skripsi Anda sekarang
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Tanpa perlu instalasi software berat, lisensi mahal, atau rumus yang membingungkan. Unggah dataset dan lihat hasilnya dalam hitungan detik.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="w-full sm:w-auto font-semibold gap-2">
              <Link href="/daftar">
                <span>Coba gratis sekarang</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/pernyataan-penggunaan">
                Panduan Penggunaan Alat
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
