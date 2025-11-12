import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Inbox,
  FileUp,
  Search,
  AlertCircle,
  Sparkles,
  Database,
  BarChart3,
  Activity,
  Zap,
  FolderOpen,
  FileText,
} from "lucide-react"

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  secondaryActionLabel?: string
  secondaryActionHref?: string
  onSecondaryAction?: () => void
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryActionLabel,
  secondaryActionHref,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <Card className="border-dashed border-2 border-muted-foreground/25 bg-muted/20">
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="mb-6 p-6 bg-gradient-to-br from-muted to-muted/50 rounded-full">
          <Icon className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md leading-relaxed">
          {description}
        </p>
        <div className="flex flex-wrap items-center gap-3 justify-center">
          {actionLabel && (
            <>
              {actionHref ? (
                <Link href={actionHref}>
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/20">
                    <Sparkles className="mr-2 h-4 w-4" />
                    {actionLabel}
                  </Button>
                </Link>
              ) : (
                <Button 
                  onClick={onAction}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/20"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {actionLabel}
                </Button>
              )}
            </>
          )}
          {secondaryActionLabel && (
            <>
              {secondaryActionHref ? (
                <Link href={secondaryActionHref}>
                  <Button variant="outline" className="hover:bg-brand/10 hover:text-brand hover:border-brand/50">
                    {secondaryActionLabel}
                  </Button>
                </Link>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={onSecondaryAction}
                  className="hover:bg-brand/10 hover:text-brand hover:border-brand/50"
                >
                  {secondaryActionLabel}
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function NoProcessesFound() {
  return (
    <EmptyState
      icon={Database}
      title="No Processes Found"
      description="Get started by importing your event log data. We support CSV, Excel, and direct database connections."
      actionLabel="Import Data"
      onAction={() => {}}
      secondaryActionLabel="View Documentation"
      secondaryActionHref="/docs"
    />
  )
}

export function NoAnalysisResults() {
  return (
    <EmptyState
      icon={BarChart3}
      title="No Analysis Results"
      description="Run your first process analysis to discover insights, identify bottlenecks, and find automation opportunities."
      actionLabel="Start Analysis"
      onAction={() => {}}
    />
  )
}

export function NoAutomationOpportunities() {
  return (
    <EmptyState
      icon={Zap}
      title="No Automation Opportunities Found"
      description="We'll analyze your processes to identify tasks that can be automated. Import more process data to get started."
      actionLabel="Import Process Data"
      onAction={() => {}}
      secondaryActionLabel="Learn About Automation"
      secondaryActionHref="/docs/automation"
    />
  )
}

export function NoTaskMiningData() {
  return (
    <EmptyState
      icon={Activity}
      title="No Task Mining Data"
      description="Install the Desktop Capture Agent to start recording user activities and discover automation opportunities."
      actionLabel="Download Agent"
      actionHref="/task-mining/download"
      secondaryActionLabel="View Setup Guide"
      secondaryActionHref="/docs/task-mining"
    />
  )
}

export function SearchNoResults({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={Search}
      title="No Results Found"
      description={query ? `We couldn't find anything matching "${query}". Try adjusting your search terms or filters.` : "No results match your current filters. Try adjusting your criteria."}
      actionLabel="Clear Filters"
      onAction={() => {}}
    />
  )
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Something Went Wrong"
      description={message || "We encountered an error loading this data. Please try refreshing the page or contact support if the problem persists."}
      actionLabel="Retry"
      onAction={() => window.location.reload()}
      secondaryActionLabel="Contact Support"
      secondaryActionHref="/support"
    />
  )
}

export function NoReports() {
  return (
    <EmptyState
      icon={FileText}
      title="No Reports Generated"
      description="Create your first report to export process insights, charts, and recommendations in PDF, Excel, or PowerPoint format."
      actionLabel="Generate Report"
      onAction={() => {}}
      secondaryActionLabel="View Templates"
      secondaryActionHref="/reports/templates"
    />
  )
}

export function NoDocuments() {
  return (
    <EmptyState
      icon={FolderOpen}
      title="No Documents Uploaded"
      description="Upload process documentation, procedure manuals, or email chains to extract workflow information automatically."
      actionLabel="Upload Documents"
      onAction={() => {}}
    />
  )
}
