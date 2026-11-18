import {
  isMockMode,
  getMockProfile,
  upsertMockProfile,
} from '../mockStore'
import { createClient } from '../supabase/server'
import type { Profile } from '../types'

/**
 * Service layer for user profiles.
 * All database access goes through here.
 */

export async function getProfile(userId: string): Promise<Profile | null> {
  if (isMockMode()) {
    return getMockProfile(userId)
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`id.eq.${userId},user_id.eq.${userId}`)
      .maybeSingle()

    if (error || !data) return null
    return data as unknown as Profile
  } catch {
    return getMockProfile(userId)
  }
}

export async function upsertProfile(profile: {
  user_id: string
  email: string
  roll_number: string
}): Promise<Profile | null> {
  if (isMockMode()) {
    return upsertMockProfile(profile)
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: profile.user_id,
          user_id: profile.user_id,
          email: profile.email,
          roll_number: profile.roll_number,
        } as any,
        { onConflict: 'id' }
      )
      .select()
      .single()

    if (error || !data) return null
    return data as unknown as Profile
  } catch {
    return upsertMockProfile(profile)
  }
}
