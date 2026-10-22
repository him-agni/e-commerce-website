import { describe, expect, it } from "vitest";
import { baseSecurityHeaders, contentSecurityPolicy } from "@/lib/security-headers";

const directive = (name: string) =>
  contentSecurityPolicy
    .split("; ")
    .find((d) => d.startsWith(`${name} `))
    ?.slice(name.length + 1)
    .split(" ");

describe("Content-Security-Policy", () => {
  it("falls back to this site's own origin", () => {
    expect(directive("default-src")).toEqual(["'self'"]);
  });

  it("forbids framing, plugins and a changed base address", () => {
    expect(directive("frame-ancestors")).toEqual(["'none'"]);
    expect(directive("object-src")).toEqual(["'none'"]);
    expect(directive("base-uri")).toEqual(["'self'"]);
  });

  it("never allows eval or arbitrary scripts", () => {
    const scripts = directive("script-src")!;
    expect(scripts).not.toContain("'unsafe-eval'");
    expect(scripts).not.toContain("https:");
    expect(scripts).not.toContain("*");
    expect(scripts.filter((s) => s.startsWith("https://"))).toEqual([
      "https://*.clerk.accounts.dev",
      "https://challenges.cloudflare.com",
      "https://*.protect.clerk.com",
    ]);
  });

  it("only lets pages connect to this site and Clerk", () => {
    for (const source of directive("connect-src")!) {
      expect(source).toMatch(/^'self'$|clerk/);
    }
  });

  it("upgrades insecure requests and has no bare wildcard anywhere", () => {
    expect(contentSecurityPolicy).toContain("upgrade-insecure-requests");
    expect(contentSecurityPolicy).not.toMatch(/(^|[ ;])\*([ ;]|$)/);
  });
});

describe("base security headers", () => {
  const byKey = Object.fromEntries(baseSecurityHeaders.map((h) => [h.key, h.value]));

  it("stops content sniffing and framing, and limits what other sites learn", () => {
    expect(byKey["X-Content-Type-Options"]).toBe("nosniff");
    expect(byKey["X-Frame-Options"]).toBe("DENY");
    expect(byKey["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });

  it("switches off browser features the shop does not use", () => {
    for (const feature of ["camera", "microphone", "geolocation", "payment"]) {
      expect(byKey["Permissions-Policy"]).toContain(`${feature}=()`);
    }
  });
});
