# Migration 016 — APPLIED and VERIFIED (Part 03 STEP 1–2)

Date: 2026-10-05 · project `yparzhgzhpwewyrjhqud` · file: `supabase/migrations/016_profiles_role_escalation_guard.sql`
Authorization: owner explicitly authorized application of **016 only** ("Migration 016 is additive security DDL and was explicitly authorized for application. Apply ONLY migration 016 at this stage.").

## Pre-apply state (captured read-only, immediately before DDL)

```
profiles rows : 2  ->  886bf52b… role=admin   orgcol=admin
                    2b006679… role=staff   orgcol=admin
profiles policies (4):
  profiles_admin_delete  [DELETE/public]        USING (is_admin())
  profiles_admin_insert  [INSERT/public]        WITH CHECK (is_admin())
  profiles_select_own    [SELECT/public]        USING (auth.uid() = id OR is_admin())
  profiles_update        [UPDATE/public]        USING      (auth.uid() = id OR is_admin())
                                                  WITH CHECK (auth.uid() = id OR is_admin())   <-- VULNERABLE
```
No automated backup exists (FREE plan, dashboard `LAST BACKUP — No backups`); `pg_dump` is unavailable (no local credentials). The closest honest substitute was this pre-apply state capture plus the fully commented rollback block inside the migration file. **No backup was claimed.**

## Post-apply state (read from live catalog)

```
profiles policies (5):
  profiles_admin_delete   [DELETE/public]         -- unchanged
  profiles_admin_insert   [INSERT/public]         -- unchanged
  profiles_select_own     [SELECT/public]         -- unchanged
  profiles_update_self    [UPDATE/authenticated]
      USING      (auth.uid() = id)
      WITH CHECK (auth.uid() = id AND NOT (role IS DISTINCT FROM session_user_role()))
  profiles_update_admin   [UPDATE/authenticated]
      USING (is_admin())  WITH CHECK (true)
  (profiles_update — the vulnerable policy — no longer exists)

triggers on profiles:
  profiles_guard_privileges -> guard_profiles_privileges()  enabled = O
  set_profiles_updated_at   -> set_updated_at()             enabled = O   (pre-existing, untouched)

new functions:
  session_user_role()          SECURITY DEFINER = true, search_path = public
  guard_profiles_privileges()  SECURITY DEFINER = true, search_path = public

data: role counts unchanged -> admin=1, staff=1 ; stray "xeltrio technologies Org" untouched ('admin' in both rows)
```

Checklist from the instruction: no data deleted ✓ · no existing user record modified ✓ · no RLS removed (profiles went 4 → 5 policies; SELECT/INSERT/DELETE byte-identical) ✓ · `profiles.role` protected at the database layer ✓ · existing admin and staff intact ✓ · stray column preserved ✓.

## Attack tests — executed as real database operations

Each test ran inside `begin; … rollback;` with `set local role` + `set local request.jwt.claims`, so the attempt was genuinely evaluated by RLS and the trigger, and nothing persisted. Post-test row check confirmed `admin=1, staff=1`.

| # | Test (as an authenticated non-super user) | Expected | **Actual** |
|---|---|---|---|
| T1 | `staff` → `UPDATE profiles SET role='super_admin' WHERE id = auth.uid()` | REJECTED | **REJECTED** — `ERROR 42501: role changes require administrator privileges`, `CONTEXT: PL/pgSQL function guard_profiles_privileges()` |
| T2 | `admin` → `UPDATE profiles SET role='super_admin' WHERE id = auth.uid()` (§15 self-promotion) | REJECTED | **REJECTED** — `ERROR 42501: only a super admin may grant or revoke the super_admin role`, same function |

Both rejections came from the **trigger**, which is the deeper layer; the new `WITH CHECK` on `profiles_update_self` independently blocks the same write, so the path is closed twice rather than by a single check.

## Still untested (needs real credentials/session, not catalog access)

- T3 `staff` → edit **another** user's role → expected rejected by `profiles_update_self` USING + trigger.
- T4 `staff` → update own `full_name` → expected **allowed** (positive control; confirms the fix did not break legitimate self-editing).
- T5 `admin` → change a third user's non-privileged fields → expected allowed via `profiles_update_admin`.
- T6 `anon` → any UPDATE → expected rejected.

T3–T6 are listed in the migration file's verification block. T4 matters most operationally: it proves ordinary profile editing still works for real users.

## STEP 3 onward — NOT STARTED, with the blocking reason

`@supabase/ssr` is not yet installed and **no `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` values exist in this environment** (no `.env*` file, and none were provided). Login, logout, password reset, session refresh, `/admin` and `/app` protection could not be implemented and tested against real credentials, so no auth code was written rather than shipping unverifiable security. The instruction "do not invent placeholder production credentials" was respected.

Also untouched, per instruction: `products.category_id` (assignment is an owner/content decision), legal placeholder content, migrations `017`/`018` (RBAC tables and `audit_logs`) — none created, so no empty/fake migrations exist.

## Mutations in this record

Applied: migration **016 only** (2 functions, 1 trigger, 2 policies replacing 1 policy). Data changes: **0** (both attack UPDATEs were rejected by the database and every test transaction was rolled back; row counts and role distribution verified identical after). Tables: **23** unchanged. Policies: 92 → **93** (+1 net on `profiles`). Functions: 4 → **6**. Triggers: 21 → **22**.
