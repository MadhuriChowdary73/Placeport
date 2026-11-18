'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'

function ResourcesContent() {
  const searchParams = useSearchParams()
  const company = searchParams.get('company') ?? ''

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['resources', company],
    queryFn: async () => {
      const q = new URLSearchParams()
      if (company) q.set('company', company)
      const res = await fetch(`/api/resources?${q.toString()}`)
      if (!res.ok) throw new Error('Failed to load resources')
      return res.json()
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Ranked Resources</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Top resources shared by the Amrita community, ranked by helpfulness
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border rounded-xl p-4 animate-pulse">
              <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-32 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">📚</div>
          <p className="font-medium">No resources yet</p>
          <p className="text-sm mt-1">Be the first to share a resource in your interview experience.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((r: any, i: number) => (
            <div key={r.id} className="bg-white border rounded-xl p-4 flex items-start gap-4 hover:shadow-sm transition">
              <div className="w-8 h-8 rounded-full bg-[#FDF2F4] border border-[#F5D0D7] flex items-center justify-center text-xs font-black text-[#A41D35] shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[#A41D35] hover:underline break-all"
                >
                  {r.url}
                </a>
                {r.note && <p className="text-xs text-gray-500 mt-1">{r.note}</p>}
                <div className="flex gap-3 text-xs text-gray-400 mt-2">
                  <span>👍 {r.helpful_count ?? 0} found helpful</span>
                  {r.company_name && <span>🏢 {r.company_name}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-gray-400 py-10 text-center">Loading…</div>}>
      <ResourcesContent />
    </Suspense>
  )
}
