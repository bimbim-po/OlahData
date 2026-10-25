from typing import List, Dict, Any, Tuple
import numpy as np
import pandas as pd
from scipy import stats
from engine.formatter import format_p_value

def compute_regression(
    y_series: pd.Series,
    x_df: pd.DataFrame,
    significance_level: float = 0.05
) -> Tuple[List[Dict[str, Any]], Dict[str, Any], Dict[str, Any], List[Dict[str, Any]], np.ndarray, np.ndarray]:
    """
    Computes Multiple Ordinary Least Squares (OLS) Linear Regression.
    Strict Indonesian Academic & Skripsi Standards:
    - B, SE, t, p, Standardized Beta (from z-scores / B * s_x / s_y)
    - R (multiple correlation), R^2, Adjusted R^2, Standard Error of Estimate
    - ANOVA table with exact SS, df, MS, F, p
    - Dynamic F_tabel and t_tabel computed directly from distributions (SciPy)
    - Verification of exact mathematical identities:
        F = (R^2 / k) / ((1 - R^2) / (n - k - 1))
        adj_R^2 = 1 - (1 - R^2) * (n - 1) / (n - k - 1)
    - Automated code-generated hypothesis decisions (excluding constant from research hypothesis)
    - p < 0.001 formatted as '< 0,001'
    """
    n = len(y_series)
    k = x_df.shape[1]
    df_res = n - k - 1

    if n <= k + 1 or k < 1:
        raise ValueError(f"Ukuran sampel ({n}) tidak mencukupi untuk regresi dengan {k} prediktor (minimal {k + 2}).")

    # Design matrix with intercept column
    X_mat = np.column_stack([np.ones(n), x_df.values])
    y_mat = y_series.values

    # Check for perfect collinearity / rank deficiency
    xtx = X_mat.T @ X_mat
    rank_xtx = np.linalg.matrix_rank(xtx)
    if rank_xtx < (k + 1):
        corr_mat = x_df.corr().abs()
        for i_c in range(k):
            for j_c in range(i_c + 1, k):
                if corr_mat.iloc[i_c, j_c] > 0.999:
                    c1, c2 = x_df.columns[i_c], x_df.columns[j_c]
                    raise ValueError(
                        f"Terdeteksi multikolinearitas sempurna antara variabel '{c1}' dan '{c2}' "
                        f"(korelasi = 1,00). Model regresi OLS tidak dapat mengestimasi koefisien unik."
                    )
        raise ValueError("Matriks prediktor singular: terdeteksi multikolinearitas sempurna antar variabel bebas.")

    # Exact OLS coefficients: beta = (X'X)^(-1) X'y
    xtx_inv = np.linalg.pinv(xtx)
    beta = xtx_inv @ X_mat.T @ y_mat

    y_pred = X_mat @ beta
    residuals = y_mat - y_pred

    # Sum of squares
    y_mean = float(np.mean(y_mat))
    ss_tot = float(np.sum((y_mat - y_mean) ** 2))
    ss_res = float(np.sum(residuals ** 2))
    ss_reg = float(ss_tot - ss_res)

    ms_reg = ss_reg / k
    ms_res = ss_res / df_res if df_res > 0 else 0.0

    se_estimate = float(np.sqrt(ms_res))

    # Variance-covariance of coefficients
    cov_beta = ms_res * xtx_inv
    se_beta = np.sqrt(np.maximum(0.0, np.diag(cov_beta)))

    t_stats = np.where(se_beta > 1e-12, beta / se_beta, 0.0)
    p_values = 2.0 * (1.0 - stats.t.cdf(np.abs(t_stats), df_res))

    # Dynamic critical tables
    t_tabel = float(stats.t.ppf(1.0 - significance_level / 2.0, df_res))
    f_tabel = float(stats.f.ppf(1.0 - significance_level, k, df_res))

    # F test
    f_stat = float(ms_reg / ms_res) if ms_res > 1e-12 else 0.0
    f_pval = float(1.0 - stats.f.cdf(f_stat, k, df_res))

    # Determination R^2 and Adjusted R^2
    r2 = float(1.0 - (ss_res / ss_tot)) if ss_tot > 1e-12 else 0.0
    r_mult = float(np.sqrt(max(0.0, r2)))
    adj_r2 = float(1.0 - ((1.0 - r2) * (n - 1) / df_res)) if df_res > 0 else 0.0

    # Strictly verify mathematical identities
    f_identity = (r2 / k) / ((1.0 - r2) / df_res)
    adj_r2_identity = 1.0 - ((1.0 - r2) * (n - 1) / df_res)
    if abs(f_stat - f_identity) > 1e-8:
        raise AssertionError(f"Identitas F gagal: f_stat={f_stat}, f_identity={f_identity}")
    if abs(adj_r2 - adj_r2_identity) > 1e-8:
        raise AssertionError(f"Identitas adj_R2 gagal: adj_r2={adj_r2}, identity={adj_r2_identity}")

    # Standardized Beta calculation (regression on z-scores: B * s_x / s_y)
    sy = float(y_series.std(ddof=1))
    std_betas = [0.0]  # Intercept has no standardized beta
    col_names = list(x_df.columns)
    for col in col_names:
        sx = float(x_df[col].std(ddof=1))
        b_idx = len(std_betas)
        std_beta_val = float(beta[b_idx] * (sx / sy)) if sy > 1e-12 else 0.0
        std_betas.append(std_beta_val)

    # Build regression table
    p_const = float(p_values[0])
    is_const_sig = bool(p_const < significance_level)
    regression_table: List[Dict[str, Any]] = [
        {
            "variable": "(Konstanta)",
            "b": float(beta[0]),
            "coefficient": float(beta[0]),
            "se": float(se_beta[0]),
            "stdError": float(se_beta[0]),
            "t": float(t_stats[0]),
            "tHitung": float(t_stats[0]),
            "tTabel": t_tabel,
            "p": p_const,
            "pValue": p_const,
            "pFormatted": format_p_value(p_const),
            "beta": 0.0,
            "significant": is_const_sig,
            "label": "Signifikan" if is_const_sig else "Tidak signifikan",
            "decision": None, # Constant is NOT a research hypothesis conclusion
            "note": "Konstanta tidak diuji sebagai hipotesis penelitian skripsi."
        }
    ]

    for i, col in enumerate(col_names):
        idx = i + 1
        p_val = float(p_values[idx])
        t_val = float(t_stats[idx])
        is_sig = bool(p_val < significance_level)
        hyp_decision = "H0 ditolak, hipotesis penelitian didukung" if is_sig else "H0 tidak ditolak"

        regression_table.append({
            "variable": col,
            "b": float(beta[idx]),
            "coefficient": float(beta[idx]),
            "se": float(se_beta[idx]),
            "stdError": float(se_beta[idx]),
            "t": t_val,
            "tHitung": t_val,
            "tTabel": t_tabel,
            "p": p_val,
            "pValue": p_val,
            "pFormatted": format_p_value(p_val),
            "beta": float(std_betas[idx]),
            "significant": is_sig,
            "label": "Signifikan" if is_sig else "Tidak signifikan",
            "decision": hyp_decision
        })

    model_type = "Regresi Linier Sederhana" if k == 1 else "Regresi Linier Berganda"

    # Effective Contribution (SE%) and Relative Contribution (SR%) only for k >= 2
    se_sr_table: List[Dict[str, Any]] = []
    if k >= 2 and r2 > 1e-12:
        for idx, col in enumerate(col_names):
            beta_i = std_betas[idx + 1]
            r_xy, _ = stats.pearsonr(x_df[col].values, y_mat)
            se_i = float(beta_i * r_xy * 100.0)
            sr_i = float((se_i / (r2 * 100.0)) * 100.0) if r2 > 0 else 0.0
            se_sr_table.append({
                "variable": col,
                "standardizedBeta": beta_i,
                "correlationY": float(r_xy),
                "sePercent": se_i,
                "srPercent": sr_i
            })

    f_decision = "H0 ditolak, hipotesis penelitian didukung" if f_pval < significance_level else "H0 tidak ditolak"
    f_test = {
        "modelType": model_type,
        "fHitung": f_stat,
        "fTabel": f_tabel,
        "df1": int(k),
        "df2": int(df_res),
        "pValue": f_pval,
        "pSimultan": f_pval,
        "pFormatted": format_p_value(f_pval),
        "significant": bool(f_pval < significance_level),
        "decision": f_decision,
        "fIdentityCheck": float(f_identity)
    }

    determination = {
        "modelType": model_type,
        "r": r_mult,
        "rSquare": r2,
        "adjustedRSquare": adj_r2,
        "stdError": se_estimate,
        "stdErrorEstimate": se_estimate,
        "adjR2IdentityCheck": float(adj_r2_identity),
        "seSrTable": se_sr_table if k >= 2 else None,
        "seSrNote": "Sumbangan Efektif (SE%) dan Sumbangan Relatif (SR%) hanya berlaku untuk model regresi linier berganda (k >= 2)." if k < 2 else None
    }

    anova_table = [
        {
            "source": "Regresi",
            "ss": ss_reg,
            "sumOfSquares": ss_reg,
            "df": int(k),
            "ms": ms_reg,
            "meanSquare": ms_reg,
            "f": f_stat,
            "fValue": f_stat,
            "p": f_pval,
            "pValue": f_pval,
        },
        {
            "source": "Residual",
            "ss": ss_res,
            "sumOfSquares": ss_res,
            "df": int(df_res),
            "ms": ms_res,
            "meanSquare": ms_res,
            "f": None,
            "fValue": 0.0,
            "p": None,
            "pValue": 0.0,
        },
        {
            "source": "Total",
            "ss": ss_tot,
            "sumOfSquares": ss_tot,
            "df": int(n - 1),
            "ms": None,
            "meanSquare": 0.0,
            "f": None,
            "fValue": 0.0,
            "p": None,
            "pValue": 0.0,
        },
    ]

    return regression_table, f_test, determination, anova_table, residuals, y_pred
