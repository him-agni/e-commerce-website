# Handoff

Living status file. Update it at the end of every working session so the next session (or person) can pick up cold. Full plan: [docs/plan.md](docs/plan.md).

_Last updated: 2026-10-21 (Phase 4 verified; seed 15/18 categories)_

## Current state
- **Phase 0 done** except the Gemini key and Stripe webhook secret (deliberately postponed; needed in Phases 4-5).
- **Phase 1 in progress.** Done: Sanity packages, `sanity.config.ts` (Studio at `/studio`, loads, returns 200), schemas in `sanity/schemaTypes/` (category, product, variant object, customer, order), client helpers in `sanity/lib/` (`client` read, `writeClient` server-only, `urlFor`), TypeGen (`npm run typegen` writes `sanity/types.ts`; config lives in `sanity.cli.ts`). Sanity keys verified working (`node --env-file=.env.local scripts/check-sanity.mjs`). Dataset is empty of content.
- **Seed script** (`npm run seed`, `scripts/seed.mjs` + `scripts/seed-data.mjs`): 18 categories x 3 products (added coffee tables, side tables, night stands, drawer chests, mirrors, curtains on 2026-10-21), variants = colors x sizes x designs, price in cents, deterministic stock (some 0), 2 Unsplash photos per product with credit stored on the asset. Idempotent (`createIfNotExists`, photo cache in `scripts/.seed-cache.json`, gitignored). **Partly run (2026-10-21): 15 of 18 categories seeded** (first 12 complete; coffee tables, side tables, night stands done). Unsplash demo limit (50 requests/hour) stopped it. **Remaining: drawer chests, mirrors, curtains.** To change already-seeded docs, edit in the Studio or delete them first (the script never overwrites).
- Unsplash key is `UNSPLASH_ACCESS_KEY` (set). Pexels was tried first but paused new API keys.
- **Phase 2 (storefront) done and verified** (2026-10-21): `(shop)` route group with header (category strip) + footer; home (hero, featured, category tiles), `/products`, `/categories/[slug]`, `/products/[slug]`, 404 page. Product page selectors (`components/product/product-details.tsx`) switch color/size/design to the matching variant and update price, stock message, SKU and photo; out-of-stock options are struck through. Tested in a headless browser (desktop + 390px phone, no console errors, no horizontal overflow). Variant/design-specific photos are supported in code but untested because no seeded variant has its own image.
- Data layer: `lib/sanity/queries.ts` (GROQ via `defineQuery`, types from `npm run typegen`, **re-run typegen after changing a query**) and `lib/sanity/data.ts` (`'use cache'` fetchers: products tagged `products` / `product:<slug>`, `cacheLife("minutes")`; categories `hours`). Phase 4 webhook should call `revalidateTag("products")` after decrementing stock. Pages are prerendered via `generateStaticParams`, so **new products/categories need a rebuild or a cache revalidation to show up** until Phase 4 wiring.
- **Phase 3 (auth, cart, checkout) built** (2026-10-21). Clerk v7 (`proxy.ts` = `clerkMiddleware`, `ClerkProvider` in `(shop)/layout.tsx` so the Studio is unaffected; header uses client `useUser`; sign-in/up pages wrap Clerk components in `<Suspense>` as Cache Components requires; v7 uses `<Show>` not `<SignedIn>`). Cart: Zustand + localStorage (`lib/cart/store.ts`, keyed by SKU), `/cart` page revalidates price/stock from Sanity via the `getCartVariants` server action (`lib/cart/lookup.ts`, uncached `freshClient`). Checkout: `POST /api/checkout` requires a Clerk session, re-checks stock, builds a Stripe Checkout session from **Sanity prices only** (`lib/checkout.ts`), US shipping address, SKU stored in product metadata for the webhook. `/checkout/success` verifies the session belongs to the signed-in user and is paid, then clears the cart. `lib/stripe.ts` refuses non-`sk_test_` keys.
- **Verified:** build/lint/tsc pass; browser test of add-to-cart (qty, cap, header badge, cart page with live prices, signed-out CTA); 22 server checks against real Stripe test mode (input validation, out-of-stock/over-stock/unknown SKU refused, session total/currency/metadata/US-only shipping correct); hosted Stripe page shows correct items and $3,597.00 total; unauthenticated `/api/checkout` returns 401.
- **Signed-in path verified by the owner (2026-10-21):** sign up, add to cart, Check out, pay with the 4242 test card, land on the "Order confirmed" page. (Automated sign-up is blocked by Clerk bot protection on the dev instance, so this path is only testable by hand.) Still true: stock is NOT decremented and no order is recorded yet (Phase 4 webhook).
- **Phase 4 (orders, webhook) done and verified live** (2026-10-21). `POST /api/webhooks/stripe` verifies the signature (raw body), handles `checkout.session.completed` and `async_payment_succeeded`, and calls `recordPaidSession` (`lib/orders.ts`): one Sanity transaction that creates the order (`order-<sessionId>`, fails if it exists, so retries/concurrent deliveries never double-decrement), upserts `customer-<clerkUserId>` (email, name, stripeCustomerId), and decrements variant stock (clamped at 0; oversold lines are logged). Then `revalidateTag("products", { expire: 0 })`. Non-2xx makes Stripe retry. `/orders` lists the signed-in user's orders (uncached read filtered by Clerk user id); account menu has a "My orders" link; `/checkout/success` links to it. Checkout sessions now use `customer_creation: "always"`.
- **Verified:** 10 route checks (missing/bad/tampered/wrong-secret signatures, unhandled events, duplicates, unpaid, unknown session) + order-recording checks against real Stripe/Sanity (totals, shipping, customer link, idempotency incl. concurrent) + live purchase through `stripe listen`: all events `[200]`, order created, stock 5 -> 4. The `/orders` page UI has only been checked by build/type/lint (needs a signed-in session).
- **Local webhook testing:** run `stripe listen --api-key $k --forward-to localhost:3000/api/webhooks/stripe` where `$k` is read from `.env.local` in PowerShell (`$k = (Select-String -Path .env.local -Pattern '^STRIPE_SECRET_KEY=(.*)$').Matches.Groups[1].Value`). Plain `stripe listen` used a stale saved login for another Stripe account. The printed `whsec_` goes in `STRIPE_WEBHOOK_SECRET` (same value each run). Keep `npm run dev` and `stripe listen` running together. Deployed site needs its own webhook endpoint + secret (Phase 6).
- Stack: Next.js 16.4.2 (`cacheComponents` on, so no `export const dynamic`), Tailwind v4 via `@tailwindcss/turbopack`, shadcn/ui (`base-nova`, only `button` so far).
- Brand in `app/globals.css`: warm white, charcoal primary, linen secondary, wood accent (`text-wood`), Playfair Display headings. Palette is a proposal; user has not confirmed it.
- Git: `main`, remote `origin` = https://github.com/him-agni/e-commerce-website.git. Phases 0-4 committed and pushed 2026-10-21.

## Done
- Scaffold, agent-skill setup (`CLAUDE.md`, `AGENTS.md`, `docs/agents/`), recovered plan into `docs/plan.md` (old chat lived in a OneDrive-keyed Claude session folder).
- shadcn init, fixed its self-referencing `--font-sans` var, brand tokens, serif heading font, SEO title template.
- `.env.example` with every variable later phases need; `.gitignore` allows `.env.example` but ignores real env files.
- Removed unused create-next-app SVGs from `public/`.

## Waiting on the user
1. Re-run `npm run seed` after the Unsplash hourly limit resets (about an hour after the last run) to finish the last 3 categories (drawer chests, mirrors, curtains).
2. Later: Google AI Studio key (`GOOGLE_GENERATIVE_AI_API_KEY`) before Phase 5.
3. Confirm or change the brand look (now visible on the live pages).

## Next up
- Phase 5: Gemini shopping assistant. `/api/chat` with the Vercel AI SDK + Google provider, tool `searchProducts` (GROQ) and `getMyOrders` scoped to the Clerk user id, chat widget UI, graceful handling of free-tier rate limits. Needs `GOOGLE_GENERATIVE_AI_API_KEY` from https://aistudio.google.com/apikey.
- Phase 6: polish, accessibility, SEO, deploy to Vercel Hobby (set env vars, create production Stripe webhook endpoint + secret, Clerk production keys/domain).
- After the seed finishes (re-run `npm run seed`), rebuild so the new category/product pages are prerendered.
- Verify current free-tier limits of each service (plan Phase 0 item, not done).

## Gotchas
- Clerk's dashboard masks secret keys after creation; copy the full key from the Quick copy box or when creating a new key. A masked copy (`sk_test_…`) breaks auth with handshake/redirect-loop errors. `npm run check-env` detects this.
- `npm run check-env` validates `.env.local` (presence, ASCII, prefixes, length) without printing secrets. Run it after editing keys.
- Pages that read `params` keep the page component synchronous and read `params` inside `<Suspense>` with a skeleton (`components/product/skeletons.tsx`); otherwise dev shows an instant-navigation error.
- Repo conventions from the owner: commits are authored by the owner only (no co-author trailers), and docs must not mention any external reference project; all code is original.
- This Next.js version differs from training data: read `node_modules/next/dist/docs/` before writing Next code (see `AGENTS.md`).
- `.next/` can hold stale generated types after moving/deleting routes; if `tsc`/build complains about `.next/**/validator.ts`, delete `.next`.
- Env helpers/scripts: `node --env-file=.env.local scripts/<file>.mjs`. Bash heredocs with apostrophes inside large multi-file commands broke once; use the Write tool for multi-file creation.
- Package manager is **npm** (pnpm is not installed).
- Stripe stays in test mode.
- Issues are tracked as markdown under `.scratch/` (not created yet); domain docs `GLOSSARY.md` and `docs/adr/` not created yet.
