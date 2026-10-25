'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { SubscriptionPlan } from '@/lib/api/types';
import { PLANS, INSTITUTION_PLAN, IS_PRE_RELEASE_SIMULATION, SIMULATION_LABEL } from '@/lib/plans';
import { useUpgradeModal } from '@/lib/entitlements';

export interface PricingCardsProps {
  currentPlan?: SubscriptionPlan;
  onSelectPlan?: (planId: SubscriptionPlan) => void;
  className?: string;
  showDisclaimer?: boolean;
}

export function PricingCards({
  currentPlan,
  onSelectPlan,
  className,
  showDisclaimer = true,
}: PricingCardsProps) {
  const { openUpgradeModal } = useUpgradeModal();

  const handleAction = (planId: SubscriptionPlan) => {
    if (onSelectPlan) {
      onSelectPlan(planId);
      return;
    }

    if (planId === 'free') {
      window.location.href = '/app/proyek/baru?contoh=1';
      return;
    }

    // Buka modal aktivasi dan pembayaran interaktif
    openUpgradeModal({
      plan: planId,
      reason: `Aktivasi ${planId === 'thesis' ? 'Paket Skripsi' : 'Paket Bulanan'}`,
    });
  };

  return (
    <div className={cn('w-full space-y-8', className)}>
      {showDisclaimer && (
        <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-5 text-center sm:text-left flex flex-col sm:flex-row items-center gap-3.5 shadow-2xs">
          <Badge variant="mint" className="text-xs font-semibold py-1 px-3 shrink-0 rounded-lg">
            Status Akses Awal (Beta)
          </Badge>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Paket berbayar segera hadir. Masukkan surel untuk diberi tahu. Fitur analisis data inti dapat dicoba langsung gratis tanpa login.
          </p>
        </div>
      )}

      {/* Pricing Cards Grid (gap-8 untuk pernapasan visual kartu besar) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {PLANS.map((plan) => {
          const planId = plan.id;
          const isCurrent = currentPlan === planId;
          const isHighlighted = plan.highlighted;

          const buttonText = isCurrent
            ? 'Paket Aktif Saat Ini'
            : planId === 'free'
            ? 'Coba Gratis'
            : IS_PRE_RELEASE_SIMULATION
            ? 'Daftar waiting list'
            : plan.ctaText;

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative flex flex-col justify-between h-full p-6 sm:p-8 rounded-2xl transition-all shadow-xs',
                isHighlighted
                  ? 'border-primary ring-2 ring-primary/80 bg-white dark:bg-slate-900 shadow-md scale-[1.02] md:-translate-y-1'
                  : 'border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600'
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-6">
                  <Badge variant="mint" className="text-xs font-bold py-1 px-3 rounded-md shadow-xs">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <div className="flex flex-col h-full">
                {/* Header & Title */}
                <div className="pb-4">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-50">
                      {plan.name}
                    </CardTitle>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-xs rounded-md">
                        Paket Aktif
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="min-h-[2.5rem] text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    {plan.description}
                  </CardDescription>

                  {/* Price Block dengan Garis Sejajar Optis */}
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
                      {plan.price === 0 ? 'Gratis' : formatCurrency(plan.price)}
                    </span>
                    {plan.period && (
                      <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
                        {plan.period}
                      </span>
                    )}
                  </div>

                  {plan.subBadge && (
                    <div className="mt-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-2 text-xs font-medium text-emerald-800 dark:text-emerald-300 leading-snug">
                      ✨ {plan.subBadge}
                    </div>
                  )}
                </div>

                {/* Garis Pemisah & Daftar Fitur dengan space-y-3.5 */}
                <div className="my-6 border-t border-slate-200/80 dark:border-slate-800/80 pt-4 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3.5">
                    Cakupan fitur:
                  </p>
                  <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 leading-relaxed">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer Tombol Aksi Selalu Sejajar Optis di Bagian Bawah */}
                <div className="mt-auto pt-6 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-2">
                  <Button
                    variant={isHighlighted ? 'default' : 'outline'}
                    size="lg"
                    className="w-full text-xs sm:text-sm font-semibold h-11 rounded-xl shadow-xs"
                    disabled={isCurrent}
                    onClick={() => handleAction(planId)}
                  >
                    {buttonText}
                  </Button>
                  {IS_PRE_RELEASE_SIMULATION && (planId === 'monthly' || planId === 'thesis') && !isCurrent && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-snug pt-1">
                      Dapatkan akses prioritas dan harga khusus saat kuota dibuka.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Campus License Note */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-center gap-2.5 shadow-2xs">
        <Building2 className="h-4 w-4 text-primary shrink-0" />
        <span>
          Untuk kerja sama program studi atau laboratorium: silakan{' '}
          <a
            href={INSTITUTION_PLAN.contactHref}
            className="text-primary font-semibold underline underline-offset-2 hover:opacity-85"
          >
            hubungi kami untuk paket institusi
          </a>
          .
        </span>
      </div>
    </div>
  );
}
