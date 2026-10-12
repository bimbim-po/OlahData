'use client';

import * as React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  Table as TableIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/format';
import { COPY } from '@/lib/constants';
import type { DatasetRow, DataIssue } from '@/lib/api/types';

export interface TargetCell {
  row: number;
  col?: string;
  severity?: 'error' | 'warning' | 'info';
}

interface DataPreviewTableProps {
  data: DatasetRow[];
  columns: string[];
  issues?: DataIssue[];
  targetCell?: TargetCell | null;
  onRemoveRow?: (rowNumber: number) => void;
  className?: string;
}

export function DataPreviewTable({
  data,
  columns,
  issues = [],
  targetCell,
  onRemoveRow,
  className,
}: DataPreviewTableProps) {
  const [pageSize, setPageSize] = React.useState(15);
  const [flashingCell, setFlashingCell] = React.useState<TargetCell | null>(null);

  // Issues lookup for quick highlighting
  const issuesByCell = React.useMemo(() => {
    const map = new Map<string, DataIssue>();
    issues.forEach((iss) => {
      if (iss.row && iss.column) {
        map.set(`${iss.row}-${iss.column}`, iss);
      }
    });
    return map;
  }, [issues]);

  const issuesByRow = React.useMemo(() => {
    const map = new Map<number, DataIssue[]>();
    issues.forEach((iss) => {
      if (iss.row) {
        const list = map.get(iss.row) || [];
        list.push(iss);
        map.set(iss.row, list);
      }
    });
    return map;
  }, [issues]);

  // Construct table columns
  const tableColumns = React.useMemo<ColumnDef<DatasetRow>[]>(() => {
    // Row identifier & actions column
    const cols: ColumnDef<DatasetRow>[] = [
      {
        id: '_row_actions',
        header: () => (
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Baris
          </span>
        ),
        cell: ({ row }) => {
          const rowData = row.original;
          const rowNo =
            typeof rowData.No === 'number'
              ? rowData.No
              : row.index + 1;
          const rowIssues = issuesByRow.get(rowNo);
          const hasError = rowIssues?.some((i) => i.severity === 'error');
          const hasWarning = rowIssues?.some((i) => i.severity === 'warning');

          return (
            <div className="flex items-center justify-between gap-1.5 min-w-[70px]">
              <span
                className={cn(
                  'text-xs font-mono font-medium px-1.5 py-0.5 rounded',
                  hasError
                    ? 'bg-destructive/15 text-destructive font-bold'
                    : hasWarning
                    ? 'bg-[var(--color-amber)]/15 text-[var(--color-amber)] font-bold'
                    : 'text-muted-foreground'
                )}
              >
                #{rowNo}
              </span>

              {onRemoveRow && (
                <button
                  type="button"
                  onClick={() => onRemoveRow(rowNo)}
                  title={`Hapus baris #${rowNo} dari analisis`}
                  aria-label={`Hapus baris #${rowNo}`}
                  className="opacity-40 group-hover/row:opacity-100 hover:opacity-100 hover:bg-destructive/15 hover:text-destructive p-1 rounded transition-opacity text-muted-foreground cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        },
        size: 80,
      },
    ];

    // Data columns (excluding raw 'No' to avoid duplicate column display)
    const displayDataCols = columns.filter((col) => col !== 'No');

    displayDataCols.forEach((colKey) => {
      cols.push({
        id: colKey,
        accessorKey: colKey,
        header: () => (
          <span className="text-xs font-semibold text-foreground truncate block max-w-[120px]" title={colKey}>
            {colKey}
          </span>
        ),
        cell: ({ row }) => {
          const rowData = row.original;
          const rowNo =
            typeof rowData.No === 'number'
              ? rowData.No
              : row.index + 1;
          const rawValue = rowData[colKey];
          const cellIssue = issuesByCell.get(`${rowNo}-${colKey}`);

          const isTarget =
            flashingCell?.row === rowNo && flashingCell?.col === colKey;

          if (rawValue === null || rawValue === undefined || rawValue === '') {
            return (
              <div
                id={`cell-${rowNo}-${colKey}`}
                className={cn(
                  'px-2 py-1 rounded transition-all',
                  isTarget
                    ? 'ring-2 ring-destructive bg-destructive/20 font-bold'
                    : cellIssue
                    ? 'bg-destructive/10'
                    : ''
                )}
              >
                <span className="text-destructive font-mono italic text-xs">
                  &lt;Kosong&gt;
                </span>
              </div>
            );
          }

          const num = Number(rawValue);
          const isInvalidScale =
            !isNaN(num) &&
            cellIssue?.severity === 'error' &&
            (num < 1 || num > 5);

          return (
            <div
              id={`cell-${rowNo}-${colKey}`}
              className={cn(
                'px-2 py-1 rounded text-xs tabular-nums transition-all',
                isTarget
                  ? isTarget && flashingCell?.severity === 'warning'
                    ? 'ring-2 ring-[var(--color-amber)] bg-[var(--color-amber)]/20 font-bold'
                    : 'ring-2 ring-destructive bg-destructive/20 font-bold'
                  : isInvalidScale
                  ? 'bg-destructive/15 text-destructive font-semibold'
                  : ''
              )}
            >
              {typeof rawValue === 'number' ? formatNumber(rawValue) : String(rawValue)}
            </div>
          );
        },
      });
    });

    return cols;
  }, [columns, issuesByCell, issuesByRow, flashingCell, onRemoveRow]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  });

  // Highlight scroll effect
  React.useEffect(() => {
    if (!targetCell) return;

    setFlashingCell(targetCell);

    // Find row index
    const rowIndex = data.findIndex(
      (r, idx) =>
        (typeof r.No === 'number' ? r.No === targetCell.row : idx + 1 === targetCell.row)
    );

    if (rowIndex >= 0) {
      const pageIndex = Math.floor(rowIndex / pageSize);
      table.setPageIndex(pageIndex);

      // Scroll after DOM updates
      const timer = setTimeout(() => {
        const cellElem = targetCell.col
          ? document.getElementById(`cell-${targetCell.row}-${targetCell.col}`)
          : document.getElementById(`row-${targetCell.row}`);

        if (cellElem) {
          cellElem.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
        }
      }, 100);

      const clearTimer = setTimeout(() => {
        setFlashingCell(null);
      }, 3500);

      return () => {
        clearTimeout(timer);
        clearTimeout(clearTimer);
      };
    }
  }, [targetCell, data, pageSize, table]);

  return (
    <div className={cn('rounded-xl border border-border bg-card shadow-sm flex flex-col', className)}>
      {/* Table Header Controls */}
      <div className="p-4 border-b border-border/80 flex flex-wrap items-center justify-between gap-3 bg-muted/20">
        <div className="flex items-center gap-2">
          <TableIcon className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-sm text-foreground">
            Pratinjau Data Kuesioner
          </h4>
          <span className="text-xs text-muted-foreground tabular-nums">
            ({formatNumber(data.length)} baris × {formatNumber(columns.length)} kolom)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="engine" className="text-[11px]">
            {COPY.badges.computedByEngine}
          </Badge>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Tampilkan</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                setPageSize(newSize);
                table.setPageSize(newSize);
              }}
              className="bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>baris</span>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto relative scrollbar-thin">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-muted/60 sticky top-0 z-10 border-b border-border shadow-xs backdrop-blur-xs">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="p-2.5 font-medium text-muted-foreground whitespace-nowrap first:sticky first:left-0 first:bg-muted/95 first:z-20 border-r border-border/30 last:border-r-0"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-border/60">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => {
                const rowData = row.original;
                const rowNo =
                  typeof rowData.No === 'number'
                    ? rowData.No
                    : row.index + 1;
                const isRowFlashing =
                  flashingCell?.row === rowNo && !flashingCell?.col;
                const rowIssues = issuesByRow.get(rowNo);
                const hasCritical = rowIssues?.some((i) => i.severity === 'error');

                return (
                  <tr
                    key={row.id}
                    id={`row-${rowNo}`}
                    className={cn(
                      'group/row hover:bg-muted/40 transition-colors',
                      isRowFlashing
                        ? 'bg-[var(--color-amber)]/20 ring-2 ring-[var(--color-amber)] ring-inset'
                        : hasCritical
                        ? 'bg-destructive/5'
                        : ''
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="p-2 whitespace-nowrap first:sticky first:left-0 first:bg-card group-hover/row:first:bg-muted/40 first:z-10 border-r border-border/30 last:border-r-0"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={tableColumns.length}
                  className="p-8 text-center text-muted-foreground"
                >
                  Tidak ada data untuk ditampilkan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/10 text-xs">
        <div className="text-muted-foreground">
          Menampilkan baris{' '}
          <span className="font-semibold text-foreground tabular-nums">
            {data.length === 0 ? 0 : table.getState().pagination.pageIndex * pageSize + 1}
          </span>{' '}
          sampai{' '}
          <span className="font-semibold text-foreground tabular-nums">
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * pageSize,
              data.length
            )}
          </span>{' '}
          dari <span className="font-semibold text-foreground tabular-nums">{formatNumber(data.length)}</span> total
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0 cursor-pointer"
            aria-label="Halaman pertama"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0 cursor-pointer"
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="px-2 tabular-nums text-foreground">
            Halaman {table.getState().pagination.pageIndex + 1} dari{' '}
            {Math.max(1, table.getPageCount())}
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 p-0 cursor-pointer"
            aria-label="Halaman berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 p-0 cursor-pointer"
            aria-label="Halaman terakhir"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
