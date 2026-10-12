'use client';

import * as React from 'react';
import { Check, Sparkles, Building2 } from 'lucide-react';
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
    <div className={cn('w-full space-y-8', className)}>
      {showDisclaimer && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
          <Badge variant="amber" className="text-xs font-semibold py-1 px-3">
            {COPY.badges.samplePrice}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {COPY.pricing.disclaimer}
          </span>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {COPY.pricing.plans.map((plan) => {
          const planId = plan.id as SubscriptionPlan;
          const isCurrent = currentPlan === planId;
          const isHighlighted = plan.highlighted;

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative flex flex-col justify-between transition-all duration-200',
                isHighlighted
                  ? 'border-primary ring-2 ring-primary/20 shadow-md bg-card'
                  : 'border-border bg-card/60 hover:border-border/80'
              )}
            >
              {isHighlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="pine" className="gap-1 py-0.5 px-3 shadow-xs">
                    <Sparkles className="h-3 w-3" />
                    Paling Populer
                  </Badge>
                </div>
              )}

              <div>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-serif">
                      {plan.name}
                    </CardTitle>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        Paket Aktif
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="min-h-[1.25rem]">
                    {planId === 'free' && 'Untuk pengenalan dan validasi dasar'}
                    {planId === 'monthly' && 'Fleksibel untuk kebutuhan bulanan'}
                    {planId === 'thesis' && 'Lengkap hingga sidang skripsi'}
                  </CardDescription>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-serif text-3xl font-bold tracking-tight text-foreground tabular-nums">
                      {plan.price === 0 ? 'Gratis' : formatCurrency(plan.price)}
                    </span>
                    {plan.period && (
                      <span className="text-sm text-muted-foreground font-normal">
                        {plan.period}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-2">
                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Fitur yang disertakan:
                    </p>
                    <ul className="space-y-2.5 text-sm">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
                            <Check className="h-3 w-3 stroke-[2.5]" />
                          </div>
                          <span className="text-foreground leading-snug">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </div>

              <CardFooter className="pt-4 border-t border-border/50">
                <Button
                  className="w-full"
                  variant={isHighlighted ? 'default' : 'outline'}
                  disabled={isCurrent}
                  onClick={() => onSelectPlan?.(planId)}
                >
                  {isCurrent ? 'Paket Saat Ini' : plan.cta}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Institutional / Campus row */}
      <div className="rounded-lg border border-dashed border-border bg-card/40 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              Program Kampus & Laboratorium
            </h4>
            <p className="text-xs text-muted-foreground">
              {COPY.pricing.campusNote}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="shrink-0" asChild>
          <a href="mailto:halo@olahdata.id?subject=Informasi%20Paket%20Institusi%20OlahData">
            Hubungi Kami
          </a>
        </Button>
      </div>
    </div>
  );
}
