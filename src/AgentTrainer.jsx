import { useState, useEffect } from "react";
import { searchExercises, findDuplicate } from "./exerciseLibrary";

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
const BUILD_VERSION = `ALPHA · ${_mo}/${_dy}/${_yr} · ${_hr12}:${_min} ${_ampm} PST`;

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

// Keytel HR-based kcal/min for males.
// kcal/min = (-55.0969 + 0.6309*HR + 0.1988*weight_kg + 0.2017*age) / 4.184
const kcalPerMin = (hr, weightKg, age) =>
  Math.max(0, (-55.0969 + 0.6309*hr + 0.1988*weightKg + 0.2017*age) / 4.184);

// ─────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────
const INIT_PRS = {
  "High Row PL":           { weight:110,  reps:12 },  // PR set May 19 2026 · Life Fitness PL machine
  "LF Incline Press":      { weight:240,  reps:10 },
  "LF Shoulder Press":     { weight:255,  reps:7  },
  "Bench Press, Smith Machine": { weight:235, reps:8 },
  "Military Press PL Machine":  { weight:180, reps:8 },
  "Seated PL Dip Machine":       { weight:320, reps:10},
  "LF Seated Dip":         { weight:290,  reps:10 },
  "HS Decline Press":      { weight:90,   reps:9  },
  "Pec Deck":              { weight:230,  reps:12 },
  "Cable Pushdown":        { weight:80,   reps:14 },
  "Seated Lateral Raise":  { weight:37.5, reps:15 },
  "Weighted Crunches":     { weight:120,  reps:6  },
  "Captain's Chair":       { weight:0,    reps:12, bw:true },
  "Barbell RDL":           { weight:225,  reps:6  },
  "Lat Pull-Down PL": { weight:240,  reps:10 },
  "LF Row":                { weight:240,  reps:10 },
  "Lever Seated Row":      { weight:360,  reps:10 },
  "Assisted Chin-Up":      { weight:172,  reps:8  },
  "Hyperextensions 45°":   { weight:90,   reps:11 },
  "DB Alternating Curl":   { weight:45,   reps:10 },
  "DB Hammer Curl":        { weight:42.5, reps:12 },
  "LF Bicep Curl":         { weight:90,   reps:10 },
  "Dead Hang":             { weight:0,    reps:37, bw:true, unit:"sec" },
  "Hip Thrust (Smith)":    { weight:275,  reps:10 },
  "Seated Leg Curl":       { weight:285,  reps:8  },
  "Linear Hack Squat PL":  { weight:230,  reps:10 },
  "Leg Extension":         { weight:260,  reps:10 },
  "Calf Press":            { weight:680,  reps:12 },
  "Calf Press, Linear Leg Press": { weight:630, reps:10 },
  "Seated Calf Raise":     { weight:180,  reps:7  },
};
// ── Equipment type registry ──────────────────────────────────
// Source of truth for how an exercise behaves: increment buttons, snap math,
// whether plate badges show, whether a bar weight floor applies.
// Every META entry MUST set `eq` to one of these keys.
const EQUIPMENT = {
  "plate-loaded": { steps:[5,10,25],  snap:5,   bilateral:true,  showPlates:true,  hasBar:false },
  "stack-pin":    { steps:[5,10,20],  snap:5,   bilateral:false, showPlates:false, hasBar:false },
  "dumbbell":     { steps:[5,10,15],  snap:2.5, bilateral:false, showPlates:false, hasBar:false },
  "barbell":      { steps:[5,10,25],  snap:5,   bilateral:true,  showPlates:true,  hasBar:true  },
  "smith":        { steps:[5,10,25],  snap:5,   bilateral:true,  showPlates:true,  hasBar:false },
  "bodyweight":   { steps:[],         snap:0,   bilateral:false, showPlates:false, hasBar:false },
};
// Helper — fetch equipment config from a META entry. Defaults to plate-loaded if missing.
const eqOf = (m) => EQUIPMENT[m?.eq] || EQUIPMENT["plate-loaded"];

const META = {
  "High Row PL":           { tier:"P1", prPts:8, compound:true, eq:"plate-loaded", brand:"LF", brandFull:"Life Fitness", warmupCue:"Activate lats + rhomboids. Scapular pulls × 10, band pull-aparts × 15." },
  "LF Incline Press":      { tier:"P1", prPts:8, compound:true, eq:"plate-loaded", warmupCue:"Activate pec minor + serratus. Light cable fly × 15, scapular push-ups × 10." },
  "LF Shoulder Press":     { tier:"P1", prPts:8, compound:true, eq:"plate-loaded", warmupCue:"Activate rear delts + rotator cuff. Band pull-aparts × 15, band external rotations × 10/side." },
  "Bench Press, Smith Machine": { tier:"P1", prPts:8, compound:true, eq:"smith", warmupCue:"Activate pecs + serratus. Push-ups × 10, scapular push-ups × 10." },
  "Military Press PL Machine":  { tier:"P1", prPts:8, compound:true, eq:"plate-loaded", warmupCue:"Activate rear delts + rotator cuff. Band pull-aparts × 15, wall slides × 10." },
  "Seated PL Dip Machine":       { tier:"P1", prPts:8, compound:true, eq:"plate-loaded", warmupCue:"Activate triceps + lower pecs. Triceps stretch × 10s/side, scapular dips × 8." },
  "LF Seated Dip":         { tier:"P2", prPts:5, compound:true, eq:"plate-loaded", warmupCue:"Activate triceps long head. Overhead triceps stretch × 10s/side." },
  "HS Decline Press":      { tier:"P2", prPts:5, compound:true, eq:"plate-loaded", perSide:true, warmupCue:"Activate lower pecs. Light press × 12, scapular push-ups × 10." },
  "Pec Deck":              { tier:"ISO",prPts:3, eq:"stack-pin" },
  "Cable Pushdown":        { tier:"ISO",prPts:3, eq:"stack-pin" },
  "Seated Lateral Raise":  { tier:"ISO",prPts:3, eq:"dumbbell" },
  "Weighted Crunches":     { tier:"CORE",prPts:0, core:true, eq:"plate-loaded" },
  "Captain's Chair":       { tier:"CORE",prPts:0, core:true, eq:"bodyweight" },
  // maxPlate=25: 45 lb plates hit the floor during RDL range of motion
  "Barbell RDL":           { tier:"P1", prPts:8, compound:true, eq:"barbell", maxPlate:25, priority:true, warmupCue:"Activate hamstrings + glutes + lower back. Hip hinge × 10 bodyweight, glute bridge × 10, cat-cow × 8." },
  "Lat Pull-Down PL":      { tier:"P1", prPts:8, compound:true, eq:"plate-loaded", warmupCue:"Activate lats + scapular depressors. Dead hang × 15s, scapular pulls × 10." },
  "LF Row":                { tier:"P2", prPts:5, compound:true, eq:"plate-loaded", warmupCue:"Activate rhomboids + mid-traps. Band rows × 15, scapular retractions × 10." },
  "Lever Seated Row":      { tier:"P2", prPts:5, compound:true, eq:"plate-loaded", warmupCue:"Activate rhomboids + mid-traps. Band rows × 15, scapular retractions × 10." },
  "Assisted Chin-Up":      { tier:"P2", prPts:5, compound:true, eq:"stack-pin", warmupCue:"Activate lats + grip. Dead hang × 15s, scapular pulls × 10." },
  "Hyperextensions 45°":   { tier:"FND",prPts:0, eq:"bodyweight", mandatory:true },
  "DB Alternating Curl":   { tier:"ISO",prPts:3, eq:"dumbbell" },
  "DB Hammer Curl":        { tier:"ISO",prPts:3, eq:"dumbbell" },
  "LF Bicep Curl":         { tier:"ISO",prPts:3, eq:"dumbbell" },
  "Dead Hang":             { tier:"GRIP",prPts:0, eq:"bodyweight", mandatory:true },
  "Hip Thrust (Smith)":    { tier:"P1", prPts:8, compound:true, eq:"smith", warmupCue:"Activate glutes. Glute bridge × 12, clamshells × 10/side, monster walks × 10 steps." },
  "Seated Leg Curl":       { tier:"P2", prPts:5, compound:true, eq:"stack-pin", warmupCue:"Activate hamstrings. Leg swings × 10/side, light reps × 12." },
  "Linear Hack Squat PL":  { tier:"P1", prPts:8, compound:true, eq:"plate-loaded", warmupCue:"Activate glutes + VMO. Bodyweight squat × 15, hip circles × 10/side, leg swings × 10/side." },
  "Leg Extension":         { tier:"ISO",prPts:3, eq:"stack-pin" },
  "Calf Press":            { tier:"ISO",prPts:3, eq:"plate-loaded" },
  "Calf Press, Linear Leg Press": { tier:"ISO",prPts:3, eq:"plate-loaded" },
  "Seated Calf Raise":     { tier:"ISO",prPts:3, eq:"plate-loaded" },
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
// Returns exercises for this session type first, then unrelated ones under "Other"
function exListForType(type, prs){
  const inCat  = (CATEGORY[type]||[]).filter(n=>prs[n]);
  const outCat = Object.keys(prs).filter(n=>!(CATEGORY[type]||[]).includes(n));
  return {inCat, outCat};
}
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

function suggestW(name,si,lw,lr,prs){
  const pr=prs[name];
  if(!pr||pr.bw) return 0;
  const w=pr.weight;
  // Set 1: respect pre-seeded lw (user already loaded a weight) else 68% of PR
  if(si===0) return lw&&lw>0 ? lw : Math.max(45,Math.round(w*0.68/5)*5);
  // Set 2+: progress from last NON-WARMUP working set based on result.
  // No more hardcoded set-2-is-82%-PR — that ignored the user's actual set-1 effort.
  if(!lw) return w;
  if(lr==="exceeded")   return Math.round(Math.min(lw+5,w*1.08)/5)*5;
  if(lr==="fell_short") return Math.round(Math.max(lw-10,w*0.75)/5)*5;
  return lw;
}
function calcScore(log,prs,ext){
  // Working sets only — warmup sets must not inflate volume, PR, or set-count scoring.
  const wlog = log.filter(s=>!s.warmup);

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
  // Include warmup PHRs since they reflect real cardiovascular load.
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
function TypeCard({type,label,muscles,Icon,selected,onClick}){
  const on=selected===type;
  return(
    <button className="t" onClick={()=>onClick(type)} style={{
      flex:1,borderRadius:12,padding:"16px 6px 14px",cursor:"pointer",
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
      {/* Icon: always white — perfect contrast on both dark and red bg */}
      <Icon sz={44} col="#ffffff"/>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:21,
        letterSpacing:"0.12em",lineHeight:1,color:C.wht}}>{label}</div>
      {/* Muscle groups — light enough to read from distance */}
      <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:10,
        lineHeight:1.35,color:on?"rgba(255,255,255,0.88)":C.lt,
        textAlign:"center",textTransform:"uppercase",letterSpacing:"0.07em"}}>
        {muscles}
      </div>
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
function Preview({type, extended, opener, onPickOpener}){
  const p=PREV[type];
  const n=extended?6:5;
  const dur=extended?"70–75 MIN":"65 MIN";
  const openerName = opener || p.opens;
  return(
    <div className="pop" style={{
      background:STEEL,borderRadius:12,
      border:`1px solid ${C.bdr}`,borderTop:`1px solid ${C.bdrTop}`,
      borderLeft:`5px solid ${C.red}`,
      padding:"18px 18px 16px",
      boxShadow:"0 4px 20px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.05)",
    }}>
      <div style={{fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:10,
        color:C.red,letterSpacing:"0.24em",textTransform:"uppercase",marginBottom:10}}>
        Session Preview
      </div>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:25,letterSpacing:"0.05em",
        color:C.wht,lineHeight:1,marginBottom:12}}>{p.muscles}</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
        {[`${n} EXERCISES`, dur,
          `${TMPLS[type].slice(0,n).reduce((s,e)=>s+e.sets,0)} SETS`
        ].map(lbl=>(
          <span key={lbl} style={{
            fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:11,
            color:C.lt,background:C.inner,border:`1px solid ${C.bdr}`,
            borderRadius:5,padding:"4px 10px",letterSpacing:"0.08em",
          }}>{lbl}</span>
        ))}
      </div>
      {/* Opens with — tappable to swap the first exercise */}
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:13,
          color:C.md}}>Opens with</span>
        <button className="t" onClick={onPickOpener} style={{
          fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:13,
          color:C.wht,background:"rgba(255,255,255,0.07)",
          border:`1px solid ${C.bdr}`,borderRadius:7,
          padding:"4px 10px",cursor:"pointer",letterSpacing:"0.03em",
          display:"flex",alignItems:"center",gap:5,
        }}>
          {openerName}
          <span style={{fontSize:9,color:C.md,letterSpacing:"0.1em"}}>▼</span>
        </button>
      </div>
    </div>
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
  const [screen,    setScreen]    = useState("setup");
  const [sesType,   setSesType]   = useState(null);
  const [ext,       setExt]       = useState(false);
  const [exList,    setExList]    = useState([]);
  const [exIdx,     setExIdx]     = useState(0);
  const [setIdx,    setSetIdx]    = useState(0);
  const [phase,     setPhase]     = useState("ready");
  const [prs,       setPrs]       = useState(INIT_PRS);
  const [log,       setLog]       = useState([]);
  const [lastRes,   setLastRes]   = useState(null);
  const [lastWt,    setLastWt]    = useState(null);
  const [prFlash,   setPrFlash]   = useState(null);
  const [wConf,     setWConf]     = useState(null);
  const [weightAdj, setWeightAdj] = useState(0);
  const [tick,      setTick]      = useState(0);
  const [sessionStart, setSessionStart] = useState(null);
  const [sessionEnd,   setSessionEnd]   = useState(null);
  const [sessionDate,  setSessionDate]  = useState(null); // real calendar date captured at launch
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
  const [showOpenerPicker, setShowOpenerPicker] = useState(false);
  // warmupNext: when true, the next logged set is tagged as a warm-up.
  // Warmup sets don't advance setIdx and don't feed lastWt/lastRes.
  // User controls this explicitly via the "Warm-up" pill on the Set ready screen.
  const [warmupNext, setWarmupNext] = useState(false);
  // repInput: the stepper value on the logging screen. null = use adaptedTarget as default.
  const [repInput, setRepInput] = useState(null);
  // userMeta: META overrides for user-added exercises. Keyed by exercise name.
  // Each entry can supply { eq, compound, ... } to drive equipment behavior.
  const [userMeta, setUserMeta] = useState({});
  // newExEq: equipment type chosen on the New Exercise form.
  const [newExEq, setNewExEq] = useState("plate-loaded");

  // Live timer — ticks every second
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Reset rep stepper to default (adaptedTarget) whenever we land on the ready phase
  // or move to a different set/exercise. Avoids stale stepper values between sets.
  useEffect(() => {
    if (phase === "ready") setRepInput(null);
  }, [phase, exIdx, setIdx]);

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
  // Warm-up tag is now user-controlled via the warmupNext pill on the Set ready screen.
  const isWarmupSet = warmupNext;
  const isBw = m.eq === "bodyweight";
  const tgt    = ex&&!isBw&&!isWarmupSet?suggestW(ex.name,setIdx,lastWt,lastRes,prs):0;

  // ── Double progression rep adaptation ──────────────────────
  // Parse rep range ("8–12" → [8,12]). Use em-dash or hyphen.
  const parseRange = (s) => {
    const match = (s||"").match(/(\d+)\D+(\d+)/);
    return match ? [parseInt(match[1]), parseInt(match[2])] : null;
  };
  const repRange     = ex ? parseRange(ex.repRange) : null;
  const rangeLo      = repRange ? repRange[0] : (ex?.targetReps||8);
  const rangeHi      = repRange ? repRange[1] : (ex?.targetReps||8);
  // Last logged reps for this exercise in current session — SKIP warmups so warmup
  // reps don't pollute the rep grid centering or progression math.
  const lastExLog    = ex ? [...log].reverse().find(s => s.exercise === ex.name && !s.warmup) : null;
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
      const base = e.hasBar ? 45 : 0;
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
  const fromWt = setIdx>0 ? (lastWt||0) : (eq.hasBar ? 45 : 0);
  const plates = ex&&!isBw&&adjWt>0
    ? calcPlates(adjWt, fromWt, eq.bilateral, m.maxPlate||45)
    : null;
  const score  = calcScore(log,prs,ext);
  const totS   = exList.reduce((s,e)=>s+e.sets,0);

  const build=(t,bbOK)=>{
    let a=[...TMPLS[t]];
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
  const launch=(needsBB)=>{
    if(needsBB){setScreen("barbellCheck");return;}
    const now=new Date();
    const DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    setSessionDate(`${DAYS[now.getDay()]} ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`);
    setExList(build(sesType,true));setExIdx(0);setSetIdx(0);setLog([]);
    setLastRes(null);setLastWt(null);setPhase("ready");
    setSessionStart(Date.now());
    setScreen("session");
  };
  const handleBB=(ok)=>{
    const now=new Date();
    const DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    setSessionDate(`${DAYS[now.getDay()]} ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`);
    setExList(build(sesType,ok));setExIdx(0);setSetIdx(0);setLog([]);
    setLastRes(null);setLastWt(null);setPhase("ready");
    setSessionStart(Date.now());
    setScreen("session");
  };
  // ── Back navigation: undo the most recent logged set ──────────
  // Pops the last log entry, restores setIdx/exIdx/lastWt/lastRes/warmupNext to
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
    if (!popped.warmup && !exMeta.bw) {
      const currentPr = prs[popped.exercise];
      if (currentPr && popped.weight >= currentPr.weight && popped.result !== "fell_short") {
        // The popped set may have been the PR. Recompute from prior logs.
        const priorBest = newLog
          .filter(s => s.exercise === popped.exercise && !s.warmup && s.result !== "fell_short")
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
    const workingDone = newLog.filter(s => s.exercise === popped.exercise && !s.warmup).length;
    setExIdx(poppedExIdx);
    setSetIdx(workingDone);

    if (popped.warmup) {
      // Restoring a warmup: warmupNext goes back ON, lastWt/lastRes unchanged
      setWarmupNext(true);
    } else {
      setWarmupNext(false);
      // Find last working set for this exercise in newLog for progression context
      const priorWorking = [...newLog].reverse()
        .find(s => s.exercise === popped.exercise && !s.warmup);
      setLastWt(priorWorking?.weight ?? null);
      setLastRes(priorWorking?.result ?? null);
    }
    setPhase("ready");
  };

  const attemptReps=(reps)=>{
    // Classify against the prescribed range, not a single integer target.
    // Reps WITHIN range = matched (working as prescribed); above = exceeded; below = fell_short.
    const res = reps > rangeHi ? "exceeded"
              : reps < rangeLo ? "fell_short"
              : "matched";
    if(lastWt&&lastWt>0&&Math.abs(adjWt-lastWt)/lastWt>0.5){setWConf({res,wt:adjWt,reps});return;}
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
    const wasWarmup = warmupNext;
    setLog(l=>[...l,{exercise:ex.name,setNum:setIdx+1,weight:wt,
      reps:reps,result:res,...(wasWarmup?{warmup:true}:{}),...(phr?{phr}:{})}]);
    setWeightAdj(0);
    if(wasWarmup){
      // Warmup logged: clear the toggle, stay on the same working set index.
      // Don't update lastWt/lastRes (those drive the next working set's prescription).
      // Don't award PRs from warmup sets.
      setWarmupNext(false);
      setPhase("ready");
      return;
    }
    setLastRes(res);setLastWt(wt);
    const pr=prs[ex.name];
    if(res!=="fell_short"&&pr&&!pr.bw&&wt>pr.weight){
      setPrs(p=>({...p,[ex.name]:{...p[ex.name],weight:wt,reps:ex.targetReps}}));
      setPrFlash(ex.name);setTimeout(()=>setPrFlash(null),2800);
    }
    if(setIdx+1>=ex.sets){
      if(exIdx+1>=exList.length){setSessionEnd(Date.now());setScreen("complete");return;}
      setExIdx(i=>i+1);setSetIdx(0);setLastRes(null);setLastWt(null);setWeightAdj(0);setWarmupNext(false);
    } else setSetIdx(s=>s+1);
    setPhase("ready");
  };
  const reset=()=>{
    setSesType(null);setExList([]);setExIdx(0);setSetIdx(0);
    setLog([]);setLastRes(null);setLastWt(null);setPhase("ready");setScreen("setup");
    setSessionStart(null);setSessionEnd(null);setWarmupNext(false);
  };

  const shell={background:C.page,minHeight:"100dvh",color:C.wht,
    maxWidth:430,margin:"0 auto",display:"flex",flexDirection:"column",
    fontFamily:"'Inter',sans-serif"};

  // ── SETUP ────────────────────────────────────────────────
  if(screen==="setup"){
    const ready=!!sesType;

    // Live day + date
    const now     = new Date();
    const DAYS    = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const MONTHS  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const dayName = DAYS[now.getDay()];
    const dateStr = `${MONTHS[now.getMonth()]} ${now.getDate()}`;

    return(
      <div style={shell}>
        <style>{FONTS}</style>
        <div style={{flex:1,display:"flex",flexDirection:"column",padding:"50px 18px 32px"}}>

          {/* HEADER */}
          <div style={{marginBottom:30}}>
            {/* Logo left — day/date upper right */}
            <div style={{display:"flex",alignItems:"flex-start",
              justifyContent:"space-between",marginBottom:4}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:66,
                letterSpacing:"0.05em",lineHeight:1}}>
                <span style={{color:C.red}}>IRON</span>
                <span style={{color:C.wht}}>GAME</span>
              </div>
              <div style={{textAlign:"right",paddingTop:8}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,
                  letterSpacing:"0.08em",lineHeight:1,color:C.wht}}>
                  {dayName}
                </div>
                <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:14,
                  color:C.md,letterSpacing:"0.04em",marginTop:3}}>
                  {dateStr}
                </div>
              </div>
            </div>
            <Div/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:12,
                color:C.md,letterSpacing:"0.2em",textTransform:"uppercase"}}>
                AI Workout Coach
              </div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,
                color:C.red,letterSpacing:"0.1em"}}>
                TARGET: 100 PTS
              </div>
            </div>
          </div>

          {/* FORMAT — first choice */}
          <div style={{marginBottom:18}}>
            <SL>Training Format</SL>
            <div style={{display:"flex",gap:10}}>
              <FmtCard label="Standard" sub="65 min · 5 exercises"
                Icon={IClk} val={false} selected={ext} onClick={setExt}/>
              <FmtCard label="Extended" sub="70–75 min · 6 exercises"
                Icon={IPlus} val={true} selected={ext} onClick={setExt}/>
            </div>
          </div>

          {/* SESSION TYPE — second choice */}
          <div style={{marginBottom:18}}>
            <SL>Session Type</SL>
            <div style={{display:"flex",gap:10}}>
              <TypeCard type="push" label="Push"
                muscles={"Chest\nShoulders · Triceps"}
                Icon={IconPush} selected={sesType} onClick={t=>{setSesType(t);setCustomOpener(null);}}/>
              <TypeCard type="pull" label="Pull"
                muscles={"Back\nBiceps · Rear Delts"}
                Icon={IconPull} selected={sesType} onClick={t=>{setSesType(t);setCustomOpener(null);}}/>
              <TypeCard type="legs" label="Legs"
                muscles={"Quads · Hams\nGlutes · Calves"}
                Icon={IconLegs} selected={sesType} onClick={t=>{setSesType(t);setCustomOpener(null);}}/>
            </div>
          </div>

          {/* PREVIEW */}
          <div style={{marginBottom:28}}>
            {sesType?<Preview type={sesType} extended={ext}
              opener={customOpener}
              onPickOpener={()=>setShowOpenerPicker(true)}
            />:(
              <div style={{border:`1px dashed ${C.bdr}`,borderRadius:12,padding:"24px",
                textAlign:"center",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:14,
                color:C.md,letterSpacing:"0.08em",textTransform:"uppercase",background:C.inner}}>
                Select session type to preview
              </div>
            )}
          </div>
          <div style={{flex:1}}/>

          <RedBtn onClick={()=>launch(["pull","legs"].includes(sesType))} disabled={!ready}>
            {ready?`Begin ${sesType.charAt(0).toUpperCase()+sesType.slice(1)} Session`:"Select Session Type"}
          </RedBtn>


          {/* Reset — only shows after selections made */}
          {sesType && (
            <button className="t" onClick={()=>{ setSesType(null); setExt(false); setCustomOpener(null); }}
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

          {/* Version stamp */}
          <div style={{textAlign:"center",marginTop:24,
            fontFamily:"'JetBrains Mono',monospace",fontWeight:600,
            fontSize:10,color:"rgba(255,255,255,0.18)",letterSpacing:"0.15em"}}>
            {BUILD_VERSION}
          </div>
        </div>

      {/* ── OPENER PICKER OVERLAY ────────────────────────────── */}
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
                const {inCat,outCat}=exListForType(sesType,INIT_PRS);
                const renderOpener=(name,inTemplate)=>{
                  const pr=INIT_PRS[name]; if(!pr) return null;
                  const isActive=(customOpener||TMPLS[sesType][0]?.name)===name;
                  return(
                    <button key={name} className="t"
                      onClick={()=>{setCustomOpener(name);setShowOpenerPicker(false);}}
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
                const tmplNames=TMPLS[sesType].map(e=>e.name);
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

  // ── BARBELL CHECK ─────────────────────────────────────────
  if(screen==="barbellCheck") return(
    <div style={{...shell,justifyContent:"center",padding:"0 22px",gap:24}}>
      <style>{FONTS}</style>
      <div>
        <div style={{fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:11,
          color:C.red,letterSpacing:"0.22em",textTransform:"uppercase",marginBottom:14}}>
          Priority Lift Check
        </div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:58,
          lineHeight:1.05,color:C.wht,marginBottom:8}}>
          Is a barbell available?
        </div>
        <Div/>
        <div style={{fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:15,
          color:C.lt,lineHeight:1.65,marginBottom:28}}>
          Barbell RDL is the priority lift. If unavailable the session will adjust automatically.
        </div>
      </div>
      <div style={{display:"flex",gap:12}}>
        <button className="t" onClick={()=>handleBB(false)} style={{
          flex:1,height:78,borderRadius:12,cursor:"pointer",
          background:"linear-gradient(170deg,#2a0a0a,#1a0505)",
          border:`2px solid ${C.red}`,color:"#ff6644",
          fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:"0.1em",
          boxShadow:"0 3px 16px rgba(204,34,0,0.3)",
        }}>Not Available</button>
        <button className="t" onClick={()=>handleBB(true)} style={{
          flex:1,height:78,borderRadius:12,cursor:"pointer",
          background:"linear-gradient(170deg,#0a2010,#061408)",
          border:`2px solid ${C.grn}`,color:C.grn,
          fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:"0.1em",
          boxShadow:"0 3px 16px rgba(34,200,100,0.25)",
        }}>Available</button>
      </div>
    </div>
  );

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

    // ── kcal estimate (Keytel) ─────────────────────────────────
    // Active set min at avg PHR; rest min at recovery HR ~110.
    const weightKg = USER_PROFILE.weightLb / 2.205;
    const age      = USER_PROFILE.age;
    const avgPhr   = hasHR ? phrs.reduce((a,b)=>a+b,0)/phrs.length : 0;
    const activeMin= Math.min(elapsedMin, phrs.length * setMin);
    const restMinK = Math.max(0, elapsedMin - activeMin);
    const kcal = hasHR
      ? Math.round(kcalPerMin(avgPhr, weightKg, age) * activeMin
                 + kcalPerMin(HR_ZONES[1].lo, weightKg, age) * restMinK)  // Z2 lower boundary as rest HR
      : null;

    return(
      <div style={{...shell,padding:"40px 20px 36px"}}>
        <style>{FONTS}</style>
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
                {kcal?kcal.toLocaleString():"—"}
                <span style={{fontSize:13,color:C.md,marginLeft:6,letterSpacing:"0.1em"}}>KCAL</span>
              </span>
            </div>
            <div style={{fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:11,
              color:C.md,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:2}}>
              {kcal
                ? `Est · Avg HR ${Math.round(avgPhr)} · ${elapsedMin} min`
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
            .map((s, idx) => ({ idx, phr: s.phr, exercise: s.exercise, warmup: !!s.warmup }))
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
            {label:"Total Sets",val:log.filter(s=>!s.warmup).length,   c:C.wht},
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
            lines.push(`IronGame · ${sessionDate || ""}`.trim());
            lines.push(`${sesType?.toUpperCase() || "SESSION"} · ${elapsedMin} min · Score ${fs.total}/100`);
            lines.push("");
            if (kcal) lines.push(`Energy: ${kcal.toLocaleString()} kcal · Avg HR ${Math.round(avgPhr)}`);
            const workingSets = log.filter(s=>!s.warmup).length;
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
                const tag   = s.warmup ? " (W)" : "";
                const prTag = !s.warmup && s.result==="exceeded" && hits.includes(s.exercise) ? " (PR)" : "";
                const hr    = s.phr ? ` @ ${s.phr}` : "";
                lines.push(`    ${i+1}: ${s.weight}×${s.reps}${tag}${prTag}${hr}`);
              });
            });
            const subject = `IronGame · ${sessionDate || ""} · ${sesType?.toUpperCase() || ""} · ${fs.total}/100`;
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
    <div style={shell}>
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
        padding:"10px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",
        boxShadow:"0 2px 14px rgba(0,0,0,0.5)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {/* Back chevron — undoes the most recent logged set */}
          <button className="t" onClick={undoLastSet}
            disabled={log.length===0}
            style={{width:32,height:32,borderRadius:8,cursor:log.length===0?"not-allowed":"pointer",
              background:log.length===0?"transparent":"rgba(255,255,255,0.06)",
              border:`1px solid ${log.length===0?"rgba(255,255,255,0.08)":C.bdr}`,
              color:log.length===0?"rgba(255,255,255,0.2)":C.lt,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontFamily:"'Bebas Neue',sans-serif",fontSize:20,lineHeight:1,padding:0,
              flexShrink:0}}
            title={log.length===0?"Nothing to undo":"Undo last set"}>
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
            {log.filter(s=>!s.warmup).length}<span style={{color:C.md}}>/{totS}</span>
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

      {/* Sub-score bars */}
      <div style={{display:"flex",background:C.card,borderBottom:`1px solid ${C.bdr}`}}>
        {[{l:"MUS",v:score.muscle,m:45,pending:false},
          {l:"CAL",v:score.cal,m:25,pending:true},
          {l:"CRD",v:score.cv,m:15,pending:false},
          {l:"FND",v:score.found,m:15,pending:false}].map(({l,v,m,pending},i)=>(
          <div key={l} style={{flex:1,padding:"5px 4px 7px",textAlign:"center",
            borderRight:i<3?`1px solid ${C.bdr}`:"none"}}>
            <div style={{fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:9,
              color:C.md,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:2}}>{l}</div>
            {/* CAL is a proxy during session — actual kcal only available on results from iCardio.
                Show em-dash to avoid presenting a fabricated number as live data. */}
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,
              fontSize:15,color: pending ? C.md : (v>=m?C.grn:C.wht)}}>
              {pending ? "—" : v}
            </div>
            <div style={{background:C.inner,height:4,margin:"3px 6px 0",borderRadius:2,
              border:`1px solid ${C.bdr}`}}>
              <div style={{
                background: pending
                  ? `repeating-linear-gradient(45deg,${C.bdr},${C.bdr} 2px,transparent 2px,transparent 4px)`
                  : (v>=m
                    ?"linear-gradient(90deg,#22dd66,#15993f)"
                    :"linear-gradient(90deg,#e8260a,#aa1a00)"),
                height:"100%",width: pending ? "100%" : `${(v/m)*100}%`,borderRadius:1,
              }}/>
            </div>
          </div>
        ))}
      </div>

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
              {/* Warm-up pill — user-controlled. Tag THIS set as a warm-up before logging. */}
              {phase==="ready"&&!isBw&&(
                <button className="t" onClick={()=>setWarmupNext(v=>!v)}
                  style={{fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:11,
                    color:warmupNext?"#111":"#ffb400",
                    background:warmupNext?"#ffb400":"rgba(255,180,0,0.08)",
                    border:`1px solid ${warmupNext?"#ffb400":"rgba(255,180,0,0.4)"}`,
                    borderRadius:5,padding:"4px 10px",letterSpacing:"0.1em",
                    textTransform:"uppercase",cursor:"pointer",
                    boxShadow:warmupNext?"0 2px 10px rgba(255,180,0,0.35)":"none"}}>
                  {warmupNext?"Warm-up ✓":"+ Warm-up"}
                </button>
              )}
            </div>

            <div style={{fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"0.04em",
              lineHeight:1.05,color:C.wht,
              fontSize:ex.name.length>20?34:44,marginBottom:6,
              display:"flex",alignItems:"baseline",gap:10,flexWrap:"wrap"}}>
              {ex.name}
              {m.brand&&(
                <button className="t" onClick={()=>setShowBrandInfo(v=>!v)}
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
              {/* Warm-up activation cue — visible only when user has tagged this set as warm-up AND exercise has a cue */}
              {isWarmupSet&&m.warmupCue&&(
                <div style={{background:"rgba(255,180,0,0.08)",
                  border:"1px solid rgba(255,180,0,0.3)",
                  borderRadius:10,padding:"10px 14px",marginBottom:10,
                  display:"flex",gap:10,alignItems:"flex-start"}}>
                  <div style={{fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:10,
                    color:"#ffb400",letterSpacing:"0.18em",
                    textTransform:"uppercase",flexShrink:0,marginTop:2}}>
                    Activation
                  </div>
                  <div style={{fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:13,
                    color:C.lt,lineHeight:1.45,letterSpacing:"0.02em"}}>
                    {m.warmupCue}
                  </div>
                </div>
              )}
              {/* Load card */}
              <div style={{background:STEEL,borderRadius:12,
                border:`1px solid ${isWarmupSet?"rgba(255,180,0,0.2)":C.bdr}`,
                borderTop:`1px solid ${isWarmupSet?"rgba(255,180,0,0.3)":C.bdrTop}`,
                padding:"10px 14px",marginBottom:10,
                boxShadow:"0 4px 18px rgba(0,0,0,0.45),inset 0 1px 0 rgba(255,255,255,0.05)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <SL color={isWarmupSet?"#ffb400":C.md}>
                    {isWarmupSet      ? "Warm-Up Load"
                      : m.eq==="bodyweight" ? "Load"
                      : m.eq==="stack-pin"  ? "Stack Weight"
                      : m.eq==="dumbbell"   ? `${adjWt} lbs${m.perArm?" / arm":""}`
                      : m.eq==="barbell"    ? `Olympic Bar · 45 lbs`
                      : m.eq==="smith"      ? "Smith Machine"
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
                {(isBw||isWarmupSet)?(
                  <div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:46,
                      color:isWarmupSet?"rgba(255,180,0,0.85)":C.lt}}>
                      {isWarmupSet?"Bodyweight":""}{prs[ex.name]?.unit==="sec"?`/ ${prs[ex.name].reps} sec`:""}
                    </div>
                    {isWarmupSet&&(
                      <div style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:600,
                        color:"rgba(255,180,0,0.5)",letterSpacing:"0.1em",textTransform:"uppercase",
                        marginTop:2}}>Sled only · No plates</div>
                    )}
                  </div>
                ):(
                  <>
                    {/* 3-column load row: [plates] [weight] [±buttons] */}
                    <div style={{display:"flex",alignItems:"flex-start",
                      gap:10,marginBottom:8}}>

                      {/* LEFT: plate badges — hidden for stack machines */}
                      {eq.showPlates&&plates?.action!=="none"&&plates?.plates?.length>0&&(
                        <div style={{display:"flex",flexDirection:"column",
                          gap:3,alignSelf:"center",flexShrink:0}}>
                          <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,
                            fontSize:8,color:C.md,letterSpacing:"0.14em",
                            textTransform:"uppercase",marginBottom:1}}>
                            {plates.action==="add"?"ADD":"RMV"}
                            {plates.bilateral?" /SIDE":" TOTAL"}
                          </div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:3,maxWidth:66}}>
                            {plates.plates.map((p,i)=>(
                              <div key={i} style={{
                                background:PC[p],color:p===5?"#111":"#fff",
                                fontFamily:"'Bebas Neue',sans-serif",fontSize:13,
                                padding:"2px 6px",borderRadius:4,
                                minWidth:26,textAlign:"center",
                                boxShadow:"0 2px 6px rgba(0,0,0,0.4)",
                              }}>{p}</div>
                            ))}
                          </div>
                          {m.maxPlate&&m.maxPlate<45&&(
                            <div style={{fontFamily:"'Inter',sans-serif",fontSize:8,
                              color:C.md,marginTop:1}}>max {m.maxPlate}lb</div>
                          )}
                        </div>
                      )}

                      {/* CENTER: weight number only */}
                      <div style={{flexShrink:0}}>
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",
                          fontSize:80,lineHeight:1,color:C.wht,
                          textShadow:"0 0 30px rgba(255,255,255,0.07)"}}>{adjWt}</div>
                      </div>

                      {/* RIGHT: ±adjustment buttons — plus top, minus bottom */}
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
                    </div>
                  </>
                )}
              </div>

              {/* HR card */}
              <div style={{background:STEEL,borderRadius:12,
                border:`1px solid ${C.bdr}`,borderTop:`1px solid ${C.bdrTop}`,
                padding:"14px 18px",marginBottom:12,
                boxShadow:"0 3px 14px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.05)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <SL color={C.md}>Start HR</SL>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,
                      lineHeight:1,color:isCompound?C.red:C.wht,marginTop:2}}>
                      {m.tier==="P1" ? START_HR.compound_p1
                        : isCompound ? START_HR.compound_p2
                        : START_HR.isolation}
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <SL color={C.md}>Reps</SL>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,
                      lineHeight:1,color:C.lt,marginTop:2}}>
                      {ex.repRange}
                    </div>
                  </div>
                </div>
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
              <div style={{fontFamily:"'Inter',sans-serif",fontWeight:600,
                fontSize:14,color:C.md,marginTop:8,letterSpacing:"0.08em",textTransform:"uppercase"}}>
                Reps completed
              </div>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM — THUMB ZONE */}
      <div style={{padding:"14px 18px 42px",background:C.page,borderTop:`2px solid ${C.bdr}`}}>
        {phase==="ready"?(
          <RedBtn onClick={()=>setPhase("logging")} h={70}>
            {isWarmupSet ? "Begin Warm-Up" : `Begin Set ${setIdx+1}`}
          </RedBtn>
        ):phase==="phr"?(
          /* ── PHR ENTRY ───────────────────────────────────── */
          <div>
            <div style={{marginBottom:14}}>
              <div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:10,
                color:C.md,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:6}}>
                Peak Heart Rate · Set {pendingResult?setIdx+1:""}
              </div>
              {/* BPM display */}
              <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:12}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:80,
                  lineHeight:1,color:C.wht}}>{phrInput}</div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,
                  color:C.red}}>BPM</div>
              </div>
              {/* Quick-select — zone boundary anchors derived from MAX_HR */}
              <div style={{display:"flex",gap:6,marginBottom:10}}>
                {HR_ZONES.map(z=>{
                  const anchor = z.label==="Recovery" ? z.hi
                    : z.label==="Max Effort" ? Math.round(MAX_HR*0.97)
                    : Math.round((z.lo+z.hi)/2);
                  const active = phrInput===anchor;
                  return (
                    <button key={z.label} className="t" onClick={()=>setPhrInput(anchor)} style={{
                      flex:1,borderRadius:7,cursor:"pointer",padding:"5px 0",
                      background:active?`${z.color}22`:"rgba(255,255,255,0.05)",
                      border:`1px solid ${active?z.color:C.bdr}`,
                      color:active?z.color:C.md,
                      display:"flex",flexDirection:"column",alignItems:"center",gap:1,
                    }}>
                      <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:"0.04em"}}>{anchor}</span>
                      <span style={{fontFamily:"'Inter',sans-serif",fontSize:8,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>{z.label.split(" ")[0]}</span>
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
            <button className="t" onClick={()=>confirmPhr(null)}
              style={{width:"100%",height:36,background:"transparent",border:"none",
                fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,
                color:C.md,letterSpacing:"0.1em",textTransform:"uppercase",
                marginTop:6,cursor:"pointer"}}>
              No HR Data — Skip
            </button>
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
                    Log {currentReps} {currentReps===1?"Rep":"Reps"}
                  </button>
                </>
              );
            })()}
          </>
        )}
        {phase==="ready"&&(
          <button className="t" onClick={()=>setShowExPicker(true)}
            style={{width:"100%",height:42,background:"transparent",
              border:`1px solid ${C.bdr}`,borderRadius:10,
              fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:13,
              color:C.md,letterSpacing:"0.1em",textTransform:"uppercase",
              marginTop:10,cursor:"pointer"}}>
            Change Exercise
          </button>
        )}
        {phase==="ready"&&(
          <button className="t" onClick={()=>{setSessionEnd(Date.now());setScreen("complete");}}
            style={{width:"100%",height:38,background:"transparent",
              border:"none",
              fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:12,
              color:"rgba(255,255,255,0.25)",letterSpacing:"0.12em",
              textTransform:"uppercase",marginTop:6,cursor:"pointer"}}>
            End Session
          </button>
        )}
        {/* In-session build stamp — confirms which deploy is running. Tap to force-reload. */}
        <div onClick={()=>{
            if (typeof window !== 'undefined' && window.location) {
              window.location.reload();
            }
          }}
          style={{textAlign:"center",marginTop:4,padding:"4px 0",cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace",fontWeight:600,
            fontSize:9,color:"rgba(255,255,255,0.14)",letterSpacing:"0.12em"}}>
          {BUILD_VERSION} · TAP TO RELOAD
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
                <button className="t" onClick={()=>{setShowExPicker(false);setShowNewExForm(false);}}
                  style={{fontFamily:"'Inter',sans-serif",fontWeight:700,
                    fontSize:12,color:C.md,letterSpacing:"0.12em",
                    background:"transparent",border:`1px solid ${C.bdr}`,
                    borderRadius:7,padding:"6px 12px",cursor:"pointer"}}>
                  CANCEL
                </button>
              </div>
            </div>

            {/* Inline new exercise form */}
            {showNewExForm&&(()=>{
              const suggestions = searchExercises(newExName, 5);
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
                          setShowNewExForm(false);setShowExPicker(false);
                          setNewExDuplicate(null);setNewExName("");
                        }}
                        style={{flex:1,background:"#ffb400",color:"#000",border:"none",
                          borderRadius:6,padding:"8px 12px",cursor:"pointer",
                          fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,
                          letterSpacing:"0.06em",textTransform:"uppercase"}}>
                        Use Existing
                      </button>
                      <button className="t"
                        onClick={()=>setNewExDuplicate(null)}
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
                    setWeightAdj(0);setShowNewExForm(false);setShowExPicker(false);
                    setNewExDuplicate(null);setNewExName("");setWarmupNext(false);
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
            <div style={{overflowY:"auto",padding:"0 12px 32px"}}>
              {(()=>{
                const {inCat,outCat}=exListForType(sesType,prs);
                // Slot-specific alternatives from TMPLS — show first, badge as RECOMMENDED.
                const slotAlts = (TMPLS[sesType]?.[exIdx]?.alts || [])
                  .filter(n => prs[n]); // skip alts not in PR list
                const altSet = new Set(slotAlts);
                const inCatRemaining = inCat.filter(n => !altSet.has(n));
                const renderEx=(name,tag)=>{
                  const pr=prs[name];
                  const isCurrent=exList[exIdx]?.name===name;
                  if(exList.some((e,i)=>e.name===name&&i!==exIdx)) return null;
                  return(
                    <button key={name} className="t"
                      onClick={()=>{
                        if(isCurrent){setShowExPicker(false);return;}
                        const updated=[...exList];
                        updated[exIdx]={...updated[exIdx],name,
                          repRange: META[name]?.compound?"6–10":"10–15",
                          targetReps: META[name]?.compound?8:12,
                        };
                        setExList(updated);
                        setSetIdx(0);setLastRes(null);setLastWt(null);
                        setWeightAdj(0);setShowExPicker(false);setWarmupNext(false);
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
          </div>
        </div>
      )}
    </div>
  );
}
