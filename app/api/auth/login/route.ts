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
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 })
    }

    const isAdmin = email === ADMIN_EMAIL.toLowerCase()

    // Verify admin credentials
    if (isAdmin && password !== 'Madhuri_73') {
      return NextResponse.json({ ok: false, error: 'Invalid admin credentials' }, { status: 401 })
    }

    // Build a response object with cookies
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

      // If admin doesn't exist yet in Supabase Auth, register them
      if (error) {
        if (serviceRoleKey && !serviceRoleKey.includes('placeholder')) {
          try {
            const { createClient: createSupabaseJsClient } = await import('@supabase/supabase-js')
            const adminClient = createSupabaseJsClient<Database>(supabaseUrl, serviceRoleKey, {
              auth: { autoRefreshToken: false, persistSession: false },
            })
            await adminClient.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
              user_metadata: { roll_number: 'ADMIN', role: 'admin' },
            })
          } catch (createErr) {
            console.warn('[AdminLogin] Service role admin create note:', createErr)
          }
        } else {
          await supabase.auth.signUp({
            email,
            password,
            options: { data: { roll_number: 'ADMIN', role: 'admin' } },
          })
        }

        const retry = await supabase.auth.signInWithPassword({ email, password })
        data = retry.data
        error = retry.error
      }

      if (error || !data?.user) {
        return NextResponse.json({ ok: false, error: error?.message || 'Admin login failed' }, { status: 401 })
      }

      const user = data.user
      // Upsert admin profile
      try {
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
      } catch (profErr) {
        console.warn('[AdminLogin] Profile upsert note:', profErr)
      }

      const res = NextResponse.json({ ok: true, role: 'admin' })
      cookieStore.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      return res
    }

    // --- STUDENT FLOW ---
    let { data, error } = await supabase.auth.signInWithPassword({ email, password })

    // If email is not confirmed, try auto-confirming if service role is available
    if (error && error.message.toLowerCase().includes('email not confirmed') && serviceRoleKey && !serviceRoleKey.includes('placeholder')) {
      try {
        const { createClient: createSupabaseJsClient } = await import('@supabase/supabase-js')
        const adminClient = createSupabaseJsClient<Database>(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
        const { data: listData } = await adminClient.auth.admin.listUsers()
        const target = listData?.users?.find(u => u.email?.toLowerCase() === email)
        if (target) {
          await adminClient.auth.admin.updateUserById(target.id, { email_confirm: true })
          const retry = await supabase.auth.signInWithPassword({ email, password })
          data = retry.data
          error = retry.error
        }
      } catch (confirmErr) {
        console.warn('[StudentLogin] Auto-confirm error:', confirmErr)
      }
    }

    if (error || !data?.user) {
      const msg = error?.message || 'Invalid credentials'
      if (msg.toLowerCase().includes('email not confirmed')) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Email confirmation is enabled in your Supabase project settings. Please turn OFF "Confirm email" in Supabase Dashboard (Authentication -> Providers -> Email), or run the auto-confirm SQL command.',
          },
          { status: 401 }
        )
      }

      return NextResponse.json(
        {
          ok: false,
          error: msg.includes('Invalid login credentials')
            ? 'Incorrect email or password. If you do not have an account yet, click "Create Account".'
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
    try {
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
    } catch (profErr) {
      console.warn('[StudentLogin] Profile upsert note:', profErr)
    }

    const res = NextResponse.json({ ok: true, role: 'student' })
    cookieStore.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
    return res
  } catch (err: any) {
    console.error('[LoginAPI] Unhandled error:', err)
    return NextResponse.json({ ok: false, error: err.message || 'Internal server error' }, { status: 500 })
  }
}
