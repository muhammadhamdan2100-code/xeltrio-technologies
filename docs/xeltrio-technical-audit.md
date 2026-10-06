# Xeltrio Technologies — Technical Audit (Part 01)

- **Audit date:** 2026-10-05
- **Audit scope:** Existing frontend at `D:\company\xeltrio` + live Supabase project `yparzhgzhpwewyrjhqud` + GitHub `muhammadhamdan2100-code/xeltrio-technologies`
- **Audit type:** READ-ONLY. No production code was modified, no schema changes, no data writes, no new integrations activated.
- **Evidence files:** `docs/_audit_*.txt`, `docs/_audit_screenshots/`, `tmp-audit/responsive-sweep.mjs`, `tmp-audit/responsive-results.json`

---

## 1. Executive Summary

Xeltrio Technologies is a **Next.js 16 corporate website (Phase 1 + Phase 2 of the roadmap)** that is technically complete, statically prerendered, and production-quality at the frontend layer — while being **completely disconnected from its own backend**.

Key facts established by this audit:

| Area | Status |
|---|---|
| Frontend build | PASS — `next build` exit 0, 33/33 routes prerendered static (○), no warnings |
| TypeScript | PASS — `tsc --noEmit` exit 0 |
| Lint | PASS — 0 errors, 2 pre-existing warnings |
| Responsive/UI regression | PASS — 120/120 route×viewport loads clean (0 overflow, 0 console errors, 0 broken images) |
| Internal links | PASS — 55/55 internal hrefs resolve 200 (0 dead links) |
| Backend (Supabase) | Live, seeded (101 rows / 23 tables), RLS 23/23, Advisor clean |
| Frontend → Backend integration | **NONE** — zero `process.env` usage, zero Supabase imports, no API routes, no server actions |
| Auth | Not implemented in app (Supabase Auth infrastructure exists, 2 users seeded) |
| Contact form | **Simulated** (`setTimeout`) — no network request, no data captured |
| Payments / AI / CRM UI | Not present (by design — later phases) |
| Environment variables | None configured (no `.env*` files, zero `process.env` references) |

The single most important finding: **the backend was already built and seeded in Supabase (15 migrations, 23 tables, 92 RLS policies, 7 storage buckets) but nothing in the frontend consumes it.** The website renders from hardcoded TypeScript constants (`lib/constants.ts`, 65 KB, 59 exports) that duplicate content already present in the database. This creates a two-sources-of-truth problem the moment Phase 02 begins.

Secondary findings: 4 security advisories (1 critical, 3 high) in the transitive `sharp` dependency chain (fix path: `next@16.3.8`, currently pinned `16.2.12` — document only, not applied); missing SEO infrastructure (`robots.txt`, `sitemap.xml`, OG image, `metadataBase`, JSON-LD); 3 unused runtime dependencies; legal/business claims (e.g. "Xeltrio Technologies Private Limited") that cannot be verified from the repository and are flagged **CONTENT VERIFICATION REQUIRED**.

---

## 2. Current Technology Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.2.12 | Exact pin; `next.config.ts` is empty (defaults) |
| UI runtime | React / React DOM | 19.2.4 | All routes static |
| Language | TypeScript | 5.9.3 (^5) | `strict: true`; project compiles clean |
| Styling | Tailwind CSS v4 | ^4 | `@tailwindcss/postcss`; single 61 KB CSS bundle |
| Fonts | Fontsource | Inter, JetBrains Mono, Space Grotesk ^5.3.0 | 42 woff2 + 42 woff in build output; 3 preloaded |
| Animation | framer-motion | ^12.42.2 | Used across sections; `Reveal` wrapper |
| Animation | GSAP | ^3.15.0 | Installed |
| 3D | three ^0.185.1 + @react-three/fiber ^9.6.1 | | Code-split via `next/dynamic` `ssr:false` |
| 3D (unused) | @react-three/drei | ^10.7.7 | **Installed but never imported** |
| Backend SDK (unused) | @supabase/supabase-js | ^2.112.0 | **Installed but never imported** |
| Toasts (unused) | react-hot-toast | ^2.6.0 | **Installed but never imported** |
| Icons | lucide-react | ^1.31.0 | |
| Utilities | clsx | ^2.1.1 | |
| Lint | ESLint 9 (flat config) + eslint-config-next 16.2.12 | | `eslint.config.mjs` |
| Package manager | npm | | `package-lock.json` present |
| Node | 24.18.0 | | Local dev environment |
| Hosting config | `vercel.json` | | `buildCommand: next build`, `framework: nextjs` |

No Prettier config. No test framework. No CI (`.github/` absent). Local directory is **not a git repository** (`.git` absent), although a GitHub remote exists.

Import note: `AGENTS.md` (aliased by `CLAUDE.md` via `@AGENTS.md`) requires reading `node_modules/next/dist/docs/` before writing Next.js code — this version of Next.js has breaking changes vs. common training data.

---

## 3. Project Structure

```
D:\company\xeltrio
├── app/                     # 30 page routes + favicon.ico + _not-found + _global-error (all static)
├── components/              # 49 files, 11 directories (29 × "use client")
│   ├── layout/  (4)         # Nav, Footer, PageShell, PageHeader
│   ├── sections/ (19)       # Hero, Founder, Technology, Roadmap, etc.
│   ├── canvas/  (7)         # Three.js scenes + fallbacks + error boundary
│   ├── ecosystem/ (6)       # Ecosystem hero/diagram components
│   ├── contact/ (5)         # ContactForm, ContactCards, SocialMediaLinks, ...
│   ├── founder/ (2)
│   ├── cursor/  (2)         # Custom cursor (lazy)
│   ├── motion/  (1)         # Reveal
│   ├── businessos/ (1)      # BusinessOSSubNav
│   ├── legal/   (1)         # LegalDocument
│   └── ui/      (1)         # ProductGlyph
├── lib/                     # constants.ts (65 KB, 59 exports — ALL site content), utils.ts
├── hooks/                   # useReducedMotion.ts
├── public/                  # 11 static files (5 referenced, 6 unused)
├── docs/                    # audit evidence + this document + architecture doc
├── tmp-audit/               # audit tooling (CDP responsive sweep + JSON results)
├── next.config.ts           # empty defaults
├── eslint.config.mjs, postcss.config.mjs, tsconfig.json, vercel.json
├── AGENTS.md / CLAUDE.md    # Next.js version-specific instructions
└── README.md
```

Observations:
- 0 `"use client"` in `app/` — client boundaries are correctly pushed down into `components/`.
- All content lives in one 65 KB constants file; no data layer, no fetch layer.
- `public/` contains 6 unreferenced files: `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`, `xeltrio-horizontal.png`.

---

## 4. Route Map

All 33 build routes are prerendered as static (○). 30 are public pages (all were swept in the responsive audit).

| Group | Routes |
|---|---|
| Home | `/` |
| Company | `/founder`, `/careers`, `/contact`, `/global-expansion`, `/investor-relations`, `/research`, `/resources`, `/roadmap`, `/technology`, `/industries`, `/solutions`, `/products` |
| BusinessOS (10) | `/businessos`, `/businessos/ai-platform`, `/businessos/architecture`, `/businessos/enterprise`, `/businessos/features`, `/businessos/modules`, `/businessos/roadmap`, `/businessos/security`, `/businessos/technology` |
| AI | `/ai-future` |
| Brands | `/hamiaworks-ai`, `/hm-signature` |
| Legal (5) | `/legal`, `/legal/cookie-policy`, `/legal/disclaimer`, `/legal/privacy-policy`, `/legal/terms-of-service` |
| Internal | `/_not-found`, `/_global-error`, `/favicon.ico` (route handler) |

No dynamic routes, no API routes, no route handlers other than `favicon.ico`, no middleware, no parallel/intercepting routes.

---

## 5. Component Architecture

49 components in 11 directories. Architecture is consistent:

- **Server-first:** All pages in `app/` are server components; interactivity is isolated in leaf components (`"use client"`).
- **Three.js isolation:** WebGL scenes are lazily loaded with `next/dynamic` + `ssr:false` and wrapped in `CanvasErrorBoundary` with `HeroFallback`:
  - `components/sections/Hero.tsx:7` (used only by `app/page.tsx`)
  - `components/sections/BusinessOSHero.tsx:7` (used only by `app/businessos/page.tsx`)
  - `components/canvas/HeroCanvas.tsx:9`, `EnterpriseNetworkCanvas.tsx:9`, `components/cursor/CursorLoader.tsx:5`
  - Result: the 897 KB three.js chunk is **not** in the initial HTML of any page; it loads only on pages that embed a canvas.
- **Motion:** `Reveal` (framer-motion) + `useReducedMotion` hook — reduced-motion users are respected.
- **Custom cursor:** `CursorLoader` — lazy, client-only.
- **Shared UI:** `PageShell`/`PageHeader` standardize page scaffolding; `LegalDocument` renders all 5 legal pages from `lib/constants.ts`.
- **Content coupling:** Nearly every section component imports its data from `lib/constants.ts`. This is the exact coupling that Phase 02 will need to invert (component → data layer → Supabase) without changing visual output.

No component library (no shadcn/MUI/etc.); UI is bespoke with Tailwind + lucide.

---

## 6. Current Data Architecture

There is no runtime data layer. All rendered content is hardcoded and classified as follows:

**Class A — Static content hardcoded in TypeScript (`lib/constants.ts`, 65 KB, 59 exports).** Includes: nav/footer link sets, core values, why-Xeltrio, technology pillars, ecosystem products, BusinessOS modules/pillars/architecture/features/roadmap/tech-stack, solutions (9), industries (9), research areas, AI-future stages, global-expansion phases, resources, careers pillars, press sections, legal pages (4 documents), ecosystem nodes, HM Signature brand content, company roadmap, founder profile/timeline/vision, company trust pillars, investor relations, media center, contact channels/service options/budget/timeline options/info cards/FAQ, global presence, HM Signature assets.

**Class B — Content that exists in Supabase but is NOT consumed by the frontend** (verified via cloud queries): `solutions` (9 rows), `industries` (9), `products` (12), `product_categories` (3), `roadmap_steps` (10), `hm_signature_fragrances` (4), `faqs` (5), `legal_pages` (4), `content_items` (32), `company` (1), `founder` (1). This is a full duplicate of Class A content, seeded but unused.

**Class C — User-generated / transactional data:** `contact_messages` (1 row in cloud DB — inserted manually or by a test, **not** by the deployed site, whose form is simulated). `newsletter_subscribers` (0 rows; no newsletter UI exists in the frontend).

**Class D — Tables that exist but have no frontend surface and no data:** `announcements`, `brand_pages`, `careers_jobs`, `footer_links`, `navigation_items`, `news_articles`, `press_releases`, `resources`, `testimonials`.

Client-side persistence: none (no localStorage/sessionStorage/cookies usage). No state management library.

---

## 7. Authentication Status

- **Application layer: NOT IMPLEMENTED.** No login/logout UI, no session handling, no middleware, no protected routes, no `@supabase/ssr`.
- **Backend layer: INFRASTRUCTURE READY.** Supabase Auth is active on the cloud project: `auth.users` contains 2 users; `public.profiles` has 2 rows with roles `[admin, staff]`; helper functions `handle_new_user`, `is_admin()`, `is_staff_editor()` exist and are used by RLS policies; `set_updated_at` trigger helper present.
- The `@supabase/supabase-js` package is installed (^2.112.0) but never imported.
- No auth-related environment variables are configured anywhere.

Conclusion: the auth *foundation* (users, roles, RBAC helpers, RLS gating) is done server-side; the *experience* (sign-in, dashboard, session) is entirely absent from the app.

---

## 8. Supabase Status

Deep audit performed 2026-10-05 via SQL Editor (read-only SELECTs only). Full raw evidence: `docs/_audit_supabase_security_depth.txt`.

| Item | Finding |
|---|---|
| Project | `yparzhgzhpwewyrjhqud` — org "xeltrio technologies Org", plan **FREE** (Nano, ap-south-1 Mumbai) |
| Tables (public) | 23 |
| RLS | Enabled on **23/23** tables |
| Policies | 92 total (public role: 90; anon: 2; authenticated: 2) |
| Public write paths | Exactly 2 anon writes: `contact_messages:INSERT` and `newsletter_subscribers:INSERT` — correct pattern for a public marketing site |
| Write gating | All staff writes attached to `public` role but gated via helper functions (verified sample: `products` UPDATE qual = `( SELECT is_staff_editor() AS is_staff_editor)`); anonymous users pass no write check (auth.uid() null) |
| Helpers | `handle_new_user`, `is_admin`, `is_staff_editor`, `set_updated_at` |
| Indexes | 44 (incl. FK indexes added by migration 013) |
| Migrations | 15 (001_roles_and_helpers → 015_seed_solutions), 2026-08-02/03 |
| Seed state | 101 rows across 13 tables (company 1, founder 1, contact_messages 1, content_items 32, faqs 5, hm_signature_fragrances 4, industries 9, legal_pages 4, product_categories 3, products 12, profiles 2, roadmap_steps 10, solutions 9); 10 tables empty |
| Storage | 7 buckets: `company-assets`, `founder`, `hm-signature`, `logos`, `media`, `news`, `products` |
| Dashboard | Advisor Center: **no security or performance issues**; GitHub integration connected (branch `main` = PRODUCTION); last migration badge `015_seed_solutions` |
| Backups | **None configured** (FREE plan limitation) — acknowledged risk |

**Important:** none of this is reachable from the frontend today; there is no Supabase client instantiation anywhere in the codebase.

---

## 9. API / Integration Status

| Integration | Status |
|---|---|
| Supabase (DB/Auth/Storage) | Backend live; frontend integration **NOT_STARTED** |
| Contact form | **SIMULATED** — `components/contact/ContactForm.tsx:27` is `await new Promise((resolve) => setTimeout(resolve, 1000));`. No network call; submissions are discarded client-side |
| Newsletter | No UI, no code (0 matches for "newsletter" in `components/`) |
| Payments (Stripe) | NOT_CONFIGURED — per Phase 01 constraint, no activation performed, no keys exist |
| AI services | NOT_CONFIGURED — `/ai-future` and `/businessos/ai-platform` are content-only pages |
| Email (transactional) | NOT_CONFIGURED |
| Analytics | NONE in code |
| External links | Real: LinkedIn (personal profile `in/muhammad-hamdan-144379427`), Instagram/Facebook/X/YouTube/TikTok (`@xeltriotechnologies` / `@xeltriotech`), WhatsApp `wa.me/923252522262` — all with `target="_blank"` + `rel="noopener noreferrer"` (`components/contact/SocialMediaLinks.tsx:96-97`) |
| API routes / server actions | None exist |

---

## 10. Environment Variable Map

**Current state: zero environment variables configured.** No `.env`, `.env.local`, or any `.env*` file exists (`.gitignore` is already prepared to exclude `.env*`). `grep` for `process.env` across the repo returns zero matches.

Required set for future phases (names only — values never printed per audit constraints):

| Variable (future) | Status | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | NOT_CONFIGURED | Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | NOT_CONFIGURED | Public client key (RLS-enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | NOT_CONFIGURED | Server-only admin key — must never reach the client bundle |
| `NEXT_PUBLIC_SITE_URL` | NOT_CONFIGURED | `metadataBase`, canonical URLs, sitemap |
| `STRIPE_SECRET_KEY` | NOT_CONFIGURED | Payments — **do not activate in Phase 02** |
| `STRIPE_WEBHOOK_SECRET` | NOT_CONFIGURED | Payments — do not activate |
| `RESEND_API_KEY` (or equivalent) | NOT_CONFIGURED | Transactional email |
| AI provider key (e.g. `OPENAI_API_KEY`) | NOT_CONFIGURED | AI layer only, later phase |

No secret material of any kind exists in the repository.

---

## 11. Frontend → Backend Gap Analysis

| Frontend surface | Data source today | Backend target (exists in Supabase?) | Gap |
|---|---|---|---|
| Home / company sections | `lib/constants.ts` (Class A) | `company`, `content_items` (Class B) | Wire read path |
| `/products` (12 products) | constants | `products`, `product_categories` seeded | Wire read path |
| `/solutions` (9) | constants | `solutions` seeded | Wire read path |
| `/industries` (9) | constants | `industries` seeded | Wire read path |
| `/roadmap` (10 steps) | constants | `roadmap_steps` seeded | Wire read path |
| `/legal/*` (4 docs) | constants | `legal_pages` seeded | Wire read path |
| `/contact` FAQ | constants | `faqs` seeded | Wire read path |
| `/hm-signature` fragrances | constants | `hm_signature_fragrances` seeded | Wire read path |
| Contact form | `setTimeout` simulation | `contact_messages` (anon INSERT policy ready) | Implement real insert + validation + UX states |
| Newsletter | No UI exists | `newsletter_subscribers` (anon INSERT policy ready) | Build capture UI + insert |
| Press / News | constants (press sections) | `press_releases`, `news_articles` exist but empty | Seed + wire, or keep static |
| Careers | constants (`CAREERS_PILLARS`) | `careers_jobs` exists but empty | Seed + wire |
| Testimonials | not present | `testimonials` exists but empty | Seed + build UI (later) |
| Auth / admin / CMS | none | Auth ready, RBAC seeded, RLS ready | Build `/admin` experience |
| Images/media | `/public` static files | 7 storage buckets exist, **empty** | Upload assets, migrate `next/image` sources |
| Search | none | — | Later phase |
| Analytics / observability | none | — | Later phase |
| Payments | none | — | Prohibited this phase |

Net: **~85% of the read-path backend content already exists; 100% of the write-path and auth experiences do not exist.**

---

## 12. Security Findings

### Critical
- **Dependency-level only:** `sharp` (transitive via Next.js image optimization) carries 4 advisories — 1 critical + 3 high (libvips CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591; libheif GHSA-g89c-p67h-r497, GHSA-2jg2-4ch7-h545). Practical exposure is limited: the site processes only local, trusted images; no remote image optimization is configured. Prescribed fix: upgrade to `next@16.3.8` (currently pinned `16.2.12`) — **documented only, not applied** in this read-only audit. No application-level critical findings.

### High
- None.

### Medium
- **No custom security headers** — `next.config.ts` is empty; no CSP, no `X-Frame-Options`/frame-ancestors, no Referrer-Policy at the app layer (platform defaults only).
- **Local directory is not a git repository** — the working copy has no `.git`; production code lacks local version-control safety net (a GitHub remote exists, but the local working tree is unprotected).
- **No backups on the Supabase FREE plan** — acknowledged in dashboard; acceptable now (no production data flows), must be revisited before CRM/write traffic begins.
- **Future public write endpoints need abuse controls** — when `contact_messages` INSERT is actually wired, add rate limiting/CAPTCHA hygiene; the anon INSERT policy itself is correct.

### Low
- 6 unreferenced files in `public/` (attack surface trivial, but dead assets).
- 2 pre-existing lint warnings (`app/products/page.tsx:8:30` unused `PRODUCT_LEARN_MORE_HREF`; `components/layout/Nav.tsx:3:21` unused `useRef`).
- 3 unused runtime dependencies increase supply-chain surface.

### Verified good
- No secrets in repo; `.gitignore` covers `.env*`.
- External links use `rel="noopener noreferrer"`.
- Supabase: RLS 23/23, minimal anon surface (2 INSERT policies), staff writes gated by RBAC helper functions, Advisor clean.

---

## 13. Performance Findings

Measured on the production build (`next start`, port 3717):

| Metric | Finding |
|---|---|
| three.js chunk | `0zal0d3pv2anc.js` = 897 KB — lazy; absent from initial HTML of every page; loads only where a canvas exists (`/`, `/businessos`) |
| Total client JS | ~2.2 MB across chunks; home initial load = 14 chunks |
| CSS | Single 61 KB stylesheet |
| Media in build | 1.3 MB total — 42 woff2 + 42 woff + 1 ico; woff2 subtotal 532 KB; 3 fonts preloaded |
| Images | `next/image` used in 5 components; no raw `<img>`; largest raster `hm-signature-logo.png` (243 KB) |
| Rendering | 33/33 routes static (○) — served as prerendered HTML; no SSR compute per request |
| Layout stability | Home page document height ~14,967 px at desktop (long-form marketing page by design) |
| Responsive sweep | 120 loads (30 routes × 4 viewports: 1920/1440/768/390): 0 px overflow, 0 console errors, 0 broken images, 0 missing nav/footer, 0 load failures |

No performance-blocking issues found for the current static scope. When backend integration starts, watch: adding read-path fetches must not de-optimize static rendering (prefer build-time/ISR reads, keep client JS flat).

---

## 14. SEO Findings

Verified on the production server:

| Item | Status |
|---|---|
| `title` / `description` uniqueness | PASS — all 30 public routes have unique titles and descriptions |
| `/favicon.ico` | 200 (served from `app/favicon.ico`) |
| `/robots.txt` | **404 — missing** |
| `/sitemap.xml` | **404 — missing** |
| `/manifest.webmanifest` | 404 — missing (low priority) |
| `/apple-touch-icon.png` | 404 — missing |
| `/opengraph-image` | 404 — missing (OpenGraph declared in `app/layout.tsx` line 29, but **no image** — social shares won't render a card) |
| `metadataBase` | **Not set** — no canonical/absolute-URL base |
| Canonical / alternates | Not present |
| Twitter card metadata | Not present |
| JSON-LD structured data | None (no Organization/Product/Breadcrumb schemas) |
| Title template | None set (no shared suffix) |
| Title separator consistency | Inconsistent — `/founder` uses `\|` while other routes use `—` |
| Internal links | PASS — 55/55 hrefs (25 homepage + 30 more-page samples) return 200; zero dead links |
| Semantic HTML | Strong — proper heading hierarchy and landmarks throughout pages |

Verdict: content-level SEO is good; **technical SEO plumbing is the weak area** (sitemap, robots, OG image, JSON-LD, metadataBase are all quick Phase-02 wins).

---

## 15. Dependency Findings

| Category | Details |
|---|---|
| Unused dependencies | `@react-three/drei` (^10.7.7), `@supabase/supabase-js` (^2.112.0), `react-hot-toast` (^2.6.0) — installed, never imported |
| Outdated majors | `@types/node` 20 → 26, `eslint` 9 → 10, `framer-motion` 12.42.2 → 14.0.0, `typescript` 5.9.3 → 7.0.2, `next` 16.2.12 → 16.3.8 |
| Security (`npm audit --omit=dev`) | 4 vulnerabilities (1 critical, 3 high) — all in the `sharp` chain; fix requires `next@16.3.8` (outside the exact pin) — **documented only, not applied** |
| Lockfile | `package-lock.json` committed (good) |
| CI | None (`.github/` absent) |

Recommendation (Phase 02, separate approved change): upgrade `next` to 16.3.8 for the sharp CVEs first; treat framer-motion 14 / TypeScript 7 / ESLint 10 as deliberate, isolated upgrades well after backend integration stabilizes.

---

## 16. Technical Debt

1. **Two sources of truth** — `lib/constants.ts` duplicates content already seeded in Supabase (solutions, industries, products, roadmap, legal, FAQs, fragrances). Every content change must be made twice until Phase 02 inverts the dependency.
2. **Simulated contact form** presented through real UX (`components/contact/ContactForm.tsx:27`) — acceptable as a Phase-01 placeholder only; it currently implies a message was sent when nothing is captured.
3. **3 unused dependencies** + **6 unused public assets** (incl. `xeltrio-horizontal.png`).
4. **No tests** (0 test files, no framework) and **no CI**.
5. **No local git repository** despite an active GitHub remote.
6. **2 lint warnings** left in place (unused imports).
7. **Empty Supabase tables without frontend surfaces** (10 tables) — schema exists ahead of need; harmless but documents intent.
8. **No observability** — no analytics, no error monitoring, no logging.

---

## 17. Critical Issues

1. **Backend exists; frontend cannot reach it.** The single blocking issue for all future phases: no env vars, no client, no read path, no write path. Everything else in Phase 02 is downstream of this.
2. **Content-drift risk is live.** Because Class A and Class B duplicates already disagree in structure (TypeScript shapes vs. table schemas), any manual CMS edits in Supabase today would be invisible to the site — and any constants edit will diverge from the DB. Decide the canonical source before wiring either direction.
3. **Public write path must ship with abuse controls.** `contact_messages`/`newsletter_subscribers` INSERT policies are ready for the anon key; wiring them without rate limiting/CAPTCHA turns the form into an open spam endpoint on a FREE-tier DB.
4. **sharp CVEs** (1 critical) pending a Next.js patch upgrade.
5. **No backups** on the database (acceptable at 101 rows / zero live traffic; must change before CRM data accumulates).

---

## 18. Recommended Architecture

Detailed in `docs/xeltrio-target-architecture.md` (11 layers). In summary:

- Keep the existing frontend **visually untouched**; introduce a typed data-access layer (`lib/db/` or similar) between server components and Supabase so section components keep receiving the same props they get from constants today.
- Read path: server components query Supabase directly with `@supabase/supabase-js` (anon key + RLS SELECT policies); prefer static/ISR reads to preserve the current all-static build; never expose the service-role key to the client.
- Write path: Server Actions (or route handlers) for contact/newsletter with Zod-style validation, rate limiting, and honeypot/CAPTCHA; service-role only server-side, only where RLS cannot express the operation.
- Auth: Supabase Auth with `@supabase/ssr`; `/admin` route group protected by middleware; RBAC already modeled (`profiles.role` ∈ {admin, staff}, `is_admin()`/`is_staff_editor()` in RLS).
- Storage: upload the 7 existing buckets' assets; migrate `next/image` sources progressively; keep `public/` as fallback until parity is verified.
- Payments and AI remain **unimplemented and unconfigured** this phase.

---

## 19. Proposed Database Domains

The existing 23 tables already map cleanly into domains (no new tables are required for Phase 02 read/write integration):

| Domain | Tables (existing) |
|---|---|
| Identity & RBAC | `profiles` (+ `auth.users`) |
| Company & Founder | `company`, `founder` |
| CMS / Content | `content_items`, `brand_pages`, `announcements`, `navigation_items`, `footer_links` |
| Products & Solutions | `products`, `product_categories`, `solutions`, `industries` |
| Roadmap | `roadmap_steps` |
| News & Press | `news_articles`, `press_releases` |
| Careers | `careers_jobs` |
| CRM (inbound) | `contact_messages`, `newsletter_subscribers` |
| Social proof & support | `testimonials`, `faqs` |
| Legal | `legal_pages` |
| Brand: HM Signature | `hm_signature_fragrances` |
| Resources | `resources` |

New tables only when a future phase demands them (e.g. `leads`, `deals`, `projects`, `invoices`, `ai_agents`, `translations`) — each to be introduced by a reviewed migration, not preemptively.

---

## 20. Future API Architecture

- **Default to no bespoke API.** Next.js server components call Supabase directly for reads; Server Actions handle mutations. A custom REST layer is only justified if a non-Next consumer appears.
- Reads: anon key + RLS (SELECT policies already exist); run at build/ISR time to preserve static delivery; `revalidate` per content domain.
- Writes: Server Actions with validation + rate limiting; service-role key used only in server-only modules, never in client bundles.
- Webhooks (future): route handlers with signature verification (e.g. Stripe) — signature secret stored as env var, never logged.
- AI (later): Supabase Edge Functions or server routes as the only egress points to provider APIs; provider keys server-side only.
- Error contract: typed results (`{ ok: true, data } | { ok: false, error }`) — no thrown errors across the boundary; user-facing messages mapped server-side.

---

## 21. Future Auth/RBAC Architecture

- **Provider:** Supabase Auth (email/password + magic link initially); `@supabase/ssr` for cookie-based sessions in the App Router.
- **IDs:** `auth.users.id` ↔ `profiles.id` (1:1); `handle_new_user` trigger already provisions profiles — verified present.
- **Roles:** `profiles.role` currently `[admin, staff]`; extend only by migration if additional roles (editor, viewer) are needed later.
- **Enforcement:** RLS is the source of truth (`is_admin()`, `is_staff_editor()` helpers exist). UI gating in `/admin` is cosmetic on top of RLS, never the enforcement layer.
- **Route protection:** middleware refreshes sessions and redirects unauthenticated `/admin/*` traffic; no route is protected today because none needs to be.
- **Escalation safety:** role changes only via admin-gated server action or SQL; no self-service role assignment.

---

## 22. Future Localization Architecture

- Current state: English-only; no i18n library; all copy in `lib/constants.ts` and Supabase seed rows (single language).
- Recommendation: deferred until after CMS integration (localizing a hardcoded file system would be thrown away). Then:
  - Option A (recommended): `next-intl` with locale-prefixed routes and a `messages/` catalog for UI chrome; DB content localized via a `translations` table (entity, field, locale, value) or locale columns on content tables — decision at that phase based on volume.
  - RTL: plan for a future `dir` switch; Arabic likely relevant given target markets (Dubai/Riyadh).
- No localization work is required or should be started in Phase 02.

---

## 23. Implementation Dependencies

Ordering constraints that must be respected in later phases (each arrow = "must exist before"):

1. Env vars + Supabase client + typed schema → any read path.
2. Content-canonicality decision (constants vs DB) → read-path wiring (else drift becomes permanent).
3. Read path for one page (pilot) → pattern roll-out to all pages.
4. Write validation + rate limiting → contact form & newsletter go live.
5. Auth (`@supabase/ssr` + middleware) → `/admin` shell → CMS CRUD → CRM workflows.
6. Storage asset upload → `next/image` source migration → `public/` cleanup.
7. Observability (analytics/error monitoring) before real user traffic.
8. AI layer strictly after auth + storage + data-access patterns exist.
9. Payments last; requires legal/business verification first; prohibited this phase.
10. Localization after CMS (content must be DB-managed first).

---

## 24. Recommended Phase Order

| Phase | Scope | Notes |
|---|---|---|
| **02** | Integration foundation: env vars, Supabase client, canonical-content decision, read path for all Class B content, real contact form + newsletter writes (with spam controls), SEO plumbing (sitemap/robots/OG/metadataBase) | The subject of the Part 01 → Part 02 handoff |
| **03** | Auth + `/admin` shell + CMS CRUD over existing tables | RBAC already seeded |
| **04** | CRM workflows (contact triage, newsletter management), careers/news seeding | Uses existing tables |
| **05** | Storage migration of static brand assets | Buckets exist, empty |
| **06** | AI layer (grounded on site content) | After stable read path |
| **07** | Payments/billing (if business model requires) | Legal verification first; separate approval |
| **08+** | Localization, portals, advanced CRM | Scope per future brief |

---

## 25. Phase 02 Preparation

Concrete readiness checklist for the next phase (all items verified against the live system):

- **Tables to use (already exist — do not create):** `company`, `founder`, `content_items`, `solutions`, `industries`, `products`, `product_categories`, `roadmap_steps`, `legal_pages`, `faqs`, `hm_signature_fragrances` (reads); `contact_messages`, `newsletter_subscribers` (anon inserts).
- **Relationships:** `products → product_categories` (FK), `content_items`-driven pages; FK indexes already added (migration 013, 44 indexes total).
- **RLS preparation:** complete — SELECT policies in place for public read tables; anon INSERT only on contact/newsletter; staff writes gated. Phase 02 writes need no policy changes.
- **Required indexes:** none outstanding for Phase 02 query patterns (major FK paths indexed).
- **Storage:** 7 buckets configured; Phase 02 needs no new buckets; asset upload deferred to Phase 05.
- **Migration strategy:** any schema change in Phase 02 must go through a new numbered migration (next: `016_*`) via SQL/dashboard; no direct DDL outside migrations. Free-plan backup gap: export a schema+data dump before the first Phase 02 write goes live.
- **Dependencies before first deploy:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` set in Vercel (Production + Preview); `SUPABASE_SERVICE_ROLE_KEY` only if a server-only operation needs it (not for plain contact insert).
- **Open risks carried into Phase 02:** sharp CVEs (upgrade `next` 16.3.8 recommended as the first isolated change), no DB backups (mitigate with manual dump), content canonicality decision pending, no local git repo (init or clone before code changes).

**END OF PART 01 AUDIT — awaiting explicit approval before any Phase 02 implementation.**
