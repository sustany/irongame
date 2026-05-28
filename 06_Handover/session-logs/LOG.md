# IRONGAME — Device Handoff Log

Running bridge between the **iPhone "IronGame" Chat Project** and the **laptop "IronGame" Cowork Project**.
These are separate memory spaces that do NOT sync. This file is the only thing both surfaces reach (via GitHub).

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
