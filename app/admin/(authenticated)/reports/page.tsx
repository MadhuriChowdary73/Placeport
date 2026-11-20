'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function AdminReportsPage() {
  const [status, setStatus] = useState<'pending' | 'resolved' | 'dismissed'>('pending')
  const qc = useQueryClient()

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin-reports', status],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reports?status=${status}`)
      if (!res.ok) throw new Error('Failed to load')
      return res.json()
    },
  })

  const { mutate: resolve } = useMutation({
    mutationFn: async ({ report_id, action, delete_post }: any) => {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id, action, delete_post }),
      })
      if (!res.ok) throw new Error('Failed to update')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reports'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-black">Reports</h1>
        <div className="flex gap-2">
          {(['pending', 'resolved', 'dismissed'] as const).map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition ${status === s ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-400">Loading…</p>
      ) : reports.length === 0 ? (
        <p className="text-gray-400">No {status} reports.</p>
      ) : (
        <div className="space-y-4">
          {reports.map((r: any) => (
            <div key={r.id} className="bg-white border rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    Post: {r.posts?.companies?.name} — {r.posts?.role}
                  </p>
                  <p className="text-sm text-gray-500">
                    Reporter: {r.profiles?.roll_number ?? 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-700 mt-1 italic">"{r.reason}"</p>
                </div>
                {r.status === 'pending' && (
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => resolve({ report_id: r.id, action: 'dismissed' })}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => resolve({ report_id: r.id, action: 'resolved', delete_post: true })}
                      className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg font-semibold"
                    >
                      Delete post
                    </button>
                  </div>
                )}
              </div>
              <a href={`/experiences/${r.post_id}`} target="_blank"
                className="text-xs text-[#A41D35] hover:underline font-semibold">
                View post ↗
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
