'use client';

import * as React from 'react';
import { useState } from 'react';
import { Copy, Check, Maximize2, Minimize2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toaster';
import { COPY } from '@/lib/copy';

export interface ColumnDef<T> {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  render?: (row: T, index: number) => React.ReactNode;
  getValue?: (row: T) => string | number;
}

export interface ResultTableProps<T> {
  tableNumber?: string;
  title: string;
  note?: string;
  columns: ColumnDef<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string;
  highlightedCell?: { rowKey?: string; colKey?: string } | null;
  highlightedValue?: string | number | null;
  onHoverCell?: (rowKey: string | null, colKey: string | null, value: string | number | null) => void;
  className?: string;
  badgeLabel?: string;
}

export function ResultTable<T>({
  tableNumber,
  title,
  note,
  columns,
  data,
  rowKey,
  highlightedCell,
  highlightedValue,
  onHoverCell,
  className,
  badgeLabel = COPY.badges.computedByEngine,
}: ResultTableProps<T>) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Generate tab-separated plain text for pasting cleanly into Microsoft Word
  const handleCopyTable = async () => {
    try {
      const headerLine = columns.map((c) => c.header).join('\t');
      const dataLines = data.map((row) => {
        return columns
          .map((c) => {
            if (c.getValue) {
              return String(c.getValue(row));
            }
            const val = (row as Record<string, unknown>)[c.key];
            if (typeof val === 'number') {
              return new Intl.NumberFormat('id-ID', {
                maximumFractionDigits: 4,
              }).format(val);
            }
            if (typeof val === 'boolean') {
              return val ? 'Valid' : 'Gugur';
            }
            return val !== undefined && val !== null ? String(val) : '';
          })
          .join('\t');
      });

      const fullText = [
        tableNumber ? `${tableNumber} ${title}` : title,
        headerLine,
        ...dataLines,
        note ? `Catatan: ${note}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);

      toast({
        title: COPY.layers.copied,
        description: 'Tabel berformat Word berhasil disalin. Buka Microsoft Word dan tekan Paste (Ctrl+V).',
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Gagal menyalin tabel',
        description: 'Periksa izin papan klip pada perambanmu.',
        variant: 'error',
      });
    }
  };

  const isCellHighlighted = (rKey: string, colKey: string, valStr: string) => {
    if (highlightedCell) {
      if (
        (highlightedCell.rowKey === undefined || highlightedCell.rowKey === rKey) &&
        (highlightedCell.colKey === undefined || highlightedCell.colKey === colKey)
      ) {
        return true;
      }
    }
    if (highlightedValue !== undefined && highlightedValue !== null) {
      const target = String(highlightedValue).trim();
      const cleanVal = valStr.trim();
      if (
        cleanVal === target ||
        (cleanVal.length > 0 &&
          target.length > 0 &&
          (cleanVal.includes(target) || target.includes(cleanVal)))
      ) {
        return true;
      }
    }
    return false;
  };

  return (
    <div
      className={cn(
        'rounded-[16px] border border-border bg-card p-4 sm:p-6 shadow-xs space-y-3.5 transition-colors font-sans relative',
        isFullscreen && 'fixed inset-0 z-50 rounded-none border-none p-6 overflow-y-auto bg-card',
        className
      )}
    >
      {/* Table Top Header Bar (Di luar area gulir horizontal) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          {tableNumber && (
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block mb-0.5">
              {tableNumber}
            </span>
          )}
          <h3 className="text-sm sm:text-base font-semibold text-foreground tracking-tight leading-snug">
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Badge
            variant="outline"
            className="text-[11px] font-normal text-muted-foreground border-border bg-muted/40 px-2.5 py-1 rounded-[6px]"
          >
            {badgeLabel}
          </Badge>

          {/* Tombol Lihat Layar Penuh pada Ponsel */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="min-h-[44px] px-2.5 gap-1.5 text-xs text-muted-foreground hover:text-foreground touch-manipulation cursor-pointer"
            title={isFullscreen ? 'Keluar dari layar penuh' : 'Lihat tabel layar penuh'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-4 w-4" />
                <span className="hidden sm:inline">Kecilkan</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4" />
                <span className="hidden sm:inline">Layar Penuh</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyTable}
            className="min-h-[44px] px-3.5 gap-1.5 text-xs text-foreground hover:bg-muted font-medium transition-colors rounded-[10px] touch-manipulation cursor-pointer"
            title="Salin tabel format tab-separated untuk Microsoft Word"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-primary" />
                <span className="text-primary font-medium">{COPY.results.copied}</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-muted-foreground" />
                <span>Salin untuk Word</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Petunjuk Gulir Ponsel */}
      <div className="sm:hidden flex items-center justify-between text-[11px] text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-[6px] border border-border/60">
        <span>Geser tabel ke samping untuk melihat kolom lengkap</span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* Journal Table Body (Wadah gulir horizontal dengan kolom pertama menempel) */}
      <div className="relative overflow-x-auto rounded-[6px] border border-border/80 shadow-inner">
        <table className="table-journal w-full text-left text-sm font-sans border-collapse">
          <thead>
            <tr className="border-t-2 border-b border-foreground bg-muted/20">
              {columns.map((col, cIdx) => (
                <th
                  key={col.key}
                  className={cn(
                    'py-2.5 px-3 font-semibold text-foreground text-xs tracking-normal whitespace-nowrap',
                    cIdx === 0 && 'sticky left-0 bg-card z-10 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.1)]',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const rKey = rowKey(row, index);
              return (
                <tr
                  key={rKey}
                  className={cn(
                    'border-b border-border transition-colors hover:bg-muted/30',
                    index === data.length - 1 && 'border-b-2 border-foreground'
                  )}
                >
                  {columns.map((col, cIdx) => {
                    const rawVal = col.getValue
                      ? col.getValue(row)
                      : (row as Record<string, unknown>)[col.key];
                    const valStr =
                      typeof rawVal === 'number'
                        ? new Intl.NumberFormat('id-ID', {
                            maximumFractionDigits: 4,
                          }).format(rawVal)
                        : String(rawVal ?? '');

                    const highlighted = isCellHighlighted(rKey, col.key, valStr);
                    const sanitizedNum = valStr.replace(/[^a-zA-Z0-9]/g, '-');

                    return (
                      <td
                        key={col.key}
                        tabIndex={0}
                        data-cell-num={sanitizedNum}
                        onMouseEnter={() =>
                          onHoverCell?.(rKey, col.key, rawVal as string | number)
                        }
                        onMouseLeave={() => onHoverCell?.(null, null, null)}
                        onFocus={() =>
                          onHoverCell?.(rKey, col.key, rawVal as string | number)
                        }
                        onBlur={() => onHoverCell?.(null, null, null)}
                        onClick={() =>
                          onHoverCell?.(rKey, col.key, rawVal as string | number)
                        }
                        className={cn(
                          'py-2 px-3 text-xs transition-all outline-none whitespace-nowrap',
                          cIdx === 0 && 'sticky left-0 bg-card z-10 font-medium text-foreground shadow-[2px_0_6px_-2px_rgba(0,0,0,0.1)]',
                          col.align === 'right' && 'text-right tabular-nums',
                          col.align === 'center' && 'text-center',
                          highlighted &&
                            'bg-[#FFE14D] text-[#243044] font-bold ring-2 ring-[#FFE14D] rounded-[4px] scale-[1.01]'
                        )}
                      >
                        {col.render ? col.render(row, index) : valStr}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer Note */}
      {note && (
        <p className="text-xs text-muted-foreground pt-1 border-t border-border/50">
          Catatan: {note}
        </p>
      )}
    </div>
  );
}
