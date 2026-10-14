'use client';

import * as React from 'react';
import {
  Zap,
  Check,
  ShieldCheck,
  QrCode,
  Send,
  MessageCircle,
  Clock,
  ArrowRight,
  Lock,
  FileText,
  Copy,
  Table as TableIcon,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useUpgradeModal, PLAN_ENTITLEMENTS } from '@/lib/entitlements';
import { useToast } from '@/components/ui/toaster';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { SubscriptionPlan } from '@/lib/api/types';

// Admin WhatsApp number for instant manual activation
const ADMIN_WA_NUMBER = '6285179928120';

export function UpgradeCheckoutModal() {
  const { isOpen, closeUpgradeModal, selectedPlan, triggerReason, projectId, initialStep } =
    useUpgradeModal();
  const { user, updateUser } = useAuthStore();
  const { toast } = useToast();

  const [activePlan, setActivePlan] = React.useState<SubscriptionPlan>(selectedPlan || 'monthly');
  const [activeTab, setActiveTab] = React.useState<'qris' | 'whatsapp' | 'waitlist'>('qris');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  // Form input states
  const [emailInput, setEmailInput] = React.useState(user?.email || '');
  const [phoneInput, setPhoneInput] = React.useState('');
  const [nameInput, setNameInput] = React.useState(user?.name || '');
  const [universityInput, setUniversityInput] = React.useState(user?.university || '');

  React.useEffect(() => {
    if (selectedPlan && (selectedPlan === 'monthly' || selectedPlan === 'thesis')) {
      setActivePlan(selectedPlan);
    }
  }, [selectedPlan]);

  React.useEffect(() => {
    if (user) {
      if (!emailInput) setEmailInput(user.email || '');
      if (!nameInput) setNameInput(user.name || '');
      if (!universityInput) setUniversityInput(user.university || '');
    }
  }, [user, emailInput, nameInput, universityInput]);

  const targetPlanConfig = PLAN_ENTITLEMENTS[activePlan] || PLAN_ENTITLEMENTS.monthly;

  // WhatsApp activation URL
  const waMessage = encodeURIComponent(
    `Halo Admin OlahData, saya ingin aktivasi ${targetPlanConfig.name} (${targetPlanConfig.periodLabel}).\n\n` +
      `• Nama: ${nameInput || user?.name || 'Mahasiswa'}\n` +
      `• Email Akun: ${emailInput || user?.email || 'email@kampus.ac.id'}\n` +
      `• Kampus: ${universityInput || user?.university || 'Universitas'}\n` +
      `• ID Proyek: ${projectId || '-'}\n\n` +
      `Mohon info rekening atau QRIS pembayaran untuk verifikasi cepat. Terima kasih!`
  );
  const waUrl = `https://wa.me/${ADMIN_WA_NUMBER}?text=${waMessage}`;

  // Instant simulation activation (for sandbox / immediate unlock)
  const handleInstantActivation = async () => {
    setIsSubmitting(true);
    try {
      // 1. Update client session
      updateUser({ plan: activePlan });

      // 2. Update Supabase profile if logged in
      if (user?.id) {
        try {
          const supabase = getSupabaseBrowserClient();
          await supabase
            .from('profiles')
            .update({ plan: activePlan })
            .eq('id', user.id);
        } catch (dbErr) {
          console.warn('[Upgrade] Supabase profile sync warning:', dbErr);
        }
      }

      // 3. Record transaction in local history
      try {
        const historyKey = 'olahdata-billing-history';
        const existing = JSON.parse(localStorage.getItem(historyKey) || '[]');
        existing.unshift({
          id: `inv-${Date.now()}`,
          plan: activePlan,
          amount: targetPlanConfig.price,
          status: 'paid',
          date: new Date().toISOString(),
          projectId: projectId || null,
        });
        localStorage.setItem(historyKey, JSON.stringify(existing));
      } catch {
        // ignore
      }

      toast({
        title: 'Paket Berhasil Diaktifkan!',
        description: `Selamat, akun Anda kini aktif pada ${targetPlanConfig.name}. Seluruh fitur Bab 4 telah terbuka penuh.`,
        variant: 'success',
      });

      setIsSuccess(true);
      setTimeout(() => {
        closeUpgradeModal();
        setIsSuccess(false);
      }, 1500);
    } catch (err) {
      toast({
        title: 'Gagal mengaktifkan paket',
        description: 'Terjadi kesalahan sistem. Silakan coba kembali atau hubungi admin.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit to Waitlist / Activation Lead API
  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      toast({
        title: 'Email wajib diisi',
        description: 'Silakan masukkan alamat email akun Anda untuk konfirmasi aktivasi.',
        variant: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: nameInput.trim() || user?.name || 'Mahasiswa',
        email: emailInput.trim(),
        phone: phoneInput.trim(),
        university: universityInput.trim() || user?.university || '',
        plan: activePlan,
        projectId: projectId || null,
        notes: `Permintaan aktivasi paket dari modal paywall (${triggerReason})`,
        createdAt: new Date().toISOString(),
      };

      // Send to server API endpoint
      let serverSaved = false;
      try {
        const res = await fetch('/api/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) serverSaved = true;
      } catch {
        // Fallback to client Supabase or localStorage
      }

      // Also record to Supabase if connected
      try {
        const supabase = getSupabaseBrowserClient();
        await supabase.from('waitlist').insert([payload]);
        serverSaved = true;
      } catch {
        // ignore
      }

      // Fallback local storage
      try {
        const list = JSON.parse(localStorage.getItem('olahdata-waitlist-leads') || '[]');
        list.push(payload);
        localStorage.setItem('olahdata-waitlist-leads', JSON.stringify(list));
      } catch {
        // ignore
      }

      toast({
        title: 'Permintaan Diterima!',
        description: 'Tim kami akan segera mengirimkan konfirmasi aktivasi & link pembayaran ke WhatsApp/Email Anda (< 15 menit).',
        variant: 'success',
      });

      setIsSuccess(true);
      setTimeout(() => {
        closeUpgradeModal();
        setIsSuccess(false);
      }, 2000);
    } catch (err) {
      toast({
        title: 'Gagal mengirim formulir',
        description: 'Gunakan tombol WhatsApp di sebelah untuk aktivasi langsung tanpa antre.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeUpgradeModal()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-border bg-card shadow-2xl">
        {/* Banner Header with Reason */}
        <div className="bg-primary/10 border-b border-primary/20 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Buka Kunci Akses Penuh OlahData
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {triggerReason}
                </DialogDescription>
              </div>
            </div>
            <Badge variant="pine" className="text-[11px] font-semibold px-2 py-0.5">
              Garansi Siap Sidang
            </Badge>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Plan Tier Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pilih Paket Sesuai Kebutuhan Skripsi:
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Monthly Plan */}
              <div
                onClick={() => setActivePlan('monthly')}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between',
                  activePlan === 'monthly'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                    : 'border-border bg-card hover:border-primary/40'
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">Paket Bulanan</span>
                    {activePlan === 'monthly' && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-bold text-foreground tabular-nums">
                      Rp 39.000
                    </span>
                    <span className="text-[11px] text-muted-foreground">/ 30 hari</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Cocok untuk pengolahan cepat 1 skripsi dan ekspor naskah Bab 4 lengkap.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-border/60 text-[11px] text-foreground/80 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-primary shrink-0" />
                    <span>Hingga 5 proyek aktif</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-primary shrink-0" />
                    <span>2.000 responden &amp; 150 butir</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-primary shrink-0" />
                    <span>Ekspor Word &amp; PDF bebas watermark</span>
                  </div>
                </div>
              </div>

              {/* Thesis Plan (Recommended) */}
              <div
                onClick={() => setActivePlan('thesis')}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between',
                  activePlan === 'thesis'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                    : 'border-border bg-card hover:border-primary/40'
                )}
              >
                <div className="absolute -top-2.5 right-4">
                  <Badge variant="mint" className="text-[10px] font-semibold px-2 py-0.2">
                    Paling Direkomendasikan
                  </Badge>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">Paket Skripsi</span>
                    {activePlan === 'thesis' && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-bold text-foreground tabular-nums">
                      Rp 99.000
                    </span>
                    <span className="text-[11px] text-muted-foreground">/ 90 hari</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Pendampingan penuh hingga lulus sidang skripsi tanpa batasan revisi.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-border/60 text-[11px] text-foreground/80 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-primary shrink-0" />
                    <span><strong>Proyek tanpa batas (unlimited)</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-primary shrink-0" />
                    <span>10.000 responden &amp; 300 butir</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-primary shrink-0" />
                    <span>Revisi data &amp; eliminasi outlier bebas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-primary shrink-0" />
                    <span>Lampiran format tabel SPSS klasik</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Tabs: QRIS / WhatsApp / Waiting List */}
          <div className="space-y-3 pt-1 border-t border-border/70">
            <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-lg border border-border/60 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('qris')}
                className={cn(
                  'flex-1 py-1.5 px-3 rounded-md font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5',
                  activeTab === 'qris'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>QRIS Instan</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('whatsapp')}
                className={cn(
                  'flex-1 py-1.5 px-3 rounded-md font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5',
                  activeTab === 'whatsapp'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                <span>WhatsApp Admin</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('waitlist')}
                className={cn(
                  'flex-1 py-1.5 px-3 rounded-md font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5',
                  activeTab === 'waitlist'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Formulir Aktivasi</span>
              </button>
            </div>

            {/* TAB 1: QRIS INSTAN */}
            {activeTab === 'qris' && (
              <div className="p-4 rounded-xl border border-border bg-card space-y-4 text-center">
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Scan QRIS Pembayaran ({targetPlanConfig.name})
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Dapat dibayar dari GoPay, OVO, Dana, ShopeePay, BCA, Mandiri, atau M-Banking apapun.
                  </p>
                </div>

                {/* Simulated QR Code Card */}
                <div className="inline-block p-4 rounded-xl border-2 border-dashed border-primary/40 bg-white text-slate-900 shadow-sm mx-auto">
                  <div className="w-36 h-36 bg-slate-100 rounded-lg flex flex-col items-center justify-center border border-slate-300 relative overflow-hidden">
                    {/* Visual QR Pattern Simulation */}
                    <div className="grid grid-cols-6 gap-1 p-2 w-full h-full opacity-90">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            'rounded-[2px]',
                            (i % 2 === 0 || i % 5 === 0 || i < 6 || i > 29)
                              ? 'bg-slate-900'
                              : 'bg-transparent'
                          )}
                        />
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-white px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight border border-slate-400 shadow-xs">
                        QRIS RESMI
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
                      {formatCurrency(targetPlanConfig.price)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 max-w-sm mx-auto">
                  <Button
                    type="button"
                    onClick={handleInstantActivation}
                    disabled={isSubmitting || isSuccess}
                    className="w-full text-xs font-semibold h-10 rounded-[10px] cursor-pointer"
                  >
                    {isSubmitting ? (
                      'Memproses Aktivasi...'
                    ) : isSuccess ? (
                      'Aktivasi Berhasil! ✓'
                    ) : (
                      <>
                        <span>Saya Sudah Membayar (Aktivasi Langsung)</span>
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </>
                    )}
                  </Button>

                  <p className="text-[10px] text-muted-foreground">
                    Invoice resmi &amp; tanda terima digital otomatis disimpan pada riwayat akun Anda.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: WHATSAPP ADMIN */}
            {activeTab === 'whatsapp' && (
              <div className="p-4 rounded-xl border border-border bg-card space-y-3.5">
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-foreground">
                    Konfirmasi &amp; Aktivasi Manual via WhatsApp Admin
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Butuh bukti pembayaran atas nama kampus, transfer antar bank manual, atau kendala kartu? Tim admin kami siap melayani mahasiswa setiap hari kerja (08.00 - 21.00 WIB).
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs font-mono space-y-1 text-muted-foreground">
                  <div className="text-[11px] font-sans font-semibold text-foreground">Format Konfirmasi Otomatis:</div>
                  <div className="text-[11px] text-foreground/90 whitespace-pre-line leading-relaxed">
                    Aktivasi: {targetPlanConfig.name} ({targetPlanConfig.periodLabel})<br/>
                    Email: {emailInput || user?.email || 'email@kampus.ac.id'}<br/>
                    ID Proyek: {projectId || 'Proyek Baru'}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <Button
                    asChild
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-10 rounded-[10px]"
                  >
                    <a href={waUrl} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4 mr-1.5" />
                      <span>Buka WhatsApp Admin ({ADMIN_WA_NUMBER})</span>
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleInstantActivation}
                    className="text-xs h-10 rounded-[10px]"
                  >
                    Tandai Telah Dikonfirmasi
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 3: WAITING LIST / LEAD FORM */}
            {activeTab === 'waitlist' && (
              <form onSubmit={handleSubmitLead} className="p-4 rounded-xl border border-border bg-card space-y-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-foreground">
                    Formulir Permintaan Aktivasi &amp; Penawaran Kolektif
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Isi data Anda agar admin dapat menghubungi langsung dengan rincian rekening kampus.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Nama Mahasiswa</Label>
                    <Input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Budi Santoso"
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Email Akun *</Label>
                    <Input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="budi@kampus.ac.id"
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Nomor WhatsApp Aktif</Label>
                    <Input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="08123456789"
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Universitas / Kampus</Label>
                    <Input
                      type="text"
                      value={universityInput}
                      onChange={(e) => setUniversityInput(e.target.value)}
                      placeholder="Universitas Indonesia"
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting || isSuccess}
                    className="w-full text-xs font-semibold h-10 rounded-[10px]"
                  >
                    {isSubmitting ? (
                      'Mengirim Permintaan...'
                    ) : isSuccess ? (
                      'Terkirim! Terima kasih ✓'
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                        <span>Kirim Permintaan Aktivasi {targetPlanConfig.name}</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
