"use client";

import { describeFetchError } from "@/lib/fetch-error";
import { useEffect, useRef, useState } from "react";
import { todayInputValue } from "@/lib/format";
import { useT } from "@/lib/language-context";

type Message = { role: "user" | "assistant"; text: string; model?: string };

const SUGGESTIONS = ["How much did I spend this month?", "What's my top spending category this month?", "Where do I spend the most?"];

// askAssistant makes 2 sequential model calls per attempt — generous
// headroom over the server's own worst case (see gemini.ts's
// REQUEST_TIMEOUT_MS and withGeminiFallback) so a genuinely stuck request
// still resolves to a clear error instead of leaving the chat "typing"
// forever.
const ASK_FETCH_TIMEOUT_MS = 100_000;

function BotAvatar() {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-white">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M10 2.5c-3.6 0-6.5 2.5-6.5 5.75 0 1.85.95 3.5 2.45 4.6L5 17l3.35-1.5c.53.1 1.08.15 1.65.15 3.6 0 6.5-2.5 6.5-5.75S13.6 2.5 10 2.5Z" />
        <circle cx="7.25" cy="8.25" r="0.9" fill="currentColor" stroke="none" />
        <circle cx="10" cy="8.25" r="0.9" fill="currentColor" stroke="none" />
        <circle cx="12.75" cy="8.25" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
      <path d="M17 3 3 9.5l6 2.5 2 6L17 3Z" />
      <path d="M17 3 9 11" />
    </svg>
  );
}

// Three staggered bouncing dots instead of a plain "Loading..." line —
// reads as "thinking", matching the typing indicator every real chat app
// (iMessage, WhatsApp, ChatGPT) uses while waiting on a reply.
function TypingDots() {
  return (
    <span className="flex items-center gap-1 rounded-2xl bg-bg-soft px-3.5 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-soft"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </span>
  );
}

export default function AssistantPanel() {
  const t = useT();
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keeps the latest message (or the typing indicator) in view as the
  // conversation grows — the one thing that makes a fixed-height scroll
  // area actually feel like a live chat instead of a static log.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, asking]);

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
        signal: AbortSignal.timeout(ASK_FETCH_TIMEOUT_MS),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not get an answer.");
        return;
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.answer, model: typeof data.model === "string" ? data.model : undefined },
      ]);
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
    <div className="flex h-[calc(100dvh-260px)] min-h-[440px] flex-col">
      <h3 className="font-display text-xl text-foreground">{t("assistant.title")}</h3>

      {/* A real chat surface — its own scroll region with messages
       * anchored to the bottom, not a loosely-bounded box floating in the
       * page's own scroll (the min-h-[120px] box this replaced). */}
      <div className="mt-3 flex flex-1 flex-col overflow-hidden rounded-card border border-line bg-surface">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
              <BotAvatar />
              <div>
                <p className="font-display text-lg text-foreground">{t("assistant.title")}</p>
                <p className="mt-1 text-sm text-ink-soft">{t("assistant.description")}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
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
            </div>
          ) : (
            <>
              {messages.map((m, i) => (
                <div key={i} className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "assistant" && <BotAvatar />}
                  <div className={`flex max-w-[80%] flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                    <p
                      className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "rounded-br-md bg-navy text-white"
                          : "rounded-bl-md bg-bg-soft text-foreground"
                      }`}
                    >
                      {m.text}
                    </p>
                    {m.role === "assistant" && m.model && (
                      <p className="mt-1 px-1 text-[10px] text-ink-soft/70">{t("ai.answeredBy").replace("{model}", m.model)}</p>
                    )}
                  </div>
                </div>
              ))}
              {asking && (
                <div className="flex items-end justify-start gap-2">
                  <BotAvatar />
                  <TypingDots />
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {error && <p className="border-t border-line px-4 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-line p-3">
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
            aria-label={t("assistant.ask")}
            disabled={asking || !question.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
          >
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  );
}
