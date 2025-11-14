"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface Comment {
  id: number;
  content: string;
  commentType: string;
  createdAt: string;
  userId: number;
}

interface ProcessCommentsProps {
  processId: number;
}

export function ProcessComments({ processId }: ProcessCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComments();
  }, [processId]);

  async function loadComments() {
    try {
      const res = await fetch(`/api/comments?processId=${processId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Failed to load comments:", error);
    }
  }

  async function addComment() {
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/api/comments", {
        processId,
        content: newComment,
        type: "general",
      });

      if (res.ok) {
        toast.success("Comment added");
        setNewComment("");
        loadComments();
      } else {
        toast.error("Failed to add comment");
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setLoading(false);
    }
  }

  async function deleteComment(commentId: number) {
    try {
      const res = await apiClient.delete("/api/comments", { commentId });

      if (res.ok) {
        toast.success("Comment deleted");
        loadComments();
      } else {
        toast.error("Failed to delete comment");
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast.error("Failed to delete comment");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments & Annotations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment or annotation..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <Button onClick={addComment} disabled={loading}>
            <Send className="h-4 w-4 mr-2" />
            Add Comment
          </Button>
        </div>

        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between">
                  <p className="text-sm whitespace-pre-wrap flex-1">{comment.content}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteComment(comment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(comment.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
