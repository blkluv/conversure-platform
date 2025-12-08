// Middleware for protected routes
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const session = request.cookies.get("session")
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/signup", "/agents/register", "/contact", "/compliance"]
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith("/api/auth"))

  // If trying to access protected route without session, redirect to login
  if (!session && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If logged in and trying to access login/signup, redirect to dashboard
  if (session && (pathname === "/login" || pathname === "/signup")) {
    // Parse session to get role
    try {
      const sessionData = JSON.parse(session.value)
      const dashboardUrl =
        sessionData.role === "COMPANY_ADMIN" || sessionData.role === "SUPER_ADMIN"
          ? "/dashboard/admin"
          : "/dashboard/agent"

      return NextResponse.redirect(new URL(dashboardUrl, request.url))
    } catch {
      // If session is invalid, allow access to login/signup
      return NextResponse.next()
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
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
