import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/admin', '/mypage', '/onboarding']

// Routes that require system admin role
const ADMIN_ROUTES = ['/admin']

// Routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = ['/login', '/signup']

// System admin emails (loaded from env)
const SYSTEM_ADMIN_EMAILS = (process.env.SYSTEM_ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

export default async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('http') ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return supabaseResponse
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // --- Auth Route Redirect (logged-in users should not see login/signup) ---
    if (user && AUTH_ROUTES.some(route => pathname.startsWith(route))) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    // --- Protected Route Check ---
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))

    if (isProtectedRoute && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(url)
    }

    // --- Admin Route Check (server-side enforcement) ---
    const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route))

    if (isAdminRoute && user) {
        const userEmail = user.email || ''
        if (!SYSTEM_ADMIN_EMAILS.includes(userEmail)) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is.
    // If you're creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it
    // 2. Copy over the cookies
    // 3. Change the response object to fit your needs, but avoid changing the cookies!
    // 4. Return it
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api/webhooks (webhook endpoints should not be auth-gated)
         * - store/ (public store pages for booking)
         */
        '/((?!_next/static|_next/image|favicon.ico|api/webhooks|store/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
