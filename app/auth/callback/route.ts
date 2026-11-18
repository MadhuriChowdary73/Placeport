import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { parseRollNumber, extractRollNumber } from '@/lib/validation'
import type { Database } from '@/types/database'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as any
  const next = searchParams.get('next') ?? '/feed'

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return NextResponse.redirect(`${origin}/login?error=config`)
  }

  // Pre-create the redirect response so all Supabase session cookies
  // are attached directly to this redirect response
  const response = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  let user = null

  // 1. Exchange PKCE code for session
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data?.user) {
      user = data.user
    } else if (error) {
      console.error('[AuthCallback] Session exchange error:', error.message)
    }
  }

  // 2. Or verify token_hash (for OTP links)
  if (!user && token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error && data?.user) {
      user = data.user
    } else if (error) {
      console.error('[AuthCallback] Token hash verify error:', error.message)
    }
  }

  // 3. Fallback: check existing active user
  if (!user) {
    const { data: userData } = await supabase.auth.getUser()
    user = userData?.user ?? null
  }

  // 4. Verify user & enforce Amrita student domain
  if (user && user.email) {
    const cleanEmail = user.email.toLowerCase().trim()

    // Reject non-Amrita accounts
    if (!cleanEmail.endsWith('@av.students.amrita.edu')) {
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/login?error=domain`)
    }

    const parsed = parseRollNumber(cleanEmail)
    const fallbackRoll = extractRollNumber(cleanEmail)
    const rollNumber = parsed?.rollNumber || (fallbackRoll.valid ? fallbackRoll.rollNumber : cleanEmail.split('@')[0].toUpperCase())

    // Ensure verified student profile exists in public.profiles table
    try {
      await (supabase.from('profiles' as any) as any).upsert({
        id: user.id,
        email: cleanEmail,
        roll_number: rollNumber,
        branch: parsed?.branch || 'CSE',
        batch_year: parsed?.batchYear || 24,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    } catch (upsertErr) {
      console.error('[AuthCallback] Profile upsert error:', upsertErr)
    }

    return response
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
