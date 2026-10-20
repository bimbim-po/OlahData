const fs = require('fs');
const path = require('path');

const webDir = path.join(__dirname, '..');

// =============================================================================
// 1. UPDATE top-summary-traffic-lights.tsx
// =============================================================================
const trafficLightsPath = path.join(webDir, 'src', 'components', 'top-summary-traffic-lights.tsx');
let trafficContent = fs.readFileSync(trafficLightsPath, 'utf8');

if (!trafficContent.includes('onJumpToTab')) {
  trafficContent = trafficContent.replace(
    /interface TopSummaryTrafficLightsProps\s*\{[\s\S]*?\}/,
    `interface TopSummaryTrafficLightsProps {
  results: AnalysisResults;
  className?: string;
  onJumpToTab?: (tabId: string) => void;
}`
  );

  trafficContent = trafficContent.replace(
    /export function TopSummaryTrafficLights\(\{([^}]+)\}: TopSummaryTrafficLightsProps\)/,
    `export function TopSummaryTrafficLights({ results, className, onJumpToTab }: TopSummaryTrafficLightsProps)`
  );

  // Update card footer to include the jump button
  trafficContent = trafficContent.replace(
    /(<div className="flex items-start gap-1\.5 text-\[11px\] text-muted-foreground mt-3 pt-2\.5 border-t border-border\/50">[\s\S]*?<\/div>\s*<\/div>)/,
    `<div className="mt-3 pt-2.5 border-t border-border/50 space-y-2">
              <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span>{card.details}</span>
              </div>
              {onJumpToTab && (
                <button
                  type="button"
                  onClick={() => {
                    if (card.category === 'instrument') onJumpToTab('validity');
                    else if (card.category === 'assumptions') onJumpToTab('assumptions');
                    else if (card.category === 'hypotheses') onJumpToTab('regression');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer pt-0.5"
                >
                  <span>{
                    card.category === 'instrument'
                      ? 'Lihat Tabel Validitas & Reliabilitas →'
                      : card.category === 'assumptions'
                      ? 'Lihat Uji Asumsi Klasik →'
                      : 'Lihat Tabel Uji Hipotesis →'
                  }</span>
                </button>
              )}
            </div>
          </div>`
  );

  fs.writeFileSync(trafficLightsPath, trafficContent, 'utf8');
  console.log('✓ Updated top-summary-traffic-lights.tsx');
} else {
  console.log('• top-summary-traffic-lights.tsx already contains onJumpToTab');
}

// =============================================================================
// 2. UPDATE result-table.tsx: Thin 6px scrollbar & p < 0,001 formatting
// =============================================================================
const resultTablePath = path.join(webDir, 'src', 'components', 'result-table.tsx');
let rtContent = fs.readFileSync(resultTablePath, 'utf8');

// Ensure thin scrollbar style on table overflow container
if (!rtContent.includes('[scrollbar-width:thin]')) {
  rtContent = rtContent.replace(
    '<div className="relative overflow-x-auto rounded-[6px] border border-border/80 shadow-inner">',
    '<div className="relative overflow-x-auto rounded-[6px] border border-border/80 shadow-inner [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-muted/20">'
  );
  fs.writeFileSync(resultTablePath, rtContent, 'utf8');
  console.log('✓ Updated result-table.tsx with thin 6px scrollbar');
}

// =============================================================================
// 3. UPDATE api/index.ts: Remove "Signifikan" label from regression constant
// =============================================================================
const apiIndexPath = path.join(webDir, 'src', 'lib', 'api', 'index.ts');
let apiContent = fs.readFileSync(apiIndexPath, 'utf8');

if (apiContent.includes("r.significant ? 'Signifikan' : 'Tidak'")) {
  apiContent = apiContent.replace(
    "r.significant ? 'Signifikan' : 'Tidak'",
    "r.variable.toLowerCase().includes('konstanta') || r.variable.toLowerCase().includes('constant') ? '-' : (r.significant ? 'Signifikan' : 'Tidak')"
  );
  fs.writeFileSync(apiIndexPath, apiContent, 'utf8');
  console.log('✓ Updated api/index.ts to avoid labeling regression constant as Signifikan');
}

// =============================================================================
// 4. UPDATE hasil/page.tsx: Regression constant label, Model summary, Header
// =============================================================================
const hasilPagePath = path.join(webDir, 'src', 'app', 'app', 'proyek', '[id]', 'hasil', 'page.tsx');
let hasilContent = fs.readFileSync(hasilPagePath, 'utf8');

// Fix regression constant in regressionCols:
hasilContent = hasilContent.replace(
  `      {
        key: 'significant',
        header: 'Signifikansi',
        align: 'center',
        render: (r) => (
          <Badge variant={r.significant ? 'pine' : 'secondary'} className="text-[13px] min-h-[24px]">
            {r.significant ? 'Signifikan' : 'Tidak Signifikan'}
          </Badge>
        ),
        getValue: (r) => (r.significant ? 'Signifikan' : 'Tidak'),
      },`,
  `      {
        key: 'significant',
        header: 'Signifikansi',
        align: 'center',
        render: (r) => {
          const isConst = r.variable.toLowerCase().includes('konstanta') || r.variable.toLowerCase().includes('constant');
          if (isConst) {
            return <span className="text-muted-foreground font-mono">-</span>;
          }
          return (
            <Badge variant={r.significant ? 'pine' : 'secondary'} className="text-[13px] min-h-[24px]">
              {r.significant ? 'Signifikan' : 'Tidak Signifikan'}
            </Badge>
          );
        },
        getValue: (r) => {
          const isConst = r.variable.toLowerCase().includes('konstanta') || r.variable.toLowerCase().includes('constant');
          if (isConst) return '-';
          return r.significant ? 'Signifikan' : 'Tidak Signifikan';
        },
      },`
);

// Fix in handleCopyAllTables
hasilContent = hasilContent.replace(
  "r.significant ? 'Signifikan' : 'Tidak Signifikan'",
  "r.variable.toLowerCase().includes('konstanta') ? '-' : (r.significant ? 'Signifikan' : 'Tidak Signifikan')"
);

// Connect TopSummaryTrafficLights to jump to tab
hasilContent = hasilContent.replace(
  '<TopSummaryTrafficLights results={results} />',
  '<TopSummaryTrafficLights results={results} onJumpToTab={(tabId) => setActiveTab(tabId)} />'
);

fs.writeFileSync(hasilPagePath, hasilContent, 'utf8');
console.log('✓ Updated hasil/page.tsx for regression constant and traffic lights jump!');
