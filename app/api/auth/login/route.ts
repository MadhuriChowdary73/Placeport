import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { validateRollNumber } from '@/lib/validation'
import { rollNumberToEmail } from '@/lib/config'
import { checkRateLimit } from '@/lib/rateLimit'
import type { Database } from '@/types/database'

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting: max 10 login attempts per IP per minute
    const rateLimit = checkRateLimit(req, 'login', { limit: 10, windowMs: 60 * 1000 })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: 'Too many login attempts. Please wait a minute and try again.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const rawRoll = (body?.rollNumber || body?.email || '').trim()
    const password = body?.password || ''

    if (!rawRoll || !password) {
      return NextResponse.json(
        { ok: false, error: 'Incorrect roll number or password.' },
        { status: 401 }
      )
    }

    // 2. Normalize roll number
    const validation = validateRollNumber(rawRoll)
    const normalizedRoll = validation.valid && validation.rollNumber ? validation.rollNumber : rawRoll.toLowerCase()

    // 3. Convert to synthetic email
    const syntheticEmail = rollNumberToEmail(normalizedRoll)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 })
    }

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

    // 4. Attempt login with synthetic email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: syntheticEmail,
      password,
    })

    // On ANY failure: always show "Incorrect roll number or password."
    if (error || !data?.user) {
      return NextResponse.json(
        { ok: false, error: 'Incorrect roll number or password.' },
        { status: 401 }
      )
    }

    const user = data.user

    // 5. Check profile status (ensure not blocked)
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('status, role, roll_number')
        .eq('id', user.id)
        .single()

      if ((profile as any)?.status === 'blocked') {
        await supabase.auth.signOut()
        return NextResponse.json(
          { ok: false, error: 'Your account access has been suspended. Please contact the administrator.' },
          { status: 403 }
        )
      }
    } catch (checkErr) {
      console.warn('[LoginAPI] Profile check note:', checkErr)
    }

    // 6. Return response with session cookies (never exposing synthetic email)
    const res = NextResponse.json({
      ok: true,
      role: 'student',
      rollNumber: normalizedRoll.toUpperCase(),
    })
    cookieStore.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
    return res
  } catch (err: any) {
    console.error('[LoginAPI] Unhandled error:', err)
    return NextResponse.json(
      { ok: false, error: 'Incorrect roll number or password.' },
      { status: 401 }
    )
  }
}
