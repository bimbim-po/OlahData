'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { Copy, Check, Info, FileText } from 'lucide-react';
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
  title = 'Interpretasi Naratif Bab 4',
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
        title: 'Paragraf narasi berhasil disalin',
        description: 'Siap kamu tempelkan ke pembahasan Bab 4 skripsimu.',
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Gagal menyalin penjelasan',
        description: 'Periksa izin papan klip pada perambanmu.',
        variant: 'error',
      });
    }
  };

  const handleSelectNumber = (num: string) => {
    const nextVal = effectiveHovered === num ? null : num;
    setLocalHoveredNum(nextVal);
    onHoverNumber?.(nextVal);

    // If mobile or clicked, attempt to find and gently highlight or scroll to table cell
    if (nextVal) {
      const sanitized = nextVal.replace(/[^a-zA-Z0-9]/g, '-');
      const targetEl = document.querySelector(`[data-cell-num="${sanitized}"]`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  };

  return (
    <div
      className={cn(
        'rounded-md border border-border bg-card p-4 sm:p-5 shadow-xs space-y-3 transition-colors',
        className
      )}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <h4 className="text-sm font-semibold text-foreground tracking-tight">
            {title}
          </h4>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className="text-[11px] font-normal text-muted-foreground border-border bg-muted/40 px-2 py-0.5"
          >
            {badgeLabel}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2.5 gap-1.5 text-xs text-foreground hover:bg-muted font-medium transition-colors"
            title="Salin paragraf interpretasi narasi"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-primary" />
                <span className="text-primary font-medium">{COPY.results.copied}</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Salin Paragraf</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Narrative Paragraph with Interactive Bi-Directional Numbers */}
      <div className="text-sm leading-relaxed text-foreground font-sans max-w-prose">
        {renderedTokens.map((token, idx) => {
          if (!token.isNumber || !token.rawNumber) {
            return <span key={idx}>{token.text}</span>;
          }

          const isMatching =
            Boolean(effectiveHovered) &&
            (token.rawNumber === effectiveHovered ||
              token.text === effectiveHovered ||
              (effectiveHovered ? effectiveHovered.includes(token.rawNumber) : false) ||
              (effectiveHovered ? token.rawNumber.includes(effectiveHovered) : false));

          return (
            <button
              type="button"
              key={idx}
              onMouseEnter={() => {
                setLocalHoveredNum(token.rawNumber!);
                onHoverNumber?.(token.rawNumber!);
              }}
              onMouseLeave={() => {
                setLocalHoveredNum(null);
                onHoverNumber?.(null);
              }}
              onFocus={() => {
                setLocalHoveredNum(token.rawNumber!);
                onHoverNumber?.(token.rawNumber!);
              }}
              onBlur={() => {
                setLocalHoveredNum(null);
                onHoverNumber?.(null);
              }}
              onClick={() => handleSelectNumber(token.rawNumber!)}
              className={cn(
                'inline-flex items-center px-1 py-0.2 mx-0.5 text-xs font-semibold rounded-xs transition-all duration-150 tabular-nums cursor-pointer select-none',
                'bg-muted/70 text-foreground border border-border/80 hover:bg-accent hover:border-primary/40 hover:text-primary',
                'focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
                isMatching &&
                  'bg-accent border-primary text-primary font-bold ring-2 ring-primary/40 shadow-xs scale-105'
              )}
              title={`Klik atau sorot nilai ${token.text} untuk melihat sel asal di tabel`}
              aria-label={`Angka statistik ${token.text}`}
              aria-pressed={isMatching}
            >
              {token.text}
            </button>
          );
        })}
      </div>

      {/* Subtle Hint */}
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1.5 border-t border-border/60">
        <Info className="h-3 w-3 shrink-0 text-primary/70" />
        <span>
          Arahkan kursor atau ketuk angka untuk menyorot sel asalnya di lembar tabel secara langsung.
        </span>
      </div>
    </div>
  );
}
