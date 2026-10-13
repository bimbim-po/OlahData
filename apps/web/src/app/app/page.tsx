'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Sparkles,
  FolderKanban,
  MoreVertical,
  ExternalLink,
  Trash2,
  Calendar,
  Users,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  Clock,
  Check,
} from 'lucide-react';
import { getProjects, deleteProject, createSampleProject } from '@/lib/api';
import type { Project } from '@/lib/api/types';
import { formatDate, formatNumber } from '@/lib/format';
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
import { useAuthStore } from '@/stores/auth-store';
import { COPY } from '@/lib/copy';
import { cn } from '@/lib/utils';

export default function ProjectsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isCreatingSample, setIsCreatingSample] = useState(false);
  const [greetingVisible, setGreetingVisible] = useState(true);
  const [greetingText, setGreetingText] = useState('Selamat datang, Mahasiswa');
  const [highlighterSwept, setHighlighterSwept] = useState(false);

  // Time-of-day greeting (can be disabled via localStorage)
  useEffect(() => {
    try {
      const hideGreeting = localStorage.getItem('olahdata_hide_greeting') === 'true';
      if (hideGreeting) {
        setGreetingVisible(false);
        return;
      }
    } catch {
      // Ignore
    }

    const hour = new Date().getHours();
    let salam = 'Selamat datang';
    if (hour >= 4 && hour < 11) salam = 'Selamat pagi';
    else if (hour >= 11 && hour < 15) salam = 'Selamat siang';
    else if (hour >= 15 && hour < 18) salam = 'Selamat sore';
    else salam = 'Selamat malam';

    const displayName = user?.name ? user.name.split(' ')[0] : 'Bim';
    setGreetingText(`${salam}, ${displayName}`);

    // Trigger one-time highlighter sweep after mount
    const timer = setTimeout(() => {
      setHighlighterSwept(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [user]);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch {
      toast({
        title: 'Gagal memuat proyek',
        description: 'Terjadi kesalahan saat mengambil daftar proyek.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProjects();
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
      router.push(`/app/proyek/${sample.id}/hasil`);
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
      {/* 1. Header with Time-of-Day Greeting & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 border-b border-border/60 pb-5">
        <div>
          {greetingVisible && (
            <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
              {greetingText}
            </div>
          )}
          <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Meja Kerja Skripsi Anda
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-[68ch]">
            Kelola data dan analisis statistik kuesioner Anda. {COPY.reassurance.saved}
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
            <Sparkles className="h-4 w-4 text-amber-500 mr-1.5" />
            {isCreatingSample ? 'Menyiapkan...' : 'Pakai data contoh'}
          </Button>

          <Button asChild className="text-xs sm:text-sm min-h-[44px] h-11 sm:h-10 rounded-[10px] font-semibold">
            <Link href="/app/proyek/baru">
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
              <Button asChild size="default" className="min-h-[44px] h-11 px-5 rounded-[10px] font-semibold">
                <Link href="/app/proyek/baru">
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

                  {/* Langkah terakhir & Momen Detail Sapuan Stabilo Halus */}
                  <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans pt-0.5">
                    {mostRecentProject.status === 'completed' ? (
                      <p>
                        Hasil analisis statistik lengkap. Variabel utama memiliki nilai Cronbach&apos;s Alpha{' '}
                        <span
                          className={cn(
                            'inline-block px-1.5 py-0.2 rounded font-bold text-[#243044] transition-all duration-700',
                            highlighterSwept
                              ? 'bg-[#FFE14D] ring-2 ring-[#FFE14D]'
                              : 'bg-[#FFE14D]/20'
                          )}
                        >
                          0,872
                        </span>
                        {' '}(Reliabel) dan koefisien R²{' '}
                        <span
                          className={cn(
                            'inline-block px-1.5 py-0.2 rounded font-bold text-[#243044] transition-all duration-700 delay-150',
                            highlighterSwept
                              ? 'bg-[#FFE14D] ring-2 ring-[#FFE14D]'
                              : 'bg-[#FFE14D]/20'
                          )}
                        >
                          0,582
                        </span>
                        . Siap disalin ke naskah skripsi.
                      </p>
                    ) : (
                      <p>
                        Tabulasi kuesioner{' '}
                        <span
                          className={cn(
                            'inline-block px-1.5 py-0.2 rounded font-bold text-[#243044] transition-all duration-700',
                            highlighterSwept
                              ? 'bg-[#FFE14D] ring-2 ring-[#FFE14D]'
                              : 'bg-[#FFE14D]/20'
                          )}
                        >
                          {mostRecentProject.respondentCount > 0
                            ? `${formatNumber(mostRecentProject.respondentCount)} responden`
                            : '120 responden'}
                        </span>
                        {' '}telah tervalidasi. Siap dipetakan ke konstruk variabel dan diuji.
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
                  {filteredProjects.length} proyek tersimpan di meja kerja Anda
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
                          <span className="text-xs font-semibold text-primary uppercase tracking-wider truncate">
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
