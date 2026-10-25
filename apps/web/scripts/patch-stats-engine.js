const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'lib', 'stats-engine.ts');
let c = fs.readFileSync(file, 'utf8');

const target = `  const dfLinearity = 1;
  const dfDeviation = Math.max(1, g - 2);
  const dfWithin = Math.max(1, n - g);`;

const replacement = `  // Check if every X value is unique (within-groups df = 0)
  if (g === n || n - g <= 0) {
    return {
      independentVar: xName,
      dependentVar: yName,
      ssLinearity: Number(ssLinearity.toFixed(4)),
      dfLinearity: 1,
      msLinearity: Number(ssLinearity.toFixed(4)),
      fLinearity: 0,
      sigLinearity: 1,
      ssDeviation: 0,
      dfDeviation: Math.max(0, g - 2),
      msDeviation: 0,
      fDeviation: 0,
      sigDeviation: 1,
      ssWithin: 0,
      dfWithin: 0,
      msWithin: 0,
      isLinear: false,
    };
  }

  const dfLinearity = 1;
  const dfDeviation = Math.max(1, g - 2);
  const dfWithin = n - g;`;

const isCRLF = c.includes('\r\n');
let norm = c.replace(/\r\n/g, '\n');

if (norm.includes(target.replace(/\r\n/g, '\n'))) {
  norm = norm.replace(target.replace(/\r\n/g, '\n'), replacement.replace(/\r\n/g, '\n'));
  fs.writeFileSync(file, isCRLF ? norm.replace(/\n/g, '\r\n') : norm, 'utf8');
  console.log('SUCCESS: Patched linearity in stats-engine.ts');
} else {
  console.log('Target block not found');
}
