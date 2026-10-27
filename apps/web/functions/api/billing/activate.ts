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

    const serverKey =
      context.env?.MIDTRANS_SERVER_KEY || '';
    const isSandbox = serverKey.startsWith('SB-');
    const targetPlan = plan === 'thesis' ? 'thesis' : 'monthly';
    const supabaseUrl =
      context.env?.NEXT_PUBLIC_SUPABASE_URL ||
      context.env?.SUPABASE_URL ||
      'https://muxzjegpxjamasprgdrs.supabase.co';
    const serviceRoleKey =
      context.env?.SUPABASE_SERVICE_ROLE_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eHpqZWdweGphbWFzcHJnZHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg0NjQxNywiZXhwIjoyMTA3NDIyNDE3fQ.V4H7G7WGUyBhbQVfGA8miMVzLkE7JpFvVd7lsQqPL5U';

    // 0. KEAMANAN PRODUKSI: Verifikasi status transaksi resmi ke API Midtrans
    let isVerifiedPaid = false;

    if (orderId && typeof orderId === 'string') {
      // a. Cek apakah transaksi sudah berstatus 'paid' di tabel payments
      const dbPaymentCheck = await fetch(
        `${supabaseUrl}/rest/v1/payments?provider_ref=eq.${encodeURIComponent(orderId)}&select=status,amount_idr`,
        {
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
        }
      ).catch(() => null);

      if (dbPaymentCheck && dbPaymentCheck.ok) {
        const rows = (await dbPaymentCheck.json().catch(() => [])) as Array<{ status: string }>;
        if (Array.isArray(rows) && rows[0]?.status === 'paid') {
          isVerifiedPaid = true;
        }
      }

      // b. Jika belum tercatat di DB, tanyakan langsung ke API Midtrans resmi
      if (!isVerifiedPaid) {
        try {
          const midtransStatusUrl = isSandbox
            ? `https://api.sandbox.midtrans.com/v2/${encodeURIComponent(orderId)}/status`
            : `https://api.midtrans.com/v2/${encodeURIComponent(orderId)}/status`;

          const authHeader = btoa(`${serverKey}:`);
          const midtransRes = await fetch(midtransStatusUrl, {
            headers: {
              Accept: 'application/json',
              Authorization: `Basic ${authHeader}`,
            },
          });

          if (midtransRes.ok) {
            const mData = (await midtransRes.json()) as Record<string, unknown>;
            const txStatus = String(mData.transaction_status || '').toLowerCase();
            const fraudStatus = String(mData.fraud_status || '').toLowerCase();

            if (
              txStatus === 'settlement' ||
              (txStatus === 'capture' && fraudStatus === 'accept')
            ) {
              isVerifiedPaid = true;
            }
          }
        } catch {
          // ignore network error to fallback
        }
      }
    }

    // Di mode Production, TOLAK mutasi jika transaksi belum dibayar di Midtrans
    if (!isSandbox && !isVerifiedPaid) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'Pembayaran belum terkonfirmasi oleh sistem Midtrans. Harap selesaikan pembayaran terlebih dahulu.',
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Update public.profiles
    await fetch(
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
            status: isVerifiedPaid || isSandbox ? 'paid' : 'pending',
            paid_at: isVerifiedPaid || isSandbox ? new Date().toISOString() : null,
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
