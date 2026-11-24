'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ThumbsUp, Bookmark, Building2, Calendar, MapPin, GitBranch, Eye, EyeOff, Trash2, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useVote, useSave } from '@/lib/hooks/useVote'
import { cn, formatCtc, relativeTime, OUTCOME_COLORS, OUTCOME_LABELS } from '@/lib/utils'
import type { Experience } from '@/lib/types'

interface ExperienceCardProps {
  post: Experience | any
  isAdmin?: boolean
}

export function ExperienceCard({ post, isAdmin = false }: ExperienceCardProps) {
  const router = useRouter()
  const { voted, toggleVote, isPending: votePending } = useVote(post.id)
  const { saved, toggleSave, isPending: savePending } = useSave(post.id)

  const [isPublished, setIsPublished] = useState<boolean>(post.is_published !== false)
  const [toggling, setToggling] = useState(false)
  const [deleted, setDeleted] = useState(false)

  // Task 2: Display identity: Roll No if chosen, Name if chosen. Older values fall back to Name.
  const displayMode = (post.display_mode || '').toLowerCase()
  const displayName = displayMode === 'roll'
    ? (post.author_roll_number || post.profiles?.roll_number || 'Amrita Student')
    : (post.author_name || post.profiles?.full_name || post.display_name || post.author_roll_number || post.profiles?.roll_number || 'Amrita Student')

  const summaryText = post.overall_experience || post.advice || ''

  async function handleToggleStatus(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    setToggling(true)
    try {
      const res = await fetch(`/api/admin/posts/${post.id}/toggle`, {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setIsPublished(data.is_published)
      }
    } catch (err) {
      console.error('Failed to toggle post visibility:', err)
    } finally {
      setToggling(false)
    }
  }

  async function handleDeletePost(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    if (!confirm('Are you sure you want to delete this experience?')) return

    try {
      const res = await fetch(`/api/admin/posts/${post.id}/delete`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDeleted(true)
      }
    } catch (err) {
      console.error('Failed to delete post:', err)
    }
  }

  function handleCardClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a')) {
      return
    }
    router.push(`/experiences/${post.id}`)
  }

  if (deleted) return null

  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        'hover:shadow-md hover:border-[#A41D35]/30 transition-all cursor-pointer group border-[#E8E2D9] bg-white p-1 relative',
        !isPublished && 'border-amber-300 bg-amber-50/20'
      )}
    >
      {/* Admin Moderation Bar (ONLY visible to Admin) */}
      {isAdmin && (
        <div className="bg-gray-100/90 border-b border-gray-200 px-4 py-2 flex items-center justify-between text-xs rounded-t-xl">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-700 uppercase tracking-wider">Admin Control:</span>
            {isPublished ? (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span> Live on Feed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600"></span> Hidden from Feed
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={toggling}
              className={cn(
                'px-2.5 py-1 rounded font-semibold flex items-center gap-1 transition',
                isPublished
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
              )}
            >
              {isPublished ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" /> Hide from Feed
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" /> Unhide from Feed
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDeletePost}
              className="p-1 rounded text-red-600 hover:bg-red-50 transition"
              title="Delete Experience"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Link
              href={`/company/${post.company_slug}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#A41D35] hover:underline tracking-tight"
            >
              <Building2 className="w-4 h-4" />
              {post.company_name}
            </Link>
            <h3 className="text-[19px] font-bold text-gray-900 group-hover:text-[#A41D35] transition leading-snug tracking-tight">
              {post.role}
            </h3>
          </div>
          <Badge className={cn('shrink-0 text-[13px] font-bold px-3 py-1 rounded-full tracking-wide', OUTCOME_COLORS[post.outcome])}>
            {OUTCOME_LABELS[post.outcome] || post.outcome}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3.5">
        {/* Meta row: year, location/campus, branch, package */}
        <div className="flex flex-wrap gap-3.5 text-[13px] text-gray-600">
          <span className="flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-gray-400" /> {post.year}
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-gray-400" /> {post.campus}
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <GitBranch className="w-3.5 h-3.5 text-gray-400" /> {post.branch}
          </span>
          {(post.ctc_min || post.ctc_max) && (
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 text-[13px]">
              {formatCtc(post.ctc_min, post.ctc_max)}
            </span>
          )}
        </div>

        {/* Round chips */}
        {post.rounds && post.rounds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.rounds.map((r: any, i: number) => {
              const name = r.round_types?.name || r.round_type_name || `Round ${i + 1}`
              return (
                <span
                  key={i}
                  className="text-[13px] bg-[#FAF9F6] border border-[#E8E2D9] text-gray-700 font-medium px-3 py-1 rounded-full tracking-wide"
                >
                  {name}
                </span>
              )
            })}
          </div>
        )}

        {/* Short summary truncated to about 2 lines */}
        {summaryText && (
          <p className="text-[15px] text-gray-700 border-l-3 border-[#A41D35] pl-3.5 py-1 line-clamp-2 bg-[#FDF2F4]/50 rounded-r font-normal leading-relaxed">
            {summaryText}
          </p>
        )}

        {/* Final-Year Project (Task 4: title with stars below, read-only; if empty show nothing) */}
        {(post.project_title || post.projectTitle) && (
          <div className="bg-[#FAF9F6] border border-[#E8E2D9] rounded-xl p-3 space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Final-Year Project
            </div>
            <div className="text-[14px] font-semibold text-gray-900 leading-snug">
              {post.project_title || post.projectTitle}
            </div>
            {Boolean(post.project_rating || post.projectRating) && (
              <div className="flex items-center gap-1 pt-0.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const rating = Number(post.project_rating || post.projectRating || 0)
                  return (
                    <Star
                      key={star}
                      className={cn(
                        'w-4 h-4',
                        star <= rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-200'
                      )}
                    />
                  )
                })}
                <span className="text-xs font-semibold text-amber-800 ml-1">
                  {post.project_rating || post.projectRating} / 5
                </span>
              </div>
            )}
          </div>
        )}

        {/* Footer: Author (roll number), date, helpful count, Save */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-[13px] text-gray-500 font-normal">
            by <span className="font-semibold text-gray-800">{displayName}</span>
            {' · '}
            {relativeTime(post.created_at)}
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                toggleVote()
              }}
              disabled={votePending}
              className={cn(
                'flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-lg transition tracking-wide',
                voted ? 'text-[#A41D35] bg-[#FDF2F4] border border-[#F5D0D7]' : 'text-gray-600 hover:text-[#A41D35] hover:bg-gray-100'
              )}
            >
              <ThumbsUp className="w-4 h-4" fill={voted ? 'currentColor' : 'none'} />
              <span>{post.vote_count ?? 0} helpful</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                toggleSave()
              }}
              disabled={savePending}
              className={cn(
                'flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-lg transition tracking-wide',
                saved ? 'text-amber-600 bg-amber-50 border border-amber-200' : 'text-gray-500 hover:text-amber-500'
              )}
            >
              <Bookmark className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
              <span>{saved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
