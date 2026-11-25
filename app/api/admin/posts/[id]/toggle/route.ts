import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { toggleExperiencePublishStatus } from '@/lib/services/experienceService'

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
    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
    let isAdmin = Boolean(adminEmail && email === adminEmail)

    if (!isAdmin) {
      // Check profile role
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

    const result = await toggleExperiencePublishStatus(postId)
    if (!result.ok) {
      return NextResponse.json({ error: 'Failed to update experience status' }, { status: 500 })
    }

    revalidatePath('/feed')
    revalidatePath(`/experiences/${postId}`)

    return NextResponse.json({
      ok: true,
      postId,
      is_published: result.is_published,
      message: result.is_published ? 'Experience is now live on feed' : 'Experience is now hidden from feed',
    })
  } catch (err: any) {
    console.error('[AdminTogglePost] Error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
