import { useState, useEffect, useRef } from "react";
import { findDuplicate } from "./exerciseLibrary";
import { searchMaster, getMasterDB, PREWARM_PRIMARIES } from "./exerciseDB";

// ─────────────────────────────────────────────────────────────
// DURABLE SESSION STORAGE
// localStorage is the fast, synchronous path used for instant hydration, but
// iOS Safari can evict it after ~7 days of inactivity. IndexedDB is a more
// durable backstop, and navigator.storage.persist() (requested on mount) asks
// the browser to exempt our data from eviction entirely. We mirror the session
// to BOTH stores and recover from IDB if localStorage was wiped. Vanilla IDB —
// no dependency, keeps the bundle lean and the eventual RN port unencumbered.
// ─────────────────────────────────────────────────────────────
const IDB_NAME = "irongame";
const IDB_STORE = "kv";
function idbOpen(){
  return new Promise((resolve,reject)=>{
    try{
      if(typeof indexedDB==="undefined"){reject(new Error("no-idb"));return;}
      const req=indexedDB.open(IDB_NAME,1);
      req.onupgradeneeded=()=>{const db=req.result;
        if(!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    }catch(e){reject(e);}
  });
}
async function idbSet(key,val){
  try{const db=await idbOpen();
    await new Promise((res,rej)=>{const tx=db.transaction(IDB_STORE,"readwrite");
      tx.objectStore(IDB_STORE).put(val,key);tx.oncomplete=res;tx.onerror=()=>rej(tx.error);});
    db.close();
  }catch{}
}
async function idbGet(key){
  try{const db=await idbOpen();
    const val=await new Promise((res,rej)=>{const tx=db.transaction(IDB_STORE,"readonly");
      const r=tx.objectStore(IDB_STORE).get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});
    db.close();return val;
  }catch{return undefined;}
}
async function idbDel(key){
  try{const db=await idbOpen();
    await new Promise((res,rej)=>{const tx=db.transaction(IDB_STORE,"readwrite");
      tx.objectStore(IDB_STORE).delete(key);tx.oncomplete=res;tx.onerror=()=>rej(tx.error);});
    db.close();
  }catch{}
}

// ─────────────────────────────────────────────────────────────
// IRON GAME — Color System
// Rule: pure white for all critical text. #aaa minimum on dark.
// Cards must be visually distinct from page at arm's length.
// ─────────────────────────────────────────────────────────────
const C = {
  page:    "#0a0a0a",
  card:    "#202020",      // clearly lighter than page
  cardDk:  "#161616",
  inner:   "#121212",

  bdr:     "#444444",      // clearly visible borders
  bdrTop:  "#555555",      // top edge highlight (metal)

  // RED — the only accent. Vivid, unmistakable.
  red:     "#e8260a",
  redDk:   "#b01c06",
  redGlow: "rgba(232,38,10,0.5)",

  // TEXT — nothing below #aaaaaa on dark backgrounds
  wht:     "#ffffff",      // primary — 18:1 on card
  lt:      "#dddddd",      // secondary — 13:1 on card
  md:      "#aaaaaa",      // labels — 7:1 on card (AA pass)

  // STATUS
  grn:     "#22dd66",
  gld:     "#f5c000",
};

// Plate standard gym colors
const PC = { 45:"#1c4fd6", 25:"#138a30", 10:"#5a6678", 5:"#cc2200" };
const PLATES = [45, 25, 10, 5];

// Brushed metal card gradient
const STEEL = "linear-gradient(170deg,#282828 0%,#1c1c1c 55%,#202020 100%)";
const STEEL_SEL = "linear-gradient(170deg,#d42000 0%,#961600 55%,#aa1a00 100%)";

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@500;700;800;900&family=JetBrains+Mono:wght@700&display=swap');
  *,*::before,*::after { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
  html { background:#0a0a0a; }
  body { margin:0; overscroll-behavior:none; }
  #root {
    background-color:#0a0a0a;
    background-image:
      linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),
      linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px);
    background-size:32px 32px;
  }
  .t { cursor:pointer; border:none; transition:transform 0.09s ease,opacity 0.09s; }
  .t:active { transform:scale(0.91); opacity:0.85; }
  @keyframes pr {
    0%   { transform:translateY(-100%); }
    10%  { transform:translateY(0); }
    88%  { transform:translateY(0); }
    100% { transform:translateY(-100%); }
  }
  @keyframes pop {
    from { opacity:0; transform:translateY(12px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .pop { animation:pop 0.24s ease forwards; }
`;

// ─────────────────────────────────────────────────────────────
// ICONS — correct movement representations
//
// PUSH = Overhead barbell press (viewed from front)
//        Person pressing bar directly overhead — universal push movement
//
// PULL = Lat pulldown (viewed from front)
//        Seated person, bar overhead, arms pulling bar down to chest
//
// LEGS = Back squat (viewed from front)
//        Person with bar on back, knees bent wide — unmistakable squat
// ─────────────────────────────────────────────────────────────

// PUSH — Front view: overhead barbell press
// The upward direction of the bar + extended arms = pressing
// ─── SESSION TYPE ICONS — Iron Crest style (I-A baseline) ────
// Shield frame + barbell + directional arrow / squat stance

const IconPush = ({ sz = 48, col = "currentColor" }) => (
  <svg width={sz} height={sz} viewBox="0 0 60 60" fill="none"
    stroke={col} strokeLinecap="round" strokeLinejoin="round">
    {/* Shield */}
    <path d="M30 3 L56 13 L56 38 Q56 54 30 58 Q4 54 4 38 L4 13 Z" strokeWidth="2.8"/>
    <path d="M30 9 L50 17 L50 38 Q50 51 30 55 Q10 51 10 38 L10 17 Z" strokeWidth="1" opacity="0.25"/>
    {/* Barbell at base of shield */}
    <line x1="13" y1="49" x2="47" y2="49" strokeWidth="3.5"/>
    <rect x="9"  y="43" width="6"  height="13" rx="2" strokeWidth="2.5"/>
    <rect x="45" y="43" width="6"  height="13" rx="2" strokeWidth="2.5"/>
    {/* Large upward arrow — fills top 55% */}
    <line x1="30" y1="49" x2="30" y2="22" strokeWidth="4.5"/>
    <polyline points="22,31 30,20 38,31" strokeWidth="4" strokeLinejoin="miter" strokeLinecap="square"/>
  </svg>
);

const IconPull = ({ sz = 48, col = "currentColor" }) => (
  <svg width={sz} height={sz} viewBox="0 0 60 60" fill="none"
    stroke={col} strokeLinecap="round" strokeLinejoin="round">
    {/* Shield */}
    <path d="M30 3 L56 13 L56 38 Q56 54 30 58 Q4 54 4 38 L4 13 Z" strokeWidth="2.8"/>
    <path d="M30 9 L50 17 L50 38 Q50 51 30 55 Q10 51 10 38 L10 17 Z" strokeWidth="1" opacity="0.25"/>
    {/* Barbell at top of shield */}
    <line x1="13" y1="17" x2="47" y2="17" strokeWidth="3.5"/>
    <rect x="9"  y="11" width="6"  height="13" rx="2" strokeWidth="2.5"/>
    <rect x="45" y="11" width="6"  height="13" rx="2" strokeWidth="2.5"/>
    {/* Large downward arrow — fills bottom 55% */}
    <line x1="30" y1="17" x2="30" y2="44" strokeWidth="4.5"/>
    <polyline points="22,36 30,47 38,36" strokeWidth="4" strokeLinejoin="miter" strokeLinecap="square"/>
  </svg>
);

const IconLegs = ({ sz = 48, col = "currentColor" }) => (
  <svg width={sz} height={sz} viewBox="0 0 60 60" fill="none"
    stroke={col} strokeLinecap="round" strokeLinejoin="round">
    {/* Shield */}
    <path d="M30 3 L56 13 L56 38 Q56 54 30 58 Q4 54 4 38 L4 13 Z" strokeWidth="2.8"/>
    <path d="M30 9 L50 17 L50 38 Q50 51 30 55 Q10 51 10 38 L10 17 Z" strokeWidth="1" opacity="0.25"/>
    {/* Barbell on shoulders */}
    <line x1="13" y1="18" x2="47" y2="18" strokeWidth="3.5"/>
    <rect x="9"  y="12" width="6"  height="13" rx="2" strokeWidth="2.5"/>
    <rect x="45" y="12" width="6"  height="13" rx="2" strokeWidth="2.5"/>
    {/* Wide squat stance — thick diagonal thighs */}
    <line x1="27" y1="18" x2="13" y2="37" strokeWidth="4.5"/>
    <line x1="33" y1="18" x2="47" y2="37" strokeWidth="4.5"/>
    {/* Shins — near vertical */}
    <line x1="13" y1="37" x2="15" y2="52" strokeWidth="4"/>
    <line x1="47" y1="37" x2="45" y2="52" strokeWidth="4"/>
    {/* Filled knee joints — make the bend obvious */}
    <circle cx="13" cy="37" r="3.5" fill={col} stroke="none"/>
    <circle cx="47" cy="37" r="3.5" fill={col} stroke="none"/>
    {/* Feet */}
    <line x1="11" y1="53" x2="20" y2="53" strokeWidth="3"/>
    <line x1="40" y1="53" x2="49" y2="53" strokeWidth="3"/>
  </svg>
);

// CUSTOM — Shield + 2×2 grid: pick-your-own muscle groups
const IconCustom = ({ sz = 48, col = "currentColor" }) => (
  <svg width={sz} height={sz} viewBox="0 0 60 60" fill="none"
    stroke={col} strokeLinecap="round" strokeLinejoin="round">
    {/* Shield */}
    <path d="M30 3 L56 13 L56 38 Q56 54 30 58 Q4 54 4 38 L4 13 Z" strokeWidth="2.8"/>
    <path d="M30 9 L50 17 L50 38 Q50 51 30 55 Q10 51 10 38 L10 17 Z" strokeWidth="1" opacity="0.25"/>
    {/* 2×2 selector grid */}
    <rect x="16" y="17" width="12" height="12" rx="2.5" strokeWidth="3"/>
    <rect x="32" y="17" width="12" height="12" rx="2.5" strokeWidth="3"/>
    <rect x="16" y="33" width="12" height="12" rx="2.5" strokeWidth="3"/>
    {/* Fourth cell = plus (add your own mix) */}
    <line x1="38" y1="34" x2="38" y2="44" strokeWidth="3.5"/>
    <line x1="33" y1="39" x2="43" y2="39" strokeWidth="3.5"/>
  </svg>
);

const IClk = ({ s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14.5"/>
  </svg>
);
const IPlus = ({ s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IChk = ({ s = 14 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// VERSION — auto-stamped at build time via vite.config.js define
// Format: ALPHA-MM-DD-HH-MM (UTC build time)
// ─────────────────────────────────────────────────────────────
const _bt = new Date(typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : Date.now());
// Convert UTC → PST/PDT (UTC-7)
const _pst = new Date(_bt.getTime() - 7 * 60 * 60 * 1000);
const _mo  = String(_pst.getUTCMonth()+1).padStart(2,'0');
const _dy  = String(_pst.getUTCDate()).padStart(2,'0');
const _yr  = _pst.getUTCFullYear();
const _hr  = _pst.getUTCHours();
const _min = String(_pst.getUTCMinutes()).padStart(2,'0');
const _ampm= _hr >= 12 ? 'PM' : 'AM';
const _hr12= _hr % 12 || 12;
const BUILD_VERSION = `${_mo}/${_dy} · ${_hr12}:${_min}${_ampm}`;

// ─────────────────────────────────────────────────────────────
// USER PROFILE — used for kcal estimation and HR zone calibration.
// Adjust here when bodyweight / age change.
// ─────────────────────────────────────────────────────────────
const USER_PROFILE = { weightLb: 222, age: 56 };

// ─────────────────────────────────────────────────────────────
// HR ZONES — calibrated to user age (220 - age formula).
// All zone thresholds, Start HR suggestions, and CRD scoring
// derive from these values. Update USER_PROFILE.age to recalibrate.
// ─────────────────────────────────────────────────────────────
const MAX_HR = 220 - USER_PROFILE.age; // 164 for age 56
const HR_ZONES = [
  { label:"Recovery",  lo:0,                       hi:Math.round(MAX_HR*0.64), color:"#38bdf8" },
  { label:"Fat Burn",  lo:Math.round(MAX_HR*0.65), hi:Math.round(MAX_HR*0.74), color:"#22c55e" },
  { label:"Aerobic",   lo:Math.round(MAX_HR*0.75), hi:Math.round(MAX_HR*0.84), color:"#eab308" },
  { label:"Threshold", lo:Math.round(MAX_HR*0.85), hi:Math.round(MAX_HR*0.94), color:"#f97316" },
  { label:"Max Effort",lo:Math.round(MAX_HR*0.95), hi:999,                     color:"#e8260a" },
];
// Start HR — the HR to recover TO before beginning each set type.
const START_HR = {
  compound_p1: `${Math.round(MAX_HR*0.67)}–${Math.round(MAX_HR*0.72)}`,
  compound_p2: `${Math.round(MAX_HR*0.65)}–${Math.round(MAX_HR*0.70)}`,
  isolation:   `${Math.round(MAX_HR*0.58)}–${Math.round(MAX_HR*0.65)}`,
};
const getZone = (hr) => HR_ZONES.find(z => hr >= z.lo && hr <= z.hi) || HR_ZONES[0];

// ─────────────────────────────────────────────────────────────
// KCAL ESTIMATE — MET-based hybrid (Ainsworth Compendium 2011)
// Corrects Keytel over-estimation for resistance training with
// rest intervals. Uses LBM not total bodyweight (more accurate
// for muscular athletes). Adds 7% EPOC afterburn adjustment.
// Display as range ±15% to reflect estimation uncertainty.
// MET: >70% threshold sets = 6.5, >30% = 6.0, else = 5.5
// ─────────────────────────────────────────────────────────────
const LBM_LB = 196; // DEXA lean body mass — update after each scan
const kcalEstimate = ({ durationMin, totalSets, setsInThreshold }) => {
  const weightKg   = LBM_LB / 2.205;
  const threshFrac = totalSets > 0 ? setsInThreshold / totalSets : 0;
  const MET        = threshFrac > 0.7 ? 6.5 : threshFrac > 0.3 ? 6.0 : 5.5;
  const zMod       = 1.0 + (0.10 * threshFrac);
  const epoc       = 1.07;
  const total      = (MET * weightKg * 3.5 / 200) * durationMin * zMod * epoc;
  const margin     = Math.round(total * 0.15);
  return { est: Math.round(total), low: Math.round(total - margin), high: Math.round(total + margin) };
};
// Legacy single-value helper retained for any remaining callers
const kcalPerMin = (hr, weightKg, age) =>
  Math.max(0, (-55.0969 + 0.6309*hr + 0.1988*weightKg + 0.2017*age) / 4.184);

// ─────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────
const INIT_PRS = {
  "High Row PL":           { muscle:"back", weight:110,  reps:12 },  // PR set May 19 2026 · Life Fitness PL machine
  "LF Incline Press":      { muscle:"chest", weight:240,  reps:10 },
  "LF Shoulder Press":     { muscle:"shoulders", weight:255,  reps:7  },
  "Bench Press, Smith Machine": { muscle:"chest", weight:235, reps:8 },
  "Military Press PL Machine":  { muscle:"shoulders", weight:180, reps:8 },
  "Seated PL Dip Machine":       { muscle:"chest", weight:320, reps:10},
  "LF Seated Dip":         { muscle:"chest", weight:290,  reps:10 },
  "HS Decline Press":      { muscle:"chest", weight:90,   reps:9  },
  "Pec Deck":              { muscle:"chest", weight:230,  reps:12 },
  "Cable Pushdown":        { muscle:"triceps", weight:80,   reps:14 },
  "Seated Lateral Raise":  { muscle:"shoulders", weight:37.5, reps:15 },
  "Weighted Crunches":     { muscle:"abs", weight:120,  reps:6  },
  "Captain's Chair":       { muscle:"abs", weight:0,    reps:12, bw:true },
  "Barbell RDL":           { muscle:"hamstrings", weight:225,  reps:6  },
  "Lat Pull-Down PL": { muscle:"lats", weight:240,  reps:10 },
  "LF Row":                { muscle:"back", weight:240,  reps:10 },
  "Lever Seated Row":      { muscle:"back", weight:360,  reps:10 },
  "Assisted Chin-Up":      { muscle:"lats", weight:172,  reps:8  },
  "Hyperextensions 45°":   { muscle:"lower_back", weight:90,   reps:11 },
  "DB Alternating Curl":   { muscle:"biceps", weight:45,   reps:10 },
  "DB Hammer Curl":        { muscle:"biceps", weight:42.5, reps:12 },
  "LF Bicep Curl":         { muscle:"biceps", weight:90,   reps:10 },
  "Dead Hang":             { muscle:"lats", weight:0,    reps:37, bw:true, unit:"sec" },
  "Hip Thrust (Smith)":    { muscle:"hamstrings", weight:275,  reps:10 },
  "Seated Leg Curl":       { muscle:"hamstrings", weight:285,  reps:8  },
  "Linear Hack Squat PL":  { muscle:"quads", weight:230,  reps:10 },
  "Leg Extension":         { muscle:"quads", weight:260,  reps:10 },
  "Calf Press":            { muscle:"calves", weight:680,  reps:12 },
  "Calf Press, Linear Leg Press": { muscle:"calves", weight:630, reps:10 },
  "Seated Calf Raise":     { muscle:"calves", weight:180,  reps:7  },
  "DB Flys":               { muscle:"chest", weight:40,   reps:12 },
  "Assisted Dips":         { muscle:"chest", weight:100,  reps:10 },
  "Reverse Pec Deck":      { muscle:"rear_delts", weight:130, reps:12 },
};
// ── Equipment type registry ──────────────────────────────────
// Source of truth for how an exercise behaves: increment buttons, snap math,
// whether plate badges show, whether a bar weight floor applies.
// Every META entry MUST set `eq` to one of these keys.
const EQUIPMENT = {
  "plate-loaded": { steps:[5,10,25],  snap:5,   bilateral:true,  showPlates:true,  hasBar:false },
  "stack-pin":    { steps:[2.5,5,10],  snap:5,   bilateral:false, showPlates:false, hasBar:false },
  "dumbbell":     { steps:[2.5,5,10],  snap:2.5, bilateral:false, showPlates:false, hasBar:false },
  "barbell":      { steps:[5,10,25],  snap:5,   bilateral:true,  showPlates:true,  hasBar:true,  barWt:44 },
  "smith":        { steps:[5,10,25],  snap:5,   bilateral:true,  showPlates:true,  hasBar:false, barWt:20 },
  "bodyweight":   { steps:[],         snap:0,   bilateral:false, showPlates:false, hasBar:false },
  "bw-load":      { steps:[5,10,25],  snap:5,   bilateral:false, showPlates:true,  hasBar:false },
};
// Helper — fetch equipment config from a META entry. Defaults to plate-loaded if missing.
const eqOf = (m) => EQUIPMENT[m?.eq] || EQUIPMENT["plate-loaded"];
// Map a master-DB equip value to an EQUIPMENT key (cable/machine behave as stack).
const eqKeyFromDB = (equip) => EQUIPMENT[equip] ? equip
  : (equip==="cable"||equip==="machine") ? "stack-pin" : "plate-loaded";
// B-EQHEAL1: canonical name → EQUIPMENT key from the master DB. Lazy-built once.
let _EQ_BY_NAME = null;
const eqKeyForName = (name) => {
  if (!_EQ_BY_NAME) {
    _EQ_BY_NAME = {};
    for (const e of getMasterDB()) _EQ_BY_NAME[e.canonical] = eqKeyFromDB(e.equip);
  }
  return _EQ_BY_NAME[name];
};
// B-EQHEAL1: heal userMeta entries persisted before the eq field existed.
// A missing eq made library picks (e.g. Smith Machine Squat) fall back to
// plate-loaded — wrong panel label, no Smith bar weight, broken plate math.
const healUserMeta = (u) => {
  let dirty = false; const nu = { ...u };
  for (const k of Object.keys(nu)) {
    if (nu[k] && !nu[k].eq) {
      const eqk = eqKeyForName(k);
      if (eqk) { nu[k] = { ...nu[k], eq: eqk }; dirty = true; }
    }
  }
  return dirty ? nu : u;
};

const META = {
  "High Row PL":           { muscle:"back", tier:"P1", prPts:8, compound:true, eq:"plate-loaded", brand:"LF", brandFull:"Life Fitness" },
  "LF Incline Press":      { muscle:"chest", tier:"P1", prPts:8, compound:true, eq:"plate-loaded" },
  "LF Shoulder Press":     { muscle:"shoulders", tier:"P1", prPts:8, compound:true, eq:"plate-loaded" },
  "Bench Press, Smith Machine": { muscle:"chest", tier:"P1", prPts:8, compound:true, eq:"smith" },
  "Military Press PL Machine":  { muscle:"shoulders", tier:"P1", prPts:8, compound:true, eq:"plate-loaded" },
  "Seated PL Dip Machine":       { muscle:"chest", tier:"P1", prPts:8, compound:true, eq:"plate-loaded" },
  "LF Seated Dip":         { muscle:"chest", tier:"P2", prPts:5, compound:true, eq:"plate-loaded" },
  "HS Decline Press":      { muscle:"chest", tier:"P2", prPts:5, compound:true, eq:"plate-loaded", perSide:true },
  "Pec Deck":              { muscle:"chest", tier:"ISO",prPts:3, eq:"stack-pin" },
  "Cable Pushdown":        { muscle:"triceps", tier:"ISO",prPts:3, eq:"stack-pin" },
  "Seated Lateral Raise":  { muscle:"shoulders", tier:"ISO",prPts:3, eq:"dumbbell" },
  "Weighted Crunches":     { muscle:"abs", tier:"CORE",prPts:0, core:true, eq:"plate-loaded" },
  "Captain's Chair":       { muscle:"abs", tier:"CORE",prPts:0, core:true, eq:"bodyweight" },
  // maxPlate=25: 45 lb plates hit the floor during RDL range of motion
  "Barbell RDL":           { muscle:"hamstrings", tier:"P1", prPts:8, compound:true, eq:"barbell", maxPlate:25, priority:true },
  "Lat Pull-Down PL":      { muscle:"lats", tier:"P1", prPts:8, compound:true, eq:"plate-loaded" },
  "LF Row":                { muscle:"back", tier:"P2", prPts:5, compound:true, eq:"plate-loaded" },
  "Lever Seated Row":      { muscle:"back", tier:"P2", prPts:5, compound:true, eq:"plate-loaded" },
  "Assisted Chin-Up":      { muscle:"lats", tier:"P2", prPts:5, compound:true, eq:"stack-pin" },
  "Hyperextensions 45°":   { muscle:"lower_back", tier:"FND",prPts:0, eq:"bw-load", mandatory:true },
  "DB Alternating Curl":   { muscle:"biceps", tier:"ISO",prPts:3, eq:"dumbbell" },
  "DB Hammer Curl":        { muscle:"biceps", tier:"ISO",prPts:3, eq:"dumbbell" },
  "LF Bicep Curl":         { muscle:"biceps", tier:"ISO",prPts:3, eq:"dumbbell" },
  "Dead Hang":             { muscle:"lats", tier:"GRIP",prPts:0, eq:"bodyweight", mandatory:true },
  "Hip Thrust (Smith)":    { muscle:"hamstrings", tier:"P1", prPts:8, compound:true, eq:"smith", brand:"LF", brandFull:"Life Fitness Smith Machine" },
  "Seated Leg Curl":       { muscle:"hamstrings", tier:"P2", prPts:5, compound:true, eq:"stack-pin" },
  "Linear Hack Squat PL":  { muscle:"quads", tier:"P1", prPts:8, compound:true, eq:"plate-loaded" },
  "Leg Extension":         { muscle:"quads", tier:"ISO",prPts:3, eq:"stack-pin" },
  "Calf Press":            { muscle:"calves", tier:"ISO",prPts:3, eq:"plate-loaded" },
  "Calf Press, Linear Leg Press": { muscle:"calves", tier:"ISO",prPts:3, eq:"plate-loaded" },
  "Seated Calf Raise":     { muscle:"calves", tier:"ISO",prPts:3, eq:"plate-loaded" },
  "DB Flys":               { muscle:"chest", tier:"ISO",prPts:3, eq:"dumbbell" },
  "Assisted Dips":         { muscle:"chest", tier:"COMP",prPts:5, compound:true, eq:"stack-pin" },
  "Reverse Pec Deck":      { muscle:"rear_delts", tier:"ISO",prPts:3, eq:"stack-pin" },
};
// Category membership controls which exercises appear in pickers per session type.
// Exercises not listed appear under "Other" at the bottom of pickers.
const CATEGORY = {
  push: ["LF Incline Press","LF Shoulder Press","Bench Press, Smith Machine",
         "Military Press PL Machine","Seated PL Dip Machine","LF Seated Dip",
         "HS Decline Press","Pec Deck","Cable Pushdown","Seated Lateral Raise",
         "Weighted Crunches","DB Flys","Assisted Dips"],
  pull: ["Lat Pull-Down PL","High Row PL","LF Row","Lever Seated Row","Assisted Chin-Up",
         "DB Alternating Curl","DB Hammer Curl","LF Bicep Curl",
         "Hip Thrust (Smith)","Hyperextensions 45°","Dead Hang","Captain's Chair",
         "Reverse Pec Deck"],
  legs: ["Barbell RDL","Linear Hack Squat PL","Seated Leg Curl","Leg Extension",
         "Calf Press","Calf Press, Linear Leg Press","Seated Calf Raise","Hip Thrust (Smith)",
         "Hyperextensions 45°","Dead Hang"],
};
// Session type → primary muscles, used for the master-DB fallback below.
const SESSION_PRIMARIES = {
  push: new Set(["chest","front delts","side delts","rear delts","triceps"]),
  pull: new Set(["lats","mid back","lower back","traps","biceps","brachialis","forearms","grip","abs","obliques","core"]),
  legs: new Set(["quads","hamstrings","glutes","calves","hip flexors"]),
};
// F-CUSTOM1 — Custom session: user multi-selects muscle groups; the session
// composes from the curated META list (elbow-safe by construction).
// prims spans BOTH taxonomies: META muscle keys (underscored) + master-DB
// primaries (space-separated).
const MUSCLE_GROUPS = [
  {id:"chest",      label:"Chest",      prims:["chest"]},
  {id:"back",       label:"Back",       prims:["back","lats","lower_back","mid back","lower back","traps"]},
  {id:"shoulders",  label:"Shoulders",  prims:["shoulders","rear_delts","front delts","side delts","rear delts"]},
  {id:"biceps",     label:"Biceps",     prims:["biceps","brachialis","forearms"]},
  {id:"triceps",    label:"Triceps",    prims:["triceps"]},
  {id:"abs",        label:"Abs",        prims:["abs","obliques","core"]},
  {id:"quads",      label:"Quads",      prims:["quads","hip flexors"]},
  {id:"hamstrings", label:"Hamstrings", prims:["hamstrings"]},
  {id:"glutes",     label:"Glutes",     prims:["glutes"]},
  {id:"calves",     label:"Calves",     prims:["calves"]},
];
const groupPrimSet = (ids)=>new Set(
  MUSCLE_GROUPS.filter(g=>ids.includes(g.id)).flatMap(g=>g.prims));
// B-ORDER1 — muscle-group size ranking (signed off 2026-07-13).
// Custom session lists are presented largest muscle group first.
const SIZE_RANK = {quads:1, back:2, glutes:3, chest:4, hamstrings:5,
  shoulders:6, triceps:7, biceps:8, abs:9, calves:10};
const PRIM_TO_GROUP = {};
MUSCLE_GROUPS.forEach(g=>g.prims.forEach(pr=>{PRIM_TO_GROUP[pr]=g.id;}));
// F-HIST1 — session history helpers. History is keyed by LOCAL calendar day.
const histDateKey=(d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const histGroupLabels=(ids)=>MUSCLE_GROUPS.filter(g=>(ids||[]).includes(g.id)).map(g=>g.label).join(" & ");
const exSizeRank = (name)=>{
  const gid = PRIM_TO_GROUP[(META[name]||{}).muscle];
  return SIZE_RANK[gid] ?? 99;
};
// Curated exercises matching the selected groups — compounds first.
function customCandidates(ids){
  const prim = groupPrimSet(ids||[]);
  return Object.keys(META)
    .filter(n=>prim.has(META[n].muscle))
    .sort((a,b)=>(META[a].compound?0:1)-(META[b].compound?0:1));
}
// Round-robin across selected groups: one exercise per group per pass
// (compounds surface first within each group), until the exercise cap.
// Compound-first sort within group; pick order does NOT drive ordering
// beyond the round-robin fairness (locked 2026-07: compound-first).
function buildCustomList(ids, ext){
  const cap = ext?6:5;
  const perGroup = (ids||[]).map(id=>customCandidates([id]));
  const out=[]; const used=new Set();
  for(let pass=0; out.length<cap && pass<4; pass++){
    for(const list of perGroup){
      if(out.length>=cap) break;
      const next=list.find(n=>!used.has(n));
      if(next){
        used.add(next);
        const c=META[next].compound;
        out.push({name:next, sets:c?4:3,
          repRange:c?"6\u201310":"10\u201315", targetReps:c?8:12});
      }
    }
  }
  // B-ORDER1: round-robin guarantees per-group coverage; presentation
  // order is largest muscle group first (stable sort keeps compound-first).
  return out.map((e,i)=>[e,i])
    .sort((a,b)=>(exSizeRank(a[0].name)-exSizeRank(b[0].name))||(a[1]-b[1]))
    .map(x=>x[0]);
}
// Returns exercises for this session type first, then unrelated ones under "Other".
// Browse-list fallback fix: entries WITHOUT PR history are no longer hidden.
// Curated CATEGORY names always render (PR'd first), then master-DB exercises
// whose primary muscle matches the session type — so new/custom exercises are
// visible in browse view even before their first logged set.
function exListForType(type, prs, groups){
  const cat = type==="custom" ? customCandidates(groups) : (CATEGORY[type]||[]);
  const catSet = new Set(cat);
  const prim = type==="custom" ? groupPrimSet(groups||[]) : SESSION_PRIMARIES[type];
  const dbExtra = prim
    ? getMasterDB()
        .filter(e=>!catSet.has(e.canonical)&&prim.has(e.primary))
        .map(e=>e.canonical)
    : [];
  const byPrFirst = (list)=>[...list.filter(n=>prs[n]),...list.filter(n=>!prs[n])];
  const inCat  = [...byPrFirst(cat), ...byPrFirst(dbExtra)];
  const dbSet  = new Set(dbExtra);
  const outCat = Object.keys(prs).filter(n=>!catSet.has(n)&&!dbSet.has(n));
  return {inCat, outCat};
}
// Name → primary muscle lookup (exercise library, used by picker filter)
const EX_PRIMARY = Object.fromEntries(
  getMasterDB().map(e=>[e.canonical, e.primary])
);
const TMPLS = {
  push:[
    {name:"LF Incline Press",     sets:4,repRange:"8–10", targetReps:10, alts:["Bench Press, Smith Machine","HS Decline Press"]},
    {name:"LF Shoulder Press",    sets:4,repRange:"6–8",  targetReps:8 , alts:["Military Press PL Machine","Seated PL Dip Machine"]},
    {name:"LF Seated Dip",        sets:3,repRange:"8–10", targetReps:10, alts:["Cable Pushdown","Seated PL Dip Machine"]},
    {name:"Seated Lateral Raise", sets:3,repRange:"12–15",targetReps:15, alts:["Pec Deck"]},
    {name:"Weighted Crunches",    sets:3,repRange:"8–10", targetReps:10, alts:["Captain's Chair"]},
  ],
  pull:[
    {name:"Lat Pull-Down PL",    sets:4,repRange:"8–10", targetReps:10,priority:true, alts:["Assisted Chin-Up","High Row PL"]},
    {name:"High Row PL",        sets:4,repRange:"10–12",targetReps:12, alts:["LF Row","Lever Seated Row"]},
    {name:"LF Row",             sets:3,repRange:"8–10", targetReps:10, alts:["Lever Seated Row","High Row PL"]},
    {name:"DB Alternating Curl",sets:3,repRange:"10–12",targetReps:12, alts:["DB Hammer Curl","LF Bicep Curl"]},
    {name:"Captain's Chair",    sets:3,repRange:"10–12",targetReps:12, alts:["Weighted Crunches"]},
    {name:"Hyperextensions 45°",sets:2,repRange:"10–12",targetReps:12,mandatory:true},
    {name:"Dead Hang",          sets:2,repRange:"max",  targetReps:37,unit:"sec",mandatory:true},
  ],
  legs:[
    {name:"Barbell RDL",          sets:4,repRange:"6–8",  targetReps:8, barbellCheck:true,priority:true, alts:["Hip Thrust (Smith)","Seated Leg Curl"]},
    {name:"Linear Hack Squat PL", sets:4,repRange:"8–10", targetReps:10, alts:["Leg Extension"]},
    {name:"Seated Leg Curl",      sets:3,repRange:"6–8",  targetReps:8 , alts:["Hip Thrust (Smith)"]},
    {name:"Leg Extension",        sets:3,repRange:"8–10", targetReps:10, alts:["Linear Hack Squat PL"]},
    {name:"Calf Press",           sets:3,repRange:"10–12",targetReps:12, alts:["Calf Press, Linear Leg Press","Seated Calf Raise"]},
    {name:"Hyperextensions 45°",  sets:2,repRange:"10–12",targetReps:12,mandatory:true},
  ],
};
const PREV={
  push:{muscles:"Chest · Shoulders · Triceps",opens:"LF Incline Press",note:"Elbow-safe pressing only. No barbell flat or incline bench."},
  pull:{muscles:"Back · Biceps · Rear Delts",opens:"Lat Pull-Down PL",note:"Dead hang mandatory every session."},
  legs:{muscles:"Quads · Hamstrings · Glutes · Calves",opens:"Barbell RDL → Linear Hack Squat PL",note:"Hip hinge priority. Hyperextensions mandatory every session."},
};

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────
// F-PLATES1 — absolute plate breakdown of the TOTAL load currently on the
// implement. Counts are TOTAL across both sides. Computed per-side greedy
// then doubled so every suggestion is physically loadable in pairs.
// barWt subtracted first (Olympic bar 45; machines 0).
function plateBreakdown(total, barWt, bilateral, maxPlate=45) {
  const loadable = total - barWt;
  if (loadable < 4.99) return [];
  const perSide = bilateral ? loadable/2 : loadable;
  let rem = perSide;
  const sizes = PLATES.filter(p => p <= maxPlate);
  const counts = {};
  for (const p of sizes) while (rem >= p-0.01) { counts[p]=(counts[p]||0)+1; rem-=p; }
  const mult = bilateral ? 2 : 1;
  const out = sizes.filter(p=>counts[p]).map(p=>({plate:p, count:counts[p]*mult}));
  // B-PLREM1: phantom-weight remainder (B-SNAP1 Option A allows totals not
  // decomposable into plate pairs, e.g. 25 bilateral = 12.5/side). Previously
  // dropped silently, so chips didn't sum to the displayed total. Surface it
  // as a dim "+N" row so plates + bar + remainder always equal the total.
  if (rem > 0.01) out.push({ plate: Math.round(rem*mult*10)/10, count: 0, rem: true });
  return out;
}
function calcPlates(target, from, bilateral, maxPlate=45) {
  const diff = target - from;
  if (Math.abs(diff) < 2.5) return { plates:[], action:"none" };
  let rem = bilateral ? Math.abs(diff)/2 : Math.abs(diff);
  const plates = [];
  // Only use plates up to maxPlate (e.g. RDL caps at 25 lb to preserve range of motion)
  const sizes = PLATES.filter(p => p <= maxPlate);
  for (const p of sizes) while(rem >= p-0.01) { plates.push(p); rem -= p; }
  return { plates, action: diff>0?"add":"remove", bilateral };
}
// Generates "Loaded: 2×45 + 2×25 + 2×10 = 160" from adjWt + fromWt
// Removed 2026-05-24: visible plate badges replaced this text breakdown.

// B-NEWDEF1: plates the straight barbell preloads for a brand-new exercise
// (no PR history). Bar 44 + 25/side = 94 lb — the stated usual starting load.
// Single tunable point. Other bar gear (Smith) floors at the bar only; non-bar
// loaded gear opens at 0 and is remembered thereafter via ig_openwt.
const BARBELL_OPEN_PLATES = 25; // lb per side

function suggestW(name,si,lw,lr,prs,ow,meta){
  const M  = meta || META[name] || {};
  const pr = prs[name];
  if(pr&&pr.bw) return 0;               // bodyweight PR → no external load
  const eqM = eqOf(M);
  const bar = eqM.barWt||0;             // 44 barbell, 20 Smith, 0 machines
  // Opener default when this exercise has no PR history on THIS device.
  // A loaded lift must never open at 0. Barbell = bar + 25/side; any other bar
  // lift floors at the bar; non-bar loaded gear stays 0 (no universal floor).
  const newDef = bar + (M.eq==="barbell" ? BARBELL_OPEN_PLATES*2 : 0);
  // Set 1: open with a sane load, NOT last session's working max.
  if(si===0){
    if(lw&&lw>0) return lw;                            // adjusted this session
    if(ow && ow[name]!==undefined) return ow[name];   // last session's opener (0 valid)
    if(!pr) return newDef;                            // brand-new → equipment default
    // Has PR: warm-up ~50% of last weight, snapped, never below the bar.
    const snap = M.snap || eqM.snap || 5;
    const warm = Math.round((pr.weight*0.5)/snap)*snap;
    return Math.max(warm, bar);
  }
  // Set 2+: progress from last working set. With a PR, cap against it; without
  // one, progress off the logged set (no PR-relative cap to distort it).
  if(!lw) return pr ? pr.weight : newDef;
  const ceil   = pr ? pr.weight*1.08 : lw+5;
  const floorW = pr ? pr.weight*0.75 : lw-10;
  if(lr==="exceeded")   return Math.round(Math.min(lw+5, ceil)/5)*5;
  if(lr==="fell_short") return Math.round(Math.max(lw-10, floorW)/5)*5;
  return lw;
}
function calcScore(log,prs,ext){
  const wlog = log;

  // MUS scoring model (max 45):
  //   • Stimulus volume (max 27)  — sum of tier weight per non-failed working set.
  //                                 P1 compound = 3 pts/set, P2 compound = 2, ISO = 1.
  //                                 Replaces the old arbitrary prPts "PR bonus" which
  //                                 fired once per exercise — now every set earns
  //                                 stimulus credit proportional to muscle mass recruited.
  //   • Quality (max 13)          — (matched + exceeded sets) / total sets × 13.
  //                                 Rewards hitting rep range, not just showing up.
  //   • Core bonus (5)            — flat add if a core movement was logged.
  const TIER_STIM = { P1:3, P2:2, ISO:1, CORE:1, FND:0.5, GRIP:0.5 };
  let stim = 0, ov = 0, core = false, hang = false, hyp = false;
  wlog.forEach(s=>{
    const m = META[s.exercise] || {};
    if (m.core) core = true;
    if (s.exercise === "Dead Hang") hang = true;
    if (s.exercise === "Hyperextensions 45°") hyp = true;
    // Non-failed sets contribute stimulus weight by tier.
    if (s.result !== "fell_short") {
      stim += TIER_STIM[m.tier] ?? 1;
    }
    if (s.result === "matched" || s.result === "exceeded") ov++;
  });
  const n  = wlog.length;
  const ts = ext ? 20 : 17;
  const stimPts = Math.min(27, Math.round(stim));
  const qualPts = n > 0 ? Math.min(13, Math.round((ov/n)*13)) : 0;
  const corePts = core ? 5 : 0;
  const mp = Math.min(45, stimPts + qualPts + corePts);

  // CAL — set-count proxy until iCardio kcal data lands at session end.
  const cp = Math.min(25, Math.round((n/ts)*25));

  // CRD — based on actual PHR zone quality, not set count.
  // Z3+ (Aerobic/Threshold/Max) = full points. Z2 = partial. Z1 = minimal.
  // Include all PHRs since they reflect real cardiovascular load.
  const phrs=log.filter(s=>s.phr>0).map(s=>s.phr);
  let cv=0;
  if(phrs.length>0){
    const z3lo=Math.round(MAX_HR*0.75);
    const z4lo=Math.round(MAX_HR*0.85);
    const z2lo=Math.round(MAX_HR*0.65);
    const zoneScores=phrs.map(hr=>{
      if(hr>=z4lo) return 15;       // Threshold or Max — peak CRD
      if(hr>=z3lo) return 12;       // Aerobic
      if(hr>=z2lo) return 7;        // Fat Burn
      return 3;                      // Recovery
    });
    cv=Math.min(15,Math.round(zoneScores.reduce((a,b)=>a+b,0)/zoneScores.length));
  } else {
    cv=Math.min(10,Math.round((n/ts)*10)); // fallback if no HR logged
  }

  let fp=0; if(hang) fp+=8; if(hyp) fp+=7;
  if(!fp) fp=Math.min(15,Math.round((n/ts)*15));
  return {total:Math.min(100,mp+cp+cv+fp),muscle:mp,cal:cp,cv,found:fp};
}

// ─────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────

// Section label — bright enough to read from distance
const SL=({children,color})=>(
  <div style={{fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:12,
    color:color||C.md,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:10}}>
    {children}
  </div>
);

// Divider line — red left fade
const Div=()=>(
  <div style={{height:2,
    background:`linear-gradient(90deg,${C.red} 0%,${C.bdr} 40%,transparent 100%)`,
    marginBottom:8}}/>
);

// Primary red action button
const RedBtn=({onClick,disabled,children,h=66})=>(
  <button className="t" onClick={onClick} disabled={disabled} style={{
    width:"100%",height:h,border:"none",borderRadius:10,
    cursor:disabled?"not-allowed":"pointer",
    background:disabled?"#252525":`linear-gradient(170deg,${C.red} 0%,${C.redDk} 100%)`,
    color:"#fff",
    fontFamily:"'Bebas Neue',sans-serif",fontSize:26,letterSpacing:"0.14em",
    boxShadow:disabled?"none":`0 0 36px ${C.redGlow},0 4px 20px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.14)`,
    opacity:disabled?0.42:1,
    display:"flex",alignItems:"center",justifyContent:"center",
    borderTop:disabled?"1px solid #333":`1px solid #ff5533`,
  }}>{children}</button>
);

// Session type selector card
function TypeCard({type,label,muscles,Icon,selected,onClick,compact}){
  const on=selected===type;
  return(
    <button className="t" onClick={()=>onClick(type)} style={{
      flex:1,borderRadius:12,padding:compact?"14px 6px 12px":"16px 6px 14px",cursor:"pointer",
      background:on?STEEL_SEL:STEEL,
      border:`1px solid ${on?C.red:C.bdr}`,
      borderTop:`1px solid ${on?"#f03010":C.bdrTop}`,
      boxShadow:on
        ?`0 0 0 1px ${C.red},0 6px 28px ${C.redGlow},inset 0 1px 0 rgba(255,255,255,0.1)`
        :`0 4px 16px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.05)`,
      display:"flex",flexDirection:"column",alignItems:"center",gap:10,
      position:"relative",
    }}>
      {on&&(
        <div style={{position:"absolute",top:8,right:8,color:"#fff",
          background:"rgba(255,255,255,0.18)",borderRadius:"50%",
          width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <IChk s={12}/>
        </div>
      )}
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:21,
        letterSpacing:"0.12em",lineHeight:1,color:C.wht}}>{label}</div>
      {/* Muscle groups — hidden in compact mode (Custom selected) */}
      {!compact&&(
      <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:10,
        lineHeight:1.35,color:on?"rgba(255,255,255,0.88)":C.lt,
        textAlign:"center",textTransform:"uppercase",letterSpacing:"0.07em"}}>
        {muscles}
      </div>)}
    </button>
  );
}

// Format card (Standard / Extended)
function FmtCard({label,sub,Icon,val,selected,onClick}){
  const on=selected===val;
  return(
    <button className="t" onClick={()=>onClick(val)} style={{
      flex:1,height:74,borderRadius:12,padding:"0 16px",cursor:"pointer",
      background:on?STEEL_SEL:STEEL,
      border:`1px solid ${on?C.red:C.bdr}`,
      borderTop:`1px solid ${on?"#f03010":C.bdrTop}`,
      boxShadow:on
        ?`0 0 0 1px ${C.red},0 4px 20px ${C.redGlow}`
        :`0 3px 12px rgba(0,0,0,0.45),inset 0 1px 0 rgba(255,255,255,0.05)`,
      display:"flex",flexDirection:"column",alignItems:"flex-start",justifyContent:"center",gap:5,
    }}>
      <div style={{display:"flex",alignItems:"center",gap:9}}>
        <span style={{color:on?"#fff":C.md}}><Icon s={16}/></span>
        <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:19,
          letterSpacing:"0.1em",color:C.wht}}>{label}</span>
        {on&&<span style={{color:"#fff",marginLeft:4}}><IChk s={12}/></span>}
      </div>
      <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,
        color:on?"rgba(255,255,255,0.82)":C.lt,   // bright enough to read
        paddingLeft:25,textTransform:"uppercase",letterSpacing:"0.06em"}}>
        {sub}
      </div>
    </button>
  );
}

// Session preview card
function Preview({type, extended, opener, onPickOpener, list, customMuscles, onEdit, edited}){
  const isCustom = type==="custom";
  const p = isCustom
    ? {muscles: customMuscles, opens: list?.[0]?.name || "—"}
    : PREV[type];
  const n = list?.length||0;
  const dur = n===5?"65 MIN":n===6?"70–75 MIN":`~${Math.max(20, n*13)} MIN`;
  return(
    /* F-PREVIEW3: outer card shell removed — after F-PREVIEW2 reduced the card
       to the edit button only, the wrapper's border + red accent read as a
       double outline. Button now renders bare, matching sibling buttons. */
    <button className="t pop" onClick={onEdit} style={{
      width:"100%",marginTop:0,height:44,borderRadius:9,cursor:"pointer",
      background:"rgba(255,255,255,0.06)",
      border:`1px solid ${edited?C.red:C.bdr}`,
      fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:12,
      color:edited?C.red:C.lt,letterSpacing:"0.14em",textTransform:"uppercase",
      display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
      {edited?"Session Edited · Review":"Preview & Edit Exercises"}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// PRE-LOADED SESSION — May 22 2026 · Pull Day
// Starting fresh at LF Lat Pulldown Set 1.
// ─────────────────────────────────────────────────────────────
const SESSION_LOG = [
  {exercise:"Lat Pull-Down PL", setNum:1, weight:0,   reps:0,  result:"matched"},
  {exercise:"Lat Pull-Down PL", setNum:2, weight:200, reps:10, result:"matched", phr:130},
  {exercise:"Lat Pull-Down PL", setNum:3, weight:160, reps:10, result:"matched", phr:150},
  {exercise:"Lat Pull-Down PL", setNum:4, weight:140, reps:10, result:"matched", phr:147},
  {exercise:"LF Row", setNum:1, weight:205, reps:10, result:"matched"},
  {exercise:"LF Row", setNum:2, weight:220, reps:10, result:"matched"},
  {exercise:"LF Row", setNum:3, weight:210, reps:10, result:"matched"},
  {exercise:"Calf Press, Linear Leg Press", setNum:1, weight:360, reps:0,  result:"matched", phr:132},
  {exercise:"Calf Press, Linear Leg Press", setNum:2, weight:450, reps:0,  result:"matched", phr:120},
  {exercise:"Calf Press, Linear Leg Press", setNum:3, weight:540, reps:10, result:"matched"},
  {exercise:"Calf Press, Linear Leg Press", setNum:4, weight:540, reps:12, result:"exceeded", phr:120},
  {exercise:"Calf Press, Linear Leg Press", setNum:5, weight:630, reps:10, result:"matched"},
];
const SESSION_EXLIST = [
  {name:"Lat Pull-Down PL",    sets:4, repRange:"8–10",  targetReps:10, priority:true},
  {name:"High Row PL",        sets:4, repRange:"10–12", targetReps:12},
  {name:"LF Row",             sets:3, repRange:"8–10",  targetReps:10},
  {name:"Calf Press, Linear Leg Press", sets:5, repRange:"10–15", targetReps:12, bilateral:true},
  {name:"DB Alternating Curl",sets:3, repRange:"10–12", targetReps:12},
  {name:"Captain's Chair",   sets:3, repRange:"10–12", targetReps:12},
];

// ─────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────
export default function IronGame(){
  // PERSIST1 — hydrate session state from localStorage on mount
  const _saved = (() => {
    try { const s = localStorage.getItem('ig_session'); return s ? JSON.parse(s) : null; }
    catch { return null; }
  })();

  const [screen,    setScreen]    = useState("setup");
  const [sesType,   setSesType]   = useState(()=> _saved?.sesType   ?? null);
  const [showResume, setShowResume] = useState(()=> !!(_saved?.sesType && (_saved?.log?.length > 0 || _saved?.exIdx > 0)));
  const [ext,       setExt]       = useState(false);
  const [tcMode,    setTcMode]    = useState(false);
  const [depTime,   setDepTime]   = useState(()=>{const d=new Date(Date.now()+60*60000);return`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;});
  const [exList,    setExList]    = useState(()=> _saved?.exList    ?? []);
  const [exIdx,     setExIdx]     = useState(()=> _saved?.exIdx     ?? 0);
  const [setIdx,    setSetIdx]    = useState(()=> _saved?.setIdx    ?? 0);
  const [phase,     setPhase]     = useState("ready");
  const [prs,       setPrs]       = useState(()=> _saved?.prs       ?? INIT_PRS);
  // F-LASTW1 — per-exercise opening weight from the LAST session (cross-session).
  // Set 1 default = the weight the user started this exercise with last time.
  const [openWt,    setOpenWt]    = useState(()=>{
    try{const v=localStorage.getItem('ig_openwt');return v?JSON.parse(v):{};}catch{return{};}
  });
  const [log,       setLog]       = useState(()=> _saved?.log       ?? []);
  const [lastRes,   setLastRes]   = useState(()=> _saved?.lastRes   ?? null);
  const [lastWt,    setLastWt]    = useState(()=> _saved?.lastWt    ?? null);
  const [prFlash,   setPrFlash]   = useState(null);
  const [wConf,     setWConf]     = useState(null);
  const [weightAdj, setWeightAdj] = useState(0);
  const [tick,      setTick]      = useState(0);
  const [sessionStart, setSessionStart] = useState(()=> _saved?.sessionStart ?? null);
  const [sessionEnd,   setSessionEnd]   = useState(null);
  const [sessionDate,  setSessionDate]  = useState(()=> _saved?.sessionDate  ?? null);
  const [phrInput,      setPhrInput]      = useState(130);
  const [pendingResult, setPendingResult] = useState(null);
  const [showExPicker,  setShowExPicker]  = useState(false);
  const [showNewExForm, setShowNewExForm] = useState(false);
  const [newExName,     setNewExName]     = useState("");
  const [newExWeight,   setNewExWeight]   = useState("");
  const [newExReps,     setNewExReps]     = useState("10");
  const [newExMaxWt,    setNewExMaxWt]    = useState("");   // gym ceiling — max available weight
  const [newExDuplicate,setNewExDuplicate]= useState(null);
  const [newExPicked,   setNewExPicked]   = useState(false); // true after user selects from dropdown
  const [showBrandInfo, setShowBrandInfo] = useState(false); // brand tooltip for LF etc. // {name, score} when fuzzy match found
  const [customOpener,  setCustomOpener]  = useState(null);
  // F-CUSTOM1 — selected muscle groups for the Custom session type
  const [customGroups,  setCustomGroups]  = useState(()=> _saved?.customGroups ?? []);
  // F-HIST1 — per-calendar-day session history (survives session lifecycle).
  // Shape: { "YYYY-MM-DD": {status:'logged'|'recovery', groups:[gid], sesType?,
  //          exercises?:[{name, sets:[{w,r}]}], source:'auto'|'backfill'} }
  const [hist, setHist] = useState(()=>{
    try{const v=localStorage.getItem('ig_history');return v?JSON.parse(v):{};}catch{return{};}
  });
  const [histExpanded, setHistExpanded] = useState(null); // dateKey | null
  const [histOpen, setHistOpen] = useState(false); // F-HISTCOLLAPSE: Last-4-Days minimized by default
  const [histEdit,     setHistEdit]     = useState(null); // dateKey | null
  const [histEditGroups, setHistEditGroups] = useState([]);
  const [histEditExs,    setHistEditExs]    = useState([]); // [{name, sets:[{w,r}]}]
  const [histShowExAdd,  setHistShowExAdd]  = useState(false);
  const [showOpenerPicker, setShowOpenerPicker] = useState(false);
  // F-PREVIEW1 — session editor: draftList overrides the auto-built session.
  // null = auto (build() at launch). Invalidated on type/group/opener change.
  const [draftList, setDraftList] = useState(null);
  const [showSessionEditor, setShowSessionEditor] = useState(false);
  const [editorPick, setEditorPick] = useState(null); // null | slot index | "add"
  const [exSearch,         setExSearch]         = useState("");
  const [exFilter,         setExFilter]         = useState("");

  // ── Music player state ────────────────────────────────────
  // repInput: the stepper value on the logging screen. null = use adaptedTarget as default.
  const [repInput, setRepInput] = useState(null);
  // userMeta: META overrides for user-added exercises. Keyed by exercise name.
  // Each entry can supply { eq, compound, ... } to drive equipment behavior.
  const [userMeta, setUserMeta] = useState(()=> healUserMeta(_saved?.userMeta ?? {}));
  // newExEq: equipment type chosen on the New Exercise form.
  const [newExEq, setNewExEq] = useState("plate-loaded");

  // Live timer — ticks every second
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Ask the browser to make our storage durable (exempt from eviction). Best-effort.
  useEffect(()=>{
    try{ navigator.storage?.persist?.(); }catch{}
  },[]);

  // Recover from IndexedDB if localStorage was evicted but the durable mirror
  // survived. Runs once on mount; only acts when no session was hydrated from
  // localStorage. Re-seeds localStorage and surfaces the Resume modal.
  useEffect(()=>{
    if(_saved) return;                    // localStorage already gave us a session
    let cancelled=false;
    (async()=>{
      const raw=await idbGet("ig_session");
      if(cancelled||!raw) return;
      let d; try{ d=JSON.parse(raw); }catch{ return; }
      if(!d||!d.sesType) return;
      const hasProgress=(d.log?.length>0)||(d.exIdx>0);
      if(!hasProgress) return;
      setSesType(d.sesType); setExList(d.exList??[]);
      setExIdx(d.exIdx??0); setSetIdx(d.setIdx??0);
      setPrs(d.prs??INIT_PRS); setLog(d.log??[]);
      setLastRes(d.lastRes??null); setLastWt(d.lastWt??null);
      setSessionStart(d.sessionStart??null); setSessionDate(d.sessionDate??null);
      setUserMeta(healUserMeta(d.userMeta??{}));
      try{ localStorage.setItem("ig_session", raw); }catch{}
      setShowResume(true);
    })();
    return ()=>{ cancelled=true; };
  },[]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-reload when a new service worker takes control (e.g. selfDestroying SW)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.replace(window.location.pathname + '?v=' + Date.now());
      });
      navigator.serviceWorker.addEventListener('message', e => {
        if (e.data && e.data.type === 'SW_RELOAD') {
          window.location.replace(window.location.pathname + '?v=' + Date.now());
        }
      });
    }
  }, []);

  // Derive ext (5 vs 6 exercises) from time-constrained mode + departure time
  useEffect(()=>{
    if(!tcMode){setExt(false);return;}
    const[h,m]=depTime.split(':').map(Number);
    const dep=new Date();dep.setHours(h,m,0,0);
    const avail=Math.max(0,Math.round((dep-Date.now())/60000));
    setExt(avail>=65);
  },[tcMode,depTime]);

  // Reset rep stepper to default (adaptedTarget) whenever we land on the ready phase
  // or move to a different set/exercise. Avoids stale stepper values between sets.
  useEffect(() => {
    if (phase === "ready") setRepInput(null);
  }, [phase, exIdx, setIdx]);



  // F-LASTW1 — persist opening-weight map (independent of session lifecycle;
  // survives session completion and "Start Fresh"). localStorage + IDB mirror.
  useEffect(()=>{
    if(Object.keys(openWt).length===0) return;
    const raw=JSON.stringify(openWt);
    try{ localStorage.setItem('ig_openwt', raw); }catch{}
    idbSet('ig_openwt', raw);
  },[openWt]);
  useEffect(()=>{                       // recover from IDB if localStorage evicted
    if(Object.keys(openWt).length>0) return;
    (async()=>{
      const raw=await idbGet('ig_openwt');
      if(!raw) return;
      try{
        const d=JSON.parse(raw);
        if(d&&Object.keys(d).length>0){
          setOpenWt(d);
          try{ localStorage.setItem('ig_openwt', raw); }catch{}
        }
      }catch{}
    })();
  },[]); // mount only

  // F-HIST1 — persist history map (localStorage + IDB mirror) and recover from IDB.
  // histTouched: user mutated hist this session — from then on, persist even an
  // empty map so deletions stick (previously the empty-map guard resurrected
  // cleared entries on reload).
  const histTouched=useRef(false);
  useEffect(()=>{
    if(Object.keys(hist).length===0&&!histTouched.current) return;
    histTouched.current=true;
    const raw=JSON.stringify(hist);
    try{ localStorage.setItem('ig_history', raw); }catch{}
    idbSet('ig_history', raw);
  },[hist]);
  useEffect(()=>{                       // recover from IDB if localStorage evicted
    if(Object.keys(hist).length>0) return;
    (async()=>{
      const raw=await idbGet('ig_history');
      if(!raw) return;
      try{
        const d=JSON.parse(raw);
        if(d&&Object.keys(d).length>0){
          // Merge-safe: never clobber entries the user added while idbGet was
          // in flight; live edits win over the recovered mirror.
          setHist(h=>(histTouched.current?{...d,...h}:d));
          try{ localStorage.setItem('ig_history', raw); }catch{}
        }
      }catch{}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]); // mount only

  // MIG-HT1 — ONE-TIME data migration (2026-07-19). REMOVE BEFORE COMMERCIAL LAUNCH.
  // Sat 2026-07-18 Hip Thrust sets were performed on the LF Smith (20 lb bar)
  // but logged under the barbell entry (44 lb bar): plates on the bar were
  // identical, so stored totals overstate by the 24 lb bar delta. Renames the
  // exercise to "Hip Thrust (Smith)" and subtracts 24 in ig_history[2026-07-18]
  // and ig_openwt. Flag-guarded (ig_mig_ht1); no-op on devices without the data.
  // Rollback: localStorage.removeItem('ig_mig_ht1') re-arms; revert commit removes.
  useEffect(()=>{
    try{
      if(localStorage.getItem('ig_mig_ht1')) return;
      const DK='2026-07-18', OLD='Hip Thrust', NEW='Hip Thrust (Smith)', DELTA=24, BARW=20;
      let h={}; try{ h=JSON.parse(localStorage.getItem('ig_history')||'{}'); }catch{}
      const day=h[DK]; let touched=false;
      if(day&&Array.isArray(day.exercises)){
        day.exercises.forEach(e=>{
          if(e.name===OLD){
            e.name=NEW;
            (e.sets||[]).forEach(s=>{ if(s.w>0) s.w=Math.max(BARW, s.w-DELTA); });
            touched=true;
          }
        });
        if(touched){ const raw=JSON.stringify(h);
          try{localStorage.setItem('ig_history',raw);}catch{} idbSet('ig_history',raw); setHist(h); }
      }
      let ow={}; try{ ow=JSON.parse(localStorage.getItem('ig_openwt')||'{}'); }catch{}
      if(ow[OLD]!==undefined){
        ow[NEW]=Math.max(BARW,(ow[OLD]||0)-DELTA); delete ow[OLD];
        const raw=JSON.stringify(ow);
        try{localStorage.setItem('ig_openwt',raw);}catch{} idbSet('ig_openwt',raw); setOpenWt(ow);
      }
      localStorage.setItem('ig_mig_ht1','1');
    }catch{}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]); // mount only

  // F-HIST1 — auto-archive the completed session into history (runs once per completion).
  useEffect(()=>{
    if(screen!=="complete"||log.length===0) return;
    const dk = histDateKey(new Date());
    const order=[]; const exMap={};
    log.forEach(s=>{
      if(!exMap[s.exercise]){exMap[s.exercise]=[];order.push(s.exercise);}
      exMap[s.exercise].push({w:s.weight,r:s.reps});
    });
    const gids=[...new Set(order.map(n=>PRIM_TO_GROUP[(META[n]||{}).muscle]).filter(Boolean))];
    const entry={status:'logged',groups:gids,sesType:sesType||null,
      exercises:order.map(n=>({name:n,sets:exMap[n]})),source:'auto'};
    setHist(h=>({...h,[dk]:entry}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[screen]);

  // F-BACKUP2 — one-time PAT bootstrap from URL (?pat=...), then scrub from the bar.
  // Minimal-footprint token entry for iPad: open <app-url>?pat=TOKEN once; it self-stores
  // to ig_pat and strips the param. No visible UI added.
  useEffect(()=>{
    try{
      const p=new URLSearchParams(window.location.search);
      const pat=p.get('pat');
      if(pat){
        localStorage.setItem('ig_pat', pat);
        p.delete('pat');
        const qs=p.toString();
        const url=window.location.pathname+(qs?('?'+qs):'')+window.location.hash;
        window.history.replaceState(null,'',url);
      }
    }catch{}
  },[]); // mount only

  // F-BACKUP2 — push a snapshot of training data to the private ironq-data repo.
  // ig_history + ig_openwt are read from localStorage (they survive completion); prs is
  // passed from state because PERSIST1 removes ig_session on complete. Silent no-op when
  // ig_pat is unset. Never throws into render — failures are swallowed so a backup issue
  // can never block session completion.
  async function backupToGitHub(prsSnapshot){
    let pat=null; try{ pat=localStorage.getItem('ig_pat'); }catch{}
    if(!pat) return;
    let history={}, openwt={};
    try{ history=JSON.parse(localStorage.getItem('ig_history')||'{}'); }catch{}
    try{ openwt=JSON.parse(localStorage.getItem('ig_openwt')||'{}'); }catch{}
    const payload={schema:1, updated:new Date().toISOString(),
      ig_history:history, ig_openwt:openwt, prs:prsSnapshot||{}};
    const body=JSON.stringify(payload);
    let content; try{ content=btoa(unescape(encodeURIComponent(body))); }catch{ return; }
    const api='https://api.github.com/repos/sustany/ironq-data/contents/data/backup.json';
    const hdr={Authorization:'Bearer '+pat, Accept:'application/vnd.github+json'};
    try{
      let sha;
      const g=await fetch(api,{headers:hdr});
      if(g.ok){ const j=await g.json(); sha=j.sha; }
      await fetch(api,{method:'PUT',headers:{...hdr,'Content-Type':'application/json'},
        body:JSON.stringify({message:'auto-backup '+new Date().toISOString(),
          content, ...(sha?{sha}:{})})});
    }catch{ /* swallow — backup must never block the session */ }
  }
  // manual trigger for console/testing: window.igBackupNow()
  useEffect(()=>{ window.igBackupNow=()=>backupToGitHub(prs); },[prs]);

  // F-BACKUP2 — auto-backup once per completion. Fires on entry to "complete"; a short
  // delay lets F-HIST1 setHist + PERSIST writes land in localStorage first.
  const backupDone = useRef(false);
  useEffect(()=>{
    if(screen!=="complete"){ backupDone.current=false; return; }
    if(backupDone.current) return;
    backupDone.current=true;
    const t=setTimeout(()=>{ backupToGitHub(prs); }, 900);
    return ()=>clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[screen]);

  // F-BACKUP3 — restore training data FROM the private ironq-data repo.
  // Destructive: overwrites local ig_history, ig_openwt, and prs with the backup.
  // Fetches first, shows the backup timestamp, and confirms before applying (unless
  // opts.force). Rehydrates both localStorage + IDB and live React state. Intended to
  // run at the setup screen; running mid-session is possible via console but will
  // reset PRs under an already-built session.
  async function restoreFromGitHub(opts){
    opts = opts || {};
    const silent = !!opts.silent;
    let pat=null; try{ pat=localStorage.getItem('ig_pat'); }catch{}
    if(!pat){ if(!silent) alert('Restore: no ig_pat token set. Open the app once with ?pat=TOKEN first.'); return false; }
    const api='https://api.github.com/repos/sustany/ironq-data/contents/data/backup.json';
    let data;
    try{
      const r=await fetch(api,{headers:{Authorization:'Bearer '+pat, Accept:'application/vnd.github+json'}});
      if(!r.ok){ if(!silent) alert('Restore failed: HTTP '+r.status+(r.status===404?' (no backup.json yet)':'')); return false; }
      const j=await r.json();
      const b64=String(j.content||'').replace(/\n/g,'');
      const json=decodeURIComponent(escape(atob(b64)));
      data=JSON.parse(json);
    }catch(e){ if(!silent) alert('Restore error: '+(e&&e.message||e)); return false; }
    if(!data || typeof data!=='object'){ if(!silent) alert('Restore: backup payload unreadable.'); return false; }
    const stamp=data.updated||'unknown time';
    const hCount=data.ig_history?Object.keys(data.ig_history).length:0;
    const prCount=data.prs?Object.keys(data.prs).length:0;
    if(!opts.force){
      const ok=window.confirm('Restore backup from '+stamp+'?\n\n'+hCount+' history day(s) + '+prCount+' PR record(s) will OVERWRITE current local data. This cannot be undone.');
      if(!ok) return false;
    }
    try{
      if(data.ig_history){ const raw=JSON.stringify(data.ig_history); try{localStorage.setItem('ig_history',raw);}catch{} idbSet('ig_history',raw); setHist(data.ig_history); }
      if(data.ig_openwt){ const raw=JSON.stringify(data.ig_openwt); try{localStorage.setItem('ig_openwt',raw);}catch{} idbSet('ig_openwt',raw); setOpenWt(data.ig_openwt); }
      if(data.prs){ setPrs(data.prs); }
      if(!silent) alert('Restore OK — '+stamp+'.\nHistory, open-weights, and PRs rehydrated.');
      return true;
    }catch(e){ if(!silent) alert('Restore apply error: '+(e&&e.message||e)); return false; }
  }
  // manual trigger for console/testing: window.igRestore()
  useEffect(()=>{ window.igRestore=()=>restoreFromGitHub({}); },[]);

  // F-BACKUP3 — one-time restore bootstrap from URL (?restore=1), then scrub the param.
  // Runs at mount (screen is always "setup" on boot), confirms before overwriting.
  useEffect(()=>{
    try{
      const p=new URLSearchParams(window.location.search);
      if(p.get('restore')==='1'){
        p.delete('restore');
        const qs=p.toString();
        window.history.replaceState(null,'',window.location.pathname+(qs?('?'+qs):'')+window.location.hash);
        restoreFromGitHub({});
      }
    }catch{}
  },[]); // mount only


  // PERSIST1 — write session state to localStorage on every relevant change
  useEffect(()=>{
    // Clear the saved session ONLY when a workout actually finishes.
    // The app always boots to screen "setup", so clearing here on setup
    // would wipe an in-progress session on every relaunch — that was the
    // bug where reopening the app lost all session data. Intentional clears
    // happen explicitly in reset() and the "Start Fresh" button.
    if(screen==="complete"){
      try{ localStorage.removeItem('ig_session'); }catch{}
      idbDel('ig_session');               // clear durable mirror too
      return;
    }
    if(screen==="setup") return; // nothing to persist yet; never clear here
    const snapshot=JSON.stringify({
      sesType, exList, exIdx, setIdx, prs, log,
      lastRes, lastWt, sessionStart, sessionDate, userMeta, customGroups,
    });
    try{ localStorage.setItem('ig_session', snapshot); }catch{}
    idbSet('ig_session', snapshot);       // durable mirror (async, best-effort)
  },[screen, sesType, exList, exIdx, setIdx, prs, log, lastRes, lastWt, sessionStart, sessionDate, userMeta, customGroups]);

  // ── URL hash routing + demo preload ───────────────────────────
  // Hash routes: #session, #logging, #complete, #phr
  // Demo flag:   ?demo=legs | ?demo=push | ?demo=pull
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demo   = params.get('demo'); // 'legs' | 'push' | 'pull'
    const hash   = window.location.hash.replace('#',''); // 'session' | 'logging' | 'complete' | 'phr'

    if(!demo && !hash) return;

    // Pick session type from demo param or default to legs
    const type = (demo==='push'||demo==='pull'||demo==='legs') ? demo : 'legs';
    const useExt = true;
    const exs = build(type, useExt);

    setSesType(type);
    setExt(useExt);
    setExList(exs);
    setSessionDate(new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}));

    if(hash==='complete'){
      // Populate a realistic completed session log for result screen testing
      const demoLog = exs.slice(0,4).flatMap((e,ei)=>
        Array.from({length:e.sets},(_, si)=>({
          exercise:e.name, setNum:si+1,
          weight: (INIT_PRS[e.name]?.weight||100) - si*10,
          reps: e.targetReps + (si===e.sets-1?1:0),
          result: si===e.sets-1?'exceeded':'matched',
          phr: 128 + ei*5 + si*3,
        }))
      );
      setLog(demoLog);
      setSessionStart(Date.now() - 52*60*1000);
      setSessionEnd(Date.now());
      setScreen('complete');
      return;
    }

    // For session/logging/phr — start the session at exercise 1
    setExIdx(0); setSetIdx(0); setLastRes(null); setLastWt(null);
    setSessionStart(Date.now() - 18*60*1000); // 18 min in
    setScreen('session');

    if(hash==='logging') setPhase('logging');
    else if(hash==='phr'){ setPhase('phr'); setPendingResult({res:'matched',wt:185,reps:10}); setPhrInput(138); }
    else setPhase('ready');

    // Clean the URL so reloads don't re-trigger
    window.history.replaceState(null,'','/');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const elapsedStr = () => {
    if (!sessionStart) return "0";
    const ms   = (sessionEnd || Date.now()) - sessionStart;
    const mins = Math.floor(ms / 60000);
    return `${mins}`;
  };

  const ex     = exList[exIdx]||null;
  const m      = ex?({...(META[ex.name]||{}),...(userMeta[ex.name]||{})}):{};

  const isBw = m.eq === "bodyweight";
  const tgt    = ex&&!isBw?suggestW(ex.name,setIdx,lastWt,lastRes,prs,openWt,m):0;

  // ── Double progression rep adaptation ──────────────────────
  // Parse rep range ("8–12" → [8,12]). Use em-dash or hyphen.
  const parseRange = (s) => {
    const match = (s||"").match(/(\d+)\D+(\d+)/);
    return match ? [parseInt(match[1]), parseInt(match[2])] : null;
  };
  const repRange     = ex ? parseRange(ex.repRange) : null;
  const rangeLo      = repRange ? repRange[0] : (ex?.targetReps||8);
  const rangeHi      = repRange ? repRange[1] : (ex?.targetReps||8);
  // Last logged reps for this exercise in current session
  const lastExLog    = ex ? [...log].reverse().find(s => s.exercise === ex.name) : null;
  const lastReps     = lastExLog?.reps ?? null;
  // Adapted target: center the grid on last rep count if available, else prescribed target
  const adaptedTarget = lastReps !== null ? lastReps : (ex?.targetReps || 8);
  // Feedback state for post-set message
  const repFeedback  = lastReps === null ? null
    : lastReps > rangeHi  ? "exceeded"   // above range → flag weight increase
    : lastReps === rangeHi? "ceiling"     // at top → nudge toward weight increase
    : lastReps >= rangeLo ? "within"     // within range → on track
    : "below";                            // below range → flag load check
  // Rep grid buttons — 9 buttons centered on adaptedTarget
  const repTgt     = adaptedTarget;
  const repButtons = Array.from({length: 9}, (_, i) => Math.max(1, repTgt - 4) + i);
  // Snap to nearest equipment-achievable weight. Driven by EQUIPMENT[m.eq].snap.
  // Bilateral plate machines snap from the bar weight (or 0 if no bar). Stack-pin
  // and dumbbells snap from zero.
  const snapWt = (raw, m) => {
    const e = eqOf(m);
    if (e.snap === 0) return 0;            // bodyweight → no load
    if (e.bilateral) {
      const base = e.barWt || 0;
      const diff = raw - base;
      return Math.round(diff / e.snap) * e.snap + base;
    }
    return Math.round(raw / e.snap) * e.snap;
  };
  let   adjWt  = Math.max(0, snapWt(tgt+weightAdj, m));
  // Cap at gym ceiling if set
  const gymMax  = prs[ex?.name]?.gymMax || null;
  if(gymMax && adjWt > gymMax) adjWt = snapWt(gymMax, m);
  const atCeiling = gymMax && adjWt >= gymMax;
  const eq     = eqOf(m);
  // F-PLATES1 — absolute breakdown of total load (TOTAL plate counts)
  const loadout = ex&&!isBw&&eq.showPlates&&adjWt>0
    ? plateBreakdown(adjWt, eq.barWt||0, eq.bilateral, m.maxPlate||45)
    : [];
  const score  = calcScore(log,prs,ext);
  const totS   = exList.reduce((s,e)=>s+e.sets,0);

  const build=(t,bbOK)=>{
    let a = t==="custom" ? buildCustomList(customGroups, ext) : [...TMPLS[t]];
    if(!bbOK) a=a.filter(e=>!e.priority);
    a=a.slice(0,ext?6:5);
    // Honor custom opener — move or prepend chosen exercise
    if(customOpener && a[0]?.name!==customOpener){
      const idx=a.findIndex(e=>e.name===customOpener);
      if(idx>0){ const [ex]=a.splice(idx,1); a.unshift(ex); }
      else if(idx===-1){
        const prEntry=INIT_PRS[customOpener];
        const m2=META[customOpener]||{};
        a.unshift({name:customOpener,sets:4,
          repRange:m2.compound?"6–10":"10–15",
          targetReps:m2.compound?8:12});
        a=a.slice(0,ext?6:5);
      }
    }
    return a;
  };
  const launch=()=>{
    const now=new Date();
    const DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    setSessionDate(`${DAYS[now.getDay()]} ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`);
    setExList(draftList?[...draftList]:build(sesType,true));setExIdx(0);setSetIdx(0);setLog([]);
    setLastRes(null);setLastWt(null);setPhase("ready");
    setSessionStart(Date.now());
    setScreen("session");
  };
  // ── Back navigation: undo the most recent logged set ──────────
  // Pops the last log entry, restores setIdx/exIdx/lastWt/lastRes to
  // the state immediately preceding that log. Supports cross-exercise undo:
  // if the user already advanced to the next exercise, this rolls back to it.
  const undoLastSet = () => {
    if (log.length === 0) return;
    const popped = log[log.length - 1];
    const newLog = log.slice(0, -1);
    setLog(newLog);
    setWConf(null);
    setPendingResult(null);
    setWeightAdj(0);

    // Roll PR back if the popped set had set a new PR for its exercise
    const exMeta = META[popped.exercise] || userMeta[popped.exercise] || {};
    if (!exMeta.bw) {
      const currentPr = prs[popped.exercise];
      if (currentPr && popped.weight >= currentPr.weight && popped.result !== "fell_short") {
        // The popped set may have been the PR. Recompute from prior logs.
        const priorBest = newLog
          .filter(s => s.exercise === popped.exercise && s.result !== "fell_short")
          .reduce((best, s) => (s.weight > (best?.weight || 0) ? s : best), null);
        if (priorBest && priorBest.weight < currentPr.weight) {
          setPrs(p => ({...p, [popped.exercise]: {...p[popped.exercise],
            weight: priorBest.weight, reps: priorBest.reps}}));
        }
      }
    }

    // Find which exercise+setIdx the popped entry corresponded to
    const poppedExIdx = exList.findIndex(e => e.name === popped.exercise);
    if (poppedExIdx === -1) { setPhase("ready"); return; }

    // Count working sets for that exercise in newLog to compute restored setIdx
    const workingDone = newLog.filter(s => s.exercise === popped.exercise).length;
    setExIdx(poppedExIdx);
    setSetIdx(workingDone);

    // Find last set for this exercise in newLog for progression context
    const priorWorking = [...newLog].reverse()
      .find(s => s.exercise === popped.exercise);
    setLastWt(priorWorking?.weight ?? null);
    setLastRes(priorWorking?.result ?? null);
    setPhase("ready");
  };

  // F-LOADALERT1: suppress the 50%+ load-change alert during expected
  // warm-up transitions. Keyed to the current exercise's primary muscle:
  //  - group already directly trained this session (another exercise,
  //    same primary): never suppress — muscles warm, no warm-up expected
  //  - group pre-warmed via PREWARM_PRIMARIES (e.g. triceps after chest):
  //    suppress Set 1→2 only (one warm-up set)
  //  - fresh group: suppress Set 1→2 and Set 2→3 (two warm-up sets)
  //  - Set 3+ (setIdx>=3): always alert
  const warmupSuppressed=()=>{
    const grp = EX_PRIMARY[ex.name];
    if(!grp) return false;
    const priorGroups = new Set(
      log.filter(s=>s.exercise!==ex.name)
         .map(s=>EX_PRIMARY[s.exercise])
         .filter(Boolean));
    if(priorGroups.has(grp)) return false;
    const prewarmed=(PREWARM_PRIMARIES[grp]||[]).some(p=>priorGroups.has(p));
    if(prewarmed) return setIdx===1;
    return setIdx===1||setIdx===2;
  };

  const attemptReps=(reps)=>{
    // Classify against the prescribed range, not a single integer target.
    // Reps WITHIN range = matched (working as prescribed); above = exceeded; below = fell_short.
    const res = reps > rangeHi ? "exceeded"
              : reps < rangeLo ? "fell_short"
              : "matched";
    if(lastWt&&lastWt>0&&Math.abs(adjWt-lastWt)/lastWt>0.5&&!warmupSuppressed()){setWConf({res,wt:adjWt,reps});return;}
    setPendingResult({res,wt:adjWt,reps});
    setPhrInput(130);
    setPhase("phr");
  };
  const confirmPhr=(phr)=>{
    if(!pendingResult) return;
    doLog(pendingResult.res, pendingResult.wt, pendingResult.reps, phr);
    setPendingResult(null);
  };
  const doLog=(res,wt,reps,phr=null)=>{
    setWConf(null);
    setLog(l=>[...l,{exercise:ex.name,setNum:setIdx+1,weight:wt,
      reps:reps,result:res,...(phr?{phr}:{})}]);
    setWeightAdj(0);
    setLastRes(res);setLastWt(wt);
    if(setIdx===0&&!isBw) setOpenWt(o=>({...o,[ex.name]:wt})); // F-LASTW1
    const pr=prs[ex.name];
    if(res!=="fell_short"&&pr&&!pr.bw&&wt>pr.weight){
      setPrs(p=>({...p,[ex.name]:{...p[ex.name],weight:wt,reps:ex.targetReps}}));
      setPrFlash(ex.name);setTimeout(()=>setPrFlash(null),2800);
    }
    // F-OPENSETS1 (2026-07-20): fixed per-exercise set caps removed. Sets
    // count up without limit; the user advances exercises manually via the
    // NEXT EXERCISE button. ex.sets is retained as the PLAN for header
    // denominator + scoring benchmark (option b) but never gates logging.
    setSetIdx(s=>s+1);
    setPhase("ready");
  };
  const reset=()=>{
    try{ localStorage.removeItem('ig_session'); }catch{}
    idbDel('ig_session');
    setSesType(null);setExList([]);setExIdx(0);setSetIdx(0);
    setLog([]);setLastRes(null);setLastWt(null);setPhase("ready");setScreen("setup");
    setSessionStart(null);setSessionEnd(null);
  };

  const shell={background:C.page,minHeight:"100dvh",color:C.wht,
    maxWidth:430,margin:"0 auto",display:"flex",flexDirection:"column",
    paddingTop:"env(safe-area-inset-top)",
    fontFamily:"'Inter',sans-serif"};

  // ── SETUP ────────────────────────────────────────────────
  if(screen==="setup"){
    const ready=!!sesType && (sesType!=="custom" || customGroups.length>0)
      && (draftList===null || draftList.length>0); // edited-to-empty blocks launch

    // Live day + date
    const now     = new Date();
    const DAYS    = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const MONTHS  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const dayName = DAYS[now.getDay()];
    const dateStr = `${MONTHS[now.getMonth()]} ${now.getDate()}`;

    return(
      <div style={shell}>
        {/* PERSIST1 — Resume session modal */}
        {showResume&&(
          <div style={{position:"fixed",inset:0,zIndex:999,background:"rgba(0,0,0,0.82)",
            display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
            <div style={{background:"#111",border:`1px solid #3a3a3a`,borderRadius:16,
              padding:28,maxWidth:340,width:"100%",textAlign:"center"}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,
                color:"#fff",letterSpacing:"0.08em",marginBottom:8}}>
                Resume Session?
              </div>
              <div style={{fontFamily:"'Inter',sans-serif",fontSize:13,
                color:"#888",marginBottom:24,lineHeight:1.5}}>
                You have an in-progress {sesType} session with {log.length} set{log.length!==1?"s":""} logged.
              </div>
              <button className="t" onClick={()=>{setScreen("session");setShowResume(false);}}
                style={{width:"100%",height:52,borderRadius:10,cursor:"pointer",
                  background:"linear-gradient(180deg,#e8260a,#aa1a00)",
                  border:"none",color:"#fff",
                  fontFamily:"'Bebas Neue',sans-serif",fontSize:20,
                  letterSpacing:"0.1em",marginBottom:10}}>
                Resume
              </button>
              <button className="t" onClick={()=>{
                try{localStorage.removeItem('ig_session');}catch{}
                idbDel('ig_session');
                setSesType(null);setCustomGroups([]);setDraftList(null);setExList([]);setExIdx(0);setSetIdx(0);
                setPrs(INIT_PRS);setLog([]);setLastRes(null);setLastWt(null);
                setSessionStart(null);setSessionDate(null);setShowResume(false);
              }} style={{width:"100%",height:42,borderRadius:10,cursor:"pointer",
                background:"transparent",border:"1px solid #2a2a2a",
                color:"#888",fontFamily:"'Inter',sans-serif",fontWeight:700,
                fontSize:13,letterSpacing:"0.1em",textTransform:"uppercase"}}>
                Start Fresh
              </button>
            </div>
          </div>
        )}
        <style>{FONTS}</style>
        <div style={{flex:1,display:"flex",flexDirection:"column",padding:"50px 18px 32px"}}>

          {/* HEADER */}
          <div style={{marginBottom:30}}>
            {/* Logo left — day/date upper right */}
            <div style={{display:"flex",alignItems:"flex-start",
              justifyContent:"space-between",marginBottom:2}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:66,
                letterSpacing:"0.05em",lineHeight:1}}>
                <span style={{color:C.red}}>IRON</span>
                <span style={{color:C.wht}}>Q</span>
              </div>
              {/* Hamburger menu — placeholder, no action wired yet */}
              <div style={{paddingTop:12,paddingLeft:12,cursor:"pointer"}} role="button" aria-label="Menu">
                <svg width="28" height="20" viewBox="0 0 28 20" fill="none" aria-hidden="true">
                  <rect y="0" width="28" height="3" rx="1.5" fill={C.wht}/>
                  <rect y="8.5" width="28" height="3" rx="1.5" fill={C.wht}/>
                  <rect y="17" width="28" height="3" rx="1.5" fill={C.wht}/>
                </svg>
              </div>
            </div>
            <Div/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:12,
                color:C.md,letterSpacing:"0.2em",textTransform:"uppercase"}}>
                AI BODY EVOLUTION
              </div>
              <div style={{fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:11,
                color:"#eab308",letterSpacing:"0.12em",textTransform:"uppercase",whiteSpace:"nowrap"}}>
                {dayName} &middot; {dateStr}
              </div>
            </div>
          </div>

          {/* FORMAT — time constrained vs flexible */}
          <div style={{marginBottom:18}}>
            <div style={{display:"flex",gap:10,marginBottom:tcMode?10:0}}>
              {/* Flexible */}
              <button className="t" onClick={()=>setTcMode(false)} style={{
                flex:1,minHeight:74,borderRadius:12,padding:"12px 14px",cursor:"pointer",
                background:!tcMode?STEEL_SEL:STEEL,
                border:`1px solid ${!tcMode?C.red:C.bdr}`,
                borderTop:`1px solid ${!tcMode?"#f03010":C.bdrTop}`,
                boxShadow:!tcMode?`0 0 0 1px ${C.red},0 4px 20px ${C.redGlow}`:`0 3px 12px rgba(0,0,0,0.45),inset 0 1px 0 rgba(255,255,255,0.05)`,
                display:"flex",flexDirection:"column",alignItems:"flex-start",justifyContent:"center",gap:5,textAlign:"left"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <IPlus s={16} style={{color:!tcMode?C.red:C.md}}/>
                  <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:17,letterSpacing:"0.1em",color:C.wht}}>Flexible</span>
                  {!tcMode&&<IChk s={12} style={{color:C.wht,marginLeft:2}}/>}
                </div>
                <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,
                  color:!tcMode?"rgba(255,255,255,0.75)":C.lt,paddingLeft:24,
                  textTransform:"uppercase",letterSpacing:"0.06em"}}>
                  Optimize for best stimulus
                </div>
              </button>
              {/* Time Constrained */}
              <button className="t" onClick={()=>setTcMode(true)} style={{
                flex:1,minHeight:74,borderRadius:12,padding:"12px 14px",cursor:"pointer",
                background:tcMode?STEEL_SEL:STEEL,
                border:`1px solid ${tcMode?C.red:C.bdr}`,
                borderTop:`1px solid ${tcMode?"#f03010":C.bdrTop}`,
                boxShadow:tcMode?`0 0 0 1px ${C.red},0 4px 20px ${C.redGlow}`:`0 3px 12px rgba(0,0,0,0.45),inset 0 1px 0 rgba(255,255,255,0.05)`,
                display:"flex",flexDirection:"column",alignItems:"flex-start",justifyContent:"center",gap:5,textAlign:"left"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <IClk s={16} style={{color:tcMode?C.red:C.md}}/>
                  <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:17,letterSpacing:"0.1em",color:C.wht}}>Time Constrained</span>
                  {tcMode&&<IChk s={12} style={{color:C.wht,marginLeft:2}}/>}
                </div>
                <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,
                  color:tcMode?"rgba(255,255,255,0.75)":C.lt,paddingLeft:24,
                  textTransform:"uppercase",letterSpacing:"0.06em"}}>
                  {tcMode?(()=>{const[h,m]=depTime.split(':').map(Number);const dep=new Date();dep.setHours(h,m,0,0);const a=Math.max(0,Math.round((dep-Date.now())/60000));return`${a} min available`;})():"Set your leave time"}
                </div>
              </button>
            </div>
            {/* Departure time picker — only in TC mode */}
            {tcMode&&(
              <div style={{background:STEEL,border:`1px solid ${C.bdr}`,borderTop:`1px solid ${C.bdrTop}`,
                borderRadius:10,padding:"12px 14px",
                boxShadow:"0 3px 12px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.04)"}}>
                <div style={{fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:10,
                  color:C.md,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:8}}>
                  I need to leave by
                </div>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <input type="time" value={depTime}
                    onChange={e=>setDepTime(e.target.value)}
                    style={{flex:1,background:"#111",border:`1px solid ${C.bdr}`,
                      borderRadius:8,color:"#fff",fontSize:22,fontWeight:700,
                      padding:"8px 12px",fontFamily:"'Inter',sans-serif",minWidth:0}}/>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,
                      lineHeight:1,color:C.red}}>
                      {(()=>{const[h,m]=depTime.split(':').map(Number);const dep=new Date();dep.setHours(h,m,0,0);return Math.max(0,Math.round((dep-Date.now())/60000));})()}&nbsp;MIN
                    </div>
                    <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:10,
                      color:C.md,letterSpacing:"0.12em",textTransform:"uppercase"}}>available</div>
                  </div>
                </div>
                <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,
                  color:C.md,letterSpacing:"0.08em",textTransform:"uppercase",marginTop:8}}>
                  {(()=>{const[h,m]=depTime.split(':').map(Number);const dep=new Date();dep.setHours(h,m,0,0);const a=Math.max(0,Math.round((dep-Date.now())/60000));const t=a;return t<55?'→ 4 exercises · 14 sets':t<65?'→ 5 exercises · 17 sets':'→ 6 exercises · 20 sets';})()}
                </div>
              </div>
            )}
          </div>

          {/* F-HIST1 — SESSION HISTORY: last 4 calendar days */}
          <div style={{marginBottom:18}}>
            <button className="t" onClick={()=>setHistOpen(o=>!o)} style={{
              display:"flex",alignItems:"center",gap:7,background:"none",border:"none",
              padding:0,margin:0,marginBottom:histOpen?8:0,cursor:"pointer"}}>
              <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true"
                style={{flexShrink:0,transform:histOpen?"rotate(90deg)":"rotate(0deg)",
                  transition:"transform 0.15s ease"}}>
                <path d="M2 1 L8 5 L2 9 Z" fill={C.md}/>
              </svg>
              <span style={{fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:10,
                color:C.md,letterSpacing:"0.18em",textTransform:"uppercase"}}>
                Session History
              </span>
            </button>
            {histOpen && Array.from({length:4},(_,i)=>{
              const d=new Date(); d.setDate(d.getDate()-(4-i)); // oldest first, newest last
              const dk=histDateKey(d);
              const e=hist[dk];
              const isExp=histExpanded===dk;
              const isEd=histEdit===dk;
              const openEditor=()=>{
                setHistEdit(dk); setHistExpanded(null);
                setHistEditGroups(e?.groups?[...e.groups]:[]);
                setHistEditExs(e?.exercises
                  ? e.exercises.map(x=>({name:x.name,
                      sets:(x.sets||[]).map(s=>`${s.w}x${s.r}`).join(", ")}))
                  : []);
                setHistShowExAdd(!!(e?.exercises&&e.exercises.length));
              };
              const saveEditor=(mode)=>{
                if(mode==='recovery'){
                  setHist(h=>({...h,[dk]:{status:'recovery',source:'backfill'}}));
                }else if(mode==='clear'){
                  setHist(h=>{const n={...h};delete n[dk];return n;});
                }else{ // trained
                  const exercises=histEditExs
                    .filter(x=>x.name.trim())
                    .map(x=>({name:x.name.trim(),
                      sets:x.sets.split(",").map(t=>t.trim()).filter(Boolean)
                        .map(t=>{const[m,r]=t.toLowerCase().split(/[x×*]/);
                          return{w:parseFloat(m)||0,r:parseInt(r)||0};})
                        .filter(s=>s.w>0&&s.r>0)}))
                    .filter(x=>x.name);
                  // Derive muscle groups from typed exercise names when chips weren't picked.
                  const derived=exercises
                    .map(x=>PRIM_TO_GROUP[(META[x.name]||{}).muscle]).filter(Boolean);
                  const groups=[...new Set([...histEditGroups,...derived])];
                  if(groups.length===0&&exercises.length===0) return; // nothing to save
                  setHist(h=>({...h,[dk]:{status:'logged',
                    groups,
                    exercises:exercises.length?exercises:undefined,
                    sesType:null,source:'backfill'}}));
                }
                setHistEdit(null);setHistEditGroups([]);setHistEditExs([]);setHistShowExAdd(false);
              };
              const statusTxt = e?.status==='logged' ? (histGroupLabels(e.groups)||"Trained")
                : e?.status==='recovery' ? "Recovery / Off" : "Not logged";
              const statusCol = e?.status==='logged' ? C.wht
                : e?.status==='recovery' ? C.lt : "rgba(255,255,255,0.28)";
              return(
                <div key={dk} style={{background:STEEL,border:`1px solid ${C.bdr}`,
                  borderTop:`1px solid ${C.bdrTop}`,borderRadius:10,marginBottom:6,
                  boxShadow:"0 2px 8px rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.04)",
                  overflow:"hidden"}}>
                  <button className="t" onClick={()=>{
                      if(isEd) return;
                      if(e?.status==='logged'){ setHistExpanded(isExp?null:dk); }
                      else openEditor();
                    }}
                    style={{width:"100%",display:"flex",alignItems:"center",
                      justifyContent:"space-between",gap:10,padding:"10px 14px",
                      background:"transparent",border:"none",cursor:"pointer",textAlign:"left"}}>
                    <div style={{display:"flex",alignItems:"baseline",gap:8,minWidth:0}}>
                      <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,
                        letterSpacing:"0.08em",color:e?C.wht:C.md,whiteSpace:"nowrap"}}>
                        {DAYS[d.getDay()]}
                      </span>
                      <span style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:10,
                        color:C.md,letterSpacing:"0.1em",textTransform:"uppercase",whiteSpace:"nowrap"}}>
                        {MONTHS[d.getMonth()]} {d.getDate()}
                      </span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                      <span style={{fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:11,
                        color:statusCol,letterSpacing:"0.08em",textTransform:"uppercase",
                        overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {statusTxt}
                      </span>
                      {e?.status==='logged'&&(
                        <span aria-hidden="true" style={{color:C.red,fontSize:11,
                          transform:isExp?"rotate(90deg)":"none",transition:"transform 0.15s",
                          display:"inline-block"}}>▶</span>
                      )}
                    </div>
                  </button>

                  {/* Expanded exercise detail */}
                  {isExp&&e?.status==='logged'&&(
                    <div style={{padding:"0 14px 12px",borderTop:`1px solid ${C.bdr}`}}>
                      {(e.exercises&&e.exercises.length>0)?e.exercises.map((x,xi)=>(
                        <div key={xi} style={{display:"flex",justifyContent:"space-between",
                          gap:10,padding:"7px 0",
                          borderBottom:xi<e.exercises.length-1?`1px solid rgba(255,255,255,0.05)`:"none"}}>
                          <span style={{fontFamily:"'Inter',sans-serif",fontWeight:700,
                            fontSize:12,color:C.wht,minWidth:0,overflow:"hidden",
                            textOverflow:"ellipsis"}}>{x.name}</span>
                          <span style={{fontFamily:"'Inter',sans-serif",fontWeight:600,
                            fontSize:12,color:C.lt,whiteSpace:"nowrap"}}>
                            {(x.sets||[]).map(s=>`${s.w}×${s.r}`).join(" · ")}
                          </span>
                        </div>
                      )):(
                        <div style={{fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:12,
                          color:C.md,padding:"8px 0"}}>
                          Muscle groups only — no exercise detail recorded.
                        </div>
                      )}
                      <button className="t" onClick={openEditor}
                        style={{marginTop:8,background:"transparent",border:"none",cursor:"pointer",
                          padding:0,fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:10,
                          color:C.red,letterSpacing:"0.14em",textTransform:"uppercase"}}>
                        Edit
                      </button>
                    </div>
                  )}

                  {/* Inline editor */}
                  {isEd&&(
                    <div style={{padding:"0 14px 14px",borderTop:`1px solid ${C.bdr}`}}>
                      <div style={{display:"flex",gap:8,margin:"12px 0 10px"}}>
                        <button className="t" onClick={()=>saveEditor('recovery')}
                          style={{flex:1,height:38,borderRadius:8,cursor:"pointer",
                            background:"transparent",border:`1px solid ${C.bdr}`,
                            color:C.lt,fontFamily:"'Inter',sans-serif",fontWeight:800,
                            fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase"}}>
                          Recovery / Off
                        </button>
                        {e&&(
                          <button className="t" onClick={()=>saveEditor('clear')}
                            style={{flex:1,height:38,borderRadius:8,cursor:"pointer",
                              background:"transparent",border:`1px solid ${C.bdr}`,
                              color:C.md,fontFamily:"'Inter',sans-serif",fontWeight:800,
                              fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase"}}>
                            Not Logged
                          </button>
                        )}
                      </div>
                      <div style={{fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:10,
                        color:C.md,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>
                        Or mark trained — pick muscle groups
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
                        {MUSCLE_GROUPS.map(g=>{
                          const on=histEditGroups.includes(g.id);
                          return(
                            <button key={g.id} className="t"
                              onClick={()=>setHistEditGroups(gs=>on?gs.filter(x=>x!==g.id):[...gs,g.id])}
                              style={{padding:"6px 11px",borderRadius:16,cursor:"pointer",
                                background:on?"rgba(232,38,10,0.16)":"transparent",
                                border:`1px solid ${on?C.red:C.bdr}`,
                                color:on?C.wht:C.lt,fontFamily:"'Inter',sans-serif",
                                fontWeight:700,fontSize:11}}>
                              {g.label}
                            </button>
                          );
                        })}
                      </div>
                      {/* Exception path — optional exercise detail */}
                      {!histShowExAdd?(
                        <button className="t" onClick={()=>{
                            setHistShowExAdd(true);
                            if(histEditExs.length===0) setHistEditExs([{name:"",sets:""}]);
                          }}
                          style={{background:"transparent",border:"none",cursor:"pointer",padding:0,
                            fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:10,
                            color:C.md,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>
                          + Add exercise detail (optional)
                        </button>
                      ):(
                        <div style={{marginBottom:10}}>
                          {histEditExs.map((x,xi)=>(
                            <div key={xi} style={{display:"flex",gap:6,marginBottom:6}}>
                              <input value={x.name} placeholder="Exercise"
                                onChange={ev=>setHistEditExs(l=>l.map((it,ii)=>ii===xi?{...it,name:ev.target.value}:it))}
                                style={{flex:3,minWidth:0,background:"#111",border:`1px solid ${C.bdr}`,
                                  borderRadius:8,color:"#fff",fontSize:13,padding:"8px 10px",
                                  fontFamily:"'Inter',sans-serif"}}/>
                              <input value={x.sets} placeholder="180x8, 170x8"
                                onChange={ev=>setHistEditExs(l=>l.map((it,ii)=>ii===xi?{...it,sets:ev.target.value}:it))}
                                style={{flex:2,minWidth:0,background:"#111",border:`1px solid ${C.bdr}`,
                                  borderRadius:8,color:"#fff",fontSize:13,padding:"8px 10px",
                                  fontFamily:"'Inter',sans-serif"}}/>
                            </div>
                          ))}
                          <button className="t" onClick={()=>setHistEditExs(l=>[...l,{name:"",sets:""}])}
                            style={{background:"transparent",border:"none",cursor:"pointer",padding:0,
                              fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:10,
                              color:C.md,letterSpacing:"0.14em",textTransform:"uppercase"}}>
                            + Another exercise
                          </button>
                        </div>
                      )}
                      <div style={{display:"flex",gap:8}}>
                        {(()=>{const canSave=histEditGroups.length>0||histEditExs.some(x=>x.name.trim());
                          return(
                        <button className="t" onClick={()=>saveEditor('trained')}
                          disabled={!canSave}
                          style={{flex:1,height:42,borderRadius:8,
                            cursor:canSave?"pointer":"default",
                            background:canSave?"linear-gradient(180deg,#e8260a,#aa1a00)":"#222",
                            border:"none",color:canSave?"#fff":"#555",
                            fontFamily:"'Bebas Neue',sans-serif",fontSize:17,letterSpacing:"0.1em"}}>
                          Save
                        </button>);})()}
                        <button className="t" onClick={()=>{
                            setHistEdit(null);setHistEditGroups([]);setHistEditExs([]);setHistShowExAdd(false);
                          }}
                          style={{flex:1,height:42,borderRadius:8,cursor:"pointer",
                            background:"transparent",border:`1px solid ${C.bdr}`,
                            color:C.md,fontFamily:"'Inter',sans-serif",fontWeight:800,
                            fontSize:12,letterSpacing:"0.1em",textTransform:"uppercase"}}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>




          {/* SESSION TYPE — second choice */}
          <div style={{marginBottom:18}}>
            <SL>Session Type</SL>
            {/* F-CUSTOM1 — Custom session: full-width card + multi-select chips */}
            <button className="t" onClick={()=>{setSesType("custom");setCustomOpener(null);setDraftList(null);}} style={{
              width:"100%",borderRadius:12,padding:"12px 14px",cursor:"pointer",
              background:sesType==="custom"?STEEL_SEL:STEEL,
              border:`1px solid ${sesType==="custom"?C.red:C.bdr}`,
              borderTop:`1px solid ${sesType==="custom"?"#f03010":C.bdrTop}`,
              boxShadow:sesType==="custom"
                ?`0 0 0 1px ${C.red},0 6px 28px ${C.redGlow},inset 0 1px 0 rgba(255,255,255,0.1)`
                :`0 4px 16px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.05)`,
              display:"flex",alignItems:"center",gap:14,textAlign:"left",position:"relative"}}>
              <IconCustom sz={38} col="#ffffff"/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:21,
                  letterSpacing:"0.12em",lineHeight:1,color:C.wht,marginBottom:4}}>Custom</div>
                <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:10,
                  color:sesType==="custom"?"rgba(255,255,255,0.88)":C.lt,
                  textTransform:"uppercase",letterSpacing:"0.07em",
                  whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                  {customGroups.length
                    ? MUSCLE_GROUPS.filter(g=>customGroups.includes(g.id)).map(g=>g.label).join(" · ")
                    : "Pick your muscle groups"}
                </div>
              </div>
              {sesType==="custom"&&(
                <div style={{color:"#fff",background:"rgba(255,255,255,0.18)",borderRadius:"50%",
                  width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <IChk s={12}/>
                </div>
              )}
            </button>

            {/* Muscle group multi-select — visible only in Custom mode */}
            {sesType==="custom"&&(
              <div style={{marginTop:10,background:STEEL,borderRadius:12,
                border:`1px solid ${C.bdr}`,borderTop:`1px solid ${C.bdrTop}`,
                padding:"12px 12px 10px",
                boxShadow:"0 3px 12px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.04)"}}>
                <div style={{fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:10,
                  color:C.md,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:10}}>
                  Muscle groups · pick one or more
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {MUSCLE_GROUPS.map(g=>{
                    const on=customGroups.includes(g.id);
                    return(
                      <button key={g.id} className="t"
                        onClick={()=>{
                          setCustomOpener(null);
                          setDraftList(null);
                          setCustomGroups(gs=>on?gs.filter(x=>x!==g.id):[...gs,g.id]);
                        }}
                        style={{
                          padding:"9px 14px",borderRadius:20,cursor:"pointer",
                          background:on?`linear-gradient(180deg,${C.red},${C.redDk})`:"rgba(255,255,255,0.05)",
                          border:`1px solid ${on?"#f03010":C.bdr}`,
                          fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:12,
                          color:on?"#fff":C.lt,letterSpacing:"0.08em",
                          textTransform:"uppercase",
                          boxShadow:on?`0 2px 12px ${C.redGlow}`:"none"}}>
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{display:"flex",gap:10,marginTop:10}}>
              <TypeCard type="push" label="Push" compact={sesType==="custom"}
                muscles={"Chest\nShoulders · Triceps"}
                Icon={IconPush} selected={sesType} onClick={t=>{setSesType(t);setCustomOpener(null);setDraftList(null);}}/>
              <TypeCard type="pull" label="Pull" compact={sesType==="custom"}
                muscles={"Back\nBiceps · Rear Delts"}
                Icon={IconPull} selected={sesType} onClick={t=>{setSesType(t);setCustomOpener(null);setDraftList(null);}}/>
              <TypeCard type="legs" label="Legs" compact={sesType==="custom"}
                muscles={"Quads · Hams\nGlutes · Calves"}
                Icon={IconLegs} selected={sesType} onClick={t=>{setSesType(t);setCustomOpener(null);setDraftList(null);}}/>
            </div>

          </div>

          {/* PREVIEW */}
          {sesType&&(sesType!=="custom"||customGroups.length>0)&&(
            <div style={{marginBottom:28}}>
              <Preview type={sesType} extended={ext}
                opener={customOpener}
                onPickOpener={()=>setShowOpenerPicker(true)}
                list={draftList||build(sesType,true)}
                edited={!!draftList}
                onEdit={()=>setShowSessionEditor(true)}
                customMuscles={sesType==="custom"
                  ? MUSCLE_GROUPS.filter(g=>customGroups.includes(g.id)).map(g=>g.label).join(" · ")
                  : null}
              />
            </div>
          )}
          <div style={{flex:1}}/>

          {ready&&(
            <RedBtn onClick={()=>launch()}>
              {`Begin ${sesType.charAt(0).toUpperCase()+sesType.slice(1)} Session`}
            </RedBtn>
          )}


          {/* Reset — only shows after selections made */}
          {sesType && (
            <button className="t" onClick={()=>{ setSesType(null); setExt(false); setCustomOpener(null); setCustomGroups([]); setDraftList(null); setShowSessionEditor(false); setTcMode(true); setDepTime((()=>{const d=new Date(Date.now()+60*60000);return`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;})());  }}
              style={{
                width:"100%", marginTop:14, height:44,
                background:"transparent",
                border:`1px solid ${C.bdr}`,
                borderRadius:10, cursor:"pointer",
                fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:13,
                color:C.md, letterSpacing:"0.1em", textTransform:"uppercase",
              }}>
              ← Reset Selections
            </button>
          )}

          {/* Version stamp — fixed to bottom of screen */}
          <div onClick={async()=>{
              if(!window.confirm('Reload to get the latest version?')) return;
              try{
                if('serviceWorker' in navigator){
                  const regs=await navigator.serviceWorker.getRegistrations();
                  await Promise.all(regs.map(r=>r.unregister()));
                }
                if('caches' in window){
                  const keys=await caches.keys();
                  await Promise.all(keys.map(k=>caches.delete(k)));
                }
              }catch(e){}
              // Force hard reload — bypass cache entirely
              window.location.href=window.location.pathname+'?nocache='+Date.now();
            }}
            style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
              width:"100%",maxWidth:430,padding:"8px 18px 16px",
              background:C.page,cursor:"pointer",display:"flex",
              alignItems:"center",justifyContent:"center",zIndex:50}}>
            <div style={{
              width:"100%",padding:"6px 12px",
              background:"rgba(255,255,255,0.08)",
              border:"1px solid rgba(255,255,255,0.20)",
              borderRadius:8,display:"flex",alignItems:"center",
              justifyContent:"space-between"}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,
                fontSize:12,color:"rgba(255,255,255,0.55)",letterSpacing:"0.06em"}}>
                {BUILD_VERSION}
              </div>
              <div style={{color:"rgba(255,255,255,0.4)",display:"flex",alignItems:"center"}}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              </div>
            </div>
          </div>
        </div>

      {/* ── OPENER PICKER OVERLAY ────────────────────────────── */}
      {/* F-PREVIEW1: SESSION EDITOR OVERLAY */}
      {showSessionEditor&&sesType&&(()=>{
        const cur = draftList || build(sesType,true);
        const cap = ext?6:5;
        const totSets = cur.reduce((a,e)=>a+e.sets,0);
        const estMin  = Math.round(totSets*3.8);
        const mut = f => { const l=f(cur.map(e=>({...e}))); setDraftList(l); };
        return(
        <div style={{position:"fixed",inset:0,zIndex:300,
          background:"rgba(0,0,0,0.85)",display:"flex",
          flexDirection:"column",justifyContent:"flex-end"}}>
          <div style={{background:"#1a1a1a",borderTop:`2px solid ${C.red}`,
            borderRadius:"18px 18px 0 0",maxHeight:"85vh",
            display:"flex",flexDirection:"column"}}>
            <div style={{display:"flex",justifyContent:"space-between",
              alignItems:"center",padding:"16px 18px 10px"}}>
              <div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,
                  color:C.wht,letterSpacing:"0.1em"}}>Session Editor</div>
                <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,
                  color:C.md,fontWeight:600,marginTop:2}}>
                  Reorder · swap · remove · add
                </div>
              </div>
              <button className="t" onClick={()=>{setShowSessionEditor(false);setEditorPick(null);}}
                style={{fontFamily:"'Inter',sans-serif",fontWeight:800,
                  fontSize:12,color:"#fff",letterSpacing:"0.12em",
                  background:`linear-gradient(180deg,${C.red},${C.redDk})`,
                  border:"none",borderRadius:7,padding:"8px 16px",cursor:"pointer"}}>
                DONE
              </button>
            </div>
            <div style={{overflowY:"auto",padding:"0 12px 8px",flex:1}}>
              {cur.map((e,i)=>{
                const pr=prs[e.name];
                const Btn=({on,dis,ch})=>(
                  <button className="t" onClick={on} disabled={dis} style={{
                    width:34,height:34,borderRadius:8,cursor:dis?"default":"pointer",
                    background:"rgba(255,255,255,0.06)",border:`1px solid ${C.bdr}`,
                    color:dis?"#3a3a3a":C.lt,fontSize:14,fontWeight:800,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    padding:0,flexShrink:0}}>{ch}</button>
                );
                return(
                <div key={e.name+i} style={{display:"flex",alignItems:"center",gap:8,
                  background:"rgba(255,255,255,0.03)",border:`1px solid ${C.bdr}`,
                  borderRadius:10,padding:"10px 10px",marginBottom:6}}>
                  <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
                    <Btn ch={"▲"} dis={i===0} on={()=>mut(l=>{[l[i-1],l[i]]=[l[i],l[i-1]];return l;})}/>
                    <Btn ch={"▼"} dis={i===cur.length-1} on={()=>mut(l=>{[l[i+1],l[i]]=[l[i],l[i+1]];return l;})}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:17,
                      color:C.wht,letterSpacing:"0.05em",lineHeight:1.1}}>{e.name}</div>
                    <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,
                      color:C.md,fontWeight:600,marginTop:2}}>
                      {e.sets} sets · {e.repRange} reps{pr?` · PR ${pr.weight}×${pr.reps}`:""}
                    </div>
                  </div>
                  <Btn ch={"⇄"} on={()=>setEditorPick(i)}/>
                  <Btn ch={"✕"} on={()=>mut(l=>{l.splice(i,1);return l;})}/>
                </div>
                );
              })}
              <button className="t" onClick={()=>setEditorPick("add")} style={{
                width:"100%",height:46,borderRadius:10,cursor:"pointer",marginTop:2,
                background:"transparent",border:`1px dashed ${C.md}`,
                fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:12,
                color:C.lt,letterSpacing:"0.14em",textTransform:"uppercase"}}>
                + Add Exercise
              </button>
            </div>
            <div style={{padding:"10px 18px 22px",borderTop:`1px solid ${C.bdr}`}}>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {[`${cur.length} EXERCISES`,`${totSets} SETS`,`~${estMin} MIN`].map(l=>(
                  <span key={l} style={{fontFamily:"'Inter',sans-serif",fontWeight:800,
                    fontSize:11,color:C.lt,background:C.inner,
                    border:`1px solid ${C.bdr}`,borderRadius:5,
                    padding:"4px 10px",letterSpacing:"0.08em"}}>{l}</span>
                ))}
              </div>
              {cur.length>cap&&(
                <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,
                  color:"#eab308",marginTop:8,letterSpacing:"0.04em"}}>
                  ⚠ Over the {cap}-exercise plan cap — watch session time
                </div>
              )}
              {cur.length===0&&(
                <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,
                  color:C.red,marginTop:8}}>
                  Session is empty — add at least one exercise
                </div>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* F-PREVIEW1: EDITOR EXERCISE PICKER */}
      {editorPick!==null&&sesType&&(()=>{
        const cur = draftList || build(sesType,true);
        const inList = new Set(cur.map(e=>e.name));
        const {inCat,outCat}=exListForType(sesType,prs,customGroups);
        const pick=(name)=>{
          const c=META[name]?.compound;
          const entry={name,
            sets:      editorPick==="add"?(c?4:3):cur[editorPick].sets,
            repRange:  c?"6–10":"10–15",
            targetReps:c?8:12};
          const l=cur.map(e=>({...e}));
          if(editorPick==="add") l.push(entry); else l[editorPick]=entry;
          setDraftList(l); setEditorPick(null);
        };
        const row=(name)=>{
          if(inList.has(name)&&(editorPick==="add"||cur[editorPick]?.name!==name)) return null;
          const pr=prs[name];
          return(
            <button key={name} className="t" onClick={()=>pick(name)}
              style={{width:"100%",display:"flex",justifyContent:"space-between",
                alignItems:"center",background:"transparent",
                border:`1px solid ${C.bdr}`,borderRadius:10,
                padding:"12px 14px",marginBottom:6,cursor:"pointer",textAlign:"left"}}>
              <div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:17,
                  color:C.wht,letterSpacing:"0.06em",lineHeight:1,marginBottom:2}}>{name}</div>
                <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,
                  color:C.md,fontWeight:600}}>
                  {META[name]?.compound?"Compound":"Isolation"}
                </div>
              </div>
              {pr&&<div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,
                  color:C.lt,lineHeight:1}}>{pr.weight}</div>
                <div style={{fontFamily:"'Inter',sans-serif",fontSize:10,
                  color:C.md,fontWeight:600}}>×{pr.reps} PR</div>
              </div>}
            </button>
          );
        };
        return(
        <div style={{position:"fixed",inset:0,zIndex:320,
          background:"rgba(0,0,0,0.88)",display:"flex",
          flexDirection:"column",justifyContent:"flex-end"}}>
          <div style={{background:"#1a1a1a",borderTop:`2px solid ${C.red}`,
            borderRadius:"18px 18px 0 0",maxHeight:"75vh",
            display:"flex",flexDirection:"column"}}>
            <div style={{display:"flex",justifyContent:"space-between",
              alignItems:"center",padding:"16px 18px 12px"}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,
                color:C.wht,letterSpacing:"0.1em"}}>
                {editorPick==="add"?"Add Exercise":"Swap Exercise"}
              </div>
              <button className="t" onClick={()=>setEditorPick(null)}
                style={{fontFamily:"'Inter',sans-serif",fontWeight:700,
                  fontSize:12,color:C.md,letterSpacing:"0.12em",
                  background:"transparent",border:`1px solid ${C.bdr}`,
                  borderRadius:7,padding:"6px 12px",cursor:"pointer"}}>
                CANCEL
              </button>
            </div>
            <div style={{overflowY:"auto",padding:"0 12px 36px"}}>
              {inCat.map(n=>row(n))}
              {outCat.length>0&&(
                <>
                  <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,
                    fontSize:9,color:C.md,letterSpacing:"0.18em",
                    textTransform:"uppercase",padding:"8px 4px 4px"}}>Other</div>
                  {outCat.map(n=>row(n))}
                </>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {showOpenerPicker&&sesType&&(
        <div style={{position:"fixed",inset:0,zIndex:300,
          background:"rgba(0,0,0,0.85)",display:"flex",
          flexDirection:"column",justifyContent:"flex-end"}}>
          <div style={{background:"#1a1a1a",borderTop:`2px solid ${C.red}`,
            borderRadius:"18px 18px 0 0",maxHeight:"75vh",
            display:"flex",flexDirection:"column"}}>
            <div style={{display:"flex",justifyContent:"space-between",
              alignItems:"center",padding:"16px 18px 12px"}}>
              <div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,
                  color:C.wht,letterSpacing:"0.1em"}}>Opens With</div>
                <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,
                  color:C.md,fontWeight:600,marginTop:2}}>
                  First exercise of the session
                </div>
              </div>
              <button className="t" onClick={()=>setShowOpenerPicker(false)}
                style={{fontFamily:"'Inter',sans-serif",fontWeight:700,
                  fontSize:12,color:C.md,letterSpacing:"0.12em",
                  background:"transparent",border:`1px solid ${C.bdr}`,
                  borderRadius:7,padding:"6px 12px",cursor:"pointer"}}>
                CANCEL
              </button>
            </div>
            <div style={{overflowY:"auto",padding:"0 12px 36px"}}>
              {(()=>{
                const {inCat,outCat}=exListForType(sesType,INIT_PRS,customGroups);
                const renderOpener=(name,inTemplate)=>{
                  const pr=INIT_PRS[name]; if(!pr) return null;
                  const isActive=(customOpener||TMPLS[sesType]?.[0]?.name||(sesType==="custom"?buildCustomList(customGroups,ext)[0]?.name:null))===name;
                  return(
                    <button key={name} className="t"
                      onClick={()=>{setCustomOpener(name);setDraftList(null);setShowOpenerPicker(false);}}
                      style={{width:"100%",display:"flex",
                        justifyContent:"space-between",alignItems:"center",
                        background:isActive?"rgba(232,38,10,0.12)":"transparent",
                        border:`1px solid ${isActive?C.red:C.bdr}`,
                        borderRadius:10,padding:"12px 14px",marginBottom:6,
                        cursor:"pointer",textAlign:"left"}}>
                      <div>
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:17,
                          color:isActive?C.red:C.wht,letterSpacing:"0.06em",
                          lineHeight:1,marginBottom:2}}>{name}</div>
                        <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,
                          color:C.md,fontWeight:600}}>
                          {inTemplate?"In template · ":""}
                          {META[name]?.compound?"Compound":"Isolation"}
                        </div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",
                          fontSize:20,color:C.lt,lineHeight:1}}>{pr.weight}</div>
                        <div style={{fontFamily:"'Inter',sans-serif",
                          fontSize:10,color:C.md,fontWeight:600}}>×{pr.reps} PR</div>
                      </div>
                    </button>
                  );
                };
                const tmplNames=(TMPLS[sesType]||buildCustomList(customGroups,ext)).map(e=>e.name);
                const inTmpl=inCat.filter(n=>tmplNames.includes(n));
                const inCatNotTmpl=inCat.filter(n=>!tmplNames.includes(n));
                return(
                  <>
                    {inTmpl.map(n=>renderOpener(n,true))}
                    {inCatNotTmpl.length>0&&(
                      <>
                        <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,
                          fontSize:9,color:C.md,letterSpacing:"0.18em",
                          textTransform:"uppercase",padding:"8px 4px 4px"}}>More {sesType}</div>
                        {inCatNotTmpl.map(n=>renderOpener(n,false))}
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
  }

  // ── COMPLETE ──────────────────────────────────────────────
  if(screen==="complete"){
    const fs=calcScore(log,prs,ext);
    const hits=[...new Set(log.filter(s=>s.result==="exceeded").map(s=>s.exercise))];
    const isPerfect=fs.total>=95;
    const sc=fs.total>=90?C.grn:fs.total>=70?C.wht:C.gld;

    // Session duration
    const elapsedMin = sessionStart ? Math.round(((sessionEnd||Date.now())-sessionStart)/60000) : 0;

    // Zone breakdown from logged PHRs — calibrated to MAX_HR
    const phrs=log.filter(s=>s.phr>0).map(s=>s.phr);
    const hasHR=phrs.length>0;
    const setMin=3;
    const restMin=Math.max(0,elapsedMin-phrs.length*setMin);
    const zoneMins=HR_ZONES.slice().reverse().map(z=>{
      const setsInZone=phrs.filter(p=>p>=z.lo&&p<=z.hi).length;
      let m=setsInZone*setMin;
      if(z.label==="Fat Burn") m+=Math.round(restMin*0.6);
      if(z.label==="Recovery") m+=Math.round(restMin*0.4);
      return{...z,mins:m};
    }).reverse();
    const totalZoneMin=zoneMins.reduce((s,z)=>s+z.mins,0)||1;

    // ── kcal estimate (MET-based hybrid, Ainsworth 2011) ──────
    // LBM-based, zone-fraction-weighted, EPOC-adjusted.
    // Displayed as range ±15% to reflect estimation uncertainty.
    const avgPhr       = hasHR ? phrs.reduce((a,b)=>a+b,0)/phrs.length : 0;
    const z4lo         = HR_ZONES[3].lo;
    const setsInThresh = phrs.filter(h => h >= z4lo).length;
    const kcalRange    = hasHR
      ? kcalEstimate({ durationMin: elapsedMin, totalSets: phrs.length, setsInThreshold: setsInThresh })
      : null;
    const kcal = kcalRange ? kcalRange.est : null;

    return(
      <div style={{...shell,padding:"40px 20px 36px",paddingTop:"calc(40px + env(safe-area-inset-top))"}}>
        <style>{FONTS}</style>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,letterSpacing:"0.06em",lineHeight:1,marginBottom:6}}>
          <span style={{color:C.red}}>IRON</span><span style={{color:C.wht}}>Q</span>
        </div>
        <SL color={C.md}>Session Complete{sessionDate?` · ${sessionDate}`:""}</SL>
        {isPerfect&&(
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,
            color:C.gld,letterSpacing:"0.2em",marginBottom:4}}>
            PERFECT GAME
          </div>
        )}

        {/* Score + Time/Zone side by side */}
        <div style={{display:"flex",alignItems:"flex-start",gap:16,marginBottom:2}}>
          {/* Left: big score */}
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:112,lineHeight:1,
            color:sc,textShadow:fs.total>=70?`0 0 48px ${sc}55`:undefined,flexShrink:0}}>
            {fs.total}
          </div>

          {/* Right: time + zone breakdown */}
          <div style={{flex:1,paddingTop:8}}>
            {/* Duration */}
            <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:10}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,
                color:C.wht,lineHeight:1}}>{elapsedMin}</div>
              <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,
                fontSize:11,color:C.md,letterSpacing:"0.12em"}}>MIN</div>
            </div>

            {/* Zone bars */}
            {hasHR?(
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {zoneMins.filter(z=>z.mins>0).map(z=>(
                  <div key={z.label}>
                    <div style={{display:"flex",justifyContent:"space-between",
                      marginBottom:2}}>
                      <span style={{fontFamily:"'Inter',sans-serif",fontWeight:700,
                        fontSize:9,color:z.color,letterSpacing:"0.08em",
                        textTransform:"uppercase"}}>{z.label}</span>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",
                        fontWeight:700,fontSize:9,color:C.md}}>{z.mins}m</span>
                    </div>
                    <div style={{background:C.inner,borderRadius:3,height:5}}>
                      <div style={{
                        width:`${Math.round(z.mins/totalZoneMin*100)}%`,
                        height:"100%",borderRadius:3,
                        background:z.color,opacity:0.85}}/>
                    </div>
                  </div>
                ))}
              </div>
            ):(
              <div style={{fontFamily:"'Inter',sans-serif",fontWeight:600,
                fontSize:10,color:C.md,letterSpacing:"0.08em",lineHeight:1.6}}>
                NO HR DATA{"\n"}Charge watch{"\n"}for zones
              </div>
            )}
          </div>
        </div>

        <Div/>
        <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:16,
          color:C.lt,marginBottom:28}}>out of 100{isPerfect?" — PERFECT":""}</div>

        <div style={{background:STEEL,borderRadius:12,padding:"18px 20px",
          marginBottom:14,border:`1px solid ${C.bdr}`,borderTop:`1px solid ${C.bdrTop}`,
          boxShadow:"0 4px 18px rgba(0,0,0,0.45),inset 0 1px 0 rgba(255,255,255,0.05)"}}>
          <SL color={C.md}>Score Breakdown</SL>

          {/* Energy Burned — kcal estimate, no /max scoring */}
          <div style={{marginBottom:14,paddingBottom:14,
            borderBottom:`1px solid ${C.bdr}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
              <span style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:14,color:C.lt}}>
                Energy Burned
              </span>
              <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,
                color:kcal?C.gld:C.md,letterSpacing:"0.02em"}}>
                {kcalRange?`~${kcalRange.est.toLocaleString()}`:"—"}
                <span style={{fontSize:13,color:C.md,marginLeft:6,letterSpacing:"0.1em"}}>KCAL</span>
              </span>
            </div>
            <div style={{fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:11,
              color:C.md,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:2}}>
              {kcalRange
                ? `~${kcalRange.low.toLocaleString()}–${kcalRange.high.toLocaleString()} kcal range · ${elapsedMin} min · MET-based`
                : `No HR data logged`}
            </div>
          </div>

          {[
            {label:"Muscle Development",v:fs.muscle,max:45},
            {label:"Cardiovascular",    v:fs.cv,    max:15},
            {label:"Foundational",      v:fs.found, max:15},
          ].map(({label,v,max})=>(
            <div key={label} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:14,color:C.lt}}>
                  {label}
                </span>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,fontSize:15,
                  color:v>=max?C.grn:C.wht}}>{v}/{max}</span>
              </div>
              <div style={{background:C.inner,borderRadius:5,height:8,border:`1px solid ${C.bdr}`}}>
                <div style={{
                  background:v>=max
                    ?"linear-gradient(90deg,#22dd66,#15993f)"
                    :"linear-gradient(90deg,#e8260a,#aa1a00)",
                  height:"100%",width:`${(v/max)*100}%`,borderRadius:4,
                  transition:"width 0.8s ease",
                  boxShadow:v>=max?"0 0 8px rgba(34,221,102,0.4)":"0 0 8px rgba(200,38,0,0.35)",
                }}/>
              </div>
            </div>
          ))}
        </div>

        {/* HR graph — per-set PHR over session, with zone bands */}
        {(() => {
          // Gather PHR points in chronological order
          const phrPoints = log
            .map((s, idx) => ({ idx, phr: s.phr, exercise: s.exercise }))
            .filter(p => p.phr > 0);
          if (phrPoints.length === 0) return null;

          // Chart geometry
          const VW = 320, VH = 150;
          const padL = 28, padR = 8, padT = 6, padB = 16;
          const plotW = VW - padL - padR;
          const plotH = VH - padT - padB;

          // Y range — span comfortably around the zones
          const hrMin = 60, hrMax = Math.max(180, Math.max(...phrPoints.map(p => p.phr)) + 5);
          const yOf = (hr) => padT + plotH - ((hr - hrMin) / (hrMax - hrMin)) * plotH;
          // X — evenly distribute PHR points across the plot
          const n = phrPoints.length;
          const xOf = (i) => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);

          const avgPhrValue = Math.round(phrPoints.reduce((s, p) => s + p.phr, 0) / n);
          const polylinePts = phrPoints.map((p, i) => `${xOf(i).toFixed(1)},${yOf(p.phr).toFixed(1)}`).join(" ");

          // Y-axis ticks at zone boundaries (top of each zone) within range
          const yTicks = HR_ZONES.map(z => z.lo).filter(v => v >= hrMin && v <= hrMax);

          return (
            <div style={{background:STEEL,borderRadius:12,padding:"14px 16px 12px",
              marginBottom:14,border:`1px solid ${C.bdr}`,borderTop:`1px solid ${C.bdrTop}`,
              boxShadow:"0 4px 18px rgba(0,0,0,0.45),inset 0 1px 0 rgba(255,255,255,0.05)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",
                marginBottom:8}}>
                <SL color={C.md}>Heart Rate</SL>
                <div style={{fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:10,
                  color:C.md,letterSpacing:"0.1em",textTransform:"uppercase"}}>
                  {n} {n===1?"SET":"SETS"} · AVG {avgPhrValue} BPM
                </div>
              </div>
              <svg viewBox={`0 0 ${VW} ${VH}`} style={{width:"100%",height:"auto",display:"block"}}
                preserveAspectRatio="none">
                {/* Zone background bands */}
                {HR_ZONES.map((z) => {
                  const top    = Math.max(z.lo,  hrMin);
                  const bottom = Math.min(z.hi === 999 ? hrMax : z.hi, hrMax);
                  if (bottom <= top) return null;
                  const y = yOf(bottom);
                  const h = yOf(top) - y;
                  return (
                    <rect key={z.label} x={padL} y={y} width={plotW} height={h}
                      fill={z.color} opacity="0.10" />
                  );
                })}
                {/* Zone tick labels on Y axis */}
                {yTicks.map(v => (
                  <g key={v}>
                    <line x1={padL} x2={VW-padR} y1={yOf(v)} y2={yOf(v)}
                      stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
                    <text x={padL-4} y={yOf(v)+3} fontSize="8" fill="rgba(255,255,255,0.45)"
                      textAnchor="end" fontFamily="'JetBrains Mono',monospace">{v}</text>
                  </g>
                ))}
                {/* Polyline connecting PHR points */}
                {n > 1 && (
                  <polyline points={polylinePts}
                    fill="none" stroke={C.lt} strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round" />
                )}
                {/* Per-set dots, colored by zone */}
                {phrPoints.map((p, i) => {
                  const z = getZone(p.phr);
                  return (
                    <circle key={i} cx={xOf(i)} cy={yOf(p.phr)} r="3"
                      fill={z.color} stroke="#0a0a0a" strokeWidth="1" />
                  );
                })}
              </svg>
              {/* Zone legend strip */}
              <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                {HR_ZONES.map(z => {
                  const inZone = phrPoints.filter(p => p.phr>=z.lo && p.phr<=z.hi).length;
                  if (inZone === 0) return null;
                  return (
                    <div key={z.label} style={{display:"flex",alignItems:"center",gap:4}}>
                      <div style={{width:6,height:6,borderRadius:3,background:z.color}}/>
                      <span style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:9,
                        color:C.md,letterSpacing:"0.06em",textTransform:"uppercase"}}>
                        {z.label} · {inZone}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <div style={{display:"flex",gap:10,marginBottom:28}}>
          {[
            {label:"Total Sets",val:log.length,   c:C.wht},
            {label:"PRs Hit",   val:hits.length,  c:hits.length?C.gld:C.wht},
          ].map(({label,val,c})=>(
            <div key={label} style={{flex:1,background:STEEL,borderRadius:12,
              padding:"16px",border:`1px solid ${C.bdr}`,borderTop:`1px solid ${C.bdrTop}`,
              textAlign:"center",boxShadow:"0 3px 12px rgba(0,0,0,0.4)"}}>
              <div style={{fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:11,
                color:C.md,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:6}}>
                {label}
              </div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:56,color:c,lineHeight:1}}>
                {val}
              </div>
            </div>
          ))}
        </div>
        <div style={{flex:1}}/>
        <button className="t"
          onClick={()=>{
            // Build a plain-text session summary for the user's mail client.
            const lines = [];
            lines.push(`IronQ · ${sessionDate || ""}`.trim());
            lines.push(`${sesType?.toUpperCase() || "SESSION"} · ${elapsedMin} min · Score ${fs.total}/100`);
            lines.push("");
            if (kcal) lines.push(`Energy: ${kcal.toLocaleString()} kcal · Avg HR ${Math.round(avgPhr)}`);
            const workingSets = log.length;
            lines.push(`Sets: ${workingSets} working · ${hits.length} PRs`);
            lines.push("");
            lines.push("Score breakdown:");
            lines.push(`  Muscle Development  ${fs.muscle} / 45`);
            lines.push(`  Cardiovascular      ${fs.cv} / 15`);
            lines.push(`  Foundational        ${fs.found} / 15`);
            if (hasHR) {
              lines.push("");
              lines.push("Zone time:");
              zoneMins.filter(z=>z.mins>0).forEach(z=>{
                lines.push(`  ${z.label.padEnd(12)} ${z.mins}m`);
              });
            }
            lines.push("");
            lines.push("Exercise log:");
            // Group log entries by exercise (preserve order)
            const order = [];
            const byEx = {};
            log.forEach(s=>{
              if (!byEx[s.exercise]) { byEx[s.exercise] = []; order.push(s.exercise); }
              byEx[s.exercise].push(s);
            });
            order.forEach(exName=>{
              lines.push(`  ${exName}`);
              byEx[exName].forEach((s,i)=>{
                const prTag = s.result==="exceeded" && hits.includes(s.exercise) ? " (PR)" : "";
                const hr    = s.phr ? ` @ ${s.phr}` : "";
                lines.push(`    ${i+1}: ${s.weight}×${s.reps}${prTag}${hr}`);
              });
            });
            const subject = `IronQ · ${sessionDate || ""} · ${sesType?.toUpperCase() || ""} · ${fs.total}/100`;
            const body = lines.join("\n");
            window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          }}
          style={{width:"100%",height:48,marginBottom:10,
            background:"rgba(255,255,255,0.06)",border:`1px solid ${C.bdr}`,
            borderRadius:10,cursor:"pointer",color:C.lt,
            fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:"0.1em"}}>
          Email Session
        </button>
        <RedBtn onClick={reset}>New Game</RedBtn>
      </div>
    );
  }

  // ── SESSION / GAME SCREEN ─────────────────────────────────
  const isCompound=m.compound;
  const sc=score.total>=90?C.grn:score.total>=70?C.wht:C.gld;

  return(
    <div style={{...shell,paddingTop:0}}>
      <style>{FONTS}</style>

      {prFlash&&(
        <div style={{position:"fixed",top:0,left:0,right:0,zIndex:200,
          background:`linear-gradient(90deg,${C.red},${C.redDk})`,
          color:"#fff",textAlign:"center",padding:"14px",
          fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:"0.14em",
          boxShadow:`0 4px 24px ${C.redGlow}`,
          animation:"pr 3s ease forwards"}}>
          NEW PR — {prFlash} — {tgt} LBS
        </div>
      )}

      {wConf&&(
        <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.92)",
          display:"flex",flexDirection:"column",alignItems:"center",
          justifyContent:"center",padding:24,gap:16}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:40,color:C.gld}}>
            Load Change Alert
          </div>
          <div style={{height:2,width:80,background:C.red}}/>
          <div style={{fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:16,
            color:C.wht,textAlign:"center",lineHeight:1.65}}>
            New load: <strong>{wConf.wt} lbs</strong><br/>50%+ from last set.
          </div>
          <RedBtn onClick={()=>doLog(wConf.res,wConf.wt,wConf.reps)}>Confirm {wConf.wt} lbs</RedBtn>
          <button className="t" onClick={()=>setWConf(null)} style={{
            width:"100%",height:52,border:`1px solid ${C.bdr}`,borderRadius:10,
            background:"transparent",color:C.lt,cursor:"pointer",
            fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:15,
          }}>Cancel</button>
        </div>
      )}

      {/* ── SCORE BAR — needs to be readable glance distance ── */}
      <div style={{background:STEEL,borderBottom:`2px solid ${C.bdr}`,
        padding:"10px 18px",paddingTop:"calc(10px + env(safe-area-inset-top))",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        boxShadow:"0 2px 14px rgba(0,0,0,0.5)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {/* Back chevron — phase-aware: cancels current logging/phr, undoes last logged set, or returns to setup */}
          <button className="t"
            onClick={()=>{
              if(phase==="phr"){setPendingResult(null);setPhase("ready");setWeightAdj(0);return;}
              if(phase==="logging"){setPhase("ready");setWeightAdj(0);return;}
              if(log.length>0){undoLastSet();return;}
              setScreen("setup");
            }}
            style={{width:36,height:36,borderRadius:8,cursor:"pointer",
              background:"rgba(255,255,255,0.10)",
              border:`1px solid ${C.bdrTop}`,
              color:C.wht,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontFamily:"'Bebas Neue',sans-serif",fontSize:22,lineHeight:1,padding:0,
              flexShrink:0}}
            title="Back">
            ←
          </button>
          <div>
            {/* Label: md = #aaaaaa = 7:1 on card = readable */}
            <div style={{fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:10,
              color:C.md,letterSpacing:"0.18em",textTransform:"uppercase"}}>EXERCISE</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,lineHeight:1,color:C.wht}}>
              {exIdx+1}<span style={{color:C.md}}>/{exList.length}</span>
            </div>
          </div>
        </div>

        {/* Score — the centrepiece of the game */}
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:"0.06em",lineHeight:1,marginBottom:1}}>
            <span style={{color:C.red}}>IRON</span><span style={{color:C.wht}}>Q</span>
          </div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:68,lineHeight:1,color:sc,
            textShadow:score.total>=70?`0 0 22px ${sc}55`:undefined}}>
            {score.total}
          </div>
          <div style={{fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:9,
            color:C.md,letterSpacing:"0.16em",textTransform:"uppercase"}}>SCORE / 100</div>
        </div>

        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:10,
            color:C.md,letterSpacing:"0.18em",textTransform:"uppercase"}}>SETS</div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,lineHeight:1,color:C.wht}}>
            {log.length}
            {(phase==="logging"||phase==="phr")&&(
              <span style={{color:C.red,fontSize:22,lineHeight:1}}>+</span>
            )}
            <span style={{color:C.md}}>/{totS}</span>
          </div>
          <div style={{fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:10,
            color:C.md,letterSpacing:"0.06em",marginTop:1}}>
            {elapsedStr()} MIN
            {sessionDate&&(
              <div style={{fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:9,
                color:"rgba(255,255,255,0.3)",letterSpacing:"0.06em",marginTop:1}}>
                {sessionDate}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-score bars removed — C1: shown on complete screen only */}

      {/* Exercise content */}
      {ex&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",padding:"18px 18px 0"}}>
          <div style={{marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              {m.priority&&(
                <span style={{fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:11,
                  color:"#fff",background:`linear-gradient(135deg,${C.red},${C.redDk})`,
                  borderRadius:5,padding:"4px 10px",letterSpacing:"0.1em",
                  textTransform:"uppercase",boxShadow:`0 2px 10px ${C.redGlow}`}}>
                  Priority
                </span>
              )}
              {m.mandatory&&(
                <span style={{fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:11,
                  color:C.wht,background:C.card,border:`1px solid ${C.bdrTop}`,
                  borderRadius:5,padding:"4px 10px",letterSpacing:"0.1em",textTransform:"uppercase"}}>
                  Mandatory
                </span>
              )}

            </div>

            <div onClick={()=>{if(phase==="ready")setShowExPicker(true);}}
              style={{fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"0.04em",
              lineHeight:1.05,color:C.wht,
              fontSize:ex.name.length>20?34:44,marginBottom:6,
              display:"flex",alignItems:"baseline",gap:10,flexWrap:"wrap",
              cursor:phase==="ready"?"pointer":"default"}}>
              {ex.name}
              {phase==="ready"&&(
                /* F-CHANGEEX1: swap icon (lucide ArrowLeftRight path, inlined —
                   no lucide-react dependency). Entire title row opens picker. */
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke={C.md} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{flexShrink:0,alignSelf:"center"}} aria-label="Change exercise">
                  <path d="M8 3 4 7l4 4"/><path d="M4 7h16"/>
                  <path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>
                </svg>
              )}
              {m.brand&&(
                <button className="t" onClick={(e)=>{e.stopPropagation();setShowBrandInfo(v=>!v);}}
                  style={{fontFamily:"'Inter',sans-serif",fontWeight:700,
                    fontSize:11,color:C.md,letterSpacing:"0.1em",
                    background:"rgba(255,255,255,0.07)",border:`1px solid ${C.bdr}`,
                    borderRadius:4,padding:"2px 7px",cursor:"pointer",
                    textTransform:"uppercase",lineHeight:1.6,flexShrink:0}}>
                  {m.brand} ⓘ
                </button>
              )}
            </div>
            {m.brand&&showBrandInfo&&(
              <div style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${C.bdr}`,
                borderRadius:8,padding:"8px 12px",marginBottom:6,
                fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:12,
                color:C.lt,letterSpacing:"0.04em"}}>
                {m.brand} = {m.brandFull||m.brand}
                {m.brand==="LF"&&" · Life Fitness plate-loaded machine. Machine photos coming soon."}
              </div>
            )}
            <div style={{height:1,background:`linear-gradient(90deg,${C.bdrTop},transparent)`,marginBottom:8}}/>
          </div>

          {phase==="ready"?(
            <>

              {/* Last session reference — shown at exercise open (setIdx===0) only */}
              {setIdx===0&&prs[ex.name]&&!prs[ex.name].bw&&(
                <div style={{background:"rgba(255,255,255,0.04)",
                  border:`1px solid ${C.bdr}`,
                  borderTop:"1px solid rgba(255,255,255,0.09)",
                  borderRadius:10,padding:"8px 14px",marginBottom:10,
                  display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:10,
                    color:C.md,letterSpacing:"0.16em",textTransform:"uppercase"}}>
                    Last Session
                  </div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,
                    color:C.lt,letterSpacing:"0.04em"}}>
                    {prs[ex.name].weight}
                    <span style={{fontFamily:"'Inter',sans-serif",fontWeight:700,
                      fontSize:11,color:C.md,letterSpacing:"0.1em",margin:"0 4px"}}>×</span>
                    {prs[ex.name].reps}
                    <span style={{fontFamily:"'Inter',sans-serif",fontWeight:600,
                      fontSize:11,color:C.md,letterSpacing:"0.06em",marginLeft:5}}>
                      {prs[ex.name].unit==="sec"?"sec":"lbs"}
                    </span>
                  </div>
                </div>
              )}

              {/* Load card */}
              <div style={{background:STEEL,borderRadius:12,
                border:`1px solid ${C.bdr}`,
                borderTop:`1px solid ${C.bdrTop}`,
                padding:"10px 14px",marginBottom:10,
                boxShadow:"0 4px 18px rgba(0,0,0,0.45),inset 0 1px 0 rgba(255,255,255,0.05)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <SL color={C.md}>
                    {m.eq==="bodyweight" ? "Load"
                      : m.eq==="bw-load"    ? "Added Load"
                      : m.eq==="stack-pin"  ? "Stack Weight"
                      : m.eq==="dumbbell"   ? `${adjWt} lbs${m.perArm?" / arm":""}`
                      : m.eq==="barbell"    ? `Olympic Bar · 44 lbs`
                      : m.eq==="smith"      ? "Smith Machine · 20 lbs"
                      : "Plate Loaded"}
                  </SL>
                  {atCeiling&&(
                    <div style={{background:"rgba(255,180,0,0.15)",
                      border:"1px solid rgba(255,180,0,0.5)",
                      borderRadius:4,padding:"2px 7px",
                      fontFamily:"'Inter',sans-serif",fontWeight:700,
                      fontSize:9,color:"#ffb400",letterSpacing:"0.1em",
                      textTransform:"uppercase"}}>Gym Max</div>
                  )}
                </div>
                {isBw?(
                  <div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:46,
                      color:C.lt}}>
                      {prs[ex.name]?.unit==="sec"?`/ ${prs[ex.name].reps} sec`:""}
                    </div>
                  </div>
                ):(
                  <>
                    {/* 3-column load row: [plates] [weight] [±buttons] */}
                    <div style={{display:"flex",alignItems:"flex-start",
                      gap:10,marginBottom:8}}>

                      {/* F-PLVIZ1 — LEFT: plate loadout as per-denomination circle
                          stacks. Only identical weights overlap (each disc covers
                          80% of the one below). Count digit below each stack.
                          Tap a stack to remove one plate (a pair on bilateral).
                          Monochrome per spec 2026-07-20. Hidden for stack machines. */}
                      {eq.showPlates&&loadout.length>0&&(
                        <div style={{display:"flex",alignItems:"flex-end",
                          gap:8,alignSelf:"center",flexShrink:0}}>
                          {loadout.filter(l=>!l.rem).map(({plate,count})=>{
                            const SZ={45:34,25:30,10:26,5:22}[plate]||22;
                            const step=Math.max(4,Math.round(SZ*0.2));
                            const h=SZ+step*(count-1);
                            return (
                              <div key={plate} className="t"
                                onClick={()=>setWeightAdj(a=>a-plate*(eq.bilateral?2:1))}
                                style={{display:"flex",flexDirection:"column",
                                  alignItems:"center",gap:3,cursor:"pointer"}}>
                                <div style={{position:"relative",width:SZ,height:h}}>
                                  {Array.from({length:count}).map((_,i)=>(
                                    <div key={i} style={{position:"absolute",left:0,
                                      bottom:i*step,width:SZ,height:SZ,
                                      borderRadius:"50%",background:"#2c2c2e",
                                      border:"1.5px solid #48484a",
                                      display:"flex",alignItems:"center",
                                      justifyContent:"center",
                                      fontFamily:"'Bebas Neue',sans-serif",
                                      fontSize:Math.round(SZ*0.4),color:C.lt}}>
                                      {plate}</div>
                                  ))}
                                </div>
                                <div style={{fontFamily:"'Bebas Neue',sans-serif",
                                  fontSize:13,color:C.md,lineHeight:1}}>{count}</div>
                              </div>
                            );
                          })}
                          {loadout.some(l=>l.rem)&&(
                            <div style={{fontFamily:"'Bebas Neue',sans-serif",
                              fontSize:12,color:C.md,alignSelf:"center"}}>
                              +{loadout.find(l=>l.rem).plate}</div>
                          )}
                          {m.maxPlate&&m.maxPlate<45&&(
                            <div style={{fontFamily:"'Inter',sans-serif",fontSize:8,
                              color:C.md,alignSelf:"center"}}>max {m.maxPlate}lb</div>
                          )}
                        </div>
                      )}

                      {/* CENTER: weight number only. F-PLVIZ1: red when the
                          plate visualization is active. */}
                      <div style={{flexShrink:0}}>
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",
                          fontSize:80,lineHeight:1,
                          color:eq.showPlates?C.red:C.wht,
                          textShadow:"0 0 30px rgba(255,255,255,0.07)"}}>{adjWt}</div>
                      </div>

                      {/* RIGHT — F-PLVIZ1: plate equipment gets a 2x2 circle
                          picker (45 25 / 10 5); tap adds one plate (a pair on
                          bilateral). Removal = tap the loaded stack on the left.
                          Non-plate equipment keeps legacy ± step buttons. */}
                      {eq.showPlates ? (
                        <div style={{display:"flex",flexDirection:"column",
                          gap:8,marginLeft:"auto",alignSelf:"center"}}>
                          {[[45,25],[10,5]].map((rowP,ri)=>(
                            <div key={ri} style={{display:"flex",gap:8}}>
                              {rowP.filter(p=>p<=(m.maxPlate||45)).map(p=>(
                                <button key={p} className="t"
                                  onClick={()=>setWeightAdj(a=>a+p*(eq.bilateral?2:1))}
                                  style={{width:34,height:34,borderRadius:"50%",
                                    fontFamily:"'Bebas Neue',sans-serif",
                                    fontSize:13,color:C.md,
                                    background:"transparent",
                                    border:"1.5px solid #48484a",
                                    display:"flex",alignItems:"center",
                                    justifyContent:"center",cursor:"pointer",
                                    padding:0,letterSpacing:"0.02em"}}>
                                  {p}
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : (
                      <div style={{flex:1,display:"flex",
                        flexDirection:"column",gap:5,marginLeft:"auto"}}>
                        {/* Plus row — top */}
                        <div style={{display:"flex",gap:4}}>
                          {(m.steps||eq.steps).map(p=>(
                            <button key={`p${p}`} className="t"
                              onClick={()=>setWeightAdj(a=>a+p)}
                              style={{flex:1,fontFamily:"'Bebas Neue',sans-serif",
                                fontSize:13,color:C.grn,
                                background:"rgba(34,221,102,0.1)",
                                border:`1px solid rgba(34,221,102,0.4)`,
                                borderRadius:6,padding:"5px 0",
                                cursor:"pointer",letterSpacing:"0.04em"}}>
                              +{p}
                            </button>
                          ))}
                        </div>
                        {/* Minus row — bottom */}
                        <div style={{display:"flex",gap:4}}>
                          {(m.steps||eq.steps).map(p=>(
                            <button key={`m${p}`} className="t"
                              onClick={()=>setWeightAdj(a=>a-p)}
                              style={{flex:1,fontFamily:"'Bebas Neue',sans-serif",
                                fontSize:13,color:C.red,
                                background:"rgba(232,38,10,0.14)",
                                border:`1px solid rgba(232,38,10,0.5)`,
                                borderRadius:6,padding:"5px 0",
                                cursor:"pointer",letterSpacing:"0.04em"}}>
                              −{p}
                            </button>
                          ))}
                        </div>
                      </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* HR card */}
              <div style={{background:STEEL,borderRadius:12,
                border:`1px solid ${C.bdr}`,borderTop:`1px solid ${C.bdrTop}`,
                padding:"14px 18px",marginBottom:12,
                boxShadow:"0 3px 14px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.05)"}}>
                {/* F-HRREPS1 — text labels replaced by icons. Heart (HR) and a
                   circular-arrows+tally glyph (reps) sit to the LEFT of each
                   value, vertically centered with it. Icon box tracks the value
                   font-size (HRREPS_ICON) so heights match. */}
                {(()=>{ const HRREPS_ICON=42; const VAL_FS=44; return (
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <svg width={HRREPS_ICON} height={HRREPS_ICON} viewBox="0 0 24 24"
                      aria-hidden="true" style={{flexShrink:0,display:"block",color:C.red}}>
                      <path fill="currentColor" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:VAL_FS,
                      lineHeight:1,color:isCompound?C.red:C.wht}}>
                      {m.tier==="P1" ? START_HR.compound_p1
                        : isCompound ? START_HR.compound_p2
                        : START_HR.isolation}
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <svg width={HRREPS_ICON} height={HRREPS_ICON} viewBox="0 0 24 24" fill="none"
                      stroke={C.lt} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                      aria-hidden="true" style={{flexShrink:0,display:"block"}}>
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                      <path d="M21 3v5h-5"/>
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                      <path d="M3 21v-5h5"/>
                      <g strokeWidth="1.7">
                        <line x1="9" y1="9.3" x2="9" y2="14.7"/>
                        <line x1="11" y1="9.3" x2="11" y2="14.7"/>
                        <line x1="13" y1="9.3" x2="13" y2="14.7"/>
                        <line x1="15" y1="9.3" x2="15" y2="14.7"/>
                        <line x1="8.2" y1="14.9" x2="15.8" y2="9.1"/>
                      </g>
                    </svg>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:VAL_FS,
                      lineHeight:1,color:C.lt}}>
                      {ex.repRange}
                    </div>
                  </div>
                </div>
                ); })()}
              </div>
              <div style={{flex:1}}/>
            </>
          ):(
            <div style={{flex:1,display:"flex",flexDirection:"column",
              justifyContent:"center",alignItems:"center",gap:10}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,color:C.wht}}>
                {isBw?"Bodyweight":`${adjWt} lbs`}
              </div>
              <div style={{height:2,width:60,background:C.red}}/>
              <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:18,color:C.lt}}>
                Target: {ex.unit==="sec"?`${ex.targetReps} sec`:`${lastRes==="exceeded"?ex.targetReps+2:lastRes==="fell_short"?Math.max(ex.targetReps-2,1):ex.targetReps} reps`}
              </div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",
                fontSize:18,color:C.md,marginTop:8,letterSpacing:"0.12em"}}>
                {/* F-OPENSETS1: count-up, no per-exercise cap */}
                Set {setIdx+1}
              </div>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM — THUMB ZONE */}
      <div style={{padding:"14px 18px 42px",background:C.page,borderTop:`2px solid ${C.bdr}`}}>
        {phase==="ready"?(
          <>
          <RedBtn onClick={()=>setPhase("logging")} h={70}>
            {`Begin Set ${setIdx+1}`}
          </RedBtn>
          {/* F-OPENSETS1 — manual exercise advance replaces the removed
              auto-advance. On the last exercise this finishes the session. */}
          <button className="t" onClick={()=>{
              if(exIdx+1>=exList.length){
                if(!window.confirm('Last exercise — finish session?')) return;
                setSessionEnd(Date.now());setScreen("complete");return;
              }
              setExIdx(i=>i+1);setSetIdx(0);setLastRes(null);
              setLastWt(null);setWeightAdj(0);setPhase("ready");
            }}
            style={{width:"100%",height:46,marginTop:8,
              background:"transparent",border:`1px solid ${C.bdr}`,
              borderRadius:10,cursor:"pointer",
              fontFamily:"'Bebas Neue',sans-serif",fontSize:17,
              color:C.lt,letterSpacing:"0.12em"}}>
            {exIdx+1>=exList.length?"Finish Session →":"Next Exercise →"}
          </button>
          </>
        ):phase==="phr"?(
          /* ── PHR ENTRY ───────────────────────────────────── */
          <div>
            <div style={{marginBottom:14}}>
              {/* Set count label — keeps the current set number visible on the BPM screen */}
              <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:10,
                color:C.md,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:6}}>
                Peak Heart Rate · Set {setIdx+1}
              </div>
              {/* BPM display */}
              <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:12}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:80,
                  lineHeight:1,color:C.wht}}>{phrInput}</div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,
                  color:C.red}}>BPM</div>
              </div>
              {/* Quick-select — clean increments of 10 (80–140 BPM), zone-tinted */}
              <div style={{display:"flex",gap:4,marginBottom:10}}>
                {[80,90,100,110,120,130,140].map(v=>{
                  const zone = HR_ZONES.find(z=>v>=z.lo&&v<=z.hi) || HR_ZONES[0];
                  const active = phrInput===v;
                  return (
                    <button key={v} className="t" onClick={()=>setPhrInput(v)} style={{
                      flex:1,borderRadius:7,cursor:"pointer",padding:"5px 0",
                      background:active?`${zone.color}22`:"rgba(255,255,255,0.05)",
                      border:`1px solid ${active?zone.color:C.bdr}`,
                      color:active?zone.color:C.md,
                      display:"flex",flexDirection:"column",alignItems:"center",gap:1,
                    }}>
                      <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,letterSpacing:"0.04em"}}>{v}</span>
                      <span style={{fontFamily:"'Inter',sans-serif",fontSize:8,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>{zone.label.split(" ")[0]}</span>
                    </button>
                  );
                })}
              </div>
              {/* Fine-tune ±1 ±5 */}
              <div style={{display:"flex",gap:6}}>
                {[-5,-1,1,5].map(d=>(
                  <button key={d} className="t"
                    onClick={()=>setPhrInput(v=>Math.max(60,Math.min(220,v+d)))}
                    style={{flex:1,fontFamily:"'Bebas Neue',sans-serif",fontSize:14,
                      padding:"7px 0",borderRadius:7,cursor:"pointer",
                      background: d<0?"rgba(232,38,10,0.1)":"rgba(34,221,102,0.08)",
                      border:`1px solid ${d<0?"rgba(232,38,10,0.4)":"rgba(34,221,102,0.35)"}`,
                      color: d<0?C.red:C.grn,letterSpacing:"0.04em",
                    }}>{d>0?"+":""}{d}</button>
                ))}
              </div>
            </div>
            <RedBtn onClick={()=>confirmPhr(phrInput)} h={64}>
              Log Set — {phrInput} BPM
            </RedBtn>

          </div>
        ):(
          <>
            {repFeedback&&(
              <div style={{textAlign:"center",marginBottom:8,
                fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,
                letterSpacing:"0.1em",textTransform:"uppercase",
                color: repFeedback==="exceeded"||repFeedback==="ceiling" ? C.grn
                     : repFeedback==="below" ? "#ff6644" : C.md}}>
                {repFeedback==="exceeded" && `${lastReps} reps — above range · increase weight next session`}
                {repFeedback==="ceiling"  && `${lastReps} reps — at ceiling · consider adding weight`}
                {repFeedback==="within"   && `Last set: ${lastReps} reps`}
                {repFeedback==="below"    && `${lastReps} reps — below range · check load`}
              </div>
            )}
            {(() => {
              const currentReps = repInput ?? adaptedTarget;
              const colorOf = (r) => r > rangeHi ? C.grn : r < rangeLo ? "#ff6644" : C.wht;
              const bgOf    = (r) => r > rangeHi ? "rgba(34,200,100,0.10)"
                                  : r < rangeLo ? "rgba(232,38,10,0.12)"
                                  : "rgba(255,255,255,0.07)";
              const bdrOf   = (r) => r > rangeHi ? "rgba(34,200,100,0.45)"
                                  : r < rangeLo ? "rgba(232,38,10,0.5)"
                                  : "rgba(255,255,255,0.22)";
              // Quick chips at adaptedTarget ± 2, deduped, sorted, floored at 1
              const chipSet = [...new Set([
                Math.max(1, adaptedTarget - 2),
                adaptedTarget,
                adaptedTarget + 2,
              ])].sort((a,b)=>a-b);
              const stepBtn = {
                width:64,height:64,borderRadius:14,
                background:"rgba(255,255,255,0.06)",
                border:`1px solid ${C.bdr}`,cursor:"pointer",
                fontFamily:"'Bebas Neue',sans-serif",fontSize:34,color:C.wht,
                display:"flex",alignItems:"center",justifyContent:"center",
                userSelect:"none",
              };
              return (
                <>
                  {/* Stepper row — large minus, big number, large plus */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",
                    gap:18,marginBottom:14}}>
                    <button className="t"
                      onClick={()=>setRepInput(Math.max(1, currentReps - 1))}
                      style={stepBtn}>−</button>
                    <div style={{
                      minWidth:120,height:96,borderRadius:16,
                      background:bgOf(currentReps),
                      border:`2px solid ${bdrOf(currentReps)}`,
                      display:"flex",flexDirection:"column",
                      alignItems:"center",justifyContent:"center"}}>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:64,
                        lineHeight:1,color:colorOf(currentReps)}}>
                        {currentReps}
                      </div>
                      <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,
                        fontSize:9,color:C.md,letterSpacing:"0.16em",
                        textTransform:"uppercase",marginTop:2}}>
                        Reps
                      </div>
                    </div>
                    <button className="t"
                      onClick={()=>setRepInput(Math.min(99, currentReps + 1))}
                      style={stepBtn}>+</button>
                  </div>

                  {/* Quick chips — one-tap log at adaptedTarget ± 2 */}
                  <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:14}}>
                    {chipSet.map(r => (
                      <button key={r} className="t"
                        onClick={()=>attemptReps(r)}
                        style={{
                          flex:1,maxWidth:90,height:48,borderRadius:10,
                          background:bgOf(r),border:`1px solid ${bdrOf(r)}`,
                          color:colorOf(r),cursor:"pointer",
                          fontFamily:"'Bebas Neue',sans-serif",fontSize:22,
                          letterSpacing:"0.04em"}}>
                        {r}
                      </button>
                    ))}
                  </div>

                  {/* Primary Log button — commits the stepper value */}
                  <button className="t"
                    onClick={()=>attemptReps(currentReps)}
                    style={{
                      width:"100%",height:60,borderRadius:12,cursor:"pointer",
                      background:"linear-gradient(180deg,#e8260a,#aa1a00)",
                      border:"none",color:"#fff",
                      fontFamily:"'Bebas Neue',sans-serif",fontSize:22,
                      letterSpacing:"0.1em",boxShadow:`0 4px 16px ${C.redGlow}`}}>
                    Set {setIdx+1} — Log {currentReps} {currentReps===1?"Rep":"Reps"}
                  </button>
                  {/* BACK — returns to pre-set (ready) screen */}
                  <button className="t"
                    onClick={()=>{setPhase("ready");setWeightAdj(0);}}
                    style={{
                      width:"100%",marginTop:10,height:42,borderRadius:10,
                      background:"transparent",border:`1px solid ${C.bdr}`,
                      color:C.md,cursor:"pointer",
                      fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:13,
                      letterSpacing:"0.1em",textTransform:"uppercase"}}>
                    ← Back
                  </button>
                </>
              );
            })()}
          </>
        )}
        {phase==="ready"&&(
          <button className="t" onClick={()=>{
            if(!window.confirm('End session? This will finalize your workout.')) return;
            setSessionEnd(Date.now());setScreen("complete");
          }}
            style={{width:"100%",height:38,background:"transparent",
              border:"none",
              fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:12,
              color:"rgba(255,255,255,0.25)",letterSpacing:"0.12em",
              textTransform:"uppercase",marginTop:6,cursor:"pointer"}}>
            End Session
          </button>
        )}
        {/* In-session build stamp — tap to force-reload to latest build */}
        <div onClick={async()=>{
            if(!window.confirm('Reload to get the latest version? Your session will be saved and can be resumed.')) return;
            try{
              if('serviceWorker' in navigator){
                const regs=await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map(r=>r.unregister()));
              }
              if('caches' in window){
                const keys=await caches.keys();
                await Promise.all(keys.map(k=>caches.delete(k)));
              }
            }catch(e){}
            // Force hard reload — bypass cache entirely
            window.location.href=window.location.pathname+'?nocache='+Date.now();
          }}
          style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
            width:"100%",maxWidth:430,padding:"8px 18px 16px",
            background:C.page,cursor:"pointer",display:"flex",
            alignItems:"center",justifyContent:"center",zIndex:50}}>
          <div style={{
            width:"100%",padding:"6px 12px",
            background:"rgba(255,255,255,0.08)",
            border:"1px solid rgba(255,255,255,0.20)",
            borderRadius:8,display:"flex",alignItems:"center",
            justifyContent:"space-between"}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,
              fontSize:12,color:"rgba(255,255,255,0.55)",letterSpacing:"0.06em"}}>
              {BUILD_VERSION}
            </div>
            <div style={{color:"rgba(255,255,255,0.4)",display:"flex",alignItems:"center"}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* ── EXERCISE PICKER OVERLAY ───────────────────────────── */}
      {showExPicker&&(
        <div style={{position:"fixed",inset:0,zIndex:200,
          background:"rgba(0,0,0,0.82)",display:"flex",
          flexDirection:"column",justifyContent:"flex-end"}}>
          <div style={{background:"#1a1a1a",borderTop:`2px solid ${C.red}`,
            borderRadius:"18px 18px 0 0",maxHeight:"75vh",
            display:"flex",flexDirection:"column"}}>

            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",
              alignItems:"center",padding:"16px 18px 10px"}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,
                color:C.wht,letterSpacing:"0.1em"}}>Change Exercise</div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {/* + New Exercise button */}
                <button className="t" onClick={()=>{setShowNewExForm(v=>!v);setNewExName("");setNewExWeight("");setNewExReps("10");setNewExMaxWt("");setNewExPicked(false);}}
                  style={{fontFamily:"'Bebas Neue',sans-serif",fontWeight:700,
                    fontSize:14,color:"#fff",letterSpacing:"0.1em",
                    background:C.red,border:"none",
                    borderRadius:8,padding:"7px 14px",cursor:"pointer"}}>
                  + New
                </button>
                <button className="t" onClick={()=>{setShowExPicker(false);setShowNewExForm(false);setExSearch("");setExFilter("");}}
                  style={{fontFamily:"'Inter',sans-serif",fontWeight:700,
                    fontSize:12,color:C.md,letterSpacing:"0.12em",
                    background:"transparent",border:`1px solid ${C.bdr}`,
                    borderRadius:7,padding:"6px 12px",cursor:"pointer"}}>
                  CANCEL
                </button>
              </div>
            </div>

            {/* ── Smart search ───────────────────────────────── */}
            <div style={{padding:"0 12px 10px",flexShrink:0}}>
              <div style={{position:"relative"}}>
                <input
                  value={exSearch}
                  onChange={e=>setExSearch(e.target.value)}
                  placeholder="Search exercises…"
                  autoFocus
                  style={{width:"100%",boxSizing:"border-box",
                    fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:600,
                    background:"rgba(255,255,255,0.07)",
                    border:`1px solid ${exSearch.length>=2?C.red:C.bdr}`,
                    borderRadius:10,padding:"10px 36px 10px 12px",
                    color:C.wht,outline:"none"}}/>
                {exSearch.length>0&&(
                  <button className="t" onClick={()=>{setExSearch("");setExFilter("");}}
                    style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",
                      background:"transparent",border:"none",cursor:"pointer",
                      color:C.md,fontSize:16,lineHeight:1,padding:2}}>
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* ── Muscle-group filter pills ──────────────────────────────── */}
            {(()=>{
              // pill label → primary[] it matches
              const PILL_MAP = [
                {label:"CHEST",     match:["chest"]},
                {label:"BACK",      match:["lats","mid back","lower back","traps"]},
                {label:"SHOULDERS", match:["front delts","side delts","rear delts"]},
                {label:"ARMS",      match:["biceps","triceps","forearms"]},
                {label:"LEGS",      match:["quads","hamstrings","glutes","calves"]},
                {label:"CORE",      match:["abs","obliques"]},
              ];
              // session-aware ordering
              const sesOrder = sesType==="push"  ? ["CHEST","SHOULDERS","ARMS","BACK","LEGS","CORE"]
                             : sesType==="pull"  ? ["BACK","ARMS","SHOULDERS","CHEST","LEGS","CORE"]
                             : sesType==="legs"  ? ["LEGS","CORE","BACK","CHEST","SHOULDERS","ARMS"]
                             : PILL_MAP.map(p=>p.label);
              const ordered = sesOrder.map(l=>PILL_MAP.find(p=>p.label===l)).filter(Boolean);
              return(
                <div style={{overflowX:"auto",display:"flex",gap:6,
                  padding:"0 12px 10px",flexShrink:0,
                  scrollbarWidth:"none",WebkitOverflowScrolling:"touch"}}>
                  {ordered.map(pill=>{
                    const active = exFilter===pill.label;
                    return(
                      <button key={pill.label} className="t"
                        onClick={()=>setExFilter(active?"":pill.label)}
                        style={{flexShrink:0,fontFamily:"'Bebas Neue',sans-serif",
                          fontSize:13,letterSpacing:"0.1em",
                          padding:"5px 11px",borderRadius:20,cursor:"pointer",
                          border:`1px solid ${active?C.red:C.bdr}`,
                          background:active?"rgba(232,38,10,0.18)":"transparent",
                          color:active?C.red:C.md,transition:"all 0.15s"}}>
                        {pill.label}
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            {/* ── Search results (replaces normal list when query active) ── */}
            {exSearch.length>=2&&(()=>{
              const filterMatch = exFilter
                ? (()=>{const p=({CHEST:["chest"],BACK:["lats","mid back","lower back","traps"],SHOULDERS:["front delts","side delts","rear delts"],ARMS:["biceps","triceps","forearms"],LEGS:["quads","hamstrings","glutes","calves"],CORE:["abs","obliques"]})[exFilter]||[]; return s=>p.includes(s.primary);})()
                : ()=>true;
              const hits = searchMaster(exSearch, {limit:60}).filter(s=>{
                if(!filterMatch(s)) return false;
                return !exList.some((e,i)=>e.name===s.canonical&&i!==exIdx);
              });
              const isCurrent = name => exList[exIdx]?.name===name;
              return(
                <div style={{overflowY:"auto",padding:"0 12px 32px",flex:1}}>
                  {hits.length===0&&(
                    <div style={{fontFamily:"'Inter',sans-serif",fontSize:13,
                      color:C.md,textAlign:"center",padding:"24px 0"}}>
                      No matches
                    </div>
                  )}
                  {hits.map(s=>{
                    const cur = isCurrent(s.canonical);
                    return(
                      <button key={s.canonical} className="t"
                        onClick={()=>{
                          if(cur){setShowExPicker(false);setExSearch("");setExFilter("");return;}
                          if(!META[s.canonical]&&(!userMeta[s.canonical]||!userMeta[s.canonical].eq)){
                            setUserMeta(u=>({...u,[s.canonical]:{...(u[s.canonical]||{}),
                              eq:eqKeyFromDB(s.equip),
                              prPts:s.prPts||3,...(s.compound?{compound:true}:{})}}));
                          }
                          const tmpl=(TMPLS[sesType]||[]).find(e=>e.name===s.canonical);
                          const updated=[...exList];
                          updated[exIdx]={...updated[exIdx],name:s.canonical,
                            sets:       tmpl?.sets       ?? updated[exIdx].sets,
                            repRange:   tmpl?.repRange   ?? (META[s.canonical]?.compound?"6–10":"10–15"),
                            targetReps: tmpl?.targetReps ?? (META[s.canonical]?.compound?8:12),
                          };
                          setExList(updated);
                          setSetIdx(0);setLastRes(null);setLastWt(null);
                          setWeightAdj(0);setShowExPicker(false);setExSearch("");setExFilter("");
                        }}
                        style={{width:"100%",display:"flex",
                          justifyContent:"space-between",alignItems:"center",
                          background:cur?"rgba(232,38,10,0.12)":"transparent",
                          border:`1px solid ${cur?C.red:C.bdr}`,
                          borderRadius:10,padding:"12px 14px",marginBottom:6,
                          cursor:"pointer",textAlign:"left"}}>
                        <div>
                          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:17,
                            color:cur?C.red:C.wht,letterSpacing:"0.06em",
                            lineHeight:1,marginBottom:2}}>
                            {s.canonical}
                          </div>
                          <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,
                            color:C.md,fontWeight:600}}>
                            {s.primary} · {s.equip}
                          </div>
                        </div>
                        {cur&&(
                          <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,
                            fontSize:10,color:C.red,letterSpacing:"0.1em",
                            textTransform:"uppercase",flexShrink:0}}>
                            Current
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            {/* Inline new exercise form */}
            {exSearch.length<2&&showNewExForm&&(()=>{
              const suggestions = searchMaster(newExName, {limit:5});
              return (
              <div style={{margin:"0 12px 10px",background:"rgba(232,38,10,0.08)",
                border:`1px solid ${C.red}`,borderRadius:12,padding:"14px"}}>
                <div style={{fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:10,
                  color:C.red,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:10}}>
                  New Exercise
                </div>
                <input value={newExName}
                  onChange={e=>{ setNewExName(e.target.value); setNewExDuplicate(null); setNewExPicked(false); }}
                  placeholder="Type exercise name…"
                  style={{width:"100%",boxSizing:"border-box",
                    fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:600,
                    background:"rgba(255,255,255,0.06)",border:`1px solid ${C.bdr}`,
                    borderRadius:8,padding:"10px 12px",color:C.wht,
                    marginBottom:8,outline:"none"}}/>

                {/* Autocomplete suggestions — hidden once user picks one */}
                {!newExPicked&&suggestions.length>0&&newExName.length>=2&&(
                  <div style={{background:"rgba(0,0,0,0.4)",
                    border:`1px solid ${C.bdr}`,borderRadius:8,marginBottom:8,
                    overflow:"hidden",maxHeight:200,overflowY:"auto"}}>
                    {suggestions.map(s=>(
                      <button key={s.canonical} className="t"
                        onClick={()=>{ setNewExName(s.canonical); setNewExPicked(true); setNewExDuplicate(null); }}
                        style={{width:"100%",textAlign:"left",padding:"10px 12px",
                          background:"transparent",border:"none",cursor:"pointer",
                          borderBottom:`1px solid ${C.bdr}`,
                          fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:13,
                          color:C.wht,display:"flex",justifyContent:"space-between",
                          alignItems:"center",gap:8}}>
                        <span>{s.canonical}</span>
                        <span style={{fontSize:10,color:C.md,letterSpacing:"0.05em",
                          textTransform:"uppercase"}}>
                          {s.primary} · {s.equip}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Duplicate warning */}
                {newExDuplicate&&(
                  <div style={{background:"rgba(255,180,0,0.12)",
                    border:"1px solid rgba(255,180,0,0.4)",borderRadius:8,
                    padding:"10px 12px",marginBottom:8,
                    fontFamily:"'Inter',sans-serif",fontSize:13,color:"#ffb400"}}>
                    <div style={{fontWeight:700,marginBottom:6}}>
                      Already in your list: {newExDuplicate.name}
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button className="t"
                        onClick={()=>{
                          // Use the existing exercise
                          const updated=[...exList];
                          updated[exIdx]={...updated[exIdx],name:newExDuplicate.name};
                          setExList(updated);
                          setSetIdx(0);setLastRes(null);setLastWt(null);setWeightAdj(0);
                          setShowNewExForm(false);setShowExPicker(false);setExSearch("");setExFilter("");
                          setNewExDuplicate(null);setNewExName("");
                        }}
                        style={{flex:1,background:"#ffb400",color:"#000",border:"none",
                          borderRadius:6,padding:"8px 12px",cursor:"pointer",
                          fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,
                          letterSpacing:"0.06em",textTransform:"uppercase"}}>
                        Use Existing
                      </button>
                      <button className="t"
                        onClick={()=>{
                          // Bypass duplicate check — add directly
                          const name=newExName.trim();
                          if(!name) return;
                          const wt=parseInt(newExWeight)||100;
                          const rp=parseInt(newExReps)||10;
                          const mx=parseInt(newExMaxWt)||null;
                          setPrs(p=>({...p,[name]:{weight:wt,reps:rp,...(mx?{gymMax:mx}:{})}}));
                          setUserMeta(u=>({...u,[name]:{eq:newExEq,prPts:3}}));
                          const updated=[...exList];
                          updated[exIdx]={...updated[exIdx],name,repRange:"8–12",targetReps:10};
                          setExList(updated);
                          setSetIdx(0);setLastRes(null);setLastWt(null);
                          setWeightAdj(0);setShowNewExForm(false);setShowExPicker(false);setExSearch("");setExFilter("");
                          setNewExDuplicate(null);setNewExName("");
                          setNewExEq("plate-loaded");
                        }}
                        style={{flex:1,background:"transparent",
                          color:"rgba(255,180,0,0.9)",
                          border:"1px solid rgba(255,180,0,0.5)",
                          borderRadius:6,padding:"8px 12px",cursor:"pointer",
                          fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,
                          letterSpacing:"0.06em",textTransform:"uppercase"}}>
                        Add Anyway
                      </button>
                    </div>
                  </div>
                )}

                {/* Gym ceiling — max available weight at this gym */}
                <div style={{marginBottom:10}}>
                  <div style={{fontFamily:"'Inter',sans-serif",fontSize:10,fontWeight:700,
                    color:"rgba(255,180,0,0.6)",letterSpacing:"0.12em",
                    textTransform:"uppercase",marginBottom:5}}>
                    Gym Max (optional — max weight available at your gym)
                  </div>
                  <input value={newExMaxWt} onChange={e=>setNewExMaxWt(e.target.value)}
                    placeholder="e.g. 100 for 100 lb dumbbells"
                    type="number"
                    style={{width:"100%",boxSizing:"border-box",
                      fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:600,
                      background:"rgba(255,180,0,0.06)",
                      border:`1px solid rgba(255,180,0,0.35)`,
                      borderRadius:8,padding:"10px 12px",color:"#ffb400",
                      outline:"none"}}/>
                </div>
                <div style={{display:"flex",gap:8,marginBottom:8}}>
                  <input value={newExWeight} onChange={e=>setNewExWeight(e.target.value)}
                    placeholder="PR weight (lbs)" type="number"
                    style={{flex:2,fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:600,
                      background:"rgba(255,255,255,0.06)",border:`1px solid ${C.bdr}`,
                      borderRadius:8,padding:"10px 12px",color:C.wht,outline:"none"}}/>
                  <input value={newExReps} onChange={e=>setNewExReps(e.target.value)}
                    placeholder="PR reps" type="number"
                    style={{flex:1,fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:600,
                      background:"rgba(255,255,255,0.06)",border:`1px solid ${C.bdr}`,
                      borderRadius:8,padding:"10px 12px",color:C.wht,outline:"none"}}/>
                </div>

                {/* Equipment-type chip row — drives increment buttons + snap math */}
                <div style={{marginBottom:10}}>
                  <div style={{fontFamily:"'Inter',sans-serif",fontSize:10,fontWeight:700,
                    color:C.md,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6}}>
                    Equipment type
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                    {[
                      {k:"plate-loaded",l:"Plate-Loaded"},
                      {k:"stack-pin",   l:"Stack-Pin"},
                      {k:"dumbbell",    l:"Dumbbell"},
                      {k:"barbell",     l:"Barbell"},
                      {k:"smith",       l:"Smith"},
                      {k:"bodyweight",  l:"Bodyweight"},
                      {k:"bw-load",     l:"BW + Load"},
                    ].map(({k,l})=>{
                      const active = newExEq===k;
                      return(
                        <button key={k} className="t" onClick={()=>setNewExEq(k)}
                          style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,
                            color:active?"#fff":C.lt,
                            background:active?C.red:"rgba(255,255,255,0.05)",
                            border:`1px solid ${active?C.red:C.bdr}`,
                            borderRadius:7,padding:"6px 10px",cursor:"pointer",
                            letterSpacing:"0.04em"}}>
                          {l}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button className="t"
                  onClick={()=>{
                    const name=newExName.trim();
                    if(!name) return;
                    // Check fuzzy match against existing PRs
                    if(!newExDuplicate){
                      const dup = findDuplicate(name, Object.keys(prs));
                      if(dup){ setNewExDuplicate(dup); return; }
                    }
                    const wt=parseInt(newExWeight)||100;
                    const rp=parseInt(newExReps)||10;
                    const mx=parseInt(newExMaxWt)||null;
                    setPrs(p=>({...p,[name]:{weight:wt,reps:rp,...(mx?{gymMax:mx}:{})}}));
                    // Save user-defined equipment type so increment buttons + snap math work.
                    setUserMeta(u=>({...u,[name]:{eq:newExEq,prPts:3}}));
                    const updated=[...exList];
                    updated[exIdx]={...updated[exIdx],name,
                      repRange:"8–12",targetReps:10};
                    setExList(updated);
                    setSetIdx(0);setLastRes(null);setLastWt(null);
                    setWeightAdj(0);setShowNewExForm(false);setShowExPicker(false);setExSearch("");setExFilter("");
                    setNewExDuplicate(null);setNewExName("");
                    setNewExEq("plate-loaded");
                  }}
                  style={{width:"100%",fontFamily:"'Bebas Neue',sans-serif",
                    fontSize:16,color:"#fff",background:C.red,border:"none",
                    borderRadius:10,padding:"12px 0",cursor:"pointer",
                    letterSpacing:"0.08em"}}>
                  Add &amp; Select
                </button>
              </div>
              );
            })()}

            {/* Exercise list — filtered by session type, sourced from live prs */}
            {exSearch.length<2&&(
            <div style={{overflowY:"auto",padding:"0 12px 32px"}}>

              {(()=>{
                const {inCat,outCat}=exListForType(sesType,prs,customGroups);
                // Muscle-group filter
                const _musMatch = exFilter
                  ? (()=>{const _p=({CHEST:["chest"],BACK:["lats","mid back","lower back","traps"],SHOULDERS:["front delts","side delts","rear delts"],ARMS:["biceps","triceps","forearms"],LEGS:["quads","hamstrings","glutes","calves"],CORE:["abs","obliques"]})[exFilter]||[];return n=>_p.includes(EX_PRIMARY[n]||"");})()
                  : ()=>true;
                // Slot-specific alternatives from TMPLS — show first, badge as RECOMMENDED.
                const slotAlts = (TMPLS[sesType]?.[exIdx]?.alts || [])
                  .filter(n => _musMatch(n)); // browse-list fallback: alts show even without PR history
                const altSet = new Set(slotAlts);
                const inCatRemaining = inCat.filter(n => !altSet.has(n) && _musMatch(n));
                const renderEx=(name,tag)=>{
                  const pr=prs[name];
                  const isCurrent=exList[exIdx]?.name===name;
                  if(exList.some((e,i)=>e.name===name&&i!==exIdx)) return null;
                  return(
                    <button key={name} className="t"
                      onClick={()=>{
                        if(isCurrent){setShowExPicker(false);setExSearch("");setExFilter("");return;}
                        // Pull sets/repRange/targetReps from the session template
                        // so switching to RDL (4 sets) from a 3-set substitute
                        // correctly uses 4 sets — not the substitute's count.
                        const tmplEntry=(TMPLS[sesType]||[]).find(e=>e.name===name);
                        const updated=[...exList];
                        updated[exIdx]={...updated[exIdx],name,
                          sets:       tmplEntry?.sets       ?? updated[exIdx].sets,
                          repRange:   tmplEntry?.repRange   ?? (META[name]?.compound?"6–10":"10–15"),
                          targetReps: tmplEntry?.targetReps ?? (META[name]?.compound?8:12),
                        };
                        setExList(updated);
                        setSetIdx(0);setLastRes(null);setLastWt(null);
                        setWeightAdj(0);setShowExPicker(false);setExSearch("");setExFilter("");
                      }}
                      style={{width:"100%",display:"flex",
                        justifyContent:"space-between",alignItems:"center",
                        background: isCurrent?"rgba(232,38,10,0.12)":"transparent",
                        border:`1px solid ${isCurrent?C.red:C.bdr}`,
                        borderRadius:10,padding:"12px 14px",marginBottom:6,
                        cursor:"pointer",textAlign:"left"}}>
                      <div>
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:17,
                          color:isCurrent?C.red:C.wht,letterSpacing:"0.06em",
                          lineHeight:1,marginBottom:2}}>{name}</div>
                        <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,
                          color:C.md,fontWeight:600}}>
                          {tag&&<span style={{color:C.md,marginRight:4}}>{tag} · </span>}
                          {META[name]?.tier==="P1"?"P1 · ":""}
                          {META[name]?.compound?"Compound":"Isolation"}
                        </div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,
                          color:C.lt,lineHeight:1}}>{pr?.weight||"—"}</div>
                        <div style={{fontFamily:"'Inter',sans-serif",fontSize:10,
                          color:C.md,fontWeight:600}}>×{pr?.reps||"?"} PR</div>
                      </div>
                    </button>
                  );
                };
                return(
                  <>
                    {slotAlts.length>0&&(
                      <>
                        <div style={{fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:10,
                          color:C.red,letterSpacing:"0.22em",textTransform:"uppercase",
                          padding:"8px 4px 6px"}}>
                          Recommended Alternatives
                        </div>
                        {slotAlts.map(n=>renderEx(n,"ALT"))}
                        <div style={{fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:10,
                          color:C.md,letterSpacing:"0.22em",textTransform:"uppercase",
                          padding:"14px 4px 6px"}}>
                          All {sesType.charAt(0).toUpperCase()+sesType.slice(1)} Exercises
                        </div>
                      </>
                    )}
                    {inCatRemaining.map(n=>renderEx(n,null))}
                  </>
                );
              })()}
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
