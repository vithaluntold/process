import { LucideIcon } from "lucide-react"
import { ReactNode } from "react"

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  description: string
  gradient?: string
  badge?: ReactNode
}

export function PageHeader({ 
  icon: Icon, 
  title, 
  description, 
  gradient = "from-cyan-500 to-blue-600",
  badge 
}: PageHeaderProps) {
  return (
    <div className="flex items-start gap-4 pb-6 border-b">
      <div className="relative group">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity`}></div>
        <div className={`relative p-3 bg-gradient-to-br ${gradient} rounded-xl shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {badge}
        </div>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  )
}
