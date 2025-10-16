import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/api/auth',
    '/menu/[qrCode]',
    '/_next',
    '/favicon.ico'
  ]

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => {
    if (route.includes('[')) {
      // Handle dynamic routes
      const routePattern = route.replace(/\[.*?\]/g, '[^/]+')
      const regex = new RegExp(`^${routePattern}$`)
      return regex.test(pathname)
    }
    return pathname.startsWith(route)
  })

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Get token for protected routes
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  // Admin routes require authentication
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/api/auth/signin', request.url))
    }

    // Check if user has admin or restaurant owner role
    if (token.role !== 'ADMIN' && token.role !== 'RESTAURANT_OWNER') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // Super admin routes require admin role
  if (pathname.startsWith('/superadmin')) {
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
