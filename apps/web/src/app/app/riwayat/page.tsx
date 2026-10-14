'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowRight,
  Download,
  Trash2,
  Play,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  PlusCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { PageActions } from '@/components/page-actions';
import { useToast } from '@/components/ui/toaster';
import { getProjects } from '@/lib/api';
import type { Project } from '@/lib/api/types';
import { formatDate } from '@/lib/format';

export interface AnalysisRunItem {
  id: string;
  projectId: string;
  projectName: string;
  fileName: string;
  datasetVersion: string;
  datasetKind: 'original' | 'derived';
  tests: string[];
  status: 'succeeded' | 'failed' | 'running';
  startedAt: string;
  durationMs: number;
  respondentCount: number;
}

const DEFAULT_RUNS: AnalysisRunItem[] = [
  {
    id: 'run-2026-001',
    projectId: 'sample',
    projectName: 'Pengaruh Kualitas Layanan & Kepuasan terhadap Loyalitas',
    fileName: 'data_kuesioner_pemasaran_100_responden.xlsx',
    datasetVersion: 'v2 (Pembersihan)',
    datasetKind: 'derived',
    tests: ['Deskriptif', 'Validitas', 'Reliabilitas', 'Asumsi Klasik', 'Regresi'],
    status: 'succeeded',
    startedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    durationMs: 1240,
    respondentCount: 117,
  },
  {
    id: 'run-2026-002',
    projectId: 'sample',
    projectName: 'Pengaruh Kualitas Layanan & Kepuasan terhadap Loyalitas',
    fileName: 'data_kuesioner_pemasaran_100_responden.xlsx',
    datasetVersion: 'v1 (Awal)',
    datasetKind: 'original',
    tests: ['Deskriptif', 'Validitas', 'Reliabilitas'],
    status: 'succeeded',
    startedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    durationMs: 980,
    respondentCount: 120,
  },
  {
    id: 'run-2026-003',
    projectId: 'project-1',
    projectName: 'Analisis Pengaruh Beban Kerja terhadap Kinerja Karyawan',
    fileName: 'kuesioner_sdm_perbankan.xlsx',
    datasetVersion: 'v1 (Awal)',
    datasetKind: 'original',
    tests: ['Deskriptif', 'Validitas'],
    status: 'succeeded',
    startedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    durationMs: 820,
    respondentCount: 85,
  },
  {
    id: 'run-2026-004',
    projectId: 'sample',
    projectName: 'Pengaruh Kualitas Layanan & Kepuasan terhadap Loyalitas',
    fileName: 'draft_kuesioner_rusak.csv',
    datasetVersion: 'v0 (Mentah)',
    datasetKind: 'original',
    tests: ['Validitas'],
    status: 'failed',
    startedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    durationMs: 410,
    respondentCount: 0,
  },
];

export default function AnalysisHistoryPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [runs, setRuns] = useState<AnalysisRunItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'succeeded' | 'failed' | 'running'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Run to delete
  const [runToDelete, setRunToDelete] = useState<AnalysisRunItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load runs from localStorage or default
  useEffect(() => {
    async function loadData() {
      try {
        const fetchedProjects = await getProjects().catch(() => []);
        setProjects(fetchedProjects);

        let savedRuns: AnalysisRunItem[] = [];
        try {
          const raw = localStorage.getItem('olahdata-analysis-runs');
          if (raw) {
            savedRuns = JSON.parse(raw);
          }
        } catch {
          // ignore
        }

        if (savedRuns.length === 0) {
          savedRuns = DEFAULT_RUNS;
          try {
            localStorage.setItem('olahdata-analysis-runs', JSON.stringify(DEFAULT_RUNS));
          } catch {
            // ignore
          }
        }

        setRuns(savedRuns);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const saveRuns = (newRuns: AnalysisRunItem[]) => {
    setRuns(newRuns);
    try {
      localStorage.setItem('olahdata-analysis-runs', JSON.stringify(newRuns));
    } catch {
      // ignore
    }
  };

  // Filtered runs
  const filteredRuns = useMemo(() => {
    return runs.filter((run) => {
      // Status filter
      if (statusFilter !== 'all' && run.status !== statusFilter) return false;

      // Project filter
      if (projectFilter !== 'all' && run.projectId !== projectFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = run.projectName.toLowerCase().includes(q);
        const matchFile = run.fileName.toLowerCase().includes(q);
        const matchId = run.id.toLowerCase().includes(q);
        const matchTest = run.tests.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchFile && !matchId && !matchTest) return false;
      }

      return true;
    });
  }, [runs, statusFilter, projectFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredRuns.length / itemsPerPage) || 1;
  const paginatedRuns = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRuns.slice(start, start + itemsPerPage);
  }, [filteredRuns, currentPage, itemsPerPage]);

  const handleDeleteRun = async () => {
    if (!runToDelete) return;
    try {
      setIsDeleting(true);
      const updated = runs.filter((r) => r.id !== runToDelete.id);
      saveRuns(updated);
      toast({
        title: 'Riwayat Analisis Dihapus',
        description: `Riwayat kalkulasi ${runToDelete.id} berhasil dihapus.`,
        variant: 'default',
      });
      setRunToDelete(null);
    } catch {
      toast({
        title: 'Gagal Menghapus',
        description: 'Terjadi kesalahan saat menghapus riwayat analisis.',
        variant: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRerun = (run: AnalysisRunItem) => {
    const newRunId = `run-${Date.now().toString(36)}`;
    const newRun: AnalysisRunItem = {
      ...run,
      id: newRunId,
      startedAt: new Date().toISOString(),
      status: 'succeeded',
      durationMs: Math.floor(Math.random() * 500) + 750,
    };

    saveRuns([newRun, ...runs]);

    toast({
      title: 'Analisis Dijalankan Ulang',
      description: `Run baru ${newRunId} berhasil dibuat dan diproses.`,
      variant: 'success',
    });

    router.push(`/app/proyek/${run.projectId}/hasil?run=${newRunId}`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[13px] font-semibold mb-2">
            <History className="h-4 w-4" />
            <span>Audit &amp; Catatan Komputasi</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Riwayat Analisis Statistik
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Daftar seluruh eksekusi kalkulasi deterministik yang pernah dijalankan pada proyek skripsi Anda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild className="gap-2 font-semibold">
            <Link href="/app/proyek/baru">
              <PlusCircle className="h-4 w-4" />
              <span>Analisis Baru</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari berdasarkan nama proyek, berkas, atau pengujian..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-10 text-xs sm:text-sm bg-background border-border"
              aria-label="Cari riwayat analisis"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="filter-status" className="sr-only">Filter Status</label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 rounded-md border border-border bg-background text-xs sm:text-sm text-foreground focus:ring-1 focus:ring-primary"
            >
              <option value="all">Semua Status</option>
              <option value="succeeded">Berhasil</option>
              <option value="running">Sedang Berjalan</option>
              <option value="failed">Gagal</option>
            </select>
          </div>

          {/* Project Filter */}
          <div>
            <label htmlFor="filter-project" className="sr-only">Filter Proyek</label>
            <select
              id="filter-project"
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 rounded-md border border-border bg-background text-xs sm:text-sm text-foreground focus:ring-1 focus:ring-primary"
            >
              <option value="all">Semua Proyek</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title.slice(0, 30)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
          <span>Menemukan <strong>{filteredRuns.length}</strong> sesi eksekusi analisis.</span>
          {(statusFilter !== 'all' || projectFilter !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setProjectFilter('all');
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="text-primary hover:underline font-medium cursor-pointer"
            >
              Reset semua filter
            </button>
          )}
        </div>
      </div>

      {/* Runs Table List */}
      {filteredRuns.length === 0 ? (
        <Card className="border-border shadow-xs">
          <CardContent className="p-12 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <History className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-foreground">
                Belum Ada Riwayat Analisis
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Setiap kali Anda menjalankan pemetaan dan perhitungan statistik Bab 4, catatan eksekusi dan versi dataset akan tersimpan rapi di sini.
              </p>
            </div>
            <Button asChild className="gap-2 font-semibold">
              <Link href="/app/proyek/baru">
                <PlusCircle className="h-4 w-4" />
                <span>Buat Proyek Pertama</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="py-3 px-4">Proyek &amp; Dataset</th>
                    <th className="py-3 px-4">Uji Statistik</th>
                    <th className="py-3 px-4">Status &amp; Durasi</th>
                    <th className="py-3 px-4">Waktu Eksekusi</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paginatedRuns.map((run) => (
                    <tr
                      key={run.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Proyek & Dataset */}
                      <td className="py-3 px-4 max-w-xs">
                        <Link
                          href={`/app/proyek/${run.projectId}/hasil?run=${run.id}`}
                          className="font-semibold text-foreground group-hover:text-primary transition-colors block truncate"
                          title={run.projectName}
                        >
                          {run.projectName}
                        </Link>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground truncate">
                          <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate" title={run.fileName}>{run.fileName}</span>
                          <span className="text-border">•</span>
                          <span className="font-mono text-primary">{run.datasetVersion}</span>
                          {run.respondentCount > 0 && (
                            <>
                              <span className="text-border">•</span>
                              <span>N = {run.respondentCount}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Uji Statistik */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {run.tests.map((t) => (
                            <Badge
                              key={t}
                              variant="secondary"
                              className="text-[11px] font-normal py-0 px-1.5"
                            >
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </td>

                      {/* Status & Durasi */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {run.status === 'succeeded' && (
                            <Badge
                              variant="outline"
                              className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-500/30 gap-1 text-xs"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Berhasil</span>
                            </Badge>
                          )}
                          {run.status === 'running' && (
                            <Badge
                              variant="outline"
                              className="text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 border-blue-500/30 gap-1 text-xs"
                            >
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              <span>Berjalan</span>
                            </Badge>
                          )}
                          {run.status === 'failed' && (
                            <Badge
                              variant="outline"
                              className="text-destructive bg-destructive/10 border-destructive/30 gap-1 text-xs"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              <span>Gagal</span>
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground font-mono">
                            {run.durationMs} ms
                          </span>
                        </div>
                      </td>

                      {/* Waktu Eksekusi */}
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>{formatDate(run.startedAt)}</span>
                        </div>
                        <span className="font-mono text-[11px] text-muted-foreground/80 block mt-0.5">
                          {run.id}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Buka Hasil */}
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 text-xs text-primary font-semibold hover:bg-primary/10"
                            title="Buka hasil analisis run ini"
                          >
                            <Link href={`/app/proyek/${run.projectId}/hasil?run=${run.id}`}>
                              Lihat Hasil
                              <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Link>
                          </Button>

                          {/* Jalankan Ulang */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRerun(run)}
                            className="h-8 px-2 text-xs text-foreground hover:bg-muted"
                            title="Jalankan ulang analisis dengan membuat run baru"
                          >
                            <Play className="h-3.5 w-3.5" />
                            <span className="sr-only">Jalankan Ulang</span>
                          </Button>

                          {/* Hapus */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setRunToDelete(run)}
                            className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                            title="Hapus riwayat run ini"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Hapus Run</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-8 text-xs gap-1"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Sebelumnya
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 text-xs gap-1"
                  >
                    Selanjutnya
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!runToDelete}
        onOpenChange={(open) => !open && setRunToDelete(null)}
        title="Hapus Riwayat Analisis"
        description={`Apakah Anda yakin ingin menghapus catatan kalkulasi "${runToDelete?.id}" untuk proyek "${runToDelete?.projectName}"? Data kuesioner dan proyek asli Anda tetap aman.`}
        confirmLabel="Hapus Riwayat"
        cancelLabel="Batal"
        variant="destructive"
        onConfirm={handleDeleteRun}
      />

      {/* Bottom Page Actions */}
      <div className="pt-6 border-t border-border">
        <PageActions
          prevHref="/app"
          prevLabel="Kembali ke Meja Kerja"
          nextHref="/app/proyek/baru"
          nextLabel="Mulai Analisis Baru"
        />
      </div>
    </div>
  );
}
