import os
import json
import pytest
import pandas as pd
import numpy as np

import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from engine.descriptive import compute_descriptive
from engine.validity import compute_validity, calculate_r_table
from engine.reliability import compute_reliability
from engine.regression import compute_regression
from engine.assumptions import compute_normality, compute_multicollinearity, compute_heteroscedasticity
from validation import scan_dataset_quality
from engine.pipeline import run_statistical_analysis
from exporter.docx_export import generate_docx_report
from exporter.pdf_export import generate_pdf_report

FIXTURE_DIR = os.path.join(os.path.dirname(__file__), "fixtures", "reference")

@pytest.fixture
def ref_data():
    csv_path = os.path.join(FIXTURE_DIR, "dataset_reference.csv")
    json_path = os.path.join(FIXTURE_DIR, "reference_values.json")
    df = pd.read_csv(csv_path)
    with open(json_path) as f:
        ref_vals = json.load(f)
    return df, ref_vals

def test_r_table_critical_value():
    # df = 117 - 2 = 115, alpha = 0.05 -> r_table should be ~0.1816
    r_val = calculate_r_table(115, 0.05)
    assert abs(r_val - 0.1816) < 0.001

def test_cronbach_alpha_tolerance(ref_data):
    df, ref = ref_data
    constructs = [
        {"name": "KL", "items": ["KL1", "KL2", "KL3"], "role": "independent"},
        {"name": "KP", "items": ["KP1", "KP2", "KP3"], "role": "independent"},
        {"name": "LO", "items": ["LO1", "LO2", "LO3"], "role": "dependent"},
    ]
    res = compute_reliability(df, constructs)
    alpha_map = {r["construct"]: r["cronbachAlpha"] for r in res}

    assert abs(alpha_map["KL"] - ref["alpha_kl"]) < 0.001
    assert abs(alpha_map["KP"] - ref["alpha_kp"]) < 0.001
    assert abs(alpha_map["LO"] - ref["alpha_lo"]) < 0.001

def test_validity_pearson_tolerance(ref_data):
    df, ref = ref_data
    constructs = [{"name": "KL", "items": ["KL1", "KL2", "KL3"]}]
    # Uncorrected Pearson against legacy reference value (0.8212)
    res_uncorrected = compute_validity(df, constructs, significance_level=0.05, use_corrected=False)
    kl1_res = next(r for r in res_uncorrected if r["item"] == "KL1")
    assert abs(kl1_res["rHitung"] - ref["r_kl1"]) < 0.001

    # Corrected item-total correlation (thesis standard: item correlated with other items sum)
    res_corrected = compute_validity(df, constructs, significance_level=0.05, use_corrected=True)
    kl1_corr = next(r for r in res_corrected if r["item"] == "KL1")
    assert abs(kl1_corr["rHitung"] - 0.5826) < 0.001

def test_regression_tolerance(ref_data):
    df, ref = ref_data
    df["KL"] = df[["KL1", "KL2", "KL3"]].mean(axis=1)
    df["KP"] = df[["KP1", "KP2", "KP3"]].mean(axis=1)
    df["LO"] = df[["LO1", "LO2", "LO3"]].mean(axis=1)

    reg_table, f_res, det_res, anova_res, residuals, _ = compute_regression(
        y_series=df["LO"],
        x_df=df[["KL", "KP"]],
        significance_level=0.05
    )

    reg_map = {r["variable"]: r["coefficient"] for r in reg_table}

    assert abs(reg_map["(Konstanta)"] - ref["beta_0"]) < 0.001
    assert abs(reg_map["KL"] - ref["beta_kl"]) < 0.001
    assert abs(reg_map["KP"] - ref["beta_kp"]) < 0.001
    assert abs(det_res["rSquare"] - ref["r_squared"]) < 0.001
    assert abs(det_res["adjustedRSquare"] - ref["adj_r_squared"]) < 0.001
    assert abs(f_res["fHitung"] - ref["f_stat"]) < 0.001

def test_data_quality_scanning():
    # Construct a test df with missing values, out of range, and duplicate row
    df = pd.DataFrame([
        {"No": 1, "KL1": 3, "KL2": 4, "KL3": 5},
        {"No": 2, "KL1": np.nan, "KL2": 3, "KL3": 4}, # Missing cell
        {"No": 3, "KL1": 7, "KL2": 4, "KL3": 5},     # Out of range 7
        {"No": 4, "KL1": 3, "KL2": 4, "KL3": 5},     # Duplicate of No 1
    ])

    issues = scan_dataset_quality(df, scale_min=1, scale_max=5)
    severities = [i["severity"] for i in issues]
    messages = [i["message"] for i in issues]

    assert "error" in severities
    assert any("Sel kosong" in m for m in messages)
    assert any("di luar skala" in m for m in messages)
    assert any("duplikat" in m for m in messages)

def test_docx_and_pdf_generation(ref_data):
    df, _ = ref_data
    constructs = [
        {"name": "KL", "items": ["KL1", "KL2", "KL3"], "role": "independent"},
        {"name": "KP", "items": ["KP1", "KP2", "KP3"], "role": "independent"},
        {"name": "LO", "items": ["LO1", "LO2", "LO3"], "role": "dependent"},
    ]
    results = run_statistical_analysis(
        df=df,
        constructs=constructs,
        selected_tests=["descriptive", "validity", "reliability", "regression", "normality", "multicollinearity", "heteroscedasticity"],
        significance_level=0.05
    )

    docx_bytes = generate_docx_report(results, watermark=True)
    assert len(docx_bytes) > 1000
    assert docx_bytes[:4] == b"PK\x03\x04" # zip/docx magic number

    pdf_bytes = generate_pdf_report(results, watermark=True)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes[:4] == b"%PDF" # PDF magic number
