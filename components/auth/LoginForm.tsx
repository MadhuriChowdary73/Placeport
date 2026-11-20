'use client'

import { useState, type FormEvent } from 'react'
import { auth } from '@/lib/auth'
import { validateRollNumber } from '@/lib/validation'

export function LoginForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [rollNumber, setRollNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const cleanRoll = rollNumber.trim().toLowerCase()

    if (!cleanRoll) {
      setError('Please enter your roll number')
      return
    }

    if (!password) {
      setError('Please enter your password')
      return
    }

    // Client-side validation check
    const validation = validateRollNumber(cleanRoll)
    if (!validation.valid || !validation.rollNumber) {
      setError(
        validation.error ||
          'Please enter a valid Amrita roll number (e.g. av.sc.u4cse24001)'
      )
      return
    }

    const normalizedRoll = validation.rollNumber

    // Sign Up validations
    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
    }

    setLoading(true)
    try {
      if (mode === 'signin') {
        const res = await auth.signIn(normalizedRoll, password)
        if (res.ok) {
          window.location.href = '/feed'
          return
        } else {
          setError(res.message || 'Incorrect roll number or password.')
        }
      } else {
        const res = await auth.signUp(normalizedRoll, password, confirmPassword)
        if (res.ok) {
          window.location.href = '/feed'
          return
        } else {
          setError(res.message || 'Sign-up failed')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error. Please try again.')
    } finally {
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

      {/* Tabs: Sign In / Create Account */}
      <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-2xl border border-gray-200 text-[14px] font-semibold">
        <button
          type="button"
          onClick={() => {
            setMode('signin')
            setError(null)
          }}
          className={`py-2 rounded-xl transition ${
            mode === 'signin'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signup')
            setError(null)
          }}
          className={`py-2 rounded-xl transition ${
            mode === 'signup'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Create Account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Roll Number field */}
        <div className="space-y-1.5">
          <label htmlFor="rollNumber" className="block text-[15px] font-semibold text-gray-700">
            Student Roll Number
          </label>
          <input
            id="rollNumber"
            type="text"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            placeholder="av.sc.u4cse24001"
            disabled={loading}
            autoComplete="username"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[16px] font-normal focus:outline-none focus:ring-2 focus:ring-[#A41D35] focus:border-transparent transition bg-gray-50/50 placeholder:text-gray-400 placeholder:font-light font-mono"
          />
          <p className="text-[12px] text-gray-500">
            Format: <code className="font-semibold text-gray-700">av.sc.u4&lt;branch&gt;&lt;yy&gt;&lt;nnn&gt;</code>
          </p>
        </div>

        {/* Password field */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-[15px] font-semibold text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[16px] font-normal focus:outline-none focus:ring-2 focus:ring-[#A41D35] focus:border-transparent transition bg-gray-50/50 placeholder:text-gray-400 placeholder:font-light"
          />
        </div>

        {/* Confirm password (signup only) */}
        {mode === 'signup' && (
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="block text-[15px] font-semibold text-gray-700">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              autoComplete="new-password"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[16px] font-normal focus:outline-none focus:ring-2 focus:ring-[#A41D35] focus:border-transparent transition bg-gray-50/50 placeholder:text-gray-400 placeholder:font-light"
            />
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 text-[14px] font-medium rounded-xl px-4 py-2.5 border border-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#A41D35] hover:bg-[#8A152A] text-white font-bold py-3 px-5 rounded-xl transition duration-150 shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 text-[16px] tracking-wide"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>{mode === 'signup' ? 'Verifying & Creating…' : 'Signing in…'}</span>
            </>
          ) : (
            mode === 'signup' ? 'Create Student Account →' : 'Sign In to PlacePort →'
          )}
        </button>
      </form>

      {/* Switch mode hint & Admin link */}
      <div className="space-y-3 pt-2 text-center text-[14px] text-gray-500 font-medium">
        <div>
          {mode === 'signin' ? (
            <p>
              First time here?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup')
                  setError(null)
                }}
                className="text-[#A41D35] hover:underline font-bold"
              >
                Create student account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  setError(null)
                }}
                className="text-[#A41D35] hover:underline font-bold"
              >
                Sign in
              </button>
            </p>
          )}
        </div>

        <div className="border-t border-gray-100 pt-3">
          <a
            href="/admin/login"
            className="text-[13px] text-gray-400 hover:text-[#A41D35] transition font-semibold"
          >
            Coordinator or Admin? Admin Portal Sign In →
          </a>
        </div>
      </div>
    </div>
  )
}
