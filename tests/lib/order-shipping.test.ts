import { beforeEach, describe, expect, it, vi } from "vitest";
import { getShipTo } from "@/lib/order-shipping";

const { retrieve } = vi.hoisted(() => ({ retrieve: vi.fn() }));
vi.mock("@/lib/stripe", () => ({ stripe: { checkout: { sessions: { retrieve } } } }));

const session = (overrides: Record<string, unknown> = {}) => ({
  client_reference_id: "user_123",
  collected_information: {
    shipping_details: {
      name: "Pat Buyer",
      address: { line1: "1 Main St", city: "Austin", state: "TX", postal_code: "78701" },
    },
  },
  ...overrides,
});

describe("getShipTo", () => {
  beforeEach(() => {
    retrieve.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns the address to the person who placed the order", async () => {
    retrieve.mockResolvedValue(session());
    expect(await getShipTo("cs_test_1", "user_123")).toEqual({
      name: "Pat Buyer",
      line1: "1 Main St",
      city: "Austin",
      state: "TX",
      postalCode: "78701",
    });
  });

  it("never shows an address to anyone else", async () => {
    retrieve.mockResolvedValue(session());
    expect(await getShipTo("cs_test_1", "user_someone_else")).toBeNull();
  });

  it("returns nothing, without calling Stripe, when there is no session id", async () => {
    expect(await getShipTo(null, "user_123")).toBeNull();
    expect(await getShipTo(undefined, "user_123")).toBeNull();
    expect(retrieve).not.toHaveBeenCalled();
  });

  it("returns nothing when no address was collected", async () => {
    retrieve.mockResolvedValue(session({ collected_information: { shipping_details: null } }));
    expect(await getShipTo("cs_test_1", "user_123")).toBeNull();
  });

  it("copes with a partial address", async () => {
    retrieve.mockResolvedValue(
      session({ collected_information: { shipping_details: { name: null, address: { line1: "1 Main St" } } } }),
    );
    expect(await getShipTo("cs_test_1", "user_123")).toEqual({
      name: undefined,
      line1: "1 Main St",
      city: undefined,
      state: undefined,
      postalCode: undefined,
    });
  });

  it("returns nothing, rather than throwing, when Stripe fails", async () => {
    retrieve.mockRejectedValue(new Error("stripe is down"));
    expect(await getShipTo("cs_test_1", "user_123")).toBeNull();
  });
});
