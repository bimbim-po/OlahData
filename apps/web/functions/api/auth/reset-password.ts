export async function onRequestPost(context: {
  request: Request;
  env: Record<string, string>;
}) {
  try {
    const body = (await context.request.json()) as Record<string, unknown>;
    const { email, newPassword } = body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Harap masukkan alamat email yang valid.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return new Response(
        JSON.stringify({ success: false, error: 'Kata sandi baru minimal 6 karakter.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    const supabaseUrl =
      context.env?.NEXT_PUBLIC_SUPABASE_URL ||
      context.env?.SUPABASE_URL ||
      'https://muxzjegpxjamasprgdrs.supabase.co';
    const serviceRoleKey =
      context.env?.SUPABASE_SERVICE_ROLE_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eHpqZWdweGphbWFzcHJnZHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg0NjQxNywiZXhwIjoyMTA3NDIyNDE3fQ.V4H7G7WGUyBhbQVfGA8miMVzLkE7JpFvVd7lsQqPL5U';

    // 1. Temukan user berdasarkan email via Admin API
    const adminUsersResp = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    const adminUsersJson = (await adminUsersResp.json()) as {
      users?: Array<{ id: string; email: string }>;
    };

    const targetUser = adminUsersJson.users?.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );

    if (!targetUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Alamat email ini belum terdaftar di OlahData. Silakan buat akun baru di menu Daftar.',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Perbarui kata sandi dan pastikan email_confirm bernilai true
    const updateResp = await fetch(`${supabaseUrl}/auth/v1/admin/users/${targetUser.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        password: newPassword,
        email_confirm: true,
      }),
    });

    if (!updateResp.ok) {
      const errJson = (await updateResp.json()) as Record<string, any>;
      return new Response(
        JSON.stringify({
          success: false,
          error: errJson?.message || 'Gagal memperbarui kata sandi di server autentikasi.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Kata sandi berhasil diperbarui. Silakan masuk menggunakan kata sandi baru Anda.',
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
