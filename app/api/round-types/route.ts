import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isMockMode, getMockRoundTypes } from '@/lib/mockStore'

// GET /api/round-types
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (isMockMode()) {
    const list = await getMockRoundTypes()
    return NextResponse.json(list)
  }

  try {
    const { data, error } = await supabase.from('round_types').select('*').order('name')
    if (error) throw error
    return NextResponse.json(data)
  } catch {
    const list = await getMockRoundTypes()
    return NextResponse.json(list)
  }
}
