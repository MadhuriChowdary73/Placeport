import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_EMAIL } from '@/lib/config'
import { revalidatePath } from 'next/cache'

export async function DELETE(
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
      const { data: profile } = await supabase
        .from('profiles' as any)
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if ((profile as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
      }
    }

    await (supabase.from('experiences' as any) as any).delete().eq('id', postId)
    await (supabase.from('posts' as any) as any).delete().eq('id', postId)

    revalidatePath('/feed')

    return NextResponse.json({ ok: true, message: 'Experience deleted successfully' })
  } catch (err: any) {
    console.error('[AdminDeletePost] Error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
