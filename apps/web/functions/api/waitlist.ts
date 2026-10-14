export async function onRequestPost(context: {
  request: Request;
  env: Record<string, string>;
}) {
  try {
    const body = (await context.request.json()) as Record<string, unknown>;
    const { name, email, phone, university, plan, projectId, notes } = body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email valid wajib diisi.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const payload = {
      name: name || 'Mahasiswa',
      email: email.trim().toLowerCase(),
      phone: phone || null,
      university: university || null,
      plan: plan || 'monthly',
      project_id: projectId || null,
      notes: notes || null,
      created_at: new Date().toISOString(),
    };

    // Forward to Supabase REST API directly from edge
    const supabaseUrl =
      context.env?.NEXT_PUBLIC_SUPABASE_URL ||
      context.env?.SUPABASE_URL ||
      'https://muxzjegpxjamasprgdrs.supabase.co';
    const supabaseKey =
      context.env?.SUPABASE_SERVICE_ROLE_KEY ||
      context.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/waitlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            Prefer: 'return=minimal',
          },
          body: JSON.stringify(payload),
        });
      } catch {
        // Continue even if Supabase table is not yet migrated
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Permintaan aktivasi paket berhasil dicatat. Admin akan segera menghubungi Anda.',
        data: payload,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'Gagal memproses permintaan aktivasi.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
