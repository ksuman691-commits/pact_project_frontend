import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** The commit that's live right now. Open apps compare it with their own (AppUpdater). */
export function GET() {
  return NextResponse.json(
    { build: process.env.VERCEL_GIT_COMMIT_SHA || 'dev' },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  )
}
