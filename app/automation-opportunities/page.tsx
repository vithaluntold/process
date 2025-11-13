import AutomationOpportunities from "@/components/automation-opportunities"
import AppLayout from "@/components/app-layout"
import { AutomaticErrorResolution } from "@/components/automatic-error-resolution"
import { PageHeader } from "@/components/page-header"
import { Zap } from "lucide-react"

export default function AutomationOpportunitiesPage() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <PageHeader
          icon={Zap}
          title="Automation Opportunities"
          description="Identify tasks with high automation potential and automatic error resolution"
          gradient="from-orange-500 to-red-600"
        />
        
        <AutomaticErrorResolution />
        
        <AutomationOpportunities />
      </div>
    </AppLayout>
  )
}
