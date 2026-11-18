import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { validateEmail, parseRollNumber, extractRollNumber } from '@/lib/validation'
import { ADMIN_EMAIL } from '@/lib/config'
import type { Database } from '@/types/database'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    const cleanEmail = (email || '').trim().toLowerCase()

    if (!cleanEmail || !password) {
      return NextResponse.json({ ok: false, error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ ok: false, error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const validation = validateEmail(cleanEmail)
    if (!validation.valid) {
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 })
    }

    const isAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase()
    let rollNumber = 'ADMIN'
    let branch = 'ADMIN'
    let batchYear = 24

    if (!isAdmin) {
      const rollCheck = extractRollNumber(cleanEmail)
      if (!rollCheck.valid) {
        return NextResponse.json({ ok: false, error: rollCheck.error }, { status: 400 })
      }
      const parsed = parseRollNumber(cleanEmail)
      rollNumber = parsed?.rollNumber || rollCheck.rollNumber
      branch = parsed?.branch || 'CSE'
      batchYear = parsed?.batchYear || 24
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      return NextResponse.json({ ok: false, error: 'Supabase configuration is missing' }, { status: 500 })
    }

    const response = NextResponse.json({ ok: true })

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

    // Sign up student
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password,
      options: {
        data: {
          roll_number: rollNumber,
          role: isAdmin ? 'admin' : 'student',
        },
      },
    })

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes('already registered')) {
        return NextResponse.json(
          { ok: false, error: 'An account with this email already exists. Please sign in.' },
          { status: 409 }
        )
      }
      return NextResponse.json({ ok: false, error: signUpError.message }, { status: 400 })
    }

    // Attempt sign-in immediately to establish active session cookies
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password,
    })

    const userId = signInData?.user?.id || signUpData?.user?.id
    if (userId) {
      try {
        await (supabase.from('profiles' as any) as any).upsert({
          id: userId,
          email: cleanEmail,
          roll_number: rollNumber,
          branch: branch,
          batch_year: batchYear,
          role: isAdmin ? 'admin' : 'student',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
      } catch (err) {
        console.error('[SignUp] Profile creation notice:', err)
      }
    }

    const resData = { ok: true, role: isAdmin ? 'admin' : 'student' }
    return new NextResponse(JSON.stringify(resData), {
      status: 200,
      headers: response.headers,
    })
  } catch (err: any) {
    console.error('[SignUpAPI] Error:', err)
    return NextResponse.json({ ok: false, error: err.message || 'Internal signup error' }, { status: 500 })
  }
}
