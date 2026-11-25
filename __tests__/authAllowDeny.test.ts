import { describe, it, expect } from 'vitest'
import { checkAllowedGoogleAccount } from '@/lib/validation'

describe('checkAllowedGoogleAccount', () => {
  const TEST_ADMIN = 'admin@example.com'

  it('allows valid Amaravati student email and parses roll number', () => {
    const res = checkAllowedGoogleAccount('av.sc.u4cse24106@av.students.amrita.edu', TEST_ADMIN)
    expect(res).toEqual({
      allowed: true,
      isAdmin: false,
      rollNumber: 'AV.SC.U4CSE24106',
      branch: 'CSE',
      batchYear: 2024,
    })
  })

  it('allows valid Amaravati student email with uppercase or whitespace', () => {
    const res = checkAllowedGoogleAccount('  AV.SC.U4AIE23012@AV.STUDENTS.AMRITA.EDU ', TEST_ADMIN)
    expect(res).toEqual({
      allowed: true,
      isAdmin: false,
      rollNumber: 'AV.SC.U4AIE23012',
      branch: 'AIE',
      batchYear: 2023,
    })
  })

  it('allows configured admin email', () => {
    const res = checkAllowedGoogleAccount('ADMIN@EXAMPLE.COM', TEST_ADMIN)
    expect(res).toEqual({
      allowed: true,
      isAdmin: true,
      rollNumber: 'ADMIN',
      branch: 'ADMIN',
      batchYear: 2024,
    })
  })

  it('rejects personal Gmail accounts when not admin', () => {
    const res = checkAllowedGoogleAccount('randomstudent@gmail.com', TEST_ADMIN)
    expect(res).toEqual({ allowed: false, reason: 'domain_not_allowed' })
  })

  it('rejects other Amrita campus domains', () => {
    const res = checkAllowedGoogleAccount('cb.en.u4cse24001@cb.students.amrita.edu', TEST_ADMIN)
    expect(res).toEqual({ allowed: false, reason: 'domain_not_allowed' })
  })

  it('rejects @av.students.amrita.edu email with non-Amaravati campus roll number', () => {
    const res = checkAllowedGoogleAccount('cb.sc.u4cse24001@av.students.amrita.edu', TEST_ADMIN)
    expect(res).toEqual({ allowed: false, reason: 'invalid_roll_number' })
  })

  it('rejects @av.students.amrita.edu email with invalid roll number format', () => {
    const res = checkAllowedGoogleAccount('faculty.name@av.students.amrita.edu', TEST_ADMIN)
    expect(res).toEqual({ allowed: false, reason: 'invalid_roll_number' })
  })

  it('rejects empty email', () => {
    const res = checkAllowedGoogleAccount('', TEST_ADMIN)
    expect(res).toEqual({ allowed: false, reason: 'domain_not_allowed' })
  })
})
