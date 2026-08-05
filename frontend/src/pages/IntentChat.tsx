import { Send } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { detectIntent } from "../api/client";
import { GoalAnswers } from "../api/types";
import { cn } from "@/lib/utils";

type ChatMessage = { from: "bot" | "user"; text: string };

const GREETING = "سلام! چه کمکی از دستم برمیاد؟ می‌تونی با زبون خودت بگی چی می‌خوای.";

function ChatBubble({ message }: { message: ChatMessage }) {
  const isBot = message.from === "bot";
  return (
    <div className={cn("flex", isBot ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-7 sm:max-w-[75%]",
          isBot ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
        )}
      >
        {message.text}
      </div>
    </div>
  );
}

export default function IntentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([{ from: "bot", text: GREETING }]);
  const [input, setInput] = useState("");
  const [detectedGoal, setDetectedGoal] = useState<GoalAnswers["primaryGoal"] | null>(null);
  const [awaitingReply, setAwaitingReply] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSend() {
    const text = input.trim();
    if (!text) return;

    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    setAwaitingReply(true);
    setError(null);

    try {
      const result = await detectIntent(text);
      setDetectedGoal(result.goal);
      setMessages((m) => [...m, { from: "bot", text: result.reflection }]);
      setResolved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای ناشناخته");
    } finally {
      setAwaitingReply(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-5.5rem)] flex-col sm:h-[calc(100vh-6.5rem)]">
      <div className="flex-1 space-y-3 overflow-y-auto pb-3">
        {messages.map((m, i) => (
          <ChatBubble key={i} message={m} />
        ))}
        {awaitingReply && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
              در حال بررسی...
            </div>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {resolved && (
          <div className="flex justify-start">
            <Button onClick={() => navigate("/intake", { state: { initialGoal: detectedGoal } })}>
              شروع سؤالات
            </Button>
          </div>
        )}
      </div>

      {!resolved && (
        <div className="flex items-center gap-2 border-t pt-3">
          <Input
            value={input}
            disabled={awaitingReply}
            placeholder="مثلاً: می‌خوام وزن کم کنم..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
          />
          <Button size="icon" disabled={awaitingReply || !input.trim()} onClick={handleSend}>
            <Send className="-scale-x-100" />
          </Button>
        </div>
      )}
    </div>
  );
}
