import {
  isMockMode,
  getMockPosts,
  getMockPostById,
  createMockPost,
  deleteMockPost,
} from '../mockStore'
import { createClient } from '../supabase/server'
import type { Experience } from '../types'
import { maskRollNumber } from '../utils'

function getDisplayRoll(exp: any): string {
  const mode = (exp.display_mode || '').toLowerCase()
  if (mode === 'roll') {
    return (exp.author_roll_number || exp.profiles?.roll_number || 'Amrita Student').toUpperCase()
  }
  // Any other mode (name, masked, anon, etc.) falls back to Name
  const name = exp.author_name || exp.profiles?.full_name
  if (name && name.trim()) return name.trim()
  return (exp.author_roll_number || exp.profiles?.roll_number || 'Amrita Student')
}

function extractMeta(exp: any) {
  let meta: any = null
  if (Array.isArray(exp?.resources)) {
    const metaRes = exp.resources.find((r: any) => r && r.url === 'placeport://meta')
    if (metaRes?.note) {
      try { meta = JSON.parse(metaRes.note) } catch {}
    }
  }
  const display_mode = exp?.display_mode || meta?.display_mode || exp?.profiles?.display_mode || 'name'
  const author_name = exp?.author_name || meta?.author_name || exp?.profiles?.full_name || null
  const author_roll_number = exp?.author_roll_number || meta?.author_roll_number || exp?.profiles?.roll_number || null
  const project_title = exp?.project_title || meta?.project_title || null
  const project_rating = exp?.project_rating ?? meta?.project_rating ?? null
  const is_published = exp?.is_published ?? meta?.is_published ?? true

  return { display_mode, author_name, author_roll_number, project_title, project_rating, is_published }
}

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
      .select('*, profiles!author_id(roll_number, full_name, email, display_mode)', { count: 'exact' })

    // Hide unpublished/hidden posts from regular students
    if (!filters.isAdmin) {
      query = query.or('is_published.is.null,is_published.eq.true')
    }

    if (filters.company) query = query.eq('company_slug', filters.company)
    if (filters.year) query = query.eq('year', parseInt(filters.year))
    if (filters.role) query = query.ilike('role', `%${filters.role}%`)
    if (filters.campus) query = query.eq('campus', filters.campus)
    if (filters.branch && filters.branch !== 'all') query = query.ilike('branch', filters.branch)
    if (filters.outcome) query = query.eq('outcome', filters.outcome)

    if (filters.sort === 'helpful') {
      query = query.order('helpful_count', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    query = query.range(offset, offset + limit - 1)

    let { data, error, count } = await query

    // Resilient fallback if profiles table doesn't have display_mode/full_name
    if (error) {
      let fallbackQuery = supabase
        .from('experiences' as any)
        .select('*, profiles!author_id(roll_number, email)', { count: 'exact' })

      if (!filters.isAdmin) {
        fallbackQuery = fallbackQuery.or('is_published.is.null,is_published.eq.true')
      }
      if (filters.company) fallbackQuery = fallbackQuery.eq('company_slug', filters.company)
      if (filters.year) fallbackQuery = fallbackQuery.eq('year', parseInt(filters.year))
      if (filters.role) fallbackQuery = fallbackQuery.ilike('role', `%${filters.role}%`)
      if (filters.campus) fallbackQuery = fallbackQuery.eq('campus', filters.campus)
      if (filters.branch && filters.branch !== 'all') fallbackQuery = fallbackQuery.ilike('branch', filters.branch)
      if (filters.outcome) fallbackQuery = fallbackQuery.eq('outcome', filters.outcome)
      if (filters.sort === 'helpful') {
        fallbackQuery = fallbackQuery.order('helpful_count', { ascending: false })
      } else {
        fallbackQuery = fallbackQuery.order('created_at', { ascending: false })
      }
      fallbackQuery = fallbackQuery.range(offset, offset + limit - 1)
      const resFallback = await fallbackQuery
      if (!resFallback.error && resFallback.data) {
        data = resFallback.data
        count = resFallback.count
        error = null
      }
    }

    if (!error && data) {
      const formatted = (data as any[]).map((exp: any) => {
        const meta = extractMeta(exp)
        const cleanResources = Array.isArray(exp.resources)
          ? exp.resources.filter((r: any) => r && r.url !== 'placeport://meta')
          : []
        return {
          ...exp,
          ...meta,
          author_roll_number: getDisplayRoll({ ...exp, ...meta }),
          vote_count: exp.helpful_count ?? 0,
          resources: cleanResources,
          dos_donts: [
            ...(exp.dos || []).map((text: string, i: number) => ({ id: `do-${i}`, post_id: exp.id, type: 'do', text })),
            ...(exp.donts || []).map((text: string, i: number) => ({ id: `dont-${i}`, post_id: exp.id, type: 'dont', text })),
          ],
        }
      })
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
    let { data: exp, error: expError } = await supabase
      .from('experiences' as any)
      .select('*, profiles!author_id(roll_number, full_name, email, display_mode)')
      .eq('id', id)
      .maybeSingle()

    if (expError) {
      const fallback = await supabase
        .from('experiences' as any)
        .select('*, profiles!author_id(roll_number, email)')
        .eq('id', id)
        .maybeSingle()
      exp = fallback.data
      expError = fallback.error
    }

    if (!expError && exp) {
      const e = exp as any
      const meta = extractMeta(e)
      const cleanResources = Array.isArray(e.resources)
        ? e.resources.filter((r: any) => r && r.url !== 'placeport://meta')
        : []
      return {
        ...e,
        ...meta,
        author_roll_number: getDisplayRoll({ ...e, ...meta }),
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
        resources: cleanResources,
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

  const displayMode = data.display_mode === 'name' ? 'name' : 'roll'
  const authorName = data.author_name || null
  const authorRollNumber = data.author_roll_number || null
  const projectTitle = data.project_title || data.projectTitle || null
  const projectRating = data.project_rating ? Number(data.project_rating) : (data.projectRating ? Number(data.projectRating) : null)

  const metaItem = {
    url: 'placeport://meta',
    note: JSON.stringify({
      display_mode: displayMode,
      author_name: authorName,
      author_roll_number: authorRollNumber,
      project_title: projectTitle,
      project_rating: projectRating,
      is_published: true,
    }),
  }

  const existingResources = (data.resources || []).filter((r: any) => r && r.url !== 'placeport://meta')
  const resourcesWithMeta = [...existingResources, metaItem]

  const basePayload: any = {
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
    resources: resourcesWithMeta,
    rounds: data.rounds || [],
  }

  let inserted: any = null
  let insertError: any = null

  // Try insert with first-class columns: author_name, author_roll_number, display_mode, project_title, project_rating
  try {
    const res = await (supabase.from('experiences' as any) as any)
      .insert({
        ...basePayload,
        author_name: authorName,
        author_roll_number: authorRollNumber,
        display_mode: displayMode,
        project_title: projectTitle,
        project_rating: projectRating,
        is_published: true,
      })
      .select('*')
      .single()
    inserted = res.data
    insertError = res.error
  } catch (e: any) {
    insertError = e
  }

  // Graceful fallback to base payload (which has metadata embedded in resources)
  if (insertError || !inserted) {
    const res = await (supabase.from('experiences' as any) as any)
      .insert(basePayload)
      .select('*')
      .single()
    inserted = res.data
    insertError = res.error
  }

  if (insertError || !inserted) {
    console.error('[createExperience] Supabase insert error:', insertError)
    throw insertError ?? new Error('Failed to create experience')
  }

  const exp = inserted as any
  const calculatedDisplayName = getDisplayRoll({
    ...exp,
    display_mode: displayMode,
    author_name: authorName,
    author_roll_number: authorRollNumber,
  })

  return {
    ...exp,
    display_mode: displayMode,
    author_name: authorName,
    author_roll_number: calculatedDisplayName,
    project_title: projectTitle,
    project_rating: projectRating,
    resources: existingResources,
  } as Experience
}

export async function toggleExperiencePublishStatus(id: string): Promise<{ ok: boolean; is_published: boolean }> {
  if (isMockMode()) {
    const { toggleMockPostPublishStatus } = await import('../mockStore')
    return toggleMockPostPublishStatus(id)
  }

  const supabase = await createClient()

  // 1. Fetch current post
  const { data: currentPost, error: fetchErr } = await supabase
    .from('experiences' as any)
    .select('id, is_published, resources')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr || !currentPost) {
    const { toggleMockPostPublishStatus } = await import('../mockStore')
    return toggleMockPostPublishStatus(id)
  }

  const cp = currentPost as any
  const meta = extractMeta(cp)
  const current = meta.is_published
  const nextState = !current

  // Update metadata in resources as resilient fallback
  const updatedResources = Array.isArray(cp.resources) ? [...cp.resources] : []
  const metaIndex = updatedResources.findIndex((r: any) => r && r.url === 'placeport://meta')
  let existingMeta: any = {}
  if (metaIndex >= 0 && updatedResources[metaIndex]?.note) {
    try { existingMeta = JSON.parse(updatedResources[metaIndex].note) } catch {}
  }
  const newMeta = { ...existingMeta, is_published: nextState }
  if (metaIndex >= 0) {
    updatedResources[metaIndex] = { url: 'placeport://meta', note: JSON.stringify(newMeta) }
  } else {
    updatedResources.push({ url: 'placeport://meta', note: JSON.stringify(newMeta) })
  }

  // Attempt update in experiences table
  let { error: updateErr } = await (supabase.from('experiences' as any) as any)
    .update({ is_published: nextState, resources: updatedResources, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (updateErr) {
    await (supabase.from('experiences' as any) as any)
      .update({ resources: updatedResources })
      .eq('id', id)
  }

  return { ok: true, is_published: nextState }
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
