from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd
from scipy import stats
from statsmodels.stats.multicomp import pairwise_tukeyhsd
from engine.formatter import format_p_value

def compute_two_group_difference(
    df: pd.DataFrame,
    group_col: str,
    value_col: str,
    significance_level: float = 0.05
) -> Dict[str, Any]:
    """
    Computes comparative difference test for 2 independent groups:
    1. Levene's Test for Homogeneity of Variances (median-centered Brown-Forsythe)
    2. Student's Independent Samples t-test (assumes equal variances)
    3. Welch's t-test (does not assume equal variances)
    4. Mann-Whitney U test (non-parametric companion)
    5. Cohen's d effect size using pooled standard deviation
    """
    clean_df = df[[group_col, value_col]].dropna()
    unique_groups = clean_df[group_col].unique()

    if len(unique_groups) != 2:
        raise ValueError(f"Variabel kelompok '{group_col}' harus memiliki tepat 2 kategori, ditemukan: {len(unique_groups)}.")

    g1_name, g2_name = unique_groups[0], unique_groups[1]
    g1 = clean_df[clean_df[group_col] == g1_name][value_col].values
    g2 = clean_df[clean_df[group_col] == g2_name][value_col].values

    n1, n2 = len(g1), len(g2)
    if n1 < 2 or n2 < 2:
        raise ValueError("Ukuran sampel per kelompok minimal 2 responden.")

    # 1. Levene test (median centered)
    lev_stat, lev_p = stats.levene(g1, g2, center="median")
    lev_stat = float(lev_stat)
    lev_p = float(lev_p)
    equal_var = bool(lev_p >= significance_level)

    # 2. Independent t-test (equal variance)
    t_equal_stat, t_equal_p = stats.ttest_ind(g1, g2, equal_var=True)

    # 3. Welch t-test (unequal variance)
    t_welch_stat, t_welch_p = stats.ttest_ind(g1, g2, equal_var=False)

    # Appropriate t-test based on Levene
    recommended_t = t_equal_stat if equal_var else t_welch_stat
    recommended_p = t_equal_p if equal_var else t_welch_p
    t_test_name = "Independent Samples t-test (Equal Variances Assumed)" if equal_var else "Welch's t-test (Equal Variances Not Assumed)"

    # 4. Mann-Whitney U test (non-parametric companion)
    mwu_stat, mwu_p = stats.mannwhitneyu(g1, g2, alternative="two-sided")

    # 5. Cohen's d using pooled standard deviation
    s1, s2 = float(g1.std(ddof=1)), float(g2.std(ddof=1))
    s_pooled = np.sqrt(((n1 - 1) * (s1 ** 2) + (n2 - 1) * (s2 ** 2)) / (n1 + n2 - 2))
    cohens_d = float((g1.mean() - g2.mean()) / s_pooled) if s_pooled > 1e-12 else 0.0

    return {
        "groupVar": group_col,
        "valueVar": value_col,
        "groupNames": [str(g1_name), str(g2_name)],
        "sampleSizes": [int(n1), int(n2)],
        "means": [float(g1.mean()), float(g2.mean())],
        "stdDevs": [s1, s2],
        "levene": {
            "stat": lev_stat,
            "statistic": lev_stat,
            "p": lev_p,
            "pValue": lev_p,
            "pFormatted": format_p_value(lev_p),
            "equalVariance": equal_var,
            "interpretation": "Varians kedua kelompok homogen" if equal_var else "Varians kedua kelompok tidak homogen"
        },
        "independentTTest": {
            "t": float(t_equal_stat),
            "p": float(t_equal_p),
            "pFormatted": format_p_value(float(t_equal_p)),
            "significant": bool(t_equal_p < significance_level)
        },
        "welchTTest": {
            "t": float(t_welch_stat),
            "p": float(t_welch_p),
            "pFormatted": format_p_value(float(t_welch_p)),
            "significant": bool(t_welch_p < significance_level)
        },
        "recommendedTest": {
            "name": t_test_name,
            "t": float(recommended_t),
            "p": float(recommended_p),
            "pFormatted": format_p_value(float(recommended_p)),
            "significant": bool(recommended_p < significance_level),
            "decision": "Terdapat perbedaan rata-rata yang signifikan antar kelompok" if recommended_p < significance_level else "Tidak terdapat perbedaan rata-rata yang signifikan antar kelompok"
        },
        "mannWhitney": {
            "u": float(mwu_stat),
            "p": float(mwu_p),
            "pFormatted": format_p_value(float(mwu_p)),
            "significant": bool(mwu_p < significance_level),
            "decision": "Uji non-parametrik mendukung kesimpulan" if (mwu_p < significance_level) == (recommended_p < significance_level) else "Perhatian: Hasil parametrik dan non-parametrik berbeda"
        },
        "cohensD": cohens_d
    }

def compute_three_plus_group_difference(
    df: pd.DataFrame,
    group_col: str,
    value_col: str,
    significance_level: float = 0.05
) -> Dict[str, Any]:
    """
    Computes comparative difference tests for 3+ independent groups:
    1. Levene's Test for Homogeneity of Variances (median-centered)
    2. One-Way ANOVA (f_oneway)
    3. Tukey HSD Post-Hoc Test (if ANOVA is significant)
    4. Kruskal-Wallis H Test (non-parametric companion)
    """
    clean_df = df[[group_col, value_col]].dropna()
    unique_groups = sorted(clean_df[group_col].unique())

    if len(unique_groups) < 3:
        raise ValueError(f"Variabel kelompok '{group_col}' harus memiliki minimal 3 kategori, ditemukan: {len(unique_groups)}.")

    group_data = [clean_df[clean_df[group_col] == grp][value_col].values for grp in unique_groups]

    # 1. Levene test
    lev_stat, lev_p = stats.levene(*group_data, center="median")
    lev_stat = float(lev_stat)
    lev_p = float(lev_p)

    # 2. One-way ANOVA
    anova_f, anova_p = stats.f_oneway(*group_data)
    anova_f = float(anova_f)
    anova_p = float(anova_p)
    is_anova_sig = bool(anova_p < significance_level)

    # 3. Kruskal-Wallis H test (non-parametric companion)
    kw_stat, kw_p = stats.kruskal(*group_data)
    kw_stat = float(kw_stat)
    kw_p = float(kw_p)

    # 4. Tukey HSD post-hoc test
    tukey = pairwise_tukeyhsd(endog=clean_df[value_col], groups=clean_df[group_col], alpha=significance_level)
    tukey_results: List[Dict[str, Any]] = []
    for row in tukey.summary().data[1:]:
        tukey_results.append({
            "group1": str(row[0]),
            "group2": str(row[1]),
            "meanDiff": float(row[2]),
            "pAdj": float(row[3]),
            "lower": float(row[4]),
            "upper": float(row[5]),
            "reject": bool(row[6])
        })

    return {
        "groupVar": group_col,
        "valueVar": value_col,
        "groupCount": len(unique_groups),
        "groupNames": [str(g) for g in unique_groups],
        "levene": {
            "stat": lev_stat,
            "statistic": lev_stat,
            "p": lev_p,
            "pValue": lev_p,
            "pFormatted": format_p_value(lev_p),
            "equalVariance": bool(lev_p >= significance_level)
        },
        "oneWayAnova": {
            "f": anova_f,
            "p": anova_p,
            "pFormatted": format_p_value(anova_p),
            "significant": is_anova_sig,
            "decision": "Terdapat perbedaan rata-rata signifikan antar kelompok" if is_anova_sig else "Tidak terdapat perbedaan rata-rata signifikan antar kelompok"
        },
        "kruskalWallis": {
            "h": kw_stat,
            "p": kw_p,
            "pFormatted": format_p_value(kw_p),
            "significant": bool(kw_p < significance_level)
        },
        "tukeyHsd": tukey_results
    }
