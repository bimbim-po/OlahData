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
  const [copiedDatasetId, setCopiedDatasetId] = React.useState(false);
  const [isColumnsExpanded, setIsColumnsExpanded] = React.useState(false);

  if (!meta) {
    return (
      <div className={cn('p-4 rounded-xl border border-border bg-card/60 text-[13px] text-muted-foreground', className)}>
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

  const handleCopyDatasetId = () => {
    if (!meta.datasetId) return;
    navigator.clipboard.writeText(meta.datasetId);
    setCopiedDatasetId(true);
    setTimeout(() => setCopiedDatasetId(false), 2000);
  };

  const columnsList = meta.columns || [];
  const excludedCount = meta.excludedRows?.length || 0;

  // Hitung jumlah butir, konstruk, dan demografi
  const itemCount = columnsList.filter((c) => c.role === 'item').length;
  const demoCount = columnsList.filter((c) => c.role === 'demographic').length;
  const idCount = columnsList.filter((c) => c.role === 'id').length;
  const openCount = columnsList.filter((c) => c.role === 'open_question').length;

  const shortenedHash = meta.sha256
    ? `${meta.sha256.slice(0, 8)}...${meta.sha256.slice(-8)}`
    : '';

  return (
    <div className={cn('rounded-2xl border border-border bg-card shadow-xs overflow-hidden', className)}>
      {/* Top Banner */}
      <div className="p-4 sm:p-5 border-b border-border/80 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-[15px] sm:text-base text-foreground">
                Sumber Data dan Integritas Matriks
              </h3>
              <Badge variant="outline" className="text-[13px] bg-background min-h-[24px]">
                {meta.kind === 'derived' ? 'Data Turunan (Derived)' : 'Data Asli (Original)'}
              </Badge>
              <Badge variant="pine" className="text-[13px] flex items-center gap-1 min-h-[24px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Integritas Terverifikasi
              </Badge>
            </div>
            <p className="text-[13px] text-muted-foreground mt-0.5">
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
              className="text-[13px] min-h-[40px] px-3 shrink-0 gap-1.5 touch-manipulation cursor-pointer"
            >
              <Link
                href={`/app/proyek/${projectId}/analisis`}
                title="Buka kembali pemetaan konstruk untuk menjalankan analisis ulang sebagai run baru"
              >
                <SlidersHorizontal className="w-4 h-4 text-primary" />
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
              className="text-[13px] min-h-[40px] px-3 cursor-pointer shrink-0"
              title="Salin sidik jari SHA-256 lengkap"
              aria-label="Salin hash SHA-256 lengkap"
            >
              {copiedHash ? (
                <>
                  <Check className="w-4 h-4 mr-1.5 text-emerald-600" />
                  SHA-256 Tersalin
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1.5" />
                  Salin SHA-256
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Grid 4 Kolom di Desktop (minmax(200px, 1fr)), 2 di Tablet, 1 di Ponsel */}
      <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-[13px]">
        {/* Kolom 1: Nama Berkas */}
        <div className="space-y-1">
          <span className="text-muted-foreground block text-[13px]">Nama Berkas</span>
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="font-semibold text-foreground truncate block font-mono text-[13px]"
              title={`Nama Berkas Lengkap: ${meta.fileName}`}
            >
              {meta.fileName}
            </span>
          </div>
        </div>

        {/* Kolom 2: Versi Data (v1 asli/turunan) dengan id via tooltip dan tombol salin */}
        <div className="space-y-1">
          <span className="text-muted-foreground block text-[13px]">Versi Data</span>
          <div className="flex items-center gap-1.5">
            <span
              className="font-medium text-foreground text-[13px]"
              title={`ID Dataset Lengkap: ${meta.datasetId}`}
            >
              v{meta.version || 1} ({meta.kind === 'derived' ? 'turunan' : 'asli'})
            </span>
            <button
              type="button"
              onClick={handleCopyDatasetId}
              className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted/50 cursor-pointer"
              title={`Salin ID Dataset: ${meta.datasetId}`}
              aria-label="Salin ID Dataset"
            >
              {copiedDatasetId ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Kolom 3: Responden & Kolom */}
        <div className="space-y-1">
          <span className="text-muted-foreground block text-[13px]">Responden dan Kolom</span>
          <span className="font-semibold text-foreground block tabular-nums text-[13px]">
            {formatNumber(meta.rowCount)} responden • {meta.columnCount} kolom
          </span>
        </div>

        {/* Kolom 4: Baris Dikecualikan */}
        <div className="space-y-1">
          <span className="text-muted-foreground block text-[13px]">Baris Dikecualikan</span>
          <span className="font-semibold text-foreground block tabular-nums text-[13px]">
            {excludedCount > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-mono text-[13px]">
                {excludedCount} baris ({meta.excludedRows?.slice(0, 5).join(', ')}{excludedCount > 5 ? '...' : ''})
              </span>
            ) : (
              '0 baris (lengkap)'
            )}
          </span>
        </div>
      </div>

      {/* SHA-256 Checksum Dipersingkat (8 depan...8 belakang) dengan tombol salin penuh */}
      {meta.sha256 && (
        <div className="px-4 sm:px-5 pb-4">
          <div className="p-3 rounded-lg bg-muted/40 border border-border/50 flex items-center justify-between gap-3 text-[13px] font-mono">
            <div className="flex items-center gap-2 min-w-0">
              <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground shrink-0">SHA-256:</span>
              <span
                className="text-foreground font-mono select-all truncate text-[13px]"
                title={`SHA-256 Lengkap: ${meta.sha256}`}
              >
                {shortenedHash}
              </span>
              <button
                type="button"
                onClick={handleCopyHash}
                className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted/50 cursor-pointer ml-1"
                title="Salin SHA-256 lengkap"
                aria-label="Salin hash SHA-256 lengkap"
              >
                {copiedHash ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <span className="text-emerald-600 dark:text-emerald-400 font-sans font-semibold shrink-0 text-[13px] hidden sm:inline">
              ✓ Integritas Cocok
            </span>
          </div>
        </div>
      )}

      {/* Warnings / Ignored info if present */}
      {meta.ignoredInfo && meta.ignoredInfo.notes && meta.ignoredInfo.notes.length > 0 && (
        <div className="px-4 sm:px-5 pb-4">
          <div className="p-3 rounded-lg border border-amber-600/30 bg-amber-500/10 text-amber-900 dark:text-amber-300 text-[13px] space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Catatan Pembacaan Struktur Berkas:
            </div>
            <ul className="list-disc list-inside text-[13px] space-y-0.5 pl-1">
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
            className="w-full px-4 sm:px-5 py-3 flex items-center justify-between text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors cursor-pointer min-h-[44px]"
          >
            <span>
              Daftar Peran Kolom ({columnsList.length} kolom: {itemCount} butir instrumen{demoCount > 0 ? `, ${demoCount} demografi` : ''}{openCount > 0 ? `, ${openCount} pertanyaan terbuka` : ''}{idCount > 0 ? `, ${idCount} ID` : ''})
            </span>
            {isColumnsExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {isColumnsExpanded && (
            <div className="p-4 sm:p-5 pt-0 overflow-x-auto">
              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground text-[13px]">
                    <th className="py-2 pr-3 font-semibold">Nama Kolom</th>
                    <th className="py-2 px-3 font-semibold">Peran Terdeteksi</th>
                    <th className="py-2 px-3 font-semibold">Tipe Data</th>
                    <th className="py-2 pl-3 font-semibold text-right">Nilai Kosong</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono text-[13px]">
                  {columnsList.map((c) => {
                    let roleBadge = <Badge variant="secondary" className="text-[13px] min-h-[24px]">Diabaikan</Badge>;
                    if (c.role === 'item') {
                      roleBadge = <Badge variant="pine" className="text-[13px] min-h-[24px]">Butir Instrumen</Badge>;
                    } else if (c.role === 'id') {
                      roleBadge = <Badge variant="outline" className="text-[13px] min-h-[24px]">ID Responden</Badge>;
                    } else if (c.role === 'open_question') {
                      roleBadge = <Badge variant="outline" className="text-[13px] min-h-[24px] border-sky-500/40 text-sky-600 dark:text-sky-300 bg-sky-500/10 font-sans font-semibold">Pertanyaan Terbuka</Badge>;
                    } else if (c.role === 'demographic') {
                      roleBadge = <Badge variant="amber" className="text-[13px] min-h-[24px]">Demografi</Badge>;
                    }

                    return (
                      <tr key={c.name} className="hover:bg-muted/20">
                        <td className="py-2 pr-3 font-semibold text-foreground font-sans text-[13px]">{c.name}</td>
                        <td className="py-2 px-3">{roleBadge}</td>
                        <td className="py-2 px-3 text-muted-foreground text-[13px]">{c.dataType}</td>
                        <td className="py-2 pl-3 text-right text-muted-foreground tabular-nums text-[13px]">
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
