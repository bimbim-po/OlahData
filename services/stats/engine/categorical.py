from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd
from scipy import stats
from engine.formatter import format_p_value

def compute_chi_square(
    df: pd.DataFrame,
    row_var: str,
    col_var: str,
    significance_level: float = 0.05
) -> Dict[str, Any]:
    """
    Computes Chi-Square Test of Independence with Cochran Rule Evaluation:
    1. Cross-tabulation (observed frequencies)
    2. Expected frequencies E_ij = (Row_i * Col_j) / N
    3. Pearson Chi-Square test (without continuity correction)
    4. Yates' continuity correction Chi-Square (for 2x2 tables)
    5. Fisher's Exact Test (for 2x2 tables)
    6. Cochran Rule: Warning if > 20% of expected cells have frequency < 5
    """
    clean_df = df[[row_var, col_var]].dropna()
    ct = pd.crosstab(clean_df[row_var], clean_df[col_var])

    if ct.shape[0] < 2 or ct.shape[1] < 2:
        raise ValueError(f"Tabel kontingensi harus memiliki minimal 2 baris dan 2 kolom. Ditemukan dimensi: {ct.shape}.")

    # Uncorrected Chi-Square
    chi2_stat, chi2_p, chi2_df, expected_freq = stats.chi2_contingency(ct, correction=False)
    chi2_stat = float(chi2_stat)
    chi2_p = float(chi2_p)
    chi2_df = int(chi2_df)

    # 2x2 specific calculations: Yates correction & Fisher's Exact
    is_2x2 = (ct.shape == (2, 2))
    yates_stat, yates_p = None, None
    odds_ratio, fisher_p = None, None

    if is_2x2:
        yates_s, yates_pv, _, _ = stats.chi2_contingency(ct, correction=True)
        yates_stat = float(yates_s)
        yates_p = float(yates_pv)

        or_val, f_pval = stats.fisher_exact(ct)
        odds_ratio = float(or_val)
        fisher_p = float(f_pval)

    # Cochran rule evaluation
    min_exp = float(np.min(expected_freq))
    pct_less_than_5 = float(np.mean(expected_freq < 5.0) * 100.0)
    cochran_violated = bool(pct_less_than_5 > 20.0 or min_exp < 1.0)

    warnings: List[str] = []
    if cochran_violated:
        if is_2x2:
            warnings.append(
                f"Asumsi Cochran dilanggar ({pct_less_than_5:.1f}% sel memiliki frekuensi harapan < 5). "
                "Untuk tabel 2x2, gunakan hasil Uji Eksak Fisher (Fisher's Exact Test) sebagai rujukan utama."
            )
        else:
            warnings.append(
                f"Asumsi Cochran dilanggar ({pct_less_than_5:.1f}% sel memiliki frekuensi harapan < 5). "
                "Disarankan menggabungkan kategori yang berdekatan atau mengumpulkan sampel tambahan."
            )

    return {
        "rowVar": row_var,
        "colVar": col_var,
        "observed": ct.to_dict(),
        "expected": expected_freq.tolist(),
        "chiSquare": chi2_stat,
        "df": chi2_df,
        "pValue": chi2_p,
        "pFormatted": format_p_value(chi2_p),
        "significant": bool(chi2_p < significance_level),
        "yatesChiSquare": yates_stat if yates_stat is not None else chi2_stat,
        "yatesPValue": yates_p if yates_p is not None else chi2_p,
        "oddsRatio": odds_ratio if odds_ratio is not None else 1.0,
        "fisherPValue": fisher_p if fisher_p is not None else chi2_p,
        "minExpected": min_exp,
        "cellsLessThan5Percent": pct_less_than_5,
        "cochranViolated": cochran_violated,
        "warnings": warnings,
        "decision": "Terdapat hubungan/asosiasi yang signifikan antar variabel" if chi2_p < significance_level else "Tidak terdapat hubungan/asosiasi yang signifikan antar variabel"
    }
