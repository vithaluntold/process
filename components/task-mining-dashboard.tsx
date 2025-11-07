"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MousePointerClick, BarChart3, Zap } from "lucide-react"

export default function TaskMiningDashboard() {
  return (
    <div className="space-y-4">
      <Card className="border-brand/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MousePointerClick className="h-5 w-5 text-brand" />
            Task Mining
          </CardTitle>
          <CardDescription>
            Analyze task-level execution data to identify automation opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-brand/10 p-6 mb-4">
              <BarChart3 className="h-12 w-12 text-brand" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Task Mining Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Upload task execution logs to analyze task frequency, duration, and automation potential at a granular level.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
              <div className="rounded-lg border border-brand/20 p-4 text-left hover-lift">
                <MousePointerClick className="h-5 w-5 text-brand mb-2" />
                <h4 className="font-medium mb-1">Task Frequency</h4>
                <p className="text-sm text-muted-foreground">
                  Track how often specific tasks are performed by users
                </p>
              </div>
              <div className="rounded-lg border border-brand/20 p-4 text-left hover-lift">
                <BarChart3 className="h-5 w-5 text-blue-500 mb-2" />
                <h4 className="font-medium mb-1">Duration Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  Measure average time spent on different task types
                </p>
              </div>
              <div className="rounded-lg border border-brand/20 p-4 text-left hover-lift">
                <Zap className="h-5 w-5 text-amber-500 mb-2" />
                <h4 className="font-medium mb-1">Automation Scoring</h4>
                <p className="text-sm text-muted-foreground">
                  Identify tasks with highest automation potential
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
