"use client";

import { AuthGuard } from "@/components/auth-guard";
import AppLayout from "@/components/app-layout";
import DashboardClient from "@/components/dashboard-client";

export default function Home() {
  return (
    <AuthGuard>
      <AppLayout>
        <DashboardClient />
      </AppLayout>
    </AuthGuard>
  );
}
