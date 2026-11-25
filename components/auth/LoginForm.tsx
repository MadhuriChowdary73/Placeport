'use client'

import { useState } from 'react'
import { auth } from '@/lib/auth'

export function LoginForm({ initialError = null }: { initialError?: string | null }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError)

  async function handleGoogleSignIn() {
    setError(null)
    setLoading(true)
    try {
      const res = await auth.signInWithGoogle()
      if (res?.error) {
        setError(res.error)
        setLoading(false)
      }
      // On success, Supabase will redirect the browser to Google
    } catch (err: any) {
      setError(err.message || 'Failed to initiate Google sign in. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-[#E8E2D9] p-8 sm:p-10 max-w-md w-full space-y-6">
      {/* Amrita Emblem & Title */}
      <div className="text-center space-y-3.5">
        <div className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-[#A41D35] shadow-xs">
          <img src="/amrita-logo.png" alt="Amrita Vishwa Vidyapeetham" className="h-14 w-auto object-contain" />
        </div>
        <div>
          <div className="text-[32px] font-bold text-[#A41D35] tracking-tight leading-none">PlacePort</div>
          <p className="text-[12px] uppercase tracking-[0.14em] text-[#D4AF37] font-bold mt-1.5">
            Amrita Vishwa Vidyapeetham
          </p>
          <div className="inline-block mt-1 bg-[#FDF2F4] text-[#A41D35] text-[12px] font-bold px-2.5 py-0.5 rounded-full border border-[#F5D0D7]">
            Amaravati Campus
          </div>
          <p className="text-[15px] text-gray-600 mt-2 font-normal leading-relaxed">
            Placement interview experiences &amp; preparation
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-[14px] font-medium rounded-xl px-4 py-3 border border-red-200">
          {error}
        </div>
      )}

      {/* Google Sign In Action */}
      <div className="space-y-4 pt-2">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3.5 px-5 rounded-2xl border border-gray-300 hover:border-gray-400 shadow-sm transition duration-150 text-[15px] disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Connecting to Google…</span>
            </>
          ) : (
            <>
              {/* Official Google G Logo */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <p className="text-center text-[13px] text-gray-500 leading-relaxed font-normal pt-1">
          Students and coordinators sign in using their Google account.
        </p>
      </div>

      <div className="pt-2 border-t border-gray-100 text-center">
        <span className="text-[12px] text-gray-400">
          Amrita Vishwa Vidyapeetham • Amaravati Campus Placement Portal
        </span>
      </div>
    </div>
  )
}
