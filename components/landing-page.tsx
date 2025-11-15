"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Layers, BarChart3, Zap, Lightbulb, Shield, Activity, Eye, EyeOff, Sparkles, TrendingUp, Bot, Download } from "lucide-react";
import { Footer } from "@/components/footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "framer-motion";
import Link from "next/link";

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/csrf")
      .then(res => res.json())
      .then(data => setCsrfToken(data.token))
      .catch(err => console.error("Failed to fetch CSRF token:", err));
  }, []);

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

      setTimeout(() => {
        window.location.href = "/";
      }, 500);
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
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;

    try {
      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify({ 
          email, 
          password,
          firstName,
          lastName
        }),
      });

      const signupData = await signupRes.json();

      if (!signupRes.ok) {
        throw new Error(signupData.error || "Signup failed");
      }

      toast({
        title: "Success",
        description: "Account created! Logging you in...",
      });

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        throw new Error(loginData.error || "Auto-login failed. Please log in manually.");
      }

      setTimeout(() => {
        window.location.href = "/";
      }, 500);
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

  const features = [
    { 
      icon: Layers, 
      title: "Process Discovery", 
      description: "Automatically discover process models from event logs",
      gradient: "from-cyan-500 to-blue-500"
    },
    { 
      icon: Activity, 
      title: "Task Mining", 
      description: "AI-powered desktop activity analysis",
      gradient: "from-violet-500 to-purple-500",
      badge: "NEW"
    },
    { 
      icon: BarChart3, 
      title: "Performance Analytics", 
      description: "Track KPIs in real-time",
      gradient: "from-emerald-500 to-green-500"
    },
    { 
      icon: Zap, 
      title: "Automation", 
      description: "Identify automation opportunities",
      gradient: "from-orange-500 to-red-500"
    },
    { 
      icon: Lightbulb, 
      title: "Predictive Analytics", 
      description: "AI forecasting & anomaly detection",
      gradient: "from-yellow-500 to-amber-500"
    },
    { 
      icon: Bot, 
      title: "AI Assistant", 
      description: "Natural language process insights",
      gradient: "from-pink-500 to-rose-500"
    },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col overflow-hidden">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 dark:bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative container mx-auto px-6 py-12 lg:py-20 flex-1 flex items-center">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center max-w-7xl mx-auto w-full">
          {/* Left side - Hero Content */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-foreground space-y-10"
          >
            {/* Logo and Title */}
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-4"
              >
                <img 
                  src="/logo.png" 
                  alt="EPI-Q Logo" 
                  className="h-16 w-16 object-contain"
                />
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white">
                    EPI-Q
                  </h1>
                  <p className="text-sm text-cyan-600 dark:text-cyan-400 font-medium mt-1">
                    Enterprise Process Intelligence
                  </p>
                </div>
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="text-5xl lg:text-6xl font-bold leading-tight"
              >
                <span className="text-slate-900 dark:text-white">Transform Your Business</span>
                <br />
                <span className="bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                  with AI-Powered Insights
                </span>
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-lg lg:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl"
              >
                Unlock the power of process mining, automation, and predictive analytics. 
                Make data-driven decisions with enterprise-grade security.
              </motion.p>
            </div>

            {/* Features Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.05, duration: 0.5 }}
                  whileHover={{ y: -4 }}
                  className="group relative"
                >
                  <div className="relative p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-cyan-300 dark:hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 cursor-pointer overflow-hidden">
                    <div className="flex flex-col gap-2">
                      <div className={`w-10 h-10 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center shadow-md flex-shrink-0`}>
                        <feature.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <h3 className="font-semibold text-sm text-slate-900 dark:text-white whitespace-normal">
                            {feature.title}
                          </h3>
                          {feature.badge && (
                            <span className="text-[10px] bg-cyan-500 text-white px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                              {feature.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', wordBreak: 'normal', overflowWrap: 'normal', hyphens: 'none' }}>
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Trust Indicators */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-wrap items-center gap-3"
            >
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                <Shield className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Military-Grade Security</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                <Sparkles className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                <TrendingUp className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Fortune 500 Trusted</span>
              </div>
            </motion.div>

            {/* Desktop App Download CTA */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Link href="/downloads">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="gap-2 border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-all group"
                >
                  <Download className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
                  <span className="font-medium">Download Desktop App</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Windows • macOS • Linux</span>
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right side - Auth Card */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="lg:pl-8"
          >
            <div className="relative">
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
                            autoComplete="email"
                            className="h-11 rounded-lg border-slate-300 dark:border-slate-700 focus:border-cyan-500 dark:focus:border-cyan-500 focus:ring-cyan-500/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="login-password" className="text-slate-700 dark:text-slate-300 font-medium">Password</Label>
                          <div className="relative">
                            <Input
                              id="login-password"
                              name="password"
                              type={showLoginPassword ? "text" : "password"}
                              required
                              disabled={isLoading}
                              autoComplete="current-password"
                              placeholder="Enter your password"
                              className="h-11 rounded-lg border-slate-300 dark:border-slate-700 focus:border-cyan-500 dark:focus:border-cyan-500 focus:ring-cyan-500/20 pr-11"
                            />
                            <button
                              type="button"
                              onClick={() => setShowLoginPassword(!showLoginPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                              tabIndex={-1}
                            >
                              {showLoginPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-6 pb-8 px-8">
                        <Button 
                          type="submit" 
                          className="w-full h-11 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 rounded-lg" 
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="flex items-center gap-2">
                              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Logging in...
                            </span>
                          ) : (
                            "Log In"
                          )}
                        </Button>
                      </CardFooter>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignup}>
                      <CardContent className="space-y-4 pt-6 px-8">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="signup-firstName" className="text-slate-700 dark:text-slate-300 font-medium text-sm">
                              First Name <span className="text-slate-400 dark:text-slate-500 text-xs font-normal">(Optional)</span>
                            </Label>
                            <Input
                              id="signup-firstName"
                              name="firstName"
                              type="text"
                              placeholder="John"
                              disabled={isLoading}
                              className="h-11 rounded-lg border-slate-300 dark:border-slate-700 focus:border-cyan-500 dark:focus:border-cyan-500 focus:ring-cyan-500/20"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="signup-lastName" className="text-slate-700 dark:text-slate-300 font-medium text-sm">
                              Last Name <span className="text-slate-400 dark:text-slate-500 text-xs font-normal">(Optional)</span>
                            </Label>
                            <Input
                              id="signup-lastName"
                              name="lastName"
                              type="text"
                              placeholder="Doe"
                              disabled={isLoading}
                              className="h-11 rounded-lg border-slate-300 dark:border-slate-700 focus:border-cyan-500 dark:focus:border-cyan-500 focus:ring-cyan-500/20"
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
                            autoComplete="email"
                            className="h-11 rounded-lg border-slate-300 dark:border-slate-700 focus:border-cyan-500 dark:focus:border-cyan-500 focus:ring-cyan-500/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password" className="text-slate-700 dark:text-slate-300 font-medium">Password</Label>
                          <div className="relative">
                            <Input
                              id="signup-password"
                              name="password"
                              type={showSignupPassword ? "text" : "password"}
                              placeholder="Minimum 12 characters"
                              required
                              disabled={isLoading}
                              minLength={12}
                              autoComplete="new-password"
                              className="h-11 rounded-lg border-slate-300 dark:border-slate-700 focus:border-cyan-500 dark:focus:border-cyan-500 focus:ring-cyan-500/20 pr-11"
                            />
                            <button
                              type="button"
                              onClick={() => setShowSignupPassword(!showSignupPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                              tabIndex={-1}
                            >
                              {showSignupPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-start gap-2 mt-2 p-2.5 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700/30">
                            <Shield className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              Password must be at least 12 characters with uppercase, lowercase, number, and special character
                            </p>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-6 pb-8 px-8">
                        <Button 
                          type="submit" 
                          className="w-full h-11 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 rounded-lg" 
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="flex items-center gap-2">
                              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Creating account...
                            </span>
                          ) : (
                            "Create Account"
                          )}
                        </Button>
                      </CardFooter>
                    </form>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
