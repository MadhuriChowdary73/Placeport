'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ExperienceCard } from '@/components/experience/ExperienceCard'
import { PostFilters } from '@/components/post/PostFilters'
import { usePosts } from '@/lib/hooks/usePosts'

function FeedContent() {
  const searchParams = useSearchParams()
  const filters: Record<string, string> = {}
  searchParams.forEach((value, key) => { filters[key] = value })
  if (!filters.sort) filters.sort = 'recent'

  const { data, isLoading } = usePosts(filters)
  const posts = data?.posts ?? []
  const total = data?.total ?? 0
  const isAdmin = (data as any)?.isAdmin ?? false

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">Placement Experiences</h1>
            <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-[#FDF2F4] text-[#A41D35] border border-[#F5D0D7]">
              Amaravati Campus
            </span>
          </div>
          <p className="text-[15px] text-gray-600 mt-1 font-normal">
            {total} experience{total !== 1 ? 's' : ''} shared by Amrita Amaravati students
          </p>
        </div>
        <Link
          href="/post/new"
          className="bg-[#A41D35] text-white text-[15px] font-bold px-5 py-2.5 rounded-xl hover:bg-[#8A152A] transition hidden sm:block shadow-xs tracking-wide"
        >
          + Share yours
        </Link>
      </div>

      <Suspense fallback={null}>
        <PostFilters />
      </Suspense>

      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border rounded-xl p-6 animate-pulse">
              <div className="h-4 w-32 bg-gray-200 rounded mb-3" />
              <div className="h-5 w-48 bg-gray-200 rounded mb-4" />
              <div className="h-3 w-full bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-[14px] font-medium">No experiences found</p>
          <p className="text-[13px] mt-1 font-normal">Try adjusting your filters or be the first to share!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {posts.map((post: any) => (
            <ExperienceCard key={post.id} post={post} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function FeedPage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-gray-400 py-10 text-center">Loading…</div>}>
      <FeedContent />
    </Suspense>
  )
}
