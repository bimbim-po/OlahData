from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import pandas as pd
from scipy import stats

def compute_mahalanobis_distance(df_numeric: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
    """
    Computes Mahalanobis distance D^2 and p-values for multivariate outlier detection.
    Formula: D^2 = (x - mu)^T Sigma^(-1) (x - mu), where D^2 ~ Chi-Square(df = p).
    Outlier criterion: p < 0.001 (Tabachnick & Fidell standard).
    """
    clean_mat = df_numeric.dropna().values
    n, p = clean_mat.shape

    if n <= p + 1 or p < 2:
        return np.zeros(len(df_numeric)), np.ones(len(df_numeric))

    mu = np.mean(clean_mat, axis=0)
    cov = np.cov(clean_mat, rowvar=False)

    try:
        inv_cov = np.linalg.pinv(cov)
        diff = df_numeric.values - mu
        # Vectorized Mahalanobis distance calculation: sum((diff @ inv_cov) * diff, axis=1)
        d2 = np.sum((diff @ inv_cov) * diff, axis=1)
        p_vals = 1.0 - stats.chi2.cdf(d2, df=p)
        return d2, p_vals
    except Exception:
        return np.zeros(len(df_numeric)), np.ones(len(df_numeric))

def check_sample_size(
    n: int,
    num_predictors: int = 1,
    parametric_min: int = 30
) -> Dict[str, Any]:
    """
    Checks whether sample size N meets standard academic minimums:
    1. Parametric tests require N >= 30 (Central Limit Theorem).
    2. Multiple regression requires N >= 10 * k (Green / Hair rule of thumb).
    """
    reg_min = 10 * num_predictors
    is_parametric_warning = bool(n < parametric_min)
    is_regression_warning = bool(n < reg_min)

    messages = []
    if is_parametric_warning:
        messages.append(
            f"Ukuran sampel (N = {n}) kurang dari ambang batas standar uji parametrik (N >= {parametric_min}). Disarankan menggunakan uji non-parametrik atau menambah responden."
        )
    if is_regression_warning:
        messages.append(
            f"Ukuran sampel (N = {n}) kurang dari aturan rasio prediktor regresi (minimal 10 x {num_predictors} = {reg_min} responden). Model berisiko overfitting."
        )

    return {
        "currentN": int(n),
        "nParametricThreshold": int(parametric_min),
        "nRegressionThreshold": int(reg_min),
        "parametricWarning": is_parametric_warning,
        "regressionWarning": is_regression_warning,
        "warning": bool(is_parametric_warning or is_regression_warning),
        "messages": messages
    }

def scan_dataset_quality(
    df: pd.DataFrame,
    scale_min: int = 1,
    scale_max: int = 5,
    ignored_columns: Optional[List[str]] = None,
    item_columns: Optional[List[str]] = None,
    construct_scores_df: Optional[pd.DataFrame] = None
) -> List[Dict[str, Any]]:
    """
    Comprehensive Data Quality Scanner for thesis research:
    1. Missing cells (empty/null/NaN) -> severity: 'error'
    2. Out of scale Likert values (< scale_min or > scale_max) -> severity: 'error'
    3. Duplicate rows (identical answers across questionnaire items) -> severity: 'warning'
    4. Straight-lining (unengaged constant answers across items) -> severity: 'warning'
    5. Univariate outliers (|z| > 3 on items or construct scores) -> severity: 'warning'
    6. Multivariate outliers (Mahalanobis distance D^2 with p < 0.001) -> severity: 'warning'
    All row numbers are 1-indexed (row 1 = first data row).
    Does NOT mutate original dataset; provides actions for user-controlled exclusion.
    """
    issues: List[Dict[str, Any]] = []
    issue_counter = 1

    if ignored_columns is None:
        ignored_columns = [
            c for c in df.columns
            if c.lower() in ["no", "id", "respondent_id", "nomor", "no_responden", "nama", "timestamp"]
        ]

    if item_columns is None:
        item_columns = [
            c for c in df.columns
            if c not in ignored_columns and pd.api.types.is_numeric_dtype(df[c])
        ]

    # 1. Missing values
    for col in df.columns:
        if col in ignored_columns:
            continue
        null_indices = df[df[col].isna() | (df[col] == "")].index
        for idx in null_indices:
            row_num = int(idx) + 1
            issues.append({
                "id": f"issue-{issue_counter}",
                "type": "missing_cell",
                "severity": "error",
                "message": f"Sel kosong (missing value) pada butir {col}",
                "description": f"Sel kosong (missing value) pada butir {col}",
                "row": row_num,
                "column": col,
                "value": None,
                "action": "Eksklusi responden atau input ulang data mentah"
            })
            issue_counter += 1

    # 2. Out of scale values on Likert items
    for col in item_columns:
        if col not in df.columns:
            continue
        series = df[col]
        for idx, val in series.items():
            if pd.isna(val) or val == "":
                continue
            try:
                num_val = float(val)
                if num_val < scale_min or num_val > scale_max:
                    row_num = int(idx) + 1
                    int_val = int(num_val) if num_val.is_integer() else round(num_val, 2)
                    issues.append({
                        "id": f"issue-{issue_counter}",
                        "type": "out_of_scale",
                        "severity": "error",
                        "message": f"Nilai {int_val} di luar skala Likert ({scale_min} - {scale_max})",
                        "description": f"Nilai {int_val} di luar rentang skala Likert ({scale_min} - {scale_max})",
                        "row": row_num,
                        "column": col,
                        "value": int_val,
                        "action": f"Koreksi ke skala {scale_min}-{scale_max} atau eksklusi baris"
                    })
                    issue_counter += 1
            except (ValueError, TypeError):
                row_num = int(idx) + 1
                issues.append({
                    "id": f"issue-{issue_counter}",
                    "type": "invalid_type",
                    "severity": "error",
                    "message": f"Nilai bukan angka numerik: {val}",
                    "description": f"Nilai bukan angka numerik: {val}",
                    "row": row_num,
                    "column": col,
                    "value": str(val),
                    "action": "Koreksi ke angka numerik atau eksklusi baris"
                })
                issue_counter += 1

    # 3. Duplicate rows (comparing questionnaire items)
    comparison_cols = [c for c in item_columns if c in df.columns]
    if comparison_cols:
        seen_fingerprints: Dict[Tuple, int] = {}
        for idx, row in df[comparison_cols].iterrows():
            fp = tuple(row.values)
            row_num = int(idx) + 1
            if fp in seen_fingerprints:
                first_row = seen_fingerprints[fp]
                issues.append({
                    "id": f"issue-{issue_counter}",
                    "type": "duplicate_row",
                    "severity": "warning",
                    "message": f"Baris duplikat identik dengan responden baris {first_row}",
                    "description": f"Baris duplikat identik dengan responden baris {first_row}",
                    "row": row_num,
                    "duplicateOfRow": first_row,
                    "column": None,
                    "value": None,
                    "action": "Eksklusi responden duplikat"
                })
                issue_counter += 1
            else:
                seen_fingerprints[fp] = row_num

    # 4. Straight-lining (unengaged constant answers across all items)
    # Exclude rows that are already flagged as duplicates of an earlier row
    flagged_dup_rows = {i["row"] for i in issues if i.get("type") == "duplicate_row"}
    if len(item_columns) >= 4:
        for idx, row in df[item_columns].iterrows():
            row_num = int(idx) + 1
            if row_num in flagged_dup_rows:
                continue
            non_null_vals = [row[c] for c in item_columns if pd.notna(row[c])]
            if len(non_null_vals) == len(item_columns) and len(set(non_null_vals)) == 1:
                const_val = int(non_null_vals[0]) if float(non_null_vals[0]).is_integer() else non_null_vals[0]
                issues.append({
                    "id": f"issue-{issue_counter}",
                    "type": "straight_lining",
                    "severity": "warning",
                    "message": f"Pola jawaban seragam konstan (seluruh butir dijawab {const_val})",
                    "description": f"Pola jawaban seragam konstan (seluruh butir dijawab {const_val})",
                    "row": row_num,
                    "column": None,
                    "value": const_val,
                    "action": "Eksklusi responden unengaged"
                })
                issue_counter += 1

    # 5. Univariate outliers (|z| > 3)
    target_outlier_df = construct_scores_df if construct_scores_df is not None else df[item_columns]
    for col in target_outlier_df.columns:
        if not pd.api.types.is_numeric_dtype(target_outlier_df[col]):
            continue
        series = target_outlier_df[col].dropna()
        if len(series) < 10:
            continue
        mean_v = float(series.mean())
        std_v = float(series.std(ddof=1))
        if std_v > 1e-12:
            z_scores = (series - mean_v) / std_v
            for idx, z in z_scores.items():
                if abs(z) > 3.0:
                    row_num = int(idx) + 1
                    # Avoid duplicate warning if row already flagged for straight-lining
                    if any(i["row"] == row_num and i["type"] == "straight_lining" for i in issues):
                        continue
                    issues.append({
                        "id": f"issue-{issue_counter}",
                        "type": "univariate_outlier",
                        "severity": "warning",
                        "message": f"Pencilan univariat (|z| = {abs(z):.2f} > 3 pada {col})",
                        "description": f"Pencilan univariat (|z| > 3 pada konstruk {col})",
                        "row": row_num,
                        "column": col,
                        "value": float(target_outlier_df.loc[idx, col]),
                        "zScore": float(z),
                        "action": "Eksklusi responden pencilan"
                    })
                    issue_counter += 1

    # 6. Multivariate outliers (Mahalanobis distance D^2 with p < 0.001)
    if construct_scores_df is not None and construct_scores_df.shape[1] >= 2 and len(construct_scores_df) >= 20:
        d2, p_maha = compute_mahalanobis_distance(construct_scores_df)
        for idx, (dist, p_val) in enumerate(zip(d2, p_maha)):
            if p_val < 0.001:
                row_num = idx + 1
                if not any(i["row"] == row_num and i["type"] in ["straight_lining", "univariate_outlier"] for i in issues):
                    issues.append({
                        "id": f"issue-{issue_counter}",
                        "type": "multivariate_outlier",
                        "severity": "warning",
                        "message": f"Pencilan multivariat (Mahalanobis D² = {dist:.2f}, p < 0,001)",
                        "description": f"Pencilan multivariat (jarak Mahalanobis D² = {dist:.2f}, p < 0,001)",
                        "row": row_num,
                        "column": "Multivariat",
                        "value": float(dist),
                        "action": "Eksklusi responden pencilan multivariat"
                    })
                    issue_counter += 1

    return issues

def create_derived_dataset(df_raw: pd.DataFrame, excluded_rows_1indexed: List[int]) -> pd.DataFrame:
    """
    Creates a derived dataset by excluding specified 1-indexed rows.
    Guarantees raw data immutability: df_raw is never modified.
    """
    zero_indexed_drops = [r - 1 for r in excluded_rows_1indexed if 1 <= r <= len(df_raw)]
    derived_df = df_raw.drop(index=zero_indexed_drops).reset_index(drop=True)
    return derived_df
