'use client';

import React, { useEffect, useState } from 'react';
import {
  Zap,
  CreditCard,
  QrCode,
  Building,
  CheckCircle2,
  Calendar,
  Layers,
  Users,
  ShieldCheck,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { getBillingHistory } from '@/lib/api';
import type { BillingRecord, SubscriptionPlan } from '@/lib/api/types';
import { useAuthStore } from '@/stores/auth-store';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toaster';
import { PLANS, getPlanConfig } from '@/lib/plans';
import {
  loadMidtransSnapScript,
  createMidtransCheckoutSession,
  syncPaidPlanToSupabase,
} from '@/lib/midtrans-snap';


const PAYMENT_METHODS = [
  { id: 'qris', name: 'QRIS (Gopay, OVO, ShopeePay, Dana)', icon: QrCode },
  { id: 'bca', name: 'Virtual Account BCA', icon: Building },
  { id: 'mandiri', name: 'Virtual Account Mandiri', icon: Building },
  { id: 'bni', name: 'Virtual Account BNI', icon: Building },
];

export default function SubscriptionPage() {
  const { user, updateUser } = useAuthStore();
  const { toast } = useToast();

  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [loadingBilling, setLoadingBilling] = useState(true);

  // Simulation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlan>('monthly');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('qris');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    async function loadBilling() {
      try {
        setLoadingBilling(true);
        const data = await getBillingHistory();
        setBillingHistory(data);
      } catch {
        toast({
          title: 'Gagal memuat riwayat tagihan',
          description: 'Tidak dapat mengambil riwayat tagihan akun.',
          variant: 'error',
        });
      } finally {
        setLoadingBilling(false);
      }
    }
    loadBilling();
  }, [toast]);

  const currentPlan = PLANS.find((p) => p.id === (user?.plan || 'free')) || PLANS[0];

  const handleSimulatePayment = async () => {
    try {
      setIsProcessingPayment(true);
      const chosenPlan = PLANS.find((p) => p.id === selectedPlanId);

      const session = await createMidtransCheckoutSession({
        plan: selectedPlanId,
        customerName: user?.name || 'Mahasiswa OlahData',
        customerEmail: user?.email || 'mahasiswa@olahdata.id',
        userId: user?.id,
      });

      await loadMidtransSnapScript(session.clientKey, !session.isSandbox);

      const finalizePaid = async (orderId: string) => {
        updateUser({ plan: selectedPlanId });
        await syncPaidPlanToSupabase(selectedPlanId, orderId, session.amountIdr);
        if (chosenPlan && chosenPlan.price > 0) {
          const newRecord: BillingRecord = {
            id: orderId,
            date: new Date().toISOString().split('T')[0],
            description: `${chosenPlan.name} (Midtrans #${orderId})`,
            amount: chosenPlan.price,
            status: 'paid',
          };
          setBillingHistory((prev) => [newRecord, ...prev]);
        }
        toast({
          title: 'Pembayaran Midtrans Berhasil!',
          description: `Paket Anda kini telah ditingkatkan ke "${chosenPlan?.name}".`,
          variant: 'success',
        });
      };

      if (typeof window !== 'undefined' && window.snap) {
        setIsModalOpen(false);
        window.snap.pay(session.snapToken, {
          onSuccess: async (res) => {
            await finalizePaid(res.order_id || session.invoiceNumber);
          },
          onPending: () => {
            if (chosenPlan && chosenPlan.price > 0) {
              const pendingRecord: BillingRecord = {
                id: session.invoiceNumber,
                date: new Date().toISOString().split('T')[0],
                description: `${chosenPlan.name} (Midtrans #${session.invoiceNumber})`,
                amount: chosenPlan.price,
                status: 'pending',
              };
              setBillingHistory((prev) => [pendingRecord, ...prev]);
            }
            toast({
              title: 'Menunggu Pembayaran Midtrans',
              description: `Tagihan ${session.invoiceNumber} dibuat. Selesaikan pembayaran di Simulator Midtrans Sandbox.`,
              variant: 'default',
            });
          },
          onError: () => {
            toast({
              title: 'Pembayaran Midtrans Gagal',
              description: 'Transaksi tidak dapat diselesaikan.',
              variant: 'error',
            });
          },
        });
      } else {
        await finalizePaid(session.invoiceNumber);
        setIsModalOpen(false);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Terjadi kesalahan saat menghubungi Midtrans.';
      toast({
        title: 'Gagal Memulai Pembayaran',
        description: msg,
        variant: 'error',
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getBillingStatusBadge = (status: BillingRecord['status']) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Lunas</Badge>;
      case 'pending':
        return <Badge variant="warning">Menunggu</Badge>;
      case 'failed':
      default:
        return <Badge variant="destructive">Gagal</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Langganan & Kuota
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pantau status paket aktif, kuota analisis skripsi, dan simulasi pembayaran.
        </p>
      </div>

      {/* Grid: Paket Aktif & Pemakaian Kuota */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Plan Card */}
        <Card className="border-border shadow-sm flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Paket Aktif
              </span>
              <Badge
                variant={currentPlan.id === 'free' ? 'secondary' : 'success'}
                className="font-bold uppercase tracking-wider text-[11px]"
              >
                {currentPlan.name}
              </Badge>
            </div>
            <CardTitle className="font-serif text-2xl font-bold text-foreground mt-2">
              {currentPlan.name}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {currentPlan.id === 'free'
                ? 'Paket dasar gratis untuk uji coba kuesioner Anda.'
                : 'Akses penuh ke semua uji statistik dan ekspor tanpa tanda air.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground font-serif">
                {formatCurrency(currentPlan.price)}
              </span>
              <span className="text-sm text-muted-foreground font-medium">
                {currentPlan.period}
              </span>
            </div>

            <div className="rounded-lg bg-secondary/50 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Masa Aktif
                </span>
                <span className="font-semibold text-foreground">
                  {currentPlan.id === 'free' ? 'Selamanya (Akses Gratis)' : 'Aktif hingga 30 hari ke depan'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <FileCheck className="h-3.5 w-3.5 text-primary" />
                  Pernyataan Alat
                </span>
                <span className="font-semibold text-foreground">
                  {currentPlan.id === 'free' ? 'Dengan tanda air' : 'Format Resmi Bab 4'}
                </span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-2">
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                setSelectedPlanId(currentPlan.id === 'free' ? 'monthly' : 'thesis');
                setIsModalOpen(true);
              }}
            >
              <Zap className="h-4 w-4 mr-2 text-amber-300" />
              Ganti Paket
            </Button>
          </CardFooter>
        </Card>

        {/* Usage Quota Card */}
        <Card className="border-border shadow-sm flex flex-col justify-between">
          <CardHeader>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pemakaian Kuota
            </span>
            <CardTitle className="font-serif text-2xl font-bold text-foreground mt-2">
              Statistik Akun
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Kapasitas proyek dan responden yang telah Anda gunakan.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Proyek Usage */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-primary" />
                  Proyek Aktif
                </span>
                <span className="font-semibold tabular-nums text-foreground">
                  {formatNumber(1)} / {currentPlan.quotaProjects === Infinity ? '∞' : formatNumber(currentPlan.quotaProjects)} Proyek
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentPlan.id === 'free' ? 'w-full bg-amber-500' : 'w-1/5 bg-primary'
                  }`}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Sisa kuota proyek Anda untuk paket ini.
              </p>
            </div>

            {/* Responden Quota */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-primary" />
                  Maksimal Responden
                </span>
                <span className="font-semibold tabular-nums text-foreground">
                  {formatNumber(currentPlan.quotaRespondents)} Responden
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-primary w-2/3" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Kapasitas dataset kuesioner Anda saat ini aman digunakan.
              </p>
            </div>
          </CardContent>

          <CardFooter className="pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground w-full bg-muted/40 p-3 rounded-lg">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <span>Semua data penelitian tersimpan privat dan dienkripsi lokal.</span>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Billing History Section */}
      <div className="space-y-4">
        <div>
          <h2 className="font-serif text-xl font-bold tracking-tight text-foreground">
            Riwayat Tagihan
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Daftar transaksi pembayaran dan perpanjangan langganan.
          </p>
        </div>

        <Card className="border-border shadow-sm overflow-hidden">
          {loadingBilling ? (
            <div className="p-6 space-y-3">
              <div className="h-6 w-full skeleton rounded" />
              <div className="h-6 w-full skeleton rounded" />
              <div className="h-6 w-full skeleton rounded" />
            </div>
          ) : billingHistory.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Belum ada riwayat transaksi tagihan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-4 sm:px-6 py-3">Tanggal</th>
                    <th className="px-4 sm:px-6 py-3">Deskripsi</th>
                    <th className="px-4 sm:px-6 py-3 text-right">Jumlah</th>
                    <th className="px-4 sm:px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {billingHistory.map((bill) => (
                    <tr key={bill.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap text-muted-foreground text-xs sm:text-sm">
                        {formatDate(bill.date)}
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 font-medium text-foreground">
                        {bill.description}
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 text-right font-medium tabular-nums text-foreground">
                        {formatCurrency(bill.amount)}
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 text-center">
                        {getBillingStatusBadge(bill.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Payment Simulation Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="font-serif text-xl font-bold">
                Ganti Paket Langganan
              </DialogTitle>
              {/* Midtrans Sandbox Badge */}
              <Badge variant="warning" className="uppercase font-bold tracking-wider text-[10px]">
                MIDTRANS SANDBOX
              </Badge>
            </div>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground text-left mt-1">
              Terhubung ke Midtrans Snap Sandbox. Anda dapat menguji pembayaran QRIS, GoPay, dan Virtual Account BCA/Mandiri/BNI menggunakan Simulator Resmi Midtrans.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Select Plan */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Pilih Paket
              </label>
              <div className="grid grid-cols-1 gap-2">
                {PLANS.filter((p) => p.id !== 'free').map((p) => {
                  const isSelected = selectedPlanId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border bg-card hover:bg-muted/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {p.name}
                          </span>
                          {p.badge && (
                            <Badge variant="mint" className="text-[10px]">
                              {p.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.quotaProjectsLabel} • {p.quotaRespondentsLabel}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-sm text-foreground">
                          {formatCurrency(p.price)}
                        </span>
                        <span className="text-[11px] text-muted-foreground block">
                          {p.period}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Select Payment Method */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Metode Pembayaran (Simulasi)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {PAYMENT_METHODS.map((pm) => {
                  const isSelected = selectedPaymentMethod === pm.id;
                  const Icon = pm.icon;
                  return (
                    <div
                      key={pm.id}
                      onClick={() => setSelectedPaymentMethod(pm.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer text-xs transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary font-medium text-foreground'
                          : 'border-border text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      <span>{pm.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simulation Warning Note */}
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Dengan menekan tombol konfirmasi, paket akun demo Anda akan langsung diperbarui secara gratis.
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isProcessingPayment}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSimulatePayment}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Menghubungkan Midtrans...
                </span>
              ) : (
                'Bayar Sekarang via Midtrans Snap'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
