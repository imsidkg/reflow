import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

const PUBLIC_ROUTES = [
  "/auth/sign-in",
  "/auth/sign-up",
  "/api/sign-in",
  "/api/sign-up",
  "/api/inngest",
];

const PROTECTED_ROUTES = ["/dashboard", "/projects", "/canvas", "/settings"];

const PROTECTED_API_ROUTES = [
  "/api/projects",
  "/api/canvas",
  "/api/auth/logout",
  "/api/auth/session",
];

function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname.startsWith(route));
}

function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return true;
  }

  return matchesRoute(pathname, PUBLIC_ROUTES);
}

function isProtectedRoute(pathname: string): boolean {
  return (
    matchesRoute(pathname, PROTECTED_ROUTES) ||
    matchesRoute(pathname, PROTECTED_API_ROUTES)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname) && !isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("access-token")?.value;

  if (!token) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const signInUrl = new URL("/auth/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const payload = verifyToken(token);

  if (!payload) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const signInUrl = new URL("/auth/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    signInUrl.searchParams.set("session_expired", "true");
    return NextResponse.redirect(signInUrl);
  }

  const response = NextResponse.next();
  response.headers.set("x-user-id", payload.userId);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
