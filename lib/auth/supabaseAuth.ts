import { createBrowserClient } from '@supabase/ssr'
import type { AuthService } from './types'

export class SupabaseAuthService implements AuthService {
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

  async signInWithGoogle(): Promise<{ error?: string }> {
    const supabase = this.getClient()
    if (!supabase) return { error: 'Supabase configuration is missing' }

    try {
      const redirectTo = `${window.location.origin}/api/auth/callback`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            hd: 'av.students.amrita.edu',
          },
        },
      })

      if (error) {
        return { error: error.message }
      }
      return {}
    } catch (err: any) {
      return { error: err.message || 'Google sign-in initiation failed' }
    }
  }

  async signIn(identifier: string, password?: string): Promise<{ ok: boolean; message?: string }> {
    return { ok: true }
  }

  async signUp(identifier: string, password?: string, confirmPassword?: string): Promise<{ ok: boolean; message?: string }> {
    return { ok: true }
  }

  async signOut(): Promise<void> {
    try {
      const supabase = this.getClient()
      if (supabase) {
        await supabase.auth.signOut()
      }
    } catch {}
    if (typeof window !== 'undefined') {
      window.location.href = '/api/auth/signout'
    }
  }

  async sendMagicLink(email: string): Promise<{ ok: true } | { ok: false; message: string }> {
    return { ok: true }
  }
}
