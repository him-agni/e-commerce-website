"use client";

import { Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Shares the product page. On phones this opens the system share sheet; where that is not
 * available (most desktop browsers) it copies the link and says so.
 */
export function ShareButton({ slug, name }: { slug: string; name: string }) {
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function say(text: string) {
    setMessage(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(""), 2500);
  }

  async function share() {
    // The product's own page, without any selected options, so the link is clean to send.
    const url = `${window.location.origin}/products/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text: `${name} at My Farmhouse`, url });
        return;
      } catch (error) {
        // Closing the share sheet is not an error.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      say("Link copied");
    } catch {
      say("Copy this page's address from the address bar");
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Share ${name}`}
        title="Share"
        onClick={share}
        className="flex size-11 shrink-0 items-center justify-center rounded-md border transition-colors hover:border-foreground"
      >
        <Share2 aria-hidden className="size-5" />
      </button>
      <span
        role="status"
        className={
          message
            ? "absolute right-0 top-full z-10 mt-2 whitespace-nowrap rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-lg"
            : "sr-only"
        }
      >
        {message}
      </span>
    </div>
  );
}
