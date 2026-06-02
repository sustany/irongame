# 2026-06-02 — Laptop Cowork session opener (from iPhone session, LEGS day)

**Live app:** https://iron-q.netlify.app   **HEAD:** `2777f5e`   **Repo clean, build green.**

## Open with
"Read the 2026-06-02 OPEN entry in `06_Handover/session-logs/LOG.md`. Re-inject GH_TOKEN, refresh main, then build in the order below."

## Build order (all cap-exempt fixes except where noted)
1. **PERSIST1 — localStorage bridge. DO FIRST.** Removes the catastrophic risk: `autoUpdate`+`skipWaiting`+`controllerchange` (AgentTrainer L742-748) auto-reloads the running app on any deploy → wipes the in-memory session. Serialize `log/prs/sesType/exList/exIdx/setIdx/sessionStart`; rehydrate via "Resume session?" prompt (not auto-jump → avoids gotcha #13); clear key on session-complete/End Session. Pattern proven by playlist (`ig_playlist` L715/784). ~30 min.
2. **DUP1** — `src/exerciseLibrary.js` NOISE regex (L238): remove stance words `seated|lying|standing|prone|kneeling`. Keep equipment/brand noise. Re-test: 3 leg-curl variants normalize distinctly, `findDuplicate` returns null across stances, "DB Curl"≈"Dumbbell Curl" still matches. ~10-15 min.
3. **DUP2** — AgentTrainer L2568 ADD ANYWAY: make it perform the add directly (bypass the re-check) instead of just `setNewExDuplicate(null)`. ~10 min.
4. **REPS-COMPLETED removal + SET x/xx** — remove label L2145; add `SET {setIdx+1}/{ex.sets}`. SESSION-SCREEN → ships alone + §5 report. BLOCKED on Christian's answers (format/placement — see below).
5. **BACK button** on rep-logging screen before TAP TO RELOAD — trigger existing `setPhase("ready")` (L1827-1830). SESSION-SCREEN → ships alone + §5.
6. **End Session confirm** — confirm() on L2425 (mirror reload confirm).
7. **NAME1 sweep** — remaining "Iron Quant" in export/subject (L1731, L1769) + IRONGAME comment headers + this LOG's title → IronQ.
8. **HK1** — folder consolidation to IronQ + new `02_Equipment/`. DESTRUCTIVE → list stray folders ("Irongame", "iron face game"?) and confirm with Christian before merge/delete.

## Hold for design-check-in (do NOT build until Christian answers)
- **F-MUSIC1** (music relayout) and **F-WARM1** (warm-up feedback + suggestions) — questions in the 2026-06-01 entry.

## Answers still needed FROM CHRISTIAN
- SET x/xx (item 4): per-exercise current/total? "SET" word or bare "2/3"? placement (where REPS COMPLETED was)?
- DUP fixes: DUP1+DUP2 together, or DUP1 only?
- BACK button: mirror header arrow (→ pre-set) or go further back?
- F-MUSIC1 / F-WARM1 design answers.
- App-icon gradient hex codes (DESIGN1); Karl meeting length + product-vs-legal.

## Product/strategy (→ 00_Strategy/, Karl meeting)
MON1, MON1-IP, LEVEL1, LADDER1, AUTH1, PRICE1, EQUIP1, DESIGN1 — full detail in the 2026-06-01 entry. Dependency order: MON1 economics → LADDER1 → LEVEL1 → AUTH1 → PRICE1.

## Locked this session (don't re-litigate)
Name IronQ (wordmark IRONQ red/white; label/title IRON Q). Tagline SCIENCE + AI = RESULTS. Header: IRONQ + ☰ placeholder · red rule under · tagline left + amber/gold date `#eab308` right · no TARGET text · no "Training Format" label · date always-on both modes. Reload confirm = interim native confirm().
