'use client';

import type { SubscriptionPlan } from '@/lib/api/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export interface MidtransSnapResult {
  status_code?: string;
  status_message?: string;
  transaction_id?: string;
  order_id?: string;
  gross_amount?: string;
  payment_type?: string;
  transaction_time?: string;
  transaction_status?: string;
}

declare global {
  interface Window {
    snap?: {
      pay: (
        snapToken: string,
        callbacks?: {
          onSuccess?: (result: MidtransSnapResult) => void;
          onPending?: (result: MidtransSnapResult) => void;
          onError?: (result: MidtransSnapResult) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

const DEFAULT_CLIENT_KEY = 'Mid-client-MzfBTwOLJ1i2dfaqu.qk5yhZ';

/**
 * Memuat skrip Midtrans Snap.js secara dinamis di browser (Sandbox atau Production).
 */
export function loadMidtransSnapScript(
  clientKey?: string,
  isProduction = false
): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.snap) return Promise.resolve();

  const resolvedClientKey =
    clientKey ||
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ||
    DEFAULT_CLIENT_KEY;
  const isProd =
    isProduction ||
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true' ||
    !resolvedClientKey.startsWith('SB-');

  const scriptSrc = isProd
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js';

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${scriptSrc}"]`
    );
    if (existing) {
      if (window.snap) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () =>
        reject(new Error('Gagal memuat modul pembayaran Midtrans Snap.'))
      );
      return;
    }

    const script = document.createElement('script');
    script.src = scriptSrc;
    script.setAttribute('data-client-key', resolvedClientKey);
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error('Gagal memuat modul pembayaran Midtrans Snap. Periksa koneksi internet Anda.'));
    document.body.appendChild(script);
  });
}

export interface CheckoutSessionResponse {
  invoiceNumber: string;
  plan: SubscriptionPlan;
  planName: string;
  amountIdr: number;
  paymentUrl: string;
  snapToken: string;
  clientKey?: string;
  isSandbox?: boolean;
}

/**
 * Meminta token transaksi Midtrans Snap ke endpoint /api/billing/checkout
 */
export async function createMidtransCheckoutSession(params: {
  plan: SubscriptionPlan;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  userId?: string;
}): Promise<CheckoutSessionResponse> {
  let token: string | undefined;
  let resolvedUid = params.userId;

  try {
    const supabase = getSupabaseBrowserClient();
    const sessionRes = await supabase.auth.getSession();
    token = sessionRes?.data?.session?.access_token;
    if (!resolvedUid) {
      resolvedUid = sessionRes?.data?.session?.user?.id;
    }
  } catch {
    // Abaikan jika auth client belum aktif
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (resolvedUid) {
    headers['x-user-id'] = resolvedUid;
  }

  const payload = {
    ...params,
    userId: resolvedUid || params.userId,
  };

  const res = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.snapToken) {
    throw new Error(
      data?.message || 'Gagal menyiapkan sesi pembayaran Midtrans. Silakan coba lagi.'
    );
  }

  return data as CheckoutSessionResponse;
}

/**
 * Menyinkronkan status paket pengguna ke Supabase profiles setelah pembayaran Midtrans berhasil.
 */
export async function syncPaidPlanToSupabase(
  plan: SubscriptionPlan,
  orderId?: string,
  amountIdr?: number,
  userId?: string
): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient();
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      const { data } = await supabase.auth.getUser();
      effectiveUserId = data?.user?.id;
    }
    if (!effectiveUserId) return;

    // 1. Panggil endpoint serverless /api/billing/activate agar update selalu berhasil tanpa terkendala RLS
    await fetch('/api/billing/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: effectiveUserId,
        plan,
        orderId,
        amountIdr,
      }),
    }).catch(() => null);

    // 2. Fallback update langsung dari peramban jika sesi client aktif
    await supabase
      .from('profiles')
      .update({ plan, updated_at: new Date().toISOString() })
      .eq('id', effectiveUserId);

    if (orderId && amountIdr) {
      await supabase.from('payments').upsert(
        {
          user_id: effectiveUserId,
          provider: 'midtrans',
          provider_ref: orderId,
          amount_idr: amountIdr,
          status: 'paid',
          paid_at: new Date().toISOString(),
        },
        { onConflict: 'provider_ref' }
      );
    }
  } catch {
    // Abaikan jika tabel belum tersedia atau offline
  }
}

/**
 * Memeriksa status transaksi pembayaran ke endpoint /api/billing/status?order_id=...
 */
export async function checkMidtransOrderStatus(orderId: string): Promise<{
  order_id: string;
  status: 'paid' | 'pending' | 'failed' | 'not_found';
  plan?: SubscriptionPlan;
  paid_at?: string;
  synced?: boolean;
}> {
  try {
    const res = await fetch(`/api/billing/status?order_id=${encodeURIComponent(orderId)}`);
    if (!res.ok) {
      return { order_id: orderId, status: 'pending' };
    }
    const data = await res.json();
    return data;
  } catch {
    return { order_id: orderId, status: 'pending' };
  }
}

