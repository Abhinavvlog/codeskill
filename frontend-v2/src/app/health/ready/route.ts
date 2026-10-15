import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Frontend readiness probe: verifies that the Next.js server runtime is accepting HTTP traffic
  return NextResponse.json(
    {
      status: 'ok',
      service: 'codeskill-frontend',
      probe: 'readiness',
      ready: true,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
