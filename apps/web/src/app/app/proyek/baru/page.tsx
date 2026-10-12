'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { createProject } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toaster';

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

export default function NewProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      department: '',
      researchType: 'Regresi Linier Berganda',
    },
  });

  const selectedResearchType = watch('researchType');

  const onSubmit = async (data: ProjectFormData) => {
    try {
      setIsSubmitting(true);
      const newProject = await createProject(
        data.title.trim(),
        data.department.trim(),
        data.researchType
      );

      toast({
        title: 'Proyek berhasil dibuat',
        description: 'Mengarahkan ke halaman analisis...',
        variant: 'success',
      });

      router.push(`/app/proyek/${newProject.id}/analisis`);
    } catch {
      toast({
        title: 'Gagal membuat proyek',
        description: 'Terjadi kesalahan pada sistem. Silakan coba lagi.',
        variant: 'error',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground hover:text-foreground -ml-2"
        >
          <Link href="/app">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Kembali ke Proyek
          </Link>
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Mulai Proyek Baru
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Isi informasi dasar skripsi atau penelitian Anda. Konfigurasi data dan variabel akan dilakukan pada langkah selanjutnya.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Judul Skripsi */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold">
                Judul Skripsi / Penelitian <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="title"
                rows={3}
                placeholder="Contoh: Pengaruh Kualitas Layanan dan Harga terhadap Kepuasan Pelanggan pada Pengguna E-Commerce"
                className={`flex w-full rounded-lg border bg-card px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none ${
                  errors.title ? 'border-destructive focus-visible:ring-destructive' : 'border-input'
                }`}
                {...register('title')}
              />
              {errors.title ? (
                <p className="text-xs text-destructive font-medium">
                  {errors.title.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Gunakan judul resmi atau rencana judul skripsi Anda (minimal 5 karakter).
                </p>
              )}
            </div>

            {/* Program Studi / Jurusan */}
            <div className="space-y-2">
              <Label htmlFor="department" className="text-sm font-semibold">
                Program Studi / Jurusan <span className="text-destructive">*</span>
              </Label>
              <Input
                id="department"
                type="text"
                placeholder="Mis. Manajemen, Psikologi, Ilmu Komunikasi, Akuntansi"
                className={errors.department ? 'border-destructive focus-visible:ring-destructive' : ''}
                {...register('department')}
              />
              {errors.department && (
                <p className="text-xs text-destructive font-medium">
                  {errors.department.message}
                </p>
              )}
            </div>

            {/* Jenis Penelitian Kuantitatif */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-semibold">
                  Jenis Penelitian Kuantitatif <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pilih desain analisis yang sesuai dengan bab metodologi penelitian Anda.
                </p>
              </div>

              <div className="space-y-2.5">
                {RESEARCH_TYPES.map((type) => {
                  const isSelected = selectedResearchType === type.id;
                  return (
                    <div
                      key={type.id}
                      onClick={() => setValue('researchType', type.id, { shouldValidate: true })}
                      className={`relative flex items-start p-3.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border bg-card hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex h-5 items-center mr-3">
                        <input
                          type="radio"
                          id={type.id}
                          value={type.id}
                          checked={isSelected}
                          onChange={() => setValue('researchType', type.id, { shouldValidate: true })}
                          className="h-4 w-4 text-primary accent-primary"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={type.id}
                            className="font-medium text-sm text-foreground cursor-pointer"
                          >
                            {type.label}
                          </label>
                          {type.recommended && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-semibold">
                              <Sparkles className="h-3 w-3" />
                              Umum Dipakai
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
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
            <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                asChild
                disabled={isSubmitting}
              >
                <Link href="/app">Batal</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Menyimpan...
                  </span>
                ) : (
                  'Lanjut ke Analisis'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
