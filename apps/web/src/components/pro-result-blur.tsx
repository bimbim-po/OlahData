'use client';

import * as React from 'react';
import { Lock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpgradeModal } from '@/lib/entitlements';
import { cn } from '@/lib/utils';

interface ProResultBlurProps {
  isLocked: boolean;
  isSample?: boolean;
  testName?: string;
  reason?: string;
  children: React.ReactNode;
  className?: string;
}

export function ProResultBlur({
  isLocked,
  isSample = false,
  testName = 'Uji Hipotesis',
  reason,
  children,
  className,
}: ProResultBlurProps) {
  const { openUpgradeModal } = useUpgradeModal();

  if (!isLocked) {
    if (isSample) {
      return (
        <div className={cn('relative space-y-2', className)}>
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Contoh
            </span>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Simulasi hasil uji dengan dataset contoh
            </span>
          </div>
          {children}
        </div>
      );
    }
    return <>{children}</>;
  }

  return (
    <div className={cn('relative rounded-2xl overflow-hidden', className)}>
      {/* Blurred Children Content */}
      <div
        className="filter blur-[6px] select-none pointer-events-none opacity-60 transition-all duration-300"
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Paywall Overlay Banner */}
      <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-background/40 backdrop-blur-[2px]">
        <div className="max-w-md w-full p-5 sm:p-6 rounded-2xl border border-primary/25 bg-card/95 shadow-xl text-center space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">
              Fitur Paket Pro
            </div>
            <h3 className="font-bold text-base text-foreground">
              Buka Kunci Hasil {testName} &amp; Narasi Bab 4
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {reason ||
                'Angka t-hitung, nilai signifikansi (p-value), koefisien determinasi R², dan draf narasi interpretasi lengkap tersedia pada Paket Bulanan & Paket Skripsi.'}
            </p>
          </div>

          <Button
            type="button"
            onClick={() =>
              openUpgradeModal({
                plan: 'monthly',
                reason: `Buka Kunci Hasil ${testName} & Pembahasan Lengkap`,
              })
            }
            className="w-full font-semibold rounded-xl min-h-[44px] shadow-sm text-xs sm:text-sm bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
          >
            <Zap className="w-4 h-4 mr-2" />
            Buka Kunci Hasil &amp; Narasi Lengkap (Mulai Rp 39.000)
          </Button>

          <p className="text-[11px] text-muted-foreground">
            Aktivasi instan via QRIS / WhatsApp • Garansi 100% presisi SPSS
          </p>
        </div>
      </div>
    </div>
  );
}
