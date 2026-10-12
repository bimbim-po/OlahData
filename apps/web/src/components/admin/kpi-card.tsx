import * as React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { KpiMetric } from '@/lib/admin/service';

interface KpiCardProps {
  metric: KpiMetric;
}

export function KpiCard({ metric }: KpiCardProps) {
  const isUp = metric.trend === 'up';
  const isDown = metric.trend === 'down';

  return (
    <Card className="border-border bg-card shadow-xs transition-colors rounded-md">
      <CardContent className="p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-xs font-medium text-muted-foreground truncate">
            {metric.label}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span className="sr-only">Definisi metrik</span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                {metric.description}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <div className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {metric.hasEnoughData ? metric.value : (
              <span className="text-xs font-normal text-muted-foreground">Belum cukup data</span>
            )}
          </div>

          {metric.hasEnoughData && metric.changePct !== undefined && (
            <div
              className={cn(
                'flex items-center text-[11px] font-semibold tabular-nums px-1.5 py-0.2 rounded-xs',
                isUp && 'text-emerald-800 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40',
                isDown && 'text-red-800 bg-red-50 dark:text-red-300 dark:bg-red-950/40',
                metric.trend === 'neutral' && 'text-muted-foreground bg-muted'
              )}
            >
              {isUp && <ArrowUpRight className="w-3 h-3 mr-0.5" />}
              {isDown && <ArrowDownRight className="w-3 h-3 mr-0.5" />}
              {metric.trend === 'neutral' && <Minus className="w-3 h-3 mr-0.5" />}
              <span>{Math.abs(metric.changePct)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
