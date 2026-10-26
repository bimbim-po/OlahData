import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DEFAULT_SUPABASE_URL = 'https://muxzjegpxjamasprgdrs.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eHpqZWdweGphbWFzcHJnZHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NDY0MTcsImV4cCI6MjEwNzQyMjQxN30.jvIlEWpW03cSJRmg9FR_s4ggra9wXYfZC9C6s1mTRMA';
const DEFAULT_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eHpqZWdweGphbWFzcHJnZHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg0NjQxNywiZXhwIjoyMTA3NDIyNDE3fQ.V4H7G7WGUyBhbQVfGA8miMVzLkE7JpFvVd7lsQqPL5U';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Harap masukkan alamat email yang valid.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Harap masukkan kata sandi akun Anda.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      DEFAULT_SUPABASE_URL;
    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE_KEY;

    // 1. Coba lakukan otentikasi password via Supabase REST API
    let tokenResp = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
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

    let tokenData = (await tokenResp.json()) as Record<string, any>;

    // 2. Solusi Masalah 3: Tertahan Konfirmasi Email Supabase (Email not confirmed)
    // Jika gagal karena email belum dikonfirmasi, konfirmasi otomatis dengan service role & coba lagi
    if (!tokenResp.ok) {
      const errorStr = (
        tokenData?.error_description ||
        tokenData?.msg ||
        tokenData?.message ||
        tokenData?.error ||
        ''
      ).toLowerCase();

      if (errorStr.includes('email not confirmed')) {
        try {
          const adminUsersResp = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
            headers: {
              apikey: serviceRoleKey,
              Authorization: `Bearer ${serviceRoleKey}`,
            },
          });
          const adminUsers = (await adminUsersResp.json()) as {
            users?: Array<{ id: string; email: string }>;
          };
          const matchedUser = adminUsers.users?.find(
            (u) => u.email.toLowerCase() === cleanEmail
          );

          if (matchedUser) {
            // Konfirmasi email via admin service role
            await fetch(`${supabaseUrl}/auth/v1/admin/users/${matchedUser.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`,
              },
              body: JSON.stringify({ email_confirm: true }),
            });

            // Coba login ulang seketika setelah auto-confirm
            tokenResp = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
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
            tokenData = (await tokenResp.json()) as Record<string, any>;
          }
        } catch {
          // Abaikan jika proses auto-confirm gagal
        }
      }
    }

    // 3. Evaluasi jika tetap gagal setelah auto-confirm
    if (!tokenResp.ok) {
      const rawError =
        tokenData?.error_description ||
        tokenData?.msg ||
        tokenData?.message ||
        tokenData?.error ||
        '';
      const rawLower = String(rawError).toLowerCase();

      // Cek apakah email terdaftar di database via Admin API untuk pesan jelas
      let isRegistered = false;
      try {
        const checkUserResp = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
        });
        const listJson = (await checkUserResp.json()) as {
          users?: Array<{ id: string; email: string }>;
        };
        if (listJson.users?.some((u) => u.email.toLowerCase() === cleanEmail)) {
          isRegistered = true;
        }
      } catch {
        // Abaikan
      }

      if (!isRegistered) {
        return NextResponse.json(
          {
            success: false,
            code: 'EMAIL_NOT_REGISTERED',
            error:
              'Alamat email ini belum terdaftar. Silakan buat akun terlebih dahulu di halaman Daftar.',
          },
          { status: 404 }
        );
      }

      if (
        rawLower.includes('invalid login credentials') ||
        rawLower.includes('invalid_grant')
      ) {
        return NextResponse.json(
          {
            success: false,
            code: 'INVALID_PASSWORD',
            error:
              'Kata sandi salah. Silakan periksa kembali huruf besar/kecil atau gunakan Lupa Sandi untuk mengatur ulang.',
          },
          { status: 401 }
        );
      }

      if (
        rawLower.includes('rate limit') ||
        rawLower.includes('too many requests')
      ) {
        return NextResponse.json(
          {
            success: false,
            code: 'RATE_LIMIT',
            error:
              'Terlalu banyak percobaan masuk. Mohon tunggu 1-2 menit sebelum mencoba kembali.',
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          code: 'AUTH_FAILED',
          error: rawError || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.',
        },
        { status: tokenResp.status || 400 }
      );
    }

    // 4. Solusi Masalah 2: Login Sukses di Auth, Tapi Gagal Mengambil Data Tabel profiles
    // Ambil data profile dari public.profiles atau auto-heal jika belum ada
    const userId = tokenData.user?.id;
    let profileData: {
      nama?: string;
      prodi?: string;
      kampus?: string;
      plan?: string;
      created_at?: string;
    } | null = null;

    if (userId) {
      try {
        const profResp = await fetch(
          `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=nama,prodi,kampus,plan,created_at`,
          {
            headers: {
              apikey: serviceRoleKey,
              Authorization: `Bearer ${serviceRoleKey}`,
            },
          }
        );
        const profJson = (await profResp.json()) as Array<any>;
        if (Array.isArray(profJson) && profJson.length > 0) {
          profileData = profJson[0];
        } else {
          // Jaminan Auto-Heal: Jika baris profil belum terbentuk atau terblokir RLS, buatkan langsung dengan service role
          const meta = tokenData.user?.user_metadata || {};
          const insertResp = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: serviceRoleKey,
              Authorization: `Bearer ${serviceRoleKey}`,
              Prefer: 'resolution=merge-duplicates,return=representation',
            },
            body: JSON.stringify({
              id: userId,
              nama: meta.nama || meta.full_name || 'Mahasiswa',
              kampus: meta.kampus || meta.university || 'Perguruan Tinggi',
              prodi: meta.prodi || 'Manajemen',
              plan: 'free',
            }),
          });
          const insertedJson = (await insertResp.json()) as Array<any>;
          if (Array.isArray(insertedJson) && insertedJson.length > 0) {
            profileData = insertedJson[0];
          }
        }
      } catch (profErr) {
        console.warn('[Login Route] Gagal auto-heal profil:', profErr);
      }
    }

    const meta = tokenData.user?.user_metadata || {};
    const finalUser = {
      id: userId || 'user',
      name: profileData?.nama || meta.nama || meta.full_name || 'Mahasiswa',
      email: tokenData.user?.email || cleanEmail,
      university:
        profileData?.kampus || meta.kampus || meta.university || 'Universitas Indonesia',
      department: profileData?.prodi || meta.prodi || 'Manajemen',
      plan: profileData?.plan || 'free',
      createdAt:
        profileData?.created_at ||
        tokenData.user?.created_at ||
        new Date().toISOString(),
    };

    // 5. Solusi Masalah 1: Status Login di Layar (Zustand) Tidak Nyambung dengan Sesi Server
    // Tanam cookie HTTP sesi Next.js agar seluruh route serverless (/api/billing/checkout, dsb.)
    // langsung mengenali user yang terautentikasi tanpa 401 Unauthorized
    const response = NextResponse.json({
      success: true,
      session: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type,
      },
      user: finalUser,
    });

    // Pasang cookie autentikasi terstandar
    if (tokenData.access_token) {
      response.cookies.set('sb-access-token', tokenData.access_token, {
        path: '/',
        httpOnly: false, // Dibaca oleh client Supabase
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 hari
      });
      response.cookies.set('olahdata-uid', userId, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    if (tokenData.refresh_token) {
      response.cookies.set('sb-refresh-token', tokenData.refresh_token, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 hari
      });
    }

    return response;
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Terjadi gangguan internal server.';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
