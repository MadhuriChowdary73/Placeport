import { ALLOWED_EMAIL_DOMAIN, ADMIN_EMAIL } from './config'

/**
 * Validate an email address.
 * - Must be non-empty and match standard format.
 * - Must belong to the allowed Amrita student domain or be the designated admin email.
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  const trimmed = email.trim()

  if (!trimmed) {
    return { valid: false, error: 'Email address is required' }
  }

  // Standard RFC 5322 compliant email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address' }
  }

  // Allow designated admin email
  if (trimmed.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return { valid: true }
  }

  // Domain restriction for students
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
 * Validate and parse an Amrita Amaravati student email local part.
 * Pattern: AV.SC.U4 + branch letters + 2-digit batch year + 3-digit serial
 * Example: av.sc.u4cse24123 becomes AV.SC.U4CSE24123
 */
export function parseRollNumber(email: string): ParsedRollNumber | null {
  const clean = email.trim().toLowerCase()
  if (clean === ADMIN_EMAIL.toLowerCase()) {
    return {
      rollNumber: 'ADMIN',
      branch: 'ADMIN',
      batchYear: 24,
      serial: '000',
    }
  }

  const local = clean.split('@')[0]
  if (!local) return null

  const upper = local.toUpperCase()
  // Matches: AV.SC.U4CSE24123 or AV.SC.U4.CSE.24123
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
 * Extract and validate a roll number from an Amrita student email.
 */
export function extractRollNumber(
  email: string
): { valid: true; rollNumber: string } | { valid: false; error: string } {
  const clean = email.trim().toLowerCase()
  if (clean === ADMIN_EMAIL.toLowerCase()) {
    return { valid: true, rollNumber: 'ADMIN' }
  }

  const local = clean.split('@')[0]
  if (!local) {
    return { valid: false, error: "We couldn't read a roll number from this email." }
  }

  const upper = local.toUpperCase()

  // Try matching the compact form: AV.SC.U4CSE21001  (dots only after campus and school)
  // or the dotted form:           AV.SC.U4.CSE.21001
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
