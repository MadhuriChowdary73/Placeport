import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isMockMode, getMockSaves, toggleMockSave } from '@/lib/mockStore'

// POST /api/saves — toggle save on a post
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { post_id } = await req.json()
  if (!post_id) return NextResponse.json({ error: 'post_id required' }, { status: 400 })

  if (isMockMode()) {
    const res = await toggleMockSave(post_id, user.id)
    return NextResponse.json(res)
  }

  try {
    const { data: existing } = await supabase
      .from('saves')
      .select('id')
      .eq('post_id', post_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      await supabase.from('saves').delete().eq('id', (existing as any).id)
      return NextResponse.json({ saved: false })
    } else {
      await supabase.from('saves').insert({ post_id, user_id: user.id } as any)
      return NextResponse.json({ saved: true })
    }
  } catch {
    const res = await toggleMockSave(post_id, user.id)
    return NextResponse.json(res)
  }
}

// GET /api/saves — get current user's saved posts
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (isMockMode()) {
    const enriched = await getMockSaves(user.id)
    return NextResponse.json(enriched)
  }

  try {
    const { data, error } = await supabase
      .from('saves')
      .select('post_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Fetch post details for each save
    const saves = data as any[]
    const enriched = await Promise.all(
      saves.map(async (save: any) => {
        const { data: post } = await supabase
          .from('posts_public' as any)
          .select('*')
          .eq('id', save.post_id)
          .single()
        return { ...save, post: post ?? null }
      })
    )

    return NextResponse.json(enriched)
  } catch {
    const enriched = await getMockSaves(user.id)
    return NextResponse.json(enriched)
  }
}
