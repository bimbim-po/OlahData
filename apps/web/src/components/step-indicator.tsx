'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WizardStep } from '@/stores/wizard-store';

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
    <div className={cn('w-full', className)}>
      {/* Desktop / Tablet Stepper */}
      <ol className="hidden md:flex items-center w-full justify-between gap-2">
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
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors',
                    isCompleted
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : isCurrent
                      ? 'border-2 border-primary bg-background text-primary font-bold shadow-xs'
                      : 'border border-border bg-muted/60 text-muted-foreground'
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : index + 1}
                </div>

                <div className="flex flex-col">
                  <span
                    className={cn(
                      'text-xs font-medium whitespace-nowrap',
                      isCurrent
                        ? 'text-primary font-semibold'
                        : isCompleted
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    Langkah {index + 1}
                  </span>
                  <span
                    className={cn(
                      'text-xs whitespace-nowrap',
                      isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {label}
                  </span>
                </div>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-[2px] flex-1 mx-4 transition-colors',
                    isCompleted ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile Stepper */}
      <div className="flex md:hidden items-center justify-between p-3 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
            {currentStep + 1}
          </div>
          <div className="text-xs">
            <span className="text-muted-foreground block">
              Langkah {currentStep + 1} dari {steps.length}
            </span>
            <span className="font-semibold text-foreground">{steps[currentStep]}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                'h-1.5 rounded-full transition-all',
                idx === currentStep
                  ? 'w-6 bg-primary'
                  : idx < currentStep
                  ? 'w-2 bg-primary/60'
                  : 'w-2 bg-muted'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
