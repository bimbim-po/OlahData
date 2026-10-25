import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const webDir = path.join(rootDir, 'apps', 'web');
const srcDir = path.join(webDir, 'src');
const outDir = path.join(webDir, 'out');

console.log('================================================================');
console.log('🔍 CI TEXT & PLACEHOLDER GUARD: OLAHDATA CONTENT VERIFICATION');
console.log('================================================================\n');

let violations = [];

// 1. Scan Source Files
function scanSourceFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relPath = path.relative(rootDir, filePath);
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Guard: [ISI
    if (/\[ISI/i.test(line) && !line.includes('[isInteractive') && !line.includes('isIntersecting')) {
      violations.push({
        file: relPath,
        line: lineNum,
        type: 'PLACEHOLDER_ISI',
        text: line.trim(),
      });
    }

    // Guard: [TODO]
    if (/\[TODO\]/i.test(line)) {
      violations.push({
        file: relPath,
        line: lineNum,
        type: 'PLACEHOLDER_TODO',
        text: line.trim(),
      });
    }

    // Guard: raw &amp; in JSX
    if (/>[^<]*&amp;[^<]*</.test(line) || /'[^']*&amp;[^']*'/.test(line) || /"[^"]*&amp;[^"]*"/.test(line)) {
      // Ignore html entity in SVG or XML if any
      if (!line.includes('&amp;quot;') && !line.includes('&amp;gt;')) {
        violations.push({
          file: relPath,
          line: lineNum,
          type: 'RAW_AMPERSAND_ENTITY',
          text: line.trim(),
        });
      }
    }

    // Guard: raw markdown ### in user-facing JSX text
    if (/>\s*###\s+/.test(line)) {
      violations.push({
        file: relPath,
        line: lineNum,
        type: 'RAW_MARKDOWN_HEADER',
        text: line.trim(),
      });
    }

    // Guard: raw markdown ** in user-facing JSX text (e.g. <span>**Teks**</span>)
    if (/>[^<]*\*\*[^*<]+\*\*[^<]*</.test(line)) {
      violations.push({
        file: relPath,
        line: lineNum,
        type: 'RAW_MARKDOWN_BOLD',
        text: line.trim(),
      });
    }
  });
}

function traverseDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        traverseDir(fullPath, callback);
      }
    } else {
      callback(fullPath);
    }
  }
}

console.log('1. Memindai berkas sumber (apps/web/src/app & src/components)...');
traverseDir(path.join(srcDir, 'app'), (file) => {
  if (/\.(tsx|ts)$/.test(file)) scanSourceFile(file);
});
traverseDir(path.join(srcDir, 'components'), (file) => {
  if (/\.(tsx|ts)$/.test(file)) scanSourceFile(file);
});

// 2. Scan Static Export Files if out directory exists
if (fs.existsSync(outDir)) {
  console.log('2. Memindai direktori hasil ekspor statis (apps/web/out)...');
  traverseDir(outDir, (file) => {
    if (file.endsWith('.html')) {
      const content = fs.readFileSync(file, 'utf-8');
      const relPath = path.relative(rootDir, file);

      if (content.includes('[ISI')) {
        violations.push({ file: relPath, line: 0, type: 'EXPORT_PLACEHOLDER_ISI', text: '[ISI found in built HTML' });
      }
      if (content.includes('[TODO]')) {
        violations.push({ file: relPath, line: 0, type: 'EXPORT_PLACEHOLDER_TODO', text: '[TODO] found in built HTML' });
      }
      if (content.includes('&amp;amp;')) {
        violations.push({ file: relPath, line: 0, type: 'EXPORT_DOUBLE_ENCODED_AMP', text: '&amp;amp; found in built HTML' });
      }
    }
  });
} else {
  console.log('2. Direktori apps/web/out belum ada (akan dipindai setelah npm run build:export).');
}

// Summary
console.log('\n================================================================');
if (violations.length === 0) {
  console.log('🎉 SEMUA PEMERIKSAAN KONTEN BERSIH 100%! TIDAK ADA PLACEHOLDER ATAU MARKDOWN MENTAH.');
  console.log('================================================================\n');
  process.exit(0);
} else {
  console.error(`❌ DITEMUKAN ${violations.length} PELANGGARAN KONTEN:`);
  violations.forEach((v, idx) => {
    console.error(`  [${idx + 1}] ${v.file}:${v.line} -> ${v.type}`);
    console.error(`      "${v.text}"`);
  });
  console.log('================================================================\n');
  process.exit(1);
}
