// Seeds Sanity with categories and products, using Unsplash photos.
// Run: npm run seed
//
// Safe to re-run: existing documents are left alone (createIfNotExists) and photo lookups
// are cached in scripts/.seed-cache.json. The Unsplash demo tier allows 50 requests per hour,
// so if the limit is hit the script stops cleanly; run it again in an hour to finish.

import { createClient } from "@sanity/client";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { categories } from "./seed-data.mjs";

const CACHE_PATH = new URL("./.seed-cache.json", import.meta.url);
const PHOTOS_PER_PRODUCT = 2;
const SEARCH_RESULTS = 8;

const { UNSPLASH_ACCESS_KEY, SANITY_API_WRITE_TOKEN } = process.env;
if (!UNSPLASH_ACCESS_KEY || !SANITY_API_WRITE_TOKEN) {
  console.error("Set UNSPLASH_ACCESS_KEY and SANITY_API_WRITE_TOKEN in .env.local");
  process.exit(1);
}

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2025-01-01",
  useCdn: false,
  token: SANITY_API_WRITE_TOKEN,
});

const cache = existsSync(CACHE_PATH)
  ? JSON.parse(readFileSync(CACHE_PATH, "utf8"))
  : { searches: {}, assets: {} };
const saveCache = () => writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));

class RateLimitError extends Error {}

let remaining; // from the x-ratelimit-remaining header
async function unsplash(url) {
  if (remaining !== undefined && remaining <= 0) throw new RateLimitError();
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`, "Accept-Version": "v1" },
  });
  const header = res.headers.get("x-ratelimit-remaining");
  if (header !== null) remaining = Number(header);
  if (res.status === 403 || res.status === 429) throw new RateLimitError();
  if (!res.ok) throw new Error(`Unsplash ${res.status} for ${new URL(url).pathname}`);
  return res;
}

async function searchPhotos(key, query) {
  if (cache.searches[key]) return cache.searches[key];
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(SEARCH_RESULTS));
  url.searchParams.set("orientation", "landscape");
  const { results } = await (await unsplash(url)).json();
  const photos = results.map((p) => ({
    id: p.id,
    raw: p.urls.raw,
    downloadLocation: p.links.download_location,
    pageUrl: p.links.html,
    author: p.user.name,
    authorUrl: p.user.links.html,
  }));
  if (photos.length === 0) throw new Error(`No photos found for "${query}"`);
  cache.searches[key] = photos;
  saveCache();
  return photos;
}

// Uploads a photo to Sanity once and returns the asset id.
async function ensureAsset(photo) {
  if (cache.assets[photo.id]) return cache.assets[photo.id];
  // Unsplash API terms: ping the download endpoint when a photo is used.
  await unsplash(photo.downloadLocation);
  const res = await fetch(`${photo.raw}&w=1600&q=80&fm=jpg`);
  if (!res.ok) throw new Error(`Image download failed (${res.status}) for ${photo.id}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const asset = await sanity.assets.upload("image", buffer, {
    filename: `unsplash-${photo.id}.jpg`,
    contentType: "image/jpeg",
    creditLine: `Photo by ${photo.author} on Unsplash`,
    source: { name: "unsplash", id: photo.id, url: photo.pageUrl },
  });
  cache.assets[photo.id] = asset._id;
  saveCache();
  return asset._id;
}

const imageRef = (assetId) => ({
  _type: "image",
  asset: { _type: "reference", _ref: assetId },
});

function hash(str) {
  let h = 0;
  for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function buildVariants(product, slug) {
  const designs = product.designs.length > 0 ? product.designs : [null];
  const variants = [];
  product.colors.forEach((color, ci) => {
    product.sizes.forEach(([size, sizeDelta], si) => {
      designs.forEach((design, di) => {
        const sku = `${slug}-${ci + 1}${si + 1}${di + 1}`.toUpperCase();
        variants.push({
          _key: sku.toLowerCase(),
          _type: "variant",
          color,
          size,
          ...(design ? { design } : {}),
          price: (product.base + sizeDelta) * 100,
          // 0..13, so some variants are out of stock to exercise the UI
          stock: hash(sku) % 14,
          sku,
        });
      });
    });
  });
  return variants;
}

async function seedCategory(category, index) {
  const tx = sanity.transaction();
  let categoryImage;
  let productCount = 0;

  // Each group is one hashtag (or the whole category when it has none); its photos come from its own search.
  for (const group of category.groups) {
    const photos = await searchPhotos(`${category.slug}:${group.tag ?? "all"}`, group.query);
    const pick = (i) => photos[i % photos.length];

    const assetIds = new Map();
    const needed = group.products.length * PHOTOS_PER_PRODUCT;
    for (let i = 0; i < needed; i++) {
      const photo = pick(i);
      if (!assetIds.has(photo.id)) assetIds.set(photo.id, await ensureAsset(photo));
    }
    categoryImage ??= imageRef(assetIds.get(pick(0).id));

    group.products.forEach((product, pi) => {
      const slug = slugify(product.name);
      const images = Array.from({ length: PHOTOS_PER_PRODUCT }, (_, k) => {
        const photo = pick(pi * PHOTOS_PER_PRODUCT + k);
        return { _key: `img-${k}`, ...imageRef(assetIds.get(photo.id)) };
      });
      tx.createIfNotExists({
        _id: `product-${slug}`,
        _type: "product",
        name: product.name,
        slug: { _type: "slug", current: slug },
        description: product.description,
        category: { _type: "reference", _ref: `category-${category.slug}` },
        ...(group.tag && { tags: [group.tag] }),
        material: product.material,
        images,
        featured: Boolean(product.featured),
        designs: product.designs.map((name) => ({
          _key: slugify(name),
          _type: "design",
          name,
        })),
        variants: buildVariants(product, slug),
      });
      productCount++;
    });
  }

  tx.createIfNotExists({
    _id: `category-${category.slug}`,
    _type: "category",
    title: category.title,
    slug: { _type: "slug", current: category.slug },
    description: category.description,
    image: categoryImage,
    order: index + 1,
  });

  await tx.commit();
  console.log(`✓ ${category.title}: category + ${productCount} products`);
}

let done = 0;
try {
  for (const [index, category] of categories.entries()) {
    await seedCategory(category, index);
    done++;
  }
  console.log(`\nSeeded all ${done} categories.`);
} catch (err) {
  if (err instanceof RateLimitError) {
    console.log(
      `\nUnsplash rate limit reached after ${done}/${categories.length} categories. ` +
        "Wait an hour and run `npm run seed` again; finished categories are kept.",
    );
  } else {
    throw err;
  }
}
