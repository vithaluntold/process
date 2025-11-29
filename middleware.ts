import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireCSRF } from "@/lib/csrf";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  const ip = request.headers.get("x-forwarded-for") || 
             request.headers.get("x-real-ip") || 
             "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  
  response.headers.set("x-client-ip", ip);
  response.headers.set("x-client-user-agent", userAgent);
  
  // Apply CSRF protection to specific API routes only
  // Exclude NextAuth endpoints and health checks
  const path = request.nextUrl.pathname;
  const shouldCheckCSRF = 
    path.startsWith("/api/") && 
    !path.startsWith("/api/auth/") &&  // Exclude all auth endpoints (NextAuth handles its own CSRF)
    !path.startsWith("/api/health") &&
    !path.startsWith("/api/ready") &&
    !path.startsWith("/api/db-health");
  
  if (shouldCheckCSRF) {
    const csrfError = requireCSRF(request);
    if (csrfError) {
      return csrfError;
    }
  }
  
  return response;
}

export const config = {
  matcher: ["/api/auth/:path*", "/api/:path*"],
};
