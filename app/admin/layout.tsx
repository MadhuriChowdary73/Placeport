import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Unauthenticated visitors to /admin routes are directed to /admin/login
  if (!user) {
    redirect('/admin/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profile as any)?.role !== 'admin') {
    redirect('/feed')
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Top accent bar */}
      <div className="bg-[#A41D35] h-[3.5px] w-full" />

      <header className="bg-white border-b border-[#E8E2D9] px-6 py-3.5 flex items-center justify-between shadow-xs sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <a href="/admin/users" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#A41D35] p-1.5 flex items-center justify-center">
              <img src="/amrita-logo.png" alt="Amrita" className="h-full w-auto object-contain" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#A41D35] text-lg">PlacePort Admin</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#A41D35] text-white uppercase">
                  CONSOLE
                </span>
              </div>
            </div>
          </a>

          <nav className="flex items-center gap-4 text-sm font-semibold">
            <a
              href="/admin/users"
              className="text-gray-700 hover:text-[#A41D35] px-2 py-1 rounded-lg transition"
            >
              Users
            </a>
            <a
              href="/admin/roll-numbers"
              className="text-gray-700 hover:text-[#A41D35] px-2 py-1 rounded-lg transition"
            >
              Approved Roster
            </a>
            <a
              href="/admin/reports"
              className="text-gray-700 hover:text-[#A41D35] px-2 py-1 rounded-lg transition"
            >
              Reports
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <a
            href="/feed"
            className="text-gray-600 hover:text-[#A41D35] border border-gray-200 px-3 py-1.5 rounded-xl transition"
          >
            ← View Student Feed
          </a>
          <a
            href="/api/auth/signout"
            className="text-red-600 hover:text-red-800 transition"
          >
            Sign Out
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
