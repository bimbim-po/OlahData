'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { Copy, Check, Info, FileText, HelpCircle, BookOpen, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toaster';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/components/ui/bottom-sheet';
import { COPY } from '@/lib/copy';
import { copyWordNarrative } from '@/lib/word-table';

export interface ExplanationBoxProps {
  title?: string;
  summarySentence?: string;
  explanation: string;
  onHoverNumber?: (numStr: string | null) => void;
  activeNumber?: string | null;
  className?: string;
  badgeLabel?: string;
}

export type NarrativeStyle = 'standard' | 'concise' | 'formal';

export function ExplanationBox({
  title = COPY.layers.layer3Title,
  summarySentence,
  explanation,
  onHoverNumber,
  activeNumber,
  className,
  badgeLabel = 'Draf interpretasi (dibantu AI, dari angka terhitung)',
}: ExplanationBoxProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [localHoveredNum, setLocalHoveredNum] = useState<string | null>(null);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [styleMode, setStyleMode] = useState<NarrativeStyle>('standard');

  const effectiveHovered = activeNumber || localHoveredNum;

  // Transform explanation based on style without altering numbers
  const displayedExplanation = useMemo(() => {
    if (!explanation) return '';
    if (styleMode === 'concise') {
      // Make it more concise: trim introductory fillers while keeping all numbers intact
      return explanation
        .replace(/Berdasarkan analisis statistik deskriptif terhadap \d+ responden, diperoleh bahwa/i, 'Secara deskriptif,')
        .replace(/Hasil pengujian validitas butir instrumen menggunakan korelasi Pearson Product Moment menunjukkan bahwa/i, 'Uji validitas butir instrumen menunjukkan')
        .replace(/Pengujian reliabilitas instrumen dengan koefisien Cronbach's Alpha menghasilkan nilai sebagai berikut:/i, 'Hasil uji reliabilitas Cronbach\'s Alpha:')
        .replace(/Analisis regresi linier berganda menunjukkan model persamaan regresi dengan/i, 'Model regresi linier berganda menghasilkan')
        .replace(/Uji simultan ANOVA menghasilkan/i, 'Hasil ANOVA (Uji F):');
    }
    if (styleMode === 'formal') {
      // Academic formal thesis style
      return `Berdasarkan hasil kalkulasi empiris pada Bab 4, ${explanation.charAt(0).toLowerCase() + explanation.slice(1)}`;
    }
    return explanation;
  }, [explanation, styleMode]);

  // Split narrative into text and numeric tokens with attached trailing punctuation
  // Matches Indonesian numbers like 0,872 or 117 or 45,1% or 0,05 with following punct
  const renderedTokens = useMemo(() => {
    // Regex matches the number + optional trailing punctuation like , . ; : )
    const regex = /(\b\d+(?:,\d+)?%?|\b\d+\b)([,.;:)]*)/g;
    const parts: {
      leadText: string;
      numStr: string;
      trailingPunct: string;
      rawNumber: string;
    }[] = [];

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(displayedExplanation)) !== null) {
      const leadText = displayedExplanation.slice(lastIndex, match.index);
      const numStr = match[1];
      const trailingPunct = match[2] || '';
      const rawNumber = numStr.replace('%', '').trim();

      parts.push({
        leadText,
        numStr,
        trailingPunct,
        rawNumber,
      });

      lastIndex = regex.lastIndex;
    }

    const tailText = lastIndex < displayedExplanation.length ? displayedExplanation.slice(lastIndex) : '';

    return { parts, tailText };
  }, [displayedExplanation]);

  const handleCopy = async () => {
    try {
      const success = await copyWordNarrative(displayedExplanation, title);
      if (!success) {
        throw new Error('Clipboard copy failed');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      toast({
        title: COPY.layers.copied,
        description:
          'Teks penjelasan berformat Word berhasil disalin. Tempelkan (Ctrl+V) langsung ke pembahasan Bab 4 skripsi Anda.',
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

  const handleSelectNumber = (rawNum: string) => {
    if (localHoveredNum === rawNum) {
      setLocalHoveredNum(null);
      onHoverNumber?.(null);
    } else {
      setLocalHoveredNum(rawNum);
      onHoverNumber?.(rawNum);
    }
  };

  const glossaryItems = [
    COPY.glossary.pValue,
    COPY.glossary.alpha,
    COPY.glossary.vif,
    COPY.glossary.rSquare,
    COPY.glossary.tStatistic,
    COPY.glossary.fStatistic,
  ];

  return (
    <div
      className={cn(
        'rounded-[16px] border border-border bg-card p-4 sm:p-6 space-y-4 shadow-xs relative overflow-hidden transition-all',
        className
      )}
    >
      {/* Lapis 1: Intinya (Maksimal 2 kalimat, angka terhubung ke sel sumber) */}
      {summarySentence && (
        <div className="rounded-[12px] bg-primary/5 border border-primary/20 p-3.5 sm:p-4 text-foreground flex items-start gap-3">
          <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
            1
          </div>
          <div className="space-y-1 min-w-0">
            <span className="text-[13px] font-bold uppercase tracking-wider text-primary block">
              {COPY.layers.layer1Title}
            </span>
            <p className="text-sm sm:text-base font-semibold leading-relaxed max-w-[68ch]">
              {summarySentence}
            </p>
          </div>
        </div>
      )}

      {/* Header Bar & AI Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <h4 className="text-[15px] font-semibold text-foreground tracking-tight">
            {title}
          </h4>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className="text-[13px] font-normal text-muted-foreground border-border bg-muted/40 px-2.5 py-1 rounded-[6px] min-h-[24px]"
          >
            {badgeLabel}
          </Badge>

          {/* Interactive "Apa artinya?" helper bottom sheet */}
          <BottomSheet open={glossaryOpen} onOpenChange={setGlossaryOpen}>
            <BottomSheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] px-3 gap-1.5 text-[13px] text-primary hover:text-primary hover:bg-primary/10 font-medium rounded-[10px] touch-manipulation cursor-pointer"
                title="Buka penjelasan istilah statistik dalam bahasa sederhana"
              >
                <HelpCircle className="h-4 w-4" />
                <span>{COPY.layers.whatDoesItMean}</span>
              </Button>
            </BottomSheetTrigger>
            <BottomSheetContent className="max-w-lg">
              <BottomSheetHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <BottomSheetTitle className="text-base font-semibold">
                    Kamus Istilah Statistik (Bahasa Mahasiswa)
                  </BottomSheetTitle>
                </div>
              </BottomSheetHeader>
              <div className="space-y-3.5 pt-2 text-xs leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
                {glossaryItems.map((item, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-[12px] bg-muted/40 border border-border/80 space-y-1.5"
                  >
                    <div className="font-semibold text-foreground text-sm">
                      {item.term}
                    </div>
                    <p className="text-foreground/90 font-medium">{item.short}</p>
                    <p className="text-muted-foreground">{item.detail}</p>
                    <div className="text-[11px] text-primary bg-primary/5 p-2 rounded-[6px] border border-primary/10 mt-1">
                      {item.example}
                    </div>
                  </div>
                ))}
              </div>
            </BottomSheetContent>
          </BottomSheet>

          {/* Style Switcher (Standar / Lebih Singkat / Lebih Formal) */}
          <div className="inline-flex items-center rounded-lg border border-border bg-muted/30 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setStyleMode('standard')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer',
                styleMode === 'standard'
                  ? 'bg-card text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Gaya narasi standar Bab 4"
            >
              Standar
            </button>
            <button
              type="button"
              onClick={() => setStyleMode('concise')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer text-[13px]',
                styleMode === 'concise'
                  ? 'bg-card text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Gaya narasi lebih ringkas tanpa mengubah angka"
            >
              Lebih Singkat
            </button>
            <button
              type="button"
              onClick={() => setStyleMode('formal')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer text-[13px]',
                styleMode === 'formal'
                  ? 'bg-card text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Gaya bahasa akademik formal skripsi"
            >
              Lebih Formal
            </button>
          </div>

          {/* Copy Button with 2s Feedback & Screen Reader announcement */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="min-h-[44px] px-3.5 gap-1.5 text-[13px] text-foreground hover:bg-muted font-medium transition-colors rounded-[10px] touch-manipulation cursor-pointer"
            title="Salin paragraf interpretasi narasi untuk Bab 4"
            aria-live="polite"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-primary" />
                <span className="text-primary font-medium">Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-muted-foreground" />
                <span>Salin Teks</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Peringatan Ramah: Periksa dan tulis ulang */}
      <div className="flex items-center gap-2 p-2.5 rounded-[10px] bg-muted/40 border border-border text-[13px] text-muted-foreground">
        <AlertCircle className="h-4 w-4 text-primary shrink-0" />
        <span>
          <strong className="text-foreground font-semibold">Tips Dosen:</strong> Periksa dan tulis ulang draf narasi di bawah dengan gaya bahasa Anda sendiri sebelum dimasukkan ke naskah skripsi final.
        </span>
      </div>

      {/* Lapis 3: Teks Narasi dengan Angka & Tanda Baca Terbungkus whitespace-nowrap */}
      <div className="text-[15px] sm:text-[16px] leading-relaxed text-foreground font-sans max-w-[68ch]">
        {renderedTokens.parts.map((p, idx) => {
          const isMatching =
            Boolean(effectiveHovered) &&
            (p.rawNumber === effectiveHovered ||
              p.numStr === effectiveHovered ||
              (effectiveHovered ? effectiveHovered.includes(p.rawNumber) : false) ||
              (effectiveHovered ? p.rawNumber.includes(effectiveHovered) : false));

          return (
            <React.Fragment key={idx}>
              <span>{p.leadText}</span>
              <span className="whitespace-nowrap inline-flex items-center">
                <button
                  type="button"
                  onMouseEnter={() => {
                    setLocalHoveredNum(p.rawNumber);
                    onHoverNumber?.(p.rawNumber);
                  }}
                  onMouseLeave={() => {
                    setLocalHoveredNum(null);
                    onHoverNumber?.(null);
                  }}
                  onFocus={() => {
                    setLocalHoveredNum(p.rawNumber);
                    onHoverNumber?.(p.rawNumber);
                  }}
                  onBlur={() => {
                    setLocalHoveredNum(null);
                    onHoverNumber?.(null);
                  }}
                  onClick={() => handleSelectNumber(p.rawNumber)}
                  className={cn(
                    'inline-flex items-center px-1.5 py-0.5 mx-0.5 text-[13px] font-semibold rounded-[4px] transition-all duration-150 tabular-nums cursor-pointer select-none touch-manipulation',
                    'bg-muted/70 text-foreground border border-border/80 hover:bg-[#FFE14D]/40 hover:border-[#FFE14D] hover:text-[#243044]',
                    'focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
                    isMatching &&
                      'bg-[#FFE14D] text-[#243044] border-[#FFE14D] font-bold ring-2 ring-[#FFE14D] shadow-xs scale-105'
                  )}
                  title={`Klik atau sorot nilai ${p.numStr} untuk melihat sel asal di tabel`}
                  aria-label={`Angka statistik ${p.numStr}`}
                  aria-pressed={isMatching}
                >
                  {p.numStr}
                </button>
                {p.trailingPunct && <span>{p.trailingPunct}</span>}
              </span>
            </React.Fragment>
          );
        })}
        {renderedTokens.tailText && <span>{renderedTokens.tailText}</span>}
      </div>

      {/* Subtle Hint */}
      <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground pt-2 border-t border-border/60">
        <Info className="h-3.5 w-3.5 shrink-0 text-primary/70" />
        <span>
          Arahkan kursor atau ketuk angka bertinta untuk melihat sel asalnya di lembar tabel di atas.
        </span>
      </div>
    </div>
  );
}
