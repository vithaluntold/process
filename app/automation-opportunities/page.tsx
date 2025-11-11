import AutomationOpportunities from "@/components/automation-opportunities"
import AppLayout from "@/components/app-layout"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

export default function AutomationOpportunitiesPage() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Automation Opportunities</h1>
            <p className="text-muted-foreground">Identify tasks with high automation potential</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Image 
              src="/images/automachina-logo.png" 
              alt="automachina" 
              width={180} 
              height={60}
              className="object-contain"
            />
            <Badge variant="outline" className="bg-brand/10 text-brand border-brand/30">
              Powered by automachina
            </Badge>
          </div>
        </div>
        <AutomationOpportunities />
      </div>
    </AppLayout>
  )
}
