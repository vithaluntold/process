"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Layers, BarChart3, Zap, Lightbulb, Shield, Activity, Eye, EyeOff, Sparkles, TrendingUp, Bot } from "lucide-react";
import { Footer } from "@/components/footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "framer-motion";

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
    <div className="relative min-h-screen bg-gradient-to-br from-background via-muted/20 to-background dark:from-[#0a1929] dark:via-[#1e3a5f] dark:to-[#0a1929] flex flex-col overflow-hidden">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Animated background gradient mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="relative container mx-auto px-4 py-12 lg:py-16 flex-1 flex items-center">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto w-full">
          {/* Left side - Hero Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-foreground space-y-8"
          >
            {/* Logo and Title */}
            <div className="space-y-6">
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-4"
              >
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-2xl">
                    <Layers className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent">
                    EPI X-Ray
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
                    <span className="text-sm text-cyan-300 font-medium">Enterprise Process Intelligence</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-4xl lg:text-5xl font-bold leading-tight text-foreground"
              >
                Transform Your Business
                <span className="block bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                  with AI-Powered Insights
                </span>
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-xl text-muted-foreground leading-relaxed"
              >
                Unlock the power of process mining, automation, and predictive analytics. 
                Make data-driven decisions with enterprise-grade security.
              </motion.p>
            </div>

            {/* Features Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="group relative"
                >
                  <div className="relative p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 bg-gradient-to-br ${feature.gradient} rounded-lg shadow-lg group-hover:shadow-xl transition-shadow`}>
                        <feature.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm group-hover:text-cyan-300 transition-colors">
                            {feature.title}
                          </h3>
                          {feature.badge && (
                            <span className="text-xs bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-2 py-0.5 rounded-full font-medium animate-pulse">
                              {feature.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors line-clamp-2">
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
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-wrap items-center gap-4 pt-4"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <Shield className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-slate-300">Military-Grade Security</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-slate-300">GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-slate-300">Fortune 500 Trusted</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right side - Auth Card */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:pl-8"
          >
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
              
              <Card className="relative shadow-2xl border-white/20 bg-slate-900/80 backdrop-blur-xl rounded-3xl overflow-hidden">
                <Tabs defaultValue="login" className="w-full">
                  <CardHeader className="space-y-6 pb-6">
                    <div className="text-center space-y-3">
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                        Welcome Back
                      </h2>
                      <p className="text-sm text-slate-400">
                        Sign in to access your process intelligence dashboard
                      </p>
                    </div>
                    <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border border-slate-700/50 p-1 rounded-xl">
                      <TabsTrigger 
                        value="login" 
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 rounded-lg transition-all duration-200"
                      >
                        Login
                      </TabsTrigger>
                      <TabsTrigger 
                        value="signup" 
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 rounded-lg transition-all duration-200"
                      >
                        Sign Up
                      </TabsTrigger>
                    </TabsList>
                  </CardHeader>

                  <TabsContent value="login">
                    <form onSubmit={handleLogin}>
                      <CardContent className="space-y-5 pt-6">
                        <div className="space-y-2">
                          <Label htmlFor="login-email" className="text-slate-200 font-medium">Email Address</Label>
                          <Input
                            id="login-email"
                            name="email"
                            type="email"
                            placeholder="you@company.com"
                            required
                            disabled={isLoading}
                            autoComplete="email"
                            className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 h-12 rounded-xl transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="login-password" className="text-slate-200 font-medium">Password</Label>
                          <div className="relative">
                            <Input
                              id="login-password"
                              name="password"
                              type={showLoginPassword ? "text" : "password"}
                              required
                              disabled={isLoading}
                              autoComplete="current-password"
                              placeholder="Enter your password"
                              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 h-12 rounded-xl pr-12 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowLoginPassword(!showLoginPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                              tabIndex={-1}
                            >
                              {showLoginPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-6 pb-8">
                        <Button 
                          type="submit" 
                          className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-300 rounded-xl text-base" 
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="flex items-center gap-2">
                              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
                      <CardContent className="space-y-5 pt-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="signup-firstName" className="text-slate-200 font-medium">
                              First Name <span className="text-slate-500 text-xs font-normal">(Optional)</span>
                            </Label>
                            <Input
                              id="signup-firstName"
                              name="firstName"
                              type="text"
                              placeholder="John"
                              disabled={isLoading}
                              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 h-11 rounded-xl transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="signup-lastName" className="text-slate-200 font-medium">
                              Last Name <span className="text-slate-500 text-xs font-normal">(Optional)</span>
                            </Label>
                            <Input
                              id="signup-lastName"
                              name="lastName"
                              type="text"
                              placeholder="Doe"
                              disabled={isLoading}
                              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 h-11 rounded-xl transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-email" className="text-slate-200 font-medium">Email Address</Label>
                          <Input
                            id="signup-email"
                            name="email"
                            type="email"
                            placeholder="you@company.com"
                            required
                            disabled={isLoading}
                            autoComplete="email"
                            className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 h-12 rounded-xl transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password" className="text-slate-200 font-medium">Password</Label>
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
                              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 h-12 rounded-xl pr-12 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowSignupPassword(!showSignupPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                              tabIndex={-1}
                            >
                              {showSignupPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-start gap-2 mt-2 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                            <Shield className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Password must be at least 12 characters with uppercase, lowercase, number, and special character
                            </p>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-6 pb-8">
                        <Button 
                          type="submit" 
                          className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-300 rounded-xl text-base" 
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="flex items-center gap-2">
                              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
