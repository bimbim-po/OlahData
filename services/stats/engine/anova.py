from typing import List, Dict, Any
import numpy as np
import pandas as pd
from scipy import stats

def compute_anova(
    df: pd.DataFrame,
    group_col: str,
    value_col: str,
    significance_level: float = 0.05
) -> List[Dict[str, Any]]:
    """
    Computes One-Way ANOVA across distinct categories in group_col for value_col.
    """
    clean_df = df[[group_col, value_col]].dropna()
    groups = [group[value_col].values for _, group in clean_df.groupby(group_col)]

    if len(groups) < 2:
        return []

    f_val, p_val = stats.f_oneway(*groups)
    f_val = float(f_val) if not np.isnan(f_val) else 0.0
    p_val = float(p_val) if not np.isnan(p_val) else 1.0

    k = len(groups)
    n = len(clean_df)
    df_between = k - 1
    df_within = n - k

    overall_mean = clean_df[value_col].mean()
    ss_between = float(sum(len(g) * (np.mean(g) - overall_mean) ** 2 for g in groups))
    ss_within = float(sum(np.sum((g - np.mean(g)) ** 2) for g in groups))
    ss_total = ss_between + ss_within

    ms_between = ss_between / df_between if df_between > 0 else 0.0
    ms_within = ss_within / df_within if df_within > 0 else 0.0

    return [
        {
            "source": "Antar Kelompok (Between Groups)",
            "sumOfSquares": round(ss_between, 4),
            "df": int(df_between),
            "meanSquare": round(ms_between, 4),
            "fValue": round(f_val, 4),
            "pValue": round(p_val, 4),
        },
        {
            "source": "Dalam Kelompok (Within Groups)",
            "sumOfSquares": round(ss_within, 4),
            "df": int(df_within),
            "meanSquare": round(ms_within, 4),
            "fValue": 0.0,
            "pValue": 0.0,
        },
        {
            "source": "Total",
            "sumOfSquares": round(ss_total, 4),
            "df": int(n - 1),
            "meanSquare": 0.0,
            "fValue": 0.0,
            "pValue": 0.0,
        },
    ]
