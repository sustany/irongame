import { useState, useEffect } from "react";

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
// USER PROFILE — used for kcal estimation (Keytel formula).
// Adjust here when bodyweight / age change.
// ─────────────────────────────────────────────────────────────
const USER_PROFILE = { weightLb: 222, age: 56 };

// Keytel HR-based kcal/min for males.
// kcal/min = (-55.0969 + 0.6309*HR + 0.1988*weight_kg + 0.2017*age) / 4.184
const kcalPerMin = (hr, weightKg, age) =>
  Math.max(0, (-55.0969 + 0.6309*hr + 0.1988*weightKg + 0.2017*age) / 4.184);

// ─────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────
const INIT_PRS = {
  "LF High Row":           { weight:110,  reps:12, perArm:true },  // PR set May 19 2026
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
const META = {
  "LF High Row":           { tier:"P1", prPts:8, compound:true, perArm:true, steps:[5,10,20] },
  "LF Incline Press":      { tier:"P1", prPts:8, compound:true,  bilateral:true  },
  "LF Shoulder Press":     { tier:"P1", prPts:8, compound:true,  bilateral:true  },
  "Bench Press, Smith Machine": { tier:"P1", prPts:8, compound:true, bilateral:true },
  "Military Press PL Machine":  { tier:"P1", prPts:8, compound:true, bilateral:true },
  "Seated PL Dip Machine":       { tier:"P1", prPts:8, compound:true, bilateral:true },
  "LF Seated Dip":         { tier:"P2", prPts:5, compound:true                  },
  "HS Decline Press":      { tier:"P2", prPts:5, compound:true,  perSide:true    },
  "Pec Deck":              { tier:"ISO",prPts:3                                  },
  "Cable Pushdown":        { tier:"ISO",prPts:3                                  },
  "Seated Lateral Raise":  { tier:"ISO",prPts:3, dumbbell:true, steps:[2.5,5,10] },
  "Weighted Crunches":     { tier:"CORE",prPts:0, core:true                     },
  "Captain's Chair":       { tier:"CORE",prPts:0, core:true, bw:true            },
  // bilateral=true: plates load both sides — always add in pairs
  // barbell=true: 45 lb bar is the floor for set 1
  // maxPlate=25: 45 lb plates hit the floor during RDL range of motion
  "Barbell RDL":           { tier:"P1", prPts:8, compound:true, bilateral:true, barbell:true, maxPlate:25, priority:true },
  "Lat Pull-Down PL": { tier:"P1", prPts:8, compound:true, bilateral:true   },
  "LF Row":                { tier:"P2", prPts:5, compound:true                  },
  "Lever Seated Row":      { tier:"P2", prPts:5, compound:true                  },
  "Assisted Chin-Up":      { tier:"P2", prPts:5, compound:true                  },
  "Hyperextensions 45°":   { tier:"FND",prPts:0, mandatory:true                 },
  "DB Alternating Curl":   { tier:"ISO",prPts:3, dumbbell:true, steps:[2.5,5,10] },
  "DB Hammer Curl":        { tier:"ISO",prPts:3, dumbbell:true, steps:[2.5,5,10] },
  "LF Bicep Curl":         { tier:"ISO",prPts:3, dumbbell:true, steps:[2.5,5,10] },
  "Dead Hang":             { tier:"GRIP",prPts:0, bw:true, mandatory:true        },
  "Hip Thrust (Smith)":    { tier:"P1", prPts:8, compound:true                  },
  "Seated Leg Curl":       { tier:"P2", prPts:5, compound:true, stack:true         },
  "Linear Hack Squat PL":            { tier:"P1", prPts:8, compound:true, bilateral:true, warmupSet1:true },
  "Leg Extension":         { tier:"ISO",prPts:3, stack:true                       },
  "Calf Press":            { tier:"ISO",prPts:3, bilateral:true                 },
  "Calf Press, Linear Leg Press": { tier:"ISO",prPts:3, bilateral:true },
  "Seated Calf Raise":     { tier:"ISO",prPts:3, bilateral:true                 },
};
// Category membership controls which exercises appear in pickers per session type.
// Exercises not listed appear under "Other" at the bottom of pickers.
const CATEGORY = {
  push: ["LF Incline Press","LF Shoulder Press","Bench Press, Smith Machine",
         "Military Press PL Machine","Seated PL Dip Machine","LF Seated Dip",
         "HS Decline Press","Pec Deck","Cable Pushdown","Seated Lateral Raise",
         "Weighted Crunches","DB Flys","Assisted Dips"],
  pull: ["Lat Pull-Down PL","LF High Row","LF Row","Lever Seated Row","Assisted Chin-Up",
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
    {name:"LF Incline Press",     sets:4,repRange:"8–10", targetReps:10},
    {name:"LF Shoulder Press",    sets:4,repRange:"6–8",  targetReps:8 },
    {name:"LF Seated Dip",        sets:3,repRange:"8–10", targetReps:10},
    {name:"Seated Lateral Raise", sets:3,repRange:"12–15",targetReps:15},
    {name:"Weighted Crunches",    sets:3,repRange:"8–10", targetReps:10},
  ],
  pull:[
    {name:"Lat Pull-Down PL",    sets:4,repRange:"8–10", targetReps:10,priority:true},
    {name:"LF High Row",        sets:4,repRange:"10–12",targetReps:12,perArm:true},
    {name:"LF Row",             sets:3,repRange:"8–10", targetReps:10},
    {name:"DB Alternating Curl",sets:3,repRange:"10–12",targetReps:12},
    {name:"Captain's Chair",    sets:3,repRange:"10–12",targetReps:12},
    {name:"Hyperextensions 45°",sets:2,repRange:"10–12",targetReps:12,mandatory:true},
    {name:"Dead Hang",          sets:2,repRange:"max",  targetReps:37,unit:"sec",mandatory:true},
  ],
  legs:[
    {name:"Barbell RDL",          sets:4,repRange:"6–8",  targetReps:8, barbellCheck:true,priority:true},
    {name:"Linear Hack Squat PL",           sets:4,repRange:"8–10", targetReps:10},
    {name:"Seated Leg Curl",      sets:3,repRange:"6–8",  targetReps:8 },
    {name:"Leg Extension",        sets:3,repRange:"8–10", targetReps:10},
    {name:"Calf Press",           sets:3,repRange:"10–12",targetReps:12},
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
function describeLoad(wt, fromWt, bilateral, maxPlate=45){
  if(!wt||wt<=0) return "Load";
  const diff=wt-(fromWt||0);
  if(diff<=0) return `${wt} lbs`;
  const perSide=bilateral ? diff/2 : diff;
  const sizes=[45,25,10,5].filter(p=>p<=(maxPlate||45));
  const parts=[];
  let rem=Math.round(perSide);
  for(const p of sizes){
    const n=Math.floor(rem/p);
    if(n>0){parts.push(`${bilateral?n*2:n}×${p}`);rem-=n*p;}
  }
  const barStr=fromWt>0?`${fromWt}lb bar + `:"";
  return "Loaded: "+barStr+parts.join(" + ")+" = "+wt;
}

function suggestW(name,si,lw,lr,prs){
  const pr=prs[name];
  if(!pr||pr.bw) return 0;
  const w=pr.weight;
  // Set 1: respect pre-seeded lw (user already loaded a weight) else 68% of PR
  if(si===0) return lw&&lw>0 ? lw : Math.max(45,Math.round(w*0.68/5)*5);
  if(si===1) return Math.round(w*0.82/5)*5;
  if(!lw) return w;
  if(lr==="exceeded")   return Math.round(Math.min(lw+5,w*1.08)/5)*5;
  if(lr==="fell_short") return Math.round(Math.max(lw-10,w*0.75)/5)*5;
  return lw;
}
function calcScore(log,prs,ext){
  let mu=0;const ph=new Set();
  let ov=0,core=false,hang=false,hyp=false;
  log.forEach(s=>{
    const m=META[s.exercise]||{},pr=prs[s.exercise];
    if(m.core) core=true;
    if(s.exercise==="Dead Hang") hang=true;
    if(s.exercise==="Hyperextensions 45°") hyp=true;
    if(s.result!=="fell_short"&&pr&&!pr.bw&&s.weight>pr.weight&&!ph.has(s.exercise)){
      ph.add(s.exercise);mu+=m.prPts||3;
    }
    if(s.result==="matched"||s.result==="exceeded") ov++;
  });
  const n=log.length,ts=ext?20:17;
  if(n>0) mu+=Math.min(10,Math.round((ov/n)*10));
  mu+=Math.min(18,Math.round((n/ts)*18));
  if(core) mu+=5;
  const mp=Math.min(45,mu),cp=Math.min(25,Math.round((n/ts)*25));
  const cv=Math.min(15,10+(n>10?5:n>6?3:0));
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
          `${TMPLS[type].slice(0,n).reduce((s,e)=>s+e.sets*e.targetReps,0)} REPS`
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
  {name:"LF High Row",        sets:4, repRange:"10–12", targetReps:12, perArm:true},
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
  const [customOpener,  setCustomOpener]  = useState(null);
  const [showOpenerPicker, setShowOpenerPicker] = useState(false);

  // Live timer — ticks every second
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedStr = () => {
    if (!sessionStart) return "0";
    const ms   = (sessionEnd || Date.now()) - sessionStart;
    const mins = Math.floor(ms / 60000);
    return `${mins}`;
  };

  const ex     = exList[exIdx]||null;
  const m      = ex?(META[ex.name]||{}):{};
  const isWarmupSet = !!(m.warmupSet1 && setIdx === 0);
  const tgt    = ex&&!m.bw&&!isWarmupSet?suggestW(ex.name,setIdx,lastWt,lastRes,prs):0;
  // Snap to nearest plate-achievable weight.
  // Dumbbells: snap to nearest 2.5. Bilateral plate machines: nearest 10 from bar.
  // Everything else: nearest 5.
  const snapWt=(raw,base,bilateral,dumbbell,stack)=>{
    if(dumbbell) return Math.round(raw/2.5)*2.5;
    if(stack)    return Math.round(raw/10)*10;
    if(!bilateral) return Math.round(raw/5)*5;
    const diff=raw-base;
    return Math.round(diff/10)*10+base;
  };
  let   adjWt  = Math.max(0, snapWt(tgt+weightAdj, m.barbell?45:0, m.bilateral, m.dumbbell, m.stack));
  const fromWt = setIdx>0 ? (lastWt||0) : (m.barbell ? 45 : 0);
  const plates = ex&&!m.bw&&adjWt>0
    ? calcPlates(adjWt, fromWt, m.bilateral, m.maxPlate||45)
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
  const attemptReps=(reps)=>{
    const res = reps > ex.targetReps ? "exceeded" : reps < ex.targetReps ? "fell_short" : "matched";
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
    setLog(l=>[...l,{exercise:ex.name,setNum:setIdx+1,weight:wt,
      reps:reps,result:res,...(phr?{phr}:{})}]);
    setLastRes(res);setLastWt(wt);
    setWeightAdj(0);
    const pr=prs[ex.name];
    if(res!=="fell_short"&&pr&&!pr.bw&&wt>pr.weight){
      setPrs(p=>({...p,[ex.name]:{...p[ex.name],weight:wt,reps:ex.targetReps}}));
      setPrFlash(ex.name);setTimeout(()=>setPrFlash(null),2800);
    }
    if(setIdx+1>=ex.sets){
      if(exIdx+1>=exList.length){setSessionEnd(Date.now());setScreen("complete");return;}
      setExIdx(i=>i+1);setSetIdx(0);setLastRes(null);setLastWt(null);setWeightAdj(0);
    } else setSetIdx(s=>s+1);
    setPhase("ready");
  };
  const reset=()=>{
    setSesType(null);setExList([]);setExIdx(0);setSetIdx(0);
    setLog([]);setLastRes(null);setLastWt(null);setPhase("ready");setScreen("setup");
    setSessionStart(null);setSessionEnd(null);
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

    // Zone breakdown from logged PHRs
    const ZONES=[
      {label:"VO2 Max",  min:173, max:999, color:"#e8260a"},
      {label:"Anaerobic",min:155, max:172, color:"#f97316"},
      {label:"Aerobic",  min:138, max:154, color:"#eab308"},
      {label:"Fat Burn", min:121, max:137, color:"#22c55e"},
      {label:"Warm Up",  min:0,   max:120, color:"#38bdf8"},
    ];
    const phrs=log.filter(s=>s.phr>0).map(s=>s.phr);
    const hasHR=phrs.length>0;
    // Estimate minutes per zone: assume each set ~3 min, rest fills fat burn/warm up
    const setMin=3;
    const restMin=Math.max(0,elapsedMin-phrs.length*setMin);
    const zoneMins=ZONES.map(z=>{
      const setsInZone=phrs.filter(p=>p>=z.min&&p<=z.max).length;
      let m=setsInZone*setMin;
      if(z.label==="Fat Burn") m+=Math.round(restMin*0.6);
      if(z.label==="Warm Up")  m+=Math.round(restMin*0.4);
      return{...z,mins:m};
    });
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
                 + kcalPerMin(110,    weightKg, age) * restMinK)
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
        <div>
          {/* Label: md = #aaaaaa = 7:1 on card = readable */}
          <div style={{fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:10,
            color:C.md,letterSpacing:"0.18em",textTransform:"uppercase"}}>EXERCISE</div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,lineHeight:1,color:C.wht}}>
            {exIdx+1}<span style={{color:C.md}}>/{exList.length}</span>
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
            {log.length}<span style={{color:C.md}}>/{totS}</span>
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
        {[{l:"MUS",v:score.muscle,m:45},{l:"CAL",v:score.cal,m:25},
          {l:"CRD",v:score.cv,m:15},{l:"FND",v:score.found,m:15}].map(({l,v,m},i)=>(
          <div key={l} style={{flex:1,padding:"5px 4px 7px",textAlign:"center",
            borderRight:i<3?`1px solid ${C.bdr}`:"none"}}>
            <div style={{fontFamily:"'Inter',sans-serif",fontWeight:900,fontSize:9,
              color:C.md,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:2}}>{l}</div>
            {/* Score values: white, always readable */}
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,
              fontSize:15,color:v>=m?C.grn:C.wht}}>{v}</div>
            <div style={{background:C.inner,height:4,margin:"3px 6px 0",borderRadius:2,
              border:`1px solid ${C.bdr}`}}>
              <div style={{
                background:v>=m
                  ?"linear-gradient(90deg,#22dd66,#15993f)"
                  :"linear-gradient(90deg,#e8260a,#aa1a00)",
                height:"100%",width:`${(v/m)*100}%`,borderRadius:1,
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
              <span style={{fontFamily:"'Inter',sans-serif",fontWeight:700,
                fontSize:11,color:C.md,letterSpacing:"0.14em",textTransform:"uppercase"}}>
                {m.tier}
              </span>
            </div>

            <div style={{fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"0.04em",
              lineHeight:1.05,color:C.wht,
              fontSize:ex.name.length>20?34:44,marginBottom:6}}>
              {ex.name}
            </div>
            <div style={{height:1,background:`linear-gradient(90deg,${C.bdrTop},transparent)`,marginBottom:8}}/>
            {/* Set info */}
            <div style={{display:"flex",gap:18,fontFamily:"'Inter',sans-serif",
              fontWeight:700,fontSize:14,color:C.lt,alignItems:"center"}}>
              {isWarmupSet
                ? <span style={{background:"rgba(255,180,0,0.15)",border:"1px solid rgba(255,180,0,0.4)",
                    color:"#ffb400",borderRadius:4,padding:"2px 8px",fontSize:11,
                    letterSpacing:"0.12em",textTransform:"uppercase"}}>Warm-Up · Set 1 of {ex.sets}</span>
                : <span>Set {setIdx+1} of {ex.sets}</span>
              }
              <span>{ex.repRange} reps</span>
              {prs[ex.name]&&!prs[ex.name].bw&&!isWarmupSet&&(
                <span style={{color:C.md}}>PR {prs[ex.name].weight}×{prs[ex.name].reps}</span>
              )}
            </div>
          </div>

          {phase==="ready"?(
            <>
              {/* Load card */}
              <div style={{background:STEEL,borderRadius:12,
                border:`1px solid ${isWarmupSet?"rgba(255,180,0,0.2)":C.bdr}`,
                borderTop:`1px solid ${isWarmupSet?"rgba(255,180,0,0.3)":C.bdrTop}`,
                padding:"10px 14px",marginBottom:10,
                boxShadow:"0 4px 18px rgba(0,0,0,0.45),inset 0 1px 0 rgba(255,255,255,0.05)"}}>
                <SL color={isWarmupSet?"#ffb400":C.md}>
                  {isWarmupSet?"Warm-Up Load":m.bw?"Load":m.stack?`Stack Weight · 10 lb increments`:m.dumbbell?`${adjWt} lbs${m.perArm?" / arm":""}`:describeLoad(adjWt, m.barbell?(m.barWeight||45):0, m.bilateral, m.maxPlate)}
                </SL>
                {(m.bw||isWarmupSet)?(
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
                      {!m.stack&&plates?.action!=="none"&&plates?.plates?.length>0&&(
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
                          {(m.steps||[10,20,30]).map(p=>(
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
                          {(m.steps||[10,20,30]).map(p=>(
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
                display:"flex",justifyContent:"space-between",alignItems:"center",
                boxShadow:"0 3px 14px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.05)"}}>
                <div>
                  <SL color={C.md}>Start HR</SL>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,
                    color:isCompound?C.red:C.wht}}>
                    {isCompound?"108–115":"95–110"}
                    <span style={{fontFamily:"'Inter',sans-serif",fontWeight:700,
                      fontSize:17,color:C.md,marginLeft:7}}>BPM</span>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <SL color={C.md}>Volume</SL>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:C.lt}}>
                    {ex.repRange} reps
                  </div>
                </div>
              </div>
              <div style={{flex:1}}/>
            </>
          ):(
            <div style={{flex:1,display:"flex",flexDirection:"column",
              justifyContent:"center",alignItems:"center",gap:10}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,color:C.wht}}>
                {m.bw?"Bodyweight":`${adjWt} lbs`}
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
              {/* Quick-select zone anchors */}
              <div style={{display:"flex",gap:6,marginBottom:10}}>
                {[110,120,130,140,150,160,170].map(v=>(
                  <button key={v} className="t" onClick={()=>setPhrInput(v)} style={{
                    flex:1,fontFamily:"'Bebas Neue',sans-serif",fontSize:13,
                    padding:"6px 0",borderRadius:7,cursor:"pointer",
                    background: phrInput===v?"rgba(232,38,10,0.2)":"rgba(255,255,255,0.05)",
                    border:`1px solid ${phrInput===v?C.red:C.bdr}`,
                    color: phrInput===v?C.wht:C.md,
                    letterSpacing:"0.04em",
                  }}>{v}</button>
                ))}
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
          {/* Rep count grid — single tap logs outcome */}
          {(()=>{
            const tgt = ex.targetReps;
            const lo  = Math.max(1, tgt - 4);
            const hi  = tgt + 5;
            const reps = Array.from({length: hi - lo}, (_, i) => lo + i);
            return (
              <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
                {reps.map(r => {
                  const isTarget = r === tgt;
                  const exceeded = r > tgt;
                  const short    = r < tgt;
                  const col  = exceeded ? C.grn : short ? "#ff6644" : C.wht;
                  const bg   = exceeded ? "rgba(34,200,100,0.08)"
                             : short    ? "rgba(232,38,10,0.1)"
                             : "rgba(255,255,255,0.07)";
                  const bdr  = exceeded ? `1px solid rgba(34,200,100,0.45)`
                             : short    ? `1px solid rgba(232,38,10,0.45)`
                             : `2px solid rgba(255,255,255,0.55)`;
                  const sh   = isTarget ? "0 0 12px rgba(255,255,255,0.15)" : "none";
                  return (
                    <button key={r} className="t" onClick={()=>attemptReps(r)} style={{
                      width:64, height:64, borderRadius:12,
                      background: bg, border: bdr, boxShadow: sh,
                      color: col, cursor:"pointer",
                      fontFamily:"'Bebas Neue',sans-serif",
                      fontSize: isTarget ? 30 : 24,
                      display:"flex",flexDirection:"column",
                      alignItems:"center",justifyContent:"center",gap:0,
                    }}>
                      <span>{r}</span>
                      {isTarget && (
                        <span style={{fontSize:8,fontFamily:"'Inter',sans-serif",
                          fontWeight:700,letterSpacing:"0.1em",color:"rgba(255,255,255,0.45)",
                          textTransform:"uppercase",marginTop:-2}}>target</span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })()}
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
                <button className="t" onClick={()=>{setShowNewExForm(v=>!v);setNewExName("");setNewExWeight("");setNewExReps("10");}}
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
            {showNewExForm&&(
              <div style={{margin:"0 12px 10px",background:"rgba(232,38,10,0.08)",
                border:`1px solid ${C.red}`,borderRadius:12,padding:"14px"}}>
                <div style={{fontFamily:"'Inter',sans-serif",fontWeight:800,fontSize:10,
                  color:C.red,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:10}}>
                  New Exercise
                </div>
                <input value={newExName} onChange={e=>setNewExName(e.target.value)}
                  placeholder="Exercise name"
                  style={{width:"100%",boxSizing:"border-box",
                    fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:600,
                    background:"rgba(255,255,255,0.06)",border:`1px solid ${C.bdr}`,
                    borderRadius:8,padding:"10px 12px",color:C.wht,
                    marginBottom:8,outline:"none"}}/>
                <div style={{display:"flex",gap:8,marginBottom:10}}>
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
                <button className="t"
                  onClick={()=>{
                    const name=newExName.trim();
                    if(!name) return;
                    const wt=parseInt(newExWeight)||100;
                    const rp=parseInt(newExReps)||10;
                    // Add to live prs state
                    setPrs(p=>({...p,[name]:{weight:wt,reps:rp}}));
                    // Swap into current exercise slot
                    const updated=[...exList];
                    updated[exIdx]={...updated[exIdx],name,
                      repRange:"8–12",targetReps:10};
                    setExList(updated);
                    setSetIdx(0);setLastRes(null);setLastWt(null);
                    setWeightAdj(0);setShowNewExForm(false);setShowExPicker(false);
                  }}
                  style={{width:"100%",fontFamily:"'Bebas Neue',sans-serif",
                    fontSize:16,color:"#fff",background:C.red,border:"none",
                    borderRadius:10,padding:"12px 0",cursor:"pointer",
                    letterSpacing:"0.08em"}}>
                  Add &amp; Select
                </button>
              </div>
            )}

            {/* Exercise list — filtered by session type, sourced from live prs */}
            <div style={{overflowY:"auto",padding:"0 12px 32px"}}>
              {(()=>{
                const {inCat,outCat}=exListForType(sesType,prs);
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
                        setWeightAdj(0);setShowExPicker(false);
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
                    {inCat.map(n=>renderEx(n,null))}
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
