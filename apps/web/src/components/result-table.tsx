'use client';

import * as React from 'react';
import { useState } from 'react';
import { Copy, Check, Calculator } from 'lucide-react';
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

  // Generate tab-separated plain text for pasting into Microsoft Word
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
        title: 'Tabel berhasil disalin ke papan klip (siap tempel ke Word)',
        description: 'Buka Microsoft Word lalu tempelkan (Ctrl+V / Cmd+V).',
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Gagal menyalin tabel',
        description: 'Periksa izin papan klip pada peramban Anda.',
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
      if (valStr.trim() === target) {
        return true;
      }
    }
    return false;
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs transition-shadow hover:shadow-sm space-y-4',
        className
      )}
    >
      {/* Table Top Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          {tableNumber && (
            <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-1">
              {tableNumber}
            </span>
          )}
          <h3 className="font-serif text-base sm:text-lg font-bold text-foreground tracking-tight leading-snug">
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="engine"
            className="gap-1.5 py-1 px-2.5 font-medium text-xs border"
          >
            <Calculator className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>{badgeLabel}</span>
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyTable}
            className="h-8 gap-1.5 text-xs text-foreground hover:bg-muted font-medium transition-all"
            title="Salin tabel format Microsoft Word (tab-separated)"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-primary" />
                <span className="text-primary font-medium">{COPY.results.copied}</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{COPY.results.copyTable}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Journal Table Body (APA Bab 4 Style) */}
      <div className="overflow-x-auto -mx-1 sm:mx-0">
        <table className="table-journal w-full text-left text-sm font-sans">
          <thead>
            <tr className="border-t-2 border-b border-foreground">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'py-2.5 px-3 font-semibold text-foreground text-xs sm:text-sm tracking-wide',
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
                    'border-b border-border transition-colors hover:bg-muted/40',
                    index === data.length - 1 && 'border-b-2 border-foreground'
                  )}
                >
                  {columns.map((col) => {
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

                    return (
                      <td
                        key={col.key}
                        onMouseEnter={() =>
                          onHoverCell?.(rKey, col.key, rawVal as string | number)
                        }
                        onMouseLeave={() => onHoverCell?.(null, null, null)}
                        className={cn(
                          'py-2 px-3 text-xs sm:text-sm transition-all',
                          col.align === 'right' && 'text-right tabular-nums',
                          col.align === 'center' && 'text-center',
                          highlighted &&
                            'bg-primary/15 text-primary font-bold ring-2 ring-primary/40 rounded-sm scale-[1.02] shadow-xs'
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
        <p className="text-xs text-muted-foreground italic pt-1 border-t border-border/50">
          {note}
        </p>
      )}
    </div>
  );
}
