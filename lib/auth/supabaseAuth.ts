import { createBrowserClient } from '@supabase/ssr'
import type { AuthService } from './types'
import { validateEmail } from '../validation'

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

  async signIn(email: string, password: string): Promise<{ ok: true; role?: string } | { ok: false; message: string }> {
    const cleanEmail = email.trim().toLowerCase()
    const validation = validateEmail(cleanEmail)
    if (!validation.valid) {
      return { ok: false, message: validation.error || 'Please use your Amrita student email' }
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        return { ok: false, message: data.error || 'Invalid credentials' }
      }
      return { ok: true, role: data.role }
    } catch (err: any) {
      console.error('[AuthService] Sign-in error:', err)
      return { ok: false, message: err.message || 'Login failed. Please try again.' }
    }
  }

  async signUp(email: string, password: string): Promise<{ ok: true; role?: string } | { ok: false; message: string }> {
    const cleanEmail = email.trim().toLowerCase()
    const validation = validateEmail(cleanEmail)
    if (!validation.valid) {
      return { ok: false, message: validation.error || 'Please use your Amrita student email' }
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
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
    const cleanEmail = email.trim().toLowerCase()
    const validation = validateEmail(cleanEmail)
    if (!validation.valid) {
      return { ok: false, message: validation.error || 'Please use your Amrita student email' }
    }
    return { ok: true }
  }
}
