import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isMockMode, getMockResources } from '@/lib/mockStore'

// GET /api/resources?company=slug
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companySlug = new URL(req.url).searchParams.get('company')

  if (isMockMode()) {
    const list = await getMockResources(companySlug)
    return NextResponse.json(list)
  }

  try {
    let query = supabase
      .from('resources')
      .select('id, url, note, helpful_count, posts!inner(company_id, companies!inner(name, slug))')
      .order('helpful_count', { ascending: false })
      .limit(50)

    const { data, error } = await query
    if (error) throw error

    // Flatten and optionally filter by company
    const flattened = (data as any[]).map(r => ({
      id: r.id,
      url: r.url,
      note: r.note,
      helpful_count: r.helpful_count,
      company_name: r.posts?.companies?.name ?? null,
      company_slug: r.posts?.companies?.slug ?? null,
    }))

    const filtered = companySlug
      ? flattened.filter(r => r.company_slug === companySlug)
      : flattened

    return NextResponse.json(filtered)
  } catch {
    const list = await getMockResources(companySlug)
    return NextResponse.json(list)
  }
}
