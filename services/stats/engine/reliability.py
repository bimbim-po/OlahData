from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd
from scipy import stats

def _calc_cronbach(item_matrix: pd.DataFrame) -> float:
    """
    Computes Cronbach's Alpha from item covariance/variance matrix.
    Formula: alpha = (k / (k - 1)) * (1 - sum(var_items) / var_total)
    """
    k = item_matrix.shape[1]
    if k <= 1:
        return 0.0

    item_vars = item_matrix.var(axis=0, ddof=1)
    sum_item_vars = float(item_vars.sum())
    total_scores = item_matrix.sum(axis=1)
    total_var = float(total_scores.var(ddof=1))

    if total_var <= 1e-12:
        return 0.0

    alpha = (k / (k - 1)) * (1.0 - (sum_item_vars / total_var))
    return float(alpha)

def compute_reliability(
    df: pd.DataFrame,
    constructs: List[Dict[str, Any]],
    alpha_threshold: float = 0.70,
    valid_items_map: Optional[Dict[str, List[str]]] = None,
    negative_items: Optional[List[str]] = None,
    scale_min: int = 1,
    scale_max: int = 5
) -> List[Dict[str, Any]]:
    """
    Computes Cronbach's Alpha and Item-Total Statistics for each construct.
    Standard Indonesian Thesis Specification:
    - Cronbach's Alpha overall per construct
    - Corrected item-total correlation and p-value per item
    - Alpha if item deleted per item
    - Initial alpha (all items) vs Final alpha (valid items retained)
    - Default threshold 0.70 (standard in contemporary research; 0.60 optional)
    """
    results: List[Dict[str, Any]] = []
    clean_df = df.copy()

    # Pre-reverse negative items if specified
    if negative_items:
        for it in negative_items:
            if it in clean_df.columns:
                clean_df[it] = (scale_max + scale_min) - clean_df[it]

    for construct in constructs:
        construct_name = construct["name"]
        construct_code = construct.get("code", construct_name)
        items = construct.get("items", [])
        available_items = [it for it in items if it in clean_df.columns]

        if len(available_items) < 2:
            results.append({
                "construct": construct_name,
                "code": construct_code,
                "cronbachAlpha": None,
                "initialAlpha": None,
                "finalAlpha": None,
                "itemCount": len(available_items),
                "initialItemCount": len(available_items),
                "finalItemCount": len(available_items),
                "reliable": False,
                "alphaThreshold": alpha_threshold,
                "status": "Tidak dapat dihitung (kurang dari 2 butir)",
                "note": f"Uji reliabilitas Cronbach's Alpha tidak dapat dihitung karena konstruk '{construct_name}' hanya memiliki {len(available_items)} butir (minimal 2 butir).",
                "itemsAnalysis": [],
                "alphaIfDeleted": []
            })
            continue

        item_df = clean_df[available_items].dropna()
        if len(item_df) < 3:
            results.append({
                "construct": construct_name,
                "code": construct_code,
                "cronbachAlpha": None,
                "initialAlpha": None,
                "finalAlpha": None,
                "itemCount": len(available_items),
                "initialItemCount": len(available_items),
                "finalItemCount": len(available_items),
                "reliable": False,
                "alphaThreshold": alpha_threshold,
                "status": "Tidak dapat dihitung (responden valid < 3)",
                "note": f"Jumlah responden lengkap untuk konstruk '{construct_name}' kurang dari 3.",
                "itemsAnalysis": [],
                "alphaIfDeleted": []
            })
            continue

        # Initial Alpha with all items
        initial_alpha = _calc_cronbach(item_df)
        total_score_init = item_df.sum(axis=1)

        items_analysis: List[Dict[str, Any]] = []
        for it in available_items:
            sub_items = [c for c in available_items if c != it]
            if len(sub_items) >= 2:
                sub_alpha = _calc_cronbach(item_df[sub_items])
            else:
                sub_alpha = 0.0

            # Corrected item-total correlation: correlation with sum of OTHER items
            other_sum = total_score_init - item_df[it]
            if other_sum.std(ddof=1) == 0 or item_df[it].std(ddof=1) == 0:
                r_it, p_it = 0.0, 1.0
            else:
                r_it, p_it = stats.pearsonr(item_df[it], other_sum)

            items_analysis.append({
                "item": it,
                "alphaIfDeleted": float(sub_alpha),
                "correctedItemTotalCorrelation": float(r_it),
                "pValue": float(p_it)
            })

        # Final Alpha: evaluate after dropping invalid items if valid_items_map is provided
        if valid_items_map and construct_code in valid_items_map:
            retained_items = [it for it in valid_items_map[construct_code] if it in clean_df.columns]
        else:
            retained_items = available_items

        if len(retained_items) >= 2:
            final_alpha = _calc_cronbach(clean_df[retained_items].dropna())
        else:
            final_alpha = initial_alpha

        results.append({
            "construct": construct_name,
            "code": construct_code,
            "cronbachAlpha": float(final_alpha),
            "initialAlpha": float(initial_alpha),
            "finalAlpha": float(final_alpha),
            "itemCount": len(available_items),
            "initialItemCount": len(available_items),
            "finalItemCount": len(retained_items),
            "reliable": bool(final_alpha >= alpha_threshold),
            "alphaThreshold": alpha_threshold,
            "itemsAnalysis": items_analysis,
            "alphaIfDeleted": [{"item": a["item"], "alpha": a["alphaIfDeleted"]} for a in items_analysis]
        })

    return results
