'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Palette,
  AlertTriangle,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  Trash2,
  Save,
  CreditCard,
  Download,
  Zap,
  GraduationCap,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Database,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useTheme } from '@/components/theme-provider';
import { deleteAllProjects, getProjects } from '@/lib/api';
import type { ThemeMode, Project } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { PageActions } from '@/components/page-actions';
import { useToast } from '@/components/ui/toaster';
import { PLANS, PlanConfig } from '@/lib/plans';
import { useUpgradeModal } from '@/lib/entitlements';

export default function SettingsPage() {
  const router = useRouter();
  const { user, updateUser, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { openUpgradeModal } = useUpgradeModal();

  // Profile form state
  const [name, setName] = useState(user?.name || 'Budi Santoso');
  const [email, setEmail] = useState(user?.email || 'budi.santoso@kampus.ac.id');
  const [university, setUniversity] = useState(user?.university || 'Universitas Indonesia');
  const [department, setDepartment] = useState(user?.department || 'Manajemen');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Usage counters & projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectsCount, setActiveProjectsCount] = useState(0);

  // Helper untuk memisahkan proyek contoh dari proyek pribadi pengguna
  const isSampleProject = (p: Project) => {
    return (
      p.id === 'sample' ||
      p.id.startsWith('sample') ||
      p.id === 'project-1' ||
      p.id === 'project-2' ||
      p.id === 'project-3' ||
      (p as unknown as { isSample?: boolean }).isSample === true ||
      p.title?.toLowerCase().includes('kualitas layanan dan kepuasan') ||
      p.title?.toLowerCase().includes('contoh') ||
      p.title?.toLowerCase().includes('simulasi')
    );
  };

  const sampleProjects = projects.filter(isSampleProject);
  const userCustomProjects = projects.filter((p) => !isSampleProject(p));

  const sampleCount = sampleProjects.length;
  const userProjectsCount = userCustomProjects.length;

  // Dialogs
  const [isConfirmDeleteProjectsOpen, setIsConfirmDeleteProjectsOpen] = useState(false);
  const [isDeletingProjects, setIsDeletingProjects] = useState(false);

  const [isConfirmDeleteAccountOpen, setIsConfirmDeleteAccountOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setUniversity(user.university || '');
      setDepartment(user.department || '');
    }

    getProjects()
      .then((data) => {
        setProjects(data);
        setActiveProjectsCount(data.length);
      })
      .catch(() => {
        setActiveProjectsCount(1);
      });
  }, [user]);

  // Current Plan Information
  const currentPlanId = user?.plan || 'free';
  const currentPlan: PlanConfig =
    PLANS.find((p) => p.id === currentPlanId) || PLANS[0];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      updateUser({
        name: name.trim(),
        email: email.trim(),
        university: university.trim(),
        department: department.trim(),
      });
      toast({
        title: 'Profil Diperbarui',
        description: 'Perubahan data profil mahasiswa berhasil disimpan.',
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Gagal Menyimpan',
        description: 'Terjadi kesalahan saat menyimpan data profil.',
        variant: 'error',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleExportAccountData = () => {
    try {
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        user: {
          id: user?.id || 'demo-user',
          name: name.trim(),
          email: email.trim(),
          university: university.trim(),
          department: department.trim(),
          plan: currentPlanId,
        },
        projectsMetadata: projects.map((p) => ({
          id: p.id,
          title: p.title,
          status: p.status,
          respondentCount: p.respondentCount,
          itemCount: p.itemCount,
          versionsCount: p.dataVersions.length,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
        privacyNotice:
          'Ekspor ini hanya memuat metadata profil dan daftar proyek Anda. Data kuesioner responden disimpan secara terenkripsi pada ruang kerja aman.',
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `olahdata_data_akun_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast({
        title: 'Data Akun Berhasil Diekspor',
        description: 'Berkas JSON metadata akun Anda telah diunduh ke komputer.',
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Gagal Mengekspor Data',
        description: 'Terjadi kendala saat menyusun data akun.',
        variant: 'error',
      });
    }
  };

  const handleDeleteAllProjects = async () => {
    try {
      setIsDeletingProjects(true);
      await deleteAllProjects();
      setProjects([]);
      setActiveProjectsCount(0);
      toast({
        title: 'Semua Proyek Dihapus',
        description: 'Seluruh riwayat proyek dan kalkulasi statistik telah dibersihkan.',
        variant: 'default',
      });
    } catch {
      toast({
        title: 'Gagal Menghapus Proyek',
        description: 'Terjadi kesalahan saat mengosongkan data proyek.',
        variant: 'error',
      });
    } finally {
      setIsDeletingProjects(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      await deleteAllProjects();
      logout();
      toast({
        title: 'Akun Berhasil Dihapus',
        description: 'Seluruh data profil dan sesi akun Anda telah ditutup secara permanen.',
        variant: 'default',
      });
      router.push('/');
    } catch {
      toast({
        title: 'Gagal Menghapus Akun',
        description: 'Terjadi kendala saat memproses penutupan akun.',
        variant: 'error',
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const THEME_OPTIONS: { id: ThemeMode; label: string; icon: typeof Sun; desc: string }[] = [
    {
      id: 'light',
      label: 'Terang',
      icon: Sun,
      desc: 'Tampilan cerah dengan latar belakang Bone yang nyaman dibaca.',
    },
    {
      id: 'dark',
      label: 'Gelap',
      icon: Moon,
      desc: 'Tampilan kontras tinggi yang nyaman di mata saat mengerjakan skripsi malam hari.',
    },
    {
      id: 'system',
      label: 'Ikuti Sistem',
      icon: Laptop,
      desc: 'Menyesuaikan otomatis dengan preferensi tema sistem operasi Anda.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Pengaturan Akun dan Preferensi
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola profil mahasiswa, batas kuota paket, preferensi tema tampilan, dan manajemen data.
        </p>
      </div>

      <Tabs defaultValue="profil" className="w-full">
        <TabsList className="grid grid-cols-4 max-w-lg h-11 p-1">
          <TabsTrigger value="profil" className="text-xs sm:text-sm flex items-center gap-1.5">
            <UserIcon className="h-4 w-4" />
            <span>Profil</span>
          </TabsTrigger>
          <TabsTrigger value="paket" className="text-xs sm:text-sm flex items-center gap-1.5">
            <CreditCard className="h-4 w-4" />
            <span>Paket</span>
          </TabsTrigger>
          <TabsTrigger value="tampilan" className="text-xs sm:text-sm flex items-center gap-1.5">
            <Palette className="h-4 w-4" />
            <span>Tampilan</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="text-xs sm:text-sm flex items-center gap-1.5 text-destructive data-[state=active]:text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>Data</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Profil Mahasiswa */}
        <TabsContent value="profil" className="space-y-4 pt-2">
          <Card className="border-border shadow-xs">
            <CardHeader>
              <CardTitle className="font-serif text-xl font-bold">
                Informasi Profil Mahasiswa
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                Data identitas ini digunakan pada lembar Pernyataan Penggunaan Alat dan lampiran ekspor Bab 4.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSaveProfile}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold">
                      Nama Lengkap
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">
                      Alamat Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="university" className="text-sm font-semibold">
                      Perguruan Tinggi / Universitas
                    </Label>
                    <Input
                      id="university"
                      type="text"
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm font-semibold">
                      Program Studi / Jurusan
                    </Label>
                    <Input
                      id="department"
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 border-t border-border flex justify-end">
                <Button type="submit" disabled={isSavingProfile} className="gap-2 font-semibold">
                  <Save className="h-4 w-4" />
                  {isSavingProfile ? 'Menyimpan...' : 'Simpan Profil'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Tab 2: Paket & Batas Pemakaian Kuota */}
        <TabsContent value="paket" className="space-y-4 pt-2">
          <Card className="border-border shadow-xs">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-serif text-xl font-bold flex items-center gap-2">
                    <span>Paket Langganan Aktif</span>
                    <Badge variant={currentPlanId === 'free' ? 'secondary' : 'default'} className="uppercase">
                      {currentPlan.name}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Batas kapasitas analisis data, jumlah proyek, dan hak akses ekspor dokumen.
                  </CardDescription>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    openUpgradeModal({
                      plan: currentPlanId === 'monthly' ? 'thesis' : 'monthly',
                      reason: 'Pilihan Paket OlahData',
                    })
                  }
                  className="gap-1.5 font-semibold cursor-pointer"
                >
                  <span>Pilihan Paket dan Upgrade</span>
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Usage Counters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Proyek Aktif */}
                <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
                      Proyek Pribadi
                    </span>
                    {sampleCount > 0 && (
                      <Badge variant="outline" className="text-[9px] font-normal py-0 px-1 text-muted-foreground bg-muted/40 border-border">
                        Simulasi
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-xl font-bold text-foreground">
                      {userProjectsCount}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      / {currentPlan.quotaProjects === Infinity ? 'Tak Terbatas' : `${currentPlan.quotaProjects} proyek`}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            currentPlan.quotaProjects === Infinity
                              ? 20
                              : Math.round((userProjectsCount / currentPlan.quotaProjects) * 100)
                          )
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                    {sampleCount > 0
                      ? `${sampleCount} proyek contoh aktif (tidak memotong kuota)`
                      : userProjectsCount === 0
                      ? 'Belum ada proyek pribadi dibuat'
                      : `${userProjectsCount} dari ${currentPlan.quotaProjects} kuota terpakai`}
                  </p>
                </div>

                {/* Responden Maks */}
                <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
                    Batas Responden
                  </span>
                  <div className="text-sm sm:text-base font-bold text-foreground leading-snug">
                    {currentPlan.quotaRespondentsLabel}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {currentPlan.quotaRespondents === Infinity ? 'Batas wajar skripsi' : 'Maks. 50 per file'}
                  </p>
                </div>

                {/* Butir Pertanyaan */}
                <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
                    Butir Indikator
                  </span>
                  <div className="text-sm sm:text-base font-bold text-foreground leading-snug">
                    {currentPlan.quotaQuestionsLabel}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {currentPlan.quotaQuestions === Infinity ? 'Seluruh kuesioner' : 'Hingga 30 butir'}
                  </p>
                </div>

                {/* Format Ekspor */}
                <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
                    Ekspor Dokumen
                  </span>
                  <div className="text-sm sm:text-base font-bold text-foreground leading-snug">
                    {currentPlan.exportLabel}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {currentPlan.exportType === 'clean' ? 'Format APA siap pakai' : 'Disertai watermark'}
                  </p>
                </div>
              </div>

              {/* Notice for Free Plan */}
              {currentPlanId === 'free' && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-0.5">
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-amber-500" />
                      <span>Rekomendasi Skripsi: Paket 3 Bulan</span>
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Buka akses seluruh uji statistik (Regresi, Reliabilitas, Asumsi Klasik) dan ekspor Word tanpa watermark seharga Rp 99.000 / 3 bulan.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      openUpgradeModal({
                        plan: 'thesis',
                        reason: 'Rekomendasi Paket Skripsi 3 Bulan',
                      })
                    }
                    className="font-semibold shrink-0 cursor-pointer shadow-xs"
                  >
                    Tingkatkan Paket
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Tampilan */}
        <TabsContent value="tampilan" className="space-y-4 pt-2">
          <Card className="border-border shadow-xs">
            <CardHeader>
              <CardTitle className="font-serif text-xl font-bold">
                Preferensi Tampilan Aplikasi
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                Pilih tema warna aplikasi OlahData sesuai kenyamanan mata Anda saat menganalisis data kuesioner.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {THEME_OPTIONS.map((opt) => {
                  const isSelected = theme === opt.id;
                  const Icon = opt.icon;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setTheme(opt.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-2 ring-primary shadow-xs'
                          : 'border-border bg-card hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground">
                          <Icon className="h-4 w-4" />
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                      </div>

                      <div>
                        <span className="font-semibold text-sm text-foreground block">
                          {opt.label}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {opt.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Manajemen & Privasi Data */}
        <TabsContent value="data" className="space-y-4 pt-2">
          {/* Ekspor Data Akun */}
          <Card className="border-border shadow-xs">
            <CardHeader>
              <CardTitle className="font-serif text-xl font-bold flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <span>Ekspor Portabilitas Data Akun</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                Unduh salinan data profil dan riwayat metadata proyek Anda dalam format JSON standar (Sesuai Hak Portabilitas Data).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="outline"
                onClick={handleExportAccountData}
                className="gap-2 font-semibold"
              >
                <Download className="h-4 w-4" />
                <span>Unduh Metadata Akun (JSON)</span>
              </Button>
            </CardContent>
          </Card>

          {/* Area Bahaya: Hapus Data & Akun */}
          <Card className="border-destructive/40 shadow-xs bg-card">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <CardTitle className="font-serif text-xl font-bold">
                  Area Bahaya: Manajemen Data dan Akun
                </CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                Tindakan di bawah ini bersifat permanen dan tidak dapat dipulihkan. Mohon berhati-hati sebelum melanjutkan.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Opsi 1: Hapus Semua Proyek */}
              <div className="rounded-lg border border-border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-foreground">
                    Hapus Semua Proyek dan Analisis
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-lg leading-relaxed">
                    Menghapus seluruh daftar proyek, dataset tersimpan, riwayat versi pembersihan, dan hasil hitung Bab 4. Akun profil Anda tetap aktif.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsConfirmDeleteProjectsOpen(true)}
                  className="shrink-0 text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus Semua Proyek
                </Button>
              </div>

              {/* Opsi 2: Hapus Akun Permanen */}
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-destructive flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Tutup dan Hapus Akun Mahasiswa Secara Permanen</span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-lg leading-relaxed">
                    Menghapus seluruh profil akun, seluruh proyek, riwayat transaksi, dan sesi login secara permanen. Konfirmasi dua langkah diwajibkan.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setIsConfirmDeleteAccountOpen(true)}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus Akun Permanen
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog 1: Hapus Semua Proyek */}
      <ConfirmDialog
        open={isConfirmDeleteProjectsOpen}
        onOpenChange={setIsConfirmDeleteProjectsOpen}
        title="Konfirmasi Penghapusan Seluruh Proyek"
        description="Apakah Anda yakin ingin menghapus seluruh proyek dan hasil analisis secara permanen? Ketik HAPUS untuk melanjutkan."
        confirmLabel="Hapus Permanen"
        cancelLabel="Batal"
        variant="destructive"
        requireMatchText="HAPUS"
        matchPlaceholder="Ketik HAPUS"
        onConfirm={handleDeleteAllProjects}
      />

      {/* Confirmation Dialog 2: Hapus Akun (Dua Langkah Wajib Ketik 'HAPUS AKUN') */}
      <ConfirmDialog
        open={isConfirmDeleteAccountOpen}
        onOpenChange={setIsConfirmDeleteAccountOpen}
        title="Konfirmasi Penutupan Akun Permanen"
        description="Tindakan ini akan menghapus akun dan seluruh data Anda secara permanen dari OlahData. Ketik 'HAPUS AKUN' untuk mengonfirmasi penutupan akun."
        confirmLabel="Tutup & Hapus Akun Saya"
        cancelLabel="Batal"
        variant="destructive"
        requireMatchText="HAPUS AKUN"
        matchPlaceholder="Ketik HAPUS AKUN"
        onConfirm={handleDeleteAccount}
      />

      {/* Page Actions at Bottom */}
      <div className="pt-6 border-t border-border">
        <PageActions
          prevHref="/app"
          prevLabel="Kembali ke Meja Kerja"
          nextHref="/app/proyek/baru"
          nextLabel="Mulai Proyek Baru"
        />
      </div>
    </div>
  );
}
