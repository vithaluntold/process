import PerformanceAnalytics from "@/components/performance-analytics"
import AppLayout from "@/components/app-layout"

export default function PerformanceAnalyticsPage() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Analytics</h1>
          <p className="text-muted-foreground">Track KPIs and performance metrics</p>
        </div>
        <PerformanceAnalytics />
      </div>
    </AppLayout>
  )
}
