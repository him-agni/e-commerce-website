import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { formatPrice, variantLabel } from "@/lib/format";
import {
  getAssistantCatalog,
  getCategories,
  getProduct,
} from "@/lib/sanity/data";
import { ORDERS_BY_USER_QUERY } from "@/lib/sanity/queries";
import { freshClient } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import { rankProducts } from "./search";

/** What the chat widget renders as a product card. Mirrors searchProducts' output. */
export type ProductHit = {
  name: string;
  url: string;
  category: string;
  price: string;
  inStock: boolean;
  material: string | null;
  summary: string;
  colors: string[];
  sizes: string[];
  imageUrl: string | null;
};

const summarize = (text: string | null, max = 140) => {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
};

const stockLabel = (stock: number) =>
  stock <= 0 ? "sold out" : stock <= 5 ? `only ${stock} left` : "in stock";

/**
 * Tools the shopping assistant can call. `userId` comes from the server-side session,
 * never from the model or the browser, so the model cannot ask for someone else's orders.
 */
export function createAssistantTools({ userId }: { userId: string | null }) {
  return {
    searchProducts: tool({
      description:
        "Search the My Farmhouse catalog. Use short keywords (e.g. 'linen sofa', 'round dining table'). " +
        "You can also filter by category and price. Returns up to 6 matching products with prices and links.",
      inputSchema: z.object({
        query: z
          .string()
          .max(100)
          .optional()
          .describe("Short keywords. Omit to browse by category or price only."),
        category: z
          .string()
          .max(40)
          .optional()
          .describe("A category name such as 'Dining Tables' or 'Rugs'."),
        maxPrice: z.number().positive().optional().describe("Maximum price in US dollars."),
        minPrice: z.number().positive().optional().describe("Minimum price in US dollars."),
        includeSoldOut: z
          .boolean()
          .optional()
          .describe("Also return products where every variant is sold out. Default false."),
      }),
      execute: async (filters) => {
        const catalog = await getAssistantCatalog();
        const results = rankProducts(catalog, filters);
        const products: ProductHit[] = results.map((p) => {
          return {
            name: p.name,
            url: `/products/${p.slug}`,
            category: p.category.title,
            price:
              p.minPrice === p.maxPrice
                ? formatPrice(p.minPrice)
                : `${formatPrice(p.minPrice)} to ${formatPrice(p.maxPrice)}`,
            inStock: p.inStock,
            material: p.material,
            summary: summarize(p.description),
            colors: p.colors.filter((c): c is string => !!c),
            sizes: p.sizes.filter((s): s is string => !!s),
            imageUrl: p.image ? urlFor(p.image).width(240).height(240).fit("crop").url() : null,
          };
        });
        return {
          count: products.length,
          products,
          ...(products.length === 0 && {
            hint: "No matches. Try broader keywords, remove the price limit, or call listCategories.",
          }),
        };
      },
    }),

    getProductDetails: tool({
      description:
        "Get full details for one product: description, material, and every color/size/design " +
        "option with its price and availability. Use it to answer questions about a specific product.",
      inputSchema: z.object({
        slug: z
          .string()
          .max(100)
          .describe("The product's slug, which is the last part of its url, e.g. 'aspen-slatted-bed'."),
      }),
      execute: async ({ slug }) => {
        const product = await getProduct(slug);
        if (!product) return { found: false as const };
        return {
          found: true as const,
          name: product.name,
          url: `/products/${product.slug}`,
          category: product.category.title,
          material: product.material,
          description: product.description,
          variants: product.variants.slice(0, 30).map((v) => ({
            option: variantLabel(v) || "Standard",
            price: formatPrice(v.price),
            availability: stockLabel(v.stock),
          })),
        };
      },
    }),

    listCategories: tool({
      description: "List every product category in the store.",
      inputSchema: z.object({}),
      execute: async () => {
        const categories = await getCategories();
        return categories.map((c) => ({
          name: c.title,
          url: `/categories/${c.slug}`,
          description: c.description,
        }));
      },
    }),

    getMyOrders: tool({
      description:
        "Get the signed-in customer's recent orders (status, items, total). " +
        "Only works if the customer is signed in.",
      inputSchema: z.object({}),
      execute: async () => {
        if (!userId) {
          return {
            signedIn: false as const,
            message: "The customer is not signed in. Ask them to sign in, then ask again.",
          };
        }
        const orders = await freshClient.fetch(ORDERS_BY_USER_QUERY, { userId });
        return {
          signedIn: true as const,
          orders: orders.slice(0, 5).map((o) => ({
            orderNumber: o.orderNumber,
            placedOn: o.createdAt ? o.createdAt.slice(0, 10) : null,
            status: o.status,
            total: formatPrice(o.total ?? 0),
            items: (o.items ?? []).map((i) => ({
              name: i.productName,
              option: i.variantLabel,
              quantity: i.quantity,
            })),
          })),
        };
      },
    }),
  };
}

export type AssistantTools = ReturnType<typeof createAssistantTools>;
