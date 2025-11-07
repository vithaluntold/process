import DigitalTwinVisualization from "@/components/digital-twin-visualization"

export default function DigitalTwinPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Digital Twin Simulation</h1>
        <p className="text-muted-foreground">
          Create a virtual replica of your processes and simulate changes before implementation.
        </p>
      </div>

      <DigitalTwinVisualization />
    </div>
  )
}
