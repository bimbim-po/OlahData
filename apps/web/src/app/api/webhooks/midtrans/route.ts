import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const DEFAULT_GUEST_USER_ID = '84539b01-61d7-4dfc-88d3-ad306d2d12b2';
const DEFAULT_SUPABASE_URL = 'https://muxzjegpxjamasprgdrs.supabase.co';
const DEFAULT_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eHpqZWdweGphbWFzcHJnZHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg0NjQxNywiZXhwIjoyMTA3NDIyNDE3fQ.V4H7G7WGUyBhbQVfGA8miMVzLkE7JpFvVd7lsQqPL5U';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));
    const serverKey =
      process.env.MIDTRANS_SERVER_KEY || '';

    const orderId = String(payload.order_id || '').trim();
    const statusCode = String(payload.status_code || '').trim();
    const grossAmount = String(payload.gross_amount || '').trim();
    const signatureKey = String(payload.signature_key || '').trim();

    if (!orderId) {
      return NextResponse.json(
        { code: 'BAD_REQUEST', message: 'order_id tidak ditemukan.' },
        { status: 400 }
      );
    }

    // 1. Signature Verification (SHA-512)
    if (signatureKey) {
      const inputStr = `${orderId}${statusCode}${grossAmount}${serverKey}`;
      const expectedSignature = crypto.createHash('sha512').update(inputStr).digest('hex');

      if (signatureKey.toLowerCase() !== expectedSignature.toLowerCase()) {
        return NextResponse.json(
          { code: 'INVALID_SIGNATURE', message: 'Tanda tangan webhook Midtrans tidak valid.' },
          { status: 400 }
        );
      }
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      DEFAULT_SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE_KEY;

    // 2. IDEMPOTENCY GUARD: Periksa status transaksi di DB
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
    }

    let existingPayment: DbPaymentRecord | null = null;
    if (checkRes.ok) {
      const rows = (await checkRes.json()) as DbPaymentRecord[];
      if (Array.isArray(rows) && rows.length > 0) {
        existingPayment = rows[0];
      }
    }

    // Tolak mutasi mundur jika sudah berstatus paid
    if (existingPayment?.status === 'paid') {
      return NextResponse.json({
        status: 'OK',
        processed: true,
        message: 'Transaksi telah berstatus paid sebelumnya (idempotent).',
      });
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

      // a. Update payments
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

    return NextResponse.json({
      status: 'OK',
      processed: isPaid,
      transaction_status: transactionStatus,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Payload webhook tidak dapat diproses.';
    return NextResponse.json(
      { code: 'BAD_REQUEST', message },
      { status: 400 }
    );
  }
}
