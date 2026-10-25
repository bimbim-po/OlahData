import type { SubscriptionPlan } from './api/types';
import { LEGAL_CONFIG } from './legal-config';

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
  subBadge?: string;
  highlighted?: boolean;
  description: string;
  quotaProjects: number; // 1 for free, 1 for monthly, 3 for thesis
  quotaProjectsLabel: string;
  quotaRespondents: number; // 150 for free, 500 for monthly, 2500 for thesis
  quotaRespondentsLabel: string;
  quotaQuestions: number; // 30 for free, 150 for monthly, Infinity for thesis
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
export const CONTACT_EMAIL = LEGAL_CONFIG.contactEmail;
export const SUPPORT_EMAIL = LEGAL_CONFIG.supportEmail;

export const PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Coba Gratis',
    price: 0,
    period: '',
    billingCycleMonths: 0,
    highlighted: false,
    description: 'Uji instrumen validitas & reliabilitas hingga 150 responden',
    quotaProjects: 1,
    quotaProjectsLabel: '1 proyek aktif',
    quotaRespondents: 150,
    quotaRespondentsLabel: 'Hingga 150 data responden',
    quotaQuestions: 30,
    quotaQuestionsLabel: 'Maks. 30 butir pertanyaan',
    versionHistoryLimit: 1,
    versionHistoryLabel: '1 versi dataset',
    allowedTests: ['descriptive', 'validity', 'reliability'],
    exportType: 'watermark',
    exportLabel: 'Ekspor ber-watermark (Pratinjau)',
    hasDeclaration: false,
    hasVersionHistory: false,
    retentionDays: 30,
    features: [
      '1 proyek aktif',
      'Hingga 150 data responden (cukup untuk N=100)',
      'Uji Deskriptif, Validitas, & Reliabilitas',
      'Kunci paywall pada Asumsi Klasik & Regresi',
      'Ekspor ber-watermark',
    ],
    ctaText: 'Coba Gratis',
    waitlistText: 'Coba Gratis',
  },
  {
    id: 'monthly',
    name: 'Paket Bulanan',
    price: 39000,
    period: '/bulan',
    billingCycleMonths: 1,
    highlighted: false,
    description: '1 proyek skripsi aktif dengan fitur regresi & naskah Bab 4',
    quotaProjects: 1,
    quotaProjectsLabel: '1 proyek skripsi aktif (kunci konstruk)',
    quotaRespondents: 500,
    quotaRespondentsLabel: 'Maks. 500 data responden',
    quotaQuestions: 150,
    quotaQuestionsLabel: 'Hingga 150 butir pertanyaan',
    versionHistoryLimit: 1,
    versionHistoryLabel: '1 versi dataset aktif',
    allowedTests: [
      'descriptive',
      'validity',
      'reliability',
      'normality',
      'multicollinearity',
      'heteroscedasticity',
      'regression',
      'correlation',
      'ftest',
      'determination',
    ],
    exportType: 'clean',
    exportLabel: 'Ekspor Tabel APA 7th ke Word (.docx) & PDF',
    hasDeclaration: true,
    hasVersionHistory: false,
    retentionDays: 365,
    features: [
      '1 proyek skripsi aktif (kunci konstruk variabel)',
      'Maks. 500 data responden',
      'Semua uji statistik dasar & asumsi klasik',
      'Regresi linier berganda & uji hipotesis',
      'Draf narasi interpretasi Bab 4 lengkap',
      'Ekspor Word (.docx) & PDF tanpa watermark',
    ],
    ctaText: 'Pilih Bulanan',
    waitlistText: 'Daftar waiting list',
  },
  {
    id: 'thesis',
    name: 'Paket Skripsi Tuntas',
    price: 99000,
    period: '/3 bulan',
    billingCycleMonths: 3,
    badge: 'Rekomendasi Skripsi',
    subBadge: 'Hemat 80% dibanding jasa olah data & aman revisi sidang selama 3 bulan',
    highlighted: true,
    description: 'Solusi komprehensif 3 proyek: pilot test, data utama, hingga revisi dosen',
    quotaProjects: 3,
    quotaProjectsLabel: '3 proyek aktif (pilot test, data utama, & revisi)',
    quotaRespondents: 2500,
    quotaRespondentsLabel: 'Hingga 2.500 data responden',
    quotaQuestions: Infinity,
    quotaQuestionsLabel: 'Pertanyaan tak terbatas',
    versionHistoryLimit: Infinity,
    versionHistoryLabel: 'Riwayat versi dataset & analisis tak terbatas',
    allowedTests: 'all',
    exportType: 'clean',
    exportLabel: 'Ekspor Lampiran Lengkap Matriks Statistik (Siap Cetak Dospem)',
    hasDeclaration: true,
    hasVersionHistory: true,
    retentionDays: 730,
    features: [
      '3 proyek aktif (pilot test, data utama, & revisi sidang)',
      'Hingga 2.500 data responden',
      'Semua fitur paket Bulanan',
      'Dukungan Uji Mediasi (Sobel/Path) & Moderasi (MRA)',
      'Fitur "Obat Data" (Auto-Transformasi & Outlier Trimming)',
      'Ekspor Lampiran Matriks Statistik (Siap Cetak untuk Dospem)',
      'Riwayat versi dataset & jejak hitung tanpa batas',
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
        monthly: '1 proyek skripsi aktif (kunci konstruk)',
        thesis: '3 proyek aktif (pilot test, data utama, & revisi)',
      },
      {
        name: 'Maksimum data responden',
        free: 'Hingga 150 responden',
        monthly: 'Maks. 500 responden',
        thesis: 'Hingga 2.500 responden',
      },
      {
        name: 'Maksimum butir pertanyaan',
        free: '30 butir pertanyaan',
        monthly: 'Hingga 150 butir',
        thesis: 'Tidak terbatas',
      },
      {
        name: 'Riwayat versi dataset dan analisis',
        free: false,
        monthly: '1 versi',
        thesis: 'Riwayat versi tak terbatas',
      },
    ],
  },
  {
    category: 'Cakupan Uji Statistik',
    items: [
      { name: 'Statistik Deskriptif', free: true, monthly: true, thesis: true },
      { name: 'Uji Validitas Pearson Product Moment', free: true, monthly: true, thesis: true },
      { name: "Uji Reliabilitas Cronbach's Alpha", free: true, monthly: true, thesis: true },
      { name: 'Uji Normalitas (Kolmogorov-Smirnov & Shapiro-Wilk)', free: false, monthly: true, thesis: true },
      { name: 'Uji Multikolinearitas (VIF & Tolerance)', free: false, monthly: true, thesis: true },
      { name: 'Uji Heteroskedastisitas (Glejser)', free: false, monthly: true, thesis: true },
      { name: 'Regresi Linier Berganda (Uji t, Uji F, R²)', free: false, monthly: true, thesis: true },
      { name: 'Korelasi Pearson & ANOVA Satu Arah', free: false, monthly: true, thesis: true },
      { name: 'Uji Mediasi (Sobel / Path) & Moderasi (MRA)', free: false, monthly: false, thesis: true },
      { name: 'Fitur "Obat Data" (Auto-Transformasi & Outlier Trimming)', free: false, monthly: false, thesis: true },
    ],
  },
  {
    category: 'Hasil & Ekspor',
    items: [
      { name: 'Format tabel standar APA 7th Edition', free: true, monthly: true, thesis: true },
      { name: 'Naskah interpretasi kaidah Bab 4', free: 'Pratinjau terbatas', monthly: 'Draf Narasi Lengkap', thesis: 'Draf Narasi Lengkap' },
      { name: 'Jejak Hitung (Audit Trail formula)', free: true, monthly: true, thesis: true },
      {
        name: 'Ekspor Word (.docx) & PDF',
        free: 'Ekspor ber-watermark',
        monthly: 'Ekspor Word dan PDF tanpa watermark',
        thesis: 'Ekspor Word dan PDF tanpa watermark',
      },
      {
        name: 'Ekspor Lampiran Matriks Output Statistik (Siap Cetak)',
        free: false,
        monthly: false,
        thesis: true,
      },
      { name: 'Dokumen Pernyataan Penggunaan Alat', free: false, monthly: true, thesis: true },
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
  const testNormalized = testId.toLowerCase();

  // Uji mediasi, moderasi, atau obat data eksklusif di Paket Skripsi Tuntas
  if (['mediation', 'moderation', 'data_remedy', 'obat_data', 'sobel', 'mra'].includes(testNormalized)) {
    return planId === 'thesis';
  }

  if (plan.allowedTests === 'all') return true;
  return plan.allowedTests.includes(testNormalized);
}

export function getRetentionPeriodDays(planId: SubscriptionPlan): number {
  return getPlanConfig(planId).retentionDays;
}
