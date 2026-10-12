from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd

def scan_dataset_quality(
    df: pd.DataFrame,
    scale_min: int = 1,
    scale_max: int = 5,
    ignored_columns: Optional[List[str]] = None,
    item_columns: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """
    Scans dataset for quality issues:
    - Missing cells (empty/null/NaN) -> severity: 'error'
    - Out of scale (e.g. > 5 or < 1) for Likert item columns -> severity: 'error'
    - Duplicate rows (identical answers) -> severity: 'warning'
    - Constant answers across all items (straight-lining) -> severity: 'warning'
    """
    issues: List[Dict[str, Any]] = []
    issue_counter = 1

    if ignored_columns is None:
        # Standard ID or sequence columns
        ignored_columns = [c for c in df.columns if c.lower() in ["no", "id", "respondent_id", "nomor"]]

    if item_columns is None:
        # If item_columns not explicitly passed, infer Likert items: numeric columns not in ignored
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
            row_num = int(idx) + 1  # 1-indexed row
            issues.append({
                "id": f"issue-{issue_counter}",
                "severity": "error",
                "message": "Sel kosong",
                "row": row_num,
                "column": col,
                "value": None
            })
            issue_counter += 1

    # 2. Out of scale values on Likert item columns
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
                    issues.append({
                        "id": f"issue-{issue_counter}",
                        "severity": "error",
                        "message": f"Nilai di luar skala {scale_min}-{scale_max}",
                        "row": row_num,
                        "column": col,
                        "value": num_val if num_val.is_integer() else round(num_val, 2)
                    })
                    issue_counter += 1
            except (ValueError, TypeError):
                row_num = int(idx) + 1
                issues.append({
                    "id": f"issue-{issue_counter}",
                    "severity": "error",
                    "message": "Nilai bukan angka numerik",
                    "row": row_num,
                    "column": col,
                    "value": str(val)
                })
                issue_counter += 1

    # 3. Duplicate rows (comparing non-ignored columns)
    comparison_cols = [c for c in df.columns if c not in ignored_columns]
    if comparison_cols:
        seen_fingerprints: Dict[str, int] = {}
        for idx, row in df[comparison_cols].iterrows():
            fp = tuple(row.values)
            row_num = int(idx) + 1
            if fp in seen_fingerprints:
                first_row = seen_fingerprints[fp]
                issues.append({
                    "id": f"issue-{issue_counter}",
                    "severity": "warning",
                    "message": f"Baris duplikat (sama dengan baris {first_row})",
                    "row": row_num,
                    "column": None,
                    "value": None
                })
                issue_counter += 1
            else:
                seen_fingerprints[fp] = row_num

    # 4. Straight-lining (constant answer across all Likert items)
    if len(item_columns) >= 4:
        for idx, row in df[item_columns].iterrows():
            non_null_vals = [row[c] for c in item_columns if pd.notna(row[c])]
            if len(non_null_vals) == len(item_columns) and len(set(non_null_vals)) == 1:
                row_num = int(idx) + 1
                # Only add if not already marked duplicate
                issues.append({
                    "id": f"issue-{issue_counter}",
                    "severity": "warning",
                    "message": f"Pola jawaban seragam konstan (seluruh item bernilai {non_null_vals[0]})",
                    "row": row_num,
                    "column": None,
                    "value": non_null_vals[0]
                })
                issue_counter += 1

    return issues
