import json
import numpy as np
import pandas as pd
from scipy import stats

def generate():
    np.random.seed(42)
    n = 100

    # True model: Y = 2.0 + 0.4*X1 + 0.5*X2 + e
    X1_base = np.random.normal(3.5, 0.6, n)
    X2_base = np.random.normal(3.2, 0.7, n)
    noise = np.random.normal(0, 0.4, n)
    Y_base = 1.5 + 0.35 * X1_base + 0.45 * X2_base + noise

    def to_likert(base, k):
        # generate k items around base
        items = []
        for _ in range(k):
            item_vals = np.clip(np.round(base + np.random.normal(0, 0.5, n)), 1, 5).astype(int)
            items.append(item_vals)
        return items

    x1_items = to_likert(X1_base, 3)
    x2_items = to_likert(X2_base, 3)
    y_items = to_likert(Y_base, 3)

    df = pd.DataFrame({
        "No": np.arange(1, n + 1),
        "KL1": x1_items[0],
        "KL2": x1_items[1],
        "KL3": x1_items[2],
        "KP1": x2_items[0],
        "KP2": x2_items[1],
        "KP3": x2_items[2],
        "LO1": y_items[0],
        "LO2": y_items[1],
        "LO3": y_items[2],
    })

    df.to_csv("services/stats/tests/fixtures/reference/dataset_reference.csv", index=False)

    # Reference calculations
    # Construct scores (mean of items)
    df["KL"] = df[["KL1", "KL2", "KL3"]].mean(axis=1)
    df["KP"] = df[["KP1", "KP2", "KP3"]].mean(axis=1)
    df["LO"] = df[["LO1", "LO2", "LO3"]].mean(axis=1)

    # Cronbach's Alpha KL
    def cronbach(item_cols):
        k = len(item_cols)
        m = df[item_cols]
        item_vars = m.var(axis=0, ddof=1).sum()
        total_var = m.sum(axis=1).var(ddof=1)
        return float((k / (k - 1)) * (1.0 - (item_vars / total_var)))

    alpha_kl = cronbach(["KL1", "KL2", "KL3"])
    alpha_kp = cronbach(["KP1", "KP2", "KP3"])
    alpha_lo = cronbach(["LO1", "LO2", "LO3"])

    # Pearson Validity KL1 vs total
    total_kl = df[["KL1", "KL2", "KL3"]].sum(axis=1)
    r_kl1, _ = stats.pearsonr(df["KL1"], total_kl)

    # Regression: LO ~ KL + KP
    X = np.column_stack([np.ones(n), df["KL"].values, df["KP"].values])
    y = df["LO"].values
    beta, _, _, _ = np.linalg.lstsq(X, y, rcond=None)
    pred = X @ beta
    res = y - pred
    ss_tot = np.sum((y - np.mean(y)) ** 2)
    ss_res = np.sum(res ** 2)
    r2 = 1.0 - (ss_res / ss_tot)
    df_res = n - 2 - 1
    adj_r2 = 1.0 - ((1.0 - r2) * (n - 1) / df_res)
    ms_reg = (ss_tot - ss_res) / 2
    ms_res = ss_res / df_res
    f_stat = ms_reg / ms_res

    ref = {
        "n": n,
        "alpha_kl": round(alpha_kl, 4),
        "alpha_kp": round(alpha_kp, 4),
        "alpha_lo": round(alpha_lo, 4),
        "r_kl1": round(float(r_kl1), 4),
        "beta_0": round(float(beta[0]), 4),
        "beta_kl": round(float(beta[1]), 4),
        "beta_kp": round(float(beta[2]), 4),
        "r_squared": round(float(r2), 4),
        "adj_r_squared": round(float(adj_r2), 4),
        "f_stat": round(float(f_stat), 4)
    }

    with open("services/stats/tests/fixtures/reference/reference_values.json", "w") as f:
        json.dump(ref, f, indent=2)

    print("Reference dataset and values generated successfully.")

if __name__ == "__main__":
    generate()
