# QWIKFIX Lane — Runbook

Minor-fix lane for iPhone-initiated pushes to `main`.

## Policy (updated 2026-07-13)

- **Slots: UNLIMITED.** The former 3/day cap was removed by Christian on
  2026-07-13. There is no numeric limit on QWIKFIX pushes per day.
- **Scope: minor fixes only.** UI tweaks, small logic corrections, copy
  changes, constant updates. Anything structural, session-screen-state
  altering, or multi-file goes to the laptop/Cowork queue.
- **Gates (all still mandatory, per change):**
  0. **G0 — patch-landed guard.** The edit must be proven to have hit the
     tree before anything else runs. See "G0" below. BLOCK on FAIL.
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

## G0 — patch-landed guard (added 2026-07-29)

**Why this exists.** On 2026-07-29 a Python patch script died on a syntax
error and wrote nothing. It sat on its own line rather than being chained,
so bash carried on and built the *unpatched* source. Build passed. Smoke
passed. The report was indistinguishable from a real success, and the
commit message would have described a change that was not in the diff.

A green smoke report is only evidence about whatever source was on disk.
It says nothing about whether the intended edit landed.

**Three failure modes this closes:**

1. A patch step fails but the next step still runs (newline, not `&&`).
2. A patch step exits 0 having changed nothing — path typo, an `assert`
   that never fired, a replacement string that matched zero times.
3. `npm run build 2>&1 | tail -3` discards npm's exit code through the
   pipe, so a genuine build failure still returns 0 without `pipefail`.

**Required shape for every QWIKFIX edit:**

```bash
set -euo pipefail
python3 /tmp/patch.py
git diff --quiet && { echo "ABORT: patch did not modify the tree"; exit 1; }
npm run build
node smoke.mjs
```

`git diff --quiet` exits 0 when the tree is unchanged and 1 when it is
dirty, so `&& exit 1` aborts precisely when the patch was a no-op.

**Do not** pipe `npm run build` or `node smoke.mjs` through `tail`/`head`
without `set -o pipefail` already in force. Truncate the *output* when
reading it back, never the exit status.

**Run the block under bash, explicitly.** The Cowork sandbox shell is
`dash`, where `set -o pipefail` fails outright with "Illegal option".
Wrap the whole gate sequence in `bash -c '...'` so `pipefail` and
`errexit` actually apply — otherwise the guard silently does nothing.

**Still required inside the patch script itself:** `assert
s.count(old)==1` before every replacement. G0 catches a patch that did
nothing; the assert catches one that did the wrong thing in the wrong
place. They are not substitutes for each other.

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
