from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd
from scipy import stats
from engine.formatter import format_p_value, format_r_value

def classify_correlation_strength(r_abs: float) -> str:
    """Classifies correlation coefficient magnitude according to Sugiyono (2019)."""
    if r_abs < 0.20:
        return "Sangat Lemah"
    elif r_abs < 0.40:
        return "Rendah"
    elif r_abs < 0.60:
        return "Sedang"
    elif r_abs < 0.80:
        return "Kuat"
    else:
        return "Sangat Kuat"

def compute_correlation(
    df: pd.DataFrame,
    variables: Optional[List[str]] = None,
    significance_level: float = 0.05,
    normality_status: Optional[Dict[str, bool]] = None
) -> Dict[str, Any]:
    """
    Computes both Pearson Product Moment and Spearman Rank (rho) Correlation Matrices.
    Includes p-value, sample size N, strength classification, and non-normality warning
    advising Spearman if normality is violated.
    """
    if variables is None:
        variables = [col for col in df.columns if pd.api.types.is_numeric_dtype(df[col])]

    n_vars = len(variables)
    pearson_matrix: Dict[str, Dict[str, Dict[str, Any]]] = {}
    spearman_matrix: Dict[str, Dict[str, Dict[str, Any]]] = {}
    pairwise_results: List[Dict[str, Any]] = []

    # Check non-normality warnings
    normality_warnings: List[str] = []
    if normality_status:
        for var, is_normal in normality_status.items():
            if not is_normal:
                normality_warnings.append(
                    f"Variabel '{var}' tidak berdistribusi normal. Disarankan merujuk pada korelasi Spearman rho daripada Pearson."
                )

    for v1 in variables:
        pearson_matrix[v1] = {}
        spearman_matrix[v1] = {}

    for i in range(n_vars):
        v1 = variables[i]
        for j in range(n_vars):
            v2 = variables[j]
            if v1 == v2:
                s1 = df[v1].dropna()
                n_pair = len(s1)
                pearson_matrix[v1][v2] = {"r": 1.0, "p": 0.0, "pFormatted": format_p_value(0.0), "n": n_pair, "significant": True}
                spearman_matrix[v1][v2] = {"rho": 1.0, "p": 0.0, "pFormatted": format_p_value(0.0), "n": n_pair, "significant": True}
                continue

            clean_pair = df[[v1, v2]].dropna()
            n_pair = len(clean_pair)

            if n_pair < 3:
                pearson_matrix[v1][v2] = {"r": 0.0, "p": 1.0, "n": n_pair}
                spearman_matrix[v1][v2] = {"rho": 0.0, "p": 1.0, "n": n_pair}
                continue

            # Pearson
            p_res = stats.pearsonr(clean_pair[v1], clean_pair[v2])
            rp = float(getattr(p_res, "statistic", p_res[0]))
            pp = float(getattr(p_res, "pvalue", p_res[1]))

            # Spearman
            s_res = stats.spearmanr(clean_pair[v1], clean_pair[v2])
            rs = float(getattr(s_res, "statistic", s_res[0]))
            ps = float(getattr(s_res, "pvalue", s_res[1]))

            pearson_matrix[v1][v2] = {
                "r": rp,
                "p": pp,
                "pFormatted": format_p_value(pp),
                "n": n_pair,
                "significant": bool(pp < significance_level)
            }

            spearman_matrix[v1][v2] = {
                "rho": rs,
                "p": ps,
                "pFormatted": format_p_value(ps),
                "n": n_pair,
                "significant": bool(ps < significance_level)
            }

            # Add to pairwise list if upper triangle
            if j > i:
                pairwise_results.append({
                    "variable1": v1,
                    "variable2": v2,
                    "pearsonR": rp,
                    "pearsonP": pp,
                    "spearmanRho": rs,
                    "spearmanP": ps,
                    "coefficient": rp,
                    "pValue": pp,
                    "significant": bool(pp < significance_level),
                    "strength": classify_correlation_strength(abs(rp)),
                    "n": n_pair
                })

    return {
        "pearson": pearson_matrix,
        "spearman": spearman_matrix,
        "pairwise": pairwise_results,
        "warnings": normality_warnings
    }
