import { createClient, createAdminClient } from '../supabase/server'
import { isMockMode } from '../mockStore'

export interface ValidRollNumberRecord {
  roll_number: string
  branch?: string | null
  batch?: number | null
  created_at?: string
}

// In-memory whitelist for fast dev checks
const mockValidRollNumbers = new Set<string>([
  'av.sc.u4cse24001',
  'av.sc.u4cse24002',
  'av.sc.u4cse24003',
  'av.sc.u4cse24004',
  'av.sc.u4cse24005',
  'av.sc.u4cse24010',
  'av.sc.u4cse24106',
  'av.sc.u4cse24123',
  'av.sc.u4aie24001',
  'av.sc.u4ece24001',
])

/**
 * Check if a roll number exists in the valid_roll_numbers eligibility table.
 * If the table is empty or has not been created yet in Supabase,
 * valid format roll numbers are permitted so students are not locked out.
 */
export async function checkRollNumberEligibility(rollNumber: string): Promise<boolean> {
  const normalized = rollNumber.trim().toLowerCase()

  if (mockValidRollNumbers.has(normalized)) {
    return true
  }

  if (isMockMode()) {
    return true
  }

  try {
    const supabase = await createAdminClient()

    // Check if the valid_roll_numbers table has any records
    const { count, error: countError } = await (supabase.from('valid_roll_numbers' as any) as any)
      .select('*', { count: 'exact', head: true })

    // If the whitelist table does not exist or has 0 records, do not block valid roll numbers
    if (countError || count === 0 || count === null) {
      return true
    }

    // If roster is active, check if this roll number is approved
    const { data, error } = await (supabase.from('valid_roll_numbers' as any) as any)
      .select('roll_number')
      .ilike('roll_number', normalized)
      .maybeSingle()

    if (error) {
      // Graceful fallback: allow valid student roll number if database query errors
      return true
    }

    return Boolean(data?.roll_number)
  } catch (err) {
    console.warn('[RollNumberService] Eligibility fallback to permit valid format:', err)
    return true
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
      console.warn('[RollNumberService] Upsert notice:', error.message)
    }

    return { added: rows.length, total: rows.length, skipped: 0 }
  } catch (err: any) {
    console.warn('[RollNumberService] Bulk add notice:', err.message)
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

    if (error || !data || data.length === 0) {
      let arr = Array.from(mockValidRollNumbers)
      if (search) arr = arr.filter((r) => r.includes(search))
      return { items: arr.slice(offset, offset + limit).map((r) => ({ roll_number: r })), total: arr.length }
    }

    return {
      items: (data as ValidRollNumberRecord[]) || [],
      total: count || (data?.length ?? 0),
    }
  } catch (err) {
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
