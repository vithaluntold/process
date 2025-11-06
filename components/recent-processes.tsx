import { Clock, Download, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export default function RecentProcesses() {
  const processes = [
    {
      id: "P-001",
      name: "Purchase Order Approval",
      date: "2023-11-15",
      status: "Completed",
      duration: "2.5 days",
      efficiency: "High",
    },
    {
      id: "P-002",
      name: "Customer Onboarding",
      date: "2023-11-12",
      status: "In Progress",
      duration: "3.2 days",
      efficiency: "Medium",
    },
    {
      id: "P-003",
      name: "Invoice Processing",
      date: "2023-11-10",
      status: "Completed",
      duration: "1.8 days",
      efficiency: "High",
    },
    {
      id: "P-004",
      name: "Employee Offboarding",
      date: "2023-11-05",
      status: "Completed",
      duration: "4.1 days",
      efficiency: "Low",
    },
    {
      id: "P-005",
      name: "Expense Approval",
      date: "2023-11-01",
      status: "Completed",
      duration: "1.2 days",
      efficiency: "High",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b transition-colors hover:bg-muted/50">
                <th className="h-12 px-4 text-left font-medium">Process</th>
                <th className="h-12 px-4 text-left font-medium">Date</th>
                <th className="h-12 px-4 text-left font-medium">Status</th>
                <th className="h-12 px-4 text-left font-medium">Duration</th>
                <th className="h-12 px-4 text-left font-medium">Efficiency</th>
                <th className="h-12 px-4 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((process) => (
                <tr key={process.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle font-medium">{process.name}</td>
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {process.date}
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <Badge variant={process.status === "Completed" ? "default" : "secondary"}>{process.status}</Badge>
                  </td>
                  <td className="p-4 align-middle">{process.duration}</td>
                  <td className="p-4 align-middle">
                    <Badge
                      variant={
                        process.efficiency === "High"
                          ? "default"
                          : process.efficiency === "Medium"
                            ? "outline"
                            : "destructive"
                      }
                    >
                      {process.efficiency}
                    </Badge>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Export Report</DropdownMenuItem>
                          <DropdownMenuItem>Share Analysis</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
