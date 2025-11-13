"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Monitor, 
  Apple, 
  Download, 
  CheckCircle2, 
  ArrowLeft,
  Github,
  HardDrive,
  Cpu,
  MemoryStick,
  FileText,
  Zap,
  Shield,
  Sparkles
} from "lucide-react";
import { Footer } from "@/components/footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "framer-motion";
import Link from "next/link";

export default function DownloadsPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("windows");

  const platforms = [
    {
      id: "windows",
      name: "Windows",
      icon: Monitor,
      version: "1.0.0",
      size: "85 MB",
      fileName: "EPI-Q-Setup-1.0.0.exe",
      downloadUrl: "https://github.com/finaceverse/epi-q/releases/latest/download/EPI-Q-Setup-1.0.0.exe",
      requirements: [
        "Windows 10 or later (64-bit)",
        "4 GB RAM minimum (8 GB recommended)",
        "500 MB available disk space",
        "Intel Core i3 or equivalent processor"
      ],
      features: [
        "Native Windows installer (NSIS)",
        "Desktop shortcuts",
        "Start menu integration",
        "Automatic updates"
      ],
      gradient: "from-blue-500 to-cyan-500",
      comingSoon: true
    },
    {
      id: "mac",
      name: "macOS",
      icon: Apple,
      version: "1.0.0",
      size: "92 MB",
      fileName: "EPI-Q-1.0.0-arm64.dmg",
      downloadUrl: "https://github.com/finaceverse/epi-q/releases/latest/download/EPI-Q-1.0.0-arm64.dmg",
      requirements: [
        "macOS 10.13 (High Sierra) or later",
        "Apple Silicon (M1/M2/M3) or Intel processor",
        "4 GB RAM minimum (8 GB recommended)",
        "500 MB available disk space"
      ],
      features: [
        "Universal binary (Intel + Apple Silicon)",
        "Native macOS experience",
        "Dark mode support",
        "Automatic updates"
      ],
      gradient: "from-gray-500 to-slate-600",
      comingSoon: true
    },
    {
      id: "linux",
      name: "Linux",
      icon: Monitor,
      version: "1.0.0",
      size: "88 MB",
      fileName: "EPI-Q-1.0.0-x64.AppImage",
      downloadUrl: "https://github.com/finaceverse/epi-q/releases/latest/download/EPI-Q-1.0.0-x64.AppImage",
      requirements: [
        "Ubuntu 20.04 or equivalent (64-bit)",
        "4 GB RAM minimum (8 GB recommended)",
        "500 MB available disk space",
        "FUSE support for AppImage"
      ],
      features: [
        "AppImage (portable, no installation)",
        "Also available: .deb and .rpm packages",
        "System tray integration",
        "Automatic updates"
      ],
      gradient: "from-orange-500 to-red-500",
      comingSoon: true
    }
  ];

  const selectedPlatformData = platforms.find(p => p.id === selectedPlatform) || platforms[0];

  const installationSteps = {
    windows: [
      "Download the EPI-Q-Setup-1.0.0.exe installer",
      "Double-click the installer file to launch setup",
      "Follow the installation wizard prompts",
      "Choose your installation directory (default recommended)",
      "Wait for installation to complete",
      "Launch EPI-Q from the desktop shortcut or Start menu",
      "Sign in with your account credentials"
    ],
    mac: [
      "Download the EPI-Q-1.0.0-arm64.dmg file",
      "Open the downloaded .dmg file",
      "Drag EPI-Q to your Applications folder",
      "Open Applications and launch EPI-Q",
      "If prompted, allow the app in System Preferences > Security",
      "Sign in with your account credentials"
    ],
    linux: [
      "Download the EPI-Q-1.0.0-x64.AppImage file",
      "Make the AppImage executable: chmod +x EPI-Q-1.0.0-x64.AppImage",
      "Run the AppImage: ./EPI-Q-1.0.0-x64.AppImage",
      "Optionally integrate with system: right-click > Integrate",
      "Sign in with your account credentials",
      "For .deb: sudo dpkg -i EPI-Q-1.0.0-amd64.deb",
      "For .rpm: sudo rpm -i EPI-Q-1.0.0-x86_64.rpm"
    ]
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-muted/20 to-background dark:from-[#0a1929] dark:via-[#1e3a5f] dark:to-[#0a1929] flex flex-col overflow-hidden">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="relative container mx-auto px-4 py-8 lg:py-12 flex-1">
        {/* Back to Home Link */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Link href="/">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 space-y-4"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-cyan-500/20 dark:bg-cyan-400/30 rounded-2xl blur-2xl group-hover:blur-3xl transition-all"></div>
              <img 
                src="/logo.png" 
                alt="EPI-Q Logo" 
                className="relative h-16 w-16 object-contain drop-shadow-lg"
              />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-cyan-700 to-blue-700 dark:from-white dark:via-cyan-100 dark:to-blue-100 bg-clip-text text-transparent">
              Download EPI-Q
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get the desktop application for Windows, macOS, and Linux. Experience enterprise process intelligence with native performance.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Badge variant="outline" className="gap-2 px-4 py-1.5 bg-white/5 border-cyan-500/30">
              <Zap className="h-3.5 w-3.5 text-cyan-500" />
              <span>Version 1.0.0</span>
            </Badge>
            <Badge variant="outline" className="gap-2 px-4 py-1.5 bg-white/5 border-cyan-500/30">
              <Shield className="h-3.5 w-3.5 text-cyan-500" />
              <span>Secure & GDPR Compliant</span>
            </Badge>
            <Badge variant="outline" className="gap-2 px-4 py-1.5 bg-white/5 border-cyan-500/30">
              <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
              <span>Cross-Platform</span>
            </Badge>
          </div>
        </motion.div>

        {/* Platform Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto"
        >
          {platforms.map((platform, index) => (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -10 }}
              onClick={() => setSelectedPlatform(platform.id)}
              className="cursor-pointer"
            >
              <Card className={`relative overflow-hidden border-2 transition-all duration-300 ${
                selectedPlatform === platform.id 
                  ? 'border-cyan-500 shadow-lg shadow-cyan-500/20' 
                  : 'border-white/10 hover:border-white/30'
              }`}>
                {/* Gradient Background */}
                <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-br ${platform.gradient} opacity-10`}></div>
                
                {platform.comingSoon && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0 animate-pulse">
                      Coming Soon
                    </Badge>
                  </div>
                )}

                <CardHeader className="relative pt-8 pb-4">
                  <div className={`mx-auto mb-4 p-4 bg-gradient-to-br ${platform.gradient} rounded-2xl shadow-xl w-fit`}>
                    <platform.icon className="h-12 w-12 text-white" />
                  </div>
                  <CardTitle className="text-center text-2xl">{platform.name}</CardTitle>
                  <CardDescription className="text-center">
                    Version {platform.version} • {platform.size}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground">Key Features:</p>
                    <ul className="space-y-1">
                      {platform.features.slice(0, 3).map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button 
                    className={`w-full gap-2 bg-gradient-to-r ${platform.gradient} hover:opacity-90 text-white shadow-lg`}
                    disabled={platform.comingSoon}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!platform.comingSoon) {
                        window.open(platform.downloadUrl, '_blank');
                      }
                    }}
                  >
                    <Download className="h-4 w-4" />
                    {platform.comingSoon ? 'Coming Soon' : `Download for ${platform.name}`}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Detailed Information Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="border-white/10 bg-slate-900/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <selectedPlatformData.icon className="h-6 w-6 text-cyan-500" />
                {selectedPlatformData.name} - Installation Guide
              </CardTitle>
              <CardDescription>
                Everything you need to know to get started with EPI-Q on {selectedPlatformData.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="requirements" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border border-slate-700/50 p-1 rounded-xl mb-6">
                  <TabsTrigger value="requirements" className="gap-2">
                    <Cpu className="h-4 w-4" />
                    Requirements
                  </TabsTrigger>
                  <TabsTrigger value="installation" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Installation
                  </TabsTrigger>
                  <TabsTrigger value="features" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Features
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="requirements" className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <HardDrive className="h-5 w-5 text-cyan-500" />
                      System Requirements
                    </h3>
                    <div className="space-y-2">
                      {selectedPlatformData.requirements.map((req, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                          <CheckCircle2 className="h-5 w-5 text-cyan-500 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                    <p className="text-sm text-cyan-300 flex items-start gap-2">
                      <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Pro Tip:</strong> For the best experience, we recommend using an SSD and at least 8 GB of RAM when analyzing large process datasets.
                      </span>
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="installation" className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-cyan-500" />
                      Step-by-Step Installation
                    </h3>
                    <div className="space-y-3">
                      {installationSteps[selectedPlatform as keyof typeof installationSteps].map((step, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                            {i + 1}
                          </div>
                          <p className="text-muted-foreground pt-1">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <p className="text-sm text-blue-300 flex items-start gap-2">
                      <Github className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        Need help? Check out our <a href="https://github.com/finaceverse/epi-q" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-200">GitHub repository</a> for detailed documentation and troubleshooting guides.
                      </span>
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="features" className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-cyan-500" />
                      Platform-Specific Features
                    </h3>
                    <div className="grid gap-3">
                      {selectedPlatformData.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
                          <CheckCircle2 className="h-5 w-5 text-cyan-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-foreground font-medium">{feature}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Shield className="h-5 w-5 text-cyan-500" />
                      Security & Privacy
                    </h3>
                    <div className="grid gap-3">
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-muted-foreground flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span><strong>End-to-end encryption</strong> for all data transmission</span>
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-muted-foreground flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span><strong>GDPR compliant</strong> with data export and deletion rights</span>
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-muted-foreground flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span><strong>Regular security updates</strong> delivered automatically</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* GitHub Releases CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center mt-12 mb-8"
        >
          <Card className="max-w-2xl mx-auto border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl">
            <CardContent className="pt-8 pb-8">
              <Github className="h-12 w-12 mx-auto mb-4 text-cyan-500" />
              <h3 className="text-xl font-semibold mb-2">Download from GitHub Releases</h3>
              <p className="text-muted-foreground mb-6">
                All desktop applications will be available on our GitHub Releases page once they're ready.
              </p>
              <Button 
                size="lg" 
                className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg"
                onClick={() => window.open('https://github.com/finaceverse/epi-q/releases', '_blank')}
              >
                <Github className="h-5 w-5" />
                View Releases on GitHub
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
