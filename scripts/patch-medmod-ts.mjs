import fs from 'fs';

const file = 'C:/Users/ThinkPad X1 Yoga/.gemini/antigravity/scratch/olahdata/apps/web/src/lib/mediation-moderation.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `    return {
      name,
      b,
      se,
      beta: betaStd,
      t,
      pValue,
      significant,
    };`;

const rep = `    return {
      name,
      variable: name,
      b,
      se,
      beta: betaStd,
      t,
      pValue,
      significant,
    };`;

content = content.replace(target, rep);
fs.writeFileSync(file, content, 'utf8');
console.log('Patched mediation-moderation.ts solveOLS');
