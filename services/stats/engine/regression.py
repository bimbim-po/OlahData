from typing import List, Dict, Any, Tuple
import numpy as np
import pandas as pd
from scipy import stats

def compute_regression(
    y_series: pd.Series,
    x_df: pd.DataFrame,
    significance_level: float = 0.05
) -> Tuple[List[Dict[str, Any]], Dict[str, Any], Dict[str, Any], List[Dict[str, Any]], np.ndarray, np.ndarray]:
    """
    Computes Multiple Ordinary Least Squares (OLS) Linear Regression.
    Returns:
    - regression_table: List of {variable, coefficient, stdError, tHitung, pValue, significant}
    - f_test: {fHitung, fTabel, pValue, significant}
    - determination: {rSquare, adjustedRSquare, stdError}
    - anova_table: List of {source, sumOfSquares, df, meanSquare, fValue, pValue}
    - residuals: numpy 1D array of unstandardized residuals
    - fitted_values: numpy 1D array of predicted y values
    Matches standard SPSS regression output.
    """
    n = len(y_series)
    p = x_df.shape[1]
    df_res = n - p - 1

    if n <= p + 1 or p < 1:
        raise ValueError(f"Jumlah sampel ({n}) tidak mencukupi untuk regresi dengan {p} prediktor.")

    # Design matrix with intercept
    X_mat = np.column_stack([np.ones(n), x_df.values])
    y_mat = y_series.values

    # OLS coefficients
    # (X'X)^(-1) X'y
    xtx = X_mat.T @ X_mat
    xtx_inv = np.linalg.pinv(xtx)
    beta = xtx_inv @ X_mat.T @ y_mat

    y_pred = X_mat @ beta
    residuals = y_mat - y_pred

    y_mean = np.mean(y_mat)
    ss_tot = float(np.sum((y_mat - y_mean) ** 2))
    ss_res = float(np.sum(residuals ** 2))
    ss_reg = float(ss_tot - ss_res)

    ms_reg = ss_reg / p
    ms_res = ss_res / df_res if df_res > 0 else 0.0

    se_estimate = float(np.sqrt(ms_res))

    # Variance-covariance of coefficients
    cov_beta = ms_res * xtx_inv
    se_beta = np.sqrt(np.maximum(0.0, np.diag(cov_beta)))

    t_stats = np.where(se_beta > 1e-12, beta / se_beta, 0.0)
    p_values = 2.0 * (1.0 - stats.t.cdf(np.abs(t_stats), df_res))

    # F test
    f_stat = float(ms_reg / ms_res) if ms_res > 1e-12 else 0.0
    f_pval = float(1.0 - stats.f.cdf(f_stat, p, df_res))
    f_tabel = float(stats.f.ppf(1.0 - significance_level, p, df_res))

    # Determination
    r2 = float(1.0 - (ss_res / ss_tot)) if ss_tot > 1e-12 else 0.0
    adj_r2 = float(1.0 - ((1.0 - r2) * (n - 1) / df_res)) if df_res > 0 else 0.0

    # Build regression table
    regression_table: List[Dict[str, Any]] = [
        {
            "variable": "(Konstanta)",
            "coefficient": round(float(beta[0]), 4),
            "stdError": round(float(se_beta[0]), 4),
            "tHitung": round(float(t_stats[0]), 4),
            "pValue": round(float(p_values[0]), 4),
            "significant": bool(p_values[0] < significance_level),
        }
    ]

    col_names = list(x_df.columns)
    for i, col in enumerate(col_names):
        idx = i + 1
        regression_table.append({
            "variable": col,
            "coefficient": round(float(beta[idx]), 4),
            "stdError": round(float(se_beta[idx]), 4),
            "tHitung": round(float(t_stats[idx]), 4),
            "pValue": round(float(p_values[idx]), 4),
            "significant": bool(p_values[idx] < significance_level),
        })

    f_test = {
        "fHitung": round(f_stat, 4),
        "fTabel": round(f_tabel, 4),
        "pValue": round(f_pval, 4),
        "significant": bool(f_pval < significance_level),
    }

    determination = {
        "rSquare": round(r2, 4),
        "adjustedRSquare": round(adj_r2, 4),
        "stdError": round(se_estimate, 4),
    }

    anova_table = [
        {
            "source": "Regresi",
            "sumOfSquares": round(ss_reg, 4),
            "df": int(p),
            "meanSquare": round(ms_reg, 4),
            "fValue": round(f_stat, 4),
            "pValue": round(f_pval, 4),
        },
        {
            "source": "Residual",
            "sumOfSquares": round(ss_res, 4),
            "df": int(df_res),
            "meanSquare": round(ms_res, 4),
            "fValue": 0.0,
            "pValue": 0.0,
        },
        {
            "source": "Total",
            "sumOfSquares": round(ss_tot, 4),
            "df": int(n - 1),
            "meanSquare": 0.0,
            "fValue": 0.0,
            "pValue": 0.0,
        },
    ]

    return regression_table, f_test, determination, anova_table, residuals, y_pred
