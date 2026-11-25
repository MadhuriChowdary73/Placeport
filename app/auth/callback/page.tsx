'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

export default function AuthCallbackPage() {
  const [status, setStatus] = useState('Verifying your Google authentication…')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function handleAuth() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!url || !key) {
        if (mounted) setError('Supabase environment variables are missing.')
        return
      }

      const supabase = createBrowserClient(url, key)

      try {
        // 1. Check URL search parameters (PKCE code)
        const searchParams = new URLSearchParams(window.location.search)
        const code = searchParams.get('code')
        const next = searchParams.get('next') || '/feed'

        if (code) {
          setStatus('Exchanging authentication code…')
          const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeErr) {
            console.error('[AuthCallback] Code exchange failed:', exchangeErr.message)
          }
        }

        // 2. Check URL hash parameters (#access_token=...&refresh_token=...)
        if (window.location.hash) {
          const hashString = window.location.hash.startsWith('#')
            ? window.location.hash.substring(1)
            : window.location.hash
          const hashParams = new URLSearchParams(hashString)
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          const errorDesc = hashParams.get('error_description')

          if (errorDesc) {
            if (mounted) setError(decodeURIComponent(errorDesc.replace(/\+/g, ' ')))
            return
          }

          if (accessToken && refreshToken) {
            setStatus('Establishing your secure session…')
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
          }
        }

        // 3. Confirm active user session
        setStatus('Setting up your profile…')
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user || (await supabase.auth.getUser()).data.user

        if (!user || !user.email) {
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (newSession?.user?.email) {
              authListener.subscription.unsubscribe()
              await processUser(newSession.user, next)
            }
          })

          setTimeout(() => {
            if (mounted && !user) {
              setError('Could not establish your Google session. Please try signing in again.')
            }
          }, 6000)
          return
        }

        await processUser(user, next)
      } catch (err: any) {
        console.error('[AuthCallback] Unexpected error:', err)
        if (mounted) setError(err.message || 'An error occurred during authentication.')
      }
    }

    async function processUser(user: any, nextUrl: string) {
      const email = (user.email || '').toLowerCase().trim()

      setStatus('Syncing profile…')

      try {
        const res = await fetch('/api/auth/sync-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, email }),
        })
        if (!res.ok) {
          const url = process.env.NEXT_PUBLIC_SUPABASE_URL
          const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          if (url && key) {
            await createBrowserClient(url, key).auth.signOut()
          }
          window.location.href = '/?error=domain_not_allowed'
          return
        }
      } catch (syncErr) {
        console.warn('[AuthCallback] Profile sync notice:', syncErr)
      }

      setStatus('Redirecting to placement feed…')
      window.location.href = nextUrl || '/feed'
    }

    handleAuth()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4">
      <div className="fixed top-0 left-0 right-0 bg-[#A41D35] h-[4px]" />

      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-[#E8E2D9] p-8 sm:p-10 text-center space-y-6">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#A41D35] shadow-xs">
          <img src="/amrita-logo.png" alt="Amrita Vishwa Vidyapeetham" className="h-12 w-auto object-contain" />
        </div>

        <div>
          <div className="text-[26px] font-bold text-[#A41D35] tracking-tight">PlacePort</div>
          <p className="text-[12px] uppercase tracking-[0.14em] text-[#D4AF37] font-bold mt-1">
            Amaravati Campus
          </p>
        </div>

        {error ? (
          <div className="space-y-4 pt-2">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 text-2xl">
              ✕
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900">Sign In Issue</h2>
              <p className="text-[14px] text-gray-600 leading-relaxed font-normal">
                {error}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/"
                className="w-full bg-[#A41D35] hover:bg-[#8A152A] text-white text-[15px] font-bold py-3 px-5 rounded-xl transition text-center block shadow-sm"
              >
                Back to Sign In →
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full border-4 border-[#FDF2F4] border-t-[#A41D35] animate-spin" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-[20px] font-bold text-gray-900 tracking-tight">
                Authenticating
              </h2>
              <p className="text-[14px] text-gray-600 leading-relaxed font-normal">
                {status}
              </p>
            </div>

            <div className="bg-[#FAF9F6] border border-[#E8E2D9] rounded-2xl p-3.5 text-[13px] text-gray-500 font-medium">
              Amrita Vishwa Vidyapeetham • Placement Experience Portal
            </div>
          </div>
        )}
      </div>

      <footer className="mt-8 text-center text-[13px] text-gray-400">
        Amaravati Campus • श्रद्धावान् लभते ज्ञानम्
      </footer>
    </div>
  )
}
