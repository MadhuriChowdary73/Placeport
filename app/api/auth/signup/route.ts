import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { validateEmail, parseRollNumber, extractRollNumber } from '@/lib/validation'
import { ADMIN_EMAIL } from '@/lib/config'
import type { Database } from '@/types/database'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = (body?.email || '').trim().toLowerCase()
    const password = body?.password || ''

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ ok: false, error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const validation = validateEmail(email)
    if (!validation.valid) {
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 })
    }

    const isAdmin = email === ADMIN_EMAIL.toLowerCase()

    // Students must have a parseable roll number
    let rollNumber = 'ADMIN'
    let branch = 'ADMIN'
    let batchYear = 24

    if (!isAdmin) {
      const rollCheck = extractRollNumber(email)
      if (!rollCheck.valid) {
        return NextResponse.json({ ok: false, error: rollCheck.error }, { status: 400 })
      }
      const parsed = parseRollNumber(email)
      rollNumber = parsed?.rollNumber || rollCheck.rollNumber
      branch = parsed?.branch || 'CSE'
      batchYear = parsed?.batchYear || 24
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 })
    }

    // Collect cookies set by Supabase during signup/signin
    const cookieStore: Array<{ name: string; value: string; options: Record<string, any> }> = []

    const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach((c) => cookieStore.push(c))
        },
      },
    })

    // Create the account in Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          roll_number: rollNumber,
          role: isAdmin ? 'admin' : 'student',
        },
      },
    })

    if (signUpError) {
      if (
        signUpError.message.toLowerCase().includes('already registered') ||
        signUpError.message.toLowerCase().includes('user already registered')
      ) {
        return NextResponse.json(
          { ok: false, error: 'An account with this email already exists. Please sign in instead.' },
          { status: 409 }
        )
      }
      return NextResponse.json({ ok: false, error: signUpError.message }, { status: 400 })
    }

    // Immediately sign in to establish a session (cookies)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    const userId = signInData?.user?.id || signUpData?.user?.id
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: 'Account created but could not establish session. Please sign in.' },
        { status: 500 }
      )
    }

    // Upsert profile row
    await (supabase.from('profiles' as any) as any).upsert(
      {
        id: userId,
        email,
        roll_number: rollNumber,
        branch,
        batch_year: batchYear,
        role: isAdmin ? 'admin' : 'student',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

    const res = NextResponse.json({ ok: true, role: isAdmin ? 'admin' : 'student' })
    cookieStore.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
    return res
  } catch (err: any) {
    console.error('[SignUpAPI] Unhandled error:', err)
    return NextResponse.json({ ok: false, error: err.message || 'Internal server error' }, { status: 500 })
  }
}
