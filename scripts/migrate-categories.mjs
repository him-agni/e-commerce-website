// One-time migration (2026-10-21): merge the 20 original categories into 9, with the old
// categories kept as hashtags on each product.
//
//   node --env-file=.env.local scripts/migrate-categories.mjs --dry-run     (print the plan only)
//   NEXT_PUBLIC_SANITY_DATASET=staging node --env-file=.env.local scripts/migrate-categories.mjs
//   node --env-file=.env.local scripts/migrate-categories.mjs --production  (the real store)
//
// Everything happens in ONE transaction, so it either fully applies or does nothing. It refuses to
// touch the production dataset unless --production is passed. Not safe to run twice.

import { createClient } from "@sanity/client";

const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const DRY = process.argv.includes("--dry-run");
if (dataset === "production" && !DRY && !process.argv.includes("--production")) {
  console.error('Refusing to change the "production" dataset without --production. Use --dry-run to preview.');
  process.exit(1);
}
const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset,
  apiVersion: "2025-01-01",
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});
console.log(`dataset: ${dataset}${DRY ? "  (dry run, nothing will be written)" : ""}`);

// ---- the target structure ---------------------------------------------------------------
const ORDER = ["beds", "dining-tables", "sofas", "chairs", "consoles-storage", "accent-tables", "lighting", "soft-furnishings", "decor"];

// New category -> { old category slug: hashtag }. A null tag means "decide per product" (chairs).
const MERGES = {
  sofas: {
    title: "Sofas",
    description: "Couches and matching sofa sets in washable, textured fabrics.",
    imageFrom: "couches",
    from: { couches: "couch", "sofa-sets": "sofa-set" },
  },
  chairs: {
    title: "Chairs",
    description: "Dining, accent and counter seating with honest craftsmanship.",
    imageFrom: "chairs",
    from: { chairs: null, "accent-chairs": null },
  },
  "consoles-storage": {
    title: "Consoles & Storage",
    description: "TV stands, console tables and drawer chests for media, entryways and bedrooms.",
    imageFrom: "tv-tables",
    from: { "tv-tables": "tv-stand", "console-tables": "console-table", "drawer-chests": "drawer-chest" },
  },
  "accent-tables": {
    title: "Accent Tables",
    description: "Coffee tables, side tables and night stands in solid wood and iron.",
    imageFrom: "coffee-tables",
    from: { "coffee-tables": "coffee-table", "side-tables": "side-table", "night-stands": "night-stand" },
  },
  lighting: {
    title: "Lighting",
    description: "Table and floor lamps and statement chandeliers in black iron, wood and warm brass.",
    imageFrom: "lamps",
    from: { lamps: "lamp", chandeliers: "chandelier" },
  },
  "soft-furnishings": {
    title: "Soft Furnishings",
    description: "Cushions, rugs and curtains in linen, wool and cotton.",
    imageFrom: "cushions",
    from: { cushions: "cushion", rugs: "rug", curtains: "curtain" },
  },
  decor: {
    title: "Decor",
    description: "Mirrors, vases and candles that finish a room.",
    imageFrom: "vases",
    from: { mirrors: "mirror", vases: "vase", candles: "candle" },
  },
};
const CHAIR_TAGS = {
  "cottage-spindle-chair": "dining-chair",
  "barn-linen-accent-chair": "accent-chair",
  "ridge-counter-stool": "counter-stool",
  "hartley-wingback-chair": "accent-chair",
  "marlow-barrel-accent-chair": "accent-chair",
  "juniper-rocking-chair": "rocking-chair",
};

// ---- read ---------------------------------------------------------------------------------
const cats = await c.fetch(`*[_type=="category"]{_id, "slug": slug.current, title, image}`);
const bySlug = Object.fromEntries(cats.map((x) => [x.slug, x]));
const products = await c.fetch(`*[_type=="product"]{_id, "slug": slug.current, "cat": category->slug.current}`);
console.log(`found ${cats.length} categories, ${products.length} products`);
if (cats.length !== 20 || products.length !== 60) throw new Error("Unexpected starting counts; has this already been run?");

// old category slug -> { newSlug, tag }
const route = {};
for (const slug of ["beds", "dining-tables"]) route[slug] = { newSlug: slug, tag: undefined };
for (const [newSlug, m] of Object.entries(MERGES)) for (const [oldSlug, tag] of Object.entries(m.from)) route[oldSlug] = { newSlug, tag };

for (const slug of Object.keys(bySlug)) if (!route[slug]) throw new Error(`Category "${slug}" is not mapped`);
for (const m of Object.values(MERGES)) if (!bySlug[m.imageFrom]?.image) throw new Error(`No image to reuse from "${m.imageFrom}"`);

// ---- build the transaction -----------------------------------------------------------------
const tx = c.transaction();
const finalIds = new Set();

ORDER.forEach((slug, index) => {
  const id = `category-${slug}`;
  finalIds.add(id);
  const m = MERGES[slug];
  if (!m) {
    // beds, dining-tables: keep, just reorder
    if (!bySlug[slug]) throw new Error(`Missing category ${slug}`);
    tx.patch(bySlug[slug]._id, (p) => p.set({ order: index + 1 }));
    return;
  }
  if (bySlug[slug]) {
    // "chairs" already exists: update it in place
    tx.patch(bySlug[slug]._id, (p) => p.set({ title: m.title, description: m.description, order: index + 1 }));
  } else {
    tx.create({
      _id: id,
      _type: "category",
      title: m.title,
      slug: { _type: "slug", current: slug },
      description: m.description,
      image: bySlug[m.imageFrom].image,
      order: index + 1,
    });
  }
});

let retagged = 0;
for (const p of products) {
  const r = route[p.cat];
  let tag = r.tag;
  if (r.newSlug === "chairs") {
    tag = CHAIR_TAGS[p.slug];
    if (!tag) throw new Error(`No chair tag for ${p.slug}`);
  }
  const set = { category: { _type: "reference", _ref: `category-${r.newSlug}` } };
  if (tag) { set.tags = [tag]; retagged++; }
  tx.patch(p._id, (patch) => patch.set(set));
}

const toDelete = cats.filter((x) => !finalIds.has(x._id));
for (const x of toDelete) tx.delete(x._id);

console.log(`plan: ${ORDER.length} categories remain (${ORDER.filter((s) => !bySlug[s]).length} new), ${products.length} products re-pointed, ${retagged} tagged, ${toDelete.length} old categories deleted:`);
console.log("  deleting:", toDelete.map((x) => x.slug).join(", "));

if (DRY) { console.log("dry run finished; nothing written"); process.exit(0); }
await tx.commit();

// ---- verify ------------------------------------------------------------------------------
const after = await c.fetch(`*[_type=="category"] | order(order asc){ "slug": slug.current, title, "n": count(*[_type=="product" && references(^._id)]), "tags": array::unique(*[_type=="product" && references(^._id)].tags[]) }`);
console.log("\nafter:");
for (const x of after) console.log(`  ${String(x.n).padStart(2)}  ${x.slug.padEnd(18)} ${x.title.padEnd(18)} ${x.tags.map((t) => "#" + t).join(" ")}`);
const orphan = await c.fetch(`count(*[_type=="product" && !defined(category->_id)])`);
console.log(`\nproducts without a category: ${orphan}  |  categories: ${after.length}`);
