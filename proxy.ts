import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "./lib/prisma";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Ignore Next.js internals or static files like favicon.ico
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml")
  ) {
    return NextResponse.next();
  }

  // Get the session token from cookies
  const token = req.cookies.get("session_id")?.value;

  const isAuthPage = pathname.startsWith("/auth");
  const isDashboard = pathname.startsWith("/dashboard");
  const isAdmin = pathname.startsWith("/dashboard/admin");

  let user: { id: string; role: string } | null = null;

  if (token) {
    try {
      // Fetch session from database using the token
      const session = await prisma.userSession.findUnique({
        where: { token },
        include: { user: true },
      });

      // Check if session exists and user is active
      user = session?.user ?? null;
    } catch (error) {
      // If DB fails, don't brick the app; treat as logged out
      user = null;
    }
  }

  // If logged in → redirect from auth pages to dashboard
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // If not logged in → redirect from dashboard/admin to login
  if (!user && (isDashboard || isAdmin)) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // If the user is not an admin and trying to access /admin, redirect to dashboard
  if (user && isAdmin && user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth/:path*", "/dashboard/:path*"],
};
