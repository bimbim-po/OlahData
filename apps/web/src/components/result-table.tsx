'use client';

import * as React from 'react';
import { useState } from 'react';
import { Copy, Check, Table as TableIcon } from 'lucide-react';
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
        title: 'Tabel berhasil disalin (format Word)',
        description: 'Buka Microsoft Word lalu tempelkan (Ctrl+V / Cmd+V). Format kolom akan otomatis rapi.',
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
      if (cleanVal === target || (cleanVal.length > 0 && target.length > 0 && (cleanVal.includes(target) || target.includes(cleanVal)))) {
        return true;
      }
    }
    return false;
  };

  return (
    <div
      className={cn(
        'rounded-md border border-border bg-card p-4 sm:p-5 shadow-xs space-y-3 transition-colors',
        className
      )}
    >
      {/* Table Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          {tableNumber && (
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block mb-0.5">
              {tableNumber}
            </span>
          )}
          <h3 className="text-sm sm:text-base font-semibold text-foreground tracking-tight leading-snug">
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className="text-[11px] font-normal text-muted-foreground border-border bg-muted/40 px-2 py-0.5"
          >
            {badgeLabel}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyTable}
            className="h-7 px-2.5 gap-1.5 text-xs text-foreground hover:bg-muted font-medium transition-colors"
            title="Salin tabel format tab-separated untuk Microsoft Word"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-primary" />
                <span className="text-primary font-medium">{COPY.results.copied}</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Salin untuk Word</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Journal Table Body (APA 7th Edition Style) */}
      <div className="overflow-x-auto -mx-1 sm:mx-0">
        <table className="table-journal w-full text-left text-sm font-sans">
          <thead>
            <tr className="border-t-2 border-b border-foreground">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'py-2 px-3 font-semibold text-foreground text-xs tracking-normal',
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
                          'py-1.5 px-3 text-xs transition-all outline-none',
                          col.align === 'right' && 'text-right tabular-nums',
                          col.align === 'center' && 'text-center',
                          highlighted &&
                            'bg-accent text-primary font-bold ring-1.5 ring-primary/60 rounded-xs scale-[1.01]'
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
