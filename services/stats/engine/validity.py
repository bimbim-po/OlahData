from typing import List, Dict, Any
import numpy as np
import pandas as pd
from scipy import stats

def calculate_r_table(df_freedom: int, alpha: float = 0.05) -> float:
    """
    Computes critical Pearson r value for two-tailed test at given df = n - 2 and alpha.
    Formula: r_table = t_crit / sqrt(df + t_crit^2)
    """
    if df_freedom <= 0:
        return 0.0
    t_crit = stats.t.ppf(1.0 - alpha / 2.0, df_freedom)
    r_crit = float(t_crit / np.sqrt(df_freedom + t_crit**2))
    return round(r_crit, 4)

def compute_validity(
    df: pd.DataFrame,
    constructs: List[Dict[str, Any]],
    significance_level: float = 0.05,
    use_corrected: bool = False
) -> List[Dict[str, Any]]:
    """
    Performs questionnaire item validity test using Pearson Product Moment Correlation.
    In standard Indonesian skripsi methods (Sugiyono, Ghozali), each item score is
    correlated with total construct score (or corrected item-total correlation)
    and compared against r_tabel (df = n - 2, alpha = 0.05).
    """
    results: List[Dict[str, Any]] = []

    for construct in constructs:
        construct_name = construct["name"]
        items = construct.get("items", [])
        valid_items = [it for it in items if it in df.columns]

        if not valid_items:
            continue

        item_df = df[valid_items].dropna()
        n = len(item_df)
        if n < 3:
            continue

        df_freedom = n - 2
        r_tabel = calculate_r_table(df_freedom, significance_level)

        total_score = item_df.sum(axis=1)

        for it in valid_items:
            col_vals = item_df[it]
            if use_corrected and len(valid_items) > 1:
                # Corrected item-total correlation: item vs total of other items
                other_sum = total_score - col_vals
                if other_sum.std(ddof=1) == 0 or col_vals.std(ddof=1) == 0:
                    r_val = 0.0
                else:
                    r_val, _ = stats.pearsonr(col_vals, other_sum)
            else:
                # Standard Pearson item-total correlation (SPSS Bivariate)
                if total_score.std(ddof=1) == 0 or col_vals.std(ddof=1) == 0:
                    r_val = 0.0
                else:
                    r_val, _ = stats.pearsonr(col_vals, total_score)

            r_val = float(r_val) if not np.isnan(r_val) else 0.0
            is_valid = bool(r_val > r_tabel and r_val > 0)

            results.append({
                "item": it,
                "construct": construct_name,
                "rHitung": round(r_val, 4),
                "rTabel": round(r_tabel, 4),
                "valid": is_valid,
            })

    return results
