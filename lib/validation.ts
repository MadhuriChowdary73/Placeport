import {
  ALLOWED_EMAIL_DOMAIN,
  ADMIN_EMAIL,
  ALLOWED_BRANCHES,
  ALLOWED_CAMPUSES,
  ALLOWED_BATCH_YEARS,
} from './config'

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
  if (clean === 'admin' || clean === ADMIN_EMAIL.toLowerCase()) {
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
  if (trimmed === ADMIN_EMAIL.toLowerCase()) {
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
  if (clean === ADMIN_EMAIL.toLowerCase() || clean === 'admin') {
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
  const pattern = /^AV\.SC\.U4\.?([A-Z]{2,4})\.?(\d{2})(\d{3,})$/
  const match = pattern.exec(upper)
  if (!match) return null

  const [, branch, batchYearStr, serial] = match
  const rollNumber = `AV.SC.U4${branch}${batchYearStr}${serial}`

  return {
    rollNumber,
    branch,
    batchYear: parseInt(batchYearStr, 10),
    serial,
  }
}

/**
 * Extract and validate a roll number from an Amrita student email or roll number string.
 */
export function extractRollNumber(
  emailOrRoll: string
): { valid: true; rollNumber: string } | { valid: false; error: string } {
  const clean = (emailOrRoll || '').trim().toLowerCase()
  if (clean === ADMIN_EMAIL.toLowerCase() || clean === 'admin') {
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
