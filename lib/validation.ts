import {
  ALLOWED_EMAIL_DOMAIN,
  ALLOWED_BRANCHES,
  ALLOWED_CAMPUSES,
  ALLOWED_BATCH_YEARS,
} from './config'

function getAdminEmail(): string {
  return (typeof process !== 'undefined' ? process.env?.ADMIN_EMAIL || '' : '').trim().toLowerCase()
}

/**
 * Validate and normalize a student roll number.
 * Format: av.sc.u4<branch><yy><nnn>
 * Example: av.sc.u4cse24001
 */
export function validateRollNumber(input: string): {
  valid: boolean
  error?: string
  rollNumber?: string
  branch?: string
  batchYear?: number
  serial?: string
} {
  const clean = (input || '').trim().toLowerCase()

  if (!clean) {
    return { valid: false, error: 'Roll number is required' }
  }

  // Admin bypass
  const adminEmail = getAdminEmail()
  if (clean === 'admin' || (adminEmail && clean === adminEmail)) {
    return {
      valid: true,
      rollNumber: 'ADMIN',
      branch: 'ADMIN',
      batchYear: 24,
      serial: '000',
    }
  }

  // Matches av.sc.u4<branch><yy><nnn> with optional dots between sections
  // e.g. av.sc.u4cse24001 or av.sc.u4.cse.24.001
  const pattern = /^([a-z]{2})\.([a-z]{2})\.u4\.?([a-z]{2,4})\.?(\d{2})\.?(\d{3,})$/
  const match = pattern.exec(clean)

  if (!match) {
    return {
      valid: false,
      error: 'Invalid roll number format. Expected format: av.sc.u4<branch><yy><nnn> (e.g. av.sc.u4cse24001)',
    }
  }

  const [, campus, , branch, batchStr, serial] = match

  if (ALLOWED_CAMPUSES.length > 0 && !(ALLOWED_CAMPUSES as readonly string[]).includes(campus)) {
    return {
      valid: false,
      error: `Campus "${campus}" is not allowed. Only Amrita Amaravati (av) is supported.`,
    }
  }

  if (ALLOWED_BRANCHES.length > 0 && !(ALLOWED_BRANCHES as readonly string[]).includes(branch)) {
    return {
      valid: false,
      error: `Branch "${branch.toUpperCase()}" is not recognized. Allowed branches: ${ALLOWED_BRANCHES.join(', ').toUpperCase()}`,
    }
  }

  const batchYear = parseInt(batchStr, 10)
  if (ALLOWED_BATCH_YEARS.length > 0 && !(ALLOWED_BATCH_YEARS as readonly number[]).includes(batchYear)) {
    return {
      valid: false,
      error: `Batch year "20${batchYear}" is outside the allowed range.`,
    }
  }

  const normalized = `av.sc.u4${branch}${batchStr}${serial}`

  return {
    valid: true,
    rollNumber: normalized,
    branch: branch.toUpperCase(),
    batchYear,
    serial,
  }
}

/**
 * Validate an email address (used for admin login).
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  const trimmed = (email || '').trim().toLowerCase()

  if (!trimmed) {
    return { valid: false, error: 'Email address is required' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address' }
  }

  // Allow designated admin email
  const adminEmail = getAdminEmail()
  if (adminEmail && trimmed === adminEmail) {
    return { valid: true }
  }

  // Domain restriction for students (legacy fallback)
  const domain = trimmed.split('@')[1]?.toLowerCase()
  if (domain !== ALLOWED_EMAIL_DOMAIN) {
    return { valid: false, error: 'Please use your Amrita student email' }
  }

  return { valid: true }
}

export interface ParsedRollNumber {
  rollNumber: string
  branch: string
  batchYear: number
  serial: string
}

/**
 * Parse an Amrita Amaravati student email local part or roll number.
 */
export function parseRollNumber(emailOrRoll: string): ParsedRollNumber | null {
  const clean = (emailOrRoll || '').trim().toLowerCase()
  const adminEmail = getAdminEmail()
  if ((adminEmail && clean === adminEmail) || clean === 'admin') {
    return {
      rollNumber: 'ADMIN',
      branch: 'ADMIN',
      batchYear: 24,
      serial: '000',
    }
  }

  const local = clean.includes('@') ? clean.split('@')[0] : clean
  if (!local) return null

  const upper = local.toUpperCase()
  const pattern = /^([A-Z]{2})\.SC\.U4\.?([A-Z]{2,4})\.?(\d{2})(\d{3,})$/
  const match = pattern.exec(upper)
  if (!match) return null

  const [, campus, branch, batchYearStr, serial] = match
  if (ALLOWED_CAMPUSES.length > 0 && !(ALLOWED_CAMPUSES as readonly string[]).includes(campus.toLowerCase())) {
    return null
  }

  const rollNumber = `${campus}.SC.U4${branch}${batchYearStr}${serial}`

  return {
    rollNumber,
    branch,
    batchYear: parseInt(batchYearStr, 10),
    serial,
  }
}

export type GoogleAccountCheckResult =
  | {
      allowed: true
      isAdmin: boolean
      rollNumber: string
      branch: string
      batchYear: number
    }
  | {
      allowed: false
      reason: 'domain_not_allowed' | 'invalid_roll_number'
    }

/**
 * Pure server-side allow/deny check for Google OAuth accounts.
 * Allows only the configured admin email or Amrita Amaravati student emails
 * with a valid Amaravati campus roll number.
 */
export function checkAllowedGoogleAccount(
  email: string,
  adminEmail?: string | null
): GoogleAccountCheckResult {
  const cleanEmail = (email || '').trim().toLowerCase()
  const cleanAdmin = (adminEmail ?? getAdminEmail()).trim().toLowerCase()

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { allowed: false, reason: 'domain_not_allowed' }
  }

  if (cleanAdmin && cleanEmail === cleanAdmin) {
    return {
      allowed: true,
      isAdmin: true,
      rollNumber: 'ADMIN',
      branch: 'ADMIN',
      batchYear: 2024,
    }
  }

  const domain = cleanEmail.split('@')[1]?.toLowerCase()
  if (domain !== ALLOWED_EMAIL_DOMAIN.toLowerCase()) {
    return { allowed: false, reason: 'domain_not_allowed' }
  }

  const parsed = parseRollNumber(cleanEmail)
  if (!parsed) {
    return { allowed: false, reason: 'invalid_roll_number' }
  }

  return {
    allowed: true,
    isAdmin: false,
    rollNumber: parsed.rollNumber,
    branch: parsed.branch,
    batchYear: 2000 + parsed.batchYear,
  }
}

/**
 * Extract and validate a roll number from an Amrita student email or roll number string.
 */
export function extractRollNumber(
  emailOrRoll: string
): { valid: true; rollNumber: string } | { valid: false; error: string } {
  const clean = (emailOrRoll || '').trim().toLowerCase()
  const adminEmail = getAdminEmail()
  if ((adminEmail && clean === adminEmail) || clean === 'admin') {
    return { valid: true, rollNumber: 'ADMIN' }
  }

  const local = clean.includes('@') ? clean.split('@')[0] : clean
  if (!local) {
    return { valid: false, error: "We couldn't read a roll number from this email." }
  }

  const upper = local.toUpperCase()

  const compactPattern = /^([A-Z]{2})\.([A-Z]{2})\.U4([A-Z]{2,4})(\d{2})(\d{3,})$/
  const dottedPattern  = /^([A-Z]{2})\.([A-Z]{2})\.U4\.([A-Z]{2,4})\.(\d{2})(\d{3,})$/

  let match = dottedPattern.exec(upper) || compactPattern.exec(upper)
  if (!match) {
    return { valid: false, error: "We couldn't read a roll number from this email." }
  }

  const [, campus, school, branch, batch, seq] = match
  const normalized = `${campus}.${school}.U4.${branch}.${batch}${seq}`

  return { valid: true, rollNumber: normalized }
}
