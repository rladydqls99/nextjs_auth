import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")
  const refreshToken = request.cookies.get("refreshToken")

  // Check if user is trying to access protected routes
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!accessToken || !refreshToken) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  // Redirect authenticated users away from login page
  if (request.nextUrl.pathname === "/login") {
    if (accessToken && refreshToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
}
