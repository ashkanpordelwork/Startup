import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getChatMessages } from "../api/client";
import { ChatMessage } from "../api/types";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("fa-IR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ChatArchive() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getChatMessages()
      .then(setMessages)
      .catch((e) => setError(e instanceof Error ? e.message : "خطای ناشناخته"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">آرشیو گفتگوها</h1>
        <Link to="/profile" className="text-sm text-primary">
          برگشت
        </Link>
      </div>

      {loading && <p className="text-base text-helper-foreground">در حال بارگذاری...</p>}
      {error && <p className="text-base text-destructive">{error}</p>}
      {!loading && messages.length === 0 && (
        <p className="text-base text-helper-foreground">هنوز گفتگویی ثبت نشده.</p>
      )}

      {messages.map((m) => (
        <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
          <div
            className={
              m.role === "user"
                ? "max-w-[80%] rounded-bubble rounded-es-md bg-primary px-4 py-2.5 text-base leading-relaxed text-primary-foreground"
                : "max-w-[80%] rounded-bubble rounded-ee-md bg-card px-4 py-2.5 text-base leading-relaxed shadow-sm"
            }
          >
            {m.text}
            <div className={m.role === "user" ? "mt-1 text-xs text-primary-foreground/70" : "mt-1 text-xs text-muted-foreground"}>
              {formatTime(m.createdAt)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
