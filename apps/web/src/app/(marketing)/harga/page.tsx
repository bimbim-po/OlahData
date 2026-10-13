'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, X, Building2, Mail, ArrowRight } from 'lucide-react';
import { PricingCards } from '@/components/pricing-cards';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { COMPARISON_SECTIONS, INSTITUTION_PLAN, PLANS } from '@/lib/plans';
import { Breadcrumb } from '@/components/breadcrumb';
import { PageActions } from '@/components/page-actions';

export default function HargaPage() {
  const pricingFaq = [
    {
      q: 'Metode pembayaran apa saja yang didukung?',
      a: 'Pembayaran mendukung QRIS (GoPay, OVO, Dana, ShopeePay), Transfer Virtual Account Bank Nasional (BCA, Mandiri, BNI, BRI), dan kartu debit online berlogo Visa/Mastercard.',
    },
    {
      q: 'Apakah paket bulanan otomatis memotong saldo?',
      a: 'Tidak ada perpanjangan otomatis tanpa persetujuan Anda. Anda membayar hanya untuk jangka waktu yang Anda pilih.',
    },
    {
      q: 'Apakah data proyek hilang jika masa aktif langganan habis?',
      a: 'Data dan seluruh riwayat analisis Anda tetap tersimpan aman di akun Anda dan dapat Anda buka kembali kapan pun Anda memperbarui paket.',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 space-y-10">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Pilihan Harga', href: '/harga' }]} />

      {/* Title & Disclaimer */}
      <div className="text-center max-w-2xl mx-auto space-y-2.5">
        <div className="inline-flex items-center gap-1.5 border border-border bg-muted/60 px-2 py-0.5 text-xs text-foreground font-medium rounded-xs">
          Investasi Skripsi
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
          Pilihan Paket Meja Kerja
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Pilih akses yang sesuai dengan tahapan penyusunan skripsi Anda. Akses terjangkau untuk ketenangan dan kelancaran persiapan sidang skripsi Anda.
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
                {INSTITUTION_PLAN.name}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-2xl leading-relaxed">
                {INSTITUTION_PLAN.description} Kami menyediakan lisensi laboratorium komputer kampus, lokakarya metodologi kuantitatif, dan akun institusi terpusat.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <Button asChild variant="outline" size="sm" className="gap-2 w-full md:w-auto font-medium text-xs">
              <a href={INSTITUTION_PLAN.contactHref}>
                <Mail className="h-3.5 w-3.5" />
                <span>{INSTITUTION_PLAN.ctaText}</span>
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Comparison Table Section */}
      <div className="space-y-4">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Perbandingan Rinci Fitur
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Periksa detail batasan dan cakupan setiap paket untuk memilih yang paling sesuai dengan kebutuhan Anda.
          </p>
        </div>

        {/* Desktop View: Full Matrix Table */}
        <div className="hidden md:block overflow-x-auto rounded-md border border-border bg-card shadow-xs">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-foreground">
                <th scope="col" className="py-3 px-4 w-1/2">Fitur Analisis</th>
                <th scope="col" className="py-3 px-3 text-center w-1/6">Coba Gratis</th>
                <th scope="col" className="py-3 px-3 text-center w-1/6 bg-accent text-primary">Bulanan</th>
                <th scope="col" className="py-3 px-3 text-center w-1/6">Paket Skripsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {COMPARISON_SECTIONS.map((section, sIdx) => (
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

                      {/* Coba Gratis */}
                      <td className="py-2.5 px-3 text-center text-xs text-muted-foreground">
                        {typeof item.free === 'boolean' ? (
                          item.free ? (
                            <span className="inline-flex items-center justify-center">
                              <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                              <span className="sr-only">Termasuk</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center">
                              <X className="h-4 w-4 text-muted-foreground/40" aria-hidden="true" />
                              <span className="sr-only">Tidak termasuk</span>
                            </span>
                          )
                        ) : (
                          <span>
                            {item.free}
                            <span className="sr-only"> ({item.name}: {item.free})</span>
                          </span>
                        )}
                      </td>

                      {/* Bulanan */}
                      <td className="py-2.5 px-3 text-center text-xs bg-accent/40 font-medium text-foreground">
                        {typeof item.monthly === 'boolean' ? (
                          item.monthly ? (
                            <span className="inline-flex items-center justify-center">
                              <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                              <span className="sr-only">Termasuk</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center">
                              <X className="h-4 w-4 text-muted-foreground/40" aria-hidden="true" />
                              <span className="sr-only">Tidak termasuk</span>
                            </span>
                          )
                        ) : (
                          <span>
                            {item.monthly}
                            <span className="sr-only"> ({item.name}: {item.monthly})</span>
                          </span>
                        )}
                      </td>

                      {/* Paket Skripsi */}
                      <td className="py-2.5 px-3 text-center text-xs text-muted-foreground">
                        {typeof item.thesis === 'boolean' ? (
                          item.thesis ? (
                            <span className="inline-flex items-center justify-center">
                              <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                              <span className="sr-only">Termasuk</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center">
                              <X className="h-4 w-4 text-muted-foreground/40" aria-hidden="true" />
                              <span className="sr-only">Tidak termasuk</span>
                            </span>
                          )
                        ) : (
                          <span>
                            {item.thesis}
                            <span className="sr-only"> ({item.name}: {item.thesis})</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Cards per Package */}
        <div className="block md:hidden space-y-4">
          {PLANS.map((plan) => {
            const planKey = plan.id as 'free' | 'monthly' | 'thesis';
            return (
              <Card key={plan.id} className="border-border bg-card rounded-[14px] shadow-xs">
                <CardHeader className="p-4 pb-3 border-b border-border/70">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-foreground">
                      {plan.name}
                    </CardTitle>
                    {plan.badge && (
                      <Badge variant="mint" className="text-[10px] py-0.5 px-2">
                        {plan.badge}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">
                    {plan.price === 0 ? 'Gratis' : `Rp ${plan.price.toLocaleString('id-ID')}${plan.period}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {COMPARISON_SECTIONS.map((section, sIdx) => (
                    <div key={sIdx} className="space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {section.category}
                      </p>
                      <ul className="space-y-1.5 text-xs divide-y divide-border/40">
                        {section.items.map((item, iIdx) => {
                          const val = item[planKey];
                          return (
                            <li key={iIdx} className="pt-1.5 flex items-start justify-between gap-2">
                              <span className="text-foreground/90">{item.name}</span>
                              <div className="shrink-0 text-right font-medium">
                                {typeof val === 'boolean' ? (
                                  val ? (
                                    <span className="inline-flex items-center gap-1 text-primary text-[11px]">
                                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                      <span>Termasuk</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-muted-foreground/50 text-[11px]">
                                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                                      <span>Tidak</span>
                                    </span>
                                  )
                                ) : (
                                  <span className="text-foreground text-[11px] font-semibold">{val}</span>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
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
                <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                  {faq.q}
                </h3>
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
          Siap menguji data kuesioner Anda minggu ini?
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Daftar gratis tanpa kartu kredit dan buka meja kerja analisis Anda sekarang.
        </p>
      </div>

      {/* PageActions Navigasi Halaman */}
      <PageActions
        prevHref="/"
        prevLabel="Kembali ke Beranda"
        nextHref="/daftar"
        nextLabel="Lanjut Daftar Gratis"
      />
    </div>
  );
}
