"use client";

import { useAuth } from "@/hooks/useAuth";
import DashboardClient from "@/components/dashboard-client";
import LandingPage from "@/components/landing-page";

export default function Home() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <DashboardClient />;
}
