from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import pandas as pd

def categorize_likert_score(
    score: float,
    scale_min: float = 1.0,
    scale_max: float = 5.0,
    num_categories: int = 5
) -> str:
    """
    Categorizes Likert aggregate mean according to Indonesian academic standard.
    For standard 1-5 Likert scale, interval = (5 - 1) / 5 = 0.80:
    - 1.00 - 1.80: Sangat Rendah
    - 1.81 - 2.60: Rendah
    - 2.61 - 3.40: Sedang
    - 3.41 - 4.20: Tinggi
    - 4.21 - 5.00: Sangat Tinggi
    For custom scales, interval = (max - min) / k.
    """
    if np.isnan(score):
        return "-"
    
    interval = (scale_max - scale_min) / float(num_categories)

    # Standard 5-tier labels
    labels = ["Sangat Rendah", "Rendah", "Sedang", "Tinggi", "Sangat Tinggi"]

    if num_categories == 5 and scale_min == 1.0 and scale_max == 5.0:
        if score <= 1.80:
            return "Sangat Rendah"
        elif score <= 2.60:
            return "Rendah"
        elif score <= 3.40:
            return "Sedang"
        elif score <= 4.20:
            return "Tinggi"
        else:
            return "Sangat Tinggi"

    # Generic interval calculation
    idx = int((score - scale_min) / interval)
    idx = max(0, min(num_categories - 1, idx))
    return labels[idx] if idx < len(labels) else f"Kategori {idx + 1}"

def compute_construct_scores(
    df: pd.DataFrame,
    constructs: List[Dict[str, Any]],
    negative_items: Optional[List[str]] = None,
    scale_min: int = 1,
    scale_max: int = 5,
    valid_items_only: Optional[Dict[str, List[str]]] = None
) -> Tuple[pd.DataFrame, Dict[str, str]]:
    """
    Computes construct score as the row-wise mean of valid items.
    Reverses negative items prior to mean computation: x_rev = scale_max + scale_min - x.
    Returns:
    - construct_df: DataFrame with construct scores preserving 1-5 scale
    - notes: Dictionary of table notes explaining the calculation method
    """
    clean_df = df.copy()
    if negative_items:
        for it in negative_items:
            if it in clean_df.columns:
                clean_df[it] = (scale_max + scale_min) - clean_df[it]

    construct_df = pd.DataFrame(index=clean_df.index)
    notes: Dict[str, str] = {}

    for c in constructs:
        code = c.get("code", c["name"])
        if valid_items_only and code in valid_items_only:
            items = valid_items_only[code]
        else:
            items = c.get("items", [])
        
        valid_cols = [it for it in items if it in clean_df.columns]
        if valid_cols:
            construct_df[code] = clean_df[valid_cols].mean(axis=1)
            notes[code] = f"Skor konstruk {code} dihitung dari rata-rata butir valid ({', '.join(valid_cols)}) setelah pembalikan butir berkebalikan."

    return construct_df, notes

def compute_descriptive(
    df: pd.DataFrame,
    variables: Optional[List[str]] = None,
    scale_min: float = 1.0,
    scale_max: float = 5.0
) -> List[Dict[str, Any]]:
    """
    Computes sample mean, median, sample standard deviation (ddof=1), min, max, n,
    and Likert categorical classification for specified variables.
    """
    if variables is None:
        variables = [col for col in df.columns if pd.api.types.is_numeric_dtype(df[col])]

    results: List[Dict[str, Any]] = []
    for var in variables:
        if var not in df.columns:
            continue
        series = df[var].dropna()
        n = len(series)
        if n == 0:
            continue

        mean_val = float(series.mean())
        median_val = float(series.median())
        std_val = float(series.std(ddof=1)) if n > 1 else 0.0
        min_val = float(series.min())
        max_val = float(series.max())
        kategori = categorize_likert_score(mean_val, scale_min=scale_min, scale_max=scale_max)

        results.append({
            "variable": var,
            "construct": var,
            "mean": mean_val,
            "median": median_val,
            "stdDev": std_val,
            "min": min_val,
            "max": max_val,
            "n": int(n),
            "kategori": kategori,
            "note": "Kategori ditentukan berdasarkan interval skor Likert (5-1)/5 = 0,80."
        })

    return results
