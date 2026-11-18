import { SupabaseAuthService } from './supabaseAuth'
import type { AuthService } from './types'

export const auth: AuthService = new SupabaseAuthService()
export * from './types'
export { SupabaseAuthService } from './supabaseAuth'
