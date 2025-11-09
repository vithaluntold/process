"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Loader2, CheckCircle2, AlertCircle, Clock, Users, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ProcessStep {
  stepName: string;
  description: string;
  responsible: string | null;
  timestamp: string | null;
  duration: string | null;
  status: "completed" | "pending" | "blocked";
}

interface TimelineEvent {
  date: string;
  event: string;
  actor: string | null;
}

interface Bottleneck {
  issue: string;
  impact: string;
  mentionedBy: string | null;
}

interface DecisionPoint {
  decision: string;
  decisionMaker: string | null;
  status: "approved" | "pending" | "rejected" | "unclear";
}

interface ActionItem {
  task: string;
  assignedTo: string | null;
  dueDate: string | null;
  priority: "high" | "medium" | "low";
}

interface ParsedEmail {
  processSteps: ProcessStep[];
  timeline: TimelineEvent[];
  bottlenecks: Bottleneck[];
  decisionPoints: DecisionPoint[];
  actionItems: ActionItem[];
  insights: string;
}

const SAMPLE_EMAIL = `From: Sarah Johnson <sarah.j@berkadia.com>
To: Mike Chen <mike.c@berkadia.com>
CC: David Martinez <david.m@berkadia.com>
Date: November 8, 2024, 2:15 PM
Subject: RE: Loan #45823 - Document Verification Delays

Mike,

I'm following up on loan #45823. We received the initial application on October 15th, but we're still waiting on the appraisal report. The borrower submitted their financial docs on October 22nd, and our underwriting team completed the credit review on October 28th.

The issue is that the appraisal company hasn't delivered the property report yet. I've called them twice this week - they say it should be ready by November 12th. This is causing us to miss our 30-day SLA.

Can you please escalate this with the appraisal vendor? We need this to close by November 20th per the commitment letter.

Thanks,
Sarah

---

From: Mike Chen <mike.c@berkadia.com>
To: Sarah Johnson <sarah.j@berkadia.com>
Date: November 8, 2024, 3:45 PM
Subject: RE: Loan #45823 - Document Verification Delays

Sarah,

I reached out to the appraisal company - they confirmed November 12th delivery. However, I noticed the credit report is about to expire (90 days from July 30th pull). We'll need to pull a fresh one if this drags past November 15th.

I've flagged this loan for priority review once we get the appraisal. David's team can turn around the underwriting decision within 2 business days if we get them the report by EOD November 12th.

Let's schedule a call with the borrower on Monday to keep them updated.

Mike

---

From: David Martinez <david.m@berkadia.com>
To: Mike Chen <mike.c@berkadia.com>, Sarah Johnson <sarah.j@berkadia.com>
Date: November 8, 2024, 4:20 PM
Subject: RE: Loan #45823 - Document Verification Delays

Team,

Adding context: we approved the pre-qualification on October 18th based on preliminary financials. Once we have the appraisal, I need:

1. Updated DSCR calculation (debt service coverage ratio)
2. Final LTV confirmation (loan-to-value)
3. Environmental report clearance

Items #1 and #2 I can do same-day. Environmental is outsourced and typically takes 3-5 business days.

If we get the appraisal 11/12, environmental report by 11/17, we can issue the commitment letter by 11/19. That gives us 1 day buffer before the 11/20 deadline.

David`;

export function EmailWorkflowParser() {
  const [emailText, setEmailText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ParsedEmail | null>(null);

  async function parseEmail() {
    if (!emailText.trim()) {
      toast.error("Please enter an email thread to parse");
      return;
    }

    setParsing(true);
    setResult(null);

    try {
      const response = await fetch("/api/email-parser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailThread: emailText }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data.data);
        toast.success("Email thread parsed successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to parse email");
      }
    } catch (error) {
      console.error("Error parsing email:", error);
      toast.error("Failed to parse email thread");
    } finally {
      setParsing(false);
    }
  }

  function loadSample() {
    setEmailText(SAMPLE_EMAIL);
    toast.success("Sample Berkadia loan email thread loaded");
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "Not specified";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "completed":
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
      case "unclear":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "blocked":
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "low":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email-to-Workflow Extraction
          </CardTitle>
          <CardDescription>
            Parse email threads to automatically extract process steps, timelines, and bottlenecks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Email Thread</label>
              <Button variant="outline" size="sm" onClick={loadSample}>
                Load Sample Email
              </Button>
            </div>
            <Textarea
              placeholder="Paste email thread here (including headers, replies, etc.)"
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              rows={10}
              className="font-mono text-xs"
            />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The AI will analyze the email thread and extract process steps, decision points, bottlenecks, 
              and action items to help visualize the workflow.
            </AlertDescription>
          </Alert>

          <Button onClick={parseEmail} disabled={parsing || !emailText.trim()}>
            {parsing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Parsing Email Thread...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Parse Email Thread
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{result.insights}</p>
            </CardContent>
          </Card>

          {result.processSteps && result.processSteps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-brand" />
                  Process Steps Extracted ({result.processSteps.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.processSteps.map((step, index) => (
                    <div key={index} className="border-l-4 border-brand/30 pl-4 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold">{step.stepName}</p>
                          <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {step.responsible && (
                              <Badge variant="outline" className="text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                {step.responsible}
                              </Badge>
                            )}
                            {step.timestamp && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDate(step.timestamp)}
                              </Badge>
                            )}
                            {step.duration && (
                              <Badge variant="outline" className="text-xs">
                                {step.duration}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge className={getStatusColor(step.status)}>
                          {step.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {result.bottlenecks && result.bottlenecks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Bottlenecks Identified ({result.bottlenecks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.bottlenecks.map((bottleneck, index) => (
                    <div key={index} className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3">
                      <p className="font-semibold text-yellow-900 dark:text-yellow-300">
                        {bottleneck.issue}
                      </p>
                      <p className="text-sm text-yellow-800 dark:text-yellow-400 mt-1">
                        Impact: {bottleneck.impact}
                      </p>
                      {bottleneck.mentionedBy && (
                        <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-1">
                          Mentioned by: {bottleneck.mentionedBy}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {result.decisionPoints && result.decisionPoints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Decision Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.decisionPoints.map((decision, index) => (
                    <div key={index} className="flex items-start justify-between gap-2 p-2 border rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{decision.decision}</p>
                        {decision.decisionMaker && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Decision maker: {decision.decisionMaker}
                          </p>
                        )}
                      </div>
                      <Badge className={getStatusColor(decision.status)}>
                        {decision.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {result.actionItems && result.actionItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Action Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.actionItems.map((item, index) => (
                    <div key={index} className="flex items-start justify-between gap-2 p-2 border rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.task}</p>
                        <div className="flex gap-2 mt-1">
                          {item.assignedTo && (
                            <span className="text-xs text-muted-foreground">
                              Assigned: {item.assignedTo}
                            </span>
                          )}
                          {item.dueDate && (
                            <span className="text-xs text-muted-foreground">
                              Due: {formatDate(item.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge className={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {result.timeline && result.timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.timeline.map((event, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <div className="flex-shrink-0 w-24 text-xs text-muted-foreground">
                        {formatDate(event.date)}
                      </div>
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-brand mt-1.5"></div>
                      <div className="flex-1">
                        <p className="text-sm">{event.event}</p>
                        {event.actor && (
                          <p className="text-xs text-muted-foreground">{event.actor}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
