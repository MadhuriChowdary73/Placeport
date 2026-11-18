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

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const email = (user?.email || '').toLowerCase().trim()
  const isAdmin = email === 'madhurichowdary2007@gmail.com'

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

  // Verify Amrita student email
  if (!userEmail.endsWith('@av.students.amrita.edu')) {
    return NextResponse.json(
      { error: 'Only verified Amrita student accounts can publish experiences.' },
      { status: 403 }
    )
  }

  const body = await req.json()
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const parsedRoll = parseRollNumber(userEmail)
  const fallbackRoll = extractRollNumber(userEmail)
  const rollNumber = parsedRoll?.rollNumber || (fallbackRoll.valid ? fallbackRoll.rollNumber : userEmail.split('@')[0].toUpperCase())

  // Ensure author profile row is present in public.profiles table
  try {
    await (supabase.from('profiles' as any) as any).upsert({
      id: user.id,
      email: userEmail,
      roll_number: rollNumber,
      branch: parsedRoll?.branch || parsed.data.branch || 'CSE',
      batch_year: parsedRoll?.batchYear || 24,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  } catch (profErr) {
    console.error('Error ensuring author profile exists:', profErr)
  }

  try {
    const post = await createExperience(
      {
        ...parsed.data,
        author_email: userEmail,
        author_roll_number: rollNumber,
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
