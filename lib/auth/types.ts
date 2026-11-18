export interface AuthService {
  sendMagicLink(email: string): Promise<{ ok: true } | { ok: false; message: string }>
}
