import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "../env";

// Read client for catalog pages. It skips Sanity's API CDN on purpose: Next.js already caches
// these reads (and the Sanity webhook refreshes them on demand), and a CDN in between can still
// hold the previous version for a few seconds after an edit, which the refresh would then cache.
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
});

// Same live reads, named for call sites where exact price and stock matter (cart, checkout, orders).
export const freshClient = client;

// Server-only client for writes (seed script, Stripe webhook). Never import in client components.
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});
