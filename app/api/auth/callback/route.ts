import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  // Forward to /auth/callback with all parameters preserved
  return NextResponse.redirect(`${origin}/auth/callback?${searchParams.toString()}`)
}
