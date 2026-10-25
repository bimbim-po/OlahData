import fs from 'fs';

const file = 'C:/Users/ThinkPad X1 Yoga/.gemini/antigravity/scratch/olahdata/apps/web/src/lib/mediation-moderation.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Update OLSFitResult interface
const target1 = `  coefficients: {
    name: string;
    b: number;
    se: number;
    beta: number; // standardized
    t: number;
    pValue: number;
    significant: boolean;
  }[];`;

const rep1 = `  coefficients: {
    name: string;
    variable: string;
    b: number;
    se: number;
    beta: number; // standardized
    t: number;
    pValue: number;
    significant: boolean;
  }[];`;

content = content.replace(target1, rep1);

// 2. Map coefficients in model1Summary
content = content.replace(
  'coefficients: fitModel1.coefficients,',
  `coefficients: fitModel1.coefficients.map((c) => ({
          variable: c.variable || c.name,
          b: c.b,
          se: c.se,
          beta: c.beta,
          t: c.t,
          pValue: c.pValue,
          significant: c.significant,
        })),`
);

// 3. Map coefficients in model2Summary
content = content.replace(
  'coefficients: fitModel2.coefficients,',
  `coefficients: fitModel2.coefficients.map((c) => ({
          variable: c.variable || c.name,
          b: c.b,
          se: c.se,
          beta: c.beta,
          t: c.t,
          pValue: c.pValue,
          significant: c.significant,
        })),`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully patched mediation-moderation.ts');
