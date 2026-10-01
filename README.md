# Affiliate site – creator business niche

Static affiliate site for digital creator tools (email, course and community platforms, social/Pinterest tools, websites).
Research behind the product choices: `research/` in the project files (2026-10-01).

## Architecture

| Part | Where | Notes |
|---|---|---|
| Site | Astro (static) → Cloudflare Pages | `npm run build` → `dist/` |
| Settings | `src/site.config.mjs` | Name, domain and contact are placeholders |
| Products and affiliate links | `src/data/products.json` | **The only place an affiliate URL lives.** Empty `affiliateUrl` = link goes to the vendor homepage until we are approved |
| Link redirect + click log | `functions/go/[[path]].js` | `/go/<slug>/` → 302 to the affiliate URL. Logs product, page, source, campaign, country to Supabase if env vars are set. No IP, no cookies |
| Articles | `src/content/articles/*.md` | `draft: true` by default. Drafts show in `npm run dev` only, never in a production build |
| Database | `supabase/migrations/001_init.sql` | products, affiliate_programs, articles, article_products, keywords, pins, clicks, conversions, campaigns |
| Checks | `npm run check:links` | Validates the registry, article product references and the redirect logic |

URL structure: `/guides/ /best/ /comparisons/ /alternatives/ /reviews/ /tools/<category>/ /go/<product>/` plus `/about/ /contact/ /privacy/ /cookies/ /affiliate-disclosure/`.

## Tracking

- Pins link to articles with `?utm_source=pinterest&utm_campaign=<pin-id>`.
- Article links to `/go/` pick up `utm_source`/`utm_campaign` (or the external referrer domain) and pass them as `?src=&c=`. Nothing is stored in the browser.
- Conversions and revenue come from the network dashboards (imported into `conversions`), because networks don't report sales back to us in real time.

## Publishing rules

1. Every article needs first-hand testing (screenshots, real limits) before `draft: false`.
2. A human reads it and sets `reviewedBy`.
3. Re-check prices and affiliate terms on the vendor's site; update `lastVerified` in `products.json`.
4. Each affiliate link is labelled "(ad)" and pages with links show the advertising notice at the top (Forbrukertilsynet guidance).

## Secrets

Never commit keys. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as Cloudflare Pages environment variables (see `.env.example`).

## Commands

```
npm install
npm run dev          # http://localhost:4321, drafts visible
npm run check:links
npm run build
```
