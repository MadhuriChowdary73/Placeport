import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
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

    // Only allow designated admin email configured server-side
    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
    if (!adminEmail || email !== adminEmail) {
      return NextResponse.json({ ok: false, error: 'Invalid admin credentials' }, { status: 401 })
    }

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

    // Authenticate with real Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data?.user) {
      return NextResponse.json({ ok: false, error: 'Invalid admin credentials' }, { status: 401 })
    }

    // Confirm the profile row has role = 'admin'
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle()

    if (profileError || (profile as any)?.role !== 'admin') {
      await supabase.auth.signOut()
      const res = NextResponse.json({ ok: false, error: 'Invalid admin credentials' }, { status: 401 })
      cookieStore.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      return res
    }

    const res = NextResponse.json({ ok: true, role: 'admin', email: adminEmail })
    cookieStore.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
    return res
  } catch (err: any) {
    console.error('[AdminLoginAPI] Unhandled error:', err)
    return NextResponse.json({ ok: false, error: err.message || 'Internal server error' }, { status: 500 })
  }
}
