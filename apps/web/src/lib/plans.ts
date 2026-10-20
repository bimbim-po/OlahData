import type { SubscriptionPlan } from './api/types';

export interface PlanFeatureItem {
  name: string;
  free: string | boolean;
  monthly: string | boolean;
  thesis: string | boolean;
}

export interface PlanComparisonCategory {
  category: string;
  items: PlanFeatureItem[];
}

export interface PlanConfig {
  id: SubscriptionPlan;
  name: string;
  price: number;
  period: string;
  billingCycleMonths: number;
  badge?: string;
  highlighted?: boolean;
  description: string;
  quotaProjects: number; // Infinity means unlimited
  quotaProjectsLabel: string;
  quotaRespondents: number; // Infinity means unlimited
  quotaRespondentsLabel: string;
  quotaQuestions: number; // Infinity means unlimited
  quotaQuestionsLabel: string;
  versionHistoryLimit: number;
  versionHistoryLabel: string;
  allowedTests: ('all' | string[]);
  exportType: 'watermark' | 'clean';
  exportLabel: string;
  hasDeclaration: boolean;
  hasVersionHistory: boolean;
  retentionDays: number;
  features: string[];
  ctaText: string;
  waitlistText: string;
}

export const IS_PRE_RELEASE_SIMULATION = true;
export const SIMULATION_LABEL = 'Tarif simulasi pra-rilis';
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || '[ISI OLEH PEMILIK]';
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || '[ISI OLEH PEMILIK]';

export const PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Coba Gratis',
    price: 0,
    period: '',
    billingCycleMonths: 0,
    highlighted: false,
    description: 'Untuk pengenalan uji deskriptif & validitas instrumen',
    quotaProjects: 1,
    quotaProjectsLabel: '1 proyek aktif',
    quotaRespondents: 50,
    quotaRespondentsLabel: 'Maks. 50 responden',
    quotaQuestions: 30,
    quotaQuestionsLabel: 'Maks. 30 butir pertanyaan',
    versionHistoryLimit: 1,
    versionHistoryLabel: '1 versi',
    allowedTests: ['descriptive', 'validity'],
    exportType: 'watermark',
    exportLabel: 'Ekspor ber-watermark',
    hasDeclaration: false,
    hasVersionHistory: false,
    retentionDays: 30,
    features: [
      '1 proyek aktif',
      'Maks. 50 data responden',
      'Maks. 30 butir pertanyaan',
      'Uji deskriptif dan validitas',
      'Ekspor ber-watermark',
    ],
    ctaText: 'Coba Gratis',
    waitlistText: 'Coba Gratis',
  },
  {
    id: 'monthly',
    name: 'Bulanan',
    price: 39000,
    period: '/bulan',
    billingCycleMonths: 1,
    highlighted: false,
    description: 'Fleksibel untuk pengerjaan dan revisi bulanan',
    quotaProjects: 5,
    quotaProjectsLabel: '5 proyek',
    quotaRespondents: Infinity,
    quotaRespondentsLabel: 'Hingga 100.000 responden',
    quotaQuestions: Infinity,
    quotaQuestionsLabel: 'Pertanyaan tak terbatas',
    versionHistoryLimit: 5,
    versionHistoryLabel: '5 versi',
    allowedTests: 'all',
    exportType: 'clean',
    exportLabel: 'Ekspor Word dan PDF tanpa watermark',
    hasDeclaration: true,
    hasVersionHistory: false,
    retentionDays: 365,
    features: [
      '5 proyek aktif',
      'Hingga 100.000 data responden',
      'Semua uji statistik lengkap',
      'Ekspor Word dan PDF tanpa watermark',
      'Pernyataan penggunaan alat',
    ],
    ctaText: 'Pilih Bulanan',
    waitlistText: 'Daftar waiting list',
  },
  {
    id: 'thesis',
    name: 'Paket Skripsi',
    price: 99000,
    period: '/3 bulan',
    billingCycleMonths: 3,
    badge: 'Rekomendasi Skripsi',
    highlighted: true,
    description: 'Lengkap untuk seluruh proses penelitian hingga sidang',
    quotaProjects: Infinity,
    quotaProjectsLabel: '1 proyek aktif (penggunaan wajar)',
    quotaRespondents: Infinity,
    quotaRespondentsLabel: 'Responden tak terbatas (batas wajar)',
    quotaQuestions: Infinity,
    quotaQuestionsLabel: 'Pertanyaan tak terbatas',
    versionHistoryLimit: Infinity,
    versionHistoryLabel: 'Riwayat versi dataset dan analisis',
    allowedTests: 'all',
    exportType: 'clean',
    exportLabel: 'Ekspor Word dan PDF tanpa watermark',
    hasDeclaration: true,
    hasVersionHistory: true,
    retentionDays: 730,
    features: [
      '1 proyek aktif (penggunaan wajar)',
      'Responden batas wajar',
      'Semua uji statistik lengkap',
      'Ekspor Word dan PDF tanpa watermark',
      'Pernyataan penggunaan alat',
      'Riwayat versi dataset dan analisis',
    ],
    ctaText: 'Pilih Paket Skripsi',
    waitlistText: 'Daftar waiting list',
  },
];

export const INSTITUTION_PLAN = {
  name: 'Paket Institusi & Laboratorium Kampus',
  description:
    'Lisensi laboratorium komputer kampus, lokakarya metodologi kuantitatif, dan akun institusi terpusat.',
  contactEmail: CONTACT_EMAIL,
  contactHref: `mailto:${CONTACT_EMAIL}?subject=Konsultasi%20Paket%20Institusi%20OlahData`,
  ctaText: 'Hubungi Tim Kampus',
};

export const COMPARISON_SECTIONS: PlanComparisonCategory[] = [
  {
    category: 'Kapasitas & Batasan',
    items: [
      {
        name: 'Jumlah proyek aktif',
        free: '1 proyek',
        monthly: '5 proyek',
        thesis: 'Tidak terbatas (batas wajar)',
      },
      {
        name: 'Maksimum data responden',
        free: '50 responden',
        monthly: 'Tidak terbatas (batas wajar)',
        thesis: 'Tidak terbatas (batas wajar)',
      },
      {
        name: 'Maksimum butir pertanyaan',
        free: '30 butir pertanyaan',
        monthly: 'Tidak terbatas',
        thesis: 'Tidak terbatas',
      },
      {
        name: 'Riwayat versi dataset dan analisis',
        free: '1 versi',
        monthly: '5 versi',
        thesis: 'Riwayat versi dataset dan analisis',
      },
    ],
  },
  {
    category: 'Cakupan Uji Statistik',
    items: [
      { name: 'Statistik Deskriptif', free: true, monthly: true, thesis: true },
      { name: 'Uji Validitas Pearson Product Moment', free: true, monthly: true, thesis: true },
      { name: "Uji Reliabilitas Cronbach's Alpha", free: false, monthly: true, thesis: true },
      { name: 'Uji Normalitas (Kolmogorov-Smirnov)', free: false, monthly: true, thesis: true },
      { name: 'Uji Multikolinearitas (VIF & Tolerance)', free: false, monthly: true, thesis: true },
      { name: 'Uji Heteroskedastisitas (Glejser)', free: false, monthly: true, thesis: true },
      { name: 'Regresi Linier Berganda (Uji t, Uji F, R²)', free: false, monthly: true, thesis: true },
      { name: 'Korelasi Pearson & ANOVA Satu Arah', free: false, monthly: true, thesis: true },
    ],
  },
  {
    category: 'Hasil & Ekspor',
    items: [
      { name: 'Format tabel standar APA 7th Edition', free: true, monthly: true, thesis: true },
      { name: 'Naskah interpretasi kaidah Bab 4', free: true, monthly: true, thesis: true },
      { name: 'Jejak Hitung (Audit Trail formula)', free: true, monthly: true, thesis: true },
      {
        name: 'Ekspor Word (.docx) & PDF',
        free: 'Ekspor ber-watermark',
        monthly: 'Ekspor Word dan PDF tanpa watermark',
        thesis: 'Ekspor Word dan PDF tanpa watermark',
      },
      { name: 'Dokumen Pernyataan Penggunaan Alat', free: false, monthly: true, thesis: true },
      { name: 'Riwayat versi dataset dan analisis', free: false, monthly: false, thesis: true },
    ],
  },
];

export function getPlanConfig(planId: SubscriptionPlan | string): PlanConfig {
  const found = PLANS.find((p) => p.id === planId);
  return found || PLANS[0];
}

export function canCreateProject(planId: SubscriptionPlan, currentCount: number): boolean {
  const plan = getPlanConfig(planId);
  return currentCount < plan.quotaProjects;
}

export function canAddRespondents(planId: SubscriptionPlan, respondentCount: number): boolean {
  const plan = getPlanConfig(planId);
  return respondentCount <= plan.quotaRespondents;
}

export function canAddQuestions(planId: SubscriptionPlan, questionCount: number): boolean {
  const plan = getPlanConfig(planId);
  return questionCount <= plan.quotaQuestions;
}

export function isTestAllowed(planId: SubscriptionPlan, testId: string): boolean {
  const plan = getPlanConfig(planId);
  if (plan.allowedTests === 'all') return true;
  return plan.allowedTests.includes(testId);
}

export function getRetentionPeriodDays(planId: SubscriptionPlan): number {
  return getPlanConfig(planId).retentionDays;
}
