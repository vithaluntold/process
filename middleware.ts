import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  const ip = request.headers.get("x-forwarded-for") || 
             request.headers.get("x-real-ip") || 
             "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  
  response.headers.set("x-client-ip", ip);
  response.headers.set("x-client-user-agent", userAgent);
  
  return response;
}

export const config = {
  matcher: ["/api/auth/:path*", "/api/:path*"],
};
