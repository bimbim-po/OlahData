import { create } from 'zustand';
import type { SubscriptionPlan, User } from '@/lib/api/types';
import { useAuthStore } from '@/stores/auth-store';

export interface PlanEntitlements {
  tier: SubscriptionPlan;
  name: string;
  price: number;
  periodLabel: string;
  maxActiveProjects: number; // 1 for free, 1 for monthly, 3 for thesis
  maxRespondents: number; // 150 for free, 500 for monthly, 2500 for thesis
  maxItems: number; // 30 for free, 150 for monthly, Infinity for thesis
  allowedTests: string[]; // ['descriptive', 'validity', 'reliability'] for free, ['*'] for pro
  allowExportAndCopy: boolean; // false on free for user's own projects
  allowDatasetVersioning: boolean; // false on free, false on monthly (max 1 clean version), true on thesis (unlimited)
  features: string[];
}

export const PLAN_ENTITLEMENTS: Record<SubscriptionPlan, PlanEntitlements> = {
  free: {
    tier: 'free',
    name: 'Coba Gratis',
    price: 0,
    periodLabel: 'Rp 0',
    maxActiveProjects: 1,
    maxRespondents: 150,
    maxItems: 30,
    allowedTests: ['descriptive', 'validity', 'reliability'],
    allowExportAndCopy: false,
    allowDatasetVersioning: false,
    features: [
      '1 proyek aktif',
      'Hingga 150 data responden (cukup untuk N=100)',
      'Maksimal 30 butir pertanyaan',
      'Uji Statistik Deskriptif, Validitas, & Reliabilitas',
      'Kunci paywall pada Asumsi Klasik & Regresi',
      'Ekspor ber-watermark (pratinjau)',
    ],
  },
  monthly: {
    tier: 'monthly',
    name: 'Paket Bulanan',
    price: 39000,
    periodLabel: 'Rp 39.000 / 30 hari',
    maxActiveProjects: 1,
    maxRespondents: 500,
    maxItems: 150,
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
    allowExportAndCopy: true,
    allowDatasetVersioning: false,
    features: [
      '1 proyek skripsi aktif (kunci konstruk variabel)',
      'Maksimal 500 data responden',
      'Hingga 150 butir instrumen pertanyaan',
      'Semua uji statistik dasar & asumsi klasik',
      'Regresi linier berganda & uji hipotesis',
      'Ekspor Word (.docx) & PDF resmi tanpa watermark',
      'Salin semua tabel standar APA 7th Edition',
    ],
  },
  thesis: {
    tier: 'thesis',
    name: 'Paket Skripsi Tuntas',
    price: 99000,
    periodLabel: 'Rp 99.000 / 90 hari',
    maxActiveProjects: 3,
    maxRespondents: 2500,
    maxItems: Infinity,
    allowedTests: ['*'],
    allowExportAndCopy: true,
    allowDatasetVersioning: true,
    features: [
      '3 proyek aktif (pilot test, data utama, & revisi sidang)',
      'Hingga 2.500 data responden',
      'Instrumen butir pertanyaan tak terbatas',
      'Semua fitur Paket Bulanan',
      'Dukungan Uji Mediasi (Sobel/Path) & Moderasi (MRA)',
      'Fitur "Obat Data" (Auto-Transformasi & Outlier Trimming)',
      'Ekspor Lampiran Matriks Statistik (Siap Cetak untuk Dospem)',
      'Multi-versi pembersihan data & jejak hitung tanpa batas',
      'Bekal sidang skripsi (kartu tanya-jawab metodologi dosen)',
    ],
  },
};

/**
 * Mendapatkan konfigurasi batasan kuota untuk paket tertentu
 */
export function getEntitlements(plan: SubscriptionPlan = 'free'): PlanEntitlements {
  return PLAN_ENTITLEMENTS[plan] || PLAN_ENTITLEMENTS.free;
}

/**
 * Memeriksa apakah suatu proyek merupakan proyek demo/contoh bawaan
 */
export function isSampleProject(projectOrId: { id?: string; title?: string } | string | null | undefined): boolean {
  if (!projectOrId) return false;
  const id = typeof projectOrId === 'string' ? projectOrId : projectOrId.id || '';
  const title = typeof projectOrId === 'string' ? '' : projectOrId.title?.toLowerCase() || '';
  return (
    id === 'sample' ||
    id.startsWith('sample') ||
    id.startsWith('project-sample') ||
    id === 'project-1' ||
    id === 'project-2' ||
    id === 'project-3' ||
    title.includes('kualitas layanan dan kepuasan') ||
    title.includes('contoh') ||
    title.includes('simulasi')
  );
}

/**
 * Memeriksa apakah suatu pengujian statistik terkunci pada paket pengguna
 */
export function isTestLockedForPlan(plan: SubscriptionPlan = 'free', testId: string): boolean {
  const testNorm = testId.toLowerCase();

  // Uji mediasi, moderasi, atau obat data eksklusif di Paket Skripsi Tuntas
  if (['mediation', 'moderation', 'data_remedy', 'obat_data', 'sobel', 'mra'].includes(testNorm)) {
    return plan !== 'thesis';
  }

  if (plan === 'monthly' || plan === 'thesis') return false;

  const freeAllowed = ['descriptive', 'validity', 'reliability'];
  return !freeAllowed.includes(testNorm);
}

/**
 * Memeriksa apakah pengguna boleh membuat proyek baru
 */
export function canCreateNewProject(plan: SubscriptionPlan = 'free', userCustomProjectsCount: number): boolean {
  const limit = getEntitlements(plan).maxActiveProjects;
  return userCustomProjectsCount < limit;
}

/**
 * Memeriksa kuota responden dataset
 */
export function checkRespondentQuota(
  plan: SubscriptionPlan = 'free',
  count: number,
  isSample = false
): { allowed: boolean; maxAllowed: number; excess: number } {
  if (isSample) return { allowed: true, maxAllowed: Infinity, excess: 0 };
  const max = getEntitlements(plan).maxRespondents;
  const allowed = count <= max;
  return {
    allowed,
    maxAllowed: max,
    excess: allowed ? 0 : count - max,
  };
}

/**
 * Memeriksa kuota butir pertanyaan kuesioner
 */
export function checkQuestionQuota(
  plan: SubscriptionPlan = 'free',
  count: number,
  isSample = false
): { allowed: boolean; maxAllowed: number; excess: number } {
  if (isSample) return { allowed: true, maxAllowed: Infinity, excess: 0 };
  const max = getEntitlements(plan).maxItems;
  const allowed = count <= max;
  return {
    allowed,
    maxAllowed: max,
    excess: allowed ? 0 : count - max,
  };
}

/**
 * Memeriksa izin ekspor dokumen Word / PDF / Salin Tabel
 */
export function canExportProject(plan: SubscriptionPlan = 'free', isSample = false): boolean {
  if (isSample) return true; // Proyek contoh selalu boleh diekspor sebagai pratinjau kualitas
  return getEntitlements(plan).allowExportAndCopy;
}

/**
 * Memeriksa izin pembersihan outlier (dataset versioning)
 */
export function canPerformOutlierCleaning(
  plan: SubscriptionPlan = 'free',
  currentCleanedVersionCount = 0
): { allowed: boolean; reason?: string } {
  if (plan === 'thesis') {
    return { allowed: true };
  }
  if (plan === 'monthly') {
    if (currentCleanedVersionCount < 1) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Paket Bulanan dibatasi maksimal 1 versi data bersih. Upgrade ke Paket Skripsi Tuntas untuk membuat revisi data tanpa batas.',
    };
  }
  return {
    allowed: false,
    reason: 'Fitur "Obat Data" & Eliminasi Outlier otomatis memerlukan Paket Skripsi Tuntas.',
  };
}

// =============================================================================
// ZUSTAND MODAL STATE UNTUK CHECKOUT & UPGRADE
// =============================================================================

export interface UpgradeModalStore {
  isOpen: boolean;
  selectedPlan: SubscriptionPlan;
  triggerReason: string;
  projectId?: string;
  initialStep?: 'compare' | 'qris' | 'whatsapp' | 'waitlist';
  openUpgradeModal: (options?: {
    plan?: SubscriptionPlan;
    reason?: string;
    projectId?: string;
    step?: 'compare' | 'qris' | 'whatsapp' | 'waitlist';
  }) => void;
  closeUpgradeModal: () => void;
}

export const useUpgradeModal = create<UpgradeModalStore>((set) => ({
  isOpen: false,
  selectedPlan: 'monthly',
  triggerReason: 'Akses Penuh Seluruh Fitur Skripsi',
  projectId: undefined,
  initialStep: 'compare',
  openUpgradeModal: (options) =>
    set({
      isOpen: true,
      selectedPlan: options?.plan || 'monthly',
      triggerReason: options?.reason || 'Akses Penuh Seluruh Fitur Skripsi',
      projectId: options?.projectId,
      initialStep: options?.step || 'compare',
    }),
  closeUpgradeModal: () => set({ isOpen: false }),
}));

// =============================================================================
// REACT HOOK: usePlanGate
// =============================================================================

export function usePlanGate(projectId?: string, isSample = false) {
  const { user, updateUser } = useAuthStore();
  const plan: SubscriptionPlan = user?.plan || 'free';
  const entitlements = getEntitlements(plan);
  const { openUpgradeModal } = useUpgradeModal();

  return {
    user,
    plan,
    entitlements,
    isFree: plan === 'free',
    isPro: plan === 'monthly' || plan === 'thesis',
    isThesis: plan === 'thesis',
    isSampleProject: isSample,
    isTestLocked: (testId: string) => isTestLockedForPlan(plan, testId),
    canExport: canExportProject(plan, isSample),
    canCreateProject: (customCount: number) => canCreateNewProject(plan, customCount),
    checkRespondentQuota: (count: number) => checkRespondentQuota(plan, count, isSample),
    checkQuestionQuota: (count: number) => checkQuestionQuota(plan, count, isSample),
    openUpgradeModal: (
      optionsOrReason?:
        | string
        | {
            plan?: SubscriptionPlan;
            reason?: string;
            projectId?: string;
            step?: 'compare' | 'qris' | 'whatsapp' | 'waitlist';
          },
      targetPlan?: SubscriptionPlan
    ) => {
      if (typeof optionsOrReason === 'object' && optionsOrReason !== null) {
        openUpgradeModal({
          ...optionsOrReason,
          projectId: optionsOrReason.projectId || projectId,
        });
      } else {
        openUpgradeModal({
          reason: optionsOrReason,
          plan: targetPlan || 'monthly',
          projectId,
        });
      }
    },
    upgradePlanLocally: (targetPlan: SubscriptionPlan) => {
      updateUser({ plan: targetPlan });
    },
  };
}
