import AutomationOpportunities from "@/components/automation-opportunities"

export default function AutomationOpportunitiesPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Automation Opportunities</h1>
        <p className="text-muted-foreground">Identify tasks with high automation potential</p>
      </div>
      <AutomationOpportunities />
    </div>
  )
}
