'use client'

import { useQuery } from '@tanstack/react-query'

export default function SavedPage() {
  const { data: saves = [], isLoading } = useQuery({
    queryKey: ['saved-posts'],
    queryFn: async () => {
      const res = await fetch('/api/saves')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Saved Experiences</h1>
        <p className="text-sm text-gray-500 mt-0.5">{saves.length} saved</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white border rounded-xl p-6 animate-pulse">
              <div className="h-4 w-48 bg-gray-200 rounded mb-3" />
              <div className="h-3 w-32 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : saves.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🔖</div>
          <p className="font-medium">Nothing saved yet</p>
          <p className="text-sm mt-1">Bookmark experiences from the feed to find them here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {saves.map((save: any) => {
            const post = save.post
            if (!post) return null
            return (
              <div key={save.post_id} className="border rounded-xl p-4 bg-white hover:shadow-sm transition">
                <a href={`/experiences/${post.id}`} className="font-bold text-gray-900 hover:text-[#A41D35] transition">
                  {post.role} at {post.company_name}
                </a>
                <div className="flex gap-3 text-xs text-gray-400 mt-1">
                  <span>{post.year}</span>
                  <span>{post.campus}</span>
                  <span>{post.outcome === 'selected' ? '✅ Selected' : post.outcome}</span>
                  <span>👍 {post.vote_count} helpful</span>
                </div>
                {post.advice && (
                  <p className="text-sm text-gray-500 mt-2 italic line-clamp-1">&ldquo;{post.advice}&rdquo;</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
