'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Database,
  ShieldCheck,
  Hash,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { DatasetSourceMeta } from '@/lib/api/types';

export interface DataSourcePanelProps {
  meta?: DatasetSourceMeta;
  projectId?: string;
  className?: string;
}

export function DataSourcePanel({ meta, projectId, className }: DataSourcePanelProps) {
  const [copiedHash, setCopiedHash] = React.useState(false);
  const [isColumnsExpanded, setIsColumnsExpanded] = React.useState(false);

  if (!meta) {
    return (
      <div className={cn('p-4 rounded-xl border border-border bg-card/60 text-xs text-muted-foreground', className)}>
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-muted-foreground" />
          <span>Informasi sumber data tidak tersedia atau menggunakan dataset contoh sistem.</span>
        </div>
      </div>
    );
  }

  const handleCopyHash = () => {
    if (!meta.sha256) return;
    navigator.clipboard.writeText(meta.sha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const columnsList = meta.columns || [];
  const excludedCount = meta.excludedRows?.length || 0;

  // Hitung jumlah butir, konstruk, dan demografi
  const itemCount = columnsList.filter((c) => c.role === 'item').length;
  const demoCount = columnsList.filter((c) => c.role === 'demographic').length;
  const idCount = columnsList.filter((c) => c.role === 'id').length;

  return (
    <div className={cn('rounded-2xl border border-border bg-card shadow-xs overflow-hidden', className)}>
      {/* Top Banner */}
      <div className="p-4 sm:p-5 border-b border-border/80 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm text-foreground">
                Sumber Data &amp; Integritas Matriks
              </h3>
              <Badge variant="outline" className="text-[10px] bg-background">
                {meta.kind === 'derived' ? 'Data Turunan (Derived)' : 'Data Asli (Original)'}
              </Badge>
              <Badge variant="pine" className="text-[10px] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Integritas Terverifikasi
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Jejak digital data responden untuk keperluan audit transparansi Bab 4 metodologi penelitian.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {projectId && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs h-8 shrink-0 gap-1.5 touch-manipulation cursor-pointer"
            >
              <Link
                href={`/app/proyek/${projectId}/analisis`}
                title="Buka kembali pemetaan konstruk untuk menjalankan analisis ulang sebagai run baru"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                <span>Ubah Pemetaan</span>
              </Link>
            </Button>
          )}

          {meta.sha256 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyHash}
              className="text-xs cursor-pointer h-8 shrink-0"
              title="Salin sidik jari SHA-256"
            >
              {copiedHash ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  Tersalin
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Salin SHA-256
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Grid of Key Metadata */}
      <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="space-y-1">
          <span className="text-muted-foreground block text-[11px]">Nama Berkas</span>
          <span className="font-semibold text-foreground truncate block font-mono" title={meta.fileName}>
            {meta.fileName}
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-muted-foreground block text-[11px]">Dataset ID / Versi</span>
          <span className="font-mono text-muted-foreground truncate block text-[11px]" title={`${meta.datasetId} (v${meta.version})`}>
            {meta.datasetId} (v{meta.version})
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-muted-foreground block text-[11px]">Responden &amp; Kolom</span>
          <span className="font-semibold text-foreground block tabular-nums">
            {formatNumber(meta.rowCount)} responden • {meta.columnCount} kolom
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-muted-foreground block text-[11px]">Baris Dikecualikan</span>
          <span className="font-semibold text-foreground block tabular-nums">
            {excludedCount > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-mono">
                {excludedCount} baris ({meta.excludedRows?.slice(0, 5).join(', ')}{excludedCount > 5 ? '...' : ''})
              </span>
            ) : (
              '0 baris (lengkap)'
            )}
          </span>
        </div>
      </div>

      {/* SHA-256 Checksum Full View */}
      {meta.sha256 && (
        <div className="px-4 sm:px-5 pb-4">
          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 flex items-center justify-between gap-3 text-[11px] font-mono">
            <div className="flex items-center gap-2 min-w-0">
              <Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground shrink-0">SHA-256:</span>
              <span className="text-foreground truncate select-all">{meta.sha256}</span>
            </div>
            <span className="text-emerald-600 dark:text-emerald-400 font-sans font-semibold shrink-0 text-[10px] hidden sm:inline">
              ✓ Integritas Cocok
            </span>
          </div>
        </div>
      )}

      {/* Warnings / Ignored info if present */}
      {meta.ignoredInfo && meta.ignoredInfo.notes && meta.ignoredInfo.notes.length > 0 && (
        <div className="px-4 sm:px-5 pb-4">
          <div className="p-3 rounded-lg border border-amber-600/30 bg-amber-500/10 text-amber-900 dark:text-amber-300 text-xs space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Catatan Pembacaan Struktur Berkas:
            </div>
            <ul className="list-disc list-inside text-[11px] space-y-0.5 pl-1">
              {meta.ignoredInfo.notes.map((info: string, idx: number) => (
                <li key={idx}>{info}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Collapsible Column Roles Section: Ringkasan jelas ("X kolom: Y butir, Z demografi") */}
      {columnsList.length > 0 && (
        <div className="border-t border-border/80">
          <button
            type="button"
            onClick={() => setIsColumnsExpanded(!isColumnsExpanded)}
            className="w-full px-4 sm:px-5 py-3 flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors cursor-pointer"
          >
            <span>
              Daftar Peran Kolom ({columnsList.length} kolom: {itemCount} butir instrumen{demoCount > 0 ? `, ${demoCount} demografi` : ''}{idCount > 0 ? `, ${idCount} ID` : ''})
            </span>
            {isColumnsExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {isColumnsExpanded && (
            <div className="p-4 sm:p-5 pt-0 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground text-[11px]">
                    <th className="py-2 pr-3 font-semibold">Nama Kolom</th>
                    <th className="py-2 px-3 font-semibold">Peran Terdeteksi</th>
                    <th className="py-2 px-3 font-semibold">Tipe Data</th>
                    <th className="py-2 pl-3 font-semibold text-right">Nilai Kosong</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                  {columnsList.map((c) => {
                    let roleBadge = <Badge variant="secondary" className="text-[10px]">Diabaikan</Badge>;
                    if (c.role === 'item') {
                      roleBadge = <Badge variant="pine" className="text-[10px]">Butir Instrumen</Badge>;
                    } else if (c.role === 'id') {
                      roleBadge = <Badge variant="outline" className="text-[10px]">ID Responden</Badge>;
                    } else if (c.role === 'demographic') {
                      roleBadge = <Badge variant="amber" className="text-[10px]">Demografi</Badge>;
                    }

                    return (
                      <tr key={c.name} className="hover:bg-muted/20">
                        <td className="py-1.5 pr-3 font-semibold text-foreground font-sans">{c.name}</td>
                        <td className="py-1.5 px-3">{roleBadge}</td>
                        <td className="py-1.5 px-3 text-muted-foreground">{c.dataType}</td>
                        <td className="py-1.5 pl-3 text-right text-muted-foreground tabular-nums">
                          {c.missingCount > 0 ? (
                            <span className="text-amber-600 font-semibold">{c.missingCount}</span>
                          ) : (
                            '0'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
