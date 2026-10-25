export async function onRequestPost(context: {
  request: Request;
  env: Record<string, string>;
}) {
  try {
    const body = (await context.request.json()) as Record<string, unknown>;
    const { name, email, password, university } = body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Alamat email tidak valid.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return new Response(
        JSON.stringify({ success: false, error: 'Kata sandi minimal 6 karakter.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (typeof name === 'string' && name.trim()) ? name.trim() : 'Mahasiswa';
    const cleanUniversity = (typeof university === 'string' && university.trim()) ? university.trim() : 'Universitas';

    const supabaseUrl =
      context.env?.NEXT_PUBLIC_SUPABASE_URL ||
      context.env?.SUPABASE_URL ||
      'https://muxzjegpxjamasprgdrs.supabase.co';
    const serviceRoleKey =
      context.env?.SUPABASE_SERVICE_ROLE_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eHpqZWdweGphbWFzcHJnZHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg0NjQxNywiZXhwIjoyMTA3NDIyNDE3fQ.V4H7G7WGUyBhbQVfGA8miMVzLkE7JpFvVd7lsQqPL5U';

    // Call Supabase Admin REST API to create user with pre-confirmed email (bypasses rate limit)
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

    const resJson = (await resp.json()) as Record<string, any>;

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
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Alamat email ini sudah terdaftar. Silakan langsung masuk ke akun Anda.',
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: rawMsg || 'Gagal mendaftarkan akun di server autentikasi.',
        }),
        { status: resp.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Akun berhasil dibuat dan aktif.',
        user: {
          id: resJson.id,
          email: resJson.email,
          name: cleanName,
          university: cleanUniversity,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
    return new Response(
      JSON.stringify({ success: false, error: errorMsg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
