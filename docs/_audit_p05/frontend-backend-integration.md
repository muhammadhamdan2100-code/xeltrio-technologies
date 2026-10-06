# PART 04 + PART 05 — Frontend ↔ Backend integration verification

Executed 2026-10-06 against the live Supabase project `yparzhgzhpwewyrjhqud`, a
production build, and the running dev server on `http://localhost:3000`.
Scope: brief sections §1, §8, §10, §15, §16, §17, §18, §19, §20, §22, §23.

Legend: **PASS** · **FAIL (found)** = defect discovered by execution · **FIXED** ·
**NOT TESTED** · **OWNER ACTION REQUIRED** · **FUTURE ENHANCEMENT**.

## 1. Pre-change audit (§1)

| Question | Answer found |
| --- | --- |
| Do admin pages read the database? | Yes — every `/admin/*` route goes through `requirePermission()`/`authorize()` + `createSupabaseServer()` |
| Does the public site read the database? | **No.** All 20+ public routes read `lib/constants.ts`; zero Supabase calls existed outside `app/admin`, `app/auth`, `app/logout`, `lib/admin`, `lib/authz` |
| Is the CMS consumed publicly? | **No** — `pages`/`page_sections` had no reader at all |
| Are public settings consumed? | **No** — `public_settings()` existed and was anon-granted, but nothing called it |
| Loading/error boundaries in `/admin`? | **None existed** (no `loading.tsx` / `error.tsx` anywhere in `app/`) |
| Mock/dummy/fake strings in shipped code | None — except one real finding, below |

### Critical finding: the public contact form never stored anything

`components/contact/ContactForm.tsx` line 25 read:

```ts
// Simulate form submission
await new Promise((resolve) => setTimeout(resolve, 1000));
setSubmitted(true);
```

The form showed "Message received." after a one-second delay and wrote **no row**.
Consequences while it stood: enquiries were silently lost, `contact_messages`
only ever held the one genuine 2026-08-04 record, the
`notify_new_contact_message()` trigger could never fire from the site, and the
admin notification feature was unreachable in production. **FAIL (found) → FIXED.**

Fix: `app/actions/contact.ts` → `submitContactAction(form)` validates
(name/email/message required with bounds, service/budget/timeline checked against
the shipped allow-lists), then inserts through the request-scoped server client so
the write passes `contact_messages_public_insert` RLS. `status` is never read from
the form, so a visitor cannot mark their own enquiry handled, and no id/role/actor
value is accepted. On rejection the user gets a generic message and only a
`security_event` with a reason code is recorded — never the visitor's text or
address. The component now shows the success screen only when the insert succeeds.

## 2. Public site ↔ CMS connection (§8)

New files:

- `lib/cms/public.ts` — cookie-free anonymous client + `getPublishedPage(slug)`
  (published page + visible published sections, ordered) + `getPublicSettings()`
  + `safeHref()`. Reads are wrapped in React `cache()` for per-request dedup.
- `components/cms/CmsBlocks.tsx` — renders all ten allowed section types
  (`hero`, `cards`, `features`, `stats`, `cta`, `testimonials`, `faq`, `logos`,
  `rich_list`, `custom`) using the site's existing design tokens.
- `components/cms/CmsPage.tsx` — `<CmsSections slug>` block + `cmsMetadata()`,
  which takes SEO fields from the **published row only**.

Wired routes: `/` (slug `home`), `/products`, `/industries`, `/solutions`,
`/founder`, `/careers`, `/contact`. Existing designed sections were kept
untouched; CMS blocks render after them and disappear entirely when the CMS has
nothing published for that slug, so the current design is preserved byte-for-byte
in the no-content case.

### Executed verification

Temporary controlled content was created directly in the database (a published
`products` page with one published `cards` section carrying an injection probe, one
hidden draft section, plus a draft `e2e-hidden` page), then read over HTTP.

```
=== /products on the running server ===
2 E2E Card One
2 published through the CMS
6 E2E SEO Title
0 E2E Hidden Section
0 E2E Draft Page
/e2e-hidden -> 404
```

| Test | Expected | Actual | Result |
| --- | --- | --- | --- |
| Published section renders from DB into public HTML | present | "E2E Card One", body text present | **PASS** |
| Published page SEO title drives `<head>` | used | `E2E SEO Title` ×6 (title/meta/OG) | **PASS** |
| Draft/hidden section not rendered | absent | 0 occurrences | **PASS** |
| Draft page not routable/leaked | absent | 0 occurrences, route 404 | **PASS** |
| Nothing stale after the rows were deleted | gone | re-fetch showed no E2E markup | **PASS** |

### Injection behaviour (§9 re-check, now on a real render)

The section title stored was literally `<script>alert(1)</script>E2E Section Title`
and one card href was `javascript:alert(1)`.

| Probe | Expected | Actual | Result |
| --- | --- | --- | --- |
| Executable `<script>alert(1)</script>` in output HTML | none | `0` occurrences | **PASS** |
| Same string rendered as inert escaped text | escaped | `&lt;script&gt;alert(1)&lt;/script&gt;` present, `E2E Section Title` visible as text | **PASS** |
| `href="javascript:..."` | blocked | `0` occurrences (card rendered without a link) | **PASS** |
| Legit internal `/contact` href | allowed | present | **PASS** |
| `dangerouslySetInnerHTML` / `innerHTML` / `eval` / `new Function` | none | still 0 across `app/`, `components/`, `lib/` | **PASS** |

### Caching and revalidation (§15)

`revalidatePath` was added to every CMS mutation: `createPageAction` (redirects
already), `updatePageAction`, `transitionPageAction` (publish/unpublish/approve/
archive), `deletePageAction`, `saveSectionAction`, `deleteSectionAction`,
`restoreRevisionAction`, plus `saveSettingsAction` → `/contact`. Each resolves the
page's own slug and invalidates exactly that public path and `/`; no global cache
disable, no `force-dynamic`, no `Cache Components` switch.

Observed and documented behaviour: prerendered routes keep whatever the CMS held at
build time until a mutation revalidates them. Proven by fetching `/products` from a
build made *before* the content existed (no CMS markup) and again on the dev server
after (full markup). This is correct stale-until-invalidated semantics, not a bug.

## 3. Public settings + media connection (§6 read path, §10)

`/contact` now overlays `public_settings()` onto the shipped defaults field by
field: `contact.email`, `contact.phone`, `contact.address`, `contact.hours`. An
empty setting falls back to the constant, so nothing disappears when unconfigured.

```
before setting contact.email:  2 x xeltriotechnologies@gmail.com (constants)
after  setting contact.email:  2 x e2e-contact@test.xeltrio , 0 x constant
private keys in public HTML:   notifications.enabled 0 | email.reply_to 0
                               system.media_max_upload_mb 0 | company.registration 0
```

| Test | Result |
| --- | --- |
| Setting written in DB appears on the public page with no rebuild | **PASS** |
| Clearing it restores the shipped default | **PASS** |
| Private (`is_public=false`) settings never appear in public HTML | **PASS** |
| Anonymous REST reads of `admin_settings()` | **PASS — `401 42501`** |
| `public_settings()` row count vs `is_public` count | **PASS — 26 = 26, no leakage** |

Public media (§10): the homepage/product/marketing imagery continues to load from
`public/` assets, which is correct — those files are code-owned brand assets, not
user-uploaded media. `media_assets` has no public consumer yet because no public
section references it by id; CMS `logos` sections can reference a stored public
object URL through `safeHref()`, which is now the supported path. **Deliberately
not rewritten** to avoid changing the existing design.

## 4. Loading / empty / error states (§16)

| Item | Status | Result |
| --- | --- | --- |
| `app/admin/loading.tsx` | new: skeleton + `aria-busy` + "Loading data…" | **PASS (build)** |
| `app/admin/error.tsx` | new: client boundary; deliberately does **not** render `error.message` (it can name tables/policies), offers Retry | **PASS (build)** |
| Empty states | already honest per panel ("No data yet", "Not configured", "Unavailable", "NOT AVAILABLE" for sessions/devices) | **PASS** |
| Form pending/success/error | `AuthStateForm` (admin) + ContactForm (public) | **PASS** |
| Authenticated visual confirmation of loading/error | requires a session | **NOT TESTED** |

## 5. End-to-end test through the real UI (§18)

Driven in the browser against the running app: loaded `/contact`, filled the form
as an anonymous visitor, clicked **Send Message**.

```
UI: "Message received."  (success screen, no error banner)
DB: cm_e2e=1   notif=1   (one enquiry row, one admin notification)
```

| Stage | Verified | Result |
| --- | --- | --- |
| Frontend → server action | row appeared only after wiring | **PASS** |
| Server → RLS boundary | anon REST cannot read/modify that row | **PASS** |
| DB trigger → notification | `notify_new_contact_message()` created it | **PASS** |
| UI reflects reality | success screen matched a committed row | **PASS** |
| Anonymous read of enquiries | `[]` via REST | **PASS** |
| Anonymous read of `audit_logs` / `admin_notifications` | `[]` via REST | **PASS** |
| Test artefact cleanup | enquiry + its notification + CMS test pages + temp setting all removed; verified below | **PASS** |

Login/password-reset end-to-end could not be executed: they need the owner's
credential, which is not present in this environment and was not requested or
invented. See §7.

## 6. Database security regression (§20) — re-run after integration

Final integrity after all work:

```
pages=0 sections=0 revisions=0 notif=0 media=0 storage=0
cm=1 (the one genuine 2026-08-04 enquiry)   audit=1 (the genuine Part 03 security_event)
profiles=2  roles_unchanged=admin,staff   settings=35   rls=33/33
```

Regression suite (16 items, each executed under a simulated identity inside an
aborted transaction):

| Control | Result |
| --- | --- |
| self-role escalation (client → super_admin) | **PASS denied (42501)** |
| cross-user profile write | **PASS 0 rows** |
| forged audit actor insert | **PASS denied (42501)** |
| audit UPDATE / audit DELETE (even super_admin) | **PASS denied (42501)** |
| anonymous sees draft page | **PASS 0 rows** |
| anonymous sees private storage object | **PASS 0 rows** |
| client media delete / media insert | **PASS denied** |
| content_manager settings write | **PASS 0 rows** |
| admin role change / admin user delete | **PASS denied (42501)** |
| illegal workflow jump (draft → published) | **PASS denied** |

Three items were initially reported as *blocked* by the combined harness
(`content_manager` approved→published, `super_admin` draft→published, `editor`
media create). Re-run in isolation each one **succeeded**, so those were
cross-item state effects inside the single long transaction, not permission
regressions. Reported as PASS with that caveat rather than silently smoothed over:

```
DIAG cm-approve-publish OK; sa-draft-publish OK; ed-media OK
```

## 7. Quality gates (§22, §23)

| Command | Result |
| --- | --- |
| `npm run typecheck` (added; previously only `tsc --noEmit` existed) | **PASS** exit 0 |
| `npm run lint` | **PASS** 0 errors, 0 warnings |
| `npm run build` | **PASS** `✓ Compiled successfully` |

Unauthenticated route matrix on the running server — `/login` **200**; `/admin`,
`/admin/users`, `/admin/users/[id]`, `/admin/roles`, `/admin/settings`,
`/admin/security`, `/admin/security/audit-logs`, `/admin/cms`, `/admin/media`,
`/app` all **307 → `/login?next=…`** with the correct encoded target. **PASS**

Not verified, and why:

| Item | Status |
| --- | --- |
| Authenticated rendering of the 10 admin routes, console/hydration checks, no-failed-request checks, post-mutation UI refresh in the browser | **NOT TESTED** — no legitimate credentials exist in this environment; none were invented and no test auth user was created |
| Real Storage upload/delete through the UI | **NOT TESTED** — same reason |
| Login success / logout / password reset round trip | **NOT TESTED** — same reason |
| `/about`, `/services`, `/company` | these routes do not exist in this site's information architecture (the content lives in homepage sections); **404 is the current intended behaviour** |

## 8. Remaining after this phase

1. **OWNER ACTION REQUIRED** — an authenticated smoke pass. Log in once with a real
   admin account and walk the ten `/admin` routes; that closes the only remaining
   unverified area. Nothing else about the admin surface has been shown in a browser.
2. **OWNER ACTION REQUIRED** — `NEXT_PUBLIC_SITE_URL` + Auth redirect allow-list.
3. **FUTURE ENHANCEMENT** — a public catch-all CMS route (e.g. `/[slug]`) so pages
   without a code route can still be published. Not added: it must not shadow the
   existing static routes and must validate published-only, which needs its own test
   pass.
4. **FUTURE ENHANCEMENT** — migrate `Nav`/`Footer` to `public_settings()`. Left as
   static code because reading the DB in the root layout would make all 20+ public
   routes dynamic, which the brief explicitly forbids as a caching strategy.
5. **FUTURE ENHANCEMENT** — no application-level rate limit on the public enquiry
   endpoint; PostgREST/Supabase platform limits apply, and the write is RLS-bound.
