'use client'

import { use, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PostCard } from '@/components/post/PostCard'

interface CompanyPageProps {
  params: Promise<{ slug: string }>
}

function CompanyContent({ params }: CompanyPageProps) {
  const { slug } = use(params)

  const { data, isLoading, error } = useQuery({
    queryKey: ['company-summary', slug],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${slug}/summary`)
      if (!res.ok) throw new Error('Company not found')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white border rounded-2xl p-6 space-y-4 animate-pulse">
          <div className="h-10 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-64 bg-gray-100 rounded" />
        </div>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-32 bg-white border rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-5xl mb-4">🏢</div>
        <p className="font-medium">Company not found or error loading data</p>
      </div>
    )
  }

  const { company, posts = [], summary, stats } = data

  return (
    <div className="space-y-8">
      {/* Company header */}
      <div className="bg-white border rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-4">
          {company.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="w-14 h-14 rounded-xl object-contain border p-1" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-[#FDF2F4] border border-[#F5D0D7] flex items-center justify-center text-2xl font-black text-[#A41D35]">
              {company.name?.[0] ?? 'C'}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black text-gray-900">{company.name}</h1>
            <div className="flex gap-4 text-sm text-gray-500 mt-1">
              <span>📋 {stats?.total ?? 0} experience{(stats?.total ?? 0) !== 1 ? 's' : ''}</span>
              <span className="text-green-600">✅ {stats?.selected ?? 0} selected</span>
              <span className="text-red-500">❌ {stats?.rejected ?? 0} rejected</span>
            </div>
          </div>
        </div>

        {/* Common flow */}
        {summary?.commonFlow?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Most common interview flow</p>
            <div className="flex items-center gap-2 flex-wrap">
              {summary.commonFlow.map((round: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="bg-[#FDF2F4] text-[#A41D35] border border-[#F5D0D7] text-xs font-semibold px-2 py-1 rounded-lg">
                    {round}
                  </span>
                  {i < summary.commonFlow.length - 1 && (
                    <span className="text-gray-300">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top Do's & Don'ts */}
      {(summary?.topDos?.length > 0 || summary?.topDonts?.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {summary?.topDos?.length > 0 && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <h3 className="font-bold text-green-800 mb-3">Top Do&apos;s ✅</h3>
              <ul className="space-y-2">
                {summary.topDos.map((d: string, i: number) => (
                  <li key={i} className="text-sm text-green-900">• {d}</li>
                ))}
              </ul>
            </div>
          )}
          {summary?.topDonts?.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <h3 className="font-bold text-red-800 mb-3">Top Don&apos;ts ❌</h3>
              <ul className="space-y-2">
                {summary.topDonts.map((d: string, i: number) => (
                  <li key={i} className="text-sm text-red-900">• {d}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Top resources */}
      {summary?.topResources?.length > 0 && (
        <div>
          <h2 className="font-bold text-gray-900 mb-3">Top Resources</h2>
          <div className="space-y-2">
            {summary.topResources.map((r: any) => (
              <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                className="flex gap-3 items-start p-3 border rounded-lg hover:bg-gray-50 transition">
                <span className="text-[#A41D35] font-bold text-xs mt-0.5">↗</span>
                <div>
                  <p className="text-sm font-medium text-[#A41D35] hover:underline break-all">{r.url}</p>
                  {r.note && <p className="text-xs text-gray-500 mt-0.5">{r.note}</p>}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* All experiences */}
      <div>
        <h2 className="font-bold text-gray-900 mb-4">All Experiences ({posts.length})</h2>
        <div className="grid gap-4">
          {posts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function CompanyPage(props: CompanyPageProps) {
  return (
    <Suspense fallback={<div className="animate-pulse py-10 text-center text-gray-400">Loading company details…</div>}>
      <CompanyContent {...props} />
    </Suspense>
  )
}
