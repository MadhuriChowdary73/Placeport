import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rollNumberToEmail } from '@/lib/config'
import type { Database } from '@/types/database'

export async function POST(req: NextRequest) {
  try {
    // 1. Verify caller is authenticated as an admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if ((profile as any)?.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // 2. Read target user / roll number and new password
    const body = await req.json()
    const targetUserId = body?.user_id
    const rollNumber = (body?.roll_number || '').trim().toLowerCase()
    const newPassword = body?.new_password

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { ok: false, error: 'New password must be at least 6 characters' },
        { status: 400 }
      )
    }

    if (!targetUserId && !rollNumber) {
      return NextResponse.json(
        { ok: false, error: 'Target user_id or roll_number is required' },
        { status: 400 }
      )
    }

    // 3. Obtain server-only service role key (NEVER exposed to client)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.includes('placeholder')) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'SUPABASE_SERVICE_ROLE_KEY is not configured on the server. Please add it to your server environment variables.',
        },
        { status: 500 }
      )
    }

    const { createClient: createSupabaseJsClient } = await import('@supabase/supabase-js')
    const adminAuthClient = createSupabaseJsClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    let resolvedUserId = targetUserId

    // If only rollNumber was provided, look up user ID via synthetic email
    if (!resolvedUserId && rollNumber) {
      const syntheticEmail = rollNumberToEmail(rollNumber)
      const { data: listData, error: listError } = await adminAuthClient.auth.admin.listUsers()
      if (listError) {
        return NextResponse.json({ ok: false, error: listError.message }, { status: 500 })
      }
      const matched = listData.users.find(
        (u) => u.email?.toLowerCase() === syntheticEmail.toLowerCase()
      )
      if (!matched) {
        return NextResponse.json(
          { ok: false, error: `Student with roll number "${rollNumber}" not found` },
          { status: 404 }
        )
      }
      resolvedUserId = matched.id
    }

    // 4. Reset user password via admin API
    const { error: updateError } = await adminAuthClient.auth.admin.updateUserById(
      resolvedUserId,
      {
        password: newPassword,
      }
    )

    if (updateError) {
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message: 'Password reset successfully',
      user_id: resolvedUserId,
    })
  } catch (err: any) {
    console.error('[AdminResetPassword] Error:', err)
    return NextResponse.json({ ok: false, error: err.message || 'Internal server error' }, { status: 500 })
  }
}
