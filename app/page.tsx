"use client";

import { useAuth } from "@/hooks/useAuth";
import DashboardClient from "@/components/dashboard-client";
import LandingPage from "@/components/landing-page";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#11c1d6]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <DashboardClient />;
}
