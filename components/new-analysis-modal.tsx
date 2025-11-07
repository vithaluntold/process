"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Sparkles } from "lucide-react"
import { toast } from "sonner"

interface NewAnalysisModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAnalysisCreated?: () => void
}

export default function NewAnalysisModal({ open, onOpenChange, onAnalysisCreated }: NewAnalysisModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState("discovery")
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a process name")
      return
    }

    setCreating(true)

    try {
      const response = await fetch("/api/processes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          source: type,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create process")
      }

      toast.success(`Process "${name}" created successfully`)
      setName("")
      setDescription("")
      setType("discovery")
      onOpenChange(false)
      onAnalysisCreated?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create process")
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Analysis</DialogTitle>
          <DialogDescription>
            Set up a new process analysis to discover insights and optimize performance
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Process Name</Label>
            <Input
              id="name"
              placeholder="e.g., Customer Onboarding, Order Fulfillment"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={creating}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">Analysis Type</Label>
            <Select value={type} onValueChange={setType} disabled={creating}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discovery">Process Discovery</SelectItem>
                <SelectItem value="conformance">Conformance Checking</SelectItem>
                <SelectItem value="performance">Performance Analysis</SelectItem>
                <SelectItem value="automation">Automation Opportunity Analysis</SelectItem>
                <SelectItem value="predictive">Predictive Analytics</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what this process does and what you want to analyze..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={creating}
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className="bg-[#11c1d6] hover:bg-[#0ea5b9] text-white"
          >
            {creating ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                Creating...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Analysis
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
