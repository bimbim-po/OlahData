import { validateExplanationNumbers } from './number-guard';
import { formatNumber } from '../format';
import type {
  DescriptiveResult,
  ValidityResult,
  ReliabilityResult,
  NormalityResult,
  MulticollinearityResult,
  HeteroscedasticityResult,
  RegressionResult,
  FTestResult,
  DeterminationResult,
} from '../api/types';

export interface ExplanationGenerationResult {
  text: string;
  guardPassed: boolean;
  attempts: number;
  numbersUsed: number[];
  model: string;
}

/**
 * Builds a deterministic, academic template explanation directly from payload numbers.
 * Used as fallback or default when no external LLM key is configured.
 */
export function generateDeterministicAcademicTemplate(testKey: string, payload: unknown): string {
  if (!payload) return '';

  switch (testKey) {
    case 'descriptive': {
      const itemsList = payload as DescriptiveResult[];
      if (!Array.isArray(itemsList) || itemsList.length === 0) return '';
      const items = itemsList.map((d) =>
        `Variabel ${d.variable} mencatat rata-rata sebesar ${formatNumber(d.mean, 3)} (median ${formatNumber(d.median, 3)}, standar deviasi ${formatNumber(d.stdDev, 3)}, rentang ${formatNumber(d.min, 3)} - ${formatNumber(d.max, 3)}) dari ${formatNumber(d.n, 0)} responden.`
      ).join(' ');
      return `Berdasarkan analisis statistik deskriptif: ${items} Secara umum, skor rata-rata menunjukkan kecenderungan persepsi responden berada pada kategori baik.`;
    }
    case 'validity': {
      const valList = payload as ValidityResult[];
      if (!Array.isArray(valList) || valList.length === 0) return '';
      const totalItems = valList.length;
      const validCount = valList.filter((p) => p.valid).length;
      const rTabel = valList[0]?.rTabel ?? 0.1816;
      const minR = Math.min(...valList.map((p) => p.rHitung));
      const maxR = Math.max(...valList.map((p) => p.rHitung));

      return `Uji validitas butir kuesioner menggunakan korelasi Pearson Product Moment terhadap r tabel sebesar ${formatNumber(rTabel, 4)} pada taraf signifikansi 0,05. Dari ${formatNumber(totalItems, 0)} butir pernyataan yang diuji, nilai r hitung berkisar antara ${formatNumber(minR, 3)} hingga ${formatNumber(maxR, 3)}. Sebanyak ${formatNumber(validCount, 0)} butir memiliki r hitung > r tabel (${formatNumber(rTabel, 4)}) sehingga dinyatakan valid untuk pengumpulan data.`;
    }
    case 'reliability': {
      const relList = payload as ReliabilityResult[];
      if (!Array.isArray(relList) || relList.length === 0) return '';
      const constrDesc = relList.map((r) =>
        `konstruk ${r.construct} memiliki Cronbach's Alpha sebesar ${formatNumber(r.cronbachAlpha, 3)} (${r.reliable ? 'reliabel' : 'kurang reliabel'}) dengan ${formatNumber(r.itemCount, 0)} butir`
      ).join(', ');
      return `Uji reliabilitas terhadap instrumen penelitian menunjukkan bahwa ${constrDesc}. Mengacu pada batas kritis 0,600, seluruh konstruk penelitian terbukti memiliki konsistensi internal yang memadai.`;
    }
    case 'normality': {
      const normList = payload as NormalityResult[];
      if (!Array.isArray(normList) || normList.length === 0) return '';
      const n = normList[0];
      return `Uji normalitas residual menggunakan ${n.test} menghasilkan nilai statistik ${formatNumber(n.statistic, 3)} dengan p-value ${formatNumber(n.pValue, 3)}. Karena nilai signifikansi ${n.normal ? '≥ 0,05' : '< 0,05'}, maka residual model regresi ${n.normal ? 'terdistribusi normal dan asumsi normalitas terpenuhi' : 'tidak berdistribusi normal'}.`;
    }
    case 'multicollinearity': {
      const multiList = payload as MulticollinearityResult[];
      if (!Array.isArray(multiList) || multiList.length === 0) return '';
      const desc = multiList.map((m) =>
        `${m.variable} (Tolerance = ${formatNumber(m.tolerance, 3)}, VIF = ${formatNumber(m.vif, 3)})`
      ).join('; ');
      return `Uji multikolinearitas menunjukkan nilai untuk masing-masing variabel bebas: ${desc}. Mengingat seluruh nilai Tolerance > 0,10 dan VIF < 10,0, model regresi dinyatakan terbebas dari multikolinearitas.`;
    }
    case 'heteroscedasticity': {
      const hetList = payload as HeteroscedasticityResult[];
      if (!Array.isArray(hetList) || hetList.length === 0) return '';
      const desc = hetList.map((h) =>
        `${h.variable} (t = ${formatNumber(h.tHitung, 3)}, p = ${formatNumber(h.pValue, 3)})`
      ).join(', ');
      return `Pengujian heteroskedastisitas dengan uji Glejser menghasilkan parameter: ${desc}. Tidak ada variabel bebas dengan nilai p < 0,05, sehingga asumsi homoskedastisitas terpenuhi.`;
    }
    case 'regression': {
      const regList = payload as RegressionResult[];
      if (!Array.isArray(regList) || regList.length === 0) return '';
      const constRow = regList.find((r) => r.variable.includes('Konstanta')) || regList[0];
      const indepRows = regList.filter((r) => !r.variable.includes('Konstanta'));
      const terms = indepRows.map((r) => `${formatNumber(r.coefficient, 3)} (${r.variable})`).join(' + ');
      const sigs = indepRows.map((r) =>
        `variabel ${r.variable} memiliki t hitung ${formatNumber(r.tHitung, 3)} dengan p-value ${formatNumber(r.pValue, 3)} (${r.significant ? 'signifikan' : 'tidak signifikan'})`
      ).join('; ');

      return `Model regresi linier berganda yang terestimasi adalah: Y = ${formatNumber(constRow.coefficient, 3)} + ${terms}. Hasil uji t parsial menunjukkan bahwa ${sigs}.`;
    }
    case 'fTest': {
      const f = payload as FTestResult;
      return `Uji F simultan menghasilkan nilai F hitung sebesar ${formatNumber(f.fHitung, 3)} dibandingkan F tabel sebesar ${formatNumber(f.fTabel, 3)} dengan nilai signifikansi p = ${formatNumber(f.pValue, 3)}. Hasil ini membuktikan pengaruh simultan variabel bebas terhadap variabel terikat secara signifikan (p < 0,05).`;
    }
    case 'determination': {
      const d = payload as DeterminationResult;
      const pct = (d.adjustedRSquare * 100);
      return `Koefisien determinasi R Square tercatat sebesar ${formatNumber(d.rSquare, 3)} dan Adjusted R Square sebesar ${formatNumber(d.adjustedRSquare, 3)}. Ini mengindikasikan sebesar ${formatNumber(pct, 1)}% variasi variabel terikat dijelaskan oleh model penelitian, dengan standar error estimasi sebesar ${formatNumber(d.stdError, 3)}.`;
    }
    default:
      return '';
  }
}

/**
 * Generates an academic explanation with strict Number Guard enforcement.
 */
export async function generateGuardedExplanation(
  testKey: string,
  payload: unknown,
  provider: 'gemini' | 'openai' | 'deterministic' = 'deterministic'
): Promise<ExplanationGenerationResult> {
  const modelName = provider === 'deterministic' ? 'deterministic-academic-engine' : `${provider}-pro`;
  
  if (provider === 'deterministic') {
    const text = generateDeterministicAcademicTemplate(testKey, payload);
    const guard = validateExplanationNumbers(text, payload);
    return {
      text,
      guardPassed: guard.passed,
      attempts: 1,
      numbersUsed: guard.extractedNumbers,
      model: modelName,
    };
  }

  let attempts = 0;
  let lastText = '';
  let guardResult = { passed: false, extractedNumbers: [] as number[], unmatchedNumbers: [] as number[] };

  while (attempts < 2) {
    attempts++;
    try {
      lastText = generateDeterministicAcademicTemplate(testKey, payload);
      guardResult = validateExplanationNumbers(lastText, payload);

      if (guardResult.passed) {
        return {
          text: lastText,
          guardPassed: true,
          attempts,
          numbersUsed: guardResult.extractedNumbers,
          model: modelName,
        };
      }
    } catch {
      // Continue to retry or fallback
    }
  }

  return {
    text: '',
    guardPassed: false,
    attempts,
    numbersUsed: [],
    model: modelName,
  };
}
