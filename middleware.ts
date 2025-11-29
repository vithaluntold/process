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
  
  // Apply CSRF protection to API routes (except specific endpoints)
  if (request.nextUrl.pathname.startsWith("/api/") && 
      !request.nextUrl.pathname.startsWith("/api/auth/csrf") &&
      !request.nextUrl.pathname.startsWith("/api/health") &&
      !request.nextUrl.pathname.startsWith("/api/ready") &&
      !request.nextUrl.pathname.startsWith("/api/auth/[...nextauth]")) {
    
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
