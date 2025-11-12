"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { MessageSquare, Send, Trash2, User, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { formatDistanceToNow } from "date-fns"

interface Comment {
  id: number
  processId: number
  userId: number
  content: string
  status: string
  createdAt: string
  user?: {
    email?: string
    firstName?: string
    lastName?: string
  }
}

interface CollaborationPanelProps {
  processId: number
  currentUserId?: number
}

export function CollaborationPanel({ processId, currentUserId }: CollaborationPanelProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchComments()
    
    const interval = setInterval(() => {
      fetchComments()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [processId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?processId=${processId}`)
      if (!response.ok) throw new Error("Failed to fetch comments")
      const data = await response.json()
      setComments(data)
    } catch (error) {
      console.error("Error fetching comments:", error)
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processId,
          content: newComment,
          type: "comment",
        }),
      })

      if (!response.ok) throw new Error("Failed to post comment")

      const comment = await response.json()
      setComments([comment, ...comments])
      setNewComment("")
      
      toast({
        title: "Comment Added",
        description: "Your comment has been posted successfully",
      })
    } catch (error) {
      console.error("Error posting comment:", error)
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: number) => {
    try {
      const response = await fetch("/api/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      })

      if (!response.ok) throw new Error("Failed to delete comment")

      setComments(comments.filter(c => c.id !== commentId))
      
      toast({
        title: "Comment Deleted",
        description: "Comment has been removed",
      })
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      })
    }
  }

  const getUserInitials = (comment: Comment) => {
    if (comment.user?.firstName && comment.user?.lastName) {
      return `${comment.user.firstName[0]}${comment.user.lastName[0]}`
    }
    if (comment.user?.email) {
      return comment.user.email[0].toUpperCase()
    }
    return "U"
  }

  const getUserName = (comment: Comment) => {
    if (comment.user?.firstName || comment.user?.lastName) {
      return `${comment.user?.firstName || ""} ${comment.user?.lastName || ""}`.trim()
    }
    return comment.user?.email || "Unknown User"
  }

  return (
    <Card className="border-0 bg-gradient-to-br from-muted/30 to-muted/10">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Team Collaboration</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Discuss insights and share observations
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Textarea
            placeholder="Add a comment... Use @username to mention team members"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px] resize-none bg-background/50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Press Cmd/Ctrl + Enter to submit
            </p>
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || submitting}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/20"
            >
              <Send className="mr-2 h-4 w-4" />
              {submitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-brand" />
            Comments ({comments.length})
          </h4>
          
          <ScrollArea className="h-[400px] pr-4">
            <AnimatePresence>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No comments yet. Start the conversation!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.3 }}
                      className="flex gap-3 p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors group"
                    >
                      <Avatar className="h-8 w-8 border-2 border-brand/20">
                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xs">
                          {getUserInitials(comment)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">
                            {getUserName(comment)}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>
                      </div>
                      {comment.userId === currentUserId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(comment.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
