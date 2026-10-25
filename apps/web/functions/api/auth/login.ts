export async function onRequestPost(context: {
  request: Request;
  env: Record<string, string>;
}) {
  try {
    const body = (await context.request.json()) as Record<string, unknown>;
    const { email, password } = body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Harap masukkan alamat email yang valid.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Harap masukkan kata sandi akun Anda.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    const supabaseUrl =
      context.env?.NEXT_PUBLIC_SUPABASE_URL ||
      context.env?.SUPABASE_URL ||
      'https://muxzjegpxjamasprgdrs.supabase.co';
    const anonKey =
      context.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eHpqZWdweGphbWFzcHJnZHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NDY0MTcsImV4cCI6MjEwNzQyMjQxN30.jvIlEWpW03cSJRmg9FR_s4ggra9wXYfZC9C6s1mTRMA';
    const serviceRoleKey =
      context.env?.SUPABASE_SERVICE_ROLE_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eHpqZWdweGphbWFzcHJnZHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg0NjQxNywiZXhwIjoyMTA3NDIyNDE3fQ.V4H7G7WGUyBhbQVfGA8miMVzLkE7JpFvVd7lsQqPL5U';

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

    // 2. Jika gagal karena email belum dikonfirmasi, otomatis konfirmasi dengan service role & coba lagi
    if (!tokenResp.ok) {
      const errorStr = (tokenData?.error_description || tokenData?.msg || tokenData?.message || tokenData?.error || '').toLowerCase();
      
      if (errorStr.includes('email not confirmed')) {
        // Ambil ID user dari Admin API untuk auto-confirm
        try {
          const adminUsersResp = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
            headers: {
              apikey: serviceRoleKey,
              Authorization: `Bearer ${serviceRoleKey}`,
            },
          });
          const adminUsers = (await adminUsersResp.json()) as { users?: Array<{ id: string; email: string }> };
          const matchedUser = adminUsers.users?.find(
            (u) => u.email.toLowerCase() === cleanEmail
          );

          if (matchedUser) {
            await fetch(`${supabaseUrl}/auth/v1/admin/users/${matchedUser.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`,
              },
              body: JSON.stringify({ email_confirm: true }),
            });

            // Coba login ulang setelah auto-confirm
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
          // Abaikan jika auto-confirm gagal
        }
      }
    }

    // 3. Jika tetap gagal setelah mitigasi, evaluasi penyebab kegagalan secara presisi
    if (!tokenResp.ok) {
      const rawError = tokenData?.error_description || tokenData?.msg || tokenData?.message || tokenData?.error || '';
      const rawLower = String(rawError).toLowerCase();

      // Cek apakah email terdaftar di database via Admin API untuk pesan diagnostik yang jelas
      let isRegistered = false;
      try {
        const checkUserResp = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
        });
        const listJson = (await checkUserResp.json()) as { users?: Array<{ id: string; email: string }> };
        if (listJson.users?.some((u) => u.email.toLowerCase() === cleanEmail)) {
          isRegistered = true;
        }
      } catch {
        // Abaikan jika pengecekan admin gagal
      }

      if (!isRegistered) {
        return new Response(
          JSON.stringify({
            success: false,
            code: 'EMAIL_NOT_REGISTERED',
            error: 'Alamat email ini belum terdaftar. Silakan buat akun terlebih dahulu di halaman Daftar.',
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (rawLower.includes('invalid login credentials') || rawLower.includes('invalid_grant')) {
        return new Response(
          JSON.stringify({
            success: false,
            code: 'INVALID_PASSWORD',
            error: 'Kata sandi salah. Silakan periksa kembali huruf besar/kecil atau gunakan Lupa Sandi untuk mengatur ulang.',
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (rawLower.includes('rate limit') || rawLower.includes('too many requests')) {
        return new Response(
          JSON.stringify({
            success: false,
            code: 'RATE_LIMIT',
            error: 'Terlalu banyak percobaan masuk. Mohon tunggu 1-2 menit sebelum mencoba kembali.',
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          code: 'AUTH_FAILED',
          error: rawError || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.',
        }),
        { status: tokenResp.status || 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Login Berhasil: Ambil data profile dari public.profiles
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
          // Jika baris profil belum ada di public.profiles, otomatis buatkan (auto-repair)
          const meta = tokenData.user?.user_metadata || {};
          const insertResp = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: serviceRoleKey,
              Authorization: `Bearer ${serviceRoleKey}`,
              Prefer: 'return=representation',
            },
            body: JSON.stringify({
              id: userId,
              nama: meta.nama || meta.full_name || 'Mahasiswa',
              kampus: meta.kampus || meta.university || 'Universitas Indonesia',
              prodi: meta.prodi || 'Manajemen',
              plan: 'free',
            }),
          });
          const insertedJson = (await insertResp.json()) as Array<any>;
          if (Array.isArray(insertedJson) && insertedJson.length > 0) {
            profileData = insertedJson[0];
          }
        }
      } catch {
        // Abaikan jika query profil gagal
      }
    }

    const meta = tokenData.user?.user_metadata || {};
    const finalUser = {
      id: userId || 'user',
      name: profileData?.nama || meta.nama || meta.full_name || 'Mahasiswa',
      email: tokenData.user?.email || cleanEmail,
      university: profileData?.kampus || meta.kampus || meta.university || 'Universitas Indonesia',
      department: profileData?.prodi || meta.prodi || 'Manajemen',
      plan: profileData?.plan || 'free',
      createdAt: profileData?.created_at || tokenData.user?.created_at || new Date().toISOString(),
    };

    return new Response(
      JSON.stringify({
        success: true,
        session: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
          token_type: tokenData.token_type,
        },
        user: finalUser,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi gangguan internal server.';
    return new Response(
      JSON.stringify({ success: false, error: errorMsg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
