# IRONGAME HANDOFF — 2026-05-28 Push Test Session
**From:** iPhone Chat (live in-gym test) → **To:** laptop Cowork
**Mirrors:** top OPEN entry in `06_Handover/session-logs/LOG.md` (GitHub: sustany/irongame, commit 6af53b4)

**Session context:** Push session completed 07:29 AM, ~60 min. iCardio: 1:00:36, avg 108 / max 147 bpm, 62% / 85% MHR, 557 kcal (305 fat kcal), 55/45 fat:carb. The laptop's warm-up display fix `8666026` (warm-up now shows working load, was 0) is acknowledged and separate from the findings below.

---

## A. APP BACKLOG — actionable in `src/AgentTrainer.jsx` (priority order)

1. **B-CAT1 — Push picker hides DB Flys + Assisted Dips; Pull hides Reverse Pec Deck.** [BUG FIX, cap-exempt] PRIORITY: HIGH
   Cause: `exListForType` → `(CATEGORY[type]||[]).filter(n=>prs[n])`. Names in `CATEGORY` lacking an `INIT_PRS` seed (and `META` entry) are silently filtered out. Confirmed orphans: "DB Flys", "Assisted Dips" (CATEGORY.push, no PR/META); "Reverse Pec Deck" (CATEGORY.pull, no PR seed). Fix = add INIT_PRS + META seeds for orphans AND audit all three categories so every name has both. Gate: SMOKE_TEST §3 (Change Exercise).

2. **B-INC1 — 2.5 lb increments unavailable on dumbbell + cable/stack.** [BUG FIX, cap-exempt] PRIORITY: HIGH
   Same root cause = per-equipment `steps`/increment array. Dumbbell "Military Press, Dumbbells" adjuster = +5/+10/+15 (can't reach 52.5). Cable "Cable Pushdown" = +5/+10/+20 but stack is labeled in 2.5s (42.5/57.5/72.5/87.5). `snapWt` dumbbell branch already rounds to 2.5; blocker is the button increments. Fix once across dumbbell + stack. Gate: SMOKE_TEST §1b + §1c.

3. **Q-PULLEY1 — Logged stack number vs. actual resistance.** [INVESTIGATION + data-model decision] PRIORITY: MED
   Cable stack photo shows DUAL labels (nominal + second column) = pulley-ratio sign; handle resistance ≠ pinned plate. Decide: store/display the stack SETTING (pinned) or EFFECTIVE resistance (after ratio)? Affects log accuracy + cross-machine comparability. No code until decided.

4. **F-ATT1 — Attachment selection for cable exercises.** [FEATURE, counts vs 4/day cap]
   Multi-attachment cable movements: user picks + app records which (EZ/cambered bar, straight bar, rope, single-arm D-handle, V/parallel grip). Different attachment = different leverage; log as its own dimension. New data field + picker UI.

5. **Warm-up auto-scaling** — [FEATURE, parked] — distinct from `8666026` (which fixed the 0-display). Auto-scaled warm-up *prescription* still needs a design check-in before build.

**Suggested first dev session:** ship B-CAT1 + B-INC1 (bug fixes, cap-exempt, each ships alone per A3 with its SMOKE_TEST gate), then decide Q-PULLEY1 before starting F-ATT1.

---

## B. PRODUCT / STRATEGY CAPTURE — migrate to `00_Strategy/`

**MERCHANDISE (brand "IronGame"), premium positioning:**
- M1 — custom workout towels (bench cover/hygiene), trial-giveaway towel variant, baseball caps.
- M6 — ruggedized IronGame iPhone case w/ gym features. [research queued: top-selling rugged cases, gym-conducive features, price bands]
- M2 — gate merch behind in-app level/achievement → earned status signal + organic gym marketing. Decide gated-purchase vs. earned-reward economics.
- M3 — authenticity: per-unit NFT + QR/unique ID; scan-to-verify defeats counterfeits. Decide NFT (collectible) vs. signed-ID (authenticity).
- M5 — QR doubles as lost-and-found: finder scan → return CTA driven by owner privacy settings (default anonymous in-app relay).
- M4 — positioning: highest quality, priced ABOVE category, no price-cutting; t-shirt floor ~$99; monogram/spec finish.

**PROD1 — Coach / B2B IronGame:** trainer account type to track ("lock") client progress + instant client reports. Second product, downstream of consumer alpha + external-user onboarding. [research queued: existing workout-coach apps]

**F1 / snap-to-log:** photo of gym console/setup → propose log entry → ONE-TAP confirm/edit (never auto-commit a misread). Vision model reading field LABELS, not template OCR. Stretch: sequential photos assemble a session. North-star: "club intelligence" (photos → per-gym equipment → app adapts). Downstream of persistence + RN port.

---

## C. SCHEDULED TASK
- **INFRA1 — Server infrastructure scaling assessment. SCHEDULED weekend Sat May 30 / Sun May 31.** Starting stack + scaling 100 → 1k → 10k → 100k+; per-tier cost, personnel/maintenance, outsourcing. Output = basic phased plan. Builds on locked Supabase + Dexie backend.

## D. SET LOG (this session)
- Military Press, Dumbbells — Set 2: **52.5 lb** (actual). App displayed 75; confirm whether 52.5 is per-DB and 75 was total/per-arm so the log reads correctly.

## Open questions for the laptop session
- Q-PULLEY1 resistance model — needs a decision before logging-accuracy work.
- Where should section B live: single `00_Strategy/PRODUCT_IDEAS.md` or split (merch / coach-app / infra)?
