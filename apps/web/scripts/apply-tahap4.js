const fs = require('fs');
const path = require('path');

const webDir = path.join(__dirname, '..');

// 1. Update site-header.tsx mobile button touch target
const headerPath = path.join(webDir, 'src', 'components', 'site-header.tsx');
let headerContent = fs.readFileSync(headerPath, 'utf8');

headerContent = headerContent.replace(
  'className="text-foreground h-10 w-10 min-h-[40px] min-w-[40px] sm:h-11 sm:w-11 sm:min-h-[44px] sm:min-w-[44px] touch-manipulation cursor-pointer"',
  'className="text-foreground h-11 w-11 min-h-[44px] min-w-[44px] touch-manipulation cursor-pointer"'
);

fs.writeFileSync(headerPath, headerContent, 'utf8');
console.log('✓ Updated site-header.tsx mobile touch target to min 44x44px');

// 2. Update app-sidebar.tsx & app-shell.tsx mobile bottom navigation touch targets
const appShellPath = path.join(webDir, 'src', 'components', 'app-shell.tsx');
if (fs.existsSync(appShellPath)) {
  let appShellContent = fs.readFileSync(appShellPath, 'utf8');
  // Ensure bottom nav items have min-h-[44px]
  if (appShellContent.includes('flex flex-col items-center justify-center')) {
    appShellContent = appShellContent.replace(
      /flex flex-col items-center justify-center py-1/g,
      'flex flex-col items-center justify-center py-1 min-h-[44px] min-w-[44px]'
    );
    fs.writeFileSync(appShellPath, appShellContent, 'utf8');
    console.log('✓ Updated app-shell.tsx mobile bottom navigation touch targets');
  }
}

// 3. Update ResultTable to ensure table scope and accessibility attributes
const rtPath = path.join(webDir, 'src', 'components', 'result-table.tsx');
let rtContent = fs.readFileSync(rtPath, 'utf8');

// Ensure th elements have scope="col"
if (!rtContent.includes('scope="col"')) {
  rtContent = rtContent.replace(
    /<th\s+key=\{col\.key\}/g,
    '<th scope="col" key={col.key}'
  );
  fs.writeFileSync(rtPath, rtContent, 'utf8');
  console.log('✓ Updated result-table.tsx with scope="col" on header cells');
}

console.log('✓ Phase 4 design system & accessibility polish completed!');
