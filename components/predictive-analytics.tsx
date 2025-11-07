"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, TrendingUp, AlertTriangle } from "lucide-react"

export default function PredictiveAnalytics() {
  return (
    <div className="space-y-4">
      <Card className="border-[#11c1d6]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-[#11c1d6]" />
            Predictive Analytics
          </CardTitle>
          <CardDescription>
            AI-powered forecasting and anomaly detection for process optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-[#11c1d6]/10 p-6 mb-4">
              <TrendingUp className="h-12 w-12 text-[#11c1d6]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Predictive Models Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Upload event log data and analyze your processes to enable AI-powered predictions, forecasting, and anomaly detection.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
              <div className="rounded-lg border border-[#11c1d6]/20 p-4 text-left">
                <TrendingUp className="h-5 w-5 text-[#11c1d6] mb-2" />
                <h4 className="font-medium mb-1">Forecasting</h4>
                <p className="text-sm text-muted-foreground">
                  Predict future cycle times, throughput, and resource utilization
                </p>
              </div>
              <div className="rounded-lg border border-[#11c1d6]/20 p-4 text-left">
                <AlertTriangle className="h-5 w-5 text-amber-500 mb-2" />
                <h4 className="font-medium mb-1">Anomaly Detection</h4>
                <p className="text-sm text-muted-foreground">
                  Automatically detect unusual patterns and potential issues
                </p>
              </div>
              <div className="rounded-lg border border-[#11c1d6]/20 p-4 text-left">
                <Lightbulb className="h-5 w-5 text-emerald-500 mb-2" />
                <h4 className="font-medium mb-1">Scenario Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  Compare optimistic vs pessimistic outcomes for planning
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
