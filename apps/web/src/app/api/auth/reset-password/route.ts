import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DEFAULT_SUPABASE_URL = 'https://muxzjegpxjamasprgdrs.supabase.co';
const DEFAULT_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eHpqZWdweGphbWFzcHJnZHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg0NjQxNywiZXhwIjoyMTA3NDIyNDE3fQ.V4H7G7WGUyBhbQVfGA8miMVzLkE7JpFvVd7lsQqPL5U';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, newPassword } = body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Harap masukkan alamat email yang valid.' },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Kata sandi baru minimal 6 karakter.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      DEFAULT_SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE_KEY;

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
      return NextResponse.json(
        {
          success: false,
          error:
            'Alamat email ini belum terdaftar di OlahData. Silakan buat akun baru di menu Daftar.',
        },
        { status: 404 }
      );
    }

    // 2. Perbarui kata sandi dan pastikan email_confirm bernilai true
    const updateResp = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${targetUser.id}`,
      {
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
      }
    );

    if (!updateResp.ok) {
      const errJson = (await updateResp.json()) as Record<string, any>;
      return NextResponse.json(
        {
          success: false,
          error:
            errJson?.message || 'Gagal memperbarui kata sandi di server autentikasi.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        'Kata sandi berhasil diperbarui. Silakan masuk menggunakan kata sandi baru Anda.',
    });
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
