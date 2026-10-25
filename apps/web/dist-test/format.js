"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatNumber = formatNumber;
exports.formatPValue = formatPValue;
exports.getSignificanceLabel = getSignificanceLabel;
exports.formatCurrency = formatCurrency;
exports.formatPercent = formatPercent;
exports.formatDate = formatDate;
exports.formatDateTime = formatDateTime;
const idFormatter = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
});
const idCurrencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});
const idPercentFormatter = new Intl.NumberFormat('id-ID', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});
function formatNumber(value, decimals) {
    if (decimals !== undefined) {
        return new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(value);
    }
    return idFormatter.format(value);
}
/**
 * Format p-value / Sig. sesuai standar baku akademik APA 7th:
 * Jika p < 0,001, wajib ditampilkan sebagai "< 0,001" (bukan "0,000").
 */
function formatPValue(pValue, decimals = 3) {
    if (pValue < 0.001) {
        return '< 0,001';
    }
    return formatNumber(pValue, decimals);
}
/**
 * Satu fungsi tunggal untuk menurunkan label kesimpulan signifikansi statistik.
 * Aturan baku:
 * 1. Konstanta regresi BUKAN hipotesis penelitian -> diberi label '—'.
 * 2. Variabel bebas: p < alpha -> 'Signifikan', p >= alpha -> 'Tidak signifikan'.
 */
function getSignificanceLabel(pValue, alpha = 0.05, isConstant = false) {
    if (isConstant) {
        return '—';
    }
    return pValue < alpha ? 'Signifikan' : 'Tidak signifikan';
}
function formatCurrency(value) {
    return idCurrencyFormatter.format(value).replace('IDR', 'Rp').trim();
}
function formatPercent(value) {
    return idPercentFormatter.format(value);
}
function formatDate(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(d);
}
function formatDateTime(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
}
