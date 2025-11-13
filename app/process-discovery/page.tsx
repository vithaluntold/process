import ProcessDiscovery from "@/components/process-discovery"
import AppLayout from "@/components/app-layout"
import { PageHeader } from "@/components/page-header"
import { Layers } from "lucide-react"

export default function ProcessDiscoveryPage() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <PageHeader
          icon={Layers}
          title="Process Discovery"
          description="Automatically discover process models from event logs"
          gradient="from-cyan-500 to-blue-600"
        />
        <ProcessDiscovery />
      </div>
    </AppLayout>
  )
}
