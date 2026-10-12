'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, X, Building2, Mail, ArrowRight } from 'lucide-react';
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
        { name: 'Maksimum data responden', free: '50 responden', monthly: 'Tidak terbatas', thesis: 'Tidak terbatas' },
        { name: 'Maksimum butir pertanyaan', free: '30 item', monthly: 'Tidak terbatas', thesis: 'Tidak terbatas' },
        { name: 'Riwayat versi dataset', free: '1 versi', monthly: '5 versi', thesis: 'Riwayat lengkap' },
      ],
    },
    {
      category: 'Cakupan Uji Statistik',
      items: [
        { name: 'Statistik Deskriptif', free: true, monthly: true, thesis: true },
        { name: 'Uji Validitas Pearson Product Moment', free: true, monthly: true, thesis: true },
        { name: "Uji Reliabilitas Cronbach's Alpha", free: false, monthly: true, thesis: true },
        { name: 'Uji Normalitas (Kolmogorov-Smirnov)', free: false, monthly: true, thesis: true },
        { name: 'Uji Multikolinearitas (VIF & Tolerance)', free: false, monthly: true, thesis: true },
        { name: 'Uji Heteroskedastisitas (Glejser)', free: false, monthly: true, thesis: true },
        { name: 'Regresi Linier Berganda (Uji t, Uji F, R²)', free: false, monthly: true, thesis: true },
        { name: 'Korelasi Pearson & ANOVA Satu Arah', free: false, monthly: true, thesis: true },
      ],
    },
    {
      category: 'Hasil & Ekspor',
      items: [
        { name: 'Format tabel standar APA 7th Edition', free: true, monthly: true, thesis: true },
        { name: 'Naskah interpretasi kaidah Bab 4', free: true, monthly: true, thesis: true },
        { name: 'Jejak Hitung (Audit Trail formula)', free: true, monthly: true, thesis: true },
        { name: 'Ekspor Word (.docx) & PDF', free: 'Dengan penanda air', monthly: 'Bebas penanda air', thesis: 'Bebas penanda air' },
        { name: 'Dokumen Pernyataan Penggunaan Alat', free: false, monthly: true, thesis: true },
      ],
    },
  ];

  const pricingFaq = [
    {
      q: 'Metode pembayaran apa saja yang didukung?',
      a: 'Pembayaran mendukung QRIS (GoPay, OVO, Dana, ShopeePay), Transfer Virtual Account Bank Nasional (BCA, Mandiri, BNI, BRI), dan kartu debit online berlogo Visa/Mastercard.',
    },
    {
      q: 'Apakah paket bulanan otomatis memotong saldo?',
      a: 'Tidak ada perpanjangan otomatis tanpa persetujuanmu. Kamu membayar hanya untuk jangka waktu yang kamu pilih.',
    },
    {
      q: 'Apakah data proyek hilang jika masa aktif langganan habis?',
      a: 'Data dan seluruh riwayat analisismu tetap tersimpan aman di akunmu dan dapat kamu buka kembali kapan pun kamu memperbarui paket.',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 space-y-12">
      {/* Title & Disclaimer */}
      <div className="text-center max-w-2xl mx-auto space-y-2.5">
        <div className="inline-flex items-center gap-1.5 border border-border bg-muted/60 px-2 py-0.5 text-xs text-foreground font-medium rounded-xs">
          Investasi Skripsi
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
          {COPY.pricing.title}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {COPY.pricing.subtitle}. Akses terjangkau untuk ketenangan dan kelancaran persiapan sidang skripsimu.
        </p>
      </div>

      {/* Pricing Cards */}
      <PricingCards showDisclaimer={true} />

      {/* Campus Contact Row */}
      <div className="rounded-md border border-border bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-3.5">
            <div className="rounded-xs bg-muted p-2.5 text-primary shrink-0 border border-border">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Paket Institusi & Laboratorium Kampus
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-2xl leading-relaxed">
                {COPY.pricing.campusNote} Kami menyediakan lisensi laboratorium komputer kampus, lokakarya metodologi kuantitatif, dan akun institusi terpusat.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <Button asChild variant="outline" size="sm" className="gap-2 w-full md:w-auto font-medium text-xs">
              <a href="mailto:institusi@olahdata.id">
                <Mail className="h-3.5 w-3.5" />
                <span>Hubungi Tim Kampus</span>
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="space-y-4">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Perbandingan Rinci Fitur
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Periksa detail batasan dan cakupan setiap paket untuk memilih yang paling sesuai dengan kebutuhanmu.
          </p>
        </div>

        <div className="overflow-x-auto rounded-md border border-border bg-card shadow-xs">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-foreground">
                <th className="py-3 px-4 w-1/2">Fitur Analisis</th>
                <th className="py-3 px-3 text-center w-1/6">Coba Gratis</th>
                <th className="py-3 px-3 text-center w-1/6 bg-accent text-primary">Bulanan</th>
                <th className="py-3 px-3 text-center w-1/6">Paket Skripsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {comparisonFeatures.map((section, sIdx) => (
                <React.Fragment key={sIdx}>
                  <tr className="bg-muted/20 font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
                    <td colSpan={4} className="py-2.5 px-4">
                      {section.category}
                    </td>
                  </tr>
                  {section.items.map((item, iIdx) => (
                    <tr key={iIdx} className="hover:bg-muted/15 transition-colors">
                      <td className="py-2.5 px-4 font-medium text-foreground">
                        {item.name}
                      </td>
                      <td className="py-2.5 px-3 text-center text-xs text-muted-foreground">
                        {typeof item.free === 'boolean' ? (
                          item.free ? (
                            <Check className="h-3.5 w-3.5 text-primary mx-auto" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-muted-foreground/40 mx-auto" />
                          )
                        ) : (
                          item.free
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center text-xs bg-accent/40 font-medium text-foreground">
                        {typeof item.monthly === 'boolean' ? (
                          item.monthly ? (
                            <Check className="h-3.5 w-3.5 text-primary mx-auto" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-muted-foreground/40 mx-auto" />
                          )
                        ) : (
                          item.monthly
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center text-xs text-muted-foreground">
                        {typeof item.thesis === 'boolean' ? (
                          item.thesis ? (
                            <Check className="h-3.5 w-3.5 text-primary mx-auto" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-muted-foreground/40 mx-auto" />
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
      <div className="max-w-2xl mx-auto space-y-4 pt-2">
        <h2 className="text-lg sm:text-xl font-bold text-foreground text-center">
          Pertanyaan Seputar Transaksi
        </h2>
        <div className="space-y-2">
          {pricingFaq.map((faq, i) => (
            <Card key={i} className="border-border bg-card rounded-xs">
              <CardContent className="p-4 space-y-1">
                <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                  {faq.q}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {faq.a}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center pt-6 border-t border-border">
        <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
          Siap menguji data kuesionermu minggu ini?
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Daftar gratis tanpa kartu kredit dan buka meja kerja analisismu sekarang.
        </p>
        <Button asChild size="default" className="font-semibold text-xs px-5">
          <Link href="/daftar">
            <span>Buka Meja Kerja Gratis</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
