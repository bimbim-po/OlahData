"""
Section 6.3: Property-Based & Invariant Tests
Verifies mathematical and architectural invariants:
(a) Invariant: n_input = n_dipakai + n_dikecualikan
(b) Determinism: Identical input produces identical output bit-for-bit
(c) Row shuffle invariance: Shuffling respondent rows produces identical statistical results
(d) Fuzz resilience: Random / malformed inputs handled gracefully without unhandled exceptions
(e) Static code scan: Verifies NO hardcoded specific dataset column names, titles, or item counts in engine production code
"""

import os
import ast
import random
import pytest
import numpy as np
import pandas as pd

from engine.pipeline import run_statistical_analysis
from engine.descriptive import compute_descriptive, compute_construct_scores
from engine.validity import compute_validity
from engine.reliability import compute_reliability
from engine.regression import compute_regression
from validation import scan_dataset_quality, create_derived_dataset_with_log, validate_exclusion_request


def generate_random_dataset(n=50, k_items=4, k_pred=2, seed=42):
    np.random.seed(seed)
    data = {}
    constructs = []
    for p in range(k_pred):
        c_name = f"Pred_{p+1}"
        c_code = f"X{p+1}"
        items = [f"{c_code}_{i+1}" for i in range(k_items)]
        for it in items:
            data[it] = np.random.randint(1, 6, size=n)
        constructs.append({"name": c_name, "code": c_code, "items": items, "role": "independent"})

    y_items = [f"Y_{i+1}" for i in range(k_items)]
    for it in y_items:
        data[it] = np.random.randint(1, 6, size=n)
    constructs.append({"name": "Target_Y", "code": "Y", "items": y_items, "role": "dependent"})

    return pd.DataFrame(data), constructs


def test_invariant_n_accounting():
    """
    (a) Invariant: n_input = n_dipakai + n_dikecualikan
    """
    df_raw, constructs = generate_random_dataset(n=60, seed=123)
    total_n = len(df_raw)

    # Simulate user excluding 5 rows
    excluded_rows_1indexed = [4, 12, 19, 33, 47]
    exclusions_log = [{"row": r, "reason": "Pencilan terdeteksi"} for r in excluded_rows_1indexed]

    derived_df, audit_log = create_derived_dataset_with_log(df_raw, exclusions_log)

    assert audit_log["nInput"] == total_n
    assert audit_log["nDipakai"] == total_n - 5
    assert audit_log["nDikecualikan"] == 5
    assert audit_log["invariantHolds"] is True
    assert audit_log["nInput"] == audit_log["nDipakai"] + audit_log["nDikecualikan"]

    # Run pipeline on derived data
    res = run_statistical_analysis(
        derived_df,
        constructs=constructs,
        selected_tests=["descriptive", "validity", "reliability", "regression"],
        excluded_rows_log=exclusions_log
    )
    acc = res["accounting"]
    assert acc["nInput"] == total_n - 5
    assert acc["nDipakai"] == total_n - 5
    assert acc["nDikecualikan"] == 5


def test_determinism_identical_runs():
    """
    (b) Determinism: Running identical analysis produces bit-for-bit identical results
    """
    df, constructs = generate_random_dataset(n=50, seed=999)

    res1 = run_statistical_analysis(
        df,
        constructs=constructs,
        selected_tests=["descriptive", "validity", "reliability", "regression"],
        significance_level=0.05
    )
    res2 = run_statistical_analysis(
        df,
        constructs=constructs,
        selected_tests=["descriptive", "validity", "reliability", "regression"],
        significance_level=0.05
    )

    # Exclude timestamp and id
    del res1["id"], res2["id"], res1["timestamp"], res2["timestamp"]

    # Validate regression coefficients
    for row1, row2 in zip(res1["regression"], res2["regression"]):
        assert row1["b"] == row2["b"]
        assert row1["t"] == row2["t"]
        assert row1["p"] == row2["p"]

    # Validate R2 and F
    assert res1["determination"]["rSquare"] == res2["determination"]["rSquare"]
    assert res1["fTest"]["fHitung"] == res2["fTest"]["fHitung"]


def test_row_shuffle_invariance():
    """
    (c) Row shuffle invariance: Permuting respondents produces identical statistical results
    """
    df, constructs = generate_random_dataset(n=70, seed=555)

    # Shuffle rows randomly
    shuffled_df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)

    res_orig = run_statistical_analysis(
        df,
        constructs=constructs,
        selected_tests=["descriptive", "validity", "reliability", "regression"]
    )
    res_shuf = run_statistical_analysis(
        shuffled_df,
        constructs=constructs,
        selected_tests=["descriptive", "validity", "reliability", "regression"]
    )

    # Check descriptive means and standard deviations
    for d1, d2 in zip(res_orig["descriptive"], res_shuf["descriptive"]):
        assert abs(d1["mean"] - d2["mean"]) < 1e-12
        assert abs(d1["stdDev"] - d2["stdDev"]) < 1e-12

    # Check regression B and R2
    assert abs(res_orig["determination"]["rSquare"] - res_shuf["determination"]["rSquare"]) < 1e-12
    assert abs(res_orig["fTest"]["fHitung"] - res_shuf["fTest"]["fHitung"]) < 1e-12
    for r1, r2 in zip(res_orig["regression"], res_shuf["regression"]):
        assert abs(r1["b"] - r2["b"]) < 1e-12


def test_fuzz_malformed_input_graceful_handling():
    """
    (d) Fuzz resilience: Random corruptions and malformed data are handled without crashing
    """
    # Create corrupted dataframe
    fuzz_data = {
        "Col1": [1, None, "error", 4, 5, 2, 999, -5, "3,5", 4],
        "Col2": [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],  # Zero variance
        "Col3": ["Setuju", "Netral", None, "InvalidText", 4, 5, 2, 3, 4, 5],
        "Col4": [None] * 10  # All empty
    }
    df_fuzz = pd.DataFrame(fuzz_data)

    # 1. Quality scanner must not raise unhandled exception
    issues = scan_dataset_quality(df_fuzz, scale_min=1, scale_max=5)
    assert isinstance(issues, list)
    assert len(issues) > 0

    # 2. Exclusion validation guard
    valid, msg, rem = validate_exclusion_request(total_n=10, excluded_rows_1indexed=list(range(1, 10)), num_predictors=1)
    assert valid is False
    assert "ditolak" in msg


def test_static_code_scan_no_hardcoded_dataset_literals():
    """
    (e) Static scan: Verifies NO hardcoded specific dataset column names
    (e.g. 'KL1', 'KP1', 'LP1', 'Kualitas Layanan', 'Kepuasan Pelanggan')
    in production engine code (services/stats/engine/*.py).
    """
    engine_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "engine"))
    py_files = [os.path.join(engine_dir, f) for f in os.listdir(engine_dir) if f.endswith(".py") and f != "__init__.py"]

    # Forbidden specific thesis dataset strings
    forbidden_literals = [
        "kualitas layanan", "kepuasan pelanggan", "loyalitas pelanggan",
        "kl1", "kl2", "kl3", "kl4", "kl5",
        "kp1", "kp2", "kp3", "kp4", "kp5",
        "lp1", "lp2", "lp3", "lp4", "lp5"
    ]

    violations = []
    for f_path in py_files:
        with open(f_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Parse AST to inspect all string constants
        tree = ast.parse(content, filename=f_path)
        for node in ast.walk(tree):
            if isinstance(node, ast.Constant) and isinstance(node.value, str):
                s_val = node.value.strip().lower()
                for bad in forbidden_literals:
                    # Check exact match or token match
                    if bad == s_val or f"'{bad}'" in s_val:
                        violations.append(f"{os.path.basename(f_path)}: contains forbidden dataset literal '{node.value}' at line {node.lineno}")

    assert len(violations) == 0, f"Found hardcoded specific dataset literals in engine code:\n" + "\n".join(violations)
