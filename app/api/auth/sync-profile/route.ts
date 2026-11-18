import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    if (!email.endsWith('@av.students.amrita.edu')) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 })
    }

    const parsed = parseRollNumber(email)
    const fallbackRoll = extractRollNumber(email)
    const rollNumber = parsed?.rollNumber || (fallbackRoll.valid ? fallbackRoll.rollNumber : email.split('@')[0].toUpperCase())

    await (supabase.from('profiles' as any) as any).upsert({
      id: userId,
      email: email,
      roll_number: rollNumber,
      branch: parsed?.branch || 'CSE',
      batch_year: parsed?.batchYear || 24,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

    return NextResponse.json({ ok: true, rollNumber })
  } catch (err: any) {
    console.error('[SyncProfile] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
