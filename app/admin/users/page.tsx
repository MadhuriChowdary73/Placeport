'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-black">Users</h1>
        <Input
          placeholder="Search by roll number, name, or handle…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm text-sm"
        />
      </div>

      {isLoading ? (
        <p className="text-gray-400">Loading…</p>
      ) : users.length === 0 ? (
        <p className="text-gray-400">No users found.</p>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2 font-semibold text-gray-500">Roll Number</th>
                <th className="text-left px-4 py-2 font-semibold text-gray-500">Handle</th>
                <th className="text-left px-4 py-2 font-semibold text-gray-500">Campus</th>
                <th className="text-left px-4 py-2 font-semibold text-gray-500">Branch</th>
                <th className="text-left px-4 py-2 font-semibold text-gray-500">Helped</th>
                <th className="text-left px-4 py-2 font-semibold text-gray-500">Role</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-xs">{u.roll_number}</td>
                  <td className="px-4 py-2.5">@{u.handle ?? '—'}</td>
                  <td className="px-4 py-2.5">{u.campus ?? '—'}</td>
                  <td className="px-4 py-2.5">{u.branch ?? '—'}</td>
                  <td className="px-4 py-2.5">{u.helped_count}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => toggleRole({
                        user_id: u.id,
                        role: u.role === 'admin' ? 'student' : 'admin'
                      })}
                      className="text-xs text-[#A41D35] hover:underline font-semibold"
                    >
                      {u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
