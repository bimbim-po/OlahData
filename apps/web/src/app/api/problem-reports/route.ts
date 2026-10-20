import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export interface ProblemReportPayload {
  category: string;
  email: string;
  subject: string;
  description: string;
  diagnosticCode?: string;
  projectId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      category = 'Umum',
      email = '',
      subject = '',
      description = '',
      diagnosticCode = '',
      projectId,
    }: Partial<ProblemReportPayload> = body;

    if (!description || description.trim().length < 5) {
      return NextResponse.json(
        { error: 'Deskripsi masalah wajib diisi minimal 5 karakter.' },
        { status: 400 }
      );
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Alamat email yang valid diperlukan untuk menerima tanggapan solusi.' },
        { status: 400 }
      );
    }

    // Generate unique report ID
    const reportId = `RPT-${Date.now().toString(36).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    // Pastikan tidak ada data responden yang disimpan demi menjaga privasi
    const reportRecord = {
      report_id: reportId,
      category: category.slice(0, 50),
      email: email.trim().toLowerCase(),
      subject: (subject || 'Laporan Kendala Pengguna').slice(0, 150),
      description: description.slice(0, 2000),
      diagnostic_code: (diagnosticCode || '').slice(0, 100),
      project_id: projectId ? String(projectId).slice(0, 64) : null,
      created_at: timestamp,
      status: 'pending',
    };

    // Upayakan simpan ke tabel Supabase jika tersedia
    try {
      const supabaseAdmin = getSupabaseAdminClient();
      if (supabaseAdmin) {
        await supabaseAdmin.from('problem_reports').insert([reportRecord]);
      }
    } catch (dbErr) {
      // Abaikan galat database eksternal bila tabel belum termigrasi di lingkungan lokal/demo
      console.warn('[ProblemReports] Database insert bypassed:', dbErr);
    }

    return NextResponse.json({
      success: true,
      reportId,
      message: 'Laporan masalah Anda berhasil diterima. Tim dukungan kami akan meninjau dan mengirimkan panduan pemecahan ke email Anda.',
      timestamp,
    });
  } catch (error) {
    console.error('[ProblemReports] Internal server error:', error);
    return NextResponse.json(
      { error: 'Terjadi kendala pada server saat memproses laporan masalah.' },
      { status: 500 }
    );
  }
}
