import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isMockMode, getMockCompanies, createMockCompany } from '@/lib/mockStore'

// GET /api/companies?q=search
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = new URL(req.url).searchParams.get('q')

  if (isMockMode()) {
    const list = await getMockCompanies(q)
    return NextResponse.json(list)
  }

  try {
    let query = supabase.from('companies').select('id, name, slug, logo_url').order('name')
    if (q) query = query.ilike('name', `%${q}%`)

    const { data, error } = await query.limit(20)
    if (error) throw error
    return NextResponse.json(data)
  } catch {
    const list = await getMockCompanies(q)
    return NextResponse.json(list)
  }
}

// POST /api/companies (create new company)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await req.json()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  if (isMockMode()) {
    const created = await createMockCompany(name)
    return NextResponse.json(created, { status: 201 })
  }

  try {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const { data, error } = await supabase
      .from('companies')
      .upsert({ name, slug } as any, { onConflict: 'slug' })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch {
    const created = await createMockCompany(name)
    return NextResponse.json(created, { status: 201 })
  }
}
