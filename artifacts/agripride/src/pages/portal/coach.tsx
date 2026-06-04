import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useUser } from "@clerk/react";
import { Brain, ArrowLeft, Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const BASE = `${import.meta.env.BASE_URL}api`.replace(/\/\/$/, "/");

const STARTERS = [
  "What loans are available and how much can I borrow?",
  "How can I improve my loan approval chances?",
  "What is the interest rate on agricultural loans?",
  "How do I repay my loan through M-Pesa?",
  "What crops qualify for the highest loan amounts?",
  "Kuna mikopo gani inayopatikana?",
];

export function FinancialCoach() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Habari! I'm your AgriPride Financial Coach. I can help you understand our agricultural loans, advise on financial strategies for your farm, and answer any questions about borrowing, repayment, or improving your creditworthiness. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(`${BASE}/applicant/coach`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.slice(-10),
        }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            "Sorry, I encountered an issue. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 flex flex-col" style={{ height: "calc(100vh - 8rem)" }}>
      {/* Header */}
      <div className="flex items-center gap-4 shrink-0">
        <Link href="/portal">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="bg-primary/10 text-primary rounded-xl p-2.5">
          <Brain className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            Financial Coach
            <Badge variant="secondary" className="text-xs">AI</Badge>
          </h1>
          <p className="text-muted-foreground text-xs">
            Ask anything about AgriPride loans, repayment, or farm finance
          </p>
        </div>
      </div>

      {/* Starters */}
      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 shrink-0">
          {STARTERS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-left"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-1">
                <Bot className="h-3.5 w-3.5" />
              </div>
            )}
            <Card
              className={`max-w-[80%] ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground border-primary/50"
                  : "bg-card"
              }`}
            >
              <CardContent className="py-3 px-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </CardContent>
            </Card>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-1">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <Card className="bg-card">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 shrink-0 pb-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about loans, repayment, farm finance... (Enter to send)"
          className="resize-none min-h-[44px] max-h-32 flex-1 text-sm"
          rows={1}
          disabled={isLoading}
        />
        <Button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isLoading}
          size="icon"
          className="h-[44px] w-[44px] shrink-0"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
