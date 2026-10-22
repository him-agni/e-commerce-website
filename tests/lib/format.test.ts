import { describe, expect, it } from "vitest";
import { formatPrice, variantLabel } from "@/lib/format";

describe("formatPrice", () => {
  it("turns cents into whole-dollar USD", () => {
    expect(formatPrice(129900)).toBe("$1,299");
    expect(formatPrice(4500)).toBe("$45");
    expect(formatPrice(0)).toBe("$0");
  });
});

describe("variantLabel", () => {
  it("joins color, size and design", () => {
    expect(variantLabel({ color: "Natural Oak", size: "Queen", design: "Slatted" })).toBe(
      "Natural Oak / Queen / Slatted",
    );
  });

  it("skips missing and empty parts", () => {
    expect(variantLabel({ color: "Ivory", size: null, design: "" })).toBe("Ivory");
    expect(variantLabel({ color: null, size: null, design: null })).toBe("");
  });
});
