# QWIKFIX Lane — Runbook

Minor-fix lane for iPhone-initiated pushes to `main`.

## Policy (updated 2026-07-13)

- **Slots: UNLIMITED.** The former 3/day cap was removed by Christian on
  2026-07-13. There is no numeric limit on QWIKFIX pushes per day.
- **Scope: minor fixes only.** UI tweaks, small logic corrections, copy
  changes, constant updates. Anything structural, session-screen-state
  altering, or multi-file goes to the laptop/Cowork queue.
- **Gates (all still mandatory, per change):**
  1. `npm run build` must pass before every push (Netlify fails silently
     on syntax errors).
  2. A1 smoke test per `SMOKE_TEST.md §5` — report format in commit
     message and reply; BLOCK on FAIL.
  3. Never deploy during an active workout session.
  4. Verify live deploy on fresh app open or second device — never by
     refreshing an active session tab.
- **Classification:** every change labeled "feature" or "bug fix" in the
  reply header. Features still count against the separate 4/day feature
  cap (A2); bug fixes are exempt.

## GUARD-SW invariant

The service worker is fully disabled (`disable:true` + `selfDestroying:true`
in vite-plugin-pwa config). QWIKFIX lane safety depends on this: no stale
SW cache means every fresh app open serves the latest deploy. **Any commit
that re-enables VitePWA must update this file in the same commit and
suspend the QWIKFIX lane** until cache-busting behavior is re-verified.

## PAT policy (2026-07-09)

≤7-day expiry PATs, reused for all pushes until expiry. After each push:
scrub PAT from git remote URL and shell history only. Never advise
revocation.
