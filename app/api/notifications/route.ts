import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isMockMode, getMockNotifications, markMockNotificationsRead } from '@/lib/mockStore'

// GET /api/notifications — get current user's notifications
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (isMockMode()) {
    const list = await getMockNotifications(user.id)
    return NextResponse.json(list)
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return NextResponse.json(data)
  } catch {
    const list = await getMockNotifications(user.id)
    return NextResponse.json(list)
  }
}

// PATCH /api/notifications — mark as read
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { notification_ids } = await req.json()

  if (isMockMode()) {
    const res = await markMockNotificationsRead(user.id, notification_ids)
    return NextResponse.json(res)
  }

  try {
    if (notification_ids && Array.isArray(notification_ids)) {
      // Mark specific notifications
      const { error } = await (supabase
        .from('notifications') as any)
        .update({ read_at: new Date().toISOString() })
        .in('id', notification_ids)
        .eq('user_id', user.id)

      if (error) throw error
    } else {
      // Mark all as read
      const { error } = await (supabase
        .from('notifications') as any)
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null)

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch {
    const res = await markMockNotificationsRead(user.id, notification_ids)
    return NextResponse.json(res)
  }
}
