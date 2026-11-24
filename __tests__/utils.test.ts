import { describe, it, expect } from 'vitest'
import { maskRollNumber, formatCtc, relativeTime } from '@/lib/utils'
import {
  validateEmail,
  extractRollNumber,
  parseRollNumber,
  validateRollNumber,
} from '@/lib/validation'
import { rollNumberToEmail, emailToRollNumber, isSyntheticEmail } from '@/lib/config'
import { auth } from '@/lib/auth'

describe('maskRollNumber', () => {
  it('replaces last 3 digits with XXX for AV.SC.U4.YYY.XXXXX format', () => {
    expect(maskRollNumber('AV.SC.U4.CSE.21001')).toBe('AV.SC.U4.CSE.21XXX')
    expect(maskRollNumber('AV.SC.U4.AIE.22045')).toBe('AV.SC.U4.AIE.22XXX')
  })

  it('replaces last 3 digits with XXX for AV.SC.U4... compact format', () => {
    expect(maskRollNumber('AV.SC.U4CSE21001')).toBe('AV.SC.U4CSE21XXX')
    expect(maskRollNumber('AV.SC.U4AIE22045')).toBe('AV.SC.U4AIE22XXX')
  })
})

describe('validateRollNumber (Student Roll Number Validation)', () => {
  it('validates and normalizes valid Amaravati student roll numbers', () => {
    const res = validateRollNumber('av.sc.u4cse24001')
    expect(res.valid).toBe(true)
    expect(res.rollNumber).toBe('av.sc.u4cse24001')
    expect(res.branch).toBe('CSE')
    expect(res.batchYear).toBe(24)
  })

  it('normalizes uppercase and dotted input to standard lowercase format', () => {
    const res = validateRollNumber('AV.SC.U4.AIE.24.045')
    expect(res.valid).toBe(true)
    expect(res.rollNumber).toBe('av.sc.u4aie24045')
    expect(res.branch).toBe('AIE')
  })

  it('rejects roll numbers from non-Amaravati campuses', () => {
    const res = validateRollNumber('cb.sc.u4cse24001')
    expect(res.valid).toBe(false)
    expect(res.error).toContain('Only Amrita Amaravati (av) is supported')
  })

  it('rejects roll numbers with invalid branches', () => {
    const res = validateRollNumber('av.sc.u4xyz24001')
    expect(res.valid).toBe(false)
    expect(res.error).toContain('is not recognized')
  })

  it('rejects malformed roll number strings', () => {
    expect(validateRollNumber('').valid).toBe(false)
    expect(validateRollNumber('random_string').valid).toBe(false)
    expect(validateRollNumber('12345').valid).toBe(false)
  })
})

describe('Synthetic Email Helpers', () => {
  it('converts roll numbers to synthetic placeport.invalid emails', () => {
    expect(rollNumberToEmail('av.sc.u4cse24001')).toBe('av.sc.u4cse24001@placeport.invalid')
    expect(rollNumberToEmail('  AV.SC.U4CSE24002  ')).toBe('av.sc.u4cse24002@placeport.invalid')
  })

  it('extracts roll number from synthetic email', () => {
    expect(emailToRollNumber('av.sc.u4cse24001@placeport.invalid')).toBe('av.sc.u4cse24001')
  })

  it('identifies synthetic emails accurately', () => {
    expect(isSyntheticEmail('av.sc.u4cse24001@placeport.invalid')).toBe(true)
    expect(isSyntheticEmail('student@gmail.com')).toBe(false)
    expect(isSyntheticEmail('av.sc.u4cse24001@av.students.amrita.edu')).toBe(false)
  })
})

describe('validateEmail (Amrita email verification)', () => {
  it('accepts Amrita student email on av.students.amrita.edu domain', () => {
    const res = validateEmail('av.sc.u4cse21001@av.students.amrita.edu')
    expect(res.valid).toBe(true)
    expect(res.error).toBeUndefined()
  })

  it('rejects Gmail address with specific instruction', () => {
    const res = validateEmail('student.amrita@gmail.com')
    expect(res.valid).toBe(false)
    expect(res.error).toBe('Please use your Amrita student email')
  })

  it('rejects other non-Amrita email domains', () => {
    expect(validateEmail('user@outlook.com').error).toBe('Please use your Amrita student email')
    expect(validateEmail('engineer@tech.co').error).toBe('Please use your Amrita student email')
    expect(validateEmail('john.doe@sub.domain.org').error).toBe('Please use your Amrita student email')
  })

  it('rejects empty or whitespace-only email', () => {
    const res = validateEmail('   ')
    expect(res.valid).toBe(false)
    expect(res.error).toBe('Email address is required')
  })

  it('rejects invalid email formats', () => {
    expect(validateEmail('not-an-email').valid).toBe(false)
    expect(validateEmail('missingdomain@').valid).toBe(false)
    expect(validateEmail('@domain.com').valid).toBe(false)
    expect(validateEmail('spaces in@email.com').valid).toBe(false)
  })
})

describe('parseRollNumber', () => {
  it('parses av.sc.u4cse24123@av.students.amrita.edu correctly', () => {
    const res = parseRollNumber('av.sc.u4cse24123@av.students.amrita.edu')
    expect(res).not.toBeNull()
    expect(res?.rollNumber).toBe('AV.SC.U4CSE24123')
    expect(res?.branch).toBe('CSE')
    expect(res?.batchYear).toBe(24)
    expect(res?.serial).toBe('123')
  })

  it('parses dotted format AV.SC.U4.AIE.23045', () => {
    const res = parseRollNumber('AV.SC.U4.AIE.23045@av.students.amrita.edu')
    expect(res).not.toBeNull()
    expect(res?.rollNumber).toBe('AV.SC.U4AIE23045')
    expect(res?.branch).toBe('AIE')
    expect(res?.batchYear).toBe(23)
    expect(res?.serial).toBe('045')
  })

  it('returns null for non-Amaravati campus emails or invalid formats', () => {
    expect(parseRollNumber('cb.en.u4cse24123@av.students.amrita.edu')).toBeNull()
    expect(parseRollNumber('invalid@gmail.com')).toBeNull()
    expect(parseRollNumber('random@av.students.amrita.edu')).toBeNull()
  })
})

describe('extractRollNumber', () => {
  it('extracts and normalizes compact roll number: av.sc.u4cse21001', () => {
    const res = extractRollNumber('av.sc.u4cse21001@av.students.amrita.edu')
    expect(res.valid).toBe(true)
    if (res.valid) {
      expect(res.rollNumber).toBe('AV.SC.U4.CSE.21001')
    }
  })

  it('extracts dotted roll number: AV.SC.U4.CSE.21001', () => {
    const res = extractRollNumber('AV.SC.U4.CSE.21001@av.students.amrita.edu')
    expect(res.valid).toBe(true)
    if (res.valid) {
      expect(res.rollNumber).toBe('AV.SC.U4.CSE.21001')
    }
  })

  it('extracts roll numbers from other campuses such as Coimbatore (CB.EN)', () => {
    const res = extractRollNumber('cb.en.u4cse21050@av.students.amrita.edu')
    expect(res.valid).toBe(true)
    if (res.valid) {
      expect(res.rollNumber).toBe('CB.EN.U4.CSE.21050')
    }
  })

  it('rejects malformed local parts with specific error message', () => {
    const res = extractRollNumber('random.person@av.students.amrita.edu')
    expect(res.valid).toBe(false)
    if (!res.valid) {
      expect(res.error).toBe("We couldn't read a roll number from this email.")
    }
  })

  it('rejects emails with missing roll numbers', () => {
    const res = extractRollNumber('info@av.students.amrita.edu')
    expect(res.valid).toBe(false)
  })
})

describe('AuthService interface', () => {
  it('exports a singleton auth instance conforming to AuthService', () => {
    expect(auth).toBeDefined()
    expect(typeof auth.signInWithGoogle).toBe('function')
    expect(typeof auth.signOut).toBe('function')
  })
})

describe('formatCtc', () => {
  it('shows range when both provided', () => {
    expect(formatCtc(6, 8)).toBe('6 – 8 LPA')
  })
  it('shows single value when equal', () => {
    expect(formatCtc(7, 7)).toBe('7 LPA')
  })
  it('shows not disclosed when both null', () => {
    expect(formatCtc(null, null)).toBe('Not disclosed')
  })
})

describe('relativeTime', () => {
  it('shows "Today" for current date', () => {
    expect(relativeTime(new Date())).toBe('Today')
  })
})
