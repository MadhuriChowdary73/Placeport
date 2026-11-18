import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { postSchema } from '@/lib/validations/post'
import { revalidatePath } from 'next/cache'
import { isMockMode, getMockPosts, getMockProfile } from '@/lib/mockStore'
import { parseRollNumber, extractRollNumber } from '@/lib/validation'
import { getExperiences, createExperience } from '@/lib/services/experienceService'

// GET /api/posts
export async function GET(req: NextRequest) {
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

  const res = await getExperiences({ company, year, role, campus, branch, outcome, sort, page, limit })
  return NextResponse.json(res)
}

// POST /api/posts
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const userEmail = user.email || ''

  // Verify roll number and profile existence
  let hasProfile = false
  if (isMockMode()) {
    const profile = getMockProfile(user.id)
    hasProfile = Boolean(profile || user.user_metadata?.roll_number || parseRollNumber(userEmail) || extractRollNumber(userEmail).valid)
  } else {
    try {
      const { data: profile } = await supabase
        .from('profiles' as any)
        .select('id, roll_number')
        .eq('id', user.id)
        .maybeSingle()
      hasProfile = Boolean((profile as any)?.roll_number)
    } catch {
      hasProfile = Boolean(parseRollNumber(userEmail))
    }
  }

  if (!hasProfile) {
    return NextResponse.json(
      { error: 'You must have a verified Amrita student profile to post. Please log in with your Amrita email.' },
      { status: 403 }
    )
  }

  try {
    const post = await createExperience(
      {
        ...parsed.data,
        author_email: userEmail,
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
