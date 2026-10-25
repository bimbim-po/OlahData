import { NextRequest, NextResponse } from 'next/server';
import {
  executeServerAnalysisRun,
  listServerRuns,
  NO_STORE_HEADERS,
} from '@/lib/server/sync-engine';
import { resolveRequestUserId } from '@/lib/server/request-auth';
import { mockResults } from '@/lib/mock/results';
import type { AnalysisResults, DescriptiveResult } from '@/lib/api/types';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const userId = resolveRequestUserId(req);

  const res = listServerRuns({
    ownerId: userId,
    projectId,
  });

  if (!res.ok) {
    return NextResponse.json(
      { code: res.error.code, message: res.error.message },
      { status: res.error.status, headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.json(
    { runs: res.data },
    { status: 200, headers: NO_STORE_HEADERS }
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const userId = resolveRequestUserId(req);

  try {
    const body = await req.json();
    const {
      datasetId,
      selectedTests = [
        'descriptive',
        'validity',
        'reliability',
        'regression',
        'normality',
        'multicollinearity',
        'heteroscedasticity',
      ],
      significanceLevel = 0.05,
      idempotencyKey,
      simulateEngineFailure = false,
    } = body || {};

    const headerIdemKey = req.headers.get('idempotency-key') || idempotencyKey;

    const execRes = executeServerAnalysisRun({
      projectId,
      ownerId: userId,
      datasetId,
      tests: selectedTests,
      significanceLevel,
      idempotencyKey: headerIdemKey,
      computeFn: ({ project, effectiveN }): AnalysisResults => {
        if (simulateEngineFailure) {
          throw new Error(
            'Mesin analisis gagal mengeksekusi matriks regresi karena singularitas kovarians.'
          );
        }

        const baseDescriptive: DescriptiveResult[] = mockResults.descriptive || [];

        return {
          ...mockResults,
          projectId: project.id,
          projectTitle: project.title,
          respondentCount: effectiveN,
          significanceLevel,
          descriptive: baseDescriptive.map((d: DescriptiveResult) => ({
            ...d,
            n: effectiveN,
          })),
          explanations: {
            ...mockResults.explanations,
            descriptive: `Berdasarkan analisis statistik deskriptif terhadap N = ${effectiveN} responden pada penelitian "${project.title}", diperoleh ringkasan nilai rata-rata dan simpangan baku untuk setiap variabel penelitian.`,
          },
        };
      },
    });

    if (!execRes.ok) {
      return NextResponse.json(
        {
          code: execRes.error.code,
          message: execRes.error.message,
          failedRun: execRes.failedRun || null,
        },
        { status: execRes.error.status, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        run_id: execRes.run.id,
        status: execRes.run.status,
        deduplicated: execRes.deduplicated,
        run: execRes.run,
        results: execRes.results,
      },
      { status: execRes.deduplicated ? 200 : 201, headers: NO_STORE_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: 'Format permintaan eksekusi analisis tidak valid.' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}
