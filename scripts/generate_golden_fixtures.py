import json
import os
import numpy as np
import pandas as pd
from scipy import stats

def compute_golden(df, constructs, target_y="LO", x_vars=["KL", "KP"]):
    n = len(df)
    k_x = len(x_vars)
    df_res = n - k_x - 1

    # 1. Descriptive
    desc = {}
    for c_name in x_vars + [target_y]:
        s = df[c_name]
        desc[c_name] = {
            "n": int(len(s)),
            "mean": float(round(s.mean(), 6)),
            "median": float(round(s.median(), 6)),
            "stdDev": float(round(s.std(ddof=1), 6)),
            "min": float(round(s.min(), 6)),
            "max": float(round(s.max(), 6))
        }

    # 2. Validity
    validity = {}
    alpha_signif = 0.05
    t_crit = stats.t.ppf(1.0 - alpha_signif / 2.0, n - 2)
    r_tabel = float(round(t_crit / np.sqrt((n - 2) + t_crit**2), 6))

    for c in constructs:
        items = c["items"]
        c_name = c["name"]
        tot = df[items].sum(axis=1)
        for it in items:
            r_val, p_val = stats.pearsonr(df[it], tot)
            validity[it] = {
                "construct": c_name,
                "rHitung": float(round(r_val, 6)),
                "rTabel": r_tabel,
                "valid": bool(r_val > r_tabel)
            }

    # 3. Reliability (Cronbach's Alpha)
    reliability = {}
    for c in constructs:
        items = c["items"]
        k = len(items)
        m = df[items]
        item_vars = m.var(axis=0, ddof=1).sum()
        total_var = m.sum(axis=1).var(ddof=1)
        alpha = float((k / (k - 1)) * (1.0 - (item_vars / total_var)))
        reliability[c["name"]] = {
            "cronbachAlpha": float(round(alpha, 6)),
            "itemCount": k,
            "reliable": bool(alpha >= 0.60)
        }

    # 4. Regression LO ~ KL + KP
    X = np.column_stack([np.ones(n), df[x_vars].values])
    y = df[target_y].values
    xtx = X.T @ X
    xtx_inv = np.linalg.pinv(xtx)
    beta = xtx_inv @ X.T @ y
    pred = X @ beta
    res = y - pred

    y_mean = np.mean(y)
    ss_tot = float(np.sum((y - y_mean) ** 2))
    ss_res = float(np.sum(res ** 2))
    ss_reg = float(ss_tot - ss_res)
    ms_reg = ss_reg / k_x
    ms_res = ss_res / df_res
    f_stat = ms_reg / ms_res
    f_pval = float(1.0 - stats.f.cdf(f_stat, k_x, df_res))
    f_tabel = float(round(stats.f.ppf(1.0 - alpha_signif, k_x, df_res), 6))

    r2 = 1.0 - (ss_res / ss_tot)
    adj_r2 = 1.0 - ((1.0 - r2) * (n - 1) / df_res)

    cov_beta = ms_res * xtx_inv
    se_beta = np.sqrt(np.maximum(0.0, np.diag(cov_beta)))
    t_stats = beta / se_beta
    p_vals = 2.0 * (1.0 - stats.t.cdf(np.abs(t_stats), df_res))

    reg_table = [
        {
            "variable": "(Konstanta)",
            "coefficient": float(round(beta[0], 6)),
            "stdError": float(round(se_beta[0], 6)),
            "tHitung": float(round(t_stats[0], 6)),
            "pValue": float(round(p_vals[0], 6))
        }
    ]
    for idx, var in enumerate(x_vars):
        reg_table.append({
            "variable": var,
            "coefficient": float(round(beta[idx + 1], 6)),
            "stdError": float(round(se_beta[idx + 1], 6)),
            "tHitung": float(round(t_stats[idx + 1], 6)),
            "pValue": float(round(p_vals[idx + 1], 6))
        })

    # 5. Multicollinearity (VIF)
    vif_results = {}
    if len(x_vars) == 2:
        r_x1_x2, _ = stats.pearsonr(df[x_vars[0]], df[x_vars[1]])
        r2_x = r_x1_x2 ** 2
        vif_val = float(round(1.0 / (1.0 - r2_x), 6))
        tol_val = float(round(1.0 - r2_x, 6))
        for var in x_vars:
            vif_results[var] = {
                "tolerance": tol_val,
                "vif": vif_val,
                "problematic": bool(vif_val >= 10.0)
            }

    # 6. Heteroscedasticity (Glejser)
    abs_res = np.abs(res)
    beta_g = xtx_inv @ X.T @ abs_res
    pred_g = X @ beta_g
    res_g = abs_res - pred_g
    ss_res_g = float(np.sum(res_g ** 2))
    ms_res_g = ss_res_g / df_res
    cov_beta_g = ms_res_g * xtx_inv
    se_beta_g = np.sqrt(np.maximum(0.0, np.diag(cov_beta_g)))
    t_stats_g = beta_g / se_beta_g
    p_vals_g = 2.0 * (1.0 - stats.t.cdf(np.abs(t_stats_g), df_res))

    glejser_results = {}
    for idx, var in enumerate(x_vars):
        glejser_results[var] = {
            "tHitung": float(round(t_stats_g[idx + 1], 6)),
            "pValue": float(round(p_vals_g[idx + 1], 6)),
            "significant": bool(p_vals_g[idx + 1] < alpha_signif)
        }

    # 7. Correlation
    corr_results = []
    all_vars = x_vars + [target_y]
    for i in range(len(all_vars)):
        for j in range(i + 1, len(all_vars)):
            r, p = stats.pearsonr(df[all_vars[i]], df[all_vars[j]])
            corr_results.append({
                "var1": all_vars[i],
                "var2": all_vars[j],
                "coefficient": float(round(r, 6)),
                "pValue": float(round(p, 6))
            })

    return {
        "n": n,
        "descriptive": desc,
        "validity": validity,
        "reliability": reliability,
        "regression": reg_table,
        "fTest": {
            "fHitung": float(round(f_stat, 6)),
            "fTabel": f_tabel,
            "pValue": float(round(f_pval, 6)),
            "significant": bool(f_pval < alpha_signif)
        },
        "determination": {
            "rSquare": float(round(r2, 6)),
            "adjustedRSquare": float(round(adj_r2, 6)),
            "stdError": float(round(np.sqrt(ms_res), 6))
        },
        "multicollinearity": vif_results,
        "heteroscedasticity": glejser_results,
        "correlation": corr_results
    }

def main():
    os.makedirs("fixtures", exist_ok=True)
    golden = {}

    constructs = [
        {"name": "KL", "items": ["KL1", "KL2", "KL3"], "role": "independent"},
        {"name": "KP", "items": ["KP1", "KP2", "KP3"], "role": "independent"},
        {"name": "LO", "items": ["LO1", "LO2", "LO3"], "role": "dependent"},
    ]

    # --- 1. Fixture 30 (n = 30) ---
    np.random.seed(30)
    n30 = 30
    x1_base = np.random.normal(3.8, 0.5, n30)
    x2_base = np.random.normal(3.4, 0.6, n30)
    noise = np.random.normal(0, 0.35, n30)
    y_base = 1.2 + 0.45 * x1_base + 0.40 * x2_base + noise

    def to_likert(base, k, n):
        items = []
        for _ in range(k):
            vals = np.clip(np.round(base + np.random.normal(0, 0.45, n)), 1, 5).astype(int)
            items.append(vals)
        return items

    kl_items30 = to_likert(x1_base, 3, n30)
    kp_items30 = to_likert(x2_base, 3, n30)
    lo_items30 = to_likert(y_base, 3, n30)

    df30 = pd.DataFrame({
        "No": np.arange(1, n30 + 1),
        "KL1": kl_items30[0], "KL2": kl_items30[1], "KL3": kl_items30[2],
        "KP1": kp_items30[0], "KP2": kp_items30[1], "KP3": kp_items30[2],
        "LO1": lo_items30[0], "LO2": lo_items30[1], "LO3": lo_items30[2],
    })
    df30.to_csv("fixtures/dataset_30.csv", index=False)

    df30_calc = df30.copy()
    df30_calc["KL"] = df30_calc[["KL1", "KL2", "KL3"]].mean(axis=1)
    df30_calc["KP"] = df30_calc[["KP1", "KP2", "KP3"]].mean(axis=1)
    df30_calc["LO"] = df30_calc[["LO1", "LO2", "LO3"]].mean(axis=1)
    golden["dataset_30"] = compute_golden(df30_calc, constructs)

    # --- 2. Fixture 120 (n = 120) ---
    np.random.seed(120)
    n120 = 120
    x1_base120 = np.random.normal(3.7, 0.55, n120)
    x2_base120 = np.random.normal(3.5, 0.65, n120)
    noise120 = np.random.normal(0, 0.38, n120)
    y_base120 = 1.0 + 0.40 * x1_base120 + 0.45 * x2_base120 + noise120

    kl_items120 = to_likert(x1_base120, 3, n120)
    kp_items120 = to_likert(x2_base120, 3, n120)
    lo_items120 = to_likert(y_base120, 3, n120)

    df120 = pd.DataFrame({
        "No": np.arange(1, n120 + 1),
        "KL1": kl_items120[0], "KL2": kl_items120[1], "KL3": kl_items120[2],
        "KP1": kp_items120[0], "KP2": kp_items120[1], "KP3": kp_items120[2],
        "LO1": lo_items120[0], "LO2": lo_items120[1], "LO3": lo_items120[2],
    })
    df120.to_csv("fixtures/dataset_120.csv", index=False)

    df120_calc = df120.copy()
    df120_calc["KL"] = df120_calc[["KL1", "KL2", "KL3"]].mean(axis=1)
    df120_calc["KP"] = df120_calc[["KP1", "KP2", "KP3"]].mean(axis=1)
    df120_calc["LO"] = df120_calc[["LO1", "LO2", "LO3"]].mean(axis=1)
    golden["dataset_120"] = compute_golden(df120_calc, constructs)

    # --- 3. Fixture Indonesian Text & Semicolon (n = 40) ---
    np.random.seed(40)
    n40 = 40
    x1_b40 = np.random.normal(3.6, 0.5, n40)
    x2_b40 = np.random.normal(3.3, 0.6, n40)
    noise40 = np.random.normal(0, 0.35, n40)
    y_b40 = 1.1 + 0.38 * x1_b40 + 0.42 * x2_b40 + noise40

    kl40 = to_likert(x1_b40, 3, n40)
    kp40 = to_likert(x2_b40, 3, n40)
    lo40 = to_likert(y_b40, 3, n40)

    likert_text_map = {
        1: "Sangat Tidak Setuju",
        2: "Tidak Setuju",
        3: "Netral",
        4: "Setuju",
        5: "Sangat Setuju"
    }

    df40_numeric = pd.DataFrame({
        "No": np.arange(1, n40 + 1),
        "KL1": kl40[0], "KL2": kl40[1], "KL3": kl40[2],
        "KP1": kp40[0], "KP2": kp40[1], "KP3": kp40[2],
        "LO1": lo40[0], "LO2": lo40[1], "LO3": lo40[2],
    })

    # Golden calculation on numeric data
    df40_calc = df40_numeric.copy()
    df40_calc["KL"] = df40_calc[["KL1", "KL2", "KL3"]].mean(axis=1)
    df40_calc["KP"] = df40_calc[["KP1", "KP2", "KP3"]].mean(axis=1)
    df40_calc["LO"] = df40_calc[["LO1", "LO2", "LO3"]].mean(axis=1)
    golden["dataset_text_comma"] = compute_golden(df40_calc, constructs)

    # Save as CSV with text labels, semicolon delimiter, and Indonesian decimal comma for demo
    df40_text = df40_numeric.copy()
    for col in ["KL1", "KL2", "KL3", "KP1", "KP2", "KP3", "LO1", "LO2", "LO3"]:
        df40_text[col] = df40_text[col].map(likert_text_map)

    # Add a demographic column and a decimal comma column to test parsing
    df40_text["Usia"] = np.random.choice([20, 21, 22, 23], n40)
    df40_text["IPK"] = [f"{round(x, 2)}".replace(".", ",") for x in np.random.uniform(3.0, 3.9, n40)]

    df40_text.to_csv("fixtures/dataset_text_comma.csv", sep=";", index=False)

    with open("fixtures/golden_references.json", "w") as f:
        json.dump(golden, f, indent=2)

    print("[OK] 3 Golden Fixtures and reference JSON created successfully!")

if __name__ == "__main__":
    main()
