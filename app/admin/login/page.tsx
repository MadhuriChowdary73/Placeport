'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !password) {
      setError('Please provide both administrator email and password.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      })
      const data = await res.json()

      if (!res.ok || !data.ok) {
        setError(data.error || 'Invalid administrator credentials')
        return
      }

      // Successful admin login
      window.location.href = '/admin/users'
    } catch (err: any) {
      setError(err.message || 'Authentication error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white border border-[#E8E2D9] rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-[#A41D35] shadow-xs">
            <img src="/amrita-logo.png" alt="Amrita Vishwa Vidyapeetham" className="h-12 w-auto object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Portal</h1>
            <p className="text-xs uppercase tracking-wider text-[#A41D35] font-bold mt-1">
              PlacePort Administration
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Authorized placement coordinator &amp; faculty access only
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Administrator Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gmail.com"
              disabled={loading}
              autoComplete="username"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A41D35] focus:border-transparent transition bg-gray-50/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A41D35] focus:border-transparent transition bg-gray-50/50"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-xs font-semibold rounded-xl p-3 border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#A41D35] hover:bg-[#8A152A] text-white font-bold py-3 px-4 rounded-xl transition disabled:opacity-60 text-sm shadow-xs flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating…' : 'Sign In as Administrator →'}
          </button>
        </form>

        <div className="text-center pt-2">
          <a href="/" className="text-xs text-gray-500 hover:text-[#A41D35] hover:underline font-medium">
            ← Back to Student Portal
          </a>
        </div>
      </div>
    </div>
  )
}
