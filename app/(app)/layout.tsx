import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_EMAIL } from '@/lib/config'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Fetch profile to get role and roll_number
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, roll_number')
    .eq('id', user.id)
    .single()

  const userEmail = (user.email || '').toLowerCase()
  const isAdmin = (profile as any)?.role === 'admin' || userEmail === ADMIN_EMAIL.toLowerCase()
  const name = user.user_metadata?.full_name || user.user_metadata?.name || ''
  const rollNumber = (profile as any)?.roll_number || userEmail.split('@')[0]
  const displayLabel = isAdmin
    ? `Administrator (${ADMIN_EMAIL})`
    : name
    ? `${name} (${rollNumber.toUpperCase()})`
    : `Student (${rollNumber.toUpperCase()})`

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-gray-900 flex flex-col justify-between">
      <div>
        <Nav isAdmin={isAdmin} displayLabel={displayLabel} />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
      </div>

      <footer className="border-t border-[#E8E2D9] bg-white py-6 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/amrita-logo.png" alt="Amrita Logo" className="h-6 w-auto object-contain rounded" />
            <span className="text-[15px] font-semibold text-gray-800 tracking-tight">
              Amrita Vishwa Vidyapeetham • Amaravati Campus
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-[14px] text-gray-500 italic font-normal">श्रद्धावान् लभते ज्ञानम्</span>
          </div>
          <div className="text-[14px] text-gray-500 font-medium">
            PlacePort — Amaravati Campus Placement Portal
          </div>
        </div>
      </footer>
    </div>
  )
}

function Nav({ isAdmin, displayLabel }: { isAdmin: boolean; displayLabel: string }) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#E8E2D9] shadow-xs">
      {/* Top accent stripe — MyAmrita identity bar */}
      <div className="bg-[#A41D35] h-[3.5px] w-full" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-[68px] flex items-center justify-between">
        {/* Logo & Brand */}
        <a href="/feed" className="flex items-center gap-3.5 group">
          <div className="h-11 w-11 rounded-xl bg-[#A41D35] p-2 flex items-center justify-center shadow-xs">
            <img src="/amrita-logo.png" alt="Amrita" className="h-full w-auto object-contain" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-[23px] font-bold text-[#A41D35] tracking-tight group-hover:text-[#8A152A] transition">
                PlacePort
              </span>
              <span className="text-[11px] font-bold tracking-widest px-2 py-[2px] rounded-md bg-[#FDF2F4] text-[#A41D35] border border-[#F5D0D7] uppercase">
                AMARAVATI
              </span>
              {isAdmin && (
                <span className="text-[11px] font-extrabold tracking-wider px-2 py-[2px] rounded-md bg-[#A41D35] text-white uppercase shadow-xs">
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-[13px] text-gray-500 font-semibold tracking-wide">
              {displayLabel}
            </p>
          </div>
        </a>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          <a href="/feed"          className="text-[15px] font-medium text-gray-700 hover:text-[#A41D35] transition py-1">Feed</a>
          <a href="/resources"     className="text-[15px] font-medium text-gray-700 hover:text-[#A41D35] transition py-1">Resources</a>
          <a href="/saved"         className="text-[15px] font-medium text-gray-700 hover:text-[#A41D35] transition py-1">Saved</a>
          <a href="/notifications" className="text-[15px] font-medium text-gray-700 hover:text-[#A41D35] transition py-1">Notifications</a>
          {isAdmin && (
            <a href="/admin/users" className="text-[14px] font-bold text-[#A41D35] hover:underline py-1">
              Admin Console →
            </a>
          )}
          <a href="/api/auth/signout" className="text-[14px] font-medium text-gray-400 hover:text-[#A41D35] transition py-1">Sign out</a>
          <a
            href="/post/new"
            className="bg-[#A41D35] text-white px-4 py-2 rounded-xl hover:bg-[#8A152A] transition text-[14px] font-bold shadow-xs flex items-center gap-1.5 tracking-wide"
          >
            <span className="text-[16px] leading-none">+</span> Share Experience
          </a>
        </nav>
      </div>
    </header>
  )
}
