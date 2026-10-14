/**
 * likert-guard.ts
 * Utilitas klasifikasi skala Likert deterministik dan Number Guard untuk OlahData.
 * Menjamin integritas angka akademik dan verifikasi klaim narasi.
 */

import { formatNumber } from './format';
import type { AnalysisResults, DescriptiveResult } from './api/types';

export interface LikertCategory {
  category: 'sangat rendah' | 'rendah' | 'sedang' | 'tinggi' | 'sangat tinggi';
  interval: string;
}

/**
 * Menentukan kategori skala Likert 1-5 berdasarkan interval baku:
 * 1,00 - 1,80 : sangat rendah
 * 1,81 - 2,60 : rendah
 * 2,61 - 3,40 : sedang
 * 3,41 - 4,20 : tinggi
 * 4,21 - 5,00 : sangat tinggi
 */
export function getLikertCategory(mean: number): LikertCategory {
  // Gunakan pembulatan presisi 2 desimal untuk mencegah floating point issue
  const rounded = Math.round(mean * 100) / 100;

  if (rounded <= 1.80) {
    return { category: 'sangat rendah', interval: '1,00–1,80' };
  }
  if (rounded <= 2.60) {
    return { category: 'rendah', interval: '1,81–2,60' };
  }
  if (rounded <= 3.40) {
    return { category: 'sedang', interval: '2,61–3,40' };
  }
  if (rounded <= 4.20) {
    return { category: 'tinggi', interval: '3,41–4,20' };
  }
  return { category: 'sangat tinggi', interval: '4,21–5,00' };
}

/**
 * Interval standar Likert dalam format teks untuk catatan tabel Bab 4
 */
export const LIKERT_INTERVAL_NOTE =
  'Interval kategori: 1,00–1,80 sangat rendah; 1,81–2,60 rendah; 2,61–3,40 sedang; 3,41–4,20 tinggi; 4,21–5,00 sangat tinggi.';

/**
 * Menghasilkan kalimat "Intinya" (Lapis 1) untuk Statistik Deskriptif
 * Menyebutkan kategori secara terpisah jika terdapat perbedaan kategori.
 */
export function generateDescriptiveIntinya(descriptive: DescriptiveResult[]): string {
  if (!descriptive || descriptive.length === 0) {
    return 'Belum ada data deskriptif yang dihitung.';
  }

  const items = descriptive.map((d) => {
    const cat = getLikertCategory(d.mean);
    const meanStr = formatNumber(d.mean, 3);
    return {
      variable: d.variable,
      mean: d.mean,
      meanStr,
      category: cat.category,
    };
  });

  // Periksa apakah semua kategori sama
  const firstCat = items[0].category;
  const allSameCategory = items.every((item) => item.category === firstCat);

  if (allSameCategory && items.length > 1) {
    const varDetails = items.map((it) => `${it.variable} memiliki rata-rata ${it.meanStr} (${firstCat})`).join('; ');
    return `Seluruh variabel penelitian berada pada kategori ${firstCat}, yaitu: ${varDetails}.`;
  }

  // Jika kategori berbeda, sebutkan terpisah secara eksplisit sesuai aturan QA
  // Format: "Kualitas Layanan (X) memiliki rata-rata 3,978 (tinggi); Loyalitas Pelanggan (Y) memiliki rata-rata 3,210 (sedang)."
  const parts = items.map((it) => `${it.variable} memiliki rata-rata ${it.meanStr} (${it.category})`);
  return parts.join('; ') + '.';
}

/**
 * Menghasilkan kalimat "Intinya" untuk Uji Validitas
 */
export function generateValidityIntinya(results: AnalysisResults): string {
  const validity = results.validity || [];
  if (validity.length === 0) return 'Belum ada data uji validitas.';

  const invalid = validity.filter((v) => !v.valid);
  const rTabel = validity[0]?.rTabel ?? 0.1816;
  const rTabelStr = formatNumber(rTabel, 4);

  if (invalid.length === 0) {
    return `Seluruh ${validity.length} butir instrumen terbukti valid (r hitung > ${rTabelStr}), sehingga layak digunakan dalam penelitian.`;
  }

  const invalidNames = invalid.map((iv) => iv.item).join(', ');
  return `Terdapat ${invalid.length} butir yang gugur (${invalidNames}) karena r hitung < ${rTabelStr}; ${validity.length - invalid.length} butir lainnya dinyatakan valid.`;
}

/**
 * Menghasilkan kalimat "Intinya" untuk Uji Reliabilitas
 */
export function generateReliabilityIntinya(results: AnalysisResults): string {
  const rel = results.reliability || [];
  if (rel.length === 0) return 'Belum ada data uji reliabilitas.';

  const unreliable = rel.filter((r) => !r.reliable);
  if (unreliable.length === 0) {
    const parts = rel.map((r) => `${r.construct} (${formatNumber(r.cronbachAlpha, 3)})`).join(', ');
    return `Seluruh konstruk penelitian dinyatakan reliabel (Cronbach's Alpha > 0,600), meliputi ${parts}.`;
  }

  const badNames = unreliable.map((r) => r.construct).join(', ');
  return `Konstruk ${badNames} belum memenuhi ambang batas reliabilitas 0,600; konstruk lainnya dinyatakan reliabel.`;
}

/**
 * Menghasilkan kalimat "Intinya" untuk Uji Asumsi Klasik
 */
export function generateAssumptionsIntinya(results: AnalysisResults): string {
  const norm = results.normality?.[0];
  const multiProblem = results.multicollinearity?.some((m) => m.problematic);
  const heteroProblem = results.heteroscedasticity?.some((h) => h.significant);

  const issues: string[] = [];
  if (norm && !norm.normal) issues.push('residual belum berdistribusi normal');
  if (multiProblem) issues.push('terdapat gejala multikolinearitas');
  if (heteroProblem) issues.push('terindikasi heteroskedastisitas');

  if (issues.length === 0) {
    return 'Seluruh asumsi klasik (normalitas residual, bebas multikolinearitas, dan homoskedastisitas) terpenuhi dengan baik.';
  }

  return `Perhatian pada asumsi klasik: ${issues.join(', ')}.`;
}

/**
 * Menghasilkan kalimat "Intinya" untuk Regresi Linier
 */
export function generateRegressionIntinya(results: AnalysisResults): string {
  const reg = results.regression || [];
  const fTest = results.fTest;
  const det = results.determination;

  if (reg.length === 0) return 'Belum ada data regresi linier.';

  const sigVars = reg.filter((r) => !r.variable.includes('Konstanta') && r.significant);
  const sigNames = sigVars.map((r) => `${r.variable} (t = ${formatNumber(r.tHitung, 2)})`).join(', ');

  const r2Pct = det ? formatNumber(det.rSquare * 100, 1) : '-';

  if (fTest && fTest.significant) {
    return sigVars.length > 0
      ? `Secara simultan model berpengaruh signifikan (F = ${formatNumber(fTest.fHitung, 2)}, p < 0,05) dengan R² = ${r2Pct}%; variabel yang berpengaruh signifikan secara parsial meliputi ${sigNames}.`
      : `Model regresi signifikan secara simultan (F = ${formatNumber(fTest.fHitung, 2)}), namun tidak ada variabel bebas yang signifikan secara parsial.`;
  }

  return `Model regresi belum menunjukkan pengaruh simultan yang signifikan (F = ${fTest ? formatNumber(fTest.fHitung, 2) : '-'}, p ≥ 0,05).`;
}

/**
 * Menghasilkan kalimat "Intinya" untuk Korelasi
 */
export function generateCorrelationIntinya(results: AnalysisResults): string {
  const corr = results.correlation || [];
  if (corr.length === 0) return 'Belum ada data korelasi.';

  const parts = corr.map(
    (c) => `${c.variable1} & ${c.variable2} (r = ${formatNumber(c.coefficient, 3)}, ${c.strength.toLowerCase()})`
  );
  return `Korelasi Pearson antar variabel: ${parts.join('; ')}.`;
}

/**
 * Number Guard Validator:
 * Memastikan tidak ada klaim narasi yang menyebut angka atau ambang batas
 * yang bertentangan dengan hasil perhitungan deterministik.
 */
export function validateNarrativeClaims(
  narrative: string,
  descriptive: DescriptiveResult[]
): { valid: boolean; rejectedClaims: string[] } {
  const rejectedClaims: string[] = [];

  // 1. Periksa klaim "di atas X" atau "di bawah X"
  const thresholdRegex = /di\s+(?:atas|bawah)\s+(\d+(?:,\d+)?)/gi;
  let match: RegExpExecArray | null;

  while ((match = thresholdRegex.exec(narrative)) !== null) {
    const rawThreshold = match[1].replace(',', '.');
    const threshold = parseFloat(rawThreshold);
    const isAbove = match[0].toLowerCase().includes('di atas');

    if (!isNaN(threshold) && descriptive.length > 0) {
      if (isAbove) {
        // Klaim "seluruh ... di atas X"
        const isClaimAll = match.input.toLowerCase().includes('seluruh') || match.input.toLowerCase().includes('semua');
        if (isClaimAll) {
          const allAbove = descriptive.every((d) => d.mean > threshold);
          if (!allAbove) {
            rejectedClaims.push(`Klaim "seluruh di atas ${match[1]}" salah: ada mean di bawah ${match[1]}`);
          }
        }
      }
    }
  }

  // 2. Periksa kategori yang disebut dalam narasi
  for (const d of descriptive) {
    const correctCat = getLikertCategory(d.mean).category;
    const allCategories: LikertCategory['category'][] = [
      'sangat rendah',
      'rendah',
      'sedang',
      'tinggi',
      'sangat tinggi',
    ];

    for (const cat of allCategories) {
      if (cat !== correctCat) {
        // Cek jika narasi mengklaim variabel d.variable berkategori cat
        const falseClaimRegex = new RegExp(`${escapeRegExp(d.variable)}.*berkategori\\s+${cat}`, 'i');
        if (falseClaimRegex.test(narrative)) {
          rejectedClaims.push(
            `Klaim kategori salah untuk ${d.variable}: tertulis "${cat}", seharusnya "${correctCat}"`
          );
        }
      }
    }
  }

  return {
    valid: rejectedClaims.length === 0,
    rejectedClaims,
  };
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Verifikasi konsistensi N antara objek hasil dan tabel-tabelnya
 */
export function verifyNConsistency(results: AnalysisResults): {
  consistent: boolean;
  expectedN: number;
  inconsistentTables: string[];
} {
  const n = results.respondentCount;
  const inconsistentTables: string[] = [];

  if (results.descriptive && results.descriptive.length > 0) {
    const descMismatch = results.descriptive.some((d) => d.n !== n);
    if (descMismatch) {
      inconsistentTables.push('Statistik Deskriptif');
    }
  }

  return {
    consistent: inconsistentTables.length === 0,
    expectedN: n,
    inconsistentTables,
  };
}
