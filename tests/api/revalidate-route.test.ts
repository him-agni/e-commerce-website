import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/revalidate/route";

const { parseBody, revalidateTag } = vi.hoisted(() => ({ parseBody: vi.fn(), revalidateTag: vi.fn() }));

vi.mock("next-sanity/webhook", () => ({ parseBody }));
vi.mock("next/cache", () => ({ revalidateTag }));

const call = () => POST(new Request("https://shop.test/api/revalidate", { method: "POST" }) as NextRequest);
const valid = (body: unknown) => parseBody.mockResolvedValue({ isValidSignature: true, body });

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    parseBody.mockReset();
    revalidateTag.mockReset();
    process.env.SANITY_REVALIDATE_SECRET = "revalidate_unit_tests_only";
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("fails closed when no secret is configured", async () => {
    delete process.env.SANITY_REVALIDATE_SECRET;
    expect((await call()).status).toBe(500);
    expect(parseBody).not.toHaveBeenCalled();
  });

  it("verifies the signature with the configured secret", async () => {
    valid({ _type: "product", slug: "aspen" });
    await call();
    expect(parseBody).toHaveBeenCalledWith(expect.anything(), "revalidate_unit_tests_only", true);
  });

  it("rejects an invalid signature and refreshes nothing", async () => {
    parseBody.mockResolvedValue({ isValidSignature: false, body: { _type: "product", slug: "aspen" } });
    expect((await call()).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects a payload without a document type", async () => {
    valid({});
    expect((await call()).status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("refreshes the product list and that product's page when a product changes", async () => {
    valid({ _type: "product", slug: "aspen" });
    const res = await call();

    expect(await res.json()).toEqual({ revalidated: ["products", "product:aspen"] });
    expect(revalidateTag).toHaveBeenCalledWith("products", { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith("product:aspen", { expire: 0 });
  });

  it("refreshes just the product list when the slug is missing", async () => {
    valid({ _type: "product", slug: null });
    expect(await (await call()).json()).toEqual({ revalidated: ["products"] });
  });

  it("refreshes categories and products when a category changes", async () => {
    valid({ _type: "category", slug: "beds" });
    expect(await (await call()).json()).toEqual({ revalidated: ["categories", "products"] });
  });

  it("ignores documents the storefront does not cache", async () => {
    valid({ _type: "order" });
    const res = await call();
    expect(await res.json()).toEqual({ ignored: "order" });
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
