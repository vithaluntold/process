import ProcessDiscovery from "@/components/process-discovery"
import AppLayout from "@/components/app-layout"

export default function ProcessDiscoveryPage() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Process Discovery</h1>
          <p className="text-muted-foreground">Automatically discover process models from event logs</p>
        </div>
        <ProcessDiscovery />
      </div>
    </AppLayout>
  )
}
