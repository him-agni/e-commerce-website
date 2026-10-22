import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit } from "@/lib/ai/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to the limit, then blocks with a retry time", () => {
    const opts = { limit: 3, windowMs: 60_000 };
    expect(checkRateLimit("a", opts).ok).toBe(true);
    expect(checkRateLimit("a", opts).ok).toBe(true);
    expect(checkRateLimit("a", opts).ok).toBe(true);

    vi.advanceTimersByTime(20_000);
    expect(checkRateLimit("a", opts)).toEqual({ ok: false, retryAfterSeconds: 40 });
  });

  it("lets requests through again once the window has passed", () => {
    const opts = { limit: 1, windowMs: 10_000 };
    expect(checkRateLimit("b", opts).ok).toBe(true);
    expect(checkRateLimit("b", opts).ok).toBe(false);
    vi.advanceTimersByTime(10_001);
    expect(checkRateLimit("b", opts).ok).toBe(true);
  });

  it("counts each key separately", () => {
    const opts = { limit: 1, windowMs: 60_000 };
    expect(checkRateLimit("user:1", opts).ok).toBe(true);
    expect(checkRateLimit("user:2", opts).ok).toBe(true);
    expect(checkRateLimit("user:1", opts).ok).toBe(false);
  });

  it("does not count blocked attempts against the window", () => {
    const opts = { limit: 1, windowMs: 10_000 };
    checkRateLimit("c", opts);
    vi.advanceTimersByTime(5_000);
    checkRateLimit("c", opts); // blocked
    vi.advanceTimersByTime(5_001); // the first hit has now expired
    expect(checkRateLimit("c", opts).ok).toBe(true);
  });
});
