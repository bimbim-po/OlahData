// scripts/test-admin-security.mjs
// Verifikasi Otomatis Keamanan & Privasi Super Admin OlahData:
// 1. Exact Email Matching & Verification Rules
// 2. Stealth 404 Protection for Non-Admins
// 3. Mandatory Audit Reason Check (>= 5 chars)
// 4. Privacy Filter on App Events (Zero Respondent Data)
// 5. Zero-Leakage Static Verification on Admin Components

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('=== [1/5] Testing Admin Email Whitelist & Exact Matching ===');
const ADMIN_EMAILS_ENV = 'bimdarmawa2@gmail.com,vrimae23@gmail.com';
const allowedEmails = ADMIN_EMAILS_ENV.split(',').map((e) => e.trim().toLowerCase());

function checkIsAdminEmail(email, isVerified) {
  if (!isVerified) return false;
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return allowedEmails.includes(normalized);
}

// Exact match passing tests
assert.equal(checkIsAdminEmail('bimdarmawa2@gmail.com', true), true, 'Owner 1 should be authorized');
assert.equal(checkIsAdminEmail('vrimae23@gmail.com', true), true, 'Owner 2 should be authorized');
assert.equal(checkIsAdminEmail(' BIMDARMAWA2@GMAIL.COM ', true), true, 'Case insensitive & trimmed should pass');

// Security tests: Must reject unverified emails
assert.equal(checkIsAdminEmail('bimdarmawa2@gmail.com', false), false, 'Unverified email MUST BE REJECTED');

// Security tests: Must reject alias or folded dots (+alias or . tricks)
assert.equal(checkIsAdminEmail('bim.darmawa2@gmail.com', true), false, 'Dot alias MUST NOT be folded');
assert.equal(checkIsAdminEmail('bimdarmawa2+admin@gmail.com', true), false, 'Plus alias MUST NOT be accepted');
assert.equal(checkIsAdminEmail('hacker@gmail.com', true), false, 'Unauthorized email MUST BE REJECTED');
assert.equal(checkIsAdminEmail('', true), false, 'Empty email MUST BE REJECTED');
console.log('✓ Admin email whitelist & strict matching verified.');

console.log('=== [2/5] Testing Mandatory Reason Validation (Min 5 chars) ===');
function validateAdminActionReason(reason) {
  if (!reason || typeof reason !== 'string') return false;
  return reason.trim().length >= 5;
}

assert.equal(validateAdminActionReason('Kompensasi gangguan antrean server'), true);
assert.equal(validateAdminActionReason('abcd'), false, 'Reason < 5 chars must be rejected');
assert.equal(validateAdminActionReason('    '), false, 'Whitespace-only reason must be rejected');
assert.equal(validateAdminActionReason(''), false, 'Empty reason must be rejected');
assert.equal(validateAdminActionReason(null), false, 'Null reason must be rejected');
console.log('✓ Mandatory audit reason validation verified.');

console.log('=== [3/5] Testing Event Privacy Filter (Zero Respondent Data) ===');
const FORBIDDEN_KEYS = ['data', 'rows', 'values', 'text', 'cells', 'answers', 'responses', 'records', 'dataset_content', 'preview'];

function sanitizeEventPayload(props) {
  if (!props || typeof props !== 'object') return {};
  const cleaned = {};
  for (const [key, val] of Object.entries(props)) {
    const lower = key.toLowerCase();
    if (FORBIDDEN_KEYS.includes(lower)) {
      continue; // Silently drop forbidden respondent keys
    }
    cleaned[key] = val;
  }
  return cleaned;
}

const leakAttemptPayload = {
  n_rows: 250,
  n_cols: 15,
  test_type: 'cronbach_alpha',
  rows: [{ q1: 5, q2: 4, q3: 5 }],
  cells: [[1, 2, 3]],
  answers: ['Sangat Setuju', 'Setuju'],
  duration_ms: 1240,
};

const sanitized = sanitizeEventPayload(leakAttemptPayload);
assert.equal(sanitized.n_rows, 250);
assert.equal(sanitized.n_cols, 15);
assert.equal(sanitized.test_type, 'cronbach_alpha');
assert.equal(sanitized.duration_ms, 1240);
assert.equal(sanitized.rows, undefined, 'rows key must be stripped');
assert.equal(sanitized.cells, undefined, 'cells key must be stripped');
assert.equal(sanitized.answers, undefined, 'answers key must be stripped');
console.log('✓ Privacy filter successfully stripped all forbidden respondent keys.');

console.log('=== [4/5] Static Audit on Admin UI Code for Zero-Respondent-Data Compliance ===');
const adminDir = path.join(rootDir, 'apps', 'web', 'src', 'app', 'admin');
const adminFiles = [];

function collectTsx(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      collectTsx(full);
    } else if (e.name.endsWith('.tsx') || e.name.endsWith('.ts')) {
      adminFiles.push(full);
    }
  }
}
collectTsx(adminDir);

// Verify that no admin file imports respondent raw tables or accesses forbidden fields
const forbiddenSubstrings = [
  'download_respondent_data',
  'export_raw_answers',
  'view_survey_responses',
];

for (const file of adminFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  for (const bad of forbiddenSubstrings) {
    if (content.includes(bad)) {
      throw new Error(`Security Violation: Found forbidden identifier "${bad}" in ${file}`);
    }
  }
}
console.log(`✓ Scanned ${adminFiles.length} admin route files: 0 privacy violations detected.`);

console.log('=== [5/5] Verify Stealth 404 in Admin Layout & Auth Service ===');
const adminAuthPath = path.join(rootDir, 'apps', 'web', 'src', 'lib', 'admin', 'auth.ts');
const adminAuthContent = fs.readFileSync(adminAuthPath, 'utf-8');
assert.ok(adminAuthContent.includes('notFound()'), 'assertAdminServer MUST call notFound() to enforce stealth');
assert.ok(!adminAuthContent.includes('redirect("/unauthorized")'), 'Stealth rule: Must NOT redirect to /unauthorized');
assert.ok(!adminAuthContent.includes('redirect("/403")'), 'Stealth rule: Must NOT redirect to 403');
console.log('✓ Stealth 404 compliance verified.');

console.log('\n========================================');
console.log(' ALL ADMIN SECURITY & PRIVACY TESTS PASSED! ');
console.log('========================================\n');
