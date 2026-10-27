'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  User as UserIcon,
  Phone,
  ExternalLink,
  QrCode,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  UserCheck,
  ArrowRight,
  Sparkles,
  RefreshCw,
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
import type { SubscriptionPlan, User } from '@/lib/api/types';
import { login as apiLogin, register as apiRegister } from '@/lib/api';
import {
  loadMidtransSnapScript,
  createMidtransCheckoutSession,
  syncPaidPlanToSupabase,
  checkMidtransOrderStatus,
} from '@/lib/midtrans-snap';

type AuthTab = 'register' | 'login';

export function UpgradeCheckoutModal() {
  const router = useRouter();
  const { isOpen, closeUpgradeModal, selectedPlan, triggerReason } = useUpgradeModal();
  const { user, login: authLogin, updateUser } = useAuthStore();
  const { toast } = useToast();

  const [activePlan, setActivePlan] = React.useState<SubscriptionPlan>(selectedPlan || 'monthly');
  const [authTab, setAuthTab] = React.useState<AuthTab>('register');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const [pendingSession, setPendingSession] = React.useState<{
    invoiceNumber: string;
    paymentUrl: string;
    amountIdr: number;
    userId?: string;
    isSandbox?: boolean;
  } | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Form input states
  const [emailInput, setEmailInput] = React.useState(user?.email || '');
  const [passwordInput, setPasswordInput] = React.useState('');
  const [phoneInput, setPhoneInput] = React.useState('');
  const [nameInput, setNameInput] = React.useState(user?.name || '');
  const [universityInput, setUniversityInput] = React.useState(user?.university || '');
  const hasInitializedRef = React.useRef(false);

  React.useEffect(() => {
    if (selectedPlan && (selectedPlan === 'monthly' || selectedPlan === 'thesis')) {
      setActivePlan(selectedPlan);
    }
  }, [selectedPlan]);

  // Inisialisasi awal formulir saat modal dibuka pertama kali.
  React.useEffect(() => {
    if (isOpen) {
      if (!hasInitializedRef.current) {
        setEmailInput(user?.email || '');
        setNameInput(user?.name || '');
        setUniversityInput(user?.university || '');
        setPasswordInput('');
        setShowPassword(false);
        hasInitializedRef.current = true;
      }
    } else {
      hasInitializedRef.current = false;
      setErrorMessage(null);
    }
  }, [isOpen, user]);

  const targetPlanConfig = PLAN_ENTITLEMENTS[activePlan] || PLAN_ENTITLEMENTS.monthly;

  const activatePlanAfterPayment = async (orderId?: string, amountIdr?: number, targetUserId?: string) => {
    const effectiveId = targetUserId || user?.id;
    updateUser({ plan: activePlan });
    await syncPaidPlanToSupabase(activePlan, orderId, amountIdr, effectiveId);
    setPendingSession(null);
    setIsSuccess(true);
    toast({
      title: 'Pembayaran Berhasil Diverifikasi!',
      description: `Paket ${targetPlanConfig.name} kini aktif penuh di akun Anda.`,
      variant: 'success',
    });
  };

  const handleVerifyPayment = async () => {
    if (!pendingSession?.invoiceNumber) return;
    setIsVerifyingPayment(true);
    try {
      const result = await checkMidtransOrderStatus(pendingSession.invoiceNumber);
      if (result.status === 'paid') {
        await activatePlanAfterPayment(
          pendingSession.invoiceNumber,
          pendingSession.amountIdr,
          pendingSession.userId
        );
      } else if (pendingSession.isSandbox) {
        // Mode Sandbox: izinkan pengujian langsung
        await activatePlanAfterPayment(
          pendingSession.invoiceNumber,
          pendingSession.amountIdr,
          pendingSession.userId
        );
      } else {
        toast({
          title: 'Pembayaran Belum Terkonfirmasi',
          description:
            'Sistem belum mendeteksi transfer masuk dari bank atau e-wallet. Mohon tunggu 15-30 detik lalu klik kembali.',
          variant: 'error',
        });
      }
    } catch {
      toast({
        title: 'Kendala Koneksi',
        description: 'Terjadi kendala saat memeriksa status pembayaran ke Midtrans.',
        variant: 'error',
      });
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const handleMidtransCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const resolvedEmail = emailInput.trim().toLowerCase();
    if (!resolvedEmail || !resolvedEmail.includes('@')) {
      setErrorMessage('Harap masukkan alamat email yang valid.');
      return;
    }

    setIsSubmitting(true);

    try {
      let activeUser: User | null = user;

      // Jika pengunjung belum login di peramban, buat akun baru atau login ke akun lama terlebih dahulu
      if (!activeUser) {
        if (!passwordInput || passwordInput.length < 6) {
          setErrorMessage('Kata sandi wajib diisi minimal 6 karakter.');
          setIsSubmitting(false);
          return;
        }

        if (authTab === 'register') {
          // Buat akun baru via API & Supabase Admin
          const resolvedName = nameInput.trim() || 'Mahasiswa OlahData';
          const resolvedCampus = universityInput.trim() || 'Universitas';

          try {
            const newUser = await apiRegister(resolvedName, resolvedEmail, passwordInput, resolvedCampus);
            authLogin(newUser);
            activeUser = newUser;
          } catch (regErr: unknown) {
            const msg = regErr instanceof Error ? regErr.message : 'Gagal mendaftarkan akun baru.';
            // Jika email ternyata sudah terdaftar, beri tahu user untuk beralih ke tab 'Sudah Punya Akun'
            if (msg.toLowerCase().includes('sudah terdaftar')) {
              setErrorMessage('Email ini sudah terdaftar. Silakan beralih ke tab "Sudah Punya Akun" di atas untuk masuk.');
              setAuthTab('login');
              setIsSubmitting(false);
              return;
            }
            throw new Error(msg);
          }
        } else {
          // Tab "Sudah Punya Akun" -> Verifikasi login
          try {
            const existingUser = await apiLogin(resolvedEmail, passwordInput);
            authLogin(existingUser);
            activeUser = existingUser;
          } catch (loginErr: unknown) {
            const msg = loginErr instanceof Error ? loginErr.message : 'Email atau kata sandi tidak sesuai.';
            setErrorMessage(msg);
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Pastikan ada userId untuk Midtrans metadata & database link
      const resolvedName = activeUser?.name || nameInput.trim() || 'Mahasiswa OlahData';
      const resolvedUserId = activeUser?.id;

      const session = await createMidtransCheckoutSession({
        plan: activePlan,
        customerName: resolvedName,
        customerEmail: resolvedEmail,
        customerPhone: phoneInput.trim() || '081234567890',
        userId: resolvedUserId,
      });

      await loadMidtransSnapScript(session.clientKey, !session.isSandbox);

      if (typeof window !== 'undefined' && window.snap) {
        closeUpgradeModal();
        window.snap.pay(session.snapToken, {
          onSuccess: async (result) => {
            await activatePlanAfterPayment(
              result.order_id || session.invoiceNumber,
              session.amountIdr,
              resolvedUserId
            );
          },
          onPending: () => {
            setPendingSession({
              invoiceNumber: session.invoiceNumber,
              paymentUrl: session.paymentUrl,
              amountIdr: session.amountIdr,
              userId: resolvedUserId,
            });
            toast({
              title: 'Menunggu Penyelesaian Pembayaran',
              description: `Tagihan ${session.invoiceNumber} telah dibuat. Selesaikan pembayaran di Simulator Midtrans atau jendela Snap.`,
              variant: 'default',
            });
          },
          onError: () => {
            toast({
              title: 'Pembayaran Gagal',
              description: 'Terjadi kendala saat memproses pembayaran di Midtrans.',
              variant: 'error',
            });
          },
          onClose: () => {
            // Pengguna menutup popup Snap sebelum selesai
          },
        });
      } else if (session.paymentUrl) {
        window.open(session.paymentUrl, '_blank', 'noopener,noreferrer');
        setPendingSession({
          invoiceNumber: session.invoiceNumber,
          paymentUrl: session.paymentUrl,
          amountIdr: session.amountIdr,
          userId: resolvedUserId,
          isSandbox: session.isSandbox,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memulai pembayaran Midtrans.';
      setErrorMessage(msg);
      toast({
        title: 'Gagal Memulai Checkout',
        description: msg,
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setPendingSession(null);
    setErrorMessage(null);
    closeUpgradeModal();
  };

  const handleGoToApp = () => {
    handleClose();
    router.push('/app');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-[20px] border border-border shadow-2xl bg-card">
        {/* Header */}
        <div className="p-6 pb-4 bg-muted/30 border-b border-border/80">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <Badge variant="pine" className="text-[10px] rounded-[6px]">
                  Midtrans Payment Gateway (QRIS & Virtual Account)
                </Badge>
              </div>
              <Badge variant="amber" className="text-[10px] font-mono rounded-[6px]">
                SANDBOX AKTIF
              </Badge>
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Upgrade Paket OlahData Skripsi
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
              {triggerReason ? (
                <span className="font-medium text-foreground block mb-0.5">
                  {triggerReason}
                </span>
              ) : null}
              Pilih paket dan bayar instan menggunakan QRIS (GoPay/ShopeePay/DANA) atau Virtual Account Bank (BCA, Mandiri, BNI, BRI) via Midtrans.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {isSuccess ? (
            <div className="text-center py-6 space-y-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2 max-w-sm mx-auto">
                <h4 className="font-bold text-base text-foreground">
                  Paket {targetPlanConfig.name} Berhasil Diaktifkan!
                </h4>
                <div className="p-3 bg-muted/40 rounded-xl border border-border text-xs text-left space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Tertaut ke Akun:</span>
                    <span className="font-semibold text-foreground">{user?.email || emailInput}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Status Paket:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Aktif Penuh</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Akun Anda telah terkonfigurasi. Kapan pun Anda login menggunakan email dan kata sandi ini, paket otomatis aktif tanpa perlu verifikasi ulang.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <Button
                  type="button"
                  onClick={handleGoToApp}
                  className="text-xs font-semibold rounded-[10px] min-h-[40px] px-6 cursor-pointer gap-2"
                >
                  <span>Mulai Olah Data Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="text-xs font-semibold rounded-[10px] min-h-[40px] px-4 cursor-pointer"
                >
                  Tutup
                </Button>
              </div>
            </div>
          ) : pendingSession ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-2 text-xs">
                <p className="font-bold text-foreground">
                  Tagihan Pembayaran Dibuat: <span className="font-mono">{pendingSession.invoiceNumber}</span>
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {pendingSession.isSandbox
                    ? 'Untuk menguji pembayaran di mode Sandbox, buka jendela pembayaran Midtrans atau gunakan Simulator Resmi Midtrans, lalu konfirmasi di bawah.'
                    : 'Silakan selesaikan pembayaran tagihan Anda melalui QRIS atau Virtual Account di jendela Midtrans. Setelah transfer berhasil, klik tombol verifikasi di bawah.'}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    asChild
                    className="h-8 text-xs gap-1.5"
                  >
                    <a href={pendingSession.paymentUrl} target="_blank" rel="noopener noreferrer">
                      <span>Buka Halaman Pembayaran Midtrans</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </Button>
                  {pendingSession.isSandbox && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-8 text-xs gap-1.5 text-muted-foreground"
                    >
                      <a
                        href="https://simulator.sandbox.midtrans.com"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>Buka Simulator Sandbox</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              <Button
                type="button"
                disabled={isVerifyingPayment}
                onClick={handleVerifyPayment}
                className="w-full h-10 text-xs font-semibold rounded-[10px]"
              >
                {isVerifyingPayment ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Memeriksa Konfirmasi Bank...
                  </span>
                ) : (
                  <span>Saya Sudah Selesai Membayar — Cek &amp; Aktifkan Paket</span>
                )}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleMidtransCheckout} className="space-y-4">
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
                    Paket Bulanan (Rp 39.000)
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    1 Proyek Skripsi • Maks. 500 responden
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
                    Paket Skripsi (Rp 99.000)
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    3 Proyek Aktif • Hingga 2.500 responden
                  </span>
                </button>
              </div>

              {/* Akun Pengguna / Form Autentikasi */}
              {user ? (
                // Jika sudah login: tampilkan kartu ringkas akun aktif
                <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Akun Terhubung:
                    </span>
                    <Badge variant="pine" className="text-[10px] py-0 px-2">
                      Siap Ditautkan
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{user.name}</span> ({user.email})
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Paket {targetPlanConfig.name} akan otomatis terhubung langsung ke akun Anda ini.
                  </p>
                </div>
              ) : (
                // Jika belum login: sediakan Tab Switcher (Daftar Akun Baru vs Sudah Punya Akun)
                <div className="space-y-3 pt-1 border-t border-border/60">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        Tautkan Paket ke Akun Anda:
                      </Label>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Sistem memerlukan email dan kata sandi agar saat Anda login nanti, paket ini langsung aktif dan dapat digunakan.
                    </p>
                  </div>

                  {/* Switcher Tab: Daftar vs Sudah Punya Akun */}
                  <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-xl border border-border/80">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('register');
                        setErrorMessage(null);
                      }}
                      className={cn(
                        'flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                        authTab === 'register'
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Daftar Akun Baru</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('login');
                        setErrorMessage(null);
                      }}
                      className={cn(
                        'flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                        authTab === 'login'
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sudah Punya Akun</span>
                    </button>
                  </div>

                  {/* Form Input Dinamis Berdasarkan Tab */}
                  <div className="space-y-3 pt-1">
                    {authTab === 'register' && (
                      <div>
                        <Label
                          htmlFor="mt-name"
                          className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
                          Nama Lengkap:
                        </Label>
                        <Input
                          id="mt-name"
                          type="text"
                          required
                          placeholder="Nama Lengkap Anda"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          className="text-xs h-9 rounded-[8px]"
                        />
                      </div>
                    )}

                    <div>
                      <Label
                        htmlFor="mt-email"
                        className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1"
                      >
                        <Mail className="w-3.5 h-3.5 text-primary" />
                        Alamat Email Akun:
                      </Label>
                      <Input
                        id="mt-email"
                        type="email"
                        required
                        placeholder="nama@gmail.com atau email kampus"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="text-xs h-9 rounded-[8px]"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="mt-password"
                        className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1"
                      >
                        <Lock className="w-3.5 h-3.5 text-primary" />
                        {authTab === 'register' ? 'Buat Kata Sandi Akun (min. 6 karakter):' : 'Kata Sandi Akun:'}
                      </Label>
                      <div className="relative">
                        <Input
                          id="mt-password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder={authTab === 'register' ? 'Minimal 6 karakter' : 'Masukkan kata sandi Anda'}
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          className="text-xs h-9 rounded-[8px] pr-9"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
                          aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {authTab === 'register'
                          ? 'Gunakan kata sandi ini untuk login kapan saja setelah paket dibayar.'
                          : 'Masukkan kata sandi akun yang sudah pernah Anda daftarkan.'}
                      </p>
                    </div>

                    <div>
                      <Label
                        htmlFor="mt-phone"
                        className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1"
                      >
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        Nomor WhatsApp (Opsional untuk info bukti transfer):
                      </Label>
                      <Input
                        id="mt-phone"
                        type="tel"
                        placeholder="Contoh: 081234567890"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="text-xs h-9 rounded-[8px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs">
                  {errorMessage}
                </div>
              )}

              <div className="pt-2 space-y-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-xs font-semibold h-10 rounded-[10px] cursor-pointer shadow-sm gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Menghubungkan Akun & Midtrans...'
                      : `Bayar ${targetPlanConfig.name} (Rp ${targetPlanConfig.price.toLocaleString('id-ID')}) via Midtrans`}
                  </span>
                </Button>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground text-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>
                    Aman & instan via Midtrans (QRIS, GoPay, ShopeePay, BCA, Mandiri, BNI, BRI).
                  </span>
                </div>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
