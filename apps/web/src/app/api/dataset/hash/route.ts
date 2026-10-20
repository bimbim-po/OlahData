import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

export async function POST(request: Request) {
  try {
    const arrayBuffer = await request.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return NextResponse.json(
        { error: 'Berkas atau data kosong.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(arrayBuffer);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    return NextResponse.json({
      sha256: hash,
      sizeBytes: buffer.byteLength,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghitung hash server';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
