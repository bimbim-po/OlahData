'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { Copy, Check, Info, FileText, HelpCircle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toaster';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { COPY } from '@/lib/copy';

export interface ExplanationBoxProps {
  title?: string;
  summarySentence?: string;
  explanation: string;
  onHoverNumber?: (numStr: string | null) => void;
  activeNumber?: string | null;
  className?: string;
  badgeLabel?: string;
}

export function ExplanationBox({
  title = COPY.layers.layer3Title,
  summarySentence,
  explanation,
  onHoverNumber,
  activeNumber,
  className,
  badgeLabel = COPY.layers.aiNote,
}: ExplanationBoxProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [localHoveredNum, setLocalHoveredNum] = useState<string | null>(null);
  const [glossaryOpen, setGlossaryOpen] = useState(false);

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
        title: COPY.layers.copied,
        description: 'Teks penjelasan siap kamu tempelkan ke pembahasan Bab 4 skripsimu.',
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

    if (nextVal) {
      const sanitized = nextVal.replace(/[^a-zA-Z0-9]/g, '-');
      const targetEl = document.querySelector(`[data-cell-num="${sanitized}"]`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  };

  const glossaryItems = Object.values(COPY.glossary);

  return (
    <div
      className={cn(
        'rounded-[16px] border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4 transition-colors font-sans',
        className
      )}
    >
      {/* Lapis 1: Intinya (Single Summary Sentence if provided) */}
      {summarySentence && (
        <div className="rounded-[10px] bg-[#FFE14D]/15 border border-[#FFE14D]/40 p-3.5 sm:p-4 text-[#243044] dark:text-foreground">
          <div className="flex items-start gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2748D6] bg-[#2748D6]/10 px-2 py-0.5 rounded-[4px] shrink-0 mt-0.5">
              {COPY.layers.layer1Title}
            </span>
            <p className="text-sm sm:text-base font-semibold leading-relaxed max-w-[68ch]">
              {summarySentence}
            </p>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <h4 className="text-sm font-semibold text-foreground tracking-tight">
            {title}
          </h4>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className="text-[11px] font-normal text-muted-foreground border-border bg-muted/40 px-2 py-0.5 rounded-[6px]"
          >
            {badgeLabel}
          </Badge>

          {/* Interactive "Apa artinya?" helper dialog */}
          <Dialog open={glossaryOpen} onOpenChange={setGlossaryOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/10 font-medium rounded-[10px]"
                title="Buka penjelasan istilah statistik dalam bahasa sederhana"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>{COPY.layers.whatDoesItMean}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <DialogTitle className="text-base font-semibold">
                    Kamus Istilah Statistik (Bahasa Mahasiswa)
                  </DialogTitle>
                </div>
              </DialogHeader>
              <div className="space-y-4 pt-2 text-xs leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
                {glossaryItems.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-[10px] bg-muted/40 border border-border/80 space-y-1.5"
                  >
                    <div className="font-semibold text-foreground text-sm">
                      {item.term}
                    </div>
                    <p className="text-foreground/90 font-medium">
                      {item.short}
                    </p>
                    <p className="text-muted-foreground">
                      {item.detail}
                    </p>
                    <div className="text-[11px] text-[#2748D6] bg-primary/5 p-2 rounded-[6px] border border-primary/10 mt-1">
                      {item.example}
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-3 gap-1.5 text-xs text-foreground hover:bg-muted font-medium transition-colors rounded-[10px]"
            title="Salin paragraf interpretasi narasi untuk Bab 4"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-primary" />
                <span className="text-primary font-medium">{COPY.layers.copied}</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Salin Teks</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Lapis 3: Teks Narasi Bab 4 dengan Kuning Stabilo Angka Tersambung */}
      <div className="text-sm sm:text-[15px] leading-relaxed text-foreground font-sans max-w-[68ch]">
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
                'inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs font-semibold rounded-[4px] transition-all duration-150 tabular-nums cursor-pointer select-none',
                'bg-muted/70 text-foreground border border-border/80 hover:bg-[#FFE14D]/40 hover:border-[#FFE14D] hover:text-[#243044]',
                'focus-visible:ring-2 focus-visible:ring-[#2748D6] focus-visible:outline-none',
                isMatching &&
                  'bg-[#FFE14D] text-[#243044] border-[#FFE14D] font-bold ring-2 ring-[#FFE14D] shadow-xs scale-105'
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
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-2 border-t border-border/60">
        <Info className="h-3 w-3 shrink-0 text-primary/70" />
        <span>
          Arahkan kursor atau ketuk angka bertinta untuk melihat sel asalnya di lembar tabel di atas.
        </span>
      </div>
    </div>
  );
}
