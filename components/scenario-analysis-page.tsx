import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import DigitalTwinVisualization from "@/components/digital-twin-visualization"
import { FileUp, Download, BarChart2, TrendingUp, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function ScenarioAnalysisPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">What-If Scenario Analysis</h1>
          <p className="text-muted-foreground">
            Test different process scenarios and predict their impact on performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <FileUp className="h-4 w-4" />
            Import Data
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            Export Results
          </Button>
          <Button size="sm" className="bg-[#11c1d6] hover:bg-[#0ea5b9] text-white">
            New Scenario
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-3 border-[#11c1d6]/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Scenario Comparison</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-[#11c1d6]">Current State</Badge>
                <Badge className="bg-emerald-500">Optimized Process</Badge>
                <Badge variant="outline">Automation Focus</Badge>
              </div>
            </div>
            <CardDescription>Compare different process scenarios side by side</CardDescription>
          </CardHeader>
          <CardContent>
            <DigitalTwinVisualization />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 border-[#11c1d6]/20">
          <CardHeader>
            <CardTitle>Impact Analysis</CardTitle>
            <CardDescription>Predicted impact of scenario changes on key metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <BarChart2 className="h-4 w-4" />
                    Cycle Time Reduction
                  </div>
                  <div className="text-2xl font-bold">32%</div>
                  <div className="text-xs text-emerald-500 mt-1">12.5 hours saved per case</div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    Cost Savings
                  </div>
                  <div className="text-2xl font-bold">$20,500</div>
                  <div className="text-xs text-emerald-500 mt-1">Monthly projected savings</div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Lightbulb className="h-4 w-4" />
                    ROI Timeline
                  </div>
                  <div className="text-2xl font-bold">3.5 months</div>
                  <div className="text-xs text-emerald-500 mt-1">Projected payback period</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Scenario Comparison</h3>
                <div className="rounded-md border">
                  <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead>
                        <tr className="border-b transition-colors hover:bg-muted/50">
                          <th className="h-12 px-4 text-left font-medium">Metric</th>
                          <th className="h-12 px-4 text-left font-medium">Current State</th>
                          <th className="h-12 px-4 text-left font-medium">Optimized Process</th>
                          <th className="h-12 px-4 text-left font-medium">Automation Focus</th>
                          <th className="h-12 px-4 text-left font-medium">Difference</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle font-medium">Cycle Time</td>
                          <td className="p-4 align-middle">40.5 hours</td>
                          <td className="p-4 align-middle">28.5 hours</td>
                          <td className="p-4 align-middle">32.8 hours</td>
                          <td className="p-4 align-middle text-emerald-500">-12.0 hours</td>
                        </tr>
                        <tr className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle font-medium">Process Cost</td>
                          <td className="p-4 align-middle">$135</td>
                          <td className="p-4 align-middle">$115</td>
                          <td className="p-4 align-middle">$128</td>
                          <td className="p-4 align-middle text-emerald-500">-$20</td>
                        </tr>
                        <tr className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle font-medium">Throughput</td>
                          <td className="p-4 align-middle">85/day</td>
                          <td className="p-4 align-middle">98/day</td>
                          <td className="p-4 align-middle">88/day</td>
                          <td className="p-4 align-middle text-emerald-500">+13/day</td>
                        </tr>
                        <tr className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle font-medium">Automation Rate</td>
                          <td className="p-4 align-middle">0%</td>
                          <td className="p-4 align-middle">25%</td>
                          <td className="p-4 align-middle">15%</td>
                          <td className="p-4 align-middle text-emerald-500">+25%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#11c1d6]/20">
          <CardHeader>
            <CardTitle>Implementation Roadmap</CardTitle>
            <CardDescription>Recommended steps to achieve the optimized scenario</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-muted ml-3"></div>
                <div className="space-y-6">
                  <div className="relative">
                    <div className="absolute left-0 top-0 h-6 w-6 rounded-full bg-[#11c1d6] flex items-center justify-center">
                      <span className="text-xs font-bold text-white">1</span>
                    </div>
                    <div className="pl-10">
                      <h4 className="font-medium">Automate Verification (Month 1)</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Implement RPA solution for order verification process to reduce manual effort.
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute left-0 top-0 h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-bold">2</span>
                    </div>
                    <div className="pl-10">
                      <h4 className="font-medium">Optimize Information Requests (Month 2)</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Streamline the additional information request process to reduce bottlenecks.
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute left-0 top-0 h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-bold">3</span>
                    </div>
                    <div className="pl-10">
                      <h4 className="font-medium">Improve Payment Processing (Month 3)</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Enhance payment gateway integration to reduce payment failures and rework.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#11c1d6]/20 p-4 bg-[#11c1d6]/5">
                <h4 className="font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-[#11c1d6]" />
                  AI Recommendation
                </h4>
                <p className="text-sm text-muted-foreground mt-2">
                  Based on simulation results, prioritizing automation of the verification process will yield the
                  fastest ROI while providing immediate cycle time improvements.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
