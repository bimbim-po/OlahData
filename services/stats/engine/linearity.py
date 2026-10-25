"""
ANOVA Deviation from Linearity Engine for OlahData.
Implements standard academic Test for Linearity:
- Between Groups (Combined)
- Linearity
- Deviation from Linearity
- Within Groups (Error)

Strict compliance:
- Exact F distribution degrees of freedom.
- If every X value is unique (within-groups df = 0), returns a clear
  Indonesian explanation ("tidak dapat dihitung...") and suggests alternatives.
"""

from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from scipy import stats
from engine.formatter import format_p_value


def compute_linearity_test(
    x_series: pd.Series,
    y_series: pd.Series,
    x_name: str = "Variabel Bebas",
    y_name: str = "Variabel Terikat",
    alpha: float = 0.05
) -> Dict[str, Any]:
    """
    Computes ANOVA Deviation from Linearity for a pair of continuous variables (X and Y).
    Groups Y by distinct values of X.
    """
    df_pair = pd.DataFrame({"x": x_series, "y": y_series}).dropna()
    n = len(df_pair)

    if n < 4:
        return {
            "applicable": False,
            "independentVar": x_name,
            "dependentVar": y_name,
            "reason": f"Ukuran sampel valid (N = {n}) terlalu kecil untuk uji linearitas ANOVA (minimal 4 responden).",
            "isLinear": False
        }

    x_vals = df_pair["x"].values
    y_vals = df_pair["y"].values

    unique_x = np.unique(x_vals)
    g = len(unique_x)  # Number of groups (distinct X levels)

    # Edge Case: Every X is unique, df_within = n - g = 0
    if g == n or (n - g) <= 0:
        return {
            "applicable": False,
            "independentVar": x_name,
            "dependentVar": y_name,
            "reason": (
                f"Uji linearitas ANOVA Deviation from Linearity tidak dapat dihitung karena setiap nilai variabel bebas ({x_name}) "
                f"bersifat unik (derajat bebas within-groups df = {n - g}). Disarankan menggunakan uji alternatif seperti Ramsey RESET "
                f"atau melakukan pengelompokan interval skor."
            ),
            "alternativeSuggestion": "Ramsey RESET test atau inspeksi Scatter Plot residual",
            "isLinear": None,
            "g": g,
            "n": n
        }

    # Minimum groups for deviation: g >= 3 for df_deviation = g - 2 >= 1
    if g < 3:
        return {
            "applicable": False,
            "independentVar": x_name,
            "dependentVar": y_name,
            "reason": f"Jumlah nilai unik variabel bebas {x_name} hanya {g} (kurang dari 3). Tidak dapat menghitung deviasi dari linearitas.",
            "isLinear": None,
            "g": g,
            "n": n
        }

    y_mean = float(np.mean(y_vals))
    x_mean = float(np.mean(x_vals))

    # Calculate Between-Groups SS and Within-Groups SS
    ss_between = 0.0
    ss_within = 0.0
    for val in unique_x:
        group_y = y_vals[x_vals == val]
        grp_mean = float(np.mean(group_y))
        n_j = len(group_y)
        ss_between += n_j * ((grp_mean - y_mean) ** 2)
        ss_within += float(np.sum((group_y - grp_mean) ** 2))

    ss_total = float(np.sum((y_vals - y_mean) ** 2))

    # Linearity SS via Pearson covariance squared
    num_xy = float(np.sum((x_vals - x_mean) * (y_vals - y_mean)))
    den_x = float(np.sum((x_vals - x_mean) ** 2))

    if den_x > 1e-12:
        ss_linearity = (num_xy ** 2) / den_x
    else:
        ss_linearity = 0.0

    # Deviation SS = SS_between - SS_linearity
    ss_deviation = max(0.0, ss_between - ss_linearity)

    # Degrees of freedom
    df_between = g - 1
    df_linearity = 1
    df_deviation = g - 2
    df_within = n - g
    df_total = n - 1

    # Mean Squares
    ms_between = ss_between / df_between if df_between > 0 else 0.0
    ms_linearity = ss_linearity / df_linearity if df_linearity > 0 else 0.0
    ms_deviation = ss_deviation / df_deviation if df_deviation > 0 else 0.0
    ms_within = ss_within / df_within if df_within > 0 else 0.0

    # F statistics against MS_within
    if ms_within > 1e-12:
        f_between = ms_between / ms_within
        f_linearity = ms_linearity / ms_within
        f_deviation = ms_deviation / ms_within

        p_between = float(1.0 - stats.f.cdf(f_between, df_between, df_within))
        p_linearity = float(1.0 - stats.f.cdf(f_linearity, df_linearity, df_within))
        p_deviation = float(1.0 - stats.f.cdf(f_deviation, df_deviation, df_within))
    else:
        f_between, f_linearity, f_deviation = 0.0, 0.0, 0.0
        p_between, p_linearity, p_deviation = 1.0, 1.0, 1.0

    # Academic linearity criterion:
    # 1. Sig. Linearity < 0.05 (ada hubungan linear)
    # 2. Sig. Deviation from Linearity >= 0.05 (tidak ada deviasi signifikan dari linearitas)
    is_linear = bool(p_deviation >= alpha and p_linearity < alpha)

    decision = (
        "Hubungan berbentuk linier (Sig. Deviation >= 0,05 dan Sig. Linearity < 0,05)"
        if is_linear
        else (
            "Terjadi penyimpangan dari linearitas (Sig. Deviation < 0,05)"
            if p_deviation < alpha
            else "Tidak terdapat hubungan linier yang signifikan (Sig. Linearity >= 0,05)"
        )
    )

    return {
        "applicable": True,
        "independentVar": x_name,
        "dependentVar": y_name,
        "isLinear": is_linear,
        "decision": decision,
        "table": [
            {
                "source": "Between Groups (Combined)",
                "ss": float(ss_between),
                "df": int(df_between),
                "ms": float(ms_between),
                "f": float(f_between),
                "pValue": float(p_between),
                "pFormatted": format_p_value(p_between),
            },
            {
                "source": "Linearity",
                "ss": float(ss_linearity),
                "df": int(df_linearity),
                "ms": float(ms_linearity),
                "f": float(f_linearity),
                "pValue": float(p_linearity),
                "pFormatted": format_p_value(p_linearity),
            },
            {
                "source": "Deviation from Linearity",
                "ss": float(ss_deviation),
                "df": int(df_deviation),
                "ms": float(ms_deviation),
                "f": float(f_deviation),
                "pValue": float(p_deviation),
                "pFormatted": format_p_value(p_deviation),
            },
            {
                "source": "Within Groups",
                "ss": float(ss_within),
                "df": int(df_within),
                "ms": float(ms_within),
                "f": None,
                "pValue": None,
                "pFormatted": "-",
            },
            {
                "source": "Total",
                "ss": float(ss_total),
                "df": int(df_total),
                "ms": None,
                "f": None,
                "pValue": None,
                "pFormatted": "-",
            }
        ]
    }
