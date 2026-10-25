import fs from 'fs';

const filePath = 'C:/Users/ThinkPad X1 Yoga/.gemini/antigravity/scratch/olahdata/apps/web/src/lib/stats-engine.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports
const importTarget = "} from './assumption-remedies';";
const importReplacement = `} from './assumption-remedies';
import {
  computePathAnalysisAndSobel,
  computeModeratedRegression,
  generatePathMediationNarration,
  generateModerationNarration,
} from './mediation-moderation';`;

if (!content.includes(importReplacement)) {
  content = content.replace(importTarget, importReplacement);
}

// 2. Add computation in computeDeterministicStats
const calcTarget = '// 10. GENERASI NARASI DRAF DENGAN STRICT NUMBER GUARD (NILAI TERHITUNG)';
const calcReplacement = `  // 10. ANALISIS JALUR & UJI SOBEL (MEDIASI)
  const hasMediator = constructs.some((c) => c.role === 'mediator');
  if (hasMediator || selectedTests.includes('mediation')) {
    try {
      const pathRes = computePathAnalysisAndSobel(constructScores, constructs, significanceLevel);
      if (pathRes.hasMediation) {
        results.pathAnalysis = pathRes;
      }
    } catch (err) {
      console.warn('Gagal menghitung Path Analysis / Sobel:', err);
    }
  }

  // 11. MODERATED REGRESSION ANALYSIS / MRA (MODERASI)
  const hasModerator = constructs.some((c) => c.role === 'moderator');
  if (hasModerator || selectedTests.includes('moderation')) {
    try {
      const mraRes = computeModeratedRegression(constructScores, constructs, significanceLevel);
      if (mraRes.hasModeration) {
        results.moderationAnalysis = mraRes;
      }
    } catch (err) {
      console.warn('Gagal menghitung MRA / Moderasi:', err);
    }
  }

  // 12. GENERASI NARASI DRAF DENGAN STRICT NUMBER GUARD (NILAI TERHITUNG)`;

if (!content.includes('results.pathAnalysis = pathRes;')) {
  content = content.replace(calcTarget, calcReplacement);
}

// 3. Add explanations in generateDeterministicExplanations
const expTarget = '  return exp;\n}';
const expReplacement = `  if (res.pathAnalysis && res.pathAnalysis.hasMediation) {
    exp.pathAnalysis = generatePathMediationNarration(res.pathAnalysis);
  }

  if (res.moderationAnalysis && res.moderationAnalysis.hasModeration) {
    exp.moderationAnalysis = generateModerationNarration(res.moderationAnalysis);
  }

  return exp;
}`;

if (!content.includes('exp.pathAnalysis = generatePathMediationNarration')) {
  content = content.replace(expTarget, expReplacement);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched stats-engine.ts with mediation and moderation!');
