import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export function generateCSRFToken(): string {
  return randomBytes(32).toString("hex");
}

export function verifyCSRFToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get("csrf-token")?.value;
  const headerToken = request.headers.get("x-csrf-token");

  console.log('CSRF Debug:', {
    cookieToken: cookieToken ? '***' : 'missing',
    headerToken: headerToken ? '***' : 'missing',
    url: request.nextUrl.pathname
  });

  if (!cookieToken || !headerToken) {
    console.warn('CSRF token missing:', { 
      hasCookie: !!cookieToken, 
      hasHeader: !!headerToken,
      url: request.nextUrl.pathname 
    });
    return false;
  }

  const isValid = cookieToken === headerToken;
  if (!isValid) {
    console.warn('CSRF token mismatch for:', request.nextUrl.pathname);
  }

  return isValid;
}

export function addCSRFCookie(response: NextResponse, token?: string): void {
  const csrfToken = token || generateCSRFToken();
  response.cookies.set("csrf-token", csrfToken, {
    httpOnly: false,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  response.headers.set("X-CSRF-Token", csrfToken);
}

export function requireCSRF(request: NextRequest): NextResponse | null {
  const method = request.method.toUpperCase();
  
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null;
  }

  if (!verifyCSRFToken(request)) {
    console.error(`CSRF validation failed for ${method} ${request.nextUrl.pathname}`);
    return NextResponse.json(
      { 
        error: "Invalid or missing CSRF token",
        code: "CSRF_TOKEN_INVALID",
        message: "Please refresh the page and try again",
        url: request.nextUrl.pathname
      },
      { status: 403 }
    );
  }

  return null;
}
