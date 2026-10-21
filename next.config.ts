import type { NextConfig } from "next";
import { LEGACY_CATEGORY_REDIRECTS } from "./lib/legacy-categories";

const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  logging: {
    // Forward only browser errors to the terminal; warnings stay in the browser console.
    browserToTerminal: "error",
  },
  async redirects() {
    return LEGACY_CATEGORY_REDIRECTS.map(({ from, to }) => ({
      source: `/categories/${from}`,
      destination: to,
      permanent: true,
    }));
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: sanityProjectId ? `/images/${sanityProjectId}/**` : "/images/**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
