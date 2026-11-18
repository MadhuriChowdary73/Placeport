import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isMockMode, toggleMockVote } from '@/lib/mockStore'

// POST /api/votes — toggle helpful vote on a post
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { post_id } = await req.json()
  if (!post_id) return NextResponse.json({ error: 'post_id required' }, { status: 400 })

  if (isMockMode()) {
    const res = await toggleMockVote(post_id, user.id)
    return NextResponse.json(res)
  }

  try {
    // Check if already voted
    const { data: existing } = await supabase
      .from('votes')
      .select('id')
      .eq('post_id', post_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      // Remove vote
      await supabase.from('votes').delete().eq('id', (existing as any).id)
      return NextResponse.json({ voted: false })
    } else {
      // Add vote
      await supabase.from('votes').insert({ post_id, user_id: user.id } as any)
      // Try to award badges
      try {
        const { data: post } = await supabase.from('posts').select('author_id').eq('id', post_id).single()
        if (post) await (supabase as any).rpc('award_badges', { p_user_id: (post as any).author_id })
      } catch {}
      return NextResponse.json({ voted: true })
    }
  } catch {
    const res = await toggleMockVote(post_id, user.id)
    return NextResponse.json(res)
  }
}
