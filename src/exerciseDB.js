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
  "Military Press, Machine, Plate-Loaded":  { tier:"P1", prPts:8, compound:true },
  "Dip, Machine, Plate-Loaded, Seated":      { tier:"P2", prPts:5, compound:true },
  "LF Seated Dip":              { tier:"P2", prPts:5, compound:true },
  "Pec Deck":                   { tier:"ISO", prPts:3 },
  "Pushdown, Cable":             { tier:"ISO", prPts:3 },
  "Lateral Raise, Dumbbell, Seated":       { tier:"ISO", prPts:3 },
  "Captain's Chair":            { tier:"ISO", prPts:3 },
  "RDL, Barbell":                { tier:"P1", prPts:8, compound:true },
  "LF Row":                     { tier:"P1", prPts:8, compound:true },
  "Lever Seated Row":           { tier:"P1", prPts:8, compound:true },
  "DB Alternating Curl":        { tier:"ISO", prPts:3 },
  "DB Hammer Curl":             { tier:"ISO", prPts:3 },
  "LF Bicep Curl":              { tier:"ISO", prPts:3 },
  "Dead Hang":                  { tier:"ISO", prPts:3 },
  "Hip Thrust (Smith)":         { tier:"P2", prPts:5, compound:true },
  "Leg Curl, Machine, Seated":            { tier:"P2", prPts:5, compound:true },
  "Linear Hack Squat, Machine, Plate-Loaded":       { tier:"P1", prPts:8, compound:true },
  "Leg Extension":              { tier:"ISO", prPts:3 },
  "Calf Press":                 { tier:"ISO", prPts:3 },
  "Calf Press, Linear Leg Press": { tier:"ISO", prPts:3 },
  "Calf Raise, Machine, Plate-Loaded, Seated":          { tier:"ISO", prPts:3 },
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
  { canonical:"Fly, Dumbbell", aliases:["dumbbell fly","flat db fly","dumbbell flyes","db flys"],
    primary:"chest", secondary:[], equip:"dumbbell", type:"isolation", tier:"ISO", prPts:3 },
  { canonical:"Dip, Machine, Assisted", aliases:["assisted dip machine","dip assist","assisted dips","assisted dip"],
    primary:"chest", secondary:["triceps","front delts"], equip:"stack-pin", type:"compound", tier:"P2", prPts:5, compound:true },
  { canonical:"High Row, Machine, Plate-Loaded", aliases:["plate loaded high row","hammer strength high row","high row pl"],
    primary:"mid back", secondary:["lats","biceps"], equip:"plate-loaded", type:"compound", tier:"P1", prPts:8, compound:true },
  { canonical:"Lat Pulldown, Machine, Plate-Loaded", aliases:["plate loaded lat pulldown","lat pulldown pl","iso lateral pulldown","lat pull-down pl"],
    primary:"lats", secondary:["biceps","mid back"], equip:"plate-loaded", type:"compound", tier:"P1", prPts:8, compound:true },
  { canonical:"Chin-Up, Machine, Assisted", aliases:["assisted chin up machine","chin up assist","assisted chin-up"],
    primary:"lats", secondary:["biceps"], equip:"stack-pin", type:"compound", tier:"P2", prPts:5, compound:true },
  { canonical:"Hyperextensions 45°", aliases:["45 degree back extension","hyperextension","back extension 45"],
    primary:"lower back", secondary:["glutes","hamstrings"], equip:"bw-load", type:"isolation", tier:"ISO", prPts:3 },
  { canonical:"Crunches, Machine, Plate-Loaded", aliases:["weighted crunch","plate crunch","weighted crunches"],
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
// B-ARMPILL1 (2026-07-26) — the Change Exercise picker renders SIX pills and
// merges biceps+triceps into one ARMS pill, but GROUP_FILTERS only carried the
// seven-group homescreen model. browseMovementsByGroup("ARMS") therefore
// resolved to an empty primary set and the ARMS pill rendered a blank list.
// ARMS is now a first-class key and PICKER_GROUPS is the single source of
// truth for the picker — the three inline literal copies in AgentTrainer.jsx
// are gone, so the maps can no longer drift apart.
GROUP_FILTERS.ARMS = [
  ...new Set([...GROUP_FILTERS.BICEPS, ...GROUP_FILTERS.TRICEPS]),
];
export const PICKER_GROUPS = {
  CHEST:     GROUP_FILTERS.CHEST,
  BACK:      GROUP_FILTERS.BACK,
  SHOULDERS: GROUP_FILTERS.SHOULDERS,
  ARMS:      GROUP_FILTERS.ARMS,
  LEGS:      GROUP_FILTERS.LEGS,
  CORE:      GROUP_FILTERS.CORE,
};

// ── Step 6: duplicate consolidation ──
// Generic library entries that describe the SAME machine/movement as a
// runtime exercise are removed; their canonical + aliases fold into the
// runtime record so every search resolves to the single record that
// carries progression data. Distinct-equipment variants (e.g. cable
// Lat Pulldown vs plate-loaded) are intentionally NOT merged.
const CONSOLIDATE = {
  "Incline Press":           ["Incline Machine Press"],
  "Bench Press, Smith Machine": ["Bench Press, Smith Machine"],
  "HS Decline Press":           ["Hammer Strength Decline"],
  "Fly, Dumbbell":                    ["Fly, Dumbbell"],
  "Dip, Machine, Assisted":              ["Dip, Machine, Assisted"],
  "High Row, Machine, Plate-Loaded":                ["LF High Row"],
  "Lat Pulldown, Machine, Plate-Loaded":           ["Lat Pulldown, Machine, Plate-Loaded"],
  "Hyperextensions 45°":        ["Hyperextension 45°"],
  "Crunches, Machine, Plate-Loaded":          ["Crunches, Machine, Plate-Loaded"],
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

// ── B-EXSEARCH1 (2026-07-26) — muscle-aware, token-order-free search ──
// The previous matcher scored the WHOLE query string against canonical/alias
// text only. Three consequences, all reproduced from the field:
//   1. "Triceps" -> 0 hits. No canonical or alias contains the literal string
//      "triceps"; the singular "tricep" appears in several. Plural killed it.
//   2. "Triceps, Seated Dip Machine" -> 0 hits. Substring matching cannot skip
//      an interposed word, so it never reached "Dip, Machine, Plate-Loaded, Seated".
//   3. Muscle groups were not searchable at all — the DB carries primary /
//      secondary but nothing ever read them at query time.
// Replacement: tokenise, stem trailing plurals, match tokens in any order, and
// treat muscle words as a separate constraint dimension rather than name text.
const TOKENS = (t) => t.toLowerCase().split(/[^a-z0-9]+/i).filter(Boolean);
// Drop a trailing plural "s" on words of 4+ chars ("triceps"->"tricep",
// "curls"->"curl"). "-ss" is protected so "press" survives intact.
const STEM = (w) =>
  w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w;

// Query word -> the primary/secondary values it constrains to.
const MUSCLE_TERMS = {
  chest:["chest"], pec:["chest"], pecs:["chest"], pectoral:["chest"], pectorals:["chest"],
  back:["lats","mid back","lower back","traps"],
  lat:["lats"], lats:["lats"], trap:["traps"], traps:["traps"],
  shoulder:["front delts","side delts","rear delts"],
  shoulders:["front delts","side delts","rear delts"],
  delt:["front delts","side delts","rear delts"],
  delts:["front delts","side delts","rear delts"],
  deltoid:["front delts","side delts","rear delts"],
  arm:["biceps","triceps","forearms"], arms:["biceps","triceps","forearms"],
  bicep:["biceps"], biceps:["biceps"], brachialis:["biceps"],
  tricep:["triceps"], triceps:["triceps"],
  forearm:["forearms"], forearms:["forearms"], grip:["forearms"],
  leg:["quads","hamstrings","glutes","calves","hip flexors"],
  legs:["quads","hamstrings","glutes","calves","hip flexors"],
  quad:["quads"], quads:["quads"], quadricep:["quads"], quadriceps:["quads"],
  hamstring:["hamstrings"], hamstrings:["hamstrings"], ham:["hamstrings"], hams:["hamstrings"],
  glute:["glutes"], glutes:["glutes"],
  calf:["calves"], calves:["calves"],
  core:["abs","obliques","core"], ab:["abs"], abs:["abs"],
  oblique:["obliques"], obliques:["obliques"], neck:["neck"],
};
const musclesFor = (w) => MUSCLE_TERMS[w] || MUSCLE_TERMS[STEM(w)] || null;

export const searchMaster = (query, { group = null, limit = 60, db = getMasterDB() } = {}) => {
  const q = (query || "").toLowerCase().trim();
  const groupSet = group ? new Set(GROUP_FILTERS[group] || []) : null;
  const qTok = TOKENS(q);

  // Split the query into muscle constraints and name text.
  const muscleSet = new Set();
  const nameTok = [];
  for (const w of qTok) {
    const m = musclesFor(w);
    if (m) m.forEach((x) => muscleSet.add(x));
    else nameTok.push(w);
  }
  // A muscle word that is ALSO plausible name text (calf, back, neck) stays
  // eligible as name text too — handled by the all-token rule below.
  const qStems = qTok.map(STEM);
  const nameStems = nameTok.map(STEM);

  // How many of `want` are word-prefix present in candidate token list `have`.
  const coverage = (have, want) =>
    want.length === 0 ? 1 : want.filter((w) => have.some((h) => h.startsWith(w))).length / want.length;

  const scored = [];
  for (const e of db) {
    if (groupSet && !groupSet.has(e.primary)) continue;
    if (!q) { scored.push({ ...e, score: 0.5 }); continue; }

    const texts = [e.canonical.toLowerCase(), ...e.aliases.map((a) => a.toLowerCase())];
    const primHit = muscleSet.size > 0 && muscleSet.has(e.primary);
    const secHit  = muscleSet.size > 0 && (e.secondary || []).some((x) => muscleSet.has(x));

    let best = 0;
    for (const t of texts) {
      const tStems = TOKENS(t).map(STEM);
      let s = 0;
      if (t === q) s = 1.0;                                   // exact name
      else if (t.startsWith(q)) s = 0.95;                     // prefix
      else if (coverage(tStems, qStems) === 1) s = 0.90;      // all query words, any order
      else if (q.length >= 4 && t.includes(q)) s = 0.72;      // loose phrase
      if (s > best) best = s;

      if (muscleSet.size > 0 && (primHit || secHit)) {
        const cov = coverage(tStems, nameStems);
        let ms = 0;
        if (nameStems.length === 0) ms = primHit ? 0.80 : 0.62;        // pure muscle query
        else if (cov === 1)         ms = primHit ? 0.86 : 0.70;        // muscle + full name
        else if (cov >= 0.6)        ms = (primHit ? 0.62 : 0.60) + 0.12 * cov; // partial
        if (ms > best) best = ms;
      }
    }
    if (best >= 0.6) scored.push({ ...e, score: best });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.canonical.localeCompare(b.canonical))
    .slice(0, limit);
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
  // B-MVDEAD1 (2026-07-26): members below are the POST-consolidation canonicals.
  // Any name listed here that no longer exists in the master DB is dropped
  // silently by .filter(Boolean) — the variant just disappears from the picker.
  "Bench Press":       ["Bench Press, Barbell","Bench Press, Dumbbell","Bench Press, Smith Machine"],
  "Bicep Curl":        ["LF Bicep Curl","Bicep Curl, Machine"],
  "Calf Raise":        ["Calf Raise, Machine, Plate-Loaded, Seated","Calf Raise, Smith Machine"],
  "Curl (Free)":       ["Curl, Barbell","Curl, Dumbbell","Curl, Cable"],
  "Dip":               ["LF Seated Dip","Dip, Machine, Plate-Loaded, Seated","Dip, Machine, Assisted"],
  "Front Raise":       ["Front Raise","Front Raise, Cable"],
  "Good Morning":      ["Good Morning","Good Morning, Barbell, Seated"],
  "Hack Squat":        ["Hack Squat","Linear Hack Squat, Machine, Plate-Loaded"],
  "High Row":          ["High Row, Machine, Plate-Loaded","High Row, Cable"],
  "Lat Pulldown":      ["Lat Pulldown","Lat Pulldown, Machine, Plate-Loaded"],
  "Lateral Raise":     ["Lateral Raise, Dumbbell","Lateral Raise, Dumbbell, Seated","Lateral Raise, Cable","Lateral Raise, Machine"],
  "Overhead Extension":["Overhead Extension, Cable","Overhead Extension, Dumbbell"],
  "Pullover":          ["Pullover, Dumbbell","Pullover, Cable","Pullover, Machine"],
  "RDL":               ["RDL, Dumbbell","RDL, Barbell"],
  "Rear Delt Fly":     ["Rear Delt Fly","Rear Delt Fly, Cable"],
  "Row":               ["Row, Barbell","Row, Dumbbell","Row, Cable, Seated","LF Row","Lever Seated Row","Row, Smith Machine"],
  "Shrug":             ["Shrug, Barbell","Shrug, Dumbbell","Shrug, Machine"],
  "Upright Row":       ["Upright Row, Barbell","Upright Row, Dumbbell","Upright Row, Cable"],
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
        primary: h.primary || members[0]?.primary,
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
        primary: e.primary || members[0]?.primary,
        equips: members.map((x) => x.equip) });
    } else {
      out.push({ kind:"exercise", ...e });
    }
  }
  return out;
};
