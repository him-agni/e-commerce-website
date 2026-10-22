/**
 * Response headers that harden every page. Used by next.config.ts.
 *
 * The Content-Security-Policy names every origin the site really loads from, so a script or
 * frame injected from anywhere else is blocked. It keeps 'unsafe-inline' for scripts because
 * Next.js writes small inline bootstrap scripts and a per-request nonce would make every page
 * dynamic; the other directives (frames, forms, connections, images, base-uri) still hold.
 *
 * Clerk runs from its own domain: *.clerk.accounts.dev while the app uses development keys. When
 * the app moves to a Clerk production instance, add that instance's domain here.
 */

const CLERK = "https://*.clerk.accounts.dev";
const CLERK_BOT_PROTECTION = "https://*.protect.clerk.com";
const TURNSTILE = "https://challenges.cloudflare.com";

const policy = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", CLERK, TURNSTILE, CLERK_BOT_PROTECTION],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:", "https://cdn.sanity.io", "https://img.clerk.com"],
  "font-src": ["'self'", "data:"],
  "connect-src": [
    "'self'",
    CLERK,
    "https://clerk-telemetry.com",
    "https://*.clerk-telemetry.com",
    "https://img.clerk.com",
    `${CLERK_BOT_PROTECTION}:*`,
  ],
  "frame-src": [TURNSTILE, CLERK_BOT_PROTECTION],
  "worker-src": ["'self'", "blob:"],
  "form-action": ["'self'", CLERK],
  "frame-ancestors": ["'none'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
  "manifest-src": ["'self'"],
} satisfies Record<string, string[]>;

export const contentSecurityPolicy = [
  ...Object.entries(policy).map(([directive, sources]) => `${directive} ${sources.join(" ")}`),
  "upgrade-insecure-requests",
].join("; ");

/** Sent with every response. */
export const baseSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Other sites see only this site's origin, never the page or its query string.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing here needs the camera, microphone, location or payment APIs.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  // Stops other sites from putting this one in a frame (clickjacking). frame-ancestors in the
  // CSP does the same for modern browsers; this covers older ones, and the Studio, which has no CSP.
  { key: "X-Frame-Options", value: "DENY" },
];

export const cspHeader = { key: "Content-Security-Policy", value: contentSecurityPolicy };
