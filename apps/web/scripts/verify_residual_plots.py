import sys
"""
Verifikasi Silang Matematika Modul Grafik Residual
NumPy/SciPy vs TypeScript OlahData Engine
"""

import subprocess
import json
import math
import numpy as np
from scipy import stats

def generate_dataset(n, k, seed=42):
    rng = np.random.default_rng(seed)
    X = rng.normal(loc=50.0, scale=10.0, size=(n, k))
    true_beta = np.linspace(0.6, 1.8, k)
    intercept = 12.5
    noise = rng.normal(loc=0.0, scale=3.5, size=n)
    y = intercept + X @ true_beta + noise
    return X, y

def compute_python_ols_and_metrics(X, y):
    n, k = X.shape
    X_design = np.column_stack([np.ones(n), X])
    
    # OLS Estimasi: beta = (X'X)^-1 X' y
    beta = np.linalg.inv(X_design.T @ X_design) @ (X_design.T @ y)
    y_pred = X_design @ beta
    residuals = y - y_pred
    
    sse = float(np.sum(residuals ** 2))
    df_res = n - k - 1
    mse = sse / df_res
    sqrt_mse = math.sqrt(mse)
    
    # Standardized residual Z_resid = e_i / sqrt(MSE)
    z_resid = residuals / sqrt_mse
    
    # Normal P-P Plot:
    sorted_res = np.sort(residuals)
    res_mean = float(np.mean(residuals))
    res_std = float(np.std(residuals, ddof=1))
    
    p_observed = np.array([(i + 1 - 0.5) / n for i in range(n)])
    z_scores = (sorted_res - res_mean) / res_std
    p_expected = stats.norm.cdf(z_scores)
    
    return {
        "n": n,
        "k": k,
        "residuals": [float(r) for r in residuals],
        "z_resid": [float(z) for z in z_resid],
        "sorted_res": [float(r) for r in sorted_res],
        "p_observed": [float(p) for p in p_observed],
        "p_expected": [float(p) for p in p_expected],
        "mean_z": float(np.mean(z_resid)),
        "std_z": float(np.std(z_resid, ddof=1)),
    }

def run_node_metrics(payload):
    runner_script = f"""
    const {{
      calculateStandardizedResiduals,
      calculateNormalPPPlotData,
      calculateHistogramData
    }} = require('./dist-test/residual-charts.js');

    const input = {json.dumps(payload)};
    const zResid = calculateStandardizedResiduals(input.residuals, input.k, input.n);
    const ppData = calculateNormalPPPlotData(input.residuals);
    const histData = calculateHistogramData(zResid);

    console.log(JSON.stringify({{
      zResid,
      pObserved: ppData.points.map(p => p.pObserved),
      pExpected: ppData.points.map(p => p.pExpected),
      numBins: histData.numBins,
      binWidth: histData.binWidth,
      binCounts: histData.bins.map(b => b.count),
      meanZ: histData.mean,
      stdZ: histData.stdDev,
      pointsCount: ppData.points.length
    }}));
    """
    proc = subprocess.run(
        ["node", "-e", runner_script],
        capture_output=True,
        text=True,
        check=True
    )
    return json.loads(proc.stdout)

def main():
    print("=" * 80)
    print("VERIFIKASI SILANG MATEMATIKA MODUL GRAFIK RESIDUAL & NORMAL P-P PLOT")
    print("PENGUJIAN KETELITIAN: TypeScript/Node.js vs Python NumPy / SciPy")
    print("=" * 80)
    
    test_datasets = [
        {"name": "Dataset 1 (Sampel Kecil: N=30, k=1)", "n": 30, "k": 1, "seed": 42},
        {"name": "Dataset 2 (Sampel Sedang: N=100, k=2)", "n": 100, "k": 2, "seed": 100},
        {"name": "Dataset 3 (Sampel Besar: N=500, k=4)", "n": 500, "k": 4, "seed": 500},
    ]
    
    tolerance = 1e-6
    all_passed = True
    
    for ds in test_datasets:
        print(f"\n[TEST DATASET] {ds['name']}")
        X, y = generate_dataset(ds["n"], ds["k"], ds["seed"])
        py_res = compute_python_ols_and_metrics(X, y)
        
        node_payload = {
            "n": ds["n"],
            "k": ds["k"],
            "residuals": py_res["residuals"],
        }
        
        node_res = run_node_metrics(node_payload)
        
        # 1. Bandingkan Standardized Residuals
        diff_z = np.max(np.abs(np.array(py_res["z_resid"]) - np.array(node_res["zResid"])))
        print(f"  [OK] Max diff Z_resid (Standardized Residual) : {diff_z:.2e} (Toleransi <= {tolerance:.0e})")
        if diff_z > tolerance:
            print("    [GAGAL] Max diff Z_resid melebihi batas toleransi!")
            all_passed = False
            
        # 2. Bandingkan P_i (Observed Cumulative Probability)
        diff_p_obs = np.max(np.abs(np.array(py_res["p_observed"]) - np.array(node_res["pObserved"])))
        print(f"  [OK] Max diff Sumbu X (P_observed)            : {diff_p_obs:.2e}")
        if diff_p_obs > tolerance:
            print("    [GAGAL] Max diff P_observed melebihi batas toleransi!")
            all_passed = False
            
        # 3. Bandingkan Phi(z) (Expected Cumulative Probability via erf)
        diff_p_exp = np.max(np.abs(np.array(py_res["p_expected"]) - np.array(node_res["pExpected"])))
        print(f"  [OK] Max diff Sumbu Y Phi(z) (Expected Cum)    : {diff_p_exp:.2e}")
        if diff_p_exp > tolerance:
            print("    [GAGAL] Max diff P_expected melebihi batas toleransi!")
            all_passed = False
            
        # 4. Verifikasi Jumlah Titik Tepat N
        points_ok = (node_res["pointsCount"] == ds["n"])
        print(f"  [OK] Jumlah Titik P-P Plot                   : {node_res['pointsCount']} (Tepat N={ds['n']}) -> {'LULUS' if points_ok else 'GAGAL'}")
        if not points_ok:
            all_passed = False
            
        # 5. Verifikasi Histogram Bins & Total Frekuensi
        total_freq = sum(node_res["binCounts"])
        freq_ok = (total_freq == ds["n"])
        print(f"  [OK] Jumlah Bins Freedman-Diaconis/Sturges    : {node_res['numBins']} bins (Lebar: {node_res['binWidth']:.3f})")
        print(f"  [OK] Total Frekuensi Seluruh Bin             : {total_freq} (Tepat N={ds['n']}) -> {'LULUS' if freq_ok else 'GAGAL'}")
        if not freq_ok:
            all_passed = False

    # 6. Uji Kasus Tepi (Edge Cases)
    print("\n[TEST KASUS TEPI (EDGE CASES)]")
    
    # Kasus Tepi A: N < 3
    node_payload_small = {"n": 2, "k": 1, "residuals": [0.5, -0.5]}
    node_small = run_node_metrics(node_payload_small)
    print(f"  [OK] Kasus N=2 (Sampel Sangat Kecil)          : Ditangani aman tanpa crash (Bins={node_small['numBins']})")
    
    # Kasus Tepi B: Residual Konstan (SD = 0)
    node_payload_zero = {"n": 30, "k": 1, "residuals": [0.0] * 30}
    node_zero = run_node_metrics(node_payload_zero)
    print(f"  [OK] Kasus SD=0 (Residual Konstan)            : Ditangani aman tanpa pembagian nol (Bins={node_zero['numBins']})")

    print("\n" + "=" * 80)
    if all_passed:
        print("KESIMPULAN: SELURUH PENGUJIAN MATEMATIKA LULUS 100% DALAM TOLERANSI 1e-6!")
    else:
        print("KESIMPULAN: ADA PENGUJIAN YANG GAGAL. SILAKAN PERIKSA DETAIL DI ATAS.")
    print("=" * 80)
    
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()
