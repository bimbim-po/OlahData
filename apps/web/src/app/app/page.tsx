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

export default function ProjectsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isCreatingSample, setIsCreatingSample] = useState(false);

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
        return <Badge variant="success">Selesai</Badge>;
      case 'analyzing':
        return <Badge variant="warning">Sedang dianalisis</Badge>;
      case 'draft':
      default:
        return <Badge variant="secondary">Draf</Badge>;
    }
  };

  const getProjectHref = (project: Project) => {
    if (project.status === 'completed') {
      return `/app/proyek/${project.id}/hasil`;
    }
    return `/app/proyek/${project.id}/analisis`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Proyek Saya
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola data skripsi dan analisis statistik kuesioner Anda.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={handleCreateSample}
            disabled={isCreatingSample}
            className="text-xs sm:text-sm"
          >
            <Sparkles className="h-4 w-4 text-amber-500 mr-1.5" />
            {isCreatingSample ? 'Menyiapkan...' : 'Pakai data contoh'}
          </Button>

          <Button asChild className="text-xs sm:text-sm">
            <Link href="/app/proyek/baru">
              <Plus className="h-4 w-4 mr-1.5" />
              Proyek baru
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari berdasarkan judul atau program studi..."
          className="pl-9 text-sm"
        />
      </div>

      {/* Loading Skeleton State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 space-y-4">
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
      ) : filteredProjects.length === 0 ? (
        /* Empty State */
        <Card className="border-dashed border-2 p-8 sm:p-12 text-center bg-card/50">
          <CardContent className="flex flex-col items-center justify-center p-0 max-w-md mx-auto space-y-4">
            <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
              <FolderKanban className="h-7 w-7" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground">
                {searchQuery ? 'Tidak ada proyek yang sesuai' : 'Belum ada proyek'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                {searchQuery
                  ? `Tidak ditemukan hasil untuk "${searchQuery}". Coba kata kunci lain.`
                  : 'Mulai proyek baru untuk mengolah data kuesioner Anda, atau coba langsung dengan data contoh bawaan.'}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2 flex-wrap justify-center">
              <Button asChild>
                <Link href="/app/proyek/baru">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Proyek baru
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={handleCreateSample}
                disabled={isCreatingSample}
              >
                <Sparkles className="h-4 w-4 text-amber-500 mr-1.5" />
                {isCreatingSample ? 'Menyiapkan...' : 'Coba data contoh'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Project Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="group relative flex flex-col justify-between hover:shadow-md hover:border-primary/40 transition-all duration-200"
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
                            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
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
                    <h3 className="font-serif font-bold text-base sm:text-lg text-foreground line-clamp-2 leading-snug">
                      {project.title}
                    </h3>
                  </Link>

                  {/* Research type */}
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
                    {project.researchType}
                  </p>
                </div>

                {/* Footer metadata */}
                <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5" title="Jumlah responden">
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
                className="absolute inset-x-0 bottom-0 top-12 z-0 rounded-b-xl"
                aria-label={`Buka ${project.title}`}
              />
            </Card>
          ))}
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
