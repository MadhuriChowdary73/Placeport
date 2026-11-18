'use client'

import { useState, type FormEvent } from 'react'
import { auth } from '@/lib/auth'
import { validateEmail, extractRollNumber } from '@/lib/validation'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const validation = validateEmail(email)
    if (!validation.valid) {
      setError(validation.error || 'Please enter a valid email')
      return
    }

    // Verify we can extract a roll number from the email
    const rollResult = extractRollNumber(email)
    if (!rollResult.valid) {
      setError(rollResult.error)
      return
    }

    setLoading(true)
    try {
      const result = await auth.sendMagicLink(email)
      if (result.ok) {
        setSent(true)
      } else {
        setError(result.message)
      }
    } catch {
      setError("Couldn't send the link. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-[#E8E2D9] p-8 sm:p-10 max-w-md w-full text-center space-y-5">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-[#FDF2F4] border border-[#F5D0D7] flex items-center justify-center text-[32px]">
          📬
        </div>
        <h2 className="text-[25px] font-bold text-gray-900 tracking-tight">Check your email</h2>
        <p className="text-gray-600 text-[15px] leading-relaxed font-normal">
          We sent a magic link to <strong className="text-gray-900 font-semibold">{email}</strong>. Click it to sign in.
        </p>
        <p className="text-[13px] text-gray-400 font-normal">The link expires in 1 hour.</p>
        
        <div className="bg-[#FAF9F6] border border-[#E8E2D9] rounded-2xl p-4 text-[14px] text-gray-600 text-left space-y-1">
          <p className="font-semibold text-gray-800 flex items-center gap-1.5">
            <span>🔒</span> Verification Required
          </p>
          <p className="text-[13px] text-gray-600 leading-normal">
            Click the secure link in your Amrita inbox to verify your student email and access PlacePort.
          </p>
        </div>
        
        <div className="pt-1 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              setSent(false)
              setError(null)
            }}
            className="w-full bg-[#FDF2F4] hover:bg-[#FBE5E9] text-[#A41D35] text-[14px] font-semibold py-2.5 px-4 rounded-xl border border-[#F5D0D7] transition"
          >
            Use a different email
          </button>
        </div>
      </div>
    )
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-[15px] font-semibold text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@av.students.amrita.edu"
            disabled={loading}
            autoComplete="email"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[16px] font-normal focus:outline-none focus:ring-2 focus:ring-[#A41D35] focus:border-transparent transition bg-gray-50/50 placeholder:text-gray-400 placeholder:font-light"
          />
        </div>

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
              <span>Sending link...</span>
            </>
          ) : (
            'Send magic link'
          )}
        </button>
      </form>
    </div>
  )
}
