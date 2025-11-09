"use client";

import { AuthGuard } from "@/components/auth-guard";
import DashboardClient from "@/components/dashboard-client";

export default function Home() {
  return (
    <AuthGuard>
      <DashboardClient />
    </AuthGuard>
  );
}
