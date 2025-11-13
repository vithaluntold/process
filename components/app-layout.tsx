"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  FileUp,
  Filter,
  PieChart,
  Zap,
  Lightbulb,
  Layers,
  X,
  GitCompare,
  LinkIcon,
  LogOut,
  User,
  Menu,
  Activity,
  Monitor,
  FileText,
  DollarSign,
  Bot,
  Target,
  Settings,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import { Footer } from "@/components/footer"

const navigationItems = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/process-analysis", label: "Process Analysis", icon: BarChart3 },
  { href: "/process-discovery", label: "Process Discovery", icon: Layers },
  { href: "/conformance-checking", label: "Conformance Checking", icon: Filter },
  { href: "/performance-analytics", label: "Performance Analytics", icon: PieChart },
  { href: "/automation-opportunities", label: "Automation Opportunities", icon: Zap },
  { href: "/monitoring", label: "Real-Time Monitoring", icon: Monitor },
  { href: "/predictive-analytics", label: "Predictive Analytics", icon: Lightbulb },
  { href: "/task-mining", label: "Task Mining", icon: Activity },
  { href: "/cost-analysis", label: "Cost Analysis & ROI", icon: DollarSign },
  { href: "/custom-kpis", label: "Custom KPI Builder", icon: Target },
  { href: "/reports", label: "Reports & Exports", icon: FileText },
  { href: "/ai-assistant", label: "AI Assistant", icon: Bot },
  { href: "/document-upload", label: "Document Upload", icon: FileUp },
  { href: "/api-integrations", label: "API Integrations", icon: LinkIcon },
  { href: "/digital-twin", label: "Digital Twin", icon: Layers },
  { href: "/scenario-analysis", label: "What-If Scenarios", icon: GitCompare },
  { href: "/settings", label: "Settings", icon: Settings },
]

interface AppLayoutProps {
  children: React.ReactNode
  showActions?: boolean
}

export default function AppLayout({ children, showActions = false }: AppLayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { toast } = useToast()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
          <p className="text-sm text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = '/'
      }, 100)
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      })
      window.location.href = "/"
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="EPI-Q Logo" className="h-8 w-8 object-contain" />
          <span className="text-lg font-semibold">EPI-Q</span>
        </div>
        
        {/* Desktop Horizontal Navigation */}
        <nav className="hidden md:flex items-center gap-1 ml-8">
          <Link
            href="/"
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-md transition-colors",
              pathname === "/"
                ? "text-brand bg-brand/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            Dashboard
          </Link>
          <Link
            href="/process-discovery"
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-md transition-colors",
              pathname === "/process-discovery"
                ? "text-brand bg-brand/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            Process Repository
          </Link>
          <Link
            href="/performance-analytics"
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-md transition-colors",
              pathname === "/performance-analytics"
                ? "text-brand bg-brand/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            Analytics
          </Link>
          <Link
            href="/automation-opportunities"
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-md transition-colors",
              pathname === "/automation-opportunities"
                ? "text-brand bg-brand/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            Automation
          </Link>
          <Link
            href="/api-integrations"
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-md transition-colors",
              pathname === "/api-integrations"
                ? "text-brand bg-brand/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            Integration
          </Link>
        </nav>
        
        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden ml-auto">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <div className="flex flex-col gap-4 py-4">
              <div className="font-medium text-sm">Process Intelligence</div>
              <nav className="grid gap-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer select-none transition-smooth",
                        isActive
                          ? "bg-brand/10 text-brand"
                          : "text-muted-foreground hover:bg-brand/10 hover:text-brand"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </SheetContent>
        </Sheet>

        <div className="ml-auto md:ml-4 flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden md:inline">{user?.firstName || user?.email || "User"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : user?.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="grid md:grid-cols-[240px_1fr] flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col border-r p-4 space-y-4">
          <div className="font-medium text-sm">Process Intelligence</div>
          <nav className="grid gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer select-none transition-smooth",
                    isActive
                      ? "bg-brand/10 text-brand"
                      : "text-muted-foreground hover:bg-brand/10 hover:text-brand"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex flex-1 flex-col p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
      
      <Footer />
    </div>
  )
}
