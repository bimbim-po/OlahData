'use client';

import * as React from 'react';
import {
  Lock,
  Mail,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Building,
  User as UserIcon,
  Phone,
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
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useUpgradeModal, PLAN_ENTITLEMENTS } from '@/lib/entitlements';
import { useToast } from '@/components/ui/toaster';
import type { SubscriptionPlan } from '@/lib/api/types';

export function UpgradeCheckoutModal() {
  const { isOpen, closeUpgradeModal, selectedPlan, triggerReason, projectId } = useUpgradeModal();
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [activePlan, setActivePlan] = React.useState<SubscriptionPlan>(selectedPlan || 'monthly');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

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

  // Submit to Waitlist API
  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!emailInput || !emailInput.includes('@')) {
      setErrorMessage('Harap masukkan alamat email kampus atau pribadi yang valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: nameInput || 'Mahasiswa',
        email: emailInput.trim().toLowerCase(),
        phone: phoneInput || null,
        university: universityInput || null,
        plan: activePlan,
        projectId: projectId || null,
        notes: `Pemicu aktivasi: ${triggerReason || 'Fitur berbayar'}`,
      };

      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mendaftar ke daftar tunggu.');
      }

      setIsSuccess(true);
      toast({
        title: 'Berhasil Masuk Daftar Tunggu',
        description: 'Email Anda telah tercatat. Tim OlahData akan segera memberikan akses aktivasi.',
        variant: 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala jaringan';
      setErrorMessage(msg);
      toast({
        title: 'Gagal Mendaftar',
        description: msg,
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setErrorMessage(null);
    closeUpgradeModal();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-[20px] border border-border shadow-2xl bg-card">
        {/* Header */}
        <div className="p-6 pb-4 bg-muted/30 border-b border-border/80">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <Badge variant="amber" className="text-[10px] rounded-[6px]">
                Tersedia di paket Bulanan/Skripsi
              </Badge>
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Daftar Tunggu Akses Fitur Skripsi
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
              {triggerReason ? (
                <span className="font-medium text-foreground block mb-0.5">
                  {triggerReason}
                </span>
              ) : null}
              Layanan payment gateway otomatis sedang dalam tahap integrasi akhir. Masukkan email Anda untuk mendapatkan prioritas aktivasi akun dari tim admin.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {isSuccess ? (
            /* Success Feedback State */
            <div className="text-center py-6 space-y-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h4 className="font-bold text-base text-foreground">
                  Terima Kasih! Anda Berada di Daftar Tunggu
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Permintaan aktivasi untuk email <strong className="text-foreground">{emailInput}</strong> telah tercatat pada sistem. Kami akan mengirimkan notifikasi dan kode akses saat kuota dibuka.
                </p>
              </div>
              <Button
                type="button"
                onClick={handleClose}
                className="text-xs font-semibold rounded-[10px] min-h-[40px] px-6 cursor-pointer"
              >
                Kembali ke Meja Kerja
              </Button>
            </div>
          ) : (
            /* Waitlist Form */
            <form onSubmit={handleWaitlistSubmit} className="space-y-4">
              {/* Plan Choice Selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActivePlan('monthly')}
                  className={cn(
                    'p-3 rounded-[12px] border text-left transition-all cursor-pointer',
                    activePlan === 'monthly'
                      ? 'border-primary bg-primary/10 ring-1 ring-primary'
                      : 'border-border bg-card hover:bg-muted/30'
                  )}
                >
                  <span className="font-semibold text-xs text-foreground block">
                    Paket Bulanan
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    Hingga 2.000 responden • Semua uji
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePlan('thesis')}
                  className={cn(
                    'p-3 rounded-[12px] border text-left transition-all cursor-pointer',
                    activePlan === 'thesis'
                      ? 'border-primary bg-primary/10 ring-1 ring-primary'
                      : 'border-border bg-card hover:bg-muted/30'
                  )}
                >
                  <span className="font-semibold text-xs text-foreground block">
                    Paket Skripsi
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    Hingga 10.000 responden • Multi-versi
                  </span>
                </button>
              </div>

              {/* Input Fields */}
              <div className="space-y-3 pt-1">
                <div>
                  <Label htmlFor="wl-email" className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1">
                    <Mail className="w-3.5 h-3.5 text-primary" />
                    Alamat Email (Wajib):
                  </Label>
                  <Input
                    id="wl-email"
                    type="email"
                    required
                    placeholder="nama@kampus.ac.id atau email pribadi"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="text-xs h-9 rounded-[8px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="wl-name" className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1">
                      <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      Nama Lengkap:
                    </Label>
                    <Input
                      id="wl-name"
                      type="text"
                      placeholder="Nama Anda"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="text-xs h-9 rounded-[8px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="wl-univ" className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1">
                      <Building className="w-3.5 h-3.5 text-muted-foreground" />
                      Universitas / Kampus:
                    </Label>
                    <Input
                      id="wl-univ"
                      type="text"
                      placeholder="Contoh: Universitas Indonesia"
                      value={universityInput}
                      onChange={(e) => setUniversityInput(e.target.value)}
                      className="text-xs h-9 rounded-[8px]"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="wl-phone" className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    Nomor WhatsApp (Opsional, untuk notifikasi langsung):
                  </Label>
                  <Input
                    id="wl-phone"
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="text-xs h-9 rounded-[8px]"
                  />
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs">
                  {errorMessage}
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-xs font-semibold h-10 rounded-[10px] cursor-pointer shadow-sm"
                >
                  {isSubmitting ? (
                    'Mendaftarkan...'
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      Gabung Daftar Tunggu Paket {targetPlanConfig.name}
                    </>
                  )}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center mt-2">
                  Tanpa pungutan biaya saat mendaftar. Akun beta yang telah disetujui admin otomatis membuka seluruh fitur.
                </p>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
