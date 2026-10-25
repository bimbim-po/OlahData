const fs = require('fs');
const path = require('path');

// Test PDF and Word export generation
const { mockResults } = require('./dist-test/mock-results-loader.js');
const { generateAcademicPdfReport } = require('./dist-test/pdf-generator.js');
const { buildWordDocumentContent, buildApaFigureHtml, buildWordTableHtml } = require('./dist-test/word-table.js');
const { calculateHistogramData, calculateNormalPPPlotData, generateHistogramSvgString, generateNormalPPPlotSvgString } = require('./dist-test/residual-charts.js');

console.log('Testing export generators...');
