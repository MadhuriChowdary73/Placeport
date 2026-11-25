import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const { pathname } = request.nextUrl
  const isAuthRoute =
    pathname.startsWith('/auth') || pathname.startsWith('/api/auth')
  const isAdminLogin = pathname === '/admin/login' || pathname === '/api/admin/login'
  const isPublicLanding =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/verify') ||
    pathname === '/feed' ||
    pathname.startsWith('/api/posts') ||
    isAdminLogin ||
    isAuthRoute

  // Always let auth API and public landing pass through
  if (isAuthRoute || isAdminLogin) {
    return supabaseResponse
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase keys are missing or unconfigured placeholder
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
    if (!isPublicLanding) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Unauthenticated user trying to access admin pages
    if (!user && pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Unauthenticated user trying to access protected student pages
    if (!user && !isPublicLanding) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Admin-only routes
    if (pathname.startsWith('/admin') && user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if ((profile as any)?.role !== 'admin') {
        return NextResponse.redirect(new URL('/feed', request.url))
      }
    }
  } catch {
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    if (!isPublicLanding) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
