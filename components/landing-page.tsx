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
          name: `${firstName} ${lastName}`.trim()
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-white space-y-8">
            <div className="flex items-center gap-3 mb-8">
              <Layers className="h-12 w-12 text-[#11c1d6]" />
              <h1 className="text-5xl font-bold">EPI X-Ray</h1>
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

          <div>
            <Card className="shadow-2xl border-slate-700">
              <Tabs defaultValue="login" className="w-full">
                <CardHeader>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>
                </CardHeader>

                <TabsContent value="login">
                  <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          name="email"
                          type="email"
                          placeholder="you@company.com"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                          id="login-password"
                          name="password"
                          type="password"
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button type="submit" className="w-full bg-[#11c1d6] hover:bg-[#0da5b8]" disabled={isLoading}>
                        {isLoading ? "Logging in..." : "Log In"}
                      </Button>
                    </CardFooter>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup}>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-firstName">First Name</Label>
                          <Input
                            id="signup-firstName"
                            name="firstName"
                            type="text"
                            placeholder="John"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-lastName">Last Name</Label>
                          <Input
                            id="signup-lastName"
                            name="lastName"
                            type="text"
                            placeholder="Doe"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          name="email"
                          type="email"
                          placeholder="you@company.com"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          name="password"
                          type="password"
                          placeholder="At least 12 characters"
                          required
                          disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground">
                          Must be at least 12 characters long
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button type="submit" className="w-full bg-[#11c1d6] hover:bg-[#0da5b8]" disabled={isLoading}>
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
