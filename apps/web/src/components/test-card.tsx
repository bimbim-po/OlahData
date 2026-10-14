'use client';

import * as React from 'react';
import { CheckCheck, Info, Lock } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TestOption, TestType } from '@/lib/api/types';

interface TestCardProps {
  test: TestOption;
  isSelected: boolean;
  onToggle: (id: TestType) => void;
  className?: string;
  isLocked?: boolean;
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

export function TestCard({ test, isSelected, onToggle, className, isLocked }: TestCardProps) {
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
        {/* Top Header: Checkbox + Name + Badges */}
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
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                  {test.name}
                </h4>
                {isLocked && (
                  <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {test.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isLocked && (
              <Badge
                variant="amber"
                className="text-[10px] font-semibold py-0.5 px-2 rounded-[6px] border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              >
                Pro
              </Badge>
            )}
            {test.recommended && (
              <Badge variant="pine" className="text-[10px] shrink-0 font-medium py-0.5 px-2">
                <CheckCheck className="w-3 h-3 mr-1" />
                Direkomendasikan
              </Badge>
            )}
          </div>
        </div>

        {/* Recommended Rationale */}
        {test.recommended && test.recommendReason && (
          <p className="text-[11px] text-muted-foreground flex items-start gap-1.5 pt-0.5 leading-relaxed">
            <Info className="w-3 h-3 text-primary/70 shrink-0 mt-0.5" />
            <span>
              <span className="font-medium text-foreground/80">Rekomendasi:</span> {test.recommendReason}
            </span>
          </p>
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
