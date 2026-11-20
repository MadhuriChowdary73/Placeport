import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getValidRollNumbers,
  addValidRollNumbers,
  deleteValidRollNumber,
} from '@/lib/services/rollNumberService'

async function checkAdminAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return (profile as any)?.role === 'admin'
}

// GET /api/admin/roll-numbers?q=...&page=1
export async function GET(req: NextRequest) {
  const isAdmin = await checkAdminAuth()
  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '50', 10)

  const result = await getValidRollNumbers(q, page, limit)
  return NextResponse.json(result)
}

// POST /api/admin/roll-numbers - Bulk upload or paste roll numbers
export async function POST(req: NextRequest) {
  const isAdmin = await checkAdminAuth()
  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    // Supports either an array or a raw multiline/comma-separated text string
    let rollNumbers: string[] = []

    if (Array.isArray(body?.roll_numbers)) {
      rollNumbers = body.roll_numbers
    } else if (typeof body?.text === 'string') {
      rollNumbers = body.text
        .split(/[\r\n,;\s]+/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)
    }

    if (rollNumbers.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Please provide at least one roll number' },
        { status: 400 }
      )
    }

    const result = await addValidRollNumbers(rollNumbers, {
      branch: body?.branch,
      batch: body?.batch ? parseInt(body.batch, 10) : undefined,
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Failed to add roll numbers' }, { status: 500 })
  }
}

// DELETE /api/admin/roll-numbers?roll=...
export async function DELETE(req: NextRequest) {
  const isAdmin = await checkAdminAuth()
  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const rollNumber = searchParams.get('roll') || ''

  if (!rollNumber) {
    return NextResponse.json({ ok: false, error: 'Roll number is required' }, { status: 400 })
  }

  const success = await deleteValidRollNumber(rollNumber)
  return NextResponse.json({ ok: success })
}
