import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DigitalTwinVisualization from "@/components/digital-twin-visualization"
import { FileUp, Download, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DigitalTwinPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Digital Twin Simulation</h1>
          <p className="text-muted-foreground">
            Create a virtual replica of your processes and simulate changes before implementation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <FileUp className="h-4 w-4" />
            Import Model
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      <Tabs defaultValue="digital-twin">
        <TabsList className="bg-[#11c1d6]/10">
          <TabsTrigger value="digital-twin" className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white">
            Process Digital Twin
          </TabsTrigger>
          <TabsTrigger value="what-if" className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white">
            What-If Analysis
          </TabsTrigger>
          <TabsTrigger value="simulation" className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white">
            Simulation Results
          </TabsTrigger>
        </TabsList>
        <TabsContent value="digital-twin" className="border-none p-0 pt-4">
          <DigitalTwinVisualization />
        </TabsContent>
        <TabsContent value="what-if" className="border-none p-0 pt-4">
          <DigitalTwinVisualization />
        </TabsContent>
        <TabsContent value="simulation" className="border-none p-0 pt-4">
          <DigitalTwinVisualization />
        </TabsContent>
      </Tabs>
    </div>
  )
}
