import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_GUEST_USER_ID = '84539b01-61d7-4dfc-88d3-ad306d2d12b2';
const DEFAULT_SUPABASE_URL = 'https://muxzjegpxjamasprgdrs.supabase.co';
const DEFAULT_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eHpqZWdweGphbWFzcHJnZHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg0NjQxNywiZXhwIjoyMTA3NDIyNDE3fQ.V4H7G7WGUyBhbQVfGA8miMVzLkE7JpFvVd7lsQqPL5U';

export async function GET(req: NextRequest) {
  return handleStatus(req);
}

export async function POST(req: NextRequest) {
  return handleStatus(req);
}

async function handleStatus(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let orderId = searchParams.get('order_id') || searchParams.get('orderId');

    if (!orderId && req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      orderId = String(body.order_id || body.orderId || '');
    }

    if (!orderId) {
      return NextResponse.json(
        { code: 'BAD_REQUEST', message: 'Parameter order_id wajib disertakan.' },
        { status: 400 }
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      DEFAULT_SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE_KEY;

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
      return NextResponse.json({
        order_id: orderId,
        status: 'paid',
        plan: targetPlan,
        amount_idr: paymentRecord.amount_idr,
        paid_at: paymentRecord.paid_at,
        source: 'database',
      });
    }

    // 2. Jika masih pending atau belum terverifikasi, query API Status Midtrans
    const serverKey =
      process.env.MIDTRANS_SERVER_KEY || '';
    const isSandbox = serverKey.startsWith('SB-');
    const midtransStatusUrl = isSandbox
      ? `https://api.sandbox.midtrans.com/v2/${encodeURIComponent(orderId)}/status`
      : `https://api.midtrans.com/v2/${encodeURIComponent(orderId)}/status`;

    const authHeader = Buffer.from(`${serverKey}:`).toString('base64');
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

        return NextResponse.json({
          order_id: orderId,
          status: 'paid',
          plan: targetPlan,
          synced: true,
          paid_at: paidAt,
          source: 'midtrans_sync',
        });
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

        return NextResponse.json({
          order_id: orderId,
          status: 'failed',
          transaction_status: transactionStatus,
        });
      }

      return NextResponse.json({
        order_id: orderId,
        status: 'pending',
        transaction_status: transactionStatus,
      });
    }

    // Default fallback
    return NextResponse.json({
      order_id: orderId,
      status: paymentRecord ? paymentRecord.status : 'pending',
      source: 'database',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memeriksa status pembayaran.';
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message },
      { status: 500 }
    );
  }
}
