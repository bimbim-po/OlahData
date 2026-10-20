'use client';

import * as React from 'react';
import {
  Plus,
  Trash2,
  ScanLine,
  Layers,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Construct, VariableRole } from '@/lib/api/types';
import { detectMetadataAndPiiColumns } from '@/lib/google-forms-recode';
import { useWizardStore } from '@/stores/wizard-store';

interface VariableMapperProps {
  columns: string[];
  constructs: Construct[];
  onChange: (constructs: Construct[]) => void;
  className?: string;
}

export function VariableMapper({
  columns,
  constructs,
  onChange,
  className,
}: VariableMapperProps) {
  const {
    reverseItems,
    toggleReverseItem,
    researchTitle,
    setResearchTitle,
    hypotheses,
    setHypotheses,
  } = useWizardStore();

  const metadataColumns = React.useMemo(() => {
    return new Set(detectMetadataAndPiiColumns(columns).map((c) => c.column));
  }, [columns]);

  // Candidate question columns (exclude row counter 'No', ID, and detected metadata/PII)
  const candidateColumns = React.useMemo(() => {
    return columns.filter(
      (col) => !metadataColumns.has(col) && col !== 'No' && col !== 'id' && col !== 'ID'
    );
  }, [columns, metadataColumns]);

  // Which columns are assigned to which variable
  const assignedColumnMap = React.useMemo(() => {
    const map = new Map<string, string>(); // colName -> constructId
    constructs.forEach((c) => {
      c.items.forEach((item) => {
        map.set(item, c.id);
      });
    });
    return map;
  }, [constructs]);

  // Columns not assigned to any variable (e.g. Demographics)
  const unassignedColumns = React.useMemo(() => {
    return candidateColumns.filter((col) => !assignedColumnMap.has(col));
  }, [candidateColumns, assignedColumnMap]);

  // Auto-detect variables from data
  const handleAutoDetect = () => {
    const detected: Construct[] = [];

    // Check for KL, KP, LP / LO marketing thesis pattern
    const hasKL = candidateColumns.some((c) => c.startsWith('KL'));
    const hasKP = candidateColumns.some((c) => c.startsWith('KP'));
    const hasLP = candidateColumns.some((c) => c.startsWith('LP'));
    const hasLO = candidateColumns.some((c) => c.startsWith('LO'));

    if (hasKL && hasKP && (hasLP || hasLO)) {
      detected.push({
        id: 'v-kl',
        name: 'Kualitas Layanan (X1)',
        role: 'independent',
        items: candidateColumns.filter((c) => /^KL\d+$/.test(c)),
      });
      detected.push({
        id: 'v-kp',
        name: 'Kepuasan Pelanggan (X2)',
        role: 'independent',
        items: candidateColumns.filter((c) => /^KP\d+$/.test(c)),
      });
      detected.push({
        id: 'v-lp',
        name: 'Loyalitas Pelanggan (Y)',
        role: 'dependent',
        items: candidateColumns.filter((c) => /^(LP|LO)\d+$/.test(c)),
      });

      // Auto-mark LP5 as negative if present
      if (candidateColumns.includes('LP5') && !reverseItems.includes('LP5')) {
        toggleReverseItem('LP5');
      }

      onChange(detected);
      return;
    }

    // Generic prefix group detection (e.g. X1_*, X2_*, Y_*, or P1, P2)
    const prefixMap = new Map<string, string[]>();
    candidateColumns.forEach((col) => {
      const match = col.match(/^([A-Za-z]+|\w+?)(?:_|\d+|$)/);
      if (match && match[1]) {
        const prefix = match[1].toUpperCase();
        const list = prefixMap.get(prefix) || [];
        list.push(col);
        prefixMap.set(prefix, list);
      }
    });

    prefixMap.forEach((items, prefix) => {
      if (items.length >= 2) {
        const isDep =
          prefix.startsWith('Y') ||
          prefix.includes('LOYAL') ||
          prefix.includes('KINERJA') ||
          prefix.includes('MINAT');
        detected.push({
          id: `v-${prefix.toLowerCase()}`,
          name: isDep ? `Variabel Terikat (${prefix})` : `Variabel Bebas (${prefix})`,
          role: isDep ? 'dependent' : 'independent',
          items,
        });
      }
    });

    if (detected.length > 0) {
      onChange(detected);
    }
  };

  React.useEffect(() => {
    if (constructs.length === 0 && candidateColumns.length > 0) {
      handleAutoDetect();
    }
  }, [constructs.length, candidateColumns.length]);

  const handleAddVariable = () => {
    const nextNum = constructs.length + 1;
    const isFirstDependent = !constructs.some((c) => c.role === 'dependent');
    const newConstruct: Construct = {
      id: `var-${Date.now()}`,
      name: isFirstDependent && constructs.length > 0 ? `Variabel Terikat (Y${nextNum})` : `Variabel Bebas (X${nextNum})`,
      role: isFirstDependent && constructs.length > 0 ? 'dependent' : 'independent',
      items: [],
    };
    onChange([...constructs, newConstruct]);
  };

  const handleRemoveVariable = (constructId: string) => {
    onChange(constructs.filter((c) => c.id !== constructId));
  };

  const handleUpdateName = (constructId: string, newName: string) => {
    onChange(
      constructs.map((c) => (c.id === constructId ? { ...c, name: newName } : c))
    );
  };

  const handleToggleRole = (constructId: string) => {
    onChange(
      constructs.map((c) => {
        if (c.id === constructId) {
          const nextRole: VariableRole = c.role === 'independent' ? 'dependent' : 'independent';
          return { ...c, role: nextRole };
        }
        return c;
      })
    );
  };

  const handleToggleItemInVariable = (constructId: string, colName: string) => {
    onChange(
      constructs.map((c) => {
        if (c.id === constructId) {
          const hasItem = c.items.includes(colName);
          return {
            ...c,
            items: hasItem
              ? c.items.filter((item) => item !== colName)
              : [...c.items, colName],
          };
        }
        // If moving from another variable, remove it from that variable
        if (c.items.includes(colName)) {
          return {
            ...c,
            items: c.items.filter((item) => item !== colName),
          };
        }
        return c;
      })
    );
  };

  const handleFillExampleHypotheses = () => {
    setResearchTitle('Pengaruh Kualitas Layanan dan Kepuasan Pelanggan terhadap Loyalitas Pelanggan');
    setHypotheses([
      'H1: Kualitas Layanan berpengaruh positif dan signifikan terhadap Loyalitas Pelanggan',
      'H2: Kepuasan Pelanggan berpengaruh positif dan signifikan terhadap Loyalitas Pelanggan',
      'H3: Kualitas Layanan dan Kepuasan Pelanggan secara simultan berpengaruh signifikan terhadap Loyalitas Pelanggan',
    ]);
  };

  const independentCount = constructs.filter((c) => c.role === 'independent').length;
  const dependentCount = constructs.filter((c) => c.role === 'dependent').length;
  const hasValidMapping = independentCount >= 1 && dependentCount >= 1;

  return (
    <div className={cn('space-y-6', className)}>
      {/* 1. Header with Auto-detect & Add Variable */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-[16px] border border-border bg-card shadow-xs">
        <div>
          <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Pengelompokan Pertanyaan Menjadi Variabel Penelitian
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kelompokkan pertanyaan kuesioner ke dalam variabel bebas (X) atau variabel terikat (Y).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutoDetect}
            className="text-xs border-primary text-primary hover:bg-primary/10 cursor-pointer rounded-[10px] min-h-[36px]"
          >
            <ScanLine className="w-3.5 h-3.5 mr-1.5" />
            Deteksi Otomatis Pertanyaan
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleAddVariable}
            className="text-xs cursor-pointer rounded-[10px] min-h-[36px]"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Tambah Variabel
          </Button>
        </div>
      </div>

      {/* 2. Role Status Indicator */}
      <div
        className={cn(
          'p-3.5 rounded-[14px] border text-xs flex items-center justify-between gap-3',
          hasValidMapping
            ? 'border-emerald-600/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
            : 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300'
        )}
      >
        <div className="flex items-center gap-2">
          {hasValidMapping ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>
            {hasValidMapping
              ? `Struktur model lengkap: ${independentCount} Variabel Bebas (X) dan ${dependentCount} Variabel Terikat (Y).`
              : `Dibutuhkan minimal 1 Variabel Bebas (X) dan 1 Variabel Terikat (Y) untuk melakukan analisis regresi.`}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={independentCount > 0 ? 'pine' : 'secondary'} className="text-[10px] rounded-[6px]">
            {independentCount} Bebas (X)
          </Badge>
          <Badge variant={dependentCount > 0 ? 'pine' : 'secondary'} className="text-[10px] rounded-[6px]">
            {dependentCount} Terikat (Y)
          </Badge>
        </div>
      </div>

      {/* 3. Variables Cards Grid */}
      {constructs.length === 0 ? (
        <div className="p-8 text-center rounded-[16px] border border-dashed border-border bg-card space-y-3">
          <Layers className="w-8 h-8 text-muted-foreground mx-auto" />
          <h5 className="font-semibold text-sm text-foreground">
            Belum ada variabel yang dibuat
          </h5>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Klik tombol "Deteksi Otomatis Pertanyaan" untuk mengelompokkan pertanyaan secara otomatis, atau klik "Tambah Variabel" untuk membuat variabel baru.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutoDetect}
            className="cursor-pointer rounded-[10px]"
          >
            <ScanLine className="w-3.5 h-3.5 mr-1.5" />
            Deteksi Otomatis Sekarang
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {constructs.map((construct, cIndex) => {
            const isIndependent = construct.role === 'independent';

            return (
              <div
                key={construct.id}
                className="p-4 rounded-[16px] border border-border bg-card shadow-xs flex flex-col justify-between space-y-3 hover:border-primary/40 transition-colors"
              >
                {/* Header: Name & Role Switch */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      value={construct.name}
                      onChange={(e) => handleUpdateName(construct.id, e.target.value)}
                      placeholder={`Nama variabel #${cIndex + 1}`}
                      className="font-medium text-xs h-8 bg-background rounded-[8px]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveVariable(construct.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shrink-0"
                      title="Hapus variabel ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleToggleRole(construct.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition-colors cursor-pointer border',
                        isIndependent
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                      )}
                      title="Klik untuk mengubah peran variabel"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      {isIndependent ? 'Variabel Bebas (X)' : 'Variabel Terikat (Y)'}
                    </button>

                    <span className="text-[11px] text-muted-foreground tabular-nums font-medium">
                      {construct.items.length} pertanyaan
                    </span>
                  </div>
                </div>

                {/* Assigned and Available Question Badges */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    Pertanyaan dalam variabel ini:
                  </span>

                  <div className="max-h-48 overflow-y-auto pr-1 flex flex-wrap gap-1.5 scrollbar-thin">
                    {candidateColumns.map((col) => {
                      const isSelected = construct.items.includes(col);
                      const isAssignedOther =
                        assignedColumnMap.has(col) && assignedColumnMap.get(col) !== construct.id;
                      const isNegative = reverseItems.includes(col);

                      return (
                        <div key={col} className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleItemInVariable(construct.id, col)}
                            className={cn(
                              'text-xs px-2 py-1 rounded-[6px] border font-mono transition-all cursor-pointer select-none',
                              isSelected
                                ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-2xs'
                                : isAssignedOther
                                ? 'bg-muted/40 text-muted-foreground/50 border-border/40 hover:border-border'
                                : 'bg-background text-foreground border-border hover:border-primary/50'
                            )}
                            title={
                              isAssignedOther
                                ? `Pindahkan ${col} ke variabel ini`
                                : isSelected
                                ? `Keluarkan ${col}`
                                : `Tambahkan ${col}`
                            }
                          >
                            {col}
                          </button>

                          {/* Negative item toggle badge */}
                          {isSelected && (
                            <button
                              type="button"
                              onClick={() => toggleReverseItem(col)}
                              className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded-[4px] border font-sans cursor-pointer transition-colors',
                                isNegative
                                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 font-bold'
                                  : 'text-muted-foreground/60 border-border/40 hover:text-foreground'
                              )}
                              title={
                                isNegative
                                  ? `Pertanyaan ${col} bernilai negatif (dibalik 6 - x). Klik untuk batalkan.`
                                  : `Tandai ${col} sebagai pertanyaan negatif (dibalik 6 - x)`
                              }
                            >
                              {isNegative ? '6-x' : '+'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Research Title & Hypotheses Builder with Example Fill */}
      <div className="p-5 rounded-[16px] border border-border bg-card shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h5 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Judul Penelitian & Rumusan Hipotesis Skripsi (Opsional)
            </h5>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hipotesis yang Anda tuliskan akan otomatis dicantumkan pada naskah kesimpulan Bab 4.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFillExampleHypotheses}
            className="text-xs rounded-[10px] cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" />
            Isi Contoh Hipotesis
          </Button>
        </div>

        <div className="space-y-3 pt-1">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Judul Skripsi / Penelitian:
            </label>
            <input
              type="text"
              value={researchTitle}
              onChange={(e) => setResearchTitle(e.target.value)}
              placeholder="Contoh: Pengaruh Kualitas Layanan dan Kepuasan terhadap Loyalitas Pelanggan..."
              className="w-full text-xs p-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Daftar Hipotesis Penelitian (H1, H2, ...):
            </label>
            {hypotheses.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Belum ada hipotesis yang ditambahkan. Anda dapat menekan tombol "Isi Contoh Hipotesis" di atas.
              </p>
            ) : (
              <div className="space-y-2">
                {hypotheses.map((h, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-primary shrink-0">
                      H{idx + 1}:
                    </span>
                    <input
                      type="text"
                      value={h}
                      onChange={(e) => {
                        const updated = [...hypotheses];
                        updated[idx] = e.target.value;
                        setHypotheses(updated);
                      }}
                      className="flex-1 text-xs p-2 rounded-lg border border-border bg-background text-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = hypotheses.filter((_, i) => i !== idx);
                        setHypotheses(updated);
                      }}
                      className="p-1.5 text-muted-foreground hover:text-destructive cursor-pointer rounded"
                      title="Hapus hipotesis ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Demographics Profiling Configuration */}
      {unassignedColumns.length > 0 && (
        <div className="p-4 rounded-[16px] border border-border/80 bg-muted/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              <h5 className="font-semibold text-xs text-foreground">
                Kolom Profil Demografi Responden ({unassignedColumns.length} kolom)
              </h5>
            </div>
            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 rounded-[6px]">
              Otomatis Dihitung Frekuensi Bab 4
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Kolom demografi di bawah ini (seperti Jenis Kelamin, Usia, Pendidikan) tidak dimasukkan ke dalam skor pertanyaan regresi, melainkan otomatis dihitung tabel frekuensi dan persentasenya pada Sub-bab 4.1:
          </p>
          <div className="flex flex-wrap gap-2 pt-0.5">
            {unassignedColumns.map((col) => (
              <span
                key={col}
                className="text-xs font-mono px-2.5 py-1 rounded-[6px] border border-border bg-card text-foreground flex items-center gap-1.5"
              >
                {col}
                <span className="text-[10px] px-1 py-0.2 bg-emerald-600 text-white rounded font-sans font-semibold">
                  Demografi
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
