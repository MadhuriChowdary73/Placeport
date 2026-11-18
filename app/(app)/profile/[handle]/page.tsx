import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

interface ProfilePageProps {
  params: Promise<{ handle: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { handle } = await params
  return { title: `Profile: @${handle}` }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { handle } = await params
  const supabase = await createClient()

  // Look up profile by handle
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, handle, campus, branch, batch, helped_count, display_mode, created_at')
    .eq('handle', handle)
    .single()

  if (error || !profile) notFound()
  const p = profile as any

  // Get user's badges
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select('awarded_at, badges(slug, name, description, icon)')
    .eq('user_id', p.id)

  // Get user's public posts count
  const { count: postCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', p.id)
    .eq('is_published', true)

  return (
    <div className="space-y-8">
      {/* Profile header */}
      <div className="bg-white border rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="w-12 h-12 rounded-full bg-[#FDF2F4] border border-[#F5D0D7] flex items-center justify-center text-xl font-black text-[#A41D35] mb-3">
              {handle[0]?.toUpperCase()}
            </div>
            <h1 className="text-xl font-black text-gray-900">@{handle}</h1>
            {p.campus && (
              <p className="text-sm text-gray-500">{p.campus} · {p.branch} · Class of {p.batch}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">{postCount ?? 0} experiences shared</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-[#A41D35]">{p.helped_count}</div>
            <div className="text-xs text-gray-500">students helped</div>
          </div>
        </div>

        {/* Badges */}
        {userBadges && userBadges.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Badges</p>
            <div className="flex flex-wrap gap-2">
              {(userBadges as any[]).map((ub) => (
                <div
                  key={ub.badges?.slug}
                  title={ub.badges?.description ?? ''}
                  className="flex items-center gap-1.5 bg-[#FDF2F4] border border-[#F5D0D7] text-[#A41D35] text-xs font-semibold px-2.5 py-1 rounded-full"
                >
                  <span>{ub.badges?.icon}</span>
                  {ub.badges?.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Links */}
      <div className="text-center">
        <p className="text-sm text-gray-400">
          Visit the <a href="/feed" className="text-[#A41D35] hover:underline font-semibold">feed</a> to browse all experiences.
        </p>
      </div>
    </div>
  )
}
