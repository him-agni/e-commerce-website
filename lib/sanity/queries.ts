import { defineQuery } from "next-sanity";

export const CATEGORIES_QUERY = defineQuery(`*[_type == "category"] | order(order asc) {
  _id,
  title,
  "slug": slug.current,
  description,
  image
}`);

export const CATEGORY_BY_SLUG_QUERY = defineQuery(`*[_type == "category" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  description
}`);

export const FEATURED_PRODUCTS_QUERY = defineQuery(`*[_type == "product" && featured == true] | order(name asc) [0...8] {
  _id,
  name,
  "slug": slug.current,
  "image": images[0],
  "category": category->{ title, "slug": slug.current },
  tags,
  "minPrice": math::min(variants[].price),
  "maxPrice": math::max(variants[].price),
  "inStock": count(variants[stock > 0]) > 0
}`);

export const ALL_PRODUCTS_QUERY = defineQuery(`*[_type == "product"] | order(name asc) {
  _id,
  name,
  "slug": slug.current,
  "image": images[0],
  "category": category->{ title, "slug": slug.current },
  tags,
  "minPrice": math::min(variants[].price),
  "maxPrice": math::max(variants[].price),
  "inStock": count(variants[stock > 0]) > 0
}`);

export const PRODUCTS_BY_CATEGORY_QUERY = defineQuery(`*[_type == "product" && category->slug.current == $slug] | order(name asc) {
  _id,
  name,
  "slug": slug.current,
  "image": images[0],
  "category": category->{ title, "slug": slug.current },
  tags,
  "minPrice": math::min(variants[].price),
  "maxPrice": math::max(variants[].price),
  "inStock": count(variants[stock > 0]) > 0
}`);

export const PRODUCT_BY_SLUG_QUERY = defineQuery(`*[_type == "product" && slug.current == $slug][0] {
  _id,
  name,
  "slug": slug.current,
  description,
  material,
  images,
  "category": category->{ title, "slug": slug.current },
  tags,
  designs[] { _key, name, image },
  variants[] { _key, color, size, design, price, stock, sku, image }
}`);

export const PRODUCT_SLUGS_QUERY = defineQuery(`*[_type == "product" && defined(slug.current)].slug.current`);

export const CATEGORY_SLUGS_QUERY = defineQuery(`*[_type == "category" && defined(slug.current)].slug.current`);

export const VARIANTS_BY_SKU_QUERY = defineQuery(`*[_type == "product" && count(variants[sku in $skus]) > 0] {
  _id,
  name,
  "slug": slug.current,
  "image": images[0],
  "variants": variants[sku in $skus] { _key, sku, color, size, design, price, stock, image }
}`);

export const ORDERS_BY_USER_QUERY = defineQuery(`*[_type == "order" && customer->userKey == $userKey] | order(createdAt desc) {
  _id,
  orderNumber,
  status,
  total,
  createdAt,
  items[] { _key, productName, variantLabel, unitPrice, quantity, "productSlug": product->slug.current },
  sessionRef
}`);

// Compact view of the whole catalog for the shopping assistant's search (small catalog, ranked in code).
export const ASSISTANT_CATALOG_QUERY = defineQuery(`*[_type == "product"] | order(name asc) {
  _id,
  name,
  "slug": slug.current,
  description,
  material,
  "image": images[0],
  "category": category->{ title, "slug": slug.current },
  tags,
  "minPrice": math::min(variants[].price),
  "maxPrice": math::max(variants[].price),
  "inStock": count(variants[stock > 0]) > 0,
  "colors": array::unique(variants[defined(color)].color),
  "sizes": array::unique(variants[defined(size)].size),
  "designs": array::unique(variants[defined(design)].design)
}`);

// Every category with the hashtags used by its products. Drives the tag pages, the sitemap and the Shop menu.
export const CATEGORY_TAGS_QUERY = defineQuery(`*[_type == "category" && defined(slug.current)] | order(order asc) {
  _id,
  title,
  "slug": slug.current,
  "tags": array::unique(*[_type == "product" && references(^._id)].tags[])
}`);

// Card data for a set of products, by slug (the wishlist).
export const PRODUCTS_BY_SLUGS_QUERY = defineQuery(`*[_type == "product" && slug.current in $slugs] {
  _id,
  name,
  "slug": slug.current,
  "image": images[0],
  "category": category->{ title, "slug": slug.current },
  tags,
  "minPrice": math::min(variants[].price),
  "maxPrice": math::max(variants[].price),
  "inStock": count(variants[stock > 0]) > 0
}`);
