"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Layers, BarChart3, Zap, Lightbulb, Shield } from "lucide-react";

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

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

      router.push("/");
      router.refresh();
    } catch (error: any) {
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
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password,
          firstName,
          lastName
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Signup failed");
      }

      toast({
        title: "Success",
        description: "Account created! Please log in.",
      });

      setTimeout(() => {
        const loginTab = document.querySelector('[value="login"]') as HTMLElement;
        if (loginTab) loginTab.click();
      }, 500);
    } catch (error: any) {
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
    <div className="min-h-screen bg-gradient-to-br from-[#0a1929] via-[#1e3a5f] to-[#0a1929] flex items-center">
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
          <div className="text-white space-y-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-gradient-to-br from-[#11c1d6] to-[#0e9fb0] rounded-xl shadow-lg">
                <Layers className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">EPI X-Ray</h1>
            </div>
            
            <h2 className="text-4xl font-bold leading-tight">
              Process Mining & Automation Platform
            </h2>
            
            <p className="text-xl text-slate-300">
              Analyze, optimize, and automate your business processes with military-grade
              security and enterprise-level insights.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-8">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#11c1d6]/20 rounded-lg">
                  <Layers className="h-6 w-6 text-[#11c1d6]" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Process Discovery</h3>
                  <p className="text-sm text-slate-400">Automatically discover process models from event logs</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#11c1d6]/20 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-[#11c1d6]" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Performance Analytics</h3>
                  <p className="text-sm text-slate-400">Track KPIs and performance metrics in real-time</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#11c1d6]/20 rounded-lg">
                  <Zap className="h-6 w-6 text-[#11c1d6]" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Automation Opportunities</h3>
                  <p className="text-sm text-slate-400">Identify high-potential automation tasks</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#11c1d6]/20 rounded-lg">
                  <Lightbulb className="h-6 w-6 text-[#11c1d6]" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Predictive Analytics</h3>
                  <p className="text-sm text-slate-400">AI-powered forecasting and anomaly detection</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 text-sm text-slate-400">
              <Shield className="h-5 w-5 text-[#11c1d6]" />
              <span>Enterprise-grade security • GDPR compliant • Fortune 500 trusted</span>
            </div>
          </div>

          <div className="lg:pl-8">
            <Card className="shadow-2xl border-white/20 bg-transparent backdrop-blur-sm">
              <Tabs defaultValue="login" className="w-full">
                <CardHeader className="space-y-6 pb-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                    <p className="text-sm text-slate-300">Sign in to access your dashboard</p>
                  </div>
                  <TabsList className="grid w-full grid-cols-2 bg-white/10 border border-white/20">
                    <TabsTrigger value="login" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-slate-300">Login</TabsTrigger>
                    <TabsTrigger value="signup" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-slate-300">Sign Up</TabsTrigger>
                  </TabsList>
                </CardHeader>

                <TabsContent value="login">
                  <form onSubmit={handleLogin}>
                    <CardContent className="space-y-6 pt-6">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-white">Email</Label>
                        <Input
                          id="login-email"
                          name="email"
                          type="email"
                          placeholder="you@company.com"
                          required
                          disabled={isLoading}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="text-white">Password</Label>
                        <Input
                          id="login-password"
                          name="password"
                          type="password"
                          required
                          disabled={isLoading}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="pt-6">
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-[#11c1d6] to-[#0e9fb0] hover:from-[#0da5b8] hover:to-[#0c8a9a] text-white font-semibold shadow-lg shadow-[#11c1d6]/30" 
                        disabled={isLoading}
                        size="lg"
                      >
                        {isLoading ? "Logging in..." : "Log In"}
                      </Button>
                    </CardFooter>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup}>
                    <CardContent className="space-y-6 pt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-firstName" className="text-white">First Name</Label>
                          <Input
                            id="signup-firstName"
                            name="firstName"
                            type="text"
                            placeholder="John"
                            disabled={isLoading}
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-lastName" className="text-white">Last Name</Label>
                          <Input
                            id="signup-lastName"
                            name="lastName"
                            type="text"
                            placeholder="Doe"
                            disabled={isLoading}
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-white">Email</Label>
                        <Input
                          id="signup-email"
                          name="email"
                          type="email"
                          placeholder="you@company.com"
                          required
                          disabled={isLoading}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-white">Password</Label>
                        <Input
                          id="signup-password"
                          name="password"
                          type="password"
                          placeholder="At least 12 characters"
                          required
                          disabled={isLoading}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        />
                        <p className="text-xs text-slate-300">
                          Must be at least 12 characters long
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-6">
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-[#11c1d6] to-[#0e9fb0] hover:from-[#0da5b8] hover:to-[#0c8a9a] text-white font-semibold shadow-lg shadow-[#11c1d6]/30" 
                        disabled={isLoading}
                        size="lg"
                      >
                        {isLoading ? "Creating account..." : "Create Account"}
                      </Button>
                    </CardFooter>
                  </form>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
