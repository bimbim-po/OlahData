import os
import json
import ast
import inspect
import pytest
import pandas as pd
import numpy as np
from scipy import stats

import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from engine.validity import compute_validity, calculate_r_table
from engine.reliability import compute_reliability
from engine.descriptive import compute_descriptive, compute_construct_scores, categorize_likert_score
from engine.regression import compute_regression
from engine.assumptions import (
    compute_normality,
    compute_multicollinearity,
    compute_heteroscedasticity,
    compute_autocorrelation
)
from engine.correlation import compute_correlation
from engine.comparative import compute_two_group_difference, compute_three_plus_group_difference
from engine.categorical import compute_chi_square
from engine.pipeline import run_statistical_analysis
from validation import scan_dataset_quality, check_sample_size, create_derived_dataset
from guard import NumberGuard, NumberGuardViolationError

FIXTURES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "fixtures"))

@pytest.fixture(scope="module")
def golden_bersih_data():
    csv_path = os.path.join(FIXTURES_DIR, "fixture_bersih.csv")
    json_path = os.path.join(FIXTURES_DIR, "hasil_acuan_bersih.json")
    assert os.path.exists(csv_path), f"fixture_bersih.csv not found at {csv_path}"
    assert os.path.exists(json_path), f"hasil_acuan_bersih.json not found at {json_path}"

    df = pd.read_csv(csv_path)
    with open(json_path, "r", encoding="utf-8") as f:
        acuan = json.load(f)
    return df, acuan

@pytest.fixture(scope="module")
def golden_kotor_data():
    csv_path = os.path.join(FIXTURES_DIR, "fixture_kotor.csv")
    json_path = os.path.join(FIXTURES_DIR, "masalah_diharapkan_kotor.json")
    assert os.path.exists(csv_path), f"fixture_kotor.csv not found at {csv_path}"
    assert os.path.exists(json_path), f"masalah_diharapkan_kotor.json not found at {json_path}"

    with open(json_path, "r", encoding="utf-8") as f:
        masalah = json.load(f)

    # Read CSV skipping title rows and using semicolon
    sep = masalah.get("delimiter", ";")
    skip = masalah.get("titleRowsSkipped", 2)
    df = pd.read_csv(csv_path, sep=sep, skiprows=skip)
    df = df.dropna(how="all").reset_index(drop=True)

    # Map text Likert entries
    likert_text_map = {
        "sangat setuju": 5, "setuju": 4, "netral": 3, "ragu-ragu": 3,
        "kurang setuju": 2, "tidak setuju": 2, "sangat tidak setuju": 1,
        "ss": 5, "s": 4, "n": 3, "ts": 2, "sts": 1
    }
    for col in df.columns:
        if df[col].dtype == object:
            def conv(val):
                if pd.isna(val): return np.nan
                s = str(val).strip().lower()
                if s in likert_text_map: return likert_text_map[s]
                try: return float(val)
                except: return val
            mapped = df[col].map(conv)
            if pd.api.types.is_numeric_dtype(mapped):
                df[col] = mapped

    return df, masalah


# ==============================================================================
# TEST SUITE 1: NUMERICAL ACCURACY AGAINST GOLDEN CANONICAL REFERENCE
# Tolerance: 1e-6 (Lilliefors p: 1e-3)
# ==============================================================================

def test_golden_validity_accuracy(golden_bersih_data):
    df, acuan = golden_bersih_data
    constructs = [
        {"name": "Kualitas Layanan", "code": "KL", "items": ["KL1", "KL2", "KL3", "KL4", "KL5"]},
        {"name": "Kepuasan Pelanggan", "code": "KP", "items": ["KP1", "KP2", "KP3", "KP4", "KP5"]},
        {"name": "Loyalitas Pelanggan", "code": "LP", "items": ["LP1", "LP2", "LP3", "LP4", "LP5"]},
    ]

    # Pre-reverse negative item LP5: 6 - x
    res = compute_validity(
        df,
        constructs=constructs,
        significance_level=0.05,
        use_corrected=True,
        negative_items=["LP5"],
        scale_min=1,
        scale_max=5
    )

    res_map = {r["item"]: r for r in res}
    acuan_val = acuan["validitas"]

    for item_code, ref_val in acuan_val.items():
        computed = res_map[item_code]
        assert abs(computed["rHitung"] - ref_val["rHitung"]) < 1e-6, f"rHitung mismatch on {item_code}: {computed['rHitung']} vs {ref_val['rHitung']}"
        assert abs(computed["rTabel"] - ref_val["rTabel"]) < 1e-6, f"rTabel mismatch on {item_code}: {computed['rTabel']} vs {ref_val['rTabel']}"
        assert abs(computed["pValue"] - ref_val["pValue"]) < 1e-6, f"pValue mismatch on {item_code}: {computed['pValue']} vs {ref_val['pValue']}"
        assert computed["df"] == ref_val["df"], f"df mismatch on {item_code}"
        assert computed["valid"] == ref_val["valid"], f"validity decision mismatch on {item_code}"

    # Strict check: KL5 must be detected as invalid / weak
    assert res_map["KL5"]["valid"] is False, "KL5 must be detected as invalid (rHitung <= rTabel)"
    assert res_map["LP5"]["valid"] is True, "LP5 (reversed) must be valid"


def test_golden_reliability_accuracy(golden_bersih_data):
    df, acuan = golden_bersih_data
    constructs = [
        {"name": "Kualitas Layanan", "code": "KL", "items": ["KL1", "KL2", "KL3", "KL4", "KL5"]},
        {"name": "Kepuasan Pelanggan", "code": "KP", "items": ["KP1", "KP2", "KP3", "KP4", "KP5"]},
        {"name": "Loyalitas Pelanggan", "code": "LP", "items": ["LP1", "LP2", "LP3", "LP4", "LP5"]},
    ]
    valid_map = {
        "KL": ["KL1", "KL2", "KL3", "KL4"], # KL5 dropped
        "KP": ["KP1", "KP2", "KP3", "KP4", "KP5"],
        "LP": ["LP1", "LP2", "LP3", "LP4", "LP5"],
    }

    res = compute_reliability(
        df,
        constructs=constructs,
        alpha_threshold=0.70,
        valid_items_map=valid_map,
        negative_items=["LP5"],
        scale_min=1,
        scale_max=5
    )

    res_map = {r["code"]: r for r in res}
    acuan_rel = acuan["reliabilitas"]

    for c_code, ref_rel in acuan_rel.items():
        comp = res_map[c_code]
        assert abs(comp["initialAlpha"] - ref_rel["initialAlpha"]) < 1e-6, f"Initial alpha mismatch on {c_code}"
        assert abs(comp["finalAlpha"] - ref_rel["finalAlpha"]) < 1e-6, f"Final alpha mismatch on {c_code}"
        assert comp["initialItemCount"] == ref_rel["initialItemCount"]
        assert comp["finalItemCount"] == ref_rel["finalItemCount"]
        assert comp["reliable"] == ref_rel["reliable"]

        # Item analysis comparison
        comp_items_map = {it["item"]: it for it in comp["itemsAnalysis"]}
        for ref_it in ref_rel["itemsAnalysis"]:
            it_name = ref_it["item"]
            comp_it = comp_items_map[it_name]
            assert abs(comp_it["alphaIfDeleted"] - ref_it["alphaIfDeleted"]) < 1e-6, f"Alpha if deleted mismatch on {it_name}"
            assert abs(comp_it["correctedItemTotalCorrelation"] - ref_it["correctedItemTotalCorrelation"]) < 1e-6, f"Corrected item-total mismatch on {it_name}"
            assert abs(comp_it["pValue"] - ref_it["pValue"]) < 1e-6, f"Item pValue mismatch on {it_name}"


def test_golden_descriptive_accuracy(golden_bersih_data):
    df, acuan = golden_bersih_data
    constructs = [
        {"name": "Kualitas Layanan", "code": "KL", "items": ["KL1", "KL2", "KL3", "KL4", "KL5"]},
        {"name": "Kepuasan Pelanggan", "code": "KP", "items": ["KP1", "KP2", "KP3", "KP4", "KP5"]},
        {"name": "Loyalitas Pelanggan", "code": "LP", "items": ["LP1", "LP2", "LP3", "LP4", "LP5"]},
    ]
    valid_map = {
        "KL": ["KL1", "KL2", "KL3", "KL4"],
        "KP": ["KP1", "KP2", "KP3", "KP4", "KP5"],
        "LP": ["LP1", "LP2", "LP3", "LP4", "LP5"],
    }

    construct_df, _ = compute_construct_scores(
        df,
        constructs=constructs,
        valid_items_only=valid_map,
        negative_items=["LP5"],
        scale_min=1,
        scale_max=5
    )

    desc_res = compute_descriptive(construct_df, variables=["KL", "KP", "LP"])
    desc_map = {d["variable"]: d for d in desc_res}
    acuan_desc = acuan["descriptive"]

    for c_code, ref_d in acuan_desc.items():
        comp = desc_map[c_code]
        assert comp["n"] == ref_d["n"]
        assert abs(comp["mean"] - ref_d["mean"]) < 1e-6, f"Mean mismatch on {c_code}"
        assert abs(comp["median"] - ref_d["median"]) < 1e-6, f"Median mismatch on {c_code}"
        assert abs(comp["stdDev"] - ref_d["stdDev"]) < 1e-6, f"StdDev mismatch on {c_code}"
        assert abs(comp["min"] - ref_d["min"]) < 1e-6, f"Min mismatch on {c_code}"
        assert abs(comp["max"] - ref_d["max"]) < 1e-6, f"Max mismatch on {c_code}"
        assert comp["kategori"] == ref_d["kategori"], f"Kategori mismatch on {c_code}: {comp['kategori']} vs {ref_d['kategori']}"


def test_golden_regression_accuracy(golden_bersih_data):
    df, acuan = golden_bersih_data
    constructs = [
        {"name": "Kualitas Layanan", "code": "KL", "items": ["KL1", "KL2", "KL3", "KL4", "KL5"]},
        {"name": "Kepuasan Pelanggan", "code": "KP", "items": ["KP1", "KP2", "KP3", "KP4", "KP5"]},
        {"name": "Loyalitas Pelanggan", "code": "LP", "items": ["LP1", "LP2", "LP3", "LP4", "LP5"]},
    ]
    valid_map = {
        "KL": ["KL1", "KL2", "KL3", "KL4"],
        "KP": ["KP1", "KP2", "KP3", "KP4", "KP5"],
        "LP": ["LP1", "LP2", "LP3", "LP4", "LP5"],
    }

    c_df, _ = compute_construct_scores(
        df,
        constructs=constructs,
        valid_items_only=valid_map,
        negative_items=["LP5"],
        scale_min=1,
        scale_max=5
    )

    reg_table, f_res, det_res, anova_table, residuals, y_pred = compute_regression(
        y_series=c_df["LP"],
        x_df=c_df[["KL", "KP"]],
        significance_level=0.05
    )

    ref_reg = acuan["regresi_berganda"]

    # Model Summary
    assert abs(det_res["r"] - ref_reg["r"]) < 1e-6
    assert abs(det_res["rSquare"] - ref_reg["rSquare"]) < 1e-6
    assert abs(det_res["adjustedRSquare"] - ref_reg["adjustedRSquare"]) < 1e-6
    assert abs(det_res["stdErrorEstimate"] - ref_reg["stdErrorEstimate"]) < 1e-6

    # F test
    assert abs(f_res["fHitung"] - ref_reg["fHitung"]) < 1e-6
    assert abs(f_res["fTabel"] - ref_reg["fTabel"]) < 1e-6
    assert abs(f_res["pSimultan"] - ref_reg["pSimultan"]) < 1e-6

    # Coefficients
    comp_coefs = {r["variable"]: r for r in reg_table}
    for ref_c in ref_reg["coefficients"]:
        var_name = ref_c["variable"]
        comp_c = comp_coefs[var_name]
        assert abs(comp_c["b"] - ref_c["b"]) < 1e-6, f"B mismatch on {var_name}"
        assert abs(comp_c["se"] - ref_c["se"]) < 1e-6, f"SE mismatch on {var_name}"
        assert abs(comp_c["t"] - ref_c["t"]) < 1e-6, f"t mismatch on {var_name}"
        assert abs(comp_c["p"] - ref_c["p"]) < 1e-6, f"p mismatch on {var_name}"
        assert abs(comp_c["beta"] - ref_c["beta"]) < 1e-6, f"Beta mismatch on {var_name}"
        assert comp_c["significant"] == ref_c["significant"]
        assert comp_c["label"] == ref_c["label"]
        if var_name != "(Konstanta)":
            assert comp_c["decision"] == ref_c["decision"]
        else:
            assert comp_c["decision"] is None # Constant not in hypothesis conclusion

    # ANOVA table
    comp_anova = {r["source"]: r for r in anova_table}
    for ref_a in ref_reg["anova"]:
        src = ref_a["source"]
        c_a = comp_anova[src]
        assert abs(c_a["ss"] - ref_a["ss"]) < 1e-6
        assert c_a["df"] == ref_a["df"]
        if ref_a["ms"] is not None:
            assert abs(c_a["ms"] - ref_a["ms"]) < 1e-6


def test_golden_assumptions_accuracy(golden_bersih_data):
    df, acuan = golden_bersih_data
    constructs = [
        {"name": "Kualitas Layanan", "code": "KL", "items": ["KL1", "KL2", "KL3", "KL4", "KL5"]},
        {"name": "Kepuasan Pelanggan", "code": "KP", "items": ["KP1", "KP2", "KP3", "KP4", "KP5"]},
        {"name": "Loyalitas Pelanggan", "code": "LP", "items": ["LP1", "LP2", "LP3", "LP4", "LP5"]},
    ]
    valid_map = {
        "KL": ["KL1", "KL2", "KL3", "KL4"],
        "KP": ["KP1", "KP2", "KP3", "KP4", "KP5"],
        "LP": ["LP1", "LP2", "LP3", "LP4", "LP5"],
    }
    c_df, _ = compute_construct_scores(df, constructs, valid_items_only=valid_map, negative_items=["LP5"])

    _, _, _, _, residuals, y_pred = compute_regression(
        y_series=c_df["LP"],
        x_df=c_df[["KL", "KP"]],
        significance_level=0.05
    )

    ref_asumsi = acuan["asumsi_klasik"]

    # 1. Normality (Lilliefors & Shapiro-Wilk)
    norm_res = compute_normality(residuals, alpha=0.05)
    ref_norm = ref_asumsi["normalitas"]
    assert abs(norm_res["lilliefors"]["statistic"] - ref_norm["lilliefors"]["statistic"]) < 1e-6
    assert abs(norm_res["lilliefors"]["pValue"] - ref_norm["lilliefors"]["pValue"]) < 1e-3
    assert abs(norm_res["shapiroWilk"]["statistic"] - ref_norm["shapiroWilk"]["statistic"]) < 1e-6
    assert abs(norm_res["shapiroWilk"]["pValue"] - ref_norm["shapiroWilk"]["pValue"]) < 1e-6

    # 2. Multicollinearity (Tolerance & VIF)
    vif_res = compute_multicollinearity(c_df[["KL", "KP"]])
    ref_vif = ref_asumsi["multikolinearitas"]
    for var in ["KL", "KP"]:
        assert abs(vif_res["variables"][var]["tolerance"] - ref_vif[var]["tolerance"]) < 1e-6
        assert abs(vif_res["variables"][var]["vif"] - ref_vif[var]["vif"]) < 1e-6

    # 3. Heteroscedasticity (Glejser & Breusch-Pagan)
    het_res = compute_heteroscedasticity(residuals, c_df[["KL", "KP"]], y_pred=y_pred, alpha=0.05)
    ref_het = ref_asumsi["heteroskedastisitas"]
    for var in ["KL", "KP"]:
        assert abs(het_res["glejser"][var]["tHitung"] - ref_het["glejser"][var]["tHitung"]) < 1e-6
        assert abs(het_res["glejser"][var]["pValue"] - ref_het["glejser"][var]["pValue"]) < 1e-6
    assert abs(het_res["breuschPagan"]["statistic"] - ref_het["breuschPagan"]["statistic"]) < 1e-6
    assert abs(het_res["breuschPagan"]["pValue"] - ref_het["breuschPagan"]["pValue"]) < 1e-6

    # 4. Autocorrelation (Durbin-Watson disabled by default for survey)
    dw_res = compute_autocorrelation(residuals, enabled=False)
    ref_dw = ref_asumsi["autokorelasi"]
    assert abs(dw_res["durbinWatson"] - ref_dw["durbinWatson"]) < 1e-6
    assert dw_res["enabledByDefault"] is False


def test_golden_correlation_accuracy(golden_bersih_data):
    df, acuan = golden_bersih_data
    constructs = [
        {"name": "Kualitas Layanan", "code": "KL", "items": ["KL1", "KL2", "KL3", "KL4", "KL5"]},
        {"name": "Kepuasan Pelanggan", "code": "KP", "items": ["KP1", "KP2", "KP3", "KP4", "KP5"]},
        {"name": "Loyalitas Pelanggan", "code": "LP", "items": ["LP1", "LP2", "LP3", "LP4", "LP5"]},
    ]
    valid_map = {
        "KL": ["KL1", "KL2", "KL3", "KL4"],
        "KP": ["KP1", "KP2", "KP3", "KP4", "KP5"],
        "LP": ["LP1", "LP2", "LP3", "LP4", "LP5"],
    }
    c_df, _ = compute_construct_scores(df, constructs, valid_items_only=valid_map, negative_items=["LP5"])

    corr_res = compute_correlation(c_df, variables=["KL", "KP", "LP"])
    ref_corr = acuan["korelasi"]

    for v1 in ["KL", "KP", "LP"]:
        for v2 in ["KL", "KP", "LP"]:
            ref_p = ref_corr["pearson"][v1][v2]
            comp_p = corr_res["pearson"][v1][v2]
            assert abs(comp_p["r"] - ref_p["r"]) < 1e-6
            assert abs(comp_p["p"] - ref_p["p"]) < 1e-6

            ref_s = ref_corr["spearman"][v1][v2]
            comp_s = corr_res["spearman"][v1][v2]
            assert abs(comp_s["rho"] - ref_s["rho"]) < 1e-6
            assert abs(comp_s["p"] - ref_s["p"]) < 1e-6


def test_golden_comparative_and_categorical_accuracy(golden_bersih_data):
    df, acuan = golden_bersih_data
    constructs = [
        {"name": "Loyalitas Pelanggan", "code": "LP", "items": ["LP1", "LP2", "LP3", "LP4", "LP5"]},
    ]
    c_df, _ = compute_construct_scores(df, constructs, negative_items=["LP5"])
    df["LP"] = c_df["LP"]

    ref_beda = acuan["uji_beda"]

    # 1. Dua Kelompok: Jenis_Kelamin on LP
    diff2 = compute_two_group_difference(df, "Jenis_Kelamin", "LP", significance_level=0.05)
    ref_diff2 = ref_beda["duaKelompok"]
    assert abs(diff2["levene"]["stat"] - ref_diff2["levene"]["stat"]) < 1e-6
    assert abs(diff2["levene"]["p"] - ref_diff2["levene"]["p"]) < 1e-6
    assert abs(diff2["independentTTest"]["t"] - ref_diff2["independentTTest"]["t"]) < 1e-6
    assert abs(diff2["independentTTest"]["p"] - ref_diff2["independentTTest"]["p"]) < 1e-6
    assert abs(diff2["welchTTest"]["t"] - ref_diff2["welchTTest"]["t"]) < 1e-6
    assert abs(diff2["welchTTest"]["p"] - ref_diff2["welchTTest"]["p"]) < 1e-6
    assert abs(diff2["mannWhitney"]["u"] - ref_diff2["mannWhitney"]["u"]) < 1e-6
    assert abs(diff2["mannWhitney"]["p"] - ref_diff2["mannWhitney"]["p"]) < 1e-6
    assert abs(diff2["cohensD"] - ref_diff2["cohensD"]) < 1e-6

    # 2. Tiga Kelompok+: Pendidikan on LP
    diff3 = compute_three_plus_group_difference(df, "Pendidikan", "LP", significance_level=0.05)
    ref_diff3 = ref_beda["tigaKelompokPlus"]
    assert abs(diff3["levene"]["stat"] - ref_diff3["levene"]["stat"]) < 1e-6
    assert abs(diff3["levene"]["p"] - ref_diff3["levene"]["p"]) < 1e-6
    assert abs(diff3["oneWayAnova"]["f"] - ref_diff3["oneWayAnova"]["f"]) < 1e-6
    assert abs(diff3["oneWayAnova"]["p"] - ref_diff3["oneWayAnova"]["p"]) < 1e-6
    assert abs(diff3["kruskalWallis"]["h"] - ref_diff3["kruskalWallis"]["h"]) < 1e-6
    assert abs(diff3["kruskalWallis"]["p"] - ref_diff3["kruskalWallis"]["p"]) < 1e-6
    assert len(diff3["tukeyHsd"]) == len(ref_diff3["tukeyHsd"])
    for comp_t, ref_t in zip(diff3["tukeyHsd"], ref_diff3["tukeyHsd"]):
        assert comp_t["group1"] == ref_t["group1"]
        assert comp_t["group2"] == ref_t["group2"]
        assert abs(comp_t["meanDiff"] - ref_t["meanDiff"]) < 1e-6
        assert abs(comp_t["pAdj"] - ref_t["pAdj"]) < 1e-6

    # 3. Chi-Square & Fisher (Jenis_Kelamin vs Kategori_Pengeluaran)
    chi_res = compute_chi_square(df, "Jenis_Kelamin", "Kategori_Pengeluaran")
    ref_chi = ref_beda["chiSquare"]
    assert abs(chi_res["chiSquare"] - ref_chi["chiSquare"]) < 1e-6
    assert abs(chi_res["pValue"] - ref_chi["pValue"]) < 1e-6
    assert chi_res["df"] == ref_chi["df"]
    assert abs(chi_res["yatesChiSquare"] - ref_chi["yatesChiSquare"]) < 1e-6
    assert abs(chi_res["yatesPValue"] - ref_chi["yatesPValue"]) < 1e-6
    assert abs(chi_res["oddsRatio"] - ref_chi["oddsRatio"]) < 1e-6
    assert abs(chi_res["fisherPValue"] - ref_chi["fisherPValue"]) < 1e-6
    assert abs(chi_res["minExpected"] - ref_chi["minExpected"]) < 1e-6
    assert abs(chi_res["cellsLessThan5Percent"] - ref_chi["cellsLessThan5Percent"]) < 1e-6


# ==============================================================================
# TEST SUITE 2: MATHEMATICAL ALGEBRAIC IDENTITIES ON ARBITRARY DATA
# ==============================================================================

@pytest.mark.parametrize("seed, n_sample, k_pred", [
    (11, 80, 2),
    (42, 150, 3),
    (123, 200, 4),
    (777, 50, 1),
])
def test_algebraic_identities(seed, n_sample, k_pred):
    """
    Verifies that the algebraic identities hold exactly for any sample size and predictor count:
    1. F = (R^2 / k) / ((1 - R^2) / (n - k - 1))
    2. adj_R^2 = 1 - (1 - R^2) * (n - 1) / (n - k - 1)
    """
    np.random.seed(seed)
    X = np.random.randn(n_sample, k_pred)
    true_beta = np.random.uniform(0.5, 2.0, k_pred)
    y = X @ true_beta + np.random.normal(0, 1.0, n_sample)

    x_df = pd.DataFrame(X, columns=[f"X{i+1}" for i in range(k_pred)])
    y_series = pd.Series(y, name="Y")

    _, f_res, det_res, _, _, _ = compute_regression(y_series, x_df, significance_level=0.05)

    r2 = det_res["rSquare"]
    df_res = n_sample - k_pred - 1

    expected_f = (r2 / k_pred) / ((1.0 - r2) / df_res)
    expected_adj_r2 = 1.0 - ((1.0 - r2) * (n_sample - 1) / df_res)

    assert abs(f_res["fHitung"] - expected_f) < 1e-10, f"F identity failed on seed {seed}"
    assert abs(det_res["adjustedRSquare"] - expected_adj_r2) < 1e-10, f"adj_R2 identity failed on seed {seed}"


# ==============================================================================
# TEST SUITE 3: STRICT NEGATIVE CODE CHECKS
# ==============================================================================

def test_strict_negative_no_kstest_on_residuals():
    """
    Scans engine/assumptions.py AST to ensure scipy.stats.kstest is NOT used on residuals.
    Lilliefors correction must be used instead.
    """
    assumptions_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "engine", "assumptions.py"))
    with open(assumptions_file, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read(), filename=assumptions_file)

    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            func_name = ""
            if isinstance(node.func, ast.Attribute):
                func_name = node.func.attr
            elif isinstance(node.func, ast.Name):
                func_name = node.func.id
            assert func_name != "kstest", "VIOLATION: scipy.stats.kstest must not be called in assumptions.py! Use lilliefors."


def test_strict_negative_dynamic_tables_never_static():
    """
    Verifies that r_tabel, t_tabel, and f_tabel are calculated dynamically from scipy distributions,
    never from a static lookup dictionary.
    """
    # r_tabel for df=98 should be ~0.1966, for df=28 should be ~0.3610
    r_98 = calculate_r_table(98, 0.05)
    r_28 = calculate_r_table(28, 0.05)
    assert abs(r_98 - 0.1966) < 0.001
    assert abs(r_28 - 0.3610) < 0.001
    assert r_98 != r_28, "r_tabel must dynamically depend on df"


def test_strict_negative_constant_not_in_hypothesis_conclusion():
    """
    Verifies that regression constant '(Konstanta)' does NOT have a research hypothesis decision.
    Only independent predictors have research hypothesis decisions.
    """
    x = pd.DataFrame({"X": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]})
    y = pd.Series([2.1, 3.9, 6.2, 8.1, 10.0, 11.9, 14.1, 15.9, 18.2, 20.1])
    reg_table, _, _, _, _, _ = compute_regression(y, x)

    const_entry = next(r for r in reg_table if r["variable"] == "(Konstanta)")
    pred_entry = next(r for r in reg_table if r["variable"] == "X")

    assert const_entry["decision"] is None, "Constant must not be given a research hypothesis decision!"
    assert pred_entry["decision"] is not None, "Predictor must have a research hypothesis decision!"


# ==============================================================================
# TEST SUITE 4: DATA QUALITY SCANNER LOCK ON DIRTY FIXTURE
# ==============================================================================

def test_data_doctor_dirty_fixture_lock(golden_kotor_data):
    df_kotor, ref_masalah = golden_kotor_data

    # Generate construct score for outlier detection
    constructs = [
        {"name": "Kualitas Layanan", "code": "KL", "items": ["KL1", "KL2", "KL3", "KL4", "KL5"]},
        {"name": "Kepuasan Pelanggan", "code": "KP", "items": ["KP1", "KP2", "KP3", "KP4", "KP5"]},
        {"name": "Loyalitas Pelanggan", "code": "LP", "items": ["LP1", "LP2", "LP3", "LP4", "LP5"]},
    ]
    c_df, _ = compute_construct_scores(df_kotor, constructs, negative_items=["LP5"])

    issues = scan_dataset_quality(
        df_kotor,
        scale_min=1,
        scale_max=5,
        construct_scores_df=c_df
    )

    expected_issues = ref_masalah["issues"]

    # Verify that each expected issue from fixture_kotor.csv is detected at exact row
    for exp in expected_issues:
        exp_row = exp["row"]
        exp_type = exp["type"]

        matching_issues = [
            i for i in issues
            if i["row"] == exp_row and i["type"] == exp_type
        ]

        assert len(matching_issues) >= 1, f"Failed to detect expected issue {exp_type} at row {exp_row}!"
        found = matching_issues[0]

        if "column" in exp and exp["column"] is not None:
            assert found["column"] == exp["column"], f"Column mismatch at row {exp_row}"
        if "value" in exp and exp["value"] is not None:
            assert found["value"] == exp["value"], f"Value mismatch at row {exp_row}"
        if "duplicateOfRow" in exp:
            assert found.get("duplicateOfRow") == exp["duplicateOfRow"], f"Duplicate of row mismatch at row {exp_row}"

    # Sample size checks
    sample_check = check_sample_size(len(df_kotor), num_predictors=2)
    assert sample_check["warning"] is False # N = 120 >= 30 and >= 20

    # Small sample warning verification
    small_check = check_sample_size(15, num_predictors=2)
    assert small_check["parametricWarning"] is True # 15 < 30
    assert small_check["regressionWarning"] is True # 15 < 20

    # Test cumulative derived dataset creation (immutability)
    derived = create_derived_dataset(df_kotor, excluded_rows_1indexed=[7, 15, 24, 34, 42, 55, 68])
    assert len(derived) == len(df_kotor) - 7
    assert len(df_kotor) == 120, "Original raw DataFrame must remain completely untouched!"


# ==============================================================================
# TEST SUITE 5: NUMBER GUARD VERIFICATION
# ==============================================================================

def test_number_guard_verification(golden_bersih_data):
    _, acuan = golden_bersih_data
    guard = NumberGuard(tolerance=0.005)

    r2_true = acuan["regresi_berganda"]["rSquare"]
    f_true = acuan["regresi_berganda"]["fHitung"]

    # 1. Valid narrative passing test
    valid_narrative = (
        f"Berdasarkan hasil uji regresi linier berganda, nilai R Square sebesar {r2_true:.3f} "
        f"dengan nilai F hitung sebesar {f_true:.2f}. "
        "Seluruh konstruk Kualitas Layanan berada pada kategori Tinggi."
    )
    res_valid = guard.verify_narrative(valid_narrative, acuan, strict=True)
    assert res_valid["valid"] is True
    assert res_valid["violationsCount"] == 0

    # 2. Injected fabricated R-Square test (AI hallucination: claims R2 = 0.995)
    hallucinated_narrative_r2 = (
        "Berdasarkan analisis statistik yang dilakukan, model memiliki determinasi sangat sempurna "
        "dengan nilai R Square sebesar 0,995 dan model sangat akurat."
    )
    with pytest.raises(NumberGuardViolationError) as exc_info:
        guard.verify_narrative(hallucinated_narrative_r2, acuan, strict=True)
    assert "R-Square" in str(exc_info.value)

    # 3. Injected false categorical claim (claims Rendah when computed is Tinggi)
    hallucinated_narrative_cat = (
        "Hasil deskriptif menunjukkan bahwa variabel KL berada pada kategori Rendah secara umum."
    )
    with pytest.raises(NumberGuardViolationError) as exc_info_cat:
        guard.verify_narrative(hallucinated_narrative_cat, acuan, strict=True)
    assert "Kategori" in str(exc_info_cat.value)
