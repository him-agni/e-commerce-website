"use client";

import { useEffect } from "react";

/**
 * One shared IntersectionObserver for every [data-reveal] block on the page, so the blocks
 * themselves stay plain server HTML instead of each being a separate hydrated component.
 * Renders nothing. Mount it once on any page that uses <Reveal>.
 */
export function RevealController() {
  useEffect(() => {
    const blocks = document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])");
    if (typeof IntersectionObserver === "undefined") {
      blocks.forEach((block) => (block.dataset.revealed = ""));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.revealed = "";
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    blocks.forEach((block) => observer.observe(block));
    return () => observer.disconnect();
  }, []);

  return null;
}
