'use client';

import * as React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  Trash2,
  UploadCloud,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DataIssue } from '@/lib/api/types';

interface IssueListProps {
  issues: DataIssue[];
  onSelectIssue?: (row: number, col?: string, severity?: 'error' | 'warning' | 'info') => void;
  onRemoveRow?: (rowNumber: number) => void;
  onReupload?: () => void;
  className?: string;
}

export function IssueList({
  issues,
  onSelectIssue,
  onRemoveRow,
  onReupload,
  className,
}: IssueListProps) {
  const [filter, setFilter] = React.useState<'all' | 'error' | 'warning' | 'info'>('all');

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  const filteredIssues = React.useMemo(() => {
    if (filter === 'all') return issues;
    return issues.filter((i) => i.severity === filter);
  }, [issues, filter]);

  return (
    <div className={cn('flex flex-col space-y-4', className)}>
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card shadow-xs">
        <div>
          <h4 className="font-semibold text-sm text-foreground">
            Pemeriksaan Kualitas Data
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Klik kartu masalah untuk menyorot lokasi pada tabel. Baris bermasalah dapat dihapus dari analisis.
          </p>
        </div>

        {onReupload && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReupload}
            className="text-xs font-medium cursor-pointer shrink-0"
          >
            <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
            Kembali unggah file
          </Button>
        )}
      </div>

      {/* Filter Tabs & Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer',
            filter === 'all'
              ? 'bg-foreground text-background border-foreground'
              : 'bg-card text-muted-foreground border-border hover:bg-muted'
          )}
        >
          Semua ({issues.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('error')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5',
            filter === 'error'
              ? 'bg-destructive text-white border-destructive'
              : 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20'
          )}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          Galat Kritis ({errorCount})
        </button>

        <button
          type="button"
          onClick={() => setFilter('warning')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5',
            filter === 'warning'
              ? 'bg-[var(--color-amber)] text-white border-[var(--color-amber)]'
              : 'bg-[var(--color-amber)]/10 text-[var(--color-amber)] border-[var(--color-amber)]/20 hover:bg-[var(--color-amber)]/20'
          )}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Peringatan ({warningCount})
        </button>

        <button
          type="button"
          onClick={() => setFilter('info')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5',
            filter === 'info'
              ? 'bg-muted-foreground text-white border-muted-foreground'
              : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
          )}
        >
          <Info className="w-3.5 h-3.5" />
          Info ({infoCount})
        </button>
      </div>

      {/* Issues List Container */}
      {filteredIssues.length === 0 ? (
        <div className="p-8 rounded-xl border border-dashed border-border bg-card text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h5 className="font-semibold text-sm text-foreground">
            {issues.length === 0
              ? 'Tidak ada masalah terdeteksi'
              : 'Tidak ada item dalam kategori ini'}
          </h5>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {issues.length === 0
              ? 'Kualitas data baik dan memenuhi syarat untuk dilanjutkan ke tahap pemetaan variabel.'
              : 'Pilih filter lain untuk melihat catatan kualitas data.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
          {filteredIssues.map((issue) => {
            const isError = issue.severity === 'error';
            const isWarning = issue.severity === 'warning';

            return (
              <div
                key={issue.id}
                onClick={() => {
                  if (issue.row) {
                    onSelectIssue?.(issue.row, issue.column, issue.severity);
                  }
                }}
                className={cn(
                  'p-3.5 rounded-xl border transition-all text-left bg-card group relative cursor-pointer',
                  isError
                    ? 'border-destructive/30 hover:border-destructive hover:bg-destructive/5'
                    : isWarning
                    ? 'border-[var(--color-amber)]/30 hover:border-[var(--color-amber)] hover:bg-[var(--color-amber)]/5'
                    : 'border-border/80 hover:border-border hover:bg-muted/40'
                )}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    if (issue.row) onSelectIssue?.(issue.row, issue.column, issue.severity);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">
                      {isError ? (
                        <AlertOctagon className="w-4 h-4 text-destructive shrink-0" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-4 h-4 text-[var(--color-amber)] shrink-0" />
                      ) : (
                        <Info className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={isError ? 'destructive' : isWarning ? 'amber' : 'secondary'}
                          className="text-[10px] uppercase font-semibold py-0 px-2"
                        >
                          {isError ? 'Galat Kritis' : isWarning ? 'Peringatan' : 'Informasi'}
                        </Badge>

                        {issue.row && (
                          <span className="text-xs font-mono font-medium text-foreground bg-muted px-1.5 py-0.5 rounded">
                            Baris #{issue.row}
                          </span>
                        )}

                        {issue.column && (
                          <span className="text-xs font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                            Kolom: {issue.column}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-medium text-foreground">
                        {issue.message}
                        {issue.value !== undefined && (
                          <span className="ml-1 text-muted-foreground font-normal">
                            (Nilai:{' '}
                            <span className="font-mono font-semibold text-foreground">
                              {issue.value === null ? '<Kosong>' : String(issue.value)}
                            </span>
                            )
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {issue.row && onRemoveRow && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => onRemoveRow(issue.row!)}
                        className="h-7 text-[11px] px-2.5 shadow-none cursor-pointer"
                        title={`Hapus baris #${issue.row} dari analisis`}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Hapus baris ini dari analisis
                      </Button>
                    )}

                    {issue.row && (
                      <button
                        type="button"
                        onClick={() => onSelectIssue?.(issue.row!, issue.column, issue.severity)}
                        className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
                        title="Lihat di tabel"
                        aria-label="Lihat di tabel"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Methodological Guidance Note */}
      <div className="p-3 rounded-lg border border-border/60 bg-muted/30 text-[11px] text-muted-foreground leading-relaxed">
        <strong className="text-foreground font-medium">Integritas Metodologi Penelitian:</strong>{' '}
        OlahData tidak menyediakan fitur &quot;Isi otomatis&quot; atau &quot;Perbaiki dengan AI&quot; guna menjaga kejujuran akademik. Baris yang memiliki galat kritis harus dieliminasi dari pengolahan sampel atau diperbaiki pada file sumber kuesioner asli Anda.
      </div>
    </div>
  );
}
