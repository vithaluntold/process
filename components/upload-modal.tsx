"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileUp, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete?: () => void
}

export default function UploadModal({ open, onOpenChange, onUploadComplete }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [processName, setProcessName] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      const fileName = selectedFile.name.toLowerCase()
      
      if (!fileName.endsWith('.csv')) {
        toast.error("Only CSV files are allowed. Please select a .csv file.")
        e.target.value = ''
        setFile(null)
        return
      }
      
      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file")
      return
    }

    if (!processName.trim()) {
      toast.error("Please enter a process name")
      return
    }

    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.csv')) {
      toast.error("Only CSV files are allowed. Please select a .csv file.")
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("processName", processName.trim())

      const response = await apiClient.upload("/api/upload", formData)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Upload failed")
      }

      toast.success(`Successfully uploaded ${data.eventsImported || data.recordsProcessed || 0} records`)
      setFile(null)
      setProcessName("")
      onOpenChange(false)
      onUploadComplete?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Process Data</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing event logs. Required columns: caseId, activity, timestamp
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="processName">Process Name</Label>
            <Input
              id="processName"
              placeholder="e.g., Order-to-Cash Process"
              value={processName}
              onChange={(e) => setProcessName(e.target.value)}
              disabled={uploading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="file">CSV File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={uploading}
                className="cursor-pointer"
              />
              {file && (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              )}
            </div>
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
          <div className="rounded-lg bg-muted p-3 text-sm">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              CSV Format Requirements
            </h4>
            <ul className="text-muted-foreground space-y-1 ml-6 list-disc">
              <li><strong>caseId</strong>: Unique identifier for each process instance</li>
              <li><strong>activity</strong>: Name of the activity/task</li>
              <li><strong>timestamp</strong>: Date and time of the activity</li>
              <li>Optional: resource, cost, or other custom fields</li>
            </ul>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || !processName.trim() || uploading}
            className="bg-brand hover:bg-brand/90 text-white"
          >
            {uploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4" />
                Upload & Analyze
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
