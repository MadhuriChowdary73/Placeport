'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import { relativeTime } from '@/lib/utils'

const NOTIF_ICONS: Record<string, string> = {
  badge: '🏅',
  vote_milestone: '🎉',
  report_resolved: '🛡️',
}

export default function NotificationsPage() {
  const qc = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const { mutate: markAllRead } = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error('Failed')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unread = notifications.filter((n: any) => !n.read_at)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">{unread.length} unread</p>
        </div>
        {unread.length > 0 && (
          <button
            onClick={() => markAllRead()}
            className="text-xs text-[#A41D35] hover:text-[#8A152A] flex items-center gap-1 font-medium"
          >
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border rounded-lg p-4 animate-pulse">
              <div className="h-4 w-48 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🔔</div>
          <p className="font-medium">No notifications yet</p>
          <p className="text-sm mt-1">You&apos;ll get notified when you earn badges or hit milestones.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <div
              key={n.id}
              className={`border rounded-lg p-4 flex items-start gap-3 transition ${
                n.read_at ? 'bg-white' : 'bg-[#FDF2F4] border-[#F5D0D7]'
              }`}
            >
              <span className="text-xl">{NOTIF_ICONS[n.type] ?? '📢'}</span>
              <div className="flex-1">
                <p className="text-sm text-gray-800">
                  {n.payload?.message ?? `New ${n.type} notification`}
                </p>
                <p className="text-xs text-gray-400 mt-1">{relativeTime(n.created_at)}</p>
              </div>
              {!n.read_at && (
                <div className="w-2 h-2 rounded-full bg-[#A41D35] mt-1.5 shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
