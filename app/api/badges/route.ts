import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isMockMode } from '@/lib/mockStore'

const MOCK_BADGES = [
  { id: 'b1', slug: 'first_post', name: 'First Contributor', description: 'Shared your first placement experience', icon: '✍️' },
  { id: 'b2', slug: 'helpful_10', name: 'Helpful Peer', description: 'Received 10+ helpful votes', icon: '💡' },
  { id: 'b3', slug: 'top_mentor', name: 'Top Mentor', description: 'Shared 3+ interview experiences with comprehensive tips', icon: '🏆' },
]

// GET /api/badges — get all badges, or a user's badges
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = new URL(req.url).searchParams.get('user_id')

  if (isMockMode()) {
    if (userId) {
      return NextResponse.json([
        { awarded_at: new Date().toISOString(), badges: MOCK_BADGES[0] },
        { awarded_at: new Date().toISOString(), badges: MOCK_BADGES[1] },
      ])
    }
    return NextResponse.json(MOCK_BADGES)
  }

  try {
    if (userId) {
      // Get user's badges
      const { data, error } = await supabase
        .from('user_badges')
        .select('awarded_at, badges(slug, name, description, icon)')
        .eq('user_id', userId)
        .order('awarded_at', { ascending: false })

      if (error) throw error
      return NextResponse.json(data)
    } else {
      // Get all badge definitions
      const { data, error } = await supabase.from('badges').select('*')
      if (error) throw error
      return NextResponse.json(data)
    }
  } catch {
    if (userId) {
      return NextResponse.json([
        { awarded_at: new Date().toISOString(), badges: MOCK_BADGES[0] },
      ])
    }
    return NextResponse.json(MOCK_BADGES)
  }
}
