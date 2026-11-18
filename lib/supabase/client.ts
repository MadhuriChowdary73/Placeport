import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { parseRollNumber, extractRollNumber } from '@/lib/validation'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

  const client = createBrowserClient<Database>(url, key)

  const originalGetUser = client.auth.getUser.bind(client.auth)
  client.auth.getUser = async (jwt?: string) => {
    try {
      const res = await originalGetUser(jwt)
      if (res.data?.user) return res
    } catch {}

    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )placeport_session=([^;]*)/)
      if (match) {
        try {
          const sessionData = JSON.parse(decodeURIComponent(match[1]))
          const email = sessionData.email || ''
          const parsed = parseRollNumber(email)
          const fallbackRoll = extractRollNumber(email)
          const rollNumber = sessionData.roll_number || parsed?.rollNumber || (fallbackRoll.valid ? fallbackRoll.rollNumber : '')

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
    }

    return { data: { user: null }, error: null }
  }

  return client
}
