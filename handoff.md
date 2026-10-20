# Handoff

Living status file. Update it at the end of every working session so the next session (or person) can pick up cold. Full plan: [docs/plan.md](docs/plan.md).

_Last updated: 2026-10-20_

## Current state
- **Phase 0 (Setup): code side done.** Remaining Phase 0 items need the user (accounts and keys, see below).
- Next.js 16.4.2 (App Router, TypeScript, Turbopack, `cacheComponents` on), Tailwind v4 via `@tailwindcss/turbopack` loader (no postcss config), shadcn/ui (`base-nova` style, lucide icons, one component so far: `button`).
- Brand applied in `app/globals.css`: warm-white background, charcoal/black primary, linen secondary, wood accent (`--wood`, usable as `text-wood`/`bg-wood`), Playfair Display for headings (`--font-serif`), Geist for body. Light and dark tokens both set. **Palette is a proposal; user has not confirmed it.**
- Home page is a placeholder. `npm run lint` and `npm run build` pass.
- Git: `main`, remote `origin` = https://github.com/him-agni/e-commerce-website.git. Initial commit pushed 2026-10-20.

## Done
- Scaffold, agent-skill setup (`CLAUDE.md`, `AGENTS.md`, `docs/agents/`), recovered plan into `docs/plan.md` (old chat lived in a OneDrive-keyed Claude session folder).
- shadcn init, fixed its self-referencing `--font-sans` var, brand tokens, serif heading font, SEO title template.
- `.env.example` with every variable later phases need; `.gitignore` allows `.env.example` but ignores real env files.
- Removed unused create-next-app SVGs from `public/`.

## Waiting on the user
1. Create accounts and keys, put them in `.env.local` (copy `.env.example`):
   - Sanity project (project id, dataset, write token)
   - Clerk application (publishable + secret key)
   - Stripe **test mode** keys (webhook secret comes later from `stripe listen`)
   - Google AI Studio API key
2. Confirm or change the brand look (palette, fonts, logo).
3. Confirm Unsplash/Pexels for stock photos.

## Next up
- Phase 1: Sanity project + embedded Studio at `/studio`, schemas (category, product with variants, customer, order), TypeGen, seed ~3 products per category. Needs the Sanity keys first.
- Verify current free-tier limits of each service before relying on them (plan Phase 0 item, not done).

## Gotchas
- This Next.js version differs from training data: read `node_modules/next/dist/docs/` before writing Next code (see `AGENTS.md`).
- Package manager is **npm** (pnpm is not installed).
- Stripe stays in test mode. Reference repo (sonnysangha/ecommerce-ai-nextjs-16-sanity-clerk-agentkit-stripe-checkout-vercel-ai-agents) is CC BY-NC 4.0: copy architecture ideas, not code.
- Issues are tracked as markdown under `.scratch/` (not created yet); domain docs `GLOSSARY.md` and `docs/adr/` not created yet.
