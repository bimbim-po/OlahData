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
      bg: 'bg-emerald-500/[0.04] dark:bg-emerald-950/20',
      text: 'text-foreground',
      badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800',
      badgeLabel: 'Terpenuhi',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    warning: {
      border: 'border-amber-500/30 dark:border-amber-400/30',
      bg: 'bg-amber-500/[0.04] dark:bg-amber-950/20',
      text: 'text-foreground',
      badgeBg: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800',
      badgeLabel: 'Perhatian',
      icon: AlertTriangle,
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    violated: {
      border: 'border-destructive/40',
      bg: 'bg-destructive/[0.04] dark:bg-destructive/10',
      text: 'text-foreground',
      badgeBg: 'bg-destructive/10 text-destructive border-destructive/30',
      badgeLabel: 'Asumsi Dilanggar',
      icon: AlertCircle,
      iconColor: 'text-destructive',
    },
  }[status];

  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-md border p-4 sm:p-4.5 transition-colors space-y-2',
        config.border,
        config.bg,
        className
      )}
      role="status"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 shrink-0">
            <Icon className={cn('h-4 w-4', config.iconColor)} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={cn('text-sm font-semibold leading-snug', config.text)}>
                {title}
              </h4>
              <span
                className={cn(
                  'text-[10px] font-medium px-1.5 py-0.2 rounded-xs border inline-block',
                  config.badgeBg
                )}
              >
                {config.badgeLabel}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-foreground/80 leading-relaxed font-sans">
              {description}
            </p>
          </div>
        </div>
      </div>

      {recommendation && (
        <div className="flex items-start gap-2 pt-2 border-t border-border/40 text-xs text-foreground/85">
          <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold text-foreground">Saran Perbaikan Metodologi: </span>
            {recommendation}
          </p>
        </div>
      )}
    </div>
  );
}
