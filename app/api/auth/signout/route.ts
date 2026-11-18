import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { origin } = new URL(req.url)
  const response = NextResponse.redirect(`${origin}/`)

  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch {}

  const cookieStore = await cookies()
  cookieStore.delete('placeport_session')
  response.cookies.delete('placeport_session')

  return response
}
