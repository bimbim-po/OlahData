const DEFAULT_GUEST_USER_ID = '84539b01-61d7-4dfc-88d3-ad306d2d12b2';
const DEFAULT_SUPABASE_URL = 'https://muxzjegpxjamasprgdrs.supabase.co';
const DEFAULT_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eHpqZWdweGphbWFzcHJnZHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg0NjQxNywiZXhwIjoyMTA3NDIyNDE3fQ.V4H7G7WGUyBhbQVfGA8miMVzLkE7JpFvVd7lsQqPL5U';

export async function onRequestGet(context: {
  request: Request;
  env: Record<string, string>;
}) {
  return handleStatus(context);
}

export async function onRequestPost(context: {
  request: Request;
  env: Record<string, string>;
}) {
  return handleStatus(context);
}

async function handleStatus(context: {
  request: Request;
  env: Record<string, string>;
}) {
  try {
    const url = new URL(context.request.url);
    let orderId = url.searchParams.get('order_id') || url.searchParams.get('orderId');

    if (!orderId && context.request.method === 'POST') {
      const body = (await context.request.json().catch(() => ({}))) as Record<string, unknown>;
      orderId = String(body.order_id || body.orderId || '');
    }

    if (!orderId) {
      return new Response(
        JSON.stringify({ code: 'BAD_REQUEST', message: 'Parameter order_id wajib disertakan.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl =
      context.env?.NEXT_PUBLIC_SUPABASE_URL ||
      context.env?.SUPABASE_URL ||
      DEFAULT_SUPABASE_URL;
    const serviceRoleKey =
      context.env?.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE_KEY;

    // 1. Periksa catatan di tabel public.payments terlebih dahulu
    const dbRes = await fetch(
      `${supabaseUrl}/rest/v1/payments?provider_ref=eq.${encodeURIComponent(orderId)}&select=id,status,user_id,amount_idr,raw,paid_at`,
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
      paid_at?: string;
    }

    let paymentRecord: DbPaymentRecord | null = null;

    if (dbRes.ok) {
      const rows = (await dbRes.json()) as DbPaymentRecord[];
      if (Array.isArray(rows) && rows.length > 0) {
        paymentRecord = rows[0];
      }
    }

    // Jika sudah tercatat paid di database, kembalikan langsung
    if (paymentRecord?.status === 'paid') {
      const targetPlan =
        (paymentRecord.raw?.plan as string) ||
        (orderId.includes('-THESIS-') ? 'thesis' : 'monthly');
      return new Response(
        JSON.stringify({
          order_id: orderId,
          status: 'paid',
          plan: targetPlan,
          amount_idr: paymentRecord.amount_idr,
          paid_at: paymentRecord.paid_at,
          source: 'database',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Jika masih pending atau belum terverifikasi, query API Status Midtrans
    const serverKey =
      context.env?.MIDTRANS_SERVER_KEY || '';

    if (!serverKey) {
      return new Response(
        JSON.stringify({
          order_id: orderId,
          status: 'pending',
          transaction_status: 'waiting_payment',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const isSandbox = serverKey.startsWith('SB-');
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
      const midtransData = (await midtransRes.json()) as Record<string, unknown>;
      const transactionStatus = String(midtransData.transaction_status || '').toLowerCase();
      const fraudStatus = String(midtransData.fraud_status || '').toLowerCase();

      let isPaid = false;
      if (transactionStatus === 'capture' && fraudStatus === 'accept') {
        isPaid = true;
      } else if (transactionStatus === 'settlement') {
        isPaid = true;
      }

      const isFailed = ['deny', 'cancel', 'expire', 'failure'].includes(transactionStatus);
      const targetPlan =
        midtransData.custom_field2 === 'thesis' || orderId.includes('-THESIS-')
          ? 'thesis'
          : 'monthly';

      const rawUserId = String(
        midtransData.custom_field1 || paymentRecord?.user_id || ''
      ).trim();
      const effectiveUserId =
        rawUserId && rawUserId.includes('-') && rawUserId.length >= 32
          ? rawUserId
          : DEFAULT_GUEST_USER_ID;

      // Jika Midtrans menyatakan sukses, sinkronkan ke DB sekarang juga
      if (isPaid) {
        const paidAt = new Date().toISOString();
        const durationDays = targetPlan === 'thesis' ? 90 : 30;
        const periodEnd = new Date(Date.now() + durationDays * 86400000).toISOString();

        // Update payments
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
              raw: midtransData,
              updated_at: paidAt,
            }),
          }
        ).catch(() => null);

        // Update profiles
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

          // Upsert subscriptions
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

        return new Response(
          JSON.stringify({
            order_id: orderId,
            status: 'paid',
            plan: targetPlan,
            synced: true,
            paid_at: paidAt,
            source: 'midtrans_sync',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (isFailed) {
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
              raw: midtransData,
              updated_at: new Date().toISOString(),
            }),
          }
        ).catch(() => null);

        return new Response(
          JSON.stringify({
            order_id: orderId,
            status: 'failed',
            transaction_status: transactionStatus,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          order_id: orderId,
          status: 'pending',
          transaction_status: transactionStatus,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Default fallback
    return new Response(
      JSON.stringify({
        order_id: orderId,
        status: paymentRecord ? paymentRecord.status : 'pending',
        source: 'database',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memeriksa status pembayaran.';
    return new Response(
      JSON.stringify({ code: 'INTERNAL_ERROR', message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
