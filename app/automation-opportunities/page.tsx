import AutomationOpportunities from "@/components/automation-opportunities"
import AppLayout from "@/components/app-layout"
import { AutomaticErrorResolution } from "@/components/automatic-error-resolution"

export default function AutomationOpportunitiesPage() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation Opportunities with AutoMachine</h1>
          <p className="text-muted-foreground">Identify tasks with high automation potential and automatic error resolution</p>
        </div>
        
        <AutomaticErrorResolution />
        
        <AutomationOpportunities />
      </div>
    </AppLayout>
  )
}
