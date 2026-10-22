import { describe, expect, it } from "vitest";
import { tagText, tagTitle, tagsOf } from "@/lib/tags";

describe("tags", () => {
  it("shows a tag as a hashtag", () => {
    expect(tagText("accent-chair")).toBe("#accent-chair");
  });

  it("makes a readable title", () => {
    expect(tagTitle("accent-chair")).toBe("Accent chair");
    expect(tagTitle("rug")).toBe("Rug");
  });

  it("collects distinct tags across products, sorted, ignoring nulls", () => {
    const products = [
      { tags: ["tv-stand", "console-table"] },
      { tags: null },
      { tags: ["tv-stand", null] },
      { tags: [] },
    ];
    expect(tagsOf(products)).toEqual(["console-table", "tv-stand"]);
  });

  it("returns nothing for products without tags", () => {
    expect(tagsOf([{ tags: null }])).toEqual([]);
    expect(tagsOf([])).toEqual([]);
  });
});
