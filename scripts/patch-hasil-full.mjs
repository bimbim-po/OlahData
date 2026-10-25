import fs from 'fs';

const file = 'C:/Users/ThinkPad X1 Yoga/.gemini/antigravity/scratch/olahdata/apps/web/src/app/app/proyek/[id]/hasil/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix usePlanGate destructuring
content = content.replace(
  'const { isFree, canExport, openUpgradeModal } = usePlanGate(projectId, isSample);',
  'const { isFree, isPro, isThesis, canExport, openUpgradeModal } = usePlanGate(projectId, isSample);'
);

// 2. Replace handleCopyActiveTabForWord for mediation and moderation
const copyStart = "      } else if (activeTab === 'mediation' && results.pathAnalysis) {";
const copyEnd = "      if (tableHtml) {\n        await copyHtmlAndText(tableHtml, 'Tabel berhasil disalin untuk Word.');";

const newCopyBlock = `      } else if (activeTab === 'mediation' && results.pathAnalysis) {
        const pa = results.pathAnalysis;
        const parts: string[] = [];

        pa.submodels.forEach((sm, idx) => {
          parts.push(buildWordTableHtml({
            tableNumber: \`Tabel 4.13\${String.fromCharCode(97 + idx)}\`,
            title: \`Analisis Jalur \${sm.equationName} (Variabel Terikat: \${sm.dependentVar})\`,
            note: \`R² = \${formatNumber(sm.rSquare, 3)}, F = \${formatNumber(sm.fStatistic, 3)} (p = \${formatNumber(sm.fPValue, 4)}), Error e = \${formatNumber(sm.residualError, 3)}.\`,
            columns: [
              { header: 'Jalur / Prediktor', align: 'left' },
              { header: 'B (Unstand.)', align: 'right' },
              { header: 'Std. Error', align: 'right' },
              { header: 'Beta (Stand.)', align: 'right' },
              { header: 't-hitung', align: 'right' },
              { header: 'Sig. (p)', align: 'right' },
              { header: 'Keterangan', align: 'center' },
            ],
            rows: sm.coefficients.map((c) => [
              c.fromVar,
              formatNumber(c.unstandardizedB, 3),
              formatNumber(c.se, 3),
              formatNumber(c.standardizedBeta, 3),
              formatNumber(c.tStatistic, 3),
              formatNumber(c.pValue, 4),
              c.significant ? 'Signifikan' : 'Tidak',
            ]),
          }));
        });

        parts.push(buildWordTableHtml({
          tableNumber: 'Tabel 4.14',
          title: 'Dekomposisi Pengaruh dan Pengujian Hipotesis Mediasi (Uji Sobel)',
          note: 'Formula Uji Sobel: z = (a*b) / sqrt(b²*sa² + a²*sb²). Kriteria: |z| > 1,96 (p < 0,05).',
          columns: [
            { header: 'Jalur Mediasi', align: 'left' },
            { header: 'Pengaruh Langsung (Direct)', align: 'right' },
            { header: 'Pengaruh Tidak Langsung (Indirect)', align: 'right' },
            { header: 'Pengaruh Total', align: 'right' },
            { header: 'Sobel z', align: 'right' },
            { header: 'p-value', align: 'right' },
            { header: 'VAF (%)', align: 'right' },
            { header: 'Kesimpulan Mediasi', align: 'center' },
          ],
          rows: pa.sobelResults.map((st) => [
            \`\${st.independentVar} → \${st.mediatorVar} → \${st.dependentVar}\`,
            formatNumber(st.directEffect, 3),
            formatNumber(st.indirectEffect, 3),
            formatNumber(st.totalEffect, 3),
            formatNumber(st.sobelZ, 3),
            formatNumber(st.sobelPValue, 4),
            \`\${formatNumber(st.vafRatio * 100, 1)}%\`,
            st.mediationType,
          ]),
        }));

        tableHtml = parts.join('<br/><br/>');
      } else if (activeTab === 'moderation' && results.moderationAnalysis) {
        const ma = results.moderationAnalysis;
        const parts: string[] = [];

        ma.results.forEach((mod, mIdx) => {
          parts.push(buildWordTableHtml({
            tableNumber: \`Tabel 4.15\${String.fromCharCode(97 + mIdx)}\`,
            title: \`Hasil Moderated Regression Analysis (MRA): \${mod.independentVar} terhadap \${mod.dependentVar} dimoderasi \${mod.moderatorVar}\`,
            note: \`Model 1 R² = \${formatNumber(mod.model1.rSquare, 3)}; Model 2 R² = \${formatNumber(mod.model2.rSquare, 3)}, Delta R² = \${formatNumber(mod.rSquareChange, 4)}, F-Change = \${formatNumber(mod.fChange, 3)} (p = \${formatNumber(mod.fChangePValue, 4)}). Tipe Moderasi: \${mod.moderatorType} (\${mod.moderationDirection}).\`,
            columns: [
              { header: 'Model / Prediktor', align: 'left' },
              { header: 'B (Unstand.)', align: 'right' },
              { header: 'Std. Error', align: 'right' },
              { header: 'Beta (Stand.)', align: 'right' },
              { header: 't-hitung', align: 'right' },
              { header: 'Sig. (p)', align: 'right' },
              { header: 'Status', align: 'center' },
            ],
            rows: [
              ['-- Model 1 (Efek Utama) --', '', '', '', '', '', ''],
              ...mod.model1.coefficients.map((c) => [
                c.variable,
                formatNumber(c.b, 3),
                formatNumber(c.se, 3),
                formatNumber(c.beta, 3),
                formatNumber(c.t, 3),
                formatNumber(c.pValue, 4),
                c.significant ? 'Signifikan' : 'Tidak',
              ]),
              ['-- Model 2 (Suku Interaksi) --', '', '', '', '', '', ''],
              ...mod.model2.coefficients.map((c) => [
                c.variable,
                formatNumber(c.b, 3),
                formatNumber(c.se, 3),
                formatNumber(c.beta, 3),
                formatNumber(c.t, 3),
                formatNumber(c.pValue, 4),
                c.significant ? 'Signifikan' : 'Tidak',
              ]),
            ],
          }));
        });

        tableHtml = parts.join('<br/><br/>');
      }

      if (tableHtml) {
        await copyHtmlAndText(tableHtml, 'Tabel berhasil disalin untuk Word.');`;

const copyIdx1 = content.indexOf(copyStart);
const copyIdx2 = content.indexOf(copyEnd);
if (copyIdx1 !== -1 && copyIdx2 !== -1) {
  content = content.substring(0, copyIdx1) + newCopyBlock + content.substring(copyIdx2 + copyEnd.length);
  console.log('Patched copy block');
} else {
  console.log('Copy block not found');
}

// 3. Replace TabsContent for mediation and moderation
const tabsStart = '            {/* 12. UJI MEDIASI (ANALISIS JALUR & UJI SOBEL) */}';
const tabsEnd = '            </Tabs>';

const newTabsBlock = `            {/* 12. UJI MEDIASI (ANALISIS JALUR & UJI SOBEL) */}
            <TabsContent value="mediation" className="space-y-6 mt-4">
              <ProResultBlur
                isLocked={!isThesis && !isSample}
                isSample={isSample}
                testName="Uji Mediasi & Analisis Jalur (Sobel)"
                reason="Fitur Analisis Jalur (Path Analysis) dan Uji Signifikansi Mediasi Sobel merupakan fitur eksklusif Paket Skripsi Tuntas."
              >
                {results.pathAnalysis && results.pathAnalysis.hasMediation && (
                  <div className="space-y-6">
                    {/* Header Ringkasan Mediasi & Badges */}
                    <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5 shadow-xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            <GitFork className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-foreground">
                              Analisis Jalur (Path Analysis) dan Uji Mediasi Sobel
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Pengujian signifikansi efek tidak langsung (indirect effect) variabel perantara
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {results.pathAnalysis.sobelResults[0] && (
                            <>
                              <Badge
                                variant={results.pathAnalysis.sobelResults[0].significant ? 'pine' : 'secondary'}
                                className="text-xs font-semibold px-2.5 py-1"
                              >
                                {results.pathAnalysis.sobelResults[0].significant ? 'Mediasi Signifikan' : 'Tidak Signifikan'}
                              </Badge>
                              <Badge
                                className={cn(
                                  'text-xs font-semibold px-2.5 py-1 text-white',
                                  results.pathAnalysis.sobelResults[0].mediationType === 'Full Mediation'
                                    ? 'bg-purple-600 border-purple-700'
                                    : results.pathAnalysis.sobelResults[0].mediationType === 'Partial Mediation'
                                    ? 'bg-sky-600 border-sky-700'
                                    : 'bg-muted-foreground/60'
                                )}
                              >
                                {results.pathAnalysis.sobelResults[0].mediationType}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Info Jalur */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                        <div className="p-3 rounded-xl bg-card border border-border/80">
                          <span className="text-[11px] text-muted-foreground block">Variabel Bebas (X)</span>
                          <span className="font-semibold text-foreground text-sm">
                            {results.pathAnalysis.sobelResults.map((s) => s.independentVar).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-card border border-border/80">
                          <span className="text-[11px] text-muted-foreground block">Variabel Mediasi (Z / M)</span>
                          <span className="font-semibold text-purple-700 dark:text-purple-400 text-sm">
                            {results.pathAnalysis.sobelResults.map((s) => s.mediatorVar).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-card border border-border/80">
                          <span className="text-[11px] text-muted-foreground block">Variabel Terikat (Y)</span>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
                            {results.pathAnalysis.sobelResults[0]?.dependentVar || '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tabel 4.13: Hasil Estimasi Koefisien Analisis Jalur */}
                    <div className="space-y-4">
                      {results.pathAnalysis.submodels.map((sm, smIdx) => (
                        <div key={sm.equationName} className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-3">
                            <div>
                              <span className="text-xs font-bold text-primary font-mono uppercase tracking-wider block">
                                Tabel 4.13{String.fromCharCode(97 + smIdx)} (Format APA 7th Edition)
                              </span>
                              <h3 className="text-base font-bold text-foreground font-serif">
                                Estimasi Koefisien Jalur: {sm.equationName} (Dependen: {sm.dependentVar})
                              </h3>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono">
                              <Badge variant="outline">R² = {formatNumber(sm.rSquare, 3)}</Badge>
                              <Badge variant="outline">F = {formatNumber(sm.fStatistic, 3)} (p = {formatNumber(sm.fPValue, 4)})</Badge>
                              <Badge variant="outline">e = {formatNumber(sm.residualError, 3)}</Badge>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr className="border-b-2 border-foreground/80 text-muted-foreground">
                                  <th className="py-2.5 px-3 text-left font-semibold">Jalur / Prediktor</th>
                                  <th className="py-2.5 px-3 text-right font-semibold">B (Unstandardized)</th>
                                  <th className="py-2.5 px-3 text-right font-semibold">Std. Error</th>
                                  <th className="py-2.5 px-3 text-right font-semibold">Beta (&beta;)</th>
                                  <th className="py-2.5 px-3 text-right font-semibold">t-hitung</th>
                                  <th className="py-2.5 px-3 text-right font-semibold">Sig. (p)</th>
                                  <th className="py-2.5 px-3 text-center font-semibold">Keputusan</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sm.coefficients.map((c) => (
                                  <tr key={c.path} className="border-b border-border/60 hover:bg-muted/40 transition-colors">
                                    <td className="py-2.5 px-3 font-medium text-foreground">{c.fromVar}</td>
                                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatNumber(c.unstandardizedB, 3)}</td>
                                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatNumber(c.se, 3)}</td>
                                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">{formatNumber(c.standardizedBeta, 3)}</td>
                                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatNumber(c.tStatistic, 3)}</td>
                                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                                      <span className={c.significant ? 'font-bold text-primary' : 'text-muted-foreground'}>
                                        {formatNumber(c.pValue, 4)}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                      <Badge variant={c.significant ? 'pine' : 'secondary'} className="text-[11px]">
                                        {c.significant ? 'Signifikan' : 'Tidak Signifikan'}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/40 flex flex-wrap items-center justify-between gap-2">
                            <span>
                              Catatan: Derajat residual path error e{smIdx + 1} = &radic;(1 - R&sup2;) = {formatNumber(sm.residualError, 3)}. Taraf signifikansi &alpha; = 0,05.
                            </span>
                            <span className="font-mono">
                              Persamaan: {sm.dependentVar} = {sm.coefficients.map((c) => \`\${formatNumber(c.standardizedBeta, 3)} (\${c.fromVar})\`).join(' + ')} + e{smIdx + 1}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tabel 4.14: Dekomposisi Efek & Uji Sobel */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-3">
                        <div>
                          <span className="text-xs font-bold text-primary font-mono uppercase tracking-wider block">
                            Tabel 4.14 (Format APA 7th Edition)
                          </span>
                          <h3 className="text-base font-bold text-foreground font-serif">
                            Dekomposisi Pengaruh dan Uji Signifikansi Mediasi (Sobel Test)
                          </h3>
                        </div>
                        <Badge variant="outline" className="font-mono text-xs">
                          Metode Sobel (1982) dan Baron &amp; Kenny (1986)
                        </Badge>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="border-b-2 border-foreground/80 text-muted-foreground">
                              <th className="py-2.5 px-3 text-left font-semibold">Jalur Pengujian</th>
                              <th className="py-2.5 px-3 text-right font-semibold">Pengaruh Langsung (c&apos;)</th>
                              <th className="py-2.5 px-3 text-right font-semibold">Pengaruh Tidak Langsung (a&times;b)</th>
                              <th className="py-2.5 px-3 text-right font-semibold">Pengaruh Total</th>
                              <th className="py-2.5 px-3 text-right font-semibold">Sobel z-hitung</th>
                              <th className="py-2.5 px-3 text-right font-semibold">p-value (2-tailed)</th>
                              <th className="py-2.5 px-3 text-right font-semibold">VAF Ratio</th>
                              <th className="py-2.5 px-3 text-center font-semibold">Tipe Mediasi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.pathAnalysis.sobelResults.map((st) => (
                              <tr key={\`\${st.independentVar}-\${st.mediatorVar}\`} className="border-b border-border/60 hover:bg-muted/40 transition-colors">
                                <td className="py-2.5 px-3 font-medium text-foreground">
                                  {st.independentVar} &rarr; <span className="text-purple-600 dark:text-purple-400 font-semibold">{st.mediatorVar}</span> &rarr; {st.dependentVar}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatNumber(st.directEffect, 3)}</td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-primary">{formatNumber(st.indirectEffect, 3)}</td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatNumber(st.totalEffect, 3)}</td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold">
                                  {formatNumber(st.sobelZ, 3)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                                  <span className={st.significant ? 'font-bold text-primary' : 'text-muted-foreground'}>
                                    {formatNumber(st.sobelPValue, 4)}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatNumber(st.vafRatio * 100, 1)}%</td>
                                <td className="py-2.5 px-3 text-center">
                                  <Badge
                                    variant={st.significant ? 'pine' : 'secondary'}
                                    className="text-[11px]"
                                  >
                                    {st.mediationType}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/40 leading-relaxed">
                        Rumus Uji Sobel: z = (a &times; b) / &radic;(b&sup2;s_a&sup2; + a&sup2;s_b&sup2;). Kriteria pengujian: jika nilai |z| &gt; 1,96 pada taraf &alpha; = 0,05, disimpulkan bahwa variabel mediasi secara signifikan memediasi hubungan antara variabel bebas dan terikat. Kriteria VAF: &gt; 80% Full Mediation, 20% - 80% Partial Mediation, &lt; 20% No Mediation (Hair et al., 2017).
                      </div>
                    </div>

                    {/* Draf Narasi Akademik Bab 4 */}
                    {results.explanations.pathAnalysis && (
                      <Chapter4InterpretationCard
                        tableNumber="Tabel 4.13 dan 4.14"
                        intinya={results.pathAnalysis.sobelResults[0]?.conclusion || 'Pengujian mediasi menunjukkan pengaruh tidak langsung yang signifikan.'}
                        interpretation={results.explanations.pathAnalysis}
                        guidingQuestions={[
                          'Apakah koefisien regresi jalur a (X -> Z) dan jalur b (Z -> Y) keduanya signifikan pada taraf 5%?',
                          'Berapa nilai statistik z-hitung Uji Sobel dan apakah p-value < 0,05?',
                          'Apakah model terbukti sebagai mediasi penuh (Full Mediation) atau mediasi parsial (Partial Mediation)?',
                        ]}
                        onHoverNumber={setHighlightedNumber}
                        activeNumber={highlightedNumber}
                      />
                    )}

                    {/* Bekal Sidang Skripsi: Tanya Jawab Penguji */}
                    <ThesisDefenseCompanion
                      testType="mediation"
                      dataMetrics={{
                        n: results.respondentCount,
                        sobelZ: results.pathAnalysis.sobelResults[0]?.sobelZ,
                        sobelP: results.pathAnalysis.sobelResults[0]?.sobelPValue,
                        indirectEffect: results.pathAnalysis.sobelResults[0]?.indirectEffect,
                        directEffect: results.pathAnalysis.sobelResults[0]?.directEffect,
                        totalEffect: results.pathAnalysis.sobelResults[0]?.totalEffect,
                        vafRatio: (results.pathAnalysis.sobelResults[0]?.vafRatio || 0) * 100,
                        mediationType: results.pathAnalysis.sobelResults[0]?.mediationType,
                      }}
                    />
                  </div>
                )}
              </ProResultBlur>
            </TabsContent>

            {/* 13. UJI MODERASI (MODERATED REGRESSION ANALYSIS / MRA) */}
            <TabsContent value="moderation" className="space-y-6 mt-4">
              <ProResultBlur
                isLocked={!isThesis && !isSample}
                isSample={isSample}
                testName="Uji Moderasi (Moderated Regression Analysis)"
                reason="Fitur Moderated Regression Analysis (MRA) hierarkis dan tipologi variabel pemoderasi merupakan fitur eksklusif Paket Skripsi Tuntas."
              >
                {results.moderationAnalysis && results.moderationAnalysis.hasModeration && (
                  <div className="space-y-6">
                    {/* Header Ringkasan Moderasi & Badges */}
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <SlidersHorizontal className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-foreground">
                              Moderated Regression Analysis (MRA)
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Pengujian signifikansi efek interaksi dan tipologi moderasi (Sharma et al., 1981)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {results.moderationAnalysis.results[0] && (
                            <>
                              <Badge
                                variant={results.moderationAnalysis.results[0].interactionSignificant ? 'pine' : 'secondary'}
                                className="text-xs font-semibold px-2.5 py-1"
                              >
                                {results.moderationAnalysis.results[0].interactionSignificant ? 'Moderasi Signifikan' : 'Tidak Signifikan'}
                              </Badge>
                              <Badge
                                className={cn(
                                  'text-xs font-semibold px-2.5 py-1 text-white',
                                  results.moderationAnalysis.results[0].moderatorType === 'Pure Moderator'
                                    ? 'bg-amber-600 border-amber-700'
                                    : results.moderationAnalysis.results[0].moderatorType === 'Quasi Moderator'
                                    ? 'bg-orange-600 border-orange-700'
                                    : 'bg-muted-foreground/60'
                                )}
                              >
                                {results.moderationAnalysis.results[0].moderatorType}
                              </Badge>
                              <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1">
                                {results.moderationAnalysis.results[0].moderationDirection}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Info Model Moderasi */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                        <div className="p-3 rounded-xl bg-card border border-border/80">
                          <span className="text-[11px] text-muted-foreground block">Variabel Bebas (X)</span>
                          <span className="font-semibold text-foreground text-sm">
                            {results.moderationAnalysis.results.map((r) => r.independentVar).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-card border border-border/80">
                          <span className="text-[11px] text-muted-foreground block">Variabel Moderasi (Mod)</span>
                          <span className="font-semibold text-amber-700 dark:text-amber-400 text-sm">
                            {results.moderationAnalysis.results.map((r) => r.moderatorVar).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-card border border-border/80">
                          <span className="text-[11px] text-muted-foreground block">Variabel Terikat (Y)</span>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
                            {results.moderationAnalysis.results[0]?.dependentVar || '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tabel 4.15: Hasil Hierarchical MRA (Model 1 vs Model 2) */}
                    {results.moderationAnalysis.results.map((mod, mIdx) => (
                      <div key={\`\${mod.independentVar}-\${mod.moderatorVar}\`} className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-3">
                          <div>
                            <span className="text-xs font-bold text-primary font-mono uppercase tracking-wider block">
                              Tabel 4.15\${String.fromCharCode(97 + mIdx)} (Format APA 7th Edition)
                            </span>
                            <h3 className="text-base font-bold text-foreground font-serif">
                              Hasil Moderated Regression Analysis: Pengaruh {mod.independentVar} terhadap {mod.dependentVar} yang Dimoderasi {mod.moderatorVar}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <Badge variant="outline">&Delta;R² = {formatNumber(mod.rSquareChange, 4)}</Badge>
                            <Badge variant="outline">F-change = {formatNumber(mod.fChange, 3)} (p = {formatNumber(mod.fChangePValue, 4)})</Badge>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              <tr className="border-b-2 border-foreground/80 text-muted-foreground">
                                <th className="py-2.5 px-3 text-left font-semibold">Model / Prediktor</th>
                                <th className="py-2.5 px-3 text-right font-semibold">B (Unstandardized)</th>
                                <th className="py-2.5 px-3 text-right font-semibold">Std. Error</th>
                                <th className="py-2.5 px-3 text-right font-semibold">Beta (&beta;)</th>
                                <th className="py-2.5 px-3 text-right font-semibold">t-hitung</th>
                                <th className="py-2.5 px-3 text-right font-semibold">Sig. (p)</th>
                                <th className="py-2.5 px-3 text-center font-semibold">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* Subheader Model 1 */}
                              <tr className="bg-muted/40 font-semibold border-t border-b border-border/80">
                                <td colSpan={7} className="py-2 px-3 text-foreground">
                                  Model 1: Efek Utama (R² = {formatNumber(mod.model1.rSquare, 3)}, F = {formatNumber(mod.model1.fStatistic, 3)}, p = {formatNumber(mod.model1.fPValue, 4)})
                                </td>
                              </tr>
                              {mod.model1.coefficients.map((c) => (
                                <tr key={\`m1-\${c.variable}\`} className="border-b border-border/60 hover:bg-muted/30 transition-colors">
                                  <td className="py-2.5 px-3 font-medium text-foreground">{c.variable}</td>
                                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatNumber(c.b, 3)}</td>
                                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatNumber(c.se, 3)}</td>
                                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">{formatNumber(c.beta, 3)}</td>
                                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatNumber(c.t, 3)}</td>
                                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                                    <span className={c.significant ? 'font-bold text-primary' : 'text-muted-foreground'}>
                                      {formatNumber(c.pValue, 4)}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <Badge variant={c.significant ? 'pine' : 'secondary'} className="text-[11px]">
                                      {c.significant ? 'Signifikan' : 'Tidak Signifikan'}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}

                              {/* Subheader Model 2 */}
                              <tr className="bg-muted/40 font-semibold border-t border-b border-border/80">
                                <td colSpan={7} className="py-2 px-3 text-foreground">
                                  Model 2: Efek Interaksi (R² = {formatNumber(mod.model2.rSquare, 3)}, F = {formatNumber(mod.model2.fStatistic, 3)}, &Delta;R² = {formatNumber(mod.rSquareChange, 4)})
                                </td>
                              </tr>
                              {mod.model2.coefficients.map((c) => {
                                const isInteraction = c.variable.includes('×') || c.variable.includes('*');
                                return (
                                  <tr
                                    key={\`m2-\${c.variable}\`}
                                    className={cn(
                                      'border-b border-border/60 transition-colors',
                                      isInteraction ? 'bg-amber-500/10 dark:bg-amber-500/5 font-semibold' : 'hover:bg-muted/30'
                                    )}
                                  >
                                    <td className="py-2.5 px-3 font-medium text-foreground flex items-center gap-1.5">
                                      {c.variable}
                                      {isInteraction && (
                                        <Badge className="text-[10px] bg-amber-600 text-white border-amber-700 py-0 px-1.5">
                                          Suku Interaksi
                                        </Badge>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatNumber(c.b, 3)}</td>
                                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatNumber(c.se, 3)}</td>
                                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">{formatNumber(c.beta, 3)}</td>
                                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatNumber(c.t, 3)}</td>
                                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                                      <span className={c.significant ? 'font-bold text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}>
                                        {formatNumber(c.pValue, 4)}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                      <Badge variant={c.significant ? 'pine' : 'secondary'} className="text-[11px]">
                                        {c.significant ? 'Signifikan' : 'Tidak Signifikan'}
                                      </Badge>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Tipologi Moderasi Sharma et al. Box */}
                        <div className="p-4 rounded-xl bg-card border border-border/80 space-y-2">
                          <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                            <HelpCircle className="w-4 h-4 text-primary" />
                            Klasifikasi Tipologi Moderasi (Sharma, Durand, &amp; Gur-Arie, 1981):
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
                            <div className={cn('p-2.5 rounded-lg border', mod.moderatorType === 'Pure Moderator' ? 'border-primary bg-primary/10 font-semibold' : 'border-border/60 bg-muted/20 text-muted-foreground')}>
                              <span className="block font-bold text-foreground">1. Pure Moderator</span>
                              <span>Z tidak berpengaruh langsung, tapi suku interaksi signifikan.</span>
                            </div>
                            <div className={cn('p-2.5 rounded-lg border', mod.moderatorType === 'Quasi Moderator' ? 'border-primary bg-primary/10 font-semibold' : 'border-border/60 bg-muted/20 text-muted-foreground')}>
                              <span className="block font-bold text-foreground">2. Quasi Moderator</span>
                              <span>Z berpengaruh langsung, DAN suku interaksi juga signifikan.</span>
                            </div>
                            <div className={cn('p-2.5 rounded-lg border', mod.moderatorType === 'Predictor Moderator' ? 'border-primary bg-primary/10 font-semibold' : 'border-border/60 bg-muted/20 text-muted-foreground')}>
                              <span className="block font-bold text-foreground">3. Predictor Moderator</span>
                              <span>Z berpengaruh langsung, tapi interaksi TIDAK signifikan.</span>
                            </div>
                            <div className={cn('p-2.5 rounded-lg border', mod.moderatorType === 'Homologiser (Bukan Moderasi)' ? 'border-primary bg-primary/10 font-semibold' : 'border-border/60 bg-muted/20 text-muted-foreground')}>
                              <span className="block font-bold text-foreground">4. Homologiser</span>
                              <span>Baik Z maupun suku interaksi tidak berpengaruh signifikan.</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-muted-foreground pt-1">
                            Kesimpulan: Variabel <span className="font-semibold text-foreground">{mod.moderatorVar}</span> terbukti berperan sebagai <span className="font-semibold text-primary">{mod.moderatorType}</span> yang berfungsi <span className="font-semibold text-foreground">{mod.moderationDirection.toLowerCase()}</span> pengaruh {mod.independentVar} terhadap {mod.dependentVar}.
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Draf Narasi Akademik Bab 4 */}
                    {results.explanations.moderationAnalysis && (
                      <Chapter4InterpretationCard
                        tableNumber="Tabel 4.15"
                        intinya={results.moderationAnalysis.results[0]?.conclusion || 'Pengujian moderasi MRA menunjukkan penambahan suku interaksi yang signifikan.'}
                        interpretation={results.explanations.moderationAnalysis}
                        guidingQuestions={[
                          'Apakah penambahan suku interaksi (X × Z) menghasilkan kenaikan koefisien determinasi (Delta R²) yang signifikan?',
                          'Apakah p-value koefisien interaksi lebih kecil dari 0,05?',
                          'Bagaimana klasifikasi variabel moderasi berdasarkan tipologi Sharma et al. (1981)?',
                        ]}
                        onHoverNumber={setHighlightedNumber}
                        activeNumber={highlightedNumber}
                      />
                    )}

                    {/* Bekal Sidang Skripsi: Tanya Jawab Penguji */}
                    <ThesisDefenseCompanion
                      testType="moderation"
                      dataMetrics={{
                        n: results.respondentCount,
                        deltaR2: results.moderationAnalysis.results[0]?.rSquareChange,
                        fChange: results.moderationAnalysis.results[0]?.fChange,
                        interactionP: results.moderationAnalysis.results[0]?.interactionPValue,
                        moderatorType: results.moderationAnalysis.results[0]?.moderatorType,
                        moderationDirection: results.moderationAnalysis.results[0]?.moderationDirection === 'Memperkuat' ? 'Memperkuat' : 'Memperlemah',
                      }}
                    />
                  </div>
                )}
              </ProResultBlur>
            </TabsContent>`;

const tabsIdx1 = content.indexOf(tabsStart);
const tabsIdx2 = content.lastIndexOf(tabsEnd);
if (tabsIdx1 !== -1 && tabsIdx2 !== -1) {
  content = content.substring(0, tabsIdx1) + newTabsBlock + '\n' + content.substring(tabsIdx2);
  console.log('Patched tabs block');
} else {
  console.log('Tabs block not found');
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully patched hasil/page.tsx');
