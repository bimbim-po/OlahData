import { NextRequest, NextResponse } from 'next/server';
import { getAnalysisRunRepo, getProjectByIdRepo } from '@/lib/db/repo';
import { callStatsExport } from '@/lib/stats-client';
import { mockResults } from '@/lib/mock/results';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: runId } = await params;

  try {
    const body = await req.json();
    const format = body.format === 'pdf' ? 'pdf' : 'docx';
    const includeStatement = body.includeStatement ?? true;

    const run = await getAnalysisRunRepo(runId);
    const results = run?.results || mockResults;
    const project = await getProjectByIdRepo(results.projectId);

    // Free tier gets watermark
    const isFreePlan = true; // By default free tier unless active subscription
    const watermark = isFreePlan;

    try {
      const arrayBuffer = await callStatsExport({
        format,
        results: results as unknown as Record<string, unknown>,
        projectTitle: project?.title || 'Pengaruh Kualitas Layanan dan Kepuasan terhadap Loyalitas Pelanggan',
        includeDeclaration: includeStatement,
        watermark,
      });

      const contentType = format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const extension = format === 'pdf' ? 'pdf' : 'docx';

      return new NextResponse(arrayBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="Bab4_Hasil_Penelitian.${extension}"`,
        },
      });
    } catch {
      // Return a basic buffer if stats service is offline during local test
      const dummyContent = Buffer.from('DRAF DOKUMEN HASIL PENELITIAN OLAHDATA');
      return new NextResponse(dummyContent, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': 'attachment; filename="Hasil_Penelitian.docx"',
        },
      });
    }
  } catch {
    return NextResponse.json(
      { code: 'EXPORT_FAILED', message: 'Gagal menghasilkan berkas ekspor laporan.' },
      { status: 500 }
    );
  }
}
