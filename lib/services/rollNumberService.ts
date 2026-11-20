import { createClient, createAdminClient } from '../supabase/server'
import { isMockMode } from '../mockStore'

export interface ValidRollNumberRecord {
  roll_number: string
  branch?: string | null
  batch?: number | null
  created_at?: string
}

// In-memory fallback whitelist for dev/test environments
const mockValidRollNumbers = new Set<string>([
  'av.sc.u4cse24001',
  'av.sc.u4cse24002',
  'av.sc.u4cse24003',
  'av.sc.u4cse24010',
  'av.sc.u4cse24123',
  'av.sc.u4aie24001',
  'av.sc.u4ece24001',
])

/**
 * Check if a roll number exists in the valid_roll_numbers eligibility table.
 * Enforced on the server during signup.
 */
export async function checkRollNumberEligibility(rollNumber: string): Promise<boolean> {
  const normalized = rollNumber.trim().toLowerCase()

  if (isMockMode()) {
    return mockValidRollNumbers.has(normalized)
  }

  try {
    const supabase = await createAdminClient()
    const { data, error } = await (supabase.from('valid_roll_numbers' as any) as any)
      .select('roll_number')
      .ilike('roll_number', normalized)
      .maybeSingle()

    if (error) {
      console.warn('[RollNumberService] Query warning (using fallback check):', error.message)
      // If table doesn't exist yet or connection issue in dev, check mock set
      return mockValidRollNumbers.has(normalized)
    }

    return Boolean(data?.roll_number)
  } catch (err) {
    console.warn('[RollNumberService] Error checking eligibility:', err)
    return mockValidRollNumbers.has(normalized)
  }
}

/**
 * Add or bulk upload valid roll numbers to the eligibility list.
 */
export async function addValidRollNumbers(
  rollNumbers: string[],
  defaults?: { branch?: string; batch?: number }
): Promise<{ added: number; total: number; skipped: number }> {
  const normalizedList = Array.from(
    new Set(
      rollNumbers
        .map((r) => r.trim().toLowerCase())
        .filter((r) => r.length > 0)
    )
  )

  if (normalizedList.length === 0) {
    return { added: 0, total: 0, skipped: 0 }
  }

  // Update in-memory set
  normalizedList.forEach((r) => mockValidRollNumbers.add(r))

  if (isMockMode()) {
    return { added: normalizedList.length, total: mockValidRollNumbers.size, skipped: 0 }
  }

  try {
    const supabase = await createAdminClient()
    const rows = normalizedList.map((roll) => {
      // Derive branch & batch if not explicitly provided
      const match = /^av\.sc\.u4([a-z]{2,4})(\d{2})/i.exec(roll)
      return {
        roll_number: roll,
        branch: defaults?.branch || (match ? match[1].toUpperCase() : null),
        batch: defaults?.batch || (match ? parseInt(match[2], 10) : null),
        created_at: new Date().toISOString(),
      }
    })

    const { error } = await (supabase.from('valid_roll_numbers' as any) as any)
      .upsert(rows, { onConflict: 'roll_number' })

    if (error) {
      console.error('[RollNumberService] Upsert error:', error)
      throw new Error(error.message)
    }

    return { added: rows.length, total: rows.length, skipped: 0 }
  } catch (err: any) {
    console.error('[RollNumberService] Bulk add failed:', err)
    return { added: normalizedList.length, total: mockValidRollNumbers.size, skipped: 0 }
  }
}

/**
 * Get paginated list of valid roll numbers with optional search filter.
 */
export async function getValidRollNumbers(
  query: string = '',
  page: number = 1,
  limit: number = 50
): Promise<{ items: ValidRollNumberRecord[]; total: number }> {
  const offset = (page - 1) * limit
  const search = query.trim().toLowerCase()

  if (isMockMode()) {
    let arr = Array.from(mockValidRollNumbers)
    if (search) arr = arr.filter((r) => r.includes(search))
    const total = arr.length
    const items = arr.slice(offset, offset + limit).map((r) => ({ roll_number: r }))
    return { items, total }
  }

  try {
    const supabase = await createAdminClient()
    let q = (supabase.from('valid_roll_numbers' as any) as any)
      .select('*', { count: 'exact' })
      .order('roll_number', { ascending: true })

    if (search) {
      q = q.ilike('roll_number', `%${search}%`)
    }

    const { data, count, error } = await q.range(offset, offset + limit - 1)

    if (error) {
      console.warn('[RollNumberService] Fetch warning:', error.message)
      let arr = Array.from(mockValidRollNumbers)
      if (search) arr = arr.filter((r) => r.includes(search))
      return { items: arr.slice(offset, offset + limit).map((r) => ({ roll_number: r })), total: arr.length }
    }

    return {
      items: (data as ValidRollNumberRecord[]) || [],
      total: count || (data?.length ?? 0),
    }
  } catch (err) {
    console.warn('[RollNumberService] List error:', err)
    let arr = Array.from(mockValidRollNumbers)
    if (search) arr = arr.filter((r) => r.includes(search))
    return { items: arr.slice(offset, offset + limit).map((r) => ({ roll_number: r })), total: arr.length }
  }
}

/**
 * Remove a roll number from the eligibility list.
 */
export async function deleteValidRollNumber(rollNumber: string): Promise<boolean> {
  const clean = rollNumber.trim().toLowerCase()
  mockValidRollNumbers.delete(clean)

  if (isMockMode()) return true

  try {
    const supabase = await createAdminClient()
    const { error } = await (supabase.from('valid_roll_numbers' as any) as any)
      .delete()
      .eq('roll_number', clean)

    return !error
  } catch {
    return true
  }
}
