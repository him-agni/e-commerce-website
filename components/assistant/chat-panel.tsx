"use client";

import { useChat } from "@ai-sdk/react";
import { RotateCcw, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ProductHit } from "@/lib/ai/tools";
import { cn } from "@/lib/utils";
import { MessageContent, type KnownLinks } from "./message-content";
import { ProductHits } from "./product-hits";

const MAX_LENGTH = 500;

const SUGGESTIONS = [
  "Help me choose a dining table",
  "Show me linen sofas",
  "Gift ideas under $60",
  "Where is my order?",
];

const TOOL_LABELS: Record<string, string> = {
  "tool-searchProducts": "Searching the catalog…",
  "tool-getProductDetails": "Checking product details…",
  "tool-listCategories": "Looking at categories…",
  "tool-getMyOrders": "Looking up your orders…",
};

/** Names and real addresses of every product or category the assistant has looked up in this chat. */
function collectLinks(messages: ReturnType<typeof useChat>["messages"]): KnownLinks {
  const links = new Map<string, string>();
  const add = (name: unknown, url: unknown) => {
    if (typeof name === "string" && typeof url === "string" && url.startsWith("/")) {
      links.set(name.toLowerCase().trim(), url);
    }
  };
  for (const message of messages) {
    for (const part of message.parts) {
      if (!part.type.startsWith("tool-") || !("state" in part) || part.state !== "output-available") continue;
      const output = part.output as unknown;
      if (Array.isArray(output)) {
        for (const item of output) add(item?.name, item?.url); // listCategories
      } else if (output && typeof output === "object") {
        const o = output as { products?: { name?: unknown; url?: unknown }[]; name?: unknown; url?: unknown };
        for (const product of o.products ?? []) add(product.name, product.url); // searchProducts
        add(o.name, o.url); // getProductDetails
      }
    }
  }
  return links;
}

/** Our API returns {"error": "..."} for rate limits and bad input; anything else is a model failure. */
function friendlyError(message: string | undefined) {
  try {
    const parsed = JSON.parse(message ?? "");
    if (typeof parsed?.error === "string") return parsed.error;
  } catch {
    // not JSON
  }
  return "The assistant is busy right now. Please try again in a minute.";
}

/**
 * The chat window. Loaded on demand by ChatWidget so the AI SDK is not downloaded on every page.
 * Once loaded it stays mounted (hidden when closed) so the conversation survives closing the window.
 */
export function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error, regenerate, clearError } = useChat();

  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const busy = status === "submitted" || status === "streaming";
  const links = collectLinks(messages);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Escape closes the window from anywhere on the page. Listening on the window (not just inside
  // the panel) matters because focus can leave the panel, e.g. when the Send button disables
  // itself while an answer streams.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status, error, open]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    if (error) clearError();
    sendMessage({ text: trimmed });
    setInput("");
    // Keep the cursor in the box so the next message (or Escape) works without clicking again.
    inputRef.current?.focus();
  }

  return (
    <section
      hidden={!open}
      role="dialog"
      aria-label="Shopping assistant"
      className="fixed inset-x-3 bottom-20 z-50 flex h-[min(34rem,calc(100dvh-7rem))] flex-col overflow-hidden rounded-xl border bg-card shadow-2xl sm:inset-x-auto sm:right-4 sm:w-[24rem]"
    >
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="font-heading text-lg leading-tight">Shopping assistant</h2>
          <p className="text-xs text-muted-foreground">Ask about our furniture</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close assistant"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" />
        </button>
      </header>

      <div
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm"
      >
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="rounded-xl bg-muted px-3 py-2">
              Hi! I can help you find the right piece, compare options, or check on
              an order. What are you looking for?
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="rounded-full border px-3 py-1.5 text-xs transition-colors hover:border-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn("flex flex-col gap-2", message.role === "user" && "items-end")}
          >
            {message.parts.map((part, index) => {
              const key = `${message.id}-${index}`;

              if (part.type === "text") {
                if (!part.text.trim()) return null;
                return message.role === "user" ? (
                  <p
                    key={key}
                    className="max-w-[85%] whitespace-pre-wrap rounded-xl bg-primary px-3 py-2 text-primary-foreground"
                  >
                    {part.text}
                  </p>
                ) : (
                  <div key={key} className="max-w-[92%] rounded-xl bg-muted px-3 py-2">
                    <MessageContent text={part.text} links={links} />
                  </div>
                );
              }

              if (part.type.startsWith("tool-") && "state" in part) {
                if (part.state !== "output-available") {
                  if (part.state === "output-error") return null;
                  return (
                    <p key={key} className="text-xs italic text-muted-foreground">
                      {TOOL_LABELS[part.type] ?? "Working on it…"}
                    </p>
                  );
                }
                if (part.type === "tool-searchProducts") {
                  const products = (part.output as { products?: ProductHit[] })?.products;
                  return products?.length ? (
                    <ProductHits key={key} products={products} />
                  ) : null;
                }
              }
              return null;
            })}
          </div>
        ))}

        {status === "submitted" && (
          <p className="text-xs italic text-muted-foreground">Thinking…</p>
        )}

        {error && (
          <div
            role="alert"
            className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive"
          >
            <p>{friendlyError(error.message)}</p>
            <button
              type="button"
              onClick={() => {
                clearError();
                regenerate();
              }}
              className="flex items-center gap-1.5 text-xs underline underline-offset-2"
            >
              <RotateCcw className="size-3.5" />
              Try again
            </button>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
        className="border-t p-3"
      >
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={MAX_LENGTH}
            placeholder="Ask about a product…"
            aria-label="Your message"
            className="h-9 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <Button
            type="submit"
            size="icon-lg"
            aria-label="Send message"
            disabled={busy || input.trim() === ""}
          >
            <Send />
          </Button>
        </div>
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          Replies come from Google&rsquo;s Gemini on its free tier, which Google may review and use to
          improve its products. AI can be wrong. Please do not share personal or payment details.{" "}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Privacy
          </a>
        </p>
      </form>
    </section>
  );
}
