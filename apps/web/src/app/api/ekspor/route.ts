import { NextRequest, NextResponse } from 'next/server';
import {
  prepareServerExportContext,
  validateProjectTitle,
  escapeXmlDocumentText,
  NO_STORE_HEADERS,
} from '@/lib/server/sync-engine';
import { resolveRequestUserId } from '@/lib/server/request-auth';
import {
  buildWordTableHtml,
  buildWordDocumentContent,
} from '@/lib/word-table';
import { generateAcademicPdfReport } from '@/lib/pdf-generator';
import { formatNumber } from '@/lib/format';
import type { AnalysisResults } from '@/lib/api/types';

export const dynamic = 'force-dynamic';

interface ExportJob {
  id: string;
  projectId: string;
  runId: string;
  titleSnapshot: string;
  status: 'processing' | 'ready' | 'failed';
  format: 'docx' | 'pdf';
  filename: string;
  data?: Uint8Array;
  error?: string;
  createdAt: number;
}

const exportJobs = new Map<string, ExportJob>();

function cleanupOldJobs() {
  const now = Date.now();
  for (const [id, job] of exportJobs.entries()) {
    if (now - job.createdAt > 5 * 60 * 1000) {
      exportJobs.delete(id);
    }
  }
}

function buildServerDocumentBytes(params: {
  format: 'docx' | 'pdf';
  projectTitle: string;
  results: AnalysisResults;
  notesMap: Record<string, string>;
  includeDeclaration: boolean;
  watermark: boolean;
}): Uint8Array {
  const { format, projectTitle, results, notesMap, includeDeclaration, watermark } = params;

  if (format === 'pdf') {
    return generateAcademicPdfReport(results, {
      projectTitle,
      includeStatement: includeDeclaration,
      watermark,
      notesMap,
    });
  }

  const sections: { title: string; contentHtml: string; sectionKey?: string }[] = [];

  if (results.descriptive && results.descriptive.length > 0) {
    const tableHtml = buildWordTableHtml({
      tableNumber: 'Tabel 4.1',
      title: 'Hasil Analisis Statistik Deskriptif Variabel Penelitian',
      note: `Dihitung dari N = ${results.respondentCount} responden aktif.`,
      columns: [
        { header: 'Variabel Penelitian', align: 'left' },
        { header: 'N', align: 'right' },
        { header: 'Mean', align: 'right' },
        { header: 'Median', align: 'right' },
        { header: 'Std Dev', align: 'right' },
        { header: 'Min', align: 'right' },
        { header: 'Max', align: 'right' },
      ],
      rows: results.descriptive.map((r) => [
        r.variable,
        formatNumber(r.n),
        formatNumber(r.mean, 3),
        formatNumber(r.median, 3),
        formatNumber(r.stdDev, 3),
        formatNumber(r.min, 3),
        formatNumber(r.max, 3),
      ]),
    });
    const narrativeHtml = results.explanations?.descriptive
      ? `<p>${escapeXmlDocumentText(results.explanations.descriptive)}</p>`
      : '';
    sections.push({
      title: '1. Statistik Deskriptif Responden',
      contentHtml: tableHtml + narrativeHtml,
      sectionKey: 'descriptive',
    });
  }

  if (results.reliability && results.reliability.length > 0) {
    const tableHtml = buildWordTableHtml({
      tableNumber: 'Tabel 4.3',
      title: "Hasil Pengujian Reliabilitas Konstruk (Cronbach's Alpha)",
      note: 'Ambang batas nilai reliabilitas Cronbach Alpha ≥ 0,600.',
      columns: [
        { header: 'Konstruk Variabel', align: 'left' },
        { header: 'Jumlah Butir', align: 'right' },
        { header: "Cronbach's Alpha", align: 'right' },
        { header: 'Ambang Batas', align: 'right' },
        { header: 'Status', align: 'center' },
      ],
      rows: results.reliability.map((r) => [
        r.construct,
        formatNumber(r.itemCount),
        formatNumber(r.cronbachAlpha, 3),
        '0,600',
        r.reliable ? 'Reliabel' : 'Tidak Reliabel',
      ]),
    });
    const narrativeHtml = results.explanations?.reliability
      ? `<p>${escapeXmlDocumentText(results.explanations.reliability)}</p>`
      : '';
    sections.push({
      title: '2. Uji Reliabilitas Instrumen',
      contentHtml: tableHtml + narrativeHtml,
      sectionKey: 'reliability',
    });
  }

  if (results.regression && results.regression.length > 0) {
    const tableHtml = buildWordTableHtml({
      tableNumber: 'Tabel 4.7',
      title: 'Hasil Analisis Regresi Linier Berganda (Uji t Parsial)',
      note: 'Tingkat signifikansi α = 0,05.',
      columns: [
        { header: 'Variabel', align: 'left' },
        { header: 'Koefisien (B)', align: 'right' },
        { header: 'Std. Error', align: 'right' },
        { header: 't Hitung', align: 'right' },
        { header: 'Sig. (p-value)', align: 'right' },
      ],
      rows: results.regression.map((r) => [
        r.variable,
        formatNumber(r.coefficient, 3),
        formatNumber(r.stdError, 3),
        formatNumber(r.tHitung, 3),
        formatNumber(r.pValue, 3),
      ]),
    });
    const narrativeHtml = results.explanations?.regression
      ? `<p>${escapeXmlDocumentText(results.explanations.regression)}</p>`
      : '';
    sections.push({
      title: '3. Analisis Regresi Linier Berganda',
      contentHtml: tableHtml + narrativeHtml,
      sectionKey: 'regression',
    });
  }

  if (includeDeclaration) {
    sections.push({
      title: 'Lampiran Pernyataan Transparansi',
      contentHtml:
        '<p>Peneliti menyatakan secara bertanggung jawab bahwa seluruh data kuesioner dalam penelitian ini diolah menggunakan mesin statistik deterministik berlisensi terbuka dan divalidasi keakuratannya.</p>',
    });
  }

  const docHtml = buildWordDocumentContent(projectTitle, sections, {
    respondentCount: results.respondentCount,
    notesMap,
  });

  return new TextEncoder().encode(docHtml);
}

export async function POST(req: NextRequest) {
  cleanupOldJobs();
  const userId = resolveRequestUserId(req);

  try {
    const body = await req.json().catch(() => ({}));
    const format: 'docx' | 'pdf' = body.format === 'pdf' ? 'pdf' : 'docx';
    const includeDeclaration = body.includeDeclaration ?? true;
    const watermark = body.watermark ?? false;
    const directDownload =
      body.direct === true || req.nextUrl.searchParams.get('direct') === '1';

    let resolvedTitle = '';
    let resolvedResults: AnalysisResults | null = null;
    let resolvedNotesMap: Record<string, string> = {};
    let resolvedProjectId = typeof body.projectId === 'string' ? body.projectId : '';
    let resolvedRunId = typeof body.runId === 'string' ? body.runId : '';

    // 1. Jika projectId dikirim, WAJIB baca judul, catatan, dan hasil langsung dari database server (Prinsip S1 & Masalah 5)
    if (resolvedProjectId) {
      const ctxRes = prepareServerExportContext({
        projectId: resolvedProjectId,
        ownerId: userId,
        runId: resolvedRunId || undefined,
        format,
      });

      if (!ctxRes.ok) {
        return NextResponse.json(
          {
            code: ctxRes.error.code,
            message: ctxRes.error.message,
          },
          { status: ctxRes.error.status, headers: NO_STORE_HEADERS }
        );
      }

      resolvedTitle = ctxRes.context.project.title;
      resolvedResults = ctxRes.context.results;
      resolvedNotesMap = ctxRes.context.notesMap;
      resolvedRunId = ctxRes.context.run.id;
    } else {
      // 2. Jika tidak ada projectId di serverStore, validasi ketat projectTitle (DILARANG fallback ke judul demo!)
      const isSample = Boolean(body.isSample);
      const rawTitle =
        typeof body.projectTitle === 'string'
          ? body.projectTitle
          : typeof body.results?.projectTitle === 'string'
          ? body.results.projectTitle
          : '';

      const titleCheck = validateProjectTitle(rawTitle, isSample);
      if (!titleCheck.valid) {
        return NextResponse.json(
          {
            code: titleCheck.error?.code || 'EMPTY_PROJECT_TITLE',
            message:
              'Judul penelitian belum diisi. Lengkapi di formulir proyek sebelum mengunduh.',
          },
          { status: 422, headers: NO_STORE_HEADERS }
        );
      }

      if (!body.results || typeof body.results !== 'object') {
        return NextResponse.json(
          {
            code: 'MISSING_ANALYSIS_RESULTS',
            message:
              'Data hasil analisis belum tersedia untuk diekspor. Jalankan analisis terlebih dahulu.',
          },
          { status: 422, headers: NO_STORE_HEADERS }
        );
      }

      resolvedTitle = titleCheck.sanitizedTitle;
      resolvedResults = {
        ...(body.results as AnalysisResults),
        projectTitle: resolvedTitle,
      };
      resolvedNotesMap =
        body.notes && typeof body.notes === 'object'
          ? (body.notes as Record<string, string>)
          : {};
    }

    const safeTitle =
      resolvedTitle
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 40)
        .replace(/^_|_$/g, '') || 'Penelitian';

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const filename = `OlahData_Bab4_${safeTitle}_${dateStr}.${format}`;

    const fileBytes = buildServerDocumentBytes({
      format,
      projectTitle: resolvedTitle,
      results: resolvedResults,
      notesMap: resolvedNotesMap,
      includeDeclaration,
      watermark,
    });

    if (directDownload) {
      const contentType =
        format === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      return new NextResponse(fileBytes as unknown as BodyInit, {
        status: 200,
        headers: {
          ...NO_STORE_HEADERS,
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'X-Export-Title-Snapshot': encodeURIComponent(resolvedTitle),
        },
      });
    }

    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    exportJobs.set(jobId, {
      id: jobId,
      projectId: resolvedProjectId,
      runId: resolvedRunId,
      titleSnapshot: resolvedTitle,
      status: 'ready',
      format,
      filename,
      data: fileBytes,
      createdAt: Date.now(),
    });

    return NextResponse.json(
      {
        jobId,
        status: 'ready',
        filename,
        titleSnapshot: resolvedTitle,
        respondentCount: resolvedResults.respondentCount,
        pollUrl: `/api/ekspor?jobId=${jobId}`,
        downloadUrl: `/api/ekspor?jobId=${jobId}&download=1`,
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: unknown) {
    const msg =
      error instanceof Error && error.message
        ? error.message
        : 'Gagal memulai pekerjaan ekspor Bab 4.';
    return NextResponse.json(
      { code: 'EXPORT_INIT_FAILED', message: msg },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function GET(req: NextRequest) {
  cleanupOldJobs();
  const searchParams = req.nextUrl.searchParams;
  const jobId = searchParams.get('jobId');
  const isDownload = searchParams.get('download') === '1';

  if (!jobId) {
    return NextResponse.json(
      { code: 'MISSING_JOB_ID', message: 'Parameter jobId diperlukan.' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const job = exportJobs.get(jobId);
  if (!job) {
    return NextResponse.json(
      {
        code: 'JOB_NOT_FOUND',
        status: 'failed',
        message: 'Pekerjaan ekspor tidak ditemukan atau telah kedaluwarsa.',
      },
      { status: 404, headers: NO_STORE_HEADERS }
    );
  }

  if (isDownload && job.status === 'ready' && job.data) {
    const contentType =
      job.format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    return new NextResponse(job.data as unknown as BodyInit, {
      status: 200,
      headers: {
        ...NO_STORE_HEADERS,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${job.filename}"`,
        'X-Export-Title-Snapshot': encodeURIComponent(job.titleSnapshot),
      },
    });
  }

  return NextResponse.json(
    {
      jobId: job.id,
      status: job.status,
      filename: job.filename,
      titleSnapshot: job.titleSnapshot,
      error: job.error,
      downloadUrl:
        job.status === 'ready' ? `/api/ekspor?jobId=${job.id}&download=1` : null,
    },
    { status: 200, headers: NO_STORE_HEADERS }
  );
}
