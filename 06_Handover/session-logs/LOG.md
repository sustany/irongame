# IRONGAME — Device Handoff Log

Running bridge between the **iPhone "IronGame" Chat Project** and the **laptop "IronGame" Cowork Project**.
These are separate memory spaces that do NOT sync. This file is the only thing both surfaces reach (via GitHub).

---

## 2026-07-12 (3) — iPhone Chat — QWIKFIX — OPEN

**Shipped (QWIKFIX: bar weight constants):** Olympic bar = 44 lbs (20 kg,
Christian-confirmed), Life Fitness Smith bar = 20 lbs. New EQUIPMENT.barWt
field drives snapWt base, suggestW empty-bar default, plateBreakdown bar
subtraction, and load-card labels. Nominal-vs-actual note: 225 nominal over
a 44 bar breaks down 4x(45)=224 actual; greedy drops the 0.5/side remainder.
Classification: bug fix (cap-exempt). QWIKFIX 3/3 — LANE CAP REACHED today.

**B-SNAP1 — RESOLVED 2026-07-12 by decision, no code change:**
Christian reviewed interactive mockup (Option A vs B) and chose
**Option A: keep ±5/±10/±25 on bilateral equipment.** Phantom weights
(2.5-lb-per-side remainders, unloadable — no 2.5 plates) are ACCEPTED
behavior. Plate display shows the loadable portion; number may exceed
plates+bar by 5 on odd snap steps. Do NOT re-raise or "fix" this —
decision is Christian's, on the record. Optional future enhancement
(NOT approved, ask first): small "+2.5/side" remainder tag when a
phantom weight is displayed.

**Rollback:** revert this commit.

---

## 2026-07-12 (2) — iPhone Chat — QWIKFIX — OPEN

**Shipped (QWIKFIX: F-PLATES1, commit 617e1a7):** Absolute plate loadout
display, TOTAL counts, stacked "Nx (P)" lines left of weight number for
all showPlates equipment. Replaces delta ADD/RMV per-side chips (removed,
same root cause). Denominations 45/25/10/5. Per-side greedy then x2 —
loadability guaranteed. Bar-only load shows no chips.
Classification: feature (cap 1/4). QWIKFIX 2/3 today.

**OPEN QUESTION for Christian:** Olympic bar 44 (20 kg) vs app's existing
45 constant — implemented against 45 for snap-math consistency. If gym
bars are 20 kg, follow-up commit changes bar constant + label + snap base.

**Rollback:** revert 617e1a7.

---

## 2026-07-12 — iPhone Chat — QWIKFIX — OPEN

**Shipped (QWIKFIX: F-LASTW1):** Set 1 of every exercise now defaults to
the weight the user opened that exercise with in their LAST session.
New persistent `ig_openwt` map (localStorage + IDB mirror, PERSIST1
pattern). Written on each exercise's set-1 log in doLog; read in
suggestW si===0 branch. Survives session complete / reset / Start Fresh.
Fallback with no history: prior behavior (45 bar / 0 unloaded).
Classification: bug fix (cap-exempt). QWIKFIX slot 1/3 today.

**Known residual:** keyed by exercise name — pending Hammer Strength
canonical rename will orphan those keys (silent fallback, non-breaking).
Resolves with BUG-001 Step 6b id-migration; laptop should fold ig_openwt
into that migration scope.

**Rollback:** revert this commit; optionally clear ig_openwt key.

---

## 2026-07-07 — iPhone Chat — OPEN

**Shipped (commit ca863db, deployed):** 29 missing pull/posterior-chain
exercises added to exerciseLibrary.js (165 entries total) + new optional
`grips` schema field on 17 entries. Grip decision LOCKED: grip is a
separate selectable field, annotation-only — PRs stay keyed to canonical;
no localStorage migration needed. FEAT-001 partially pulled forward
(grip metadata done; hand-position pending).

**Weighted/assisted pull-up & chin-up:** intentionally NOT new entries —
handled by existing BW ± added-load logging (§1e).

**LAPTOP TODO (Commit 2 — feature, A1 gate applies):**
Grip chip selector in Change Exercise picker + logged-set grip annotation
in AgentTrainer.jsx. Full SMOKE_TEST.md §5 walk required. Bundle with
Step 6b/7 laptop session.

---

**How it works**
1. iPhone composes a handoff as plain text and Claude commits it here (newest entry on top).
2. Laptop Cowork session opens by reading the top OPEN entry, then works from it.
3. Mark an entry RESOLVED (with date) once the laptop session ships the fix.

**Entry template** (copy this block, fill, place above the most recent entry):

```
## YYYY-MM-DD — short title
**From:** iPhone Chat / laptop Cowork    **To:** laptop Cowork / iPhone Chat
**Payload:**
- what was observed / decided
**Artifacts:** screenshot filenames or commit hashes (images stay in the originating chat)
**Open questions:**
- unresolved decisions for the receiving session
**Session opens with:** "exact opener line"
**Status:** OPEN
```

---

## 2026-07-04 — iPhone session #3: Jun 13 items shipped
**From:** iPhone Chat    **To:** laptop Cowork
**Payload:**
- Audit: header back arrow (phase-aware) + log-phase Back already live; search box subsumed by BUG-001 (done); safe-area insets present at 4 sites. Remaining gaps shipped:
- Bug fix (cap-exempt): ← Back on barbellCheck screen — wrong session type no longer traps user.
- Feature 2/4: bw-load equipment type. Hyperextensions 45° logs added load (±5/10/25, plate badges ADD TOTAL, snap-5, suggestW progression off 90 lb PR). Dead Hang / Captain's Chair remain pure bodyweight. +New form gains BW + Load chip. exerciseDB.js updated same commit.
- Jun 13 queue now CLOSED.
**Artifacts:** commits this session (git log 2026-07-04)
**Open questions:**
- On-device verify §1e on Hyperextensions during today's session (Step-7-style check).
- Complete screen intentionally has no back (terminal). Confirm acceptable.
**Session opens with:** "BUG-001 Step 6b — id-key migration of INIT_PRS/META/TMPLS + persisted prs/ig_session migration; fold into Supabase schema work."
**Status:** RESOLVED (Jun 13 closed)


## 2026-07-04 — iPhone session #5: equipment-metadata fix; design decisions deferred
**From:** iPhone Chat    **To:** laptop Cowork
**Payload:**
- Jun 2 queue audit: DUP1, DUP2, PERSIST1, rep-logging BACK, End Session confirm ALL confirmed shipped. F-MUSIC1/F-WARM1 obsolete (features removed). Queue closed.
- Bug fix (cap-exempt): equipment metadata integrity — picker swap now records equip/prPts/compound to userMeta for non-META picks (cable/machine→stack-pin); userMeta persisted in ig_session snapshot + IDB rehydrate (backward compatible with old snapshots).
- DECISION (Christian): homescreen redesign's two open decisions (muscle-button icon treatment, time-toggle default) DEFERRED — Claude picks provisional defaults when the redesign build starts; Christian reviews later.
**Open questions:**
- REPS-COMPLETED removal + SET x/xx still pending Christian's three answers (Jun 2 queue item 4).
**Session opens with:** "Homescreen redesign build — apply provisional defaults, or BUG-001 Step 6b if Supabase work starts."
**Status:** RESOLVED

## 2026-07-04 — iPhone session #4: BUG-001 Step 6a shipped
**From:** iPhone Chat    **To:** laptop Cowork
**Payload:**
- Step 6a consolidation shipped: 9 duplicate generic entries merged into runtime records (aliases absorbed), Chin-Up alias collision fixed, DB 146→137. Data-only, build PASS, acceptance green.
- Step 6b DEFERRED to laptop by risk call: id-key migration touches live localStorage prs/ig_session — needs on-device testing; recommend folding into Supabase schema (locked v1.0 backend) rather than doing a throwaway localStorage migration.
- BUG-001 functionally complete pending Step 7 on-device picker smoke during today's session.
**Session opens with:** "BUG-001 Step 6b/7 review, then homescreen redesign prerequisites (icon treatment + toggle default decisions)."
**Status:** OPEN (6b + 7)

## 2026-07-04 — iPhone session #2: BUG-001 Steps 1–4 SHIPPED (exception extended)
**From:** iPhone Chat    **To:** laptop Cowork
**Payload:**
- Step 1 diagnosis: root cause = dual name-space split. Runtime data (INIT_PRS/META/TMPLS, 33 exercises, personal names) vs. search (EXERCISE_LIBRARY, 136 generic canonicals). 10 runtime names had no library entry; selecting a library canonical severed progression/PR/scoring lookups.
- Steps 2–4 shipped as `src/exerciseDB.js` (commit `a4f25aa`): id-keyed schema, 146-entry seeded master DB (all 33 runtime keys resolvable exactly, 0 missing), ig_exdb_v1 localStorage overlay for custom exercises + aliases, searchMaster() with 7-group GROUP_FILTERS aligned to the locked homescreen redesign. NOT imported by AgentTrainer yet — zero UI impact. Build PASS.
- Acceptance: 'seated plate-loaded incline' → LF Incline Press; CHEST browse = 23; 0 muscle orphans.
**Artifacts:** commits `a4f25aa` (module), Step 1 findings in this entry
**Open questions:**
- Step 5 DONE same session (commit `03d1...` see git log): picker + suggestions + EX_PRIMARY wired to master DB, isolated session-screen commit, code-level §5 GO, build PASS. On-device visual verify pending (Step 7).
- Step 6 (laptop): migrate INIT_PRS/META/TMPLS lookups to id keys; consolidate duplicate-ish pairs (e.g., LF Incline Press vs Incline Machine Press).
- Step 7 (laptop): on-device §5 smoke of picker states.
- FEAT-001 grip metadata: schema now exists to attach to (add fields to exerciseDB records).
**Session opens with:** "BUG-001 Step 6 — migrate INIT_PRS/META/TMPLS to id keys + consolidate duplicate pairs; then Step 7 on-device §3 smoke."
**Status:** OPEN (Steps 5–7 pending laptop)

## 2026-07-04 — iPhone session: Jun 18 bug-fix sweep CLOSED (rule exception approved)
**From:** iPhone Chat    **To:** laptop Cowork
**Payload:**
- Christian approved a narrow exception to the iPhone observation-only rule for the three Jun 18 text-deletion bug fixes.
- Audit of main found most items already shipped (commit `2801071`): IronQuest/Iron Quant label = zero matches; warm-up UI/logic gone; YouTube URL input + player gone.
- Remaining residue removed this session: unused `MUSCLE_GROUPS` + `WARMUP_MOVES` exports in exerciseLibrary.js (56 lines). Commit `eeff750`. npm run build PASS. §5 report: no session-screen file touched, §3 PASS, GO.
- Still present by design: hardcoded playlist with external YouTube deep-links (Peloton pattern, no embedded player). Scope call pending if full music removal wanted pre-Spotify v1.1.
**Artifacts:** commit `eeff750`
**Open questions:** none
- UPDATE same session: Christian ordered full playlist removal. Commit `2915983` removes DEFAULT_PLAYLIST, music state/helpers, session-screen music bar, ig_playlist persistence (-111 lines, -3KB). SMOKE_TEST.md music-widget items removed same commit (shared root cause). Build PASS, full §5 walk GO. Music returns as Spotify App Remote SDK in v1.1. Classified: feature 1/4 today.
**Session opens with:** "Confirm 2915983 live on iron-q.netlify.app, then start BUG-001 Step 1."
**Status:** RESOLVED (Jun 18 items closed + music removed)

## 2026-06-02 — iPhone session: header/brand build-out shipped LIVE + bug analyses + queue
**From:** iPhone Chat (live in-gym app test, LEGS day Jun 2)    **To:** laptop Cowork
**Live URL CHANGED:** app now at **https://iron-q.netlify.app** (was gleaming-unicorn-62a4bb…). HEAD = `2777f5e`. All commits below built clean (`npm run build`) and passed SMOKE §5 (header/setup = no session-screen render items; the one session-screen touch (reload confirm) was additive only).

### A. SHIPPED LIVE today (verify on iron-q.netlify.app)
Locked decisions: app name **IronQ** (on-screen wordmark **IRONQ** = IRON red + Q white; icon label + browser title = **IRON Q**). Tagline **SCIENCE + AI = RESULTS** (locked). Header now: IRONQ + ☰ placeholder · red rule directly beneath · tagline left + date right.

| Commit | Change |
|---|---|
| `c947197` | NAME1 wordmark: IRON GAME → **IRONQ** on screen (IRON red, Q white) |
| `b2d3914` | NAME1 PWA naming: IRON QUANT → **IRON Q** in apple-mobile-web-app-title, `<title>`, manifest name/short_name |
| `9b332b0` | Tagline: "AI Workout Coach" → **SCIENCE + AI = RESULTS** |
| `b06e140` | Header: date block → **placeholder hamburger ☰** (no action wired); date moved to leave-by card label |
| `1c34844` | Header: **always-on date line** above red rule (both modes); removed duplicate date label from leave-by card |
| `2744a4f` | Header: removed **"TARGET: 100 PTS"** text only (100-pt scoring logic intact) |
| `9663abf` | Header: **date right-aligned** onto tagline row; **red rule moved up** under IRONQ (gap → 2px) |
| `3614757` | Setup: removed **"Training Format"** label text (TC/Flexible selector logic intact) |
| `3e0630b` | Header: **date color → amber/gold `#eab308`** (distinct from gray tagline) |
| `2777f5e` | **Reload confirm()** guard on BOTH TAP TO RELOAD buttons (F-CONFIRM1). In-session copy warns session loss. §7 bundling justified (one root cause). |

NAME1 status: wordmark + PWA naming + tagline done. **Still leftover:** session export / email subject lines say "Iron Quant" (AgentTrainer L1731, L1769) and internal comment headers / LOG title say IRONGAME — sweep to IronQ on the next pass.

### B. QUEUED — build next (priority order)
1. **PERSIST1 — localStorage bridge. TOP PRIORITY / blocking-grade.** App has NO session persistence (in-memory only). Worse than first thought: PWA uses `registerType:'autoUpdate'` + `skipWaiting` + `clientsClaim` + a `controllerchange` listener (AgentTrainer L742-748) that **force-reloads the running app the moment a new SW activates**. So ANY deploy mid-session auto-reloads and wipes the in-progress log — no tap required. **Do not deploy during an active session until this lands.** Fix = serialize `log`/`prs`/`sesType`/`exList`/`exIdx`/`setIdx`/`sessionStart` to localStorage + rehydrate via a "Resume session?" prompt (avoids gotcha #13). Pattern already proven in-file by the playlist (`ig_playlist`, L715/784). ~30 min.
2. **DUP1 — leg-curl false-positive duplicate. [BUG, cap-exempt] ~10-15 min.** ROOT CAUSE: `src/exerciseLibrary.js` `NOISE` regex (L238) strips STANCE words `seated|lying|standing|prone|kneeling`. So normalize("Lying Leg Curl") = normalize("Seated Leg Curl") = "leg curl" → `findDuplicate` scores 1.0 → false "Already in your list: Seated Leg Curl." User picked **Lying Leg Curl** (real library entry L137), got **Seated Leg Curl** (existing, 285×8). Affects all stance pairs (leg curls, calf raises, presses). FIX: remove the stance words from NOISE (keep equipment/brand noise: machine, pl, bb, db, cable, smith, hs, lf, nautilus, articles). Verify "DB Curl"≈"Dumbbell Curl" still matches. Note: Lying Leg Curl will enter as a NEW exercise (only in library, not progression DB) — +New form collects starting weight, expected.
3. **DUP2 — "ADD ANYWAY" loop. [BUG] ~10 min.** The duplicate-warning's ADD ANYWAY button (AgentTrainer L2568) only does `setNewExDuplicate(null)`; the next ADD & SELECT re-runs `findDuplicate` (guard `if(!newExDuplicate)`, L2647-2649) and re-blocks → you can never "add anyway," only USE EXISTING (wrong exercise). FIX: make ADD ANYWAY perform the add directly (bypass the re-check). Also note: USE EXISTING (L2552-2560) silently discards the user's entered weight/reps/equip/gymMax — acceptable for a true dup, but DUP1 stops it ambushing false positives.
4. **REPS-COMPLETED removal + SET x/xx. [session-screen, §3/§2] — needs answers.** Remove the "Reps completed" label (AgentTrainer L2145, CSS-uppercased). Add per-exercise set count — data exists (`ex.sets` + `setIdx` → `SET {setIdx+1}/{ex.sets}`). PENDING from Christian: (a) confirm x/xx = current/total sets for THIS exercise (header already shows session-total "SETS x/yy"); (b) "SET" word or bare "2/3"; (c) placement = where REPS COMPLETED sat (under Target) or elsewhere. Ships alone (session-screen) w/ §5 report.
5. **BACK button on rep-logging screen. [session-screen] ~15 min.** Functional BACK before the TAP TO RELOAD section. Logic already exists — header arrow on logging phase does `setPhase("ready")` (L1827-1830). New button just triggers the same. Decision: mirror header arrow (→ pre-set screen) vs go further back (prev set/exercise). Christian leaning mirror. Ships alone w/ §5.
6. **End Session confirm — other half of F-CONFIRM1.** Add confirm() to End Session button (L2425, `setSessionEnd();setScreen("complete")`). Same pattern as reload confirm.
7. **F-MUSIC1** (relayout: remove "Music" label/keep playing indicator, note icon left, artist row1 / title row2 — data already split) and **F-WARM1** (warm-up completion feedback + day-schedule warm-up suggestion) — both need the design-check-in answers from the 2026-06-01 entry before building.

### C. CARRIED from 2026-06-01 entry (still open — see that entry for detail)
Product/strategy: **MON1** (Earn-Back commitment membership) + **MON1-IP**, **LEVEL1**, **LADDER1**, **AUTH1** (=M3), **PRICE1** (Apple physical-goods characterization; verify current 2026 IAP rules), **EQUIP1** (IronQ connected equipment), **DESIGN1** (icon system + "zero chrome words"; blocked on gradient hex codes). **HK1** (laptop folder consolidation → IronQ + new `02_Equipment/`). **Karl Soliman meeting** prep (dependency order: MON1 economics → LADDER1 → LEVEL1 → AUTH1 → PRICE1).

### D. OPEN QUESTIONS pending from Christian
- SET x/xx: per-exercise confirm + "SET" vs bare + placement (item B4).
- DUP fixes: bundle DUP1+DUP2 or DUP1 only (Christian asked; default = both).
- BACK button behavior: mirror arrow vs further-back (B5).
- F-MUSIC1 / F-WARM1 design-check-in answers (06-01 entry).
- Karl meeting length + whether he's product/economics or legal/IP; app-icon gradient hex codes (DESIGN1).

### E. PRACTICES that held this session
Build gate ran on every code push (`npm run build` green before push). SMOKE §5 reported per session-screen-adjacent change. Native `confirm()` chosen as interim for reload (styled-modal upgrade optional later). Pushes were HELD during the live workout because of the auto-reload/no-persistence wipe risk (item B1) — resumed only at end of session.

**Artifacts:** iPhone screenshots remain in originating chat (LEG PRESS / LINEAR HACK SQUAT logging screens; CHANGE EXERCISE 3-screen sequence; header iterations; Netlify + GitHub views; PAT setup; header-layout preview HTML at /mnt/user-data/outputs/ironq-header-layouts.html — not committed).
**Session opens with:** "Read the 2026-06-02 OPEN entry. Ship PERSIST1 FIRST (removes the session-wipe risk), then DUP1+DUP2, then SET x/xx + BACK button + End Session confirm. Hold F-MUSIC1/F-WARM1 for design-check-in answers. Sweep remaining NAME1 leftovers (export/subject 'Iron Quant', comment headers). Then HK1 folder consolidation (confirm names first)."
**Status:** OPEN

---

## 2026-06-01 — iPhone app-test session (PULL day): naming error + app backlog + product/strategy capture
**From:** iPhone Chat (live in-gym app test, ~06:42–08:15 PT)    **To:** laptop Cowork
**Session context:** Log-only app test (not TP, not a project-logged training session). Confirmed product name is **IronQ** (the word "iron" + capital "Q") — NOT "Iron Quant." Pull day. Observed screens: High Row PL (160×12 target), Seated Cable Row (175×8–12), Torso Rotation Machine / Obliques (105×10). HR ~120–130 (aerobic). No source files were modified this session — notes/decisions only, so the build gate was not triggered for this commit.

### A. APP — actionable in `src/AgentTrainer.jsx` (priority order)
1. **NAME1 — Name inconsistent across surfaces. [CORRECTION / cap-exempt] PRIORITY: HIGH.**
   Rename commit `d8da3f9` was incomplete — three-way mismatch at HEAD: (a) in-app wordmark renders **"IRON GAME"** (L1129–30: `<span>IRON</span><span>GAME</span>`); (b) session export + email subject say **"Iron Quant"** (L1731, L1767); (c) `index.html` `<title>` + apple-mobile-web-app-title say **"IRON QUANT"** (L11, L18). None is correct. Fix = unify EVERY user-visible surface → **IronQ**: wordmark spans, export/subject strings, index.html title+meta, `public/manifest*`, internal comment headers, and this LOG's own title line ("IRONGAME — Device Handoff Log"). Gate: visual header check (setup + session screens) + export/email subject.
2. **F-WARM1 — Session warm-up intelligence. [FEATURE — needs design check-in].**
   (a) feedback that detects/confirms the GENERAL (cardio) warm-up is complete; (b) session-level warm-up SUGGESTION driven by the day's full planned exercise schedule. Distinct from the parked "auto-scaled warm-up *prescription*" (load ramp) and from the shipped per-exercise `warmupCue` activation strings. OPEN: completion trigger = auto-detect (HealthKit / iCardio cardio block / in-app timer) vs explicit "warm-up done" tap; suggestion scope = session-level only vs session-level + per-exercise cues (session takes precedence).
3. **F-CONFIRM1 — Confirm popups on End Session + TAP TO RELOAD. [FIX/safeguard — likely cap-exempt] PRIORITY: MED-HIGH.**
   End Session (L~2426) = `setSessionEnd(); setScreen("complete")` on single tap, no confirm. TAP TO RELOAD (in-session build stamp, L~2436) unregisters all SWs + clears all caches + `location.replace` with no confirm — HIGHER RISK: with no session persistence today, an accidental tap wipes the entire in-progress session. Reuse existing `wConf` modal pattern (>50% weight-change confirm). OPEN: styled in-app modal vs interim native `confirm()`; reload copy generic vs explicit "discards in-progress session" warning; reload-confirm permanent vs interim-until-Dexie. NOTE: PERSIST1 below makes the reload non-destructive, downgrading this risk.
4. **F-MUSIC1 — Music player relayout. [FEATURE, cosmetic — needs design check-in].**
   Remove the "Music" label (NB: label is conditional — renders "♪ Playing in YouTube" when playing, L~2305). Add a music-note icon on the LEFT of the player box. Artist on row 1, title on row 2. Data already supports it: `DEFAULT_PLAYLIST` items are `{title, artist, ytId}`; currently concatenated as `artist – title` (L~2320s) → pure render change. OPEN: remove the label line in BOTH states (loses the "Playing in YouTube" feedback) vs keep a playing indicator; note icon static vs animates when playing.
5. **F-SETNUM1 — Show per-exercise set number on the LOG SET button. [FIX/consistency — likely cap-exempt].**
   BEGIN button already renders `Begin Set ${setIdx+1}` / "Begin Warm-Up" (L2168). LOG SET button (L2216) shows only "Log Set — {phr} BPM" with no number. Mirror BEGIN: show set number (`setIdx+1`) and "Log Warm-Up" for warm-up sets. ~1 line. OPEN: format/placement (`LOG SET 3 — 130 BPM` vs after the BPM); confirm warm-up mirror (no number on warm-up sets).

### PERSISTENCE (directive + sequence)
- State of play: session log/state is in-memory only (HANDOFF #1); the PLAYLIST already persists via localStorage (`ig_playlist`, L715/784) — the bridge pattern is already proven in-file.
- **PERSIST1 — DIRECTIVE (Christian, 2026-06-01): after this laptop handoff, implement the interim localStorage bridge** for session state (serialize `log`/`prs`/`sesType`/`exList`/`exIdx`/`setIdx`/`sessionStart`; rehydrate on mount via a "Resume session?" prompt rather than auto-jumping — avoids HANDOFF gotcha #13). ~30 min, low–moderate risk, single commit, clean rip-out when Dexie lands. De-risks F-CONFIRM1 (reload becomes non-destructive).
- **PERSIST2 — Dexie** (documented top priority): core persistence ~3–5 hrs (+migration safety 1–2 hrs); session-history view +3–4 hrs; PR trend chart +2–3 hrs. OPEN: core-only vs bundle history + trend.

### B. PRODUCT / STRATEGY — migrate to `00_Strategy/` (not app-backlog)
- **MON1 — "Earn-Back" commitment-device membership (RESOLVES the M2 earned-reward economics decision).** $20/mo placeholder is a STAKE, not a fee: returned as merch if the training commitment is met; forfeited stakes fund the merch of members who complied (self-funding pool — non-compliant subsidize compliant). Rules: 5 workout days per [cycle]; never miss >2 days in a row; makeup option; 3 strikes = forfeit that period's merch. FLAGS: (1) LEGAL — pooled forfeit-to-winners can trip gaming/sweepstakes/lottery regulation; stickK routes forfeits to charity/anti-charity specifically to avoid this; needs counsel before launch. (2) ECONOMICS/MISSION — margin scales with member FAILURE, in tension with the app's training purpose. OPEN PARAMS: cycle definition; strike triggers (5-day target vs >2-in-a-row vs both); makeup mechanics + window; strike reset (monthly vs rolling); reward value (=$20 vs up-to vs fixed item); forfeit destination (members vs margin vs split). Forwardable summary for John drafted in the originating chat.
- **MON1-IP — IP evaluation of the membership/marketing process.** Honest: a pure marketing/business method is largely unprotectable post-*Alice*. Layered moat instead — trademark/brand (program name e.g. "Earn-Back" + trade dress); trade secret (forfeit-rate/economics calibration, anti-gaming logic, retention algos — via NDA incl. John + devs); patent ONLY if a genuine TECHNICAL element is novel (e.g. a workout-verification method) — narrow, ~$15–30k+, 2–4 yrs; copyright (rule text/copy/code/UI, automatic); REAL moat = network effects (pool quality improves with scale) + brand + execution speed. OPEN: jurisdiction (US only vs international); is any element technically novel; goal (offensive exclusivity vs freedom-to-operate); what stays secret; budget/timeline.
- **LEVEL1 — Level system + gamified display (extends M2).** Cadence: 1 continuous month = level 1, 2 = level 2, etc. Display ALPHANUMERIC, NO raw numbers ("37"); letter+number encoding, "discuss at length to be meaningful." Protect the encoding via trademark/trade-dress + trade-secret algo. OPEN: continuity rule on a forfeit month (reset/freeze/skip — "continuous" implies reset, which may hurt retention); display LEGIBLE (outsider can rank A12 > A2) vs INSIDER/opaque; one code system across all merch vs shirt-specific.
- **LADDER1 — Tiered reward ladder (extends M1/M2).** Higher-value milestone items unlock at higher levels (e.g. L10 = customized prestige water bottle). OPEN: is the MONTHLY earn-back merch a SEPARATE stream from MILESTONE rewards (two reward economies on one $20)? — materially changes the MON1 model.
- **AUTH1 — Authenticity tech decision (= existing M3; lost-and-found = M5, already locked w/ default anonymous in-app relay).** NFT (on-chain; collectible, transferable, public provenance; aligns with the DeFi thesis + DID-chair brand identity) vs signed-ID (centralized, simpler/cheaper; covers all three stated functions — it's mine / verify authentic user / retrieve-if-lost). OPEN for Karl: is on-chain a strategic/brand REQUIREMENT, or is verifiable authenticity the actual goal (→ signed-ID wins on cost).
- **PRICE1 — Pricing + signup path + Apple fee (MON1-related).** Apple IAP + commission (30%, 15% Small Business Program) applies to DIGITAL subscriptions; PHYSICAL goods / real-world services are EXEMPT — so characterizing the membership as a physical-merchandise club may legitimately avoid Apple's cut even for in-app signup; web/external signup is the second lever. NOTE: US external-payment / anti-steering rules shifted materially in 2025 (Epic ruling) — VERIFY current 2026 specifics before quoting numbers to Karl. $20 is a placeholder; cannot finalize until MON1 economics resolved. MEMBER-vs-USER: define the two-tier boundary (free app user vs paying member; is the commitment device members-only; is the app free as a funnel).
- **EQUIP1 — IronQ workout equipment (NEW product category).** Generate visualizations of equipment that improves on existing designs → offer for PREORDER → determine MOQ/breakeven (unit cost vs tooling amortization vs preorder volume). App-CONNECTED machines (auto-log and/or auto-program the user's workout) = the differentiator + the patent hook. IP: hardware is STRONGLY protectable — design patents (~$2k ea, good for "improves on existing designs"), utility patents (if mechanism novel), connected-system patent — the INVERSE of MON1's weak IP. FLAG: this is a hardware-manufacturing pivot (capital, inventory, QC, product-liability, equipment-safety standards) — its own business; preorder is the right de-risker. OPEN: "device for hand cleans" = a HANG-CLEAN machine vs a HYGIENE/hand-cleaning device (ambiguous — clarify); integration depth (log vs program vs both); stage (concept-viz vs have specs/manufacturer).
- **DESIGN1 — Icon / design-system session + "zero chrome words" objective.** Dedicated session to standardize all icons for visual conformity. Foundation exists: Iron Crest icon system (`IconPush`/`IconPull`/`IconLegs` SVGs) + `generate-icons.html`. Claude can produce: a FULL current-labels/words inventory (= the worklist) and a proposed icon list. "Three design directions" = real design work, BLOCKED on Christian's app-icon GRADIENT HEX CODES (he will provide) + the label inventory; entire corporate design flows from the app icon. FLAG: "zero (0) words" is achievable for CHROME labels only; content (exercise names, song artist/title, dates) and numbers resist iconification → realistic target is "zero chrome labels," exercise names the hard exception. OPEN: scope (chrome-only vs also content like exercise/zone names); sequencing (produce the label inventory now vs hold for the gradient-first design session).

### MEETING PREP
- **Karl Soliman — TOMORROW.** Resolve in dependency order: (1) MON1 economics (forfeit destination + reward value) FIRST — four decisions hang off it; (2) LADDER1 two-stream question; (3) LEVEL1 continuity + display; (4) AUTH1 NFT-vs-signed-ID; (5) PRICE1 Apple characterization + member-vs-user; close on the cleanest. Pending from Christian: meeting length; is Karl product/economics or legal/IP. Claude to compile a one-page Karl brief + the John forward once the key questions are answered.

### C. HOUSEKEEPING (laptop-side; DESTRUCTIVE — confirm before exec)
- **HK1 — Folder consolidation + naming congruence.** Stray/duplicate project folders ("Irongame" one-word; possibly "iron face game" — names unconfirmed) are NOT in the git repo and not reachable from the iPhone session — they are laptop/Obsidian-side. At laptop handoff: (1) list them precisely, (2) consolidate under canonical **IronQ**, (3) create a new `02_Equipment/` folder for EQUIP1 (consistent with `00_Strategy` / `06_Handover` numbering). DESTRUCTIVE → confirm exact names + canonical target with Christian before merging/deleting.

**Artifacts:** 4 iPhone screenshots (High Row PL warm-up + reload stamp; Seated Cable Row music-section markup; Torso Rotation LOG SET markup) — images remain in the originating iPhone chat. Commit: this entry's hash.
**Open questions:** consolidated under each item above (NAME1 has none — proceed; design-check-in items F-WARM1/F-MUSIC1 blocked on the listed answers; product items blocked on the Karl meeting).
**Session opens with:** "Read the 2026-06-01 OPEN entry. Confirm canonical name IronQ, then ship NAME1 (cap-exempt, single commit, visual gate). Implement PERSIST1 (localStorage bridge) per Christian's directive. Hold F-WARM1/F-MUSIC1 for the design check-in. Then HK1: list the stray folders and confirm consolidation target before any merge/delete."
**Status:** OPEN

---

## 2026-05-28 — Push test session COMPLETE: post-fix feedback (answers the laptop "Live test" entry below)
**From:** iPhone Chat (live in-gym test)    **To:** laptop Cowork
**Session context:** Push session completed 07:29 AM, ~60 min. iCardio: 1:00:36, avg 108 / max 147 bpm, 62% / 85% MHR, 557 kcal (305 fat kcal), 55/45 fat:carb. This is the post-test feedback responding to the laptop's "Live test session after warm-up weight fix" entry. The warm-up display fix `8666026` is acknowledged — separate from the new findings below (warm-up was not the focus of this test).

### A. APP BACKLOG — actionable in `src/AgentTrainer.jsx` (priority order)
1. **B-CAT1 — Push picker hides DB Flys + Assisted Dips; Pull hides Reverse Pec Deck. [BUG FIX, cap-exempt] PRIORITY: HIGH.**
   Cause: `exListForType` -> `(CATEGORY[type]||[]).filter(n=>prs[n])`. Names in `CATEGORY` lacking an `INIT_PRS` seed (and `META` entry) are silently filtered out. Orphans confirmed: "DB Flys", "Assisted Dips" (CATEGORY.push, no PR/META); "Reverse Pec Deck" (CATEGORY.pull, no PR seed). Fix = add INIT_PRS + META seeds for orphans AND audit all three categories so every name has both. Gate: SMOKE_TEST §3 (Change Exercise).
2. **B-INC1 — 2.5 lb increments unavailable on dumbbell + cable/stack. [BUG FIX, cap-exempt] PRIORITY: HIGH.**
   Same root cause = per-equipment `steps`/increment array. Dumbbell "Military Press, Dumbbells" adjuster = +5/+10/+15 (can't reach 52.5). Cable "Cable Pushdown" = +5/+10/+20 but stack is labeled in 2.5s (42.5/57.5/72.5/87.5). `snapWt` dumbbell branch already rounds to 2.5; blocker is the button increments. Fix once across dumbbell + stack. Gate: SMOKE_TEST §1b + §1c.
3. **Q-PULLEY1 — Logged stack number vs. actual resistance. [INVESTIGATION + data-model decision] PRIORITY: MED.**
   Cable stack photo shows DUAL labels (nominal + second column) = pulley-ratio sign; handle resistance != pinned plate. Decide: store/display the stack SETTING (pinned) or EFFECTIVE resistance (after ratio)? Affects log accuracy + cross-machine comparability. No code until decided.
4. **F-ATT1 — Attachment selection for cable exercises. [FEATURE, counts vs 4/day cap].**
   Multi-attachment cable movements: user picks + app records which (EZ/cambered bar, straight bar, rope, single-arm D-handle, V/parallel grip). Different attachment = different leverage; log as its own dimension. New data field + picker UI.
5. **Warm-up auto-scaling — [FEATURE, parked]** — distinct from `8666026` (which fixed the 0-display). Auto-scaled warm-up *prescription* still needs a design check-in before build.

Suggested first dev session: ship B-CAT1 + B-INC1 (bug fixes, cap-exempt, each ships alone per A3 with its SMOKE_TEST gate), then decide Q-PULLEY1 before starting F-ATT1.

### B. PRODUCT / STRATEGY CAPTURE — migrate to `00_Strategy/` (not app-backlog)
- **MERCHANDISE (brand "IronGame"), premium positioning:**
  - M1 — custom workout towels (bench cover/hygiene), trial-giveaway towel variant, baseball caps.
  - M6 — ruggedized IronGame iPhone case w/ gym features. [research queued: top-selling rugged cases, gym-conducive features, price bands]
  - M2 — gate merch behind in-app level/achievement -> earned status signal + organic gym marketing. Decide gated-purchase vs. earned-reward economics.
  - M3 — authenticity: per-unit NFT + QR/unique ID; scan-to-verify defeats counterfeits. Decide NFT (collectible) vs. signed-ID (authenticity).
  - M5 — QR doubles as lost-and-found: finder scan -> return CTA driven by owner privacy settings (default anonymous in-app relay).
  - M4 — positioning: highest quality, priced ABOVE category, no price-cutting; t-shirt floor ~$99; monogram/spec finish.
- **PROD1 — Coach / B2B IronGame:** trainer account type to track ("lock") client progress + instant client reports. Second product, downstream of consumer alpha + external-user onboarding. [research queued: existing workout-coach apps]
- **F1 / snap-to-log:** photo of gym console/setup -> propose log entry -> ONE-TAP confirm/edit (never auto-commit a misread). Vision model reading field LABELS, not template OCR. Stretch: sequential photos assemble a session. North-star: "club intelligence" (photos -> per-gym equipment -> app adapts). Downstream of persistence + RN port.

### C. SCHEDULED TASK
- **INFRA1 — Server infrastructure scaling assessment. SCHEDULED weekend Sat May 30 / Sun May 31.** Starting stack + scaling 100 -> 1k -> 10k -> 100k+; per-tier cost, personnel/maintenance, outsourcing. Output = basic phased plan. Builds on locked Supabase + Dexie backend.

### D. SET LOG (this session)
- Military Press, Dumbbells — Set 2: **52.5 lb** (actual). App displayed 75; confirm whether 52.5 is per-DB and 75 was total/per-arm so the log reads correctly.
- (No further per-set logging — feedback log-only mode, not TP.)

**Open questions for the laptop session:**
- Q-PULLEY1 resistance model — needs your decision before logging-accuracy work.
- Where should section B live: single `00_Strategy/PRODUCT_IDEAS.md` or split (merch / coach-app / infra)?

**Session opens with:** "IronGame — Push test handoff (2026-05-28). Confirm live app state, then: (1) B-CAT1 category-seed audit + fix, (2) B-INC1 consolidated 2.5 lb increment fix — each ships alone per A3 with SMOKE_TEST gate. Hold F-ATT1 + Q-PULLEY1 for decisions. Migrate section B to 00_Strategy."
**Status:** OPEN

---

## 2026-05-28 — Live test session after warm-up weight fix
**From:** laptop Cowork    **To:** iPhone Chat
**Payload:**
- Pre-test fix shipped: `8666026` — warm-up pre-set now shows working load (e.g. 240 lb for Incline Press) instead of 0. User dials plates down manually from working load. 1-line change, smoke-tested, pushed to main.
- Netlify auto-deploy triggered on push. Hard-reload PWA before starting session.
- Prior session (2026-05-27) context: C0/C1/C2 clutter removals already shipped (`f9f5f60`). Back button live. Warm-up cue (muscle activation text) displays on warm-up pre-set screen. PHR screen clean — no skip link, no "PEAK HEART RATE" label.
- SMOKE_TEST.md is the non-negotiable pre-commit gate for any session-screen change.
- Daily cap (Rule A3): 0 feature changes used today (warm-up fix classified as bug fix, exempt).
**Artifacts:** commit `8666026` (sustany/irongame main)
**Open questions:**
- What session type is today's test (Push / Pull / Legs)?
- Does warm-up pre-set now correctly show working load after deploy?
- Any new regressions observed mid-session? → capture as handoff payload back to laptop.
**Session opens with:** "IronGame — post-fix live test 2026-05-28. Read top OPEN entry in LOG.md (GitHub sustany/irongame), confirm app loaded fresh (hard-reload), then start session."
**Resolution (2026-05-28):** Test completed 07:29 AM (Push). Results captured in the "Push test session COMPLETE" entry above. Open questions answered: session type = Push; no warm-up regressions noted; new findings = B-CAT1, B-INC1, Q-PULLEY1, F-ATT1 (see entry above).
**Status:** RESOLVED 2026-05-28 (test done; feedback in entry above)

## 2026-05-28 — Warm-up set shows working load, not a scaled warm-up
**From:** iPhone Chat    **To:** laptop Cowork
**Payload:**
- On the `+ WARM-UP 1/2` screen for **LF Incline Press**, PLATE LOADED reads **240** and REPS reads **8-10** — i.e. the full working prescription.
- A warm-up set should suggest a *scaled* load (ramped % of the 240 working weight) at higher/easier reps, snapped to available plates (45/25/10/5 — no 2.5s).
- Warm-up structurally exists (the 1/2 counter is present) but isn't scaling load or reps off the working set.
**Artifacts:** IMG_8188 (warm-up 1/2, plate 240), FullSizeRender (annotated: blue box on 240, "WARM UP SUGGESTION"), IMG_8186 (home / Flexible / Push, preview 5ex / 65min / 17sets), IMG_8185 (home / Flexible / no type), IMG_8184 (home / Time Constrained, leave 5:47, 58 min avail). Images remain in the iPhone Chat Project.
**Open questions:**
- Is warm-up load scaling already in `src/AgentTrainer.jsx` and broken, or never wired? Determines bug-fix vs feature -> drives daily-cap classification (A2) and SMOKE_TEST §5 gate (A1).
**Session opens with:** "IronGame — warm-up load suggestion. Confirm live app state, then diff src/AgentTrainer.jsx warm-up prescription logic. Report bug-vs-feature before touching anything."
**Resolution (2026-05-28, laptop Cowork):** NOT a bug — reclassified to FEATURE. The 68% warm-up load ramp was deliberately removed (`suggestW`, AgentTrainer.jsx L401-402: "68% warmup ramp is no longer used — user controls warmup via + Warm-Up toggle"). Current design: warm-up sets are tagged (excluded from volume/PR/scoring, L434-435) but display the working load, reps, and HR; user dials plates down manually. App is in a valid testing state as-is. Feature backlog: optional auto-scaled warm-up prescription (ramp %, easier rep target, lower start-HR, interaction with manual plate control) — requires a design check-in before build.
**Status:** RESOLVED 2026-05-28 (reclassified bug -> feature backlog; app valid for testing)
