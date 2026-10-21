"use client";

import { MessageCircle, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";

// The chat window pulls in the AI SDK, so it is only downloaded once someone shows interest.
const loadPanel = () => import("./chat-panel").then((module) => module.ChatPanel);
const ChatPanel = dynamic(loadPanel, { ssr: false });

/** The floating launcher shown on every page. Cheap to load; the chat window loads on demand. */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [wasOpened, setWasOpened] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);

  function openPanel() {
    setWasOpened(true);
    setOpen(true);
  }

  function closePanel() {
    setOpen(false);
    launcherRef.current?.focus();
  }

  return (
    <>
      {wasOpened && <ChatPanel open={open} onClose={closePanel} />}

      <button
        ref={launcherRef}
        type="button"
        onClick={() => (open ? closePanel() : openPanel())}
        // Start downloading the chat window as soon as the pointer or keyboard gets near.
        onPointerEnter={loadPanel}
        onFocus={loadPanel}
        aria-expanded={open}
        // The accessible name must contain the visible text ("Ask us" / "Close").
        aria-label={open ? "Close shopping assistant" : "Ask us: open shopping assistant"}
        className="fixed bottom-4 right-4 z-50 flex h-12 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
        <span className="hidden sm:inline">{open ? "Close" : "Ask us"}</span>
      </button>
    </>
  );
}
