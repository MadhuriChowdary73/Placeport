import {
  isMockMode,
  getMockPosts,
  getMockPostById,
  createMockPost,
  deleteMockPost,
} from '../mockStore'
import { createClient } from '../supabase/server'
import type { Experience } from '../types'

/**
 * Service layer for placement experiences.
 * All database access goes through this service layer.
 */

export async function getExperiences(filters: {
  company?: string | null
  year?: string | null
  role?: string | null
  campus?: string | null
  branch?: string | null
  outcome?: string | null
  sort?: string | null
  page?: number
  limit?: number
  isAdmin?: boolean
}): Promise<{ posts: Experience[]; total: number; page: number; limit: number }> {
  if (isMockMode()) {
    const result = await getMockPosts(filters)
    return result as any
  }

  try {
    const supabase = await createClient()
    const page = filters.page || 1
    const limit = filters.limit || 20
    const offset = (page - 1) * limit

    // First try querying the new 'experiences' table with author profile join
    let query = supabase
      .from('experiences' as any)
      .select('*, profiles!author_id(roll_number, email)', { count: 'exact' })

    // Hide unpublished/hidden posts from regular students
    if (!filters.isAdmin) {
      query = query.neq('is_published', false)
    }

    if (filters.company) query = query.eq('company_slug', filters.company)
    if (filters.year) query = query.eq('year', parseInt(filters.year))
    if (filters.role) query = query.ilike('role', `%${filters.role}%`)
    if (filters.campus) query = query.eq('campus', filters.campus)
    if (filters.branch) query = query.eq('branch', filters.branch)
    if (filters.outcome) query = query.eq('outcome', filters.outcome)

    if (filters.sort === 'helpful') {
      query = query.order('helpful_count', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (!error && data) {
      const formatted = (data as any[]).map((exp: any) => ({
        ...exp,
        is_published: exp.is_published ?? true,
        author_roll_number: exp.profiles?.roll_number || 'Amrita Student',
        vote_count: exp.helpful_count ?? 0,
        dos_donts: [
          ...(exp.dos || []).map((text: string, i: number) => ({ id: `do-${i}`, post_id: exp.id, type: 'do', text })),
          ...(exp.donts || []).map((text: string, i: number) => ({ id: `dont-${i}`, post_id: exp.id, type: 'dont', text })),
        ],
      }))
      return { posts: formatted as Experience[], total: count ?? formatted.length, page, limit }
    }

    // Fallback to legacy posts_public view if experiences table not yet run
    let legacyQuery = supabase
      .from('posts_public' as any)
      .select('*', { count: 'exact' })

    if (filters.company) legacyQuery = legacyQuery.eq('company_slug', filters.company)
    if (filters.year) legacyQuery = legacyQuery.eq('year', parseInt(filters.year))
    if (filters.role) legacyQuery = legacyQuery.ilike('role', `%${filters.role}%`)
    if (filters.campus) legacyQuery = legacyQuery.eq('campus', filters.campus)
    if (filters.branch) legacyQuery = legacyQuery.eq('branch', filters.branch)
    if (filters.outcome) legacyQuery = legacyQuery.eq('outcome', filters.outcome)

    legacyQuery = legacyQuery.range(offset, offset + limit - 1)
    const { data: legacyData, count: legacyCount } = await legacyQuery

    if (legacyData && legacyData.length > 0) {
      return { posts: legacyData as any, total: legacyCount ?? 0, page, limit }
    }

    const result = await getMockPosts(filters)
    return result as any
  } catch {
    const result = await getMockPosts(filters)
    return result as any
  }
}

export async function getExperienceById(id: string): Promise<Experience | null> {
  if (isMockMode()) {
    return (await getMockPostById(id)) as any
  }

  try {
    const supabase = await createClient()

    // 1. Try fetching from 'experiences' table
    const { data: exp, error: expError } = await supabase
      .from('experiences' as any)
      .select('*, profiles!author_id(roll_number, email)')
      .eq('id', id)
      .maybeSingle()

    if (!expError && exp) {
      const e = exp as any
      return {
        ...e,
        author_roll_number: e.profiles?.roll_number || 'Amrita Student',
        vote_count: e.helpful_count ?? 0,
        rounds: Array.isArray(e.rounds)
          ? e.rounds.map((r: any) => ({
              ...r,
              round_types: r.round_types || { name: r.round_type_name || r.round_type || 'Interview Round' },
            }))
          : [],
        dos_donts: [
          ...(e.dos || []).map((text: string, i: number) => ({ id: `do-${i}`, post_id: e.id, type: 'do' as const, text })),
          ...(e.donts || []).map((text: string, i: number) => ({ id: `dont-${i}`, post_id: e.id, type: 'dont' as const, text })),
        ],
        resources: Array.isArray(e.resources) ? e.resources : [],
      } as Experience
    }

    // 2. Fallback to legacy posts_public
    const { data: post } = await supabase
      .from('posts_public' as any)
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (post) {
      const p = post as any
      const { data: rounds } = await supabase
        .from('rounds')
        .select('*, round_types(name)')
        .eq('post_id', id)
        .order('order_index')

      const { data: dosDonts } = await supabase
        .from('dos_donts')
        .select('*')
        .eq('post_id', id)

      const { data: resources } = await supabase
        .from('resources')
        .select('*')
        .eq('post_id', id)

      return {
        ...p,
        rounds: rounds ?? [],
        dos_donts: dosDonts ?? [],
        resources: resources ?? [],
      } as Experience
    }

    return (await getMockPostById(id)) as any
  } catch {
    return (await getMockPostById(id)) as any
  }
}

export async function createExperience(
  data: any,
  userId: string
): Promise<Experience> {
  if (isMockMode()) {
    return (await createMockPost(data, userId)) as any
  }

  const supabase = await createClient()

  // Format payload for public.experiences table
  const slug = data.company_name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'company'

  const { data: inserted, error } = await (supabase.from('experiences' as any) as any)
    .insert({
      author_id: userId,
      company_name: data.company_name,
      company_slug: slug,
      role: data.role,
      year: Number(data.year),
      campus: data.campus || 'Amaravati',
      branch: data.branch,
      outcome: data.outcome,
      ctc_min: data.ctc_min ? Number(data.ctc_min) : null,
      ctc_max: data.ctc_max ? Number(data.ctc_max) : null,
      overall_experience: data.overall_experience || null,
      preparation_tips: data.preparation_tips || null,
      advice: data.advice || null,
      dos: (data.dos || []).map((d: any) => typeof d === 'string' ? d : d.content || d.text || '').filter(Boolean),
      donts: (data.donts || []).map((d: any) => typeof d === 'string' ? d : d.content || d.text || '').filter(Boolean),
      resources: data.resources || [],
      rounds: data.rounds || [],
    })
    .select('*')
    .single()

  if (error || !inserted) {
    console.error('[createExperience] Supabase insert error:', error)
    throw error ?? new Error('Failed to create experience')
  }

  const exp = inserted as any
  return {
    ...exp,
    author_roll_number: data.author_roll_number || exp.profiles?.roll_number || 'Amrita Student',
  } as Experience
}

export async function deleteExperience(id: string): Promise<boolean> {
  if (isMockMode()) {
    return deleteMockPost(id)
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.from('experiences' as any).delete().eq('id', id)
    if (error) {
      // try legacy posts table
      const { error: postErr } = await supabase.from('posts').delete().eq('id', id)
      return !postErr
    }
    return true
  } catch {
    return deleteMockPost(id)
  }
}
