import fs from 'fs';

const file = 'C:/Users/ThinkPad X1 Yoga/.gemini/antigravity/scratch/olahdata/apps/web/src/app/app/proyek/[id]/hasil/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `    crosstab: 'Tabulasi Silang, Chi-Square, & Odds Ratio',
  };`;
const rep = `    crosstab: 'Tabulasi Silang, Chi-Square, & Odds Ratio',
    mediation: 'Uji Mediasi & Analisis Jalur (Sobel)',
    moderation: 'Uji Moderasi (Moderated Regression Analysis)',
  };`;

if (content.includes(target)) {
  content = content.replace(target, rep);
  fs.writeFileSync(file, content, 'utf8');
  console.log('testNamesMap patched successfully');
} else {
  console.log('target not found');
}
