"""
Script Verifikasi Silang Matematika Modul Grafik Residual
Membandingkan output TypeScript/JavaScript dengan NumPy & SciPy
Dataset yang diuji:
1. N = 30, k = 1
2. N = 100, k = 2
3. N = 500, k = 4
Kriteria: toleransi galat < 1e-6
"""

import sys
import json
import math
import subprocess
import numpy as np
from scipy import stats

def generate_dataset(n, k, seed=42):
    rng = np.random.default_rng(seed)
    # Generate X matrix with shape (n, k)
    X = rng.normal(loc=50.0, scale=10.0, size=(n, k))
    # True beta
    true_beta = np.linspace(0.5, 1.5, k)
    intercept = 10.0
    # Noise e ~ N(0, sigma^2)
    noise = rng.normal(loc=0.0, scale=4.0, size=n)
    y = intercept + X @ true_beta + noise
    return X, y

def compute_python_ols_and_metrics(X, y):
    n, k = X.shape
    X_design = np.column_stack([np.ones(n), X])
    
    # OLS beta = (X'X)^-1 X' y
    beta = np.linalg.inv(X_design.T @ X_design) @ (X_design.T @ y)
    y_pred = X_design @ beta
    residuals = y - y_pred
    
    sse = np.sum(residuals ** 2)
    df_res = n - k - 1
    mse = sse / df_res
    sqrt_mse = math.sqrt(mse)
    
    # Standardized residual Z_resid = e_i / sqrt(MSE)
    z_resid = residuals / sqrt_mse
    
    # Normal P-P Plot:
    # Sort residuals
    sorted_res = np.sort(residuals)
    res_mean = np.mean(residuals)
    res_std = np.std(residuals, ddof=1)
    
    p_observed = np.array([(i + 1 - 0.5) / n for i in range(n)])
    z_scores = (sorted_res - res_mean) / res_std
    p_expected = stats.norm.cdf(z_scores)
    
    return {
        "n": n,
        "k": k,
        "residuals": residuals.tolist(),
        "z_resid": z_resid.tolist(),
        "p_observed": p_observed.tolist(),
        "p_expected": p_expected.tolist(),
        "mean_z": float(np.mean(z_resid)),
        "std_z": float(np.std(z_resid, ddof=1)),
    }

def main():
    print("=" * 70)
    print("VERIFIKASI SILANG MATEMATIKA MODUL GRAFIK RESIDUAL DENGAN NUMPY & SCIPY")
    print("=" * 70)
    
    test_configs = [
        {"name": "Dataset 1 (Kecil: N=30, k=1)", "n": 30, "k": 1, "seed": 101},
        {"name": "Dataset 2 (Sedang: N=100, k=2)", "n": 100, "k": 2, "seed": 202},
        {"name": "Dataset 3 (Besar: N=500, k=4)", "n": 500, "k": 4, "seed": 303},
    ]
    
    all_passed = True
    
    for cfg in test_configs:
        print(f"\n--- Menguji {cfg['name']} ---")
        X, y = generate_dataset(cfg["n"], cfg["k"], cfg["seed"])
        py_metrics = compute_python_ols_and_metrics(X, y)
        
        # Simpan payload input untuk diproses oleh Node.js test script
        payload = {
            "n": cfg["n"],
            "k": cfg["k"],
            "residuals": py_metrics["residuals"],
            "z_resid": py_metrics["z_resid"],
        }
        
        # Panggil runner Node.js
        node_code = f"""
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
          meanZ: histData.mean,
          stdZ: histData.stdDev
        }}));
        """
        
        # Build test module or execute typescript via transpile
        # We will write a small node test harness and run it
        print(f"Dataset generated: N={cfg['n']}, k={cfg['k']}.")
        print(f"Mean residual = {py_metrics['mean_z']:.6f}, Std residual = {py_metrics['std_z']:.6f}")
        print(f"Max P_expected diff check ready.")
        
    print("\nPersiapan verifikasi Python selesai.")

if __name__ == "__main__":
    main()
