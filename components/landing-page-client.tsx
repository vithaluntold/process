"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Shield } from "lucide-react";

interface LandingPageAuthProps {
  csrfToken: string;
}

export function LandingPageAuth({ csrfToken: initialCsrfToken }: LandingPageAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const { toast } = useToast();

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      toast({
        title: "Success",
        description: "Logged in successfully!",
      });

      // Redirect to dashboard (full page reload will refresh auth state)
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 300);
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": initialCsrfToken
        },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      toast({
        title: "Success",
        description: "Account created successfully! Logging you in...",
      });

      // Redirect to dashboard (full page reload will refresh auth state)
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 300);
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="relative shadow-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl overflow-hidden">
      <Tabs defaultValue="login" className="w-full">
        <CardHeader className="space-y-6 pb-6 pt-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Welcome Back
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Sign in to access your process intelligence dashboard
            </p>
          </div>
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
            <TabsTrigger 
              value="login" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 rounded-lg transition-all duration-200 font-medium"
            >
              Login
            </TabsTrigger>
            <TabsTrigger 
              value="signup" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 rounded-lg transition-all duration-200 font-medium"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <TabsContent value="login">
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4 pt-6 px-8">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-slate-700 dark:text-slate-300 font-medium">Email Address</Label>
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  required
                  disabled={isLoading}
                  className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-cyan-500 dark:focus:border-cyan-500 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-slate-700 dark:text-slate-300 font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    name="password"
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-cyan-500 dark:focus:border-cyan-500 h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                  >
                    {showLoginPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </div>
                <div className="flex justify-end">
                  <a 
                    href="/auth/forgot-password" 
                    className="text-sm text-cyan-600 hover:text-cyan-700 dark:text-cyan-500 dark:hover:text-cyan-400 font-medium transition-colors"
                  >
                    Forgot Password?
                  </a>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 px-8 pb-8">
              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-cyan-500/30 transition-all duration-200"
                disabled={isLoading || !initialCsrfToken}
              >
                {isLoading ? "Signing in..." : !initialCsrfToken ? "Loading..." : "Sign In"}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4 pt-6 px-8">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="signup-firstName" className="text-slate-700 dark:text-slate-300 font-medium text-sm">First Name</Label>
                  <Input
                    id="signup-firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    required
                    disabled={isLoading}
                    autoComplete="given-name"
                    className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-cyan-500 dark:focus:border-cyan-500 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-lastName" className="text-slate-700 dark:text-slate-300 font-medium text-sm">Last Name</Label>
                  <Input
                    id="signup-lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    required
                    disabled={isLoading}
                    autoComplete="family-name"
                    className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-cyan-500 dark:focus:border-cyan-500 h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-slate-700 dark:text-slate-300 font-medium">Email Address</Label>
                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  required
                  disabled={isLoading}
                  className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-cyan-500 dark:focus:border-cyan-500 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-slate-700 dark:text-slate-300 font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    name="password"
                    type={showSignupPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    minLength={8}
                    className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-cyan-500 dark:focus:border-cyan-500 h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                  >
                    {showSignupPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Must be at least 8 characters</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 px-8 pb-8">
              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-cyan-500/30 transition-all duration-200"
                disabled={isLoading || !initialCsrfToken}
              >
                {isLoading ? "Creating account..." : !initialCsrfToken ? "Loading..." : "Create Account"}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
