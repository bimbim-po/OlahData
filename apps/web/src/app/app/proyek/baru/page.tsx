'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { createProject } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toaster';
import { Badge } from '@/components/ui/badge';

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
        description: 'Mengarahkan ke lembar analisis data...',
        variant: 'success',
      });

      router.push(`/app/proyek/${newProject.id}/analisis`);
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
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground hover:text-foreground -ml-2 text-xs"
        >
          <Link href="/app">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Kembali ke Meja Kerja
          </Link>
        </Button>
      </div>

      <Card className="border-border shadow-xs rounded-md">
        <CardHeader className="space-y-1 pb-3">
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            Mulai Proyek Skripsi Baru
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            Isi informasi dasar skripsimu. Konfigurasi dataset dan pemetaan variabel akan dilakukan pada langkah selanjutnya.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Judul Skripsi */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-semibold">
                Judul Skripsi / Penelitian <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="title"
                rows={3}
                placeholder="Contoh: Pengaruh Kualitas Layanan dan Persepsi Harga terhadap Kepuasan Pelanggan pada Pengguna E-Commerce"
                className={`flex w-full rounded-[10px] border bg-card px-3 py-2 text-xs text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none ${
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
                  Gunakan rencana judul skripsi resmimu (minimal 5 karakter).
                </p>
              )}
            </div>

            {/* Program Studi / Jurusan */}
            <div className="space-y-1.5">
              <Label htmlFor="department" className="text-xs font-semibold">
                Program Studi / Jurusan <span className="text-destructive">*</span>
              </Label>
              <Input
                id="department"
                type="text"
                placeholder="Mis. Manajemen, Psikologi, Ilmu Komunikasi, Akuntansi"
                className={`rounded-[10px] text-xs h-9 ${errors.department ? 'border-destructive focus-visible:ring-destructive' : ''}`}
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
                <Label className="text-xs font-semibold">
                  Desain Analisis Kuantitatif <span className="text-destructive">*</span>
                </Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Pilih model pengujian hipotesis yang sesuai dengan metodologi penelitianmu.
                </p>
              </div>

              <div className="space-y-2">
                {RESEARCH_TYPES.map((type) => {
                  const isSelected = selectedResearchType === type.id;
                  return (
                    <div
                      key={type.id}
                      onClick={() => setValue('researchType', type.id, { shouldValidate: true })}
                      className={`relative flex items-start p-3 rounded-[10px] border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-primary bg-accent/30 ring-1 ring-primary'
                          : 'border-border bg-card hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex h-5 items-center mr-2.5">
                        <input
                          type="radio"
                          id={type.id}
                          value={type.id}
                          checked={isSelected}
                          onChange={() => setValue('researchType', type.id, { shouldValidate: true })}
                          className="h-3.5 w-3.5 text-primary accent-primary"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={type.id}
                            className="font-semibold text-xs text-foreground cursor-pointer"
                          >
                            {type.label}
                          </label>
                          {type.recommended && (
                            <Badge variant="mint" className="text-[10px] font-normal py-0 px-1.5 rounded-[6px]">
                              Standar Skripsi
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
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
            <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                asChild
                disabled={isSubmitting}
                className="text-xs rounded-[10px]"
              >
                <Link href="/app">Batal</Link>
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="min-w-[130px] text-xs font-semibold rounded-[10px]">
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
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
    </div>
  );
}
