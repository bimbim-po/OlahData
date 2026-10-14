'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, CheckCircle2, Sparkles, HelpCircle, Lock } from 'lucide-react';
import { createProject, getProjects } from '@/lib/api';
import type { Project } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toaster';
import { Badge } from '@/components/ui/badge';
import { usePlanGate, isSampleProject } from '@/lib/entitlements';

const projectSchema = z.object({
  title: z
    .string()
    .min(5, { message: 'Judul skripsi / penelitian minimal 5 karakter' })
    .max(250, { message: 'Judul penelitian tidak boleh melebihi 250 karakter' }),
  department: z
    .string()
    .min(2, { message: 'Program studi / jurusan wajib diisi' }),
  researchType: z
    .string()
    .min(1, { message: 'Pilih jenis penelitian kuantitatif' }),
});

type ProjectFormData = z.infer<typeof projectSchema>;

const RESEARCH_TYPES = [
  {
    id: 'Regresi Linier Berganda',
    label: 'Regresi Linier Berganda',
    description: 'Menguji pengaruh simultan dan parsial dua atau lebih variabel bebas (X) terhadap variabel terikat (Y).',
    recommended: true,
  },
  {
    id: 'Uji Pengaruh (Regresi Sederhana)',
    label: 'Uji Pengaruh (Regresi Sederhana)',
    description: 'Menguji pengaruh langsung satu variabel bebas (X) terhadap satu variabel terikat (Y).',
    recommended: false,
  },
  {
    id: 'Analisis Jalur Sederhana',
    label: 'Analisis Jalur Sederhana',
    description: 'Menguji hubungan kausal langsung dan tidak langsung melalui variabel intervening / mediasi.',
    recommended: false,
  },
];

function NewProjectForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('contoh') === '1';
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingProjects, setExistingProjects] = useState<Project[]>([]);
  const { isFree, openUpgradeModal } = usePlanGate();

  useEffect(() => {
    getProjects().then(setExistingProjects).catch(() => {});
  }, []);

  const customProjectsCount = existingProjects.filter((p) => !isSampleProject(p)).length;
  const isQuotaExceeded = !isDemo && isFree && customProjectsCount >= 1;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: isDemo ? 'Pengaruh Kualitas Layanan dan Kepuasan Pelanggan terhadap Loyalitas Pelanggan' : '',
      department: isDemo ? 'Manajemen Pemasaran' : '',
      researchType: 'Regresi Linier Berganda',
    },
  });

  const selectedResearchType = watch('researchType');

  const onSubmit = async (data: ProjectFormData) => {
    if (isQuotaExceeded) {
      openUpgradeModal({
        plan: 'monthly',
        reason: 'Batas kuota 1 proyek pada paket Coba Gratis telah tercapai',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const newProject = await createProject(
        data.title.trim(),
        data.department.trim(),
        data.researchType
      );

      toast({
        title: 'Proyek berhasil dibuat',
        description: 'Mengarahkan ke lembar analisis data...',
        variant: 'success',
      });

      const targetUrl = isDemo
        ? `/app/proyek/${newProject.id}/analisis?contoh=1`
        : `/app/proyek/${newProject.id}/analisis`;
      router.push(targetUrl);
    } catch {
      toast({
        title: 'Gagal membuat proyek',
        description: 'Terjadi kendala pada sistem. Silakan ulangi kembali.',
        variant: 'error',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Demo Mode Notice */}
      {isDemo && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <p className="text-foreground">
              <strong className="font-semibold">Ruang Kerja Simulasi Demo:</strong> Anda dapat langsung mencoba seluruh tahapan analisis menggunakan data contoh tanpa perlu mendaftar.
            </p>
          </div>
          <Badge variant="mint" className="text-[10px] shrink-0 font-medium">
            Data Contoh
          </Badge>
        </div>
      )}

      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground hover:text-foreground -ml-2 text-xs min-h-[44px] inline-flex items-center"
        >
          <Link href="/app">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Kembali ke Meja Kerja
          </Link>
        </Button>
      </div>

      {isQuotaExceeded ? (
        <Card className="border-border shadow-xs rounded-[16px] p-6 sm:p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-xl font-bold text-foreground font-serif">
              Batas Kuota Paket Coba Gratis Tercapai
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Anda telah memiliki <strong className="text-foreground">{customProjectsCount} proyek penelitian</strong> aktif. Pada paket Coba Gratis, Anda dapat mengelola 1 proyek pribadi. Tingkatkan paket untuk membuat proyek skripsi tanpa batas dan membuka seluruh uji statistik lanjutan.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              onClick={() =>
                openUpgradeModal({
                  plan: 'monthly',
                  reason: 'Tambah Proyek Penelitian Skripsi Tanpa Batas',
                })
              }
              className="w-full sm:w-auto font-semibold rounded-xl min-h-[44px] px-6 text-xs sm:text-sm bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Tingkatkan Paket (Mulai Rp 39.000)
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto rounded-xl min-h-[44px] px-6 text-xs sm:text-sm cursor-pointer"
            >
              <Link href="/app">Kelola Proyek yang Ada</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="border-border shadow-xs rounded-[16px]">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Mulai Proyek Skripsi Baru
              </CardTitle>
              <CardDescription className="text-muted-foreground text-xs sm:text-sm">
                Isi informasi dasar skripsi Anda. Konfigurasi dataset dan pemetaan variabel akan dilakukan pada langkah selanjutnya.
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground shrink-0">
              <Link href="/app/bantuan#format-berkas" target="_blank" title="Panduan Format Berkas Kuesioner">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">Bantuan Berkas</span>
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Judul Skripsi */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs sm:text-sm font-semibold">
                Judul Skripsi / Penelitian <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="title"
                rows={3}
                placeholder="Contoh: Pengaruh Kualitas Layanan dan Kepuasan Pelanggan terhadap Loyalitas Pelanggan"
                className={`flex w-full rounded-[10px] border bg-card px-3 py-2.5 text-base sm:text-xs text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none ${
                  errors.title ? 'border-destructive focus-visible:ring-destructive' : 'border-input'
                }`}
                {...register('title')}
              />
              {errors.title ? (
                <p className="text-xs text-destructive font-medium">
                  {errors.title.message}
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Gunakan rencana judul skripsi resmi Anda (minimal 5 karakter).
                </p>
              )}
            </div>

            {/* Program Studi / Jurusan */}
            <div className="space-y-1.5">
              <Label htmlFor="department" className="text-xs sm:text-sm font-semibold">
                Program Studi / Jurusan <span className="text-destructive">*</span>
              </Label>
              <Input
                id="department"
                type="text"
                placeholder="Mis. Manajemen, Psikologi, Ilmu Komunikasi, Akuntansi"
                className={`rounded-[10px] text-base sm:text-xs h-11 sm:h-9 ${errors.department ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                {...register('department')}
              />
              {errors.department && (
                <p className="text-xs text-destructive font-medium">
                  {errors.department.message}
                </p>
              )}
            </div>

            {/* Jenis Penelitian Kuantitatif */}
            <div className="space-y-2.5">
              <div>
                <Label className="text-xs sm:text-sm font-semibold">
                  Desain Analisis Kuantitatif <span className="text-destructive">*</span>
                </Label>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                  Pilih model pengujian hipotesis yang sesuai dengan metodologi penelitian Anda.
                </p>
              </div>

              <div className="space-y-2">
                {RESEARCH_TYPES.map((type) => {
                  const isSelected = selectedResearchType === type.id;
                  return (
                    <div
                      key={type.id}
                      onClick={() => setValue('researchType', type.id, { shouldValidate: true })}
                      className={`relative flex items-start p-3.5 sm:p-3 rounded-[10px] border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-primary bg-accent/30 ring-1 ring-primary'
                          : 'border-border bg-card hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex h-5 items-center mr-3 mt-0.5">
                        <input
                          type="radio"
                          id={type.id}
                          value={type.id}
                          checked={isSelected}
                          onChange={() => setValue('researchType', type.id, { shouldValidate: true })}
                          className="h-4 w-4 text-primary accent-primary cursor-pointer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label
                            htmlFor={type.id}
                            className="font-semibold text-xs sm:text-sm text-foreground cursor-pointer"
                          >
                            {type.label}
                          </label>
                          {type.recommended && (
                            <Badge variant="mint" className="text-[10px] font-normal py-0 px-1.5 rounded-[6px]">
                              Standar Skripsi
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {errors.researchType && (
                <p className="text-xs text-destructive font-medium">
                  {errors.researchType.message}
                </p>
              )}
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="mt-8 pt-6 border-t border-border flex items-center justify-end gap-3 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                asChild
                disabled={isSubmitting}
                className="text-xs sm:text-sm rounded-[10px] min-h-[44px] h-11 sm:h-10 px-4"
              >
                <Link href="/app">Batal</Link>
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="min-w-[140px] text-xs sm:text-sm font-semibold rounded-[10px] min-h-[44px] h-11 sm:h-10 px-5"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Menyimpan...
                  </span>
                ) : (
                  'Lanjut ke Pemetaan'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      )}
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="h-40 w-full bg-muted/40 rounded-[16px] animate-pulse" />
        </div>
      }
    >
      <NewProjectForm />
    </React.Suspense>
  );
}
