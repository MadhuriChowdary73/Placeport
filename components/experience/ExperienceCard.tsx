'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ThumbsUp, Bookmark, Building2, Calendar, MapPin, GitBranch } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useVote, useSave } from '@/lib/hooks/useVote'
import { cn, formatCtc, relativeTime, OUTCOME_COLORS, OUTCOME_LABELS } from '@/lib/utils'
import type { Experience } from '@/lib/types'

interface ExperienceCardProps {
  post: Experience | any
}

export function ExperienceCard({ post }: ExperienceCardProps) {
  const router = useRouter()
  const { voted, toggleVote, isPending: votePending } = useVote(post.id)
  const { saved, toggleSave, isPending: savePending } = useSave(post.id)

  const displayName = post.author_roll_number || post.display_name || 'Amrita Student'
  const summaryText = post.overall_experience || post.advice || ''

  function handleCardClick(e: React.MouseEvent) {
    // If the click was on an interactive element (button, link), let it handle its own event
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a')) {
      return
    }
    router.push(`/experiences/${post.id}`)
  }

  return (
    <Card
      onClick={handleCardClick}
      className="hover:shadow-md hover:border-[#A41D35]/30 transition-all cursor-pointer group border-[#E8E2D9] bg-white p-1"
    >
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
