from typing import List, Dict, Any, Optional, Tuple, Union
import numpy as np
import pandas as pd
from scipy import stats

def calculate_r_table(df_freedom: int, alpha: float = 0.05, tails: int = 2) -> float:
    """
    Computes critical Pearson r value at given df = n - 2, alpha, and tails (1 or 2).
    Formula: r_table = t_crit / sqrt(df + t_crit^2)
    Strictly dynamic distribution, never hardcoded.
    """
    if df_freedom <= 0:
        return 0.0
    prob = 1.0 - (alpha / float(tails))
    t_crit = float(stats.t.ppf(prob, df_freedom))
    r_crit = float(t_crit / np.sqrt(df_freedom + t_crit**2))
    return r_crit

def reverse_negative_item(series: pd.Series, scale_min: int = 1, scale_max: int = 5) -> pd.Series:
    """
    Reverses a negatively worded Likert item.
    Formula: x_rev = (scale_max + scale_min) - x.
    """
    return (scale_max + scale_min) - series

def compute_validity(
    df: pd.DataFrame,
    constructs: List[Dict[str, Any]],
    significance_level: float = 0.05,
    tails: int = 2,
    use_corrected: bool = True,
    negative_items: Optional[Union[List[str], Dict[str, Tuple[int, int]]]] = None,
    scale_min: int = 1,
    scale_max: int = 5
) -> List[Dict[str, Any]]:
    """
    Performs questionnaire item validity test using Pearson Product Moment Correlation.
    Standard Indonesian Thesis Specification:
    - Corrected item-total correlation: Pearson correlation between item and sum of OTHER items in construct
    - r_tabel = t_crit / sqrt(df + t_crit^2), df = N - 2, alpha (1 or 2-tailed configurable)
    - Valid if r_hitung > r_tabel and p < alpha
    - Identifies negative correlations for reverse score suggestions without guessing
    """
    results: List[Dict[str, Any]] = []
    clean_df = df.copy()

    # Pre-reverse specified negative items (supports list or dict with per-item scale)
    if negative_items:
        if isinstance(negative_items, dict):
            for it, (s_min, s_max) in negative_items.items():
                if it in clean_df.columns:
                    clean_df[it] = reverse_negative_item(clean_df[it], scale_min=s_min, scale_max=s_max)
        elif isinstance(negative_items, list):
            for it in negative_items:
                if it in clean_df.columns:
                    clean_df[it] = reverse_negative_item(clean_df[it], scale_min=scale_min, scale_max=scale_max)

    for construct in constructs:
        construct_name = construct["name"]
        construct_code = construct.get("code", construct_name)
        items = construct.get("items", [])
        valid_items = [it for it in items if it in clean_df.columns]

        if not valid_items:
            continue

        item_df = clean_df[valid_items].dropna()
        n = len(item_df)
        if n < 3:
            continue

        df_freedom = n - 2
        r_tabel = calculate_r_table(df_freedom, significance_level, tails=tails)
        total_score = item_df.sum(axis=1)

        for it in valid_items:
            col_vals = item_df[it]
            if use_corrected and len(valid_items) > 1:
                # Corrected item-total correlation: item score correlated with sum of remaining items
                other_sum = total_score - col_vals
                if other_sum.std(ddof=1) == 0 or col_vals.std(ddof=1) == 0:
                    r_val, p_val = 0.0, 1.0
                else:
                    r_val, p_val = stats.pearsonr(col_vals, other_sum)
            else:
                # Standard uncorrected Pearson item-total correlation
                if total_score.std(ddof=1) == 0 or col_vals.std(ddof=1) == 0:
                    r_val, p_val = 0.0, 1.0
                else:
                    r_val, p_val = stats.pearsonr(col_vals, total_score)

            r_val = float(r_val) if not np.isnan(r_val) else 0.0
            p_val = float(p_val) if not np.isnan(p_val) else 1.0
            is_valid = bool(r_val > r_tabel and p_val < significance_level)

            results.append({
                "item": it,
                "construct": construct_name,
                "code": construct_code,
                "rHitung": r_val,
                "rTabel": r_tabel,
                "pValue": p_val,
                "df": df_freedom,
                "tails": tails,
                "valid": is_valid,
                "status": "Valid" if is_valid else "Gugur (Tidak Valid)",
                "negativeCorrelationHint": bool(r_val < 0)
            })

    return results
