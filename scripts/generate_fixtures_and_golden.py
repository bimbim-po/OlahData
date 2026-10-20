import os
import json
import numpy as np
import pandas as pd
from scipy import stats
import statsmodels.api as sm
from statsmodels.stats.diagnostic import lilliefors, het_breuschpagan
from statsmodels.stats.stattools import durbin_watson
from statsmodels.stats.multicomp import pairwise_tukeyhsd
import pingouin as pg

def calculate_r_table(df: int, alpha: float = 0.05) -> float:
    t_crit = stats.t.ppf(1.0 - alpha / 2.0, df)
    return float(t_crit / np.sqrt(df + t_crit**2))

def main():
    os.makedirs("fixtures", exist_ok=True)
    np.random.seed(42)

    n = 100
    alpha_level = 0.05

    # ---------------------------------------------------------
    # 1. Generate Clean Dataset: fixture_bersih.csv
    # ---------------------------------------------------------
    # Underlying latent variables for marketing thesis:
    # X1: Kualitas Layanan (KL)
    # X2: Kepuasan Pelanggan (KP)
    # Y:  Loyalitas Pelanggan (LP)

    kl_latent = np.random.normal(3.8, 0.55, n)
    kp_latent = 0.5 * kl_latent + np.random.normal(1.8, 0.45, n)
    lp_latent = 0.8 + 0.45 * kl_latent + 0.40 * kp_latent + np.random.normal(0, 0.35, n)

    def generate_items(latent, count, noise_sd=0.45):
        items = []
        for _ in range(count):
            raw = latent + np.random.normal(0, noise_sd, len(latent))
            likert = np.clip(np.round(raw), 1, 5).astype(int)
            items.append(likert)
        return items

    kl_items = generate_items(kl_latent, 4, noise_sd=0.40)
    # KL5 is deliberately weak / noise: uncorrelated with latent KL
    kl5_weak = np.random.choice([1, 2, 3, 4, 5], size=n, p=[0.2, 0.2, 0.2, 0.2, 0.2])

    kp_items = generate_items(kp_latent, 5, noise_sd=0.42)

    lp_items_pos = generate_items(lp_latent, 4, noise_sd=0.40)
    # LP5 is negative item: 6 - LP_intended
    lp5_intended = np.clip(np.round(lp_latent + np.random.normal(0, 0.40, n)), 1, 5).astype(int)
    lp5_negative_raw = (6 - lp5_intended).astype(int)

    # Demographics for difference tests and categorical analysis
    jenis_kelamin = np.array(["Laki-laki" if i < 50 else "Perempuan" for i in range(n)])
    pendidikan = np.random.choice(["D3", "S1", "S2"], size=n, p=[0.25, 0.55, 0.20])
    pengeluaran = np.random.choice(["Rendah", "Tinggi"], size=n, p=[0.45, 0.55])

    df_bersih = pd.DataFrame({
        "No": np.arange(1, n + 1),
        "Jenis_Kelamin": jenis_kelamin,
        "Pendidikan": pendidikan,
        "Kategori_Pengeluaran": pengeluaran,
        "KL1": kl_items[0],
        "KL2": kl_items[1],
        "KL3": kl_items[2],
        "KL4": kl_items[3],
        "KL5": kl5_weak, # Weak item
        "KP1": kp_items[0],
        "KP2": kp_items[1],
        "KP3": kp_items[2],
        "KP4": kp_items[3],
        "KP5": kp_items[4],
        "LP1": lp_items_pos[0],
        "LP2": lp_items_pos[1],
        "LP3": lp_items_pos[2],
        "LP4": lp_items_pos[3],
        "LP5": lp5_negative_raw, # Negative item
    })

    df_bersih.to_csv("fixtures/fixture_bersih.csv", index=False)
    print(f"[OK] fixture_bersih.csv saved (N={n})")

    # ---------------------------------------------------------
    # 2. Compute Ground Truth Acuan: hasil_acuan_bersih.json
    # ---------------------------------------------------------
    df_calc = df_bersih.copy()

    # Step A: Reverse scoring for negative item LP5: 6 - LP5
    df_calc["LP5_reversed"] = 6 - df_calc["LP5"]
    df_calc["LP5_raw"] = df_calc["LP5"]
    df_calc["LP5"] = df_calc["LP5_reversed"]

    constructs_spec = [
        {"name": "Kualitas Layanan", "code": "KL", "items": ["KL1", "KL2", "KL3", "KL4", "KL5"], "role": "independent"},
        {"name": "Kepuasan Pelanggan", "code": "KP", "items": ["KP1", "KP2", "KP3", "KP4", "KP5"], "role": "independent"},
        {"name": "Loyalitas Pelanggan", "code": "LP", "items": ["LP1", "LP2", "LP3", "LP4", "LP5"], "role": "dependent"},
    ]

    r_tabel_val = calculate_r_table(n - 2, alpha_level)

    # Validity: Corrected item-total correlation
    validity_results = {}
    valid_items_map = {}

    for c in constructs_spec:
        c_code = c["code"]
        items = c["items"]
        valid_items_map[c_code] = []
        tot = df_calc[items].sum(axis=1)

        for it in items:
            other_sum = tot - df_calc[it]
            r_val, p_val = stats.pearsonr(df_calc[it], other_sum)
            is_valid = bool(r_val > r_tabel_val and p_val < alpha_level)
            if is_valid:
                valid_items_map[c_code].append(it)

            validity_results[it] = {
                "construct": c["name"],
                "code": c_code,
                "rHitung": float(r_val),
                "rTabel": float(r_tabel_val),
                "pValue": float(p_val),
                "df": n - 2,
                "valid": is_valid
            }

    print(f"KL5 is valid: {validity_results['KL5']['valid']} (rHitung={validity_results['KL5']['rHitung']:.4f}, rTabel={r_tabel_val:.4f})")

    # Reliability: Cronbach's Alpha (Initial and Final without invalid items)
    reliability_results = {}
    for c in constructs_spec:
        c_code = c["code"]
        items = c["items"]

        # Initial with all items
        k_init = len(items)
        mat_init = df_calc[items]
        item_vars_init = mat_init.var(axis=0, ddof=1).sum()
        tot_var_init = mat_init.sum(axis=1).var(ddof=1)
        alpha_init = float((k_init / (k_init - 1)) * (1.0 - (item_vars_init / tot_var_init)))

        # Compare with pingouin
        pg_alpha_init = float(pg.cronbach_alpha(data=mat_init)[0])
        assert abs(alpha_init - pg_alpha_init) < 1e-6, f"Alpha mismatch for {c_code}"

        # Alpha if item deleted and corrected item-total correlation
        items_analysis = []
        tot_c = mat_init.sum(axis=1)
        for it in items:
            sub = [x for x in items if x != it]
            mat_sub = df_calc[sub]
            k_sub = len(sub)
            v_sub = mat_sub.var(axis=0, ddof=1).sum()
            t_sub = mat_sub.sum(axis=1).var(ddof=1)
            a_del = float((k_sub / (k_sub - 1)) * (1.0 - (v_sub / t_sub)))
            r_it, p_it = stats.pearsonr(df_calc[it], tot_c - df_calc[it])
            items_analysis.append({
                "item": it,
                "alphaIfDeleted": float(a_del),
                "correctedItemTotalCorrelation": float(r_it),
                "pValue": float(p_it)
            })

        # Final alpha after dropping invalid items (KL5 dropped from KL)
        valid_sub = valid_items_map[c_code]
        if len(valid_sub) >= 2:
            mat_final = df_calc[valid_sub]
            k_fin = len(valid_sub)
            v_fin = mat_final.var(axis=0, ddof=1).sum()
            t_fin = mat_final.sum(axis=1).var(ddof=1)
            alpha_final = float((k_fin / (k_fin - 1)) * (1.0 - (v_fin / t_fin)))
        else:
            alpha_final = alpha_init

        reliability_results[c_code] = {
            "construct": c["name"],
            "initialItemCount": k_init,
            "initialAlpha": alpha_init,
            "finalItemCount": len(valid_sub),
            "finalAlpha": alpha_final,
            "reliable": bool(alpha_final >= 0.70),
            "itemsAnalysis": items_analysis
        }

    # Descriptive Statistics on construct scores (mean of valid items)
    desc_results = {}
    for c in constructs_spec:
        c_code = c["code"]
        v_items = valid_items_map[c_code]
        # Rule: construct score is mean of items
        score_series = df_calc[v_items].mean(axis=1)
        df_calc[c_code] = score_series

        mean_val = float(score_series.mean())
        # Interval (5-1)/5 = 0.8:
        # 1.00-1.80: Sangat Rendah
        # 1.81-2.60: Rendah
        # 2.61-3.40: Sedang
        # 3.41-4.20: Tinggi
        # 4.21-5.00: Sangat Tinggi
        if mean_val <= 1.80:
            kat = "Sangat Rendah"
        elif mean_val <= 2.60:
            kat = "Rendah"
        elif mean_val <= 3.40:
            kat = "Sedang"
        elif mean_val <= 4.20:
            kat = "Tinggi"
        else:
            kat = "Sangat Tinggi"

        desc_results[c_code] = {
            "construct": c["name"],
            "n": int(len(score_series)),
            "mean": float(mean_val),
            "median": float(score_series.median()),
            "stdDev": float(score_series.std(ddof=1)),
            "min": float(score_series.min()),
            "max": float(score_series.max()),
            "kategori": kat
        }

    # Regression OLS: LP ~ KL + KP
    x_vars = ["KL", "KP"]
    target_y = "LP"
    k_x = len(x_vars)
    df_res = n - k_x - 1

    X = np.column_stack([np.ones(n), df_calc[x_vars].values])
    y = df_calc[target_y].values

    xtx = X.T @ X
    xtx_inv = np.linalg.pinv(xtx)
    beta = xtx_inv @ X.T @ y
    pred = X @ beta
    residuals = y - pred

    y_mean = np.mean(y)
    ss_tot = float(np.sum((y - y_mean) ** 2))
    ss_res = float(np.sum(residuals ** 2))
    ss_reg = float(ss_tot - ss_res)

    ms_reg = ss_reg / k_x
    ms_res = ss_res / df_res
    f_stat = ms_reg / ms_res
    f_pval = float(1.0 - stats.f.cdf(f_stat, k_x, df_res))
    f_tabel = float(stats.f.ppf(1.0 - alpha_level, k_x, df_res))

    r2 = 1.0 - (ss_res / ss_tot)
    adj_r2 = 1.0 - ((1.0 - r2) * (n - 1) / df_res)
    se_estimate = float(np.sqrt(ms_res))

    # Strict mathematical identity verification
    f_identity = (r2 / k_x) / ((1.0 - r2) / df_res)
    assert abs(f_stat - f_identity) < 1e-10, "F statistic identity check failed!"

    cov_beta = ms_res * xtx_inv
    se_beta = np.sqrt(np.maximum(0.0, np.diag(cov_beta)))
    t_stats = beta / se_beta
    p_vals = 2.0 * (1.0 - stats.t.cdf(np.abs(t_stats), df_res))
    t_tabel = float(stats.t.ppf(1.0 - alpha_level / 2.0, df_res))

    # Standardized beta (regression of z-scores without intercept)
    sy = y.std(ddof=1)
    std_betas = [0.0] # constant has no beta
    for i, var in enumerate(x_vars):
        sx = df_calc[var].std(ddof=1)
        std_beta = float(beta[i + 1] * (sx / sy))
        std_betas.append(std_beta)

    reg_table = [
        {
            "variable": "(Konstanta)",
            "b": float(beta[0]),
            "se": float(se_beta[0]),
            "t": float(t_stats[0]),
            "p": float(p_vals[0]),
            "beta": 0.0,
            "significant": bool(p_vals[0] < alpha_level),
            "label": "Signifikan" if p_vals[0] < alpha_level else "Tidak signifikan"
        }
    ]
    for i, var in enumerate(x_vars):
        p_v = float(p_vals[i + 1])
        t_v = float(t_stats[i + 1])
        reg_table.append({
            "variable": var,
            "b": float(beta[i + 1]),
            "se": float(se_beta[i + 1]),
            "t": t_v,
            "p": p_v,
            "beta": float(std_betas[i + 1]),
            "significant": bool(p_v < alpha_level),
            "label": "Signifikan" if p_v < alpha_level else "Tidak signifikan",
            "decision": "H0 ditolak, hipotesis penelitian didukung" if p_v < alpha_level else "H0 tidak ditolak"
        })

    # ANOVA table
    anova_table = [
        {"source": "Regresi", "ss": ss_reg, "df": k_x, "ms": ms_reg, "f": f_stat, "p": f_pval},
        {"source": "Residual", "ss": ss_res, "df": df_res, "ms": ms_res, "f": None, "p": None},
        {"source": "Total", "ss": ss_tot, "df": n - 1, "ms": None, "f": None, "p": None}
    ]

    # Classical Assumptions on OLS Residuals
    # 1. Normality: Lilliefors and Shapiro-Wilk
    lilliefors_stat, lilliefors_p = lilliefors(residuals)
    shapiro_stat, shapiro_p = stats.shapiro(residuals)

    # 2. Multicollinearity: Tolerance and VIF
    vif_res = {}
    r_x1_x2, _ = stats.pearsonr(df_calc[x_vars[0]], df_calc[x_vars[1]])
    r2_x = r_x1_x2 ** 2
    tol = 1.0 - r2_x
    vif_val = 1.0 / tol
    for var in x_vars:
        vif_res[var] = {
            "tolerance": float(tol),
            "vif": float(vif_val),
            "problematic": bool(vif_val >= 10.0 or tol <= 0.10)
        }

    # 3. Heteroscedasticity: Glejser and Breusch-Pagan
    abs_res = np.abs(residuals)
    beta_g = xtx_inv @ X.T @ abs_res
    pred_g = X @ beta_g
    res_g = abs_res - pred_g
    ss_res_g = float(np.sum(res_g ** 2))
    ms_res_g = ss_res_g / df_res
    cov_beta_g = ms_res_g * xtx_inv
    se_beta_g = np.sqrt(np.maximum(0.0, np.diag(cov_beta_g)))
    t_stats_g = beta_g / se_beta_g
    p_vals_g = 2.0 * (1.0 - stats.t.cdf(np.abs(t_stats_g), df_res))

    glejser_res = {}
    for i, var in enumerate(x_vars):
        glejser_res[var] = {
            "tHitung": float(t_stats_g[i + 1]),
            "pValue": float(p_vals_g[i + 1]),
            "heteroscedastic": bool(p_vals_g[i + 1] < alpha_level)
        }

    bp_lm, bp_p, _, _ = het_breuschpagan(residuals, X)

    # 4. Autocorrelation: Durbin-Watson
    dw_val = float(durbin_watson(residuals))

    # Correlation Matrix (Pearson & Spearman)
    all_constructs = ["KL", "KP", "LP"]
    corr_pearson = {}
    corr_spearman = {}
    for v1 in all_constructs:
        corr_pearson[v1] = {}
        corr_spearman[v1] = {}
        for v2 in all_constructs:
            rp, pp = stats.pearsonr(df_calc[v1], df_calc[v2])
            rs, ps = stats.spearmanr(df_calc[v1], df_calc[v2])
            corr_pearson[v1][v2] = {"r": float(rp), "p": float(pp), "n": n}
            corr_spearman[v1][v2] = {"rho": float(rs), "p": float(ps), "n": n}

    # Difference Tests (Uji Beda)
    # 2 Groups: Jenis_Kelamin on LP
    g_m = df_calc[df_calc["Jenis_Kelamin"] == "Laki-laki"]["LP"].values
    g_f = df_calc[df_calc["Jenis_Kelamin"] == "Perempuan"]["LP"].values
    lev_stat_2, lev_p_2 = stats.levene(g_m, g_f, center="median")
    ttest_equal_stat, ttest_equal_p = stats.ttest_ind(g_m, g_f, equal_var=True)
    ttest_welch_stat, ttest_welch_p = stats.ttest_ind(g_m, g_f, equal_var=False)
    mwu_stat, mwu_p = stats.mannwhitneyu(g_m, g_f, alternative="two-sided")

    # Cohen's d with pooled SD
    n1, n2 = len(g_m), len(g_f)
    s1, s2 = g_m.std(ddof=1), g_f.std(ddof=1)
    s_pooled = np.sqrt(((n1 - 1) * s1**2 + (n2 - 1) * s2**2) / (n1 + n2 - 2))
    cohens_d = float((g_m.mean() - g_f.mean()) / s_pooled)

    diff_2_group = {
        "groupVar": "Jenis_Kelamin",
        "valueVar": "LP",
        "levene": {"stat": float(lev_stat_2), "p": float(lev_p_2), "equalVariance": bool(lev_p_2 >= alpha_level)},
        "independentTTest": {"t": float(ttest_equal_stat), "p": float(ttest_equal_p)},
        "welchTTest": {"t": float(ttest_welch_stat), "p": float(ttest_welch_p)},
        "mannWhitney": {"u": float(mwu_stat), "p": float(mwu_p)},
        "cohensD": cohens_d
    }

    # 3+ Groups: Pendidikan on LP
    groups_pend = [df_calc[df_calc["Pendidikan"] == grp]["LP"].values for grp in ["D3", "S1", "S2"]]
    lev_stat_3, lev_p_3 = stats.levene(*groups_pend, center="median")
    anova_f, anova_p = stats.f_oneway(*groups_pend)
    kw_stat, kw_p = stats.kruskal(*groups_pend)

    tukey = pairwise_tukeyhsd(endog=df_calc["LP"], groups=df_calc["Pendidikan"], alpha=alpha_level)
    tukey_results = []
    for row in tukey.summary().data[1:]:
        tukey_results.append({
            "group1": str(row[0]),
            "group2": str(row[1]),
            "meanDiff": float(row[2]),
            "pAdj": float(row[3]),
            "lower": float(row[4]),
            "upper": float(row[5]),
            "reject": bool(row[6])
        })

    diff_3_group = {
        "groupVar": "Pendidikan",
        "valueVar": "LP",
        "levene": {"stat": float(lev_stat_3), "p": float(lev_p_3)},
        "oneWayAnova": {"f": float(anova_f), "p": float(anova_p), "significant": bool(anova_p < alpha_level)},
        "kruskalWallis": {"h": float(kw_stat), "p": float(kw_p)},
        "tukeyHsd": tukey_results
    }

    # Chi-Square: Jenis_Kelamin vs Kategori_Pengeluaran (2x2)
    ct = pd.crosstab(df_calc["Jenis_Kelamin"], df_calc["Kategori_Pengeluaran"])
    chi2_stat, chi2_p, chi2_df, expected_freq = stats.chi2_contingency(ct, correction=False)
    chi2_yates_stat, chi2_yates_p, _, _ = stats.chi2_contingency(ct, correction=True)
    odds_ratio, fisher_p = stats.fisher_exact(ct)

    chi_square_results = {
        "rowVar": "Jenis_Kelamin",
        "colVar": "Kategori_Pengeluaran",
        "observed": ct.to_dict(),
        "expected": expected_freq.tolist(),
        "chiSquare": float(chi2_stat),
        "df": int(chi2_df),
        "pValue": float(chi2_p),
        "yatesChiSquare": float(chi2_yates_stat),
        "yatesPValue": float(chi2_yates_p),
        "oddsRatio": float(odds_ratio),
        "fisherPValue": float(fisher_p),
        "minExpected": float(np.min(expected_freq)),
        "cellsLessThan5Percent": float(np.mean(expected_freq < 5.0) * 100.0)
    }

    # Build Complete Reference JSON
    golden_bersih = {
        "n": n,
        "significanceLevel": alpha_level,
        "validitas": validity_results,
        "reliabilitas": reliability_results,
        "descriptive": desc_results,
        "regresi_berganda": {
            "r": float(np.sqrt(r2)),
            "rSquare": float(r2),
            "adjustedRSquare": float(adj_r2),
            "stdErrorEstimate": se_estimate,
            "fHitung": float(f_stat),
            "fTabel": f_tabel,
            "pSimultan": float(f_pval),
            "tTabel": t_tabel,
            "coefficients": reg_table,
            "anova": anova_table,
            "fIdentityCheck": float(f_identity),
            "adjR2IdentityCheck": float(adj_r2)
        },
        "asumsi_klasik": {
            "normalitas": {
                "lilliefors": {"statistic": float(lilliefors_stat), "pValue": float(lilliefors_p), "normal": bool(lilliefors_p >= alpha_level)},
                "shapiroWilk": {"statistic": float(shapiro_stat), "pValue": float(shapiro_p), "normal": bool(shapiro_p >= alpha_level)}
            },
            "multikolinearitas": vif_res,
            "heteroskedastisitas": {
                "glejser": glejser_res,
                "breuschPagan": {"statistic": float(bp_lm), "pValue": float(bp_p), "homoscedastic": bool(bp_p >= alpha_level)}
            },
            "autokorelasi": {
                "durbinWatson": dw_val,
                "enabledByDefault": False,
                "note": "Uji Durbin-Watson diperuntukkan bagi data time-series, dinonaktifkan secara default untuk data cross-sectional survei."
            }
        },
        "korelasi": {
            "pearson": corr_pearson,
            "spearman": corr_spearman
        },
        "uji_beda": {
            "duaKelompok": diff_2_group,
            "tigaKelompokPlus": diff_3_group,
            "chiSquare": chi_square_results
        }
    }

    with open("fixtures/hasil_acuan_bersih.json", "w") as f:
        json.dump(golden_bersih, f, indent=2)
    print("[OK] fixtures/hasil_acuan_bersih.json generated successfully!")

    # ---------------------------------------------------------
    # 3. Generate Dirty Dataset: fixture_kotor.csv & masalah_diharapkan_kotor.json
    # ---------------------------------------------------------
    np.random.seed(101)
    n_extra = 20
    extra_kl_lat = np.random.normal(3.8, 0.55, n_extra)
    extra_kp_lat = 0.5 * extra_kl_lat + np.random.normal(1.8, 0.45, n_extra)
    extra_lp_lat = 0.8 + 0.45 * extra_kl_lat + 0.40 * extra_kp_lat + np.random.normal(0, 0.35, n_extra)

    extra_kl = generate_items(extra_kl_lat, 4, noise_sd=0.40)
    extra_kl5 = np.random.choice([1, 2, 3, 4, 5], size=n_extra)
    extra_kp = generate_items(extra_kp_lat, 5, noise_sd=0.42)
    extra_lp = generate_items(extra_lp_lat, 4, noise_sd=0.40)
    extra_lp5_raw = (6 - np.clip(np.round(extra_lp_lat + np.random.normal(0, 0.40, n_extra)), 1, 5)).astype(int)

    df_extra = pd.DataFrame({
        "No": np.arange(101, 121),
        "Jenis_Kelamin": ["Laki-laki" if i < 10 else "Perempuan" for i in range(n_extra)],
        "Pendidikan": np.random.choice(["D3", "S1", "S2"], size=n_extra),
        "Kategori_Pengeluaran": np.random.choice(["Rendah", "Tinggi"], size=n_extra),
        "KL1": extra_kl[0], "KL2": extra_kl[1], "KL3": extra_kl[2], "KL4": extra_kl[3], "KL5": extra_kl5,
        "KP1": extra_kp[0], "KP2": extra_kp[1], "KP3": extra_kp[2], "KP4": extra_kp[3], "KP5": extra_kp[4],
        "LP1": extra_lp[0], "LP2": extra_lp[1], "LP3": extra_lp[2], "LP4": extra_lp[3], "LP5": extra_lp5_raw,
    })
    df_kotor = pd.concat([df_bersih.copy(), df_extra], ignore_index=True)
    df_kotor["No"] = np.arange(1, 121)

    # 1-indexed line tracking
    expected_issues = []

    # Issue 1: Missing cell at row 7, col KL2
    df_kotor.loc[6, "KL2"] = np.nan
    expected_issues.append({
        "type": "missing_cell",
        "row": 7,
        "column": "KL2",
        "description": "Sel kosong (missing value) pada butir KL2",
        "action": "Eksklusi responden atau input ulang data mentah"
    })

    # Issue 2: Out of scale value (7) at row 15, col KP3
    df_kotor.loc[14, "KP3"] = 7
    expected_issues.append({
        "type": "out_of_scale",
        "row": 15,
        "column": "KP3",
        "value": 7,
        "description": "Nilai 7 di luar rentang skala Likert (1 - 5)",
        "action": "Koreksi ke skala 1-5 atau eksklusi baris"
    })

    # Issue 3: Out of scale value (0) at row 24, col LP1
    df_kotor.loc[23, "LP1"] = 0
    expected_issues.append({
        "type": "out_of_scale",
        "row": 24,
        "column": "LP1",
        "value": 0,
        "description": "Nilai 0 di luar rentang skala Likert (1 - 5)",
        "action": "Koreksi ke skala 1-5 atau eksklusi baris"
    })

    # Issue 4: Duplicate rows at row 33 and 34
    for c in ["KL1", "KL2", "KL3", "KL4", "KL5", "KP1", "KP2", "KP3", "KP4", "KP5", "LP1", "LP2", "LP3", "LP4", "LP5"]:
        df_kotor.loc[33, c] = df_kotor.loc[32, c]
    expected_issues.append({
        "type": "duplicate_row",
        "row": 34,
        "duplicateOfRow": 33,
        "description": "Baris duplikat identik dengan responden baris 33",
        "action": "Eksklusi responden duplikat"
    })

    # Issue 5: Straight-lining at row 42 (all answers = 5)
    for c in ["KL1", "KL2", "KL3", "KL4", "KL5", "KP1", "KP2", "KP3", "KP4", "KP5", "LP1", "LP2", "LP3", "LP4", "LP5"]:
        df_kotor.loc[41, c] = 5
    expected_issues.append({
        "type": "straight_lining",
        "row": 42,
        "value": 5,
        "description": "Pola jawaban seragam konstan (seluruh butir dijawab 5)",
        "action": "Eksklusi responden unengaged"
    })

    # Issue 6: Straight-lining at row 55 (all answers = 1)
    for c in ["KL1", "KL2", "KL3", "KL4", "KL5", "KP1", "KP2", "KP3", "KP4", "KP5", "LP1", "LP2", "LP3", "LP4", "LP5"]:
        df_kotor.loc[54, c] = 1
    expected_issues.append({
        "type": "straight_lining",
        "row": 55,
        "value": 1,
        "description": "Pola jawaban seragam konstan (seluruh butir dijawab 1)",
        "action": "Eksklusi responden unengaged"
    })

    # Issue 7: Univariate outlier at row 68: inject extreme variance in items
    for c in ["KP1", "KP2", "KP3", "KP4", "KP5"]:
        df_kotor.loc[67, c] = 1
    expected_issues.append({
        "type": "univariate_outlier",
        "row": 68,
        "column": "KP",
        "description": "Pencilan univariat (|z| > 3 pada konstruk KP)",
        "action": "Eksklusi responden pencilan"
    })

    # Text Likert items for respondents 10-14 on KL3
    text_likert_entries = [
        {"row": 10, "column": "KL3", "rawText": "Sangat Setuju", "mappedValue": 5},
        {"row": 11, "column": "KL3", "rawText": "Setuju", "mappedValue": 4},
        {"row": 12, "column": "KL3", "rawText": "Netral", "mappedValue": 3},
        {"row": 13, "column": "KL3", "rawText": "Tidak Setuju", "mappedValue": 2},
        {"row": 14, "column": "KL3", "rawText": "Sangat Tidak Setuju", "mappedValue": 1},
    ]

    df_csv_kotor = df_kotor.copy()
    df_csv_kotor["KL3"] = df_csv_kotor["KL3"].astype(object)
    for entry in text_likert_entries:
        df_csv_kotor.loc[entry["row"] - 1, entry["column"]] = entry["rawText"]

    # Write fixture_kotor.csv with:
    # 1. Two title lines
    # 2. Semicolon delimiter (;)
    # 3. Two trailing blank rows
    title_line_1 = "Kuesioner Penelitian: Pengaruh Kualitas Layanan dan Kepuasan terhadap Loyalitas Pelanggan"
    title_line_2 = "Data Mentah Responden Kuesioner (N=120)"
    csv_body = df_csv_kotor.to_csv(sep=";", index=False)
    
    with open("fixtures/fixture_kotor.csv", "w", encoding="utf-8", newline="\n") as f:
        f.write(title_line_1 + "\n")
        f.write(title_line_2 + "\n")
        f.write(csv_body)
        f.write("\n\n") # Two trailing empty rows

    n_kotor = len(df_kotor)
    print(f"[OK] fixture_kotor.csv saved with 2 title rows, semicolon delimiter, 5 text Likert, and 2 trailing empty rows (N={n_kotor})")

    masalah_kotor = {
        "dataset": "fixture_kotor.csv",
        "delimiter": ";",
        "headerRow": 3,
        "titleRowsSkipped": 2,
        "trailingEmptyRows": 2,
        "textLikertCount": len(text_likert_entries),
        "textLikertDetails": text_likert_entries,
        "totalRows": n_kotor,
        "expectedIssuesCount": len(expected_issues),
        "sampleSizeWarnings": {
            "nParametricThreshold": 30,
            "nRegressionThreshold": 20, # 10 * 2 predictors
            "currentN": n_kotor,
            "warning": False
        },
        "issues": expected_issues
    }

    with open("fixtures/masalah_diharapkan_kotor.json", "w", encoding="utf-8") as f:
        json.dump(masalah_kotor, f, indent=2)
    print("[OK] fixtures/masalah_diharapkan_kotor.json generated successfully!")

if __name__ == "__main__":
    main()
