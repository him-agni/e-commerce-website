import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MessageContent } from "@/components/assistant/message-content";

const html = (text: string, links?: Map<string, string>) =>
  renderToStaticMarkup(<MessageContent text={text} links={links} />);

describe("MessageContent", () => {
  it("renders paragraphs and joins wrapped lines", () => {
    expect(html("Hello there.\nStill the same paragraph.\n\nSecond one.")).toBe(
      '<div class="space-y-2"><p>Hello there. Still the same paragraph.</p><p>Second one.</p></div>',
    );
  });

  it("renders bullet and numbered lists separately", () => {
    const out = html("- one\n- two\n\n1. first\n2. second");
    expect(out).toContain('<ul class="list-disc space-y-1 pl-5"><li>one</li><li>two</li></ul>');
    expect(out).toContain('<ol class="list-decimal space-y-1 pl-5"><li>first</li><li>second</li></ol>');
  });

  it("starts a new list when the style changes", () => {
    const out = html("- a\n1. b");
    expect(out.match(/<ul/g)).toHaveLength(1);
    expect(out.match(/<ol/g)).toHaveLength(1);
  });

  it("renders bold text", () => {
    expect(html("This is **important**.")).toContain("<strong>important</strong>");
  });

  it("turns same-site markdown links into links", () => {
    const out = html("Try the [Aspen Bed](/products/aspen-slatted-bed).");
    expect(out).toContain('<a class="font-medium underline underline-offset-2 hover:text-wood" href="/products/aspen-slatted-bed">Aspen Bed</a>');
  });

  it("handles a link the model wrapped in bold", () => {
    const out = html("**[Aspen Bed](/products/aspen)**");
    expect(out).toMatch(/<strong><a [^>]*href="\/products\/aspen">Aspen Bed<\/a><\/strong>/);
  });

  it("never makes an external link clickable", () => {
    const out = html("[Click](https://evil.example/phish) and [Also](//evil.example/x)");
    expect(out).not.toContain("<a");
    expect(out).not.toContain("href");
  });

  it("shows protocol-relative links as plain text", () => {
    expect(html("[Sneaky](//evil.example)")).toContain("Sneaky");
    expect(html("[Sneaky](//evil.example)")).not.toContain("evil.example");
  });

  it("never lets model output inject markup", () => {
    const out = html('<img src=x onerror="alert(1)"> <script>alert(1)</script> [x](/a" onmouseover="alert(1))');
    expect(out).not.toContain("<img");
    expect(out).not.toContain("<script");
    expect(out).toContain("&lt;img");
    expect(out).not.toMatch(/<a[^>]*onmouseover/);
  });

  it("replaces a mistyped address with the real one for a product the assistant looked up", () => {
    const known = new Map([["aspen slatted bed", "/products/aspen-slatted-bed"]]);
    const out = html("See the [Aspen Slatted Bed](/products/Aspen-Slated-bed-2).", known);
    expect(out).toContain('href="/products/aspen-slatted-bed"');
    expect(out).not.toContain("Aspen-Slated");
  });

  it("keeps the typed address when the text is not a known product", () => {
    const known = new Map([["aspen slatted bed", "/products/aspen-slatted-bed"]]);
    expect(html("[Our sofas](/categories/sofas)", known)).toContain('href="/categories/sofas"');
  });

  it("renders plain text and empty input without crashing", () => {
    expect(html("just text")).toBe('<div class="space-y-2"><p>just text</p></div>');
    expect(html("")).toBe('<div class="space-y-2"></div>');
  });
});
