export { cn } from "cn"

/** Format CTC as "X – Y LPA" or "X LPA" */
export function formatCtc(min?: number | null, max?: number | null): string {
  if (!min && !max) return 'Not disclosed'
  if (min && max && min !== max) return `${min} – ${max} LPA`
  return `${min ?? max} LPA`
}

/** Mask roll number: AV.SC.U4.CSE.21001 → AV.SC.U4.CSE.21XXX or AV.SC.U4CSE21001 → AV.SC.U4CSE21XXX */
export function maskRollNumber(roll: string): string {
  return roll.replace(/\d{3}$/, 'XXX')
}

/** Relative time: "2 days ago" */
export function relativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

export const CAMPUSES = ['Amaravati', 'Amritapuri', 'Bengaluru', 'Coimbatore', 'Chennai', 'Mysuru', 'Kochi']
export const BRANCHES = ['CSE', 'AIE', 'AI&DS', 'AI&ML', 'CyberSecurity', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'BioTech', 'Chemical']
export const OUTCOMES = ['selected', 'rejected', 'waitlisted', 'no_offer'] as const
export const OUTCOME_LABELS: Record<string, string> = {
  selected:   'Selected 🎉',
  rejected:   'Rejected',
  waitlisted: 'Waitlisted',
  no_offer:   'No Offer',
}
export const OUTCOME_COLORS: Record<string, string> = {
  selected:   'text-green-600 bg-green-50',
  rejected:   'text-red-600 bg-red-50',
  waitlisted: 'text-yellow-600 bg-yellow-50',
  no_offer:   'text-gray-600 bg-gray-50',
}
