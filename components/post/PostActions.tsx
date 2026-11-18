'use client'

import { useState } from 'react'
import { ThumbsUp, Bookmark, Flag } from 'lucide-react'
import { useVote, useSave } from '@/lib/hooks/useVote'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export function PostActions({ postId, voteCount, saveCount }: {
  postId: string
  voteCount: number
  saveCount: number
}) {
  const { voted, toggleVote, isPending: votePending } = useVote(postId)
  const { saved, toggleSave, isPending: savePending } = useSave(postId)
  const [reason, setReason] = useState('')
  const [reporting, setReporting] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  async function handleReport() {
    if (!reason.trim()) return
    setReporting(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, reason }),
      })
      if (res.ok) {
        setReportOpen(false)
        setReason('')
      }
    } finally {
      setReporting(false)
    }
  }

  return (
    <div className="flex items-center justify-between pt-4 border-t">
      <div className="flex items-center gap-4">
        <button
          onClick={() => toggleVote()}
          disabled={votePending}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition',
            voted
              ? 'bg-[#FDF2F4] text-[#A41D35] border border-[#F5D0D7] font-semibold'
              : 'bg-gray-100 text-gray-600 hover:bg-[#FDF2F4] hover:text-[#A41D35]'
          )}
        >
          <ThumbsUp className="w-4 h-4" fill={voted ? 'currentColor' : 'none'} />
          Helpful ({voteCount + (voted ? 1 : 0)})
        </button>

        <button
          onClick={() => toggleSave()}
          disabled={savePending}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition',
            saved
              ? 'bg-amber-100 text-amber-700'
              : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-600'
          )}
        >
          <Bookmark className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
          Save ({saveCount + (saved ? 1 : 0)})
        </button>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogTrigger
          className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition"
        >
          <Flag className="w-3.5 h-3.5" /> Report
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report this post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Textarea
              placeholder="Why are you reporting this post? (e.g., spam, confidential content, inappropriate)"
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReportOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReport}
                disabled={!reason.trim() || reporting}
              >
                {reporting ? 'Reporting…' : 'Submit report'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
