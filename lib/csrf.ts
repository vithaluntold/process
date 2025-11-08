import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export function generateCSRFToken(): string {
  return randomBytes(32).toString("hex");
}

export function verifyCSRFToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get("csrf-token")?.value;
  const headerToken = request.headers.get("x-csrf-token");

  if (!cookieToken || !headerToken) {
    return false;
  }

  return cookieToken === headerToken;
}

export function addCSRFCookie(response: NextResponse, token?: string): void {
  const csrfToken = token || generateCSRFToken();
  response.cookies.set("csrf-token", csrfToken, {
    httpOnly: false,
    sameSite: "strict",
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
    return NextResponse.json(
      { error: "Invalid or missing CSRF token" },
      { status: 403 }
    );
  }

  return null;
}
