import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { validateRollNumber } from '@/lib/validation'
import { rollNumberToEmail } from '@/lib/config'
import { checkRateLimit } from '@/lib/rateLimit'
import { checkRollNumberEligibility } from '@/lib/services/rollNumberService'
import type { Database } from '@/types/database'

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting: max 5 signup attempts per IP per 10 minutes
    const rateLimit = checkRateLimit(req, 'signup', { limit: 5, windowMs: 10 * 60 * 1000 })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: 'Too many signup attempts. Please try again in a few minutes.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const rawRoll = (body?.rollNumber || body?.email || '').trim()
    const password = body?.password || ''
    const confirmPassword = body?.confirmPassword || ''

    if (!rawRoll) {
      return NextResponse.json({ ok: false, error: 'Roll number is required' }, { status: 400 })
    }

    if (!password) {
      return NextResponse.json({ ok: false, error: 'Password is required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ ok: false, error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json({ ok: false, error: 'Passwords do not match' }, { status: 400 })
    }

    // 2. Validate and normalize roll number format (av.sc.u4<branch><yy><nnn>)
    const validation = validateRollNumber(rawRoll)
    if (!validation.valid || !validation.rollNumber) {
      return NextResponse.json(
        { ok: false, error: validation.error || 'Invalid roll number format' },
        { status: 400 }
      )
    }

    const normalizedRoll = validation.rollNumber
    const branch = validation.branch || 'CSE'
    const batchYear = validation.batchYear || 24

    // 3. Server-side eligibility check against valid_roll_numbers table
    const isEligible = await checkRollNumberEligibility(normalizedRoll)
    if (!isEligible) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Your roll number is not on the approved student roster. Please contact the campus placement coordinator or administrator.',
        },
        { status: 403 }
      )
    }

    // 4. Convert roll number to internal synthetic email (<rollnumber>@placeport.invalid)
    const syntheticEmail = rollNumberToEmail(normalizedRoll)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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

    // 5. Create user in Supabase Auth (using service role to bypass email confirmation if available)
    if (serviceRoleKey && !serviceRoleKey.includes('placeholder')) {
      try {
        const { createClient: createSupabaseJsClient } = await import('@supabase/supabase-js')
        const adminClient = createSupabaseJsClient<Database>(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })

        const { error: createError } = await adminClient.auth.admin.createUser({
          email: syntheticEmail,
          password,
          email_confirm: true,
          user_metadata: { roll_number: normalizedRoll, role: 'student' },
        })

        if (createError && (createError.message.toLowerCase().includes('already registered') || createError.message.toLowerCase().includes('exists'))) {
          return NextResponse.json(
            { ok: false, error: 'An account with this roll number already exists. Please sign in.' },
            { status: 409 }
          )
        }
      } catch (adminErr) {
        console.warn('[SignUpAPI] Service role create note:', adminErr)
      }
    } else {
      const { error: signUpError } = await supabase.auth.signUp({
        email: syntheticEmail,
        password,
        options: {
          data: {
            roll_number: normalizedRoll,
            role: 'student',
          },
        },
      })

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes('already registered')) {
          return NextResponse.json(
            { ok: false, error: 'An account with this roll number already exists. Please sign in.' },
            { status: 409 }
          )
        }
        return NextResponse.json({ ok: false, error: signUpError.message }, { status: 400 })
      }
    }

    // 6. Sign in immediately to establish session and cookies
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: syntheticEmail,
      password,
    })

    if (signInError || !signInData?.session) {
      return NextResponse.json(
        { ok: false, error: 'Account created. Please proceed to Sign In with your credentials.' },
        { status: 200 }
      )
    }

    const userId = signInData.user.id

    // 7. Store roll_number (unique) and status 'approved' in profiles
    try {
      await (supabase.from('profiles' as any) as any).upsert(
        {
          id: userId,
          roll_number: normalizedRoll,
          branch,
          batch: batchYear ? 2000 + batchYear : 2025,
          role: 'student',
          status: 'approved',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
    } catch (profErr) {
      console.warn('[SignUpAPI] Profile upsert note:', profErr)
    }

    // 8. Return response with session cookies (never exposing synthetic email)
    const res = NextResponse.json({
      ok: true,
      role: 'student',
      rollNumber: normalizedRoll.toUpperCase(),
    })
    cookieStore.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
    return res
  } catch (err: any) {
    console.error('[SignUpAPI] Unhandled error:', err)
    return NextResponse.json({ ok: false, error: err.message || 'Internal signup error' }, { status: 500 })
  }
}
