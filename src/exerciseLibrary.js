// ─────────────────────────────────────────────────────────────
// EXERCISE LIBRARY — compiled reference for autocomplete +
// fuzzy duplicate detection. Used by Add New Exercise flow.
//
// Structure per entry:
//   canonical : Official display name. What's stored in PRs.
//   aliases   : Common alternative names users might type.
//   primary   : Main muscle worked.
//   secondary : Stabilizers / synergists.
//   equip     : barbell | dumbbell | machine | cable | bodyweight | plate-loaded | smith
//   type      : compound | isolation
// ─────────────────────────────────────────────────────────────

export const EXERCISE_LIBRARY = [

  // ── CHEST ───────────────────────────────────────────────────
  { canonical: "Barbell Bench Press",         aliases: ["bench press", "bb bench", "flat bench", "barbell flat bench"], primary: "chest", secondary: ["triceps","front delts"], equip: "barbell",   type: "compound"  },
  { canonical: "Incline Barbell Bench Press", aliases: ["incline bench press", "incline bb bench"], primary: "chest", secondary: ["front delts","triceps"], equip: "barbell",   type: "compound"  },
  { canonical: "Decline Barbell Bench Press", aliases: ["decline bench press", "decline bb bench"], primary: "chest", secondary: ["triceps"], equip: "barbell",   type: "compound"  },
  { canonical: "Dumbbell Bench Press",        aliases: ["db bench press", "flat db press", "dumbbell flat press"], primary: "chest", secondary: ["triceps","front delts"], equip: "dumbbell",  type: "compound"  },
  { canonical: "Incline Dumbbell Press",      aliases: ["incline db press", "incline dumbbell bench"], primary: "chest", secondary: ["front delts","triceps"], equip: "dumbbell",  type: "compound"  },
  { canonical: "Decline Dumbbell Press",      aliases: ["decline db press"], primary: "chest", secondary: ["triceps"], equip: "dumbbell",  type: "compound"  },
  { canonical: "Smith Machine Bench Press",   aliases: ["smith bench", "smith machine chest"], primary: "chest", secondary: ["triceps","front delts"], equip: "smith",     type: "compound"  },
  { canonical: "Machine Chest Press",         aliases: ["chest press machine", "seated chest press"], primary: "chest", secondary: ["triceps","front delts"], equip: "machine",   type: "compound"  },
  { canonical: "Incline Machine Press",       aliases: ["incline chest press machine", "lf incline press", "incline plate loaded press"], primary: "chest", secondary: ["front delts","triceps"], equip: "machine",   type: "compound"  },
  { canonical: "Hammer Strength Incline",     aliases: ["hs incline press", "hammer incline"], primary: "chest", secondary: ["front delts","triceps"], equip: "plate-loaded", type: "compound" },
  { canonical: "Hammer Strength Decline",     aliases: ["hs decline press", "hammer decline"], primary: "chest", secondary: ["triceps"], equip: "plate-loaded", type: "compound" },
  { canonical: "Pec Deck",                    aliases: ["pec dec", "pec fly machine", "chest fly machine"], primary: "chest", secondary: [], equip: "machine",   type: "isolation" },
  { canonical: "Dumbbell Fly",                aliases: ["db fly", "dumbbell flyes", "flat fly"], primary: "chest", secondary: [], equip: "dumbbell",  type: "isolation" },
  { canonical: "Incline Dumbbell Fly",        aliases: ["incline db fly"], primary: "chest", secondary: [], equip: "dumbbell",  type: "isolation" },
  { canonical: "Cable Crossover",             aliases: ["cable fly", "standing cable fly"], primary: "chest", secondary: [], equip: "cable",     type: "isolation" },
  { canonical: "Dumbbell Pullover",           aliases: ["db pullover"], primary: "chest", secondary: ["lats"], equip: "dumbbell",  type: "isolation" },
  { canonical: "Push-Up",                     aliases: ["pushup", "push ups"], primary: "chest", secondary: ["triceps","front delts","core"], equip: "bodyweight", type: "compound" },
  { canonical: "Weighted Dip (Chest)",        aliases: ["chest dip", "weighted chest dip"], primary: "chest", secondary: ["triceps","front delts"], equip: "bodyweight", type: "compound" },

  // ── BACK / LATS ─────────────────────────────────────────────
  { canonical: "Pull-Up",                     aliases: ["pullup", "pull ups"], primary: "lats", secondary: ["biceps","mid back"], equip: "bodyweight", type: "compound" },
  { canonical: "Chin-Up",                     aliases: ["chinup", "chin ups", "assisted chin-up"], primary: "lats", secondary: ["biceps"], equip: "bodyweight", type: "compound" },
  { canonical: "Lat Pulldown",                aliases: ["pulldown", "cable pulldown", "wide grip pulldown"], primary: "lats", secondary: ["biceps","mid back"], equip: "cable", type: "compound" },
  { canonical: "Lat Pulldown PL",             aliases: ["plate loaded pulldown", "hammer pulldown"], primary: "lats", secondary: ["biceps","mid back"], equip: "plate-loaded", type: "compound" },
  { canonical: "Close Grip Pulldown",         aliases: ["narrow grip pulldown", "v-bar pulldown"], primary: "lats", secondary: ["biceps"], equip: "cable", type: "compound" },
  { canonical: "Straight Arm Pulldown",       aliases: ["lat pushdown", "straight arm lat"], primary: "lats", secondary: [], equip: "cable", type: "isolation" },
  { canonical: "Barbell Row",                 aliases: ["bb row", "bent over row", "bent over barbell row"], primary: "mid back", secondary: ["lats","biceps","rear delts"], equip: "barbell", type: "compound" },
  { canonical: "Dumbbell Row",                aliases: ["db row", "one arm db row", "single arm row"], primary: "mid back", secondary: ["lats","biceps"], equip: "dumbbell", type: "compound" },
  { canonical: "T-Bar Row",                   aliases: ["tbar row", "landmine row"], primary: "mid back", secondary: ["lats","biceps"], equip: "barbell", type: "compound" },
  { canonical: "Seated Cable Row",            aliases: ["cable row", "seated row"], primary: "mid back", secondary: ["lats","biceps","rear delts"], equip: "cable", type: "compound" },
  { canonical: "LF Row",                      aliases: ["life fitness row", "lifefitness row"], primary: "mid back", secondary: ["lats","biceps"], equip: "plate-loaded", type: "compound" },
  { canonical: "LF High Row",                 aliases: ["life fitness high row", "high row machine"], primary: "lats", secondary: ["biceps","mid back"], equip: "plate-loaded", type: "compound" },
  { canonical: "Lever Seated Row",            aliases: ["plate loaded row", "hammer row"], primary: "mid back", secondary: ["lats","biceps"], equip: "plate-loaded", type: "compound" },
  { canonical: "Chest Supported Row",         aliases: ["seal row", "chest support row"], primary: "mid back", secondary: ["lats","rear delts"], equip: "machine", type: "compound" },
  { canonical: "Inverted Row",                aliases: ["body row", "ring row"], primary: "mid back", secondary: ["lats","biceps"], equip: "bodyweight", type: "compound" },
  { canonical: "Deadlift",                    aliases: ["conventional deadlift", "bb deadlift"], primary: "lower back", secondary: ["hamstrings","glutes","traps","forearms"], equip: "barbell", type: "compound" },
  { canonical: "Trap Bar Deadlift",           aliases: ["hex bar deadlift"], primary: "quads", secondary: ["hamstrings","glutes","traps","lower back"], equip: "barbell", type: "compound" },
  { canonical: "Rack Pull",                   aliases: ["rack deadlift", "block pull"], primary: "lower back", secondary: ["traps","hamstrings","forearms"], equip: "barbell", type: "compound" },
  { canonical: "Good Morning",                aliases: ["barbell good morning"], primary: "hamstrings", secondary: ["lower back","glutes"], equip: "barbell", type: "compound" },
  { canonical: "Hyperextension 45°",          aliases: ["45 degree back extension", "hyperextension", "back extension"], primary: "lower back", secondary: ["glutes","hamstrings"], equip: "bodyweight", type: "compound" },
  { canonical: "Reverse Hyperextension",      aliases: ["reverse hyper"], primary: "lower back", secondary: ["glutes","hamstrings"], equip: "machine", type: "compound" },

  // ── TRAPS ──────────────────────────────────────────────────
  { canonical: "Barbell Shrug",               aliases: ["bb shrug"], primary: "traps", secondary: ["forearms"], equip: "barbell", type: "isolation" },
  { canonical: "Dumbbell Shrug",              aliases: ["db shrug"], primary: "traps", secondary: ["forearms"], equip: "dumbbell", type: "isolation" },
  { canonical: "Trap Bar Shrug",              aliases: ["hex bar shrug"], primary: "traps", secondary: ["forearms"], equip: "barbell", type: "isolation" },
  { canonical: "Machine Shrug",               aliases: ["smith shrug"], primary: "traps", secondary: [], equip: "machine", type: "isolation" },
  { canonical: "Face Pull",                   aliases: ["cable face pull"], primary: "rear delts", secondary: ["traps","mid back"], equip: "cable", type: "isolation" },

  // ── SHOULDERS ───────────────────────────────────────────────
  { canonical: "Overhead Press",              aliases: ["ohp", "military press", "standing barbell press", "barbell ohp"], primary: "front delts", secondary: ["triceps","side delts","upper chest"], equip: "barbell", type: "compound" },
  { canonical: "Seated Barbell Press",        aliases: ["seated bb press", "seated military press"], primary: "front delts", secondary: ["triceps","side delts"], equip: "barbell", type: "compound" },
  { canonical: "Dumbbell Shoulder Press",     aliases: ["db shoulder press", "seated db press", "dumbbell overhead press"], primary: "front delts", secondary: ["side delts","triceps"], equip: "dumbbell", type: "compound" },
  { canonical: "Arnold Press",                aliases: ["arnold dumbbell press"], primary: "front delts", secondary: ["side delts","triceps"], equip: "dumbbell", type: "compound" },
  { canonical: "Military Press PL Machine",   aliases: ["plate loaded military press", "pl shoulder press", "pl ohp"], primary: "front delts", secondary: ["triceps","side delts"], equip: "plate-loaded", type: "compound" },
  { canonical: "Machine Shoulder Press",      aliases: ["seated shoulder press machine", "shoulder press machine"], primary: "front delts", secondary: ["triceps","side delts"], equip: "machine", type: "compound" },
  { canonical: "LF Shoulder Press",           aliases: ["life fitness shoulder press"], primary: "front delts", secondary: ["triceps","side delts"], equip: "plate-loaded", type: "compound" },
  { canonical: "Landmine Press",              aliases: ["landmine shoulder press"], primary: "front delts", secondary: ["triceps","upper chest"], equip: "barbell", type: "compound" },
  { canonical: "Dumbbell Lateral Raise",      aliases: ["db lateral raise", "side lateral", "lat raise"], primary: "side delts", secondary: [], equip: "dumbbell", type: "isolation" },
  { canonical: "Seated Lateral Raise",        aliases: ["seated db lateral", "seated side raise"], primary: "side delts", secondary: [], equip: "dumbbell", type: "isolation" },
  { canonical: "Cable Lateral Raise",         aliases: ["cable side raise", "one arm cable lateral"], primary: "side delts", secondary: [], equip: "cable", type: "isolation" },
  { canonical: "Machine Lateral Raise",       aliases: ["lateral raise machine"], primary: "side delts", secondary: [], equip: "machine", type: "isolation" },
  { canonical: "Front Raise",                 aliases: ["db front raise", "dumbbell front raise"], primary: "front delts", secondary: [], equip: "dumbbell", type: "isolation" },
  { canonical: "Plate Front Raise",           aliases: ["weight plate front raise"], primary: "front delts", secondary: [], equip: "bodyweight", type: "isolation" },
  { canonical: "Cable Front Raise",           aliases: [], primary: "front delts", secondary: [], equip: "cable", type: "isolation" },
  { canonical: "Rear Delt Fly",               aliases: ["bent over rear delt", "db rear delt fly", "reverse fly"], primary: "rear delts", secondary: ["mid back"], equip: "dumbbell", type: "isolation" },
  { canonical: "Reverse Pec Deck",            aliases: ["reverse pec dec", "rear delt machine"], primary: "rear delts", secondary: ["mid back"], equip: "machine", type: "isolation" },
  { canonical: "Cable Rear Delt Fly",         aliases: ["cable reverse fly"], primary: "rear delts", secondary: ["mid back"], equip: "cable", type: "isolation" },

  // ── BICEPS ──────────────────────────────────────────────────
  { canonical: "Barbell Curl",                aliases: ["bb curl", "standing barbell curl"], primary: "biceps", secondary: ["forearms"], equip: "barbell", type: "isolation" },
  { canonical: "EZ Bar Curl",                 aliases: ["ez curl"], primary: "biceps", secondary: ["forearms"], equip: "barbell", type: "isolation" },
  { canonical: "Dumbbell Curl",               aliases: ["db curl", "standing db curl"], primary: "biceps", secondary: ["forearms"], equip: "dumbbell", type: "isolation" },
  { canonical: "DB Alternating Curl",         aliases: ["alternating dumbbell curl", "alt db curl"], primary: "biceps", secondary: ["forearms"], equip: "dumbbell", type: "isolation" },
  { canonical: "DB Hammer Curl",              aliases: ["hammer curl", "dumbbell hammer curl"], primary: "biceps", secondary: ["forearms","brachialis"], equip: "dumbbell", type: "isolation" },
  { canonical: "Incline Dumbbell Curl",       aliases: ["incline db curl", "incline bench curl"], primary: "biceps", secondary: ["forearms"], equip: "dumbbell", type: "isolation" },
  { canonical: "Preacher Curl",               aliases: ["preacher bench curl", "barbell preacher"], primary: "biceps", secondary: ["forearms"], equip: "barbell", type: "isolation" },
  { canonical: "Cable Curl",                  aliases: ["cable bicep curl"], primary: "biceps", secondary: ["forearms"], equip: "cable", type: "isolation" },
  { canonical: "LF Bicep Curl",               aliases: ["life fitness bicep curl", "lf curl"], primary: "biceps", secondary: ["forearms"], equip: "machine", type: "isolation" },
  { canonical: "Machine Bicep Curl",          aliases: ["seated curl machine"], primary: "biceps", secondary: [], equip: "machine", type: "isolation" },
  { canonical: "Concentration Curl",          aliases: ["seated db concentration curl"], primary: "biceps", secondary: [], equip: "dumbbell", type: "isolation" },
  { canonical: "Spider Curl",                 aliases: [], primary: "biceps", secondary: [], equip: "dumbbell", type: "isolation" },
  { canonical: "Reverse Curl",                aliases: ["bb reverse curl", "overhand curl"], primary: "forearms", secondary: ["biceps","brachialis"], equip: "barbell", type: "isolation" },

  // ── TRICEPS ─────────────────────────────────────────────────
  { canonical: "Cable Pushdown",              aliases: ["tricep pushdown", "cable tricep pushdown", "rope pushdown"], primary: "triceps", secondary: [], equip: "cable", type: "isolation" },
  { canonical: "Rope Pushdown",               aliases: ["tricep rope pushdown"], primary: "triceps", secondary: [], equip: "cable", type: "isolation" },
  { canonical: "Overhead Cable Extension",    aliases: ["cable overhead tricep", "rope overhead extension"], primary: "triceps", secondary: [], equip: "cable", type: "isolation" },
  { canonical: "Overhead Dumbbell Extension", aliases: ["db overhead tricep", "seated db tricep extension"], primary: "triceps", secondary: [], equip: "dumbbell", type: "isolation" },
  { canonical: "Skull Crusher",               aliases: ["lying tricep extension", "ez bar skull crusher", "french press"], primary: "triceps", secondary: [], equip: "barbell", type: "isolation" },
  { canonical: "JM Press",                    aliases: ["jm press tricep"], primary: "triceps", secondary: ["chest"], equip: "barbell", type: "compound" },
  { canonical: "Close Grip Bench Press",      aliases: ["narrow grip bench", "close grip bench"], primary: "triceps", secondary: ["chest","front delts"], equip: "barbell", type: "compound" },
  { canonical: "Weighted Dip (Tricep)",       aliases: ["tricep dip", "parallel bar dip"], primary: "triceps", secondary: ["chest","front delts"], equip: "bodyweight", type: "compound" },
  { canonical: "Assisted Dip",                aliases: ["assisted parallel dip"], primary: "triceps", secondary: ["chest","front delts"], equip: "machine", type: "compound" },
  { canonical: "LF Seated Dip",               aliases: ["life fitness seated dip", "seated dip machine"], primary: "triceps", secondary: ["chest"], equip: "machine", type: "compound" },
  { canonical: "Seated PL Dip Machine",       aliases: ["plate loaded dip", "pl seated dip"], primary: "triceps", secondary: ["chest"], equip: "plate-loaded", type: "compound" },
  { canonical: "Bench Dip",                   aliases: ["chair dip"], primary: "triceps", secondary: [], equip: "bodyweight", type: "compound" },
  { canonical: "Tricep Kickback",             aliases: ["db kickback"], primary: "triceps", secondary: [], equip: "dumbbell", type: "isolation" },

  // ── QUADS ───────────────────────────────────────────────────
  { canonical: "Barbell Back Squat",          aliases: ["back squat", "bb squat", "high bar squat", "low bar squat"], primary: "quads", secondary: ["glutes","hamstrings","lower back","core"], equip: "barbell", type: "compound" },
  { canonical: "Front Squat",                 aliases: ["bb front squat"], primary: "quads", secondary: ["glutes","core","upper back"], equip: "barbell", type: "compound" },
  { canonical: "Smith Machine Squat",         aliases: ["smith squat"], primary: "quads", secondary: ["glutes","hamstrings"], equip: "smith", type: "compound" },
  { canonical: "Goblet Squat",                aliases: ["db goblet squat"], primary: "quads", secondary: ["glutes","core"], equip: "dumbbell", type: "compound" },
  { canonical: "Hack Squat",                  aliases: ["machine hack squat", "linear hack squat", "v-squat"], primary: "quads", secondary: ["glutes"], equip: "machine", type: "compound" },
  { canonical: "Linear Hack Squat PL",        aliases: ["lf hack squat", "plate loaded hack squat", "linear pl hack"], primary: "quads", secondary: ["glutes"], equip: "plate-loaded", type: "compound" },
  { canonical: "Leg Press",                   aliases: ["45 degree leg press", "machine leg press"], primary: "quads", secondary: ["glutes","hamstrings"], equip: "plate-loaded", type: "compound" },
  { canonical: "Bulgarian Split Squat",       aliases: ["rear foot elevated split squat", "rfess", "bss"], primary: "quads", secondary: ["glutes","hamstrings"], equip: "dumbbell", type: "compound" },
  { canonical: "Walking Lunge",               aliases: ["db walking lunge", "lunges"], primary: "quads", secondary: ["glutes","hamstrings"], equip: "dumbbell", type: "compound" },
  { canonical: "Reverse Lunge",               aliases: ["db reverse lunge"], primary: "quads", secondary: ["glutes","hamstrings"], equip: "dumbbell", type: "compound" },
  { canonical: "Step-Up",                     aliases: ["box step up", "db step up"], primary: "quads", secondary: ["glutes"], equip: "dumbbell", type: "compound" },
  { canonical: "Leg Extension",               aliases: ["machine leg extension", "quad extension"], primary: "quads", secondary: [], equip: "machine", type: "isolation" },
  { canonical: "Sissy Squat",                 aliases: [], primary: "quads", secondary: [], equip: "bodyweight", type: "isolation" },

  // ── HAMSTRINGS ──────────────────────────────────────────────
  { canonical: "Barbell RDL",                 aliases: ["romanian deadlift", "stiff leg deadlift", "rdl", "bb rdl"], primary: "hamstrings", secondary: ["glutes","lower back"], equip: "barbell", type: "compound" },
  { canonical: "Dumbbell RDL",                aliases: ["db rdl", "db romanian deadlift"], primary: "hamstrings", secondary: ["glutes","lower back"], equip: "dumbbell", type: "compound" },
  { canonical: "Single Leg RDL",              aliases: ["sl rdl", "single leg romanian"], primary: "hamstrings", secondary: ["glutes","core"], equip: "dumbbell", type: "compound" },
  { canonical: "Stiff Leg Deadlift",          aliases: ["sldl", "stiff legged deadlift"], primary: "hamstrings", secondary: ["lower back","glutes"], equip: "barbell", type: "compound" },
  { canonical: "Seated Leg Curl",             aliases: ["machine seated leg curl", "seated hamstring curl"], primary: "hamstrings", secondary: [], equip: "machine", type: "isolation" },
  { canonical: "Lying Leg Curl",              aliases: ["leg curls laying", "prone leg curl", "machine lying leg curl"], primary: "hamstrings", secondary: [], equip: "machine", type: "isolation" },
  { canonical: "Standing Leg Curl",           aliases: ["one leg standing curl"], primary: "hamstrings", secondary: [], equip: "machine", type: "isolation" },
  { canonical: "Nordic Curl",                 aliases: ["nordic hamstring curl"], primary: "hamstrings", secondary: [], equip: "bodyweight", type: "isolation" },

  // ── GLUTES ──────────────────────────────────────────────────
  { canonical: "Hip Thrust",                  aliases: ["barbell hip thrust", "bb hip thrust"], primary: "glutes", secondary: ["hamstrings"], equip: "barbell", type: "compound" },
  { canonical: "Hip Thrust (Smith)",          aliases: ["smith hip thrust", "smith machine hip thrust"], primary: "glutes", secondary: ["hamstrings"], equip: "smith", type: "compound" },
  { canonical: "Glute Bridge",                aliases: ["barbell glute bridge"], primary: "glutes", secondary: ["hamstrings"], equip: "barbell", type: "compound" },
  { canonical: "Cable Kickback",              aliases: ["glute kickback"], primary: "glutes", secondary: [], equip: "cable", type: "isolation" },
  { canonical: "Hip Abduction Machine",       aliases: ["hip abduction", "glute medius machine"], primary: "glutes", secondary: [], equip: "machine", type: "isolation" },

  // ── CALVES ──────────────────────────────────────────────────
  { canonical: "Standing Calf Raise",         aliases: ["machine calf raise", "standing calves"], primary: "calves", secondary: [], equip: "machine", type: "isolation" },
  { canonical: "Seated Calf Raise",           aliases: ["seated calves", "machine seated calf"], primary: "calves", secondary: [], equip: "machine", type: "isolation" },
  { canonical: "Calf Press",                  aliases: ["leg press calf raise", "calf press machine"], primary: "calves", secondary: [], equip: "plate-loaded", type: "isolation" },
  { canonical: "Calf Press, Linear Leg Press",aliases: ["linear leg press calf", "lf calf press"], primary: "calves", secondary: [], equip: "plate-loaded", type: "isolation" },
  { canonical: "Donkey Calf Raise",           aliases: ["donkey calves"], primary: "calves", secondary: [], equip: "bodyweight", type: "isolation" },
  { canonical: "Smith Calf Raise",            aliases: ["smith machine calves"], primary: "calves", secondary: [], equip: "smith", type: "isolation" },

  // ── CORE / ABS ──────────────────────────────────────────────
  { canonical: "Weighted Crunch",             aliases: ["machine crunch", "weighted crunches", "cable crunch"], primary: "abs", secondary: [], equip: "machine", type: "isolation" },
  { canonical: "Cable Crunch",                aliases: ["rope crunch", "kneeling cable crunch"], primary: "abs", secondary: [], equip: "cable", type: "isolation" },
  { canonical: "Hanging Leg Raise",           aliases: ["leg raise hanging"], primary: "abs", secondary: ["hip flexors"], equip: "bodyweight", type: "compound" },
  { canonical: "Captain's Chair",             aliases: ["captains chair leg raise"], primary: "abs", secondary: ["hip flexors"], equip: "bodyweight", type: "compound" },
  { canonical: "Plank",                       aliases: ["forearm plank"], primary: "abs", secondary: ["lower back"], equip: "bodyweight", type: "isolation" },
  { canonical: "Side Plank",                  aliases: [], primary: "obliques", secondary: ["abs"], equip: "bodyweight", type: "isolation" },
  { canonical: "Ab Wheel Rollout",            aliases: ["ab rollout", "wheel rollout"], primary: "abs", secondary: ["lower back"], equip: "bodyweight", type: "compound" },
  { canonical: "Decline Sit-Up",              aliases: ["weighted decline situp"], primary: "abs", secondary: ["hip flexors"], equip: "bodyweight", type: "isolation" },
  { canonical: "Russian Twist",               aliases: ["weighted russian twist"], primary: "obliques", secondary: ["abs"], equip: "dumbbell", type: "isolation" },
  { canonical: "Wood Chop (Cable)",           aliases: ["cable wood chop", "high to low chop"], primary: "obliques", secondary: ["abs"], equip: "cable", type: "compound" },

  // ── FOREARMS / GRIP ─────────────────────────────────────────
  { canonical: "Wrist Curl",                  aliases: ["barbell wrist curl"], primary: "forearms", secondary: [], equip: "barbell", type: "isolation" },
  { canonical: "Reverse Wrist Curl",          aliases: ["wrist extension"], primary: "forearms", secondary: [], equip: "barbell", type: "isolation" },
  { canonical: "Farmer's Carry",              aliases: ["farmer walk", "dumbbell carry"], primary: "forearms", secondary: ["traps","core"], equip: "dumbbell", type: "compound" },
  { canonical: "Dead Hang",                   aliases: ["passive hang", "hanging hold"], primary: "forearms", secondary: ["lats","grip"], equip: "bodyweight", type: "isolation" },

  // ── NECK ────────────────────────────────────────────────────
  { canonical: "Neck Flexion",                aliases: ["weighted neck curl", "harness neck flexion"], primary: "neck", secondary: [], equip: "bodyweight", type: "isolation" },
  { canonical: "Neck Extension",              aliases: ["harness neck extension"], primary: "neck", secondary: [], equip: "bodyweight", type: "isolation" },
];

// ─────────────────────────────────────────────────────────────
// MUSCLE GROUP MAP — used by warm-up tracker.
// Maps any primary muscle to its broader group for warm-up logic.
// ─────────────────────────────────────────────────────────────
export const MUSCLE_GROUPS = {
  // Upper body push
  "chest":        "chest",
  "front delts":  "shoulders",
  "side delts":   "shoulders",
  "rear delts":   "shoulders",
  "triceps":      "triceps",
  // Upper body pull
  "lats":         "back",
  "mid back":     "back",
  "lower back":   "lower back",
  "traps":        "traps",
  "biceps":       "biceps",
  "brachialis":   "biceps",
  "forearms":     "forearms",
  "grip":         "forearms",
  // Lower body
  "quads":        "quads",
  "hamstrings":   "hamstrings",
  "glutes":       "glutes",
  "calves":       "calves",
  // Core
  "abs":          "core",
  "obliques":     "core",
  "core":         "core",
  "hip flexors":  "core",
  // Neck
  "neck":         "neck",
};

// ─────────────────────────────────────────────────────────────
// WARM-UP MOVEMENTS — keyed by muscle group.
// Triggered when a muscle group has not yet been engaged in the
// session and an exercise targeting it is about to start.
// ─────────────────────────────────────────────────────────────
export const WARMUP_MOVES = {
  "chest":      ["Band pull-aparts × 15", "Wall slides × 10", "Push-ups × 10 controlled"],
  "shoulders":  ["Shoulder CARs × 5/side", "Band external rotations × 12/side", "Light dumbbell press × 12"],
  "back":       ["Scapular pulls × 10", "Cat-cow × 8", "Band rows × 15"],
  "lower back": ["Cat-cow × 8", "Bird-dog × 6/side", "Bodyweight hyperextensions × 10"],
  "traps":      ["Scapular shrugs × 15", "Band face pulls × 15"],
  "biceps":     ["Light DB curls × 15 each arm"],
  "triceps":    ["Bodyweight tricep extensions × 15", "Band pushdowns × 15"],
  "forearms":   ["Wrist circles × 10/direction", "Light wrist curls × 15"],
  "quads":      ["Bodyweight squats × 15", "Walking lunges × 10/side", "Leg swings front × 10/side"],
  "hamstrings": ["Bodyweight RDL × 10", "Leg swings front × 10/side", "Cat-cow × 8"],
  "glutes":     ["Glute bridges × 15", "Banded clamshells × 12/side", "Bodyweight hip thrust × 12"],
  "calves":     ["Bodyweight calf raises × 20", "Ankle circles × 10/direction"],
  "core":       ["Dead bug × 8/side", "Plank × 30 sec", "Cat-cow × 8"],
  "neck":       ["Cervical rotations × 5/direction", "Chin tucks × 10"],
};

// ─────────────────────────────────────────────────────────────
// FUZZY MATCHING — strip noise words, normalize for comparison.
// ─────────────────────────────────────────────────────────────
const NOISE = /\b(machine|seated|lying|standing|prone|kneeling|plate[-\s]?loaded|pl|barbell|bb|dumbbell|db|cable|smith|hammer|hammer\s?strength|hs|lf|life\s?fitness|nautilus|the|a|an|with|using)\b/gi;

export const normalize = (s) =>
  (s || "")
    .toLowerCase()
    .replace(NOISE, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Levenshtein distance — for fuzzy similarity score.
const lev = (a, b) => {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
};

// Search the library for matches to user input. Returns top N ranked.
// Strong matches require word-boundary alignment — short queries (2-3 chars)
// won't match mid-word substrings (e.g. "du" matches "Dumbbell" but not "Hip Abduction").
// Mid-word substring matching is only allowed for longer queries (4+ chars).
export const searchExercises = (query, n = 5) => {
  if (!query) return [];
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];

  const matchesWordStart = (text, qry) => {
    // Split on whitespace, punctuation, and case transitions
    const words = text.split(/[\s,()/\-_.]+/).filter(Boolean);
    return words.some(w => w.startsWith(qry));
  };

  const scored = EXERCISE_LIBRARY.map((e) => {
    const candidates = [e.canonical.toLowerCase(), ...e.aliases.map(a => a.toLowerCase())];
    let best = 0;
    for (const t of candidates) {
      let s = 0;
      if (t === q)                       s = 1.00;
      else if (t.startsWith(q))          s = 0.95;
      else if (matchesWordStart(t, q))   s = 0.90;  // any word in candidate starts with query
      else if (q.length >= 4 && t.includes(q)) s = 0.65;  // mid-word substring only for longer queries
      else {
        // Fuzzy: try normalized comparison as a last resort, only for queries 3+ chars
        if (q.length >= 3) {
          const nq = normalize(q), nt = normalize(t);
          if (nq && nt) {
            if (nq === nt)                                s = 0.90;
            else if (matchesWordStart(nt, nq))            s = 0.80;
            else if (q.length >= 4 && nt.includes(nq))    s = 0.60;
            else {
              const d  = lev(nq, nt);
              const ml = Math.max(nq.length, nt.length);
              const fz = ml ? 1 - d / ml : 0;
              if (fz > 0.7) s = fz * 0.55;
            }
          }
        }
      }
      if (s > best) best = s;
    }
    return { entry: e, score: best };
  })
  .filter((x) => x.score > 0.5)  // raised threshold to filter weak matches
  .sort((a, b) => b.score - a.score)
  .slice(0, n);

  return scored.map((x) => ({ ...x.entry, score: x.score }));
};

// Check if user's input duplicates an exercise already in their personal list.
// Uses NORMALIZED comparison — strips noise words so "DB Curl" matches "Dumbbell Curl".
// Also handles word-order variations via token sorting.
// Returns match only when similarity is high enough to be a true duplicate.
export const findDuplicate = (query, existingNames) => {
  if (!query || !existingNames?.length) return null;
  const nq = normalize(query);
  if (!nq) return null;
  // Sort tokens for order-independent comparison
  const tokSort = (s) => s.split(/\s+/).filter(Boolean).sort().join(" ");
  const tq = tokSort(nq);

  let best = null;
  for (const name of existingNames) {
    const nn = normalize(name);
    if (!nn) continue;
    const tn = tokSort(nn);

    let score = 0;
    if (nq === nn || tq === tn) {
      score = 1.0;
    } else if (nq.includes(nn) || nn.includes(nq)) {
      const min = Math.min(nq.length, nn.length);
      const max = Math.max(nq.length, nn.length);
      if (min / max > 0.7) score = 0.85;
    } else {
      // Compare both as-is and as token-sorted
      const dRaw    = lev(nq, nn);
      const dSorted = lev(tq, tn);
      const d  = Math.min(dRaw, dSorted);
      const ml = Math.max(nq.length, nn.length);
      score = ml ? 1 - d / ml : 0;
    }

    if (score > 0.75 && (!best || score > best.score)) {
      best = { name, score };
    }
  }
  return best;
};
