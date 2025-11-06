"use client";

import { signOut as nextAuthSignOut } from "next-auth/react";

export async function signOutWithAudit() {
  try {
    await fetch("/api/auth/audit/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to log logout audit:", error);
  } finally {
    await nextAuthSignOut({ callbackUrl: "/auth/signin" });
  }
}
