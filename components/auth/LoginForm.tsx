'use client'

import { useState, type FormEvent } from 'react'
import { auth } from '@/lib/auth'
import { validateEmail, extractRollNumber } from '@/lib/validation'
import { ADMIN_EMAIL } from '@/lib/config'

export function LoginForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail) {
      setError('Please enter your email')
      return
    }

    if (!password) {
      setError('Please enter your password')
      return
    }

    const validation = validateEmail(cleanEmail)
    if (!validation.valid) {
      setError(validation.error || 'Please enter a valid email')
      return
    }

    const isAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase()

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

      if (!isAdmin) {
        const rollResult = extractRollNumber(cleanEmail)
        if (!rollResult.valid) {
          setError(rollResult.error)
          return
        }
      }
    }

    setLoading(true)
    try {
      if (mode === 'signin') {
        const res = await auth.signIn(cleanEmail, password)
        if (res.ok) {
          // Direct redirect on successful login
          window.location.href = '/feed'
          return
        } else {
          setError(res.message)
        }
      } else {
        const res = await auth.signUp(cleanEmail, password)
        if (res.ok) {
          // Auto signed in upon creation
          window.location.href = '/feed'
          return
        } else {
          setError(res.message)
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
        {/* Email field */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-[15px] font-semibold text-gray-700">
            {mode === 'signup' ? 'College Email' : 'Email Address'}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="xxxx@av.students.amrita.edu"
            disabled={loading}
            autoComplete="email"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[16px] font-normal focus:outline-none focus:ring-2 focus:ring-[#A41D35] focus:border-transparent transition bg-gray-50/50 placeholder:text-gray-400 placeholder:font-light"
          />
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
              <span>{mode === 'signup' ? 'Creating account…' : 'Signing in…'}</span>
            </>
          ) : (
            mode === 'signup' ? 'Create Account →' : 'Sign In to PlacePort →'
          )}
        </button>
      </form>

      {/* Switch mode hint */}
      <div className="text-center pt-2 text-[14px] text-gray-500 font-medium">
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
    </div>
  )
}
