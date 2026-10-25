import { NextResponse } from 'next/server';
import { getPlanConfig } from '@/lib/plans';

export async function GET() {
  const freePlan = getPlanConfig('free');
  return NextResponse.json({
    plan: 'free',
    status: 'active',
    expiresAt: null,
    planDetails: {
      name: freePlan.name,
      priceIdr: freePlan.price,
      maxProjects: freePlan.quotaProjects,
      maxRespondents: freePlan.quotaRespondents,
      watermarkedExports: freePlan.exportType === 'watermark',
    },
  });
}
