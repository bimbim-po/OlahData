'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  Sliders,
  Shield,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileText,
  UserPlus,
  Clock,
  HardDrive,
  Database,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ActionDialog } from '@/components/admin/action-dialog';

export default function PengaturanProdukPage() {
  // Feature Flags
  const [flags, setFlags] = useState({
    allowNewSignups: true,
    enableAiExplanation: true,
    enablePdfExport: true,
    maintenanceMode: false,
  });

  // App Config
  const [appConfig, setAppConfig] = useState({
    dataRetentionDays: 90,
    runTimeoutMinutes: 10,
    maxRunAttempts: 3,
  });

  // Plan Limits
  const [planLimits, setPlanLimits] = useState({
    free: {
      maxProjects: 1,
      maxDatasetsPerProject: 1,
      maxRespondents: 200,
      monthlyAnalyses: 5,
      watermark: true,
      allowExport: true,
    },
    monthly: {
      maxProjects: 20,
      maxDatasetsPerProject: 10,
      maxRespondents: 5000,
      monthlyAnalyses: 100,
      watermark: false,
      allowExport: true,
    },
    thesis: {
      maxProjects: 50,
      maxDatasetsPerProject: 20,
      maxRespondents: 10000,
      monthlyAnalyses: 300,
      watermark: false,
      allowExport: true,
    },
  });

  // Pending dialog action
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    title: string;
    description: string;
    actionLabel: string;
    variant?: 'default' | 'destructive';
    pendingUpdate: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    actionLabel: '',
    pendingUpdate: () => {},
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function triggerUpdateWithAudit(
    title: string,
    description: string,
    actionLabel: string,
    onConfirmCallback: () => void,
    variant: 'default' | 'destructive' = 'default'
  ) {
    setDialogState({
      open: true,
      title,
      description,
      actionLabel,
      variant,
      pendingUpdate: onConfirmCallback,
    });
  }

  function handleFlagToggle(key: keyof typeof flags, nextVal: boolean) {
    const labelMap: Record<keyof typeof flags, string> = {
      allowNewSignups: 'Pendaftaran Akun Baru',
      enableAiExplanation: 'Penjelasan AI Otomatis',
      enablePdfExport: 'Ekspor Dokumen PDF APA 7',
      maintenanceMode: 'Mode Perawatan Sistem (Maintenance)',
    };

    triggerUpdateWithAudit(
      `Ubah Feature Flag: ${labelMap[key]}`,
      `Perubahan ini akan langsung memengaruhi seluruh pengguna aplikasi di produksi. Status baru: ${nextVal ? 'AKTIF' : 'NONAKTIF'}. Wajib sertakan alasan audit.`,
      'Terapkan Perubahan',
      () => {
        setFlags((prev) => ({ ...prev, [key]: nextVal }));
        showToast(`Feature flag "${labelMap[key]}" berhasil diubah ke ${nextVal ? 'Aktif' : 'Nonaktif'}.`);
      },
      key === 'maintenanceMode' && nextVal ? 'destructive' : 'default'
    );
  }

  function handleSaveAppConfig() {
    triggerUpdateWithAudit(
      'Simpan Konfigurasi Operasional Sistem',
      'Memperbarui batas retensi data, batas timeout kalkulasi Python, dan batas percobaan antrean. Perubahan akan dicatat dalam admin audit log.',
      'Simpan Konfigurasi',
      () => {
        showToast('Konfigurasi operasional sistem berhasil disimpan dan diperbarui.');
      }
    );
  }

  function handleSavePlanLimits(tier: 'free' | 'monthly' | 'thesis') {
    const tierLabels = { free: 'Paket Gratis', monthly: 'Paket Bulanan', thesis: 'Paket Skripsi' };
    triggerUpdateWithAudit(
      `Simpan Kuota ${tierLabels[tier]}`,
      `Batas penggunaan untuk ${tierLabels[tier]} akan diperbarui. Mahasiswa dengan tier ini akan mengikuti batas baru saat analisis berikutnya.`,
      'Perbarui Kuota',
      () => {
        showToast(`Batas kuota untuk ${tierLabels[tier]} berhasil diperbarui.`);
      }
    );
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold tracking-tight">Pengaturan Produk</h1>
            <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs gap-1">
              <Shield className="w-3 h-3" /> Wajib Audit
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Konfigurasi batas paket (plan limits), fitur aktif (feature flags), dan parameter operasional sistem.
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-950/20 border border-emerald-800/40 rounded-lg flex items-center gap-2.5 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Feature Flags Section */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <CardTitle className="text-base font-medium">Feature Flags & Saklar Darurat</CardTitle>
          </div>
          <CardDescription>
            Kontrol rilis bertahap atau penutupan darurat fitur tanpa perlu proses redeploy kode.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Maintenance Mode */}
            <div className="p-4 rounded-lg border border-border bg-card/60 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Mode Perawatan (Maintenance)</span>
                  {flags.maintenanceMode ? (
                    <Badge variant="destructive" className="text-[10px]">Aktif</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">Normal</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Saat aktif, seluruh pengguna biasa akan melihat halaman pemeliharaan dan antrean analisis dihentikan sementara.
                </p>
              </div>
              <Switch
                checked={flags.maintenanceMode}
                onCheckedChange={(val) => handleFlagToggle('maintenanceMode', val)}
              />
            </div>

            {/* Allow Signups */}
            <div className="p-4 rounded-lg border border-border bg-card/60 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Pendaftaran Akun Baru</span>
                  <Badge variant="outline" className={flags.allowNewSignups ? 'text-emerald-600 border-emerald-500/30 text-[10px]' : 'text-amber-600 border-amber-500/30 text-[10px]'}>
                    {flags.allowNewSignups ? 'Buka' : 'Ditutup'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Izinkan pendaftaran mandiri mahasiswa baru. Matikan jika kapasitas server penuh atau ada migrasi besar.
                </p>
              </div>
              <Switch
                checked={flags.allowNewSignups}
                onCheckedChange={(val) => handleFlagToggle('allowNewSignups', val)}
              />
            </div>

            {/* AI Explanation */}
            <div className="p-4 rounded-lg border border-border bg-card/60 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Penjelasan AI (LLM Naratif)</span>
                  <Badge variant="outline" className={flags.enableAiExplanation ? 'text-indigo-600 border-indigo-500/30 text-[10px]' : 'text-muted-foreground text-[10px]'}>
                    {flags.enableAiExplanation ? 'Aktif' : 'Mati'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Menghasilkan kalimat interpretasi akademik dari angka uji statistik dengan penjaga angka (Number Guard).
                </p>
              </div>
              <Switch
                checked={flags.enableAiExplanation}
                onCheckedChange={(val) => handleFlagToggle('enableAiExplanation', val)}
              />
            </div>

            {/* PDF Export */}
            <div className="p-4 rounded-lg border border-border bg-card/60 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Ekspor Dokumen PDF APA 7</span>
                  <Badge variant="outline" className={flags.enablePdfExport ? 'text-emerald-600 border-emerald-500/30 text-[10px]' : 'text-muted-foreground text-[10px]'}>
                    {flags.enablePdfExport ? 'Aktif' : 'Mati'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Izinkan pengguna mengunduh laporan skripsi langsung dalam format PDF standar akademik.
                </p>
              </div>
              <Switch
                checked={flags.enablePdfExport}
                onCheckedChange={(val) => handleFlagToggle('enablePdfExport', val)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operational Limits (app_config) */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-base font-medium">Parameter Operasional & Retensi (app_config)</CardTitle>
          </div>
          <CardDescription>
            Batas waktu eksekusi antrean statistik dan masa penyimpanan dataset sesuai kepatuhan privasi data penelitian.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-2">
              <Label htmlFor="retention" className="text-xs font-medium flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-muted-foreground" />
                Masa Retensi Data (Hari)
              </Label>
              <Input
                id="retention"
                type="number"
                min={30}
                max={365}
                value={appConfig.dataRetentionDays}
                onChange={(e) =>
                  setAppConfig((prev) => ({ ...prev, dataRetentionDays: Number(e.target.value) }))
                }
              />
              <p className="text-[11px] text-muted-foreground">
                Dataset non-aktif akan diarsipkan otomatis setelah melewati jumlah hari ini (default: 90 hari).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeout" className="text-xs font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                Timeout Eksekusi Hitung (Menit)
              </Label>
              <Input
                id="timeout"
                type="number"
                min={2}
                max={60}
                value={appConfig.runTimeoutMinutes}
                onChange={(e) =>
                  setAppConfig((prev) => ({ ...prev, runTimeoutMinutes: Number(e.target.value) }))
                }
              />
              <p className="text-[11px] text-muted-foreground">
                Batas waktu maksimal satu antrean perhitungan statistik Python sebelum dinyatakan timed out (default: 10 menit).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="attempts" className="text-xs font-medium flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                Batas Percobaan Ulang (Attempts)
              </Label>
              <Input
                id="attempts"
                type="number"
                min={1}
                max={5}
                value={appConfig.maxRunAttempts}
                onChange={(e) =>
                  setAppConfig((prev) => ({ ...prev, maxRunAttempts: Number(e.target.value) }))
                }
              />
              <p className="text-[11px] text-muted-foreground">
                Maksimal percobaan worker saat terjadi kegagalan jaringan atau timeout sementara (default: 3 kali).
              </p>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <Button onClick={handleSaveAppConfig} className="gap-2 text-xs">
              <Save className="w-3.5 h-3.5" />
              Simpan Parameter Operasional
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plan Limits (plan_limits) */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base font-medium">Batas & Kuota Paket (plan_limits)</CardTitle>
          </div>
          <CardDescription>
            Tentukan kuota proyek, jumlah responden, watermark, dan ekspor dokumen per tingkatan paket.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="free" className="space-y-4">
            <TabsList className="grid grid-cols-3 max-w-md">
              <TabsTrigger value="free">Gratis (Free)</TabsTrigger>
              <TabsTrigger value="monthly">Bulanan</TabsTrigger>
              <TabsTrigger value="thesis">Paket Skripsi</TabsTrigger>
            </TabsList>

            {/* Free Tier */}
            <TabsContent value="free" className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Maksimal Proyek</Label>
                  <Input
                    type="number"
                    value={planLimits.free.maxProjects}
                    onChange={(e) =>
                      setPlanLimits((prev) => ({
                        ...prev,
                        free: { ...prev.free, maxProjects: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Dataset per Proyek</Label>
                  <Input
                    type="number"
                    value={planLimits.free.maxDatasetsPerProject}
                    onChange={(e) =>
                      setPlanLimits((prev) => ({
                        ...prev,
                        free: { ...prev.free, maxDatasetsPerProject: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Maksimal Responden (Baris)</Label>
                  <Input
                    type="number"
                    value={planLimits.free.maxRespondents}
                    onChange={(e) =>
                      setPlanLimits((prev) => ({
                        ...prev,
                        free: { ...prev.free, maxRespondents: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Analisis per Bulan</Label>
                  <Input
                    type="number"
                    value={planLimits.free.monthlyAnalyses}
                    onChange={(e) =>
                      setPlanLimits((prev) => ({
                        ...prev,
                        free: { ...prev.free, monthlyAnalyses: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={planLimits.free.watermark}
                    onCheckedChange={(val) =>
                      setPlanLimits((prev) => ({
                        ...prev,
                        free: { ...prev.free, watermark: val },
                      }))
                    }
                  />
                  <Label className="text-xs font-medium">Terapkan Watermark Hasil Analisis</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={planLimits.free.allowExport}
                    onCheckedChange={(val) =>
                      setPlanLimits((prev) => ({
                        ...prev,
                        free: { ...prev.free, allowExport: val },
                      }))
                    }
                  />
                  <Label className="text-xs font-medium">Izinkan Ekspor Dokumen</Label>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button onClick={() => handleSavePlanLimits('free')} variant="outline" className="gap-2 text-xs">
                  <Save className="w-3.5 h-3.5" />
                  Simpan Batas Paket Gratis
                </Button>
              </div>
            </TabsContent>

            {/* Monthly Tier */}
            <TabsContent value="monthly" className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Maksimal Proyek</Label>
                  <Input
                    type="number"
                    value={planLimits.monthly.maxProjects}
                    onChange={(e) =>
                      setPlanLimits((prev) => ({
                        ...prev,
                        monthly: { ...prev.monthly, maxProjects: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Dataset per Proyek</Label>
                  <Input
                    type="number"
                    value={planLimits.monthly.maxDatasetsPerProject}
                    onChange={(e) =>
                      setPlanLimits((prev) => ({
                        ...prev,
                        monthly: { ...prev.monthly, maxDatasetsPerProject: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Maksimal Responden (Baris)</Label>
                  <Input
                    type="number"
                    value={planLimits.monthly.maxRespondents}
                    onChange={(e) =>
                      setPlanLimits((prev) => ({
                        ...prev,
                        monthly: { ...prev.monthly, maxRespondents: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Analisis per Bulan</Label>
                  <Input
                    type="number"
                    value={planLimits.monthly.monthlyAnalyses}
                    onChange={(e) =>
                      setPlanLimits((prev) => ({
                        ...prev,
                        monthly: { ...prev.monthly, monthlyAnalyses: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={planLimits.monthly.watermark}
                    onCheckedChange={(val) =>
                      setPlanLimits((prev) => ({
                        ...prev,
                        monthly: { ...prev.monthly, watermark: val },
                      }))
                    }
                  />
                  <Label className="text-xs font-medium">Terapkan Watermark</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={planLimits.monthly.allowExport}
                    onCheckedChange={(val) =>
                      setPlanLimits((prev) => ({
                        ...prev,
                        monthly: { ...prev.monthly, allowExport: val },
                      }))
                    }
                  />
                  <Label className="text-xs font-medium">Izinkan Ekspor Dokumen</Label>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button onClick={() => handleSavePlanLimits('monthly')} variant="outline" className="gap-2 text-xs">
                  <Save className="w-3.5 h-3.5" />
                  Simpan Batas Paket Bulanan
                </Button>
              </div>
            </TabsContent>

            {/* Thesis Tier */}
            <TabsContent value="thesis" className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Maksimal Proyek</Label>
                  <Input
                    type="number"
                    value={planLimits.thesis.maxProjects}
                    onChange={(e) =>
                      setPlanLimits((prev) => ({
                        ...prev,
                        thesis: { ...prev.thesis, maxProjects: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Dataset per Proyek</Label>
                  <Input
                    type="number"
                    value={planLimits.thesis.maxDatasetsPerProject}
                    onChange={(e) =>
                      setPlanLimits((prev) => ({
                        ...prev,
                        thesis: { ...prev.thesis, maxDatasetsPerProject: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Maksimal Responden (Baris)</Label>
                  <Input
                    type="number"
                    value={planLimits.thesis.maxRespondents}
                    onChange={(e) =>
                      setPlanLimits((prev) => ({
                        ...prev,
                        thesis: { ...prev.thesis, maxRespondents: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Analisis per Bulan</Label>
                  <Input
                    type="number"
                    value={planLimits.thesis.monthlyAnalyses}
                    onChange={(e) =>
                      setPlanLimits((prev) => ({
                        ...prev,
                        thesis: { ...prev.thesis, monthlyAnalyses: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={planLimits.thesis.watermark}
                    onCheckedChange={(val) =>
                      setPlanLimits((prev) => ({
                        ...prev,
                        thesis: { ...prev.thesis, watermark: val },
                      }))
                    }
                  />
                  <Label className="text-xs font-medium">Terapkan Watermark</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={planLimits.thesis.allowExport}
                    onCheckedChange={(val) =>
                      setPlanLimits((prev) => ({
                        ...prev,
                        thesis: { ...prev.thesis, allowExport: val },
                      }))
                    }
                  />
                  <Label className="text-xs font-medium">Izinkan Ekspor Dokumen</Label>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button onClick={() => handleSavePlanLimits('thesis')} variant="outline" className="gap-2 text-xs">
                  <Save className="w-3.5 h-3.5" />
                  Simpan Batas Paket Skripsi
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Mandatory Audit Modal */}
      <ActionDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((prev) => ({ ...prev, open }))}
        title={dialogState.title}
        description={dialogState.description}
        actionLabel={dialogState.actionLabel}
        variant={dialogState.variant}
        onConfirm={async ({ reason }) => {
          dialogState.pendingUpdate();
        }}
      />
    </div>
  );
}
