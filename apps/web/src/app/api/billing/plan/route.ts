import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    plan: 'free',
    status: 'active',
    expiresAt: null,
    planDetails: {
      name: 'Coba Gratis',
      priceIdr: 0,
      maxProjects: 3,
      maxRespondents: 150,
      watermarkedExports: true,
    },
  });
}
