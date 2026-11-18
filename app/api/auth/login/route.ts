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

    const validation = validateEmail(email)
    if (!validation.valid) {
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 })
    }

    const isAdmin = email === ADMIN_EMAIL.toLowerCase()

    // Verify admin password before touching Supabase
    if (isAdmin && password !== 'Madhuri_73') {
      return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 })
    }

    // Build a response object we'll mutate with cookies
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

    // --- ADMIN FLOW ---
    if (isAdmin) {
      let { data, error } = await supabase.auth.signInWithPassword({ email, password })

      // If admin doesn't exist in Supabase Auth yet, create them
      if (error) {
        console.log('[AdminLogin] signIn error:', error.message, '— attempting signUp')
        const signUpResult = await supabase.auth.signUp({
          email,
          password,
          options: { data: { roll_number: 'ADMIN', role: 'admin' } },
        })
        if (signUpResult.error) {
          return NextResponse.json({ ok: false, error: signUpResult.error.message }, { status: 401 })
        }
        // Sign in again after creating
        const retry = await supabase.auth.signInWithPassword({ email, password })
        data = retry.data
        if (retry.error) {
          return NextResponse.json({ ok: false, error: retry.error.message }, { status: 401 })
        }
      }

      const user = data?.user
      if (!user) {
        return NextResponse.json({ ok: false, error: 'Login failed — no user returned' }, { status: 401 })
      }

      // Upsert admin profile
      await (supabase.from('profiles' as any) as any).upsert(
        {
          id: user.id,
          email,
          roll_number: 'ADMIN',
          branch: 'ADMIN',
          batch_year: 24,
          role: 'admin',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )

      // Build response and apply all session cookies
      const res = NextResponse.json({ ok: true, role: 'admin' })
      cookieStore.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      return res
    }

    // --- STUDENT FLOW ---
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data?.user) {
      const msg = error?.message || 'Invalid credentials'
      return NextResponse.json(
        {
          ok: false,
          error: msg.includes('Invalid login credentials')
            ? 'Incorrect email or password. If you don\'t have an account, use "Create Account".'
            : msg,
        },
        { status: 401 }
      )
    }

    const user = data.user
    const parsed = parseRollNumber(email)
    const fallback = extractRollNumber(email)
    const rollNumber =
      parsed?.rollNumber ||
      (fallback.valid ? fallback.rollNumber : email.split('@')[0].toUpperCase())

    // Upsert student profile
    await (supabase.from('profiles' as any) as any).upsert(
      {
        id: user.id,
        email,
        roll_number: rollNumber,
        branch: parsed?.branch || 'CSE',
        batch_year: parsed?.batchYear || 24,
        role: 'student',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

    const res = NextResponse.json({ ok: true, role: 'student' })
    cookieStore.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
    return res
  } catch (err: any) {
    console.error('[LoginAPI] Unhandled error:', err)
    return NextResponse.json({ ok: false, error: err.message || 'Internal server error' }, { status: 500 })
  }
}
