from typing import List, Dict, Any
import numpy as np
import pandas as pd

def compute_descriptive(df: pd.DataFrame, variables: List[str] = None) -> List[Dict[str, Any]]:
    """
    Computes sample mean, median, sample std deviation (ddof=1), min, max, n
    for specified variables or all numeric columns.
    Matches standard SPSS / JASP descriptive statistics.
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

        results.append({
            "variable": var,
            "mean": round(mean_val, 4),
            "median": round(median_val, 4),
            "stdDev": round(std_val, 4),
            "min": round(min_val, 4),
            "max": round(max_val, 4),
            "n": int(n),
        })
    return results
