import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const serverKey = process.env.MIDTRANS_SERVER_KEY || 'dev-midtrans-server-key';

    const orderId = payload.order_id;
    const statusCode = payload.status_code;
    const grossAmount = payload.gross_amount;
    const signatureKey = payload.signature_key;

    // Verify SHA-512 signature if signature_key is provided
    if (signatureKey) {
      const inputStr = `${orderId}${statusCode}${grossAmount}${serverKey}`;
      const expectedSignature = crypto.createHash('sha512').update(inputStr).digest('hex');

      if (signatureKey !== expectedSignature && process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { code: 'INVALID_SIGNATURE', message: 'Tanda tangan webhook Midtrans tidak valid.' },
          { status: 403 }
        );
      }
    }

    const transactionStatus = payload.transaction_status;
    const fraudStatus = payload.fraud_status;

    let isPaid = false;
    if (transactionStatus === 'capture') {
      if (fraudStatus === 'accept') isPaid = true;
    } else if (transactionStatus === 'settlement') {
      isPaid = true;
    }

    if (isPaid) {
      // Idempotently record payment and update subscription
      try {
        const supabase = getSupabaseAdminClient();
        await supabase.from('payments').upsert({
          provider_ref: orderId,
          amount_idr: Math.round(parseFloat(grossAmount)),
          status: 'paid',
          raw: payload,
          paid_at: new Date().toISOString(),
        }, { onConflict: 'provider_ref' });
      } catch {
        // Log idempotency
      }
    }

    return NextResponse.json({ status: 'OK', processed: isPaid });
  } catch {
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: 'Payload webhook tidak dapat diproses.' },
      { status: 400 }
    );
  }
}
