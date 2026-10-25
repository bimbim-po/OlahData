import math
from typing import Dict, List, Any, Optional
import numpy as np
import pandas as pd
from scipy import stats


def solve_ols(y: np.ndarray, x_mat: np.ndarray, var_names: List[str]) -> Dict[str, Any]:
    """
    Fits multivariable OLS regression: y = beta_0 + beta_1*X_1 + ... + beta_k*X_k + e.
    Returns unstandardized B, SE, t, p, standardized beta, R^2, adj R^2, F, p_F, residuals.
    """
    n = len(y)
    k = len(var_names)
    df_res = n - k - 1
    df_reg = k

    if n <= k + 1 or df_res <= 0:
        raise ValueError(f"Sampel tidak cukup (N={n}, k={k}). Butuh minimal {k + 2} responden.")

    mean_y = float(np.mean(y))
    sd_y = float(np.std(y, ddof=1)) if n > 1 else 1e-9

    mean_x = [float(np.mean(x_mat[:, j])) for j in range(k)]
    sd_x = [float(np.std(x_mat[:, j], ddof=1)) if n > 1 else 1e-9 for j in range(k)]

    # Susun matriks desain dengan kolom intercept 1
    full_x = np.column_stack([np.ones(n), x_mat])
    xt = full_x.T
    xtx = xt @ full_x

    # Inversi dengan regularisasi ridge minimal jika singular
    try:
        xtx_inv = np.linalg.inv(xtx)
    except np.linalg.LinAlgError:
        xtx_inv = np.linalg.inv(xtx + np.eye(xtx.shape[0]) * 1e-6)

    beta = xtx_inv @ (xt @ y)

    # Prediksi & Residual
    y_pred = full_x @ beta
    residuals = y - y_pred

    ss_tot = float(np.sum((y - mean_y) ** 2))
    ss_res = float(np.sum(residuals ** 2))
    ss_reg = max(0.0, ss_tot - ss_res)

    r_square = max(0.0, min(1.0, 1.0 - (ss_res / ss_tot))) if ss_tot > 0 else 0.0
    adj_r_square = 1.0 - (1.0 - r_square) * ((n - 1) / df_res) if df_res > 0 else r_square

    ms_res = ss_res / df_res if df_res > 0 else 0.0
    ms_reg = ss_reg / df_reg if df_reg > 0 else 0.0
    f_stat = ms_reg / ms_res if ms_res > 1e-12 else 0.0
    f_p_val = float(1.0 - stats.f.cdf(f_stat, df_reg, df_res)) if df_reg > 0 and df_res > 0 else 1.0

    const_se = math.sqrt(max(0.0, ms_res * xtx_inv[0, 0]))
    const_t = beta[0] / const_se if const_se > 1e-12 else 0.0
    const_p = float(2.0 * (1.0 - stats.t.cdf(abs(const_t), df_res)))

    coeffs = []
    for j in range(k):
        b_val = float(beta[j + 1])
        se_val = math.sqrt(max(0.0, ms_res * xtx_inv[j + 1, j + 1]))
        t_val = b_val / se_val if se_val > 1e-12 else 0.0
        p_val = float(2.0 * (1.0 - stats.t.cdf(abs(t_val), df_res)))
        beta_std = b_val * (sd_x[j] / sd_y) if sd_y > 1e-12 else 0.0

        coeffs.append({
            "name": var_names[j],
            "b": round(b_val, 4),
            "se": round(se_val, 4),
            "beta": round(beta_std, 4),
            "t": round(t_val, 4),
            "pValue": round(p_val, 4),
            "significant": bool(p_val < 0.05),
        })

    return {
        "n": n,
        "k": k,
        "dfRes": df_res,
        "dfReg": df_reg,
        "rSquare": round(r_square, 4),
        "adjustedRSquare": round(adj_r_square, 4),
        "fStatistic": round(f_stat, 4),
        "fPValue": round(f_p_val, 4),
        "constant": {
            "b": round(float(beta[0]), 4),
            "se": round(const_se, 4),
            "t": round(const_t, 4),
            "pValue": round(const_p, 4),
        },
        "coefficients": coeffs,
        "residualError": round(math.sqrt(max(0.0, 1.0 - r_square)), 4),
        "residuals": residuals,
        "fittedValues": y_pred,
    }


def compute_path_analysis_and_sobel(
    construct_scores_df: pd.DataFrame,
    constructs: List[Dict[str, Any]],
    alpha: float = 0.05
) -> Dict[str, Any]:
    """
    Computes Path Analysis & Sobel Test for mediation models (X -> Z -> Y).
    """
    indep_names = [c["code"] for c in constructs if c.get("role") == "independent" and c["code"] in construct_scores_df.columns]
    med_names = [c["code"] for c in constructs if c.get("role") == "mediator" and c["code"] in construct_scores_df.columns]
    dep_names = [c["code"] for c in constructs if c.get("role") == "dependent" and c["code"] in construct_scores_df.columns]

    if not indep_names or not med_names or not dep_names:
        return {"hasMediation": False, "mediatorCount": 0, "submodels": [], "sobelResults": [], "effectTable": []}

    target_dep = dep_names[0]
    n = len(construct_scores_df)

    submodels = []
    sobel_results = []
    effect_table = []

    for m_idx, med_name in enumerate(med_names):
        # Sub-struktur 1: X -> Z
        y_sub1 = construct_scores_df[med_name].values.astype(float)
        x_sub1_mat = construct_scores_df[indep_names].values.astype(float)
        fit_sub1 = solve_ols(y_sub1, x_sub1_mat, indep_names)

        submodels.append({
            "equationName": f"Sub-struktur 1.{m_idx + 1}: Pengaruh {', '.join(indep_names)} terhadap {med_name}",
            "submodelIndex": 1,
            "dependentVar": med_name,
            "independentVars": indep_names,
            "constant": fit_sub1["constant"],
            "coefficients": fit_sub1["coefficients"],
            "rSquare": fit_sub1["rSquare"],
            "adjustedRSquare": fit_sub1["adjustedRSquare"],
            "fStatistic": fit_sub1["fStatistic"],
            "fPValue": fit_sub1["fPValue"],
            "residualError": fit_sub1["residualError"],
        })

        # Sub-struktur 2: X, Z -> Y
        y_sub2 = construct_scores_df[target_dep].values.astype(float)
        sub2_preds = indep_names + [med_name]
        x_sub2_mat = construct_scores_df[sub2_preds].values.astype(float)
        fit_sub2 = solve_ols(y_sub2, x_sub2_mat, sub2_preds)

        submodels.append({
            "equationName": f"Sub-struktur 2.{m_idx + 1}: Pengaruh {', '.join(sub2_preds)} terhadap {target_dep}",
            "submodelIndex": 2,
            "dependentVar": target_dep,
            "independentVars": sub2_preds,
            "constant": fit_sub2["constant"],
            "coefficients": fit_sub2["coefficients"],
            "rSquare": fit_sub2["rSquare"],
            "adjustedRSquare": fit_sub2["adjustedRSquare"],
            "fStatistic": fit_sub2["fStatistic"],
            "fPValue": fit_sub2["fPValue"],
            "residualError": fit_sub2["residualError"],
        })

        # Koefisien b (Z -> Y pada Submodel 2)
        coeff_b_entry = next((c for c in fit_sub2["coefficients"] if c["name"] == med_name), None)
        b = coeff_b_entry["b"] if coeff_b_entry else 0.0
        s_b = coeff_b_entry["se"] if coeff_b_entry else 1e-9
        beta_b = coeff_b_entry["beta"] if coeff_b_entry else 0.0
        p_b = coeff_b_entry["pValue"] if coeff_b_entry else 1.0

        for x_name in indep_names:
            coeff_a_entry = next((c for c in fit_sub1["coefficients"] if c["name"] == x_name), None)
            a = coeff_a_entry["b"] if coeff_a_entry else 0.0
            s_a = coeff_a_entry["se"] if coeff_a_entry else 1e-9
            beta_a = coeff_a_entry["beta"] if coeff_a_entry else 0.0
            p_a = coeff_a_entry["pValue"] if coeff_a_entry else 1.0

            coeff_c_entry = next((c for c in fit_sub2["coefficients"] if c["name"] == x_name), None)
            c_prime = coeff_c_entry["b"] if coeff_c_entry else 0.0
            s_c_prime = coeff_c_entry["se"] if coeff_c_entry else 1e-9
            beta_c_prime = coeff_c_entry["beta"] if coeff_c_entry else 0.0
            p_c_prime = coeff_c_entry["pValue"] if coeff_c_entry else 1.0

            direct_effect = beta_c_prime
            indirect_effect = beta_a * beta_b
            total_effect = direct_effect + indirect_effect

            # Uji Sobel: z = (a*b) / sqrt(b^2*s_a^2 + a^2*s_b^2)
            var_indirect = (b * b) * (s_a * s_a) + (a * a) * (s_b * s_b)
            sobel_se = math.sqrt(max(1e-12, var_indirect))
            sobel_z = (a * b) / sobel_se
            sobel_p_val = float(2.0 * (1.0 - stats.norm.cdf(abs(sobel_z))))
            is_sobel_sig = bool(sobel_p_val < alpha)

            if is_sobel_sig:
                if p_c_prime < alpha:
                    med_type = "Partial Mediation"
                    conclusion = f"Variabel {med_name} terbukti sebagai Mediasi Parsial (Partial Mediation) antara {x_name} dan {target_dep}."
                else:
                    med_type = "Full Mediation"
                    conclusion = f"Variabel {med_name} terbukti sebagai Mediasi Penuh (Full Mediation) antara {x_name} dan {target_dep}."
            else:
                med_type = "No Mediation"
                conclusion = f"Variabel {med_name} tidak terbukti memediasi secara signifikan hubungan {x_name} ke {target_dep} (Z={round(sobel_z, 3)}, p={round(sobel_p_val, 4)})."

            sobel_item = {
                "independentVar": x_name,
                "mediatorVar": med_name,
                "dependentVar": target_dep,
                "pathA": {"b": a, "se": s_a, "beta": beta_a, "pValue": p_a, "significant": bool(p_a < alpha)},
                "pathB": {"b": b, "se": s_b, "beta": beta_b, "pValue": p_b, "significant": bool(p_b < alpha)},
                "pathCPrime": {"b": c_prime, "se": s_c_prime, "beta": beta_c_prime, "pValue": p_c_prime, "significant": bool(p_c_prime < alpha)},
                "directEffect": round(direct_effect, 4),
                "indirectEffect": round(indirect_effect, 4),
                "totalEffect": round(total_effect, 4),
                "unstandardizedIndirectEffect": round(a * b, 4),
                "unstandardizedTotalEffect": round(c_prime + (a * b), 4),
                "sobelSE": round(sobel_se, 4),
                "sobelZ": round(sobel_z, 4),
                "sobelPValue": round(sobel_p_val, 4),
                "significant": is_sobel_sig,
                "mediationType": med_type,
                "conclusion": conclusion,
            }
            sobel_results.append(sobel_item)

            effect_table.append({
                "pathDescription": f"{x_name} → {med_name} → {target_dep}",
                "independentVar": x_name,
                "mediatorVar": med_name,
                "dependentVar": target_dep,
                "directEffect": round(direct_effect, 4),
                "indirectEffect": round(indirect_effect, 4),
                "totalEffect": round(total_effect, 4),
                "sobelZ": round(sobel_z, 4),
                "sobelP": round(sobel_p_val, 4),
                "mediationType": med_type,
                "conclusion": conclusion,
            })

    return {
        "hasMediation": True,
        "mediatorCount": len(med_names),
        "submodels": submodels,
        "sobelResults": sobel_results,
        "effectTable": effect_table,
    }


def compute_moderated_regression(
    construct_scores_df: pd.DataFrame,
    constructs: List[Dict[str, Any]],
    alpha: float = 0.05
) -> Dict[str, Any]:
    """
    Computes Moderated Regression Analysis (MRA) 2-step hierarchy.
    """
    indep_names = [c["code"] for c in constructs if c.get("role") == "independent" and c["code"] in construct_scores_df.columns]
    mod_names = [c["code"] for c in constructs if c.get("role") == "moderator" and c["code"] in construct_scores_df.columns]
    dep_names = [c["code"] for c in constructs if c.get("role") == "dependent" and c["code"] in construct_scores_df.columns]

    if not indep_names or not mod_names or not dep_names:
        return {"hasModeration": False, "moderatorCount": 0, "results": []}

    target_dep = dep_names[0]
    n = len(construct_scores_df)
    results = []

    for x_name in indep_names:
        for z_name in mod_names:
            interaction_name = f"{x_name} × {z_name}"
            x_vals = construct_scores_df[x_name].values.astype(float)
            z_vals = construct_scores_df[z_name].values.astype(float)
            y_vals = construct_scores_df[target_dep].values.astype(float)
            inter_vals = x_vals * z_vals

            # Model 1: Y ~ X + Z
            x_mat_m1 = np.column_stack([x_vals, z_vals])
            fit_m1 = solve_ols(y_vals, x_mat_m1, [x_name, z_name])

            # Model 2: Y ~ X + Z + (X*Z)
            x_mat_m2 = np.column_stack([x_vals, z_vals, inter_vals])
            fit_m2 = solve_ols(y_vals, x_mat_m2, [x_name, z_name, interaction_name])

            r2_change = max(0.0, fit_m2["rSquare"] - fit_m1["rSquare"])
            df_res2 = fit_m2["dfRes"]
            f_change = (r2_change / 1.0) / ((1.0 - fit_m2["rSquare"]) / df_res2) if df_res2 > 0 and fit_m2["rSquare"] < 1.0 else 0.0
            f_change_p = float(1.0 - stats.f.cdf(f_change, 1, df_res2)) if df_res2 > 0 else 1.0

            coeff_inter = next(c for c in fit_m2["coefficients"] if c["name"] == interaction_name)
            coeff_z = next(c for c in fit_m2["coefficients"] if c["name"] == z_name)

            inter_sig = bool(coeff_inter["pValue"] < alpha)
            z_sig = bool(coeff_z["pValue"] < alpha)

            if not z_sig and inter_sig:
                mod_type = "Pure Moderator"
                conclusion = f"Variabel {z_name} terbukti sebagai Pure Moderator (Moderasi Murni) antara {x_name} dan {target_dep}."
            elif z_sig and inter_sig:
                mod_type = "Quasi Moderator"
                conclusion = f"Variabel {z_name} terbukti sebagai Quasi Moderator (Moderasi Semu) antara {x_name} dan {target_dep}."
            elif z_sig and not inter_sig:
                mod_type = "Predictor Moderator"
                conclusion = f"Variabel {z_name} hanya bertindak sebagai Prediktor biasa dan tidak terbukti memoderasi {x_name}."
            else:
                mod_type = "Homologiser (Bukan Moderasi)"
                conclusion = f"Variabel {z_name} bertindak sebagai Homologiser (Bukan Moderasi)."

            direction = "Memperkuat" if (inter_sig and coeff_inter["b"] >= 0) else ("Memperlemah" if inter_sig else "Tidak Berpengaruh")

            results.append({
                "independentVar": x_name,
                "moderatorVar": z_name,
                "dependentVar": target_dep,
                "interactionTermName": interaction_name,
                "model1": fit_m1,
                "model2": fit_m2,
                "rSquareChange": round(r2_change, 4),
                "fChange": round(f_change, 4),
                "fChangePValue": round(f_change_p, 4),
                "interactionB": coeff_inter["b"],
                "interactionSE": coeff_inter["se"],
                "interactionBeta": coeff_inter["beta"],
                "interactionT": coeff_inter["t"],
                "interactionPValue": coeff_inter["pValue"],
                "interactionSignificant": inter_sig,
                "mainModeratorSignificant": z_sig,
                "moderatorType": mod_type,
                "moderationDirection": direction,
                "conclusion": conclusion,
            })

    return {
        "hasModeration": True,
        "moderatorCount": len(mod_names),
        "results": results,
    }
