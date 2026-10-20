'use client';

import * as React from 'react';
import { useState } from 'react';
import { Plus, Check, ChevronDown, Sparkles, HelpCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface OptionalTableConfig {
  id: string;
  tableNumber: string;
  title: string;
  description: string;
  category: 'assumptions' | 'comparative' | 'categorical' | 'correlation';
}

export const OPTIONAL_TABLES: OptionalTableConfig[] = [
  {
    id: 'tabel_4_9_dw',
    tableNumber: 'Tabel 4.9',
    title: 'Uji Autokorelasi Durbin-Watson',
    description: 'Untuk data runtun waktu (time series). Nonaktif bawaan pada survei cross-sectional.',
    category: 'assumptions',
  },
  {
    id: 'tabel_4_12_korelasi',
    tableNumber: 'Tabel 4.12',
    title: 'Matriks Korelasi Antar Variabel (Pearson & Spearman)',
    description: 'Menampilkan derajat keeratan linier antar seluruh pasangan variabel penelitian.',
    category: 'correlation',
  },
  {
    id: 'tabel_4_13_uji_beda_2',
    tableNumber: 'Tabel 4.13',
    title: 'Uji Beda 2 Kelompok (Independent Sample t-Test)',
    description: 'Komparasi skor antar 2 kategori kelompok responden atau perlakuan kontrol-eksperimen.',
    category: 'comparative',
  },
  {
    id: 'tabel_4_14_uji_beda_3',
    tableNumber: 'Tabel 4.14',
    title: 'Uji Beda 3+ Kelompok (One-Way ANOVA & Tukey HSD)',
    description: 'Komparasi rata-rata tiga kelompok atau lebih dengan analisis post-hoc.',
    category: 'comparative',
  },
  {
    id: 'tabel_4_15_chi_kuadrat',
    tableNumber: 'Tabel 4.15',
    title: 'Uji Chi-Kuadrat & Estimasi Risiko (Odds Ratio)',
    description: 'Tabulasi silang frekuensi aktual vs harapan untuk variabel kategorik/nominal.',
    category: 'categorical',
  },
];

interface TambahAnalisisSelectorProps {
  enabledTableIds: string[];
  onToggleTable: (tableId: string) => void;
  className?: string;
}

export function TambahAnalisisSelector({
  enabledTableIds,
  onToggleTable,
  className,
}: TambahAnalisisSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn('relative inline-block text-left', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[40px] px-3.5 gap-2 text-[13px] font-semibold border-primary/40 hover:bg-primary/5 text-primary rounded-xl cursor-pointer"
        title="Tampilkan atau sembunyikan tabel analisis tambahan di naskah Bab 4"
      >
        <Plus className="h-4 w-4" />
        <span>Tambah Analisis Bab 4</span>
        <Badge variant="secondary" className="text-[11px] px-1.5 py-0 font-mono">
          {enabledTableIds.length} aktif
        </Badge>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')} />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card p-3 shadow-xl z-50 space-y-2">
            <div className="px-2 py-1.5 border-b border-border/60">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                Pilih Tabel Analisis Tambahan
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Aktifkan tabel opsional untuk melengkapi naskah Bab 4 sesuai arahan pembimbing.
              </p>
            </div>

            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {OPTIONAL_TABLES.map((t) => {
                const isEnabled = enabledTableIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onToggleTable(t.id)}
                    className={cn(
                      'w-full text-left p-2.5 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer',
                      isEnabled
                        ? 'border-primary/40 bg-primary/5 text-foreground'
                        : 'border-border/60 hover:bg-muted/40 text-muted-foreground'
                    )}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-primary">
                          {t.tableNumber}
                        </span>
                        <span className="text-xs font-semibold text-foreground">
                          {t.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        {t.description}
                      </p>
                    </div>

                    <div
                      className={cn(
                        'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5',
                        isEnabled
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border'
                      )}
                    >
                      {isEnabled && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Tabel yang dipilih otomatis masuk ke dokumen ekspor Word &amp; PDF.</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
