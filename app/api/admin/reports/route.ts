import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isMockMode } from '@/lib/mockStore'

// GET /api/admin/reports — admin only, all reports by status
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (isMockMode()) {
    return NextResponse.json([])
  }

  try {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if ((profile as any)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const admin = await createAdminClient()
    const status = new URL(req.url).searchParams.get('status') ?? 'pending'

    const { data, error } = await admin
      .from('reports')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: true })

    if (error) throw error

    // Enrich with post and reporter info
    const enriched = await Promise.all(
      ((data ?? []) as any[]).map(async (report: any) => {
        const { data: post } = await admin
          .from('posts')
          .select('id, role, company_id')
          .eq('id', report.post_id)
          .single()

        let companyName = ''
        if (post) {
          const { data: company } = await admin
            .from('companies')
            .select('name')
            .eq('id', (post as any).company_id)
            .single()
          companyName = (company as any)?.name ?? ''
        }

        const { data: reporter } = await admin
          .from('profiles')
          .select('roll_number, handle')
          .eq('id', report.reporter_id)
          .single()

        return {
          ...report,
          post: post ? { ...(post as any), company_name: companyName } : null,
          reporter: reporter ?? null,
        }
      })
    )

    return NextResponse.json(enriched)
  } catch {
    return NextResponse.json([])
  }
}

// PATCH /api/admin/reports — resolve or dismiss
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (isMockMode()) {
    return NextResponse.json({ success: true })
  }

  try {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if ((profile as any)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { report_id, action } = await req.json()
    if (!report_id || !['resolve', 'dismiss'].includes(action)) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const admin = await createAdminClient()

    if (action === 'resolve') {
      const { data: report } = await admin.from('reports').select('post_id').eq('id', report_id).single()
      if (report) {
        await admin.from('posts').delete().eq('id', (report as any).post_id)
      }
      await (admin.from('reports') as any).update({ status: 'resolved' }).eq('id', report_id)
    } else {
      await (admin.from('reports') as any).update({ status: 'dismissed' }).eq('id', report_id)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}
