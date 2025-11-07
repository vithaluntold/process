import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GitCompare } from "lucide-react"

export default function ScenarioAnalysisPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">What-If Scenario Analysis</h1>
        <p className="text-muted-foreground">
          Test different process scenarios and predict their impact on performance.
        </p>
      </div>

      <Card className="border-[#11c1d6]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-[#11c1d6]" />
            Scenario Comparison
          </CardTitle>
          <CardDescription>
            Compare and analyze different process optimization scenarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-[#11c1d6]/10 p-8 mb-4">
              <GitCompare className="h-16 w-16 text-[#11c1d6]" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Scenario Analysis Coming Soon</h3>
            <p className="text-muted-foreground max-w-lg mb-8">
              Create and compare multiple process scenarios to evaluate potential improvements, automation opportunities, and their impact on key performance metrics.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl text-left">
              <div className="rounded-lg border border-[#11c1d6]/20 p-4">
                <GitCompare className="h-5 w-5 text-[#11c1d6] mb-2" />
                <h4 className="font-medium mb-1">A/B Comparison</h4>
                <p className="text-sm text-muted-foreground">
                  Compare current state vs optimized scenarios side-by-side
                </p>
              </div>
              <div className="rounded-lg border border-[#11c1d6]/20 p-4">
                <GitCompare className="h-5 w-5 text-amber-500 mb-2" />
                <h4 className="font-medium mb-1">Impact Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  Predict impact on cycle time, cost, and throughput
                </p>
              </div>
              <div className="rounded-lg border border-[#11c1d6]/20 p-4">
                <GitCompare className="h-5 w-5 text-emerald-500 mb-2" />
                <h4 className="font-medium mb-1">ROI Calculation</h4>
                <p className="text-sm text-muted-foreground">
                  Calculate projected savings and payback periods
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
