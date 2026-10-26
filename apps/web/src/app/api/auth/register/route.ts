import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, university } = body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Alamat email tidak valid.' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ success: false, error: 'Kata sandi minimal 6 karakter.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (typeof name === 'string' && name.trim()) ? name.trim() : 'Mahasiswa';
    const cleanUniversity = (typeof university === 'string' && university.trim()) ? university.trim() : 'Universitas';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://muxzjegpxjamasprgdrs.supabase.co';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eHpqZWdweGphbWFzcHJnZHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NDY0MTcsImV4cCI6MjEwNzQyMjQxN30.jvIlEWpW03cSJRmg9FR_s4ggra9wXYfZC9C6s1mTRMA';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eHpqZWdweGphbWFzcHJnZHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg0NjQxNywiZXhwIjoyMTA3NDIyNDE3fQ.V4H7G7WGUyBhbQVfGA8miMVzLkE7JpFvVd7lsQqPL5U';

    const resp = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        email: cleanEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          nama: cleanName,
          full_name: cleanName,
          kampus: cleanUniversity,
          university: cleanUniversity,
          prodi: 'Manajemen',
        },
      }),
    });

    const resJson = await resp.json();

    if (!resp.ok) {
      const rawMsg =
        (typeof resJson?.error === 'string' ? resJson.error : null) ||
        resJson?.message ||
        resJson?.msg ||
        resJson?.error_description ||
        resJson?.error?.message ||
        '';
      const msgLower = rawMsg.toLowerCase();

      if (
        msgLower.includes('already registered') ||
        msgLower.includes('already exists') ||
        resJson?.code === 'user_already_exists'
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'Alamat email ini sudah terdaftar. Silakan langsung masuk ke akun Anda.',
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: rawMsg || 'Gagal mendaftarkan akun.' },
        { status: resp.status }
      );
    }

    // Auto-Heal Profiles: Pastikan baris data public.profiles terbentuk dengan service role
    await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        id: resJson.id,
        nama: cleanName,
        kampus: cleanUniversity,
        prodi: 'Manajemen',
        plan: 'free',
      }),
    }).catch(() => null);

    // Auto-login: Dapatkan token sesi langsung
    let sessionData: Record<string, any> | null = null;
    try {
      const tokenResp = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
        },
        body: JSON.stringify({
          email: cleanEmail,
          password: password,
        }),
      });
      if (tokenResp.ok) {
        sessionData = await tokenResp.json();
      }
    } catch {
      // Abaikan jika auto-login gagal
    }

    const response = NextResponse.json({
      success: true,
      message: 'Akun berhasil dibuat dan aktif.',
      session: sessionData
        ? {
            access_token: sessionData.access_token,
            refresh_token: sessionData.refresh_token,
            expires_in: sessionData.expires_in,
            token_type: sessionData.token_type,
          }
        : null,
      user: {
        id: resJson.id,
        email: resJson.email,
        name: cleanName,
        university: cleanUniversity,
        department: 'Manajemen',
        plan: 'free',
        createdAt: resJson.created_at || new Date().toISOString(),
      },
    });

    if (sessionData?.access_token) {
      response.cookies.set('sb-access-token', sessionData.access_token, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
      response.cookies.set('olahdata-uid', resJson.id, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    if (sessionData?.refresh_token) {
      response.cookies.set('sb-refresh-token', sessionData.refresh_token, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
