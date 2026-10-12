/**
 * Number Guard for AI Explanations in Indonesian Quantitative Thesis
 *
 * Principle: The LLM must NEVER invent or hallucinate numbers.
 * Any number written in the narrative must match numbers in the computed
 * statistical payload, or be an accepted academic benchmark constant (0.05, 0.01, 0.60, 0.70, 0.10, 10.0, 100).
 */

export interface NumberGuardResult {
  passed: boolean;
  extractedNumbers: number[];
  allowedNumbers: number[];
  unmatchedNumbers: number[];
  reason?: string;
}

// Academic constants that are standard in Indonesian thesis writing
const STANDARD_ACADEMIC_CONSTANTS = [
  0.05,  // standard alpha 5%
  0.01,  // alpha 1%
  0.10,  // multicollinearity tolerance cutoff
  0.60,  // Cronbach's alpha cutoff (Ghozali, Nunnally)
  0.70,  // alternative Cronbach cutoff
  10.0,  // VIF cutoff
  10,    // VIF integer
  1.0,   // perfect tolerance / correlation
  0.0,   // zero threshold
  100,   // percentage multiplier (e.g. 100%)
  1,     // scale min / model index
  5,     // Likert scale max
  2,     // degree of freedom offset (n - 2)
  4,     // Chapter 4 (Bab 4)
];

/**
 * Parses an Indonesian number string (e.g. "0,872", "1.250", "45,1%", "< 0,001") into a float.
 */
export function parseIdNumber(str: string): number | null {
  const clean = str.replace(/[><=~]/g, '').replace(/%/g, '').trim();
  if (!clean) return null;

  // Indonesian format: dots are thousands separators, comma is decimal separator
  // e.g. "1.250,50" -> "1250.50"
  // "0,872" -> "0.872"
  // "1.250" -> "1250" (if 3 digits follow) or "1.25" depending on context
  let standardized = clean;
  if (clean.includes(',') && clean.includes('.')) {
    // Both present: 1.250,50
    standardized = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    // Only comma: 0,872 -> 0.872
    standardized = clean.replace(',', '.');
  } else if (clean.includes('.')) {
    // Only dot: check if thousand separator (e.g. 1.250)
    const parts = clean.split('.');
    if (parts.length === 2 && parts[1].length === 3 && parseInt(parts[0], 10) >= 1) {
      // could be 1250
      standardized = clean.replace('.', '');
    }
  }

  const num = parseFloat(standardized);
  return isNaN(num) ? null : num;
}

/**
 * Extracts all numbers from text formatted in Indonesian locale.
 */
export function extractNumbersFromIndonesianText(text: string): number[] {
  // Regex to match Indonesian numbers:
  // e.g., 0,872, 1.250, 45,1%, < 0,001, 117, 3.682
  // We ignore chapter headings like "4.1" or "Bab 4" if specified
  const textWithoutBab = text.replace(/Bab\s*4(\.\d+)?/gi, '').replace(/Tabel\s*4(\.\d+)?/gi, '');
  
  const matches = textWithoutBab.match(/[-+]?[0-9]+([.,][0-9]+)*%?/g);
  if (!matches) return [];

  const results: number[] = [];
  for (const m of matches) {
    const val = parseIdNumber(m);
    if (val !== null) {
      results.push(val);
    }
  }
  return results;
}

/**
 * Flattens all numerical values from an arbitrary payload object/array.
 */
export function collectNumbersFromPayload(payload: unknown): number[] {
  const nums: number[] = [];

  function recurse(val: unknown) {
    if (typeof val === 'number' && !isNaN(val)) {
      nums.push(val);
      // Also add percentage version if between 0 and 1 (e.g. 0.451 -> 45.1)
      if (val >= 0 && val <= 1) {
        nums.push(val * 100);
      }
    } else if (Array.isArray(val)) {
      for (const item of val) recurse(item);
    } else if (val !== null && typeof val === 'object') {
      for (const k of Object.keys(val)) {
        recurse((val as Record<string, unknown>)[k]);
      }
    }
  }

  recurse(payload);
  return nums;
}

/**
 * Validates that every number in the explanation text appears in the statistical payload
 * or in the allowed standard constants list.
 * Tolerance: 0.005 for floating point rounding differences.
 */
export function validateExplanationNumbers(
  text: string,
  payload: unknown,
  customAllowedNumbers: number[] = []
): NumberGuardResult {
  const extracted = extractNumbersFromIndonesianText(text);
  const payloadNumbers = collectNumbersFromPayload(payload);
  const allowed = [...payloadNumbers, ...STANDARD_ACADEMIC_CONSTANTS, ...customAllowedNumbers];

  const tolerance = 0.005;
  const unmatched: number[] = [];

  for (const num of extracted) {
    const matched = allowed.some((a) => {
      // Direct tolerance check
      if (Math.abs(num - a) <= tolerance) return true;
      // Also check 1-decimal rounding (e.g. 45.1 vs 45.12)
      if (Math.abs(Math.round(num * 10) / 10 - Math.round(a * 10) / 10) <= 0.05) return true;
      return false;
    });

    if (!matched) {
      unmatched.push(num);
    }
  }

  const passed = unmatched.length === 0;
  return {
    passed,
    extractedNumbers: extracted,
    allowedNumbers: allowed,
    unmatchedNumbers: unmatched,
    reason: passed
      ? undefined
      : `Terdapat angka yang tidak ditemukan dalam hasil hitung statistik: ${unmatched.join(', ')}`,
  };
}
