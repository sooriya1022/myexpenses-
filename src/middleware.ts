import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose/jwt/verify";

const AUTH_COOKIE_NAME = "myexpense_token";
const JWT_SECRET_STRING = process.env.JWT_SECRET || "dev-secret-key-myexpense-secure-random-2026-auth";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

async function isValidToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const authenticated = await isValidToken(token);

  // Protect authenticated routes
  const protectedPaths = [
    "/dashboard",
    "/transactions",
    "/budgets",
    "/reports",
    "/settings",
  ];
  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    if (!authenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from /login and /register
  if (pathname === "/login" || pathname === "/register") {
    if (authenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/budgets/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
