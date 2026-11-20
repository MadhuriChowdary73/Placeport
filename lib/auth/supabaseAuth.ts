import { createBrowserClient } from '@supabase/ssr'
import type { AuthService } from './types'

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

  async signIn(identifier: string, password: string): Promise<{ ok: true; role?: string } | { ok: false; message: string }> {
    const clean = identifier.trim().toLowerCase()
    if (!clean || !password) {
      return { ok: false, message: 'Incorrect roll number or password.' }
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: clean, password }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        return { ok: false, message: data.error || 'Incorrect roll number or password.' }
      }
      return { ok: true, role: data.role }
    } catch (err: any) {
      console.error('[AuthService] Sign-in error:', err)
      return { ok: false, message: 'Incorrect roll number or password.' }
    }
  }

  async signUp(identifier: string, password: string, confirmPassword?: string): Promise<{ ok: true; role?: string } | { ok: false; message: string }> {
    const clean = identifier.trim().toLowerCase()
    if (!clean) {
      return { ok: false, message: 'Roll number is required' }
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: clean, password, confirmPassword }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        return { ok: false, message: data.error || 'Sign-up failed' }
      }
      return { ok: true, role: data.role }
    } catch (err: any) {
      console.error('[AuthService] Sign-up error:', err)
      return { ok: false, message: err.message || 'Sign-up failed. Please try again.' }
    }
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
    // Magic link is disabled for student roll number auth
    return { ok: true }
  }
}
