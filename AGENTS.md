# Base44 Dev Environment — Mamlakah

## Sandbox backend and credentials
The preview currently uses the local Postgres/PostgREST fallback, not the production Supabase project. The administrator seeded by `000_local_init.sql` signs in at `/MemberLogin` with `admin` / `admin123`; the router has no `/AdminLogin` route. Admin hides the `admin` account from its own member list, so test the withdrawal switch using a separate approved test member.

Local `VITE_SUPABASE_URL` and public anon JWT defaults live in `.env.base44-defaults`. This file is loaded before `/run/base44/app.env`; real Supabase values supplied in the Secrets dashboard must override the defaults. Do not put either variable under Compose `environment`, which would silently override the dashboard. Neither external credential is required to boot with the local fallback. Changing preview defaults does not change Vercel's environment variables.

`BASE44_PREVIEW_MODE` is passed through without hardcoding its value. There are no flag-dependent application overrides in this setup; the local API address and development commands are confined to the sandbox Compose/defaults files. The withdrawal fix is normal application behavior, both with and without the flag.

PostgREST's distroless image has no shell or HTTP probe executable. Its actual database-backed REST response is checked by the proxy healthcheck, which selects `members.can_withdraw`; storage and the live Vite page have their own read-only response checks. A missing withdrawal column therefore fails readiness rather than looking like a healthy wallet backend.

## Production migration requirements
Vercel does not apply SQL migrations. Run `supabase/migrations/005_genealogy_placement.sql` in the SQL Editor of the Supabase project used by Vercel to add `placement_id`. Do not replace placement with `referrer_id`: the sponsor must be preserved.

Run `supabase/migrations/013_member_can_withdraw.sql` in that same project, then `NOTIFY pgrst, 'reload schema';`, before using per-member withdrawal access. Its boolean default preserves existing members' withdrawal access.

## Interaction and cache quirks
- Canvas pointer capture must exclude interactive controls, otherwise it redirects the "Place Here" click to the canvas. Keep filtered tree arrays memoized so timer ticks do not remount nodes during a pointer gesture.
- `useTable` has a session-persisted cache and only refetches on mount unless a caller requests a refresh. Do not use that cached member snapshot as the wallet's live withdrawal permission. `useWithdrawalAccess` reads only the current member's `can_withdraw`, hides controls until access is confirmed, refreshes every five seconds while visible and when focus/visibility returns, and rechecks before submitting.
- The dashboard refreshes its own settings separately from Layout's settings hook, so its MLM guard sees changes while the wallet stays open.
- When withdrawal access is on, the button is clickable even before entering an amount. Minimum amount/balance validation stays in the click handler; a valid request updates the pending state without a full reload.

## Verification
- `curl -sf http://localhost:3000/` must contain `/@vite/client`; the served frontend must be live source, not the tracked `dist` bundle.
- Build without modifying tracked output: `docker compose -f docker-compose.base44.yml exec -T web npm run build -- --outDir /tmp/mamlakah-build`.
- For withdrawal checks, create your own approved test member and adjustment transaction, sign in as the seeded admin through the real login form, toggle off/on, and confirm the saved booleans. Sign in as the test member and verify live off hides the button and amount field, live on restores an enabled button, an invalid amount is rejected, and a valid request persists. Delete only the exact test record ids created by the check; do not change real members' access or balances.
- The withdrawal off/on switch, live wallet refresh, minimum validation, saved pending request, live MLM off/on guard, and mobile wallet passed browser verification against the local fallback on 2026-10-14, including after service recreation. Test records were removed. This is not verification of a Vercel deployment.
