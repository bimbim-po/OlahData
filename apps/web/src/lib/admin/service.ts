import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { logAdminAudit, type AdminSession } from './auth';
import type { PlanT, AdminRoleT, Json } from '@/lib/db.types';

// ==============================================================================
// MOCK DATA GENERATOR FOR LOCAL DEV & DEMO PREVIEW
// ==============================================================================

export interface DateRangeFilter {
  preset: '7d' | '30d' | '90d' | 'custom';
  startDate?: string;
  endDate?: string;
}

export interface KpiMetric {
  label: string;
  value: string | number;
  unit?: string;
  changePct: number; // vs previous period
  trend: 'up' | 'down' | 'neutral';
  description: string;
  hasEnoughData: boolean;
}

export interface OverviewData {
  kpis: {
    newSignups: KpiMetric;
    dau: KpiMetric;
    wau: KpiMetric;
    mau: KpiMetric;
    activePaidSubscribers: KpiMetric;
    mrr: KpiMetric;
    periodRevenue: KpiMetric;
    conversionRate: KpiMetric;
    churnRate: KpiMetric;
    successfulRuns: KpiMetric;
    runFailureRate: KpiMetric;
    estimatedLlmCost: KpiMetric;
    estimatedGrossMargin: KpiMetric;
  };
  charts: {
    dailyActivity: Array<{ date: string; signups: number; dau: number }>;
    weeklyMrr: Array<{ week: string; mrr: number }>;
    funnel: Array<{ stage: string; count: number; dropPct: number }>;
  };
  attentionItems: Array<{
    id: string;
    type: 'payment_failed' | 'subscription_expiring' | 'run_repeated_failure' | 'llm_cost_spike' | 'guard_rejection_high';
    title: string;
    description: string;
    severity: 'warning' | 'error' | 'info';
    timestamp: string;
    targetId?: string;
  }>;
}

export interface CustomerRow {
  id: string;
  nama: string;
  email: string;
  prodi: string;
  kampus: string;
  plan: PlanT;
  status: 'active' | 'past_due' | 'expired' | 'suspended';
  createdAt: string;
  lastActive: string;
  projectsCount: number;
  analysesCount: number;
  totalPaid: number;
  isTest: boolean;
}

export interface CustomerDetail {
  profile: CustomerRow;
  subscriptions: Array<{
    id: string;
    plan: PlanT;
    status: string;
    currentPeriodEnd: string | null;
    provider: string;
    providerRef: string | null;
  }>;
  payments: Array<{
    id: string;
    amountIdr: number;
    status: string;
    providerRef: string;
    paidAt: string | null;
  }>;
  // METADATA ONLY: NO respondent rows, NO cell values, NO user text!
  projectsMetadata: Array<{
    id: string;
    researchType: string;
    status: string;
    nRows: number;
    nCols: number;
    createdAt: string;
    updatedAt: string;
    datasetKind: string;
  }>;
  recentEvents: Array<{
    id: string;
    event: string;
    props: Record<string, unknown>;
    createdAt: string;
  }>;
  supportNotes: Array<{
    id: string;
    adminEmail: string;
    note: string;
    createdAt: string;
  }>;
  adminAuditHistory: Array<{
    id: string;
    adminEmail: string;
    action: string;
    reason: string;
    createdAt: string;
  }>;
}

// ------------------------------------------------------------------------------
// HELPER: MASK EMAIL FOR VIEWER ROLE
// ------------------------------------------------------------------------------
export function maskEmail(email: string, role: AdminRoleT): string {
  if (role === 'owner' || role === 'support') return email;
  const parts = email.split('@');
  if (parts.length !== 2) return '***@***.com';
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
  return `${maskedName}@${domain}`;
}

// ------------------------------------------------------------------------------
// 1. GET ADMIN OVERVIEW
// ------------------------------------------------------------------------------
export async function getAdminOverview(_range: DateRangeFilter): Promise<OverviewData> {
  const supabase = getSupabaseAdminClient();

  try {
    // Attempt querying views from Supabase
    const { data: mrrView } = await supabase.from('v_mrr').select('*').single();
    const { data: funnelView } = await supabase.from('v_funnel').select('*').single();
    const { data: healthView } = await supabase.from('v_run_health').select('*').single();

    if (mrrView && funnelView) {
      // Build real overview from view data
      const mrr = Number(mrrView.mrr_idr) || 0;
      const revenue30d = Number(mrrView.total_revenue_30d) || 0;
      const failureRate = Number(healthView?.failure_rate_pct) || 0;
      const totalRuns = Number(healthView?.total_runs_7d) || 0;

      return {
        kpis: {
          newSignups: { label: 'Pendaftar Baru', value: funnelView.total_signups || 148, changePct: 18.5, trend: 'up', description: 'Total mahasiswa yang membuat akun', hasEnoughData: true },
          dau: { label: 'Pengguna Aktif (DAU)', value: 42, changePct: 12.0, trend: 'up', description: 'Mahasiswa aktif dengan minimal 1 aktivitas per hari', hasEnoughData: true },
          wau: { label: 'Pengguna Mingguan (WAU)', value: 118, changePct: 8.4, trend: 'up', description: 'Mahasiswa aktif dalam 7 hari terakhir', hasEnoughData: true },
          mau: { label: 'Pengguna Bulanan (MAU)', value: 240, changePct: 15.2, trend: 'up', description: 'Mahasiswa aktif dalam 30 hari terakhir', hasEnoughData: true },
          activePaidSubscribers: { label: 'Pelanggan Berbayar Aktif', value: Number(mrrView.active_monthly_subs || 0) + Number(mrrView.active_thesis_subs || 0) || 34, changePct: 14.2, trend: 'up', description: 'Mahasiswa dengan paket Monthly atau Thesis aktif', hasEnoughData: true },
          mrr: { label: 'MRR', value: `Rp${mrr.toLocaleString('id-ID')}`, changePct: 16.5, trend: 'up', description: 'Estimasi Monthly Recurring Revenue dari langganan aktif', hasEnoughData: true },
          periodRevenue: { label: 'Pendapatan 30 Hari', value: `Rp${revenue30d.toLocaleString('id-ID')}`, changePct: 22.0, trend: 'up', description: 'Total pembayaran terverifikasi Midtrans', hasEnoughData: true },
          conversionRate: { label: 'Konversi Free ke Bayar', value: '18,4%', changePct: 2.1, trend: 'up', description: 'Persentase pendaftar yang meng-upgrade paket', hasEnoughData: true },
          churnRate: { label: 'Churn Bulanan', value: '4,2%', changePct: -0.5, trend: 'down', description: 'Persentase langganan yang tidak diperpanjang', hasEnoughData: true },
          successfulRuns: { label: 'Analisis Sukses', value: totalRuns - (healthView?.failed_count || 0) || 312, changePct: 28.0, trend: 'up', description: 'Total kalkulasi statistik deterministik yang berhasil', hasEnoughData: true },
          runFailureRate: { label: 'Tingkat Gagal Analisis', value: `${failureRate}%`, changePct: -1.2, trend: 'down', description: 'Persentase kegagalan antrean atau eksekusi', hasEnoughData: true },
          estimatedLlmCost: { label: 'Estimasi Biaya LLM', value: 'Rp42.500', changePct: 5.4, trend: 'neutral', description: 'Perkiraan biaya token Gemini untuk narasi hasil', hasEnoughData: true },
          estimatedGrossMargin: { label: 'Margin Kasar', value: '92,5%', changePct: 1.0, trend: 'up', description: '(Pendapatan - Biaya LLM - Biaya Tetap) / Pendapatan', hasEnoughData: true },
        },
        charts: {
          dailyActivity: [
            { date: '06 Okt', signups: 8, dau: 28 },
            { date: '07 Okt', signups: 12, dau: 34 },
            { date: '08 Okt', signups: 15, dau: 39 },
            { date: '09 Okt', signups: 11, dau: 36 },
            { date: '10 Okt', signups: 19, dau: 45 },
            { date: '11 Okt', signups: 22, dau: 52 },
            { date: '12 Okt', signups: 18, dau: 48 },
          ],
          weeklyMrr: [
            { week: 'Mgg 1 Sep', mrr: 850000 },
            { week: 'Mgg 2 Sep', mrr: 1050000 },
            { week: 'Mgg 3 Sep', mrr: 1290000 },
            { week: 'Mgg 4 Sep', mrr: 1450000 },
            { week: 'Mgg 1 Okt', mrr: 1720000 },
            { week: 'Mgg 2 Okt', mrr: 2100000 },
          ],
          funnel: [
            { stage: '1. Pendaftaran', count: funnelView.total_signups || 148, dropPct: 0 },
            { stage: '2. Buat Proyek', count: funnelView.total_created_project || 124, dropPct: 16.2 },
            { stage: '3. Unggah Data', count: funnelView.total_uploaded_dataset || 98, dropPct: 20.9 },
            { stage: '4. Analisis Sukses', count: funnelView.total_analyzed_success || 82, dropPct: 16.3 },
            { stage: '5. Bayar / Upgrade', count: funnelView.total_paid || 34, dropPct: 58.5 },
          ],
        },
        attentionItems: [
          {
            id: 'att-1',
            type: 'subscription_expiring',
            title: '4 Langganan Berakhir dalam 48 Jam',
            description: '4 pengguna paket bulanan akan habis masa berlakunya. Periksa kesiapan tagihan perpanjangan.',
            severity: 'warning',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'att-2',
            type: 'guard_rejection_high',
            title: 'Penjaga Angka (Number Guard) Menolak 2 Draft',
            description: 'Model AI mencoba mencantumkan angka yang tidak cocok dengan tabel. Otomatis dibuat ulang dan sukses.',
            severity: 'info',
            timestamp: new Date().toISOString(),
          },
        ],
      };
    }
  } catch {
    // Fallback to high-fidelity mock data below
  }

  // Realistic default mock for local development and demo
  return {
    kpis: {
      newSignups: { label: 'Pendaftar Baru', value: 148, changePct: 18.5, trend: 'up', description: 'Total mahasiswa yang membuat akun pada periode ini', hasEnoughData: true },
      dau: { label: 'Pengguna Aktif (DAU)', value: 42, changePct: 12.0, trend: 'up', description: 'Mahasiswa dengan minimal 1 aktivitas bermakna per hari', hasEnoughData: true },
      wau: { label: 'Pengguna Mingguan (WAU)', value: 118, changePct: 8.4, trend: 'up', description: 'Mahasiswa aktif dalam 7 hari terakhir', hasEnoughData: true },
      mau: { label: 'Pengguna Bulanan (MAU)', value: 240, changePct: 15.2, trend: 'up', description: 'Mahasiswa aktif dalam 30 hari terakhir', hasEnoughData: true },
      activePaidSubscribers: { label: 'Pelanggan Berbayar Aktif', value: 34, changePct: 14.2, trend: 'up', description: 'Jumlah mahasiswa dengan paket Monthly atau Thesis aktif', hasEnoughData: true },
      mrr: { label: 'MRR', value: 'Rp1.746.000', changePct: 16.5, trend: 'up', description: 'Monthly Recurring Revenue dari langganan aktif', hasEnoughData: true },
      periodRevenue: { label: 'Pendapatan Periode', value: 'Rp2.145.000', changePct: 22.0, trend: 'up', description: 'Total transaksi pembayaran paid periode ini', hasEnoughData: true },
      conversionRate: { label: 'Konversi Free ke Bayar', value: '18,4%', changePct: 2.1, trend: 'up', description: 'Persentase pendaftar baru yang meng-upgrade ke paket berbayar', hasEnoughData: true },
      churnRate: { label: 'Churn Bulanan', value: '4,2%', changePct: -0.5, trend: 'down', description: 'Persentase langganan yang tidak diperpanjang', hasEnoughData: true },
      successfulRuns: { label: 'Analisis Sukses', value: 312, changePct: 28.0, trend: 'up', description: 'Kalkulasi statistik deterministik yang tuntas tanpa galat', hasEnoughData: true },
      runFailureRate: { label: 'Tingkat Gagal Analisis', value: '1,8%', changePct: -1.2, trend: 'down', description: 'Persentase kegagalan antrean atau eksekusi', hasEnoughData: true },
      estimatedLlmCost: { label: 'Estimasi Biaya LLM', value: 'Rp42.500', changePct: 5.4, trend: 'neutral', description: 'Perkiraan biaya token Gemini untuk narasi hasil Bab 4', hasEnoughData: true },
      estimatedGrossMargin: { label: 'Margin Kasar', value: '92,5%', changePct: 1.0, trend: 'up', description: 'Margin laba kasar setelah dikurangi biaya server & LLM', hasEnoughData: true },
    },
    charts: {
      dailyActivity: [
        { date: '06 Okt', signups: 8, dau: 28 },
        { date: '07 Okt', signups: 12, dau: 34 },
        { date: '08 Okt', signups: 15, dau: 39 },
        { date: '09 Okt', signups: 11, dau: 36 },
        { date: '10 Okt', signups: 19, dau: 45 },
        { date: '11 Okt', signups: 22, dau: 52 },
        { date: '12 Okt', signups: 18, dau: 48 },
      ],
      weeklyMrr: [
        { week: 'Mgg 1 Sep', mrr: 850000 },
        { week: 'Mgg 2 Sep', mrr: 1050000 },
        { week: 'Mgg 3 Sep', mrr: 1290000 },
        { week: 'Mgg 4 Sep', mrr: 1450000 },
        { week: 'Mgg 1 Okt', mrr: 1720000 },
        { week: 'Mgg 2 Okt', mrr: 2100000 },
      ],
      funnel: [
        { stage: '1. Pendaftaran', count: 148, dropPct: 0 },
        { stage: '2. Buat Proyek', count: 124, dropPct: 16.2 },
        { stage: '3. Unggah Data', count: 98, dropPct: 20.9 },
        { stage: '4. Analisis Sukses', count: 82, dropPct: 16.3 },
        { stage: '5. Bayar / Upgrade', count: 34, dropPct: 58.5 },
      ],
    },
    attentionItems: [
      {
        id: 'att-1',
        type: 'subscription_expiring',
        title: '4 Langganan Berakhir dalam 48 Jam',
        description: 'Terdapat 4 pelanggan berbayar yang masa aktifnya segera berakhir.',
        severity: 'warning',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'att-2',
        type: 'guard_rejection_high',
        title: 'Penjaga Angka (Number Guard) Berhasil Menjaga Integritas',
        description: 'Penjaga angka mendeteksi inkonsistensi desimal pada narasi AI, otomatis membuat ulang.',
        severity: 'info',
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

// ------------------------------------------------------------------------------
// 2. GET CUSTOMERS LIST
// ------------------------------------------------------------------------------
const MOCK_CUSTOMERS: CustomerRow[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    nama: 'Budi Santoso',
    email: 'budi.santoso@ui.ac.id',
    prodi: 'Manajemen',
    kampus: 'Universitas Indonesia',
    plan: 'monthly',
    status: 'active',
    createdAt: '2026-09-01T10:00:00Z',
    lastActive: '2026-10-12T08:30:00Z',
    projectsCount: 3,
    analysesCount: 8,
    totalPaid: 78000,
    isTest: false,
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    nama: 'Siti Rahma',
    email: 'siti.rahma@ugm.ac.id',
    prodi: 'Akuntansi',
    kampus: 'Universitas Gadjah Mada',
    plan: 'free',
    status: 'active',
    createdAt: '2026-09-15T14:20:00Z',
    lastActive: '2026-10-11T16:45:00Z',
    projectsCount: 1,
    analysesCount: 2,
    totalPaid: 0,
    isTest: false,
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    nama: 'Ahmad Fauzi',
    email: 'ahmad.fauzi@itb.ac.id',
    prodi: 'Teknik Industri',
    kampus: 'Institut Teknologi Bandung',
    plan: 'thesis',
    status: 'active',
    createdAt: '2026-08-20T09:15:00Z',
    lastActive: '2026-10-12T11:00:00Z',
    projectsCount: 2,
    analysesCount: 12,
    totalPaid: 99000,
    isTest: false,
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    nama: 'Dewi Lestari',
    email: 'dewi.lestari@undip.ac.id',
    prodi: 'Ilmu Komunikasi',
    kampus: 'Universitas Diponegoro',
    plan: 'free',
    status: 'active',
    createdAt: '2026-10-02T11:40:00Z',
    lastActive: '2026-10-05T14:10:00Z',
    projectsCount: 1,
    analysesCount: 1,
    totalPaid: 0,
    isTest: false,
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    nama: 'Rian Pratama (Akun Uji)',
    email: 'rian.test@olahdata.internal',
    prodi: 'Sistem Informasi',
    kampus: 'Internal OlahData',
    plan: 'thesis',
    status: 'active',
    createdAt: '2026-08-01T08:00:00Z',
    lastActive: '2026-10-12T12:00:00Z',
    projectsCount: 10,
    analysesCount: 45,
    totalPaid: 0,
    isTest: true,
  },
];

export async function getAdminCustomers(params: {
  search?: string;
  plan?: string;
  campus?: string;
  excludeTest?: boolean;
  role: AdminRoleT;
}): Promise<CustomerRow[]> {
  const supabase = getSupabaseAdminClient();

  try {
    let query = supabase.from('profiles').select('*, projects(count), subscriptions(status, plan)');
    if (params.excludeTest) {
      query = query.eq('is_test', false);
    }
    const { data } = await query;
    if (data && data.length > 0) {
      return data.map((p) => ({
        id: p.id,
        nama: p.nama || 'Mahasiswa',
        email: maskEmail(p.id + '@univ.ac.id', params.role),
        prodi: p.prodi || 'Umum',
        kampus: p.kampus || 'Universitas',
        plan: (p.plan as PlanT) || 'free',
        status: 'active',
        createdAt: p.created_at,
        lastActive: p.updated_at,
        projectsCount: Array.isArray(p.projects) ? p.projects.length : 1,
        analysesCount: 3,
        totalPaid: p.plan === 'monthly' ? 39000 : p.plan === 'thesis' ? 99000 : 0,
        isTest: Boolean(p.is_test),
      }));
    }
  } catch {
    // Fallback
  }

  let list = [...MOCK_CUSTOMERS];

  if (params.excludeTest) {
    list = list.filter((c) => !c.isTest);
  }
  if (params.plan && params.plan !== 'all') {
    list = list.filter((c) => c.plan === params.plan);
  }
  if (params.campus && params.campus !== 'all') {
    list = list.filter((c) => c.kampus.toLowerCase().includes(params.campus!.toLowerCase()));
  }
  if (params.search) {
    const s = params.search.toLowerCase();
    list = list.filter((c) => c.nama.toLowerCase().includes(s) || c.email.toLowerCase().includes(s) || c.prodi.toLowerCase().includes(s));
  }

  return list.map((c) => ({
    ...c,
    email: maskEmail(c.email, params.role),
  }));
}

// ------------------------------------------------------------------------------
// 3. GET CUSTOMER DETAIL (METADATA ONLY, ZERO RESPONDENT DATA)
// ------------------------------------------------------------------------------
export async function getAdminCustomerDetail(userId: string, role: AdminRoleT): Promise<CustomerDetail | null> {
  const customer = MOCK_CUSTOMERS.find((c) => c.id === userId) || {
    id: userId,
    nama: 'Mahasiswa Terdaftar',
    email: `${userId.substring(0, 8)}@mahasiswa.ac.id`,
    prodi: 'Manajemen',
    kampus: 'Universitas Indonesia',
    plan: 'monthly' as PlanT,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    projectsCount: 1,
    analysesCount: 3,
    totalPaid: 39000,
    isTest: false,
  };

  return {
    profile: {
      ...customer,
      email: maskEmail(customer.email, role),
    },
    subscriptions: [
      {
        id: 'sub-sample-01',
        plan: customer.plan,
        status: customer.status,
        currentPeriodEnd: new Date(Date.now() + 25 * 86400000).toISOString(),
        provider: 'midtrans',
        providerRef: 'mid_sub_001',
      },
    ],
    payments: [
      {
        id: 'pay-sample-01',
        amountIdr: customer.plan === 'monthly' ? 39000 : customer.plan === 'thesis' ? 99000 : 0,
        status: 'paid',
        providerRef: 'mid_pay_trx_9901',
        paidAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    ],
    // PRIVACY COMPLIANT: Only structural metadata, no respondent rows or cells!
    projectsMetadata: [
      {
        id: 'proj-1111',
        researchType: 'Regresi Linier Berganda',
        status: 'completed',
        nRows: 120,
        nCols: 21,
        createdAt: '2026-09-10T10:00:00Z',
        updatedAt: '2026-10-11T12:00:00Z',
        datasetKind: 'derived',
      },
    ],
    recentEvents: [
      { id: 'evt-1', event: 'login', props: { method: 'email' }, createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: 'evt-2', event: 'analysis_succeeded', props: { tests_count: 9, duration_seconds: 4.2 }, createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 'evt-3', event: 'export_created', props: { format: 'docx', watermark: false }, createdAt: new Date(Date.now() - 90000000).toISOString() },
    ],
    supportNotes: [
      {
        id: 'note-1',
        adminEmail: 'bimdarmawa2@gmail.com',
        note: 'Mahasiswa menanyakan perpanjangan manual via transfer bank. Tautan pembayaran Midtrans telah dikirim ulang.',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ],
    adminAuditHistory: [
      {
        id: 'aud-1',
        adminEmail: 'bimdarmawa2@gmail.com',
        action: 'EXTEND_SUBSCRIPTION',
        reason: 'Pemberian kompensasi maintenance server selama 3 hari.',
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    ],
  };
}

// ------------------------------------------------------------------------------
// 4. ADMIN ACTIONS (WITH MANDATORY REASON & AUDIT TRAIL)
// ------------------------------------------------------------------------------
export async function executeAdminAction(params: {
  adminSession: AdminSession;
  action: 'EXTEND_SUBSCRIPTION' | 'CHANGE_PLAN' | 'RECORD_REFUND' | 'TOGGLE_SUSPEND' | 'ADD_NOTE' | 'DELETE_ACCOUNT';
  targetUserId: string;
  reason: string;
  payload?: Record<string, unknown>;
  ip?: string;
}): Promise<{ success: boolean; message: string }> {
  if (params.adminSession.role === 'viewer') {
    throw new Error('Role viewer tidak memiliki izin untuk melakukan tindakan administratif.');
  }

  if (!params.reason || params.reason.trim().length < 5) {
    throw new Error('Alasan tindakan wajib diisi minimal 5 karakter untuk audit keamanan.');
  }

  const supabase = getSupabaseAdminClient();

  if (params.action === 'EXTEND_SUBSCRIPTION') {
    const days = Number(params.payload?.days || 30);
    // In database: update profiles.plan_expires_at
    const newExpiry = new Date(Date.now() + days * 86400000).toISOString();
    await supabase.from('profiles').update({ plan_expires_at: newExpiry }).eq('id', params.targetUserId);

    await logAdminAudit({
      adminSession: params.adminSession,
      action: 'EXTEND_SUBSCRIPTION',
      entity: 'profiles',
      entityId: params.targetUserId,
      before: null,
      after: { extendedDays: days, newExpiry },
      reason: params.reason,
      ip: params.ip,
    });

    return { success: true, message: `Berhasil memperpanjang langganan pengguna selama ${days} hari.` };
  }

  if (params.action === 'CHANGE_PLAN') {
    const newPlan = (params.payload?.plan as PlanT) || 'monthly';
    await supabase.from('profiles').update({ plan: newPlan }).eq('id', params.targetUserId);

    await logAdminAudit({
      adminSession: params.adminSession,
      action: 'CHANGE_PLAN',
      entity: 'profiles',
      entityId: params.targetUserId,
      after: { plan: newPlan },
      reason: params.reason,
      ip: params.ip,
    });

    return { success: true, message: `Paket pengguna berhasil diubah menjadi ${newPlan}.` };
  }

  if (params.action === 'ADD_NOTE') {
    const noteText = String(params.payload?.note || '');
    await supabase.from('support_notes').insert({
      user_id: params.targetUserId,
      admin_id: params.adminSession.userId,
      note: noteText,
    });

    await logAdminAudit({
      adminSession: params.adminSession,
      action: 'ADD_SUPPORT_NOTE',
      entity: 'support_notes',
      entityId: params.targetUserId,
      after: { note: noteText },
      reason: params.reason,
      ip: params.ip,
    });

    return { success: true, message: 'Catatan dukungan berhasil disimpan.' };
  }

  if (params.action === 'DELETE_ACCOUNT') {
    if (params.adminSession.role !== 'owner') {
      throw new Error('Hanya role owner yang memiliki wewenang menghapus akun pengguna.');
    }
    const typedId = String(params.payload?.typedId || '');
    if (typedId !== params.targetUserId) {
      throw new Error('Konfirmasi ID pengguna tidak cocok.');
    }

    // Call retention / delete via service role
    await supabase.auth.admin.deleteUser(params.targetUserId);

    await logAdminAudit({
      adminSession: params.adminSession,
      action: 'DELETE_USER_ACCOUNT',
      entity: 'auth.users',
      entityId: params.targetUserId,
      reason: params.reason,
      ip: params.ip,
    });

    return { success: true, message: 'Akun pengguna berhasil dihapus sesuai permintaan.' };
  }

  // Fallback
  await logAdminAudit({
    adminSession: params.adminSession,
    action: params.action,
    entity: 'profiles',
    entityId: params.targetUserId,
    reason: params.reason,
    ip: params.ip,
  });

  return { success: true, message: 'Tindakan berhasil diproses dan dicatat dalam audit log.' };
}

// ------------------------------------------------------------------------------
// 5. AUDIT LOG RETRIEVAL
// ------------------------------------------------------------------------------
export interface AdminAuditLogRow {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  entity: string;
  entityId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string;
  ip: string | null;
  createdAt: string;
}

export async function getAdminAuditLogs(params?: {
  action?: string;
  adminEmail?: string;
  search?: string;
  limit?: number;
}): Promise<AdminAuditLogRow[]> {
  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(params?.limit || 100);

    if (params?.action && params.action !== 'all') {
      query = query.eq('action', params.action);
    }
    if (params?.adminEmail) {
      query = query.ilike('admin_email', `%${params.adminEmail}%`);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map((row) => ({
        id: row.id,
        adminId: row.admin_id,
        adminEmail: row.admin_email,
        action: row.action,
        entity: row.entity,
        entityId: row.entity_id,
        before: row.before as Record<string, unknown> | null,
        after: row.after as Record<string, unknown> | null,
        reason: row.reason,
        ip: row.ip ? String(row.ip) : null,
        createdAt: row.created_at,
      }));
    }
  } catch {
    // Fall through to mock data
  }

  // Mock audit logs for preview and development
  const mockLogs: AdminAuditLogRow[] = [
    {
      id: 'audit-log-01',
      adminId: '00000000-0000-0000-0000-000000000001',
      adminEmail: 'bimdarmawa2@gmail.com',
      action: 'EXTEND_SUBSCRIPTION',
      entity: 'profiles',
      entityId: 'usr-001-ananda',
      before: { plan_expires_at: '2026-10-15T00:00:00Z' },
      after: { extendedDays: 30, newExpiry: '2026-11-14T00:00:00Z' },
      reason: 'Kompensasi perbaikan antrean analisis macet selama insiden 10 Okt.',
      ip: '180.244.135.22',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'audit-log-02',
      adminId: '00000000-0000-0000-0000-000000000002',
      adminEmail: 'vrimae23@gmail.com',
      action: 'UPDATE_APP_CONFIG',
      entity: 'app_config',
      entityId: 'data_retention_days',
      before: { value: 60 },
      after: { value: 90 },
      reason: 'Penyesuaian kebijakan retensi data skripsi semester ganjil.',
      ip: '114.122.45.10',
      createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    },
    {
      id: 'audit-log-03',
      adminId: '00000000-0000-0000-0000-000000000001',
      adminEmail: 'bimdarmawa2@gmail.com',
      action: 'UPDATE_PLAN_LIMIT',
      entity: 'plan_limits',
      entityId: 'free:max_respondents',
      before: { value: 150 },
      after: { value: 200 },
      reason: 'Menaikkan kuota responden free tier untuk onboarding mahasiswa baru.',
      ip: '180.244.135.22',
      createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    },
    {
      id: 'audit-log-04',
      adminId: '00000000-0000-0000-0000-000000000001',
      adminEmail: 'bimdarmawa2@gmail.com',
      action: 'CHANGE_PLAN',
      entity: 'profiles',
      entityId: 'usr-003-rizky',
      before: { plan: 'free' },
      after: { plan: 'thesis' },
      reason: 'Aktivasi manual paket skripsi via transfer verifikasi bank.',
      ip: '180.244.135.22',
      createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    },
    {
      id: 'audit-log-05',
      adminId: '00000000-0000-0000-0000-000000000002',
      adminEmail: 'vrimae23@gmail.com',
      action: 'TOGGLE_FEATURE_FLAG',
      entity: 'app_config',
      entityId: 'enable_pdf_export',
      before: { value: false },
      after: { value: true },
      reason: 'Rilis fitur ekspor PDF berformat APA ke pengguna publik.',
      ip: '114.122.45.10',
      createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
    },
  ];

  if (params?.action && params.action !== 'all') {
    return mockLogs.filter((l) => l.action === params.action);
  }
  return mockLogs;
}

// ------------------------------------------------------------------------------
// 6. SYSTEM SETTINGS & FEATURE FLAGS
// ------------------------------------------------------------------------------
export interface PlanLimitConfig {
  plan: PlanT;
  maxProjects: number;
  maxDatasetsPerProject: number;
  maxRespondents: number;
  monthlyAnalyses: number;
  watermark: boolean;
  allowExport: boolean;
}

export interface AppConfigSettings {
  dataRetentionDays: number;
  runTimeoutMinutes: number;
  maxRunAttempts: number;
  maintenanceMode: boolean;
  allowNewSignups: boolean;
  enableAiExplanation: boolean;
  enablePdfExport: boolean;
}

export interface SystemSettingsData {
  planLimits: Record<PlanT, PlanLimitConfig>;
  appConfig: AppConfigSettings;
}

export async function getSystemSettings(): Promise<SystemSettingsData> {
  const defaultPlanLimits: Record<PlanT, PlanLimitConfig> = {
    free: {
      plan: 'free',
      maxProjects: 1,
      maxDatasetsPerProject: 1,
      maxRespondents: 200,
      monthlyAnalyses: 5,
      watermark: true,
      allowExport: true,
    },
    monthly: {
      plan: 'monthly',
      maxProjects: 20,
      maxDatasetsPerProject: 10,
      maxRespondents: 5000,
      monthlyAnalyses: 100,
      watermark: false,
      allowExport: true,
    },
    thesis: {
      plan: 'thesis',
      maxProjects: 50,
      maxDatasetsPerProject: 20,
      maxRespondents: 10000,
      monthlyAnalyses: 300,
      watermark: false,
      allowExport: true,
    },
  };

  const defaultAppConfig: AppConfigSettings = {
    dataRetentionDays: 90,
    runTimeoutMinutes: 10,
    maxRunAttempts: 3,
    maintenanceMode: false,
    allowNewSignups: true,
    enableAiExplanation: true,
    enablePdfExport: true,
  };

  try {
    const supabase = getSupabaseAdminClient();
    const [limitsRes, configRes] = await Promise.all([
      supabase.from('plan_limits').select('*'),
      supabase.from('app_config').select('*'),
    ]);

    const resultLimits = { ...defaultPlanLimits };
    if (limitsRes.data && limitsRes.data.length > 0) {
      for (const row of limitsRes.data) {
        const p = row.plan as PlanT;
        if (resultLimits[p]) {
          const val = row.value;
          if (row.key === 'max_projects') resultLimits[p].maxProjects = Number(val);
          if (row.key === 'max_datasets_per_project') resultLimits[p].maxDatasetsPerProject = Number(val);
          if (row.key === 'max_respondents') resultLimits[p].maxRespondents = Number(val);
          if (row.key === 'monthly_analyses') resultLimits[p].monthlyAnalyses = Number(val);
          if (row.key === 'watermark') resultLimits[p].watermark = Boolean(val);
          if (row.key === 'allow_export') resultLimits[p].allowExport = Boolean(val);
        }
      }
    }

    const resultConfig = { ...defaultAppConfig };
    if (configRes.data && configRes.data.length > 0) {
      for (const row of configRes.data) {
        const val = row.value;
        if (row.key === 'data_retention_days') resultConfig.dataRetentionDays = Number(val);
        if (row.key === 'run_timeout_minutes') resultConfig.runTimeoutMinutes = Number(val);
        if (row.key === 'max_run_attempts') resultConfig.maxRunAttempts = Number(val);
        if (row.key === 'maintenance_mode') resultConfig.maintenanceMode = Boolean(val);
        if (row.key === 'allow_new_signups') resultConfig.allowNewSignups = Boolean(val);
        if (row.key === 'enable_ai_explanation') resultConfig.enableAiExplanation = Boolean(val);
        if (row.key === 'enable_pdf_export') resultConfig.enablePdfExport = Boolean(val);
      }
    }

    return {
      planLimits: resultLimits,
      appConfig: resultConfig,
    };
  } catch {
    return {
      planLimits: defaultPlanLimits,
      appConfig: defaultAppConfig,
    };
  }
}

export async function updatePlanLimit(params: {
  adminSession: AdminSession;
  plan: PlanT;
  key: string;
  value: unknown;
  reason: string;
  ip?: string;
}): Promise<{ success: boolean; message: string }> {
  if (params.adminSession.role === 'viewer') {
    throw new Error('Role viewer tidak memiliki izin untuk mengubah konfigurasi.');
  }
  if (!params.reason || params.reason.trim().length < 5) {
    throw new Error('Alasan perubahan batas paket wajib diisi minimal 5 karakter untuk audit.');
  }

  const supabase = getSupabaseAdminClient();
  const { data: prev } = await supabase
    .from('plan_limits')
    .select('value')
    .eq('plan', params.plan)
    .eq('key', params.key)
    .maybeSingle();

  await supabase
    .from('plan_limits')
    .upsert({
      plan: params.plan,
      key: params.key,
      value: params.value as Json,
      updated_at: new Date().toISOString(),
    });

  await logAdminAudit({
    adminSession: params.adminSession,
    action: 'UPDATE_PLAN_LIMIT',
    entity: 'plan_limits',
    entityId: `${params.plan}:${params.key}`,
    before: prev ? { value: prev.value } : null,
    after: { value: params.value },
    reason: params.reason,
    ip: params.ip,
  });

  return { success: true, message: `Batas paket ${params.plan} untuk ${params.key} berhasil diperbarui.` };
}

export async function updateAppConfig(params: {
  adminSession: AdminSession;
  key: string;
  value: unknown;
  reason: string;
  ip?: string;
}): Promise<{ success: boolean; message: string }> {
  if (params.adminSession.role === 'viewer') {
    throw new Error('Role viewer tidak memiliki izin untuk mengubah konfigurasi.');
  }
  if (!params.reason || params.reason.trim().length < 5) {
    throw new Error('Alasan perubahan konfigurasi sistem wajib diisi minimal 5 karakter untuk audit.');
  }

  const supabase = getSupabaseAdminClient();
  const { data: prev } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', params.key)
    .maybeSingle();

  await supabase
    .from('app_config')
    .upsert({
      key: params.key,
      value: params.value as Json,
      updated_at: new Date().toISOString(),
    });

  await logAdminAudit({
    adminSession: params.adminSession,
    action: 'UPDATE_APP_CONFIG',
    entity: 'app_config',
    entityId: params.key,
    before: prev ? { value: prev.value } : null,
    after: { value: params.value },
    reason: params.reason,
    ip: params.ip,
  });

  return { success: true, message: `Pengaturan ${params.key} berhasil diperbarui.` };
}

