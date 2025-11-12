"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  BarChart3,
  Layers,
  Filter,
  PieChart,
  Zap,
  Lightbulb,
  Activity,
  Monitor,
  FileText,
  DollarSign,
  Bot,
  Target,
  FileUp,
  LinkIcon,
  GitCompare,
  Settings,
  LogOut,
  User,
  Search,
} from "lucide-react"

const navigationItems = [
  { icon: BarChart3, label: "Dashboard", href: "/", keywords: ["home", "overview"] },
  { icon: Layers, label: "Process Discovery", href: "/process-discovery", keywords: ["discover", "model", "process"] },
  { icon: Filter, label: "Conformance Checking", href: "/conformance-checking", keywords: ["conformance", "compliance", "validate"] },
  { icon: PieChart, label: "Performance Analytics", href: "/performance-analytics", keywords: ["performance", "metrics", "analytics"] },
  { icon: Zap, label: "Automation Opportunities", href: "/automation-opportunities", keywords: ["automation", "automate", "opportunities"] },
  { icon: Lightbulb, label: "Predictive Analytics", href: "/predictive-analytics", keywords: ["predict", "forecast", "anomaly"] },
  { icon: Monitor, label: "Real-Time Monitoring", href: "/monitoring", keywords: ["monitor", "realtime", "live"] },
  { icon: Activity, label: "Task Mining", href: "/task-mining", keywords: ["task", "mining", "desktop"] },
  { icon: DollarSign, label: "Cost Analysis & ROI", href: "/cost-analysis", keywords: ["cost", "roi", "savings"] },
  { icon: Target, label: "Custom KPI Builder", href: "/custom-kpis", keywords: ["kpi", "metrics", "custom"] },
  { icon: FileText, label: "Reports & Exports", href: "/reports", keywords: ["report", "export", "download"] },
  { icon: Bot, label: "AI Assistant", href: "/ai-assistant", keywords: ["ai", "assistant", "chat"] },
  { icon: FileUp, label: "Document Upload", href: "/document-upload", keywords: ["upload", "document", "file"] },
  { icon: LinkIcon, label: "API Integrations", href: "/api-integrations", keywords: ["api", "integration", "connect"] },
  { icon: Layers, label: "Digital Twin", href: "/digital-twin", keywords: ["digital", "twin", "simulation"] },
  { icon: GitCompare, label: "What-If Scenarios", href: "/scenario-analysis", keywords: ["scenario", "what-if", "compare"] },
]

const actionItems = [
  { icon: FileUp, label: "Import Data", action: "import-data" },
  { icon: Sparkles, label: "New Analysis", action: "new-analysis" },
  { icon: FileText, label: "Generate Report", action: "generate-report" },
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: User, label: "Profile", href: "/profile" },
  { icon: LogOut, label: "Logout", action: "logout" },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSelect = (callback: () => void) => {
    setOpen(false)
    callback()
  }

  const handleAction = (action: string) => {
    setOpen(false)
    switch (action) {
      case "import-data":
        break
      case "new-analysis":
        break
      case "generate-report":
        router.push("/reports")
        break
      case "logout":
        fetch("/api/auth/logout", { method: "POST" })
          .then(() => {
            window.location.href = "/"
          })
        break
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.href}
              value={`${item.label} ${item.keywords.join(" ")}`}
              onSelect={() => handleSelect(() => router.push(item.href))}
              className="cursor-pointer"
            >
              <item.icon className="mr-2 h-4 w-4 text-brand" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          {actionItems.map((item) => (
            <CommandItem
              key={item.label}
              value={item.label}
              onSelect={() =>
                item.href
                  ? handleSelect(() => router.push(item.href))
                  : handleAction(item.action!)
              }
              className="cursor-pointer"
            >
              <item.icon className="mr-2 h-4 w-4 text-brand" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}
