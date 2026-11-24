import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { postSchema } from '@/lib/validations/post'
import { revalidatePath } from 'next/cache'
import { ADMIN_EMAIL } from '@/lib/config'
import { getExperiences, createExperience } from '@/lib/services/experienceService'

// GET /api/posts
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Security: only logged-in users can read posts
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized. Please sign in to view experiences.' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const company = searchParams.get('company')
  const year = searchParams.get('year')
  const role = searchParams.get('role')
  const campus = searchParams.get('campus')
  const branch = searchParams.get('branch')
  const outcome = searchParams.get('outcome')
  const sort = searchParams.get('sort') ?? 'recent'
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20

  const email = (user.email || '').toLowerCase().trim()
  let isAdmin = email === ADMIN_EMAIL.toLowerCase()
  if (!isAdmin) {
    const { data: userProfile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if ((userProfile as any)?.role === 'admin') {
      isAdmin = true
    }
  }

  const res = await getExperiences({ company, year, role, campus, branch, outcome, sort, page, limit, isAdmin })
  return NextResponse.json({ ...res, isAdmin })
}

// POST /api/posts
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized. Please sign in to post.' }, { status: 401 })
  }

  const userEmail = (user.email || '').toLowerCase().trim()
  const isAdminPoster = userEmail === ADMIN_EMAIL.toLowerCase()

  // Fetch author profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, roll_number, status, full_name')
    .eq('id', user.id)
    .single()

  // Ensure user is not blocked
  if ((profile as any)?.status === 'blocked') {
    return NextResponse.json({ error: 'Account suspended. You cannot publish experiences.' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const rollNumber = (parsed.data.author_roll_number || (profile as any)?.roll_number || userEmail.split('@')[0]).trim().toUpperCase()
  const authorName = parsed.data.author_name?.trim() || (profile as any)?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || null
  const displayMode = parsed.data.display_mode === 'name' ? 'name' : 'roll'
  const projectTitle = parsed.data.project_title ?? (body.projectTitle ? String(body.projectTitle).trim() : null)
  const projectRating = parsed.data.project_rating ?? (body.projectRating ? Number(body.projectRating) : null)

  // Update profile with the roll number and full name if provided
  try {
    await (supabase.from('profiles' as any) as any)
      .update({
        roll_number: rollNumber,
        full_name: authorName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
  } catch (profErr) {
    console.warn('[POST /api/posts] Profile update notice:', profErr)
  }

  try {
    const post = await createExperience(
      {
        ...parsed.data,
        author_email: userEmail,
        author_roll_number: rollNumber,
        author_name: authorName,
        display_mode: displayMode,
        project_title: projectTitle,
        project_rating: projectRating,
      },
      user.id
    )

    revalidatePath('/feed')
    return NextResponse.json({ post }, { status: 201 })
  } catch (err: any) {
    console.error('Failed to create experience:', err)
    return NextResponse.json({ error: err.message || 'Failed to publish experience' }, { status: 500 })
  }
}
