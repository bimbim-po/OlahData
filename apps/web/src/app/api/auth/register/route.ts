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

    return NextResponse.json({
      success: true,
      message: 'Akun berhasil dibuat dan aktif.',
      user: {
        id: resJson.id,
        email: resJson.email,
        name: cleanName,
        university: cleanUniversity,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
