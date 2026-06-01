# 2026-06-01 — Laptop Cowork session opener (from iPhone app-test, PULL day)

**Confirmed:** product name is **IronQ** (the word "iron" + capital "Q"). Not "Iron Quant."

## Open with
"Read the 2026-06-01 OPEN entry in `06_Handover/session-logs/LOG.md`. Re-inject GH_TOKEN, refresh main, then proceed in the order below."

## Do first (cap-exempt, no design check-in needed)
1. **NAME1** — unify every user-visible surface → **IronQ**. Three-way mismatch at HEAD (rename commit `d8da3f9` was incomplete):
   - wordmark `<span>IRON</span><span>GAME</span>` (`src/AgentTrainer.jsx` L1129–30)
   - export + email subject "Iron Quant" (L1731, L1767)
   - `index.html` `<title>` + apple-mobile-web-app-title "IRON QUANT" (L11, L18)
   - also: `public/manifest*`, internal comment headers, this LOG's title line.
   Single commit. Gate: visual header check (setup + session screens) + export/email subject string. Run `npm run build` before push (touches source).
2. **PERSIST1** — interim localStorage bridge (Christian's directive). Serialize `log`/`prs`/`sesType`/`exList`/`exIdx`/`setIdx`/`sessionStart`; rehydrate on mount via a **"Resume session?"** prompt (NOT auto-jump — avoids HANDOFF gotcha #13). Clear/archive the key on session-complete + End Session. ~30 min. Pattern already proven in-file by the playlist (`ig_playlist`, L715/784).
3. **F-SETNUM1** — mirror BEGIN's `Begin Set ${setIdx+1}` onto the LOG SET button (L2216). ~1 line. (Confirm format with Christian if unsure — see below.)

## Hold for a design check-in BEFORE building
- **F-WARM1** (session warm-up intelligence) — needs trigger + scope answers.
- **F-MUSIC1** (music relayout) — needs label + icon-animation answers.
- **F-CONFIRM1** (End Session / reload confirm) — needs style + copy answers; lower priority once PERSIST1 lands.

## Then (destructive — confirm first)
- **HK1** — list the stray folders ("Irongame" one-word; possibly "iron face game"), confirm consolidation under **IronQ**, create `02_Equipment/`. Do not merge/delete until Christian confirms exact names + target.

## Answers still needed FROM CHRISTIAN (unblock the above)
- F-SETNUM1: label format — `LOG SET 3 — 130 BPM` or set# after BPM? Warm-up = no number, "Log Warm-Up"?
- F-WARM1: completion trigger (auto-detect vs explicit tap)? suggestion scope (session-only vs +per-exercise)?
- F-MUSIC1: remove label both states (lose "Playing in YouTube") or keep playing indicator? note icon static vs animated?
- F-CONFIRM1: styled modal vs interim native confirm? reload copy generic vs "discards in-progress session"? permanent vs interim-until-Dexie?
- Dexie scope (PERSIST2): core-only vs bundle history + PR-trend.

## Product/strategy (→ `00_Strategy/`, Karl meeting tomorrow)
MON1, MON1-IP, LEVEL1, LADDER1, AUTH1 (=M3), PRICE1, EQUIP1, DESIGN1 — full detail in the LOG entry. Dependency order for Karl: MON1 economics → LADDER1 two-stream → LEVEL1 continuity/display → AUTH1 NFT-vs-ID → PRICE1 Apple/member-vs-user. Compile one-page Karl brief + John forward once key answers are in.

## Pending external inputs
- Christian to provide app-icon **gradient hex codes** (DESIGN1 — everything derives from the icon).
- PRICE1 — verify current 2026 Apple IAP / external-payment rules before quoting numbers (Epic 2025 changes).
