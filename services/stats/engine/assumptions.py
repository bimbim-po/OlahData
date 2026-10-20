from typing import List, Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd
from scipy import stats
from statsmodels.stats.diagnostic import lilliefors, het_breuschpagan
from statsmodels.stats.stattools import durbin_watson
from engine.formatter import format_p_value

def compute_normality(
    residuals: np.ndarray,
    alpha: float = 0.05
) -> Dict[str, Any]:
    """
    Computes regression residual normality tests.
    Strictly forbids scipy.stats.kstest with sample-estimated parameters.
    Uses:
    1. Kolmogorov-Smirnov with Lilliefors correction (statsmodels lilliefors)
    2. Shapiro-Wilk test (scipy.stats.shapiro)
    Generates histogram data and theoretical vs sample Q-Q plot coordinates.
    """
    n = len(residuals)
    if n < 3:
        return {
            "lilliefors": {"statistic": 0.0, "pValue": 1.0, "normal": True},
            "shapiroWilk": {"statistic": 0.0, "pValue": 1.0, "normal": True},
            "tests": [],
            "histogram": {},
            "qqPlot": []
        }

    # 1. Lilliefors corrected K-S test
    lil_stat, lil_pval = lilliefors(residuals, dist='norm')
    lil_stat = float(lil_stat)
    lil_pval = float(lil_pval)
    is_lil_normal = bool(lil_pval >= alpha)

    # 2. Shapiro-Wilk test
    shapiro_stat, shapiro_pval = stats.shapiro(residuals)
    shapiro_stat = float(shapiro_stat)
    shapiro_pval = float(shapiro_pval)
    is_shapiro_normal = bool(shapiro_pval >= alpha)

    # 3. Histogram data (bins & counts)
    hist_counts, bin_edges = np.histogram(residuals, bins="auto")
    histogram_data = {
        "counts": [int(c) for c in hist_counts],
        "binEdges": [float(b) for b in bin_edges]
    }

    # 4. Q-Q Plot data (theoretical standard normal quantiles vs sorted standardized residuals)
    res_std = float(np.std(residuals, ddof=1))
    std_residuals = (residuals - np.mean(residuals)) / res_std if res_std > 1e-12 else residuals
    sorted_res = np.sort(std_residuals)
    # Theoretical quantiles using Blom's plotting position: (i - 0.375) / (n + 0.25)
    plotting_positions = [(i + 1 - 0.375) / (n + 0.25) for i in range(n)]
    theoretical_quantiles = stats.norm.ppf(plotting_positions)

    qq_data = [
        {"theoretical": float(t_q), "sample": float(s_q)}
        for t_q, s_q in zip(theoretical_quantiles, sorted_res)
    ]

    tests_list = [
        {
            "test": "Kolmogorov-Smirnov (Lilliefors)",
            "statistic": lil_stat,
            "pValue": lil_pval,
            "pFormatted": format_p_value(lil_pval),
            "normal": is_lil_normal,
            "decision": "Residual berdistribusi normal" if is_lil_normal else "Residual tidak berdistribusi normal"
        },
        {
            "test": "Shapiro-Wilk",
            "statistic": shapiro_stat,
            "pValue": shapiro_pval,
            "pFormatted": format_p_value(shapiro_pval),
            "normal": is_shapiro_normal,
            "decision": "Residual berdistribusi normal" if is_shapiro_normal else "Residual tidak berdistribusi normal"
        }
    ]

    return {
        "lilliefors": {
            "statistic": lil_stat,
            "pValue": lil_pval,
            "pFormatted": format_p_value(lil_pval),
            "normal": is_lil_normal
        },
        "shapiroWilk": {
            "statistic": shapiro_stat,
            "pValue": shapiro_pval,
            "pFormatted": format_p_value(shapiro_pval),
            "normal": is_shapiro_normal
        },
        "tests": tests_list,
        "histogram": histogram_data,
        "qqPlot": qq_data
    }

def compute_multicollinearity(x_df: pd.DataFrame) -> Dict[str, Any]:
    """
    Computes Tolerance and Variance Inflation Factor (VIF) for each predictor.
    Formula: Tolerance = 1 - R_j^2, VIF = 1 / Tolerance
    Single predictor rule: Multicollinearity is bypassed with an academic justification.
    """
    cols = list(x_df.columns)
    k = len(cols)

    if k <= 1:
        return {
            "applicable": False,
            "reason": "Uji multikolinearitas tidak dapat diterapkan karena model regresi hanya memiliki satu variabel prediktor (k = 1). Multikolinearitas mensyaratkan minimal 2 variabel independen.",
            "variables": {},
            "list": []
        }

    var_dict: Dict[str, Dict[str, Any]] = {}
    var_list: List[Dict[str, Any]] = []

    for target_col in cols:
        other_cols = [c for c in cols if c != target_col]
        y_aux = x_df[target_col].values
        X_aux = np.column_stack([np.ones(len(x_df)), x_df[other_cols].values])

        try:
            beta_aux, _, _, _ = np.linalg.lstsq(X_aux, y_aux, rcond=None)
            pred_aux = X_aux @ beta_aux
            ss_tot_aux = float(np.sum((y_aux - np.mean(y_aux)) ** 2))
            ss_res_aux = float(np.sum((y_aux - pred_aux) ** 2))

            if ss_tot_aux > 1e-12:
                r2_aux = max(0.0, min(1.0, float(1.0 - (ss_res_aux / ss_tot_aux))))
            else:
                r2_aux = 0.0

            tolerance = float(max(1e-6, 1.0 - r2_aux))
            vif = float(1.0 / tolerance)
        except Exception:
            tolerance = 1.0
            vif = 1.0

        is_problematic = bool(vif >= 10.0 or tolerance <= 0.10)
        entry = {
            "variable": target_col,
            "tolerance": tolerance,
            "vif": vif,
            "problematic": is_problematic,
            "status": "Terjadi Multikolinearitas" if is_problematic else "Bebas Multikolinearitas"
        }
        var_dict[target_col] = entry
        var_list.append(entry)

    return {
        "applicable": True,
        "reason": None,
        "variables": var_dict,
        "list": var_list
    }

def compute_heteroscedasticity(
    residuals: np.ndarray,
    x_df: pd.DataFrame,
    y_pred: Optional[np.ndarray] = None,
    alpha: float = 0.05
) -> Dict[str, Any]:
    """
    Computes Heteroscedasticity tests:
    1. Glejser Test: Regresses absolute residuals |e_i| onto predictors.
       p > 0.05 indicates homoscedasticity (no heteroscedasticity).
    2. Breusch-Pagan Test: Lagrange multiplier test on squared residuals.
       p > 0.05 indicates homoscedasticity.
    Includes scatter plot coordinates (y_pred vs residuals).
    """
    n = len(residuals)
    cols = list(x_df.columns)
    k = len(cols)
    abs_res = np.abs(residuals)

    df_res = n - k - 1
    if df_res <= 0:
        return {
            "glejser": {},
            "breuschPagan": {"statistic": 0.0, "pValue": 1.0, "homoscedastic": True},
            "plotData": []
        }

    X_mat = np.column_stack([np.ones(n), x_df.values])
    xtx = X_mat.T @ X_mat
    xtx_inv = np.linalg.pinv(xtx)

    # Glejser regression: |e| = gamma_0 + gamma_1 X_1 + ...
    gamma = xtx_inv @ X_mat.T @ abs_res
    pred_g = X_mat @ gamma
    res_g = abs_res - pred_g
    ss_res_g = float(np.sum(res_g ** 2))
    ms_res_g = ss_res_g / df_res

    cov_gamma = ms_res_g * xtx_inv
    se_gamma = np.sqrt(np.maximum(0.0, np.diag(cov_gamma)))

    glejser_dict: Dict[str, Dict[str, Any]] = {}
    glejser_list: List[Dict[str, Any]] = []

    for i, col in enumerate(cols):
        idx = i + 1
        se_val = float(se_gamma[idx])
        t_stat = float(gamma[idx] / se_val) if se_val > 1e-12 else 0.0
        p_val = float(2.0 * (1.0 - stats.t.cdf(np.abs(t_stat), df_res)))
        has_het = bool(p_val < alpha)

        entry = {
            "test": "Glejser",
            "variable": col,
            "tHitung": t_stat,
            "pValue": p_val,
            "pFormatted": format_p_value(p_val),
            "heteroscedastic": has_het,
            "significant": has_het,
            "status": "Terjadi Heteroskedastisitas" if has_het else "Homoskedastisitas Terpenuhi (Bebas Heteroskedastisitas)"
        }
        glejser_dict[col] = entry
        glejser_list.append(entry)

    # Breusch-Pagan test
    try:
        bp_lm, bp_p, _, _ = het_breuschpagan(residuals, X_mat)
        bp_lm = float(bp_lm)
        bp_p = float(bp_p)
    except Exception:
        bp_lm, bp_p = 0.0, 1.0

    bp_res = {
        "statistic": bp_lm,
        "pValue": bp_p,
        "pFormatted": format_p_value(bp_p),
        "homoscedastic": bool(bp_p >= alpha),
        "decision": "Homoskedastisitas terpenuhi" if bp_p >= alpha else "Terjadi heteroskedastisitas"
    }

    # Scatter plot data: fitted values vs residuals
    plot_data = []
    if y_pred is not None:
        plot_data = [
            {"fitted": float(fit), "residual": float(res)}
            for fit, res in zip(y_pred, residuals)
        ]

    return {
        "glejser": glejser_dict,
        "glejserList": glejser_list,
        "breuschPagan": bp_res,
        "plotData": plot_data
    }

def compute_autocorrelation(
    residuals: np.ndarray,
    enabled: bool = False
) -> Dict[str, Any]:
    """
    Computes Durbin-Watson statistic.
    Default disabled for survey / cross-sectional data with academic rationale.
    """
    dw_stat = float(durbin_watson(residuals))
    return {
        "durbinWatson": dw_stat,
        "enabledByDefault": False,
        "active": enabled,
        "note": "Uji Durbin-Watson diperuntukkan bagi data time-series (runtun waktu), dinonaktifkan secara default untuk data survei cross-sectional."
    }
