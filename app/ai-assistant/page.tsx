"use client";

import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Send, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI Process Mining Assistant. I can help you analyze your processes, identify bottlenecks, suggest optimizations, and answer questions about your data. How can I help you today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [processes, setProcesses] = useState<any[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState("all");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProcesses();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadProcesses() {
    try {
      const res = await fetch("/api/processes");
      if (res.ok) {
        const data = await res.json();
        setProcesses(data.processes || []);
      }
    } catch (error) {
      console.error("Failed to load processes:", error);
      setProcesses([]);
    }
  }

  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await apiClient.post("/api/ai-assistant", {
        query: input,
        processId: selectedProcessId && selectedProcessId !== "all" ? parseInt(selectedProcessId) : null,
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMessage: Message = {
          role: "assistant",
          content: data.response,
          timestamp: data.timestamp,
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        toast.error("Failed to get response");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    "What are my slowest processes?",
    "Identify the main bottlenecks",
    "Show me automation opportunities",
    "Calculate potential cost savings",
  ];

  return (
    <AppLayout>
      <div className="space-y-6 h-[calc(100vh-200px)]">
        <div>
          <h1 className="text-3xl font-bold">AI Process Assistant</h1>
          <p className="text-muted-foreground mt-2">
            Chat with AI to get insights, recommendations, and answers about your processes
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedProcessId} onValueChange={setSelectedProcessId}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a process (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All processes</SelectItem>
              {processes.map((process) => (
                <SelectItem key={process.id} value={process.id.toString()}>
                  {process.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            {quickQuestions.map((question, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(question);
                  setTimeout(() => sendMessage(), 100);
                }}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>

        <Card className="flex-1 flex flex-col h-[calc(100%-200px)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-brand" />
              Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-brand" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === "user"
                        ? "bg-brand text-white"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-brand animate-pulse" />
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm">Thinking...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Ask anything about your processes..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
              <Button onClick={sendMessage} disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
