"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    fetch("/api/auth/csrf")
      .then((res) => res.json())
      .then((data) => setCsrfToken(data.csrfToken))
      .catch((err) => console.error("Failed to fetch CSRF token:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ email }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to process request");
        setIsLoading(false);
        return;
      }

      if (process.env.NODE_ENV === "development" && data.devToken) {
        console.log("Development mode - Reset token:", data.devToken);
        console.log("Reset URL:", `${window.location.origin}/auth/reset-password?token=${data.devToken}`);
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Password reset request error:", err);
      setError("Network error. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
        <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="space-y-3 text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">Check Your Email</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              If an account with that email exists, we&apos;ve sent you a password reset link.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                The reset link will expire in <strong>1 hour</strong>. 
                If you don&apos;t receive an email within a few minutes, please check your spam folder.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full h-11 border-slate-200 dark:border-slate-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">Reset Password</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-4 text-sm text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isLoading}
                className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-cyan-500 dark:focus:border-cyan-500 h-11"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-cyan-500/30"
              disabled={isLoading || !csrfToken}
            >
              {isLoading ? "Sending..." : !csrfToken ? "Loading..." : "Send Reset Link"}
            </Button>
            <Link href="/" className="w-full">
              <Button variant="ghost" className="w-full h-11 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
