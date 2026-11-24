import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_EMAIL } from '@/lib/config'
import { parseRollNumber, extractRollNumber } from '@/lib/validation'

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

    const isAdmin = email === ADMIN_EMAIL.toLowerCase()
    const parsed = parseRollNumber(email)
    const fallbackRoll = extractRollNumber(email)
    const rollNumber = isAdmin
      ? 'ADMIN'
      : parsed?.rollNumber || (fallbackRoll.valid ? fallbackRoll.rollNumber : email.split('@')[0].toUpperCase())

    await (supabase.from('profiles' as any) as any).upsert(
      {
        id: userId,
        email: email,
        full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || null,
        roll_number: rollNumber,
        branch: isAdmin ? 'ADMIN' : parsed?.branch || 'CSE',
        batch_year: isAdmin ? 24 : parsed?.batchYear || 24,
        role: isAdmin ? 'admin' : 'student',
        status: 'approved',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

    return NextResponse.json({ ok: true, rollNumber, role: isAdmin ? 'admin' : 'student' })
  } catch (err: any) {
    console.error('[SyncProfile] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
