"use strict";
/**
 * Modul Kalkulasi Residual Dinamis, Kurva Normal, dan Normal P-P Plot
 * Sesuai Standar Metodologi Akademik & Konvensi IBM SPSS Statistics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.erf = erf;
exports.standardNormalCdf = standardNormalCdf;
exports.standardNormalPdf = standardNormalPdf;
exports.calculateStandardizedResiduals = calculateStandardizedResiduals;
exports.calculateHistogramData = calculateHistogramData;
exports.calculateNormalPPPlotData = calculateNormalPPPlotData;
exports.generateHistogramSvgString = generateHistogramSvgString;
exports.generateNormalPPPlotSvgString = generateNormalPPPlotSvgString;
exports.convertSvgToPngBase64 = convertSvgToPngBase64;
/**
 * Fungsi Error (erf) menggunakan aproksimasi rasional presisi tinggi (Abramowitz & Stegun 7.1.26)
 * Galat absolut |epsilon(x)| < 1.5e-7 di seluruh rentang bilangan riil.
 */
function erf(x) {
    if (isNaN(x))
        return 0;
    const sign = x >= 0 ? 1 : -1;
    const absX = Math.abs(x);
    // Koefisien polinomial Abramowitz & Stegun
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 -
        ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
    return sign * y;
}
/**
 * Fungsi Kumulatif Distribusi Normal Baku (Standard Normal CDF: Phi(z))
 * Phi(z) = 0.5 * (1 + erf(z / sqrt(2)))
 */
function standardNormalCdf(z) {
    if (isNaN(z))
        return 0.5;
    if (z < -8)
        return 0;
    if (z > 8)
        return 1;
    return 0.5 * (1.0 + erf(z / Math.SQRT2));
}
/**
 * Fungsi Kepadatan Probabilitas Normal Baku (Standard Normal PDF: phi(z))
 * phi(z) = (1 / sqrt(2 * pi)) * exp(-z^2 / 2)
 */
function standardNormalPdf(z) {
    if (isNaN(z))
        return 0;
    return (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z);
}
/**
 * Menghitung Standardized Residuals (Z_resid) persis sesuai konvensi IBM SPSS Statistics.
 *
 * DEFINISI SPSS:
 * Z_resid = e_i / sqrt(MSE)
 * di mana e_i = y_i - y_pred_i (unstandardized residual),
 * dan MSE = SSE / (N - k - 1) adalah Mean Squared Error dari model OLS
 * (dengan k = jumlah variabel independen).
 */
function calculateStandardizedResiduals(residuals, k = 1, nInput) {
    const n = nInput || residuals.length;
    if (n === 0)
        return [];
    // Hitung Sum of Squared Errors (SSE)
    let sse = 0;
    for (let i = 0; i < n; i++) {
        const r = Number(residuals[i]) || 0;
        sse += r * r;
    }
    const dfRes = Math.max(1, n - k - 1);
    const mse = sse / dfRes;
    const sqrtMse = Math.sqrt(mse);
    if (sqrtMse <= 1e-12) {
        return residuals.map(() => 0);
    }
    return residuals.map((r) => Number((r / sqrtMse).toFixed(6)));
}
/**
 * Menghitung kuartil data untuk aturan Freedman-Diaconis
 */
function calculateQuantiles(sortedValues) {
    const n = sortedValues.length;
    if (n === 0)
        return { q1: 0, q3: 0, iqr: 0 };
    if (n === 1)
        return { q1: sortedValues[0], q3: sortedValues[0], iqr: 0 };
    const getPercentile = (p) => {
        const idx = (n - 1) * p;
        const lower = Math.floor(idx);
        const upper = Math.ceil(idx);
        const weight = idx - lower;
        return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
    };
    const q1 = getPercentile(0.25);
    const q3 = getPercentile(0.75);
    const iqr = Math.max(0, q3 - q1);
    return { q1, q3, iqr };
}
/**
 * Kalkulasi Data Histogram Residual dan Kurva Normal Teoretis (Gambar 4.1)
 *
 * Bins Otomatis:
 * 1. Aturan Freedman-Diaconis: binWidth = 2 * IQR(Z_resid) / (N^(1/3))
 * 2. Jika IQR = 0 atau N < 30: Gunakan Sturges: numBins = ceil(log2(N) + 1)
 * 3. Batasi numBins antara 5 dan 30 (SPSS standard view).
 * 4. Kurva Normal Teoretis Terskala:
 *    y(x) = N * binWidth * phi((x - mean) / sd) / sd
 */
function calculateHistogramData(zResiduals) {
    const validZ = (zResiduals || []).filter((v) => typeof v === 'number' && !isNaN(v));
    const n = validZ.length;
    if (n < 3) {
        return {
            bins: [],
            curvePoints: [],
            binWidth: 1,
            numBins: 5,
            minZ: -2,
            maxZ: 2,
            mean: 0,
            stdDev: 1,
            n,
            maxFreq: 0,
            maxCurveY: 0,
            yAxisMax: 5,
            isConstant: true,
            message: 'Jumlah sampel terlalu sedikit (N < 3) untuk menghasilkan histogram residual.',
        };
    }
    // Hitung Mean & Standar Deviasi Sampel
    let sum = 0;
    for (let i = 0; i < n; i++)
        sum += validZ[i];
    const mean = sum / n;
    let ss = 0;
    for (let i = 0; i < n; i++)
        ss += (validZ[i] - mean) ** 2;
    const variance = ss / Math.max(1, n - 1);
    const stdDev = Math.sqrt(variance);
    const sortedZ = [...validZ].sort((a, b) => a - b);
    const rawMinZ = sortedZ[0];
    const rawMaxZ = sortedZ[n - 1];
    // Kasus Tepi: Seluruh residual bernilai sama (SD = 0)
    if (stdDev <= 1e-9 || Math.abs(rawMaxZ - rawMinZ) <= 1e-9) {
        const center = mean;
        return {
            bins: [
                {
                    binIndex: 0,
                    x0: center - 0.5,
                    x1: center + 0.5,
                    midpoint: center,
                    count: n,
                },
            ],
            curvePoints: [],
            binWidth: 1,
            numBins: 1,
            minZ: center - 2,
            maxZ: center + 2,
            mean: Number(mean.toFixed(4)),
            stdDev: 0,
            n,
            maxFreq: n,
            maxCurveY: n,
            yAxisMax: Math.ceil(n * 1.2),
            isConstant: true,
            message: 'Seluruh residual bernilai konstan (varians = 0).',
        };
    }
    // Penentuan Bins: Freedman-Diaconis vs Sturges
    const { iqr } = calculateQuantiles(sortedZ);
    let numBins;
    let binWidth;
    if (iqr <= 1e-9 || n < 30) {
        // Sturges Rule
        numBins = Math.ceil(Math.log2(n) + 1);
    }
    else {
        // Freedman-Diaconis Rule: binWidth = 2 * IQR / N^(1/3)
        const fdWidth = (2.0 * iqr) / Math.cbrt(n);
        if (fdWidth > 1e-6) {
            numBins = Math.ceil((rawMaxZ - rawMinZ) / fdWidth);
        }
        else {
            numBins = Math.ceil(Math.log2(n) + 1);
        }
    }
    // Batasi jumlah bins antara 5 dan 30
    numBins = Math.max(5, Math.min(30, numBins));
    // Berikan sedikit padding pada batas min & max agar batang tepi tidak menempel pada sumbu
    const range = rawMaxZ - rawMinZ;
    const padding = range * 0.05;
    const startX = rawMinZ - padding;
    const endX = rawMaxZ + padding;
    binWidth = (endX - startX) / numBins;
    // Hitung frekuensi riil per bin
    const bins = Array.from({ length: numBins }, (_, i) => {
        const x0 = startX + i * binWidth;
        const x1 = x0 + binWidth;
        return {
            binIndex: i,
            x0,
            x1,
            midpoint: (x0 + x1) / 2,
            count: 0,
        };
    });
    for (let i = 0; i < n; i++) {
        const val = sortedZ[i];
        let placed = false;
        for (let b = 0; b < numBins; b++) {
            // Bin terakhir bersifat inklusif terhadap batas atas
            if (b === numBins - 1) {
                if (val >= bins[b].x0 && val <= bins[b].x1 + 1e-9) {
                    bins[b].count++;
                    placed = true;
                    break;
                }
            }
            else {
                if (val >= bins[b].x0 && val < bins[b].x1) {
                    bins[b].count++;
                    placed = true;
                    break;
                }
            }
        }
        if (!placed) {
            // Fallback batas toleransi pembulatan
            if (val >= bins[numBins - 1].x1)
                bins[numBins - 1].count++;
            else if (val <= bins[0].x0)
                bins[0].count++;
        }
    }
    let maxFreq = 0;
    for (const b of bins) {
        if (b.count > maxFreq)
            maxFreq = b.count;
    }
    // Hitung Titik-Titik Kurva Normal Teoretis Terskala
    // y(x) = N * binWidth * phi((x - mean) / sd) / sd
    const curvePoints = [];
    const curveSteps = 100;
    const curveStartX = Math.min(startX, mean - 3.5 * stdDev);
    const curveEndX = Math.max(endX, mean + 3.5 * stdDev);
    const curveStepSize = (curveEndX - curveStartX) / curveSteps;
    let maxCurveY = 0;
    for (let i = 0; i <= curveSteps; i++) {
        const x = curveStartX + i * curveStepSize;
        const z = (x - mean) / stdDev;
        const density = standardNormalPdf(z) / stdDev;
        const y = n * binWidth * density;
        curvePoints.push({ x, y });
        if (y > maxCurveY)
            maxCurveY = y;
    }
    const yAxisMax = Math.ceil(Math.max(maxFreq, maxCurveY) * 1.15);
    return {
        bins,
        curvePoints,
        binWidth,
        numBins,
        minZ: curveStartX,
        maxZ: curveEndX,
        mean: Number(mean.toFixed(4)),
        stdDev: Number(stdDev.toFixed(4)),
        n,
        maxFreq,
        maxCurveY,
        yAxisMax: Math.max(yAxisMax, 1),
        isConstant: false,
    };
}
/**
 * Kalkulasi Data Normal P-P Plot of Regression Standardized Residual (Gambar 4.2)
 *
 * Sumbu X: P_i = (i - 0.5) / N  (Observed Cumulative Probability, konvensi SPSS Blom/Hazen)
 * Sumbu Y: Phi(z_i)            (Expected Cumulative Probability)
 * di mana z_i = (e_(i) - mean) / sd dari residual terurut menaik.
 * Garis Referensi: Diagonal 45 derajat dari (0,0) ke (1,1).
 */
function calculateNormalPPPlotData(residuals) {
    const validRes = (residuals || []).filter((v) => typeof v === 'number' && !isNaN(v));
    const n = validRes.length;
    if (n < 3) {
        return {
            points: [],
            n,
            mean: 0,
            stdDev: 1,
            isConstant: true,
            message: 'Jumlah sampel terlalu sedikit (N < 3) untuk menghasilkan Normal P-P Plot.',
        };
    }
    // Hitung Mean & Standar Deviasi
    let sum = 0;
    for (let i = 0; i < n; i++)
        sum += validRes[i];
    const mean = sum / n;
    let ss = 0;
    for (let i = 0; i < n; i++)
        ss += (validRes[i] - mean) ** 2;
    const variance = ss / Math.max(1, n - 1);
    const stdDev = Math.sqrt(variance);
    // Urutkan residual dari terkecil ke terbesar e_(1) <= e_(2) <= ... <= e_(N)
    const sortedRes = [...validRes].sort((a, b) => a - b);
    if (stdDev <= 1e-9) {
        return {
            points: sortedRes.map((r, idx) => ({
                index: idx + 1,
                observedResidual: r,
                zScore: 0,
                pObserved: (idx + 1 - 0.5) / n,
                pExpected: 0.5,
            })),
            n,
            mean: Number(mean.toFixed(4)),
            stdDev: 0,
            isConstant: true,
            message: 'Seluruh residual bernilai identik.',
        };
    }
    // Bentuk tepat N titik
    const points = sortedRes.map((resVal, idx) => {
        const i = idx + 1; // 1-based index
        const pObserved = (i - 0.5) / n; // Sumbu X: Observed Cum. Prob.
        const zScore = (resVal - mean) / stdDev;
        const pExpected = standardNormalCdf(zScore); // Sumbu Y: Expected Cum. Prob.
        return {
            index: i,
            observedResidual: Number(resVal.toFixed(6)),
            zScore: Number(zScore.toFixed(6)),
            pObserved: Number(pObserved.toFixed(6)),
            pExpected: Number(pExpected.toFixed(6)),
        };
    });
    return {
        points,
        n,
        mean: Number(mean.toFixed(4)),
        stdDev: Number(stdDev.toFixed(4)),
        isConstant: false,
    };
}
/**
 * Menghasilkan SVG String Murni untuk Gambar 4.1: Histogram Residual & Kurva Normal
 * Mendukung mode 'web' (warna tema aplikasi) dan 'print' (latar putih solid, teks hitam, kontras tinggi).
 */
function generateHistogramSvgString(data, theme = 'web', width = 600, height = 380) {
    if (data.isConstant || data.bins.length === 0) {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="${theme === 'print' ? '#FFFFFF' : '#F9FAFB'}"/>
      <text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#6B7280">
        ${data.message || 'Data residual tidak bervariasi.'}
      </text>
    </svg>`;
    }
    const marginLeft = 60;
    const marginRight = 35;
    const marginTop = 35;
    const marginBottom = 65;
    const plotWidth = width - marginLeft - marginRight;
    const plotHeight = height - marginTop - marginBottom;
    const minX = data.minZ;
    const maxX = data.maxZ;
    const maxY = data.yAxisMax;
    const scaleX = (x) => marginLeft + ((x - minX) / (maxX - minX)) * plotWidth;
    const scaleY = (y) => marginTop + plotHeight - (y / maxY) * plotHeight;
    // Warna sesuai tema
    const bgColor = theme === 'print' ? '#FFFFFF' : 'transparent';
    const axisColor = theme === 'print' ? '#000000' : '#4B5563';
    const textColor = theme === 'print' ? '#000000' : '#374151';
    const barFill = theme === 'print' ? '#D1D5DB' : 'rgba(20, 71, 54, 0.45)';
    const barStroke = theme === 'print' ? '#111827' : '#144736';
    const curveColor = theme === 'print' ? '#000000' : '#EA580C';
    const gridColor = theme === 'print' ? '#E5E7EB' : 'rgba(156, 163, 175, 0.2)';
    // Sumbu & Grid Y (4-5 ticks)
    const yTicks = [];
    const numYTicks = 5;
    for (let i = 0; i <= numYTicks; i++) {
        yTicks.push(Math.round((maxY / numYTicks) * i));
    }
    let yGridSvg = '';
    yTicks.forEach((tickVal) => {
        const yPos = scaleY(tickVal);
        yGridSvg += `<line x1="${marginLeft}" y1="${yPos}" x2="${marginLeft + plotWidth}" y2="${yPos}" stroke="${gridColor}" stroke-width="1"/>`;
        yGridSvg += `<text x="${marginLeft - 8}" y="${yPos + 4}" text-anchor="end" font-family="Arial, sans-serif" font-size="11" fill="${textColor}">${tickVal}</text>`;
    });
    // Gambar Batang Histogram
    let barsSvg = '';
    data.bins.forEach((bin) => {
        const xLeft = scaleX(bin.x0);
        const xRight = scaleX(bin.x1);
        const barW = Math.max(1, xRight - xLeft - 1);
        const barH = (bin.count / maxY) * plotHeight;
        const yTop = scaleY(bin.count);
        barsSvg += `<rect x="${xLeft}" y="${yTop}" width="${barW}" height="${barH}" fill="${barFill}" stroke="${barStroke}" stroke-width="1"/>`;
    });
    // Sumbu X Ticks (integer/desimal bulat)
    const xSpan = maxX - minX;
    const xStep = xSpan > 6 ? 2 : 1;
    const startTick = Math.ceil(minX / xStep) * xStep;
    let xTicksSvg = '';
    for (let t = startTick; t <= maxX; t += xStep) {
        const xPos = scaleX(t);
        xTicksSvg += `<line x1="${xPos}" y1="${marginTop + plotHeight}" x2="${xPos}" y2="${marginTop + plotHeight + 5}" stroke="${axisColor}" stroke-width="1"/>`;
        xTicksSvg += `<text x="${xPos}" y="${marginTop + plotHeight + 18}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="${textColor}">${t.toFixed(0)}</text>`;
    }
    // Kurva Normal Teoretis
    let curvePathD = '';
    data.curvePoints.forEach((pt, idx) => {
        const cx = scaleX(pt.x);
        const cy = scaleY(pt.y);
        if (idx === 0) {
            curvePathD += `M ${cx.toFixed(2)} ${cy.toFixed(2)}`;
        }
        else {
            curvePathD += ` L ${cx.toFixed(2)} ${cy.toFixed(2)}`;
        }
    });
    const curveSvg = `<path d="${curvePathD}" fill="none" stroke="${curveColor}" stroke-width="2.5" stroke-linecap="round"/>`;
    // Legenda / Statistik Ringkasan
    const legendBox = `
    <g transform="translate(${width - marginRight - 165}, ${marginTop + 8})">
      <rect width="160" height="58" fill="${theme === 'print' ? '#FFFFFF' : 'rgba(255,255,255,0.95)'}" stroke="${axisColor}" stroke-width="1" rx="4"/>
      <text x="10" y="16" font-family="Arial, sans-serif" font-size="10.5" font-weight="bold" fill="${textColor}">Regression Residual</text>
      <text x="10" y="32" font-family="Courier New, monospace" font-size="10" fill="${textColor}">Mean = ${data.mean.toFixed(2)}</text>
      <text x="10" y="46" font-family="Courier New, monospace" font-size="10" fill="${textColor}">Std. Dev. = ${data.stdDev.toFixed(2)}</text>
      <text x="100" y="46" font-family="Courier New, monospace" font-size="10" fill="${textColor}">N = ${data.n}</text>
    </g>
  `;
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: ${bgColor}; font-family: Arial, sans-serif;">
      ${yGridSvg}
      ${barsSvg}
      ${curveSvg}
      <!-- Sumbu X & Y Utama -->
      <line x1="${marginLeft}" y1="${marginTop}" x2="${marginLeft}" y2="${marginTop + plotHeight}" stroke="${axisColor}" stroke-width="1.5"/>
      <line x1="${marginLeft}" y1="${marginTop + plotHeight}" x2="${marginLeft + plotWidth}" y2="${marginTop + plotHeight}" stroke="${axisColor}" stroke-width="1.5"/>
      ${xTicksSvg}
      <!-- Label Sumbu -->
      <text x="${marginLeft + plotWidth / 2}" y="${height - 15}" text-anchor="middle" font-size="12" font-weight="600" fill="${textColor}">Regression Standardized Residual</text>
      <text transform="rotate(-90)" x="${-(marginTop + plotHeight / 2)}" y="20" text-anchor="middle" font-size="12" font-weight="600" fill="${textColor}">Frequency</text>
      ${legendBox}
    </svg>
  `.trim();
}
/**
 * Menghasilkan SVG String Murni untuk Gambar 4.2: Normal P-P Plot of Regression Residual
 * - Tepat N titik
 * - Sumbu X: Observed Cum Prob (0 s/d 1)
 * - Sumbu Y: Expected Cum Prob (0 s/d 1)
 * - Garis diagonal referensi 45 derajat (0,0) -> (1,1)
 * - Rasio aspek 1:1 untuk area plotting
 */
function generateNormalPPPlotSvgString(data, theme = 'web', size = 420) {
    const width = size;
    const height = size;
    if (data.isConstant || data.points.length === 0) {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="${theme === 'print' ? '#FFFFFF' : '#F9FAFB'}"/>
      <text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#6B7280">
        ${data.message || 'Data residual tidak bervariasi.'}
      </text>
    </svg>`;
    }
    const marginLeft = 65;
    const marginRight = 35;
    const marginTop = 35;
    const marginBottom = 65;
    const plotSize = Math.min(width - marginLeft - marginRight, height - marginTop - marginBottom);
    const scaleX = (p) => marginLeft + p * plotSize;
    const scaleY = (p) => marginTop + plotSize - p * plotSize;
    const bgColor = theme === 'print' ? '#FFFFFF' : 'transparent';
    const axisColor = theme === 'print' ? '#000000' : '#4B5563';
    const textColor = theme === 'print' ? '#000000' : '#374151';
    const diagonalColor = theme === 'print' ? '#000000' : '#EA580C';
    const pointFill = theme === 'print' ? '#FFFFFF' : '#144736';
    const pointStroke = theme === 'print' ? '#000000' : '#0B2B21';
    const gridColor = theme === 'print' ? '#E5E7EB' : 'rgba(156, 163, 175, 0.2)';
    // Ticks 0, 0.2, 0.4, 0.6, 0.8, 1.0
    const ticks = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0];
    let gridSvg = '';
    let xTicksSvg = '';
    let yTicksSvg = '';
    ticks.forEach((t) => {
        const x = scaleX(t);
        const y = scaleY(t);
        gridSvg += `<line x1="${x}" y1="${marginTop}" x2="${x}" y2="${marginTop + plotSize}" stroke="${gridColor}" stroke-width="1"/>`;
        gridSvg += `<line x1="${marginLeft}" y1="${y}" x2="${marginLeft + plotSize}" y2="${y}" stroke="${gridColor}" stroke-width="1"/>`;
        // Format tick: 0; 0,2; 0,4; ...
        const label = t === 0 ? '0' : t === 1 ? '1,0' : t.toFixed(1).replace('.', ',');
        xTicksSvg += `<line x1="${x}" y1="${marginTop + plotSize}" x2="${x}" y2="${marginTop + plotSize + 5}" stroke="${axisColor}" stroke-width="1"/>`;
        xTicksSvg += `<text x="${x}" y="${marginTop + plotSize + 18}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="${textColor}">${label}</text>`;
        yTicksSvg += `<line x1="${marginLeft - 5}" y1="${y}" x2="${marginLeft}" y2="${y}" stroke="${axisColor}" stroke-width="1"/>`;
        yTicksSvg += `<text x="${marginLeft - 8}" y="${y + 4}" text-anchor="end" font-family="Arial, sans-serif" font-size="11" fill="${textColor}">${label}</text>`;
    });
    // Garis Diagonal 45 Derajat (0,0) -> (1,1)
    const x0 = scaleX(0);
    const y0 = scaleY(0);
    const x1 = scaleX(1);
    const y1 = scaleY(1);
    const diagonalLine = `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${diagonalColor}" stroke-width="2" stroke-dasharray="4,3"/>`;
    // Plot tepat N titik
    let pointsSvg = '';
    data.points.forEach((pt) => {
        const cx = scaleX(pt.pObserved);
        const cy = scaleY(pt.pExpected);
        pointsSvg += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="3" fill="${pointFill}" stroke="${pointStroke}" stroke-width="1.2"/>`;
    });
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: ${bgColor}; font-family: Arial, sans-serif;">
      ${gridSvg}
      ${diagonalLine}
      <!-- Sumbu X & Y Utama -->
      <line x1="${marginLeft}" y1="${marginTop}" x2="${marginLeft}" y2="${marginTop + plotSize}" stroke="${axisColor}" stroke-width="1.5"/>
      <line x1="${marginLeft}" y1="${marginTop + plotSize}" x2="${marginLeft + plotSize}" y2="${marginTop + plotSize}" stroke="${axisColor}" stroke-width="1.5"/>
      <line x1="${marginLeft + plotSize}" y1="${marginTop}" x2="${marginLeft + plotSize}" y2="${marginTop + plotSize}" stroke="${axisColor}" stroke-width="1" stroke-dasharray="2,2"/>
      <line x1="${marginLeft}" y1="${marginTop}" x2="${marginLeft + plotSize}" y2="${marginTop}" stroke="${axisColor}" stroke-width="1" stroke-dasharray="2,2"/>
      ${xTicksSvg}
      ${yTicksSvg}
      ${pointsSvg}
      <!-- Label Sumbu -->
      <text x="${marginLeft + plotSize / 2}" y="${height - 18}" text-anchor="middle" font-size="11.5" font-weight="600" fill="${textColor}">Observed Cum Prob</text>
      <text transform="rotate(-90)" x="${-(marginTop + plotSize / 2)}" y="18" text-anchor="middle" font-size="11.5" font-weight="600" fill="${textColor}">Expected Cum Prob</text>
    </svg>
  `.trim();
}
/**
 * Konversi SVG String menjadi PNG Base64 Data URL beresolusi tinggi (min. 2x DPI)
 * Menggunakan Canvas Offscreen di lingkungan peramban.
 */
function convertSvgToPngBase64(svgString, width, height, scale = 2) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        // Di Node / SSR environment, kembalikan data URI SVG sebagai fallback aman
        const encoded = Buffer.from(svgString).toString('base64');
        return Promise.resolve(`data:image/svg+xml;base64,${encoded}`);
    }
    return new Promise((resolve) => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = width * scale;
            canvas.height = height * scale;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                const encoded = btoa(unescape(encodeURIComponent(svgString)));
                return resolve(`data:image/svg+xml;base64,${encoded}`);
            }
            ctx.scale(scale, scale);
            // Gambar latar putih solid agar tidak transparan saat dicetak
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            const img = new Image();
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            img.onload = () => {
                try {
                    ctx.drawImage(img, 0, 0, width, height);
                    URL.revokeObjectURL(url);
                    const pngDataUrl = canvas.toDataURL('image/png');
                    resolve(pngDataUrl);
                }
                catch {
                    URL.revokeObjectURL(url);
                    const encoded = btoa(unescape(encodeURIComponent(svgString)));
                    resolve(`data:image/svg+xml;base64,${encoded}`);
                }
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                const encoded = btoa(unescape(encodeURIComponent(svgString)));
                resolve(`data:image/svg+xml;base64,${encoded}`);
            };
            img.src = url;
        }
        catch {
            const encoded = btoa(unescape(encodeURIComponent(svgString)));
            resolve(`data:image/svg+xml;base64,${encoded}`);
        }
    });
}
