// Auto-generated / hand-synced to match supabase/complete_setup.sql
// Run after every migration: npx supabase gen types typescript > types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string | null
          email: string | null
          roll_number: string | null
          display_mode: 'name' | 'roll' | 'full' | 'masked' | 'anon'
          handle: string | null
          full_name: string | null
          campus: string | null
          branch: string | null
          batch: number | null
          batch_year: number | null
          role: 'student' | 'admin'
          status: 'pending' | 'approved' | 'blocked'
          helped_count: number
          created_at: string
          updated_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['profiles']['Row'], 'id'>> & { id: string }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      valid_roll_numbers: {
        Row: {
          roll_number: string
          branch: string | null
          batch: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['valid_roll_numbers']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['valid_roll_numbers']['Insert']>
      }
      companies: {
        Row: { id: string; name: string; slug: string; logo_url: string | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['companies']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['companies']['Insert']>
      }
      round_types: {
        Row: { id: string; name: string }
        Insert: Omit<Database['public']['Tables']['round_types']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['round_types']['Insert']>
      }
      experiences: {
        Row: {
          id: string
          author_id: string
          company_name: string
          company_slug: string
          role: string
          year: number
          campus: string
          branch: string
          outcome: 'selected' | 'rejected' | 'waitlisted' | 'no_offer'
          ctc_min: number | null
          ctc_max: number | null
          overall_experience: string | null
          preparation_tips: string | null
          advice: string | null
          dos: string[]
          donts: string[]
          resources: Json
          rounds: Json
          helpful_count: number
          display_mode: string
          author_name: string | null
          author_roll_number: string | null
          project_title: string | null
          project_rating: number | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: Pick<
          Database['public']['Tables']['experiences']['Row'],
          'author_id' | 'company_name' | 'company_slug' | 'role' | 'year' | 'branch' | 'outcome'
        > &
          Partial<Database['public']['Tables']['experiences']['Row']>
        Update: Partial<Database['public']['Tables']['experiences']['Row']>
      }
      posts: {
        Row: {
          id: string
          author_id: string
          company_id: string
          role: string
          year: number
          campus: string | null
          branch: string | null
          outcome: 'selected' | 'rejected' | 'waitlisted' | 'no_offer'
          ctc_min: number | null
          ctc_max: number | null
          advice: string | null
          is_published: boolean
          display_mode: 'name' | 'roll' | 'full' | 'masked' | 'anon' | null
          vote_count: number
          save_count: number
          created_at: string
          updated_at: string
          search_vector: unknown | null
        }
        Insert: Pick<Database['public']['Tables']['posts']['Row'], 'author_id' | 'company_id' | 'role' | 'year' | 'outcome'> &
          Partial<Omit<Database['public']['Tables']['posts']['Row'], 'author_id' | 'company_id' | 'role' | 'year' | 'outcome' | 'id' | 'vote_count' | 'save_count' | 'created_at' | 'updated_at'>>
        Update: Partial<Database['public']['Tables']['posts']['Insert']>
      }
      rounds: {
        Row: {
          id: string
          post_id: string | null
          experience_id: string | null
          round_type_id: string | null
          round_type: string | null
          order_index: number
          platform: string | null
          questions: string | null
          difficulty: number | null
          duration_min: number | null
          tips: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['rounds']['Row']>
        Update: Partial<Database['public']['Tables']['rounds']['Row']>
      }
      dos_donts: {
        Row: { id: string; post_id: string; type: 'do' | 'dont'; content: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['dos_donts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['dos_donts']['Insert']>
      }
      resources: {
        Row: { id: string; post_id: string; url: string; note: string | null; helpful_count: number; created_at: string }
        Insert: Omit<Database['public']['Tables']['resources']['Row'], 'id' | 'helpful_count' | 'created_at'>
        Update: Partial<Database['public']['Tables']['resources']['Insert']>
      }
      votes: {
        Row: { id: string; post_id: string; user_id: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['votes']['Row'], 'id' | 'created_at'>
        Update: never
      }
      saves: {
        Row: { id: string; post_id: string; experience_id: string | null; user_id: string; created_at: string }
        Insert: { post_id: string; user_id: string; experience_id?: string | null }
        Update: never
      }
      helpful_votes: {
        Row: { id: string; user_id: string; experience_id: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['helpful_votes']['Row'], 'id' | 'created_at'>
        Update: never
      }
      badges: {
        Row: { id: string; slug: string; name: string; description: string | null; icon: string | null }
        Insert: Omit<Database['public']['Tables']['badges']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['badges']['Insert']>
      }
      user_badges: {
        Row: { id: string; user_id: string; badge_id: string; awarded_at: string }
        Insert: Omit<Database['public']['Tables']['user_badges']['Row'], 'id' | 'awarded_at'>
        Update: never
      }
      reports: {
        Row: {
          id: string; post_id: string; reporter_id: string; reason: string
          status: 'pending' | 'resolved' | 'dismissed'
          reviewed_by: string | null; reviewed_at: string | null; created_at: string
        }
        Insert: Pick<Database['public']['Tables']['reports']['Row'], 'post_id' | 'reporter_id' | 'reason'>
        Update: Partial<Database['public']['Tables']['reports']['Row']>
      }
      notifications: {
        Row: { id: string; user_id: string; type: string; payload: Json; read_at: string | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
    }
    Views: {
      posts_public: {
        Row: {
          id: string
          company_id: string
          company_name: string
          company_slug: string
          role: string
          year: number
          campus: string | null
          branch: string | null
          outcome: string
          ctc_min: number | null
          ctc_max: number | null
          advice: string | null
          vote_count: number
          save_count: number
          created_at: string
          display_name: string
          display_mode: string
          author_badge_ids: string[] | null
        }
      }
      experiences_with_author: {
        Row: Database['public']['Tables']['experiences']['Row'] & {
          profile_roll_number: string | null
          profile_full_name: string | null
        }
      }
    }
    Functions: {
      award_badges: { Args: { p_user_id: string }; Returns: void }
      is_admin: { Args: Record<never, never>; Returns: boolean }
    }
    Enums: {
      display_mode: 'name' | 'roll' | 'full' | 'masked' | 'anon'
      user_role: 'student' | 'admin'
      outcome_type: 'selected' | 'rejected' | 'waitlisted' | 'no_offer'
    }
  }
}
