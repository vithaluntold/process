"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Clock, DollarSign, Target, AlertCircle, CheckCircle, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  avgCycleTime: number;
  targetCycleTime: number;
  slaCompliance: number;
  automationPotential: number;
  projectedSavings: number;
  totalLoans: number;
  bottleneckCount: number;
}

export function BerkadiaExecutiveDashboard({ stats }: { stats: DashboardStats }) {
  const cycleTimeStatus = stats.avgCycleTime <= stats.targetCycleTime ? "good" : "warning";
  const slaStatus = stats.slaCompliance >= 95 ? "good" : stats.slaCompliance >= 80 ? "warning" : "critical";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Loan Servicing Performance Dashboard</h2>
        <p className="text-muted-foreground">Real-time insights across Salesforce, Excel, and Mainframe systems</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Loan Processing Time</CardTitle>
            <Clock className={`h-4 w-4 ${cycleTimeStatus === "good" ? "text-green-500" : "text-yellow-500"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgCycleTime} days</div>
            <p className="text-xs text-muted-foreground">
              Target: {stats.targetCycleTime} days • Industry: 20-25 days
            </p>
            <div className="mt-2">
              {cycleTimeStatus === "good" ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <TrendingDown className="mr-1 h-3 w-3" />
                  On target
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  {stats.avgCycleTime - stats.targetCycleTime} days over
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Compliance Rate</CardTitle>
            <Target className={`h-4 w-4 ${
              slaStatus === "good" ? "text-green-500" : slaStatus === "warning" ? "text-yellow-500" : "text-red-500"
            }`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.slaCompliance}%</div>
            <Progress value={stats.slaCompliance} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Target: 95% • Industry: 70-80%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automation Potential</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.automationPotential}%</div>
            <p className="text-xs text-muted-foreground">of manual tasks</p>
            <Progress value={stats.automationPotential} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Est. time savings: {Math.round(stats.automationPotential * 0.15)} hrs/loan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Annual Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats.projectedSavings / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">
              ROI: 340% • Payback: 4.2 months
            </p>
            <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
              High priority
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Bottlenecks Identified</CardTitle>
            <CardDescription>Manual processes causing delays</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Document Verification</p>
                  <p className="text-sm text-muted-foreground">Manual review taking 3-5 days per loan</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="destructive">High Impact</Badge>
                    <span className="text-xs text-muted-foreground">Affects 100% of loans</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Cross-System Data Entry</p>
                  <p className="text-sm text-muted-foreground">Salesforce → Excel → Mainframe manual transfer</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">Medium Impact</Badge>
                    <span className="text-xs text-muted-foreground">3 days per loan</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Credit Report Retrieval</p>
                  <p className="text-sm text-muted-foreground">Manual download and upload process</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">Medium Impact</Badge>
                    <span className="text-xs text-muted-foreground">12 hrs/week</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Automation Recommendations</CardTitle>
            <CardDescription>Ranked by ROI and payback period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">System Integration Layer</p>
                  <p className="text-sm text-muted-foreground">Auto-sync data across Salesforce, Excel, Mainframe</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-green-100 text-green-800">ROI: 420%</Badge>
                    <span className="text-xs text-muted-foreground">Payback: 2.8 months</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">AI Document Verification</p>
                  <p className="text-sm text-muted-foreground">Automated extraction and validation</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-green-100 text-green-800">ROI: 340%</Badge>
                    <span className="text-xs text-muted-foreground">Payback: 3.2 months</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Credit Bureau API Integration</p>
                  <p className="text-sm text-muted-foreground">Automated credit report retrieval</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-blue-100 text-blue-800">ROI: 280%</Badge>
                    <span className="text-xs text-muted-foreground">Payback: 4.5 months</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Health Overview</CardTitle>
          <CardDescription>Activity across connected systems</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Salesforce</p>
                <p className="text-2xl font-bold">{Math.round(stats.totalLoans * 0.8)}</p>
                <p className="text-xs text-muted-foreground">Active leads</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Excel</p>
                <p className="text-2xl font-bold">{Math.round(stats.totalLoans * 0.6)}</p>
                <p className="text-xs text-muted-foreground">In underwriting</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mainframe</p>
                <p className="text-2xl font-bold">{Math.round(stats.totalLoans * 0.4)}</p>
                <p className="text-xs text-muted-foreground">Being serviced</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
