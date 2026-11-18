// In-memory data store for local development and fallback when Supabase is unconfigured/placeholder.
// Provides instant (<2ms) data responses eliminating 8+ second network timeouts.

import type { Profile } from './types'
import { extractRollNumber } from './validation'

export function isMockMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return !url || url.includes('placeholder')
}

export interface MockCompany {
  id: string
  name: string
  slug: string
  logo_url: string | null
}

export interface MockRound {
  id: string
  post_id: string
  order_index: number
  round_type_id: string
  duration_minutes: number
  platform: string | null
  questions: string[]
  tips: string | null
  round_types?: { name: string }
}

export interface MockDoDont {
  id: string
  post_id: string
  type: 'do' | 'dont'
  text: string
}

export interface MockResource {
  id: string
  post_id: string
  url: string
  note: string
  helpful_count: number
}

export interface MockPost {
  id: string
  company_id: string
  company_name: string
  company_slug: string
  author_id: string
  author_roll_number: string
  author_handle: string
  display_mode: 'full' | 'masked' | 'anon'
  year: number
  role: string
  campus: string
  branch: string
  cgpa_cutoff: number | null
  ctc_min: number | null
  ctc_max: number | null
  outcome: 'selected' | 'rejected' | 'waitlisted' | 'no_offer'
  difficulty: number
  overall_experience: string
  preparation_tips: string
  advice: string
  created_at: string
  vote_count: number
  report_count: number
  rounds?: any[]
  dos_donts?: MockDoDont[]
  resources?: MockResource[]
}

const INITIAL_COMPANIES: MockCompany[] = [
  { id: 'c1', name: 'Cisco', slug: 'cisco', logo_url: 'https://logo.clearbit.com/cisco.com' },
  { id: 'c2', name: 'Amazon', slug: 'amazon', logo_url: 'https://logo.clearbit.com/amazon.com' },
  { id: 'c3', name: 'Microsoft', slug: 'microsoft', logo_url: 'https://logo.clearbit.com/microsoft.com' },
  { id: 'c4', name: 'Zoho Corporation', slug: 'zoho', logo_url: 'https://logo.clearbit.com/zoho.com' },
  { id: 'c5', name: 'TCS Digital', slug: 'tcs-digital', logo_url: 'https://logo.clearbit.com/tcs.com' },
  { id: 'c6', name: 'SAP Labs', slug: 'sap-labs', logo_url: 'https://logo.clearbit.com/sap.com' },
  { id: 'c7', name: 'Infosys', slug: 'infosys', logo_url: 'https://logo.clearbit.com/infosys.com' },
  { id: 'c8', name: 'Cognizant', slug: 'cognizant', logo_url: 'https://logo.clearbit.com/cognizant.com' },
  { id: 'c9', name: 'Intel', slug: 'intel', logo_url: 'https://logo.clearbit.com/intel.com' },
  { id: 'c10', name: 'Oracle', slug: 'oracle', logo_url: 'https://logo.clearbit.com/oracle.com' },
  { id: 'c11', name: 'Qualcomm', slug: 'qualcomm', logo_url: 'https://logo.clearbit.com/qualcomm.com' },
]

const INITIAL_ROUND_TYPES = [
  { id: 'rt1', name: 'Online Assessment' },
  { id: 'rt2', name: 'Technical Interview 1' },
  { id: 'rt3', name: 'Technical Interview 2' },
  { id: 'rt4', name: 'System Design' },
  { id: 'rt5', name: 'HR Round' },
  { id: 'rt6', name: 'Managerial Round' },
]

const INITIAL_POSTS: MockPost[] = []

// In-memory state
let companies = [...INITIAL_COMPANIES]
let posts = [...INITIAL_POSTS]
let roundTypes = [...INITIAL_ROUND_TYPES]
let saves: Array<{ id: string; post_id: string; user_id: string; created_at: string }> = []
let votes: Array<{ id: string; post_id: string; user_id: string; created_at: string }> = []
let notifications: Array<{
  id: string
  user_id: string
  type: string
  title: string
  body: string
  post_id: string | null
  created_at: string
  read_at: string | null
}> = []

// ─── PROFILES STORE ──────────────────────────────────────────────────────────

let profiles: Profile[] = []

export function getMockProfile(userId: string): Profile | null {
  return profiles.find(p => p.user_id === userId) || null
}

export function upsertMockProfile(data: {
  user_id: string
  email: string
  roll_number: string
}): Profile {
  const existing = profiles.find(p => p.user_id === data.user_id)
  if (existing) {
    existing.email = data.email
    existing.roll_number = data.roll_number
    existing.updated_at = new Date().toISOString()
    return existing
  }

  const newProfile: Profile = {
    id: `profile-${Date.now()}`,
    user_id: data.user_id,
    email: data.email,
    roll_number: data.roll_number,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  profiles.push(newProfile)
  return newProfile
}

/**
 * Derive roll number for a given user from their profile.
 * Falls back to extracting from email if no profile exists.
 */
export function getRollNumberForUser(userId: string, email?: string): string {
  const profile = getMockProfile(userId)
  if (profile) return profile.roll_number

  if (email) {
    const result = extractRollNumber(email)
    if (result.valid) return result.rollNumber
  }

  return 'Unknown'
}

// ─── COMPANIES ──────────────────────────────────────────────────────────────

export async function getMockCompanies(q?: string | null): Promise<MockCompany[]> {
  if (!q) return companies
  const lower = q.toLowerCase()
  return companies.filter(c => c.name.toLowerCase().includes(lower) || c.slug.includes(lower))
}

export async function createMockCompany(name: string): Promise<MockCompany> {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const existing = companies.find(c => c.slug === slug)
  if (existing) return existing

  const newComp: MockCompany = {
    id: `comp-${Date.now()}`,
    name,
    slug,
    logo_url: null,
  }
  companies.push(newComp)
  return newComp
}

export async function getMockRoundTypes() {
  return roundTypes
}

// ─── POSTS ──────────────────────────────────────────────────────────────────

export async function getMockPosts(filters: {
  company?: string | null
  year?: string | null
  role?: string | null
  campus?: string | null
  branch?: string | null
  outcome?: string | null
  sort?: string | null
  page?: number
  limit?: number
}) {
  let filtered = [...posts]

  if (filters.company) {
    filtered = filtered.filter(p => p.company_slug === filters.company)
  }
  if (filters.year) {
    const yr = parseInt(filters.year)
    filtered = filtered.filter(p => p.year === yr)
  }
  if (filters.role) {
    const r = filters.role.toLowerCase()
    filtered = filtered.filter(p => p.role.toLowerCase().includes(r))
  }
  if (filters.campus) {
    filtered = filtered.filter(p => p.campus.toLowerCase() === filters.campus?.toLowerCase())
  }
  if (filters.branch) {
    filtered = filtered.filter(p => p.branch.toLowerCase() === filters.branch?.toLowerCase())
  }
  if (filters.outcome) {
    filtered = filtered.filter(p => p.outcome === filters.outcome)
  }

  if (filters.sort === 'helpful') {
    filtered.sort((a, b) => {
      if ((b.vote_count || 0) !== (a.vote_count || 0)) {
        return (b.vote_count || 0) - (a.vote_count || 0)
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  } else {
    // recent (default)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  const page = filters.page || 1
  const limit = filters.limit || 20
  const total = filtered.length
  const offset = (page - 1) * limit
  const paginated = filtered.slice(offset, offset + limit)

  return {
    posts: paginated,
    total,
    page,
    limit,
  }
}

export async function getMockPostById(id: string): Promise<MockPost | null> {
  const post = posts.find(p => p.id === id)
  return post || null
}

export async function createMockPost(data: any, authorId: string): Promise<MockPost> {
  const compNameInput = (data.company_name || '').trim()
  let company = companies.find(c =>
    (data.company_id && c.id === data.company_id) ||
    (compNameInput && (c.name.toLowerCase() === compNameInput.toLowerCase() || c.slug === compNameInput.toLowerCase()))
  )

  if (!company && compNameInput) {
    company = await createMockCompany(compNameInput)
  }
  if (!company) company = companies[0]

  const newPostId = `post-${Date.now()}`

  // Derive roll number from profile, never hardcode
  const authorRollNumber = getRollNumberForUser(authorId, data.author_email)

  const newPost: MockPost = {
    id: newPostId,
    company_id: company.id,
    company_name: company.name,
    company_slug: company.slug,
    author_id: authorId,
    author_roll_number: authorRollNumber,
    author_handle: data.author_handle || 'amrita_scholar',
    display_mode: data.display_mode || 'masked',
    year: data.year || new Date().getFullYear(),
    role: data.role,
    campus: data.campus || 'Amaravati',
    branch: data.branch || 'CSE',
    cgpa_cutoff: data.cgpa_cutoff || null,
    ctc_min: data.ctc_min || null,
    ctc_max: data.ctc_max || null,
    outcome: data.outcome || 'selected',
    difficulty: data.difficulty || 3,
    overall_experience: data.overall_experience || '',
    preparation_tips: data.preparation_tips || '',
    advice: data.advice || '',
    created_at: new Date().toISOString(),
    vote_count: 0,
    report_count: 0,
    rounds: (data.rounds || []).map((r: any, idx: number) => {
      const rt = roundTypes.find(t => t.id === r.round_type_id)
      return {
        ...r,
        id: `rnd-${Date.now()}-${idx}`,
        post_id: newPostId,
        order_index: idx + 1,
        round_types: r.round_types || { name: rt?.name || r.round_type_name || 'Interview Round' },
      }
    }),
    dos_donts: [
      ...(data.dos || []).filter((d: any) => {
        const text = typeof d === 'string' ? d : d?.content || d?.text || ''
        return text.trim()
      }).map((d: any, i: number) => ({
        id: `dd-do-${Date.now()}-${i}`,
        post_id: newPostId,
        type: 'do' as const,
        text: typeof d === 'string' ? d : d?.content || d?.text || '',
      })),
      ...(data.donts || []).filter((d: any) => {
        const text = typeof d === 'string' ? d : d?.content || d?.text || ''
        return text.trim()
      }).map((d: any, i: number) => ({
        id: `dd-dont-${Date.now()}-${i}`,
        post_id: newPostId,
        type: 'dont' as const,
        text: typeof d === 'string' ? d : d?.content || d?.text || '',
      })),
    ],
    resources: (data.resources || []).filter((res: any) => res.url).map((res: any, i: number) => ({
      id: `res-${Date.now()}-${i}`,
      post_id: newPostId,
      url: res.url,
      note: res.note || '',
      helpful_count: 0,
    })),
  }

  posts.unshift(newPost)
  return newPost
}

export async function deleteMockPost(id: string): Promise<boolean> {
  const idx = posts.findIndex(p => p.id === id)
  if (idx !== -1) {
    posts.splice(idx, 1)
    return true
  }
  return false
}

// ─── RESOURCES ──────────────────────────────────────────────────────────────

export async function getMockResources(companySlug?: string | null) {
  const allRes: any[] = []
  posts.forEach(p => {
    if (companySlug && p.company_slug !== companySlug) return
    ;(p.resources || []).forEach(r => {
      allRes.push({
        ...r,
        company_name: p.company_name,
        company_slug: p.company_slug,
      })
    })
  })
  allRes.sort((a, b) => (b.helpful_count || 0) - (a.helpful_count || 0))
  return allRes
}

// ─── SAVES ──────────────────────────────────────────────────────────────────

export async function getMockSaves(userId: string) {
  const userSaves = saves.filter(s => s.user_id === userId)
  return userSaves.map(s => {
    const post = posts.find(p => p.id === s.post_id)
    return {
      post_id: s.post_id,
      created_at: s.created_at,
      post: post || null,
    }
  })
}

export async function toggleMockSave(postId: string, userId: string): Promise<{ saved: boolean }> {
  const idx = saves.findIndex(s => s.post_id === postId && s.user_id === userId)
  if (idx >= 0) {
    saves.splice(idx, 1)
    return { saved: false }
  } else {
    saves.push({ id: `save-${Date.now()}`, post_id: postId, user_id: userId, created_at: new Date().toISOString() })
    return { saved: true }
  }
}

// ─── VOTES ──────────────────────────────────────────────────────────────────

export async function toggleMockVote(postId: string, userId: string): Promise<{ voted: boolean }> {
  const idx = votes.findIndex(v => v.post_id === postId && v.user_id === userId)
  const post = posts.find(p => p.id === postId)

  if (idx >= 0) {
    votes.splice(idx, 1)
    if (post) post.vote_count = Math.max(0, post.vote_count - 1)
    return { voted: false }
  } else {
    votes.push({ id: `vote-${Date.now()}`, post_id: postId, user_id: userId, created_at: new Date().toISOString() })
    if (post) post.vote_count = (post.vote_count || 0) + 1
    return { voted: true }
  }
}

// ─── NOTIFICATIONS ──────────────────────────────────────────────────────────

export async function getMockNotifications(userId: string) {
  return notifications.filter(n => n.user_id === userId)
}

export async function markMockNotificationsRead(userId: string, notificationIds?: string[]) {
  const now = new Date().toISOString()
  notifications = notifications.map(n => {
    if (n.user_id !== userId) return n
    if (!notificationIds || notificationIds.includes(n.id)) {
      return { ...n, read_at: now }
    }
    return n
  })
  return { success: true }
}

// ─── COMPANY SUMMARY ────────────────────────────────────────────────────────

export async function getMockCompanySummary(slug: string) {
  const company = companies.find(c => c.slug === slug)
  if (!company) return null

  const companyPosts = posts.filter(p => p.company_slug === slug)

  const allRounds: any[] = []
  const allDosDonts: any[] = []
  const allResources: any[] = []

  companyPosts.forEach(p => {
    (p.rounds || []).forEach(r => allRounds.push(r))
    ;(p.dos_donts || []).forEach(d => allDosDonts.push(d))
    ;(p.resources || []).forEach(res => allResources.push(res))
  })

  // Round flow pattern: group rounds by order_index
  const roundMap = new Map<number, { name: string; count: number; avg_duration: number; total_duration: number }>()
  allRounds.forEach((r: any) => {
    const idx = r.order_index
    const name = r.round_types?.name ?? 'Round'
    const duration = r.duration_minutes ?? 0
    const curr = roundMap.get(idx) ?? { name, count: 0, avg_duration: 0, total_duration: 0 }
    curr.count++
    curr.total_duration += duration
    curr.avg_duration = Math.round(curr.total_duration / curr.count)
    roundMap.set(idx, curr)
  })

  const round_flow = Array.from(roundMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([order, data]) => ({
      order,
      round_name: data.name,
      typical_duration_minutes: data.avg_duration,
      frequency: data.count,
    }))

  const ctcNumbers = companyPosts.flatMap(p => [p.ctc_min, p.ctc_max].filter((v): v is number => v !== null && v !== undefined))
  const avg_ctc = ctcNumbers.length > 0 ? ctcNumbers.reduce((a, b) => a + b, 0) / ctcNumbers.length : null

  return {
    company,
    stats: {
      total_experiences: companyPosts.length,
      selection_rate: companyPosts.length > 0
        ? Math.round((companyPosts.filter(p => p.outcome === 'selected').length / companyPosts.length) * 100)
        : 0,
      avg_difficulty: companyPosts.length > 0
        ? Math.round((companyPosts.reduce((acc, p) => acc + (p.difficulty || 3), 0) / companyPosts.length) * 10) / 10
        : null,
      avg_ctc: avg_ctc ? Math.round(avg_ctc * 10) / 10 : null,
      top_campus: companyPosts[0]?.campus ?? 'Amritapuri',
    },
    round_flow,
    dos: allDosDonts.filter((d: any) => d.type === 'do').slice(0, 5).map((d: any) => d.text),
    donts: allDosDonts.filter((d: any) => d.type === 'dont').slice(0, 5).map((d: any) => d.text),
    resources: allResources.slice(0, 5),
    posts: companyPosts,
  }
}
