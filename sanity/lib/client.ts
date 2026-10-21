import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "../env";

// Read client for catalog pages (CDN, may be up to a minute stale).
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
});

// Read client that bypasses the CDN. Use where price or stock must be exact (cart, checkout).
export const freshClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
});

// Server-only client for writes (seed script, Stripe webhook). Never import in client components.
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});
