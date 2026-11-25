import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { checkAllowedGoogleAccount } from '@/lib/validation'
import type { Database } from '@/types/database'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/feed'

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.redirect(`${origin}/?error=configuration_missing`)
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

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user) {
      const user = data.user
      const email = (user.email || '').toLowerCase().trim()
      const check = checkAllowedGoogleAccount(email, process.env.ADMIN_EMAIL)

      if (!check.allowed) {
        await supabase.auth.signOut()
        const deniedResponse = NextResponse.redirect(`${origin}/?error=domain_not_allowed`)
        cookieStore.forEach(({ name, value, options }) => deniedResponse.cookies.set(name, value, options))
        req.cookies.getAll().forEach(({ name }) => {
          if (name.startsWith('sb-')) {
            deniedResponse.cookies.set(name, '', { maxAge: 0, path: '/' })
          }
        })
        return deniedResponse
      }

      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || null

      // Automatically sync/upsert profile
      try {
        await (supabase.from('profiles' as any) as any).upsert(
          {
            id: user.id,
            email,
            full_name: fullName,
            roll_number: check.rollNumber,
            branch: check.branch,
            batch: check.batchYear,
            role: check.isAdmin ? 'admin' : 'student',
            status: 'approved',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
      } catch (profErr) {
        console.warn('[OAuthCallback] Profile upsert notice:', profErr)
      }

      const response = NextResponse.redirect(`${origin}${next}`)
      cookieStore.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      return response
    }

    console.error('[OAuthCallback] Exchange code failed:', error?.message)
  }

  // Fallback to client-side page if hash fragment or redirect with parameters
  return NextResponse.redirect(`${origin}/auth/callback?${searchParams.toString()}`)
}
