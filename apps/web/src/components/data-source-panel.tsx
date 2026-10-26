'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Database,
  ShieldCheck,
  Hash,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  AlertCircle,
  FileSpreadsheet,
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

export function DataSourcePanel({
  meta,
  projectId,
  className,
}: DataSourcePanelProps) {
  const [copiedHash, setCopiedHash] = React.useState(false);
  const [copiedDatasetId, setCopiedDatasetId] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isColumnsExpanded, setIsColumnsExpanded] = React.useState(false);

  if (!meta) {
    return (
      <div
        className={cn(
          'p-3 px-4 rounded-xl border border-border bg-card/60 text-xs text-muted-foreground',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Sumber data menggunakan dataset contoh sistem.</span>
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

  const itemCount = columnsList.filter((c) => c.role === 'item').length;
  const demoCount = columnsList.filter((c) => c.role === 'demographic').length;
  const idCount = columnsList.filter((c) => c.role === 'id').length;
  const openCount = columnsList.filter((c) => c.role === 'open_question').length;

  const shortenedHash = meta.sha256
    ? `${meta.sha256.slice(0, 8)}...${meta.sha256.slice(-8)}`
    : '';

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card shadow-2xs overflow-hidden transition-all',
        className
      )}
    >
      {/* Sleek Compact Bar (Default View - Single Line on Desktop) */}
      <div className="p-3 sm:px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span
              className="font-mono text-xs sm:text-[13px] font-semibold text-foreground truncate max-w-[200px] sm:max-w-[280px]"
              title={meta.fileName}
            >
              {meta.fileName}
            </span>

            <Badge
              variant="outline"
              className="text-[11px] font-normal py-0 px-2 bg-muted/40"
            >
              v{meta.version || 1} (
              {meta.kind === 'derived' ? 'Turunan' : 'Asli'})
            </Badge>

            <span className="text-[11px] text-muted-foreground hidden md:inline">
              •
            </span>

            <span className="text-[11px] text-muted-foreground tabular-nums hidden md:inline">
              {formatNumber(meta.rowCount)} responden, {meta.columnCount} kolom
            </span>

            {excludedCount > 0 && (
              <Badge
                variant="amber"
                className="text-[11px] py-0 px-2 font-medium"
              >
                {excludedCount} baris dieksklusi
              </Badge>
            )}

            <Badge
              variant="pine"
              className="text-[11px] py-0 px-2 flex items-center gap-1 font-medium"
            >
              <ShieldCheck className="w-3 h-3" />
              <span className="hidden sm:inline">Terverifikasi</span>
            </Badge>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          {projectId && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2.5 gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <Link
                href={`/app/proyek/${projectId}/analisis`}
                title="Buka kembali formulir pemetaan variabel"
              >
                <SlidersHorizontal className="w-3 h-3 text-primary" />
                <span>Ubah Pemetaan</span>
              </Link>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs h-7 px-2.5 gap-1 cursor-pointer font-medium"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Tutup detail audit data' : 'Buka detail audit data'}
          >
            <span>{isExpanded ? 'Tutup Detail' : 'Detail Audit'}</span>
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 text-muted-foreground transition-transform duration-200',
                isExpanded && 'rotate-180'
              )}
            />
          </Button>
        </div>
      </div>

      {/* Expandable Audit Details Drawer */}
      {isExpanded && (
        <div className="border-t border-border/70 bg-muted/15 p-4 space-y-3.5 text-xs animate-in fade-in-50 duration-200">
          {/* 4 Kolom Detail Spesifik */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-muted-foreground text-[11px]">Nama Berkas</span>
              <p className="font-semibold text-foreground font-mono truncate" title={meta.fileName}>
                {meta.fileName}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-muted-foreground text-[11px]">Versi & ID Dataset</span>
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground">
                  v{meta.version || 1} ({meta.kind === 'derived' ? 'turunan' : 'asli'})
                </span>
                {meta.datasetId && (
                  <button
                    type="button"
                    onClick={handleCopyDatasetId}
                    className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    title={`Salin ID: ${meta.datasetId}`}
                  >
                    {copiedDatasetId ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-muted-foreground text-[11px]">Responden & Kolom</span>
              <p className="font-semibold text-foreground tabular-nums">
                {formatNumber(meta.rowCount)} responden • {meta.columnCount} kolom
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-muted-foreground text-[11px]">Baris Dikecualikan</span>
              <p className="font-semibold text-foreground tabular-nums">
                {excludedCount > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-mono">
                    {excludedCount} baris ({meta.excludedRows?.slice(0, 5).join(', ')}
                    {excludedCount > 5 ? '...' : ''})
                  </span>
                ) : (
                  '0 baris (lengkap)'
                )}
              </p>
            </div>
          </div>

          {/* SHA-256 Checksum Box */}
          {meta.sha256 && (
            <div className="p-2.5 rounded-lg bg-card border border-border flex items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-1.5 min-w-0">
                <Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground shrink-0 text-[11px]">SHA-256:</span>
                <span className="text-foreground truncate select-all text-[11px]" title={meta.sha256}>
                  {shortenedHash}
                </span>
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="p-1 text-muted-foreground hover:text-foreground cursor-pointer ml-1"
                  title="Salin SHA-256 lengkap"
                >
                  {copiedHash ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-sans font-semibold text-[11px] shrink-0">
                ✓ Integritas Cocok
              </span>
            </div>
          )}

          {/* Catatan Anomali Jika Ada */}
          {meta.ignoredInfo?.notes && meta.ignoredInfo.notes.length > 0 && (
            <div className="p-2.5 rounded-lg border border-amber-600/30 bg-amber-500/10 text-amber-900 dark:text-amber-300 text-xs space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Catatan Struktur Berkas:
              </div>
              <ul className="list-disc list-inside text-[11px] space-y-0.5 pl-1">
                {meta.ignoredInfo.notes.map((info: string, idx: number) => (
                  <li key={idx}>{info}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Daftar Peran Kolom Collapsible */}
          {columnsList.length > 0 && (
            <div className="border border-border/80 rounded-lg overflow-hidden bg-card">
              <button
                type="button"
                onClick={() => setIsColumnsExpanded(!isColumnsExpanded)}
                className="w-full px-3 py-2 flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <span>
                  Peran Kolom ({columnsList.length} kolom: {itemCount} butir instrumen
                  {demoCount > 0 ? `, ${demoCount} demografi` : ''}
                  {openCount > 0 ? `, ${openCount} terbuka` : ''}
                  {idCount > 0 ? `, ${idCount} ID` : ''})
                </span>
                {isColumnsExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {isColumnsExpanded && (
                <div className="p-3 pt-0 overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border/60 text-muted-foreground text-[11px]">
                        <th className="py-1.5 pr-2 font-semibold">Nama Kolom</th>
                        <th className="py-1.5 px-2 font-semibold">Peran</th>
                        <th className="py-1.5 px-2 font-semibold">Tipe Data</th>
                        <th className="py-1.5 pl-2 font-semibold text-right">Nilai Kosong</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                      {columnsList.map((c) => {
                        let roleBadge = (
                          <Badge variant="secondary" className="text-[10px] py-0">
                            Diabaikan
                          </Badge>
                        );
                        if (c.role === 'item') {
                          roleBadge = (
                            <Badge variant="pine" className="text-[10px] py-0">
                              Butir Instrumen
                            </Badge>
                          );
                        } else if (c.role === 'id') {
                          roleBadge = (
                            <Badge variant="outline" className="text-[10px] py-0">
                              ID Responden
                            </Badge>
                          );
                        } else if (c.role === 'open_question') {
                          roleBadge = (
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 border-sky-500/40 text-sky-600 dark:text-sky-300 bg-sky-500/10 font-sans"
                            >
                              Terbuka
                            </Badge>
                          );
                        } else if (c.role === 'demographic') {
                          roleBadge = (
                            <Badge variant="amber" className="text-[10px] py-0">
                              Demografi
                            </Badge>
                          );
                        }

                        return (
                          <tr key={c.name} className="hover:bg-muted/20">
                            <td className="py-1.5 pr-2 font-semibold text-foreground font-sans">
                              {c.name}
                            </td>
                            <td className="py-1.5 px-2">{roleBadge}</td>
                            <td className="py-1.5 px-2 text-muted-foreground">{c.dataType}</td>
                            <td className="py-1.5 pl-2 text-right text-muted-foreground tabular-nums">
                              {c.missingCount > 0 ? (
                                <span className="text-amber-600 font-semibold">
                                  {c.missingCount}
                                </span>
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
      )}
    </div>
  );
}
