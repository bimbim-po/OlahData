'use client';

import * as React from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WizardStep } from '@/stores/wizard-store';
import { COPY } from '@/lib/copy';

interface StepIndicatorProps {
  currentStep: WizardStep;
  steps: string[];
  onStepClick?: (stepIndex: WizardStep) => void;
  maxAccessibleStep?: number;
  className?: string;
}

export function StepIndicator({
  currentStep,
  steps,
  onStepClick,
  maxAccessibleStep = 4,
  className,
}: StepIndicatorProps) {
  return (
    <div className={cn('w-full space-y-2.5 font-sans', className)}>
      {/* Calm reassurance header bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-foreground font-semibold">
            {COPY.reassurance.guidedProgress}
          </span>
          <span className="text-primary font-bold">
            {steps[currentStep]}
          </span>
          <span className="text-muted-foreground/60">({currentStep + 1} dari {steps.length})</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary/80" />
          <span>{COPY.reassurance.saved}</span>
        </div>
      </div>

      {/* Desktop / Tablet Stepper */}
      <ol className="hidden md:flex items-center w-full justify-between gap-2 p-3.5 rounded-[16px] border border-border bg-card shadow-xs">
        {steps.map((label, index) => {
          const stepNum = index as WizardStep;
          const isCompleted = currentStep > stepNum;
          const isCurrent = currentStep === stepNum;
          const isClickable = onStepClick && stepNum <= maxAccessibleStep;

          return (
            <li
              key={label}
              className={cn(
                'flex items-center flex-1 last:flex-initial transition-all',
                isClickable ? 'cursor-pointer' : 'cursor-default'
              )}
              onClick={() => {
                if (isClickable) onStepClick(stepNum);
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors',
                    isCompleted
                      ? 'bg-[#BFEBD9] text-[#0E4331] font-bold border border-[#98D8BE]'
                      : isCurrent
                      ? 'border-2 border-primary bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'border border-border bg-muted/60 text-muted-foreground'
                  )}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : index + 1}
                </div>

                <div className="flex flex-col">
                  <span
                    className={cn(
                      'text-[11px] uppercase tracking-wider',
                      isCurrent
                        ? 'text-primary font-bold'
                        : isCompleted
                        ? 'text-[#0E4331] font-semibold'
                        : 'text-muted-foreground'
                    )}
                  >
                    Langkah {index + 1}
                  </span>
                  <span
                    className={cn(
                      'text-xs whitespace-nowrap',
                      isCurrent
                        ? 'font-bold text-foreground'
                        : isCompleted
                        ? 'font-medium text-foreground/90'
                        : 'text-muted-foreground'
                    )}
                  >
                    {label}
                  </span>
                </div>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-[2px] flex-1 mx-3 transition-colors',
                    isCompleted ? 'bg-[#98D8BE]' : 'bg-border'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile Stepper */}
      <div className="flex md:hidden items-center justify-between p-3.5 rounded-[16px] border border-border bg-card shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
            {currentStep + 1}
          </div>
          <div className="text-xs">
            <span className="text-muted-foreground block text-[11px]">
              Langkah {currentStep + 1} dari {steps.length}
            </span>
            <span className="font-semibold text-foreground">{steps[currentStep]}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                'h-1.5 rounded-full transition-all',
                idx === currentStep
                  ? 'w-6 bg-primary'
                  : idx < currentStep
                  ? 'w-2 bg-[#98D8BE]'
                  : 'w-2 bg-muted'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
