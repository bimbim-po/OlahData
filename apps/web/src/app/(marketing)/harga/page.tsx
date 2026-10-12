'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, X, Building2, Mail, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { COPY } from '@/lib/copy';
import { PricingCards } from '@/components/pricing-cards';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HargaPage() {
  const comparisonFeatures = [
    {
      category: 'Kapasitas & Batasan',
      items: [
        { name: 'Jumlah proyek aktif', free: '1 proyek', monthly: '5 proyek', thesis: 'Tidak terbatas' },
        { name: 'Maksimum responden', free: '50 responden', monthly: 'Tidak terbatas', thesis: 'Tidak terbatas' },
        { name: 'Maksimum butir indikator', free: '30 item', monthly: 'Tidak terbatas', thesis: 'Tidak terbatas' },
        { name: 'Riwayat versi dataset', free: '1 versi', monthly: '5 versi', thesis: 'Riwayat lengkap' },
      ],
    },
    {
      category: 'Cakupan Uji Statistik',
      items: [
        { name: 'Statistik Deskriptif', free: true, monthly: true, thesis: true },
        { name: 'Uji Validitas Pearson', free: true, monthly: true, thesis: true },
        { name: "Uji Reliabilitas Cronbach's Alpha", free: false, monthly: true, thesis: true },
        { name: 'Uji Normalitas (Kolmogorov-Smirnov)', free: false, monthly: true, thesis: true },
        { name: 'Uji Multikolinearitas (VIF & Tol)', free: false, monthly: true, thesis: true },
        { name: 'Uji Heteroskedastisitas (Glejser)', free: false, monthly: true, thesis: true },
        { name: 'Regresi Linier Berganda (Uji t, Uji F, R²)', free: false, monthly: true, thesis: true },
        { name: 'Korelasi Pearson & ANOVA', free: false, monthly: true, thesis: true },
      ],
    },
    {
      category: 'Hasil & Ekspor',
      items: [
        { name: 'Format tabel APA 7th Edition', free: true, monthly: true, thesis: true },
        { name: 'Naskah penjelasan interpretasi Bab 4', free: true, monthly: true, thesis: true },
        { name: 'Jejak Hitung (Audit Trail)', free: true, monthly: true, thesis: true },
        { name: 'Ekspor Word (.docx) & PDF', free: 'Dengan tanda air', monthly: 'Bebas tanda air', thesis: 'Bebas tanda air' },
        { name: 'Dokumen Pernyataan Penggunaan Alat', free: false, monthly: true, thesis: true },
      ],
    },
  ];

  const pricingFaq = [
    {
      q: 'Metode pembayaran apa saja yang didukung?',
      a: 'Pembayaran mendukung QRIS (GoPay, OVO, Dana, ShopeePay), Transfer Bank Virtual Account (BCA, Mandiri, BNI, BRI), dan kartu debit online.',
    },
    {
      q: 'Apakah paket bulanan otomatis memperpanjang langganan?',
      a: 'Tidak ada perpanjangan otomatis tanpa persetujuan Anda. Anda membayar hanya untuk periode yang Anda pilih.',
    },
    {
      q: 'Apakah data saya hilang jika masa aktif langganan habis?',
      a: 'Data dan hasil analisis Anda tetap tersimpan dengan aman di akun Anda dan dapat diakses kembali kapan pun Anda memperbarui paket.',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 space-y-16">
      {/* Title & Disclaimer */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold">
          Investasi Skripsi
        </Badge>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
          {COPY.pricing.title}
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          {COPY.pricing.subtitle}. Investasi terjangkau untuk ketenangan dan kecepatan pengerjaan Bab 4 skripsi Anda.
        </p>
      </div>

      {/* Pricing Cards */}
      <PricingCards showDisclaimer={true} />

      {/* Campus Contact Row */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-primary/10 p-3 text-primary shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground">
                Paket Institusi & Program Studi Kampus
              </h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-2xl leading-relaxed">
                {COPY.pricing.campusNote} Kami menyediakan lisensi laboratorium, pelatihan dosen pembimbing, serta integrasi kurikulum metodologi penelitian kuantitatif.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <Button asChild variant="outline" className="gap-2 w-full md:w-auto font-medium">
              <a href="mailto:institusi@olahdata.id">
                <Mail className="h-4 w-4" />
                <span>Hubungi Tim Kampus</span>
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
            Perbandingan Rinci Fitur
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Lihat detail perbandingan paket untuk menentukan pilihan yang paling sesuai.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-foreground">
                <th className="py-4 px-4 sm:px-6 w-1/2">Fitur Analisis</th>
                <th className="py-4 px-3 sm:px-4 text-center w-1/6">Coba Gratis</th>
                <th className="py-4 px-3 sm:px-4 text-center w-1/6 bg-primary/5 text-primary">Bulanan</th>
                <th className="py-4 px-3 sm:px-4 text-center w-1/6">Paket Skripsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {comparisonFeatures.map((section, sIdx) => (
                <React.Fragment key={sIdx}>
                  <tr className="bg-muted/20 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    <td colSpan={4} className="py-3 px-4 sm:px-6">
                      {section.category}
                    </td>
                  </tr>
                  {section.items.map((item, iIdx) => (
                    <tr key={iIdx} className="hover:bg-muted/15 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-medium text-foreground">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 text-center text-xs text-muted-foreground">
                        {typeof item.free === 'boolean' ? (
                          item.free ? (
                            <Check className="h-4 w-4 text-primary mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                          )
                        ) : (
                          item.free
                        )}
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 text-center text-xs bg-primary/5 font-medium text-foreground">
                        {typeof item.monthly === 'boolean' ? (
                          item.monthly ? (
                            <Check className="h-4 w-4 text-primary mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                          )
                        ) : (
                          item.monthly
                        )}
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 text-center text-xs text-muted-foreground">
                        {typeof item.thesis === 'boolean' ? (
                          item.thesis ? (
                            <Check className="h-4 w-4 text-primary mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                          )
                        ) : (
                          item.thesis
                        )}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pricing Mini FAQ */}
      <div className="max-w-3xl mx-auto space-y-6 pt-4">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground text-center">
          Pertanyaan Seputar Pembayaran
        </h2>
        <div className="space-y-3">
          {pricingFaq.map((faq, i) => (
            <Card key={i} className="border-border bg-card">
              <CardContent className="p-5 space-y-1.5">
                <h4 className="font-serif font-bold text-sm sm:text-base text-foreground">
                  {faq.q}
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center pt-8 border-t border-border">
        <h3 className="font-serif text-2xl font-bold text-foreground mb-3">
          Siap menyelesaikan Bab 4 Anda minggu ini?
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Daftar gratis tanpa kartu kredit dan uji data kuesioner Anda sekarang.
        </p>
        <Button asChild size="lg" className="font-semibold gap-2">
          <Link href="/daftar">
            <span>Mulai Uji Coba Gratis</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
