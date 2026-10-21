// Shared by the home page (server) and the product showcase (client).
export const SHOWCASE_FILTERS = [
  { id: "all", label: "All", slugs: null },
  { id: "sofas", label: "Sofas", slugs: ["sofas"] },
  { id: "chairs", label: "Chairs", slugs: ["chairs"] },
  { id: "tables", label: "Tables", slugs: ["dining-tables", "accent-tables", "consoles-storage"] },
  { id: "beds", label: "Beds", slugs: ["beds"] },
  { id: "lighting", label: "Lighting", slugs: ["lighting"] },
  { id: "decor", label: "Decor", slugs: ["decor"] },
] as const;

export type ShowcaseFilterId = (typeof SHOWCASE_FILTERS)[number]["id"];

export const SHOWCASE_SIZE = 6;

/** The little each card needs, so the browser is not sent whole product records. */
export type ShowcaseCard = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  categoryTitle: string;
  minPrice: number;
  maxPrice: number;
  inStock: boolean;
};

export type ShowcaseGroups = Record<ShowcaseFilterId, ShowcaseCard[]>;
