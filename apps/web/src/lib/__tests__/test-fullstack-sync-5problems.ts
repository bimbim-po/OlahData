/**
 * PENGUJIAN OTOMATIS MENYELURUH (L1 UNIT, L2 API CONTRACT & SECURITY, L3 INTEGRASI & KONKURENSI, L4 STATIC SCAN)
 * Menguji 5 Masalah Inti & Prinsip Sinkronisasi S1-S5 secara deterministik.
 * Jalankan dengan: npx tsx src/lib/__tests__/test-fullstack-sync-5problems.ts
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { NextRequest } from 'next/server';

import {
  computeEffectiveN,
  validateProjectTitle,
  escapeXmlDocumentText,
  escapePdfSafeText,
  serverStore,
  registerServerDataset,
  purgeLegacyDummyRuns,
  LEGACY_DUMMY_RUN_IDS,
} from '@/lib/server/sync-engine';
import { GET as getProjectsRoute, POST as postProjectRoute } from '@/app/api/projects/route';
import {
  GET as getProjectByIdRoute,
  PATCH as patchProjectByIdRoute,
} from '@/app/api/projects/[id]/route';
import {
  POST as postExcludeRowsRoute,
  DELETE as deleteExcludeRowsRoute,
} from '@/app/api/datasets/[id]/exclude-rows/route';
import {
  GET as getNotesRoute,
  PUT as putNotesRoute,
} from '@/app/api/projects/[id]/notes/route';
import {
  GET as getRunsRoute,
  POST as postRunsRoute,
} from '@/app/api/projects/[id]/runs/route';
import { POST as postExportRoute } from '@/app/api/ekspor/route';
import { GET as getVersionRoute } from '@/app/api/version/route';

interface TestCaseResult {
  layer: 'L1-Unit' | 'L2-API' | 'L3-Integration' | 'L4-StaticScan';
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

const resultsLog: TestCaseResult[] = [];

async function runTest(
  layer: TestCaseResult['layer'],
  name: string,
  fn: () => Promise<void> | void
) {
  const start = performance.now();
  try {
    await fn();
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    resultsLog.push({ layer, name, passed: true, durationMs });
    console.log(`  [PASS] [${layer}] ${name} (${durationMs}ms)`);
  } catch (err: unknown) {
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    const msg = err instanceof Error ? err.message : String(err);
    resultsLog.push({ layer, name, passed: false, durationMs, error: msg });
    console.error(`  [FAIL] [${layer}] ${name}: ${msg}`);
  }
}

function makeRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  } = {}
): NextRequest {
  const { method = 'GET', headers = {}, body } = options;
  const reqHeaders = new Headers(headers);
  if (body !== undefined && !reqHeaders.has('Content-Type')) {
    reqHeaders.set('Content-Type', 'application/json');
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    headers: reqHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function main() {
  console.log('====================================================================');
  console.log(' OLAHDATA FULLSTACK SYNC TEST SUITE (S1-S5 & 5 CORE PROBLEMS)');
  console.log('====================================================================\n');

  // =========================================================================
  // L1. UNIT TESTS (LOGIKA MURNI & FUNGSI KANONIK SERVER)
  // =========================================================================
  console.log('--- Layer 1: Unit Tests ---');

  await runTest('L1-Unit', 'S2 computeEffectiveN: dataset kosong, normal (40->39), duplikat indeks, & batas semua dikecualikan', () => {
    assert.equal(computeEffectiveN(0, []), 0, 'Dataset kosong harus menghasilkan N = 0');
    assert.equal(computeEffectiveN(40, []), 40, '40 baris tanpa eksklusi harus menghasilkan N = 40');
    assert.equal(computeEffectiveN(40, [12]), 39, '40 baris dengan 1 baris dikecualikan harus menghasilkan N = 39');
    assert.equal(computeEffectiveN(40, [5, 5, 12, -1, 99]), 38, 'Indeks duplikat/invalid harus diabaikan (40 - 2 = 38)');
    const all40 = Array.from({ length: 40 }, (_, i) => i);
    assert.equal(computeEffectiveN(40, all40), 0, 'Semua baris dikecualikan harus menghasilkan N = 0');
  });

  await runTest('L1-Unit', 'Validasi Judul Proyek: tolak kosong, pendek (<5), panjang (>250), karakter kontrol, dan judul demo pada proyek non-sampel', () => {
    const emptyRes = validateProjectTitle('   ', false);
    assert.equal(emptyRes.valid, false);
    assert.equal(emptyRes.error?.status, 422);

    const shortRes = validateProjectTitle('Abcd', false);
    assert.equal(shortRes.valid, false);
    assert.equal(shortRes.error?.code, 'INVALID_TITLE_LENGTH');

    const longRes = validateProjectTitle('A'.repeat(251), false);
    assert.equal(longRes.valid, false);
    assert.equal(longRes.error?.code, 'INVALID_TITLE_LENGTH');

    const demoNonSample = validateProjectTitle(
      'Pengaruh Kualitas Layanan dan Kepuasan terhadap Loyalitas Pelanggan',
      false
    );
    assert.equal(demoNonSample.valid, false);
    assert.equal(demoNonSample.error?.code, 'DEMO_TITLE_FORBIDDEN');

    const demoOnSample = validateProjectTitle(
      'Pengaruh Kualitas Layanan dan Kepuasan terhadap Loyalitas Pelanggan',
      true
    );
    assert.equal(demoOnSample.valid, true, 'Proyek sampel resmi boleh memakai judul sampel');

    const specialValid = validateProjectTitle(
      '  Pengaruh Harga & Promosi\u0007 (Studi pada UMKM "Maju Jaya" — Tahun 2024/2025)  ',
      false
    );
    assert.equal(specialValid.valid, true);
    assert.equal(
      specialValid.sanitizedTitle,
      'Pengaruh Harga & Promosi (Studi pada UMKM "Maju Jaya" — Tahun 2024/2025)'
    );
  });

  await runTest('L1-Unit', 'Escaping XML/Docx & PDF: karakter &, <, >, kutip, Unicode Indonesia, dan simbol statistik (R², α, β, ≥, —)', () => {
    const raw = 'Pengaruh Harga & Promosi <UMKM> "Maju Jaya" — Model R² ≥ 0,50 (α = 0,05; β = 0,72)';
    const xmlEscaped = escapeXmlDocumentText(raw);
    assert.ok(xmlEscaped.includes('&amp;'), 'Harus meng-escape & menjadi &amp; (bukan "dan")');
    assert.ok(xmlEscaped.includes('&lt;UMKM&gt;'), 'Harus meng-escape < dan >');
    assert.ok(xmlEscaped.includes('&quot;Maju Jaya&quot;'), 'Harus meng-escape tanda kutip ganda');
    assert.ok(xmlEscaped.includes('R² ≥ 0,50 (α = 0,05; β = 0,72)'), 'Simbol Unicode statistik harus utuh di XML/Word');

    const pdfEscaped = escapePdfSafeText(raw);
    assert.ok(!pdfEscaped.includes('?'), 'Simbol statistik dan em-dash tidak boleh berubah menjadi tanda tanya (?) di PDF');
    assert.ok(pdfEscaped.includes('R2 >= 0,50 \\(alpha = 0,05; beta = 0,72\\)'), 'Kurung dan simbol statistik harus di-escape aman untuk PDF 1.4');
  });

  await runTest('L1-Unit', 'Migrasi Pembersihan Riwayat: hapus log dummy (run-2026-001..004) dan pertahankan run nyata secara idempoten', () => {
    serverStore.resetForTesting();
    // Masukkan 2 run dummy dan 1 proyek + run nyata
    for (const dummyId of LEGACY_DUMMY_RUN_IDS) {
      serverStore.runs.set(dummyId, {
        id: dummyId,
        projectId: 'project-1',
        datasetId: '',
        datasetHash: '',
        nUsed: 120,
        nExcluded: 0,
        tests: ['descriptive'],
        params: {},
        engineVersion: '1.0.0',
        status: 'succeeded',
        errorMessage: null,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: 100,
        resultsRef: null,
        idempotencyKey: null,
      });
    }

    serverStore.projects.set('proj_real_1', {
      id: 'proj_real_1',
      ownerId: 'user-A',
      title: 'Pengaruh Literasi Keuangan terhadap Keputusan Investasi Mahasiswa',
      department: 'Manajemen',
      researchType: 'Regresi Linier Berganda',
      status: 'completed',
      isSample: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    serverStore.runs.set('run_real_1', {
      id: 'run_real_1',
      projectId: 'proj_real_1',
      datasetId: 'ds_real_1',
      datasetHash: 'sha256_valid_hash',
      nUsed: 40,
      nExcluded: 0,
      tests: ['descriptive', 'reliability'],
      params: {},
      engineVersion: '1.0.0',
      status: 'succeeded',
      errorMessage: null,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 250,
      resultsRef: 'res_real_1',
      idempotencyKey: 'idem-1',
    });

    const firstPurge = purgeLegacyDummyRuns();
    assert.equal(firstPurge.purgedCount, LEGACY_DUMMY_RUN_IDS.size);
    assert.equal(firstPurge.remainingCount, 1);
    assert.equal(serverStore.runs.has('run_real_1'), true);

    // Jalankan kedua kali untuk memastikan idempoten
    const secondPurge = purgeLegacyDummyRuns();
    assert.equal(secondPurge.purgedCount, 0);
    assert.equal(secondPurge.remainingCount, 1);
  });

  // =========================================================================
  // L2. API CONTRACT & SECURITY ISOLATION TESTS (401, 403, 404, 409, 422)
  // =========================================================================
  console.log('\n--- Layer 2: API Contract & Security Isolation Tests ---');

  serverStore.resetForTesting();

  await runTest('L2-API', 'Autentikasi 401: tolak request tanpa kredensial saat x-require-auth aktif', async () => {
    const req = makeRequest('http://localhost:3000/api/projects', {
      method: 'GET',
      headers: { 'x-require-auth': '1' },
    });
    const res = await getProjectsRoute(req);
    assert.equal(res.status, 401);
    assert.equal(res.headers.get('Cache-Control')?.includes('no-store'), true);
  });

  await runTest('L2-API', 'Isolasi Pengguna S3 (403 Forbidden & 404 Not Found): User B tidak dapat membaca/mengubah proyek User A', async () => {
    const createReq = makeRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: { 'x-user-id': 'user-A' },
      body: {
        id: 'proj_user_a',
        title: 'Pengaruh Budaya Organisasi terhadap Kinerja Karyawan PT X',
        department: 'Manajemen',
      },
    });
    const createRes = await postProjectRoute(createReq);
    assert.equal(createRes.status, 201);

    // User B mencoba GET proyek User A -> 403 Forbidden
    const getByB = await getProjectByIdRoute(
      makeRequest('http://localhost:3000/api/projects/proj_user_a', {
        headers: { 'x-user-id': 'user-B' },
      }),
      { params: Promise.resolve({ id: 'proj_user_a' }) }
    );
    assert.equal(getByB.status, 403);

    // User B mencoba PATCH judul proyek User A -> 403 Forbidden
    const patchByB = await patchProjectByIdRoute(
      makeRequest('http://localhost:3000/api/projects/proj_user_a', {
        method: 'PATCH',
        headers: { 'x-user-id': 'user-B' },
        body: { title: 'Judul Bajakan oleh User B' },
      }),
      { params: Promise.resolve({ id: 'proj_user_a' }) }
    );
    assert.equal(patchByB.status, 403);

    // Proyek tidak ada -> 404 Not Found
    const notFoundRes = await getProjectByIdRoute(
      makeRequest('http://localhost:3000/api/projects/proj_tidak_ada', {
        headers: { 'x-user-id': 'user-A' },
      }),
      { params: Promise.resolve({ id: 'proj_tidak_ada' }) }
    );
    assert.equal(notFoundRes.status, 404);
  });

  await runTest('L2-API', 'Optimistic Concurrency Control Catatan (Masalah 2): PUT /api/projects/[id]/notes mengembalikan 409 Conflict saat versi basi', async () => {
    // Tab 1 menyimpan catatan awal -> versi 1
    const put1 = await putNotesRoute(
      makeRequest('http://localhost:3000/api/projects/proj_user_a/notes', {
        method: 'PUT',
        headers: { 'x-user-id': 'user-A' },
        body: {
          sectionId: 'tabel_4_8',
          text: 'Temuan ini sejalan dengan teori Kotler & Keller (2016).',
        },
      }),
      { params: Promise.resolve({ id: 'proj_user_a' }) }
    );
    assert.equal(put1.status, 200);
    const body1 = await put1.json();
    assert.equal(body1.version, 1);

    // Tab 2 menyimpan pembaruan dengan version = 1 -> berhasil naik ke versi 2
    const put2 = await putNotesRoute(
      makeRequest('http://localhost:3000/api/projects/proj_user_a/notes', {
        method: 'PUT',
        headers: { 'x-user-id': 'user-A' },
        body: {
          sectionId: 'tabel_4_8',
          text: 'Temuan ini sejalan dengan teori Kotler & Keller (2016) serta Tjiptono (2019).',
          version: 1,
        },
      }),
      { params: Promise.resolve({ id: 'proj_user_a' }) }
    );
    assert.equal(put2.status, 200);
    const body2 = await put2.json();
    assert.equal(body2.version, 2);

    // Tab 1 (masih memegang version = 1 yang sudah basi) mencoba menyimpan -> WAJIB 409 Conflict!
    const putStale = await putNotesRoute(
      makeRequest('http://localhost:3000/api/projects/proj_user_a/notes', {
        method: 'PUT',
        headers: { 'x-user-id': 'user-A' },
        body: {
          sectionId: 'tabel_4_8',
          text: 'Ketikan baru dari Tab 1 yang belum disinkronkan.',
          version: 1,
        },
      }),
      { params: Promise.resolve({ id: 'proj_user_a' }) }
    );
    assert.equal(putStale.status, 409);
    const conflictData = await putStale.json();
    assert.equal(conflictData.code, 'NOTE_VERSION_CONFLICT');
    assert.equal(conflictData.serverVersion, 2);
    assert.ok(conflictData.currentNote.text.includes('Tjiptono (2019)'));
  });

  // =========================================================================
  // L3. INTEGRASI UJUNG-KE-UJUNG & KONKURENSI (S1-S5 & MASALAH 1-5)
  // =========================================================================
  console.log('\n--- Layer 3: End-to-End Integration & Concurrency Flow ---');

  await runTest('L3-Integration', 'Alur Penuh: Unggah 40 Baris -> Eksklusi 1 Baris (N=39) -> Double-Click Analisis Idempoten -> Ubah Judul -> Ekspor Word & PDF memuat Judul Asli, N=39, dan Catatan Teori', async () => {
    // 1. Daftarkan dataset 40 responden untuk proj_user_a
    const sampleRows = Array.from({ length: 40 }, (_, idx) => ({
      Responden: `R${idx + 1}`,
      X1_1: (idx % 5) + 1,
      X1_2: ((idx + 1) % 5) + 1,
      Y_1: ((idx + 2) % 5) + 1,
    }));

    const regDs = registerServerDataset({
      datasetId: 'ds_40_rows',
      projectId: 'proj_user_a',
      ownerId: 'user-A',
      rowCount: 40,
      columnCount: 4,
      rows: sampleRows,
    });
    assert.equal(regDs.ok, true);
    if (regDs.ok) {
      assert.equal(regDs.project.respondentCount, 40);
      assert.equal(regDs.project.dataset.n, 40);
    }

    // 2. Eksklusi 1 baris responden (baris indeks 5) lewat endpoint POST /api/datasets/[id]/exclude-rows
    const exclRes = await postExcludeRowsRoute(
      makeRequest('http://localhost:3000/api/datasets/ds_40_rows/exclude-rows', {
        method: 'POST',
        headers: { 'x-user-id': 'user-A' },
        body: { rows: [5], reason: 'Jawaban straight-lining' },
      }),
      { params: Promise.resolve({ id: 'ds_40_rows' }) }
    );
    assert.equal(exclRes.status, 200);
    const exclJson = await exclRes.json();
    assert.equal(exclJson.n, 39);
    assert.equal(exclJson.row_count, 40);
    assert.equal(exclJson.excluded_count, 1);

    // Uji batas: mencoba mengecualikan 36 baris lagi sehingga sisa N = 3 (< 5) -> harus ditolak 422!
    const tooManyRows = Array.from({ length: 37 }, (_, i) => i);
    const rejectExcl = await postExcludeRowsRoute(
      makeRequest('http://localhost:3000/api/datasets/ds_40_rows/exclude-rows', {
        method: 'POST',
        headers: { 'x-user-id': 'user-A' },
        body: { rows: tooManyRows },
      }),
      { params: Promise.resolve({ id: 'ds_40_rows' }) }
    );
    assert.equal(rejectExcl.status, 422);

    // Verifikasi GET /api/projects/[id] langsung menampilkan N = 39 (S2 & S4)
    const projAfterExcl = await getProjectByIdRoute(
      makeRequest('http://localhost:3000/api/projects/proj_user_a', {
        headers: { 'x-user-id': 'user-A' },
      }),
      { params: Promise.resolve({ id: 'proj_user_a' }) }
    );
    const projDto = await projAfterExcl.json();
    assert.equal(projDto.respondentCount, 39);
    assert.equal(projDto.dataset.n, 39);

    // 3. Double-Click Idempotency: kirim 2 POST /api/projects/[id]/runs dengan idempotencyKey sama
    const [runRes1, runRes2] = await Promise.all([
      postRunsRoute(
        makeRequest('http://localhost:3000/api/projects/proj_user_a/runs', {
          method: 'POST',
          headers: { 'x-user-id': 'user-A', 'idempotency-key': 'click-paket-bab4-001' },
          body: { selectedTests: ['descriptive', 'reliability', 'regression'] },
        }),
        { params: Promise.resolve({ id: 'proj_user_a' }) }
      ),
      postRunsRoute(
        makeRequest('http://localhost:3000/api/projects/proj_user_a/runs', {
          method: 'POST',
          headers: { 'x-user-id': 'user-A', 'idempotency-key': 'click-paket-bab4-001' },
          body: { selectedTests: ['descriptive', 'reliability', 'regression'] },
        }),
        { params: Promise.resolve({ id: 'proj_user_a' }) }
      ),
    ]);

    const runBody1 = await runRes1.json();
    const runBody2 = await runRes2.json();
    assert.equal(runBody1.run_id, runBody2.run_id, 'Double-click dengan idempotency-key sama wajib menghasilkan 1 run_id tunggal');
    assert.equal(runBody1.run.nUsed, 39, 'Analisis wajib menggunakan N = 39');
    assert.equal(runBody1.run.nExcluded, 1);

    // 4. Simulasi kegagalan analisis -> harus tercatat dengan status = 'failed' dan errorMessage
    const failRunRes = await postRunsRoute(
      makeRequest('http://localhost:3000/api/projects/proj_user_a/runs', {
        method: 'POST',
        headers: { 'x-user-id': 'user-A' },
        body: { simulateEngineFailure: true },
      }),
      { params: Promise.resolve({ id: 'proj_user_a' }) }
    );
    assert.equal(failRunRes.status, 500);
    const failRunJson = await failRunRes.json();
    assert.equal(failRunJson.failedRun.status, 'failed');
    assert.ok(failRunJson.failedRun.errorMessage.includes('singularitas'));

    // Cek GET /api/projects/proj_user_a/runs -> harus ada tepat 2 run (1 succeeded, 1 failed), 0 dummy!
    const historyRes = await getRunsRoute(
      makeRequest('http://localhost:3000/api/projects/proj_user_a/runs', {
        headers: { 'x-user-id': 'user-A' },
      }),
      { params: Promise.resolve({ id: 'proj_user_a' }) }
    );
    const historyJson = await historyRes.json();
    assert.equal(historyJson.runs.length, 2);

    // 5. Ubah judul proyek ke judul dengan karakter khusus (&, "", —, /)
    const newCustomTitle =
      'Pengaruh Harga & Promosi (Studi pada UMKM "Maju Jaya" — Tahun 2024/2025)';
    const patchRes = await patchProjectByIdRoute(
      makeRequest('http://localhost:3000/api/projects/proj_user_a', {
        method: 'PATCH',
        headers: { 'x-user-id': 'user-A' },
        body: { title: newCustomTitle },
      }),
      { params: Promise.resolve({ id: 'proj_user_a' }) }
    );
    assert.equal(patchRes.status, 200);

    // 6. Ekspor Word (.docx) dan PDF (.pdf) langsung dari server dengan projectId
    const exportDocxRes = await postExportRoute(
      makeRequest('http://localhost:3000/api/ekspor?direct=1', {
        method: 'POST',
        headers: { 'x-user-id': 'user-A' },
        body: {
          projectId: 'proj_user_a',
          runId: runBody1.run_id,
          format: 'docx',
          direct: true,
        },
      })
    );
    assert.equal(exportDocxRes.status, 200);
    const docxText = await exportDocxRes.text();

    // Pastikan judul asli yang di-escape ada di dalam dokumen Word, BUKAN judul demo!
    assert.ok(
      docxText.includes('Pengaruh Harga &amp; Promosi (Studi pada UMKM &quot;Maju Jaya&quot; — Tahun 2024/2025)'),
      'Dokumen Word harus memuat judul terbaru dari database yang telah di-escape XML'
    );
    assert.ok(
      !docxText.includes('Pengaruh Kualitas Layanan dan Kepuasan terhadap Loyalitas Pelanggan'),
      'Dokumen Word DILARANG memuat judul demo bawaan'
    );
    assert.ok(
      docxText.includes('N = <strong>39</strong> Responden') || docxText.includes('N = 39 responden'),
      'Dokumen Word harus menampilkan N = 39 sesuai hasil eksklusi baris'
    );
    assert.ok(
      docxText.includes('Tjiptono (2019)'),
      'Dokumen Word harus menyertakan catatan teori yang disimpan di tabel notes'
    );

    // Ekspor PDF (.pdf)
    const exportPdfRes = await postExportRoute(
      makeRequest('http://localhost:3000/api/ekspor?direct=1', {
        method: 'POST',
        headers: { 'x-user-id': 'user-A' },
        body: {
          projectId: 'proj_user_a',
          runId: runBody1.run_id,
          format: 'pdf',
          direct: true,
        },
      })
    );
    assert.equal(exportPdfRes.status, 200);
    const pdfRawText = await exportPdfRes.text();
    assert.ok(pdfRawText.startsWith('%PDF-1.4'), 'Harus menghasilkan dokumen PDF 1.4 yang valid');
    assert.ok(
      pdfRawText.includes('Pengaruh Harga & Promosi \\(Studi pada UMKM "Maju Jaya" -- Tahun 2024/2025\\)'),
      'Dokumen PDF harus memuat judul proyek asli yang telah di-escape untuk PDF'
    );
    assert.ok(
      !pdfRawText.includes('Pengaruh Kualitas Layanan dan Kepuasan terhadap Loyalitas Pelanggan'),
      'Dokumen PDF DILARANG memuat judul demo bawaan'
    );
    assert.ok(
      pdfRawText.includes('N = 39 Responden'),
      'Dokumen PDF harus menampilkan N = 39 Responden'
    );
    assert.ok(
      pdfRawText.includes('Tjiptono \\(2019\\)'),
      'Dokumen PDF harus memuat catatan teori peneliti dari tabel notes'
    );

    // 7. Pastikan ekspor tanpa judul atau dengan judul demo pada proyek non-sampel ditolak 422!
    const rejectDemoExport = await postExportRoute(
      makeRequest('http://localhost:3000/api/ekspor', {
        method: 'POST',
        headers: { 'x-user-id': 'user-A' },
        body: {
          projectTitle: 'Pengaruh Kualitas Layanan dan Kepuasan terhadap Loyalitas Pelanggan',
          isSample: false,
          format: 'docx',
        },
      })
    );
    assert.equal(rejectDemoExport.status, 422);
    const rejectJson = await rejectDemoExport.json();
    assert.equal(
      rejectJson.message,
      'Judul penelitian belum diisi. Lengkapi di formulir proyek sebelum mengunduh.'
    );

    // 8. Pulihkan baris yang dikecualikan lewat DELETE /api/datasets/[id]/exclude-rows -> N kembali 40
    const restoreRes = await deleteExcludeRowsRoute(
      makeRequest('http://localhost:3000/api/datasets/ds_40_rows/exclude-rows', {
        method: 'DELETE',
        headers: { 'x-user-id': 'user-A' },
        body: { rows: [5] },
      }),
      { params: Promise.resolve({ id: 'ds_40_rows' }) }
    );
    assert.equal(restoreRes.status, 200);
    const restoreJson = await restoreRes.json();
    assert.equal(restoreJson.n, 40);
  });

  await runTest('L2-API', 'Endpoint Verifikasi Deploy GET /api/version mengembalikan metadata versi dengan Cache-Control: no-store', async () => {
    const res = await getVersionRoute();
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Cache-Control')?.includes('no-store'), true);
    const body = await res.json();
    assert.equal(body.service, 'olahdata-web');
    assert.equal(body.syncSpecVersion, 'S1-S5-v1');
  });

  // =========================================================================
  // L4. STATIC SCAN CODEBASE (MEMASTIKAN TIDAK ADA FALLBACK DUMMY DI JALUR PRODUKSI)
  // =========================================================================
  console.log('\n--- Layer 4: Static Codebase Verification ---');

  await runTest('L4-StaticScan', 'Pastikan api/ekspor/route.ts, pdf-generator.ts, dan db/repo.ts bebas dari fallback judul demo & respondentCount: 117', () => {
    const webSrc = path.resolve(process.cwd(), 'src');
    const eksporRouteContent = fs.readFileSync(
      path.join(webSrc, 'app', 'api', 'ekspor', 'route.ts'),
      'utf-8'
    );
    const pdfGenContent = fs.readFileSync(
      path.join(webSrc, 'lib', 'pdf-generator.ts'),
      'utf-8'
    );
    const repoContent = fs.readFileSync(
      path.join(webSrc, 'lib', 'db', 'repo.ts'),
      'utf-8'
    );

    assert.ok(
      !eksporRouteContent.includes(
        "body.projectTitle || 'Pengaruh Kualitas Layanan dan Kepuasan terhadap Loyalitas Pelanggan'"
      ),
      'api/ekspor/route.ts tidak boleh memiliki fallback judul demo'
    );
    assert.ok(
      !pdfGenContent.includes(
        "options.projectTitle || 'Pengaruh Kualitas Layanan dan Kepuasan terhadap Loyalitas Pelanggan'"
      ),
      'pdf-generator.ts tidak boleh memiliki fallback judul demo'
    );
    assert.ok(
      !repoContent.includes('respondentCount: 117'),
      'db/repo.ts tidak boleh memiliki angka hardcoded respondentCount: 117'
    );
  });

  // =========================================================================
  // RINGKASAN HASIL PENGUJIAN
  // =========================================================================
  console.log('\n====================================================================');
  const passedCount = resultsLog.filter((r) => r.passed).length;
  const failedCount = resultsLog.filter((r) => !r.passed).length;
  console.log(` TOTAL: ${resultsLog.length} Pengujian | LULUS: ${passedCount} | GAGAL: ${failedCount}`);
  console.log('====================================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unhandled error in test runner:', err);
  process.exit(1);
});
