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

    const validation = validateEmail(cleanEmail)
    if (!validation.valid) {
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 })
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

    const isAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase()

    // 1. Special Admin Handling
    if (isAdmin) {
      if (password !== 'Madhuri_73') {
        return NextResponse.json({ ok: false, error: 'Invalid admin password' }, { status: 401 })
      }

      // Try signing in admin
      let { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      })

      // If admin user doesn't exist yet in Supabase Auth, register them
      if (error && (error.message.includes('Invalid login') || error.message.includes('User not found'))) {
        const signUpRes = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: { roll_number: 'ADMIN', role: 'admin' },
          },
        })
        data = signUpRes.data as any
        error = signUpRes.error
      }

      const user = data?.user
      if (user) {
        // Ensure profile exists with role: 'admin'
        try {
          await (supabase.from('profiles' as any) as any).upsert({
            id: user.id,
            email: cleanEmail,
            roll_number: 'ADMIN',
            branch: 'ADMIN',
            batch_year: 24,
            role: 'admin',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' })
        } catch (err) {
          console.error('[AdminLogin] Profile upsert notice:', err)
        }

        const resData = { ok: true, role: 'admin' }
        return new NextResponse(JSON.stringify(resData), {
          status: 200,
          headers: response.headers,
        })
      }

      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 401 })
      }
    }

    // 2. Student Sign In
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password,
    })

    if (error || !data?.user) {
      return NextResponse.json(
        { ok: false, error: 'Invalid email or password. Please verify your credentials or create an account.' },
        { status: 401 }
      )
    }

    const user = data.user
    const parsed = parseRollNumber(cleanEmail)
    const fallback = extractRollNumber(cleanEmail)
    const rollNumber = parsed?.rollNumber || (fallback.valid ? fallback.rollNumber : cleanEmail.split('@')[0].toUpperCase())

    // Ensure student profile is present
    try {
      await (supabase.from('profiles' as any) as any).upsert({
        id: user.id,
        email: cleanEmail,
        roll_number: rollNumber,
        branch: parsed?.branch || 'CSE',
        batch_year: parsed?.batchYear || 24,
        role: 'student',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    } catch (err) {
      console.error('[StudentLogin] Profile upsert notice:', err)
    }

    const resData = { ok: true, role: 'student' }
    return new NextResponse(JSON.stringify(resData), {
      status: 200,
      headers: response.headers,
    })
  } catch (err: any) {
    console.error('[LoginAPI] Error:', err)
    return NextResponse.json({ ok: false, error: err.message || 'Internal login error' }, { status: 500 })
  }
}
