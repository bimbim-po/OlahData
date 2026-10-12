from typing import List, Dict, Any
import numpy as np
import pandas as pd

def _calc_cronbach(item_matrix: pd.DataFrame) -> float:
    k = item_matrix.shape[1]
    if k <= 1:
        return 0.0
    
    item_vars = item_matrix.var(axis=0, ddof=1)
    sum_item_vars = item_vars.sum()
    total_scores = item_matrix.sum(axis=1)
    total_var = total_scores.var(ddof=1)

    if total_var <= 1e-12:
        return 0.0

    alpha = (k / (k - 1)) * (1.0 - (sum_item_vars / total_var))
    return float(alpha)

def compute_reliability(
    df: pd.DataFrame,
    constructs: List[Dict[str, Any]],
    alpha_threshold: float = 0.60
) -> List[Dict[str, Any]]:
    """
    Computes Cronbach's Alpha and Alpha if Item Deleted for each construct.
    Matches SPSS Scale: Reliability Analysis.
    """
    results: List[Dict[str, Any]] = []

    for construct in constructs:
        construct_name = construct["name"]
        items = construct.get("items", [])
        valid_items = [it for it in items if it in df.columns]

        if len(valid_items) < 2:
            continue

        item_df = df[valid_items].dropna()
        if len(item_df) < 3:
            continue

        overall_alpha = _calc_cronbach(item_df)
        alpha_if_del: List[Dict[str, Any]] = []

        for it in valid_items:
            sub_items = [c for c in valid_items if c != it]
            if len(sub_items) >= 2:
                sub_alpha = _calc_cronbach(item_df[sub_items])
            else:
                sub_alpha = 0.0
            alpha_if_del.append({
                "item": it,
                "alpha": round(sub_alpha, 4)
            })

        results.append({
            "construct": construct_name,
            "cronbachAlpha": round(overall_alpha, 4),
            "itemCount": len(valid_items),
            "reliable": bool(overall_alpha >= alpha_threshold),
            "alphaIfDeleted": alpha_if_del,
        })

    return results
