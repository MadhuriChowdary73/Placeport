import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAllowedGoogleAccount } from '@/lib/validation'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await req.json().catch(() => ({}))
    const email = (user?.email || body?.email || '').toLowerCase().trim()
    const userId = user?.id || body?.userId

    if (!email || !userId) {
      return NextResponse.json({ error: 'Missing user credentials' }, { status: 400 })
    }

    const check = checkAllowedGoogleAccount(email, process.env.ADMIN_EMAIL)
    if (!check.allowed) {
      await supabase.auth.signOut()
      return NextResponse.json({ ok: false, error: 'domain_not_allowed' }, { status: 403 })
    }

    await (supabase.from('profiles' as any) as any).upsert(
      {
        id: userId,
        email: email,
        full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || null,
        roll_number: check.rollNumber,
        branch: check.branch,
        batch: check.batchYear,
        role: check.isAdmin ? 'admin' : 'student',
        status: 'approved',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

    return NextResponse.json({ ok: true, rollNumber: check.rollNumber, role: check.isAdmin ? 'admin' : 'student' })
  } catch (err: any) {
    console.error('[SyncProfile] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
