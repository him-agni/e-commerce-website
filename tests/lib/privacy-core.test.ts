import { describe, expect, it } from "vitest";
import { createPseudonyms } from "@/lib/privacy-core.mjs";

const SECRET = "a-test-secret-that-is-at-least-thirty-two-characters";
const ids = createPseudonyms(SECRET);

describe("createPseudonyms", () => {
  it("refuses a missing or short secret", () => {
    expect(() => createPseudonyms(undefined)).toThrow("ORDER_ID_SECRET");
    expect(() => createPseudonyms("")).toThrow("ORDER_ID_SECRET");
    expect(() => createPseudonyms("too-short")).toThrow("at least 32");
  });
});

describe("one-way stand-ins", () => {
  it("always gives the same value for the same input, so a customer's orders can be found", () => {
    expect(ids.userKey("user_123")).toBe(ids.userKey("user_123"));
    expect(ids.orderId("cs_test_1")).toBe(ids.orderId("cs_test_1"));
    expect(ids.orderNumber("cs_test_1")).toBe(ids.orderNumber("cs_test_1"));
  });

  it("gives different values for different inputs", () => {
    expect(ids.userKey("user_123")).not.toBe(ids.userKey("user_124"));
    expect(ids.orderId("cs_test_1")).not.toBe(ids.orderId("cs_test_2"));
  });

  it("has the shape the rest of the app expects", () => {
    expect(ids.userKey("user_123")).toMatch(/^[0-9a-f]{32}$/);
    expect(ids.orderId("cs_test_1")).toMatch(/^order-[0-9a-f]{32}$/);
    expect(ids.orderNumber("cs_test_1")).toMatch(/^MF-[0-9A-F]{8}$/);
  });

  it("does not contain, or reveal, the original value", () => {
    for (const value of [ids.userKey("user_123"), ids.orderId("cs_test_abc"), ids.orderNumber("cs_test_abc")]) {
      expect(value).not.toContain("user_123");
      expect(value).not.toContain("cs_test_abc");
      expect(value).not.toContain("abc");
    }
  });

  it("depends on the secret: someone with only the database cannot recompute them", () => {
    const other = createPseudonyms("a-completely-different-secret-of-sufficient-length");
    expect(other.userKey("user_123")).not.toBe(ids.userKey("user_123"));
    expect(other.orderId("cs_test_1")).not.toBe(ids.orderId("cs_test_1"));
  });

  it("keeps each purpose separate, so one kind of value cannot stand in for another", () => {
    expect(ids.userKey("same-input")).not.toBe(ids.orderId("same-input").replace("order-", ""));
  });
});

describe("sealed session ids", () => {
  const session = "cs_test_a1b2C3d4E5f6";

  it("round-trips through the same secret", () => {
    expect(ids.openSessionId(ids.sealSessionId(session))).toBe(session);
  });

  it("does not show the session id, and differs every time", () => {
    const a = ids.sealSessionId(session);
    const b = ids.sealSessionId(session);
    expect(a).not.toContain(session);
    expect(a).not.toContain("cs_test");
    expect(a).not.toBe(b);
    expect(ids.openSessionId(b)).toBe(session);
  });

  it("cannot be opened with a different secret", () => {
    const other = createPseudonyms("a-completely-different-secret-of-sufficient-length");
    expect(other.openSessionId(ids.sealSessionId(session))).toBeNull();
  });

  it("detects tampering and garbage instead of returning something wrong", () => {
    const sealed = ids.sealSessionId(session);
    const [version, iv, tag, data] = sealed.split(".");
    const flipped = data.slice(0, -2) + (data.endsWith("A") ? "BB" : "AA");

    expect(ids.openSessionId(`${version}.${iv}.${tag}.${flipped}`)).toBeNull();
    expect(ids.openSessionId(`v2.${iv}.${tag}.${data}`)).toBeNull();
    expect(ids.openSessionId("not-a-sealed-value")).toBeNull();
    expect(ids.openSessionId("")).toBeNull();
    expect(ids.openSessionId(null)).toBeNull();
    expect(ids.openSessionId(undefined)).toBeNull();
  });
});
