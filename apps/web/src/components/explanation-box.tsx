'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { Sparkles, Copy, Check, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toaster';
import { COPY } from '@/lib/copy';

export interface ExplanationBoxProps {
  title?: string;
  explanation: string;
  onHoverNumber?: (numStr: string | null) => void;
  activeNumber?: string | null;
  className?: string;
  badgeLabel?: string;
}

export function ExplanationBox({
  title = 'Interpretasi & Narasi Skripsi',
  explanation,
  onHoverNumber,
  activeNumber,
  className,
  badgeLabel = COPY.badges.writtenByAI,
}: ExplanationBoxProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [localHoveredNum, setLocalHoveredNum] = useState<string | null>(null);

  const effectiveHovered = activeNumber || localHoveredNum;

  // Split narrative into text and numeric tokens
  // Matches Indonesian numbers like 0,872 or 117 or 45,1% or 0,05
  const renderedTokens = useMemo(() => {
    // Regex splits keeping delimiters:
    // Captures numbers with comma decimals and optional percentage
    const regex = /(\b\d+(?:,\d+)?%?|\b\d+\b)/g;
    const parts: { text: string; isNumber: boolean; rawNumber?: string }[] = [];

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(explanation)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          text: explanation.slice(lastIndex, match.index),
          isNumber: false,
        });
      }

      const numStr = match[0];
      parts.push({
        text: numStr,
        isNumber: true,
        rawNumber: numStr.replace('%', '').trim(),
      });

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < explanation.length) {
      parts.push({
        text: explanation.slice(lastIndex),
        isNumber: false,
      });
    }

    return parts;
  }, [explanation]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(explanation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);

      toast({
        title: 'Penjelasan berhasil disalin ke papan klip',
        description: 'Siap ditempelkan ke pembahasan Bab 4 skripsi Anda.',
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Gagal menyalin penjelasan',
        description: 'Periksa izin papan klip pada peramban Anda.',
        variant: 'error',
      });
    }
  };

  const handleMouseEnter = (num: string) => {
    setLocalHoveredNum(num);
    onHoverNumber?.(num);
  };

  const handleMouseLeave = () => {
    setLocalHoveredNum(null);
    onHoverNumber?.(null);
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-amber-600/20 bg-amber-500/[0.03] dark:bg-amber-950/20 p-5 sm:p-6 shadow-xs space-y-3.5',
        className
      )}
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <h4 className="font-serif text-sm sm:text-base font-semibold text-foreground tracking-tight">
            {title}
          </h4>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="ai"
            className="gap-1.5 py-1 px-2.5 font-medium text-xs border"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{badgeLabel}</span>
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-8 gap-1.5 text-xs text-foreground hover:bg-muted font-medium transition-all"
            title="Salin penjelasan naratif skripsi"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-primary" />
                <span className="text-primary font-medium">{COPY.results.copied}</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{COPY.results.copyExplanation}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Narrative Paragraph with Interactive Synchronized Numbers */}
      <div className="text-sm leading-relaxed text-foreground/90 font-sans tracking-normal">
        {renderedTokens.map((token, idx) => {
          if (!token.isNumber || !token.rawNumber) {
            return <span key={idx}>{token.text}</span>;
          }

          const isMatching =
            effectiveHovered &&
            (token.rawNumber === effectiveHovered ||
              token.text === effectiveHovered ||
              effectiveHovered.includes(token.rawNumber) ||
              token.rawNumber.includes(effectiveHovered));

          return (
            <button
              type="button"
              key={idx}
              onMouseEnter={() => handleMouseEnter(token.rawNumber!)}
              onMouseLeave={handleMouseLeave}
              className={cn(
                'inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs font-semibold rounded transition-all duration-150 tabular-nums cursor-pointer select-none',
                'bg-muted/80 text-foreground border border-border/80 hover:bg-amber-100 dark:hover:bg-amber-950/60 hover:border-amber-400 hover:text-amber-900 dark:hover:text-amber-300',
                isMatching &&
                  'bg-amber-200 dark:bg-amber-900/80 border-amber-500 text-amber-950 dark:text-amber-100 font-bold ring-2 ring-amber-400 shadow-xs scale-105'
              )}
              title={`Sorot nilai ${token.text} pada tabel statistik`}
              aria-label={`Angka statistik ${token.text}`}
            >
              {token.text}
            </button>
          );
        })}
      </div>

      {/* Helpful Hint on hover synchronization */}
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
        <Info className="h-3 w-3 shrink-0 text-amber-600/80 dark:text-amber-400/80" />
        <span>
          Arahkan kursor ke angka di atas untuk menyorot sel terkait pada tabel secara bersamaan.
        </span>
      </div>
    </div>
  );
}
