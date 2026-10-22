import type { NextConfig } from "next";
import { LEGACY_CATEGORY_REDIRECTS } from "./lib/legacy-categories";
import { baseSecurityHeaders, cspHeader } from "./lib/security-headers";

const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  logging: {
    // Forward only browser errors to the terminal; warnings stay in the browser console.
    browserToTerminal: "error",
  },
  async headers() {
    return [
      { source: "/:path*", headers: baseSecurityHeaders },
      // The policy is for production: Next's dev server needs eval and websockets. The Studio is left
      // out because it loads a lot of its own code and is protected by Sanity's sign-in.
      ...(process.env.NODE_ENV === "production"
        ? [{ source: "/((?!studio).*)", headers: [cspHeader] }]
        : []),
    ];
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
