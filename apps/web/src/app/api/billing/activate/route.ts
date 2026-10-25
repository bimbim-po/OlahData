import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, plan, orderId, amountIdr } = body || {};

    if (!userId || typeof userId !== 'string' || !userId.includes('-')) {
      return NextResponse.json({ success: false, error: 'User ID tidak valid.' }, { status: 400 });
    }

    const targetPlan = plan === 'thesis' ? 'thesis' : 'monthly';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://muxzjegpxjamasprgdrs.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eHpqZWdweGphbWFzcHJnZHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg0NjQxNywiZXhwIjoyMTA3NDIyNDE3fQ.V4H7G7WGUyBhbQVfGA8miMVzLkE7JpFvVd7lsQqPL5U';

    await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        plan: targetPlan,
        updated_at: new Date().toISOString(),
      }),
    });

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
        // ignore
      }
    }

    return NextResponse.json({
      success: true,
      message: `Paket ${targetPlan} berhasil diaktifkan.`,
      plan: targetPlan,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal mengaktifkan paket.';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
