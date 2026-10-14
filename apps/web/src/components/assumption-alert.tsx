'use client';

import * as React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COPY } from '@/lib/copy';

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
      border: 'border-[#98D8BE] dark:border-emerald-800/60',
      bg: 'bg-[#BFEBD9]/25 dark:bg-emerald-950/20',
      text: 'text-foreground',
      titleColor: 'text-[#0E4331] dark:text-emerald-300',
      badgeBg: 'bg-[#BFEBD9] text-[#0E4331] border-[#98D8BE] font-semibold',
      badgeLabel: 'Lulus Uji',
      icon: CheckCircle2,
      iconColor: 'text-[#0E4331] dark:text-emerald-400',
    },
    warning: {
      border: 'border-amber-300 dark:border-amber-700/60',
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      text: 'text-foreground',
      titleColor: 'text-amber-900 dark:text-amber-300',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300 font-semibold',
      badgeLabel: 'Perhatian',
      icon: AlertTriangle,
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    violated: {
      border: 'border-[#F7B3AF] dark:border-red-800/60',
      bg: 'bg-[#FDEEED] dark:bg-red-950/20',
      text: 'text-foreground',
      titleColor: 'text-[#8A1E18] dark:text-red-300',
      badgeBg: 'bg-[#FDEEED] text-[#8A1E18] border-[#E8574F]/40 font-semibold',
      badgeLabel: 'Asumsi Dilanggar',
      icon: AlertCircle,
      iconColor: 'text-[#E8574F] dark:text-red-400',
    },
  }[status];

  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-[16px] border p-4 sm:p-5 transition-colors space-y-3 font-sans',
        config.border,
        config.bg,
        className
      )}
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <Icon className={cn('h-5 w-5', config.iconColor)} />
        </div>
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={cn('text-sm sm:text-base font-semibold leading-snug', config.titleColor)}>
              {title}
            </h4>
            <span
              className={cn(
                'text-[13px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-[6px] border inline-block min-h-[24px]',
                config.badgeBg
              )}
            >
              {config.badgeLabel}
            </span>
          </div>
          <p className="text-[13px] sm:text-sm text-foreground/85 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {recommendation && (
        <div className="pt-3 border-t border-border/40 text-[13px] sm:text-sm space-y-1.5">
          <div className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wider text-foreground">
            <ArrowRight className="h-4 w-4 text-primary" />
            <span>{COPY.layers.whatToDo}</span>
          </div>
          <p className="text-foreground/90 leading-relaxed pl-5 font-normal text-[13px] sm:text-sm">
            {recommendation}
          </p>
        </div>
      )}
    </div>
  );
}
