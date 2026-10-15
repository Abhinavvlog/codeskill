import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'codeskill-frontend',
      probe: 'startup',
      initialized: true,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
