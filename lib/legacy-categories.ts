/**
 * The original 20 categories were merged into 9, with the old ones becoming hashtags
 * (2026-10-21). Old category URLs permanently redirect to the new hashtag page so existing
 * links, bookmarks and search results keep working. Used by next.config.ts.
 */
export const LEGACY_CATEGORY_REDIRECTS = [
  { from: "couches", to: "/categories/sofas/couch" },
  { from: "sofa-sets", to: "/categories/sofas/sofa-set" },
  { from: "accent-chairs", to: "/categories/chairs/accent-chair" },
  { from: "tv-tables", to: "/categories/consoles-storage/tv-stand" },
  { from: "console-tables", to: "/categories/consoles-storage/console-table" },
  { from: "drawer-chests", to: "/categories/consoles-storage/drawer-chest" },
  { from: "coffee-tables", to: "/categories/accent-tables/coffee-table" },
  { from: "side-tables", to: "/categories/accent-tables/side-table" },
  { from: "night-stands", to: "/categories/accent-tables/night-stand" },
  { from: "lamps", to: "/categories/lighting/lamp" },
  { from: "chandeliers", to: "/categories/lighting/chandelier" },
  { from: "cushions", to: "/categories/soft-furnishings/cushion" },
  { from: "rugs", to: "/categories/soft-furnishings/rug" },
  { from: "curtains", to: "/categories/soft-furnishings/curtain" },
  { from: "mirrors", to: "/categories/decor/mirror" },
  { from: "vases", to: "/categories/decor/vase" },
  { from: "candles", to: "/categories/decor/candle" },
] as const;
