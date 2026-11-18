import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isMockMode, getMockPostById, deleteMockPost } from '@/lib/mockStore'

// GET /api/posts/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (isMockMode()) {
    const post = await getMockPostById(id)
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(post)
  }

  try {
    const { data, error } = await supabase
      .from('posts_public')
      .select(`
        *,
        rounds(*, round_types(name)),
        dos_donts(*),
        resources(*)
      `)
      .eq('id', id)
      .single()

    if (error || !data) throw error ?? new Error('Not found')
    return NextResponse.json(data)
  } catch {
    const post = await getMockPostById(id)
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(post)
  }
}

// DELETE /api/posts/[id]  (author or admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (isMockMode()) {
    await deleteMockPost(id)
    return NextResponse.json({ success: true })
  }

  try {
    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    await deleteMockPost(id)
    return NextResponse.json({ success: true })
  }
}
