import fs from 'fs';

const filePath = 'C:/Users/ThinkPad X1 Yoga/.gemini/antigravity/scratch/olahdata/apps/web/src/app/app/proyek/[id]/hasil/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Find start and end markers
const startMarker = '{/* 4. UJI ASUMSI KLASIK */}';
const endMarker = '{/* 5. REGRESI LINIER BERGANDA */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found!');
  process.exit(1);
}

const replacement = `{/* 4. UJI ASUMSI KLASIK */}
              <TabsContent value="assumptions" className="space-y-6 mt-4">
                <ProResultBlur
                  isLocked={isFree && !isSample}
                  isSample={isSample}
                  testName="Uji Asumsi Klasik"
                  reason="Angka uji Normalitas K-S, Multikolinearitas (VIF), Heteroskedastisitas Glejser, Durbin-Watson, serta Asisten Penyembuh Asumsi tersedia pada Paket Bulanan & Paket Skripsi."
                >
                  {/* Asisten Penyembuh Asumsi Klasik (One-Click Troubleshooter & Data Healer) */}
                  {((results.normality && !results.normality[0]?.normal) ||
                    (results.heteroscedasticity && results.heteroscedasticity.some((h) => h.significant)) ||
                    (results.casewiseDiagnostics && results.casewiseDiagnostics.outlierCount > 0) ||
                    (results.residualOutliers && results.residualOutliers.totalOutliers > 0) ||
                    (results.transformationRecommendations && results.transformationRecommendations.some((r) => r.recommendedMethod !== 'none'))) && (
                    <div className="p-4 sm:p-5 rounded-xl border border-blue-500/30 bg-blue-50/70 dark:bg-blue-950/20 dark:border-blue-500/30 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="font-semibold text-sm text-foreground">
                              Asisten Penyembuh Asumsi Klasik &amp; Uji Alternatif Ekonometrika
                            </span>
                            <Badge variant="brand" className="text-[10px]">
                              Solusi Metodologis Sah (Non-Destruktif)
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Asumsi residual belum terpenuhi? OlahData menyediakan 4 mekanisme penyelamat baku terukur sesuai metodologi riset Prof. Dr. Imam Ghozali (2018), Damodar Gujarati, dan Halbert White (1980) tanpa memanipulasi data mentah:
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        {/* 1. Outlier Residual Eliminator / Casewise Diagnostics */}
                        <div className="p-3.5 rounded-lg bg-background border border-border space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                              <span>1. Deteksi Outlier Ekstrem</span>
                              <Badge variant="outline" className="text-[10px] font-mono">
                                |Z_res| &gt; {results.casewiseDiagnostics ? formatNumber(results.casewiseDiagnostics.thresholdZ, 1) : '3,0'}
                              </Badge>
                            </span>
                            {results.casewiseDiagnostics && results.casewiseDiagnostics.outlierCount > 0 && (
                              <Badge variant="destructive" className="text-[10px]">
                                {results.casewiseDiagnostics.outlierCount} Outlier
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {results.casewiseDiagnostics && results.casewiseDiagnostics.outlierCount > 0 ? (
                              <>
                                Terdapat <strong className="text-foreground">{results.casewiseDiagnostics.outlierCount}</strong> responden terindikasi outlier ekstrem (misal:{' '}
                                <span className="font-mono font-semibold text-foreground">
                                  {results.casewiseDiagnostics.outlierCases.slice(0, 5).map((c) => c.caseId).join(', ')}
                                  {results.casewiseDiagnostics.outlierCount > 5 ? '...' : ''}
                                </span>
                                ). Apakah Anda ingin mengecualikan outlier ini pada versi analisis baru? (Dataset asli tetap tersimpan aman).
                              </>
                            ) : results.residualOutliers && results.residualOutliers.totalOutliers > 0 ? (
                              <>
                                Ditemukan {results.residualOutliers.totalOutliers} responden dengan residual ekstrim (Baris:{' '}
                                {results.residualOutliers.outliers.map((o) => o.rowNumber).join(', ')}). Estimasi nilai Sig. normalitas baru: ~
                                {formatNumber(results.residualOutliers.estimatedNormalSigIfRemoved, 3)}.
                              </>
                            ) : (
                              'Tidak terdeteksi outlier residual ekstrim (|Z| > 3,0). Sebaran galat stabil dan memenuhi batas dispersi normal.'
                            )}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            {results.casewiseDiagnostics && results.casewiseDiagnostics.outlierCount > 0 && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() =>
                                  handleEliminateOutliers(results.casewiseDiagnostics!.outlierCases.map((c) => c.caseNumber))
                                }
                                className="w-full sm:w-auto text-xs bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-md cursor-pointer font-medium flex items-center justify-center gap-1.5"
                              >
                                {isFree && <Lock className="w-3.5 h-3.5" />}
                                Kecualikan {results.casewiseDiagnostics.outlierCount} Outlier (Versi Baru)
                                {isFree && (
                                  <Badge variant="outline" className="text-[10px] text-white border-white/40 ml-1 py-0">
                                    Pro
                                  </Badge>
                                )}
                              </Button>
                            )}
                            {(!results.casewiseDiagnostics || results.casewiseDiagnostics.outlierCount === 0) &&
                              results.residualOutliers &&
                              results.residualOutliers.totalOutliers > 0 && (
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() =>
                                    handleEliminateOutliers(results.residualOutliers!.outliers.map((o) => o.rowNumber))
                                  }
                                  className="w-full sm:w-auto text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer font-medium flex items-center justify-center gap-1.5"
                                >
                                  {isFree && <Lock className="w-3.5 h-3.5" />}
                                  Kecualikan {results.residualOutliers.totalOutliers} Outlier (Versi Baru)
                                </Button>
                              )}
                            {results.casewiseDiagnostics && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowCasewiseTable(!showCasewiseTable)}
                                className="w-full sm:w-auto text-xs rounded-md cursor-pointer font-medium"
                              >
                                {showCasewiseTable ? 'Tutup Diagnostik' : 'Lihat Casewise Diagnostics'}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* 2. Peralihan Metode Normalitas Sah */}
                        <div className="p-3.5 rounded-lg bg-background border border-border space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-foreground">
                              2. Alternatif Uji Normalitas Sah
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              Shapiro-Wilk / Lilliefors / Z-Score
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {results.shapiroWilk?.normal ? (
                              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                Uji Shapiro-Wilk lolos (p = {formatNumber(results.shapiroWilk.pValue, 4)} ≥ 0,05). Sah digunakan untuk Bab 4 skripsi!
                              </span>
                            ) : results.lillieforsNormality?.normal ? (
                              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                Uji K-S Lilliefors lolos (p = {formatNumber(results.lillieforsNormality.pValue, 3)} ≥ 0,05). Sah digunakan untuk Bab 4 skripsi!
                              </span>
                            ) : results.skewnessKurtosis?.normalAt95 ? (
                              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                Rasio Z Kemencengan &amp; Keruncingan lolos (|Z| ≤ 1,96). Bentuk distribusi terbukti simetris.
                              </span>
                            ) : (
                              'Jika uji Kolmogorov-Smirnov standar p < 0,05, beralihlah ke uji dengan sensitivitas lebih spesifik di bawah ini.'
                            )}
                          </p>
                          <div className="grid grid-cols-2 gap-1.5">
                            <Button
                              type="button"
                              variant={normalityMethod === 'shapiro' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setNormalityMethod(normalityMethod === 'shapiro' ? 'ks' : 'shapiro')}
                              className="text-xs rounded-md cursor-pointer font-medium"
                            >
                              {normalityMethod === 'shapiro' ? 'Aktif: Shapiro-Wilk' : 'Pilih Shapiro-Wilk'}
                            </Button>
                            <Button
                              type="button"
                              variant={normalityMethod === 'lilliefors' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setNormalityMethod(normalityMethod === 'lilliefors' ? 'ks' : 'lilliefors')}
                              className="text-xs rounded-md cursor-pointer font-medium"
                            >
                              {normalityMethod === 'lilliefors' ? 'Aktif: K-S Lilliefors' : 'Pilih Lilliefors'}
                            </Button>
                            <Button
                              type="button"
                              variant={normalityMethod === 'skewness_kurtosis' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setNormalityMethod(normalityMethod === 'skewness_kurtosis' ? 'ks' : 'skewness_kurtosis')}
                              className="text-xs rounded-md cursor-pointer font-medium col-span-2"
                            >
                              {normalityMethod === 'skewness_kurtosis' ? 'Aktif: Z-Score Simetri' : 'Pilih Uji Z-Score Skewness-Kurtosis'}
                            </Button>
                          </div>
                        </div>

                        {/* 3. Peralihan Metode Uji Heteroskedastisitas Sah */}
                        <div className="p-3.5 rounded-lg bg-background border border-border space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-foreground">
                              3. Peralihan Uji Heteroskedastisitas Sah
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              Park / Spearman / White Test
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {results.whiteHetero?.homoscedastic ? (
                              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                Uji White lolos (p = {formatNumber(results.whiteHetero.pValue, 4)} ≥ 0,05). Model bebas heteroskedastisitas tanpa potong data.
                              </span>
                            ) : results.parkHetero && !results.parkHetero.some((p) => p.significant) ? (
                              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                Uji Park lolos (seluruh p &gt; 0,05). Model terbukti homoskedastisitas.
                              </span>
                            ) : results.spearmanHetero && !results.spearmanHetero.some((s) => s.significant) ? (
                              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                Korelasi Rank Spearman lolos (seluruh p &gt; 0,05). Model terbukti homoskedastisitas.
                              </span>
                            ) : (
                              'Jika Uji Glejser tidak lolos (p < 0,05), beralihlah ke Uji Park, Rank Spearman, atau White Test.'
                            )}
                          </p>
                          <div className="grid grid-cols-3 gap-1.5">
                            <Button
                              type="button"
                              variant={heteroMethod === 'park' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setHeteroMethod(heteroMethod === 'park' ? 'glejser' : 'park')}
                              className="text-xs rounded-md cursor-pointer font-medium"
                            >
                              {heteroMethod === 'park' ? 'Aktif: Park' : 'Uji Park'}
                            </Button>
                            <Button
                              type="button"
                              variant={heteroMethod === 'spearman' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setHeteroMethod(heteroMethod === 'spearman' ? 'glejser' : 'spearman')}
                              className="text-xs rounded-md cursor-pointer font-medium"
                            >
                              {heteroMethod === 'spearman' ? 'Aktif: Spearman' : 'Spearman'}
                            </Button>
                            <Button
                              type="button"
                              variant={heteroMethod === 'white' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setHeteroMethod(heteroMethod === 'white' ? 'glejser' : 'white')}
                              className="text-xs rounded-md cursor-pointer font-medium"
                            >
                              {heteroMethod === 'white' ? 'Aktif: White' : 'White Test'}
                            </Button>
                          </div>
                        </div>

                        {/* 4. Transformasi Variabel & Non-Parametrik */}
                        <div className="p-3.5 rounded-lg bg-background border border-border space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-foreground">
                              4. Transformasi Data &amp; Fallback Non-Parametrik
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              Log10 / Sqrt / Ln
                            </Badge>
                          </div>
                          {(() => {
                            const activeRecs = (results.transformationRecommendations || []).filter(
                              (r) => r.recommendedMethod !== 'none'
                            );
                            return (
                              <>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                  {activeRecs.length > 0
                                    ? \`Ditemukan \${activeRecs.length} variabel dengan kemencengan (skewed). Klik untuk mentransformasikan pada versi turunan:\`
                                    : 'Tidak ditemukan kemencengan ekstrem pada variabel. Jika normalitas residual tetap tidak terpenuhi, gunakan korelasi non-parametrik.'}
                                </p>
                                {activeRecs.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {activeRecs.map((rec) => (
                                      <Button
                                        key={rec.variable}
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleApplyTransformation(
                                            rec.variable,
                                            rec.recommendedMethod as 'sqrt' | 'log10' | 'ln' | 'inverse'
                                          )
                                        }
                                        className="text-xs rounded-md cursor-pointer font-medium flex items-center gap-1"
                                      >
                                        <span>Terapkan {rec.recommendedMethod.toUpperCase()}</span>
                                        <span className="font-semibold text-primary">({rec.variable})</span>
                                      </Button>
                                    ))}
                                  </div>
                                ) : (
                                  <Button
                                    type="button"
                                    variant={showSpearmanMatrixSection ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setShowSpearmanMatrixSection(!showSpearmanMatrixSection)}
                                    className="w-full text-xs rounded-md cursor-pointer font-medium"
                                  >
                                    {showSpearmanMatrixSection ? 'Tutup Matriks Non-Parametrik' : 'Buka Matriks Korelasi Rank Spearman'}
                                  </Button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4a. Normalitas */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                      <div>
                        <h3 className="font-serif text-lg font-bold text-foreground">
                          1. Uji Normalitas Residual
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Memeriksa apakah sebaran galat/residual model regresi berdistribusi normal. Tersedia 4 metode ekonometrika baku.
                        </p>
                      </div>

                      {/* 4-Way Method Switcher */}
                      <div className="flex items-center flex-wrap gap-1.5 p-1 rounded-lg bg-muted/60 border border-border/60 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setNormalityMethod('ks')}
                          className={cn(
                            'px-2.5 py-1 text-xs rounded-md font-medium cursor-pointer transition-all flex items-center gap-1.5',
                            normalityMethod === 'ks'
                              ? 'bg-background text-foreground shadow-xs font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <span>Kolmogorov-Smirnov</span>
                          {results.normality?.[0]?.normal ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Normal" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-amber-500" title="Tidak Normal" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setNormalityMethod('shapiro')}
                          className={cn(
                            'px-2.5 py-1 text-xs rounded-md font-medium cursor-pointer transition-all flex items-center gap-1.5',
                            normalityMethod === 'shapiro'
                              ? 'bg-background text-foreground shadow-xs font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <span>Shapiro-Wilk</span>
                          {results.shapiroWilk?.normal ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Normal" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-amber-500" title="Tidak Normal" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setNormalityMethod('lilliefors')}
                          className={cn(
                            'px-2.5 py-1 text-xs rounded-md font-medium cursor-pointer transition-all flex items-center gap-1.5',
                            normalityMethod === 'lilliefors'
                              ? 'bg-background text-foreground shadow-xs font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <span>K-S Lilliefors</span>
                          {results.lillieforsNormality?.normal ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Normal" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-amber-500" title="Tidak Normal" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setNormalityMethod('skewness_kurtosis')}
                          className={cn(
                            'px-2.5 py-1 text-xs rounded-md font-medium cursor-pointer transition-all flex items-center gap-1.5',
                            normalityMethod === 'skewness_kurtosis'
                              ? 'bg-background text-foreground shadow-xs font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <span>Z-Score Simetri</span>
                          {results.skewnessKurtosis?.normalAt95 ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Normal" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-amber-500" title="Tidak Normal" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Method Alert */}
                    {normalityMethod === 'ks' && results.normality && results.normality.length > 0 && (
                      <AssumptionAlert
                        status={results.normality[0].normal ? 'passed' : 'violated'}
                        title={
                          results.normality[0].normal
                            ? \`Asumsi Normalitas Terpenuhi (p = \${formatNumber(results.normality[0].pValue, 3)} ≥ 0,05)\`
                            : \`Asumsi Normalitas Belum Terpenuhi (p = \${formatNumber(results.normality[0].pValue, 3)} < 0,05)\`
                        }
                        description={\`Uji One-Sample Kolmogorov-Smirnov terhadap residual menghasilkan statistik \${formatNumber(results.normality[0].statistic, 3)} dengan p-value \${formatNumber(results.normality[0].pValue, 3)}.\`}
                        recommendation={
                          results.normality[0].normal
                            ? 'Data residual regresi berdistribusi normal, memenuhi prasyarat parametrik OLS.'
                            : 'Gunakan uji Shapiro-Wilk, K-S Lilliefors, atau cek Casewise Diagnostics di bawah untuk solusi tanpa manipulasi data.'
                        }
                      />
                    )}

                    {normalityMethod === 'shapiro' && results.shapiroWilk && (
                      <AssumptionAlert
                        status={results.shapiroWilk.normal ? 'passed' : 'violated'}
                        title={
                          results.shapiroWilk.normal
                            ? \`Asumsi Normalitas Terpenuhi via Shapiro-Wilk (W = \${formatNumber(results.shapiroWilk.statistic, 4)}, p = \${formatNumber(results.shapiroWilk.pValue, 4)} ≥ 0,05)\`
                            : \`Asumsi Normalitas Belum Terpenuhi via Shapiro-Wilk (p = \${formatNumber(results.shapiroWilk.pValue, 4)} < 0,05)\`
                        }
                        description="Uji Shapiro-Wilk (Algoritma AS R94 / Royston, 1992) direkomendasikan secara baku untuk sampel survei skripsi dengan kekuatan uji (statistical power) tertinggi."
                        recommendation={
                          results.shapiroWilk.normal
                            ? 'Residual berdistribusi normal secara signifikan. Tabel hasil ini sah dicantumkan pada naskah skripsi Bab 4.'
                            : 'Periksa outlier pada Casewise Diagnostics atau pertimbangkan transformasi variabel jika diperlukan.'
                        }
                      />
                    )}

                    {normalityMethod === 'lilliefors' && results.lillieforsNormality && (
                      <AssumptionAlert
                        status={results.lillieforsNormality.normal ? 'passed' : 'violated'}
                        title={
                          results.lillieforsNormality.normal
                            ? \`Asumsi Normalitas Terpenuhi via K-S Lilliefors (D = \${formatNumber(results.lillieforsNormality.statistic, 4)}, p = \${formatNumber(results.lillieforsNormality.pValue, 3)} ≥ 0,05)\`
                            : \`Asumsi Normalitas Belum Terpenuhi via K-S Lilliefors (p = \${formatNumber(results.lillieforsNormality.pValue, 3)} < 0,05)\`
                        }
                        description="Uji Kolmogorov-Smirnov dengan koreksi signifikansi Lilliefors (Dallal-Wilkinson / Molin-Abdi) sesuai output baku SPSS untuk residual taksiran OLS."
                        recommendation={
                          results.lillieforsNormality.normal
                            ? 'Koreksi Lilliefors membuktikan residual model regresi memenuhi asumsi normalitas secara empirik.'
                            : 'Nilai p masih di bawah 0,05. Periksa indikasi outlier residual di tabel diagnostik.'
                        }
                      />
                    )}

                    {normalityMethod === 'skewness_kurtosis' && results.skewnessKurtosis && (
                      <AssumptionAlert
                        status={results.skewnessKurtosis.normalAt95 ? 'passed' : 'violated'}
                        title={
                          results.skewnessKurtosis.normalAt95
                            ? \`Bentuk Distribusi Memenuhi Asumsi Normalitas (|Z| ≤ 1,96 pada α = 0,05)\`
                            : \`Bentuk Distribusi Melebihi Batas Toleransi Simetri Normal (|Z| > 1,96)\`
                        }
                        description={\`Uji Rasio Z Simetri (Prof. Dr. Imam Ghozali, 2018; Hair et al., 2010): Z-Skewness = \${formatNumber(results.skewnessKurtosis.zSkewness, 2)}, Z-Kurtosis = \${formatNumber(results.skewnessKurtosis.zKurtosis, 2)}.\`}
                        recommendation={
                          results.skewnessKurtosis.normalAt95
                            ? 'Derajat kemencengan dan keruncingan residual berada dalam toleransi normal kurva lonceng Gauss.'
                            : 'Data residual memiliki kemiringan atau keruncingan berlebih. Gunakan transformasi data yang disarankan.'
                        }
                      />
                    )}

                    {/* Table 4.6 depending on method */}
                    {normalityMethod === 'ks' && (
                      <ResultTable
                        tableNumber="Tabel 4.6"
                        title="Hasil Uji Normalitas Kolmogorov-Smirnov Residual"
                        note={\`Uji dilakukan terhadap unstandardized residual model regresi (N = \${results.respondentCount}). Kriteria: Sig. ≥ 0,05 berdistribusi normal.\`}
                        columns={normalityCols}
                        data={results.normality || []}
                        rowKey={(r) => r.test}
                        highlightedValue={highlightedNumber}
                      />
                    )}

                    {normalityMethod === 'shapiro' && (
                      <ResultTable
                        tableNumber="Tabel 4.6"
                        title="Hasil Uji Normalitas Shapiro-Wilk Residual (Metode AS R94 / Royston)"
                        note={\`Uji statistik W Shapiro-Wilk unstandardized residual (N = \${results.respondentCount}). Kriteria: Sig. (p-value) ≥ 0,05 berdistribusi normal.\`}
                        columns={shapiroWilkCols}
                        data={results.shapiroWilk ? [results.shapiroWilk] : []}
                        rowKey={(r) => r.test}
                        highlightedValue={highlightedNumber}
                      />
                    )}

                    {normalityMethod === 'lilliefors' && (
                      <ResultTable
                        tableNumber="Tabel 4.6"
                        title="Hasil Uji Normalitas Kolmogorov-Smirnov dengan Koreksi Lilliefors"
                        note={\`Statistik D Lilliefors terhadap unstandardized residual (N = \${results.respondentCount}). Rujukan: Molin & Abdi (1998) / Footnote Lilliefors SPSS.\`}
                        columns={lillieforsCols}
                        data={results.lillieforsNormality ? [results.lillieforsNormality] : []}
                        rowKey={(r) => r.test}
                        highlightedValue={highlightedNumber}
                      />
                    )}

                    {normalityMethod === 'skewness_kurtosis' && results.skewnessKurtosis && (
                      <ResultTable
                        tableNumber="Tabel 4.6"
                        title="Hasil Uji Bentuk Distribusi Residual (Rasio Z Skewness & Kurtosis)"
                        note="* Rujukan: Prof. Dr. Imam Ghozali (2018) dan Hair et al. (2010). Kriteria normalitas: Nilai Rasio |Z-Score| ≤ 1,96 pada taraf signifikansi α = 0,05 (atau |Z| ≤ 2,58 pada α = 0,01)."
                        columns={skewnessKurtosisCols}
                        data={[
                          {
                            parameter: 'Kemencengan (Skewness)',
                            value: results.skewnessKurtosis.skewness,
                            se: results.skewnessKurtosis.seSkewness,
                            zScore: results.skewnessKurtosis.zSkewness,
                            threshold: '± 1,96 (α = 0,05)',
                            status: Math.abs(results.skewnessKurtosis.zSkewness) <= 1.96,
                          },
                          {
                            parameter: 'Keruncingan (Kurtosis)',
                            value: results.skewnessKurtosis.kurtosis,
                            se: results.skewnessKurtosis.seKurtosis,
                            zScore: results.skewnessKurtosis.zKurtosis,
                            threshold: '± 1,96 (α = 0,05)',
                            status: Math.abs(results.skewnessKurtosis.zKurtosis) <= 1.96,
                          },
                        ]}
                        rowKey={(r) => r.parameter}
                        highlightedValue={highlightedNumber}
                      />
                    )}

                    {/* Casewise Diagnostics Card & Table */}
                    {results.casewiseDiagnostics && (
                      <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-foreground">
                                Casewise Diagnostics Residual (|Z_res| &gt; {formatNumber(results.casewiseDiagnostics.thresholdZ, 1)})
                              </span>
                              <Badge
                                variant={results.casewiseDiagnostics.outlierCount > 0 ? 'destructive' : 'secondary'}
                                className="text-[10px] font-mono"
                              >
                                {results.casewiseDiagnostics.outlierCount > 0
                                  ? \`\${results.casewiseDiagnostics.outlierCount} Kasus Ekstrem\`
                                  : '0 Kasus Ekstrem'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {results.casewiseDiagnostics.outlierCount > 0 ? (
                                <>
                                  Terdapat <strong className="text-foreground">{results.casewiseDiagnostics.outlierCount}</strong> responden terindikasi outlier ekstrem (misal:{' '}
                                  <span className="font-mono font-semibold text-foreground">
                                    {results.casewiseDiagnostics.outlierCases.map((c) => c.caseId).join(', ')}
                                  </span>
                                  ). Standardized residual melebihi 3 standar deviasi dari garis regresi OLS.
                                </>
                              ) : (
                                \`Seluruh residual responden (N = \${results.casewiseDiagnostics.totalCases}) berada dalam toleransi normal (|Z| ≤ 3,0).\`
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {results.casewiseDiagnostics.outlierCount > 0 && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() =>
                                  handleEliminateOutliers(results.casewiseDiagnostics!.outlierCases.map((c) => c.caseNumber))
                                }
                                className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer font-medium"
                              >
                                {isFree && <Lock className="w-3.5 h-3.5 mr-1" />}
                                Kecualikan {results.casewiseDiagnostics.outlierCount} Outlier (Versi Baru)
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowCasewiseTable(!showCasewiseTable)}
                              className="text-xs cursor-pointer font-medium"
                            >
                              {showCasewiseTable ? 'Sembunyikan Diagnostik' : 'Lihat Rincian Casewise Diagnostics'}
                            </Button>
                          </div>
                        </div>

                        {showCasewiseTable && (
                          <div className="pt-2">
                            <ResultTable
                              tableNumber="Tabel 4.6b"
                              title="Tabel Diagnostik Kasus Residual (Casewise Diagnostics)"
                              note="* Rujukan SPSS Casewise Diagnostics: Kasus dengan |Std. Residual| > 3,0 berpotensi mendistorsi asumsi normalitas dan homoskedastisitas OLS."
                              columns={casewiseDiagnosticsCols}
                              data={results.casewiseDiagnostics.allDiagnostics}
                              rowKey={(r) => \`case-\${r.caseNumber}\`}
                              highlightedValue={highlightedNumber}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Visualizer Plot Histogram Residual & Kurva Normal + Normal P-P Plot */}
                    <AcademicResidualPlots
                      n={results.respondentCount}
                      isNormal={results.normality?.[0]?.normal ?? true}
                    />

                    <Chapter4InterpretationCard
                      tableNumber="Tabel 4.6"
                      intinya={
                        normalityMethod === 'shapiro' && results.shapiroWilk
                          ? results.shapiroWilk.normal
                            ? \`Nilai Sig. Shapiro-Wilk sebesar \${formatNumber(results.shapiroWilk.pValue, 4)} (≥ 0,05) membuktikan data residual berdistribusi normal.\`
                            : \`Nilai Sig. Shapiro-Wilk sebesar \${formatNumber(results.shapiroWilk.pValue, 4)} (< 0,05) mengindikasikan residual belum berdistribusi normal.\`
                          : normalityMethod === 'lilliefors' && results.lillieforsNormality
                          ? results.lillieforsNormality.normal
                            ? \`Nilai Sig. K-S Lilliefors sebesar \${formatNumber(results.lillieforsNormality.pValue, 3)} (≥ 0,05) membuktikan data residual berdistribusi normal.\`
                            : \`Nilai Sig. K-S Lilliefors sebesar \${formatNumber(results.lillieforsNormality.pValue, 3)} (< 0,05) mengindikasikan residual belum berdistribusi normal.\`
                          : normalityMethod === 'skewness_kurtosis' && results.skewnessKurtosis
                          ? results.skewnessKurtosis.normalAt95
                            ? \`Rasio Z kemencengan (\${formatNumber(results.skewnessKurtosis.zSkewness, 2)}) dan keruncingan (\${formatNumber(results.skewnessKurtosis.zKurtosis, 2)}) berada dalam batas normal |Z| ≤ 1,96.\`
                            : \`Rasio Z kemencengan atau keruncingan melebihi ambang batas toleransi |Z| > 1,96.\`
                          : results.normality?.[0]?.normal
                          ? \`Nilai Sig. Kolmogorov-Smirnov sebesar \${formatNumber(results.normality[0].pValue, 3)} (≥ 0,05) membuktikan data residual berdistribusi normal.\`
                          : \`Nilai Sig. Kolmogorov-Smirnov sebesar \${results.normality?.[0] ? formatNumber(results.normality[0].pValue, 3) : '-'} (< 0,05) mengindikasikan residual belum berdistribusi normal.\`
                      }
                      interpretation={results.explanations.normality}
                      guidingQuestions={[
                        'Apakah asumsi normalitas residual terpenuhi sehingga estimasi OLS tidak bias?',
                        'Bagaimana pola sebaran titik residual pada Kurva Normal dan Normal P-P Plot?',
                        'Apakah ada nilai residual ekstrim (outlier) yang perlu diteliti lebih lanjut?',
                      ]}
                      onHoverNumber={setHighlightedNumber}
                      activeNumber={highlightedNumber}
                    />

                    {/* Bekal Sidang Skripsi */}
                    <ThesisDefenseCompanion
                      testType="normality"
                      dataMetrics={{
                        n: results.respondentCount,
                        ksSig: results.normality?.[0]?.pValue,
                      }}
                    />
                  </div>

                  {/* 4b. Multikolinearitas */}
                  <div className="space-y-4 pt-6 border-t border-border">
                    <div className="border-b border-border pb-2">
                      <h3 className="font-serif text-lg font-bold text-foreground">
                        2. Uji Multikolinearitas
                      </h3>
                    </div>

                    <ResultTable
                      tableNumber="Tabel 4.7"
                      title="Hasil Uji Multikolinearitas Variabel Bebas (Tolerance & VIF)"
                      note="* Ambang batas: Nilai Tolerance > 0,10 dan Variance Inflation Factor (VIF) < 10,00."
                      columns={multicollinearityCols}
                      data={results.multicollinearity || []}
                      rowKey={(r) => r.variable}
                      highlightedValue={highlightedNumber}
                    />

                    <Chapter4InterpretationCard
                      tableNumber="Tabel 4.7"
                      intinya={
                        results.multicollinearity?.some((m) => m.problematic)
                          ? 'Ditemukan indikasi multikolinearitas pada variabel bebas (VIF ≥ 10,00).'
                          : 'Seluruh variabel bebas memiliki VIF < 10,00 dan Tolerance > 0,10, membuktikan model regresi bebas dari masalah multikolinearitas.'
                      }
                      interpretation={results.explanations.multicollinearity}
                      guidingQuestions={[
                        'Apakah seluruh variabel bebas memiliki nilai VIF < 10,00 dan Tolerance > 0,10?',
                        'Apakah ada korelasi yang terlalu tinggi antar variabel independen?',
                        'Bagaimana keterkaitan antar variabel independen memengaruhi stabilitas koefisien regresi?',
                      ]}
                      onHoverNumber={setHighlightedNumber}
                      activeNumber={highlightedNumber}
                    />

                    {/* Bekal Sidang Skripsi */}
                    <ThesisDefenseCompanion
                      testType="multicollinearity"
                      dataMetrics={{
                        n: results.respondentCount,
                        maxVif: results.multicollinearity?.reduce((max, m) => Math.max(max, m.vif), 0),
                        minTolerance: results.multicollinearity?.reduce((min, m) => Math.min(min, m.tolerance), 1),
                      }}
                    />
                  </div>

                  {/* 4c. Heteroskedastisitas */}
                  <div className="space-y-4 pt-6 border-t border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                      <div>
                        <h3 className="font-serif text-lg font-bold text-foreground">
                          3. Uji Heteroskedastisitas
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Memeriksa apakah varians residual konstan (homoskedastisitas). Tersedia 4 metode baku akademik.
                        </p>
                      </div>

                      {/* 4-Way Method Switcher */}
                      <div className="flex items-center flex-wrap gap-1.5 p-1 rounded-lg bg-muted/60 border border-border/60 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setHeteroMethod('glejser')}
                          className={cn(
                            'px-2.5 py-1 text-xs rounded-md font-medium cursor-pointer transition-all flex items-center gap-1.5',
                            heteroMethod === 'glejser'
                              ? 'bg-background text-foreground shadow-xs font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <span>Uji Glejser</span>
                          {results.heteroscedasticity && !results.heteroscedasticity.some((h) => h.significant) ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Bebas Heteroskedastisitas" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-amber-500" title="Terindikasi Gejala" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeteroMethod('park')}
                          className={cn(
                            'px-2.5 py-1 text-xs rounded-md font-medium cursor-pointer transition-all flex items-center gap-1.5',
                            heteroMethod === 'park'
                              ? 'bg-background text-foreground shadow-xs font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <span>Uji Park (ln(e²))</span>
                          {results.parkHetero && !results.parkHetero.some((p) => p.significant) ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Bebas Heteroskedastisitas" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-amber-500" title="Terindikasi Gejala" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeteroMethod('spearman')}
                          className={cn(
                            'px-2.5 py-1 text-xs rounded-md font-medium cursor-pointer transition-all flex items-center gap-1.5',
                            heteroMethod === 'spearman'
                              ? 'bg-background text-foreground shadow-xs font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <span>Rank Spearman</span>
                          {results.spearmanHetero && !results.spearmanHetero.some((s) => s.significant) ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Bebas Heteroskedastisitas" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-amber-500" title="Terindikasi Gejala" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeteroMethod('white')}
                          className={cn(
                            'px-2.5 py-1 text-xs rounded-md font-medium cursor-pointer transition-all flex items-center gap-1.5',
                            heteroMethod === 'white'
                              ? 'bg-background text-foreground shadow-xs font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <span>Uji White (LM)</span>
                          {results.whiteHetero?.homoscedastic ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Bebas Heteroskedastisitas" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-amber-500" title="Terindikasi Gejala" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Recommendation banner if Glejser failed but alternative passed */}
                    {results.heteroscedasticity?.some((h) => h.significant) &&
                      ((results.parkHetero && !results.parkHetero.some((p) => p.significant)) ||
                        (results.spearmanHetero && !results.spearmanHetero.some((s) => s.significant)) ||
                        (results.whiteHetero && results.whiteHetero.homoscedastic)) && (
                        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 text-xs text-foreground flex items-start gap-2.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-emerald-800 dark:text-emerald-300 block">
                              Solusi Metodologis Sah: Gunakan {results.whiteHetero && results.whiteHetero.homoscedastic ? 'Uji White' : (results.parkHetero && !results.parkHetero.some((p) => p.significant) ? 'Uji Park (Damodar Gujarati)' : 'Korelasi Rank Spearman (Prof. Dr. Imam Ghozali, 2018)')} untuk Bab 4
                            </span>
                            <p className="text-muted-foreground mt-0.5 leading-relaxed">
                              Meskipun Uji Glejser menunjukkan p &lt; 0,05, metode alternatif yang sah secara ekonometrika membuktikan seluruh variabel bebas memiliki Sig. &gt; 0,05 (bebas heteroskedastisitas). Anda dapat menggunakan hasil tabel ini untuk penulisan skripsi tanpa memotong data.
                            </p>
                          </div>
                        </div>
                      )}

                    {heteroMethod === 'glejser' && (
                      <ResultTable
                        tableNumber="Tabel 4.8"
                        title="Hasil Uji Heteroskedastisitas Menggunakan Metode Glejser"
                        note="* Variabel dependen uji adalah Nilai Absolut Residual |e_i|. Kriteria: Sig. > 0,05 tidak terdapat gejala heteroskedastisitas."
                        columns={heteroscedasticityCols}
                        data={results.heteroscedasticity || []}
                        rowKey={(r) => r.variable}
                        highlightedValue={highlightedNumber}
                      />
                    )}

                    {heteroMethod === 'park' && (
                      <ResultTable
                        tableNumber="Tabel 4.8"
                        title="Hasil Uji Heteroskedastisitas Menggunakan Metode Uji Park"
                        note="* Rujukan: Damodar Gujarati / Prof. Dr. Imam Ghozali. Variabel dependen adalah ln(e²). Kriteria: Sig. > 0,05 bebas heteroskedastisitas."
                        columns={parkHeteroCols}
                        data={results.parkHetero || []}
                        rowKey={(r) => r.variable}
                        highlightedValue={highlightedNumber}
                      />
                    )}

                    {heteroMethod === 'spearman' && (
                      <ResultTable
                        tableNumber="Tabel 4.8"
                        title="Hasil Uji Heteroskedastisitas Menggunakan Korelasi Rank Spearman"
                        note="* Rujukan: Prof. Dr. Imam Ghozali (2018). Uji korelasi Rank Spearman antara variabel independen dengan absolute residual. Kriteria: Sig. > 0,05 bebas heteroskedastisitas."
                        columns={spearmanHeteroCols}
                        data={results.spearmanHetero || []}
                        rowKey={(r) => r.variable}
                        highlightedValue={highlightedNumber}
                      />
                    )}

                    {heteroMethod === 'white' && (
                      <ResultTable
                        tableNumber="Tabel 4.8"
                        title="Hasil Uji Heteroskedastisitas Menggunakan Metode White Test (Lagrange Multiplier)"
                        note="* Rujukan: Halbert White (1980). Uji regresi bantu e² = α₀ + α₁Ŷ + α₂Ŷ². Statistik LM = n × R² berdistribusi Chi-Square (df=2). Kriteria: Sig. > 0,05 bebas heteroskedastisitas."
                        columns={whiteHeteroCols}
                        data={results.whiteHetero ? [results.whiteHetero] : []}
                        rowKey={(r) => r.test}
                        highlightedValue={highlightedNumber}
                      />
                    )}

                    {/* Visualizer Plot Scatter Residual vs Fitted */}
                    <AcademicHeteroscedasticityPlot
                      n={results.respondentCount}
                      isHomoscedastic={!results.heteroscedasticity?.some((h) => h.significant)}
                    />

                    <Chapter4InterpretationCard
                      tableNumber="Tabel 4.8"
                      intinya={
                        heteroMethod === 'white' && results.whiteHetero
                          ? results.whiteHetero.homoscedastic
                            ? \`Statistik LM White sebesar \${formatNumber(results.whiteHetero.lmStatistic, 3)} (p = \${formatNumber(results.whiteHetero.pValue, 4)} ≥ 0,05) membuktikan model bebas heteroskedastisitas.\`
                            : \`Statistik LM White sebesar \${formatNumber(results.whiteHetero.lmStatistic, 3)} (p = \${formatNumber(results.whiteHetero.pValue, 4)} < 0,05) mengindikasikan gejala heteroskedastisitas.\`
                          : results.heteroscedasticity?.some((h) => h.significant)
                          ? 'Terdapat variabel yang terindikasi heteroskedastisitas (p < 0,05 pada Uji Glejser).'
                          : 'Nilai Sig. Uji Glejser seluruh variabel bebas berada di atas 0,05, membuktikan tidak ada gejala heteroskedastisitas pada residual.'
                      }
                      interpretation={results.explanations.heteroscedasticity}
                      guidingQuestions={[
                        'Apakah varians residual bersifat konstan (homoskedastisitas) di seluruh rentang nilai prediksi?',
                        'Bagaimana pola sebaran titik pada grafik Scatterplot Residual vs Predicted?',
                        'Jika terjadi ketidaksamaan varians, metode penyelamat apa (Park, Spearman, atau White) yang membuktikan keabsahan model?',
                      ]}
                      onHoverNumber={setHighlightedNumber}
                      activeNumber={highlightedNumber}
                    />

                    {/* Bekal Sidang Skripsi */}
                    <ThesisDefenseCompanion
                      testType="heteroscedasticity"
                      dataMetrics={{
                        n: results.respondentCount,
                        glejserSigMin: results.heteroscedasticity?.reduce((min, h) => Math.min(min, h.pValue), 1),
                      }}
                    />
                  </div>

                  {/* 4d. Autokorelasi Durbin-Watson */}
                  {(results.durbinWatson || enabledOptionalTables.includes('tabel_4_9_dw')) && results.durbinWatson && (
                    <ProResultBlur
                      isLocked={isFree && !isSample}
                      isSample={isSample}
                      testName="Uji Autokorelasi Durbin-Watson"
                      reason="Uji autokorelasi Durbin-Watson untuk model regresi runtun waktu tersedia pada Paket Bulanan & Paket Skripsi."
                    >
                      <div className="space-y-4 pt-6 border-t border-border">
                        <div className="border-b border-border pb-2">
                          <h3 className="font-serif text-lg font-bold text-foreground">
                            4. Uji Autokorelasi (Durbin-Watson)
                          </h3>
                        </div>

                        <AssumptionAlert
                          status={results.durbinWatson.status === 'bebas' ? 'passed' : 'violated'}
                          title={
                            results.durbinWatson.status === 'bebas'
                              ? \`Asumsi Non-Autokorelasi Terpenuhi (d = \${formatNumber(results.durbinWatson.dwStatistic, 4)})\`
                              : \`Perhatian: Terindikasi Gejala Autokorelasi (d = \${formatNumber(results.durbinWatson.dwStatistic, 4)})\`
                          }
                          description={\`Nilai statistik Durbin-Watson sebesar \${formatNumber(results.durbinWatson.dwStatistic, 4)} berada pada rentang batas kritis dL = \${formatNumber(results.durbinWatson.dL, 4)} dan dU = \${formatNumber(results.durbinWatson.dU, 4)} (4 - dU = \${formatNumber(4 - results.durbinWatson.dU, 4)}).\`}
                          recommendation={
                            results.durbinWatson.status === 'bebas'
                              ? 'Tidak terdapat autokorelasi positif maupun negatif pada residual model regresi.'
                              : 'Periksa urutan data observasi atau tambahkan variabel kontrol bila relevan.'
                          }
                        />

                        <ResultTable
                          tableNumber="Tabel 4.9"
                          title="Hasil Uji Autokorelasi Durbin-Watson Model Regresi"
                          note={\`Derajat signifikansi α = 0,05, k = \${kPredictors}, N = \${results.respondentCount}. Kriteria bebas autokorelasi: dU < d < 4 - dU.\`}
                          columns={durbinWatsonCols}
                          data={[results.durbinWatson]}
                          rowKey={() => 'dw-1'}
                          highlightedValue={highlightedNumber}
                        />

                        <Chapter4InterpretationCard
                          tableNumber="Tabel 4.9"
                          intinya={results.durbinWatson.conclusion}
                          interpretation={
                            results.explanations.durbinWatson ||
                            \`Nilai statistik Durbin-Watson sebesar \${formatNumber(results.durbinWatson.dwStatistic, 4)} membuktikan bahwa residual regresi terbebas dari masalah autokorelasi linier.\`
                          }
                          guidingQuestions={[
                            'Apakah nilai statistik Durbin-Watson berada di antara rentang dU dan 4 - dU?',
                            'Apakah ada ketergantungan residual antar waktu observasi responden?',
                            'Mengapa data survei kuesioner cross-sectional umumnya bebas masalah autokorelasi?',
                          ]}
                          onHoverNumber={setHighlightedNumber}
                          activeNumber={highlightedNumber}
                        />
                      </div>
                    </ProResultBlur>
                  )}

                  {/* 4e. Linearitas (Deviation from Linearity) */}
                  {results.linearity && results.linearity.length > 0 && (
                    <div className="space-y-4 pt-6 border-t border-border">
                      <div className="border-b border-border pb-2">
                        <h3 className="font-serif text-lg font-bold text-foreground">
                          5. Uji Linearitas (Deviation from Linearity)
                        </h3>
                      </div>

                      <ResultTable
                        tableNumber="Tabel 4.6c"
                        title="Hasil Uji Linearitas Hubungan Variabel Bebas dan Terikat (ANOVA)"
                        note="* Kriteria hubungan linier: Sig. Deviation from Linearity > 0,05 atau Sig. Linearity < 0,05."
                        columns={linearityCols}
                        data={results.linearity}
                        rowKey={(r) => r.independentVar}
                        highlightedValue={highlightedNumber}
                      />

                      {results.explanations.linearity && (
                        <ExplanationBox
                          title="Interpretasi Uji Linearitas"
                          summarySentence={
                            results.linearity.every((l) => l.isLinear)
                              ? 'Seluruh variabel bebas memiliki hubungan linier yang signifikan dengan variabel terikat.'
                              : 'Terdapat variabel yang deviasi dari linearitasnya mendekati batas signifikansi.'
                          }
                          explanation={results.explanations.linearity}
                          onHoverNumber={setHighlightedNumber}
                          activeNumber={highlightedNumber}
                        />
                      )}
                    </div>
                  )}

                  {/* 4f. Matriks Korelasi Rank Spearman (Non-Parametrik Alternatif) */}
                  {(showSpearmanMatrixSection || (results.spearmanConstructMatrix && results.spearmanConstructMatrix.length > 0)) && (
                    <div className="space-y-4 pt-6 border-t border-border">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-serif text-lg font-bold text-foreground">
                              6. Matriks Korelasi Rank Spearman (Uji Non-Parametrik)
                            </h3>
                            <Badge variant="outline" className="text-[10px]">
                              Alternatif Sah Bab 4
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Rujukan: Sidney Siegel / Prof. Dr. Imam Ghozali (2018). Digunakan sebagai alternatif pengganti Pearson jika asumsi normalitas residual tidak terpenuhi secara parametrik.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSpearmanMatrixSection(!showSpearmanMatrixSection)}
                          className="text-xs cursor-pointer self-start sm:self-auto"
                        >
                          {showSpearmanMatrixSection ? 'Sembunyikan' : 'Tampilkan'}
                        </Button>
                      </div>

                      {showSpearmanMatrixSection && (
                        <div className="space-y-3">
                          <ResultTable
                            tableNumber="Tabel 4.12b"
                            title="Matriks Korelasi Rank Spearman Antar-Konstruk Variabel Penelitian"
                            note="* Rujukan non-parametrik: Koefisien korelasi peringkat Spearman (rho) dengan uji signifikansi dua arah (2-tailed). Kriteria: Sig. < 0,05 berkorelasi signifikan."
                            columns={spearmanConstructCols}
                            data={results.spearmanConstructMatrix || []}
                            rowKey={(r) => \`\${r.var1}-\${r.var2}\`}
                            highlightedValue={highlightedNumber}
                          />

                          <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 text-xs text-foreground flex items-start gap-2.5">
                            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <span className="font-semibold text-blue-900 dark:text-blue-300 block">
                                Cara Pengutipan di Bab 4 Skripsi:
                              </span>
                              <p className="text-muted-foreground leading-relaxed">
                                &quot;Karena pengujian normalitas residual menunjukkan sebaran data tidak berdistribusi normal, maka untuk membuktikan hubungan antarvariabel digunakan analisis korelasi non-parametrik Rank Spearman (Siegel, 1997; Ghozali, 2018). Hasil analisis menunjukkan koefisien korelasi memiliki nilai signifikansi p &lt; 0,05, sehingga hubungan antar konstruk terbukti sah secara statistik.&quot;
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ProResultBlur>
              </TabsContent>

              `;

const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully patched assumptions tab with exact types!');
