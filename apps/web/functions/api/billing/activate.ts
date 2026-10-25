export async function onRequestPost(context: {
  request: Request;
  env: Record<string, string>;
}) {
  try {
    const body = (await context.request.json().catch(() => ({}))) as Record<string, unknown>;
    const { userId, plan, orderId, amountIdr } = body || {};

    if (!userId || typeof userId !== 'string' || !userId.includes('-')) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID tidak valid.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const targetPlan = plan === 'thesis' ? 'thesis' : 'monthly';
    const supabaseUrl =
      context.env?.NEXT_PUBLIC_SUPABASE_URL ||
      context.env?.SUPABASE_URL ||
      'https://muxzjegpxjamasprgdrs.supabase.co';
    const serviceRoleKey =
      context.env?.SUPABASE_SERVICE_ROLE_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eHpqZWdweGphbWFzcHJnZHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg0NjQxNywiZXhwIjoyMTA3NDIyNDE3fQ.V4H7G7WGUyBhbQVfGA8miMVzLkE7JpFvVd7lsQqPL5U';

    // 1. Update public.profiles
    const updateRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          plan: targetPlan,
          updated_at: new Date().toISOString(),
        }),
      }
    );

    // 2. Catat ke payments table jika ada orderId
    if (orderId && typeof orderId === 'string') {
      try {
        await fetch(`${supabaseUrl}/rest/v1/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            user_id: userId,
            provider: 'midtrans',
            provider_ref: orderId,
            amount_idr: typeof amountIdr === 'number' ? amountIdr : (targetPlan === 'thesis' ? 99000 : 39000),
            status: 'paid',
            paid_at: new Date().toISOString(),
          }),
        });
      } catch {
        // ignore payment logging error
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Paket ${targetPlan} berhasil diaktifkan untuk pengguna ${userId}.`,
        plan: targetPlan,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal mengaktifkan paket.';
    return new Response(
      JSON.stringify({ success: false, error: errorMsg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
