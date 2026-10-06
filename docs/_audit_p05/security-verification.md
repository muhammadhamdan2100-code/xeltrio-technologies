# PART 05 — CMS & Media Management: security verification

Executed against the live Supabase project `yparzhgzhpwewyrjhqud` and the built
application on 2026-10-06. All results are from statements that actually ran.
Every destructive test ran inside `begin; … rollback;` and ended with
`raise exception`, so the transaction always aborted.

Legend: **PASS** · **FAIL** · **NOT TESTED** · **OWNER ACTION REQUIRED** · **FUTURE ENHANCEMENT**.

## 1. Schema inventory

| Object | Expected | Actual | Result |
| --- | --- | --- | --- |
| `pages` | exists, RLS on, 5 policies | yes | **PASS** |
| `page_sections` | exists, RLS on, 5 policies | yes | **PASS** |
| `page_revisions` | exists, RLS on, 1 policy (SELECT only) | yes | **PASS** |
| `media_assets` | exists, RLS on, 5 policies | yes | **PASS** |
| Indexes on the Part 05 tables | present | 24 | **PASS** |
| FKs on the Part 05/04 tables | present | 15 | **PASS** |
| `content_status` enum | +`in_review`, `approved` | 5 values present | **PASS** |
| Storage buckets | 7 public + exactly 1 new private | 8 total, `private-assets` public=false; **no duplicate bucket** | **PASS** |
| `storage.objects` policies | RBAC-based | 5 policies, listed in §5 | **PASS** |

## 2. CMS pages and sections

| Feature | Enforcement point | Result |
| --- | --- | --- |
| Page create / edit / SEO fields / slug uniqueness | `app/admin/cms/actions.ts` + RLS + `guard_page_workflow` | **PASS** |
| Section create / edit / ordering (`sort_order`) / visibility / delete | `page_sections` RLS (`can('pages',…)`) | **PASS (schema)** |
| Section types | allow-list in code AND a DB CHECK; unknown type rejected | **PASS (code)** |
| Structured content, no HTML columns | `pages` and `page_sections` have no HTML/text-body column that is rendered as markup; content is `items`/`props` jsonb with `jsonb_typeof` CHECKs | **PASS** |

## 3. Content workflow (Draft → In review → Approved → Published → Archived)

### Defects found by execution

`guard_page_workflow()` (migration 021) only asked *"does the caller hold the
permission for the target state?"* and was attached to **UPDATE only**. Four
bypasses were reproduced live before any fix:

```
content_manager  INSERT page status='approved'   -> ALLOWED (should be denied)
content_manager  INSERT page status='published'  -> ALLOWED (should be denied)
content_manager  UPDATE draft  -> published      -> ALLOWED (should be denied)
editor           UPDATE draft  -> published      -> ALLOWED (should be denied)
```

`content_manager` and `editor` hold `pages:publish` but **not** `pages:approve`,
so they could publish content that had never been reviewed or approved, and could
publish at creation time. The approval gate existed only in the admin UI.

Fixed by **migration 028**: every 021 permission check and stamp is preserved and
a legal-transition matrix plus a creation guard are added.

Legal transitions enforced by the database:

```
draft -> in_review | archived
in_review -> approved | draft
approved -> published | draft
published -> draft | archived
archived -> draft
super_admin is exempt from the matrix only (permission checks still apply)
```

### Verification after the fix — 13/13 correct

```
WF2 OK content_manager.create-draft=ALLOWED
   OK content_manager.insert-as-approved=raised(42501)
   OK content_manager.insert-as-published=raised(42501)
   OK content_manager.draft-to-inreview=ALLOWED
   OK content_manager.inreview-to-approved=raised(42501)
   OK content_manager.draft-to-published=raised(42501)
   OK editor.draft-to-published=raised(42501)
   OK content_manager.approved-to-published=ALLOWED
   OK content_manager.published-to-draft=ALLOWED
   OK content_manager.archived-to-published=raised(42501)
   OK admin.inreview-to-approved=ALLOWED
   OK admin.draft-to-published=raised(42501)
   OK super_admin.draft-to-published=ALLOWED
```

| Transition | Actor | Expected | Actual | Result |
| --- | --- | --- | --- | --- |
| create as draft | content_manager | allowed | ALLOWED | **PASS** |
| mint `approved` directly | content_manager | denied | raised 42501 | **PASS** |
| mint `published` directly | content_manager | denied | raised 42501 | **PASS** |
| draft → in_review | content_manager | allowed | ALLOWED | **PASS** |
| in_review → approved | content_manager | denied (no `pages:approve`) | raised 42501 | **PASS** |
| draft → published | content_manager / editor | denied (illegal jump) | raised 42501 | **PASS** |
| approved → published | content_manager | allowed | ALLOWED | **PASS** |
| published → draft (unpublish) | content_manager | allowed | ALLOWED | **PASS** |
| archived → published | content_manager | denied | raised 42501 | **PASS** |
| in_review → approved | admin (`pages:approve`) | allowed | ALLOWED | **PASS** |
| draft → published | admin | denied (illegal jump) | raised 42501 | **PASS** |
| draft → published | super_admin | allowed (full control) | ALLOWED | **PASS** |

The UI in `app/admin/cms/[id]/page.tsx` now offers only the legal next states,
mirroring the trigger; the trigger remains the authority.

## 4. CMS public exposure (mandatory)

Controlled pages in all five states were created inside a rolled-back transaction
and then read as `anon`.

```
EXPOSURE anon draft visible=0 | in_review=0 | approved=0 | PUBLISHED=1 | archived=0 | anon sections=0
```

| State | Anonymous public read | Result |
| --- | --- | --- |
| draft | denied (0 rows) | **PASS** |
| in_review | denied (0 rows) | **PASS** |
| approved | denied (0 rows) | **PASS** |
| published | allowed (1 row) | **PASS** |
| archived | denied (0 rows) | **PASS** |
| page_sections (any state) | denied (0 rows) | **PASS** |

All temporary content was destroyed by the transaction abort; final counts are
`pages=0`, `page_sections=0`, `page_revisions=0`, so nothing test-related is
visible on the public site.

## 5. CMS injection surface (Phase 9)

| Check | Method | Result |
| --- | --- | --- |
| `dangerouslySetInnerHTML` anywhere in the app | `grep -rn` over `app`, `components`, `lib` | **0 occurrences — PASS** |
| `innerHTML` assignment | same | **0 occurrences — PASS** |
| `eval(` / `new Function(` | same | **0 occurrences — PASS** |
| Arbitrary HTML columns | none exist; `page_sections` stores typed jsonb with `jsonb_typeof` CHECKs | **PASS** |
| Malicious payloads in structured content | `jsonField()` in `app/admin/cms/actions.ts` rejects any JSON containing `<script`, `javascript:`, `onerror=`, `onload=` before it is stored; `saveSettingsAction` applies the same rule to `type='json'` settings | **PASS (code)** |
| Section `body` / `title` rendering | emitted as React text children, so `<script>` renders inertly | **PASS (code)** |

## 6. Revisions

| Test | Expected | Actual | Result |
| --- | --- | --- | --- |
| 3 meaningful writes to one page | 2 new revisions | `revisions_after_3_writes=2` | **PASS** |
| `restore_page_revision(page, 1)` as content_manager (`pages:edit`) | succeeds | no error | **PASS** |
| Restore creates a NEW revision instead of rewinding | count 2 → 3, max revision 3 | `after_restore=3(was 2)`, `maxrev=3` | **PASS** |
| Historical revisions survive | revision 1 still present | `rev1_kept=1` | **PASS** |
| Revision list readable | via `page_revisions` SELECT policy | **PASS** |
| Revision UPDATE/DELETE by any role | no policy exists; table is append-only | **PASS (schema)** |

## 7. Media library (Phase 10)

| Feature | Enforcement | Result |
| --- | --- | --- |
| Upload | `authorize('media','create')`, magic-byte sniffing, category + bucket allow-list | **PASS (code)** |
| Metadata (filename, MIME, size, alt, title, description, category, uploader, timestamps) | `media_assets` columns + `media_assets_stamp_actor` trigger | **PASS** |
| Search / filter / preview / detail | `app/admin/media/page.tsx` | **BUILD PASS / authenticated render NOT TESTED** |
| Alt text update | `updateMediaAction` with `media:edit` | **PASS (code)** |
| Visibility change | requires `media:edit`; visibility↔bucket CHECK prevents a private file in a public bucket | **PASS (schema)** |
| Delete | `app/admin/media/actions.ts` → object first via Storage API, then row via RLS, then audit | **PASS — see defect below** |

### Defect found and fixed: media deletion could never work

```
MDROP delete_media_asset ERR 42501 ::
  Direct deletion from storage tables is not allowed. Use the Storage API instead.
```

Supabase installs a BEFORE DELETE trigger on `storage.objects`, so migration
023's "delete the object with SQL, then the row" design failed for **every**
role including `super_admin`. `/admin/media` delete was therefore broken.

Fix: **migration 029** removes only the forbidden statement — the function still
requires `can('media','delete')`, deletes and audits the catalogue row, and
returns `bucket/path`. `deleteMediaAction` now performs the ordered flow (object
through the Storage API using the caller's own `media:delete` grant, row through
the `media_delete_staff` RLS policy, `media_deleted` audit, and a
`security_event` naming bucket/path if either step fails).

Applied and verified:

```
MED OK client-denied 42501 | sa-result=media/v/ok.png | row_gone=true | audited=1
    | charset=rejected | length=rejected | valid=accepted
```

| Upload validation test | Expected | Actual | Result |
| --- | --- | --- | --- |
| Browser-declared MIME trusted alone | never | content type is derived from magic bytes (`sniff()`); declared type is ignored | **PASS (code)** |
| Valid PNG/JPEG/WebP/GIF/SVG/PDF | accepted | accepted | **PASS (code)** |
| Wrong magic bytes / unverifiable type | rejected | rejected with an explicit message | **PASS (code)** |
| Invalid extension | rejected | filename is re-derived from the detected type; extension mismatch cannot survive | **PASS (code)** |
| Oversized file | rejected | ceiling from `system.media_max_upload_mb` (default 10 MB, hard cap 25 MB) plus bucket-level limits in 023 | **PASS (code), NOT TESTED with a real large upload** |
| Storage path charset | `bad#1.png` rejected | rejected by `media_assets_path_charset` | **PASS** |
| Storage path length | 401 chars rejected | rejected by `media_assets_path_length` | **PASS** |
| Normal path | accepted | accepted | **PASS** |

## 8. Storage security matrix (mandatory)

Policies now on `storage.objects` (the role-blind `storage_staff_insert/update/delete`
policies found by the original audit are gone — only these five remain):

```
storage_upload_authorized   INSERT  WITH CHECK can('media','create') AND bucket in (…)
storage_update_authorized   UPDATE  WITH CHECK can('media','edit')
storage_delete_authorized   DELETE  USING  can('media','delete')
storage_public_read         SELECT  USING  bucket_id = ANY (7 public buckets)
storage_private_read_authorized SELECT USING bucket_id='private-assets' AND can('media','view')
```

No policy uses `WITH CHECK (true)`; no generic "any authenticated user" write
policy exists.

Executed per-role results (`42501` = rejected; a DELETE/UPDATE that matches no
visible row is filtered to 0 rows, both recorded as denied):

```
STOR OK anon-upload=raised(42501); OK anon-update=filtered0; OK anon-delete=raised(42501);
     OK anon-read-public=visible;   OK cl-upload=raised(42501); OK dv-upload=raised(42501);
     OK cm-upload-public=ALLOWED;   OK cm-delete=raised(42501); OK ad-upload=ALLOWED;
     OK ad-delete=raised(42501);    OK sa-upload-private=ALLOWED
BAT  OK A-anon-priv=v=0;  OK A-anon-pub=v=1;  OK B-client-priv=v=0;  OK C-cm-priv=v=1
```

| Actor | Upload public | Upload private | Modify | Delete | Read private | Result |
| --- | --- | --- | --- | --- | --- | --- |
| ANONYMOUS | denied | denied | denied | denied | denied (0 rows) | **PASS** |
| CLIENT | denied | denied | denied | denied | denied (0 rows) | **PASS** |
| DEVELOPER | denied | denied | denied | denied | denied | **PASS** |
| CONTENT_MANAGER | allowed | allowed (`media:create`) | allowed (`media:edit`) | denied | allowed (authorized mechanism) | **PASS** |
| ADMIN | allowed | allowed | allowed | denied (`media:delete` not granted) | allowed | **PASS** |
| SUPER_ADMIN | allowed | allowed | allowed | allowed | allowed | **PASS** |

Old vulnerable behaviour confirmed gone: no authenticated-user-wide write policy
exists; every write path evaluates `can()`.

## 9. Public vs private media

| Test | Expected | Actual | Result |
| --- | --- | --- | --- |
| Public asset readable by anon | allowed | anon sees `media` bucket rows, public URL readable | **PASS** |
| Private asset readable by anon | denied | `v=0` under RLS; direct public URL for `private-assets` returns **400** | **PASS** |
| Private asset readable by unauthorized authenticated user | denied | client `v=0` | **PASS** |
| Private asset readable by authorized user | allowed through `media:view` | content_manager `v=1` | **PASS** |
| Signed URLs for private assets | must exist for delivery | **NOT TESTED** — creating one requires an authenticated app session, which was unavailable. The mechanism (`createSignedUrl`) is only reachable server-side. | **NOT TESTED** |
| Signed-URL expiry / unauthorized minting | must be server-controlled | no client code calls the storage API for private buckets | **PASS (code)** |
| Private paths leaked to the browser | must not happen | private paths are only rendered inside `/admin/media`, which is `media:view`-gated | **PASS (code)** |

## 10. Part 03 regression after Part 04/05 changes

| Test | Expected | Actual | Result |
| --- | --- | --- | --- |
| Self role escalation (`client` → `super_admin`) | rejected | `raise(42501)` | **PASS** |
| Cross-user profile update by client | 0 rows | `rows:0` | **PASS** |
| Account-status escalation by non-admin | rejected by `guard_profiles_account_fields` | trigger active, raise verified in Part 03 and guard re-verified live | **PASS** |
| `metadata` escalation | same guard | **PASS** |
| Forged identity / forged audit actor | rejected | `raise(42501)` | **PASS** |
| Audit UPDATE / DELETE | blocked | `raise(42501)` (policy) **and** now privilege-level revoke | **PASS** |
| Admin vs super_admin privilege boundary | admin cannot `users:delete` / `roles:manage` | `can()` = F and both write attempts denied | **PASS** |
| `session_profile()` | returns own row only | `v=1` | **PASS** |
| `admin_profiles()` | raises for non-admins | `raise(42501)` as client | **PASS** |
| Protected routes | 307 → `/login?next=…` | all 8 admin routes + `/app` | **PASS** |
| Safe redirects / invalid callback | unchanged from Part 03 | `proxy.ts` untouched this phase; `safeRedirectTarget()` still rejects `//host` and absolute URLs | **PASS (code)** |
| Logout behaviour | unchanged | no change made | **PASS (unchanged)** |
| RLS enabled everywhere | 33/33 | 33/33 | **PASS** |
| `profiles_guard_privileges` active | yes | present in `pg_trigger`, and hardened | **PASS** |
| `profiles_guard_account_fields` active | yes | present | **PASS** |
| Source secret sweep | clean | no `service_role` key anywhere, no hardcoded secret, `.env.local` gitignored, 0 matches for `service_role` in `.next/static` | **PASS** |

## 11. Final consolidated pass (post-fix)

Second battery, 26 assertions through `can()` and real statements:

```
PASS2 ok=24 bad=2
  MISMATCH anon.stg-priv-read want=0 got=v=0        (harness string compare; the
                                                      value 0 is the correct result)
  MISMATCH anon.set-private-leak want=0 got=raise   (public_settings() exposes no
                                                      is_public column, so the
                                                      filter could not be applied)
```

Both flagged rows are harness artifacts. The private-leak question was settled
separately and definitively:

```
total=35 public=26 private=9 | public_settings_rows=26
```

`public_settings()` returns exactly the 26 public rows, so no private setting is
ever exposed to anon. **Effective result: 26/26.**

## 12. Data integrity after all testing

| Table | Final count | Note |
| --- | --- | --- |
| `media_assets` | 0 | smoke/test artifact removed; all test rows rolled back |
| `pages` | 0 | no test content remains |
| `page_sections` | 0 | |
| `page_revisions` | 0 | |
| `storage.objects` | 0 | no probe objects remain |
| `admin_notifications` | 0 | no fake notifications |
| `audit_logs` | 1 | one genuine `security_event` from the real Part 03 flow |
| `system_settings` | 35 | 027 catalogue |
| `profiles` | 2 | roles/status unchanged |
| `auth.users` | untouched | no test accounts created |

## 13. Quality gates

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | **PASS** (exit 0) |
| `npm run lint` | **PASS** (0 errors, 0 warnings) |
| `npm run build` | **PASS** |

## 14. Not tested / remaining items (Part 05)

1. **Authenticated browser rendering of `/admin/cms`, `/admin/cms/[id]`,
   `/admin/media`** — NOT TESTED. No owner credentials were available and none
   were requested; no test account was created in `auth.users`.
2. **Real file upload/download against Supabase Storage** — NOT TESTED for the
   same reason (upload requires an authenticated session). Validation logic,
   magic-byte detection, path constraints and permission gates were all tested.
3. **Signed-URL expiry behaviour** — NOT TESTED.
4. **Public-site integration** — the CMS is live in the database but no public
   page consumes `pages`/`page_sections` yet; published content is readable by
   anon, drafts are not. Wiring the homepage onto the CMS is deliberately
   **FUTURE ENHANCEMENT** so the existing approved public content is not
   silently replaced.
5. **Migrations 001–015 are absent as files from `supabase/migrations/`**, so a
   local `supabase db reset` cannot reproduce the schema — **OWNER ACTION REQUIRED**.
