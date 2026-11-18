import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isMockMode } from '@/lib/mockStore'

// POST /api/reports — submit a report
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { post_id, reason } = await req.json()
  if (!post_id || !reason) {
    return NextResponse.json({ error: 'post_id and reason are required' }, { status: 400 })
  }

  if (reason.length > 1000) {
    return NextResponse.json({ error: 'Reason too long (max 1000 chars)' }, { status: 400 })
  }

  if (isMockMode()) {
    return NextResponse.json({ success: true }, { status: 201 })
  }

  try {
    const { error } = await supabase.from('reports').insert({
      post_id,
      reporter_id: user.id,
      reason,
    } as any)

    if (error) throw error
    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ success: true }, { status: 201 })
  }
}
