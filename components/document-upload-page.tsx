"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Eye,
  Trash2,
  Sparkles,
  FolderOpen,
  BarChart3,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const uploadedDocuments = [
  {
    id: 1,
    name: "Order-to-Cash-Process-SOP.pdf",
    size: "2.4 MB",
    uploadDate: "2024-01-15",
    status: "processed",
    extractedProcesses: 1,
    activities: 12,
  },
  {
    id: 2,
    name: "Invoice-Processing-Workflow.docx",
    size: "1.8 MB",
    uploadDate: "2024-01-14",
    status: "processing",
    extractedProcesses: 0,
    activities: 0,
    progress: 65,
  },
  {
    id: 3,
    name: "Customer-Onboarding-Procedure.pdf",
    size: "3.1 MB",
    uploadDate: "2024-01-12",
    status: "processed",
    extractedProcesses: 1,
    activities: 18,
  },
  {
    id: 4,
    name: "HR-Recruitment-Process.pdf",
    size: "1.5 MB",
    uploadDate: "2024-01-10",
    status: "error",
    extractedProcesses: 0,
    activities: 0,
  },
]

const processRepository = [
  {
    id: 1,
    name: "Order to Cash",
    source: "Order-to-Cash-Process-SOP.pdf",
    activities: 12,
    variants: 3,
    avgDuration: "2.5 days",
    status: "active",
  },
  {
    id: 2,
    name: "Customer Onboarding",
    source: "Customer-Onboarding-Procedure.pdf",
    activities: 18,
    variants: 5,
    avgDuration: "5.2 days",
    status: "active",
  },
  {
    id: 3,
    name: "Invoice Processing",
    source: "Manual Entry",
    activities: 8,
    variants: 2,
    avgDuration: "1.8 days",
    status: "active",
  },
]

export default function DocumentUploadPage() {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [])

  const handleFiles = (files: FileList) => {
    setUploading(true)
    // Simulate upload
    setTimeout(() => {
      setUploading(false)
    }, 2000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processed":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />
      case "processing":
        return <Clock className="h-5 w-5 text-amber-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return <Badge className="bg-emerald-500">Processed</Badge>
      case "processing":
        return <Badge className="bg-amber-500">Processing</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Document Upload & Process Repository</h1>
          <p className="text-muted-foreground">
            Upload SOPs and process documents to automatically generate process models and build your repository.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1 bg-transparent">
            <Download className="h-4 w-4" />
            Export All
          </Button>
          <Button size="sm" className="bg-[#11c1d6] hover:bg-[#0ea5b9] text-white flex items-center gap-1">
            <FolderOpen className="h-4 w-4" />
            View Repository
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-[#11c1d6]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uploaded Documents</CardTitle>
            <FileText className="h-4 w-4 text-[#11c1d6]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uploadedDocuments.length}</div>
            <p className="text-xs text-muted-foreground">Total documents</p>
          </CardContent>
        </Card>

        <Card className="border-[#11c1d6]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Extracted Processes</CardTitle>
            <BarChart3 className="h-4 w-4 text-[#11c1d6]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processRepository.length}</div>
            <p className="text-xs text-muted-foreground">In repository</p>
          </CardContent>
        </Card>

        <Card className="border-[#11c1d6]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Clock className="h-4 w-4 text-[#11c1d6]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {uploadedDocuments.filter((d) => d.status === "processing").length}
            </div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card className="border-[#11c1d6]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-[#11c1d6]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75%</div>
            <p className="text-xs text-muted-foreground">Processing success</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upload">
        <TabsList className="bg-[#11c1d6]/10">
          <TabsTrigger value="upload" className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white">
            Upload Documents
          </TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white">
            Uploaded Documents
          </TabsTrigger>
          <TabsTrigger value="repository" className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white">
            Process Repository
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4 pt-4">
          <Card className="border-[#11c1d6]/20">
            <CardHeader>
              <CardTitle>Upload Process Documents</CardTitle>
              <CardDescription>
                Upload SOPs, process documentation, or workflow descriptions. Our AI will automatically extract process
                flows and create process models.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  dragActive
                    ? "border-[#11c1d6] bg-[#11c1d6]/5"
                    : "border-gray-300 hover:border-[#11c1d6] hover:bg-[#11c1d6]/5"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-full bg-[#11c1d6]/10 p-6">
                    {uploading ? (
                      <Upload className="h-10 w-10 text-[#11c1d6] animate-bounce" />
                    ) : (
                      <Upload className="h-10 w-10 text-[#11c1d6]" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">
                      {uploading ? "Uploading..." : "Drop files here or click to upload"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Supports PDF, Word documents, and text files up to 50MB
                    </p>
                  </div>
                  {!uploading && (
                    <Button className="bg-[#11c1d6] hover:bg-[#0ea5b9] text-white">
                      <Upload className="mr-2 h-4 w-4" />
                      Select Files
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-[#11c1d6]/20 p-4 bg-[#11c1d6]/5">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-[#11c1d6] mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-medium">AI-Powered Process Extraction</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Our AI automatically analyzes your documents to:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                      <li>Extract process steps and activities</li>
                      <li>Identify decision points and gateways</li>
                      <li>Determine activity sequences and flows</li>
                      <li>Generate visual process models</li>
                      <li>Create process variants and patterns</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="pt-4">
          <Card className="border-[#11c1d6]/20">
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
              <CardDescription>Manage your uploaded process documents and their processing status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <th className="h-12 px-4 text-left font-medium">Document Name</th>
                        <th className="h-12 px-4 text-left font-medium">Size</th>
                        <th className="h-12 px-4 text-left font-medium">Upload Date</th>
                        <th className="h-12 px-4 text-left font-medium">Status</th>
                        <th className="h-12 px-4 text-left font-medium">Processes</th>
                        <th className="h-12 px-4 text-left font-medium">Activities</th>
                        <th className="h-12 px-4 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadedDocuments.map((doc) => (
                        <tr key={doc.id} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-[#11c1d6]" />
                              <span className="font-medium">{doc.name}</span>
                            </div>
                          </td>
                          <td className="p-4 align-middle">{doc.size}</td>
                          <td className="p-4 align-middle">{doc.uploadDate}</td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(doc.status)}
                              {getStatusBadge(doc.status)}
                            </div>
                            {doc.status === "processing" && <Progress value={doc.progress} className="mt-2 h-1" />}
                          </td>
                          <td className="p-4 align-middle">{doc.extractedProcesses}</td>
                          <td className="p-4 align-middle">{doc.activities}</td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repository" className="pt-4">
          <Card className="border-[#11c1d6]/20">
            <CardHeader>
              <CardTitle>Process Repository</CardTitle>
              <CardDescription>Extracted processes available for analysis and optimization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {processRepository.map((process) => (
                  <div
                    key={process.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-[#11c1d6]/20 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-[#11c1d6]/10">
                        <BarChart3 className="h-6 w-6 text-[#11c1d6]" />
                      </div>
                      <div>
                        <h3 className="font-medium">{process.name}</h3>
                        <p className="text-sm text-muted-foreground">Source: {process.source}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-muted-foreground">Activities: {process.activities}</span>
                          <span className="text-xs text-muted-foreground">Variants: {process.variants}</span>
                          <span className="text-xs text-muted-foreground">Avg Duration: {process.avgDuration}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-500">{process.status}</Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View Process
                      </Button>
                      <Button size="sm" className="bg-[#11c1d6] hover:bg-[#0ea5b9] text-white">
                        Analyze
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
