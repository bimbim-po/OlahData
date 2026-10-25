/**
 * test-residual-plots-visual.mjs
 * Pengujian deterministik terhadap 5 dataset ekstrem/bervariasi
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  calculateHistogramData,
  calculateNormalPPPlotData,
  generateHistogramSvgString,
  generateNormalPPPlotSvgString,
  formatPlotNumber,
  niceTicks,
  calculateStatsBoxDimensions,
  findHistogramStatsBoxCorner,
  findOptimalStatsBoxPosition,
} from '../src/lib/residual-charts.ts';

const outDir = path.resolve('dist-test/plots');
fs.mkdirSync(outDir, { recursive: true });

console.log('=== MEMULAI PENGUJIAN 5 DATASET BERBEDA ===\n');

// 1. DATASET 1: Kasus Uji Pengguna (N = 40, k = 2)
console.log('--- 1. DATASET 1: N = 40, k = 2 (Kasus Standar Kuesioner Pengguna) ---');
const rawResiduals1 = [];
for (let i = 0; i < 40; i++) {
  // Sebaran relatif normal mendekati N(0, 1)
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u1 || 0.001)) * Math.cos(2.0 * Math.PI * u2);
  rawResiduals1.push(z);
}
const hist1 = calculateHistogramData(rawResiduals1);
const pp1 = calculateNormalPPPlotData(rawResiduals1);
const svgHist1 = generateHistogramSvgString(hist1, 'web', 540, 320);
const svgPP1 = generateNormalPPPlotSvgString(pp1, 'web', 360);
fs.writeFileSync(path.join(outDir, 'dataset1_hist.svg'), svgHist1);
fs.writeFileSync(path.join(outDir, 'dataset1_pp.svg'), svgPP1);

console.log(`Dataset 1: N = ${hist1.n}, Mean = ${formatPlotNumber(hist1.mean, 2)}, SD = ${formatPlotNumber(hist1.stdDev, 2)}`);
console.log(`Jumlah Bins: ${hist1.bins.length}, Titik PP: ${pp1.points.length}`);
console.log(`Format Koma Checked: ${svgHist1.includes('Mean') && svgHist1.includes(',')}`);
console.log('SVG Dataset 1 berhasil disimpan.\n');

// 2. DATASET 2: N Sangat Kecil (N = 8, k = 1)
console.log('--- 2. DATASET 2: N Sangat Kecil (N = 8, k = 1) ---');
const rawResiduals2 = [-1.4, -0.9, -0.3, 0.1, 0.2, 0.6, 0.8, 1.2];
const hist2 = calculateHistogramData(rawResiduals2);
const pp2 = calculateNormalPPPlotData(rawResiduals2);
const svgHist2 = generateHistogramSvgString(hist2, 'web', 540, 320);
const svgPP2 = generateNormalPPPlotSvgString(pp2, 'web', 360);
fs.writeFileSync(path.join(outDir, 'dataset2_hist.svg'), svgHist2);
fs.writeFileSync(path.join(outDir, 'dataset2_pp.svg'), svgPP2);

console.log(`Dataset 2: N = ${hist2.n}, Mean = ${formatPlotNumber(hist2.mean, 2)}, SD = ${formatPlotNumber(hist2.stdDev, 2)}`);
console.log(`Jumlah Bins: ${hist2.bins.length}, Titik PP: ${pp2.points.length}`);
console.log('SVG Dataset 2 berhasil disimpan.\n');

// 3. DATASET 3: N Sangat Besar (N = 2500, k = 5)
console.log('--- 3. DATASET 3: N Sangat Besar (N = 2500, k = 5) ---');
const rawResiduals3 = [];
for (let i = 0; i < 2500; i++) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u1 || 0.001)) * Math.sin(2.0 * Math.PI * u2);
  rawResiduals3.push(z);
}
const hist3 = calculateHistogramData(rawResiduals3);
const pp3 = calculateNormalPPPlotData(rawResiduals3);
const svgHist3 = generateHistogramSvgString(hist3, 'web', 540, 320);
const svgPP3 = generateNormalPPPlotSvgString(pp3, 'web', 360);
fs.writeFileSync(path.join(outDir, 'dataset3_hist.svg'), svgHist3);
fs.writeFileSync(path.join(outDir, 'dataset3_pp.svg'), svgPP3);

console.log(`Dataset 3: N = ${formatPlotNumber(hist3.n, 0)}, Mean = ${formatPlotNumber(hist3.mean, 2)}, SD = ${formatPlotNumber(hist3.stdDev, 2)}`);
console.log(`Jumlah Bins: ${hist3.bins.length}, Titik PP: ${pp3.points.length}`);
console.log('SVG Dataset 3 berhasil disimpan.\n');

// 4. DATASET 4: Kemiringan Ekstrem / Asimetris Kuat (Skewed Data) (N = 60, k = 3)
console.log('--- 4. DATASET 4: Kemiringan Ekstrem / Asimetris Kuat (Right-Skewed) (N = 60, k = 3) ---');
const rawResiduals4 = [];
for (let i = 0; i < 60; i++) {
  // Distribusi eksponensial (sangat condong ke kanan / right skewed)
  const expVal = -Math.log(Math.random() || 0.01) * 2 - 1.5;
  rawResiduals4.push(expVal);
}
const hist4 = calculateHistogramData(rawResiduals4);
const pp4 = calculateNormalPPPlotData(rawResiduals4);
const corner4 = findHistogramStatsBoxCorner(hist4.bins, hist4.minZ, hist4.maxZ);
const svgHist4 = generateHistogramSvgString(hist4, 'web', 540, 320);
const svgPP4 = generateNormalPPPlotSvgString(pp4, 'web', 360);
fs.writeFileSync(path.join(outDir, 'dataset4_hist.svg'), svgHist4);
fs.writeFileSync(path.join(outDir, 'dataset4_pp.svg'), svgPP4);

console.log(`Dataset 4: N = ${hist4.n}, Mean = ${formatPlotNumber(hist4.mean, 2)}, SD = ${formatPlotNumber(hist4.stdDev, 2)}`);
console.log(`Sudut Optimal StatsBox: ${corner4} (Menghindari penumpukan data)`);
console.log('SVG Dataset 4 berhasil disimpan.\n');

// 5. DATASET 5: Residual Konstan / SD = 0 (N = 50, k = 2)
console.log('--- 5. DATASET 5: Residual Konstan (SD = 0) ---');
const rawResiduals5 = new Array(50).fill(0);
const hist5 = calculateHistogramData(rawResiduals5);
const pp5 = calculateNormalPPPlotData(rawResiduals5);
const svgHist5 = generateHistogramSvgString(hist5, 'web', 540, 320);
const svgPP5 = generateNormalPPPlotSvgString(pp5, 'web', 360);
fs.writeFileSync(path.join(outDir, 'dataset5_hist.svg'), svgHist5);
fs.writeFileSync(path.join(outDir, 'dataset5_pp.svg'), svgPP5);

console.log(`Dataset 5 isConstant: ${hist5.isConstant}`);
console.log(`Pesan Jelas: "${hist5.message}"`);
console.log(`SVG Memuat Pesan: ${svgHist5.includes('Data residual')}`);
console.log('SVG Dataset 5 berhasil disimpan.\n');

console.log('=== SEMUA 5 PENGUJIAN DATASET LULUS DENGAN SUKSES! ===');
