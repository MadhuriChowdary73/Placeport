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
      return NextResponse.json({ ok: false, error: 'College email and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ ok: false, error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const validation = validateEmail(email)
    if (!validation.valid) {
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 })
    }

    const isAdmin = email === ADMIN_EMAIL.toLowerCase()

    const rollCheck = extractRollNumber(email)
    const parsed = parseRollNumber(email)
    const rollNumber = isAdmin ? 'ADMIN' : (parsed?.rollNumber || (rollCheck.valid ? rollCheck.rollNumber : email.split('@')[0].toUpperCase()))
    const branch = isAdmin ? 'ADMIN' : (parsed?.branch || 'CSE')
    const batchYear = isAdmin ? 24 : (parsed?.batchYear || 24)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 })
    }

    // Collect cookies to set
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

    // If Service Role Key is available, bypass email confirmation completely via admin API
    if (serviceRoleKey && !serviceRoleKey.includes('placeholder')) {
      try {
        const { createClient: createSupabaseJsClient } = await import('@supabase/supabase-js')
        const adminClient = createSupabaseJsClient<Database>(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })

        // Try creating user with email_confirm: true (no confirmation email sent!)
        const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { roll_number: rollNumber, role: isAdmin ? 'admin' : 'student' },
        })

        if (createError && (createError.message.toLowerCase().includes('already registered') || createError.message.toLowerCase().includes('exists'))) {
          // User already exists, update them to confirmed
          const { data: listData } = await adminClient.auth.admin.listUsers()
          const existing = listData?.users?.find(u => u.email?.toLowerCase() === email)
          if (existing) {
            await adminClient.auth.admin.updateUserById(existing.id, {
              password,
              email_confirm: true,
            })
          }
        }
      } catch (adminErr) {
        console.warn('[SignUpAPI] Service role auto-create note:', adminErr)
      }
    } else {
      // Normal signup with anon key
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            roll_number: rollNumber,
            role: isAdmin ? 'admin' : 'student',
          },
        },
      })

      if (signUpError && !signUpError.message.toLowerCase().includes('already registered')) {
        return NextResponse.json({ ok: false, error: signUpError.message }, { status: 400 })
      }
    }

    // Sign in immediately to establish session and cookies
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError || !signInData?.session) {
      if (signInError?.message?.toLowerCase().includes('email not confirmed')) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Email confirmation is currently enforced in your Supabase project settings. Please turn OFF "Confirm email" in Supabase Dashboard (Authentication -> Providers -> Email), or run the auto-confirm SQL command.',
          },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { ok: false, error: signInError?.message || 'Failed to establish session after account creation' },
        { status: 400 }
      )
    }

    const userId = signInData.user.id

    // Upsert profile row
    try {
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
    } catch (profErr) {
      console.warn('[SignUpAPI] Profile upsert note:', profErr)
    }

    const res = NextResponse.json({ ok: true, role: isAdmin ? 'admin' : 'student' })
    cookieStore.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
    return res
  } catch (err: any) {
    console.error('[SignUpAPI] Error:', err)
    return NextResponse.json({ ok: false, error: err.message || 'Internal signup error' }, { status: 500 })
  }
}
