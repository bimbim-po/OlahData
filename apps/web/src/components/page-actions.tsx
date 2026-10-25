import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PageActionsProps {
  prevHref?: string;
  prevLabel?: string;
  onPrev?: () => void;
  nextHref?: string;
  nextLabel?: string;
  onNext?: () => void;
  isNextLoading?: boolean;
  isNextDisabled?: boolean;
  nextDisabledReason?: string;
  className?: string;
}

export function PageActions({
  prevHref,
  prevLabel = 'Kembali',
  onPrev,
  nextHref,
  nextLabel = 'Lanjut',
  onNext,
  isNextLoading = false,
  isNextDisabled = false,
  nextDisabledReason,
  className,
}: PageActionsProps) {
  if (!prevHref && !onPrev && !nextHref && !onNext) {
    return null;
  }

  return (
    <nav
      aria-label="Navigasi Halaman"
      className={cn(
        'mt-10 sm:mt-12 pt-6 sm:pt-8 pb-6 sm:pb-8 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4',
        className
      )}
    >
      {/* Tombol Sebelumnya / Kembali */}
      <div className="flex items-center">
        {prevHref ? (
          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto min-h-[44px] justify-center sm:justify-start gap-2 font-medium"
          >
            <Link href={prevHref}>
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{prevLabel}</span>
            </Link>
          </Button>
        ) : onPrev ? (
          <Button
            type="button"
            variant="outline"
            onClick={onPrev}
            className="w-full sm:w-auto min-h-[44px] justify-center sm:justify-start gap-2 font-medium cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{prevLabel}</span>
          </Button>
        ) : (
          <div className="hidden sm:block" />
        )}
      </div>

      {/* Tombol Berikutnya / Lanjut */}
      <div className="flex flex-col items-stretch sm:items-end gap-1.5">
        {nextHref ? (
          isNextDisabled ? (
            <Button
              type="button"
              disabled
              className="w-full sm:w-auto min-h-[44px] justify-center sm:justify-end gap-2 font-semibold opacity-50 cursor-not-allowed"
              title={nextDisabledReason}
            >
              <span>{nextLabel}</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              asChild
              className="w-full sm:w-auto min-h-[44px] justify-center sm:justify-end gap-2 font-semibold shadow-xs"
            >
              <Link href={nextHref}>
                <span>{nextLabel}</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Link>
            </Button>
          )
        ) : onNext ? (
          <Button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled || isNextLoading}
            isLoading={isNextLoading}
            loadingText="Memproses..."
            className="w-full sm:w-auto min-h-[44px] justify-center sm:justify-end gap-2 font-semibold shadow-xs cursor-pointer"
            title={isNextDisabled ? nextDisabledReason : undefined}
          >
            <span>{nextLabel}</span>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Button>
        ) : null}

        {/* Alasan disable jika ada */}
        {isNextDisabled && nextDisabledReason && (
          <p className="text-xs text-muted-foreground text-center sm:text-right">
            {nextDisabledReason}
          </p>
        )}
      </div>
    </nav>
  );
}
