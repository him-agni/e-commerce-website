# Handoff

Living status file. Update it at the end of every working session so the next session (or person) can pick up cold. Full plan: [docs/plan.md](docs/plan.md).

_Last updated: 2026-10-21 (Phase 3 built; seed 7/12 categories)_

## Current state
- **Phase 0 done** except the Gemini key and Stripe webhook secret (deliberately postponed; needed in Phases 4-5).
- **Phase 1 in progress.** Done: Sanity packages, `sanity.config.ts` (Studio at `/studio`, loads, returns 200), schemas in `sanity/schemaTypes/` (category, product, variant object, customer, order), client helpers in `sanity/lib/` (`client` read, `writeClient` server-only, `urlFor`), TypeGen (`npm run typegen` writes `sanity/types.ts`; config lives in `sanity.cli.ts`). Sanity keys verified working (`node --env-file=.env.local scripts/check-sanity.mjs`). Dataset is empty of content.
- **Seed script** (`npm run seed`, `scripts/seed.mjs` + `scripts/seed-data.mjs`): 12 categories x 3 products, variants = colors x sizes x designs, price in cents, deterministic stock (some 0), 2 Unsplash photos per product with credit stored on the asset. Idempotent (`createIfNotExists`, photo cache in `scripts/.seed-cache.json`, gitignored). **Partly run (2026-10-21): 7 of 12 categories seeded** (beds, dining tables, couches, sofa sets, chandeliers, chairs, cushions = 21 products, 84 variants, 42 assets). Unsplash demo limit (50 requests/hour) stopped it. **Remaining: rugs, TV tables, console tables, lamps, candles. Re-run `npm run seed` after about an hour.** To change already-seeded docs, edit in the Studio or delete them first (the script never overwrites).
- Unsplash key is `UNSPLASH_ACCESS_KEY` (set). Pexels was tried first but paused new API keys.
- **Phase 2 (storefront) done and verified** (2026-10-21): `(shop)` route group with header (category strip) + footer; home (hero, featured, category tiles), `/products`, `/categories/[slug]`, `/products/[slug]`, 404 page. Product page selectors (`components/product/product-details.tsx`) switch color/size/design to the matching variant and update price, stock message, SKU and photo; out-of-stock options are struck through. Tested in a headless browser (desktop + 390px phone, no console errors, no horizontal overflow). Variant/design-specific photos are supported in code but untested because no seeded variant has its own image.
- Data layer: `lib/sanity/queries.ts` (GROQ via `defineQuery`, types from `npm run typegen`, **re-run typegen after changing a query**) and `lib/sanity/data.ts` (`'use cache'` fetchers: products tagged `products` / `product:<slug>`, `cacheLife("minutes")`; categories `hours`). Phase 4 webhook should call `revalidateTag("products")` after decrementing stock. Pages are prerendered via `generateStaticParams`, so **new products/categories need a rebuild or a cache revalidation to show up** until Phase 4 wiring.
- **Phase 3 (auth, cart, checkout) built** (2026-10-21). Clerk v7 (`proxy.ts` = `clerkMiddleware`, `ClerkProvider` in `(shop)/layout.tsx` so the Studio is unaffected; header uses client `useUser`; sign-in/up pages wrap Clerk components in `<Suspense>` as Cache Components requires; v7 uses `<Show>` not `<SignedIn>`). Cart: Zustand + localStorage (`lib/cart/store.ts`, keyed by SKU), `/cart` page revalidates price/stock from Sanity via the `getCartVariants` server action (`lib/cart/lookup.ts`, uncached `freshClient`). Checkout: `POST /api/checkout` requires a Clerk session, re-checks stock, builds a Stripe Checkout session from **Sanity prices only** (`lib/checkout.ts`), US shipping address, SKU stored in product metadata for the webhook. `/checkout/success` verifies the session belongs to the signed-in user and is paid, then clears the cart. `lib/stripe.ts` refuses non-`sk_test_` keys.
- **Verified:** build/lint/tsc pass; browser test of add-to-cart (qty, cap, header badge, cart page with live prices, signed-out CTA); 22 server checks against real Stripe test mode (input validation, out-of-stock/over-stock/unknown SKU refused, session total/currency/metadata/US-only shipping correct); hosted Stripe page shows correct items and $3,597.00 total; unauthenticated `/api/checkout` returns 401.
- **NOT verified (needs a human):** the signed-in path end to end. Clerk's dev instance has bot protection (`/sign-up/protect-check`) that blocks headless browsers, so the owner must sign up manually once, then try cart -> Check out -> pay with `4242 4242 4242 4242` (any future expiry, any CVC). Also unverified: the success page (needs a signed-in session). Stock is NOT decremented and no order is recorded yet (Phase 4 webhook).
- Stack: Next.js 16.4.2 (`cacheComponents` on, so no `export const dynamic`), Tailwind v4 via `@tailwindcss/turbopack`, shadcn/ui (`base-nova`, only `button` so far).
- Brand in `app/globals.css`: warm white, charcoal primary, linen secondary, wood accent (`text-wood`), Playfair Display headings. Palette is a proposal; user has not confirmed it.
- Git: `main`, remote `origin` = https://github.com/him-agni/e-commerce-website.git. Phases 0-3 committed and pushed 2026-10-21.

## Done
- Scaffold, agent-skill setup (`CLAUDE.md`, `AGENTS.md`, `docs/agents/`), recovered plan into `docs/plan.md` (old chat lived in a OneDrive-keyed Claude session folder).
- shadcn init, fixed its self-referencing `--font-sans` var, brand tokens, serif heading font, SEO title template.
- `.env.example` with every variable later phases need; `.gitignore` allows `.env.example` but ignores real env files.
- Removed unused create-next-app SVGs from `public/`.

## Waiting on the user
0. Do one manual sign-up + test purchase in a normal browser (see Phase 3 'NOT verified').
1. Re-run `npm run seed` after the Unsplash hourly limit resets (about 1 hour after 2026-10-21 09:38) to finish the last 5 categories.
2. Later: Google AI Studio key (`GOOGLE_GENERATIVE_AI_API_KEY`) before Phase 5, Stripe webhook secret before Phase 4.
3. Confirm or change the brand look (now visible on the live pages).

## Next up
- Phase 4: Stripe webhook route (verify signature, read line items + SKU metadata, create customer + order in Sanity, decrement variant stock, `revalidateTag("products")`), orders page for the signed-in user. Needs `STRIPE_WEBHOOK_SECRET` from `stripe listen` (install Stripe CLI first). Webhook must be idempotent (Stripe retries; use `stripeSessionId` as the order id).
- After the seed finishes (re-run `npm run seed`), rebuild so the new category/product pages are prerendered.
- Verify current free-tier limits of each service (plan Phase 0 item, not done).

## Gotchas
- Repo conventions from the owner: commits are authored by the owner only (no co-author trailers), and docs must not mention any external reference project; all code is original.
- This Next.js version differs from training data: read `node_modules/next/dist/docs/` before writing Next code (see `AGENTS.md`).
- `.next/` can hold stale generated types after moving/deleting routes; if `tsc`/build complains about `.next/**/validator.ts`, delete `.next`.
- Env helpers/scripts: `node --env-file=.env.local scripts/<file>.mjs`. Bash heredocs with apostrophes inside large multi-file commands broke once; use the Write tool for multi-file creation.
- Package manager is **npm** (pnpm is not installed).
- Stripe stays in test mode.
- Issues are tracked as markdown under `.scratch/` (not created yet); domain docs `GLOSSARY.md` and `docs/adr/` not created yet.
