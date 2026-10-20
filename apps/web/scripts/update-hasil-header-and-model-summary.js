const fs = require('fs');
const path = require('path');

const hasilPath = path.join(__dirname, '..', 'src', 'app', 'app', 'proyek', '[id]', 'hasil', 'page.tsx');
let content = fs.readFileSync(hasilPath, 'utf8');

// Ensure DropdownMenu components are imported
if (!content.includes('DropdownMenuContent')) {
  content = content.replace(
    "import { Button } from '@/components/ui/button';",
    `import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';`
  );
}

// 1. Overhaul the Sticky Header
const oldHeaderRegex = /\{\/\* Sticky Header Meja Kerja Hasil \*\/\}[\s\S]*?\{\/\* Banner Mode Data Contoh & Reset Demo \*\/\}/;

const newHeader = `{/* Sticky Header Meja Kerja Hasil */}
      <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-md pb-4 pt-3 sm:pt-4 border-b border-border/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5 min-w-0 flex-1">
          {/* Breadcrumb Nav */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <Link href="/app" className="hover:text-foreground transition-colors">
              Proyek
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span
              className="text-foreground font-medium truncate max-w-[200px] sm:max-w-[320px]"
              title={project?.title || 'Skripsi Saya'}
            >
              {project?.title || 'Skripsi Saya'}
            </span>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-primary font-semibold">Hasil Bab 4</span>
          </div>

          {/* Heading & Metadata */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-serif">
              Hasil Analisis &amp; Pembahasan Bab 4
            </h1>
            <Badge variant="outline" className="text-xs bg-muted/50 font-mono py-0.5">
              N = {results.respondentCount} responden
            </Badge>
            {isSample && (
              <Badge variant="amber" className="text-xs font-semibold py-0.5">
                Data Contoh
              </Badge>
            )}
          </div>

          {/* Dataset & Timestamp Metadata Strip */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-0.5">
            <span className="inline-flex items-center gap-1 font-mono">
              <FileText className="w-3.5 h-3.5 text-primary" />
              {results.sourceMeta?.fileName || 'dataset_kuesioner.xlsx'}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              {formatDateTime(results.computedAt || new Date().toISOString())}
            </span>
            <span>•</span>
            <span className="font-mono text-[11px] text-muted-foreground/80">
              Verifikasi: {results.sourceMeta?.checksum ? results.sourceMeta.checksum.substring(0, 8) : 'sha256-verified'}
            </span>
          </div>
        </div>

        {/* Action Buttons: 1 Tombol Utama "Unduh Bab 4 (Word)" + Dropdown "Unduh Lainnya" */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <TambahAnalisisSelector
            enabledTableIds={enabledOptionalTables}
            onToggleTable={toggleOptionalTable}
          />

          {/* Tombol Utama: Unduh Bab 4 (Word) */}
          <Button
            size="sm"
            onClick={() => {
              setChapter4ExportFormat('docx');
              setChapter4ModalOpen(true);
            }}
            className="text-[13px] min-h-[44px] px-4 gap-2 font-semibold shadow-xs touch-manipulation cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
            title="Unduh draf naskah Bab 4 format Microsoft Word (.docx) dengan tabel APA 7th asli"
          >
            <FileDown className="h-4 w-4" />
            <span>Unduh Bab 4 (Word)</span>
          </Button>

          {/* Dropdown Menu: Unduh Lainnya & Salin Semua */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-[13px] min-h-[44px] px-3.5 gap-1.5 touch-manipulation cursor-pointer rounded-xl font-medium border-border hover:bg-muted"
                aria-label="Menu unduh lainnya"
              >
                <span>Unduh Lainnya</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 p-1.5 rounded-xl">
              <DropdownMenuItem
                onClick={() => {
                  setChapter4ExportFormat('pdf');
                  setChapter4ModalOpen(true);
                }}
                className="gap-2.5 cursor-pointer text-xs py-2.5 font-medium"
              >
                <FileText className="h-4 w-4 text-rose-500" />
                <div className="flex flex-col">
                  <span>Unduh Laporan Resmi (PDF)</span>
                  <span className="text-[10px] text-muted-foreground">Format siap cetak untuk sidang</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleCopyAllTables}
                className="gap-2.5 cursor-pointer text-xs py-2.5 font-medium"
              >
                <Copy className="h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <span>Salin Semua Tabel Sekaligus</span>
                  <span className="text-[10px] text-muted-foreground">Format tabel APA 7th untuk Word</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setShowReferenceTables(true)}
                className="gap-2.5 cursor-pointer text-xs py-2.5 font-medium text-amber-900 dark:text-amber-200"
              >
                <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <div className="flex flex-col">
                  <span>Tabel r, t, F (df Berstabilo)</span>
                  <span className="text-[10px] text-muted-foreground">Buka tabel referensi statistik</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => setExportOpen(true)}
                className="gap-2.5 cursor-pointer text-xs py-2 text-muted-foreground"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Opsi Ekspor Lanjutan &amp; Lampiran</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-[13px] min-h-[44px] px-2.5 gap-1.5 text-muted-foreground hover:text-foreground touch-manipulation cursor-pointer rounded-xl"
            title="Buka panduan interpretasi hasil Bab 4"
          >
            <Link
              href="/app/bantuan"
              target="_blank"
            >
              <HelpCircle className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">Bantuan</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Banner Mode Data Contoh & Reset Demo */}`;

if (oldHeaderRegex.test(content)) {
  content = content.replace(oldHeaderRegex, newHeader);
  console.log('✓ Overhauled header with primary Word button, metadata, and "Unduh Lainnya" dropdown!');
} else {
  console.log('✗ Header regex did not match, check source text');
}

// 2. Add regression model summary card right before Tabel 4.10b
const oldTabel410b = '{/* 5b. Koefisien Determinasi R² (Tabel 4.10b) */}';
const newModelSummaryAndTabel410b = `{/* Ringkasan Model Regresi Akademik (N, R, R2, adj R2, F, p, SE) */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="border-b border-border pb-1.5">
                      <span className="text-xs font-bold text-primary font-mono uppercase tracking-wider block">
                        Ringkasan Model Regresi (Model Summary)
                      </span>
                      <h4 className="font-semibold text-sm text-foreground">
                        Statistik Kelayakan &amp; Kebaikan Model (Goodness of Fit)
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 p-3.5 rounded-xl border border-border bg-card text-center shadow-xs">
                      <div className="space-y-0.5 p-1.5 rounded-lg bg-muted/40">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">N Responden</span>
                        <p className="text-sm sm:text-base font-bold font-mono text-foreground tabular-nums">{results.respondentCount}</p>
                      </div>
                      <div className="space-y-0.5 p-1.5 rounded-lg bg-muted/40">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Korelasi (R)</span>
                        <p className="text-sm sm:text-base font-bold font-mono text-foreground tabular-nums">
                          {results.determination ? formatNumber(Math.sqrt(Math.max(0, results.determination.rSquare)), 3) : '-'}
                        </p>
                      </div>
                      <div className="space-y-0.5 p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">R² (R-Square)</span>
                        <p className="text-sm sm:text-base font-bold font-mono text-primary tabular-nums">
                          {results.determination ? formatNumber(results.determination.rSquare, 3) : '-'}
                        </p>
                      </div>
                      <div className="space-y-0.5 p-1.5 rounded-lg bg-muted/40">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Adjusted R²</span>
                        <p className="text-sm sm:text-base font-bold font-mono text-foreground tabular-nums">
                          {results.determination ? formatNumber(results.determination.adjustedRSquare, 3) : '-'}
                        </p>
                      </div>
                      <div className="space-y-0.5 p-1.5 rounded-lg bg-muted/40">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">F Hitung</span>
                        <p className="text-sm sm:text-base font-bold font-mono text-foreground tabular-nums">
                          {results.fTest ? formatNumber(results.fTest.fHitung, 3) : '-'}
                        </p>
                      </div>
                      <div className="space-y-0.5 p-1.5 rounded-lg bg-muted/40">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Sig. F (p)</span>
                        <p className="text-sm sm:text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {results.fTest ? (results.fTest.pValue < 0.001 ? '< 0,001' : formatNumber(results.fTest.pValue, 4)) : '-'}
                        </p>
                      </div>
                      <div className="space-y-0.5 p-1.5 rounded-lg bg-muted/40">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Std. Error</span>
                        <p className="text-sm sm:text-base font-bold font-mono text-foreground tabular-nums">
                          {results.determination ? formatNumber(results.determination.stdError, 3) : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 5b. Koefisien Determinasi R² (Tabel 4.10b) */}`;

if (content.includes(oldTabel410b) && !content.includes('Kebaikan Model (Goodness of Fit)')) {
  content = content.replace(oldTabel410b, newModelSummaryAndTabel410b);
  console.log('✓ Added Regression Model Summary strip (N, R, R2, adj R2, F, p, SE)!');
}

fs.writeFileSync(hasilPath, content, 'utf8');
console.log('✓ Successfully wrote updates to hasil/page.tsx');
