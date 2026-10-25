'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  FolderKanban,
  MoreVertical,
  ExternalLink,
  Trash2,
  Calendar,
  Users,
  FileSpreadsheet,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { getProjects, deleteProject, createSampleProject, computeEffectiveN } from '@/lib/api';
import type { Project, AnalysisResults } from '@/lib/api/types';
import { formatDate, formatNumber } from '@/lib/format';
import { useWizardStore } from '@/stores/wizard-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { useToast } from '@/components/ui/toaster';
import { usePlanGate, isSampleProject } from '@/lib/entitlements';

export default function ProjectsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isCreatingSample, setIsCreatingSample] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await getProjects();
      const wiz = useWizardStore.getState();
      const enriched = data.map((p) => {
        let updated = { ...p };
        if (typeof window !== 'undefined') {
          try {
            const rawRes = localStorage.getItem(`olahdata_results_${p.id}`);
            if (rawRes) {
              const parsedRes = JSON.parse(rawRes) as AnalysisResults;
              updated = {
                ...updated,
                title: parsedRes.projectTitle || updated.title,
                respondentCount: parsedRes.respondentCount || updated.respondentCount,
                itemCount: parsedRes.sourceMeta?.columnCount || updated.itemCount,
                status: 'completed',
              };
            }
          } catch {
            // ignore
          }
        }
        if (
          wiz.fileData.length > 0 &&
          !wiz.usingSampleData &&
          wiz.projectId === p.id
        ) {
          updated = {
            ...updated,
            respondentCount: computeEffectiveN(wiz.fileData.length, wiz.removedRows),
            itemCount: wiz.columns.length,
          };
        }
        return updated;
      });

      // Urutkan proyek asli pengguna di atas proyek contoh
      enriched.sort((a, b) => {
        const aSample = isSampleProject(a) ? 1 : 0;
        const bSample = isSampleProject(b) ? 1 : 0;
        if (aSample !== bSample) return aSample - bSample;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      setProjects(enriched);
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : 'Gagal memuat proyek penelitian dari penyimpanan server.';
      setLoadError(msg);
      toast({
        title: 'Gagal memuat proyek',
        description: msg,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const { isFree, canCreateProject, openUpgradeModal } = usePlanGate();
  const customProjectsCount = projects.filter((p) => !isSampleProject(p)).length;
  const isQuotaFull = isFree && !canCreateProject(customProjectsCount);

  const handleNewProjectClick = (e: React.MouseEvent) => {
    if (isQuotaFull) {
      e.preventDefault();
      openUpgradeModal(
        'Batas Paket Coba Gratis: Maksimal 1 proyek buatan sendiri. Upgrade paket untuk menambah proyek tanpa batas.'
      );
    }
  };

  useEffect(() => {
    fetchProjects();
    if (typeof window !== 'undefined') {
      const handleSync = () => {
        fetchProjects();
      };
      window.addEventListener('focus', handleSync);
      window.addEventListener('storage', handleSync);
      return () => {
        window.removeEventListener('focus', handleSync);
        window.removeEventListener('storage', handleSync);
      };
    }
  }, [fetchProjects]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase().trim();
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.department.toLowerCase().includes(query) ||
        p.researchType.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  const mostRecentProject = useMemo(() => {
    if (projects.length === 0) return null;
    return projects[0];
  }, [projects]);

  const mostRecentMetrics = useMemo(() => {
    if (!mostRecentProject || typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`olahdata_results_${mostRecentProject.id}`);
      if (!raw) return null;
      const res = JSON.parse(raw) as AnalysisResults;
      const alpha = res.reliability?.[0]?.cronbachAlpha;
      const rSquare = res.determination?.rSquare;
      return {
        respondentCount: res.respondentCount || mostRecentProject.respondentCount,
        alpha: typeof alpha === 'number' ? formatNumber(alpha, 3) : null,
        rSquare: typeof rSquare === 'number' ? formatNumber(rSquare, 3) : null,
      };
    } catch {
      return null;
    }
  }, [mostRecentProject]);

  const otherProjects = useMemo(() => {
    if (searchQuery.trim()) return filteredProjects;
    return projects.slice(1);
  }, [projects, filteredProjects, searchQuery]);

  const handleCreateSample = async () => {
    try {
      setIsCreatingSample(true);
      const sample = await createSampleProject();
      toast({
        title: 'Data contoh berhasil dibuat',
        description: 'Membuka hasil analisis data contoh...',
        variant: 'success',
      });
      const targetUrl = `/app/proyek/${sample.id}/hasil`;
      if (typeof window !== 'undefined') {
        window.location.href = targetUrl;
      } else {
        router.push(targetUrl);
      }
    } catch {
      toast({
        title: 'Gagal membuat proyek contoh',
        description: 'Silakan coba beberapa saat lagi.',
        variant: 'error',
      });
      setIsCreatingSample(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    try {
      await deleteProject(projectToDelete.id);
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      toast({
        title: 'Proyek dihapus',
        description: `Proyek "${projectToDelete.title}" telah berhasil dihapus.`,
        variant: 'default',
      });
    } catch {
      toast({
        title: 'Gagal menghapus',
        description: 'Terjadi kesalahan saat menghapus proyek.',
        variant: 'error',
      });
    } finally {
      setProjectToDelete(null);
    }
  };

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="mint" className="rounded-[6px]">Selesai</Badge>;
      case 'analyzing':
        return <Badge variant="warning" className="rounded-[6px]">Sedang dianalisis</Badge>;
      case 'draft':
      default:
        return <Badge variant="secondary" className="rounded-[6px]">Draf</Badge>;
    }
  };

  const getProjectHref = (project: Project) => {
    if (project.status === 'completed') {
      return `/app/proyek/${project.id}/hasil`;
    }
    return `/app/proyek/${project.id}/analisis`;
  };

  return (
    <div className="space-y-6 sm:space-y-8 font-sans pb-16">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 border-b border-border/60 pb-5">
        <div>
          <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Proyek Analisis
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-[68ch]">
            Kelola proyek analisis data kuesioner Anda
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap pt-1 sm:pt-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCreateSample}
            disabled={isCreatingSample}
            className="text-xs sm:text-sm min-h-[44px] h-11 sm:h-10 rounded-[10px]"
          >
            <FileSpreadsheet className="h-4 w-4 text-primary mr-1.5" />
            {isCreatingSample ? 'Menyiapkan...' : 'Pakai data contoh'}
          </Button>

          <Button
            asChild
            className="text-xs sm:text-sm min-h-[44px] h-11 sm:h-10 rounded-[10px] font-semibold cursor-pointer"
            onClick={handleNewProjectClick}
          >
            <Link href={isQuotaFull ? '#' : '/app/proyek/baru'}>
              <Plus className="h-4 w-4 mr-1.5" />
              Proyek baru
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Loading Skeleton (< 100ms render, zero layout shift) */}
      {loading ? (
        <div className="space-y-6">
          {/* Lanjutkan Card Skeleton */}
          <div className="rounded-[16px] border border-border bg-card p-6 space-y-4">
            <div className="h-4 w-36 skeleton rounded" />
            <div className="h-7 w-2/3 skeleton rounded" />
            <div className="h-4 w-1/2 skeleton rounded" />
            <div className="h-11 w-48 skeleton rounded-[10px]" />
          </div>

          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-5 space-y-4 rounded-[16px]">
                <div className="flex justify-between items-start">
                  <div className="h-5 w-20 skeleton rounded" />
                  <div className="h-5 w-16 skeleton rounded-full" />
                </div>
                <div className="space-y-2">
                  <div className="h-6 w-3/4 skeleton rounded" />
                  <div className="h-4 w-1/2 skeleton rounded" />
                </div>
                <div className="pt-4 border-t border-border flex justify-between">
                  <div className="h-4 w-24 skeleton rounded" />
                  <div className="h-4 w-24 skeleton rounded" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : loadError ? (
        <div
          role="alert"
          className="rounded-[16px] border border-destructive/40 bg-destructive/5 p-8 text-center space-y-4"
        >
          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground">
              Gagal Memuat Daftar Proyek Penelitian
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              {loadError}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setLoading(true);
              fetchProjects();
            }}
            className="min-h-[40px] rounded-[10px]"
          >
            Coba Muat Ulang
          </Button>
        </div>
      ) : projects.length === 0 ? (
        /* Empty State for New Users */
        <Card className="border-dashed border-2 p-8 sm:p-12 text-center bg-card/60 rounded-[16px]">
          <CardContent className="flex flex-col items-center justify-center p-0 max-w-lg mx-auto space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <FolderKanban className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                Belum ada proyek penelitian
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                Mulai dengan berkas kuesioner Anda sendiri, atau coba data contoh simulasi untuk melihat hasil dan penjelasan Bab 4 dalam 60 detik.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2 flex-wrap justify-center">
              <Button
                asChild
                size="default"
                className="min-h-[44px] h-11 px-5 rounded-[10px] font-semibold cursor-pointer"
                onClick={handleNewProjectClick}
              >
                <Link href={isQuotaFull ? '#' : '/app/proyek/baru'}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Mulai proyek baru
                </Link>
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={handleCreateSample}
                disabled={isCreatingSample}
                className="min-h-[44px] h-11 px-5 rounded-[10px]"
              >
                <FileSpreadsheet className="h-4 w-4 text-primary mr-1.5" />
                {isCreatingSample ? 'Menyiapkan...' : 'Coba data contoh (60 Detik)'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* 3. Returning User Experience: "Lanjut apa?" Card + Project Grid */
        <div className="space-y-6 sm:space-y-8">
          {/* Card Besar "Lanjutkan" untuk Proyek Paling Terkini */}
          {!searchQuery && mostRecentProject && (
            <div className="rounded-[16px] border border-primary/30 bg-primary/5 dark:bg-primary/10 p-5 sm:p-6 shadow-xs relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-primary text-primary-foreground font-semibold text-[11px]">
                      <Clock className="h-3 w-3" />
                      Lanjutkan Terakhir
                    </span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      {mostRecentProject.department || 'Umum'}
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold text-foreground leading-snug">
                    {mostRecentProject.title}
                  </h2>

                  {/* Ringkasan metrik dinamis dari proyek aktif pengguna */}
                  <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans pt-0.5">
                    {mostRecentProject.status === 'completed' ? (
                      <p>
                        Hasil analisis statistik selesai untuk{' '}
                        <span className="font-semibold tabular-nums">
                          N = {formatNumber(mostRecentMetrics?.respondentCount || mostRecentProject.respondentCount || 0)} responden
                        </span>
                        {mostRecentMetrics?.alpha ? (
                          <>
                            {' '}dengan Cronbach&apos;s Alpha{' '}
                            <span className="font-semibold tabular-nums">
                              {mostRecentMetrics.alpha}
                            </span>
                          </>
                        ) : null}
                        {mostRecentMetrics?.rSquare ? (
                          <>
                            {' '}dan koefisien R²{' '}
                            <span className="font-semibold tabular-nums">
                              {mostRecentMetrics.rSquare}
                            </span>
                          </>
                        ) : null}
                        . Siap disalin dan diunduh ke naskah Bab 4 skripsi.
                      </p>
                    ) : mostRecentProject.respondentCount > 0 ? (
                      <p>
                        Tabulasi kuesioner{' '}
                        <span className="font-semibold tabular-nums">
                          N = {formatNumber(mostRecentProject.respondentCount)} responden
                        </span>
                        {' '}telah dimuat. Lanjutkan pemetaan variabel dan jalankan analisis Bab 4.
                      </p>
                    ) : (
                      <p>
                        Proyek penelitian aktif telah dibuat. Unggah berkas kuesioner (.xlsx/.csv) untuk memulai pengujian statistik Bab 4.
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 pt-2 lg:pt-0">
                  <Button asChild size="default" className="w-full sm:w-auto font-semibold text-xs sm:text-sm px-6 min-h-[44px] h-11 rounded-[10px] shadow-sm">
                    <Link href={getProjectHref(mostRecentProject)}>
                      <span>
                        {mostRecentProject.status === 'completed'
                          ? 'Buka Hasil & Narasi Bab 4'
                          : 'Lanjutkan Analisis'}
                      </span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Section: Daftar Proyek Lainnya */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {searchQuery ? 'Hasil Pencarian Proyek' : 'Semua Proyek Penelitian'}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {filteredProjects.length} proyek
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari judul atau prodi..."
                  className="pl-10 text-base sm:text-sm min-h-[44px] h-11 sm:h-9 rounded-[10px]"
                />
              </div>
            </div>

            {/* Grid Kartu Proyek */}
            {otherProjects.length === 0 && searchQuery ? (
              <div className="p-8 text-center border border-border/80 rounded-[16px] bg-card/40">
                <p className="text-sm text-muted-foreground">
                  Tidak ditemukan proyek dengan kata kunci &ldquo;{searchQuery}&rdquo;.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {(searchQuery ? filteredProjects : projects).map((project) => (
                  <Card
                    key={project.id}
                    className="group relative flex flex-col justify-between hover:shadow-md hover:border-primary/40 transition-all duration-200 rounded-[16px]"
                  >
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      {/* Header row: Prodi & Status badge */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                            {project.department || 'Umum'}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            {getStatusBadge(project.status)}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="h-11 w-11 -mr-2 rounded-[10px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer touch-manipulation"
                                  aria-label="Menu aksi proyek"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem asChild>
                                  <Link href={getProjectHref(project)} className="flex items-center gap-2 cursor-pointer">
                                    <ExternalLink className="h-4 w-4" />
                                    <span>Buka Proyek</span>
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setProjectToDelete(project)}
                                  className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  <span>Hapus</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Project Title */}
                        <Link
                          href={getProjectHref(project)}
                          className="block group-hover:text-primary transition-colors"
                        >
                          <h3 className="font-semibold text-sm sm:text-base text-foreground line-clamp-2 leading-snug">
                            {project.title}
                          </h3>
                        </Link>

                        {/* Research type */}
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {project.researchType}
                        </p>
                      </div>

                      {/* Footer metadata */}
                      <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5" title="Jumlah data responden">
                          <Users className="h-3.5 w-3.5" />
                          <span className="tabular-nums">
                            {project.respondentCount > 0
                              ? `${formatNumber(project.respondentCount)} responden`
                              : 'Belum ada data'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5" title="Tanggal diubah">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatDate(project.updatedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Clickable Card Overlay */}
                    <Link
                      href={getProjectHref(project)}
                      className="absolute inset-x-0 bottom-0 top-12 z-0 rounded-b-md"
                      aria-label={`Buka ${project.title}`}
                    />
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
        title="Hapus Proyek?"
        description={`Apakah Anda yakin ingin menghapus proyek "${projectToDelete?.title}"? Seluruh konfigurasi dan data pada proyek ini akan dihapus secara permanen.`}
        confirmLabel="Hapus Proyek"
        cancelLabel="Batal"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
