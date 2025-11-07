import { cn } from "@/lib/utils"

interface SkeletonCardProps {
  className?: string
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-6 space-y-4", className)}>
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 skeleton" />
          <div className="h-3 w-1/2 skeleton" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full skeleton" />
        <div className="h-3 w-5/6 skeleton" />
      </div>
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-10 w-10 rounded skeleton" />
          <div className="flex-1 h-10 skeleton" />
          <div className="w-24 h-10 skeleton" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-2 h-64">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex-1 skeleton" style={{ height: `${Math.random() * 100 + 50}%` }} />
        ))}
      </div>
      <div className="flex gap-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex-1 h-3 skeleton" />
        ))}
      </div>
    </div>
  )
}
