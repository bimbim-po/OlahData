'use client';

import * as React from 'react';
import { Check, Building2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { COPY } from '@/lib/copy';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { SubscriptionPlan } from '@/lib/api/types';

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
  return (
    <div className={cn('w-full space-y-6', className)}>
      {showDisclaimer && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
          <Badge variant="outline" className="text-[11px] font-medium py-0.5 px-2.5 bg-muted/50 border-border">
            {COPY.badges.samplePrice}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {COPY.pricing.disclaimer}
          </span>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {COPY.pricing.plans.map((plan) => {
          const planId = plan.id as SubscriptionPlan;
          const isCurrent = currentPlan === planId;
          const isHighlighted = plan.highlighted;

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative flex flex-col justify-between transition-colors rounded-[16px] shadow-xs',
                isHighlighted
                  ? 'border-primary ring-1 ring-primary bg-card shadow-xs'
                  : 'border-border bg-card hover:border-foreground/30'
              )}
            >
              {isHighlighted && (
                <div className="absolute -top-2.5 left-4">
                  <Badge variant="mint" className="text-[10px] font-semibold py-0.5 px-2.5 rounded-[6px]">
                    Rekomendasi Skripsi
                  </Badge>
                </div>
              )}

              <div>
                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">
                      {plan.name}
                    </CardTitle>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-[10px] rounded-[6px]">
                        Paket Aktif
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="min-h-[1.25rem] text-xs">
                    {planId === 'free' && 'Untuk pengenalan uji deskriptif & validitas'}
                    {planId === 'monthly' && 'Fleksibel untuk pengerjaan revisi bulanan'}
                    {planId === 'thesis' && 'Lengkap untuk seluruh proses hingga sidang'}
                  </CardDescription>

                  <div className="mt-3.5 flex items-baseline gap-1">
                    <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                      {plan.price === 0 ? 'Gratis' : formatCurrency(plan.price)}
                    </span>
                    {plan.period && (
                      <span className="text-xs text-muted-foreground font-normal">
                        {plan.period}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-1">
                  <div className="border-t border-border/70 pt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                      Cakupan fitur:
                    </p>
                    <ul className="space-y-2 text-xs">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-foreground/90">
                          <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </div>

              <CardFooter className="pt-3 pb-5">
                <Button
                  variant={isHighlighted ? 'default' : 'outline'}
                  size="default"
                  className="w-full text-xs font-semibold h-10 rounded-[10px]"
                  disabled={isCurrent}
                  onClick={() => onSelectPlan?.(planId)}
                >
                  {isCurrent ? 'Paket Aktif Saat Ini' : plan.cta}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Campus License Note */}
      <div className="rounded-[16px] border border-border/80 bg-card p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2 shadow-2xs">
        <Building2 className="h-4 w-4 text-primary shrink-0" />
        <span>{COPY.pricing.campusNote}</span>
      </div>
    </div>
  );
}
