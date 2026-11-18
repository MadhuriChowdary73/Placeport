import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isMockMode, getMockCompanySummary } from '@/lib/mockStore'

// GET /api/companies/[slug]/summary
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (isMockMode()) {
    const summary = await getMockCompanySummary(slug)
    if (!summary) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(summary)
  }

  try {
    // Get company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', slug)
      .single()
    if (companyError || !company) throw companyError ?? new Error('Not found')

    // Posts for this company from public view
    const { data: rawPosts } = await supabase
      .from('posts_public' as any)
      .select('*')
      .eq('company_slug', slug)
      .order('vote_count', { ascending: false })

    const posts = (rawPosts ?? []) as any[]

    // Fetch rounds, dos_donts, resources for all posts
    const postIds = posts.map(p => p.id)
    const { data: allRounds } = await supabase
      .from('rounds')
      .select('*, round_types(name)')
      .in('post_id', postIds)
      .order('order_index')

    const { data: allDosDonts } = await supabase
      .from('dos_donts')
      .select('*')
      .in('post_id', postIds)

    const { data: allResources } = await supabase
      .from('resources')
      .select('*')
      .in('post_id', postIds)
      .order('helpful_count', { ascending: false })

    // Round flow pattern: group rounds by order_index
    const roundMap = new Map<number, { name: string; count: number; avg_duration: number; total_duration: number }>()
    ;(allRounds ?? []).forEach((r: any) => {
      const idx = r.order_index
      const name = r.round_types?.name ?? 'Round'
      const duration = r.duration_min ?? 0
      const curr = roundMap.get(idx) ?? { name, count: 0, avg_duration: 0, total_duration: 0 }
      curr.count++
      curr.total_duration += duration
      curr.avg_duration = Math.round(curr.total_duration / curr.count)
      roundMap.set(idx, curr)
    })

    const round_flow = Array.from(roundMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([order, data]) => ({
        order,
        round_name: data.name,
        typical_duration_minutes: data.avg_duration,
        frequency: data.count,
      }))

    const ctcNumbers = posts.flatMap(p => [p.ctc_min, p.ctc_max].filter(Boolean))
    const avg_ctc = ctcNumbers.length > 0 ? ctcNumbers.reduce((a, b) => a + b, 0) / ctcNumbers.length : null

    return NextResponse.json({
      company,
      stats: {
        total_experiences: posts.length,
        selection_rate: posts.length > 0
          ? Math.round((posts.filter(p => p.outcome === 'selected').length / posts.length) * 100)
          : 0,
        avg_difficulty: posts.length > 0
          ? Math.round((posts.reduce((acc, p) => acc + (p.difficulty ?? 0), 0) / posts.length) * 10) / 10
          : null,
        avg_ctc: avg_ctc ? Math.round(avg_ctc * 10) / 10 : null,
        top_campus: posts[0]?.campus ?? null,
      },
      round_flow,
      dos: (allDosDonts ?? []).filter((d: any) => d.type === 'do').slice(0, 5).map((d: any) => d.content),
      donts: (allDosDonts ?? []).filter((d: any) => d.type === 'dont').slice(0, 5).map((d: any) => d.content),
      resources: (allResources ?? []).slice(0, 5),
      posts,
    })
  } catch {
    const summary = await getMockCompanySummary(slug)
    if (!summary) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(summary)
  }
}
