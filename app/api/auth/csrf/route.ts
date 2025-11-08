import { NextRequest, NextResponse } from "next/server";
import { generateCSRFToken, addCSRFCookie } from "@/lib/csrf";

export async function GET(request: NextRequest) {
  const token = generateCSRFToken();
  const response = NextResponse.json({ token });
  addCSRFCookie(response, token);
  return response;
}
