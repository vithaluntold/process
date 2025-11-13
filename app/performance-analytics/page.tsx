import PerformanceAnalytics from "@/components/performance-analytics"
import AppLayout from "@/components/app-layout"
import { PageHeader } from "@/components/page-header"
import { BarChart3 } from "lucide-react"

export default function PerformanceAnalyticsPage() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <PageHeader
          icon={BarChart3}
          title="Performance Analytics"
          description="Track KPIs and performance metrics in real-time"
          gradient="from-emerald-500 to-green-600"
        />
        <PerformanceAnalytics />
      </div>
    </AppLayout>
  )
}
