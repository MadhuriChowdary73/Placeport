import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  cookieStore.delete('placeport_session')
  const { origin } = new URL(req.url)
  return NextResponse.redirect(`${origin}/`)
}
