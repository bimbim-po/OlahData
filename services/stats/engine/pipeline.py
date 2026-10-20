from typing import List, Dict, Any, Optional
import datetime
import pandas as pd
import numpy as np

from config import settings
from engine.descriptive import compute_descriptive, compute_construct_scores
from engine.validity import compute_validity
from engine.reliability import compute_reliability
from engine.regression import compute_regression
from engine.assumptions import (
    compute_normality,
    compute_multicollinearity,
    compute_heteroscedasticity,
    compute_autocorrelation
)
from engine.correlation import compute_correlation
from engine.comparative import compute_two_group_difference, compute_three_plus_group_difference
from engine.categorical import compute_chi_square
from validation import check_sample_size, scan_dataset_quality

def run_statistical_analysis(
    df: pd.DataFrame,
    constructs: List[Dict[str, Any]],
    selected_tests: List[str],
    significance_level: float = 0.05,
    negative_items: Optional[List[str]] = None,
    scale_min: int = 1,
    scale_max: int = 5,
    project_id: str = "proj-default",
    data_version_id: str = "dv-default"
) -> Dict[str, Any]:
    """
    Orchestrates deterministic statistical analysis on the input dataset.
    Strictly follows Indonesian S1 quantitative thesis standards.
    Guarantees full mathematical determinism and reproducibility.
    """
    clean_df = df.copy()
    n_respondents = len(clean_df)

    # Pre-reverse negative items if specified (scale_max + scale_min - x)
    if negative_items:
        for it in negative_items:
            if it in clean_df.columns:
                clean_df[it] = (scale_max + scale_min) - clean_df[it]

    # Map constructs and determine roles
    construct_role_map: Dict[str, str] = {}
    construct_code_map: Dict[str, str] = {}
    for c in constructs:
        c_name = c["name"]
        c_code = c.get("code", c_name)
        role = c.get("role", "independent")
        construct_role_map[c_code] = role
        construct_code_map[c_name] = c_code

    results: Dict[str, Any] = {
        "id": f"result-{int(datetime.datetime.utcnow().timestamp())}",
        "projectId": project_id,
        "dataVersionId": data_version_id,
        "respondentCount": n_respondents,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "engineVersion": settings.ENGINE_VERSION,
        "significanceLevel": significance_level,
        "sampleSize": check_sample_size(n_respondents, num_predictors=max(1, len([r for r in construct_role_map.values() if r == "independent"]))),
        "explanations": {},
    }

    # 1. Validity testing (Corrected Item-Total Pearson Correlation)
    validity_res = []
    valid_items_map: Dict[str, List[str]] = {}
    if "validity" in selected_tests or any(t in selected_tests for t in ["reliability", "regression"]):
        validity_res = compute_validity(
            clean_df,
            constructs=constructs,
            significance_level=significance_level,
            use_corrected=True,
            scale_min=scale_min,
            scale_max=scale_max
        )
        if "validity" in selected_tests:
            results["validity"] = validity_res

        # Build valid items map per construct
        for r in validity_res:
            c_code = r.get("code", r["construct"])
            if c_code not in valid_items_map:
                valid_items_map[c_code] = []
            if r["valid"]:
                valid_items_map[c_code].append(r["item"])

    # Compute Construct Scores (Mean of valid items)
    construct_scores_df, table_notes = compute_construct_scores(
        clean_df,
        constructs=constructs,
        valid_items_only=valid_items_map if valid_items_map else None,
        scale_min=scale_min,
        scale_max=scale_max
    )
    results["tableNotes"] = table_notes

    # 2. Descriptive Statistics on construct scores
    if "descriptive" in selected_tests:
        results["descriptive"] = compute_descriptive(
            construct_scores_df,
            scale_min=float(scale_min),
            scale_max=float(scale_max)
        )

    # 3. Reliability (Cronbach's Alpha, item analysis, before & after dropping invalid items)
    if "reliability" in selected_tests:
        results["reliability"] = compute_reliability(
            clean_df,
            constructs=constructs,
            alpha_threshold=0.70,
            valid_items_map=valid_items_map,
            scale_min=scale_min,
            scale_max=scale_max
        )

    # 4. Regression & Classical Assumptions
    indep_vars = [c_code for c_code, role in construct_role_map.items() if role == "independent" and c_code in construct_scores_df.columns]
    dep_vars = [c_code for c_code, role in construct_role_map.items() if role == "dependent" and c_code in construct_scores_df.columns]

    residuals = None
    y_pred = None

    needs_regression = any(t in selected_tests for t in [
        "regression", "normality", "multicollinearity", "heteroscedasticity", "autocorrelation", "f-test", "fTest", "determination", "anova"
    ])

    if needs_regression and len(indep_vars) >= 1 and len(dep_vars) >= 1:
        target_dep = dep_vars[0]
        y_series = construct_scores_df[target_dep]
        x_df = construct_scores_df[indep_vars]

        reg_table, f_res, det_res, anova_res, residuals, y_pred = compute_regression(
            y_series=y_series,
            x_df=x_df,
            significance_level=significance_level
        )

        if "regression" in selected_tests:
            results["regression"] = reg_table
            results["fTest"] = f_res
            results["determination"] = det_res
            results["anova"] = anova_res
        if "f-test" in selected_tests or "fTest" in selected_tests:
            results["fTest"] = f_res
        if "determination" in selected_tests:
            results["determination"] = det_res
        if "anova" in selected_tests and "regression" not in selected_tests:
            results["anova"] = anova_res

        # Classical Assumptions
        if "normality" in selected_tests and residuals is not None:
            results["normality"] = compute_normality(residuals, alpha=significance_level)

        if "multicollinearity" in selected_tests:
            results["multicollinearity"] = compute_multicollinearity(x_df)

        if "heteroscedasticity" in selected_tests and residuals is not None:
            results["heteroscedasticity"] = compute_heteroscedasticity(residuals, x_df, y_pred=y_pred, alpha=significance_level)

        if "autocorrelation" in selected_tests and residuals is not None:
            results["autocorrelation"] = compute_autocorrelation(residuals, enabled=False)

    # 5. Correlation (Pearson & Spearman)
    if "correlation" in selected_tests and len(construct_scores_df.columns) >= 2:
        results["correlation"] = compute_correlation(
            construct_scores_df,
            variables=list(construct_scores_df.columns),
            significance_level=significance_level
        )

    return results
