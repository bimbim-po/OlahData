"""
Section 6.1: Statistical Comparison Benchmark Tests
Compares OlahData deterministic engine against standard reference libraries:
- scipy.stats
- statsmodels.api
- pingouin
Across random synthetic datasets (various sample sizes N, scales 4, 5, 6, 7, 10,
item counts, and 1 to 4 predictors).
Enforces tolerance 1e-6.
"""

import pytest
import numpy as np
import pandas as pd
from scipy import stats
import statsmodels.api as sm
import pingouin as pg

from engine.descriptive import compute_descriptive, compute_construct_scores
from engine.validity import compute_validity, calculate_r_table
from engine.reliability import compute_reliability
from engine.regression import compute_regression
from engine.linearity import compute_linearity_test
from engine.assumptions import compute_normality, compute_multicollinearity, compute_heteroscedasticity
from engine.correlation import compute_correlation


@pytest.mark.parametrize("seed,n,scale_max,k_items,k_pred", [
    (42, 60, 5, 4, 2),
    (101, 100, 7, 5, 3),
    (202, 45, 4, 3, 1),
    (303, 120, 10, 6, 4),
    (404, 80, 6, 4, 2),
])
def test_engine_vs_reference_libraries(seed, n, scale_max, k_items, k_pred):
    np.random.seed(seed)
    scale_min = 1

    # 1. Generate synthetic questionnaire dataset
    data = {}
    constructs = []
    
    # Generate predictors X1..Xk and dependent Y
    for p_idx in range(k_pred):
        c_name = f"Prediktor_{p_idx + 1}"
        c_code = f"X{p_idx + 1}"
        items = []
        for i_idx in range(k_items):
            col_name = f"{c_code}_{i_idx + 1}"
            items.append(col_name)
            # Discrete Likert integers with positive latent correlation
            base = np.random.randint(scale_min, scale_max + 1, size=n)
            noise = np.random.choice([-1, 0, 1], size=n, p=[0.15, 0.7, 0.15])
            val = np.clip(base + noise, scale_min, scale_max)
            data[col_name] = val
        constructs.append({"name": c_name, "code": c_code, "items": items, "role": "independent"})

    # Dependent variable Y
    y_items = []
    y_code = "Y"
    for i_idx in range(k_items):
        col_name = f"{y_code}_{i_idx + 1}"
        y_items.append(col_name)
        # Y correlated with X1
        base = data[f"X1_1"]
        noise = np.random.choice([-1, 0, 1], size=n, p=[0.2, 0.6, 0.2])
        val = np.clip(base + noise, scale_min, scale_max)
        data[col_name] = val
    constructs.append({"name": "Variabel Terikat", "code": y_code, "items": y_items, "role": "dependent"})

    df = pd.DataFrame(data)

    # -------------------------------------------------------------
    # A. VALIDITY: Corrected Item-Total vs Manual Scipy Pearson
    # -------------------------------------------------------------
    val_res = compute_validity(df, constructs, significance_level=0.05, use_corrected=True)
    for c in constructs:
        items = c["items"]
        item_matrix = df[items].values
        tot = np.sum(item_matrix, axis=1)
        for i_idx, it_name in enumerate(items):
            other = tot - item_matrix[:, i_idx]
            ref_r, ref_p = stats.pearsonr(item_matrix[:, i_idx], other)
            # Find in val_res
            entry = next(v for v in val_res if v["item"] == it_name)
            assert abs(entry["rHitung"] - ref_r) < 1e-6, f"Validity r mismatch on {it_name}"
            assert abs(entry["pValue"] - ref_p) < 1e-6, f"Validity p mismatch on {it_name}"

    # -------------------------------------------------------------
    # B. RELIABILITY: Cronbach Alpha vs Pingouin
    # -------------------------------------------------------------
    rel_res = compute_reliability(df, constructs)
    for c in constructs:
        items = c["items"]
        ref_alpha = float(pg.cronbach_alpha(df[items])[0])
        entry = next(r for r in rel_res if r["code"] == c["code"])
        assert abs(entry["cronbachAlpha"] - ref_alpha) < 1e-6, f"Cronbach alpha mismatch on {c['code']}"

    # -------------------------------------------------------------
    # C. COMPUTE CONSTRUCT SCORES & DESCRIPTIVES vs Numpy
    # -------------------------------------------------------------
    c_df, _ = compute_construct_scores(df, constructs, scale_min=scale_min, scale_max=scale_max)
    desc_res = compute_descriptive(c_df, variables=[c["code"] for c in constructs], scale_min=scale_min, scale_max=scale_max)
    for c in constructs:
        code = c["code"]
        entry = next(d for d in desc_res if d["variable"] == code)
        ref_mean = float(np.mean(c_df[code]))
        ref_std = float(np.std(c_df[code], ddof=1))
        assert abs(entry["mean"] - ref_mean) < 1e-6, f"Mean mismatch on {code}"
        assert abs(entry["stdDev"] - ref_std) < 1e-6, f"StdDev mismatch on {code}"

    # -------------------------------------------------------------
    # D. OLS REGRESSION vs Statsmodels OLS
    # -------------------------------------------------------------
    x_codes = [c["code"] for c in constructs if c["role"] == "independent"]
    y_code = "Y"

    reg_table, f_res, det_res, anova_table, residuals, y_pred = compute_regression(
        y_series=c_df[y_code],
        x_df=c_df[x_codes],
        significance_level=0.05
    )

    # Reference statsmodels OLS
    X_sm = sm.add_constant(c_df[x_codes])
    sm_model = sm.OLS(c_df[y_code], X_sm).fit()

    # Intercept
    const_entry = next(r for r in reg_table if r["variable"] == "(Konstanta)")
    assert abs(const_entry["b"] - sm_model.params["const"]) < 1e-6
    assert abs(const_entry["se"] - sm_model.bse["const"]) < 1e-6
    assert abs(const_entry["t"] - sm_model.tvalues["const"]) < 1e-6
    assert abs(const_entry["p"] - sm_model.pvalues["const"]) < 1e-6

    # Slopes
    for code in x_codes:
        entry = next(r for r in reg_table if r["variable"] == code)
        assert abs(entry["b"] - sm_model.params[code]) < 1e-6, f"Slope B mismatch on {code}"
        assert abs(entry["se"] - sm_model.bse[code]) < 1e-6, f"Slope SE mismatch on {code}"
        assert abs(entry["t"] - sm_model.tvalues[code]) < 1e-6, f"Slope t mismatch on {code}"
        assert abs(entry["p"] - sm_model.pvalues[code]) < 1e-6, f"Slope p mismatch on {code}"

    # Model Summary: R2, Adj R2, F, F p-value
    assert abs(det_res["rSquare"] - sm_model.rsquared) < 1e-6, "R-Square mismatch"
    assert abs(det_res["adjustedRSquare"] - sm_model.rsquared_adj) < 1e-6, "Adjusted R-Square mismatch"
    assert abs(f_res["fHitung"] - sm_model.fvalue) < 1e-6, "F-statistic mismatch"
    assert abs(f_res["pValue"] - sm_model.f_pvalue) < 1e-6, "F p-value mismatch"

    # Residuals
    assert np.allclose(residuals, sm_model.resid, atol=1e-6), "Residuals mismatch"

    # -------------------------------------------------------------
    # E. MULTICOLLINEARITY (VIF & Tolerance) vs Statsmodels
    # -------------------------------------------------------------
    if len(x_codes) >= 2:
        from statsmodels.stats.outliers_influence import variance_inflation_factor
        multi_res = compute_multicollinearity(c_df[x_codes])
        assert multi_res["applicable"] is True
        for i, code in enumerate(x_codes):
            ref_vif = float(variance_inflation_factor(c_df[x_codes].values, i))
            # Note: statsmodels without intercept has different VIF definition;
            # regression of X_j on other X with intercept gives standard VIF:
            X_other = sm.add_constant(c_df[[c for c in x_codes if c != code]])
            sm_aux = sm.OLS(c_df[code], X_other).fit()
            ref_tol = 1.0 - sm_aux.rsquared
            ref_vif_proper = 1.0 / ref_tol
            calc_vif = multi_res["variables"][code]["vif"]
            assert abs(calc_vif - ref_vif_proper) < 1e-6, f"VIF mismatch on {code}"
    else:
        multi_res = compute_multicollinearity(c_df[x_codes])
        assert multi_res["applicable"] is False
        assert "k = 1" in multi_res["reason"]

    # -------------------------------------------------------------
    # F. CORRELATION vs Scipy pearsonr
    # -------------------------------------------------------------
    all_codes = x_codes + [y_code]
    corr_res = compute_correlation(c_df, variables=all_codes)
    for c1 in all_codes:
        for c2 in all_codes:
            ref_r, ref_p = stats.pearsonr(c_df[c1], c_df[c2])
            calc_r = corr_res["pearson"][c1][c2]["r"]
            calc_p = corr_res["pearson"][c1][c2]["p"]
            assert abs(calc_r - ref_r) < 1e-6, f"Pearson r mismatch on {c1}-{c2}"
            assert abs(calc_p - ref_p) < 1e-6, f"Pearson p mismatch on {c1}-{c2}"
