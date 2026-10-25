from typing import List, Dict, Any, Optional, Tuple, Union
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

def categorize_tcr(tcr: float) -> str:
    """
    Standard Indonesian academic TCR categorization:
    - 90% - 100%: Sangat Baik / Sangat Tinggi
    - 80% - 89.99%: Baik / Tinggi
    - 65% - 79.99%: Cukup / Sedang
    - 55% - 64.99%: Kurang / Rendah
    - < 55%: Sangat Kurang / Sangat Rendah
    """
    if np.isnan(tcr):
        return "-"
    if tcr >= 90.0:
        return "Sangat Baik"
    elif tcr >= 80.0:
        return "Baik"
    elif tcr >= 65.0:
        return "Cukup"
    elif tcr >= 55.0:
        return "Kurang"
    else:
        return "Sangat Kurang"

def compute_construct_scores(
    df: pd.DataFrame,
    constructs: List[Dict[str, Any]],
    negative_items: Optional[Union[List[str], Dict[str, Tuple[int, int]]]] = None,
    scale_min: int = 1,
    scale_max: int = 5,
    valid_items_only: Optional[Dict[str, List[str]]] = None,
    drop_invalid_items: bool = False
) -> Tuple[pd.DataFrame, Dict[str, str]]:
    """
    Computes construct score as the row-wise mean of items.
    Principle P7: Never drops invalid items without explicit user request (drop_invalid_items=True).
    Reverses negative items prior to mean computation: x_rev = (scale_max + scale_min) - x.
    Returns:
    - construct_df: DataFrame with construct scores
    - notes: Dictionary of table notes explaining the calculation method
    """
    clean_df = df.copy()
    if negative_items:
        if isinstance(negative_items, dict):
            for it, (s_min, s_max) in negative_items.items():
                if it in clean_df.columns:
                    clean_df[it] = (s_max + s_min) - clean_df[it]
        elif isinstance(negative_items, list):
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
            dropped_info = f" (hanya butir valid: {', '.join(valid_cols)})" if valid_items_only else ""
            notes[code] = f"Skor konstruk {code} dihitung dari rata-rata butir{dropped_info}."

    return construct_df, notes

def compute_frequency_table(
    series: pd.Series,
    var_name: str = "Variabel",
    mask_identity: bool = True
) -> Dict[str, Any]:
    """
    Computes exact frequency, percentage, and cumulative percentage directly from raw counts.
    Guarantee: Total row = exactly 100.0%.
    Masks identity columns (names, emails, NIM) if requested.
    """
    clean_series = series.dropna()
    n_total = len(clean_series)
    if n_total == 0:
        return {"variable": var_name, "rows": [], "totalN": 0}

    counts = clean_series.value_counts(sort=False)
    # Sort natural/alphanumeric
    try:
        counts = counts.sort_index()
    except Exception:
        pass

    rows = []
    cum_count = 0
    for val, count in counts.items():
        cum_count += count
        pct = (count / n_total) * 100.0
        cum_pct = (cum_count / n_total) * 100.0

        label_display = str(val)
        if mask_identity and any(k in var_name.lower() for k in ["nama", "email", "nim", "telepon"]):
            label_display = label_display[:2] + "***" + label_display[-1:] if len(label_display) > 3 else "***"

        rows.append({
            "category": label_display,
            "rawCategory": str(val),
            "frequency": int(count),
            "percentage": float(pct),
            "cumulativePercentage": float(cum_pct)
        })

    return {
        "variable": var_name,
        "rows": rows,
        "totalN": int(n_total),
        "totalPercentage": 100.0
    }

def compute_descriptive(
    df: pd.DataFrame,
    variables: Optional[List[str]] = None,
    scale_min: float = 1.0,
    scale_max: float = 5.0
) -> List[Dict[str, Any]]:
    """
    Computes sample mean, median, sample standard deviation (ddof=1), min, max, n,
    TCR (Tingkat Capaian Responden), and Likert categorical classification.
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
        
        # TCR calculation: (mean / scale_max) * 100
        tcr_val = float((mean_val / scale_max) * 100.0) if scale_max > 0 else 0.0
        tcr_kategori = categorize_tcr(tcr_val)

        results.append({
            "variable": var,
            "construct": var,
            "mean": mean_val,
            "median": median_val,
            "stdDev": std_val,
            "min": min_val,
            "max": max_val,
            "n": int(n),
            "tcr": tcr_val,
            "tcrCategory": tcr_kategori,
            "kategori": kategori,
            "scaleMin": scale_min,
            "scaleMax": scale_max,
            "note": f"Interval kategori: ({scale_max:.0f} - {scale_min:.0f})/5 = {(scale_max - scale_min)/5:.2f}. TCR = (Mean / {scale_max:.0f}) x 100%."
        })

    return results
