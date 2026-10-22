# My Farmhouse

[![CI](https://github.com/him-agni/e-commerce-website/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/him-agni/e-commerce-website/actions/workflows/ci.yml) [![End-to-end](https://github.com/him-agni/e-commerce-website/actions/workflows/e2e.yml/badge.svg?branch=main&event=workflow_dispatch)](https://github.com/him-agni/e-commerce-website/actions/workflows/e2e.yml)

A modern farmhouse furniture store built as a portfolio project. Browse a catalog of 60 products in 9 categories, pick a color, size and design, pay with Stripe (test mode), and ask an AI shopping assistant.
<img width="1608" height="962" alt="image" src="https://github.com/user-attachments/assets/501c6d5a-08b1-44ce-90ea-c15a2b38610b" />
Link: https://my-farmhouse-pi.vercel.app/

**Nothing here takes real money.** Stripe runs in test mode only, and the app refuses a live Stripe key.

## Features

- **Storefront:** an animated home page, category pages, and product pages where choosing a color, size or design updates the price, stock message and photo.
- **Hashtags:** inside a category, products are grouped by hashtags such as `#accent-chair` or `#tv-stand`. Each shows on the product and its card, has its own filter pill and shareable page (`/categories/chairs/accent-chair`), and appears in the Shop menu.
- **Product page extras:** a quantity stepper (limited by stock), a share button (the phone's share sheet, or copy-link on desktop), and a wishlist heart. The wishlist is saved in the visitor's browser only, on purpose: the Sanity dataset is public, so nothing personal goes there.
- **Accounts:** sign up and sign in with Clerk. Checkout requires an account.
- **Cart and checkout:** cart kept in the browser, with price and stock re-checked against the catalog on every view. Stripe Checkout sessions are built on the server from catalog prices, never from the browser.
- **Orders:** a Stripe webhook records each paid order, creates the customer, and reduces stock, all in one safe-to-repeat step. Signed-in shoppers see their orders under **My orders**.
- **Shopping assistant:** a chat window powered by Google Gemini that searches the real catalog, checks product options and stock, and (for signed-in shoppers) looks up their orders.
- **Admin:** the owner runs the store from Sanity Studio at `/studio`: edit products, prices, stock and photos, and update order status. Edits appear on the live site within seconds through a refresh webhook.
- **Quality:** accessible (axe checks clean), SEO-ready (sitemap, robots, structured data, canonical links), error pages, and loading placeholders.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui (Base UI), Playfair Display + Geist |
| Content and database | Sanity (Studio embedded at `/studio`); orders and customers live there too |
| Auth | Clerk |
| Payments | Stripe Checkout and webhooks (test mode) |
| AI | Vercel AI SDK v7 with Google Gemini |
| Hosting | Vercel Hobby |

## Getting started

You need Node.js 20.9 or newer (developed on 24) and accounts for Sanity, Clerk, Stripe, and Google AI Studio. All have free tiers (see [docs/deploy.md](docs/deploy.md#free-tier-limits)).

```bash
npm install
cp .env.example .env.local      # then fill in the values (see below)
npm run check-env               # confirms the keys look complete and untruncated
npm run seed                    # fills Sanity with the catalog and photos
npm run dev                     # http://localhost:3000
```

The Studio is at http://localhost:3000/studio. In the Sanity dashboard, add `http://localhost:3000` under **API → CORS origins** with credentials allowed.

### Environment variables

| Variable | Where to get it | Needed for |
| --- | --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET` | sanity.io/manage → your project | everything |
| `SANITY_API_WRITE_TOKEN` | project → API → Tokens (Editor) | seeding, webhook writes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk dashboard → API keys | sign in |
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys (**test** key) | checkout |
| `STRIPE_WEBHOOK_SECRET` | printed by `stripe listen` (below) or your Stripe webhook endpoint | recording orders |
| `GOOGLE_GENERATIVE_AI_API_KEY` | aistudio.google.com/apikey | the assistant |
| `UNSPLASH_ACCESS_KEY` | unsplash.com/developers | the seed script only |
| `ORDER_ID_SECRET` | make one: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` (32+ characters). **Never change it once orders exist.** | keeps real user and Stripe ids out of the public dataset |
| `SANITY_REVALIDATE_SECRET` | any random string (16+ characters) | live refresh after deploy |
| `NEXT_PUBLIC_SITE_URL` | your site's public URL | canonical links, sitemap, Stripe redirects |

Copy secret keys with the dashboard's copy button. Some dashboards show only a masked `sk_test_…`, and pasting that breaks authentication. `npm run check-env` catches this without printing any secret.

### Testing payments locally

Stripe must be able to reach your machine to confirm payments. Run this in a second terminal and keep it open while you test:

```powershell
$k = (Select-String -Path .env.local -Pattern '^STRIPE_SECRET_KEY=(.*)$').Matches.Groups[1].Value
stripe listen --api-key $k --forward-to localhost:3000/api/webhooks/stripe
```

It prints a `whsec_…` signing secret; put it in `.env.local` as `STRIPE_WEBHOOK_SECRET` and restart `npm run dev`. Pay with card `4242 4242 4242 4242`, any future expiry, any CVC, and any US address. (Passing `--api-key` avoids a stale saved `stripe login` pointing at another account.)

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | development server |
| `npm run build` / `npm start` | production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | generates Next's route types, then runs the TypeScript compiler |
| `npm test` | unit and integration tests (Vitest); `npm run test:watch` re-runs on save, `npm run test:coverage` adds a coverage report |
| `npm run test:e2e` | browser tests (Playwright) against a running site; see Testing |
| `npm run typegen` | regenerates TypeScript types from the Sanity schemas and GROQ queries (run after changing either) |
| `npm run seed` | creates categories, products and photos in Sanity; safe to re-run |
| `npm run check-env` | validates `.env.local` without printing secrets |

The seed script uses Unsplash's free API, which allows 50 requests an hour. Its data (`scripts/seed-data.mjs`) is organized as category, then hashtag groups, then products. If it stops with a rate-limit message, wait an hour and run it again; finished work is kept.

## Testing

There are two layers. Neither one pays or writes to Sanity, so both are safe to run any time, including against the live site.

**Unit and integration tests (`tests/`, Vitest, about 5 seconds).** They cover the logic where a mistake would cost money or leak data, with Sanity, Stripe and Clerk replaced by fakes:

- *Checkout:* cart input is validated; the price charged always comes from Sanity, never the browser; stock is re-checked; every problem is reported at once.
- *Orders:* the order id comes from the Stripe session, so a repeated or simultaneous webhook cannot double-count; stock never goes below zero and oversold units are flagged; **no name, email or address ever reaches the public dataset**.
- *Webhooks:* Stripe's signature is verified with the real library (missing, wrong-secret and tampered bodies are all refused), and the Sanity refresh hook refuses unsigned calls.
- *Assistant:* the rate limiter, the tool results, the product search ranking, the chat route's validation (browser-supplied system messages are dropped; the user id comes from the session), and the reply renderer (no raw HTML, no external links).
- *Cart and wishlist:* stock and per-line caps, persistence, and the 50-item wishlist limit.
- *Catalog data:* nine categories, 60 products, unique slugs, valid hashtags, and every old category address redirecting to a hashtag page that exists.

**Browser tests (`e2e/`, Playwright, about two minutes for everything).** A real Chromium walks the storefront twice, once at desktop size and once as a Pixel 7 phone: the Shop menu, hashtag filters, old-address redirects, 404s, choosing a size, the quantity stepper, cart, wishlist, share, the assistant opening and closing, the sitemap and structured data, API routes refusing anonymous callers, no sideways scrolling, tap-sized buttons, and an automated accessibility scan (axe, WCAG 2.1 A/AA) of six pages.

**Signed-in flow.** One spec signs in as a dedicated Clerk test user, adds a product, presses Check out, and confirms Stripe opens in test mode with the right product, price and email. It stops there and never pays, so no order is created and no stock changes; the only trace is an unpaid Stripe test session. It skips itself unless these are set (in `.env.local`, or as CI secrets):

```bash
E2E_USER_EMAIL=e2e+clerk_test@example.com   # a user created in your Clerk development instance
CLERK_SECRET_KEY=sk_test_...                # already in .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

Create the user in the Clerk dashboard (Users, Create user) with an email containing `+clerk_test`. The test signs in with a one-time token from Clerk's API, so it needs no password.

```bash
npm run dev                                              # in one terminal
npm run test:e2e                                         # in another (or let it start the server itself)
E2E_BASE_URL=https://my-farmhouse-pi.vercel.app npm run test:e2e   # against the live site
```

On GitHub, `.github/workflows/ci.yml` runs lint, types and the unit tests on every push and pull request. `.github/workflows/e2e.yml` runs the browser tests against the live site on demand and once a day (add the three secrets named in that file to include the signed-in flow).

To check that the tests can actually fail, nine safeguards were broken on purpose (removing the stock check, the duplicate-order check, signature verification, the cart cap, and so on) to confirm the tests fail when they should. Automated accessibility checks find only some problems, so keyboard and screen-reader use still deserve a manual pass.

## How it fits together

- **Sanity is the database, and it is publicly readable.** Products (with variants and designs), categories, customers and orders live in one dataset, and anyone who knows the project id (it is in the site's page source) can read it without logging in. So **no personal data is stored there**: orders hold only the order number, items, totals, status and the Clerk and Stripe ids. Names, emails and shipping addresses stay in Stripe, and the My orders page looks the address up there for the signed-in owner. Prices are whole US cents.
- **The server decides prices.** The browser's cart holds only SKUs and quantities. `POST /api/checkout` re-reads price and stock from Sanity and builds the Stripe session itself.
- **Orders come from Stripe, not the browser.** `POST /api/webhooks/stripe` verifies the signature, then creates the order, upserts the customer and decrements stock in one Sanity transaction. The order id comes from the Stripe session id, so a repeated delivery cannot double-count.
- **Caching.** Catalog reads are cached with tags. Publishing in Studio calls `POST /api/revalidate` (a signed Sanity webhook), and a paid order refreshes the `products` tag, so pages never stay stale for long.
- **The assistant.** `POST /api/chat` streams Gemini replies. It can only call four server-side tools (search, product details, categories, my orders). The signed-in user comes from the server session, never from the model or the browser. Requests are rate limited and validated, and replies are rendered without raw HTML.

```
app/(shop)/…        storefront pages (home, categories and hashtag pages, products), cart, wishlist, orders, sign in/up
app/api/…           checkout, Stripe webhook, Sanity refresh webhook, chat
app/studio/…        embedded Sanity Studio
components/…        UI (site, product, cart, assistant, shadcn/ui)
lib/…               catalog queries, cart, checkout, orders, assistant (tools, search, model)
sanity/…            schemas, client, generated types
tests/…             unit and integration tests (Vitest)
e2e/…               browser tests (Playwright)
scripts/…           seed, env check
docs/…              plan, deployment guide
```

## Deploying

See [docs/deploy.md](docs/deploy.md) for the full checklist: Vercel, the Stripe and Sanity webhooks, Clerk, and the free-tier limits to keep in mind.

## Credits

Product photos come from [Unsplash](https://unsplash.com). Each uploaded photo keeps its photographer credit in the Sanity asset's credit line.
