"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Network } from "lucide-react"

export default function DigitalTwinVisualization() {
  return (
    <Card className="border-[#11c1d6]/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5 text-[#11c1d6]" />
          Digital Twin Simulation
        </CardTitle>
        <CardDescription>
          Create virtual replicas of business processes for simulation and testing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-[#11c1d6]/10 p-8 mb-4">
            <Network className="h-16 w-16 text-[#11c1d6]" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Digital Twin Coming Soon</h3>
          <p className="text-muted-foreground max-w-lg mb-8">
            Build interactive digital twins of your business processes to visualize flows, identify bottlenecks, test improvements, and simulate what-if scenarios before implementation.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl text-left">
            <div className="rounded-lg border border-[#11c1d6]/20 p-4">
              <Network className="h-5 w-5 text-[#11c1d6] mb-2" />
              <h4 className="font-medium mb-1">Process Modeling</h4>
              <p className="text-sm text-muted-foreground">
                Create virtual replicas of your business processes
              </p>
            </div>
            <div className="rounded-lg border border-[#11c1d6]/20 p-4">
              <Network className="h-5 w-5 text-blue-500 mb-2" />
              <h4 className="font-medium mb-1">What-If Analysis</h4>
              <p className="text-sm text-muted-foreground">
                Test different scenarios and predict outcomes
              </p>
            </div>
            <div className="rounded-lg border border-[#11c1d6]/20 p-4">
              <Network className="h-5 w-5 text-emerald-500 mb-2" />
              <h4 className="font-medium mb-1">Impact Simulation</h4>
              <p className="text-sm text-muted-foreground">
                Simulate changes before real-world implementation
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
