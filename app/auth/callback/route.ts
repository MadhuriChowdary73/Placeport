import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseRollNumber, extractRollNumber } from '@/lib/validation'
import { isMockMode, upsertMockProfile } from '@/lib/mockStore'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const email = searchParams.get('email') || ''
  const next = searchParams.get('next') ?? '/feed'

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isDevOrPlaceholder = !url || url.includes('placeholder') || code?.startsWith('dev')

  // In local development or fallback mode, establish session cookie directly
  if (isDevOrPlaceholder) {
    const cleanEmail = email.trim().toLowerCase()
    const parsed = parseRollNumber(cleanEmail)
    const rollNumber = parsed?.rollNumber || (extractRollNumber(cleanEmail).valid ? (extractRollNumber(cleanEmail) as any).rollNumber : 'Unknown')
    const userId = 'dev-student-' + cleanEmail.replace(/[^a-z0-9]/g, '-')

    // Upsert profile only if it doesn't exist
    upsertMockProfile({
      user_id: userId,
      email: cleanEmail,
      roll_number: rollNumber,
    })

    const response = NextResponse.redirect(`${origin}${next}`)
    const sessionData = JSON.stringify({
      id: userId,
      email: cleanEmail,
      roll_number: rollNumber,
      branch: parsed?.branch || 'CSE',
      batch_year: parsed?.batchYear || 24,
    })
    response.cookies.set('placeport_session', encodeURIComponent(sessionData), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      httpOnly: false,
    })
    return response
  }

  // Live Supabase exchange
  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        // After successful session exchange, create profile ONLY if it doesn't already exist
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle()

          if (!existingProfile) {
            const parsed = parseRollNumber(user.email)
            const fallbackRoll = extractRollNumber(user.email)
            const rollNumber = parsed?.rollNumber || (fallbackRoll.valid ? fallbackRoll.rollNumber : user.email.split('@')[0].toUpperCase())

            await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email,
                roll_number: rollNumber,
                branch: parsed?.branch || null,
                batch_year: parsed?.batchYear || null,
              } as any)
          }
        }
        return NextResponse.redirect(`${origin}${next}`)
      }
      console.error('[AuthCallback] Session exchange error:', error.message)
    } catch (err) {
      console.error('[AuthCallback] Unexpected error exchanging code:', err)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
