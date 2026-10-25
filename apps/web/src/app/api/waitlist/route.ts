import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

// In-memory rate limiting map: identifier -> timestamps[]
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(key, validTimestamps);
    return true;
  }

  validTimestamps.push(now);
  rateLimitMap.set(key, validTimestamps);
  return false;
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
    const body = await request.json();
    const { name, email, phone, university, plan, projectId, notes } = body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Email valid wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const rateLimitKey = `${ip}_${cleanEmail}`;

    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Terlalu banyak permintaan daftar tunggu dalam waktu singkat. Silakan tunggu beberapa saat.',
        },
        { status: 429 }
      );
    }

    const payload = {
      name: name || 'Mahasiswa',
      email: cleanEmail,
      phone: phone || null,
      university: university || null,
      plan: plan || 'monthly',
      project_id: projectId || null,
      notes: notes || null,
      created_at: new Date().toISOString(),
    };

    // 1. Coba simpan ke Supabase jika admin client tersedia
    try {
      const supabaseAdmin = getSupabaseAdminClient();
      const { error } = await supabaseAdmin.from('waitlist').insert([payload]);
      if (error) {
        // Fallback ke audit_log jika tabel waitlist belum dimigrasi di SQL Editor
        await supabaseAdmin.from('audit_log').insert([
          {
            action: 'WAITLIST_SIGNUP',
            entity: 'waitlist',
            meta: {
              name: payload.name,
              email: payload.email,
              phone: payload.phone,
              university: payload.university,
              plan: payload.plan,
              project_id: payload.project_id,
              notes: payload.notes,
            },
          },
        ]);
      }
    } catch (dbErr) {
      console.warn('[Waitlist API] Supabase admin not configured:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Permintaan aktivasi paket berhasil dicatat. Admin akan segera menghubungi Anda.',
      data: payload,
    });
  } catch (error) {
    console.error('[Waitlist API] Error handling waitlist request:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server saat memproses permintaan.' },
      { status: 500 }
    );
  }
}
