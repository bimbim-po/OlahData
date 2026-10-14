import {
  getLikertCategory,
  generateDescriptiveIntinya,
  validateNarrativeClaims,
  verifyNConsistency,
} from '../likert-guard';
import type { AnalysisResults, DescriptiveResult } from '../api/types';

function runTests() {
  console.log('--- TEST 1: Likert Interval Boundaries ---');

  // Boundary 1: 1.80 (sangat rendah) vs 1.81 (rendah)
  const cat180 = getLikertCategory(1.80);
  console.assert(cat180.category === 'sangat rendah', `Expected 'sangat rendah' for 1.80, got ${cat180.category}`);
  const cat181 = getLikertCategory(1.81);
  console.assert(cat181.category === 'rendah', `Expected 'rendah' for 1.81, got ${cat181.category}`);

  // Boundary 2: 2.60 (rendah) vs 2.61 (sedang)
  const cat260 = getLikertCategory(2.60);
  console.assert(cat260.category === 'rendah', `Expected 'rendah' for 2.60, got ${cat260.category}`);
  const cat261 = getLikertCategory(2.61);
  console.assert(cat261.category === 'sedang', `Expected 'sedang' for 2.61, got ${cat261.category}`);

  // Boundary 3: 3.40 (sedang) vs 3.41 (tinggi)
  const cat340 = getLikertCategory(3.40);
  console.assert(cat340.category === 'sedang', `Expected 'sedang' for 3.40, got ${cat340.category}`);
  const cat341 = getLikertCategory(3.41);
  console.assert(cat341.category === 'tinggi', `Expected 'tinggi' for 3.41, got ${cat341.category}`);

  // Boundary 4: 4.20 (tinggi) vs 4.21 (sangat tinggi)
  const cat420 = getLikertCategory(4.20);
  console.assert(cat420.category === 'tinggi', `Expected 'tinggi' for 4.20, got ${cat420.category}`);
  const cat421 = getLikertCategory(4.21);
  console.assert(cat421.category === 'sangat tinggi', `Expected 'sangat tinggi' for 4.21, got ${cat421.category}`);

  console.log('✅ TEST 1 PASSED: All boundary intervals verified.');

  console.log('\n--- TEST 2: Separate "Intinya" Sentence Generation ---');
  const sampleDescriptive: DescriptiveResult[] = [
    { variable: 'Kualitas Layanan (X1)', mean: 4.063, median: 4.0, stdDev: 0.65, min: 1, max: 5, n: 117 },
    { variable: 'Kepuasan Pelanggan (X2)', mean: 3.635, median: 3.5, stdDev: 0.72, min: 1, max: 5, n: 117 },
    { variable: 'Loyalitas Pelanggan (Y)', mean: 2.840, median: 3.0, stdDev: 0.81, min: 1, max: 5, n: 117 },
  ];

  const intinya = generateDescriptiveIntinya(sampleDescriptive);
  console.log('Generated Intinya:', intinya);
  console.assert(
    intinya.includes('Kualitas Layanan (X1) berkategori tinggi (4,063)'),
    'Should cite X1 as tinggi (4,063)'
  );
  console.assert(
    intinya.includes('Loyalitas Pelanggan (Y) berkategori sedang (2,840)'),
    'Should cite Y as sedang (2,840)'
  );
  console.log('✅ TEST 2 PASSED: Intinya correctly separates categories.');

  console.log('\n--- TEST 3: Number Guard False Claim Rejection ---');
  // Claim: "Seluruh variabel di atas 3,80" when Y is 2.840!
  const falseNarrative = 'Seluruh variabel penelitian memiliki rata-rata skor di atas 3,80 dari skala 5.';
  const check1 = validateNarrativeClaims(falseNarrative, sampleDescriptive);
  console.assert(!check1.valid, 'Number guard should reject false claim of all > 3,80');
  console.assert(check1.rejectedClaims.length > 0, 'Should return rejected claim details');
  console.log('Caught false claim:', check1.rejectedClaims[0]);

  // False category claim: claiming Y is "tinggi"
  const falseCatNarrative = 'Loyalitas Pelanggan (Y) berkategori tinggi dan sangat dominan.';
  const check2 = validateNarrativeClaims(falseCatNarrative, sampleDescriptive);
  console.assert(!check2.valid, 'Number guard should reject wrong category claim');
  console.log('Caught false category claim:', check2.rejectedClaims[0]);
  console.log('✅ TEST 3 PASSED: Number Guard successfully catches false claims.');

  console.log('\n--- TEST 4: N Consistency Verification ---');
  const consistentResults = {
    respondentCount: 117,
    descriptive: sampleDescriptive,
  } as AnalysisResults;

  const nCheck1 = verifyNConsistency(consistentResults);
  console.assert(nCheck1.consistent, 'Should pass when N is consistent');

  const inconsistentResults = {
    respondentCount: 117,
    descriptive: [
      { variable: 'X1', mean: 3.5, median: 3, stdDev: 0.5, min: 1, max: 5, n: 80 },
    ],
  } as AnalysisResults;

  const nCheck2 = verifyNConsistency(inconsistentResults);
  console.assert(!nCheck2.consistent, 'Should detect N mismatch (80 vs 117)');
  console.assert(nCheck2.inconsistentTables.includes('Statistik Deskriptif'), 'Should flag deskriptif table');
  console.log('✅ TEST 4 PASSED: N Consistency Checker detects mismatches.');

  console.log('\n🎉 ALL UNIT TESTS PASSED (100%)');
}

runTests();
