import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') redirect('/feed')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-red-600 text-white px-6 py-3 flex items-center gap-4">
        <span className="font-black text-lg">PlacePort Admin</span>
        <nav className="flex gap-4 text-sm">
          <a href="/admin/reports" className="hover:underline">Reports</a>
          <a href="/admin/users"   className="hover:underline">Users</a>
        </nav>
        <a href="/feed" className="ml-auto text-xs opacity-70 hover:opacity-100">← Back to app</a>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
