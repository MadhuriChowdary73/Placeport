export interface AuthService {
  signIn(identifier: string, password: string): Promise<{ ok: true; role?: string } | { ok: false; message: string }>
  signUp(identifier: string, password: string, confirmPassword?: string): Promise<{ ok: true; role?: string } | { ok: false; message: string }>
  signOut(): Promise<void>
  sendMagicLink(email: string): Promise<{ ok: true } | { ok: false; message: string }>
}
