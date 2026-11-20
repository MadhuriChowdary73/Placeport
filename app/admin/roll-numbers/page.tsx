'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function AdminRollNumbersPage() {
  const [search, setSearch] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [branch, setBranch] = useState('')
  const [batch, setBatch] = useState('24')
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const qc = useQueryClient()

  // Fetch approved roll numbers list
  const { data, isLoading } = useQuery({
    queryKey: ['admin-roll-numbers', search],
    queryFn: async () => {
      const params = search ? `?q=${encodeURIComponent(search)}` : ''
      const res = await fetch(`/api/admin/roll-numbers${params}`)
      if (!res.ok) throw new Error('Failed to load roll numbers')
      return res.json()
    },
  })

  // Bulk add mutation
  const { mutate: addBulk, isPending: adding } = useMutation({
    mutationFn: async () => {
      setStatusMsg(null)
      const res = await fetch('/api/admin/roll-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: bulkText,
          branch: branch || undefined,
          batch: batch || undefined,
        }),
      })
      const result = await res.json()
      if (!res.ok || !result.ok) throw new Error(result.error || 'Failed to add roll numbers')
      return result
    },
    onSuccess: (result) => {
      setStatusMsg({ type: 'success', text: `Successfully approved ${result.added} roll numbers!` })
      setBulkText('')
      qc.invalidateQueries({ queryKey: ['admin-roll-numbers'] })
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err.message || 'Error adding roll numbers' })
    },
  })

  // Delete mutation
  const { mutate: removeRoll } = useMutation({
    mutationFn: async (roll: string) => {
      const res = await fetch(`/api/admin/roll-numbers?roll=${encodeURIComponent(roll)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-roll-numbers'] }),
  })

  const rollNumbers = data?.items || []
  const total = data?.total ?? rollNumbers.length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Approved Student Roster</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage the list of Amrita Amaravati student roll numbers eligible to sign up for PlacePort.
          Students whose roll numbers are not in this list will be prevented from registering.
        </p>
      </div>

      {/* Bulk Upload / Paste Form */}
      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-[#A41D35] flex items-center gap-2">
          <span>📋</span> Bulk Paste / Upload Roll Numbers
        </h2>
        <p className="text-xs text-gray-500">
          Paste one or more roll numbers separated by newlines, commas, or spaces (e.g.{' '}
          <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">av.sc.u4cse24001, av.sc.u4cse24002</code>).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Default Branch (optional)</label>
            <Input
              placeholder="e.g. CSE, AIE, ECE"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Default Batch Year (optional)</label>
            <Input
              placeholder="e.g. 24"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        <Textarea
          rows={4}
          placeholder="av.sc.u4cse24001&#10;av.sc.u4cse24002&#10;av.sc.u4aie24001"
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          className="font-mono text-xs resize-none"
        />

        {statusMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        <button
          type="button"
          onClick={() => addBulk()}
          disabled={adding || !bulkText.trim()}
          className="bg-[#A41D35] hover:bg-[#8A152A] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-50 shadow-xs"
        >
          {adding ? 'Adding Roll Numbers…' : '+ Approve & Whitelist Roll Numbers'}
        </button>
      </div>

      {/* Roster Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Eligible Roll Numbers ({total})</h2>
          </div>
          <Input
            placeholder="Search roll numbers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs text-sm"
          />
        </div>

        {isLoading ? (
          <div className="text-sm text-gray-400 py-8 text-center animate-pulse">Loading roster…</div>
        ) : rollNumbers.length === 0 ? (
          <div className="text-center py-10 bg-white border border-gray-200 rounded-2xl text-gray-400">
            <p className="text-sm">No roll numbers found matching your query.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#E8E2D9] rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Roll Number</th>
                  <th className="px-5 py-3">Branch</th>
                  <th className="px-5 py-3">Batch</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rollNumbers.map((r: any) => (
                  <tr key={r.roll_number} className="hover:bg-gray-50/70 transition">
                    <td className="px-5 py-3 font-mono font-medium text-gray-800 text-xs">
                      {r.roll_number}
                    </td>
                    <td className="px-5 py-3 text-gray-600 font-semibold">{r.branch || '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{r.batch ? `20${r.batch}` : '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove ${r.roll_number} from the approved whitelist?`)) {
                            removeRoll(r.roll_number)
                          }
                        }}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
