import { NextRequest, NextResponse } from 'next/server';

const PLANS_CONFIG: Record<string, { name: string; amountIdr: number; durationMonths: number }> = {
  monthly: { name: 'Paket Bulanan OlahData (30 Hari)', amountIdr: 39000, durationMonths: 1 },
  thesis: { name: 'Paket Skripsi Tuntas OlahData (90 Hari)', amountIdr: 99000, durationMonths: 3 },
};

const DEFAULT_GUEST_USER_ID = '84539b01-61d7-4dfc-88d3-ad306d2d12b2';
const DEFAULT_SUPABASE_URL = 'https://muxzjegpxjamasprgdrs.supabase.co';
const DEFAULT_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eHpqZWdweGphbWFzcHJnZHJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg0NjQxNywiZXhwIjoyMTA3NDIyNDE3fQ.V4H7G7WGUyBhbQVfGA8miMVzLkE7JpFvVd7lsQqPL5U';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const plan = body.plan === 'thesis' ? 'thesis' : 'monthly';
    const planConfig = PLANS_CONFIG[plan];

    const customerName = String(body.customerName || 'Mahasiswa OlahData').trim();
    const customerEmail = String(body.customerEmail || 'mahasiswa@olahdata.id').trim();
    const customerPhone = String(body.customerPhone || '081234567890').trim();

    // Resolusi user_id dari body, header, atau cookie sesi
    let resolvedUserId = String(body.userId || '').trim();
    if (!resolvedUserId) {
      resolvedUserId = req.headers.get('x-user-id') || '';
    }
    if (!resolvedUserId) {
      const cookieHeader = req.headers.get('cookie') || '';
      const uidMatch = cookieHeader.match(/olahdata-uid=([^;]+)/);
      if (uidMatch) {
        resolvedUserId = decodeURIComponent(uidMatch[1].trim());
      }
    }

    const userId =
      resolvedUserId && resolvedUserId.includes('-') && resolvedUserId.length >= 32
        ? resolvedUserId
        : DEFAULT_GUEST_USER_ID;

    const invoiceNumber = `OD-${plan.toUpperCase()}-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;

    const serverKey =
      process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-WxaVRWag2.0qOo1r_iJg07RE';
    const clientKey =
      process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-Nl4mVDRgnxsQTD2hGmyWeQtN';
    const isSandbox = serverKey.startsWith('SB-');

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      DEFAULT_SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE_KEY;

    // 0. AUTO-HEAL PROFILES: Pastikan row user ada di public.profiles agar foreign key payments_user_id_fkey tidak gagal
    await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        id: userId,
        nama: customerName || 'Mahasiswa OlahData',
        kampus: 'Universitas Indonesia',
        prodi: 'Manajemen',
        plan: 'free',
      }),
    }).catch(() => null);

    // 1. PRE-SNAP DATABASE INSERT
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        user_id: userId,
        amount_idr: planConfig.amountIdr,
        status: 'pending',
        provider_ref: invoiceNumber,
        raw: {
          plan,
          planName: planConfig.name,
          customerName,
          customerEmail,
          customerPhone,
          userId,
          isSandbox,
          created_at: new Date().toISOString(),
        },
      }),
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text().catch(() => '');
      return NextResponse.json(
        {
          code: 'DB_PRE_INSERT_FAILED',
          message: 'Gagal mencatat transaksi awal ke basis data.',
          detail: errText,
        },
        { status: 500 }
      );
    }

    // 2. Request Midtrans Snap Token
    const snapEndpoint = isSandbox
      ? 'https://app.sandbox.midtrans.com/snap/v1/transactions'
      : 'https://app.midtrans.com/snap/v1/transactions';

    const authHeader = Buffer.from(`${serverKey}:`).toString('base64');
    const snapRes = await fetch(snapEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: invoiceNumber,
          gross_amount: planConfig.amountIdr,
        },
        item_details: [
          {
            id: plan,
            price: planConfig.amountIdr,
            quantity: 1,
            name: planConfig.name,
          },
        ],
        customer_details: {
          first_name: customerName,
          email: customerEmail,
          phone: customerPhone,
        },
        custom_field1: userId,
        custom_field2: plan,
      }),
    });

    if (!snapRes.ok) {
      const errJson = await snapRes.json().catch(() => ({}));
      const errMsg = Array.isArray(errJson?.error_messages)
        ? errJson.error_messages.join(', ')
        : 'Gagal membuat transaksi Midtrans Snap.';

      // Mark payment as failed in DB
      await fetch(
        `${supabaseUrl}/rest/v1/payments?provider_ref=eq.${encodeURIComponent(invoiceNumber)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            status: 'failed',
            raw: { error: errMsg, failed_at: new Date().toISOString() },
            updated_at: new Date().toISOString(),
          }),
        }
      ).catch(() => null);

      return NextResponse.json(
        { code: 'MIDTRANS_ERROR', message: errMsg },
        { status: 502 }
      );
    }

    const snapData = await snapRes.json();

    // 3. Update database record with snap_token & redirect_url
    await fetch(
      `${supabaseUrl}/rest/v1/payments?provider_ref=eq.${encodeURIComponent(invoiceNumber)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          raw: {
            plan,
            planName: planConfig.name,
            customerName,
            customerEmail,
            customerPhone,
            userId,
            isSandbox,
            snap_token: snapData.token,
            redirect_url: snapData.redirect_url,
          },
          updated_at: new Date().toISOString(),
        }),
      }
    ).catch(() => null);

    return NextResponse.json({
      invoiceNumber,
      plan,
      planName: planConfig.name,
      amountIdr: planConfig.amountIdr,
      paymentUrl: snapData.redirect_url,
      snapToken: snapData.token,
      clientKey,
      isSandbox,
      status: 'pending',
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Gagal membuat tagihan pembayaran Midtrans.';
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message },
      { status: 500 }
    );
  }
}
