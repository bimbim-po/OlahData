from typing import List, Dict, Any
import numpy as np
import pandas as pd
from scipy import stats

def classify_correlation_strength(r_abs: float) -> str:
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
    variables: List[str] = None,
    significance_level: float = 0.05
) -> List[Dict[str, Any]]:
    """
    Computes pairwise Pearson correlation between all variable pairs.
    """
    if variables is None:
        variables = [col for col in df.columns if pd.api.types.is_numeric_dtype(df[col])]

    results: List[Dict[str, Any]] = []
    n_vars = len(variables)

    for i in range(n_vars):
        for j in range(i + 1, n_vars):
            var1 = variables[i]
            var2 = variables[j]

            clean_pair = df[[var1, var2]].dropna()
            if len(clean_pair) < 3:
                continue

            r_val, p_val = stats.pearsonr(clean_pair[var1], clean_pair[var2])
            r_val = float(r_val) if not np.isnan(r_val) else 0.0
            p_val = float(p_val) if not np.isnan(p_val) else 1.0

            results.append({
                "variable1": var1,
                "variable2": var2,
                "coefficient": round(r_val, 4),
                "pValue": round(p_val, 4),
                "significant": bool(p_val < significance_level),
                "strength": classify_correlation_strength(abs(r_val)),
            })

    return results
