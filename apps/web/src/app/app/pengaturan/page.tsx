'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useTheme } from '@/components/theme-provider';
import { deleteAllProjects } from '@/lib/api';
import type { ThemeMode } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useToast } from '@/components/ui/toaster';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  // Profile form state
  const [name, setName] = useState(user?.name || 'Budi Santoso');
  const [email, setEmail] = useState(user?.email || 'budi.santoso@kampus.ac.id');
  const [university, setUniversity] = useState(user?.university || 'Universitas Indonesia');
  const [department, setDepartment] = useState(user?.department || 'Manajemen');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Delete all dialog
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
        description: 'Perubahan data profil Anda berhasil disimpan.',
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Gagal Menyimpan',
        description: 'Terjadi kesalahan saat menyimpan profil.',
        variant: 'error',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteAllProjects = async () => {
    try {
      setIsDeleting(true);
      await deleteAllProjects();
      toast({
        title: 'Semua Data Proyek Dihapus',
        description: 'Seluruh riwayat proyek dan analisis Anda telah dibersihkan.',
        variant: 'default',
      });
    } catch {
      toast({
        title: 'Gagal Menghapus Data',
        description: 'Terjadi kesalahan saat menghapus data proyek.',
        variant: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const THEME_OPTIONS: { id: ThemeMode; label: string; icon: typeof Sun; desc: string }[] = [
    {
      id: 'light',
      label: 'Terang',
      icon: Sun,
      desc: 'Tampilan cerah dengan latar belakang Bone (#FAF8F4).',
    },
    {
      id: 'dark',
      label: 'Gelap',
      icon: Moon,
      desc: 'Tampilan kontras tinggi yang nyaman di malam hari (#141618).',
    },
    {
      id: 'system',
      label: 'Ikuti Sistem',
      icon: Laptop,
      desc: 'Menyesuaikan otomatis dengan preferensi sistem operasi Anda.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Pengaturan
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola profil akun mahasiswa, preferensi tema, dan manajemen data skripsi.
        </p>
      </div>

      <Tabs defaultValue="profil" className="w-full">
        <TabsList className="grid grid-cols-3 max-w-md h-11 p-1">
          <TabsTrigger value="profil" className="text-xs sm:text-sm flex items-center gap-1.5">
            <UserIcon className="h-4 w-4" />
            <span>Profil</span>
          </TabsTrigger>
          <TabsTrigger value="tampilan" className="text-xs sm:text-sm flex items-center gap-1.5">
            <Palette className="h-4 w-4" />
            <span>Tampilan</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="text-xs sm:text-sm flex items-center gap-1.5 text-destructive data-[state=active]:text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>Hapus Data</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Profil */}
        <TabsContent value="profil" className="space-y-4 pt-2">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-xl font-bold">
                Informasi Akun
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
                <Button type="submit" disabled={isSavingProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSavingProfile ? 'Menyimpan...' : 'Simpan Profil'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Tab 2: Tampilan */}
        <TabsContent value="tampilan" className="space-y-4 pt-2">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-xl font-bold">
                Preferensi Tampilan
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                Pilih tema warna aplikasi OlahData sesuai kenyamanan mata Anda saat menganalisis data.
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

        {/* Tab 3: Hapus Data (Area Bahaya) */}
        <TabsContent value="data" className="space-y-4 pt-2">
          <Card className="border-destructive/40 shadow-sm bg-card">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <CardTitle className="font-serif text-xl font-bold">
                  Area Bahaya: Hapus Data
                </CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                Tindakan di bawah ini bersifat permanen dan tidak dapat dipulihkan. Mohon pastikan Anda telah mengekspor atau menyimpan data penting sebelum menghapus.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-destructive">
                    Hapus Semua Data Proyek
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-lg leading-relaxed">
                    Menghapus seluruh daftar proyek, dataset kuesioner, riwayat versi pembersihan baris, dan hasil analisis statistik tersimpan dari penyimpanan lokal.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus Semua Proyek
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog requiring typing 'HAPUS' */}
      <ConfirmDialog
        open={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
        title="Konfirmasi Penghapusan Semua Data"
        description="Apakah Anda yakin ingin menghapus seluruh data proyek secara permanen? Tindakan ini akan mengosongkan seluruh proyek dan hasil hitung statistik Anda."
        confirmLabel="Hapus Permanen"
        cancelLabel="Batal"
        variant="destructive"
        requireMatchText="HAPUS"
        matchPlaceholder="Ketik HAPUS"
        onConfirm={handleDeleteAllProjects}
      />
    </div>
  );
}
