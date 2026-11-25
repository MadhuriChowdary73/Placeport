import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isMockMode, getMockPostById, deleteMockPost } from '@/lib/mockStore'
import { ADMIN_EMAIL } from '@/lib/config'
import { deleteExperience } from '@/lib/services/experienceService'

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

// DELETE /api/posts/[id] (admin only moderation)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const email = user.email.toLowerCase().trim()
  let isAdmin = email === ADMIN_EMAIL.toLowerCase()
  if (!isAdmin) {
    const { data: profile } = await supabase
      .from('profiles' as any)
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if ((profile as any)?.role === 'admin') {
      isAdmin = true
    }
  }

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
  }

  await deleteExperience(id)
  return NextResponse.json({ success: true, message: 'Experience deleted' })
}
