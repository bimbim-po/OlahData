'use client';

import * as React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AssumptionStatus = 'passed' | 'warning' | 'violated';

export interface AssumptionAlertProps {
  status: AssumptionStatus;
  title: string;
  description: string;
  recommendation?: string;
  className?: string;
}

export function AssumptionAlert({
  status,
  title,
  description,
  recommendation,
  className,
}: AssumptionAlertProps) {
  const config = {
    passed: {
      border: 'border-emerald-600/30 dark:border-emerald-500/30',
      bg: 'bg-emerald-500/[0.06] dark:bg-emerald-950/20',
      text: 'text-emerald-900 dark:text-emerald-200',
      badgeBg: 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950',
      badgeLabel: 'Terpenuhi',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    warning: {
      border: 'border-amber-500/30 dark:border-amber-400/30',
      bg: 'bg-amber-500/[0.08] dark:bg-amber-950/25',
      text: 'text-amber-950 dark:text-amber-200',
      badgeBg: 'bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-950',
      badgeLabel: 'Perhatian',
      icon: AlertTriangle,
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    violated: {
      border: 'border-destructive/30',
      bg: 'bg-destructive/[0.08]',
      text: 'text-destructive-foreground',
      badgeBg: 'bg-destructive text-white',
      badgeLabel: 'Tidak Terpenuhi',
      icon: AlertCircle,
      iconColor: 'text-destructive',
    },
  }[status];

  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-xl border p-4 sm:p-5 transition-all space-y-2.5',
        config.border,
        config.bg,
        className
      )}
      role="status"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            <Icon className={cn('h-5 w-5', config.iconColor)} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={cn('text-sm sm:text-base font-semibold leading-snug', config.text)}>
                {title}
              </h4>
              <span
                className={cn(
                  'text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block',
                  config.badgeBg
                )}
              >
                {config.badgeLabel}
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-foreground/80 leading-relaxed font-sans">
              {description}
            </p>
          </div>
        </div>
      </div>

      {recommendation && (
        <div className="flex items-start gap-2 pt-2 border-t border-border/40 text-xs text-foreground/80">
          <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold text-foreground">Saran Akademik: </span>
            {recommendation}
          </p>
        </div>
      )}
    </div>
  );
}
