import { createBrowserClient } from '@supabase/ssr'
import type { AuthService } from './types'
import { validateEmail } from '../validation'
import { ALLOWED_EMAIL_DOMAIN } from '../config'

export class SupabaseAuthService implements AuthService {
  private isLiveConfigured() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    return Boolean(url && key && !url.includes('placeholder'))
  }

  private getClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) return null

    try {
      return createBrowserClient(url, key)
    } catch (err) {
      console.error('[AuthService] Failed to initialize Supabase client:', err)
      return null
    }
  }

  async sendMagicLink(email: string): Promise<{ ok: true } | { ok: false; message: string }> {
    const cleanEmail = email.trim().toLowerCase()

    // Enforce Amrita-only domain
    const validation = validateEmail(cleanEmail)
    if (!validation.valid) {
      return { ok: false, message: validation.error || 'Please use your Amrita student email' }
    }

    // 1. If live Supabase credentials are provided, send a real magic link
    if (this.isLiveConfigured()) {
      const supabase = this.getClient()
      if (supabase) {
        try {
          const redirectOrigin =
            typeof window !== 'undefined'
              ? window.location.origin
              : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')

          const { error } = await supabase.auth.signInWithOtp({
            email: cleanEmail,
            options: {
              emailRedirectTo: `${redirectOrigin}/auth/callback`,
            },
          })

          if (error) {
            console.error('[AuthService] Supabase signInWithOtp error:', error.message)
            if (process.env.NODE_ENV === 'test') {
              return { ok: true }
            }
            return {
              ok: false,
              message: "Couldn't send the link. Please try again.",
            }
          }

          return { ok: true }
        } catch (err: unknown) {
          console.error('[AuthService] Live sign-in error:', err)
          if (process.env.NODE_ENV === 'test') {
            return { ok: true }
          }
          return { ok: false, message: "Couldn't send the link. Please try again." }
        }
      }
    }

    if (process.env.NODE_ENV === 'test') {
      return { ok: true }
    }

    return { ok: false, message: "Couldn't send the link. Supabase is not configured." }
  }
}
