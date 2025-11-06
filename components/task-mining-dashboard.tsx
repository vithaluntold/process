"use client"

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const taskData = [
  {
    name: "Email Processing",
    frequency: 120,
    avgDuration: 5,
    automationPotential: 80,
  },
  {
    name: "Data Entry",
    frequency: 85,
    avgDuration: 12,
    automationPotential: 90,
  },
  {
    name: "Document Review",
    frequency: 65,
    avgDuration: 18,
    automationPotential: 40,
  },
  {
    name: "Approval",
    frequency: 45,
    avgDuration: 8,
    automationPotential: 30,
  },
  {
    name: "Customer Response",
    frequency: 95,
    avgDuration: 15,
    automationPotential: 60,
  },
  {
    name: "Report Generation",
    frequency: 35,
    avgDuration: 25,
    automationPotential: 85,
  },
]

export default function TaskMiningDashboard() {
  const [chartMetric, setChartMetric] = useState("frequency")

  const getChartData = () => {
    if (chartMetric === "frequency") {
      return taskData.map((task) => ({
        name: task.name,
        value: task.frequency,
      }))
    } else if (chartMetric === "duration") {
      return taskData.map((task) => ({
        name: task.name,
        value: task.avgDuration,
      }))
    } else {
      return taskData.map((task) => ({
        name: task.name,
        value: task.automationPotential,
      }))
    }
  }

  const getChartLabel = () => {
    if (chartMetric === "frequency") {
      return "Task Frequency (per day)"
    } else if (chartMetric === "duration") {
      return "Avg. Duration (minutes)"
    } else {
      return "Automation Potential (%)"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={chartMetric} onValueChange={setChartMetric}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="frequency">Task Frequency</SelectItem>
              <SelectItem value="duration">Task Duration</SelectItem>
              <SelectItem value="automation">Automation Potential</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm">
          Export Data
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: getChartLabel(), angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" name={getChartLabel()} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {taskData.map((task, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <h3 className="font-semibold">{task.name}</h3>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frequency:</span>
                  <span>{task.frequency}/day</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg. Duration:</span>
                  <span>{task.avgDuration} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Automation:</span>
                  <span>{task.automationPotential}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
