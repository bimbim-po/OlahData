// Cloudflare Pages Function: Google Sheets CSV proxy import

export async function onRequestGet(context: { request: Request }): Promise<Response> {
  const { request } = context;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'Parameter url diperlukan' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // Security check: only allow Google Spreadsheets URLs
  const isGoogleDoc = /^https:\/\/docs\.google\.com\/spreadsheets\//i.test(targetUrl);
  if (!isGoogleDoc) {
    return new Response(JSON.stringify({ error: 'Hanya URL Google Sheets (docs.google.com/spreadsheets) yang diizinkan' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/csv,text/plain,*/*',
      },
      redirect: 'follow',
    });

    if (!upstreamRes.ok) {
      return new Response(
        JSON.stringify({
          error: `Gagal mengambil berkas dari Google Sheets (status: ${upstreamRes.status}). Pastikan hak akses spreadsheet diatur ke 'Siapa saja yang memiliki link' (Anyone with the link).`,
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    const contentType = upstreamRes.headers.get('content-type') || '';
    const text = await upstreamRes.text();

    // Check if Google redirected to a HTML sign-in page
    if (contentType.includes('text/html') || text.includes('accounts.google.com') || text.includes('<!DOCTYPE html>')) {
      return new Response(
        JSON.stringify({
          error: 'Spreadsheet terkunci atau memerlukan izin login. Buka spreadsheet di Google Sheets, klik Bagikan (Share) di pojok kanan atas, lalu ubah Akses Umum menjadi "Siapa saja yang memiliki link".',
          isPermissionDenied: true,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    return new Response(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Kesalahan jaringan saat menghubungi Google Sheets.';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
