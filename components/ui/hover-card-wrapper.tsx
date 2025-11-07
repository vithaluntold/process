import { cn } from "@/lib/utils"

interface HoverCardWrapperProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
}

export function HoverCardWrapper({ children, className, glow = false }: HoverCardWrapperProps) {
  return (
    <div className={cn(
      "rounded-lg border bg-card transition-smooth hover:border-brand/50",
      glow ? "hover-glow" : "hover-lift",
      className
    )}>
      {children}
    </div>
  )
}
