'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [resetModalUser, setResetModalUser] = useState<any | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetSuccess, setResetSuccess] = useState<string | null>(null)
  const [resetError, setResetError] = useState<string | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const qc = useQueryClient()

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      const params = search ? `?q=${encodeURIComponent(search)}` : ''
      const res = await fetch(`/api/admin/users${params}`)
      if (!res.ok) throw new Error('Failed to load')
      return res.json()
    },
  })

  const { mutate: toggleRole } = useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: string }) => {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, role }),
      })
      if (!res.ok) throw new Error('Failed to update')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault()
    if (!resetModalUser) return
    setResetError(null)
    setResetSuccess(null)

    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters')
      return
    }

    setIsResetting(true)
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: resetModalUser.id,
          roll_number: resetModalUser.roll_number,
          new_password: newPassword,
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.ok) {
        setResetError(data.error || 'Failed to reset password')
        return
      }

      setResetSuccess(`Password updated successfully for ${resetModalUser.roll_number || 'user'}!`)
      setNewPassword('')
      setTimeout(() => {
        setResetModalUser(null)
        setResetSuccess(null)
      }, 1500)
    } catch (err: any) {
      setResetError(err.message || 'Error executing password reset')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Registered Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage student accounts, roles, and password resets.</p>
        </div>
        <Input
          placeholder="Search by roll number, name, or handle…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm text-sm"
        />
      </div>

      {isLoading ? (
        <p className="text-gray-400 py-6 text-center animate-pulse">Loading users…</p>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 text-gray-400">
          No users found.
        </div>
      ) : (
        <div className="bg-white border border-[#E8E2D9] rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase">Roll Number</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase">Handle</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase">Branch</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase">Role</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50/70 transition">
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-gray-800">
                    {u.roll_number || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">@{u.handle ?? '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600 font-medium">{u.branch ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                      {u.status || 'approved'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        u.role === 'admin'
                          ? 'bg-red-100 text-[#A41D35]'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setResetModalUser(u)
                        setNewPassword('')
                        setResetError(null)
                        setResetSuccess(null)
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                    >
                      Reset Password
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        toggleRole({
                          user_id: u.id,
                          role: u.role === 'admin' ? 'student' : 'admin',
                        })
                      }
                      className="text-xs text-[#A41D35] hover:text-[#8A152A] hover:underline font-semibold"
                    >
                      {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Reset Student Password</h3>
            <p className="text-xs text-gray-500">
              Set a new password for roll number{' '}
              <strong className="font-mono text-gray-800">{resetModalUser.roll_number}</strong>.
            </p>

            <form onSubmit={handlePasswordReset} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A41D35]"
                  disabled={isResetting}
                />
              </div>

              {resetError && (
                <div className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                  {resetError}
                </div>
              )}

              {resetSuccess && (
                <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  {resetSuccess}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  disabled={isResetting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting || !newPassword}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#A41D35] hover:bg-[#8A152A] text-white transition disabled:opacity-50"
                >
                  {isResetting ? 'Saving…' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
