import { NextRequest, NextResponse } from 'next/server';

const PLANS_CONFIG: Record<string, { name: string; amountIdr: number; durationMonths: number }> = {
  monthly: { name: 'Paket Bulanan OlahData', amountIdr: 39000, durationMonths: 1 },
  thesis: { name: 'Paket Skripsi (3 Bulan)', amountIdr: 99000, durationMonths: 3 },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan = 'monthly' } = body;
    const planConfig = PLANS_CONFIG[plan] || PLANS_CONFIG.monthly;

    const invoiceNumber = `INV-${Date.now()}`;
    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    let paymentUrl = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${invoiceNumber}`;
    let snapToken = `snap-token-${Date.now()}`;

    // If real Midtrans credentials configured, call Midtrans Snap API
    if (serverKey && !serverKey.startsWith('mock')) {
      try {
        const authHeader = Buffer.from(`${serverKey}:`).toString('base64');
        const snapRes = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
          }),
        });

        if (snapRes.ok) {
          const snapData = await snapRes.json();
          paymentUrl = snapData.redirect_url;
          snapToken = snapData.token;
        }
      } catch {
        // Fallback to manual renewal payment link
      }
    }

    const reminderWhatsApp =
      `Halo! Berikut tautan perpanjangan manual ${planConfig.name} sebesar Rp ${planConfig.amountIdr.toLocaleString('id-ID')}: ` +
      `${paymentUrl}. Tagihan ini berlaku selama 24 jam.`;

    return NextResponse.json({
      invoiceNumber,
      plan,
      amountIdr: planConfig.amountIdr,
      paymentUrl,
      snapToken,
      reminderWhatsApp,
      status: 'pending',
      instructions: 'Silakan selesaikan pembayaran via QRIS atau Transfer Bank. Akun akan otomatis aktif setelah pembayaran terverifikasi.',
    });
  } catch {
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Gagal membuat tagihan pembayaran.' },
      { status: 500 }
    );
  }
}
