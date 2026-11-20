import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isMockMode } from '@/lib/mockStore'

// GET /api/admin/users — list users (admin only)
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (isMockMode()) {
    return NextResponse.json([
      {
        id: user.id,
        roll_number: user.user_metadata?.roll_number || user.email?.split('@')[0].toUpperCase(),
        handle: 'amrita_scholar',
        full_name: 'Amrita Student',
        campus: 'Amritapuri',
        branch: 'CSE',
        batch: 2025,
        role: 'admin',
        helped_count: 38,
        created_at: new Date().toISOString(),
      },
    ])
  }

  try {
    const userEmail = (user.email || '').toLowerCase()
    const isMasterAdmin = userEmail === 'madhurichowdary2007@gmail.com'

    if (!isMasterAdmin) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if ((profile as any)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = await createAdminClient()
    const search = new URL(req.url).searchParams.get('q')

    let query = admin
      .from('profiles')
      .select('id, roll_number, handle, full_name, campus, branch, batch, role, helped_count, created_at')
      .order('created_at', { ascending: false })
      .limit(100)

    if (search) {
      query = query.or(`roll_number.ilike.%${search}%,handle.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data)
  } catch {
    return NextResponse.json([])
  }
}

// PATCH /api/admin/users — toggle admin role
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (isMockMode()) {
    return NextResponse.json({ success: true })
  }

  try {
    const userEmail = (user.email || '').toLowerCase()
    const isMasterAdmin = userEmail === 'madhurichowdary2007@gmail.com'

    if (!isMasterAdmin) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if ((profile as any)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { user_id, role } = await req.json()
    if (!user_id || !['student', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
    }

    const admin = await createAdminClient()
    const { error } = await (admin
      .from('profiles') as any)
      .update({ role })
      .eq('id', user_id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}
