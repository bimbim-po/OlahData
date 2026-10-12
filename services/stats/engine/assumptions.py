from typing import List, Dict, Any, Tuple
import numpy as np
import pandas as pd
from scipy import stats

def compute_normality(residuals: np.ndarray, alpha: float = 0.05) -> List[Dict[str, Any]]:
    """
    Computes Normality test on unstandardized residuals.
    Uses Kolmogorov-Smirnov test against fitted normal distribution.
    Matches SPSS One-Sample Kolmogorov-Smirnov Test.
    """
    n = len(residuals)
    if n < 3:
        return []

    res_mean = float(np.mean(residuals))
    res_std = float(np.std(residuals, ddof=1))

    if res_std <= 1e-12:
        return [{
            "test": "Kolmogorov-Smirnov (Unstandardized Residual)",
            "statistic": 0.0,
            "pValue": 1.0,
            "normal": True
        }]

    ks_stat, ks_pval = stats.kstest(residuals, 'norm', args=(res_mean, res_std))

    return [
        {
            "test": "Kolmogorov-Smirnov (Unstandardized Residual)",
            "statistic": round(float(ks_stat), 4),
            "pValue": round(float(ks_pval), 4),
            "normal": bool(ks_pval >= alpha),
        }
    ]

def compute_multicollinearity(x_df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Computes Tolerance and Variance Inflation Factor (VIF) for each independent variable.
    Auxiliary OLS regressions: X_j ~ X_{-j}.
    Problematic if Tolerance < 0.10 or VIF > 10.0.
    """
    cols = list(x_df.columns)
    p = len(cols)
    results: List[Dict[str, Any]] = []

    if p <= 1:
        for c in cols:
            results.append({
                "variable": c,
                "tolerance": 1.0,
                "vif": 1.0,
                "problematic": False
            })
        return results

    for target_col in cols:
        other_cols = [c for c in cols if c != target_col]
        y_aux = x_df[target_col].values
        X_aux = np.column_stack([np.ones(len(x_df)), x_df[other_cols].values])

        try:
            beta_aux, residuals_aux, _, _ = np.linalg.lstsq(X_aux, y_aux, rcond=None)
            pred_aux = X_aux @ beta_aux
            ss_tot_aux = np.sum((y_aux - np.mean(y_aux)) ** 2)
            ss_res_aux = np.sum((y_aux - pred_aux) ** 2)

            if ss_tot_aux > 1e-12:
                r2_aux = max(0.0, min(1.0, float(1.0 - (ss_res_aux / ss_tot_aux))))
            else:
                r2_aux = 0.0

            tolerance = max(0.0001, 1.0 - r2_aux)
            vif = 1.0 / tolerance
        except Exception:
            tolerance = 1.0
            vif = 1.0

        results.append({
            "variable": target_col,
            "tolerance": round(float(tolerance), 4),
            "vif": round(float(vif), 4),
            "problematic": bool(tolerance < 0.10 or vif > 10.0)
        })

    return results

def compute_heteroscedasticity(
    residuals: np.ndarray,
    x_df: pd.DataFrame,
    alpha: float = 0.05
) -> List[Dict[str, Any]]:
    """
    Computes Heteroscedasticity test using Glejser Test.
    Regresses absolute residuals |e_i| onto independent variables:
    |e_i| = gamma_0 + gamma_1 * X_1 + ... + gamma_p * X_p.
    If p-value < 0.05, heteroscedasticity is present (violates assumption).
    """
    n = len(residuals)
    cols = list(x_df.columns)
    p = len(cols)
    abs_res = np.abs(residuals)

    df_res = n - p - 1
    if df_res <= 0:
        return []

    X_mat = np.column_stack([np.ones(n), x_df.values])
    xtx = X_mat.T @ X_mat
    xtx_inv = np.linalg.pinv(xtx)
    gamma = xtx_inv @ X_mat.T @ abs_res

    y_pred = X_mat @ gamma
    res_glejser = abs_res - y_pred
    ss_res = np.sum(res_glejser ** 2)
    ms_res = ss_res / df_res

    cov_gamma = ms_res * xtx_inv
    se_gamma = np.sqrt(np.maximum(0.0, np.diag(cov_gamma)))

    results: List[Dict[str, Any]] = []
    for i, col in enumerate(cols):
        idx = i + 1
        se_val = se_gamma[idx]
        t_stat = float(gamma[idx] / se_val) if se_val > 1e-12 else 0.0
        p_val = float(2.0 * (1.0 - stats.t.cdf(np.abs(t_stat), df_res)))

        results.append({
            "test": "Glejser",
            "variable": col,
            "tHitung": round(t_stat, 4),
            "pValue": round(p_val, 4),
            "significant": bool(p_val < alpha),
        })

    return results
