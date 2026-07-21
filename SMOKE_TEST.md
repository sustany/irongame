# IronGame Smoke-Test Checklist

**Purpose.** This file defines the minimum set of UI controls that MUST be present on each session-screen state. Before any commit that touches session-screen code lands, every applicable item below must be verified as a code-level inspection (or, when feasible, a rendered-UI walkthrough at one of the demo URLs).

**Why this exists.** On 2026-05-27 a live-workout test session was blocked by two regressions: the **Change Exercise** button disappeared from the pre-set screen, and the **weight input controls** disappeared from a stack-loaded exercise (Calf Press). Both regressions shipped because session-screen layout was modified without verifying that every required control still rendered under every equipment-type and warm-up/working/log state combination. This checklist is the safeguard against repeat incidents.

**Status: ACTIVE. Treat as a non-negotiable pre-commit gate, not a guideline.**

---

## Session-screen classification

The following files / screen states are classified as **session-screen** and are subject to this checklist:

- Pre-set screen (warm-up variant and working-set variant)
- Post-set log screen
- Change Exercise screen
- Session Complete screen
- Any conditional render branch inside `src/AgentTrainer.jsx` that displays one of the above

The Home / Session Setup screen is **not** session-screen for the purpose of this checklist but should still be sanity-checked when modified.

---

## Demo URLs for rendered-UI walkthrough

When a rendered check is performed, all three demo URLs must be opened and walked through:

- [Push demo](https://gleaming-unicorn-62a4bb.netlify.app/?demo=push#session)
- [Pull demo](https://gleaming-unicorn-62a4bb.netlify.app/?demo=pull#session)
- [Legs demo](https://gleaming-unicorn-62a4bb.netlify.app/?demo=legs#session)

Plus the named substates:

- [Logging substate](https://gleaming-unicorn-62a4bb.netlify.app/#logging)
- [PHR (post-set log) substate](https://gleaming-unicorn-62a4bb.netlify.app/#phr)
- [Session complete](https://gleaming-unicorn-62a4bb.netlify.app/#complete)

---

## 1. Pre-Set Screen — Common Controls (ALL equipment types)

These must render regardless of equipment type, warm-up vs. working set, or set number.

- [ ] Header: exercise position indicator (e.g. "1 / 5")
- [ ] Header: back / navigation control (per Obs #3b — pending implementation, becomes required once shipped)
- [ ] Header: set position indicator (e.g. "2 / 15"; F-OPENSETS1: numerator may exceed denominator — denominator is the plan, sets count up freely)
- [ ] Header: elapsed session time
- [ ] Header: session date
- [ ] Exercise name (large display text)
- [ ] WARM-UP pill (yellow) — present when current set is flagged as warm-up; absent otherwise
- [ ] Weight input panel (label + value + increment controls — see §1a–§1e below)
- [ ] Start HR target range display
- [ ] Reps target range display
- [ ] **BEGIN SET N button** (primary CTA) ← required
- [ ] **CHANGE EXERCISE button** (secondary CTA) ← required, **regression target 2026-05-27**
- [ ] END SESSION link (bottom of screen)

### 1a. Plate-loaded equipment (e.g. Linear Hack Squat PL, Plate-Loaded Military Press)

- [ ] Weight panel label reads "PLATE LOADED"
- [ ] Current total weight displayed as large numeric (red — F-PLVIZ1 2026-07-20)
- [ ] Plate loadout rendered as per-denomination circle stacks left of total; only identical weights overlap; count digit below each stack (F-PLVIZ1)
- [ ] Add controls present and functional: 2x2 circle picker right of total — 45 25 / 10 5, filtered by maxPlate; tap adds one plate (a pair on bilateral) (F-PLVIZ1, supersedes legacy +5/+10/+25)
- [ ] Remove control functional: tap a loaded stack removes one plate (a pair on bilateral) (F-PLVIZ1, supersedes legacy -5/-10/-25)
- [ ] If exercise is bodyweight-implicit (e.g., user is on machine without plates): display mode pending design decision per Obs #2b (default behaviour MUST NOT be a numeric 0 — show "BW" or per resolved spec)

### 1b. Stack-loaded equipment (e.g. Seated Leg Curl, Calf Press, Lat Pull-Down)

- [ ] Weight panel label reads "STACK WEIGHT"
- [ ] Current stack weight displayed as large numeric
- [ ] **Increment buttons present and functional: +5, +10, +20** ← required, **regression target 2026-05-27 (Calf Press)**
- [ ] **Decrement buttons present and functional: -5, -10, -20** ← required, **regression target 2026-05-27 (Calf Press)**

### 1c. Dumbbell equipment

- [ ] Weight panel label reads "DUMBBELL" (per-hand weight)
- [ ] Current per-hand weight displayed as large numeric
- [ ] Increment buttons present and functional: +2.5, +5, +10 (subject to confirmation)
- [ ] Decrement buttons present and functional: -2.5, -5, -10

### 1d. Bodyweight-only equipment (e.g. Assisted Dips, Hyperextension without load)

- [ ] Weight panel label reads "BODYWEIGHT" or "BW"
- [ ] No numeric weight input visible
- [ ] No increment/decrement buttons visible
- [ ] Reps target still displayed
- [ ] BEGIN SET + CHANGE EXERCISE buttons still present

### 1e. Bodyweight + added load (e.g. Hyperextension holding a plate, Weighted Dips)

- [ ] Weight panel label reads "ADDED LOAD" or equivalent
- [ ] Added-load value displayed (defaults to 0 lb)
- [ ] Add control: circle picker present (F-PLVIZ1; bw-load is showPlates equipment). Removal via stack tap once load > 0; at 0 no stacks render, preventing negative load
- [ ] Reps target still displayed

---

## 2. Post-Set Log Screen

- [ ] Header: same elements as §1 header block
- [ ] Exercise name
- [ ] Weight display (locked, mirrors pre-set value)
- [ ] Target reps display
- [ ] REPS COMPLETED input (tappable / editable)
- [ ] BPM display (large numeric)
- [ ] HR zone reference row (Recovery / Fat / Aerobic / Threshold / Max with numeric thresholds)
- [ ] HR adjust buttons: -5, -1, +1, +5
- [ ] **LOG SET — N BPM button** (primary CTA) ← required
- [ ] END SESSION link
- [ ] **Back button** ← required per Obs #3b (pending implementation, becomes required once shipped)

**Items to be REMOVED on next session-screen commit (do not re-introduce):**

- [ ] "NO HR DATA — SKIP" line below LOG SET button (per Obs #7 / C0)
- [ ] "PEAK HEART RATE · SET N" label above BPM (per Obs #6 / C2)
- [ ] "MUS / CAL / CRD / FND" score-breakdown row at top of screen (per Obs #5 / C1)

---

## 3. Change Exercise Screen

- [ ] Current exercise context shown
- [ ] List of alternative exercises
- [ ] Each alternative is selectable
- [ ] Confirm / cancel mechanism
- [ ] Back navigation to pre-set screen without losing session state

---

## 4. Session Complete Screen

- [ ] Final score breakdown (MUS / CAL / CRD / FND, plus total / 100)
- [ ] Sets logged summary
- [ ] Exercises completed summary
- [ ] Done / exit control

---

## 5. Pre-commit verification protocol (Rule A2)

Before any push that modifies a file flagged as session-screen (currently: `src/AgentTrainer.jsx` and any future split files implementing the above states):

1. Read the diff and identify which screen states could be affected.
2. For each affected state, walk the JSX render tree and verify every required item in §1–§4 still renders under every applicable condition (equipment type, warm-up flag, set number, error states).
3. Report the result in the commit message AND in the implementation reply to Christian, using the format below.
4. If any required item is missing under any branch, **block the push** and surface the issue before proceeding.

### Required smoke-test report format

```
SMOKE TEST — <commit subject>
Affected states: <list>
Verified controls:
  §1 Pre-Set common: PASS / FAIL (detail)
  §1a Plate-loaded: PASS / N/A
  §1b Stack-loaded: PASS / N/A
  §1c Dumbbell: PASS / N/A
  §1d Bodyweight: PASS / N/A
  §1e BW + added load: PASS / N/A
  §2 Post-Set Log: PASS / N/A
  §3 Change Exercise: PASS / N/A
  §4 Session Complete: PASS / N/A
Result: GO / BLOCK
```

---

## 6. Daily change cap (Rule A3 — Option B)

- Max **4 feature changes per day**, counted across all categories.
- **Bug fixes are exempt** from the cap.
- Every implementation reply must classify the change as "feature" or "bug fix" in the header so the cap is enforceable.

## 7. Session-screen change isolation (Rule A4)

- Any change touching a file classified as session-screen ships **alone** in its commit.
- Session-screen changes are never bundled with non-session changes, never bundled with rule/doc updates, never bundled with each other unless they share a single shared root cause (e.g. two simultaneous regressions traced to one bug).
- If two session-screen changes are intentionally bundled, the commit message must explicitly justify the bundling.

---

## 8. Revision history

- 2026-05-27 — Initial version. Created in response to the catastrophic regression session of 2026-05-27 (Change Exercise button missing, Calf Press weight input missing).
