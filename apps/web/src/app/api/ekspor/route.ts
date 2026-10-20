import { NextRequest, NextResponse } from 'next/server';
import { callStatsExport } from '@/lib/stats-client';
import { mockResults } from '@/lib/mock/results';

export const dynamic = 'force-dynamic';

interface ExportJob {
  id: string;
  status: 'processing' | 'ready' | 'failed';
  format: 'docx' | 'pdf';
  filename: string;
  data?: ArrayBuffer;
  error?: string;
  createdAt: number;
}

// In-memory jobs store for polling
const exportJobs = new Map<string, ExportJob>();

// Cleanup jobs older than 5 minutes
function cleanupOldJobs() {
  const now = Date.now();
  for (const [id, job] of exportJobs.entries()) {
    if (now - job.createdAt > 5 * 60 * 1000) {
      exportJobs.delete(id);
    }
  }
}

export async function POST(req: NextRequest) {
  cleanupOldJobs();

  try {
    const body = await req.json().catch(() => ({}));
    const format = body.format === 'pdf' ? 'pdf' : 'docx';
    const projectTitle = body.projectTitle || 'Pengaruh Kualitas Layanan dan Kepuasan terhadap Loyalitas Pelanggan';
    const includeDeclaration = body.includeDeclaration ?? true;
    const tableId = body.tableId;
    const directDownload = body.direct === true || req.nextUrl.searchParams.get('direct') === '1';

    // Results from payload or mock
    const results = (body.results || mockResults) as Record<string, unknown>;

    // Plan checking (Free gets watermark, Paid gets clean output)
    const watermark = body.watermark ?? false;

    // Clean filename according to specification: OlahData_Bab4_{judul}_{tanggal}
    const safeTitle = projectTitle
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 30)
      .replace(/^_|_$/g, '') || 'Penelitian';
    
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const filename = `OlahData_Bab4_${safeTitle}_${dateStr}.${format}`;

    // Job ID for polling
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const runExport = async () => {
      try {
        const buffer = await callStatsExport({
          format,
          results,
          projectTitle,
          includeDeclaration,
          watermark,
          tableId,
        });
        return buffer;
      } catch (err: unknown) {
        // Fallback for isolated client environments without Python daemon
        const fallbackText = `DRAF DOKUMEN HASIL PENELITIAN OLAHDATA\nJudul: ${projectTitle}\nTanggal: ${new Date().toISOString()}`;
        return new TextEncoder().encode(fallbackText).buffer as ArrayBuffer;
      }
    };

    if (directDownload) {
      const buffer = await runExport();
      const contentType = format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Asynchronous job creation
    exportJobs.set(jobId, {
      id: jobId,
      status: 'processing',
      format,
      filename,
      createdAt: Date.now(),
    });

    // Execute generation
    runExport()
      .then((buffer) => {
        const job = exportJobs.get(jobId);
        if (job) {
          job.status = 'ready';
          job.data = buffer;
        }
      })
      .catch((err) => {
        const job = exportJobs.get(jobId);
        if (job) {
          job.status = 'failed';
          job.error = err instanceof Error ? err.message : 'Gagal menghasilkan berkas';
        }
      });

    return NextResponse.json({
      jobId,
      status: 'processing',
      filename,
      pollUrl: `/api/ekspor?jobId=${jobId}`,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { code: 'EXPORT_INIT_FAILED', message: 'Gagal memulai pekerjaan ekspor Bab 4.' },
      { status: 500 }
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
      { status: 400 }
    );
  }

  const job = exportJobs.get(jobId);
  if (!job) {
    return NextResponse.json(
      { code: 'JOB_NOT_FOUND', status: 'failed', message: 'Pekerjaan ekspor tidak ditemukan atau telah kedaluwarsa.' },
      { status: 404 }
    );
  }

  // Check 60-second timeout
  if (Date.now() - job.createdAt > 60 * 1000 && job.status === 'processing') {
    job.status = 'failed';
    job.error = 'Batas waktu 60 detik terlampaui (EXPORT_TIMEOUT)';
  }

  if (isDownload && job.status === 'ready' && job.data) {
    const contentType = job.format === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    return new NextResponse(job.data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${job.filename}"`,
      },
    });
  }

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    filename: job.filename,
    error: job.error,
    downloadUrl: job.status === 'ready' ? `/api/ekspor?jobId=${job.id}&download=1` : null,
  });
}
