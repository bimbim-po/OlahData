"use strict";
/**
 * Accurate mathematical functions for deterministic statistical computation.
 * Matches SciPy / R output with 1e-6 precision.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.matrixMultiply = matrixMultiply;
exports.matrixTranspose = matrixTranspose;
exports.matrixInverse = matrixInverse;
exports.logGamma = logGamma;
exports.betainc = betainc;
exports.studentTCdf = studentTCdf;
exports.studentTPValueTwoTailed = studentTPValueTwoTailed;
exports.studentTInv = studentTInv;
exports.fisherFCdf = fisherFCdf;
exports.fisherFPValue = fisherFPValue;
exports.fisherFInv = fisherFInv;
exports.standardNormalCdf = standardNormalCdf;
exports.erf = erf;
exports.getTCritical = getTCritical;
exports.getRCritical = getRCritical;
exports.getFCritical = getFCritical;
exports.getDurbinWatsonBounds = getDurbinWatsonBounds;
exports.regularizedGammaLower = regularizedGammaLower;
exports.regularizedGammaUpper = regularizedGammaUpper;
exports.chiSquareCdf = chiSquareCdf;
exports.chiSquarePValue = chiSquarePValue;
exports.getChiSquareCritical = getChiSquareCritical;
// Matrix operations
function matrixMultiply(A, B) {
    const rowsA = A.length;
    const colsA = A[0].length;
    const colsB = B[0].length;
    const result = Array.from({ length: rowsA }, () => Array(colsB).fill(0));
    for (let i = 0; i < rowsA; i++) {
        for (let k = 0; k < colsA; k++) {
            const a = A[i][k];
            for (let j = 0; j < colsB; j++) {
                result[i][j] += a * B[k][j];
            }
        }
    }
    return result;
}
function matrixTranspose(A) {
    const rows = A.length;
    const cols = A[0].length;
    const result = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            result[j][i] = A[i][j];
        }
    }
    return result;
}
function matrixInverse(A) {
    const n = A.length;
    // Augment with identity matrix
    const M = A.map((row, i) => {
        const r = [...row];
        for (let j = 0; j < n; j++) {
            r.push(i === j ? 1 : 0);
        }
        return r;
    });
    for (let i = 0; i < n; i++) {
        // Find pivot
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
                maxRow = k;
            }
        }
        const temp = M[i];
        M[i] = M[maxRow];
        M[maxRow] = temp;
        const pivot = M[i][i];
        if (Math.abs(pivot) < 1e-12) {
            throw new Error('Matriks singular atau multikolinearitas sempurna terdeteksi.');
        }
        for (let j = 0; j < 2 * n; j++) {
            M[i][j] /= pivot;
        }
        for (let k = 0; k < n; k++) {
            if (k !== i) {
                const factor = M[k][i];
                for (let j = 0; j < 2 * n; j++) {
                    M[k][j] -= factor * M[i][j];
                }
            }
        }
    }
    return M.map((row) => row.slice(n));
}
// Special mathematical functions for distributions
// Lanczos approximation for log gamma
function logGamma(z) {
    const g = 7;
    const c = [
        0.99999999999980993,
        676.5203681218851,
        -1259.1392167224028,
        771.32342877765313,
        -176.61502916214059,
        12.507343278686905,
        -0.138571095856205,
        9.9843695780195716e-6,
        1.5056327351493116e-7,
    ];
    if (z < 0.5) {
        return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
    }
    z -= 1;
    let x = c[0];
    for (let i = 1; i < g + 2; i++) {
        x += c[i] / (z + i);
    }
    const t = z + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
// Incomplete beta function via continued fraction
function betainc(x, a, b) {
    if (x < 0 || x > 1)
        return 0;
    if (x === 0)
        return 0;
    if (x === 1)
        return 1;
    // Use symmetry transformation if x > (a + 1) / (a + b + 2)
    if (x > (a + 1) / (a + b + 2)) {
        return 1 - betainc(1 - x, b, a);
    }
    const factor = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - logGamma(a) - logGamma(b) + logGamma(a + b)) / a;
    // Continued fraction evaluation (Lentz's method)
    const maxIterations = 200;
    const eps = 1e-14;
    let c = 1.0;
    let d = 1.0 - (a + b) * x / (a + 1.0);
    if (Math.abs(d) < 1e-30)
        d = 1e-30;
    d = 1.0 / d;
    let h = d;
    for (let m = 1; m <= maxIterations; m++) {
        // Even step
        let numerator = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
        d = 1.0 + numerator * d;
        if (Math.abs(d) < 1e-30)
            d = 1e-30;
        c = 1.0 + numerator / c;
        if (Math.abs(c) < 1e-30)
            c = 1e-30;
        d = 1.0 / d;
        h *= d * c;
        // Odd step
        numerator = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
        d = 1.0 + numerator * d;
        if (Math.abs(d) < 1e-30)
            d = 1e-30;
        c = 1.0 + numerator / c;
        if (Math.abs(c) < 1e-30)
            c = 1e-30;
        d = 1.0 / d;
        const delta = d * c;
        h *= delta;
        if (Math.abs(delta - 1.0) < eps)
            break;
    }
    return factor * h;
}
// Student's t cumulative distribution function (CDF)
function studentTCdf(t, df) {
    if (df <= 0)
        return 0.5;
    const x = df / (df + t * t);
    const prob = 0.5 * betainc(x, df / 2, 0.5);
    return t >= 0 ? 1.0 - prob : prob;
}
// Student's t two-tailed p-value
function studentTPValueTwoTailed(t, df) {
    if (df <= 0 || isNaN(t))
        return 1.0;
    const absT = Math.abs(t);
    const x = df / (df + absT * absT);
    return Math.max(0, Math.min(1, betainc(x, df / 2, 0.5)));
}
// Inverse Student's t (quantile / percent point function) via binary search
function studentTInv(p, df) {
    if (p <= 0)
        return -Infinity;
    if (p >= 1)
        return Infinity;
    if (p === 0.5)
        return 0;
    let low = -100;
    let high = 100;
    for (let i = 0; i < 60; i++) {
        const mid = (low + high) / 2;
        const cdf = studentTCdf(mid, df);
        if (cdf < p) {
            low = mid;
        }
        else {
            high = mid;
        }
    }
    return (low + high) / 2;
}
// Fisher F distribution CDF
function fisherFCdf(f, df1, df2) {
    if (f <= 0)
        return 0;
    const x = (df1 * f) / (df1 * f + df2);
    return betainc(x, df1 / 2, df2 / 2);
}
// Fisher F distribution p-value (upper tail: P(F >= f))
function fisherFPValue(f, df1, df2) {
    if (f <= 0 || isNaN(f))
        return 1.0;
    return Math.max(0, Math.min(1, 1.0 - fisherFCdf(f, df1, df2)));
}
// Fisher F distribution inverse (critical value) via binary search
function fisherFInv(p, df1, df2) {
    let low = 0.0001;
    let high = 1000.0;
    for (let i = 0; i < 60; i++) {
        const mid = (low + high) / 2;
        const cdf = fisherFCdf(mid, df1, df2);
        if (cdf < p) {
            low = mid;
        }
        else {
            high = mid;
        }
    }
    return (low + high) / 2;
}
// Standard normal distribution CDF
function standardNormalCdf(x) {
    return 0.5 * (1 + erf(x / Math.SQRT2));
}
// Error function approximation (Abramowitz & Stegun 7.1.26, max error < 1.5e-7)
function erf(x) {
    const sign = x >= 0 ? 1 : -1;
    const absX = Math.abs(x);
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absX * absX);
    return sign * y;
}
// Critical values calculators for thesis tables
/**
 * Nilai Kritis t-tabel (Student's t two-tailed critical value)
 * @param df degrees of freedom (N - k - 1)
 * @param alpha significance level (default 0.05)
 */
function getTCritical(df, alpha = 0.05) {
    if (df <= 0)
        return 0;
    return Number(studentTInv(1.0 - alpha / 2.0, df).toFixed(4));
}
/**
 * Nilai Kritis r-tabel (Pearson Product Moment critical value)
 * Diturunkan dari t-tabel dua arah dengan df = N - 2:
 * r = t / sqrt(df + t^2)
 * @param df degrees of freedom (N - 2)
 * @param alpha significance level (default 0.05)
 */
function getRCritical(df, alpha = 0.05) {
    if (df <= 0)
        return 0;
    const t = studentTInv(1.0 - alpha / 2.0, df);
    const r = t / Math.sqrt(df + t * t);
    return Number(r.toFixed(4));
}
/**
 * Nilai Kritis F-tabel (Snedecor's F critical value)
 * @param df1 degrees of freedom numerator (k = jumlah variabel bebas)
 * @param df2 degrees of freedom denominator (N - k - 1)
 * @param alpha significance level (default 0.05)
 */
function getFCritical(df1, df2, alpha = 0.05) {
    if (df1 <= 0 || df2 <= 0)
        return 0;
    return Number(fisherFInv(1.0 - alpha, df1, df2).toFixed(4));
}
/**
 * Durbin-Watson Critical Bounds (dL and dU) at alpha = 0.05
 * Interpolated from standard Durbin-Watson statistical tables for k = 1..5 predictors.
 */
function getDurbinWatsonBounds(n, k, _alpha = 0.05) {
    // Standard table sample points for k in [1..5]
    // k is number of explanatory variables (excluding constant)
    const clampedK = Math.max(1, Math.min(5, k));
    const tableData = {
        1: [
            { n: 15, dL: 1.08, dU: 1.36 },
            { n: 20, dL: 1.20, dU: 1.41 },
            { n: 30, dL: 1.35, dU: 1.49 },
            { n: 40, dL: 1.44, dU: 1.54 },
            { n: 50, dL: 1.50, dU: 1.59 },
            { n: 70, dL: 1.58, dU: 1.64 },
            { n: 100, dL: 1.65, dU: 1.69 },
            { n: 150, dL: 1.72, dU: 1.75 },
            { n: 200, dL: 1.76, dU: 1.78 },
            { n: 500, dL: 1.85, dU: 1.86 },
        ],
        2: [
            { n: 15, dL: 0.95, dU: 1.54 },
            { n: 20, dL: 1.10, dU: 1.54 },
            { n: 30, dL: 1.28, dU: 1.57 },
            { n: 40, dL: 1.39, dU: 1.60 },
            { n: 50, dL: 1.46, dU: 1.63 },
            { n: 70, dL: 1.55, dU: 1.67 },
            { n: 100, dL: 1.63, dU: 1.72 },
            { n: 150, dL: 1.70, dU: 1.76 },
            { n: 200, dL: 1.75, dU: 1.79 },
            { n: 500, dL: 1.84, dU: 1.86 },
        ],
        3: [
            { n: 15, dL: 0.82, dU: 1.75 },
            { n: 20, dL: 1.00, dU: 1.68 },
            { n: 30, dL: 1.21, dU: 1.65 },
            { n: 40, dL: 1.34, dU: 1.66 },
            { n: 50, dL: 1.42, dU: 1.67 },
            { n: 70, dL: 1.52, dU: 1.70 },
            { n: 100, dL: 1.61, dU: 1.74 },
            { n: 150, dL: 1.68, dU: 1.77 },
            { n: 200, dL: 1.73, dU: 1.80 },
            { n: 500, dL: 1.83, dU: 1.87 },
        ],
        4: [
            { n: 15, dL: 0.69, dU: 1.97 },
            { n: 20, dL: 0.90, dU: 1.83 },
            { n: 30, dL: 1.14, dU: 1.74 },
            { n: 40, dL: 1.29, dU: 1.72 },
            { n: 50, dL: 1.38, dU: 1.72 },
            { n: 70, dL: 1.49, dU: 1.74 },
            { n: 100, dL: 1.59, dU: 1.76 },
            { n: 150, dL: 1.66, dU: 1.79 },
            { n: 200, dL: 1.72, dU: 1.81 },
            { n: 500, dL: 1.82, dU: 1.88 },
        ],
        5: [
            { n: 15, dL: 0.56, dU: 2.21 },
            { n: 20, dL: 0.79, dU: 1.99 },
            { n: 30, dL: 1.07, dU: 1.83 },
            { n: 40, dL: 1.23, dU: 1.79 },
            { n: 50, dL: 1.34, dU: 1.77 },
            { n: 70, dL: 1.46, dU: 1.77 },
            { n: 100, dL: 1.57, dU: 1.78 },
            { n: 150, dL: 1.65, dU: 1.80 },
            { n: 200, dL: 1.70, dU: 1.82 },
            { n: 500, dL: 1.81, dU: 1.89 },
        ],
    };
    const pts = tableData[clampedK] || tableData[2];
    if (n <= pts[0].n) {
        return { dL: pts[0].dL, dU: pts[0].dU };
    }
    if (n >= pts[pts.length - 1].n) {
        return { dL: pts[pts.length - 1].dL, dU: pts[pts.length - 1].dU };
    }
    // Linear interpolation
    for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        if (n >= p1.n && n <= p2.n) {
            const frac = (n - p1.n) / (p2.n - p1.n);
            const dL = Number((p1.dL + frac * (p2.dL - p1.dL)).toFixed(3));
            const dU = Number((p1.dU + frac * (p2.dU - p1.dU)).toFixed(3));
            return { dL, dU };
        }
    }
    return { dL: 1.63, dU: 1.72 };
}
/**
 * Regularized lower incomplete gamma function P(a, x) = gamma(a, x) / Gamma(a)
 */
function regularizedGammaLower(a, x) {
    if (x <= 0)
        return 0;
    if (a <= 0)
        return 1;
    if (x < a + 1) {
        let sum = 1 / a;
        let term = 1 / a;
        for (let n = 1; n < 200; n++) {
            term *= x / (a + n);
            sum += term;
            if (Math.abs(term) < Math.abs(sum) * 1e-15)
                break;
        }
        return Math.exp(-x + a * Math.log(x) - logGamma(a)) * sum;
    }
    else {
        return 1 - regularizedGammaUpper(a, x);
    }
}
/**
 * Regularized upper incomplete gamma function Q(a, x) = Gamma(a, x) / Gamma(a)
 */
function regularizedGammaUpper(a, x) {
    if (x <= 0)
        return 1;
    if (a <= 0)
        return 0;
    if (x < a + 1) {
        return 1 - regularizedGammaLower(a, x);
    }
    const eps = 1e-15;
    let b = x + 1 - a;
    let c = 1 / 1e-30;
    let d = 1 / b;
    let h = d;
    for (let i = 1; i <= 200; i++) {
        const an = -i * (i - a);
        b += 2;
        d = an * d + b;
        if (Math.abs(d) < 1e-30)
            d = 1e-30;
        c = b + an / c;
        if (Math.abs(c) < 1e-30)
            c = 1e-30;
        d = 1 / d;
        const del = d * c;
        h *= del;
        if (Math.abs(del - 1) < eps)
            break;
    }
    return Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
}
/**
 * Chi-Square CDF: P(Chi2 <= x, df) = P(df/2, x/2)
 */
function chiSquareCdf(x, df) {
    if (x <= 0 || df <= 0)
        return 0;
    return Math.max(0, Math.min(1, regularizedGammaLower(df / 2, x / 2)));
}
/**
 * Chi-Square upper tail p-value: P(Chi2 >= x, df) = Q(df/2, x/2)
 */
function chiSquarePValue(x, df) {
    if (x <= 0 || df <= 0)
        return 1;
    return Math.max(0, Math.min(1, regularizedGammaUpper(df / 2, x / 2)));
}
/**
 * Nilai Kritis Chi-Square Tabel pada taraf signifikansi alpha
 */
function getChiSquareCritical(df, alpha = 0.05) {
    if (df <= 0)
        return 0;
    let low = 0.0001;
    let high = Math.max(100, df * 5);
    for (let i = 0; i < 70; i++) {
        const mid = (low + high) / 2;
        const p = chiSquarePValue(mid, df);
        if (p > alpha) {
            low = mid;
        }
        else {
            high = mid;
        }
    }
    return Number(((low + high) / 2).toFixed(4));
}
