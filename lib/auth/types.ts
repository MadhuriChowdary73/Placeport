export interface AuthService {
  signInWithGoogle(): Promise<{ error?: string }>
  signIn?(identifier: string, password?: string): Promise<{ ok: boolean; message?: string }>
  signUp?(identifier: string, password?: string, confirmPassword?: string): Promise<{ ok: boolean; message?: string }>
  signOut(): Promise<void>
  sendMagicLink?(email: string): Promise<{ ok: true } | { ok: false; message: string }>
}
