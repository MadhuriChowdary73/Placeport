import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_EMAIL } from '@/lib/config'
import { revalidatePath } from 'next/cache'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: postId } = await params
    const email = user.email.toLowerCase().trim()
    const isAdmin = email === ADMIN_EMAIL.toLowerCase()

    if (!isAdmin) {
      // Check profile role
      const { data: profile } = await supabase
        .from('profiles' as any)
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if ((profile as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
      }
    }

    // 1. Get current status of the post
    const { data: currentPost } = await supabase
      .from('experiences' as any)
      .select('id, is_published')
      .eq('id', postId)
      .maybeSingle()

    let nextPublishedState = false
    if (currentPost) {
      const current = (currentPost as any).is_published ?? true
      nextPublishedState = !current

      await (supabase.from('experiences' as any) as any)
        .update({ is_published: nextPublishedState, updated_at: new Date().toISOString() })
        .eq('id', postId)
    } else {
      // Try legacy posts table
      const { data: legacyPost } = await supabase
        .from('posts' as any)
        .select('id, is_published')
        .eq('id', postId)
        .maybeSingle()

      if (legacyPost) {
        const current = (legacyPost as any).is_published ?? true
        nextPublishedState = !current

        await (supabase.from('posts' as any) as any)
          .update({ is_published: nextPublishedState })
          .eq('id', postId)
      } else {
        return NextResponse.json({ error: 'Experience not found' }, { status: 404 })
      }
    }

    revalidatePath('/feed')
    revalidatePath(`/experiences/${postId}`)

    return NextResponse.json({
      ok: true,
      postId,
      is_published: nextPublishedState,
      message: nextPublishedState ? 'Experience is now live on feed' : 'Experience is now hidden from feed',
    })
  } catch (err: any) {
    console.error('[AdminTogglePost] Error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
