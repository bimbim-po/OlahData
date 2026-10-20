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
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DataIssue } from '@/lib/api/types';

interface IssueListProps {
  issues: DataIssue[];
  rowCount?: number;
  columnCount?: number;
  onSelectIssue?: (row: number, col?: string, severity?: 'error' | 'warning' | 'info') => void;
  onRemoveRow?: (rowNumber: number) => void;
  onRemoveAllProblematicRows?: (rowNumbers: number[]) => void;
  onReupload?: () => void;
  className?: string;
}

export function IssueList({
  issues,
  rowCount = 0,
  columnCount = 0,
  onSelectIssue,
  onRemoveRow,
  onRemoveAllProblematicRows,
  onReupload,
  className,
}: IssueListProps) {
  const [filter, setFilter] = React.useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [acknowledgedIssues, setAcknowledgedIssues] = React.useState<Set<string>>(new Set());

  const activeIssues = React.useMemo(() => {
    return issues.filter((i) => !acknowledgedIssues.has(i.id));
  }, [issues, acknowledgedIssues]);

  const errorCount = activeIssues.filter((i) => i.severity === 'error').length;
  const warningCount = activeIssues.filter((i) => i.severity === 'warning').length;
  const infoCount = activeIssues.filter((i) => i.severity === 'info').length;

  const filteredIssues = React.useMemo(() => {
    if (filter === 'all') return activeIssues;
    return activeIssues.filter((i) => i.severity === filter);
  }, [activeIssues, filter]);

  // Distinct rows with errors or warnings
  const problematicRows = React.useMemo(() => {
    const rows = new Set<number>();
    activeIssues.forEach((i) => {
      if (i.row && (i.severity === 'error' || i.severity === 'warning')) {
        rows.add(i.row);
      }
    });
    return Array.from(rows).sort((a, b) => a - b);
  }, [activeIssues]);

  const handleAcknowledge = (issueId: string) => {
    setAcknowledgedIssues((prev) => {
      const next = new Set(prev);
      next.add(issueId);
      return next;
    });
  };

  return (
    <div className={cn('flex flex-col space-y-4', className)}>
      {/* 1. Header Card: "Kami menemukan X responden dan Y kolom" */}
      <div className="p-4 sm:p-5 rounded-[16px] border border-border bg-card shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-semibold text-base text-foreground">
              Kami menemukan {rowCount} responden dan {columnCount} kolom
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {activeIssues.length === 0
                ? 'Seluruh data responden rapi dan siap dianalisis.'
                : `Ditemukan ${activeIssues.length} temuan kualitas data. Anda dapat mengecualikan baris, memperbaikinya di berkas, atau melanjutkan apa adanya.`}
            </p>
          </div>

          {problematicRows.length > 0 && onRemoveAllProblematicRows && (
            <Button
              type="button"
              size="sm"
              onClick={() => onRemoveAllProblematicRows(problematicRows)}
              className="text-xs font-semibold rounded-[10px] min-h-[36px] bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 cursor-pointer shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Kecualikan Semua ({problematicRows.length} Baris)
            </Button>
          )}
        </div>

        {/* Reassurance banner: No silent mutation */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border/50">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>
            Nilai tidak pernah diisi otomatis. Setiap tindakan membuat dataset turunan tanpa mengubah berkas asli.
          </span>
        </div>
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer',
            filter === 'all'
              ? 'bg-foreground text-background border-foreground font-semibold'
              : 'bg-card text-muted-foreground border-border hover:bg-muted'
          )}
        >
          Semua Temuan ({activeIssues.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('error')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5',
            filter === 'error'
              ? 'bg-destructive text-white border-destructive font-semibold'
              : 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20'
          )}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          Perlu Dicek ({errorCount})
        </button>

        <button
          type="button"
          onClick={() => setFilter('warning')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5',
            filter === 'warning'
              ? 'bg-amber-600 text-white border-amber-600 font-semibold'
              : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
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
              ? 'bg-muted-foreground text-white border-muted-foreground font-semibold'
              : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
          )}
        >
          <Info className="w-3.5 h-3.5" />
          Info ({infoCount})
        </button>
      </div>

      {/* 3. Findings Cards Container */}
      {filteredIssues.length === 0 ? (
        <div className="p-8 rounded-[16px] border border-dashed border-border bg-card text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h5 className="font-semibold text-sm text-foreground">
            {activeIssues.length === 0
              ? 'Semua data bersih dan valid!'
              : 'Tidak ada temuan dalam kategori ini'}
          </h5>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {activeIssues.length === 0
              ? 'Kualitas data kuesioner Anda memenuhi standar skripsi untuk dilanjutkan ke tahap berikutnya.'
              : 'Pilih filter lain untuk melihat catatan kualitas data.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[520px] overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin">
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
                  'p-4 rounded-[14px] border transition-all text-left bg-card group relative cursor-pointer shadow-2xs space-y-3',
                  isError
                    ? 'border-destructive/30 hover:border-destructive hover:bg-destructive/5'
                    : isWarning
                    ? 'border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/5'
                    : 'border-border hover:border-border/80 hover:bg-muted/40'
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
                    <div className="mt-0.5 shrink-0">
                      {isError ? (
                        <AlertOctagon className="w-4 h-4 text-destructive" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <Info className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={isError ? 'destructive' : isWarning ? 'amber' : 'secondary'}
                          className="text-[10px] font-semibold py-0.5 px-2 rounded-[6px]"
                        >
                          {isError ? 'Perlu Dicek' : isWarning ? 'Peringatan' : 'Informasi'}
                        </Badge>

                        {issue.row && (
                          <span className="text-xs font-mono font-medium text-foreground bg-muted px-1.5 py-0.5 rounded-[4px]">
                            Baris #{issue.row}
                          </span>
                        )}

                        {issue.column && (
                          <span className="text-xs font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-[4px]">
                            Kolom: {issue.column}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-medium text-foreground leading-snug">
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

                  {issue.row && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectIssue?.(issue.row!, issue.column, issue.severity);
                      }}
                      className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors shrink-0"
                      title="Sorot baris ini di tabel pratinjau"
                      aria-label="Sorot di tabel"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 3 User-Controlled Action Choices per prompt specification */}
                {issue.row && (
                  <div
                    className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Pilihan 1: Kecualikan baris */}
                    {onRemoveRow && (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => onRemoveRow(issue.row!)}
                        className="text-[11px] h-7 px-2.5 rounded-[8px] cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Kecualikan baris ini
                      </Button>
                    )}

                    {/* Pilihan 2: Perbaiki di berkas lalu unggah ulang */}
                    {onReupload && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={onReupload}
                        className="text-[11px] h-7 px-2.5 rounded-[8px] cursor-pointer"
                      >
                        <UploadCloud className="w-3 h-3 mr-1" />
                        Perbaiki di berkas & unggah ulang
                      </Button>
                    )}

                    {/* Pilihan 3: Lanjutkan apa adanya */}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAcknowledge(issue.id)}
                      className="text-[11px] h-7 px-2 rounded-[8px] text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Lanjutkan apa adanya (peringatan tetap dicatat pada jejak audit)"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Lanjutkan apa adanya
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
