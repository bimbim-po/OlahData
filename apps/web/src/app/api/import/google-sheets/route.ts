import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Parameter url diperlukan' }, { status: 400 });
  }

  const isGoogleDoc = /^https:\/\/docs\.google\.com\/spreadsheets\//i.test(targetUrl);
  if (!isGoogleDoc) {
    return NextResponse.json(
      { error: 'Hanya URL Google Sheets (docs.google.com/spreadsheets) yang diizinkan' },
      { status: 400 }
    );
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/csv,text/plain,*/*',
      },
      redirect: 'follow',
    });

    if (!upstreamRes.ok) {
      return NextResponse.json(
        {
          error: `Gagal mengambil berkas dari Google Sheets (status: ${upstreamRes.status}). Pastikan hak akses spreadsheet diatur ke 'Siapa saja yang memiliki link' (Anyone with the link).`,
        },
        { status: 502 }
      );
    }

    const contentType = upstreamRes.headers.get('content-type') || '';
    const text = await upstreamRes.text();

    if (contentType.includes('text/html') || text.includes('accounts.google.com') || text.includes('<!DOCTYPE html>')) {
      return NextResponse.json(
        {
          error:
            'Spreadsheet terkunci atau memerlukan izin login. Buka spreadsheet di Google Sheets, klik Bagikan (Share) di pojok kanan atas, lalu ubah Akses Umum menjadi "Siapa saja yang memiliki link".',
          isPermissionDenied: true,
        },
        { status: 403 }
      );
    }

    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Kesalahan jaringan saat menghubungi Google Sheets.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
