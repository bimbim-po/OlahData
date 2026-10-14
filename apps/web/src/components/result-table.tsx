'use client';

import * as React from 'react';
import { useState, useRef } from 'react';
import {
  Copy,
  Check,
  Maximize2,
  Minimize2,
  ChevronRight,
  Download,
  Edit2,
  CheckCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toaster';
import { COPY } from '@/lib/copy';
import { copyWordTable, type WordTableData } from '@/lib/word-table';

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
  tableNumber: initialTableNumber = 'Tabel 4.1',
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
  const [tableNumber, setTableNumber] = useState(initialTableNumber);
  const [isEditingNumber, setIsEditingNumber] = useState(false);
  const [editNumberVal, setEditNumberVal] = useState(tableNumber);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Generate formatted APA 7th HTML table for Microsoft Word + plain text fallback
  const handleCopyTable = async () => {
    try {
      const rows = data.map((row) => {
        return columns.map((c) => {
          if (c.getValue) {
            return c.getValue(row);
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
        });
      });

      const tableData: WordTableData = {
        tableNumber,
        title,
        note,
        columns: columns.map((c) => ({
          header: c.header,
          align: c.align,
        })),
        rows,
      };

      const success = await copyWordTable(tableData);
      if (!success) {
        throw new Error('Clipboard copy failed');
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      toast({
        title: COPY.layers.copied,
        description:
          'Tabel berformat APA Word berhasil disalin. Tempelkan (Ctrl+V) langsung ke lembar Microsoft Word.',
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

  // Unduh gambar tabel sebagai berkas PNG langsung di peramban
  const handleDownloadImage = () => {
    setIsDownloadingImage(true);
    try {
      // Buat SVG snapshot dari data tabel berstandar akademik tiga garis
      const colHeaders = columns.map((c) => c.header);
      const colWidth = 140;
      const width = Math.max(700, colHeaders.length * colWidth + 60);
      const rowHeight = 32;
      const headerHeight = 90;
      const height = headerHeight + (data.length + 1) * rowHeight + (note ? 50 : 30);

      let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color: #ffffff; font-family: 'Times New Roman', Times, serif;">`;
      svgContent += `<style>
        .tbl-num { font-size: 13px; font-weight: bold; fill: #111827; }
        .tbl-title { font-size: 14px; font-style: italic; fill: #111827; }
        .th-text { font-size: 12px; font-weight: bold; fill: #111827; }
        .td-text { font-size: 12px; fill: #1f2937; }
        .td-num { font-size: 12px; fill: #1f2937; font-feature-settings: 'tnum'; }
        .tbl-note { font-size: 11px; fill: #4b5563; font-style: italic; }
      </style>`;

      // Header judul
      svgContent += `<text x="25" y="30" class="tbl-num">${tableNumber}</text>`;
      svgContent += `<text x="25" y="52" class="tbl-title">${title}</text>`;

      // Garis atas tabel (tebal 1.5px)
      const tableTopY = 70;
      svgContent += `<line x1="25" y1="${tableTopY}" x2="${width - 25}" y2="${tableTopY}" stroke="#111827" stroke-width="1.5" />`;

      // Header kolom
      colHeaders.forEach((h, idx) => {
        const xPos = 35 + idx * colWidth;
        const align = columns[idx]?.align;
        const textX = align === 'right' ? xPos + colWidth - 20 : align === 'center' ? xPos + colWidth / 2 : xPos;
        const textAnchor = align === 'right' ? 'end' : align === 'center' ? 'middle' : 'start';
        svgContent += `<text x="${textX}" y="${tableTopY + 22}" class="th-text" text-anchor="${textAnchor}">${h}</text>`;
      });

      // Garis bawah header (tebal 1px)
      const headerBottomY = tableTopY + 32;
      svgContent += `<line x1="25" y1="${headerBottomY}" x2="${width - 25}" y2="${headerBottomY}" stroke="#111827" stroke-width="1" />`;

      // Baris data
      data.forEach((row, rIdx) => {
        const yPos = headerBottomY + 22 + rIdx * rowHeight;
        columns.forEach((col, cIdx) => {
          const xPos = 35 + cIdx * colWidth;
          const align = col.align;
          const textX = align === 'right' ? xPos + colWidth - 20 : align === 'center' ? xPos + colWidth / 2 : xPos;
          const textAnchor = align === 'right' ? 'end' : align === 'center' ? 'middle' : 'start';

          const rawVal = col.getValue
            ? col.getValue(row)
            : (row as Record<string, unknown>)[col.key];
          const valStr =
            typeof rawVal === 'number'
              ? new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 }).format(rawVal)
              : String(rawVal ?? '');

          svgContent += `<text x="${textX}" y="${yPos}" class="${align === 'right' ? 'td-num' : 'td-text'}" text-anchor="${textAnchor}">${valStr}</text>`;
        });
      });

      // Garis bawah tabel (tebal 1.5px)
      const tableBottomY = headerBottomY + data.length * rowHeight + 8;
      svgContent += `<line x1="25" y1="${tableBottomY}" x2="${width - 25}" y2="${tableBottomY}" stroke="#111827" stroke-width="1.5" />`;

      // Catatan kaki tabel
      if (note) {
        svgContent += `<text x="25" y="${tableBottomY + 20}" class="tbl-note">Catatan: ${note}</text>`;
      }

      svgContent += '</svg>';

      // Konversi SVG ke PNG via canvas
      const img = new Image();
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width * 2; // retina 2x
        canvas.height = height * 2;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(2, 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0);
          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `${tableNumber.replace(/\s+/g, '_')}_OlahData.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          URL.revokeObjectURL(url);
          toast({
            title: 'Gambar Tabel Diunduh',
            description: `${tableNumber} berhasil disimpan sebagai gambar PNG berkualitas tinggi.`,
            variant: 'success',
          });
        }
        setIsDownloadingImage(false);
      };
      img.onerror = () => {
        setIsDownloadingImage(false);
        toast({
          title: 'Gagal mengunduh gambar',
          description: 'Terjadi kesalahan saat memproses gambar tabel.',
          variant: 'error',
        });
      };
      img.src = url;
    } catch {
      setIsDownloadingImage(false);
    }
  };

  const handleSaveNumber = () => {
    if (editNumberVal.trim()) {
      setTableNumber(editNumberVal.trim());
    }
    setIsEditingNumber(false);
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
      ref={tableContainerRef}
      className={cn(
        'rounded-[16px] border border-border bg-card p-4 sm:p-6 shadow-xs space-y-4 transition-colors font-sans overflow-clip relative',
        isFullscreen &&
          'fixed inset-0 z-50 rounded-none border-none p-6 overflow-y-auto bg-card',
        className
      )}
    >
      {/* Table Top Header Bar (Di luar area gulir horizontal) */}
      <div className="flex flex-col gap-3 w-full min-w-0">
        {/* Baris Atas: Label Nomor Tabel & Judul Tabel */}
        <div className="flex flex-col gap-1 w-full min-w-0">
          <div className="flex items-center gap-2">
            {isEditingNumber ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={editNumberVal}
                  onChange={(e) => setEditNumberVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveNumber();
                    if (e.key === 'Escape') setIsEditingNumber(false);
                  }}
                  className="text-[13px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-primary bg-background text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveNumber}
                  className="p-1 text-primary hover:bg-primary/10 rounded cursor-pointer"
                  title="Simpan nomor tabel"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditNumberVal(tableNumber);
                  setIsEditingNumber(true);
                }}
                className="group inline-flex items-center gap-1 text-[13px] font-bold text-primary uppercase tracking-wider hover:underline cursor-pointer"
                title="Klik untuk mengubah nomor tabel (mis. Tabel 4.1)"
              >
                <span>{tableNumber}</span>
                <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-foreground tracking-tight leading-snug [text-wrap:balance] min-w-[280px]">
            {title}
          </h3>
        </div>

        {/* Baris Bawah: Lencana Mesin Deterministik (Normal Flow) + Kelompok Tombol Aksi */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 w-full min-w-0 pt-1 border-t border-border/40">
          <Badge
            variant="outline"
            className="text-[13px] font-normal text-muted-foreground border-border bg-muted/40 px-3 py-1 rounded-[6px] min-h-[28px] max-w-full truncate"
            title={badgeLabel}
          >
            {badgeLabel}
          </Badge>

          {/* Kelompok Tombol Aksi */}
          <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
            {/* Tombol Unduh Gambar Tabel */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadImage}
              disabled={isDownloadingImage}
              className="min-h-[40px] px-3 gap-1.5 text-[13px] text-foreground hover:bg-muted font-medium rounded-[10px] touch-manipulation cursor-pointer"
              title="Unduh tabel sebagai gambar PNG untuk dimasukkan ke PowerPoint seminar atau naskah"
              aria-label="Unduh gambar PNG tabel"
            >
              <Download className="h-4 w-4 text-muted-foreground" />
              <span className="hidden sm:inline">Unduh Gambar</span>
            </Button>

            {/* Tombol Lihat Layar Penuh */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="min-h-[40px] px-2.5 gap-1.5 text-[13px] text-muted-foreground hover:text-foreground touch-manipulation cursor-pointer"
              title={isFullscreen ? 'Keluar dari layar penuh' : 'Lihat tabel layar penuh'}
              aria-label={isFullscreen ? 'Keluar dari layar penuh' : 'Lihat tabel layar penuh'}
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

            {/* Tombol Salin untuk Word */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyTable}
              className="min-h-[40px] px-3.5 gap-1.5 text-[13px] text-foreground hover:bg-muted font-medium transition-colors rounded-[10px] touch-manipulation cursor-pointer"
              title="Salin tabel format Microsoft Word (APA 7th)"
              aria-label="Salin tabel untuk Microsoft Word"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-primary font-medium">{COPY.results.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-muted-foreground" />
                  <span className="hidden sm:inline">Salin untuk Word</span>
                  <span className="sm:hidden">Salin</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Petunjuk Gulir Ponsel dengan Penanda Bayangan */}
      <div className="sm:hidden flex items-center justify-between text-[13px] text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-[6px] border border-border/60">
        <span>Geser tabel ke samping untuk melihat kolom lengkap</span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* Journal Table Body (Gaya Tiga Garis Akademik APA 7th, Kolom Pertama Menempel) */}
      <div className="relative overflow-x-auto rounded-[6px] border border-border/80 shadow-inner">
        <table className="table-journal w-full text-left text-sm font-sans border-collapse">
          <thead>
            {/* Garis atas tebal (2px) dan garis bawah header (1px) */}
            <tr className="border-t-2 border-b border-foreground bg-muted/20">
              {columns.map((col, cIdx) => (
                <th
                  key={col.key}
                  className={cn(
                    'py-2.5 px-3 font-semibold text-foreground text-[13px] tracking-normal whitespace-nowrap',
                    cIdx === 0 &&
                      'sticky left-0 bg-card z-10 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.1)]',
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
                    'border-b border-border/70 transition-colors hover:bg-muted/30',
                    // Garis bawah tabel tebal (2px) pada baris terakhir
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
                          'py-2.5 px-3 text-[13px] transition-all outline-none whitespace-nowrap focus-visible:ring-2 focus-visible:ring-primary',
                          cIdx === 0 &&
                            'sticky left-0 bg-card z-10 font-medium text-foreground shadow-[2px_0_6px_-2px_rgba(0,0,0,0.1)]',
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

      {/* Table Footer Note: Kontras WCAG AA, Minimal 13px */}
      {note && (
        <p className="text-[13px] text-muted-foreground pt-1 border-t border-border/50 leading-relaxed">
          Catatan: {note}
        </p>
      )}
    </div>
  );
}
