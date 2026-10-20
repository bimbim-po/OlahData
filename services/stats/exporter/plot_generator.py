import io
from typing import List, Optional
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import scipy.stats as stats

# Clean academic style settings
plt.rcParams['font.sans-serif'] = 'Liberation Serif', 'DejaVu Serif', 'Times New Roman', 'Arial'
plt.rcParams['axes.edgecolor'] = '#333333'
plt.rcParams['axes.linewidth'] = 0.8

def generate_residual_histogram(residuals: List[float], title: str = "Histogram Residual Regresi") -> bytes:
    """
    Generates an APA-compliant histogram of residuals with normal distribution curve overlay.
    """
    res_arr = np.array(residuals, dtype=float)
    fig, ax = plt.subplots(figsize=(6, 3.8), dpi=300)

    # Plot histogram
    n, bins, patches = ax.hist(
        res_arr,
        bins=12,
        density=True,
        alpha=0.65,
        color='#1F6F5C',
        edgecolor='#164E41',
        linewidth=0.8,
        label='Distribusi Residual'
    )

    # Fit normal curve
    mu = np.mean(res_arr)
    sigma = np.std(res_arr, ddof=1)
    if sigma > 1e-9:
        x_pts = np.linspace(min(res_arr) - sigma*0.5, max(res_arr) + sigma*0.5, 200)
        p = stats.norm.pdf(x_pts, mu, sigma)
        ax.plot(x_pts, p, color='#B3412E', linewidth=1.5, linestyle='-', label=f'Kurva Normal (μ={mu:.2f}, σ={sigma:.2f})')

    ax.set_title(title, fontsize=11, fontweight='bold', pad=10)
    ax.set_xlabel("Nilai Residual", fontsize=9.5)
    ax.set_ylabel("Densitas Frekuensi", fontsize=9.5)
    ax.tick_params(axis='both', labelsize=8.5)
    ax.grid(True, linestyle=':', alpha=0.5, color='#999999')
    ax.legend(fontsize=8, frameon=True, facecolor='#FFFFFF', edgecolor='#CCCCCC')

    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=300)
    plt.close(fig)
    buf.seek(0)
    return buf.getvalue()

def generate_qq_plot(residuals: List[float], title: str = "Normal Q-Q Plot Residual Regresi") -> bytes:
    """
    Generates a Normal Q-Q plot for testing normality of regression residuals.
    """
    res_arr = np.array(residuals, dtype=float)
    fig, ax = plt.subplots(figsize=(6, 3.8), dpi=300)

    # Standardize residuals
    mu = np.mean(res_arr)
    sigma = np.std(res_arr, ddof=1)
    std_res = (res_arr - mu) / sigma if sigma > 1e-9 else res_arr

    # Compute theoretical quantiles
    osm, osr = stats.probplot(std_res, dist="norm", fit=False)
    
    # Scatter points
    ax.scatter(osm, osr, color='#1F6F5C', edgecolors='#164E41', s=24, alpha=0.8, label='Titik Residual')

    # Reference line y = x
    line_min = min(min(osm), min(osr)) - 0.2
    line_max = max(max(osm), max(osr)) + 0.2
    ax.plot([line_min, line_max], [line_min, line_max], color='#B3412E', linestyle='--', linewidth=1.2, label='Garis Acuan Normal')

    ax.set_title(title, fontsize=11, fontweight='bold', pad=10)
    ax.set_xlabel("Kuantil Teoretis (Standar Normal)", fontsize=9.5)
    ax.set_ylabel("Kuantil Sampel Residual", fontsize=9.5)
    ax.tick_params(axis='both', labelsize=8.5)
    ax.grid(True, linestyle=':', alpha=0.5, color='#999999')
    ax.legend(fontsize=8, frameon=True, facecolor='#FFFFFF', edgecolor='#CCCCCC')

    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=300)
    plt.close(fig)
    buf.seek(0)
    return buf.getvalue()

def generate_residual_vs_fitted_plot(residuals: List[float], y_pred: List[float], title: str = "Scatter Plot Residual vs Nilai Prediksi (Uji Heteroskedastisitas)") -> bytes:
    """
    Generates a scatter plot of residuals vs fitted values to inspect heteroscedasticity.
    """
    fig, ax = plt.subplots(figsize=(6, 3.8), dpi=300)
    
    ax.scatter(y_pred, residuals, color='#1F6F5C', edgecolors='#164E41', s=24, alpha=0.8, label='Residual')
    ax.axhline(0, color='#B3412E', linestyle='--', linewidth=1.2, label='Garis Nol (Homoskedastis)')

    ax.set_title(title, fontsize=11, fontweight='bold', pad=10)
    ax.set_xlabel("Nilai Prediksi Dependen (Fitted Y)", fontsize=9.5)
    ax.set_ylabel("Residual (e = Y - Ŷ)", fontsize=9.5)
    ax.tick_params(axis='both', labelsize=8.5)
    ax.grid(True, linestyle=':', alpha=0.5, color='#999999')
    ax.legend(fontsize=8, frameon=True, facecolor='#FFFFFF', edgecolor='#CCCCCC')

    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=300)
    plt.close(fig)
    buf.seek(0)
    return buf.getvalue()
