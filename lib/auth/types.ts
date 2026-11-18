export interface AuthService {
  signIn(email: string, password: string): Promise<{ ok: true; role?: string } | { ok: false; message: string }>
  signUp(email: string, password: string): Promise<{ ok: true; role?: string } | { ok: false; message: string }>
  signOut(): Promise<void>
  sendMagicLink(email: string): Promise<{ ok: true } | { ok: false; message: string }>
}
