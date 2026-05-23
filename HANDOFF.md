# IRONGAME — Development Handoff
**Date:** Friday, May 22, 2026
**Status:** PWA single-session prototype, production-ready architecture
**Source file:** `src/AgentTrainer.jsx` (~1597 lines)

---

## 1. WHAT IRONGAME IS

A real-time workout coaching PWA. Black background, red accents (`#e8260a`). Bebas Neue display + Inter body. Single-screen flow: **Setup → Session → Complete**. Tracks compound and isolation work across Push, Pull, and Legs days with adaptive weight suggestions, plate-aware loading, peak-HR capture, and a 100-point session score.

The app is a **single React component** rendered via Vite. State is held in `useState` (no Redux, no Context — yet). No IndexedDB persistence; all data resets on page reload. Adding Dexie.js is the highest-priority next feature.

**Development history:** Built across multiple iterative sessions, with live in-gym testing on May 19 (Pull), May 20 (Legs), May 21 (Push), and May 22 (Pull, with extensive app debugging mid-session). Each test surfaced systemic bugs (plate validity, category contamination, weight display mismatch) that were fixed during the session. The May 22 transcript captures the most recent round.

**Deployment:** The app is structured as a Vite + React 18 PWA with `vite-plugin-pwa` configured. Designed for installation to iOS home screen via "Add to Home Screen" in Safari. Production deploy targets: Vercel (recommended) or Netlify drag-and-drop. See `README.md` for the 5-step deploy guide.

---

## 2. ARCHITECTURE

### Core data structures (`AgentTrainer.jsx`)

**`INIT_PRS`** — Personal records keyed by exercise name: `{ weight, reps }` for standard exercises, `{ bw:true }` for bodyweight. This is the source of truth for what exercises exist in the app. Adding an exercise = adding an entry here.

**`META`** — Per-exercise metadata controlling all behavior:
- `tier`: `"P1"` (compound priority) | `"COMP"` | `"ISO"` | `"FND"`
- `prPts`: weight in scoring formula
- `compound`: bool (affects scoring weight)
- `bilateral`: bool — plates load on both sides (governs `snapWt` and `describeLoad`)
- `barbell`: bool — has a 45 lb bar (used as `fromWt` base)
- `dumbbell`: bool — handheld DB, snaps to 2.5 lb, no plate breakdown
- `perArm`: bool — display weight as "X LBS/ARM"
- `bw`: bool — bodyweight, no load suggestion
- `steps`: `[a,b,c]` — custom +/- adjuster values (e.g. `[5,10,20]` or `[2.5,5,10]`)
- `unit`: `"sec"` for timed exercises like Dead Hang
- `maxPlate`: optional cap on plate size

**`CATEGORY`** — Maps session type → array of exercise names that belong in that session. Filters both pickers (Change Exercise mid-session, Opens With on setup) so Pull Day never shows Hack Squat, Legs never shows Bench Press, etc. **Critical for systemic correctness** — see "Bug Fixes" below.

**`TMPLS`** — Default exercise sequence per session type. Each entry: `{ name, sets, repRange, targetReps, …flags }`. This is what gets loaded when the user taps Push/Pull/Legs on setup.

**`PREV`** — Per-session-type metadata for the setup preview: `{ muscles, opens, note }`.

### Key functions

**`suggestW(name, si, lw, lr, prs)` → number**
Calculates next-set weight suggestion.
- Set 1 (si=0): respects pre-seeded `lw` if truthy, else 68% of PR
- Set 2 (si=1): 82% of PR
- Sets 3+: matched → `lw`, exceeded → `min(lw+5, w×1.08)`, fell_short → `max(lw-10, w×0.75)`
- Returns 0 if `pr` is undefined or `pr.bw === true`

**`snapWt(raw, base, bilateral, dumbbell)` → number**
Rounds a raw suggestion to a plate-achievable weight.
- Dumbbell: nearest 2.5
- Bilateral: `round((raw-base)/10)×10 + base` — guarantees per-side is a multiple of 5
- Else: nearest 5

**`describeLoad(wt, fromWt, bilateral, maxPlate)` → string**
Generates `LOADED: 4×45 + 2×25 + 2×10 = 160` via greedy plate decomposition over `[45, 25, 10, 5]`. For bilateral, counts are doubled (per-side × 2). For dumbbells, this is bypassed — the load label shows just the weight in lbs.

**`exListForType(type, prs)` → {inCat, outCat}**
Filter helper used by both the Change Exercise picker and the Opens With picker. Returns only exercises in the current session category — no cross-contamination.

### State flow

`screen` (`"setup"` | `"barbellCheck"` | `"session"` | `"complete"`) drives top-level routing. Within `"session"`, `phase` (`"ready"` | `"logging"` | `"phr"`) drives the bottom-of-screen UI.

Session state: `sesType`, `exList`, `exIdx`, `setIdx`, `lastWt`, `lastRes`, `weightAdj`, `log`, `sessionStart` (timestamp), `sessionDate` (display string captured at launch), `prs`.

### Session scoring (100 pts total)

The score breakdown is shown live during the session (MUS / CAL / CRD / FND bars under the score header):

| Category | Max | Drivers |
|---|---|---|
| **MUS** Muscle Development | 45 | Total working sets weighted by exercise tier (P1 compound > COMP > ISO > FND), volume-load, rep range adherence |
| **CAL** Caloric Output & Intensity | 25 | Total calories from iCardio (target 550+ for standard, 700+ for extended), session density |
| **CRD** Cardiovascular Quality | 15 | Average HR in working zones (Aerobic+), peak HR achievement, % time above 60% MHR |
| **FND** Foundational Strength | 15 | Grip work (Dead Hang), core (Captain's Chair, Weighted Crunches), mandatory hits |

No-HR-data sessions automatically lose ~15 CRD points. Skipping mandatory foundational exercises (Dead Hang, Hyperextensions on Pull/Legs) penalizes FND.

### Color system (`C` constant, top of file)
- `red:"#e8260a"` — primary accent (CTA, PR, priority indicators)
- `wht:"#ffffff"` — critical text
- `lt:"#cccccc"` — secondary text on dark
- `md:"#888888"` — tertiary text, labels
- `bdr:"#2a2a2a"` — borders
- `bdrTop:"#3a3a3a"` — top-light borders (inset bevel)
- `inner:"#0a0a0a"` — deepest background
- `grn:"#22dd66"` — positive (+ buttons, success)

### Iron Crest icon system

Three custom SVG icons (`IconPush`, `IconPull`, `IconLegs`) on `viewBox 0 0 60 60`. Shield + barbell base, differentiated by chevron direction (push=up, pull=down) and squat figure (legs). All white-fill on red-glow background when selected. Defined as React components around line 80-180 of the source file.

---

## 3. WHAT GOT BUILT TODAY (May 22, 2026)

### Major systemic fixes
1. **Category isolation.** Added `CATEGORY` map + `exListForType` helper. Pull Day pickers no longer show Legs exercises (Hack Squat) and vice versa. "Other" sections removed from both pickers entirely to enforce strict isolation.
2. **Plate validity (`snapWt`).** Replaced the previous odd/even check with a true multiple-of-10 snap from the bar. Eliminates impossible suggestions like 152 lb on a bilateral barbell (per-side would be 53.5).
3. **Bilateral META flags.** Added `bilateral:true` to Hack Squat, Leg Extension, Calf Press, Seated Calf Raise, Lat Pull-Down PL, Calf Press Linear Leg Press. Without this, `describeLoad` shows nonsense like `5×45` (odd plate count for a two-sided machine).
4. **Adjusted weight in logging phase.** Logging phase now displays `adjWt` (after +/- adjustments) instead of `tgt` (raw suggestion). The log was always recording the correct adjusted value, but the display lied. Fix: one-line change from `${tgt}` to `${adjWt}`.
5. **Per-exercise step sizes.** Added `steps:[…]` field to META. LF High Row uses `[5,10,20]`. All DB exercises use `[2.5,5,10]`. Default `[10,20,30]`.
6. **Dumbbell handling.** New `dumbbell:true` flag on DB exercises. Load label shows simple "45 LBS" with no fake plate breakdown. `snapWt` rounds to 2.5 lb increments.
7. **Adaptive target reps in logging.** Display now shows a single specific number that adjusts to last result: exceeded → target+2, matched → target, fell_short → target-2. Replaces the previous static range display.
8. **Session date captured at launch.** New `sessionDate` state captures `new Date()` when the session starts. Shown in the session header beneath the timer and on the Session Complete screen. Eliminates the "what day is this?" ambiguity that came up multiple times today.
9. **Pull Day template cleanup.** Removed Barbell RDL from Pull (it's a hip-hinge / posterior chain exercise, belongs only in Legs). Pull now opens with LF Lat Pulldown.
10. **Exercise rename.** "LF Lat Pulldown" → "Lat Pull-Down PL" (matches the actual plate-loaded machine name).
11. **New exercises added.** Calf Press, Linear Leg Press (PR 630×10 from today). Lat Pull-Down PL is now bilateral-flagged.

### UI evolution this session
- Load card: 3-column layout, plate badges left, weight center, adjusters right (+ row top green, − row bottom red)
- Dynamic `LOADED: …` formula header replacing static "LOAD" label
- PHR entry phase with quick-select chips (110/120/…/170) + fine-tune (±1, ±5) + "No HR Data — Skip" link for watch-less days
- Opens-With picker on the setup screen, filtered by category
- Mid-session Change Exercise picker with `+ New` button to add exercises live
- Minutes-only session timer (no MM:SS)
- End Session text link below the bottom CTA

---

## 4. TODAY'S WORKOUT (Pull Day, trained on a rest day for app testing)

| # | Exercise | Sets | Loading | Reps |
|---|---|---|---|---|
| 1 | Lat Pull-Down PL | 4 | 200→160→140 | 10, 10, 10, 10 |
| 2 | LF High Row | 4 | ~205 | — (via app, not in chat log) |
| 3 | LF Row | 3 | 205, 220, 210 | 10, 10, 10 |
| 4 | Calf Press, Linear LP | 5 | 360→450→540→540→**630** | —, —, 10, 12, 10 |

**PR: Calf Press Linear Leg Press 630×10** (new record, established mid-session)
**iCardio:** 1:22:54 raw / 63 min adjusted, 849 raw / 645 adjusted cal, avg 115 BPM, peak 152 (88% MHR)
**Estimated score:** 73/100

---

## 5. PENDING / TOP PRIORITIES

### 1. IndexedDB persistence via Dexie.js (highest priority)
The app currently loses everything on reload. PRs, session history, exercise library — all in-memory only. Implementing Dexie would eliminate:
- The need for me (Claude) to pre-load mid-session state in TP reloads
- Manual session-log reconstruction after refresh
- The artificial "session resets on tab close" limitation

Suggested schema:
```js
db.version(1).stores({
  prs: 'name,weight,reps,updatedAt',
  sessions: '++id,date,sesType,score,duration,totalCal',
  setLog: '++id,sessionId,exercise,setNum,weight,reps,result,phr,timestamp',
});
```

### 2. Reps tracking for Calf Press Sets 1 & 2 (May 22)
Logged as `reps:0` placeholder. User never reported the actual rep counts before session end.

### 3. Free weight entry (B9)
Current implementation: per-exercise step buttons handle most cases. Pre-seeding `lastWt` covers the rest. But a tap-to-edit weight field would be cleaner for one-off scenarios.

### 4. Cloud sync to chris@kameir.com
Currently Gmail/Google Calendar only connect to chris@sustany.co. Need to add second account or migrate. Goal: auto-write session summaries to a Google Sheet.

### 5. Session history view
Once Dexie is in, build a list screen: date | session type | score | duration | PRs hit. Tap a row to drill into per-set log.

### 6. PR trend chart
Per-exercise weight × time line chart using Recharts (already a dependency in the bundle? Verify).

---

## 6. KEY LESSONS / GOTCHAS

1. **`bilateral` is a META flag, not a TMPLS flag.** When a new exercise is added without `bilateral:true` in META, `describeLoad` treats it as single-sided and produces invalid plate counts. Always set this flag for any machine that loads plates on both sides of a pivot.

2. **`prs[name]` must exist for `suggestW` to return non-zero.** When adding a new exercise via the `+ New` form or programmatically, the entry must go into `INIT_PRS` (which seeds the `prs` state), not just `META`. A duplicate-key in `META` will silently override the correct entry.

3. **`adjWt` is the source of truth for what gets logged.** `tgt` is the raw suggestion. Any UI showing the weight must read `adjWt`, otherwise the user sees one number and another gets logged. (This was a recurring bug today.)

4. **The category map is the only line of defense against cross-day contamination.** Without `CATEGORY` + `exListForType`, the pickers fall back to `Object.keys(prs)` which shows every exercise to every session type.

5. **"Sled + N plates" notation.** For Linear Leg Press / Hack Squat machines, the user reports plate weight only, not sled weight. Log the plate weight as the load value. Sled weight varies by machine (~75–100 lbs) and isn't reliable enough to add into the log automatically.

6. **PHR estimation from iCardio screenshots.** When the user marks the peak with a blue circle, read the BPM band: Warm Up/Cool Down ≤ 103, Fat Burn 103–121, Aerobic (Endurance) 121–138, Anaerobic (Hardcore) 138–155, VO2 Max 155–173, Above VO2 Max 173+. Estimate from chart position relative to band boundaries; confirm with user if it sits at a boundary.

7. **`Bebas Neue` doesn't ship with React — it's loaded from Google Fonts** via the `FONTS` constant injected into a `<style>` tag at the root of each screen.

8. **Gym plate constraint: 45/25/10/5 lbs ONLY. No 2.5 lb plates.** All weight suggestions must land on valid plate combinations. `snapWt` enforces this for bilateral and barbell exercises. The only exception is dumbbells, which come in 2.5 lb increments at standard gyms.

9. **Per-arm display.** Exercises with `perArm:true` (e.g. LF High Row) show weight as "X LBS/ARM" so the user knows the displayed value is per-side load on a unilateral machine.

10. **`wConf` modal — large weight changes.** If the new `adjWt` differs from `lastWt` by more than 50%, the app shows a confirmation modal before logging. This catches accidental +30+30+30 button mashes. State: `wConf={res, wt}`.

11. **Custom step sizes.** Default `+/-` is `[10, 20, 30]`. Override per-exercise via `steps:[a,b,c]` in META. LF High Row uses `[5, 10, 20]`. All dumbbell exercises use `[2.5, 5, 10]`. The user requests these per machine — accommodate.

12. **TP (Testing Protocol).** During app development, the user logs sets through chat (not the live app), and I pre-load the JSX state to reflect each set. The pattern: edit `SESSION_LOG` array, update `exIdx`/`setIdx`/`lastWt`/`lastRes` initial state values, copy to `/mnt/user-data/outputs/IronGame.jsx`, present file. This will be obsolete once Dexie persistence is in place.

13. **Pre-loading vs setup screen.** The pre-loaded session type (`sesType` initial value) overrides whatever the user selects on the setup screen. This caused the "stuck on wrong exercise" issue today when a Pull session got pre-loaded as Legs. Going forward, the artifact should default to `sesType:null` and `screen:"setup"` — only set non-null values when actively reloading mid-session for TP.

14. **Session reset.** When the session ends and the user wants to start a fresh one, all state must reset: `screen="setup"`, `sesType=null`, `exList=[]`, `exIdx=0`, `setIdx=0`, `log=[]`, `lastWt=null`, `lastRes=null`, `weightAdj=0`, `sessionStart=null`, `sessionDate=null`. Missing any one of these causes stale data to bleed into the next session.

---

## 7. LOCAL SETUP (DESKTOP)

```bash
# 1. Unzip the package
unzip irongame-handoff-2026-05-22.zip
cd agent-trainer/

# 2. Install dependencies
npm install

# 3. Run dev server
npm run dev   # → http://localhost:5173

# 4. Build for production
npm run build  # → outputs to dist/

# 5. Deploy
# Drop dist/ into Netlify, or:
vercel
```

### Recommended editor setup
- VS Code + ESLint + Prettier
- React DevTools browser extension
- Color picker for the design tokens (in `C` constant at top of file)

### Recommended next code edits
1. Split `AgentTrainer.jsx` into modules: `Setup.jsx`, `Session.jsx`, `Complete.jsx`, `lib/suggest.js`, `lib/plates.js`, `data/library.js`. The single-file approach was fine for prototyping; it's getting unwieldy at 1600 lines.
2. Add Dexie.js: `npm install dexie` then wire up the schema above.
3. Add TypeScript: convert one file at a time, starting with `lib/`.

---

## 8. FILES IN THIS HANDOFF

- `HANDOFF.md` — this document
- `src/AgentTrainer.jsx` — full app source
- `src/main.jsx` — React entry point
- `index.html` — root HTML with iOS PWA meta tags
- `package.json` — dependencies (React 18, Vite 5, vite-plugin-pwa)
- `vite.config.js` — PWA configuration
- `generate-icons.html` — standalone icon generator
- `README.md` — original deployment guide
- `public/` — directory for generated icons (icons NOT included in zip — regenerate via generate-icons.html)

---

## 9. CONTACT / CONTINUITY

This handoff captures the project state as of **end-of-day Friday May 22, 2026**. Next training session is **Saturday May 23** — weekend format, 70–75 min, 6 exercises. Push or Legs (your call based on rotation).

If continuing development with Claude on desktop, load this HANDOFF.md + the `src/AgentTrainer.jsx` file into the conversation as context. The Project memory contains the broader training and nutrition context.

— end of handoff —
