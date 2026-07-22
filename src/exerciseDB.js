// ─────────────────────────────────────────────────────────────
// MASTER EXERCISE DATABASE — BUG-001 Steps 2–4 (data layer only)
//
// Step 2 SCHEMA: one record per exercise, keyed by stable `id`.
//   { id, canonical, aliases[], primary, secondary[], equip, type,
//     tier, prPts, compound, custom }
// Runtime data (progression, PRs, scoring) attaches to `id`, never
// to a display string — this ends the dual name-space split.
//
// Step 3 SEED: EXERCISE_LIBRARY (generic catalog) merged with the
// 33 runtime exercises from AgentTrainer (META/INIT_PRS keys).
// 23 match library canonicals exactly; 10 are added below as
// first-class entries so search always returns the exact runtime
// name and progression lookups never break.
//
// Step 4 PERSISTENCE: user overlay (custom exercises + user-added
// aliases) in localStorage under `ig_exdb_v1`, same defensive
// try/catch pattern as `ig_session`.
//
// NOT yet imported by AgentTrainer.jsx — Step 5 (laptop) wires the
// Change Exercise picker to searchMaster()/getMasterDB().
// ─────────────────────────────────────────────────────────────
import { EXERCISE_LIBRARY } from "./exerciseLibrary";

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ── Step 3a: runtime metadata for the 23 library-matched names ──
// canonical name (exact library match) → scoring metadata
const RUNTIME_META = {
  "Shoulder Press":          { tier:"P1", prPts:8, compound:true },
  "Military Press PL Machine":  { tier:"P1", prPts:8, compound:true },
  "Seated PL Dip Machine":      { tier:"P2", prPts:5, compound:true },
  "LF Seated Dip":              { tier:"P2", prPts:5, compound:true },
  "Pec Deck":                   { tier:"ISO", prPts:3 },
  "Cable Pushdown":             { tier:"ISO", prPts:3 },
  "Seated Lateral Raise":       { tier:"ISO", prPts:3 },
  "Captain's Chair":            { tier:"ISO", prPts:3 },
  "Barbell RDL":                { tier:"P1", prPts:8, compound:true },
  "LF Row":                     { tier:"P1", prPts:8, compound:true },
  "Lever Seated Row":           { tier:"P1", prPts:8, compound:true },
  "DB Alternating Curl":        { tier:"ISO", prPts:3 },
  "DB Hammer Curl":             { tier:"ISO", prPts:3 },
  "LF Bicep Curl":              { tier:"ISO", prPts:3 },
  "Dead Hang":                  { tier:"ISO", prPts:3 },
  "Hip Thrust (Smith)":         { tier:"P2", prPts:5, compound:true },
  "Seated Leg Curl":            { tier:"P2", prPts:5, compound:true },
  "Linear Hack Squat PL":       { tier:"P1", prPts:8, compound:true },
  "Leg Extension":              { tier:"ISO", prPts:3 },
  "Calf Press":                 { tier:"ISO", prPts:3 },
  "Calf Press, Linear Leg Press": { tier:"ISO", prPts:3 },
  "Seated Calf Raise":          { tier:"ISO", prPts:3 },
  "Reverse Pec Deck":           { tier:"ISO", prPts:3 },
};

// ── Step 3b: the 10 runtime exercises absent from the library ──
// canonical = EXACT runtime key (INIT_PRS/META/TMPLS) so selecting
// a search hit preserves all progression/scoring lookups.
const RUNTIME_ONLY = [
  { canonical:"Incline Press", brand:"Life Fitness", aliases:["seated plate-loaded incline bench press","incline machine press lf","life fitness incline press","lf incline press"],
    primary:"chest", secondary:["front delts","triceps"], equip:"plate-loaded", type:"compound", tier:"P1", prPts:8, compound:true },
  { canonical:"Bench Press, Smith Machine", aliases:["smith bench press","smith machine bench","flat smith press"],
    primary:"chest", secondary:["front delts","triceps"], equip:"smith", type:"compound", tier:"P1", prPts:8, compound:true },
  { canonical:"HS Decline Press", aliases:["hammer strength decline press","decline plate loaded press"],
    primary:"chest", secondary:["triceps"], equip:"plate-loaded", type:"compound", tier:"P2", prPts:5, compound:true },
  { canonical:"DB Flys", aliases:["dumbbell fly","flat db fly","dumbbell flyes"],
    primary:"chest", secondary:[], equip:"dumbbell", type:"isolation", tier:"ISO", prPts:3 },
  { canonical:"Assisted Dips", aliases:["assisted dip machine","dip assist"],
    primary:"chest", secondary:["triceps","front delts"], equip:"stack-pin", type:"compound", tier:"P2", prPts:5, compound:true },
  { canonical:"High Row PL", aliases:["plate loaded high row","hammer strength high row"],
    primary:"mid back", secondary:["lats","biceps"], equip:"plate-loaded", type:"compound", tier:"P1", prPts:8, compound:true },
  { canonical:"Lat Pull-Down PL", aliases:["plate loaded lat pulldown","lat pulldown pl","iso lateral pulldown"],
    primary:"lats", secondary:["biceps","mid back"], equip:"plate-loaded", type:"compound", tier:"P1", prPts:8, compound:true },
  { canonical:"Assisted Chin-Up", aliases:["assisted chin up machine","chin up assist"],
    primary:"lats", secondary:["biceps"], equip:"stack-pin", type:"compound", tier:"P2", prPts:5, compound:true },
  { canonical:"Hyperextensions 45°", aliases:["45 degree back extension","hyperextension","back extension 45"],
    primary:"lower back", secondary:["glutes","hamstrings"], equip:"bw-load", type:"isolation", tier:"ISO", prPts:3 },
  { canonical:"Weighted Crunches", aliases:["weighted crunch","plate crunch"],
    primary:"abs", secondary:[], equip:"plate-loaded", type:"isolation", tier:"ISO", prPts:3 },
];

// ── 7-group filter model (matches locked homescreen redesign) ──
export const GROUP_FILTERS = {
  CHEST:     ["chest"],
  BACK:      ["lats","mid back","lower back","traps"],
  SHOULDERS: ["front delts","side delts","rear delts"],
  BICEPS:    ["biceps","brachialis","forearms","grip"],
  TRICEPS:   ["triceps"],
  LEGS:      ["quads","hamstrings","glutes","calves","hip flexors"],
  CORE:      ["abs","obliques","core","neck"],
};

// ── Step 6: duplicate consolidation ──
// Generic library entries that describe the SAME machine/movement as a
// runtime exercise are removed; their canonical + aliases fold into the
// runtime record so every search resolves to the single record that
// carries progression data. Distinct-equipment variants (e.g. cable
// Lat Pulldown vs plate-loaded) are intentionally NOT merged.
const CONSOLIDATE = {
  "Incline Press":           ["Incline Machine Press"],
  "Bench Press, Smith Machine": ["Smith Machine Bench Press"],
  "HS Decline Press":           ["Hammer Strength Decline"],
  "DB Flys":                    ["Dumbbell Fly"],
  "Assisted Dips":              ["Assisted Dip"],
  "High Row PL":                ["LF High Row"],
  "Lat Pull-Down PL":           ["Lat Pulldown PL"],
  "Hyperextensions 45°":        ["Hyperextension 45°"],
  "Weighted Crunches":          ["Weighted Crunch"],
};
// Aliases on generic entries that collide with a runtime canonical.
const ALIAS_STRIP = {
  "Chin-Up": ["assisted chin-up"],
};

// ── Step 2/3: build the seeded master DB ──
const buildSeed = () => {
  const absorbed = new Map(); // runtime canonical -> extra aliases
  const removeSet = new Set();
  for (const [keep, drops] of Object.entries(CONSOLIDATE)) {
    for (const d of drops) removeSet.add(d);
  }
  const db = [];
  for (const e of EXERCISE_LIBRARY) {
    if (removeSet.has(e.canonical)) {
      // fold canonical + aliases into the runtime record's aliases
      const keep = Object.keys(CONSOLIDATE).find((k) => CONSOLIDATE[k].includes(e.canonical));
      const list = absorbed.get(keep) || [];
      list.push(e.canonical.toLowerCase(), ...e.aliases);
      absorbed.set(keep, list);
      continue;
    }
    const strip = ALIAS_STRIP[e.canonical];
    db.push({
      id: slug(e.canonical),
      canonical: e.canonical,
      aliases: strip ? e.aliases.filter((a) => !strip.includes(a)) : [...e.aliases],
      primary: e.primary,
      secondary: [...(e.secondary || [])],
      equip: e.equip,
      type: e.type,
      custom: false,
      ...(RUNTIME_META[e.canonical] || {}),
    });
  }
  for (const r of RUNTIME_ONLY) {
    const extra = absorbed.get(r.canonical) || [];
    db.push({ id: slug(r.canonical), custom: false, ...r,
      aliases: [...new Set([...r.aliases, ...extra])], secondary: [...r.secondary] });
  }
  return db;
};

const SEED = buildSeed();

// ── Step 4: persistence (user overlay) ──
const STORE_KEY = "ig_exdb_v1";
const emptyOverlay = () => ({ v: 1, customExercises: [], aliasAdds: {} });

export const loadOverlay = () => {
  try {
    const s = localStorage.getItem(STORE_KEY);
    if (!s) return emptyOverlay();
    const o = JSON.parse(s);
    return o && o.v === 1 ? o : emptyOverlay();
  } catch { return emptyOverlay(); }
};

export const saveOverlay = (overlay) => {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(overlay)); return true; }
  catch { return false; }
};

// Merge seed + overlay into the live master DB.
export const getMasterDB = (overlay = loadOverlay()) => {
  // Guard: duplicate seed ids fold to the first entry (BUGFIX 2026-07-09 —
  // duplicated library rows produced double picker listings and PR-id collisions).
  const seen = new Set();
  const db = [];
  for (const e of SEED) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    const extra = overlay.aliasAdds[e.id];
    db.push(extra ? { ...e, aliases: [...e.aliases, ...extra] } : e);
  }
  for (const c of overlay.customExercises) {
    if (!seen.has(c.id)) { seen.add(c.id); db.push({ ...c, custom: true }); }
  }
  return db;
};

export const addCustomExercise = ({ canonical, primary, secondary = [], equip = "machine", type = "compound", tier = "P2", prPts = 5 }) => {
  const overlay = loadOverlay();
  const id = slug(canonical);
  if (SEED.some((e) => e.id === id) || overlay.customExercises.some((e) => e.id === id)) {
    return { ok: false, reason: "exists", id };
  }
  overlay.customExercises.push({ id, canonical, aliases: [], primary, secondary, equip, type, tier, prPts, compound: type === "compound", custom: true });
  return { ok: saveOverlay(overlay), id };
};

export const addAlias = (id, alias) => {
  const overlay = loadOverlay();
  const a = (alias || "").trim().toLowerCase();
  if (!a) return { ok: false, reason: "empty" };
  overlay.aliasAdds[id] = [...new Set([...(overlay.aliasAdds[id] || []), a])];
  return { ok: saveOverlay(overlay), id };
};

// ── F-LOADALERT1: warm-up pre-warm map ──
// A muscle group listed as a key is considered "pre-warmed" when any exercise
// whose primary is in its value array was already trained this session.
// Locked pairs (2026-07-09): Chest→Triceps, Shoulders→Triceps,
// Quads→Hamstrings, Back→Biceps. Group membership mirrors GROUP_FILTERS.
export const PREWARM_PRIMARIES = {
  triceps:    [...GROUP_FILTERS.CHEST, ...GROUP_FILTERS.SHOULDERS],
  hamstrings: ["quads"],
  biceps:     [...GROUP_FILTERS.BACK],
};

// ── Search over the master DB (query + optional 7-group filter) ──
export const searchMaster = (query, { group = null, limit = 60, db = getMasterDB() } = {}) => {
  const q = (query || "").toLowerCase().trim();
  const groupSet = group ? new Set(GROUP_FILTERS[group] || []) : null;
  const wordStart = (t) => t.split(/[\s,()/\-_.°]+/).filter(Boolean).some((w) => w.startsWith(q));
  const scored = [];
  for (const e of db) {
    if (groupSet && !groupSet.has(e.primary)) continue;
    if (!q) { scored.push({ ...e, score: 0.5 }); continue; }
    const cands = [e.canonical.toLowerCase(), ...e.aliases.map((a) => a.toLowerCase())];
    let best = 0;
    for (const t of cands) {
      let s = 0;
      if (t === q) s = 1.0;
      else if (t.startsWith(q)) s = 0.95;
      else if (wordStart(t)) s = 0.9;
      else if (q.length >= 4 && t.includes(q)) s = 0.65;
      if (s > best) best = s;
    }
    if (best >= 0.6) scored.push({ ...e, score: best });
  }
  return scored.sort((a, b) => b.score - a.score || a.canonical.localeCompare(b.canonical)).slice(0, limit);
};

// ─────────────────────────────────────────────────────────────
// F-MVGROUP1 (2026-07-21) — movement→equipment two-step picker.
//
// 20 movement clusters in the master DB span >1 equipment type
// (e.g. "hack squat" = Hack Squat/machine + Linear Hack Squat PL/
// plate-loaded). Rather than force the user to know the exact
// canonical variant name, the picker lets them search the MOVEMENT,
// then choose the equipment variant. Each variant keeps its own
// canonical name → its own PR track (option a, locked invariant:
// equipment is a variant dimension with separate PR tracks).
//
// Clustering is driven by an EXPLICIT map keyed to canonical names,
// not runtime regex — no mis-grouping, and single-equipment
// exercises (~120) are untouched and still pick directly.
// ─────────────────────────────────────────────────────────────
export const MOVEMENT_CLUSTERS = {
  "Bench Press":       ["Barbell Bench Press","Dumbbell Bench Press","Smith Machine Bench Press"],
  "Bicep Curl":        ["LF Bicep Curl","Machine Bicep Curl"],
  "Calf Raise":        ["Seated Calf Raise","Smith Calf Raise"],
  "Curl (Free)":       ["Barbell Curl","Dumbbell Curl","Cable Curl"],
  "Dip":               ["Assisted Dip","LF Seated Dip","Seated PL Dip Machine"],
  "Front Raise":       ["Front Raise","Cable Front Raise"],
  "Good Morning":      ["Good Morning","Seated Good Morning"],
  "Hack Squat":        ["Hack Squat","Linear Hack Squat PL"],
  "High Row":          ["LF High Row","Cable High Row"],
  "Lat Pulldown":      ["Lat Pulldown","Lat Pulldown PL"],
  "Lateral Raise":     ["Dumbbell Lateral Raise","Seated Lateral Raise","Cable Lateral Raise","Machine Lateral Raise"],
  "Overhead Extension":["Overhead Cable Extension","Overhead Dumbbell Extension"],
  "Pullover":          ["Dumbbell Pullover","Cable Pullover","Machine Pullover"],
  "RDL":               ["Dumbbell RDL","Barbell RDL"],
  "Rear Delt Fly":     ["Rear Delt Fly","Cable Rear Delt Fly"],
  "Row":               ["Barbell Row","Dumbbell Row","Seated Cable Row","LF Row","Lever Seated Row","Smith Machine Row"],
  "Shrug":             ["Barbell Shrug","Dumbbell Shrug","Machine Shrug"],
  "Upright Row":       ["Barbell Upright Row","Dumbbell Upright Row","Cable Upright Row"],
};

// canonical name → movement label (reverse index)
export const CANON_TO_MOVEMENT = (() => {
  const m = {};
  for (const [mv, members] of Object.entries(MOVEMENT_CLUSTERS))
    for (const c of members) m[c] = mv;
  return m;
})();

// Movement-aware search. Returns a flat, ordered list of "rows" where
// each row is either:
//   { kind:"movement", movement, label, members:[{...entry}], primary, equips:[...] }
//   { kind:"exercise", ...entry }
// Clustered members are collapsed into ONE movement row (dedup); every
// unclustered hit stays a direct exercise row. Ordering preserves the
// underlying searchMaster() relevance for whichever member/exercise
// scored highest.
export const searchMovements = (query, opts = {}) => {
  const hits = searchMaster(query, { ...opts, limit: opts.limit || 80 });
  const out = [];
  const seenMv = new Set();
  for (const h of hits) {
    const mv = CANON_TO_MOVEMENT[h.canonical];
    if (mv) {
      if (seenMv.has(mv)) continue;
      seenMv.add(mv);
      const memberNames = MOVEMENT_CLUSTERS[mv];
      const members = memberNames
        .map((n) => hits.find((x) => x.canonical === n)
                 || getMasterDB().find((x) => x.canonical === n))
        .filter(Boolean);
      out.push({
        kind: "movement",
        movement: mv,
        label: mv,
        members,
        primary: members[0]?.primary || h.primary,
        equips: members.map((x) => x.equip),
      });
    } else {
      out.push({ kind: "exercise", ...h });
    }
  }
  return out;
};

// Browse a muscle group as movement rows (no text query). Used by the
// pill browse so a group shows the full library for that muscle,
// clustered — fixes the "only my history shows" discoverability trap.
export const browseMovementsByGroup = (group, db = getMasterDB()) => {
  const set = new Set(GROUP_FILTERS[group] || []);
  const entries = db.filter((e) => set.has(e.primary));
  const out = [];
  const seenMv = new Set();
  for (const e of entries) {
    const mv = CANON_TO_MOVEMENT[e.canonical];
    if (mv) {
      if (seenMv.has(mv)) continue;
      seenMv.add(mv);
      const members = MOVEMENT_CLUSTERS[mv]
        .map((n) => db.find((x) => x.canonical === n))
        .filter(Boolean);
      out.push({ kind:"movement", movement:mv, label:mv, members,
        primary: members[0]?.primary || e.primary,
        equips: members.map((x) => x.equip) });
    } else {
      out.push({ kind:"exercise", ...e });
    }
  }
  return out;
};
