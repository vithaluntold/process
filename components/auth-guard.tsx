"use client";

import { useAuth } from "@/hooks/useAuth";
import LandingPage from "@/components/landing-page";
import { useEffect, useState } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const [showContent, setShowContent] = useState(false);

  // After 1 second, always show content
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Show loading for max 1 second
  if (isLoading && !showContent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user, show landing page
  if (!user) {
    return fallback || <LandingPage />;
  }

  // User is authenticated, show protected content
  return <>{children}</>;
}
