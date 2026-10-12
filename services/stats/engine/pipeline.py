from typing import List, Dict, Any, Optional
import datetime
import pandas as pd
import numpy as np

from config import settings
from engine.descriptive import compute_descriptive
from engine.validity import compute_validity
from engine.reliability import compute_reliability
from engine.regression import compute_regression
from engine.assumptions import compute_normality, compute_multicollinearity, compute_heteroscedasticity
from engine.correlation import compute_correlation
from engine.anova import compute_anova

def run_statistical_analysis(
    df: pd.DataFrame,
    constructs: List[Dict[str, Any]],
    selected_tests: List[str],
    significance_level: float = 0.05,
    project_id: str = "proj-default",
    data_version_id: str = "dv-default"
) -> Dict[str, Any]:
    """
    Orchestrates deterministic statistical analysis on the input dataset.
    Follows Indonesian quantitative thesis standards (Likert scale 1-5).
    Guarantees strict reproducibility.
    """
    clean_df = df.copy()
    n_respondents = len(clean_df)

    # Calculate construct aggregate scores (mean of items to preserve 1-5 scale)
    construct_scores_df = pd.DataFrame(index=clean_df.index)
    construct_role_map: Dict[str, str] = {}
    construct_name_map: Dict[str, str] = {}

    for c in constructs:
        c_name = c["name"]
        c_items = [it for it in c.get("items", []) if it in clean_df.columns]
        role = c.get("role", "independent")
        construct_role_map[c_name] = role
        construct_name_map[c_name] = c_name

        if c_items:
            # Construct score is the row mean of valid items
            construct_scores_df[c_name] = clean_df[c_items].mean(axis=1)

    results: Dict[str, Any] = {
        "id": f"result-{int(datetime.datetime.utcnow().timestamp())}",
        "projectId": project_id,
        "dataVersionId": data_version_id,
        "respondentCount": n_respondents,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "engineVersion": settings.ENGINE_VERSION,
        "significanceLevel": significance_level,
        "explanations": {},
    }

    # 1. Descriptive Statistics
    if "descriptive" in selected_tests:
        # Run on construct composite scores
        results["descriptive"] = compute_descriptive(construct_scores_df)

    # 2. Validity (Pearson Item-Total)
    if "validity" in selected_tests:
        results["validity"] = compute_validity(
            clean_df,
            constructs=constructs,
            significance_level=significance_level
        )

    # 3. Reliability (Cronbach's Alpha)
    if "reliability" in selected_tests:
        results["reliability"] = compute_reliability(
            clean_df,
            constructs=constructs,
            alpha_threshold=0.60
        )

    # Determine independent and dependent variables for regression and assumptions
    indep_vars = [c_name for c_name, role in construct_role_map.items() if role == "independent" and c_name in construct_scores_df.columns]
    dep_vars = [c_name for c_name, role in construct_role_map.items() if role == "dependent" and c_name in construct_scores_df.columns]

    residuals = None
    y_pred = None

    needs_regression = any(t in selected_tests for t in [
        "regression", "normality", "multicollinearity", "heteroscedasticity", "f-test", "fTest", "determination", "anova"
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

        # 4. Normality on regression residuals
        if "normality" in selected_tests and residuals is not None:
            results["normality"] = compute_normality(residuals, alpha=significance_level)

        # 5. Multicollinearity on independent variables
        if "multicollinearity" in selected_tests:
            results["multicollinearity"] = compute_multicollinearity(x_df)

        # 6. Heteroscedasticity via Glejser test
        if "heteroscedasticity" in selected_tests and residuals is not None:
            results["heteroscedasticity"] = compute_heteroscedasticity(residuals, x_df, alpha=significance_level)

    # 7. Correlation
    if "correlation" in selected_tests and len(construct_scores_df.columns) >= 2:
        results["correlation"] = compute_correlation(
            construct_scores_df,
            variables=list(construct_scores_df.columns),
            significance_level=significance_level
        )

    return results
