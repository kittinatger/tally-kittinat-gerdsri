"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useState } from "react";
import { todayInputValue } from "@/lib/format";
import { useT } from "@/lib/language-context";

type Message = { role: "user" | "assistant"; text: string };

const SUGGESTIONS = ["How much did I spend this month?", "What's my top spending category this month?", "Where do I spend the most?"];

export default function AssistantPanel() {
  const t = useT();
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || asking) return;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");
    setAsking(true);
    setError(null);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, today: todayInputValue() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not get an answer.");
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", text: data.answer }]);
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setAsking(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    ask(question);
  }

  return (
    <div>
      <h3 className="font-display text-xl text-foreground">{t("assistant.title")}</h3>
      <p className="mt-0.5 text-sm text-ink-soft">{t("assistant.description")}</p>

      <div className="mt-4 min-h-[120px] space-y-3 rounded-card border border-line bg-surface p-4">
        {messages.length === 0 ? (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                disabled={asking}
                className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground disabled:opacity-60"
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <p
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                  m.role === "user" ? "bg-navy text-white" : "bg-bg-soft text-foreground"
                }`}
              >
                {m.text}
              </p>
            </div>
          ))
        )}
        {asking && <p className="text-xs text-ink-soft">{t("common.loading")}</p>}
      </div>

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t("assistant.placeholder")}
          disabled={asking}
          className="min-w-0 flex-1 rounded-full border border-line bg-bg-soft px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={asking || !question.trim()}
          className="shrink-0 rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
        >
          {t("assistant.ask")}
        </button>
      </form>
    </div>
  );
}
