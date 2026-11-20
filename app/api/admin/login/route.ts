import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { ADMIN_EMAIL } from '@/lib/config'
import { checkRateLimit } from '@/lib/rateLimit'
import type { Database } from '@/types/database'

export async function POST(req: NextRequest) {
  try {
    const rateLimit = checkRateLimit(req, 'admin-login', { limit: 8, windowMs: 60 * 1000 })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: 'Too many login attempts. Please wait a minute and try again.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const email = (body?.email || '').trim().toLowerCase()
    const password = body?.password || ''

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Email and password are required' }, { status: 400 })
    }

    // Only allow designated admin email
    if (email !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ ok: false, error: 'Invalid admin credentials' }, { status: 401 })
    }

    if (password !== 'Madhuri_73') {
      return NextResponse.json({ ok: false, error: 'Invalid admin credentials' }, { status: 401 })
    }

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

    // Attempt sign-in with Supabase Auth
    let { data, error } = await supabase.auth.signInWithPassword({ email, password })

    // Auto-create/confirm admin user if not present
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
          console.warn('[AdminLoginAPI] Service role create note:', createErr)
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
      return NextResponse.json({ ok: false, error: error?.message || 'Admin authentication failed' }, { status: 401 })
    }

    const user = data.user

    // Ensure profiles.role is 'admin'
    try {
      await (supabase.from('profiles' as any) as any).upsert(
        {
          id: user.id,
          roll_number: 'ADMIN',
          branch: 'ADMIN',
          batch: 2024,
          role: 'admin',
          status: 'approved',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
    } catch (profErr) {
      console.warn('[AdminLoginAPI] Profile note:', profErr)
    }

    const res = NextResponse.json({ ok: true, role: 'admin', email: ADMIN_EMAIL })
    cookieStore.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
    return res
  } catch (err: any) {
    console.error('[AdminLoginAPI] Unhandled error:', err)
    return NextResponse.json({ ok: false, error: err.message || 'Internal server error' }, { status: 500 })
  }
}
