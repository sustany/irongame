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
**Status:** OPEN

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
