from typing import List, Dict, Any, Optional, Union, Tuple
import datetime
import pandas as pd
import numpy as np

from config import settings
from engine.descriptive import compute_descriptive, compute_construct_scores, compute_frequency_table
from engine.validity import compute_validity
from engine.mediation_moderation import (
    compute_path_analysis_and_sobel,
    compute_moderated_regression,
)
from engine.reliability import compute_reliability
from engine.regression import compute_regression
from engine.linearity import compute_linearity_test
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
    tails: int = 2,
    negative_items: Optional[Union[List[str], Dict[str, Tuple[int, int]]]] = None,
    drop_invalid_items: bool = False,
    alpha_threshold: float = 0.70,
    scale_min: int = 1,
    scale_max: int = 5,
    project_id: str = "proj-default",
    data_version_id: str = "dv-default",
    excluded_rows_log: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Orchestrates deterministic statistical analysis on the input dataset.
    Strictly follows Indonesian S1 quantitative thesis standards.
    Guarantees:
    - P1: Raw data immutability.
    - P2: Zero hardcoded dataset specifics.
    - P3: Invariant n_input = n_dipakai + n_dikecualikan.
    - P5: Deterministic single source of truth.
    - P7: Never guesses methodological decisions (no auto-dropping invalid items without user choice).
    """
    clean_df = df.copy()
    n_input = len(clean_df)
    n_dikecualikan = len(excluded_rows_log) if excluded_rows_log else 0
    n_dipakai = n_input

    # Pre-reverse negative items if specified (supports list or dict with per-item scale)
    if negative_items:
        if isinstance(negative_items, dict):
            for it, (s_min, s_max) in negative_items.items():
                if it in clean_df.columns:
                    clean_df[it] = (s_max + s_min) - clean_df[it]
        elif isinstance(negative_items, list):
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
        "respondentCount": n_dipakai,
        "accounting": {
            "nInput": n_input,
            "nDipakai": n_dipakai,
            "nDikecualikan": n_dikecualikan,
            "invariantHolds": bool(n_input == n_dipakai),
            "excludedDetails": excluded_rows_log or []
        },
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "engineVersion": settings.ENGINE_VERSION,
        "significanceLevel": significance_level,
        "tails": tails,
        "scaleMin": scale_min,
        "scaleMax": scale_max,
        "dropInvalidItemsApplied": drop_invalid_items,
        "sampleSize": check_sample_size(n_dipakai, num_predictors=max(1, len([r for r in construct_role_map.values() if r == "independent"]))),
        "explanations": {},
    }

    # 1. Validity testing (Corrected Item-Total Pearson Correlation)
    validity_res = []
    valid_items_map: Dict[str, List[str]] = {}
    if "validity" in selected_tests or any(t in selected_tests for t in ["reliability", "regression", "linearity"]):
        validity_res = compute_validity(
            clean_df,
            constructs=constructs,
            significance_level=significance_level,
            tails=tails,
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

    # Compute Construct Scores (Mean of items; only drops invalid items if explicitly chosen by user)
    construct_scores_df, table_notes = compute_construct_scores(
        clean_df,
        constructs=constructs,
        valid_items_only=valid_items_map if (drop_invalid_items and valid_items_map) else None,
        drop_invalid_items=drop_invalid_items,
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

    # 3. Reliability (Cronbach's Alpha, item analysis)
    if "reliability" in selected_tests:
        results["reliability"] = compute_reliability(
            clean_df,
            constructs=constructs,
            alpha_threshold=alpha_threshold,
            valid_items_map=valid_items_map if drop_invalid_items else None,
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
            results["autocorrelation"] = compute_autocorrelation(
                residuals,
                num_predictors=len(indep_vars),
                enabled=True
            )

    # 4b. Linearity: ANOVA Test for Linearity
    if "linearity" in selected_tests and len(indep_vars) >= 1 and len(dep_vars) >= 1:
        target_dep = dep_vars[0]
        y_ser = construct_scores_df[target_dep]
        linearity_results = []
        for iv in indep_vars:
            x_ser = construct_scores_df[iv]
            lin_res = compute_linearity_test(
                x_series=x_ser,
                y_series=y_ser,
                x_name=iv,
                y_name=target_dep,
                alpha=significance_level
            )
            linearity_results.append(lin_res)
        results["linearity"] = linearity_results

    # 5. Correlation (Pearson & Spearman)
    if "correlation" in selected_tests and len(construct_scores_df.columns) >= 2:
        results["correlation"] = compute_correlation(
            construct_scores_df,
            variables=list(construct_scores_df.columns),
            significance_level=significance_level
        )

    # 6. Analisis Jalur & Uji Sobel (Mediasi)
    has_mediator = any(c.get("role") == "mediator" for c in constructs)
    if has_mediator or "mediation" in selected_tests:
        try:
            path_res = compute_path_analysis_and_sobel(
                construct_scores_df,
                constructs=constructs,
                alpha=significance_level
            )
            if path_res.get("hasMediation"):
                results["pathAnalysis"] = path_res
        except Exception as e:
            pass

    # 7. Moderated Regression Analysis (MRA / Moderasi)
    has_moderator = any(c.get("role") == "moderator" for c in constructs)
    if has_moderator or "moderation" in selected_tests:
        try:
            mod_res = compute_moderated_regression(
                construct_scores_df,
                constructs=constructs,
                alpha=significance_level
            )
            if mod_res.get("hasModeration"):
                results["moderationAnalysis"] = mod_res
        except Exception as e:
            pass

    return results
