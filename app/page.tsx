"use client";

import { useAuth } from "@/hooks/useAuth";
import LandingPage from "@/components/landing-page";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Dashboard from "@/components/dashboard-client";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    if (user && !isLoading) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  // If user is authenticated, show dashboard
  if (user) {
    return <Dashboard />;
  }

  // If not authenticated, show landing page
  return <LandingPage />;
}
