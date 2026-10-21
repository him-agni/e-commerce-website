# My Farmhouse: modern farmhouse furniture store

## Context
Greenfield portfolio/learning project (empty folder, not a git repo). Goal: a modern-farmhouse furniture e-commerce site named **My Farmhouse**, built on free tiers only, with an AI shopping assistant powered by Gemini. All code is written from scratch.

## Decisions made
- Purpose: portfolio/learning. Stripe stays in **test mode**; no real money.
- Currency/region: USD, US only.
- Variants: **price and stock per variant**; each product has color, size and a few design/style options.
- Auth: Clerk; **sign-in required** to check out.
- Extras in scope: **Gemini AI shopping assistant**. Not in scope: custom admin dashboard (orders managed in Sanity Studio), wishlist/reviews. Basic category browsing is still needed; filters are optional (see Phase 4).
- Photos: free stock photos (note each license), uploaded to Sanity.
- Experience: comfortable with Next.js/TypeScript.

## Database answer
No separate database. **Sanity is the database**: products, categories, variants, customers and orders all live there. Clerk stores users; Stripe stores payments. If Sanity's free limits ever bind, Postgres (Neon free) is the fallback for orders only.

## Stack
Next.js (App Router, TypeScript), Tailwind + shadcn/ui, Sanity (+ embedded Studio at `/studio`), Clerk, Stripe Checkout + webhook, Zustand cart (localStorage), Vercel AI SDK with the Google provider and a free Gemini API key from Google AI Studio, Vercel Hobby for hosting. Verify current free-tier limits of each service at the start of Phase 0.

## Data model (Sanity)
- **category**: title, slug, description, image.
- **product**: name, slug, description, category (ref), material, images, featured, `designs[]` (name, image), `variants[]`.
- **variant** (object inside product): color, size, design (optional), price (USD cents), stock, sku.
- **customer**: clerkUserId, email, name, stripeCustomerId.
- **order**: orderNumber, items (snapshot of name, variant, price at purchase), total, status (paid, shipped, delivered, cancelled), customer (ref), shipping address, stripeSessionId.
Catalog categories: beds, dining tables, couches, sofa sets, chandeliers, chairs, cushions, rugs, TV tables, console tables, lamps, candles.

## Phases

### Phase 0: Setup
Create Next.js app, git init, accounts and keys for Sanity, Clerk, Stripe (test), Google AI Studio. `.env.local` + `.env.example`. Install Tailwind/shadcn. Define brand: name, palette, fonts (modern farmhouse: warm whites, wood tones, black accents, serif headings).

### Phase 1: Content backend
Sanity project + embedded Studio. Schemas above, TypeGen for typed GROQ. Seed ~3 products per category with stock photos, variants and designs.

### Phase 2: Storefront
Layout, header/footer, home (hero, featured, category tiles), category pages, product detail page with image gallery and color/size/design selectors that update price, stock and image. GROQ query helpers.

### Phase 3: Auth, cart and checkout
Clerk (`ClerkProvider`, middleware, sign-in/up, user button). Zustand cart keyed by product + variant, stock validation. Stripe Checkout session built **server-side from Sanity prices** (never trust client prices), shipping address collection (US).

### Phase 4: Orders and webhook
Stripe webhook route verifies signature, creates customer + order in Sanity, decrements variant stock. Orders page for signed-in users. Success/cancel pages. Optional: category filters, color/size/price filter and sort.

### Phase 5: Gemini shopping assistant
`/api/chat` route using the AI SDK + Gemini free model, tool `searchProducts` (GROQ), and `getMyOrders` scoped to the Clerk `userId` for signed-in users. Chat widget UI. Handle free-tier rate limits gracefully.

### Phase 6: Polish and deploy
Responsive pass, loading/empty/error states, SEO metadata, image optimization, accessibility check. Deploy to Vercel Hobby, set env vars, point the Stripe webhook at the deployed URL, write README with setup steps.

## Critical files (to be created)
`app/(shop)/…`, `app/api/chat/route.ts`, `app/api/checkout/route.ts`, `app/api/webhooks/stripe/route.ts`, `sanity/schemaTypes/*`, `lib/sanity/queries/*`, `lib/store/cart.ts`, `lib/ai/*`, `middleware.ts`/`proxy.ts`, `.env.example`.

## Verification
- Phase 1: Studio opens at `/studio`; seeded products visible.
- Phase 2: change color/size on a product page; price, stock and image update.
- Phase 3-4: add to cart, pay with Stripe test card `4242 4242 4242 4242` using `stripe listen --forward-to localhost:3000/api/webhooks/stripe`; order appears in Sanity, stock drops, order shows in the user's history.
- Phase 5: assistant finds products by description; order lookup works only for the signed-in user.
- Phase 6: production build passes; full flow works on the Vercel URL.

## Open items for you
- Confirm the brand look (colors/logo) or let me propose one.
- Confirm stock-photo source (Unsplash/Pexels) is fine for a portfolio.

## Status
See [handoff.md](../handoff.md) for current status; it is kept up to date. This plan is the original approved scope.
