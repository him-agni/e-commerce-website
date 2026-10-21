import Link from "next/link";
import type { ReactNode } from "react";

// Renders the small subset of markdown the assistant uses: paragraphs, "- " bullets, **bold**
// and [text](/internal/link). Built from React elements, never raw HTML, so model output cannot
// inject markup, and only same-site links are made clickable.

const INLINE = /\[([^\]]+)\]\((\/[^)\s]*)\)|\*\*([^*]+)\*\*/g;

/** Product and category names the assistant has looked up, mapped to their real addresses (keys lowercased). */
export type KnownLinks = ReadonlyMap<string, string>;

function renderInline(text: string, known?: KnownLinks): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    const [, label, rawHref, bold] = match;
    // The model sometimes mistypes an address (wrong capital letter, an extra word). When the link text is a
    // product we looked up, trust our own address over the one it typed.
    const href = (label && known?.get(label.toLowerCase().trim())) || rawHref;
    if (label && href) {
      // "//host" would be a protocol-relative external link, so treat it as plain text.
      nodes.push(
        href.startsWith("//") ? (
          label
        ) : (
          <Link
            key={index}
            href={href}
            className="font-medium underline underline-offset-2 hover:text-wood"
          >
            {label}
          </Link>
        ),
      );
    } else if (bold) {
      // The model sometimes wraps a link in bold: **[Name](/products/x)**.
      nodes.push(<strong key={index}>{renderInline(bold, known)}</strong>);
    }
    last = index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function MessageContent({ text, links }: { text: string; links?: KnownLinks }) {
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  let numbered = false;
  let paragraph: string[] = [];

  const flushBullets = () => {
    if (bullets.length === 0) return;
    const List = numbered ? "ol" : "ul";
    blocks.push(
      <List
        key={`list-${blocks.length}`}
        className={numbered ? "list-decimal space-y-1 pl-5" : "list-disc space-y-1 pl-5"}
      >
        {bullets.map((item, i) => (
          <li key={i}>{renderInline(item, links)}</li>
        ))}
      </List>,
    );
    bullets = [];
  };
  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push(<p key={`p-${blocks.length}`}>{renderInline(paragraph.join(" "), links)}</p>);
    paragraph = [];
  };

  for (const line of text.split("\n")) {
    const bullet = line.match(/^\s*(?:([-*•])|(\d+[.)]))\s+(.*)$/);
    if (bullet) {
      flushParagraph();
      // A change between bullet and numbered style starts a new list.
      if (bullets.length > 0 && numbered !== Boolean(bullet[2])) flushBullets();
      numbered = Boolean(bullet[2]);
      bullets.push(bullet[3]);
    } else if (line.trim() === "") {
      flushParagraph();
      flushBullets();
    } else {
      flushBullets();
      paragraph.push(line.trim());
    }
  }
  flushParagraph();
  flushBullets();

  return <div className="space-y-2">{blocks}</div>;
}
