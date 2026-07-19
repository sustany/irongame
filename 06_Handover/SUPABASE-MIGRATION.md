# IronQ → Supabase Migration — PLAN & DDL

**Status:** Day 1 committed 2026-07-18. Mark days DONE here as they land.
**Context doc:** `2026-07-18-SUPABASE-MIGRATION-HANDOFF.md` (session-side). This file is the checklist and the schema of record.
**Cadence:** one day = one task = one commit, 20–30 min boxes. Days are work-days, not calendar days.

---

## Phase map

| Phase | Days | Definition of done |
|---|---|---|
| P0 schema | 1–4 | Tables exist, RLS on, anon denied in policy tester |
| P1 auth | 5–7 | Magic-link round-trip behind `?authtest=1`; user UUID returned; production untouched |
| P2 data layer | 8–11 | Read/write fns return app's existing shapes; importer dry-run counts match local |
| P3 dual-write | 12–14 | Every completed session + PR/openwt update mirrored to Supabase for 2–3 real sessions; local authoritative |
| P4 cutover | 15–17 | Supabase-first reads w/ offline fallback verified in airplane mode; default flipped |
| P5 harden | 18–20 | Multi-device merge rule; GitHub PAT backup retired + token revoked; cross-user RLS block verified; retrospective |

## Day-by-day

- **Day 1 — DONE 2026-07-18:** Commit this plan file (M-PLAN1).
- **Day 2:** Verify exact data shapes in `AgentTrainer.jsx`: `ig_history` entry fields, `prs` value shape vs `INIT_PRS` + PR-update code, `ig_openwt` scalar-vs-object. Record findings below in "Verified shapes." No code change.
- **Day 3 — IN PROGRESS 2026-07-19:** Supabase project created: ref `drgffhoigdocwbusincp`, URL `https://drgffhoigdocwbusincp.supabase.co`, status Healthy. DDL run pending (Christian, dashboard SQL editor).
- **Day 4:** Enable + verify RLS: policy tester shows anon denied on all five tables; authed user CRUDs own rows only. P0 gate.
- **Day 5:** `npm i @supabase/supabase-js`; add `src/supabase.js` client init from `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (Netlify env vars, not committed). No app wiring.
- **Day 6:** Magic-link auth flow behind `?authtest=1` URL flag — isolated test path, zero production surface.
- **Day 7:** Auth round-trip proof: send link, click, session returns user UUID. Persist session via supabase-js defaults. P1 gate.
- **Day 8:** `src/backend.js` write fns: `sbUpsertSession(dateKey, entry)`, `sbUpsertPr(exercise, pr)`, `sbUpsertOpenWt(exercise, val)`. Best-effort, all failures swallowed (F-BACKUP2 pattern). Not yet called.
- **Day 9:** `src/backend.js` read fns returning app-native shapes: `sbGetHistory() → ig_history object`, `sbGetPrs() → prs object`, `sbGetOpenWts() → ig_openwt object`. Not yet called.
- **Day 10:** **Importer (correctness-critical — no time box).** One-shot import of localStorage `ig_history` + `ig_openwt` + state `prs` to Supabase. Dry-run mode first: log row counts + diffs, write nothing. Live run only after dry-run counts match local exactly. Trigger: `window.igImport()` console-only.
- **Day 11:** Importer live run against real data. Verify Supabase row counts == local counts. P2 gate.
- **Day 12:** **Dual-write on session complete (session-screen-adjacent — ships alone, SMOKE_TEST §5 report required).** Hook `sbUpsertSession` into the F-BACKUP2 fire point on `screen==="complete"`. Swallowed failures.
- **Day 13:** Dual-write on PR update + openwt update (non-session-screen paths where possible; if session-screen, ships alone + §5).
- **Day 14:** **Observation window (correctness-critical — no time box).** 2–3 real training sessions. After each: verify Supabase mirror matches local for session, sets, PRs, openwt. Log each check. P3 gate. **No read-path change before this gate passes.**
- **Day 15:** Read path: on app boot, Supabase-first fetch with localStorage fallback, behind a feature flag defaulting OFF.
- **Day 16:** Airplane-mode test: flag ON, no network → app boots from local cache, session fully loggable, writes queue/swallow. 
- **Day 17:** Flip flag default ON. P4 gate.
- **Day 18:** Multi-device merge rule: last-write-wins on `updated_at` per row; document conflict cases here.
- **Day 19:** Retire GitHub backup path: demote F-BACKUP2 auto-fire (or delete), revoke `ig_pat` client token, keep `restoreFromGitHub` dormant one more phase as emergency hatch.
- **Day 20:** Cross-user RLS verification (second test account cannot read Christian's rows). Retrospective logged to LOG.md. P5 gate. Project close.

## Verified shapes (Day 2 — verified 2026-07-18 against AgentTrainer.jsx)

**`ig_history[dateKey]`** — dateKey = `YYYY-MM-DD` **local time** (histDateKey, L452). Three variants:
1. Auto-archive (F-HIST1, L1073): `{status:'logged', groups:[gid...], sesType:string|null, exercises:[{name, sets:[{w:number, r:int}]}], source:'auto'}`. `w` is parseFloat — decimals possible.
2. Backfill trained (L1678): `{status:'logged', groups:[...], exercises:[{name,sets}]|`**`undefined`**`, sesType:null, source:'backfill'}`. **Groups-only entries with no exercises key exist** — importer must handle missing `exercises`.
3. Recovery (L1661): `{status:'recovery', source:'backfill'}` — no groups, no sesType, no exercises.
Deletion = key removed entirely (clear mode, L1663).

**`prs[exercise]`** — object keyed by canonical exercise name. Value shape: `{muscle?:string, weight:number, reps:int, bw?:true, gymMax?:int}`.
- INIT_PRS (L294): 33 entries `{muscle, weight, reps}`, 2 carry `bw:` flag.
- PR-on-set (L1447) and undo-recompute (L1378) spread existing value → preserve `muscle`/`bw`.
- **Manual exercise add (L3459) writes `{weight, reps, gymMax?}` with NO `muscle` field** — user-added exercises lack `muscle`; `gymMax` optional int.
→ Schema fit: `prs.weight/reps` columns + full value into `prs.raw` jsonb (carries muscle/bw/gymMax losslessly).

**`ig_openwt[exercise]`** — **scalar number** per exercise name (L1444: `[ex.name]:wt`). Not an object. Bodyweight exercises never written (`!isBw` guard). → `open_weights.weight numeric` fits; `raw` column unnecessary but harmless.

**DDL impact:** none — locked DDL stands. `sessions.raw` jsonb captures variant differences; `session_sets` only populated when `exercises` present; `status` column carries `'recovery'`.

## DDL (run on Day 3)

```sql
-- P0 schema. Postgres 15+. gen_random_uuid() built in.

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date_key text not null,
  status text not null default 'logged',
  ses_type text,
  groups jsonb not null default '[]'::jsonb,
  source text not null default 'auto',
  raw jsonb,                        -- full original entry until shapes locked (Day 2)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date_key)
);

create table public.session_sets (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise text not null,
  set_idx int not null,
  weight numeric,
  reps int,
  unique (session_id, exercise, set_idx)
);

create table public.prs (
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise text not null,
  weight numeric,
  reps int,
  achieved_at timestamptz default now(),
  raw jsonb,                        -- catch-all until Day 2 shape verification
  primary key (user_id, exercise)
);

create table public.open_weights (
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise text not null,
  weight numeric,
  raw jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, exercise)
);

-- RLS: owner-CRUD-own-rows on all; anon denied by default-deny.

alter table public.profiles     enable row level security;
alter table public.sessions     enable row level security;
alter table public.session_sets enable row level security;
alter table public.prs          enable row level security;
alter table public.open_weights enable row level security;

create policy "own rows" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.session_sets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.prs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.open_weights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

## Standing constraints (mirror of handoff — do not drift)

1. No live read-path change until Phase 4; Supabase is write-only shadow through P3.
2. Backend writes best-effort/swallowed; never block a workout.
3. Session-screen edits ship alone + SMOKE_TEST §5 report (Day 12).
4. `npm run build 2>&1 | tail -3` green before every commit.
5. JSX edits via Python `str.replace` + `assert s.count(old)==1`.
6. Never deploy during an active workout.
7. Auth = email magic-link only. No Sign in with Apple.
8. Anon key may live in client env; service-role key never in bundle.
