/**
 * Centralized configuration constants for PlacePort.
 * Change values here to affect the entire app.
 */

/** Campus & university details */
export const CAMPUS_CODE = 'av'
export const SCHOOL_CODE = 'sc'
export const DEGREE_CODE = 'u4'
export const ALLOWED_CAMPUSES = ['av'] as const
export const ALLOWED_BRANCHES = ['cse', 'aie', 'cce', 'ece', 'eee', 'mech'] as const
export const ALLOWED_BATCH_YEARS = [20, 21, 22, 23, 24, 25, 26, 27, 28] as const

/** Domain for synthetic student Supabase Auth accounts (never visible in UI) */
export const SYNTHETIC_EMAIL_DOMAIN = 'placeport.invalid'

/** Convert student roll number to synthetic internal Supabase email */
export function rollNumberToEmail(rollNumber: string): string {
  const clean = rollNumber.trim().toLowerCase()
  return `${clean}@${SYNTHETIC_EMAIL_DOMAIN}`
}

/** Extract student roll number from synthetic internal Supabase email */
export function emailToRollNumber(email: string): string {
  const [local] = (email || '').split('@')
  return (local || '').trim().toLowerCase()
}

/** Check if email is a synthetic PlacePort student email */
export function isSyntheticEmail(email: string): boolean {
  return (email || '').toLowerCase().endsWith(`@${SYNTHETIC_EMAIL_DOMAIN}`)
}

/** Legacy college email domain (only for validation backwards-compat) */
export const ALLOWED_EMAIL_DOMAIN = 'av.students.amrita.edu'

/** Branding */
export const APP_NAME = 'PlacePort'
export const CAMPUS_NAME = 'Amaravati'
export const UNIVERSITY_NAME = 'Amrita Vishwa Vidyapeetham'

/** Theme colours */
export const THEME = {
  primary: '#A41D35',
  primaryHover: '#8A152A',
  primaryLight: '#FDF2F4',
  primaryBorder: '#F5D0D7',
  gold: '#D4AF37',
} as const
