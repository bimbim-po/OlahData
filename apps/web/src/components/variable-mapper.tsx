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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Construct, VariableRole } from '@/lib/api/types';

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
  // Candidate item columns (exclude row counter 'No' and ID)
  const candidateColumns = React.useMemo(() => {
    return columns.filter((col) => col !== 'No' && col !== 'id' && col !== 'ID');
  }, [columns]);

  // Which columns are assigned to which construct
  const assignedColumnMap = React.useMemo(() => {
    const map = new Map<string, string>(); // colName -> constructId
    constructs.forEach((c) => {
      c.items.forEach((item) => {
        map.set(item, c.id);
      });
    });
    return map;
  }, [constructs]);

  // Columns not assigned to any construct (e.g. Demographics)
  const unassignedColumns = React.useMemo(() => {
    return candidateColumns.filter((col) => !assignedColumnMap.has(col));
  }, [candidateColumns, assignedColumnMap]);

  // Auto-detect constructs from data
  const handleAutoDetect = () => {
    const detected: Construct[] = [];

    // Check for KL, KP, LO sample pattern
    const hasKL = candidateColumns.some((c) => c.startsWith('KL'));
    const hasKP = candidateColumns.some((c) => c.startsWith('KP'));
    const hasLO = candidateColumns.some((c) => c.startsWith('LO'));

    if (hasKL && hasKP && hasLO) {
      detected.push({
        id: 'c-kl',
        name: 'Kualitas Layanan (X1)',
        role: 'independent',
        items: candidateColumns.filter((c) => /^KL\d+$/.test(c)),
      });
      detected.push({
        id: 'c-kp',
        name: 'Kepuasan Pelanggan (X2)',
        role: 'independent',
        items: candidateColumns.filter((c) => /^KP\d+$/.test(c)),
      });
      detected.push({
        id: 'c-lo',
        name: 'Loyalitas Pelanggan (Y)',
        role: 'dependent',
        items: candidateColumns.filter((c) => /^LO\d+$/.test(c)),
      });
      onChange(detected);
      return;
    }

    // Generic prefix group detection (e.g. X1_*, X2_*, Y_*, or AB1, AB2)
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
        const isDep = prefix.startsWith('Y') || prefix.includes('LOYAL') || prefix.includes('KINERJA');
        detected.push({
          id: `c-${prefix.toLowerCase()}`,
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

  const handleAddConstruct = () => {
    const nextNum = constructs.length + 1;
    const isFirstDependent = !constructs.some((c) => c.role === 'dependent');
    const newConstruct: Construct = {
      id: `construct-${Date.now()}`,
      name: isFirstDependent && constructs.length > 0 ? `Konstruk Y${nextNum}` : `Konstruk X${nextNum}`,
      role: isFirstDependent && constructs.length > 0 ? 'dependent' : 'independent',
      items: [],
    };
    onChange([...constructs, newConstruct]);
  };

  const handleRemoveConstruct = (constructId: string) => {
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

  const handleToggleItemInConstruct = (constructId: string, colName: string) => {
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
        // If moving from another construct, remove it from that construct
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

  const independentCount = constructs.filter((c) => c.role === 'independent').length;
  const dependentCount = constructs.filter((c) => c.role === 'dependent').length;
  const hasValidMapping = independentCount >= 1 && dependentCount >= 1;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Quick Auto-detect & Add */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-xs">
        <div>
          <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Pemetaan Konstruk & Variabel Penelitian
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kelompokkan butir kuesioner ke dalam variabel bebas (X) atau variabel terikat (Y).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutoDetect}
            className="text-xs border-primary/50 text-primary hover:bg-primary/10 cursor-pointer"
          >
            <ScanLine className="w-3.5 h-3.5 mr-1.5" />
            Deteksi otomatis dari data contoh
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleAddConstruct}
            className="text-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Tambah konstruk
          </Button>
        </div>
      </div>

      {/* Role Requirement Indicator */}
      <div
        className={cn(
          'p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3',
          hasValidMapping
            ? 'border-emerald-600/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
            : 'border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10 text-[var(--color-amber)]'
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
              ? `Struktur terpenuhi: ${independentCount} Variabel Bebas (X) dan ${dependentCount} Variabel Terikat (Y).`
              : `Dibutuhkan minimal 1 Variabel Bebas (X) dan 1 Variabel Terikat (Y) untuk melakukan analisis regresi.`}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={independentCount > 0 ? 'pine' : 'secondary'} className="text-[10px]">
            {independentCount} Bebas (X)
          </Badge>
          <Badge variant={dependentCount > 0 ? 'pine' : 'secondary'} className="text-[10px]">
            {dependentCount} Terikat (Y)
          </Badge>
        </div>
      </div>

      {/* Constructs Grid */}
      {constructs.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-dashed border-border bg-muted/20 space-y-3">
          <Layers className="w-8 h-8 text-muted-foreground mx-auto" />
          <h5 className="font-semibold text-sm text-foreground">
            Belum ada konstruk yang dibuat
          </h5>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Klik tombol &quot;Deteksi otomatis dari data contoh&quot; jika menggunakan data sampel, atau klik &quot;Tambah konstruk&quot; untuk memetakan item manual.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutoDetect}
            className="cursor-pointer"
          >
            <ScanLine className="w-3.5 h-3.5 mr-1.5" />
            Deteksi otomatis sekarang
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {constructs.map((construct, cIndex) => {
            const isIndependent = construct.role === 'independent';

            return (
              <div
                key={construct.id}
                className="p-4 rounded-xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-3 hover:border-primary/40 transition-colors"
              >
                {/* Header: Name & Role Switch */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      value={construct.name}
                      onChange={(e) => handleUpdateName(construct.id, e.target.value)}
                      placeholder={`Nama konstruk #${cIndex + 1}`}
                      className="font-medium text-xs h-8 bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveConstruct(construct.id)}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shrink-0"
                      title="Hapus konstruk"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleToggleRole(construct.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer border',
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
                      {construct.items.length} butir
                    </span>
                  </div>
                </div>

                {/* Available and assigned item badges */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    Pilih butir kuesioner:
                  </span>

                  <div className="max-h-40 overflow-y-auto pr-1 flex flex-wrap gap-1.5 scrollbar-thin">
                    {candidateColumns.map((col) => {
                      const isSelected = construct.items.includes(col);
                      const isAssignedOther =
                        assignedColumnMap.has(col) && assignedColumnMap.get(col) !== construct.id;

                      return (
                        <button
                          key={col}
                          type="button"
                          onClick={() => handleToggleItemInConstruct(construct.id, col)}
                          className={cn(
                            'text-xs px-2 py-1 rounded-md border font-mono transition-all cursor-pointer select-none',
                            isSelected
                              ? 'bg-primary text-white border-primary font-semibold shadow-xs'
                              : isAssignedOther
                              ? 'bg-muted/40 text-muted-foreground/50 border-border/40 hover:border-border'
                              : 'bg-background text-foreground border-border hover:border-primary/50'
                          )}
                          title={
                            isAssignedOther
                              ? `Pindahkan ${col} ke konstruk ini`
                              : isSelected
                              ? `Keluarkan ${col}`
                              : `Tambahkan ${col}`
                          }
                        >
                          {col}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unassigned Columns / Demographics Note */}
      {unassignedColumns.length > 0 && (
        <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              <h5 className="font-semibold text-xs text-foreground">
                Kolom Non-Konstruk / Profil Demografi ({unassignedColumns.length} kolom)
              </h5>
            </div>
            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
              Otomatis Dianalisis Profilnya
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Kolom non-item di bawah ini (misalnya data demografi seperti Jenis Kelamin, Usia, Pendidikan) tidak dimasukkan ke dalam skor regresi, melainkan otomatis dihitung tabel frekuensi dan persentasenya untuk naskah Bab 4:
          </p>
          <div className="flex flex-wrap gap-2 pt-0.5">
            {unassignedColumns.map((col) => {
              const isDemographic = /^(jenis[\s_]?kelamin|gender|usia|umur|pendidikan|pekerjaan|jurusan|angkatan)$/i.test(col.trim());
              return (
                <span
                  key={col}
                  className={cn(
                    'text-xs font-mono px-2.5 py-1 rounded-md border flex items-center gap-1.5',
                    isDemographic
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200 font-semibold'
                      : 'bg-card border-border text-muted-foreground'
                  )}
                >
                  {col}
                  {isDemographic && (
                    <span className="text-[10px] px-1 py-0.2 bg-emerald-600 text-white rounded font-sans font-bold">
                      Demografi
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
