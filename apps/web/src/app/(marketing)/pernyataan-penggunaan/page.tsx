'use client';

import * as React from 'react';
import Link from 'next/link';
import { Copy, Check, ShieldCheck, AlertCircle, FileCheck, ArrowRight, BookOpen } from 'lucide-react';
import { APP_NAME, APP_VERSION } from '@/lib/constants';
import { COPY } from '@/lib/copy';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toaster';

export function PernyataanPenggunaanPage() {
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();

  const templateText = COPY.toolStatement.template.replace('[VERSI]', APP_VERSION);

  const handleCopy = () => {
    navigator.clipboard.writeText(templateText);
    setCopied(true);
    toast({
      title: 'Templat berhasil disalin!',
      description: 'Tempelkan ke berkas naskah atau lampiran skripsi Anda.',
      variant: 'success',
    });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="pine" className="text-xs font-medium">
            Panduan Integritas Akademik
          </Badge>
          <Badge variant="outline" className="text-xs">
            Etika Riset
          </Badge>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
          {COPY.toolStatement.title}
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          {COPY.toolStatement.description}
        </p>
      </div>

      {/* Advisory Banner */}
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-5 sm:p-6 dark:border-amber-900/60 dark:bg-amber-950/20 flex items-start gap-4">
        <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-sm text-foreground/90">
          <h3 className="font-serif font-bold text-base text-amber-950 dark:text-amber-300">
            Saran Konsultasi Pembimbing
          </h3>
          <p className="text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
            {COPY.toolStatement.advice} Setiap universitas dan program studi memiliki pedoman penulisan karya ilmiah masing-masing. Diskusikan format pernyataan ini kepada dosen pembimbing Anda untuk memastikan kesesuaian dengan ketentuan akademik setempat.
          </p>
        </div>
      </div>

      {/* Why is this needed? */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Mengapa Pernyataan Ini Diperlukan?
        </h2>
        <div className="text-sm sm:text-base text-muted-foreground leading-relaxed space-y-3">
          <p>
            Dalam tradisi keilmuan kontemporer, transparansi metodologi penelitian merupakan indikator utama kualitas dan integritas karya ilmiah. Menyatakan secara terbuka alat bantu perangkat lunak yang digunakan bukanlah kelemahan, melainkan wujud kejujuran ilmiah yang diakui standar internasional (seperti APA Style 7th Edition dan Committee on Publication Ethics / COPE).
          </p>
          <p>
            Dengan melampirkan pernyataan ini, Anda menegaskan dua hal krusial bagi dewan penguji skripsi:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Card className="border-border bg-card">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-primary font-serif font-bold text-sm">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Orisinalitas Data Primer</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Data survei kuesioner adalah data riil yang Anda kumpulkan sendiri dari responden, bukan hasil fabrikasi sistem atau simulasi kecerdasan buatan.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-primary font-serif font-bold text-sm">
                  <FileCheck className="h-4 w-4" />
                  <span>Validitas Deterministik</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Angka-angka statistik dihitung dengan algoritma matematis pasti (deterministik), sedangkan narasi AI diverifikasi secara sadar oleh Anda sebagai peneliti.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive Copyable Template Box */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            Templat Pernyataan Baku
          </h2>
          <Button
            onClick={handleCopy}
            variant="default"
            size="sm"
            className="gap-2 font-medium"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span>Tersalin ke Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Salin templat</span>
              </>
            )}
          </Button>
        </div>

        <div className="relative rounded-2xl border-2 border-primary/20 bg-card p-6 shadow-xs font-mono text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap select-all">
          {templateText}
        </div>
        <p className="text-xs text-muted-foreground">
          Tip: Ganti <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">[NOMOR LAMPIRAN]</code> dengan nomor lampiran aktual di naskah skripsi Anda (misalnya: Lampiran 4 atau Lampiran C).
        </p>
      </section>

      {/* Cara Penempatan dalam Skripsi */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Tata Cara Penempatan dalam Skripsi
        </h2>
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-2">
            <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">1</span>
              <span>1. Bab 3: Bagian Metode Penelitian (Teknik Analisis Data)</span>
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-8">
              Sebutkan secara singkat di akhir sub-bab teknik analisis data: <em>&ldquo;Pengolahan data statistik dibantu menggunakan perangkat lunak {APP_NAME} versi {APP_VERSION} untuk uji validitas, reliabilitas, uji asumsi klasik, dan analisis regresi.&rdquo;</em>
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-2">
            <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">2</span>
              <span>2. Bagian Lampiran (Appendix)</span>
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-8">
              Cantumkan templat teks pernyataan di atas pada halaman pengantar lampiran hasil olah data, diikuti dengan lembar Jejak Hitung (Audit Trail) dan tabel luaran statistik lengkap yang diekspor dari {APP_NAME}.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <div className="rounded-2xl border border-border bg-muted/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-serif font-bold text-base text-foreground">
            Sudah siap melakukan uji statistik kuesioner?
          </h4>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Mulai proyek baru dan dapatkan lembar jejak hitung otomatis.
          </p>
        </div>
        <Button asChild className="gap-2 shrink-0">
          <Link href="/app/proyek/baru">
            <span>Buka Proyek Baru</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default PernyataanPenggunaanPage;
