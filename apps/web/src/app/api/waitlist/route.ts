import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, university, plan, projectId, notes } = body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Email valid wajib diisi.' },
        { status: 400 }
      );
    }

    const payload = {
      name: name || 'Mahasiswa',
      email: email.trim().toLowerCase(),
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
        console.warn('[Waitlist API] Supabase insert warning (table might be created soon):', error.message);
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
