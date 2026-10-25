import fs from 'fs';

const files = [
  'C:/Users/ThinkPad X1 Yoga/.gemini/antigravity/scratch/olahdata/apps/web/src/app/app/proyek/[id]/hasil/page.tsx',
  'C:/Users/ThinkPad X1 Yoga/.gemini/antigravity/scratch/olahdata/apps/web/src/components/variable-mapper.tsx',
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/&amp;/g, 'dan');
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Replaced in ${file}`);
}
