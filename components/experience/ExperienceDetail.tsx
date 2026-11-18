'use client'

import Link from 'next/link'
import { RoundTimeline } from '@/components/post/RoundTimeline'
import { PostActions } from '@/components/post/PostActions'
import { Badge } from '@/components/ui/badge'
import { formatCtc, relativeTime, OUTCOME_COLORS, OUTCOME_LABELS } from '@/lib/utils'
import { Building2, Calendar, MapPin, GitBranch, ArrowLeft, ExternalLink } from 'lucide-react'
import type { Experience } from '@/lib/types'

interface ExperienceDetailProps {
  experience: Experience | any
}

export function ExperienceDetail({ experience: p }: ExperienceDetailProps) {
  const displayName = p.author_roll_number || p.display_name || 'Amrita Student'

  const rounds = (p.rounds || []).map((r: any) => ({
    ...r,
    round_types: r.round_types || { name: r.round_type_name || 'Interview Round' },
  }))

  const dos = (p.dos_donts || []).filter((d: any) => d.type === 'do')
  const donts = (p.dos_donts || []).filter((d: any) => d.type === 'dont')
  const resources = p.resources || []

  return (
    <article className="max-w-3xl mx-auto space-y-8">
      {/* Back button to feed */}
      <div>
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 text-[15px] font-semibold text-gray-600 hover:text-[#A41D35] transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to feed
        </Link>
      </div>

      {/* Header: Company, Role, Outcome, Year, Location/Campus, Branch, Package, Author (roll number), Date */}
      <div className="space-y-4 bg-white border border-[#E8E2D9] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <Link
              href={`/company/${p.company_slug}`}
              className="text-[#A41D35] font-bold text-lg hover:underline inline-flex items-center gap-2"
            >
              <Building2 className="w-5 h-5" />
              {p.company_name}
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{p.role}</h1>
          </div>
          <Badge className={`text-sm px-3.5 py-1 rounded-full font-bold ${OUTCOME_COLORS[p.outcome]}`}>
            {OUTCOME_LABELS[p.outcome] || p.outcome}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-4 text-base text-gray-600 font-medium">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-gray-400" />
            {p.year}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-gray-400" />
            {p.campus}
          </span>
          <span className="flex items-center gap-1.5">
            <GitBranch className="w-4 h-4 text-gray-400" />
            {p.branch}
          </span>
          {(p.ctc_min || p.ctc_max) && (
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
              {formatCtc(p.ctc_min, p.ctc_max)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-sm">
          <span className="text-gray-500 font-normal">
            Shared by verified student <strong className="text-gray-800 font-semibold">{displayName}</strong>
            {' · '}
            {relativeTime(p.created_at)}
          </span>
        </div>
      </div>

      {/* Full overview or summary text */}
      {p.overall_experience && (
        <section className="bg-white border border-[#E8E2D9] rounded-3xl p-6 sm:p-8 space-y-3 shadow-xs">
          <h2 className="text-xl font-bold text-gray-900">Overall Experience &amp; Overview</h2>
          <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line font-normal">
            {p.overall_experience}
          </p>
        </section>
      )}

      {/* Preparation tips (if provided) */}
      {p.preparation_tips && (
        <section className="bg-white border border-[#E8E2D9] rounded-3xl p-6 sm:p-8 space-y-3 shadow-xs">
          <h2 className="text-xl font-bold text-gray-900">Preparation Strategy &amp; Tips</h2>
          <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line font-normal">
            {p.preparation_tips}
          </p>
        </section>
      )}

      {/* Every round in the order the contributor arranged, each with its own title and full details */}
      {rounds.length > 0 && (
        <section className="bg-white border border-[#E8E2D9] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
          <h2 className="text-xl font-bold text-gray-900">Interview Rounds &amp; Timeline</h2>
          <RoundTimeline rounds={rounds} />
        </section>
      )}

      {/* Do's and Don'ts lists */}
      {(dos.length > 0 || donts.length > 0) && (
        <section className="bg-white border border-[#E8E2D9] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
          <h2 className="text-xl font-bold text-gray-900">Do&apos;s &amp; Don&apos;ts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dos.length > 0 && (
              <div className="bg-green-50/80 border border-green-200 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-green-900 text-base flex items-center gap-1.5">
                  <span>✓</span> DO
                </h3>
                <ul className="space-y-2">
                  {dos.map((d: any, i: number) => (
                    <li key={d.id ?? i} className="text-base text-green-900 flex gap-2 font-normal">
                      <span className="text-green-600 font-bold shrink-0">•</span>
                      <span>{d.content ?? d.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {donts.length > 0 && (
              <div className="bg-red-50/80 border border-red-200 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-red-900 text-base flex items-center gap-1.5">
                  <span>✕</span> DON&apos;T
                </h3>
                <ul className="space-y-2">
                  {donts.map((d: any, i: number) => (
                    <li key={d.id ?? i} className="text-base text-red-900 flex gap-2 font-normal">
                      <span className="text-red-500 font-bold shrink-0">•</span>
                      <span>{d.content ?? d.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Helpful resources as clickable links */}
      {resources.length > 0 && (
        <section className="bg-white border border-[#E8E2D9] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
          <h2 className="text-xl font-bold text-gray-900">Helpful Resources</h2>
          <div className="space-y-2.5">
            {resources.map((r: any) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 items-start p-4 border border-[#E8E2D9] rounded-2xl hover:bg-[#FDF2F4]/30 hover:border-[#F5D0D7] transition group"
              >
                <ExternalLink className="w-5 h-5 text-[#A41D35] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-base font-semibold text-[#A41D35] group-hover:underline break-all">
                    {r.url}
                  </p>
                  {r.note && <p className="text-sm text-gray-600">{r.note}</p>}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* One-line advice if provided */}
      {p.advice && (
        <section className="bg-[#FDF2F4] border border-[#F5D0D7] rounded-3xl p-6 sm:p-8">
          <p className="text-xs font-bold text-[#A41D35] uppercase tracking-wider mb-2">
            If I were you, I&apos;d…
          </p>
          <p className="text-lg text-gray-800 italic leading-relaxed font-normal">
            &ldquo;{p.advice}&rdquo;
          </p>
        </section>
      )}

      {/* Helpful count and Save button actions */}
      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs">
        <PostActions postId={p.id} voteCount={p.vote_count ?? 0} saveCount={p.save_count ?? 0} />
      </div>
    </article>
  )
}
