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

# Savin-White / Durbin-Watson Critical Bounds Table (alpha = 0.05)
# Key: (n, k_predictors) -> (dL, dU)
# Standard statistical table for k in [1..5], n in [6..200]
DW_SAVIN_WHITE_TABLE: Dict[Tuple[int, int], Tuple[float, float]] = {
    (15, 1): (1.08, 1.36), (15, 2): (0.95, 1.54), (15, 3): (0.82, 1.75), (15, 4): (0.69, 1.97), (15, 5): (0.56, 2.21),
    (20, 1): (1.20, 1.41), (20, 2): (1.10, 1.54), (20, 3): (1.00, 1.68), (20, 4): (0.90, 1.83), (20, 5): (0.79, 1.99),
    (25, 1): (1.29, 1.45), (25, 2): (1.21, 1.55), (25, 3): (1.12, 1.66), (25, 4): (1.04, 1.77), (25, 5): (0.95, 1.89),
    (30, 1): (1.35, 1.49), (30, 2): (1.28, 1.57), (30, 3): (1.21, 1.65), (30, 4): (1.14, 1.74), (30, 5): (1.07, 1.83),
    (35, 1): (1.40, 1.52), (35, 2): (1.34, 1.58), (35, 3): (1.28, 1.65), (35, 4): (1.22, 1.73), (35, 5): (1.16, 1.80),
    (40, 1): (1.44, 1.54), (40, 2): (1.39, 1.60), (40, 3): (1.34, 1.66), (40, 4): (1.29, 1.72), (40, 5): (1.23, 1.79),
    (50, 1): (1.50, 1.59), (50, 2): (1.46, 1.63), (50, 3): (1.42, 1.67), (50, 4): (1.38, 1.72), (50, 5): (1.34, 1.77),
    (60, 1): (1.55, 1.62), (60, 2): (1.51, 1.65), (60, 3): (1.48, 1.69), (60, 4): (1.44, 1.73), (60, 5): (1.41, 1.77),
    (70, 1): (1.58, 1.64), (70, 2): (1.55, 1.67), (70, 3): (1.52, 1.70), (70, 4): (1.49, 1.74), (70, 5): (1.46, 1.77),
    (80, 1): (1.61, 1.66), (80, 2): (1.59, 1.69), (80, 3): (1.56, 1.72), (80, 4): (1.53, 1.74), (80, 5): (1.51, 1.77),
    (90, 1): (1.63, 1.68), (90, 2): (1.61, 1.70), (90, 3): (1.59, 1.73), (90, 4): (1.57, 1.75), (90, 5): (1.54, 1.78),
    (100, 1): (1.65, 1.69), (100, 2): (1.63, 1.72), (100, 3): (1.61, 1.74), (100, 4): (1.59, 1.76), (100, 5): (1.57, 1.78),
    (120, 1): (1.68, 1.72), (120, 2): (1.67, 1.73), (120, 3): (1.65, 1.75), (120, 4): (1.63, 1.77), (120, 5): (1.62, 1.79),
    (150, 1): (1.72, 1.75), (150, 2): (1.71, 1.76), (150, 3): (1.69, 1.77), (150, 4): (1.68, 1.79), (150, 5): (1.66, 1.80),
    (200, 1): (1.76, 1.78), (200, 2): (1.75, 1.79), (200, 3): (1.74, 1.80), (200, 4): (1.73, 1.81), (200, 5): (1.72, 1.82),
}

def lookup_durbin_watson_bounds(n: int, k: int) -> Tuple[Optional[float], Optional[float], bool]:
    """
    Looks up dL and dU critical values from the Savin-White Durbin-Watson table.
    Finds nearest standard N if exact N is not an explicit grid point, but
    refuses to guess if N or k is outside standard table boundaries (N < 15 or N > 250 or k > 5).
    """
    if k < 1 or k > 5 or n < 15 or n > 250:
        return None, None, False

    # Exact match
    if (n, k) in DW_SAVIN_WHITE_TABLE:
        dl, du = DW_SAVIN_WHITE_TABLE[(n, k)]
        return dl, du, True

    # Interpolate / nearest N grid point
    available_ns = sorted(list({key_n for key_n, _ in DW_SAVIN_WHITE_TABLE.keys()}))
    # Find closest N
    closest_n = min(available_ns, key=lambda x: abs(x - n))
    dl, du = DW_SAVIN_WHITE_TABLE[(closest_n, k)]
    return dl, du, True


def compute_autocorrelation(
    residuals: np.ndarray,
    num_predictors: int = 1,
    enabled: bool = False
) -> Dict[str, Any]:
    """
    Computes Durbin-Watson statistic and bounds.
    P5 / 4.9: Looks up dL and dU from Savin-White table based on N and k.
    If outside range, writes 'tabel tidak tersedia' without guessing.
    States academic rationale that DW is designed for time-series data.
    """
    n = len(residuals)
    k = max(1, num_predictors)
    dw_stat = float(durbin_watson(residuals))

    dl, du, table_available = lookup_durbin_watson_bounds(n, k)

    decision = None
    if table_available and dl is not None and du is not None:
        if dw_stat < dl:
            decision = "Terjadi autokorelasi positif (DW < dL)"
        elif dw_stat > (4.0 - dl):
            decision = "Terjadi autokorelasi negatif (DW > 4 - dL)"
        elif du <= dw_stat <= (4.0 - du):
            decision = "Bebas autokorelasi (dU <= DW <= 4 - dU)"
        else:
            decision = "Daerah ragu-ragu / tidak dapat disimpulkan secara pasti"
    else:
        decision = "Tabel Savin-White tidak tersedia untuk ukuran sampel ini"

    return {
        "durbinWatson": dw_stat,
        "dL": dl,
        "dU": du,
        "tableAvailable": table_available,
        "fourMinusDU": float(4.0 - du) if du is not None else None,
        "fourMinusDL": float(4.0 - dl) if dl is not None else None,
        "decision": decision,
        "enabledByDefault": False,
        "active": enabled,
        "note": (
            "Uji Durbin-Watson lazim digunakan untuk data runtut waktu (time-series). "
            "Untuk penelitian kuesioner data silang (cross-sectional), asumsi bebas autokorelasi umumnya tidak dipersyaratkan."
        )
    }
