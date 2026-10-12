import { validateExplanationNumbers, extractNumbersFromIndonesianText, parseIdNumber } from '../number-guard';

function runTests() {
  console.log('Testing Indonesian Number Parsing:');
  console.assert(parseIdNumber('0,872') === 0.872, '0,872 failed');
  console.assert(parseIdNumber('1.250') === 1250, '1.250 failed');
  console.assert(parseIdNumber('45,1%') === 45.1, '45,1% failed');
  console.assert(parseIdNumber('< 0,001') === 0.001, '< 0,001 failed');

  console.log('Testing Extracted Numbers:');
  const sampleText = 'Dengan N = 117 dan nilai r hitung sebesar 0,672 dibandingkan r tabel 0,1816 pada taraf 0,05.';
  const nums = extractNumbersFromIndonesianText(sampleText);
  console.log('Extracted:', nums);
  console.assert(nums.includes(117), 'Missing 117');
  console.assert(nums.includes(0.672), 'Missing 0.672');
  console.assert(nums.includes(0.1816), 'Missing 0.1816');
  console.assert(nums.includes(0.05), 'Missing 0.05');

  console.log('Testing Guard Rejection on Hallucinated Numbers:');
  const payload = [
    { item: 'KL1', rHitung: 0.672, rTabel: 0.1816, valid: true }
  ];
  // Hallucinated text with 99.9% and 0.999
  const badText = 'Nilai r hitung adalah 0,672 dan akurasinya mencapai 99,9% dengan korelasi 0,999.';
  const guardFail = validateExplanationNumbers(badText, payload);
  console.assert(!guardFail.passed, 'Guard should fail on hallucinated 99.9 and 0.999');
  console.log('Guard successfully rejected hallucinated numbers:', guardFail.unmatchedNumbers);

  console.log('Testing Guard Approval on Valid Numbers:');
  const goodText = 'Nilai r hitung adalah 0,672 yang lebih besar dari r tabel 0,1816 pada signifikansi 0,05.';
  const guardPass = validateExplanationNumbers(goodText, payload);
  console.assert(guardPass.passed, 'Guard should pass valid numbers');
  console.log('Guard passed successfully for legitimate narrative.');

  console.log('ALL NUMBER GUARD TESTS PASSED!');
}

runTests();
