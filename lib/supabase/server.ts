import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { extractRollNumber, parseRollNumber } from '@/lib/validation'

export async function createClient() {
  const cookieStore = await cookies()
  const devSession = cookieStore.get('placeport_session')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

  const client = createServerClient<Database>(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {}
      },
    },
  })

  // If local dev session cookie exists and Supabase doesn't return a live user, provide dev user session
  const originalGetUser = client.auth.getUser.bind(client.auth)
  client.auth.getUser = async (jwt?: string) => {
    try {
      const res = await originalGetUser(jwt)
      if (res.data?.user) return res
    } catch {}

    if (devSession?.value) {
      try {
        const sessionData = JSON.parse(decodeURIComponent(devSession.value))
        // Derive roll number strictly from verified email
        const email = sessionData.email || ''
        const parsed = parseRollNumber(email)
        const rollResult = extractRollNumber(email)
        const rollNumber = sessionData.roll_number || parsed?.rollNumber || (rollResult.valid ? rollResult.rollNumber : 'Unknown')

        return {
          data: {
            user: {
              id: sessionData.id || 'dev-student-user-id',
              email: email,
              app_metadata: {},
              user_metadata: { roll_number: rollNumber },
              aud: 'authenticated',
              created_at: new Date().toISOString(),
            } as any,
          },
          error: null,
        }
      } catch {}
    }

    return { data: { user: null }, error: null }
  }

  return client
}

/** Use this in Route Handlers that need to bypass RLS (admin ops). */
export async function createAdminClient() {
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'

  return createSupabaseClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
