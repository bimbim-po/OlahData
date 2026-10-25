const DEFAULT_GUEST_USER_ID = '84539b01-61d7-4dfc-88d3-ad306d2d12b2';
const DEFAULT_SUPABASE_URL = 'https://muxzjegpxjamasprgdrs.supabase.co';
const DEFAULT_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eHpqZWdweGphbWFzcHJnZHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg0NjQxNywiZXhwIjoyMTA3NDIyNDE3fQ.V4H7G7WGUyBhbQVfGA8miMVzLkE7JpFvVd7lsQqPL5U';

async function sha512Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-512', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function onRequestPost(context: {
  request: Request;
  env: Record<string, string>;
}) {
  try {
    const payload = (await context.request.json().catch(() => ({}))) as Record<string, unknown>;
    const serverKey =
      context.env?.MIDTRANS_SERVER_KEY || 'SB-Mid-server-WxaVRWag2.0qOo1r_iJg07RE';

    const orderId = String(payload.order_id || '').trim();
    const statusCode = String(payload.status_code || '').trim();
    const grossAmount = String(payload.gross_amount || '').trim();
    const signatureKey = String(payload.signature_key || '').trim();

    if (!orderId) {
      return new Response(
        JSON.stringify({ code: 'BAD_REQUEST', message: 'order_id tidak ditemukan.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Signature Verification (SHA-512)
    if (signatureKey) {
      const expected = await sha512Hex(`${orderId}${statusCode}${grossAmount}${serverKey}`);
      if (signatureKey.toLowerCase() !== expected.toLowerCase()) {
        return new Response(
          JSON.stringify({
            code: 'INVALID_SIGNATURE',
            message: 'Tanda tangan webhook Midtrans tidak valid.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const supabaseUrl =
      context.env?.NEXT_PUBLIC_SUPABASE_URL ||
      context.env?.SUPABASE_URL ||
      DEFAULT_SUPABASE_URL;
    const serviceRoleKey =
      context.env?.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE_KEY;

    // 2. IDEMPOTENCY GUARD: Periksa status pembayaran saat ini di DB
    const checkRes = await fetch(
      `${supabaseUrl}/rest/v1/payments?provider_ref=eq.${encodeURIComponent(orderId)}&select=id,status,user_id,amount_idr,raw`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    );

    interface DbPaymentRecord {
      id: string;
      status: string;
      user_id: string;
      amount_idr: number;
      raw?: Record<string, unknown>;
    }

    let existingPayment: DbPaymentRecord | null = null;
    if (checkRes.ok) {
      const rows = (await checkRes.json()) as DbPaymentRecord[];
      if (Array.isArray(rows) && rows.length > 0) {
        existingPayment = rows[0];
      }
    }

    // Jika sudah pernah berstatus 'paid', tolak mutasi mundur (idempoten)
    if (existingPayment?.status === 'paid') {
      return new Response(
        JSON.stringify({
          status: 'OK',
          processed: true,
          message: 'Transaksi telah berstatus paid sebelumnya (idempotent).',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const transactionStatus = String(payload.transaction_status || '').toLowerCase();
    const fraudStatus = String(payload.fraud_status || '').toLowerCase();

    let isPaid = false;
    if (transactionStatus === 'capture' && fraudStatus === 'accept') {
      isPaid = true;
    } else if (transactionStatus === 'settlement') {
      isPaid = true;
    }

    const isFailed = ['deny', 'cancel', 'expire', 'failure'].includes(transactionStatus);

    const targetPlan =
      payload.custom_field2 === 'thesis' || orderId.includes('-THESIS-')
        ? 'thesis'
        : 'monthly';

    const rawUserId = String(payload.custom_field1 || existingPayment?.user_id || '').trim();
    const effectiveUserId =
      rawUserId && rawUserId.includes('-') && rawUserId.length >= 32
        ? rawUserId
        : DEFAULT_GUEST_USER_ID;

    // 3. Database Updates
    if (isPaid) {
      const paidAt = new Date().toISOString();
      const durationDays = targetPlan === 'thesis' ? 90 : 30;
      const periodEnd = new Date(Date.now() + durationDays * 86400000).toISOString();

      // a. Update / Upsert payments
      await fetch(
        `${supabaseUrl}/rest/v1/payments?provider_ref=eq.${encodeURIComponent(orderId)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            status: 'paid',
            paid_at: paidAt,
            raw: payload,
            updated_at: paidAt,
          }),
        }
      );

      // b. Update profiles.plan
      if (effectiveUserId && effectiveUserId.includes('-')) {
        await fetch(
          `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(effectiveUserId)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              apikey: serviceRoleKey,
              Authorization: `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              plan: targetPlan,
              updated_at: paidAt,
            }),
          }
        ).catch(() => null);

        // c. Upsert subscriptions
        await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            user_id: effectiveUserId,
            plan: targetPlan,
            status: 'active',
            current_period_end: periodEnd,
            provider: 'midtrans',
            provider_ref: orderId,
            updated_at: paidAt,
          }),
        }).catch(() => null);
      }
    } else if (isFailed) {
      await fetch(
        `${supabaseUrl}/rest/v1/payments?provider_ref=eq.${encodeURIComponent(orderId)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            status: 'failed',
            raw: payload,
            updated_at: new Date().toISOString(),
          }),
        }
      ).catch(() => null);
    }

    return new Response(
      JSON.stringify({
        status: 'OK',
        processed: isPaid,
        transaction_status: transactionStatus,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Payload webhook tidak dapat diproses.';
    return new Response(
      JSON.stringify({ code: 'BAD_REQUEST', message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
