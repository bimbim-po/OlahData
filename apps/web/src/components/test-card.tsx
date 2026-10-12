'use client';

import * as React from 'react';
import { Sparkles, Info } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TestOption, TestType } from '@/lib/api/types';

interface TestCardProps {
  test: TestOption;
  isSelected: boolean;
  onToggle: (id: TestType) => void;
  className?: string;
}

const TEST_NAME_MAP: Record<string, string> = {
  descriptive: 'Statistik Deskriptif',
  validity: 'Uji Validitas',
  reliability: 'Uji Reliabilitas',
  normality: 'Uji Normalitas',
  multicollinearity: 'Uji Multikolinearitas',
  heteroscedasticity: 'Uji Heteroskedastisitas',
  regression: 'Regresi Linier Berganda',
  't-test': 'Uji t (Parsial)',
  'f-test': 'Uji F (Simultan)',
  determination: 'Koefisien Determinasi',
  correlation: 'Korelasi Pearson',
  anova: 'ANOVA Satu Arah',
};

export function TestCard({ test, isSelected, onToggle, className }: TestCardProps) {
  return (
    <div
      onClick={() => onToggle(test.id)}
      className={cn(
        'group relative p-4 rounded-[16px] border transition-all text-left flex flex-col justify-between cursor-pointer select-none',
        isSelected
          ? 'border-primary bg-primary/[0.04] dark:bg-primary/[0.08] shadow-sm ring-1 ring-primary'
          : 'border-border bg-card hover:border-primary/50 hover:bg-muted/30 shadow-2xs',
        className
      )}
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onToggle(test.id);
        }
      }}
    >
      <div className="space-y-2.5">
        {/* Top Header: Checkbox + Name + Recommended Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggle(test.id)}
                aria-label={`Pilih ${test.name}`}
              />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                {test.name}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {test.description}
              </p>
            </div>
          </div>

          {test.recommended && (
            <Badge variant="pine" className="text-[10px] shrink-0 font-medium py-0.5 px-2">
              <Sparkles className="w-3 h-3 mr-1" />
              Direkomendasikan
            </Badge>
          )}
        </div>

        {/* Recommended Rationale box */}
        {test.recommended && test.recommendReason && (
          <div className="p-2.5 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/15 text-[11px] text-foreground/90 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <span className="leading-snug">
              <strong className="text-primary font-medium">Alasan rekomendasi:</strong>{' '}
              {test.recommendReason}
            </span>
          </div>
        )}
      </div>

      {/* Prerequisites section */}
      {test.prerequisites && test.prerequisites.length > 0 && (
        <div className="pt-3 mt-3 border-t border-border/60 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
            Prasyarat:
          </span>
          {test.prerequisites.map((prereq) => (
            <Badge
              key={prereq}
              variant="outline"
              className="text-[10px] font-mono px-1.5 py-0 bg-muted/60 text-muted-foreground"
            >
              {TEST_NAME_MAP[prereq] || prereq}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
