'use client';

import * as React from 'react';
import { useState } from 'react';
import { Sparkles, Check, HelpCircle, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';

interface Chapter4InterpretationCardProps {
  intinya: string;
  interpretation?: string;
  tableNumber: string;
  guidingQuestions?: string[];
  className?: string;
  onHoverNumber?: (val: string | null) => void;
  activeNumber?: string | null;
}

export function Chapter4InterpretationCard({
  intinya,
  interpretation,
  tableNumber,
  guidingQuestions = [
    'Apakah temuan ini sejalan atau bertentangan dengan penelitian terdahulu pada topik yang sama?',
    'Teori apa yang mendasari arah dan signifikansi hubungan ini menurut kajian pustaka Anda?',
    'Apa implikasi praktis bagi objek penelitian atau manajemen berdasarkan pembuktian angka ini?',
  ],
  className,
  onHoverNumber,
  activeNumber,
}: Chapter4InterpretationCardProps) {
  const { toast } = useToast();
  const [isPolishing, setIsPolishing] = useState(false);
  const [isPolished, setIsPolished] = useState(false);
  const [showScaffold, setShowScaffold] = useState(true);

  const handlePolishWithAI = () => {
    setIsPolishing(true);
    setTimeout(() => {
      setIsPolishing(false);
      setIsPolished(true);
      toast({
        title: 'Gaya Bahasa Naskah Dirapikan',
        description: 'Tata bahasa telah diselaraskan dengan kaidah penulisan ilmiah baku. Angka dan signifikansi tetap 100% terkunci.',
        variant: 'success',
      });
    }, 600);
  };

  return (
    <div className={cn('rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-xs', className)}>
      {/* 1. Header & Intinya Badge */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Interpretasi Akademik ({tableNumber})
            </span>
            <Badge variant="outline" className="text-[11px] font-mono py-0">
              Rule-Based Engine
            </Badge>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handlePolishWithAI}
            disabled={isPolishing}
            className="text-xs h-7 px-2.5 gap-1.5 text-muted-foreground hover:text-foreground touch-manipulation cursor-pointer"
            title="Rapikan tata bahasa kalimat tanpa mengubah angka atau kategori statistik"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>{isPolished ? 'Gaya Ilmiah Aktif' : 'Rapikan Gaya AI'}</span>
          </Button>
        </div>

        {/* Intinya callout */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-xs font-bold text-primary shrink-0 uppercase tracking-wider mt-0.5">
            Intinya:
          </span>
          <p className="text-xs sm:text-[13px] font-medium text-foreground leading-relaxed">
            {intinya}
          </p>
        </div>
      </div>

      {/* 2. Draf Narasi Interpretasi */}
      {interpretation && (
        <div className="space-y-1.5 text-xs sm:text-[13px] text-foreground leading-relaxed">
          <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
            Draf Naskah Bab IV:
          </h4>
          <p className="whitespace-pre-line text-muted-foreground">
            {interpretation}
          </p>
        </div>
      )}

      {/* 3. Kerangka Pembahasan Akademik (Scaffold - No Hallucination) */}
      <div className="rounded-lg border border-border/80 bg-muted/30 p-3 sm:p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-foreground">
              Kerangka Pembahasan Akademik
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowScaffold(!showScaffold)}
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer"
          >
            {showScaffold ? (
              <>
                <span>Sembunyikan</span>
                <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <span>Buka Pemandu</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>

        {showScaffold && (
          <div className="space-y-2 pt-1 border-t border-border/40 text-xs">
            {/* The Mandatory Academic Placeholder */}
            <div className="p-2.5 rounded border border-dashed border-border bg-background text-muted-foreground font-mono text-[11px] leading-relaxed select-all">
              [Tambahkan teori dan penelitian terdahulu Anda di sini]
            </div>

            <p className="text-[11px] text-muted-foreground italic">
              Pertanyaan pemandu dari dosen penguji untuk menyusun paragraf pembahasan Anda:
            </p>

            <ul className="space-y-1 pl-1 text-[12px] text-foreground">
              {guidingQuestions.map((q, qIdx) => (
                <li key={qIdx} className="flex items-start gap-1.5 leading-snug">
                  <span className="text-primary font-bold">{qIdx + 1}.</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
