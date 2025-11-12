"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Activity, MessageSquare, FileUp, Zap, BarChart3, Clock } from "lucide-react"
import { motion } from "framer-motion"
import { formatDistanceToNow } from "date-fns"

interface ActivityItem {
  id: string
  type: "comment" | "analysis" | "upload" | "automation"
  user: {
    name: string
    initials: string
  }
  action: string
  timestamp: Date
  metadata?: Record<string, any>
}

interface ActivityFeedProps {
  activities?: ActivityItem[]
  limit?: number
}

const defaultActivities: ActivityItem[] = [
  {
    id: "1",
    type: "comment",
    user: { name: "John Doe", initials: "JD" },
    action: "commented on Process Discovery",
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: "2",
    type: "analysis",
    user: { name: "Jane Smith", initials: "JS" },
    action: "completed Performance Analytics",
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: "3",
    type: "upload",
    user: { name: "Mike Johnson", initials: "MJ" },
    action: "uploaded new process data",
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
  },
  {
    id: "4",
    type: "automation",
    user: { name: "Sarah Wilson", initials: "SW" },
    action: "identified 5 automation opportunities",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
]

const getActivityIcon = (type: ActivityItem["type"]) => {
  switch (type) {
    case "comment":
      return { Icon: MessageSquare, gradient: "from-blue-500 to-cyan-500" }
    case "analysis":
      return { Icon: BarChart3, gradient: "from-violet-500 to-purple-500" }
    case "upload":
      return { Icon: FileUp, gradient: "from-emerald-500 to-green-500" }
    case "automation":
      return { Icon: Zap, gradient: "from-orange-500 to-red-500" }
    default:
      return { Icon: Activity, gradient: "from-gray-500 to-slate-500" }
  }
}

export function ActivityFeed({ activities = defaultActivities, limit }: ActivityFeedProps) {
  const displayedActivities = limit ? activities.slice(0, limit) : activities

  return (
    <Card className="border-0 bg-gradient-to-br from-muted/30 to-muted/10">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Recent Activity</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Latest team updates and actions
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {displayedActivities.map((activity, index) => {
              const { Icon, gradient } = getActivityIcon(activity.type)
              
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex gap-4 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors group"
                >
                  <div className="flex-shrink-0 flex flex-col items-center gap-2">
                    <div className={`p-2 bg-gradient-to-br ${gradient} rounded-lg shadow-lg`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    {index < displayedActivities.length - 1 && (
                      <div className="h-full w-px bg-gradient-to-b from-border to-transparent" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Avatar className="h-6 w-6 border-2 border-brand/20">
                          <AvatarFallback className="text-xs bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                            {activity.user.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm truncate">
                          {activity.user.name}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.action}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
