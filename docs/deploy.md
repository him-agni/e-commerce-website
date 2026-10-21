# Deploying My Farmhouse

A step-by-step checklist for putting the site on Vercel's free Hobby plan. Everything runs in test mode, so nothing here handles real money.

Dashboards change their labels from time to time; where a menu name below does not match what you see, look for the closest equivalent.

## Before you start

- The code is on GitHub (`main`) and `npm run build` passes locally.
- `npm run check-env` is clean.
- The catalog is seeded in Sanity.

## 1. Create the Vercel project

1. Sign up at vercel.com with your GitHub account.
2. **Add New → Project**, then import the `e-commerce-website` repository. Vercel detects Next.js; keep the defaults for build and output.
3. Before the first deploy, open **Environment Variables** and add every value from your `.env.local` (names in [README.md](../README.md#environment-variables)), except:
   - `STRIPE_WEBHOOK_SECRET`: leave it for step 3. The deployed site gets its own secret.
   - `NEXT_PUBLIC_SITE_URL`: you do not know it yet; set it in step 2.
   - `SANITY_REVALIDATE_SECRET`: set it now to a long random string you make up (16+ characters) and keep a copy; you need the same value in step 4.
4. Click **Deploy**. Vercel gives you a URL such as `https://my-farmhouse-xxxx.vercel.app`.

## 2. Tell the site its own address

`NEXT_PUBLIC_SITE_URL` is baked in at build time, so changing it needs a rebuild.

1. In Vercel → **Settings → Environment Variables**, set `NEXT_PUBLIC_SITE_URL` to your URL (no trailing slash).
2. **Deployments → ⋯ → Redeploy** the latest deployment.

It controls canonical links, the sitemap, social previews, and where Stripe sends customers after paying.

## 3. Stripe webhook (so orders are recorded)

The `stripe listen` command you used locally only works on your computer. The deployed site needs a real endpoint.

1. Stripe dashboard (stay in **test mode**) → **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://YOUR-URL/api/webhooks/stripe`.
3. Events to send: `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
4. Create it, open it, and reveal the **Signing secret** (`whsec_…`).
5. In Vercel, add it as `STRIPE_WEBHOOK_SECRET` and redeploy.

This secret is different from the one `stripe listen` prints. Keep the local one in `.env.local` and the deployed one only in Vercel.

## 4. Sanity: allow the site and refresh it on edits

**CORS (so Studio works on the deployed site).** sanity.io/manage → your project → **API → CORS origins → Add**. Enter your site URL, tick **Allow credentials**. Without this, `/studio` on the deployed site cannot sign in.

**Refresh webhook (so edits show up without a rebuild).** Same project → **API → Webhooks → Create webhook**:

| Field | Value |
| --- | --- |
| URL | `https://YOUR-URL/api/revalidate` |
| Dataset | `production` |
| Trigger on | Create, Update, Delete |
| Filter | `_type in ["product", "category"]` |
| Projection | `{_type, "slug": slug.current}` |
| HTTP method | `POST` |
| Secret | the same value as `SANITY_REVALIDATE_SECRET` in Vercel |

Without this webhook the live site still refreshes, just on a schedule of a minute or so per page rather than immediately.

## 5. Clerk (sign in)

Your Clerk keys are **development** keys. Facts to plan around:

- Development keys generally keep working on a deployed URL, but Clerk shows a "development mode" banner and applies lower usage limits. That is fine for a portfolio demo.
- A Clerk **production** instance requires a domain you own (it needs DNS records), so it cannot be set up on a free `*.vercel.app` address. If you later buy a domain, create a production instance, swap in its `pk_live_`/`sk_live_` keys, and add the domain to Vercel.
- If sign-in fails on the deployed URL, check Clerk's dashboard for the allowed domains / redirect settings and add your Vercel URL.

Note: the app's Stripe code deliberately refuses `sk_live_` keys. Moving Stripe to live mode would be a separate, deliberate change.

## 6. Check everything

After the redeploys finish, walk through this on the deployed URL:

- [ ] Home, a category page and a product page load, with photos.
- [ ] Changing color/size/design updates price, stock and photo.
- [ ] Sign up or sign in works.
- [ ] Add to cart, check out with card `4242 4242 4242 4242`, and land on "Order confirmed".
- [ ] **My orders** shows the new order, and the product's stock dropped.
- [ ] Stripe dashboard → Webhooks → your endpoint shows deliveries with a `200` response.
- [ ] In `/studio`, change a product's stock or description, publish, and see the site update within a few seconds.
- [ ] Sanity → API → Webhooks shows successful deliveries.
- [ ] The assistant answers ("Do you have a linen couch?") and, when signed in, lists your orders.
- [ ] `/sitemap.xml` and `/robots.txt` load.

## Data privacy

The Sanity dataset is public-read (the free plan only offers public datasets, and the storefront needs to read it). The project id is visible in the site's page source, so treat everything in Sanity as public. Order and customer records therefore hold identifiers only. Names, emails and shipping addresses stay in Stripe and Clerk. Do not add personal fields to the Sanity schemas. Sanity keeps document history for 3 days on the free plan, and that history is readable by anyone who knows a document id and a time, so anything written by mistake stays recoverable for those 3 days even after it is deleted.

## Free-tier limits

Looked up on 2026-10-21. Providers change these often, so check the linked pages before relying on a number.

| Service | What the free tier gives | Things to know |
| --- | --- | --- |
| [Vercel Hobby](https://vercel.com/docs/plans/hobby) | Free for personal, **non-commercial** use. About 1M function invocations, 100 GB data transfer and 1M edge requests a month. | Fine for a portfolio project. Selling for real would need a paid plan. Going over a limit blocks that feature until the period resets. |
| [Sanity](https://www.sanity.io/pricing) | About 250k API requests, 1M API CDN requests and 100 GB bandwidth a month; 10,000 documents; 100 GB assets. | No overages: at 100% the public API is blocked (Studio keeps working). The catalog reads use the live API (not the CDN) so edits refresh instantly; Next.js caching keeps request counts low. Sources disagree on the dataset count, so treat it as unconfirmed. |
| [Clerk](https://clerk.com/pricing) | Hobby plan: 50,000 monthly retained users, no card needed. | No MFA or passkeys on the free plan. Older sources still quote a 10,000 limit; that changed in early 2026. |
| Stripe | Test mode is free and has no usage cost. | Test mode only, by design. |
| Google Gemini API | A free tier with small per-model limits. | **Unstable:** Google has cut free limits more than once and calls the free tier best-effort, and model availability changes (the 2.5 models are closed to new users). The assistant falls back to a lighter model, rate limits visitors, and shows a "busy, try again" message, but expect occasional failures. For real use, enable billing. |
| Unsplash API | Demo apps get 50 requests an hour. | Only the seed script uses it. |

Sources: [Vercel plans](https://vercel.com/docs/plans/hobby), [Sanity pricing](https://www.sanity.io/pricing) and its [plans docs](https://www.sanity.io/docs/platform-management/plans-and-payments), [Clerk pricing](https://clerk.com/pricing), and developer-forum reports on the [Gemini free tier](https://discuss.ai.google.dev/t/gemini-rate-limit-20-rpd/111274).

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Paid, but no order and stock unchanged | Stripe webhook missing, wrong URL, or `STRIPE_WEBHOOK_SECRET` is the local one. Check the endpoint's delivery log in Stripe. |
| Webhook delivery shows `400` | The signing secret in Vercel does not match the endpoint's secret. |
| Webhook delivery shows `500` | Check the Vercel function logs; Stripe retries automatically, and recording an order is safe to repeat. |
| Edits in Studio take a minute to appear | The Sanity refresh webhook is missing or its secret differs. |
| Studio says it cannot connect | The site URL is not in Sanity's CORS origins (with credentials). |
| Sign-in loops or "handshake" errors | A truncated or masked `CLERK_SECRET_KEY`. Run `npm run check-env`. |
| Photos missing | Image domains are allowed only for your Sanity project; check `NEXT_PUBLIC_SANITY_PROJECT_ID` is set in Vercel. |
| Assistant says it is busy | Gemini free-tier quota or demand. Wait a minute, or enable billing on the Google key. |
