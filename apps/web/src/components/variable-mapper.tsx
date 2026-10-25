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
  GitFork,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Construct, VariableRole } from '@/lib/api/types';
import { detectMetadataAndPiiColumns } from '@/lib/google-forms-recode';
import { profileDatasetColumns } from '@/lib/dynamic-profiling';
import { useWizardStore } from '@/stores/wizard-store';

interface VariableMapperProps {
  columns: string[];
  constructs: Construct[];
  onChange: (constructs: Construct[]) => void;
  className?: string;
}

const ROLE_CONFIGS: {
  role: VariableRole;
  label: string;
  badgeLabel: string;
  shortCode: string;
  badgeClass: string;
  activeBtnClass: string;
}[] = [
  {
    role: 'independent',
    label: 'Bebas (X)',
    badgeLabel: 'Bebas (X)',
    shortCode: 'X',
    badgeClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30',
    activeBtnClass: 'bg-sky-600 text-white shadow-xs',
  },
  {
    role: 'dependent',
    label: 'Terikat (Y)',
    badgeLabel: 'Terikat (Y)',
    shortCode: 'Y',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    activeBtnClass: 'bg-emerald-600 text-white shadow-xs',
  },
  {
    role: 'mediator',
    label: 'Mediasi (Z/M)',
    badgeLabel: 'Mediasi (Z)',
    shortCode: 'Z',
    badgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
    activeBtnClass: 'bg-purple-600 text-white shadow-xs',
  },
  {
    role: 'moderator',
    label: 'Moderasi (Mod)',
    badgeLabel: 'Moderasi (Mod)',
    shortCode: 'Mod',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    activeBtnClass: 'bg-amber-600 text-white shadow-xs',
  },
];

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
    fileData,
  } = useWizardStore();

  const profileMap = React.useMemo(() => {
    return profileDatasetColumns(fileData, columns);
  }, [fileData, columns]);

  const metadataColumns = React.useMemo(() => {
    return new Set(detectMetadataAndPiiColumns(columns).map((c) => c.column));
  }, [columns]);

  // Candidate question columns (strictly prioritized for Likert ordinal items; exclude ID/NIM/Timestamp/Continuous/FreeText)
  const candidateColumns = React.useMemo(() => {
    const likertCols = columns.filter((col) => {
      const p = profileMap[col];
      return p ? p.role === 'likert' : false;
    });

    if (likertCols.length > 0) {
      return likertCols;
    }

    // Fallback if no Likert columns detected: exclude identifiers and free text
    return columns.filter((col) => {
      const p = profileMap[col];
      if (p && (p.role === 'identifier' || p.role === 'free_text')) return false;
      return !metadataColumns.has(col) && col !== 'No' && col !== 'id' && col !== 'ID';
    });
  }, [columns, profileMap, metadataColumns]);

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

    // Smart prefix detection for Indonesian thesis:
    // e.g. X1.1, X1.2, X1_1, X1_2 -> X1
    // e.g. X2.1, X2.2 -> X2
    // e.g. Y.1, Y1.1, Y1_1 -> Y or Y1
    // e.g. Z1.1, M1.1, MOD.1 -> Z1, M1, MOD
    // e.g. KL1, KP1, LP1 -> KL, KP, LP
    const prefixMap = new Map<string, string[]>();
    candidateColumns.forEach((col) => {
      // 1. Matches X1.1, X1_1, X1-1, X2.01, Y1.1, Y1_1 (letters + digits before delimiter)
      const dotUnderscoreMatch = col.match(/^([A-Za-z]+\d+)[._\-\s]/);
      // 2. Matches X.1, Y.1, Z.1 (single letter before delimiter)
      const letterDotMatch = col.match(/^([A-Za-z])[._\-\s]/);
      // 3. Matches letters followed by digits like KL1, KP2, VAR01, X1, Y2
      const lettersDigitsMatch = col.match(/^([A-Za-z]+)(?=\d+)/);
      // 4. Fallback: generic prefix
      const genericMatch = col.match(/^([A-Za-z]+|\w+?)(?:_|\d+|$)/);

      let prefix = '';
      if (dotUnderscoreMatch && dotUnderscoreMatch[1]) {
        prefix = dotUnderscoreMatch[1].toUpperCase();
      } else if (letterDotMatch && letterDotMatch[1]) {
        prefix = letterDotMatch[1].toUpperCase();
      } else if (lettersDigitsMatch && lettersDigitsMatch[1]) {
        prefix = lettersDigitsMatch[1].toUpperCase();
      } else if (genericMatch && genericMatch[1]) {
        prefix = genericMatch[1].toUpperCase();
      }

      if (prefix) {
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
        const isMed =
          prefix.startsWith('Z') ||
          prefix.startsWith('M') ||
          prefix.includes('MEDIASI') ||
          prefix.includes('INTERVEN');
        const isMod =
          prefix.startsWith('MOD') ||
          prefix.includes('MODERAS');

        let role: VariableRole = 'independent';
        let roleName = `Variabel Bebas (${prefix})`;

        if (isMed) {
          role = 'mediator';
          roleName = `Variabel Mediasi (${prefix})`;
        } else if (isMod) {
          role = 'moderator';
          roleName = `Variabel Moderasi (${prefix})`;
        } else if (isDep) {
          role = 'dependent';
          roleName = `Variabel Terikat (${prefix})`;
        }

        detected.push({
          id: `v-${prefix.toLowerCase()}`,
          name: roleName,
          role,
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

  const handleAddVariable = (role: VariableRole = 'independent') => {
    const nextNum = constructs.length + 1;
    const isFirstDependent = !constructs.some((c) => c.role === 'dependent');
    const effectiveRole: VariableRole =
      isFirstDependent && constructs.length > 0 ? 'dependent' : role;

    let defaultName = `Variabel Bebas (X${nextNum})`;
    if (effectiveRole === 'dependent') defaultName = `Variabel Terikat (Y${nextNum})`;
    else if (effectiveRole === 'mediator') defaultName = `Variabel Mediasi (Z${nextNum})`;
    else if (effectiveRole === 'moderator') defaultName = `Variabel Moderasi (M${nextNum})`;

    const newConstruct: Construct = {
      id: `var-${Date.now()}`,
      name: defaultName,
      role: effectiveRole,
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

  const handleSetRole = (constructId: string, newRole: VariableRole) => {
    onChange(
      constructs.map((c) => (c.id === constructId ? { ...c, role: newRole } : c))
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

  const independentCount = constructs.filter((c) => c.role === 'independent').length;
  const dependentCount = constructs.filter((c) => c.role === 'dependent').length;
  const mediatorCount = constructs.filter((c) => c.role === 'mediator').length;
  const moderatorCount = constructs.filter((c) => c.role === 'moderator').length;
  const hasValidMapping = independentCount >= 1 && dependentCount >= 1;

  const [newHypothesisInput, setNewHypothesisInput] = React.useState('');
  const newHypothesisInputRef = React.useRef<HTMLInputElement>(null);

  const handleAddHypothesis = (customText?: string) => {
    const raw = (typeof customText === 'string' ? customText : newHypothesisInput).trim();
    if (!raw) return;
    const clean = raw.replace(/^H\d+[\s:.-]+/i, '').trim();
    if (!clean) return;
    setHypotheses([...hypotheses, clean]);
    setNewHypothesisInput('');
    setTimeout(() => {
      newHypothesisInputRef.current?.focus();
    }, 50);
  };

  const handleKeyDownHypothesis = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddHypothesis();
    }
  };

  const handleGenerateFromConstructs = () => {
    const indeps = constructs.filter((c) => c.role === 'independent');
    const deps = constructs.filter((c) => c.role === 'dependent');
    const meds = constructs.filter((c) => c.role === 'mediator');
    const mods = constructs.filter((c) => c.role === 'moderator');

    if (indeps.length === 0 || deps.length === 0) {
      handleFillExampleHypotheses();
      return;
    }

    const targetDep = deps[0];
    const generated: string[] = [];

    // Hipotesis untuk tiap variabel bebas ke variabel terikat
    indeps.forEach((indep) => {
      generated.push(`${indep.name} berpengaruh positif dan signifikan terhadap ${targetDep.name}`);
    });

    // Jika lebih dari 1 variabel bebas, buat hipotesis simultan (Uji F)
    if (indeps.length > 1) {
      const allIndepNames = indeps.map((i) => i.name).join(' dan ');
      generated.push(`${allIndepNames} secara simultan berpengaruh signifikan terhadap ${targetDep.name}`);
    }

    // Jika ada variabel mediasi (Z)
    meds.forEach((med) => {
      if (indeps.length > 0) {
        generated.push(`${med.name} memediasi pengaruh ${indeps[0].name} terhadap ${targetDep.name}`);
      }
    });

    // Jika ada variabel moderasi (M)
    mods.forEach((mod) => {
      if (indeps.length > 0) {
        generated.push(`${mod.name} memoderasi pengaruh ${indeps[0].name} terhadap ${targetDep.name}`);
      }
    });

    if (generated.length > 0) {
      setHypotheses(generated);
      if (!researchTitle.trim()) {
        const indepNames = indeps.map((i) => i.name).join(' dan ');
        setResearchTitle(`Pengaruh ${indepNames} terhadap ${targetDep.name}`);
      }
    }
  };

  const handleFillExampleHypotheses = () => {
    if (mediatorCount > 0) {
      setResearchTitle(
        'Pengaruh Kualitas Layanan terhadap Loyalitas Pelanggan melalui Kepuasan Pelanggan sebagai Variabel Mediasi'
      );
      setHypotheses([
        'Kualitas Layanan berpengaruh positif dan signifikan terhadap Kepuasan Pelanggan',
        'Kepuasan Pelanggan berpengaruh positif dan signifikan terhadap Loyalitas Pelanggan',
        'Kualitas Layanan berpengaruh positif dan signifikan terhadap Loyalitas Pelanggan',
        'Kepuasan Pelanggan memediasi pengaruh Kualitas Layanan terhadap Loyalitas Pelanggan',
      ]);
    } else if (moderatorCount > 0) {
      setResearchTitle(
        'Pengaruh Kualitas Layanan terhadap Loyalitas Pelanggan yang Dimoderasi oleh Citra Merek'
      );
      setHypotheses([
        'Kualitas Layanan berpengaruh positif dan signifikan terhadap Loyalitas Pelanggan',
        'Citra Merek berpengaruh positif dan signifikan terhadap Loyalitas Pelanggan',
        'Citra Merek memoderasi pengaruh Kualitas Layanan terhadap Loyalitas Pelanggan',
      ]);
    } else {
      setResearchTitle('Pengaruh Kualitas Layanan dan Kepuasan Pelanggan terhadap Loyalitas Pelanggan');
      setHypotheses([
        'Kualitas Layanan berpengaruh positif dan signifikan terhadap Loyalitas Pelanggan',
        'Kepuasan Pelanggan berpengaruh positif dan signifikan terhadap Loyalitas Pelanggan',
        'Kualitas Layanan dan Kepuasan Pelanggan secara simultan berpengaruh signifikan terhadap Loyalitas Pelanggan',
      ]);
    }
  };

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
            Kelompokkan pertanyaan kuesioner ke dalam variabel bebas (X), terikat (Y), mediasi (Z), atau moderasi (Mod).
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
            onClick={() => handleAddVariable('independent')}
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
          'p-3.5 rounded-[14px] border text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3',
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
            {hasValidMapping ? (
              mediatorCount > 0 ? (
                <>
                  <span className="font-semibold">Model Mediasi (Path Analysis):</span> {independentCount} Bebas (X) → {mediatorCount} Mediasi (Z) → {dependentCount} Terikat (Y). Siap untuk Sub-struktur 1 dan 2 dan Uji Sobel.
                </>
              ) : moderatorCount > 0 ? (
                <>
                  <span className="font-semibold">Model Moderasi (MRA):</span> {independentCount} Bebas (X) dan {dependentCount} Terikat (Y) dengan {moderatorCount} Moderasi (Mod). Siap untuk Hierarchical Regression.
                </>
              ) : (
                `Struktur model lengkap: ${independentCount} Variabel Bebas (X) dan ${dependentCount} Variabel Terikat (Y).`
              )
            ) : (
              `Dibutuhkan minimal 1 Variabel Bebas (X) dan 1 Variabel Terikat (Y) untuk melakukan analisis statistik.`
            )}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          <Badge variant={independentCount > 0 ? 'pine' : 'secondary'} className="text-[10px] rounded-[6px]">
            {independentCount} Bebas (X)
          </Badge>
          <Badge variant={dependentCount > 0 ? 'pine' : 'secondary'} className="text-[10px] rounded-[6px]">
            {dependentCount} Terikat (Y)
          </Badge>
          {mediatorCount > 0 && (
            <Badge className="text-[10px] rounded-[6px] bg-purple-600 text-white border-purple-700">
              {mediatorCount} Mediasi (Z)
            </Badge>
          )}
          {moderatorCount > 0 && (
            <Badge className="text-[10px] rounded-[6px] bg-amber-600 text-white border-amber-700">
              {moderatorCount} Moderasi (Mod)
            </Badge>
          )}
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
            Klik tombol &quot;Deteksi Otomatis Pertanyaan&quot; untuk mengelompokkan pertanyaan secara otomatis, atau klik &quot;Tambah Variabel&quot; untuk membuat variabel baru.
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
            return (
              <div
                key={construct.id}
                className="p-4 rounded-[16px] border border-border bg-card shadow-xs flex flex-col justify-between space-y-3 hover:border-primary/40 transition-colors"
              >
                {/* Header: Name, Delete & 4-Role Segmented Selector */}
                <div className="space-y-2.5">
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

                  {/* 4-Role Segmented Switcher */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Peran Metodologis:
                      </span>
                      <span className="text-[11px] text-muted-foreground tabular-nums font-medium">
                        {construct.items.length} butir
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 p-0.5 bg-muted/60 dark:bg-muted/30 rounded-lg border border-border/60">
                      {ROLE_CONFIGS.map((cfg) => {
                        const isActive = construct.role === cfg.role;
                        return (
                          <button
                            key={cfg.role}
                            type="button"
                            onClick={() => handleSetRole(construct.id, cfg.role)}
                            className={cn(
                              'text-[10px] font-medium py-1 px-1 rounded-[6px] transition-all cursor-pointer text-center select-none truncate',
                              isActive
                                ? cfg.activeBtnClass
                                : 'text-muted-foreground hover:text-foreground hover:bg-background/70'
                            )}
                            title={`Jadikan sebagai ${cfg.label}`}
                          >
                            {cfg.shortCode}
                          </button>
                        );
                      })}
                    </div>
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
                                  ? `Pertanyaan ${col} ditandai negatif (dibalik dengan rumus: Skor_Baru = (Skor_Max + Skor_Min) - Skor_Lama). Klik untuk batalkan.`
                                  : `Tandai ${col} sebagai pertanyaan negatif / reverse score`
                              }
                            >
                              {isNegative ? 'Dibalik' : '+'}
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

      {/* 4. Research Title & Hypotheses Builder with Interactive Input Bar & Smart Helpers */}
      <div className="p-5 rounded-[16px] border border-border bg-card shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h5 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Judul Penelitian dan Rumusan Hipotesis Skripsi (Opsional)
            </h5>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hipotesis yang Anda tuliskan akan otomatis dicantumkan pada naskah kesimpulan Bab 4.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {hasValidMapping && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateFromConstructs}
                className="text-xs rounded-[10px] cursor-pointer shrink-0"
                title="Rumuskan hipotesis otomatis berdasarkan variabel yang telah Anda tentukan di atas"
              >
                <Layers className="w-3.5 h-3.5 mr-1.5 text-primary" />
                Rumuskan dari Variabel
              </Button>
            )}
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
        </div>

        <div className="space-y-4 pt-1">
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

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground block">
                Daftar Hipotesis Penelitian (H1, H2, ...):
              </label>
              {hypotheses.length > 0 && (
                <span className="text-[11px] text-muted-foreground font-mono">
                  {hypotheses.length} hipotesis tersimpan
                </span>
              )}
            </div>

            {/* Bar Input Pengisian Hipotesis Baru */}
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-primary select-none pointer-events-none">
                  H{hypotheses.length + 1}:
                </span>
                <input
                  ref={newHypothesisInputRef}
                  type="text"
                  value={newHypothesisInput}
                  onChange={(e) => setNewHypothesisInput(e.target.value)}
                  onKeyDown={handleKeyDownHypothesis}
                  placeholder="Ketik rumusan hipotesis Anda di sini (misal: Kualitas Layanan berpengaruh positif dan signifikan terhadap Kepuasan Pelanggan)..."
                  className="w-full text-xs pl-12 pr-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => handleAddHypothesis()}
                disabled={!newHypothesisInput.trim()}
                className="text-xs shrink-0 rounded-lg px-3.5 py-2.5 h-auto font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Tambah Hipotesis
              </Button>
            </div>

            {/* Daftar Hipotesis yang Sudah Ditambahkan */}
            {hypotheses.length === 0 ? (
              <div className="p-3.5 rounded-lg border border-dashed border-border/80 bg-muted/10 text-center space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  Belum ada hipotesis yang ditambahkan. Ketik pada bar input di atas lalu tekan <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border border-border">Enter</kbd> atau klik <strong>&quot;Tambah Hipotesis&quot;</strong>.
                </p>
                <div className="flex items-center justify-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={handleFillExampleHypotheses}
                    className="text-[11px] text-primary hover:underline font-medium cursor-pointer inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Isi Contoh Hipotesis
                  </button>
                  {hasValidMapping && (
                    <>
                      <span className="text-muted-foreground/40 text-[11px]">•</span>
                      <button
                        type="button"
                        onClick={handleGenerateFromConstructs}
                        className="text-[11px] text-primary hover:underline font-medium cursor-pointer inline-flex items-center gap-1"
                      >
                        <Layers className="w-3 h-3" /> Rumuskan Otomatis dari Variabel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                {hypotheses.map((h, idx) => {
                  const cleanText = h.replace(/^H\d+[\s:.-]+/i, '').trim();
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-1.5 pl-2.5 rounded-lg border border-border/70 bg-card hover:border-border transition-colors group"
                    >
                      <span className="text-xs font-mono font-bold text-primary shrink-0 min-w-[28px]">
                        H{idx + 1}:
                      </span>
                      <input
                        type="text"
                        value={cleanText}
                        onChange={(e) => {
                          const updated = [...hypotheses];
                          updated[idx] = e.target.value;
                          setHypotheses(updated);
                        }}
                        placeholder={`Rumusan hipotesis H${idx + 1}...`}
                        className="flex-1 text-xs px-2.5 py-1.5 rounded-md border border-border/60 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = hypotheses.filter((_, i) => i !== idx);
                          setHypotheses(updated);
                        }}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer rounded transition-colors"
                        title={`Hapus H${idx + 1}`}
                        aria-label={`Hapus H${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setHypotheses([
                        ...hypotheses,
                        `Pengaruh variabel bebas berpengaruh signifikan terhadap variabel terikat`,
                      ]);
                    }}
                    className="text-[11px] text-primary hover:underline font-medium cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Tambah Baris Hipotesis Baru (H{hypotheses.length + 1})
                  </button>
                  <button
                    type="button"
                    onClick={() => setHypotheses([])}
                    className="text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    Bersihkan Semua Hipotesis
                  </button>
                </div>
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
