/** Shared domain types used across service layers and components. */

export interface Profile {
  id: string
  user_id: string
  email: string
  roll_number: string
  created_at: string
  updated_at: string
}

export interface Round {
  id?: string
  post_id?: string
  order_index: number
  round_type_id?: string
  round_type_name?: string
  duration_minutes?: number
  platform?: string | null
  questions?: string | string[]
  tips?: string | null
  difficulty?: number
  round_types?: { name: string }
}

export interface DoDont {
  id: string
  post_id: string
  type: 'do' | 'dont'
  text: string
}

export interface Resource {
  id: string
  post_id: string
  url: string
  note: string
  helpful_count: number
}

export interface Experience {
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
  rounds?: Round[]
  dos_donts?: DoDont[]
  resources?: Resource[]
}
