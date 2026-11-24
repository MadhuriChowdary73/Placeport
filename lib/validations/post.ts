import { z } from 'zod'

export const ROUND_TYPES = ['OA', 'GD', 'Aptitude', 'Coding', 'Technical', 'Case Study', 'Managerial', 'HR', 'Custom'] as const

export const roundSchema = z.object({
  id: z.string().optional(),            // temp client id for dnd-kit
  _tempId: z.string().optional(),
  round_type_id: z.string().min(1, 'Round type required').optional(),
  round_type_name: z.string().optional(),
  order_index: z.number().int().min(0).optional(),
  questions: z.union([z.string(), z.array(z.string())]).optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  duration_min: z.number().int().positive().optional(),
  duration_minutes: z.number().int().positive().optional(),
  platform: z.string().optional().nullable(),
  tips: z.string().optional().nullable(),
})

export const dosDontsSchema = z.object({
  type: z.enum(['do', 'dont']),
  content: z.string().min(1).max(500),
})

export const resourceSchema = z.object({
  url: z.string().url('Enter a valid URL'),
  note: z.string().max(300).optional().nullable(),
})

export const postSchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(100).optional(),
  company_id: z.string().optional(),
  role: z.string().min(1, 'Role is required').max(100),
  year: z.number().int().min(2015).max(new Date().getFullYear() + 1),
  campus: z.string().min(1, 'Campus is required'),
  branch: z.string().min(1, 'Branch is required'),
  author_roll_number: z.string().min(1, 'Roll number is required').max(60),
  author_name: z.string().optional().nullable(),
  outcome: z.enum(['selected', 'rejected', 'waitlisted', 'no_offer']),
  ctc_min: z.number().positive().optional().nullable(),
  ctc_max: z.number().positive().optional().nullable(),
  overall_experience: z.string().optional().nullable(),
  preparation_tips: z.string().optional().nullable(),
  advice: z.string().max(500).optional().nullable(),
  display_mode: z.enum(['roll', 'name']).default('roll'),
  project_title: z.string().max(200).optional().nullable(),
  project_rating: z.number().int().min(1).max(5).optional().nullable(),
  rounds: z.array(roundSchema).optional(),
  dos: z.array(dosDontsSchema).optional(),
  donts: z.array(dosDontsSchema).optional(),
  resources: z.array(resourceSchema).optional(),
}).refine(
  (data) => Boolean(data.company_name?.trim() || data.company_id),
  { message: 'Company name is required', path: ['company_name'] }
).refine(
  (data) => !data.ctc_min || !data.ctc_max || data.ctc_max >= data.ctc_min,
  { message: 'Max CTC must be ≥ Min CTC', path: ['ctc_max'] }
).refine(
  (data) => {
    if (data.display_mode === 'name') {
      return Boolean(data.author_name && data.author_name.trim().length > 0)
    }
    return true
  },
  { message: 'Please enter your name', path: ['author_name'] }
)

export type PostInput = z.infer<typeof postSchema>
export type RoundInput = z.infer<typeof roundSchema>
export type DosDontsInput = z.infer<typeof dosDontsSchema>
export type ResourceInput = z.infer<typeof resourceSchema>
