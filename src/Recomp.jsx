import React, { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================
// CONSTANTS — colors, styles, programming data
// ============================================================
const BG = '#09090b';
const ACCENT = '#e8ff47';
const ORANGE = '#ff6b35';
const CARD = '#18181b';
const CARD2 = '#27272a';
const BORDER = '#3f3f46';
const TEXT_DIM = '#a1a1aa';
const TEXT_MUTED = '#71717a';
const RED = '#ef4444';
const GREEN = '#22c55e';
const BLUE = '#3b82f6';
const PURPLE = '#a855f7';
const YELLOW = '#eab308';

const STORAGE_KEY = 'recomp_data';
const SCHEMA_VERSION = 9;

const WORKOUT_STYLES = [
  { id: 'rp_hyp', name: 'RP Hypertrophy', desc: 'MEV/MAV/MRV mesocycle, RIR drops 3→0' },
  { id: 'hyrox', name: 'HYROX', desc: '8 stations + run blocks, periodized' },
  { id: 'hyrox_hybrid', name: 'HYROX Hybrid', desc: 'Heavy lifts + race prep + KB' },
  { id: 'func_bb', name: 'Functional Bodybuilding', desc: 'Supersets A1/A2, RPE-based' },
  { id: 'trad_bb', name: 'Traditional Bodybuilding', desc: 'Bro split, isolation, hypertrophy' },
  { id: 'powerlifting', name: 'Powerlifting', desc: 'SBD focus, max strength' },
  { id: 'crossfit', name: 'CrossFit', desc: 'WODs, AMRAP, EMOM, Oly' },
  { id: 'athletic', name: 'Athletic Performance', desc: 'Speed, power, agility' },
  { id: 'hiit', name: 'HIIT/Circuit', desc: 'High intensity intervals' },
];

const DAY_TYPES_BY_STYLE = {
  rp_hyp: ['PUSH', 'PULL', 'LEGS', 'UPPER', 'LOWER', 'FULL', 'CARDIO', 'REST'],
  hyrox: ['STRENGTH_LOWER', 'STRENGTH_UPPER', 'RUN_INTERVALS', 'Z2_RUN', 'RACE_SIM', 'CARDIO', 'REST'],
  hyrox_hybrid: ['STRENGTH_LOWER', 'KB_RUN', 'STRENGTH_UPPER', 'Z2_RUN', 'RACE_SIM', 'CARDIO', 'REST'],
  powerlifting: ['SQUAT', 'BENCH', 'DEADLIFT', 'ACCESSORY', 'CARDIO', 'REST'],
  crossfit: ['WOD', 'STRENGTH', 'OLY', 'GYMNASTICS', 'CARDIO', 'REST'],
  athletic: ['SPEED', 'POWER', 'STRENGTH', 'CONDITIONING', 'CARDIO', 'REST'],
  hiit: ['HIIT', 'STRENGTH', 'FULL', 'CARDIO', 'REST'],
  trad_bb: ['CHEST', 'BACK', 'SHOULDERS', 'ARMS', 'LEGS', 'PUSH', 'PULL', 'CARDIO', 'REST'],
  func_bb: ['PUSH', 'PULL', 'LEGS', 'UPPER', 'LOWER', 'FULL', 'CARDIO', 'REST'],
};

const SPLIT_PRESETS = {
  rp_hyp: [
    { name: 'PPL 6-Day', days: ['PUSH', 'PULL', 'LEGS', 'PUSH', 'PULL', 'LEGS', 'REST'] },
    { name: 'Upper/Lower 4-Day', days: ['UPPER', 'LOWER', 'REST', 'UPPER', 'LOWER', 'REST', 'REST'] },
    { name: 'Full Body 3-Day', days: ['FULL', 'REST', 'FULL', 'REST', 'FULL', 'REST', 'REST'] },
    { name: 'PPL + Cardio', days: ['PUSH', 'PULL', 'LEGS', 'CARDIO', 'PUSH', 'PULL', 'REST'] },
  ],
  hyrox: [
    { name: 'Standard 5-Day', days: ['STRENGTH_LOWER', 'RUN_INTERVALS', 'STRENGTH_UPPER', 'Z2_RUN', 'RACE_SIM', 'REST', 'REST'] },
    { name: '6-Day Race Prep', days: ['STRENGTH_LOWER', 'RUN_INTERVALS', 'STRENGTH_UPPER', 'Z2_RUN', 'RACE_SIM', 'CARDIO', 'REST'] },
  ],
  hyrox_hybrid: [
    { name: 'Standard 5-Day', days: ['STRENGTH_LOWER', 'KB_RUN', 'Z2_RUN', 'STRENGTH_UPPER', 'RACE_SIM', 'REST', 'REST'] },
    { name: '6-Day Hybrid', days: ['STRENGTH_LOWER', 'KB_RUN', 'Z2_RUN', 'STRENGTH_UPPER', 'RACE_SIM', 'CARDIO', 'REST'] },
  ],
  powerlifting: [
    { name: '4-Day SBD+Acc', days: ['SQUAT', 'BENCH', 'REST', 'DEADLIFT', 'ACCESSORY', 'REST', 'REST'] },
    { name: '3-Day SBD', days: ['SQUAT', 'REST', 'BENCH', 'REST', 'DEADLIFT', 'REST', 'REST'] },
    { name: '5-Day', days: ['SQUAT', 'BENCH', 'DEADLIFT', 'ACCESSORY', 'ACCESSORY', 'REST', 'REST'] },
  ],
  crossfit: [
    { name: '5-Day Standard', days: ['WOD', 'STRENGTH', 'OLY', 'WOD', 'GYMNASTICS', 'REST', 'REST'] },
    { name: '3-on-1-off', days: ['WOD', 'STRENGTH', 'WOD', 'REST', 'OLY', 'WOD', 'REST'] },
  ],
  athletic: [
    { name: '4-Day Athletic', days: ['SPEED', 'STRENGTH', 'POWER', 'CONDITIONING', 'REST', 'REST', 'REST'] },
    { name: 'In-Season', days: ['SPEED', 'STRENGTH', 'REST', 'CONDITIONING', 'REST', 'REST', 'REST'] },
  ],
  hiit: [
    { name: '5-Day HIIT', days: ['HIIT', 'STRENGTH', 'HIIT', 'FULL', 'STRENGTH', 'REST', 'REST'] },
    { name: '3-Day HIIT', days: ['HIIT', 'REST', 'STRENGTH', 'REST', 'HIIT', 'REST', 'REST'] },
  ],
  trad_bb: [
    { name: 'Bro Split 5-Day', days: ['CHEST', 'BACK', 'SHOULDERS', 'ARMS', 'LEGS', 'REST', 'REST'] },
    { name: 'PPL 6-Day', days: ['PUSH', 'PULL', 'LEGS', 'PUSH', 'PULL', 'LEGS', 'REST'] },
    { name: 'PPL + Arms', days: ['PUSH', 'PULL', 'LEGS', 'ARMS', 'PUSH', 'PULL', 'REST'] },
  ],
  func_bb: [
    { name: 'PPL + Full', days: ['PUSH', 'PULL', 'LEGS', 'FULL', 'CARDIO', 'REST', 'REST'] },
    { name: 'Upper/Lower', days: ['UPPER', 'LOWER', 'REST', 'UPPER', 'LOWER', 'REST', 'REST'] },
    { name: '3-Day Full Body', days: ['FULL', 'REST', 'FULL', 'REST', 'FULL', 'REST', 'REST'] },
  ],
};

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Day type abbreviations for compact preview
const DAY_TYPE_ABBR = {
  PUSH: 'PSH', PULL: 'PUL', LEGS: 'LEG', UPPER: 'UPR', LOWER: 'LWR', FULL: 'FUL',
  CHEST: 'CHS', BACK: 'BCK', SHOULDERS: 'SHO', ARMS: 'ARM',
  SQUAT: 'SQT', BENCH: 'BNC', DEADLIFT: 'DL', ACCESSORY: 'ACC',
  WOD: 'WOD', STRENGTH: 'STR', OLY: 'OLY', GYMNASTICS: 'GYM',
  SPEED: 'SPD', POWER: 'POW', CONDITIONING: 'CON',
  HIIT: 'HIT',
  STRENGTH_LOWER: 'S-L', STRENGTH_UPPER: 'S-U', RUN_INTERVALS: 'INT', Z2_RUN: 'Z2', RACE_SIM: 'SIM', KB_RUN: 'KB',
  CARDIO: 'CAR', REST: '—',
};

// Day type colors
const DAY_TYPE_COLOR = {
  PUSH: ORANGE, PULL: BLUE, LEGS: PURPLE, UPPER: ORANGE, LOWER: PURPLE, FULL: ACCENT,
  CHEST: ORANGE, BACK: BLUE, SHOULDERS: '#fbbf24', ARMS: '#f97316',
  SQUAT: PURPLE, BENCH: ORANGE, DEADLIFT: BLUE, ACCESSORY: ACCENT,
  WOD: ORANGE, STRENGTH: ACCENT, OLY: PURPLE, GYMNASTICS: BLUE,
  SPEED: ORANGE, POWER: '#fbbf24', CONDITIONING: BLUE,
  HIIT: ORANGE,
  STRENGTH_LOWER: PURPLE, STRENGTH_UPPER: ORANGE, RUN_INTERVALS: ORANGE, Z2_RUN: BLUE, RACE_SIM: RED, KB_RUN: '#fbbf24',
  CARDIO: BLUE, REST: TEXT_MUTED,
};

// ============================================================
// RP HYPERTROPHY — Volume landmarks per muscle (sets/week)
// ============================================================
const RP_LANDMARKS = {
  Chest:     { MV: 6,  MEV: 10, MAV: 14, MRV: 22 },
  Back:      { MV: 8,  MEV: 10, MAV: 16, MRV: 25 },
  Shoulders: { MV: 8,  MEV: 8,  MAV: 16, MRV: 26 },
  Biceps:    { MV: 5,  MEV: 8,  MAV: 14, MRV: 20 },
  Triceps:   { MV: 4,  MEV: 6,  MAV: 12, MRV: 18 },
  Quads:     { MV: 6,  MEV: 8,  MAV: 14, MRV: 20 },
  Hamstrings:{ MV: 3,  MEV: 6,  MAV: 12, MRV: 16 },
  Glutes:    { MV: 0,  MEV: 0,  MAV: 8,  MRV: 16 },
  Calves:    { MV: 6,  MEV: 8,  MAV: 14, MRV: 20 },
};

// Each muscle has TWO sessions worth of exercises (A and B).
// When a muscle is trained 2x/week, day 1 = A, day 2 = B (different exercises,
// same muscle target). When trained 1x/week, alternates A/B by week parity.
const RP_EXERCISES = {
  Chest: {
    A: ['BB Bench Press', 'DB Incline Press', 'Cable Fly'],
    B: ['DB Flat Press', 'Incline BB Press', 'Pec Deck'],
  },
  Back: {
    A: ['Lat Pulldown', 'Barbell Row', 'Seated Cable Row', 'Face Pull'],
    B: ['Pull-Up', 'Single-Arm DB Row', 'Chest-Supported Row', 'Straight-Arm Pulldown'],
  },
  Shoulders: {
    A: ['Overhead Press', 'Cable Lateral Raise', 'DB Lateral Raise'],
    B: ['Seated DB Press', 'Cable Y-Raise', 'Machine Lateral Raise'],
  },
  Biceps: {
    A: ['DB Hammer Curl', 'Incline DB Curl'],
    B: ['EZ-Bar Curl', 'Cable Curl'],
  },
  Triceps: {
    A: ['Rope Pushdown', 'Overhead Tricep Extension'],
    B: ['Skull Crusher', 'Dip'],
  },
  Quads: {
    A: ['Back Squat', 'Leg Press', 'Leg Extension'],
    B: ['Front Squat', 'Hack Squat', 'Bulgarian Split Squat'],
  },
  Hamstrings: {
    A: ['Romanian Deadlift', 'Seated Leg Curl'],
    B: ['Stiff-Leg Deadlift', 'Lying Leg Curl'],
  },
  Glutes: {
    A: ['Hip Thrust'],
    B: ['Cable Pull-Through'],
  },
  Calves: {
    A: ['Standing Calf Raise'],
    B: ['Seated Calf Raise'],
  },
};

// RP feedback emoji scales (5-point each)
const RP_PUMP = ['💀 None', '😐 Low', '💪 Mod', '🔥 Great', '🌋 Insane'];
const RP_WORKLOAD = ['🐌 Easy', '😎 Pretty', '😅 Avg', '😤 Pushed', '💀 Too Much'];
const RP_SORENESS = ['😴 None', '😌 Healed', '😬 A Bit', '🥵 Sore', '🪦 Crushed'];

// ============================================================
// A/B EXERCISE VARIATION — non-RP styles
// Form note included with each exercise
// ============================================================
const AB_EXERCISES = {
  PUSH: {
    A: [
      { name: 'Barbell Bench Press', sets: '4', reps: '6-10', tempo: '20X1', note: 'Drive heels, retract scapula' },
      { name: 'DB Incline Press', sets: '3', reps: '8-12', tempo: '20X1', note: '30-degree bench, full ROM' },
      { name: 'Cable Lateral Raise', sets: '4', reps: '12-15', tempo: '20X1', note: 'Lead with elbow' },
      { name: 'Tricep Rope Pushdown', sets: '3', reps: '10-15', tempo: '20X1', note: 'Spread rope at bottom' },
      { name: 'Cable Fly', sets: '3', reps: '12-15', tempo: '21X1', note: 'Slight elbow bend' },
      { name: 'Overhead Tricep Extension', sets: '3', reps: '10-12', tempo: '31X0', note: 'Elbows tight' },
    ],
    B: [
      { name: 'Overhead Press', sets: '4', reps: '6-10', tempo: '20X1', note: 'Glutes tight, full lockout' },
      { name: 'DB Flat Press', sets: '3', reps: '8-12', tempo: '20X1', note: 'Squeeze chest at top' },
      { name: 'Cable Front Raise', sets: '3', reps: '12-15', tempo: '20X1', note: 'Lead with elbow' },
      { name: 'Skull Crusher', sets: '3', reps: '8-12', tempo: '31X0', note: 'Elbows still' },
      { name: 'DB Lateral Raise', sets: '4', reps: '12-15', tempo: '20X1', note: 'Slight forward lean' },
      { name: 'Tricep Dip', sets: '3', reps: '8-12', tempo: '20X1', note: 'Slight forward lean for chest assist' },
    ],
  },
  PULL: {
    A: [
      { name: 'Barbell Row', sets: '4', reps: '6-10', tempo: '20X1', note: 'Hinge to 45°, drive elbows' },
      { name: 'Lat Pulldown', sets: '3', reps: '8-12', tempo: '20X1', note: 'Pull to upper chest' },
      { name: 'Seated Cable Row', sets: '3', reps: '10-12', tempo: '20X1', note: 'Squeeze scaps at end range' },
      { name: 'Hammer Curl', sets: '3', reps: '10-12', tempo: '20X1', note: 'Neutral grip, no swing' },
      { name: 'Rear Delt Fly', sets: '4', reps: '12-15', tempo: '20X1', note: 'Slight elbow bend' },
      { name: 'Preacher Curl', sets: '3', reps: '10-12', tempo: '31X0', note: 'Slow eccentric' },
    ],
    B: [
      { name: 'Pull-Up', sets: '4', reps: '5-10', tempo: '20X1', note: 'Chin over bar, full hang' },
      { name: 'Single-Arm DB Row', sets: '3', reps: '8-12', tempo: '20X1', note: 'Drive elbow up, no twist' },
      { name: 'Face Pull', sets: '4', reps: '12-15', tempo: '20X1', note: 'External rotation at end' },
      { name: 'Incline DB Curl', sets: '3', reps: '10-12', tempo: '31X0', note: 'Stretch at bottom' },
      { name: 'Straight-Arm Pulldown', sets: '3', reps: '12-15', tempo: '20X1', note: 'Lats only, no elbow bend' },
      { name: 'Reverse Curl', sets: '3', reps: '10-12', tempo: '20X1', note: 'Knuckles up, brachialis focus' },
    ],
  },
  LEGS: {
    A: [
      { name: 'Back Squat', sets: '4', reps: '6-10', tempo: '20X1', note: 'Brace core, depth at parallel' },
      { name: 'Romanian Deadlift', sets: '3', reps: '8-12', tempo: '31X0', note: 'Soft knees, hinge at hips' },
      { name: 'Leg Press', sets: '3', reps: '10-12', tempo: '20X1', note: 'Feet shoulder width' },
      { name: 'Nordic Curl', sets: '3', reps: '6-10', tempo: '40X0', note: 'Slow descent, eccentric focus' },
      { name: 'Walking Lunge', sets: '3', reps: '10/leg', tempo: '20X1', note: 'Knee tracks toe' },
      { name: 'Leg Extension', sets: '3', reps: '12-15', tempo: '20X1', note: 'Squeeze top, slow eccentric' },
    ],
    B: [
      { name: 'Bulgarian Split Squat', sets: '3', reps: '8-10/leg', tempo: '20X1', note: 'Front foot forward, sit straight down' },
      { name: 'Hex Bar Deadlift', sets: '4', reps: '5-8', tempo: '20X1', note: 'Hips down, chest up' },
      { name: 'Seated Leg Curl', sets: '3', reps: '10-12', tempo: '31X0', note: 'Slow eccentric' },
      { name: 'Leg Press (high & wide)', sets: '3', reps: '10-12', tempo: '20X1', note: 'Glute focus' },
      { name: 'Hip Thrust', sets: '3', reps: '8-12', tempo: '20X1', note: 'Squeeze glutes hard at top' },
      { name: 'Standing Calf Raise', sets: '4', reps: '12-15', tempo: '20X1', note: 'Pause at top + bottom' },
    ],
  },
  UPPER: {
    A: [
      { name: 'Barbell Bench Press', sets: '4', reps: '6-10', tempo: '20X1', note: 'Drive heels, retract scapula' },
      { name: 'Barbell Row', sets: '4', reps: '6-10', tempo: '20X1', note: 'Hinge to 45°' },
      { name: 'DB Incline Press', sets: '3', reps: '8-12', tempo: '20X1', note: '30-degree bench' },
      { name: 'Lat Pulldown', sets: '3', reps: '10-12', tempo: '20X1', note: 'Pull to upper chest' },
      { name: 'DB Lateral Raise', sets: '3', reps: '12-15', tempo: '20X1', note: 'Slight forward lean' },
      { name: 'Hammer Curl', sets: '3', reps: '10-12', tempo: '20X1', note: 'No swing' },
    ],
    B: [
      { name: 'Overhead Press', sets: '4', reps: '6-10', tempo: '20X1', note: 'Glutes tight' },
      { name: 'Pull-Up', sets: '4', reps: '5-10', tempo: '20X1', note: 'Full hang to chin over' },
      { name: 'DB Flat Press', sets: '3', reps: '8-12', tempo: '20X1', note: 'Squeeze chest at top' },
      { name: 'Single-Arm DB Row', sets: '3', reps: '8-12', tempo: '20X1', note: 'Drive elbow up' },
      { name: 'Face Pull', sets: '3', reps: '12-15', tempo: '20X1', note: 'External rotation' },
      { name: 'Tricep Rope Pushdown', sets: '3', reps: '10-15', tempo: '20X1', note: 'Spread at bottom' },
    ],
  },
  LOWER: {
    A: [
      { name: 'Back Squat', sets: '4', reps: '6-10', tempo: '20X1', note: 'Brace core' },
      { name: 'Romanian Deadlift', sets: '3', reps: '8-12', tempo: '31X0', note: 'Soft knees' },
      { name: 'Leg Press', sets: '3', reps: '10-12', tempo: '20X1', note: 'Feet shoulder width' },
      { name: 'Walking Lunge', sets: '3', reps: '10/leg', tempo: '20X1', note: 'Knee tracks toe' },
      { name: 'Standing Calf Raise', sets: '4', reps: '12-15', tempo: '20X1', note: 'Pause top + bottom' },
    ],
    B: [
      { name: 'Hex Bar Deadlift', sets: '4', reps: '5-8', tempo: '20X1', note: 'Hips down, chest up' },
      { name: 'Bulgarian Split Squat', sets: '3', reps: '8-10/leg', tempo: '20X1', note: 'Sit straight down' },
      { name: 'Seated Leg Curl', sets: '3', reps: '10-12', tempo: '31X0', note: 'Slow eccentric' },
      { name: 'Hip Thrust', sets: '3', reps: '8-12', tempo: '20X1', note: 'Squeeze glutes hard' },
      { name: 'Seated Calf Raise', sets: '4', reps: '12-15', tempo: '20X1', note: 'Soleus focus' },
    ],
  },
  FULL: {
    A: [
      { name: 'Goblet Squat', sets: '3', reps: '8-12', tempo: '20X1', note: 'Elbows inside knees' },
      { name: 'DB Push Press', sets: '3', reps: '6-10', tempo: '20X1', note: 'Use leg drive' },
      { name: 'Trap Bar Deadlift', sets: '4', reps: '5-8', tempo: '20X1', note: 'Hips down, chest up' },
      { name: 'Chin-Up', sets: '3', reps: '5-10', tempo: '20X1', note: 'Full hang to chin over' },
      { name: 'DB Walking Lunge', sets: '3', reps: '10/leg', tempo: '20X1', note: 'Heavy DBs at sides' },
      { name: 'Plank to Push-Up', sets: '3', reps: '8-10', tempo: '20X1', note: 'Hips stay square' },
    ],
    B: [
      { name: 'Front Squat', sets: '3', reps: '6-10', tempo: '20X1', note: 'Elbows up, chest tall' },
      { name: 'DB Strict Press', sets: '3', reps: '8-10', tempo: '20X1', note: 'No leg drive' },
      { name: 'Sumo Deadlift', sets: '4', reps: '5-8', tempo: '20X1', note: 'Wide stance, knees out' },
      { name: 'Inverted Row', sets: '3', reps: '8-12', tempo: '21X1', note: 'Squeeze scaps at top' },
      { name: 'Reverse Lunge', sets: '3', reps: '10/leg', tempo: '20X1', note: 'Step back, knee to ground' },
      { name: 'Hollow Hold', sets: '3', reps: '20-30s', tempo: '-', note: 'Lower back pressed flat' },
    ],
  },
};

// Body-part split for trad BB — A/B variants per part
const TRADBB_EXERCISES = {
  CHEST: {
    A: [
      { name: 'BB Bench Press', sets: '4', reps: '6-10', tempo: '20X1', note: 'Retract scapula' },
      { name: 'Incline DB Press', sets: '4', reps: '8-12', tempo: '20X1', note: '30-degree bench' },
      { name: 'Cable Fly', sets: '3', reps: '12-15', tempo: '21X1', note: 'Slight bend in elbows' },
      { name: 'Push-Up', sets: '3', reps: 'AMRAP', tempo: '20X1', note: 'Burnout finisher' },
    ],
    B: [
      { name: 'Incline BB Press', sets: '4', reps: '6-10', tempo: '20X1', note: 'Upper chest emphasis' },
      { name: 'DB Flat Press', sets: '4', reps: '8-12', tempo: '20X1', note: 'Squeeze chest at top' },
      { name: 'Pec Deck', sets: '3', reps: '12-15', tempo: '21X1', note: 'Hold contraction 1s' },
      { name: 'Dip', sets: '3', reps: 'AMRAP', tempo: '20X1', note: 'Lean forward for chest' },
    ],
  },
  BACK: {
    A: [
      { name: 'Pull-Up', sets: '4', reps: '6-10', tempo: '20X1', note: 'Full hang' },
      { name: 'Barbell Row', sets: '4', reps: '6-10', tempo: '20X1', note: 'Hinge to 45°' },
      { name: 'Lat Pulldown', sets: '3', reps: '10-12', tempo: '20X1', note: 'Pull to upper chest' },
      { name: 'Seated Cable Row', sets: '3', reps: '10-12', tempo: '20X1', note: 'Squeeze scaps' },
    ],
    B: [
      { name: 'Chin-Up', sets: '4', reps: '6-10', tempo: '20X1', note: 'Underhand grip' },
      { name: 'T-Bar Row', sets: '4', reps: '8-12', tempo: '20X1', note: 'Mid-back focus' },
      { name: 'Single-Arm DB Row', sets: '3', reps: '10/side', tempo: '20X1', note: 'Drive elbow up' },
      { name: 'Straight-Arm Pulldown', sets: '3', reps: '12-15', tempo: '20X1', note: 'Lats only' },
    ],
  },
  SHOULDERS: {
    A: [
      { name: 'Overhead Press', sets: '4', reps: '6-10', tempo: '20X1', note: 'Glutes tight' },
      { name: 'DB Lateral Raise', sets: '4', reps: '12-15', tempo: '20X1', note: 'Slight forward lean' },
      { name: 'Cable Front Raise', sets: '3', reps: '12-15', tempo: '20X1', note: 'Controlled tempo' },
      { name: 'Face Pull', sets: '3', reps: '12-15', tempo: '20X1', note: 'External rotation' },
    ],
    B: [
      { name: 'Seated DB Press', sets: '4', reps: '6-10', tempo: '20X1', note: 'Strict, no leg drive' },
      { name: 'Cable Lateral Raise', sets: '4', reps: '12-15', tempo: '20X1', note: 'Constant tension' },
      { name: 'Rear Delt Fly', sets: '3', reps: '12-15', tempo: '20X1', note: 'Slight elbow bend' },
      { name: 'Upright Row', sets: '3', reps: '10-12', tempo: '20X1', note: 'Wide grip, elbows lead' },
    ],
  },
  ARMS: {
    A: [
      { name: 'EZ-Bar Curl', sets: '4', reps: '8-12', tempo: '20X1', note: 'No swing' },
      { name: 'Skull Crusher', sets: '4', reps: '8-12', tempo: '31X0', note: 'Elbows still' },
      { name: 'Hammer Curl', sets: '3', reps: '10-12', tempo: '20X1', note: 'Neutral grip' },
      { name: 'Tricep Pushdown', sets: '3', reps: '10-15', tempo: '20X1', note: 'Squeeze at lockout' },
      { name: 'Preacher Curl', sets: '3', reps: '10-12', tempo: '31X0', note: 'Slow eccentric' },
      { name: 'Overhead Tricep Ext', sets: '3', reps: '10-12', tempo: '31X0', note: 'Elbows tight' },
    ],
    B: [
      { name: 'Incline DB Curl', sets: '4', reps: '8-12', tempo: '31X0', note: 'Stretch at bottom' },
      { name: 'Close-Grip Bench', sets: '4', reps: '6-10', tempo: '20X1', note: 'Tricep mass builder' },
      { name: 'Cable Curl', sets: '3', reps: '10-12', tempo: '20X1', note: 'Constant tension' },
      { name: 'Rope Overhead Ext', sets: '3', reps: '10-12', tempo: '31X0', note: 'Stretch the long head' },
      { name: 'Reverse Curl', sets: '3', reps: '10-12', tempo: '20X1', note: 'Brachialis focus' },
      { name: 'Dip', sets: '3', reps: 'AMRAP', tempo: '20X1', note: 'Upright torso' },
    ],
  },
  // LEGS uses LEGS A/B from AB_EXERCISES (already has A/B)
};

// Powerlifting exercises by day — A/B variants for repeated sessions
// A = heavy/competition focus, B = volume/variation work
const PL_EXERCISES = {
  SQUAT: {
    A: [
      { name: 'Back Squat', sets: '5', reps: '3-5', tempo: '20X1', note: 'Heavy primary, work to top set' },
      { name: 'Pause Squat', sets: '3', reps: '4-6', tempo: '21X1', note: '1s pause at depth' },
      { name: 'Bulgarian Split Squat', sets: '3', reps: '8/leg', tempo: '20X1', note: 'Quad accessory' },
      { name: 'Leg Curl', sets: '3', reps: '10-12', tempo: '20X1', note: 'Hamstring health' },
      { name: 'Plank', sets: '3', reps: '45s', tempo: '-', note: 'Brace, neutral spine' },
    ],
    B: [
      { name: 'Front Squat', sets: '4', reps: '5-8', tempo: '20X1', note: 'Quads + core' },
      { name: 'Tempo Squat', sets: '3', reps: '6-8', tempo: '40X1', note: '4s eccentric' },
      { name: 'Romanian Deadlift', sets: '3', reps: '8-10', tempo: '31X0', note: 'Hamstring strength' },
      { name: 'Leg Extension', sets: '3', reps: '12-15', tempo: '20X1', note: 'Quad pump' },
      { name: 'Hanging Leg Raise', sets: '3', reps: '10-15', tempo: '-', note: 'Core control' },
    ],
  },
  BENCH: {
    A: [
      { name: 'Bench Press', sets: '5', reps: '3-5', tempo: '20X1', note: 'Heavy primary' },
      { name: 'Close-Grip Bench', sets: '3', reps: '6-8', tempo: '20X1', note: 'Tricep + lockout' },
      { name: 'DB Press', sets: '3', reps: '8-12', tempo: '20X1', note: 'Hypertrophy work' },
      { name: 'Tricep Pushdown', sets: '3', reps: '10-12', tempo: '20X1', note: 'Lockout strength' },
      { name: 'Face Pull', sets: '3', reps: '12-15', tempo: '20X1', note: 'Shoulder health' },
    ],
    B: [
      { name: 'Pause Bench', sets: '5', reps: '4-6', tempo: '22X1', note: '2s pause on chest' },
      { name: 'Incline Bench', sets: '4', reps: '6-8', tempo: '20X1', note: 'Upper chest emphasis' },
      { name: 'Spoto Press', sets: '3', reps: '6-8', tempo: '21X1', note: '1" off chest pause' },
      { name: 'Skull Crusher', sets: '3', reps: '8-12', tempo: '31X0', note: 'Tricep mass' },
      { name: 'Band Pull-Apart', sets: '3', reps: '15-20', tempo: '-', note: 'Rear delt' },
    ],
  },
  DEADLIFT: {
    A: [
      { name: 'Deadlift', sets: '5', reps: '1-3', tempo: '20X1', note: 'Heavy primary, RPE 8-9' },
      { name: 'Deficit Deadlift', sets: '3', reps: '4-6', tempo: '20X1', note: 'Off 2" plate' },
      { name: 'Barbell Row', sets: '3', reps: '6-8', tempo: '20X1', note: 'Back strength' },
      { name: 'Hip Thrust', sets: '3', reps: '8-10', tempo: '20X1', note: 'Glute primer' },
    ],
    B: [
      { name: 'Block Pull', sets: '5', reps: '3-5', tempo: '20X1', note: 'From mid-shin blocks' },
      { name: 'Pause Deadlift', sets: '3', reps: '3-5', tempo: '21X1', note: '2s pause off floor' },
      { name: 'Pendlay Row', sets: '3', reps: '6-8', tempo: '20X1', note: 'Explosive pull' },
      { name: 'Good Morning', sets: '3', reps: '8-10', tempo: '31X0', note: 'Hamstring/lower back' },
    ],
  },
  ACCESSORY: {
    A: [
      { name: 'Pause Bench', sets: '4', reps: '5-6', tempo: '21X1', note: '2s pause on chest' },
      { name: 'Front Squat', sets: '3', reps: '5-8', tempo: '20X1', note: 'Quads + core' },
      { name: 'Pull-Up', sets: '3', reps: '6-10', tempo: '20X1', note: 'Lats + grip' },
      { name: 'Overhead Press', sets: '3', reps: '6-8', tempo: '20X1', note: 'Shoulders' },
      { name: 'Curl', sets: '3', reps: '10-12', tempo: '20X1', note: 'Biceps' },
    ],
    B: [
      { name: 'Spoto Press', sets: '4', reps: '5-6', tempo: '21X1', note: '1" off chest' },
      { name: 'Romanian Deadlift', sets: '3', reps: '6-8', tempo: '31X0', note: 'Posterior chain' },
      { name: 'DB Row', sets: '3', reps: '8-12', tempo: '20X1', note: 'Lat hypertrophy' },
      { name: 'Lateral Raise', sets: '3', reps: '12-15', tempo: '20X1', note: 'Side delts' },
      { name: 'Tricep Extension', sets: '3', reps: '10-12', tempo: '31X0', note: 'Lockout' },
    ],
  },
};

// ============================================================
// HYROX RACE STATIONS (full programming)
// ============================================================
const HYROX_STATIONS = [
  { name: 'SkiErg', dist: '1000m', m: '', w: '', note: 'Hip drive, full extension, finish at hips' },
  { name: 'Sled Push', dist: '50m', m: '152kg', w: '102kg', note: 'Low hips, drive through legs' },
  { name: 'Sled Pull', dist: '50m', m: '103kg', w: '78kg', note: 'Wide stance, pull hand-over-hand' },
  { name: 'Burpee Broad Jumps', dist: '80m', m: '~20-25 reps', w: '~20-25 reps', note: 'Pace yourself, full extension' },
  { name: 'Row', dist: '1000m', m: '', w: '', note: 'Target 1:50-2:10/500m pace' },
  { name: 'Farmer Carry', dist: '200m', m: '24kg KB each', w: '16kg KB each', note: 'No drops if possible' },
  { name: 'Sandbag Lunges', dist: '100m', m: '20kg', w: '10kg', note: 'Knee taps ground each rep' },
  { name: 'Wall Balls', dist: '75-100 reps', m: '6kg / 10ft', w: '4kg / 9ft', note: 'Squat depth, ball above target line' },
];

// HYROX division targets
const HYROX_TARGETS = [
  { div: 'Open M', target: 'sub-1:25:00' },
  { div: 'Open W', target: 'sub-1:35:00' },
  { div: 'Pro M', target: 'sub-1:00:00' },
  { div: 'Pro W', target: 'sub-1:10:00' },
];

// HYROX Hybrid KB sizing
const KB_SIZING = {
  standard: { m: '24kg', w: '16kg', use: 'Clean, snatch, press, complex' },
  heavy: { m: '32kg', w: '24kg', use: 'Swings, EMOM finishers' },
};

// Restaurant chains for food quick-pick chips
const RESTAURANT_CHIPS = [
  { emoji: '🌯', name: 'Chipotle' },
  { emoji: '🐔', name: 'Chick-fil-A' },
  { emoji: '☕', name: 'Starbucks' },
  { emoji: '🥪', name: 'Subway' },
  { emoji: '🍔', name: "McDonald's" },
  { emoji: '🥗', name: 'Cava' },
  { emoji: '🥙', name: 'Panera' },
  { emoji: '🌮', name: 'Taco Bell' },
  { emoji: '🍕', name: "Domino's" },
  { emoji: '🍩', name: "Dunkin'" },
  { emoji: '🥩', name: 'Texas Roadhouse' },
  { emoji: '🍳', name: 'Eggs' },
  { emoji: '🍗', name: 'Chicken' },
  { emoji: '🍚', name: 'Rice' },
];

const RUN_TYPES = [
  { id: 'easy', name: 'Easy / Z2', color: GREEN },
  { id: 'intervals', name: 'Intervals', color: ORANGE },
  { id: 'tempo', name: 'Tempo', color: YELLOW },
  { id: 'long', name: 'Long Run', color: BLUE },
  { id: 'race', name: 'Race', color: PURPLE },
  { id: 'trail', name: 'Trail', color: '#84cc16' },
  { id: 'recovery', name: 'Recovery', color: TEXT_DIM },
];

const PR_DISTANCES = [
  { id: '1mi', name: '1 Mile', miles: 1.0, tol: 0.05 },
  { id: '5k', name: '5K', miles: 3.107, tol: 0.05 },
  { id: '10k', name: '10K', miles: 6.214, tol: 0.05 },
  { id: 'half', name: 'Half Marathon', miles: 13.109, tol: 0.04 },
  { id: 'full', name: 'Marathon', miles: 26.219, tol: 0.04 },
];

const MOOD_OPTIONS = ['😤', '😴', '😐', '💪', '🔥'];
const MOOD_LABELS = ['Frustrated', 'Tired', 'Neutral', 'Strong', 'Great'];

const ACTIVITY_LEVELS = [
  { id: 'sedentary', name: 'Sedentary', mult: 1.2, desc: 'Little exercise' },
  { id: 'light', name: 'Lightly Active', mult: 1.375, desc: '1-3 days/wk' },
  { id: 'moderate', name: 'Moderately Active', mult: 1.55, desc: '3-5 days/wk' },
  { id: 'very', name: 'Very Active', mult: 1.725, desc: '6-7 days/wk' },
];

const GOAL_OPTIONS = [
  { id: 'fatloss', name: 'Fat Loss', adj: -500, desc: '-500 cal/day' },
  { id: 'muscle', name: 'Muscle Gain', adj: 300, desc: '+300 cal/day' },
  { id: 'recomp', name: 'Recomp', adj: 0, desc: 'Maintenance' },
  { id: 'performance', name: 'Performance', adj: 0, desc: 'Maintenance' },
];

const PROGRAM_LENGTHS = [4, 8, 10, 12, 16];

const TABS = [
  { id: 'dashboard', label: 'DASH' },
  { id: 'workouts', label: 'WORKOUTS' },
  { id: 'runs', label: 'RUNS' },
  { id: 'metrics', label: 'METRICS' },
  { id: 'food', label: 'FOOD' },
  { id: 'journal', label: 'JOURNAL' },
  { id: 'backup', label: 'BACKUP' },
];

// ============================================================
// HELPERS — date, macros, BMR, race math, exercise resolution
// ============================================================
// All ISO strings are LOCAL calendar dates (YYYY-MM-DD), not UTC.
// Avoid toISOString() which converts to UTC and can flip the date for users
// outside UTC near midnight.
const dateToISO = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const todayISO = () => dateToISO(new Date());
const dateOffsetISO = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return dateToISO(d);
};
const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};
const formatDateLong = (iso) => {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};
const isoToDate = (iso) => new Date(iso + 'T00:00:00');

// Height parsing — handles "5ft 9in", "69", "175", "5'9", "5 9", "5-9"
const parseHeight = (input) => {
  if (!input) return null;
  const s = String(input).trim().toLowerCase();
  // Try cm first (just 3 digits, value 100-250)
  const cmMatch = s.match(/^(\d{3})(?:\s*cm)?$/);
  if (cmMatch) {
    const cm = parseInt(cmMatch[1], 10);
    if (cm >= 100 && cm <= 250) return cm;
  }
  // Try ft/in patterns
  const ftIn = s.match(/(\d+)\s*(?:ft|'|\s|-)\s*(\d+)/);
  if (ftIn) {
    const ft = parseInt(ftIn[1], 10);
    const inches = parseInt(ftIn[2], 10);
    return Math.round((ft * 12 + inches) * 2.54);
  }
  // Just inches (60-90)
  const just = parseInt(s.replace(/\D/g, '').slice(0, 3), 10);
  if (just >= 50 && just <= 90) return Math.round(just * 2.54);
  if (just >= 100 && just <= 250) return just;
  return null;
};

// Mifflin-St Jeor BMR
const calcBMR = (weightLb, heightCm, age, sex) => {
  const kg = weightLb * 0.453592;
  if (sex === 'female') return 10 * kg + 6.25 * heightCm - 5 * age - 161;
  return 10 * kg + 6.25 * heightCm - 5 * age + 5;
};

// Macros from profile (uses currentWeight = most recent weight log)
const calcMacros = (profile, currentWeight) => {
  const w = currentWeight || profile.weight;
  const heightCm = parseHeight(profile.height) || 175;
  const bmr = calcBMR(w, heightCm, profile.age || 30, profile.sex || 'male');
  const actLevel = ACTIVITY_LEVELS.find((a) => a.id === profile.activity) || ACTIVITY_LEVELS[2];
  const tdee = bmr * actLevel.mult;
  const goal = GOAL_OPTIONS.find((g) => g.id === profile.goal) || GOAL_OPTIONS[2];
  const calories = Math.round(tdee + goal.adj);
  // Protein: max(current, target) lbs in grams
  const proteinAnchor = Math.max(w, profile.target || w);
  const protein = Math.round(proteinAnchor);
  const fat = Math.round((calories * 0.25) / 9);
  const carbsCal = calories - protein * 4 - fat * 9;
  const carbs = Math.max(0, Math.round(carbsCal / 4));
  return { calories, protein, carbs, fat, bmr: Math.round(bmr), tdee: Math.round(tdee) };
};

// Brzycki 1RM
const est1RM = (weight, reps) => {
  if (!weight || !reps || reps <= 0) return 0;
  const r = Math.min(reps, 15);
  return Math.round(weight * (36 / (37 - r)));
};

// Race math
const daysUntil = (iso) => {
  if (!iso) return null;
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const r = new Date(iso + 'T00:00:00');
  return Math.round((r - t) / 86400000);
};

const racePhase = (days) => {
  if (days == null) return null;
  if (days < 0) return { label: 'RACE COMPLETE — TIME TO RECOVER', emoji: '✓', color: TEXT_DIM };
  if (days === 0) return { label: 'GO TIME — TRUST YOUR PREP', emoji: '🏁', color: ORANGE };
  if (days <= 7) return { label: 'RACE WEEK — RECOVER', emoji: '⚡', color: ORANGE };
  if (days <= 21) return { label: 'TAPER ZONE — RECOVERY MATTERS', emoji: '⚡', color: ORANGE };
  if (days <= 56) return { label: 'PEAK PHASE — PUSH HARD', emoji: '🔥', color: '#fbbf24' };
  if (days <= 84) return { label: 'BUILD BLOCK — CONSISTENCY', emoji: '🔥', color: ACCENT };
  return { label: 'BASE BUILDING — STAY THE COURSE', emoji: '🏗️', color: BLUE };
};

const raceColor = (days) => {
  if (days == null || days < 0) return TEXT_DIM;
  if (days === 0 || days <= 7) return ORANGE;
  if (days <= 21) return '#fb923c';
  if (days <= 56) return '#fbbf24';
  if (days <= 84) return ACCENT;
  return BLUE;
};

// HYROX phase by week (BASE 40% → BUILD 40% → PEAK 20%, last week TAPER)
const hyroxPhase = (week, totalWeeks) => {
  if (week >= totalWeeks) return { name: 'TAPER', color: PURPLE, emoji: '⚡' };
  const pct = week / totalWeeks;
  if (pct <= 0.4) return { name: 'BASE', color: BLUE, emoji: '🏗️' };
  if (pct <= 0.8) return { name: 'BUILD', color: '#fbbf24', emoji: '🔥' };
  return { name: 'RACE PREP', color: ORANGE, emoji: '🔥' };
};

const HYROX_INTERVALS_BY_PHASE = {
  BASE: { run: '6 × 400m at 5K pace', erg: '5 × 500m row/ski at 1:55/500m', rest: '90s rest' },
  BUILD: { run: '5 × 800m at 10K pace', erg: '4 × 750m row/ski at race pace', rest: '2:00 rest' },
  'RACE PREP': { run: '4 × 1km at race pace', erg: '3 × 1000m row/ski at race pace', rest: '2:30 rest' },
  TAPER: { run: '3 × 400m easy', erg: '2 × 500m moderate', rest: 'Full rest' },
};

// ============================================================
// PHASE PROGRAMMING — non-RP/HYROX styles
// ============================================================
const PHASE_BY_WEEK_12 = [
  { week: 1, phase: 'ACCUMULATION', sets: '3', reps: '12-15', rpe: '6-7', tempo: '20X1', note: 'Establish baseline. Easy weight, perfect form.' },
  { week: 2, phase: 'ACCUMULATION', sets: '4', reps: '12-15', rpe: '6-7', tempo: '21X1', note: '+1 set, same load' },
  { week: 3, phase: 'ACCUMULATION', sets: '4', reps: '10-12', rpe: '7', tempo: '20X1', note: '+5 lbs, drop reps' },
  { week: 4, phase: 'HYPERTROPHY', sets: '4', reps: '8-12', rpe: '7-8', tempo: '31X1', note: 'Eccentric 3s, +5-10 lbs' },
  { week: 5, phase: 'HYPERTROPHY', sets: '4', reps: '8-10', rpe: '7-8', tempo: '20X1', note: '+5 lbs' },
  { week: 6, phase: 'HYPERTROPHY', sets: '5', reps: '8-10', rpe: '8', tempo: '20X1', note: 'Peak volume — 5 sets A1/A2' },
  { week: 7, phase: 'INTENSIFICATION', sets: '4', reps: '4-6', rpe: '8-9', tempo: '21X0', note: '+10-15 lbs, 3min rest' },
  { week: 8, phase: 'INTENSIFICATION', sets: '5', reps: '4-6', rpe: '8-9', tempo: '20X0', note: 'Heaviest set, +5 lbs' },
  { week: 9, phase: 'REALIZATION', sets: '4', reps: '2-4', rpe: '9-10', tempo: '10X0', note: 'Max load, 4min rest' },
  { week: 10, phase: 'DELOAD', sets: '3', reps: '8-10', rpe: '5-6', tempo: '20X1', note: '60% of Wk 9' },
  { week: 11, phase: 'NEW BLOCK', sets: '4', reps: '12-15', rpe: '6-7', tempo: '20X1', note: 'Start +10 lbs heavier than Wk 1' },
  { week: 12, phase: 'NEW BLOCK', sets: '4', reps: '8-12', rpe: '7-8', tempo: '31X1', note: '+10-15 lbs over Wk 4' },
];

const PHASE_BY_WEEK_4 = [
  { week: 1, phase: 'ACCUMULATION', sets: '3', reps: '10-12', rpe: '7', tempo: '20X1', note: 'Build volume' },
  { week: 2, phase: 'HYPERTROPHY', sets: '4', reps: '8-10', rpe: '7-8', tempo: '20X1', note: '+5-10 lbs' },
  { week: 3, phase: 'HYPERTROPHY', sets: '4', reps: '6-8', rpe: '8', tempo: '20X1', note: 'Heavy work' },
  { week: 4, phase: 'DELOAD', sets: '3', reps: '8-10', rpe: '5-6', tempo: '20X1', note: '60% load, recover' },
];

const phaseForWeek = (week, totalWeeks) => {
  if (totalWeeks <= 4) {
    return PHASE_BY_WEEK_4[Math.min(week - 1, 3)] || PHASE_BY_WEEK_4[0];
  }
  if (totalWeeks <= 8) {
    // Compress 12-week into 8 by skipping some weeks
    const idx = Math.min(Math.floor((week - 1) * (12 / totalWeeks)), 11);
    return PHASE_BY_WEEK_12[idx];
  }
  // 10, 12, 16 weeks: scale the 12-week pattern
  const idx = Math.min(Math.floor((week - 1) * (12 / totalWeeks)), 11);
  return PHASE_BY_WEEK_12[idx];
};

const PHASE_COLORS = {
  ACCUMULATION: GREEN,
  HYPERTROPHY: BLUE,
  INTENSIFICATION: '#fbbf24',
  REALIZATION: ORANGE,
  DELOAD: PURPLE,
  'NEW BLOCK': GREEN,
  BASE: BLUE,
  BUILD: '#fbbf24',
  'RACE PREP': ORANGE,
  PEAK: ORANGE,
  TAPER: PURPLE,
  'RP DELOAD': PURPLE,
};

// ============================================================
// EXERCISE PROGRESSION — apply phase to base exercise prescription
// ============================================================
// Heuristic for "compound" exercises that should shift to the phase rep range
// (e.g., Bench, Squat, Deadlift, OHP, Row, Pull-Up). Accessories keep their
// hypertrophy/isolation range but still progress in set count + tempo.
const COMPOUND_KEYWORDS = [
  'bench', 'squat', 'deadlift', 'press', 'row', 'pull-up', 'pullup',
  'chin-up', 'chinup', 'rdl', 'romanian', 'hex bar', 'trap bar',
  'sumo', 'block pull', 'pause', 'spoto', 'pendlay', 'front squat',
  'back squat', 'goblet squat', 'overhead', 'ohp', 'snatch', 'clean',
];

const isCompound = (name) => {
  const n = String(name).toLowerCase();
  return COMPOUND_KEYWORDS.some((k) => n.includes(k));
};

// Add a delta to each end of a "min-max" rep range string, clamped to >=1
const shiftRepRange = (range, delta) => {
  const m = String(range).match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return range;
  const lo = Math.max(1, parseInt(m[1], 10) + delta);
  const hi = Math.max(lo, parseInt(m[2], 10) + delta);
  return `${lo}-${hi}`;
};

// Apply the program phase to a base exercise. Returns a new exercise object.
const progressExercise = (baseEx, week, totalWeeks) => {
  const phase = phaseForWeek(week, totalWeeks);
  const compound = isCompound(baseEx.name);
  const baseSets = parseInt(baseEx.sets, 10) || 3;
  let sets = baseSets;
  let reps = baseEx.reps;
  let tempo = baseEx.tempo;
  let progressionNote = '';

  // Accumulation: build volume by adding sets, keep reps in upper range
  if (phase.phase === 'ACCUMULATION') {
    if (phase.week === 1) {
      sets = baseSets;
      progressionNote = 'Establish baseline';
    } else if (phase.week === 2) {
      sets = baseSets + 1;
      tempo = '21X1';
      progressionNote = '+1 set, same load';
    } else { // wk 3
      sets = baseSets + 1;
      reps = compound ? shiftRepRange(reps, -2) : reps;
      progressionNote = '+5 lbs, drop reps';
    }
  } else if (phase.phase === 'HYPERTROPHY') {
    if (phase.week === 4) {
      sets = baseSets + 1;
      tempo = '31X1';
      progressionNote = 'Eccentric 3s, +5-10 lbs';
    } else if (phase.week === 5) {
      sets = baseSets + 1;
      reps = compound ? shiftRepRange(reps, -2) : reps;
      progressionNote = '+5 lbs';
    } else { // wk 6
      sets = baseSets + 2;
      reps = compound ? shiftRepRange(reps, -2) : reps;
      progressionNote = 'Peak volume';
    }
  } else if (phase.phase === 'INTENSIFICATION') {
    // Compounds shift to heavy 4-6 range; accessories drop to 6-10
    if (compound) {
      reps = '4-6';
      sets = phase.week === 7 ? baseSets : baseSets + 1;
      tempo = '21X0';
      progressionNote = phase.week === 7 ? '+10-15 lbs, 3min rest' : 'Heaviest set';
    } else {
      reps = shiftRepRange(reps, -2);
      sets = baseSets;
      progressionNote = 'Same vol, heavier loads';
    }
  } else if (phase.phase === 'REALIZATION') {
    // Compounds: max load 2-4 reps. Accessories: drop volume, maintain.
    if (compound) {
      reps = '2-4';
      sets = baseSets;
      tempo = '10X0';
      progressionNote = 'Max load, 4min rest';
    } else {
      reps = shiftRepRange(reps, -2);
      sets = Math.max(2, baseSets - 1);
      progressionNote = 'Reduced accessory volume';
    }
  } else if (phase.phase === 'DELOAD' || phase.phase === 'RP DELOAD') {
    // Cut volume by ~40%, RPE drops, light tempo
    sets = Math.max(2, Math.round(baseSets * 0.6));
    if (compound) reps = shiftRepRange(reps, 2); // higher reps, lighter
    tempo = '20X1';
    progressionNote = '60% volume — recover';
  } else if (phase.phase === 'NEW BLOCK') {
    // Restart progression at higher load
    sets = baseSets + (phase.week === 12 ? 1 : 0);
    if (phase.week === 12 && compound) reps = shiftRepRange(reps, -2);
    progressionNote = phase.week === 11 ? 'New block — +10 lbs over Wk 1' : '+10-15 lbs over Wk 4';
  }

  return {
    ...baseEx,
    sets: String(sets),
    reps,
    tempo,
    progressionNote,
    phase: phase.phase,
  };
};

// RP mesocycle math
const rpWeekData = (week, totalWeeks) => {
  // Final week = deload
  if (week >= totalWeeks) {
    return { phase: 'RP DELOAD', rir: '4-5', setMult: 0.5, repRange: '8-10', note: 'Deload — 50% of MEV, RIR 4-5' };
  }
  const accumulationWeeks = totalWeeks - 1;
  // RIR: 3 → 0 across accumulation weeks
  const rir = Math.max(0, 3 - Math.floor((week - 1) / accumulationWeeks * 4));
  // Set multiplier: 1.0 → 1.5
  const setMult = 1.0 + (week - 1) / accumulationWeeks * 0.5;
  // Reps shift
  let repRange;
  if (week <= 2) repRange = '8-12';
  else if (week <= 4) repRange = '6-10';
  else repRange = '5-8';
  return {
    phase: 'RP ACCUMULATION',
    rir: `${rir}`,
    setMult,
    repRange,
    note: `RIR ${rir}, ${(setMult * 100).toFixed(0)}% of MEV target`,
  };
};

// Compute RP target sets per muscle for current week
const rpTargetSets = (muscle, week, totalWeeks) => {
  const lm = RP_LANDMARKS[muscle];
  if (!lm) return 0;
  const { setMult } = rpWeekData(week, totalWeeks);
  if (week >= totalWeeks) return Math.round(lm.MEV * 0.5);
  return Math.round(lm.MEV * setMult);
};

// ============================================================
// CARDIO PROTOCOLS by goal + week
// ============================================================
const cardioProtocol = (goal, week, totalWeeks) => {
  const pct = (week - 1) / Math.max(1, totalWeeks - 1);
  if (goal === 'fatloss') {
    if (pct < 0.25) return { name: 'Zone 2 Steady State', desc: '35 min, HR 130-140 bpm', duration: 35 };
    if (pct < 0.5) return { name: 'Zone 2 + HIIT', desc: '25 min Z2 + 8 rounds 20s/40s', duration: 30 };
    if (pct < 0.75) return { name: 'HIIT + Cool-Down', desc: '10 rounds 30s/90s + 15 min Z2', duration: 30 };
    return { name: 'Zone 2 Deload', desc: '30 min easy', duration: 30 };
  }
  if (goal === 'performance') {
    if (pct < 0.25) return { name: 'Aerobic Base', desc: '30 min at 70% HR', duration: 30 };
    if (pct < 0.5) return { name: 'Tempo Intervals', desc: '4×5 min at 80-85% HR', duration: 30 };
    if (pct < 0.75) return { name: 'VO2 Max Intervals', desc: '6×3 min at 90-95% HR', duration: 30 };
    return { name: 'Recovery Cardio', desc: '25 min easy', duration: 25 };
  }
  // recomp / muscle / default
  if (pct < 0.25) return { name: 'Low-Impact Zone 2', desc: '25 min', duration: 25 };
  if (pct < 0.5) return { name: 'Moderate Zone 2', desc: '30 min', duration: 30 };
  if (pct < 0.75) return { name: 'Zone 2 + Intervals', desc: '20 min Z2 + 4×30s sprints', duration: 25 };
  return { name: 'Recovery Cardio', desc: '20 min easy', duration: 20 };
};

// ============================================================
// CONDITIONING FINISHERS by week
// ============================================================
const conditioningFinisher = (week, totalWeeks) => {
  const pct = (week - 1) / Math.max(1, totalWeeks - 1);
  if (pct < 0.33) return '3 rounds for time: 200m run, 15 KB swings, 10 push-ups';
  if (pct < 0.66) return 'EMOM 10 min: odd = 12 KB swings, even = 10 burpees';
  return 'AMRAP 8 min: 10 wall balls, 10 box jumps, 200m row';
};

// ============================================================
// WARM-UP per day type
// ============================================================
const warmupForDayType = (dayType) => {
  const t = String(dayType).toUpperCase();
  if (t.includes('PUSH') || t.includes('CHEST') || t.includes('SHOULDERS') || t.includes('BENCH'))
    return 'Band Pull-Apart 2×15 · Scapular Push-Up 2×10 · Light Press 2×10';
  if (t.includes('PULL') || t.includes('BACK') || t.includes('DEADLIFT'))
    return 'Dead Hang 2×30s · Band Row 2×15 · Cat-Cow 2×10';
  if (t.includes('LEG') || t.includes('SQUAT') || t.includes('LOWER'))
    return 'Hip Flexor Stretch 2×30s/side · Goblet Squat 2×10 · Glute Bridge 2×15';
  if (t.includes('FULL') || t.includes('UPPER'))
    return 'Thoracic Rotation 2×8/side · World\'s Greatest Stretch 2×5/side · Inchworm 2×6';
  if (t.includes('RUN') || t.includes('Z2') || t.includes('SIM'))
    return '5 min easy jog · Leg Swings · A-Skips 30m · B-Skips 30m';
  if (t.includes('KB'))
    return 'Halo 2×10 · Goblet Squat 2×10 · Hip Hinge 2×10';
  return 'Dynamic stretch · Mobility · Activation 5 min';
};

// ============================================================
// EXERCISES FOR DAY (style + week aware)
// ============================================================
const isAWeek = (week) => week % 2 === 1;

// Returns 0-indexed occurrence of dayType within schedule up to and including dayIdx.
// E.g., schedule = [PUSH, PULL, REST, PUSH, PULL, REST, REST]
//   dayIdx=0 (PUSH) → 0 (1st PUSH)
//   dayIdx=3 (PUSH) → 1 (2nd PUSH)
const occurrenceInWeek = (schedule, dayIdx, dayType) => {
  if (!Array.isArray(schedule)) return 0;
  let count = 0;
  for (let i = 0; i <= dayIdx && i < schedule.length; i++) {
    if (schedule[i] === dayType) {
      if (i === dayIdx) return count;
      count++;
    }
  }
  return 0;
};

// Pick A/B variant for a session.
// Within-week 1st occurrence = A, 2nd = B, 3rd = A, etc.
// On weeks where the muscle is only trained once (occurrence always 0),
// alternates A/B by week parity for cross-week variation.
// schedule + dayIdx + dayType together determine occurrence; week handles parity.
const variantFor = (schedule, dayIdx, dayType, week) => {
  const occ = occurrenceInWeek(schedule, dayIdx, dayType);
  // Total occurrences in week
  const total = (schedule || []).filter((d) => d === dayType).length;
  if (total <= 1) {
    // Only trained once this week — alternate by week parity
    return isAWeek(week) ? 'A' : 'B';
  }
  // Multiple times this week — alternate within week
  return occ % 2 === 0 ? 'A' : 'B';
};

const getExercisesForDay = (style, dayType, week, totalWeeks, schedule, dayIdx) => {
  const t = String(dayType).toUpperCase();
  // Rest day
  if (t === 'REST') return null;
  // Progresses base exercises through the program phase
  const progress = (exercises) => exercises.map((ex) => progressExercise(ex, week, totalWeeks));

  // RP Hypertrophy — by muscle landmarks
  if (style === 'rp_hyp') {
    if (t === 'CARDIO') {
      const c = cardioProtocol('recomp', week, totalWeeks);
      return { exercises: [{ name: c.name, sets: '1', reps: c.desc, tempo: '-', note: '' }], finisher: null };
    }
    const muscleMap = {
      PUSH: ['Chest', 'Shoulders', 'Triceps'],
      PULL: ['Back', 'Biceps'],
      LEGS: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
      UPPER: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'],
      LOWER: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
      FULL: ['Chest', 'Back', 'Quads', 'Hamstrings'],
    };
    const muscles = muscleMap[t] || [];
    const wd = rpWeekData(week, totalWeeks);
    // Pick A/B variant for THIS session based on occurrence of this day-type
    const variant = variantFor(schedule, dayIdx, dayType, week);
    // How many sessions per week train this muscle? Count days in schedule whose
    // muscle map intersects this muscle.
    const sessionsPerMuscle = (m) => {
      if (!Array.isArray(schedule)) return 1;
      return schedule.filter((d) => {
        const muscles2 = muscleMap[String(d).toUpperCase()] || [];
        return muscles2.includes(m);
      }).length || 1;
    };
    const exes = [];
    muscles.forEach((m) => {
      const pool = (RP_EXERCISES[m] && RP_EXERCISES[m][variant]) || [];
      const targetWeekly = rpTargetSets(m, week, totalWeeks);
      const sessions = sessionsPerMuscle(m);
      const setsPerSession = Math.max(2, Math.round(targetWeekly / sessions / Math.max(1, pool.length)));
      pool.forEach((ex) => {
        exes.push({
          name: ex,
          muscle: m,
          sets: String(setsPerSession),
          reps: wd.repRange,
          tempo: '20X1',
          note: `${m} (${variant}) — MEV ${RP_LANDMARKS[m].MEV} / MAV ${RP_LANDMARKS[m].MAV} / MRV ${RP_LANDMARKS[m].MRV} sets/wk · RIR ${wd.rir}`,
        });
      });
    });
    return { exercises: exes, finisher: null, isRP: true, wd, variant };
  }

  // HYROX
  if (style === 'hyrox') {
    const phase = hyroxPhase(week, totalWeeks);
    const intervals = HYROX_INTERVALS_BY_PHASE[phase.name] || HYROX_INTERVALS_BY_PHASE.BASE;
    if (t === 'STRENGTH_LOWER') {
      const compounds = progress([
        { name: 'Back Squat', sets: '4', reps: '5-8', tempo: '20X1', note: 'Heavy primary' },
        { name: 'Romanian Deadlift', sets: '3', reps: '8-10', tempo: '31X0', note: 'Hamstring strength' },
        { name: 'Walking Lunge', sets: '3', reps: '10/leg', tempo: '20X1', note: 'Race transfer' },
      ]);
      return {
        exercises: [
          ...compounds,
          { name: 'Sled Push (50m)', sets: '4', reps: 'race weight', tempo: '-', note: HYROX_STATIONS[1].note },
          { name: 'Farmer Carry (200m)', sets: '3', reps: '24kg/16kg KB ea', tempo: '-', note: HYROX_STATIONS[5].note },
        ],
        finisher: '1km run for time',
        phase,
      };
    }
    if (t === 'STRENGTH_UPPER') {
      const compounds = progress([
        { name: 'Pull-Up', sets: '4', reps: '6-10', tempo: '20X1', note: 'Strict' },
        { name: 'Overhead Press', sets: '4', reps: '5-8', tempo: '20X1', note: 'Heavy primary' },
        { name: 'Pendlay Row', sets: '3', reps: '6-8', tempo: '20X1', note: 'Explosive' },
      ]);
      return {
        exercises: [
          ...compounds,
          { name: 'SkiErg (1000m)', sets: '3', reps: 'race effort', tempo: '-', note: HYROX_STATIONS[0].note },
          { name: 'Wall Balls', sets: '3', reps: '20-25', tempo: '-', note: HYROX_STATIONS[7].note },
          { name: 'Burpee Broad Jumps', sets: '3', reps: '15', tempo: '-', note: HYROX_STATIONS[3].note },
        ],
        finisher: '500m row for time',
        phase,
      };
    }
    if (t === 'RUN_INTERVALS') {
      return {
        exercises: [
          { name: 'Run Intervals', sets: '1', reps: intervals.run, tempo: '-', note: intervals.rest },
          { name: 'Erg Intervals', sets: '1', reps: intervals.erg, tempo: '-', note: intervals.rest },
        ],
        finisher: null,
        phase,
      };
    }
    if (t === 'Z2_RUN') {
      return {
        exercises: [
          { name: 'Z2 Long Run', sets: '1', reps: '45-60 min', tempo: '-', note: 'HR 130-150, conversational pace' },
        ],
        finisher: null,
        phase,
      };
    }
    if (t === 'RACE_SIM') {
      const simMap = {
        BASE: '4 rounds: 500m run + 2 stations',
        BUILD: 'Half HYROX: 4 stations with 500m runs',
        'RACE PREP': 'Full 8-station race simulation, timed',
        TAPER: 'Light: 2 stations + 500m run only',
      };
      return {
        exercises: [
          { name: 'Race Simulation', sets: '1', reps: simMap[phase.name] || simMap.BASE, tempo: '-', note: 'Log race time below' },
        ],
        finisher: null,
        phase,
        isRaceSim: true,
      };
    }
    if (t === 'CARDIO') {
      const c = cardioProtocol('performance', week, totalWeeks);
      return { exercises: [{ name: c.name, sets: '1', reps: c.desc, tempo: '-', note: 'Recovery quality' }], finisher: null, phase };
    }
  }

  // HYROX Hybrid
  if (style === 'hyrox_hybrid') {
    const phase = hyroxPhase(week, totalWeeks);
    if (t === 'STRENGTH_LOWER') {
      const compounds = progress([
        { name: 'Back Squat', sets: '4', reps: '5-8', tempo: '20X1', note: 'Heavy primary' },
        { name: 'Trap Bar Deadlift', sets: '3', reps: '5-8', tempo: '20X1', note: 'Hips down, chest up' },
        { name: 'Bulgarian Split Squat', sets: '3', reps: '8/leg', tempo: '20X1', note: 'Quad focus' },
        { name: 'Single-Leg RDL', sets: '3', reps: '8/leg', tempo: '21X1', note: 'Balance + posterior' },
      ]);
      return {
        exercises: [
          ...compounds,
          { name: 'KB Goblet Squat', sets: '3', reps: '10', tempo: '20X1', note: `${KB_SIZING.standard.m}/${KB_SIZING.standard.w}` },
          { name: 'Sled Push (50m)', sets: '3', reps: 'race weight', tempo: '-', note: 'Race transfer' },
          { name: 'Heavy Farmer Carry (200m)', sets: '2', reps: 'heavy', tempo: '-', note: 'Grip + core' },
        ],
        finisher: 'EMOM 8: 12 KB swings (heavy)',
        phase,
      };
    }
    if (t === 'KB_RUN') {
      return {
        exercises: [
          { name: 'KB Complex (Clean+Press+Squat)', sets: '4', reps: '5/side', tempo: '20X1', note: `${KB_SIZING.standard.m}/${KB_SIZING.standard.w} per round` },
          { name: 'KB Snatch Test', sets: '1', reps: '5 min max reps', tempo: '-', note: '10/min target pace' },
          { name: 'Turkish Get-Up', sets: '3', reps: '3/side', tempo: '-', note: 'Slow, controlled' },
          { name: 'Run Intervals', sets: '1', reps: '5 × 400m at 5K pace', tempo: '-', note: '90s rest' },
        ],
        finisher: `EMOM 8: heavy KB swings (${KB_SIZING.heavy.m}/${KB_SIZING.heavy.w}) + burpees`,
        phase,
      };
    }
    if (t === 'STRENGTH_UPPER') {
      const compounds = progress([
        { name: 'Weighted Pull-Up', sets: '4', reps: '5-8', tempo: '20X1', note: 'Add weight, full ROM' },
        { name: 'Overhead Press', sets: '4', reps: '5-8', tempo: '20X1', note: 'Heavy primary' },
        { name: 'Pendlay Row', sets: '3', reps: '6-8', tempo: '20X1', note: 'Explosive pull' },
      ]);
      return {
        exercises: [
          ...compounds,
          { name: 'KB Push Press', sets: '3', reps: '8/side', tempo: '20X1', note: `Use leg drive` },
          { name: 'Renegade Row', sets: '3', reps: '8/side', tempo: '-', note: 'Plank stable' },
          { name: 'Wall Balls', sets: '3', reps: '20-25', tempo: '-', note: 'Race standards' },
          { name: 'Burpee Broad Jumps', sets: '3', reps: '15', tempo: '-', note: 'Pace yourself' },
          { name: 'Sandbag Front-Rack Lunge', sets: '3', reps: '20m', tempo: '-', note: 'Race standard weight' },
        ],
        finisher: '500m SkiErg for time',
        phase,
      };
    }
    if (t === 'Z2_RUN') {
      return {
        exercises: [
          { name: 'Z2 Long Run', sets: '1', reps: '45-60 min', tempo: '-', note: 'HR 130-150' },
          { name: 'KB Get-Ups', sets: '3', reps: '3/side', tempo: '-', note: 'After run' },
          { name: 'Wall Ball Technique', sets: '3', reps: '20', tempo: '-', note: 'Form work, light' },
        ],
        finisher: null,
        phase,
      };
    }
    if (t === 'RACE_SIM') {
      const simMap = {
        BASE: '4-round circuit (KB-flavored)',
        BUILD: 'Half HYROX with KB substitutions',
        'RACE PREP': 'Full HYROX race simulation',
        TAPER: 'Light technique work',
      };
      return {
        exercises: [{ name: 'Race Simulation', sets: '1', reps: simMap[phase.name] || simMap.BASE, tempo: '-', note: 'Log race time below' }],
        finisher: null,
        phase,
        isRaceSim: true,
      };
    }
    if (t === 'CARDIO') {
      const c = cardioProtocol('performance', week, totalWeeks);
      return { exercises: [{ name: c.name, sets: '1', reps: c.desc, tempo: '-', note: '' }], finisher: null, phase };
    }
  }

  // Powerlifting
  if (style === 'powerlifting') {
    if (PL_EXERCISES[t]) {
      const variant = variantFor(schedule, dayIdx, dayType, week);
      const base = PL_EXERCISES[t][variant] || PL_EXERCISES[t].A;
      return {
        exercises: progress(base),
        finisher: null,
        variant,
      };
    }
    if (t === 'CARDIO') {
      const c = cardioProtocol('performance', week, totalWeeks);
      return { exercises: [{ name: c.name, sets: '1', reps: c.desc, tempo: '-', note: '' }], finisher: null };
    }
  }

  // CrossFit
  if (style === 'crossfit') {
    const wodMap = {
      WOD: [
        { name: 'CrossFit WOD', sets: '1', reps: 'AMRAP 20: 5 pull-ups, 10 push-ups, 15 air squats', tempo: '-', note: 'Cindy benchmark' },
      ],
      STRENGTH: [
        { name: 'Back Squat', sets: '5', reps: '5', tempo: '20X1', note: 'Heavy primary' },
        { name: 'Bench Press', sets: '5', reps: '5', tempo: '20X1', note: 'Heavy secondary' },
        { name: 'Strength WOD', sets: '1', reps: '10 min EMOM: 3 deadlifts (heavy)', tempo: '-', note: 'Build strength' },
      ],
      OLY: [
        { name: 'Snatch', sets: '6', reps: '2', tempo: '-', note: 'Build to working set' },
        { name: 'Clean & Jerk', sets: '6', reps: '2', tempo: '-', note: 'Build to working set' },
        { name: 'Front Squat', sets: '4', reps: '5', tempo: '20X1', note: 'Olympic accessory' },
      ],
      GYMNASTICS: [
        { name: 'Pull-Ups', sets: '5', reps: 'max strict', tempo: '-', note: 'Build to muscle-up' },
        { name: 'Handstand Push-Up', sets: '5', reps: '5', tempo: '-', note: 'Wall-supported' },
        { name: 'Toes-to-Bar', sets: '5', reps: '10', tempo: '-', note: 'Kipping or strict' },
        { name: 'Ring Dips', sets: '4', reps: '8', tempo: '-', note: 'Strict if possible' },
      ],
    };
    if (wodMap[t]) {
      // Only progress STRENGTH (heavy lifts). WOD/OLY/GYMNASTICS have own scheme.
      const exes = t === 'STRENGTH' ? progress(wodMap[t]) : wodMap[t];
      return { exercises: exes, finisher: t === 'STRENGTH' ? null : conditioningFinisher(week, totalWeeks) };
    }
  }

  // Athletic
  if (style === 'athletic') {
    const athMap = {
      SPEED: [
        { name: 'A-Skips', sets: '4', reps: '20m', tempo: '-', note: 'Knee drive, posture' },
        { name: 'Sprint', sets: '6', reps: '40m', tempo: '-', note: 'Full recovery between' },
        { name: 'Lateral Bound', sets: '4', reps: '6/side', tempo: '-', note: 'Stick the landing' },
        { name: 'Box Jump', sets: '4', reps: '5', tempo: '-', note: 'Step down, full reset' },
      ],
      POWER: [
        { name: 'Power Clean', sets: '5', reps: '3', tempo: '-', note: 'Explosive triple ext.' },
        { name: 'Box Jump', sets: '5', reps: '5', tempo: '-', note: 'Land soft' },
        { name: 'Med Ball Slam', sets: '4', reps: '8', tempo: '-', note: 'Full force' },
        { name: 'Broad Jump', sets: '4', reps: '5', tempo: '-', note: 'Stick landing' },
      ],
      STRENGTH: [
        { name: 'Back Squat', sets: '5', reps: '5', tempo: '20X1', note: 'Heavy primary' },
        { name: 'Bench Press', sets: '4', reps: '6-8', tempo: '20X1', note: 'Upper body' },
        { name: 'Trap Bar DL', sets: '4', reps: '5', tempo: '20X1', note: 'Posterior chain' },
        { name: 'Pull-Up', sets: '4', reps: '6-10', tempo: '20X1', note: 'Pulling strength' },
      ],
      CONDITIONING: [
        { name: 'Sled Push', sets: '6', reps: '20m heavy', tempo: '-', note: 'Drive through legs' },
        { name: 'Battle Ropes', sets: '5', reps: '30s on/30s off', tempo: '-', note: 'Aggressive' },
        { name: 'Run Intervals', sets: '1', reps: '6×400m at 5K pace', tempo: '-', note: '90s rest' },
      ],
    };
    if (athMap[t]) {
      // Only progress STRENGTH; SPEED/POWER/CONDITIONING use fixed neural-quality protocols
      const exes = t === 'STRENGTH' ? progress(athMap[t]) : athMap[t];
      return { exercises: exes, finisher: t === 'CONDITIONING' ? null : conditioningFinisher(week, totalWeeks) };
    }
    if (t === 'CARDIO') {
      const c = cardioProtocol('performance', week, totalWeeks);
      return { exercises: [{ name: c.name, sets: '1', reps: c.desc, tempo: '-', note: '' }], finisher: null };
    }
  }

  // HIIT
  if (style === 'hiit') {
    const hiitMap = {
      HIIT: [
        { name: 'HIIT Circuit', sets: '5', reps: '40s on / 20s off', tempo: '-', note: 'Burpees / KB swings / Jump squats / Mountain climbers' },
      ],
      STRENGTH: [
        { name: 'Goblet Squat', sets: '3', reps: '12', tempo: '20X1', note: 'Form first' },
        { name: 'Push-Up', sets: '3', reps: 'AMRAP', tempo: '20X1', note: 'Quality reps' },
        { name: 'Bent-Over Row', sets: '3', reps: '10', tempo: '20X1', note: 'Squeeze scaps' },
        { name: 'Plank', sets: '3', reps: '45s', tempo: '-', note: 'Brace' },
      ],
      FULL: AB_EXERCISES.FULL[variantFor(schedule, dayIdx, dayType, week)],
    };
    if (hiitMap[t]) {
      // STRENGTH and FULL get progression, HIIT itself stays fixed (interval scheme is the work)
      const exes = (t === 'STRENGTH' || t === 'FULL') ? progress(hiitMap[t]) : hiitMap[t];
      return { exercises: exes, finisher: t === 'HIIT' ? null : conditioningFinisher(week, totalWeeks) };
    }
  }

  // Traditional BB — body part split with A/B variants per body part
  if (style === 'trad_bb') {
    if (TRADBB_EXERCISES[t]) {
      const variant = variantFor(schedule, dayIdx, dayType, week);
      const base = TRADBB_EXERCISES[t][variant] || TRADBB_EXERCISES[t].A;
      return { exercises: progress(base), finisher: null, variant };
    }
    if (t === 'LEGS') {
      const variant = variantFor(schedule, dayIdx, dayType, week);
      return { exercises: progress(AB_EXERCISES.LEGS[variant]), finisher: null, variant };
    }
    // PUSH/PULL fallback to AB
    if (AB_EXERCISES[t]) {
      const variant = variantFor(schedule, dayIdx, dayType, week);
      return { exercises: progress(AB_EXERCISES[t][variant]), finisher: null, variant };
    }
    if (t === 'CARDIO') {
      const c = cardioProtocol('fatloss', week, totalWeeks);
      return { exercises: [{ name: c.name, sets: '1', reps: c.desc, tempo: '-', note: '' }], finisher: null };
    }
  }

  // Functional BB and default — A/B variation by occurrence (and week parity for 1×/wk)
  if (AB_EXERCISES[t]) {
    const variant = variantFor(schedule, dayIdx, dayType, week);
    const exes = progress(AB_EXERCISES[t][variant]);
    // Mark supersets for func_bb (A1/A2 = ex 0+1, B1/B2 = ex 2+3, C1/C2 = ex 4+5)
    if (style === 'func_bb') {
      const tagged = exes.map((e, i) => {
        let label = '';
        if (i === 0) label = 'A1';
        else if (i === 1) label = 'A2';
        else if (i === 2) label = 'B1';
        else if (i === 3) label = 'B2';
        else if (i === 4) label = 'C1';
        else if (i === 5) label = 'C2';
        return { ...e, ssLabel: label };
      });
      return { exercises: tagged, finisher: conditioningFinisher(week, totalWeeks), variant, isSuperset: true };
    }
    return { exercises: exes, finisher: conditioningFinisher(week, totalWeeks), variant };
  }

  if (t === 'CARDIO') {
    const c = cardioProtocol('recomp', week, totalWeeks);
    return { exercises: [{ name: c.name, sets: '1', reps: c.desc, tempo: '-', note: '' }], finisher: null };
  }

  return { exercises: [], finisher: null };
};

// ============================================================
// SCHEDULE / DAY RESOLUTION
// ============================================================
const getDayIdx = (iso) => {
  const d = isoToDate(iso);
  const jsDay = d.getDay(); // 0=Sun
  return jsDay === 0 ? 6 : jsDay - 1; // 0=Mon ... 6=Sun
};

// Get the Monday of the week containing this date (as ISO)
const getWeekStartISO = (iso) => {
  const d = isoToDate(iso);
  const offset = getDayIdx(iso);
  d.setDate(d.getDate() - offset);
  return dateToISO(d);
};

// Compute week number relative to program start
const getProgramWeek = (iso, startISO, totalWeeks) => {
  if (!startISO) return 1;
  const start = isoToDate(startISO);
  const d = isoToDate(iso);
  const diff = Math.floor((d - start) / 86400000);
  const wk = Math.floor(diff / 7) + 1;
  return Math.max(1, Math.min(wk, totalWeeks));
};

const getDayTypeForDate = (profile, iso) => {
  // Check overrides
  const programWeek = getProgramWeek(iso, profile.startDate, profile.weeks);
  const overrides = profile.weekOverrides && profile.weekOverrides[`w${programWeek}`];
  const dayIdx = getDayIdx(iso);
  if (overrides && overrides[dayIdx]) {
    return { type: overrides[dayIdx], overridden: true };
  }
  // Default schedule
  if (profile.schedule && profile.schedule[dayIdx]) {
    return { type: profile.schedule[dayIdx], overridden: false };
  }
  return { type: 'REST', overridden: false };
};

// Validate schedule against allowed types for a style
const validateSchedule = (schedule, style) => {
  const allowed = DAY_TYPES_BY_STYLE[style] || DAY_TYPES_BY_STYLE.func_bb;
  return schedule.every((d) => allowed.includes(d));
};

const defaultScheduleForStyle = (style) => {
  const presets = SPLIT_PRESETS[style];
  if (presets && presets.length) return [...presets[0].days];
  return ['REST', 'REST', 'REST', 'REST', 'REST', 'REST', 'REST'];
};

// ============================================================
// SESSION KEY HELPERS
// ============================================================
const sessionKey = (iso) => `s_${iso}`;
const setKey = (exName, setIdx) => `${exName}__${setIdx}`;

// Find previous logged session for an exercise (across ALL sessions, excludes current date)
const findPreviousLog = (sessions, exName, currentISO) => {
  const all = Object.entries(sessions || {})
    .filter(([k, s]) => s && s.iso !== currentISO && s.setLogs)
    .sort((a, b) => (a[1].iso < b[1].iso ? 1 : -1)); // newest first
  for (const [k, s] of all) {
    const matching = Object.entries(s.setLogs)
      .filter(([sk, sv]) => sk.startsWith(`${exName}__`) && sv && sv.weight && sv.reps)
      .map(([sk, sv]) => ({ ...sv, idx: parseInt(sk.split('__')[1] || '0', 10) }));
    if (matching.length > 0) {
      const weights = matching.map((m) => +m.weight).filter(Boolean);
      const reps = matching.map((m) => +m.reps).filter(Boolean);
      const completedAll = matching.every((m) => m.done);
      return {
        date: s.iso,
        avgWeight: weights.reduce((a, b) => a + b, 0) / weights.length,
        avgReps: reps.reduce((a, b) => a + b, 0) / reps.length,
        maxReps: Math.max(...reps),
        minReps: Math.min(...reps),
        setCount: matching.length,
        completedAll,
      };
    }
  }
  return null;
};

// ============================================================
// AUTOREGULATION — smart suggestion engine
// ============================================================
const suggestNextSet = (prev, repRange, goal, rpFeedback) => {
  if (!prev) return { weight: null, arrow: '→', color: TEXT_DIM, note: 'No previous data — start light, find working weight' };
  const [minR, maxR] = (repRange.match(/\d+/g) || ['8', '12']).slice(0, 2).map(Number);
  const midR = (minR + maxR) / 2;
  const goalAggressive = goal === 'muscle';
  const goalCutting = goal === 'fatloss';

  // RP feedback overrides
  if (rpFeedback) {
    const high = (rpFeedback.workload || 0) >= 4 || (rpFeedback.soreness || 0) >= 4;
    const low = (rpFeedback.workload || 0) <= 1 && (rpFeedback.soreness || 0) <= 1 && (rpFeedback.pump || 0) <= 2;
    if (high) {
      return {
        weight: Math.max(0, prev.avgWeight - 5),
        arrow: '↓',
        color: RED,
        note: `-5 lbs — high workload/soreness · last: ${prev.avgWeight}lbs × ${Math.round(prev.avgReps)}reps`,
      };
    }
    if (low) {
      return {
        weight: Math.round((prev.avgWeight + 7.5) * 2) / 2,
        arrow: '↑',
        color: GREEN,
        note: `+7.5 lbs — low fatigue, push harder · last: ${prev.avgWeight}lbs × ${Math.round(prev.avgReps)}reps`,
      };
    }
  }

  // Performance categories
  const hitTopOfRange = prev.minReps >= maxR;
  const exceededRange = prev.maxReps > maxR;
  const hitRange = prev.avgReps >= minR && prev.avgReps <= maxR;
  const missedReps = prev.avgReps < minR;
  const inMidRange = prev.avgReps >= midR;

  let weight = prev.avgWeight;
  let arrow = '→';
  let color = '#fbbf24';
  let note = '';

  if (exceededRange && goalAggressive) {
    weight = prev.avgWeight + 10;
    arrow = '↑';
    color = GREEN;
    note = `+10 lbs — exceeded range (${prev.maxReps}+ reps) · last: ${prev.avgWeight}lbs × ${Math.round(prev.avgReps)}reps`;
  } else if (hitTopOfRange) {
    weight = prev.avgWeight + 5;
    arrow = '↑';
    color = GREEN;
    note = `+5 lbs — hit top of range (${maxR}+ on all sets) · last: ${prev.avgWeight}lbs × ${Math.round(prev.avgReps)}reps`;
  } else if (hitRange) {
    if (goalCutting && !inMidRange) {
      weight = prev.avgWeight;
      arrow = '→';
      color = '#fbbf24';
      note = `Hold — cutting, in range · last: ${prev.avgWeight}lbs × ${Math.round(prev.avgReps)}reps`;
    } else if (goalAggressive) {
      weight = prev.avgWeight + 2.5;
      arrow = '↑';
      color = GREEN;
      note = `+2.5 lbs — bulking, in range · last: ${prev.avgWeight}lbs × ${Math.round(prev.avgReps)}reps`;
    } else if (inMidRange) {
      weight = prev.avgWeight + 2.5;
      arrow = '↑';
      color = GREEN;
      note = `+2.5 lbs — past midpoint · last: ${prev.avgWeight}lbs × ${Math.round(prev.avgReps)}reps`;
    } else {
      weight = prev.avgWeight;
      arrow = '→';
      color = '#fbbf24';
      note = `Hold — earn the jump · last: ${prev.avgWeight}lbs × ${Math.round(prev.avgReps)}reps`;
    }
  } else if (missedReps) {
    if (prev.avgReps < minR - 2) {
      weight = Math.max(0, prev.avgWeight - 5);
      arrow = '↓';
      color = RED;
      note = `-5 lbs — missed reps badly · last: ${prev.avgWeight}lbs × ${Math.round(prev.avgReps)}reps`;
    } else {
      weight = prev.avgWeight;
      arrow = '→';
      color = '#fbbf24';
      note = `Hold — try again · last: ${prev.avgWeight}lbs × ${Math.round(prev.avgReps)}reps`;
    }
  }

  weight = Math.round(weight * 2) / 2; // round to 0.5

  return { weight, arrow, color, note };
};

// ============================================================
// PR DETECTION
// ============================================================
const checkRunPR = (run, allRuns) => {
  const newPRs = [];
  const distMi = run.distMi;
  const sec = run.totalSec;
  if (!distMi || !sec) return newPRs;
  for (const pd of PR_DISTANCES) {
    if (Math.abs(distMi - pd.miles) / pd.miles <= pd.tol) {
      // This run qualifies as this distance
      const previous = (allRuns || [])
        .filter((r) => r.id !== run.id)
        .filter((r) => Math.abs((r.distMi || 0) - pd.miles) / pd.miles <= pd.tol)
        .map((r) => r.totalSec)
        .filter((t) => t > 0);
      if (previous.length === 0 || sec < Math.min(...previous)) {
        newPRs.push(pd.id);
      }
    }
  }
  return newPRs;
};

// ============================================================
// STATE — defaults, persistence
// ============================================================
const defaultProfile = () => ({
  name: '',
  age: 30,
  sex: 'male',
  height: '5ft 9in',
  weight: 180,
  target: 175,
  goal: 'recomp',
  activity: 'moderate',
  weeks: 12,
  experience: 'intermediate',
  equipment: 'gym',
  workoutStyle: 'func_bb',
  schedule: defaultScheduleForStyle('func_bb'),
  weekOverrides: {},
  startDate: todayISO(),
  raceDate: '',
  raceDivision: 'Open M',
  setupComplete: false,
  summaryAcknowledged: false,
});

const defaultState = () => ({
  schemaVersion: SCHEMA_VERSION,
  profile: defaultProfile(),
  week: 1,
  wlog: [], // [{date, weight}]
  food: {}, // { iso: [{name, cal, p, c, f, qty}] }
  jlog: [], // [{date, mood, notes}]
  sessions: {}, // { s_iso: { iso, dayType, exercises, setLogs, feedback, done, skipped, notes, raceTime, completedAt } }
  runs: [], // [{id, date, type, distMi, distKm, totalSec, paceSec, hr, elev, route, notes}]
  conv: [], // ai coach conversation
});

const loadState = async () => {
  try {
    if (typeof window === 'undefined' || !window.storage) return defaultState();
    const result = await window.storage.get(STORAGE_KEY);
    if (!result || !result.value) return defaultState();
    let parsed;
    try {
      parsed = JSON.parse(result.value);
    } catch {
      return defaultState();
    }
    // Migrate / validate
    const def = defaultState();
    const merged = { ...def, ...parsed };
    merged.profile = { ...def.profile, ...(parsed.profile || {}) };
    if (!Array.isArray(merged.profile.schedule) || merged.profile.schedule.length !== 7) {
      merged.profile.schedule = defaultScheduleForStyle(merged.profile.workoutStyle);
    }
    if (!validateSchedule(merged.profile.schedule, merged.profile.workoutStyle)) {
      merged.profile.schedule = defaultScheduleForStyle(merged.profile.workoutStyle);
    }
    if (!merged.profile.weekOverrides || typeof merged.profile.weekOverrides !== 'object') {
      merged.profile.weekOverrides = {};
    }
    if (!Array.isArray(merged.wlog)) merged.wlog = [];
    if (!Array.isArray(merged.jlog)) merged.jlog = [];
    if (!Array.isArray(merged.runs)) merged.runs = [];
    if (!Array.isArray(merged.conv)) merged.conv = [];
    if (!merged.food || typeof merged.food !== 'object') merged.food = {};
    if (!merged.sessions || typeof merged.sessions !== 'object') merged.sessions = {};
    if (!merged.profile.weeks) merged.profile.weeks = 12;
    if (!merged.profile.workoutStyle) merged.profile.workoutStyle = 'func_bb';
    if (!merged.profile.startDate) merged.profile.startDate = todayISO();
    if (!merged.week) merged.week = 1;
    return merged;
  } catch (e) {
    console.error('loadState', e);
    return defaultState();
  }
};

const saveState = async (s) => {
  try {
    if (typeof window === 'undefined' || !window.storage) return;
    await window.storage.set(STORAGE_KEY, JSON.stringify(s));
  } catch (e) {
    console.error('saveState', e);
  }
};

// ============================================================
// ERROR BOUNDARY
// ============================================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('App crashed:', error, info);
  }
  reset = () => this.setState({ error: null });
  resetData = async () => {
    try {
      if (window.storage) await window.storage.delete(STORAGE_KEY);
      if (typeof localStorage !== 'undefined') localStorage.clear();
    } catch (e) {}
    if (typeof window !== 'undefined') window.location.reload();
  };
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', background: BG, color: '#fff', padding: 20, fontFamily: 'Helvetica, Arial, sans-serif' }}>
          <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 32, color: ACCENT, letterSpacing: 1.5, marginBottom: 12 }}>SOMETHING BROKE</div>
            <div style={{ color: TEXT_DIM, marginBottom: 20 }}>The app hit an error. Your data should still be safe.</div>
            <pre style={{ background: '#1a0000', border: `1px solid ${RED}`, color: '#fca5a5', padding: 12, borderRadius: 6, fontSize: 11, textAlign: 'left', overflowX: 'auto', fontFamily: 'monospace' }}>
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={this.reset} style={{ background: ACCENT, color: '#000', border: 'none', padding: '12px 20px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1, fontSize: 14 }}>TRY AGAIN</button>
              <button onClick={this.resetData} style={{ background: 'transparent', color: RED, border: `1px solid ${RED}`, padding: '12px 20px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1, fontSize: 14 }}>RESET ALL DATA & RELOAD</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================
// UI PRIMITIVES
// ============================================================
const H = ({ children, size = 16, color = '#fff', mb = 8, style = {} }) => (
  <div style={{
    fontFamily: 'Impact, Arial Black, sans-serif',
    fontSize: size,
    color,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: mb,
    ...style,
  }}>{children}</div>
);

const Btn = ({ children, onClick, variant = 'primary', size = 'md', disabled, style = {}, type = 'button' }) => {
  const sizes = {
    sm: { padding: '6px 10px', fontSize: 11 },
    md: { padding: '10px 14px', fontSize: 13 },
    lg: { padding: '14px 20px', fontSize: 15 },
  };
  const variants = {
    primary: { background: ACCENT, color: '#000', border: 'none' },
    ghost: { background: 'transparent', color: '#fff', border: `1px solid ${BORDER}` },
    danger: { background: 'transparent', color: RED, border: `1px solid ${RED}` },
    orange: { background: ORANGE, color: '#000', border: 'none' },
    accent2: { background: 'transparent', color: ACCENT, border: `1px solid ${ACCENT}` },
    dark: { background: CARD2, color: '#fff', border: `1px solid ${BORDER}` },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...sizes[size],
        ...variants[variant],
        borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'Impact, Arial Black, sans-serif',
        letterSpacing: 1,
        fontWeight: 700,
        textTransform: 'uppercase',
        boxSizing: 'border-box',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >{children}</button>
  );
};

const Card = ({ children, style = {} }) => (
  <div style={{
    background: CARD,
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    padding: 14,
    boxSizing: 'border-box',
    ...style,
  }}>{children}</div>
);

const Input = (props) => (
  <input
    {...props}
    style={{
      background: CARD2,
      border: `1px solid ${BORDER}`,
      borderRadius: 6,
      color: '#fff',
      padding: '9px 11px',
      fontSize: 14,
      width: '100%',
      boxSizing: 'border-box',
      fontFamily: 'Helvetica, Arial, sans-serif',
      outline: 'none',
      ...(props.style || {}),
    }}
  />
);

const Select = (props) => (
  <select
    {...props}
    style={{
      background: CARD2,
      border: `1px solid ${BORDER}`,
      borderRadius: 6,
      color: '#fff',
      padding: '9px 11px',
      fontSize: 13,
      width: '100%',
      boxSizing: 'border-box',
      fontFamily: 'Helvetica, Arial, sans-serif',
      outline: 'none',
      appearance: 'none',
      backgroundImage: `linear-gradient(45deg, transparent 50%, ${TEXT_DIM} 50%), linear-gradient(135deg, ${TEXT_DIM} 50%, transparent 50%)`,
      backgroundPosition: 'calc(100% - 14px) calc(50% - 2px), calc(100% - 9px) calc(50% - 2px)',
      backgroundSize: '5px 5px, 5px 5px',
      backgroundRepeat: 'no-repeat',
      paddingRight: 28,
      ...(props.style || {}),
    }}
  />
);

const Label = ({ children, style = {} }) => (
  <div style={{
    fontSize: 10,
    color: TEXT_MUTED,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
    fontFamily: 'Impact, Arial Black, sans-serif',
    ...style,
  }}>{children}</div>
);

const ProgressBar = ({ value, max, color = ACCENT, height = 4, bg = CARD2 }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ background: bg, borderRadius: height / 2, height, overflow: 'hidden', width: '100%' }}>
      <div style={{ background: color, height: '100%', width: `${pct}%`, transition: 'width .3s' }} />
    </div>
  );
};

const Pill = ({ children, color = ACCENT, bg }) => (
  <span style={{
    display: 'inline-block',
    background: bg || `${color}22`,
    color,
    padding: '3px 9px',
    borderRadius: 999,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: 'Impact, Arial Black, sans-serif',
  }}>{children}</span>
);

// ============================================================
// GLOBAL CSS (animations + scrollbar)
// ============================================================
const GlobalStyles = () => (
  <style>{`
    @keyframes recomp-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: .55; transform: scale(.97); }
    }
    @keyframes recomp-stripe {
      0%, 100% { opacity: .4; }
      50% { opacity: 1; }
    }
    @keyframes recomp-glow {
      0%, 100% { filter: brightness(1); }
      50% { filter: brightness(1.4); }
    }
    @keyframes recomp-blink {
      0%, 80%, 100% { transform: scale(0.6); opacity: .4; }
      40% { transform: scale(1); opacity: 1; }
    }
    .recomp-app * { box-sizing: border-box; }
    .recomp-app ::-webkit-scrollbar { width: 3px; height: 3px; }
    .recomp-app ::-webkit-scrollbar-track { background: transparent; }
    .recomp-app ::-webkit-scrollbar-thumb { background: ${BORDER}; border-radius: 3px; }
    .recomp-app input:focus, .recomp-app select:focus, .recomp-app textarea:focus {
      border-color: ${ACCENT} !important;
    }
    .recomp-app input[type="checkbox"] { accent-color: ${ACCENT}; }
  `}</style>
);

// ============================================================
// SETUP WIZARD
// ============================================================
const SetupScreen = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState(defaultProfile());
  const [scheduleCustomized, setScheduleCustomized] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);

  const update = (k, v) => setProfile((p) => ({ ...p, [k]: v }));

  // When workoutStyle changes, auto-update schedule (until customized)
  const updateStyle = (newStyle) => {
    setProfile((p) => ({
      ...p,
      workoutStyle: newStyle,
      schedule: scheduleCustomized && validateSchedule(p.schedule, newStyle)
        ? p.schedule
        : defaultScheduleForStyle(newStyle),
    }));
  };

  const updateSchedule = (idx, val) => {
    setScheduleCustomized(true);
    setProfile((p) => {
      const next = [...p.schedule];
      next[idx] = val;
      return { ...p, schedule: next };
    });
  };

  const applyPreset = (preset) => {
    setScheduleCustomized(true);
    setProfile((p) => ({ ...p, schedule: [...preset.days] }));
  };

  const finish = () => {
    onComplete({
      ...profile,
      setupComplete: true,
      // Snap to Monday of current week so program week 1 doesn't immediately
      // show missed workouts for earlier days this week.
      startDate: getWeekStartISO(todayISO()),
    });
  };

  const dayTypes = DAY_TYPES_BY_STYLE[profile.workoutStyle] || [];
  const presets = SPLIT_PRESETS[profile.workoutStyle] || [];
  const workoutDayCount = profile.schedule.filter((d) => d !== 'REST').length;

  const wt = profile.weight || 180;
  const macros = profile.age && profile.height ? calcMacros(profile, wt) : null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.93)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: 12,
      zIndex: 100,
      overflowY: 'auto',
    }}>
      <div style={{
        background: BG,
        border: `1px solid ${BORDER}`,
        borderTop: `3px solid ${ACCENT}`,
        borderRadius: 10,
        padding: 18,
        width: '100%',
        maxWidth: 430,
        marginTop: 20,
        marginBottom: 40,
      }}>
        <H size={26}>
          <span style={{ color: ACCENT }}>RE</span>
          <span style={{ color: ORANGE }}>COMP</span>
        </H>
        <div style={{ marginBottom: 18 }}>
          <ProgressBar value={step} max={4} color={ACCENT} height={4} />
          <div style={{ marginTop: 6, fontSize: 11, color: TEXT_MUTED, letterSpacing: 1, fontFamily: 'Impact, Arial Black, sans-serif' }}>STEP {step} OF 4</div>
        </div>

        {step === 1 && (
          <>
            <H size={18}>WHO ARE YOU</H>
            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <Label>NAME</Label>
                <Input value={profile.name} onChange={(e) => update('name', e.target.value)} placeholder="First name" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <Label>AGE</Label>
                  <Input type="number" value={profile.age} onChange={(e) => update('age', +e.target.value)} />
                </div>
                <div>
                  <Label>SEX</Label>
                  <Select value={profile.sex} onChange={(e) => update('sex', e.target.value)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </Select>
                </div>
              </div>
              <div>
                <Label>HEIGHT (e.g., "5ft 9in" or "175cm")</Label>
                <Input value={profile.height} onChange={(e) => update('height', e.target.value)} placeholder="5ft 9in" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <Label>CURRENT WEIGHT (lbs)</Label>
                  <Input type="number" value={profile.weight} onChange={(e) => update('weight', +e.target.value)} />
                </div>
                <div>
                  <Label>TARGET WEIGHT (lbs)</Label>
                  <Input type="number" value={profile.target} onChange={(e) => update('target', +e.target.value)} />
                </div>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <H size={18}>YOUR GOAL</H>
            <Label>GOAL</Label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {GOAL_OPTIONS.map((g) => (
                <button key={g.id} onClick={() => update('goal', g.id)} style={{
                  background: profile.goal === g.id ? ACCENT : CARD,
                  color: profile.goal === g.id ? '#000' : '#fff',
                  border: `1px solid ${profile.goal === g.id ? ACCENT : BORDER}`,
                  borderRadius: 6,
                  padding: 10,
                  cursor: 'pointer',
                  fontFamily: 'Impact, Arial Black, sans-serif',
                  letterSpacing: 1,
                  textAlign: 'left',
                }}>
                  <div style={{ fontSize: 13, marginBottom: 2 }}>{g.name.toUpperCase()}</div>
                  <div style={{ fontSize: 9, opacity: 0.7, fontFamily: 'Helvetica, Arial, sans-serif', textTransform: 'none' }}>{g.desc}</div>
                </button>
              ))}
            </div>
            <Label>ACTIVITY LEVEL</Label>
            <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
              {ACTIVITY_LEVELS.map((a) => (
                <button key={a.id} onClick={() => update('activity', a.id)} style={{
                  background: profile.activity === a.id ? ACCENT : CARD,
                  color: profile.activity === a.id ? '#000' : '#fff',
                  border: `1px solid ${profile.activity === a.id ? ACCENT : BORDER}`,
                  borderRadius: 6,
                  padding: 9,
                  cursor: 'pointer',
                  fontFamily: 'Impact, Arial Black, sans-serif',
                  letterSpacing: 1,
                  textAlign: 'left',
                  fontSize: 12,
                }}>
                  {a.name.toUpperCase()} — <span style={{ fontSize: 10, opacity: 0.7, fontFamily: 'Helvetica, Arial, sans-serif', textTransform: 'none' }}>{a.desc} (×{a.mult})</span>
                </button>
              ))}
            </div>
            <Label>EXPERIENCE</Label>
            <Select value={profile.experience} onChange={(e) => update('experience', e.target.value)}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
            <div style={{ height: 10 }} />
            <Label>EQUIPMENT</Label>
            <Select value={profile.equipment} onChange={(e) => update('equipment', e.target.value)}>
              <option value="gym">Full Gym</option>
              <option value="home">Home (DBs + Bands)</option>
              <option value="minimal">Minimal/Bodyweight</option>
            </Select>
            {macros && (
              <div style={{ marginTop: 14, padding: 10, background: CARD2, borderRadius: 6, border: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 10, color: ACCENT, letterSpacing: 1, fontFamily: 'Impact, Arial Black, sans-serif', marginBottom: 4 }}>YOUR DAILY TARGETS</div>
                <div style={{ fontSize: 12, color: '#fff' }}>{macros.calories} kcal · {macros.protein}p · {macros.carbs}c · {macros.fat}f</div>
                <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 2 }}>BMR {macros.bmr} · TDEE {macros.tdee}</div>
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <H size={18}>PROGRAM & STYLE</H>
            <Label>PROGRAM LENGTH</Label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {PROGRAM_LENGTHS.map((w) => (
                <button key={w} onClick={() => update('weeks', w)} style={{
                  background: profile.weeks === w ? ACCENT : CARD,
                  color: profile.weeks === w ? '#000' : '#fff',
                  border: `1px solid ${profile.weeks === w ? ACCENT : BORDER}`,
                  borderRadius: 6,
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontFamily: 'Impact, Arial Black, sans-serif',
                  letterSpacing: 1,
                  fontSize: 13,
                }}>{w} WK</button>
              ))}
            </div>
            <Label>WORKOUT STYLE</Label>
            <Select value={profile.workoutStyle} onChange={(e) => updateStyle(e.target.value)}>
              {WORKOUT_STYLES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <div style={{ marginTop: 4, fontSize: 11, color: TEXT_DIM }}>
              {WORKOUT_STYLES.find((s) => s.id === profile.workoutStyle)?.desc}
            </div>

            {/* Race date for HYROX styles */}
            {(profile.workoutStyle === 'hyrox' || profile.workoutStyle === 'hyrox_hybrid') && (
              <>
                <div style={{ height: 12 }} />
                <Label>RACE DATE (OPTIONAL)</Label>
                <Input type="date" value={profile.raceDate} onChange={(e) => update('raceDate', e.target.value)} />
                <div style={{ height: 8 }} />
                <Label>DIVISION</Label>
                <Select value={profile.raceDivision} onChange={(e) => update('raceDivision', e.target.value)}>
                  {HYROX_TARGETS.map((t) => <option key={t.div} value={t.div}>{t.div} — target {t.target}</option>)}
                </Select>
              </>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <H size={18}>WEEKLY SCHEDULE</H>
            <div style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 10 }}>
              Auto-loaded from {WORKOUT_STYLES.find((s) => s.id === profile.workoutStyle)?.name}.
              {scheduleCustomized && ' (Customized — locked in)'}
            </div>

            {/* Compact preview */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 6, padding: 10, marginBottom: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {profile.schedule.map((d, i) => {
                  const c = DAY_TYPE_COLOR[d] || TEXT_MUTED;
                  return (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: TEXT_MUTED, fontFamily: 'Impact, Arial Black, sans-serif' }}>{DAY_LETTERS[i]}</div>
                      <div style={{
                        background: `${c}22`,
                        color: c,
                        border: `1px solid ${c}55`,
                        borderRadius: 4,
                        padding: '4px 0',
                        fontSize: 10,
                        fontFamily: 'Impact, Arial Black, sans-serif',
                        letterSpacing: 0.5,
                        marginTop: 2,
                      }}>{DAY_TYPE_ABBR[d] || d.slice(0, 3)}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: TEXT_DIM, textAlign: 'center', fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1 }}>
                {workoutDayCount} WORKOUT {workoutDayCount === 1 ? 'DAY' : 'DAYS'} / WEEK
              </div>
            </div>

            {!showCustomize ? (
              <Btn variant="ghost" onClick={() => setShowCustomize(true)} style={{ width: '100%' }}>
                CUSTOMIZE SCHEDULE
              </Btn>
            ) : (
              <>
                {presets.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <Label>QUICK PRESETS</Label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {presets.map((p) => (
                        <button key={p.name} onClick={() => applyPreset(p)} style={{
                          background: 'transparent', color: ACCENT, border: `1px solid ${ACCENT}`,
                          padding: '5px 10px', borderRadius: 14, fontSize: 10,
                          fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1, cursor: 'pointer',
                        }}>{p.name.toUpperCase()}</button>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display: 'grid', gap: 6 }}>
                  {DAYS.map((day, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: 8, alignItems: 'center' }}>
                      <div style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 12, color: TEXT_DIM, letterSpacing: 1 }}>{day}</div>
                      <Select value={profile.schedule[i]} onChange={(e) => updateSchedule(i, e.target.value)}>
                        {dayTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                      </Select>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          {step > 1 && <Btn variant="ghost" onClick={() => setStep(step - 1)}>BACK</Btn>}
          <div style={{ flex: 1 }} />
          {step < 4 ? (
            <Btn onClick={() => setStep(step + 1)}>NEXT</Btn>
          ) : (
            <Btn onClick={finish} variant="orange">START PROGRAM</Btn>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// RACE COUNTDOWN CARD
// ============================================================
const RaceCountdown = ({ profile }) => {
  const [_, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);
  if (!profile.raceDate) return null;
  const days = daysUntil(profile.raceDate);
  const phase = racePhase(days);
  const color = raceColor(days);
  const wks = days != null && days > 0 ? Math.floor(days / 7) : 0;
  const remDays = days != null && days > 0 ? days % 7 : 0;
  const months = days != null && days >= 30 ? Math.floor(days / 30) : 0;

  return (
    <div style={{
      position: 'relative',
      background: `linear-gradient(180deg, ${CARD} 0%, ${color}15 100%)`,
      border: `2px solid ${color}`,
      borderRadius: 10,
      padding: 18,
      marginBottom: 14,
      boxShadow: `0 0 30px ${color}44`,
      overflow: 'hidden',
    }}>
      {/* Animated stripe */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 3,
        background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
        animation: 'recomp-stripe 2.5s ease-in-out infinite',
      }} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, justifyContent: 'center' }}>
        <span style={{
          fontFamily: 'Impact, Arial Black, sans-serif',
          fontSize: 78,
          color,
          letterSpacing: -1,
          lineHeight: 1,
          textShadow: `0 0 20px ${color}88, 0 0 40px ${color}44`,
        }}>{days != null ? Math.max(0, days) : '—'}</span>
        <span style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 20, color, letterSpacing: 1.5 }}>DAYS</span>
      </div>
      <div style={{ textAlign: 'center', marginTop: 4 }}>
        <Pill color={color}>{phase ? `${phase.emoji} ${phase.label}` : ''}</Pill>
      </div>
      <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: TEXT_DIM, fontFamily: 'Helvetica, Arial, sans-serif' }}>
        {formatDateLong(profile.raceDate)}
      </div>
      {days != null && days >= 7 && (
        <div style={{ textAlign: 'center', marginTop: 4, fontSize: 11, color: TEXT_MUTED, fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1 }}>
          {wks} WEEK{wks === 1 ? '' : 'S'}{remDays > 0 ? ` · ${remDays} DAY${remDays === 1 ? '' : 'S'}` : ''}
          {months > 0 && ` · ${months} MO`}
        </div>
      )}
    </div>
  );
};

// ============================================================
// DASHBOARD (2x2 grid)
// ============================================================
const Dashboard = ({ state, onTab, onCoachPrompt }) => {
  const { profile, wlog, food, week, sessions } = state;
  const currentWeight = wlog.length ? wlog[wlog.length - 1].weight : profile.weight;
  const macros = calcMacros(profile, currentWeight);
  const todaysFood = food[todayISO()] || [];
  const totals = todaysFood.reduce(
    (acc, f) => ({
      cal: acc.cal + (+f.cal || 0) * (f.qty || 1),
      p: acc.p + (+f.p || 0) * (f.qty || 1),
      c: acc.c + (+f.c || 0) * (f.qty || 1),
      f: acc.f + (+f.f || 0) * (f.qty || 1),
    }),
    { cal: 0, p: 0, c: 0, f: 0 }
  );

  const startW = wlog[0]?.weight || profile.weight;
  const wDelta = currentWeight - startW;
  const wDeltaColor = profile.goal === 'fatloss' ? (wDelta < 0 ? GREEN : RED) : profile.goal === 'muscle' ? (wDelta > 0 ? GREEN : RED) : TEXT_DIM;
  const wDeltaSign = wDelta > 0 ? '+' : '';

  // Phase / week info
  let phaseInfo;
  if (profile.workoutStyle === 'rp_hyp') {
    phaseInfo = rpWeekData(week, profile.weeks);
    phaseInfo.color = phaseInfo.phase === 'RP DELOAD' ? PURPLE : ACCENT;
  } else if (profile.workoutStyle === 'hyrox' || profile.workoutStyle === 'hyrox_hybrid') {
    const ph = hyroxPhase(week, profile.weeks);
    phaseInfo = { phase: ph.name, sub: HYROX_INTERVALS_BY_PHASE[ph.name]?.run || '', color: ph.color };
  } else {
    const ph = phaseForWeek(week, profile.weeks);
    phaseInfo = { phase: ph.phase, sub: `${ph.sets}×${ph.reps} @ RPE ${ph.rpe}`, color: PHASE_COLORS[ph.phase] || ACCENT };
  }

  return (
    <div>
      <RaceCountdown profile={profile} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {/* Weight */}
        <Card>
          <Label>WEIGHT</Label>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 32, color: '#fff' }}>{currentWeight}</span>
            <span style={{ fontSize: 12, color: TEXT_DIM, fontFamily: 'Helvetica, Arial, sans-serif' }}>lbs</span>
          </div>
          <div style={{ marginTop: 4 }}>
            <Pill color={wDeltaColor}>{wDeltaSign}{wDelta.toFixed(1)} lbs</Pill>
          </div>
          <div style={{ marginTop: 6, fontSize: 10, color: TEXT_MUTED, fontFamily: 'Helvetica, Arial, sans-serif' }}>
            {startW} → {profile.target} lbs
          </div>
        </Card>

        {/* Today macros */}
        <Card>
          <Label>TODAY</Label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4 }}>
            {[
              { label: 'CAL', cur: totals.cal, max: macros.calories, color: ACCENT },
              { label: 'P', cur: totals.p, max: macros.protein, color: BLUE },
              { label: 'C', cur: totals.c, max: macros.carbs, color: ORANGE },
              { label: 'F', cur: totals.f, max: macros.fat, color: PURPLE },
            ].map((m) => (
              <div key={m.label}>
                <div style={{ fontSize: 9, color: TEXT_MUTED, fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1 }}>{m.label}</div>
                <div style={{ fontSize: 13, color: '#fff', fontFamily: 'Impact, Arial Black, sans-serif' }}>{Math.round(m.cur)}<span style={{ fontSize: 9, color: TEXT_MUTED }}>/{Math.round(m.max)}</span></div>
                <ProgressBar value={m.cur} max={m.max} color={m.color} height={2} />
              </div>
            ))}
          </div>
        </Card>

        {/* Phase */}
        <Card>
          <Label>PHASE</Label>
          <div style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 16, color: phaseInfo.color, letterSpacing: 1 }}>{phaseInfo.phase}</div>
          <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 2 }}>{phaseInfo.sub || phaseInfo.repRange}</div>
          <div style={{ marginTop: 8 }}>
            <ProgressBar value={week} max={profile.weeks} color={phaseInfo.color} height={3} />
            <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 4, fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1 }}>WK {week} / {profile.weeks}</div>
          </div>
        </Card>

        {/* Quick coach */}
        <Card>
          <Label>COACH</Label>
          <div style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 8 }}>Tap 🤖 or quick prompt</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {['THIS WEEK', 'MACROS', 'CARDIO', 'RECOVERY'].map((p) => (
              <button key={p} onClick={() => onCoachPrompt(p)} style={{
                background: 'transparent', color: ACCENT, border: `1px solid ${ACCENT}55`,
                padding: '4px 8px', borderRadius: 12, fontSize: 9,
                fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1, cursor: 'pointer',
              }}>{p}</button>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Btn onClick={() => onTab('workouts')}>TODAY'S WORKOUT</Btn>
        <Btn variant="ghost" onClick={() => onTab('food')}>LOG FOOD</Btn>
        <Btn variant="ghost" onClick={() => onTab('runs')}>LOG RUN</Btn>
        <Btn variant="ghost" onClick={() => onTab('metrics')}>LOG WEIGHT</Btn>
      </div>
    </div>
  );
};

// ============================================================
// WORKOUTS VIEW
// ============================================================
const Workouts = ({ state, setState }) => {
  const { profile, sessions, week, wlog } = state;
  const [viewISO, setViewISO] = useState(todayISO());
  const [viewWeek, setViewWeek] = useState(week);
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const currentWeight = wlog.length ? wlog[wlog.length - 1].weight : profile.weight;

  const dayInfo = getDayTypeForDate(profile, viewISO);
  const dayType = dayInfo.type;
  const dayProgramWeek = getProgramWeek(viewISO, profile.startDate, profile.weeks);
  const sessKey = sessionKey(viewISO);
  const session = sessions[sessKey];

  // Build effective schedule for THIS program week, applying any week overrides,
  // so getExercisesForDay can pick A/B variant based on occurrence within the week
  const viewDayIdx = getDayIdx(viewISO);
  const overridesForWeek = (profile.weekOverrides || {})[`w${dayProgramWeek}`] || {};
  const effectiveSchedule = (profile.schedule || []).map((d, i) => overridesForWeek[i] || d);

  const exData = getExercisesForDay(
    profile.workoutStyle,
    dayType,
    dayProgramWeek,
    profile.weeks,
    effectiveSchedule,
    viewDayIdx
  );

  // Detect missed workouts in current week
  const weekStart = getWeekStartISO(todayISO());
  const todayIdx = getDayIdx(todayISO());
  const missedDays = [];
  for (let i = 0; i < todayIdx; i++) {
    const d = new Date(isoToDate(weekStart));
    d.setDate(d.getDate() + i);
    const di = dateToISO(d);
    const dInfo = getDayTypeForDate(profile, di);
    if (dInfo.type === 'REST') continue;
    const sk = sessionKey(di);
    const s = sessions[sk];
    if (!s || (!s.done && !s.skipped)) {
      missedDays.push({ iso: di, idx: i, type: dInfo.type });
    }
  }

  const updateSession = (patch) => {
    setState((prev) => {
      const existing = prev.sessions[sessKey];
      const base = existing || { iso: viewISO, dayType, exercises: exData?.exercises || [], setLogs: {}, feedback: {}, done: false, skipped: false };
      return {
        ...prev,
        sessions: {
          ...prev.sessions,
          [sessKey]: { ...base, ...patch, iso: viewISO, dayType },
        },
      };
    });
  };

  const updateSet = (exName, setIdx, patch) => {
    const k = setKey(exName, setIdx);
    setState((prev) => {
      const existing = prev.sessions[sessKey];
      const base = existing || { iso: viewISO, dayType, exercises: exData?.exercises || [], setLogs: {}, feedback: {}, done: false, skipped: false };
      const cur = (base.setLogs || {})[k] || {};
      return {
        ...prev,
        sessions: {
          ...prev.sessions,
          [sessKey]: {
            ...base,
            iso: viewISO,
            dayType,
            setLogs: { ...(base.setLogs || {}), [k]: { ...cur, ...patch } },
          },
        },
      };
    });
  };

  const updateMuscleFeedback = (muscle, field, value) => {
    setState((prev) => {
      const existing = prev.sessions[sessKey];
      const base = existing || { iso: viewISO, dayType, exercises: exData?.exercises || [], setLogs: {}, feedback: {}, done: false, skipped: false };
      const fb = base.feedback || {};
      const m = fb[muscle] || {};
      return {
        ...prev,
        sessions: {
          ...prev.sessions,
          [sessKey]: {
            ...base,
            iso: viewISO,
            dayType,
            feedback: { ...fb, [muscle]: { ...m, [field]: value } },
          },
        },
      };
    });
  };

  const skipDay = () => {
    updateSession({ skipped: true, done: false });
    setShowMoveMenu(false);
  };

  const markDone = () => {
    updateSession({ done: true, skipped: false, completedAt: new Date().toISOString() });
  };

  const moveToToday = (fromISO) => {
    const fromInfo = getDayTypeForDate(profile, fromISO);
    const fromKey = sessionKey(fromISO);
    setState((prev) => {
      const newOverrides = { ...(prev.profile.weekOverrides || {}) };
      const programWeek = getProgramWeek(todayISO(), prev.profile.startDate, prev.profile.weeks);
      const wKey = `w${programWeek}`;
      newOverrides[wKey] = { ...(newOverrides[wKey] || {}), [getDayIdx(todayISO())]: fromInfo.type };

      // Mark the original day as skipped
      const fromSess = prev.sessions[fromKey] || { iso: fromISO, dayType: fromInfo.type, setLogs: {}, feedback: {}, exercises: [] };
      return {
        ...prev,
        profile: { ...prev.profile, weekOverrides: newOverrides },
        sessions: {
          ...prev.sessions,
          [fromKey]: { ...fromSess, skipped: true, moved: true },
        },
      };
    });
    setViewISO(todayISO());
    setShowMoveMenu(false);
  };

  const swapDay = (targetISO) => {
    const newType = dayType;
    setState((prev) => {
      const programWeek = getProgramWeek(targetISO, prev.profile.startDate, prev.profile.weeks);
      const wKey = `w${programWeek}`;
      const newOverrides = { ...(prev.profile.weekOverrides || {}) };
      newOverrides[wKey] = { ...(newOverrides[wKey] || {}), [getDayIdx(targetISO)]: newType };
      // Mark current as skipped
      const curSess = prev.sessions[sessKey] || { iso: viewISO, dayType, setLogs: {}, feedback: {}, exercises: [] };
      return {
        ...prev,
        profile: { ...prev.profile, weekOverrides: newOverrides },
        sessions: { ...prev.sessions, [sessKey]: { ...curSess, skipped: true, moved: true } },
      };
    });
    setViewISO(targetISO);
    setShowMoveMenu(false);
  };

  // Date strip — current week
  const stripWeekStart = getWeekStartISO(viewISO);
  const strip = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(isoToDate(stripWeekStart));
    d.setDate(d.getDate() + i);
    const di = dateToISO(d);
    const info = getDayTypeForDate(profile, di);
    const sk = sessionKey(di);
    const s = sessions[sk];
    let stat = '';
    if (s?.done) stat = 'done';
    else if (s?.skipped) stat = 'skipped';
    else if (info.overridden) stat = 'moved';
    strip.push({ iso: di, idx: i, type: info.type, overridden: info.overridden, stat, isToday: di === todayISO() });
  }

  // Color for header based on day type
  const headerColor = DAY_TYPE_COLOR[dayType] || ACCENT;

  // Week note (weeks 2+)
  const phaseInfo = profile.workoutStyle === 'rp_hyp' ? rpWeekData(dayProgramWeek, profile.weeks) : phaseForWeek(dayProgramWeek, profile.weeks);
  const showWeekNote = dayProgramWeek >= 2 && phaseInfo.note;

  // Variant indicator for A/B
  const variant = exData?.variant;

  return (
    <div>
      {/* Week nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Btn size="sm" variant="ghost" onClick={() => {
          const d = isoToDate(viewISO); d.setDate(d.getDate() - 7); setViewISO(dateToISO(d));
        }}>‹</Btn>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 13, color: TEXT_DIM, letterSpacing: 1 }}>
          WEEK {dayProgramWeek} OF {profile.weeks}
        </div>
        <Btn size="sm" variant="ghost" onClick={() => {
          const d = isoToDate(viewISO); d.setDate(d.getDate() + 7); setViewISO(dateToISO(d));
        }}>›</Btn>
      </div>

      {/* Day strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 10 }}>
        {strip.map((d) => {
          const c = DAY_TYPE_COLOR[d.type] || TEXT_MUTED;
          const isViewing = d.iso === viewISO;
          const bg = d.stat === 'done' ? `${GREEN}33` : d.stat === 'skipped' ? `${RED}33` : d.stat === 'moved' ? `${YELLOW}33` : isViewing ? CARD2 : CARD;
          const border = isViewing ? `2px solid ${ACCENT}` : d.overridden && !d.stat ? `1px solid ${YELLOW}` : `1px solid ${BORDER}`;
          return (
            <button key={d.idx} onClick={() => setViewISO(d.iso)} style={{
              background: bg,
              border,
              borderRadius: 5,
              padding: '6px 2px',
              cursor: 'pointer',
              minHeight: 56,
              fontFamily: 'Impact, Arial Black, sans-serif',
              color: '#fff',
            }}>
              <div style={{ fontSize: 10, color: TEXT_DIM }}>{DAY_LETTERS[d.idx]}</div>
              <div style={{
                fontSize: 9,
                color: c,
                marginTop: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 60,
                margin: '2px auto 0',
              }}>{DAY_TYPE_ABBR[d.type] || d.type.slice(0, 3)}</div>
              <div style={{ fontSize: 10, marginTop: 2 }}>
                {d.stat === 'done' && <span style={{ color: GREEN }}>✓</span>}
                {d.stat === 'skipped' && <span style={{ color: RED }}>×</span>}
                {d.stat === 'moved' && <span style={{ color: YELLOW }}>↔</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Missed banner */}
      {missedDays.length > 0 && viewISO === todayISO() && (
        <Card style={{ background: `${YELLOW}15`, border: `1px solid ${YELLOW}88`, marginBottom: 10 }}>
          <H size={12} color={YELLOW} mb={4}>⚠ MISSED THIS WEEK</H>
          {missedDays.map((m) => (
            <div key={m.iso} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ flex: 1, fontSize: 12, color: '#fff' }}>{DAYS[m.idx]} — <span style={{ color: DAY_TYPE_COLOR[m.type] || '#fff' }}>{m.type}</span></span>
              <Btn size="sm" variant="primary" onClick={() => moveToToday(m.iso)}>MOVE TO TODAY</Btn>
            </div>
          ))}
        </Card>
      )}

      {/* Date label + day type */}
      <Card style={{ marginBottom: 10, borderTop: `3px solid ${headerColor}` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: TEXT_MUTED, fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1 }}>
              {viewISO === todayISO() ? 'TODAY' : viewISO === dateOffsetISO(-1) ? 'YESTERDAY' : formatDate(viewISO).toUpperCase()}
            </div>
            <H size={20} color={headerColor} mb={2} style={{ marginTop: 4 }}>
              {dayType.replace(/_/g, ' ')}
              {variant && <span style={{ color: TEXT_DIM, fontSize: 14, marginLeft: 6 }}>({variant})</span>}
              {dayInfo.overridden && <span style={{ color: YELLOW, fontSize: 12, marginLeft: 6 }}>↔</span>}
            </H>
            <div style={{ fontSize: 10, color: TEXT_MUTED, fontFamily: 'Helvetica, Arial, sans-serif' }}>
              {WORKOUT_STYLES.find((s) => s.id === profile.workoutStyle)?.name}
              {exData?.phase && ` · ${exData.phase.emoji} ${exData.phase.name}`}
              {exData?.wd && ` · RIR ${exData.wd.rir}`}
            </div>
          </div>
          {!session?.skipped && !session?.done && dayType !== 'REST' && (
            <Btn size="sm" variant="ghost" onClick={() => setShowMoveMenu(!showMoveMenu)}>MOVE/SKIP</Btn>
          )}
        </div>

        {/* Move/skip menu */}
        {showMoveMenu && (
          <div style={{ marginTop: 12, padding: 10, background: CARD2, borderRadius: 6, border: `1px solid ${BORDER}` }}>
            <Label>MOVE TO ANOTHER DAY THIS WEEK</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
              {strip.map((d) => {
                if (d.iso === viewISO) return null;
                return (
                  <button key={d.idx} onClick={() => swapDay(d.iso)} style={{
                    background: CARD, color: '#fff', border: `1px solid ${BORDER}`,
                    borderRadius: 4, padding: 6, cursor: 'pointer', fontSize: 10,
                    fontFamily: 'Impact, Arial Black, sans-serif',
                  }}>
                    <div style={{ color: TEXT_DIM }}>{DAY_LETTERS[d.idx]}</div>
                    <div style={{ color: DAY_TYPE_COLOR[d.type], marginTop: 2 }}>{DAY_TYPE_ABBR[d.type] || d.type.slice(0, 3)}</div>
                    {d.stat === 'done' && <div style={{ color: GREEN, fontSize: 10 }}>✓</div>}
                    {d.stat === 'skipped' && <div style={{ color: RED, fontSize: 10 }}>×</div>}
                  </button>
                );
              })}
            </div>
            <Btn size="sm" variant="danger" onClick={skipDay} style={{ width: '100%' }}>SKIP THIS DAY</Btn>
          </div>
        )}
      </Card>

      {/* Status badges */}
      {session?.done && <Card style={{ background: `${GREEN}20`, marginBottom: 10 }}><H size={13} color={GREEN} mb={0}>✓ DONE</H></Card>}
      {session?.skipped && <Card style={{ background: `${RED}20`, marginBottom: 10 }}><H size={13} color={RED} mb={0}>× SKIPPED{session.moved ? ' (MOVED)' : ''}</H></Card>}

      {/* Week note */}
      {showWeekNote && !session?.skipped && dayType !== 'REST' && (
        <Card style={{ marginBottom: 10, background: CARD2, borderLeft: `3px solid ${ACCENT}` }}>
          <Label>THIS WEEK'S CHANGE</Label>
          <div style={{ fontSize: 12, color: '#fff' }}>{phaseInfo.note}</div>
        </Card>
      )}

      {/* Warm-up */}
      {dayType !== 'REST' && exData?.exercises?.length > 0 && !session?.skipped && (
        <Card style={{ marginBottom: 10 }}>
          <Label>WARM-UP</Label>
          <div style={{ fontSize: 12, color: TEXT_DIM }}>{warmupForDayType(dayType)}</div>
        </Card>
      )}

      {/* Rest day */}
      {dayType === 'REST' && (
        <Card>
          <H size={18} color={TEXT_DIM}>REST DAY</H>
          <div style={{ fontSize: 12, color: TEXT_DIM }}>Recovery is the work. Hydrate, sleep, mobility.</div>
        </Card>
      )}

      {/* Cardio day with HR zones option */}
      {dayType === 'CARDIO' && exData?.exercises?.length > 0 && !session?.skipped && (
        <Card style={{ marginBottom: 10 }}>
          <Label>CARDIO PROTOCOL</Label>
          <div style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 14, color: BLUE }}>{exData.exercises[0].name}</div>
          <div style={{ fontSize: 12, color: TEXT_DIM, marginTop: 4 }}>{exData.exercises[0].reps}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <Btn size="sm" variant="ghost">CUSTOMIZE</Btn>
            <Btn size="sm" variant="ghost">HR ZONES</Btn>
          </div>
          <div style={{ marginTop: 12 }}>
            <Label>NOTES</Label>
            <textarea value={session?.notes || ''} onChange={(e) => updateSession({ notes: e.target.value })} placeholder="Duration, HR, how it felt..." style={{
              width: '100%', minHeight: 60, background: CARD2, border: `1px solid ${BORDER}`,
              borderRadius: 6, color: '#fff', padding: 8, fontSize: 12, fontFamily: 'Helvetica, Arial, sans-serif', outline: 'none', boxSizing: 'border-box',
            }} />
          </div>
        </Card>
      )}

      {/* Race sim — race time input */}
      {exData?.isRaceSim && !session?.skipped && (
        <Card style={{ marginBottom: 10 }}>
          <Label>RACE TIME (mm:ss)</Label>
          <Input value={session?.raceTime || ''} onChange={(e) => updateSession({ raceTime: e.target.value })} placeholder="e.g. 1:24:30" />
          <div style={{ marginTop: 6, fontSize: 11, color: TEXT_DIM }}>
            Target: {HYROX_TARGETS.find((t) => t.div === profile.raceDivision)?.target || '—'}
          </div>
        </Card>
      )}

      {/* Exercises (non-cardio non-rest) */}
      {dayType !== 'REST' && dayType !== 'CARDIO' && exData?.exercises?.length > 0 && !session?.skipped && (
        <>
          {exData.isRP ? (
            // RP — group by muscle
            (() => {
              const byMuscle = {};
              exData.exercises.forEach((ex) => {
                if (!byMuscle[ex.muscle]) byMuscle[ex.muscle] = [];
                byMuscle[ex.muscle].push(ex);
              });
              return Object.entries(byMuscle).map(([muscle, exs]) => (
                <div key={muscle} style={{ marginBottom: 14 }}>
                  <H size={14} color={ORANGE} mb={6}>{muscle.toUpperCase()}</H>
                  <div style={{ fontSize: 10, color: TEXT_MUTED, marginBottom: 8 }}>
                    MEV {RP_LANDMARKS[muscle].MEV} · MAV {RP_LANDMARKS[muscle].MAV} · MRV {RP_LANDMARKS[muscle].MRV} sets/wk
                  </div>
                  {exs.map((ex, ei) => (
                    <ExerciseBlock
                      key={ei}
                      ex={ex}
                      session={session}
                      sessions={sessions}
                      currentISO={viewISO}
                      goal={profile.goal}
                      onSetUpdate={updateSet}
                      rpFeedback={(session?.feedback || {})[muscle]}
                    />
                  ))}
                  <RPMuscleFeedback muscle={muscle} feedback={(session?.feedback || {})[muscle]} onUpdate={updateMuscleFeedback} />
                </div>
              ));
            })()
          ) : (
            exData.exercises.map((ex, ei) => (
              <ExerciseBlock
                key={ei}
                ex={ex}
                session={session}
                sessions={sessions}
                currentISO={viewISO}
                goal={profile.goal}
                onSetUpdate={updateSet}
                showSuperset={exData.isSuperset}
              />
            ))
          )}

          {/* Conditioning finisher */}
          {exData.finisher && (
            <Card style={{ background: `${ORANGE}10`, borderLeft: `3px solid ${ORANGE}`, marginTop: 10 }}>
              <Label>CONDITIONING FINISHER</Label>
              <div style={{ fontSize: 12, color: '#fff' }}>{exData.finisher}</div>
            </Card>
          )}

          {/* Session notes + complete */}
          <Card style={{ marginTop: 10 }}>
            <Label>SESSION NOTES</Label>
            <textarea value={session?.notes || ''} onChange={(e) => updateSession({ notes: e.target.value })} placeholder="How did it feel?" style={{
              width: '100%', minHeight: 60, background: CARD2, border: `1px solid ${BORDER}`,
              borderRadius: 6, color: '#fff', padding: 8, fontSize: 12, fontFamily: 'Helvetica, Arial, sans-serif', outline: 'none', boxSizing: 'border-box',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#fff', cursor: 'pointer' }}>
                <input type="checkbox" checked={session?.done || false} onChange={(e) => e.target.checked ? markDone() : updateSession({ done: false })} />
                MARK COMPLETE
              </label>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 10, color: TEXT_MUTED, fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1 }}>AUTO-SAVED</span>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

const ExerciseBlock = ({ ex, session, sessions, currentISO, goal, onSetUpdate, rpFeedback, showSuperset }) => {
  const setCount = parseInt(ex.sets, 10) || 3;
  const prev = findPreviousLog(sessions, ex.name, currentISO);
  const suggestion = suggestNextSet(prev, ex.reps, goal, rpFeedback);

  return (
    <Card style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
        <H size={14} mb={2}>
          {ex.ssLabel && <span style={{ color: ACCENT, marginRight: 6 }}>{ex.ssLabel}</span>}
          {ex.name}
        </H>
        <div style={{ display: 'flex', gap: 4, fontSize: 10, fontFamily: 'Impact, Arial Black, sans-serif' }}>
          <Pill color={TEXT_DIM} bg={CARD2}>{ex.sets}×{ex.reps}</Pill>
          {ex.tempo && ex.tempo !== '-' && <Pill color={PURPLE}>{ex.tempo}</Pill>}
        </div>
      </div>
      <div style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 8 }}>{ex.note}</div>
      {ex.progressionNote && (
        <div style={{ fontSize: 10, color: ACCENT, fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1, marginBottom: 8 }}>
          📈 {ex.progressionNote.toUpperCase()}
        </div>
      )}

      {/* Suggestion */}
      <div style={{ background: CARD2, padding: 8, borderRadius: 6, marginBottom: 8, borderLeft: `3px solid ${suggestion.color}` }}>
        <div style={{ fontSize: 11, fontFamily: 'Impact, Arial Black, sans-serif', color: suggestion.color, letterSpacing: 1 }}>
          <span style={{ fontSize: 14, marginRight: 4 }}>{suggestion.arrow}</span>
          {suggestion.weight != null ? `${suggestion.weight} lbs` : 'Find your weight'}
        </div>
        <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 2 }}>{suggestion.note}</div>
      </div>

      {/* Sets */}
      {Array.from({ length: setCount }).map((_, si) => {
        const k = setKey(ex.name, si);
        const cur = (session?.setLogs || {})[k] || {};
        const done = cur.done;
        return (
          <div key={si} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 32px', gap: 6, marginBottom: 4, alignItems: 'center' }}>
            <div style={{
              background: done ? ACCENT : CARD2,
              color: done ? '#000' : TEXT_DIM,
              borderRadius: 4,
              padding: '7px 0',
              textAlign: 'center',
              fontSize: 11,
              fontFamily: 'Impact, Arial Black, sans-serif',
            }}>{si + 1}</div>
            <Input
              type="number"
              placeholder="lbs"
              value={cur.weight || ''}
              onChange={(e) => onSetUpdate(ex.name, si, { weight: e.target.value })}
              style={{ borderColor: done ? ACCENT : BORDER, padding: '7px 9px', fontSize: 13 }}
            />
            <Input
              type="number"
              placeholder="reps"
              value={cur.reps || ''}
              onChange={(e) => onSetUpdate(ex.name, si, { reps: e.target.value })}
              style={{ borderColor: done ? ACCENT : BORDER, padding: '7px 9px', fontSize: 13 }}
            />
            <input
              type="checkbox"
              checked={done || false}
              onChange={(e) => onSetUpdate(ex.name, si, { done: e.target.checked })}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
          </div>
        );
      })}
    </Card>
  );
};

const RPMuscleFeedback = ({ muscle, feedback = {}, onUpdate }) => {
  const fb = feedback || {};
  const allFilled = fb.pump != null && fb.workload != null && fb.soreness != null;
  return (
    <Card style={{ background: CARD2, marginBottom: 10 }}>
      <Label>{muscle.toUpperCase()} FEEDBACK</Label>
      {[
        { key: 'pump', label: 'PUMP', opts: RP_PUMP },
        { key: 'workload', label: 'WORKLOAD', opts: RP_WORKLOAD },
        { key: 'soreness', label: 'SORENESS', opts: RP_SORENESS },
      ].map((row) => (
        <div key={row.key} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: TEXT_MUTED, fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1, marginBottom: 4 }}>{row.label}</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {row.opts.map((opt, i) => (
              <button key={i} onClick={() => onUpdate(muscle, row.key, i)} style={{
                flex: 1,
                background: fb[row.key] === i ? ACCENT : CARD,
                color: fb[row.key] === i ? '#000' : '#fff',
                border: `1px solid ${fb[row.key] === i ? ACCENT : BORDER}`,
                borderRadius: 4,
                padding: '5px 2px',
                cursor: 'pointer',
                fontSize: 10,
              }}>{opt}</button>
            ))}
          </div>
        </div>
      ))}
      {allFilled && (
        <div style={{ fontSize: 10, color: GREEN, fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1, marginTop: 6 }}>
          ✓ FEEDBACK LOGGED — WILL ADJUST NEXT SESSION
        </div>
      )}
    </Card>
  );
};

// ============================================================
// RUNS VIEW
// ============================================================
const Runs = ({ state, setState }) => {
  const { runs } = state;
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: todayISO(), type: 'easy',
    distMi: '', distKm: '', useKm: false,
    minutes: '', seconds: '0', hr: '', elev: '', route: '', notes: '',
  });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = filter === 'all' ? runs : runs.filter((r) => r.type === filter);
  const sortedRuns = [...filtered].sort((a, b) => (a.date < b.date ? 1 : -1));

  // PRs: best time at each distance
  const prs = PR_DISTANCES.map((pd) => {
    const matches = runs
      .filter((r) => Math.abs((r.distMi || 0) - pd.miles) / pd.miles <= pd.tol && r.totalSec > 0)
      .sort((a, b) => a.totalSec - b.totalSec);
    return { ...pd, run: matches[0] };
  });

  // Stats
  const totalMi = runs.reduce((a, r) => a + (r.distMi || 0), 0);
  const totalRuns = runs.length;
  const longest = runs.reduce((acc, r) => (r.distMi > (acc?.distMi || 0) ? r : acc), null);

  const fmtSec = (sec) => {
    if (!sec) return '—';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const fmtPace = (paceSec) => {
    if (!paceSec) return '—';
    const m = Math.floor(paceSec / 60);
    const s = Math.round(paceSec % 60);
    return `${m}:${String(s).padStart(2, '0')}/mi`;
  };

  const submitRun = () => {
    let distMi, distKm;
    if (form.useKm) {
      distKm = +form.distKm;
      distMi = +(distKm * 0.621371).toFixed(3);
    } else {
      distMi = +form.distMi;
      distKm = +(distMi * 1.609344).toFixed(3);
    }
    if (!distMi) return;
    const totalSec = (+form.minutes || 0) * 60 + (+form.seconds || 0);
    const paceSec = totalSec && distMi ? totalSec / distMi : 0;
    const paceKmSec = totalSec && distKm ? totalSec / distKm : 0;
    const newRun = {
      id: 'r_' + Date.now(),
      date: form.date,
      type: form.type,
      distMi, distKm,
      totalSec,
      paceSec, paceKmSec,
      hr: +form.hr || null,
      elev: +form.elev || null,
      route: form.route || '',
      notes: form.notes || '',
    };
    const allRuns = [...runs, newRun];
    const newPRs = checkRunPR(newRun, allRuns);
    if (newPRs.length) newRun.prs = newPRs;
    setState((p) => ({ ...p, runs: allRuns }));
    setForm({ date: todayISO(), type: 'easy', distMi: '', distKm: '', useKm: false, minutes: '', seconds: '0', hr: '', elev: '', route: '', notes: '' });
    setShowForm(false);
  };

  const deleteRun = (id) => {
    setState((p) => ({ ...p, runs: p.runs.filter((r) => r.id !== id) }));
    setConfirmDelete(null);
  };

  return (
    <div>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        <Card>
          <Label>RUNS</Label>
          <div style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 26, color: '#fff' }}>{totalRuns}</div>
        </Card>
        <Card>
          <Label>MILES</Label>
          <div style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 26, color: '#fff' }}>{totalMi.toFixed(1)}</div>
        </Card>
        <Card>
          <Label>LONGEST</Label>
          <div style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 22, color: '#fff' }}>{longest ? `${longest.distMi.toFixed(1)}mi` : '—'}</div>
          <div style={{ fontSize: 9, color: TEXT_MUTED }}>{longest ? fmtSec(longest.totalSec) : ''}</div>
        </Card>
      </div>

      {/* PRs */}
      <Card style={{ marginBottom: 12 }}>
        <H size={13}>PERSONAL BESTS</H>
        <div style={{ display: 'grid', gap: 4 }}>
          {prs.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ flex: 1, fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 12, color: TEXT_DIM, letterSpacing: 1 }}>{p.name.toUpperCase()}</span>
              {p.run ? (
                <>
                  <span style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 14, color: ACCENT }}>{fmtSec(p.run.totalSec)}</span>
                  <span style={{ fontSize: 10, color: TEXT_MUTED, minWidth: 70, textAlign: 'right' }}>{formatDate(p.run.date)}</span>
                </>
              ) : (
                <span style={{ fontSize: 11, color: TEXT_MUTED }}>—</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Add run button / form */}
      {!showForm ? (
        <Btn onClick={() => setShowForm(true)} style={{ width: '100%', marginBottom: 12 }}>+ LOG RUN</Btn>
      ) : (
        <Card style={{ marginBottom: 12 }}>
          <H size={13}>LOG RUN</H>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <Label>DATE</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label>TYPE</Label>
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {RUN_TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Label style={{ marginBottom: 0 }}>DISTANCE</Label>
                <button onClick={() => setForm({ ...form, useKm: !form.useKm })} style={{
                  background: 'transparent', color: ACCENT, border: `1px solid ${ACCENT}`,
                  borderRadius: 12, padding: '2px 8px', fontSize: 9, cursor: 'pointer',
                  fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1,
                }}>{form.useKm ? 'KM' : 'MI'}</button>
              </div>
              <Input
                type="number"
                step="0.01"
                placeholder={form.useKm ? 'km' : 'mi'}
                value={form.useKm ? form.distKm : form.distMi}
                onChange={(e) => form.useKm ? setForm({ ...form, distKm: e.target.value }) : setForm({ ...form, distMi: e.target.value })}
              />
            </div>
            <div>
              <Label>TIME (MIN : SEC)</Label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Input type="number" placeholder="min" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} />
                <Input type="number" placeholder="sec" value={form.seconds} onChange={(e) => setForm({ ...form, seconds: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <Label>HR (OPT)</Label>
                <Input type="number" placeholder="bpm" value={form.hr} onChange={(e) => setForm({ ...form, hr: e.target.value })} />
              </div>
              <div>
                <Label>ELEV (OPT)</Label>
                <Input type="number" placeholder="ft" value={form.elev} onChange={(e) => setForm({ ...form, elev: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>ROUTE / NOTES (OPT)</Label>
              <Input value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} placeholder="Trinity Park loop" />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <Btn variant="ghost" onClick={() => setShowForm(false)}>CANCEL</Btn>
              <div style={{ flex: 1 }} />
              <Btn onClick={submitRun}>SAVE RUN</Btn>
            </div>
          </div>
        </Card>
      )}

      {/* Filter chips with counts */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {[{ id: 'all', name: 'ALL', color: '#fff' }, ...RUN_TYPES.map((t) => ({ ...t, name: t.name.toUpperCase() }))].map((t) => {
          const count = t.id === 'all' ? runs.length : runs.filter((r) => r.type === t.id).length;
          if (t.id !== 'all' && count === 0) return null;
          const active = filter === t.id;
          return (
            <button key={t.id} onClick={() => setFilter(t.id)} style={{
              background: active ? t.color : 'transparent',
              color: active ? '#000' : t.color,
              border: `1px solid ${t.color}`,
              padding: '4px 9px', borderRadius: 12, fontSize: 9,
              fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{t.name} ({count})</button>
          );
        })}
      </div>

      {/* Header for results */}
      <div style={{ fontSize: 10, color: TEXT_MUTED, fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1, marginBottom: 6 }}>
        {sortedRuns.length} RESULT{sortedRuns.length === 1 ? '' : 'S'}
      </div>

      {/* Run list */}
      {sortedRuns.length === 0 && (
        <Card style={{ textAlign: 'center' }}>
          <div style={{ color: TEXT_DIM, fontSize: 12 }}>No runs logged yet.</div>
        </Card>
      )}
      {sortedRuns.map((r) => {
        const tInfo = RUN_TYPES.find((t) => t.id === r.type) || RUN_TYPES[0];
        return (
          <Card key={r.id} style={{ marginBottom: 8, borderLeft: `3px solid ${tInfo.color}`, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
              <div>
                <div style={{ fontSize: 10, color: TEXT_MUTED, fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1 }}>{formatDate(r.date).toUpperCase()}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
                  <Pill color={tInfo.color}>{tInfo.name}</Pill>
                  <span style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 18, color: '#fff' }}>{r.distMi.toFixed(2)} mi</span>
                  <span style={{ fontSize: 10, color: TEXT_MUTED }}>({r.distKm.toFixed(2)} km)</span>
                </div>
                <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <span>{fmtSec(r.totalSec)}</span>
                  <span>· {fmtPace(r.paceSec)}</span>
                  {r.hr ? <span>· {r.hr}bpm</span> : null}
                  {r.elev ? <span>· {r.elev}ft</span> : null}
                </div>
                {r.route && <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>{r.route}</div>}
                {r.prs && r.prs.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    {r.prs.map((p) => <Pill key={p} color={ORANGE}>🏆 {PR_DISTANCES.find((pd) => pd.id === p)?.name} PR</Pill>)}
                  </div>
                )}
              </div>
              {confirmDelete === r.id ? (
                <div style={{ display: 'flex', gap: 4 }}>
                  <Btn size="sm" variant="danger" onClick={() => deleteRun(r.id)}>YES, DELETE</Btn>
                  <Btn size="sm" variant="ghost" onClick={() => setConfirmDelete(null)}>CANCEL</Btn>
                </div>
              ) : (
                <Btn size="sm" variant="ghost" onClick={() => setConfirmDelete(r.id)}>×</Btn>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

// ============================================================
// METRICS VIEW
// ============================================================
const Metrics = ({ state, setState }) => {
  const { profile, wlog } = state;
  const [newWeight, setNewWeight] = useState('');
  const [newDate, setNewDate] = useState(todayISO());

  const sortedLog = [...wlog].sort((a, b) => (a.date < b.date ? 1 : -1));
  const currentWeight = sortedLog[0]?.weight || profile.weight;
  const startW = wlog.length ? [...wlog].sort((a, b) => (a.date < b.date ? -1 : 1))[0].weight : profile.weight;
  const targetW = profile.target;
  const macros = calcMacros(profile, currentWeight);

  const wDelta = currentWeight - startW;
  const lbsToGo = +(currentWeight - targetW).toFixed(1);
  const totalNeeded = startW - targetW;
  const pctToGoal = totalNeeded !== 0 ? Math.max(0, Math.min(100, ((startW - currentWeight) / totalNeeded) * 100)) : 0;
  const cuttingGoal = profile.goal === 'fatloss';
  const bulkingGoal = profile.goal === 'muscle';

  const logWeight = () => {
    if (!newWeight) return;
    setState((p) => ({
      ...p,
      wlog: [...p.wlog.filter((w) => w.date !== newDate), { date: newDate, weight: +newWeight }],
    }));
    setNewWeight('');
    setNewDate(todayISO());
  };

  const deleteWeight = (date) => {
    setState((p) => ({ ...p, wlog: p.wlog.filter((w) => w.date !== date) }));
  };

  const lossOrGain = wDelta < 0 ? 'LOST' : wDelta > 0 ? 'GAINED' : 'CHANGED';
  const goalProgressColor = cuttingGoal ? (wDelta < 0 ? GREEN : RED) : bulkingGoal ? (wDelta > 0 ? GREEN : RED) : TEXT_DIM;

  return (
    <div>
      {/* Goal Progress */}
      <Card style={{ marginBottom: 12 }}>
        <Label>GOAL PROGRESS</Label>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
          <span style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 30, color: '#fff' }}>{pctToGoal.toFixed(0)}%</span>
          <span style={{ fontSize: 11, color: TEXT_DIM }}>to goal</span>
        </div>
        <div style={{ background: CARD2, borderRadius: 4, height: 8, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ background: `linear-gradient(90deg, ${BLUE}, ${ACCENT})`, height: '100%', width: `${pctToGoal}%`, transition: 'width .3s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: TEXT_MUTED, fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1 }}>
          <span>{startW} lbs</span>
          <span>{targetW} lbs</span>
        </div>
        <div style={{ marginTop: 8, fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 12, color: goalProgressColor, letterSpacing: 1 }}>
          {Math.abs(wDelta).toFixed(1)} lbs {lossOrGain} · {Math.abs(lbsToGo).toFixed(1)} lbs to go
        </div>
      </Card>

      {/* Two col: Log Weight + Macros & Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <Card>
          <Label>LOG WEIGHT</Label>
          <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} style={{ marginBottom: 6 }} />
          <Input type="number" step="0.1" placeholder="lbs" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} />
          <Btn onClick={logWeight} style={{ width: '100%', marginTop: 8 }}>SAVE</Btn>
        </Card>

        <Card>
          <Label>MACROS & STATS</Label>
          <div style={{ display: 'grid', gap: 4, fontSize: 11 }}>
            {[
              { l: 'START', v: `${startW} lbs` },
              { l: 'CURRENT', v: `${currentWeight} lbs` },
              { l: 'TARGET', v: `${targetW} lbs` },
              { l: 'CHANGE', v: `${wDelta >= 0 ? '+' : ''}${wDelta.toFixed(1)} lbs`, color: goalProgressColor },
              { l: 'CALORIES', v: macros.calories, color: ACCENT },
              { l: 'PROTEIN', v: `${macros.protein}g`, color: BLUE },
              { l: 'CARBS', v: `${macros.carbs}g`, color: ORANGE },
              { l: 'FAT', v: `${macros.fat}g`, color: PURPLE },
            ].map((s) => (
              <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ color: TEXT_MUTED, fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1, fontSize: 10 }}>{s.l}</span>
                <span style={{ fontFamily: 'Impact, Arial Black, sans-serif', color: s.color || '#fff', fontSize: 12 }}>{s.v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Weight history with d-o-d delta */}
      <Card>
        <H size={13}>HISTORY</H>
        {sortedLog.length === 0 && <div style={{ color: TEXT_DIM, fontSize: 12 }}>No entries yet.</div>}
        {sortedLog.map((w, i) => {
          const next = sortedLog[i + 1]; // older entry
          const dod = next ? +(w.weight - next.weight).toFixed(1) : null;
          const dodColor = dod == null ? TEXT_DIM : dod < 0 ? GREEN : dod > 0 ? RED : TEXT_DIM;
          return (
            <div key={w.date} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ flex: 1, fontSize: 11, color: TEXT_DIM }}>{formatDate(w.date)}</div>
              <div style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 14, color: '#fff' }}>{w.weight} lbs</div>
              {dod != null && <Pill color={dodColor}>{dod >= 0 ? '+' : ''}{dod}</Pill>}
              <button onClick={() => deleteWeight(w.date)} style={{
                background: 'transparent', color: TEXT_MUTED, border: 'none',
                cursor: 'pointer', fontSize: 14, padding: 4,
              }}>×</button>
            </div>
          );
        })}
      </Card>
    </div>
  );
};

// ============================================================
// FOOD SEARCH (Claude API)
// ============================================================
const searchFoodDB = async (query) => {
  try {
    const sysPrompt = `You are a nutrition database. The user will search for a food item or restaurant menu item. Return a JSON array of 4-8 matching items. Cover USDA whole foods (eggs, chicken, rice, oats, etc.) and major US chains: Chipotle, Chick-fil-A, Starbucks, Subway, McDonald's, Burger King, Wendy's, Taco Bell, Domino's, Pizza Hut, Cava, Panera, Dunkin', Texas Roadhouse, Olive Garden, Five Guys, In-N-Out, Whataburger, Shake Shack, Sonic, Panda Express, Jersey Mike's, Jimmy John's, Raising Cane's, Popeyes. Each item must include: name (string, restaurant prefix if applicable, e.g., "Chipotle Chicken Burrito Bowl"), serving (string), cal (number), p (number), c (number), f (number). Return ONLY raw JSON array, no preamble, no markdown fences.`;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: sysPrompt,
        messages: [{ role: 'user', content: query }],
      }),
    });
    const data = await response.json();
    const text = (data.content || []).map((c) => c.text || '').join('').replace(/```json|```/g, '').trim();
    const arr = JSON.parse(text);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.error('food search', e);
    return [];
  }
};

// ============================================================
// FOOD VIEW
// ============================================================
const Food = ({ state, setState, onCoachPrompt }) => {
  const { profile, food, wlog } = state;
  const [viewISO, setViewISO] = useState(todayISO());
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manual, setManual] = useState({ name: '', cal: '', p: '', c: '', f: '', qty: 1 });

  const currentWeight = wlog.length ? [...wlog].sort((a, b) => (a.date < b.date ? 1 : -1))[0].weight : profile.weight;
  const macros = calcMacros(profile, currentWeight);
  const todaysFood = food[viewISO] || [];
  const totals = todaysFood.reduce(
    (acc, f) => ({
      cal: acc.cal + (+f.cal || 0) * (f.qty || 1),
      p: acc.p + (+f.p || 0) * (f.qty || 1),
      c: acc.c + (+f.c || 0) * (f.qty || 1),
      f: acc.f + (+f.f || 0) * (f.qty || 1),
    }),
    { cal: 0, p: 0, c: 0, f: 0 }
  );
  const remaining = {
    cal: macros.calories - totals.cal,
    p: macros.protein - totals.p,
    c: macros.carbs - totals.c,
    f: macros.fat - totals.f,
  };
  const anyNeg = remaining.cal < 0 || remaining.p < 0 || remaining.c < 0 || remaining.f < 0;

  const search = async (q) => {
    if (!q.trim()) return;
    setSearching(true);
    const items = await searchFoodDB(q);
    setResults(items);
    setSearching(false);
  };

  const addFood = (item) => {
    setState((p) => {
      const day = p.food[viewISO] || [];
      return { ...p, food: { ...p.food, [viewISO]: [...day, { ...item, id: 'f_' + Date.now() + Math.random(), qty: item.qty || 1 }] } };
    });
  };

  const removeFood = (id) => {
    setState((p) => {
      const day = (p.food[viewISO] || []).filter((f) => f.id !== id);
      return { ...p, food: { ...p.food, [viewISO]: day } };
    });
  };

  const submitManual = () => {
    if (!manual.name) return;
    addFood({
      name: manual.name,
      cal: +manual.cal || 0,
      p: +manual.p || 0,
      c: +manual.c || 0,
      f: +manual.f || 0,
      qty: +manual.qty || 1,
    });
    setManual({ name: '', cal: '', p: '', c: '', f: '', qty: 1 });
    setManualMode(false);
  };

  const isAlreadyAdded = (item) => todaysFood.some((f) => f.name === item.name);

  // 7-day rolling avg chart
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = dateOffsetISO(-i);
    const dayItems = food[d] || [];
    const sum = dayItems.reduce((a, f) => a + (+f.cal || 0) * (f.qty || 1), 0);
    last7.push({ date: d, cal: sum });
  }
  const maxCal = Math.max(macros.calories * 1.3, ...last7.map((d) => d.cal));

  return (
    <div>
      {/* Date nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Btn size="sm" variant="ghost" onClick={() => {
          const d = isoToDate(viewISO); d.setDate(d.getDate() - 1); setViewISO(dateToISO(d));
        }}>‹</Btn>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 13, color: TEXT_DIM, letterSpacing: 1 }}>
          {viewISO === todayISO() ? 'TODAY' : viewISO === dateOffsetISO(-1) ? 'YESTERDAY' : formatDate(viewISO).toUpperCase()}
        </div>
        <Btn size="sm" variant="ghost" onClick={() => {
          const d = isoToDate(viewISO); d.setDate(d.getDate() + 1); setViewISO(dateToISO(d));
        }}>›</Btn>
      </div>

      {/* Day balance card */}
      <Card style={{ marginBottom: 10, border: anyNeg ? `2px solid ${RED}` : `1px solid ${BORDER}` }}>
        <Label>DAY BALANCE</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { l: 'CAL', cur: totals.cal, max: macros.calories, color: ACCENT, rem: remaining.cal },
            { l: 'P', cur: totals.p, max: macros.protein, color: BLUE, rem: remaining.p, unit: 'g' },
            { l: 'C', cur: totals.c, max: macros.carbs, color: ORANGE, rem: remaining.c, unit: 'g' },
            { l: 'F', cur: totals.f, max: macros.fat, color: PURPLE, rem: remaining.f, unit: 'g' },
          ].map((m) => (
            <div key={m.l}>
              <div style={{ fontSize: 9, color: TEXT_MUTED, fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1 }}>{m.l}</div>
              <div style={{ fontSize: 14, color: '#fff', fontFamily: 'Impact, Arial Black, sans-serif' }}>{Math.round(m.cur)}</div>
              <div style={{ fontSize: 9, color: m.rem < 0 ? RED : TEXT_MUTED }}>{m.rem >= 0 ? `${Math.round(m.rem)}${m.unit || ''} left` : `${Math.abs(Math.round(m.rem))}${m.unit || ''} OVER`}</div>
              <ProgressBar value={m.cur} max={m.max} color={m.color} height={2} />
            </div>
          ))}
        </div>
      </Card>

      {/* Quick chips + search */}
      <Card style={{ marginBottom: 10 }}>
        <Label>QUICK PICK</Label>
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4, marginBottom: 8 }}>
          {RESTAURANT_CHIPS.map((c) => (
            <button key={c.name} onClick={() => { setQuery(c.name); search(c.name); }} style={{
              background: CARD2, color: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14,
              padding: '5px 10px', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 4,
              fontFamily: 'Helvetica, Arial, sans-serif',
            }}>
              <span>{c.emoji}</span><span style={{ fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1, fontSize: 10 }}>{c.name.toUpperCase()}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Input placeholder="Search foods or chains..." value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search(query)} />
          <Btn onClick={() => search(query)} disabled={searching}>{searching ? '…' : 'GO'}</Btn>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <Btn size="sm" variant="ghost" onClick={() => setManualMode(!manualMode)}>
            {manualMode ? 'HIDE MANUAL' : '+ MANUAL ENTRY'}
          </Btn>
          <Btn size="sm" variant="accent2" onClick={() => onCoachPrompt(`Suggest foods to fill: ${Math.round(remaining.cal)}cal, ${Math.round(remaining.p)}p, ${Math.round(remaining.c)}c, ${Math.round(remaining.f)}f remaining today and add them`)}>FILL MACROS</Btn>
        </div>

        {manualMode && (
          <div style={{ marginTop: 10, padding: 10, background: CARD2, borderRadius: 6 }}>
            <Input placeholder="Food name" value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} />
            <div style={{ height: 6 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
              <Input type="number" placeholder="cal" value={manual.cal} onChange={(e) => setManual({ ...manual, cal: e.target.value })} />
              <Input type="number" placeholder="p" value={manual.p} onChange={(e) => setManual({ ...manual, p: e.target.value })} />
              <Input type="number" placeholder="c" value={manual.c} onChange={(e) => setManual({ ...manual, c: e.target.value })} />
              <Input type="number" placeholder="f" value={manual.f} onChange={(e) => setManual({ ...manual, f: e.target.value })} />
            </div>
            <Btn onClick={submitManual} style={{ marginTop: 8, width: '100%' }}>ADD</Btn>
          </div>
        )}

        {/* Search results */}
        {results.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, color: TEXT_MUTED, fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{results.length} RESULTS · TAP TO ADD</span>
              <span style={{ flex: 1 }} />
              <button onClick={() => { setResults([]); setQuery(''); }} style={{ background: 'transparent', color: TEXT_MUTED, border: 'none', cursor: 'pointer', fontSize: 14 }}>×</button>
            </div>
            {results.map((r, i) => {
              const added = isAlreadyAdded(r);
              return (
                <button key={i} onClick={() => addFood(r)} style={{
                  display: 'block', width: '100%',
                  background: added ? `${GREEN}14` : CARD2,
                  color: '#fff', border: `1px solid ${BORDER}`,
                  borderRadius: 6, padding: 8, marginBottom: 4,
                  cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: '#fff' }}>{r.name}</div>
                      <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 2 }}>{r.serving || ''} · {r.cal} cal · {r.p}p {r.c}c {r.f}f</div>
                    </div>
                    {added ? (
                      <Pill color={GREEN}>✓ ADDED</Pill>
                    ) : (
                      <Pill color={ACCENT}>+ ADD</Pill>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Today's food log */}
      <Card style={{ marginBottom: 10 }}>
        <H size={13}>LOGGED ({todaysFood.length})</H>
        {todaysFood.length === 0 && <div style={{ color: TEXT_DIM, fontSize: 12 }}>Nothing logged yet.</div>}
        {todaysFood.map((f) => (
          <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#fff' }}>{f.name}{f.qty > 1 ? ` ×${f.qty}` : ''}</div>
              <div style={{ fontSize: 10, color: TEXT_MUTED }}>{Math.round((+f.cal || 0) * (f.qty || 1))} cal · {Math.round((+f.p || 0) * (f.qty || 1))}p {Math.round((+f.c || 0) * (f.qty || 1))}c {Math.round((+f.f || 0) * (f.qty || 1))}f</div>
            </div>
            <button onClick={() => removeFood(f.id)} style={{ background: 'transparent', color: TEXT_MUTED, border: 'none', cursor: 'pointer', fontSize: 14 }}>×</button>
          </div>
        ))}
      </Card>

      {/* 7-day rolling avg chart */}
      <Card>
        <H size={13}>7-DAY CALORIES</H>
        <div style={{ fontSize: 10, color: TEXT_MUTED, marginBottom: 8 }}>
          RP method: weekly average matters more than daily perfection
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, alignItems: 'end', height: 100 }}>
          {last7.map((d) => {
            const target = macros.calories;
            const ratio = d.cal / Math.max(1, target);
            const color = Math.abs(ratio - 1) < 0.15 ? GREEN : ratio < 0.85 ? ORANGE : RED;
            const h = (d.cal / Math.max(1, maxCal)) * 90;
            return (
              <button key={d.date} onClick={() => setViewISO(d.date)} style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%',
              }}>
                <div style={{
                  background: color,
                  width: '100%',
                  height: `${h}px`,
                  minHeight: 2,
                  borderRadius: '3px 3px 0 0',
                  opacity: d.date === viewISO ? 1 : 0.6,
                }} />
                <div style={{ fontSize: 9, color: TEXT_MUTED, marginTop: 2, fontFamily: 'Impact, Arial Black, sans-serif' }}>{DAY_LETTERS[getDayIdx(d.date)]}</div>
                <div style={{ fontSize: 8, color: d.cal > 0 ? color : TEXT_MUTED }}>{Math.round(d.cal)}</div>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 8, fontSize: 10, color: TEXT_MUTED, fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1, textAlign: 'center' }}>
          AVG: {Math.round(last7.reduce((a, d) => a + d.cal, 0) / 7)} CAL · TARGET: {macros.calories}
        </div>
      </Card>
    </div>
  );
};

// ============================================================
// JOURNAL VIEW
// ============================================================
const Journal = ({ state, setState }) => {
  const { jlog } = state;
  const [viewISO, setViewISO] = useState(todayISO());
  const todayEntry = jlog.find((e) => e.date === viewISO);
  const [mood, setMood] = useState(todayEntry?.mood ?? null);
  const [notes, setNotes] = useState(todayEntry?.notes || '');

  useEffect(() => {
    const e = jlog.find((x) => x.date === viewISO);
    setMood(e?.mood ?? null);
    setNotes(e?.notes || '');
  }, [viewISO]);

  const save = () => {
    if (mood == null && !notes.trim()) return;
    setState((p) => ({
      ...p,
      jlog: [...p.jlog.filter((e) => e.date !== viewISO), { date: viewISO, mood, notes }],
    }));
  };

  const recent = [...jlog].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 10);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Btn size="sm" variant="ghost" onClick={() => {
          const d = isoToDate(viewISO); d.setDate(d.getDate() - 1); setViewISO(dateToISO(d));
        }}>‹</Btn>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 13, color: TEXT_DIM, letterSpacing: 1 }}>
          {viewISO === todayISO() ? 'TODAY' : viewISO === dateOffsetISO(-1) ? 'YESTERDAY' : formatDate(viewISO).toUpperCase()}
        </div>
        <Btn size="sm" variant="ghost" onClick={() => {
          const d = isoToDate(viewISO); d.setDate(d.getDate() + 1); setViewISO(dateToISO(d));
        }}>›</Btn>
      </div>

      <Card style={{ marginBottom: 12 }}>
        <Label>MOOD</Label>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {MOOD_OPTIONS.map((emoji, i) => (
            <button key={i} onClick={() => setMood(i)} style={{
              flex: 1,
              background: mood === i ? `${ACCENT}33` : CARD2,
              border: `1px solid ${mood === i ? ACCENT : BORDER}`,
              borderRadius: 6, padding: 10, cursor: 'pointer',
              fontSize: 26,
            }}>
              <div>{emoji}</div>
              <div style={{ fontSize: 8, color: TEXT_MUTED, fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1, marginTop: 2 }}>{MOOD_LABELS[i].toUpperCase()}</div>
            </button>
          ))}
        </div>
        <Label>NOTES</Label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What went well? What's hard right now?" style={{
          width: '100%', minHeight: 100, background: CARD2, border: `1px solid ${BORDER}`,
          borderRadius: 6, color: '#fff', padding: 8, fontSize: 13,
          fontFamily: 'Helvetica, Arial, sans-serif', outline: 'none', boxSizing: 'border-box',
          resize: 'vertical',
        }} />
        <Btn onClick={save} style={{ marginTop: 8, width: '100%' }}>SAVE ENTRY</Btn>
      </Card>

      <Card>
        <H size={13}>RECENT</H>
        {recent.length === 0 && <div style={{ color: TEXT_DIM, fontSize: 12 }}>No entries yet.</div>}
        {recent.map((e) => (
          <button key={e.date} onClick={() => setViewISO(e.date)} style={{
            display: 'block', width: '100%', textAlign: 'left',
            background: 'transparent', border: 'none', borderBottom: `1px solid ${BORDER}`,
            color: '#fff', padding: '8px 0', cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 11, color: TEXT_MUTED, fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1, minWidth: 90 }}>{formatDate(e.date).toUpperCase()}</div>
              <div style={{ fontSize: 20 }}>{e.mood != null ? MOOD_OPTIONS[e.mood] : ''}</div>
              <div style={{ flex: 1, fontSize: 11, color: TEXT_DIM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {(e.notes || '').slice(0, 160)}
              </div>
            </div>
          </button>
        ))}
      </Card>
    </div>
  );
};

// ============================================================
// PROGRAM SUMMARY MODAL
// ============================================================
const ProgramSummary = ({ state, onClose, onAcknowledge, onStartNew }) => {
  const { profile, sessions, wlog, runs } = state;

  // Top 8 lifts by est 1RM
  const lifts = {};
  Object.values(sessions).forEach((s) => {
    if (!s.setLogs) return;
    Object.entries(s.setLogs).forEach(([k, v]) => {
      const exName = k.split('__')[0];
      if (v.weight && v.reps) {
        const rm = est1RM(+v.weight, +v.reps);
        if (!lifts[exName] || rm > lifts[exName].rm) {
          lifts[exName] = { name: exName, rm, weight: +v.weight, reps: +v.reps, date: s.iso };
        }
      }
    });
  });
  const topLifts = Object.values(lifts).sort((a, b) => b.rm - a.rm).slice(0, 8);

  // Consistency
  const totalSessions = Object.values(sessions).length;
  const completed = Object.values(sessions).filter((s) => s.done).length;
  const skipped = Object.values(sessions).filter((s) => s.skipped).length;
  const completionRate = totalSessions ? Math.round((completed / totalSessions) * 100) : 0;

  // Body weight
  const sortedW = [...wlog].sort((a, b) => (a.date < b.date ? -1 : 1));
  const startW = sortedW[0]?.weight || profile.weight;
  const endW = sortedW[sortedW.length - 1]?.weight || startW;
  const wDelta = endW - startW;
  const targetReached = Math.abs(endW - profile.target) <= 2;

  // Running stats
  const totalRuns = runs.length;
  const totalMi = runs.reduce((a, r) => a + (r.distMi || 0), 0);
  const longest = runs.reduce((acc, r) => (r.distMi > (acc?.distMi || 0) ? r : acc), null);
  const fastest = [...runs].filter((r) => r.paceSec).sort((a, b) => a.paceSec - b.paceSec)[0];

  const fmtSec = (sec) => {
    if (!sec) return '—';
    const h = Math.floor(sec / 3600); const m = Math.floor((sec % 3600) / 60); const s = Math.floor(sec % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const wColor = wDelta < 0 ? GREEN : wDelta > 0 ? BLUE : TEXT_DIM;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.95)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: 14, zIndex: 200, overflowY: 'auto',
    }}>
      <div style={{
        background: BG,
        border: `2px solid ${ACCENT}`,
        borderRadius: 12,
        padding: 20,
        width: '100%',
        maxWidth: 460,
        marginTop: 30,
        marginBottom: 40,
        boxShadow: `0 0 40px ${ACCENT}55`,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 14, color: TEXT_MUTED, fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 2 }}>PROGRAM COMPLETE</div>
          <H size={26} style={{ marginTop: 4 }}>
            <span style={{ color: ACCENT }}>{profile.weeks} WEEK</span>
            <span style={{ color: ORANGE }}> SUMMARY</span>
          </H>
          <div style={{ fontSize: 11, color: TEXT_DIM }}>{WORKOUT_STYLES.find((s) => s.id === profile.workoutStyle)?.name}</div>
        </div>

        {/* Body Weight */}
        <Card style={{ marginBottom: 10 }}>
          <Label>BODY WEIGHT</Label>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 24, color: '#fff' }}>{startW}</span>
            <span style={{ color: wColor, fontSize: 18 }}>→</span>
            <span style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 24, color: wColor }}>{endW}</span>
            <span style={{ fontSize: 12, color: TEXT_DIM }}>lbs</span>
            {targetReached && <Pill color={GREEN}>✓ TARGET REACHED</Pill>}
          </div>
          <div style={{ marginTop: 6, padding: 6, background: `${wColor}15`, borderRadius: 4, display: 'inline-block' }}>
            <span style={{ color: wColor, fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1, fontSize: 12 }}>
              {wDelta >= 0 ? '+' : ''}{wDelta.toFixed(1)} LBS
            </span>
          </div>
        </Card>

        {/* Top lifts */}
        <Card style={{ marginBottom: 10 }}>
          <Label>TOP LIFTS (EST. 1RM)</Label>
          {topLifts.length === 0 && <div style={{ color: TEXT_DIM, fontSize: 12 }}>No lifts logged.</div>}
          {topLifts.map((l) => (
            <div key={l.name} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '4px 0', borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ flex: 1, fontSize: 12, color: '#fff' }}>{l.name}</span>
              <span style={{ fontFamily: 'Impact, Arial Black, sans-serif', color: ACCENT, fontSize: 14 }}>{l.rm} lbs</span>
              <span style={{ fontSize: 9, color: TEXT_MUTED, minWidth: 70, textAlign: 'right' }}>{l.weight}×{l.reps} · {formatDate(l.date)}</span>
            </div>
          ))}
        </Card>

        {/* Consistency */}
        <Card style={{ marginBottom: 10 }}>
          <Label>CONSISTENCY</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
            <div>
              <div style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 22, color: GREEN }}>{completed}</div>
              <div style={{ fontSize: 9, color: TEXT_MUTED, fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1 }}>COMPLETED</div>
            </div>
            <div>
              <div style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 22, color: RED }}>{skipped}</div>
              <div style={{ fontSize: 9, color: TEXT_MUTED, fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1 }}>SKIPPED</div>
            </div>
            <div>
              <div style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 22, color: YELLOW }}>{completionRate}%</div>
              <div style={{ fontSize: 9, color: TEXT_MUTED, fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1 }}>RATE</div>
            </div>
          </div>
        </Card>

        {/* Running */}
        {totalRuns > 0 && (
          <Card style={{ marginBottom: 14 }}>
            <Label>RUNNING</Label>
            <div style={{ fontSize: 12, color: '#fff', display: 'grid', gap: 4 }}>
              <div>Total runs: <strong style={{ color: ACCENT }}>{totalRuns}</strong></div>
              <div>Total miles: <strong style={{ color: ACCENT }}>{totalMi.toFixed(1)}</strong></div>
              {longest && <div>Longest run: <strong style={{ color: ACCENT }}>{longest.distMi.toFixed(1)} mi</strong> ({fmtSec(longest.totalSec)})</div>}
              {fastest && <div>Fastest pace: <strong style={{ color: ACCENT }}>{Math.floor(fastest.paceSec / 60)}:{String(Math.round(fastest.paceSec % 60)).padStart(2, '0')}/mi</strong> ({fastest.distMi.toFixed(1)} mi)</div>}
            </div>
          </Card>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {onClose && <Btn variant="ghost" onClick={onClose}>VIEW LATER</Btn>}
          <div style={{ flex: 1 }} />
          {onStartNew && <Btn variant="orange" onClick={onStartNew}>START NEW PROGRAM</Btn>}
          {!onStartNew && onAcknowledge && <Btn onClick={onAcknowledge}>OK</Btn>}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SCHEDULE EDITOR (used in Backup view)
// ============================================================
const ScheduleEditor = ({ profile, onSave }) => {
  const [draft, setDraft] = useState([...profile.schedule]);
  const [dirty, setDirty] = useState(false);
  const dayTypes = DAY_TYPES_BY_STYLE[profile.workoutStyle] || [];
  const presets = SPLIT_PRESETS[profile.workoutStyle] || [];

  // If style changed and current schedule is invalid, auto-reset
  useEffect(() => {
    if (!validateSchedule(draft, profile.workoutStyle)) {
      setDraft(defaultScheduleForStyle(profile.workoutStyle));
      setDirty(true);
    }
  }, [profile.workoutStyle]);

  const updateDay = (idx, val) => {
    const next = [...draft]; next[idx] = val;
    setDraft(next); setDirty(true);
  };

  const swap = (i, j) => {
    if (j < 0 || j >= 7) return;
    const next = [...draft]; [next[i], next[j]] = [next[j], next[i]];
    setDraft(next); setDirty(true);
  };

  const reset = () => {
    setDraft(defaultScheduleForStyle(profile.workoutStyle));
    setDirty(true);
  };

  const apply = (preset) => {
    setDraft([...preset.days]);
    setDirty(true);
  };

  const save = () => {
    onSave(draft);
    setDirty(false);
  };

  const styleName = WORKOUT_STYLES.find((s) => s.id === profile.workoutStyle)?.name || '';
  const workoutDayCount = draft.filter((d) => d !== 'REST').length;

  return (
    <Card style={{ marginBottom: 10 }}>
      <H size={14}>SCHEDULE EDITOR</H>
      <div style={{ fontSize: 10, color: TEXT_MUTED, marginBottom: 8 }}>
        Style: <span style={{ color: ACCENT }}>{styleName}</span> · {workoutDayCount} workout days/wk
      </div>
      {dirty && (
        <div style={{ background: `${YELLOW}22`, border: `1px solid ${YELLOW}88`, padding: 6, borderRadius: 4, fontSize: 10, color: YELLOW, fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1, marginBottom: 8 }}>
          ⚠ UNSAVED CHANGES
        </div>
      )}
      {presets.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <Label>PRESETS</Label>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {presets.map((p) => (
              <button key={p.name} onClick={() => apply(p)} style={{
                background: 'transparent', color: ACCENT, border: `1px solid ${ACCENT}`,
                padding: '4px 8px', borderRadius: 12, fontSize: 9,
                fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1, cursor: 'pointer',
              }}>{p.name.toUpperCase()}</button>
            ))}
            <button onClick={reset} style={{
              background: 'transparent', color: TEXT_DIM, border: `1px solid ${BORDER}`,
              padding: '4px 8px', borderRadius: 12, fontSize: 9,
              fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1, cursor: 'pointer',
            }}>RESET TO DEFAULT</button>
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gap: 6 }}>
        {DAYS.map((day, i) => {
          const c = DAY_TYPE_COLOR[draft[i]] || TEXT_MUTED;
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 28px 28px', gap: 6, alignItems: 'center' }}>
              <div style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 12, color: TEXT_DIM, letterSpacing: 1 }}>{day}</div>
              <Select value={draft[i]} onChange={(e) => updateDay(i, e.target.value)} style={{ color: c }}>
                {dayTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
              <button onClick={() => swap(i, i - 1)} disabled={i === 0} style={{
                background: 'transparent', color: i === 0 ? TEXT_MUTED : '#fff',
                border: `1px solid ${BORDER}`, borderRadius: 4, padding: 5, cursor: i === 0 ? 'not-allowed' : 'pointer', fontSize: 12,
              }}>↑</button>
              <button onClick={() => swap(i, i + 1)} disabled={i === 6} style={{
                background: 'transparent', color: i === 6 ? TEXT_MUTED : '#fff',
                border: `1px solid ${BORDER}`, borderRadius: 4, padding: 5, cursor: i === 6 ? 'not-allowed' : 'pointer', fontSize: 12,
              }}>↓</button>
            </div>
          );
        })}
      </div>
      {dirty && (
        <Btn onClick={save} style={{ marginTop: 10, width: '100%' }}>SAVE SCHEDULE</Btn>
      )}
    </Card>
  );
};

// ============================================================
// BACKUP VIEW
// ============================================================
const Backup = ({ state, setState, onShowSummary }) => {
  const { profile } = state;
  const [editing, setEditing] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ ...profile });
  const [setWeekVal, setSetWeekVal] = useState(state.week);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef(null);

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recomp-backup-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.profile) {
          alert('Invalid backup file');
          return;
        }
        setState((p) => ({ ...defaultState(), ...parsed }));
        alert('Backup imported successfully');
      } catch {
        alert('Could not parse backup file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const saveProfile = () => {
    setState((p) => {
      // If style changed and current schedule invalid, reset to default
      let schedule = profileDraft.schedule;
      if (!validateSchedule(schedule, profileDraft.workoutStyle)) {
        schedule = defaultScheduleForStyle(profileDraft.workoutStyle);
      }
      return { ...p, profile: { ...profileDraft, schedule } };
    });
    setEditing(false);
  };

  const saveSchedule = (newSchedule) => {
    setState((p) => ({ ...p, profile: { ...p.profile, schedule: newSchedule } }));
  };

  const setWeek = () => {
    setState((p) => ({ ...p, week: Math.max(1, Math.min(p.profile.weeks, +setWeekVal || 1)) }));
  };

  const resetAll = async () => {
    if (window.storage) await window.storage.delete(STORAGE_KEY).catch(() => {});
    setState(defaultState());
    setConfirmReset(false);
  };

  const previewMacros = profileDraft.weight ? calcMacros(profileDraft, profileDraft.weight) : null;

  return (
    <div>
      {/* Schedule editor at top */}
      <ScheduleEditor profile={profile} onSave={saveSchedule} />

      {/* Edit Profile */}
      <Card style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <H size={14} mb={0}>EDIT PROFILE</H>
          {!editing ? (
            <Btn size="sm" variant="ghost" onClick={() => { setProfileDraft({ ...profile }); setEditing(true); }}>EDIT</Btn>
          ) : (
            <div style={{ display: 'flex', gap: 4 }}>
              <Btn size="sm" variant="ghost" onClick={() => setEditing(false)}>CANCEL</Btn>
              <Btn size="sm" onClick={saveProfile}>SAVE</Btn>
            </div>
          )}
        </div>
        {editing && (
          <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
            <div><Label>NAME</Label><Input value={profileDraft.name} onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><Label>AGE</Label><Input type="number" value={profileDraft.age} onChange={(e) => setProfileDraft({ ...profileDraft, age: +e.target.value })} /></div>
              <div><Label>SEX</Label><Select value={profileDraft.sex} onChange={(e) => setProfileDraft({ ...profileDraft, sex: e.target.value })}><option value="male">Male</option><option value="female">Female</option></Select></div>
            </div>
            <div><Label>HEIGHT</Label><Input value={profileDraft.height} onChange={(e) => setProfileDraft({ ...profileDraft, height: e.target.value })} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><Label>WEIGHT</Label><Input type="number" value={profileDraft.weight} onChange={(e) => setProfileDraft({ ...profileDraft, weight: +e.target.value })} /></div>
              <div><Label>TARGET</Label><Input type="number" value={profileDraft.target} onChange={(e) => setProfileDraft({ ...profileDraft, target: +e.target.value })} /></div>
            </div>
            <div>
              <Label>GOAL</Label>
              <Select value={profileDraft.goal} onChange={(e) => setProfileDraft({ ...profileDraft, goal: e.target.value })}>
                {GOAL_OPTIONS.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </Select>
            </div>
            <div>
              <Label>ACTIVITY</Label>
              <Select value={profileDraft.activity} onChange={(e) => setProfileDraft({ ...profileDraft, activity: e.target.value })}>
                {ACTIVITY_LEVELS.map((a) => <option key={a.id} value={a.id}>{a.name} (×{a.mult})</option>)}
              </Select>
            </div>
            <div>
              <Label>PROGRAM LENGTH</Label>
              <Select value={profileDraft.weeks} onChange={(e) => setProfileDraft({ ...profileDraft, weeks: +e.target.value })}>
                {PROGRAM_LENGTHS.map((w) => <option key={w} value={w}>{w} weeks</option>)}
              </Select>
            </div>
            <div>
              <Label>WORKOUT STYLE</Label>
              <Select value={profileDraft.workoutStyle} onChange={(e) => setProfileDraft({ ...profileDraft, workoutStyle: e.target.value })}>
                {WORKOUT_STYLES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
            {(profileDraft.workoutStyle === 'hyrox' || profileDraft.workoutStyle === 'hyrox_hybrid') && (
              <>
                <div><Label>RACE DATE</Label><Input type="date" value={profileDraft.raceDate || ''} onChange={(e) => setProfileDraft({ ...profileDraft, raceDate: e.target.value })} /></div>
                <div><Label>DIVISION</Label>
                  <Select value={profileDraft.raceDivision} onChange={(e) => setProfileDraft({ ...profileDraft, raceDivision: e.target.value })}>
                    {HYROX_TARGETS.map((t) => <option key={t.div} value={t.div}>{t.div}</option>)}
                  </Select>
                </div>
              </>
            )}
            {previewMacros && (
              <div style={{ background: CARD2, padding: 8, borderRadius: 6 }}>
                <div style={{ fontSize: 10, color: ACCENT, fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1, marginBottom: 4 }}>LIVE MACRO PREVIEW</div>
                <div style={{ fontSize: 11, color: '#fff' }}>{previewMacros.calories} cal · {previewMacros.protein}p · {previewMacros.carbs}c · {previewMacros.fat}f</div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Export */}
      <Card style={{ marginBottom: 10 }}>
        <H size={13}>EXPORT BACKUP</H>
        <div style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 8 }}>Download a JSON backup of all data.</div>
        <Btn onClick={exportData} style={{ width: '100%' }}>DOWNLOAD .JSON</Btn>
      </Card>

      {/* Program Summary */}
      <Card style={{ marginBottom: 10 }}>
        <H size={13}>PROGRAM SUMMARY</H>
        <div style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 8 }}>View achievements and consistency.</div>
        <Btn variant="ghost" onClick={onShowSummary} style={{ width: '100%' }}>VIEW SUMMARY</Btn>
      </Card>

      {/* Import */}
      <Card style={{ marginBottom: 10 }}>
        <H size={13}>IMPORT BACKUP</H>
        <input ref={fileInputRef} type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
        <Btn variant="ghost" onClick={() => fileInputRef.current?.click()} style={{ width: '100%' }}>UPLOAD .JSON</Btn>
      </Card>

      {/* Set Week */}
      <Card style={{ marginBottom: 10 }}>
        <H size={13}>SET WEEK</H>
        <div style={{ display: 'flex', gap: 8 }}>
          <Input type="number" min="1" max={profile.weeks} value={setWeekVal} onChange={(e) => setSetWeekVal(e.target.value)} />
          <Btn onClick={setWeek}>JUMP</Btn>
        </div>
      </Card>

      {/* Reset */}
      <Card style={{ marginBottom: 10, borderColor: RED }}>
        <H size={13} color={RED}>RESET ALL DATA</H>
        <div style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 8 }}>Wipes everything. Cannot be undone.</div>
        {!confirmReset ? (
          <Btn variant="danger" onClick={() => setConfirmReset(true)} style={{ width: '100%' }}>RESET</Btn>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn variant="danger" onClick={resetAll}>YES, RESET</Btn>
            <div style={{ flex: 1 }} />
            <Btn variant="ghost" onClick={() => setConfirmReset(false)}>CANCEL</Btn>
          </div>
        )}
      </Card>
    </div>
  );
};

// ============================================================
// AI COACH — TOOLS
// ============================================================
const COACH_TOOLS = [
  {
    name: 'update_profile',
    description: 'Update one or more athlete profile fields (weight, target, goal, height, age, activity, weeks, workoutStyle, raceDate, raceDivision).',
    input_schema: {
      type: 'object',
      properties: {
        weight: { type: 'number' }, target: { type: 'number' }, age: { type: 'number' },
        height: { type: 'string' }, goal: { type: 'string' }, activity: { type: 'string' },
        weeks: { type: 'number' }, workoutStyle: { type: 'string' },
        raceDate: { type: 'string' }, raceDivision: { type: 'string' },
      },
    },
  },
  { name: 'set_week', description: 'Jump to a specific program week.', input_schema: { type: 'object', properties: { week: { type: 'number' } }, required: ['week'] } },
  { name: 'log_weight', description: 'Log a body weight entry.', input_schema: { type: 'object', properties: { weight: { type: 'number' }, date: { type: 'string', description: 'YYYY-MM-DD' } }, required: ['weight'] } },
  { name: 'add_food', description: 'Add a food entry to a date.', input_schema: { type: 'object', properties: { name: { type: 'string' }, cal: { type: 'number' }, p: { type: 'number' }, c: { type: 'number' }, f: { type: 'number' }, date: { type: 'string' }, qty: { type: 'number' } }, required: ['name'] } },
  { name: 'clear_food_day', description: 'Clear all food logged on a date.', input_schema: { type: 'object', properties: { date: { type: 'string' } }, required: ['date'] } },
  { name: 'mark_session_done', description: 'Mark a workout session as done for a given date.', input_schema: { type: 'object', properties: { date: { type: 'string' } }, required: ['date'] } },
  { name: 'save_journal', description: 'Save a journal entry with mood index 0-4 and text.', input_schema: { type: 'object', properties: { mood: { type: 'number' }, notes: { type: 'string' }, date: { type: 'string' } } } },
  { name: 'set_schedule', description: 'Set the recurring weekly schedule. Array of 7 day types matching current style.', input_schema: { type: 'object', properties: { schedule: { type: 'array', items: { type: 'string' }, minItems: 7, maxItems: 7 } }, required: ['schedule'] } },
  { name: 'swap_days', description: 'Swap day type for a specific day this week (week-override).', input_schema: { type: 'object', properties: { dayIdx: { type: 'number', description: '0=Mon...6=Sun' }, dayType: { type: 'string' } }, required: ['dayIdx', 'dayType'] } },
  { name: 'skip_day', description: 'Mark a date as skipped.', input_schema: { type: 'object', properties: { date: { type: 'string' } }, required: ['date'] } },
  { name: 'log_run', description: 'Log a run.', input_schema: { type: 'object', properties: { distMi: { type: 'number' }, totalSec: { type: 'number' }, type: { type: 'string' }, date: { type: 'string' }, notes: { type: 'string' } }, required: ['distMi', 'totalSec'] } },
  { name: 'switch_tab', description: 'Switch the visible tab.', input_schema: { type: 'object', properties: { tab: { type: 'string', enum: ['dashboard', 'workouts', 'runs', 'metrics', 'food', 'journal', 'backup'] } }, required: ['tab'] } },
  { name: 'reset_week_overrides', description: 'Clear all per-day overrides for current week.', input_schema: { type: 'object', properties: {} } },
];

const handleToolCall = (name, input, state, setState, setActiveTab) => {
  try {
    if (name === 'update_profile') {
      setState((p) => {
        const next = { ...p.profile, ...input };
        // Validate schedule on style change
        if (input.workoutStyle && !validateSchedule(next.schedule, input.workoutStyle)) {
          next.schedule = defaultScheduleForStyle(input.workoutStyle);
        }
        return { ...p, profile: next };
      });
      return `✓ Profile updated: ${Object.keys(input).join(', ')}`;
    }
    if (name === 'set_week') {
      setState((p) => ({ ...p, week: Math.max(1, Math.min(p.profile.weeks, input.week)) }));
      return `✓ Set week to ${input.week}`;
    }
    if (name === 'log_weight') {
      const date = input.date || todayISO();
      setState((p) => ({ ...p, wlog: [...p.wlog.filter((w) => w.date !== date), { date, weight: input.weight }] }));
      return `✓ Logged ${input.weight} lbs on ${date}`;
    }
    if (name === 'add_food') {
      const date = input.date || todayISO();
      const item = {
        id: 'f_' + Date.now() + Math.random(),
        name: input.name, cal: input.cal || 0, p: input.p || 0, c: input.c || 0, f: input.f || 0, qty: input.qty || 1,
      };
      setState((p) => {
        const day = p.food[date] || [];
        return { ...p, food: { ...p.food, [date]: [...day, item] } };
      });
      return `✓ Added ${input.name} to ${date}`;
    }
    if (name === 'clear_food_day') {
      setState((p) => ({ ...p, food: { ...p.food, [input.date]: [] } }));
      return `✓ Cleared food on ${input.date}`;
    }
    if (name === 'mark_session_done') {
      const date = input.date || todayISO();
      const sk = sessionKey(date);
      setState((p) => {
        const cur = p.sessions[sk] || { iso: date, dayType: getDayTypeForDate(p.profile, date).type, setLogs: {}, feedback: {}, exercises: [] };
        return { ...p, sessions: { ...p.sessions, [sk]: { ...cur, done: true, completedAt: new Date().toISOString() } } };
      });
      return `✓ Marked ${date} session done`;
    }
    if (name === 'save_journal') {
      const date = input.date || todayISO();
      setState((p) => ({
        ...p,
        jlog: [...p.jlog.filter((e) => e.date !== date), { date, mood: input.mood ?? null, notes: input.notes || '' }],
      }));
      return `✓ Saved journal for ${date}`;
    }
    if (name === 'set_schedule') {
      if (!Array.isArray(input.schedule) || input.schedule.length !== 7) return '✗ Schedule must be array of 7';
      if (!validateSchedule(input.schedule, state.profile.workoutStyle)) {
        return `✗ Invalid types for ${state.profile.workoutStyle}. Allowed: ${(DAY_TYPES_BY_STYLE[state.profile.workoutStyle] || []).join(', ')}`;
      }
      setState((p) => ({ ...p, profile: { ...p.profile, schedule: input.schedule } }));
      return `✓ Schedule updated`;
    }
    if (name === 'swap_days') {
      const programWeek = getProgramWeek(todayISO(), state.profile.startDate, state.profile.weeks);
      const wKey = `w${programWeek}`;
      setState((p) => {
        const overrides = { ...(p.profile.weekOverrides || {}) };
        overrides[wKey] = { ...(overrides[wKey] || {}), [input.dayIdx]: input.dayType };
        return { ...p, profile: { ...p.profile, weekOverrides: overrides } };
      });
      return `✓ Day ${input.dayIdx} → ${input.dayType} for week ${programWeek}`;
    }
    if (name === 'skip_day') {
      const date = input.date || todayISO();
      const sk = sessionKey(date);
      setState((p) => {
        const cur = p.sessions[sk] || { iso: date, dayType: getDayTypeForDate(p.profile, date).type, setLogs: {}, feedback: {}, exercises: [] };
        return { ...p, sessions: { ...p.sessions, [sk]: { ...cur, skipped: true } } };
      });
      return `✓ Skipped ${date}`;
    }
    if (name === 'log_run') {
      const distMi = input.distMi;
      const distKm = +(distMi * 1.609344).toFixed(3);
      const paceSec = input.totalSec / distMi;
      const newRun = {
        id: 'r_' + Date.now(),
        date: input.date || todayISO(),
        type: input.type || 'easy',
        distMi, distKm,
        totalSec: input.totalSec,
        paceSec, paceKmSec: input.totalSec / distKm,
        notes: input.notes || '',
      };
      setState((p) => ({ ...p, runs: [...p.runs, newRun] }));
      return `✓ Logged ${distMi.toFixed(2)} mi run`;
    }
    if (name === 'switch_tab') {
      setActiveTab(input.tab);
      return `✓ Switched to ${input.tab}`;
    }
    if (name === 'reset_week_overrides') {
      const programWeek = getProgramWeek(todayISO(), state.profile.startDate, state.profile.weeks);
      const wKey = `w${programWeek}`;
      setState((p) => {
        const overrides = { ...(p.profile.weekOverrides || {}) };
        delete overrides[wKey];
        return { ...p, profile: { ...p.profile, weekOverrides: overrides } };
      });
      return `✓ Cleared overrides for week ${programWeek}`;
    }
    return `✗ Unknown tool: ${name}`;
  } catch (e) {
    return `✗ Error: ${e.message}`;
  }
};

// ============================================================
// AI COACH SYSTEM PROMPT BUILDER
// ============================================================
const buildSystemPrompt = (state) => {
  const { profile, week, wlog, food, jlog, sessions, runs } = state;
  const currentWeight = wlog.length ? [...wlog].sort((a, b) => (a.date < b.date ? 1 : -1))[0].weight : profile.weight;
  const macros = calcMacros(profile, currentWeight);

  // Phase / week info per style
  let phaseLine = '';
  if (profile.workoutStyle === 'rp_hyp') {
    const wd = rpWeekData(week, profile.weeks);
    phaseLine = `RP Mesocycle Wk ${week}/${profile.weeks}: ${wd.phase}, RIR ${wd.rir}, ${(wd.setMult * 100).toFixed(0)}% MEV, reps ${wd.repRange}. Volume landmarks per muscle (sets/wk): ${Object.entries(RP_LANDMARKS).map(([m, lm]) => `${m} MEV${lm.MEV}/MAV${lm.MAV}/MRV${lm.MRV}`).join(', ')}.`;
  } else if (profile.workoutStyle === 'hyrox' || profile.workoutStyle === 'hyrox_hybrid') {
    const ph = hyroxPhase(week, profile.weeks);
    phaseLine = `HYROX Phase: ${ph.name} (Wk ${week}/${profile.weeks}). Intervals: ${HYROX_INTERVALS_BY_PHASE[ph.name]?.run}. Race target: ${HYROX_TARGETS.find((t) => t.div === profile.raceDivision)?.target || 'n/a'}.`;
  } else {
    const ph = phaseForWeek(week, profile.weeks);
    phaseLine = `${ph.phase} Wk ${week}/${profile.weeks}: ${ph.sets}×${ph.reps} @ RPE ${ph.rpe}, ${ph.tempo} tempo. Note: ${ph.note}`;
  }

  // Recent sessions (last 5)
  const recentSessions = Object.values(sessions)
    .sort((a, b) => (a.iso < b.iso ? 1 : -1))
    .slice(0, 5)
    .map((s) => {
      const setSummary = Object.entries(s.setLogs || {})
        .filter(([, v]) => v.weight && v.reps)
        .map(([k, v]) => `${k.split('__')[0]} ${v.weight}×${v.reps}${v.done ? '✓' : ''}`)
        .join('; ');
      const fb = s.feedback ? Object.entries(s.feedback).map(([m, v]) => `${m}: pump ${v.pump ?? '-'}/wkld ${v.workload ?? '-'}/sore ${v.soreness ?? '-'}`).join(' | ') : '';
      return `${s.iso} ${s.dayType}${s.done ? ' [done]' : s.skipped ? ' [skipped]' : ''}${setSummary ? ' — ' + setSummary : ''}${fb ? ' · feedback: ' + fb : ''}`;
    });

  // Weight history (last 5)
  const recentW = [...wlog].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5).map((w) => `${w.date}: ${w.weight}lbs`);

  // Today's nutrition
  const todaysFood = food[todayISO()] || [];
  const totals = todaysFood.reduce((acc, f) => ({
    cal: acc.cal + (+f.cal || 0) * (f.qty || 1), p: acc.p + (+f.p || 0) * (f.qty || 1),
    c: acc.c + (+f.c || 0) * (f.qty || 1), f: acc.f + (+f.f || 0) * (f.qty || 1),
  }), { cal: 0, p: 0, c: 0, f: 0 });
  const remaining = `${Math.round(macros.calories - totals.cal)}cal, ${Math.round(macros.protein - totals.p)}p, ${Math.round(macros.carbs - totals.c)}c, ${Math.round(macros.fat - totals.f)}f remaining`;

  // Recent journal (last 3)
  const recentJ = [...jlog].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 3)
    .map((e) => `${e.date} ${MOOD_OPTIONS[e.mood] || ''} ${(e.notes || '').slice(0, 80)}`);

  // Recent runs (last 3)
  const recentRuns = [...runs].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 3)
    .map((r) => `${r.date} ${r.type}: ${r.distMi.toFixed(2)}mi in ${Math.floor(r.totalSec / 60)}:${String(Math.round(r.totalSec % 60)).padStart(2, '0')}`);
  const totalMi = runs.reduce((a, r) => a + (r.distMi || 0), 0);

  return `You are an elite strength & conditioning coach inside the Recomp fitness app. Be direct, energetic, and specific. Use the tools to take action — don't just describe.

ATHLETE: ${profile.name || 'Athlete'} | ${profile.age}yo ${profile.sex} | ${profile.height} | ${currentWeight}lbs → ${profile.target}lbs target
GOAL: ${GOAL_OPTIONS.find((g) => g.id === profile.goal)?.name} | ACTIVITY: ${ACTIVITY_LEVELS.find((a) => a.id === profile.activity)?.name} | ${profile.experience} | ${profile.equipment}
MACROS: ${macros.calories}cal / ${macros.protein}p / ${macros.carbs}c / ${macros.fat}f (BMR ${macros.bmr}, TDEE ${macros.tdee})

TRAINING STYLE: ${WORKOUT_STYLES.find((s) => s.id === profile.workoutStyle)?.name}
${phaseLine}

SCHEDULE: ${(profile.schedule || []).map((d, i) => `${DAYS[i]}=${d}`).join(', ')}
${profile.raceDate ? `RACE: ${profile.raceDate} (${daysUntil(profile.raceDate)} days, ${profile.raceDivision || 'Open M'})` : ''}

RECENT SESSIONS:
${recentSessions.join('\n') || '(none yet)'}

WEIGHT HISTORY: ${recentW.join(' · ') || '(none)'}

TODAY: ${Math.round(totals.cal)}cal / ${Math.round(totals.p)}p / ${Math.round(totals.c)}c / ${Math.round(totals.f)}f logged · ${remaining}

RECENT JOURNAL: ${recentJ.join(' · ') || '(none)'}

RUNS: total ${runs.length} runs / ${totalMi.toFixed(1)}mi · recent: ${recentRuns.join(' · ') || '(none)'}

CAPABILITIES: You can call tools to update profile, log weight, add foods, mark sessions done, save journals, set schedule, swap days, skip days, log runs, switch tabs, set week, reset overrides. When the user says "do X", actually do it via tools rather than describing it.

IMPORTANT: Distinguish between *temporary* week-only changes (use swap_days) vs *permanent* schedule changes (use set_schedule). Always confirm what you did with a 1-line summary. Use **bold** for emphasis.`;
};

// ============================================================
// AI COACH DRAWER
// ============================================================
const CoachDrawer = ({ open, onClose, state, setState, setActiveTab, pendingPrompt, clearPendingPrompt }) => {
  const { profile, conv } = state;
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-fire pending prompt
  useEffect(() => {
    if (pendingPrompt && open && !sending) {
      sendMessage(pendingPrompt);
      clearPendingPrompt();
    }
  }, [pendingPrompt, open]);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [conv, sending, open]);

  const sendMessage = async (text) => {
    const message = (text || input).trim();
    if (!message || sending) return;
    setInput('');
    setSending(true);

    const newConv = [...(conv || []), { role: 'user', content: message }];
    setState((p) => ({ ...p, conv: newConv }));

    try {
      const sysPrompt = buildSystemPrompt({ ...state, conv: newConv });
      // Only send user/assistant turns to the API. Tool entries are UI-only
      // (the Anthropic API rejects role:'tool' — proper tool_use/tool_result
      // pairs are reconstructed inside the multi-turn loop below).
      const lastN = newConv.filter((m) => m.role === 'user' || m.role === 'assistant').slice(-20);
      let messages = lastN.map((m) => ({ role: m.role, content: m.content }));
      let iter = 0;
      let workingConv = [...newConv];

      while (iter < 5) {
        iter++;
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            system: sysPrompt,
            tools: COACH_TOOLS,
            messages,
          }),
        });
        const data = await response.json();
        if (!data.content) {
          workingConv.push({ role: 'assistant', content: '⚠ Coach unavailable. Try again.' });
          break;
        }

        const textBlocks = data.content.filter((b) => b.type === 'text').map((b) => b.text).filter(Boolean);
        const toolUses = data.content.filter((b) => b.type === 'tool_use');

        if (textBlocks.length) {
          const text = textBlocks.join('\n\n');
          workingConv.push({ role: 'assistant', content: text });
          setState((p) => ({ ...p, conv: [...workingConv] }));
        }

        if (toolUses.length === 0) break;

        // Execute tools and feed results back
        const toolResults = [];
        for (const tu of toolUses) {
          const result = handleToolCall(tu.name, tu.input || {}, state, setState, setActiveTab);
          workingConv.push({ role: 'tool', name: tu.name, content: result });
          setState((p) => ({ ...p, conv: [...workingConv] }));
          toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: result });
        }

        messages = [
          ...messages,
          { role: 'assistant', content: data.content },
          { role: 'user', content: toolResults },
        ];

        if (data.stop_reason !== 'tool_use') break;
      }
    } catch (e) {
      console.error('coach send', e);
      const errConv = [...newConv, { role: 'assistant', content: `⚠ Error: ${e.message}` }];
      setState((p) => ({ ...p, conv: errConv }));
    }
    setSending(false);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(120, inputRef.current.scrollHeight) + 'px';
    }
  }, [input]);

  // Render bold **text** as accent
  const renderContent = (text) => {
    if (!text) return null;
    const sanitized = String(text).replace(/<[^>]*>/g, '');
    const parts = sanitized.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: ACCENT }}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const quickPrompts = ['HOW AM I DOING?', 'WHAT SHOULD I EAT?', 'TODAY\'S WORKOUT?', 'ADJUST MY MACROS'];
  const userInitial = (profile.name || 'A').charAt(0).toUpperCase();

  return (
    <div style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      background: BG,
      border: `1px solid ${BORDER}`,
      borderTopLeftRadius: 14, borderTopRightRadius: 14,
      maxWidth: 420, margin: '0 auto',
      height: '68vh',
      transform: open ? 'translateY(0)' : 'translateY(100%)',
      transition: 'transform .3s ease',
      zIndex: 90,
      display: 'flex', flexDirection: 'column',
      boxShadow: `0 -8px 30px rgba(0,0,0,.6)`,
    }}>
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: `linear-gradient(135deg, ${ACCENT}, ${ORANGE})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
        }}>🤖</div>
        <div style={{ flex: 1 }}>
          <H size={14} mb={0}>COACH</H>
          <div style={{ fontSize: 9, color: TEXT_MUTED }}>{sending ? 'Thinking...' : 'Online'}</div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', color: TEXT_DIM, border: 'none', cursor: 'pointer', fontSize: 22, padding: 4 }}>×</button>
      </div>

      {/* Quick prompts */}
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${BORDER}`, display: 'flex', gap: 4, overflowX: 'auto' }}>
        {quickPrompts.map((p) => (
          <button key={p} onClick={() => sendMessage(p)} style={{
            background: 'transparent', color: ACCENT, border: `1px solid ${ACCENT}55`,
            padding: '4px 8px', borderRadius: 12, fontSize: 9,
            fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{p}</button>
        ))}
      </div>

      {/* Messages */}
      <div ref={messagesRef} style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(!conv || conv.length === 0) && (
          <div style={{ textAlign: 'center', color: TEXT_DIM, fontSize: 12, padding: 20 }}>
            Ask anything — workouts, nutrition, recovery, programming.
          </div>
        )}
        {(conv || []).map((m, i) => {
          if (m.role === 'tool') {
            return (
              <div key={i} style={{
                background: `${GREEN}15`,
                border: `1px solid ${GREEN}55`,
                color: GREEN,
                padding: '6px 10px',
                borderRadius: 6,
                fontFamily: 'Menlo, Monaco, monospace',
                fontSize: 11,
                alignSelf: 'flex-start',
                maxWidth: '90%',
              }}>🔧 {m.name}: {m.content}</div>
            );
          }
          if (m.role === 'user') {
            return (
              <div key={i} style={{ display: 'flex', gap: 6, alignSelf: 'flex-end', maxWidth: '85%' }}>
                <div style={{
                  background: CARD2, color: '#fff', padding: '8px 10px', borderRadius: 12,
                  fontSize: 13, lineHeight: 1.4,
                }}>{m.content}</div>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: CARD2, border: `1px solid ${BORDER}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: ACCENT, fontFamily: 'Impact, Arial Black, sans-serif',
                  flexShrink: 0,
                }}>{userInitial}</div>
              </div>
            );
          }
          return (
            <div key={i} style={{ display: 'flex', gap: 6, alignSelf: 'flex-start', maxWidth: '90%' }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: `linear-gradient(135deg, ${ACCENT}, ${ORANGE})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, flexShrink: 0,
              }}>🤖</div>
              <div style={{
                background: CARD,
                borderLeft: `3px solid ${GREEN}`,
                color: '#fff',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 13,
                lineHeight: 1.45,
                whiteSpace: 'pre-wrap',
              }}>{renderContent(m.content)}</div>
            </div>
          );
        })}
        {sending && (
          <div style={{ display: 'flex', gap: 6, alignSelf: 'flex-start' }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: `linear-gradient(135deg, ${ACCENT}, ${ORANGE})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13,
            }}>🤖</div>
            <div style={{ background: CARD, borderLeft: `3px solid ${GREEN}`, padding: '10px 14px', borderRadius: 8, display: 'flex', gap: 4 }}>
              {[0, 1, 2].map((d) => (
                <div key={d} style={{
                  width: 6, height: 6, borderRadius: '50%', background: ACCENT,
                  animation: `recomp-blink 1.4s infinite ease-in-out ${d * 0.2}s`,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: 8, borderTop: `1px solid ${BORDER}`, display: 'flex', gap: 6, alignItems: 'flex-end' }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Ask the coach..."
          rows={1}
          style={{
            flex: 1, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 16,
            color: '#fff', padding: '8px 12px', fontSize: 13, resize: 'none', outline: 'none',
            fontFamily: 'Helvetica, Arial, sans-serif', minHeight: 36, maxHeight: 120,
            boxSizing: 'border-box',
          }}
        />
        <Btn onClick={() => sendMessage()} disabled={sending || !input.trim()}>SEND</Btn>
      </div>
    </div>
  );
};

// ============================================================
// MAIN APP
// ============================================================
const RecompApp = () => {
  const [state, _setState] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [coachOpen, setCoachOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryDismissed, setSummaryDismissed] = useState(false);
  const saveTimerRef = useRef(null);
  const welcomeFiredRef = useRef(false);

  // Load on mount
  useEffect(() => {
    (async () => {
      const s = await loadState();
      _setState(s);
      setLoaded(true);
    })();
  }, []);

  // Wrapped setter with debounced save
  const setState = useCallback((updater) => {
    _setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => saveState(next), 1000);
      return next;
    });
  }, []);

  // Auto-show summary when program complete
  useEffect(() => {
    if (!state || !loaded) return;
    if (state.profile.summaryAcknowledged || summaryDismissed) return;
    const { profile, sessions, week } = state;
    if (week >= profile.weeks) {
      // Check all non-rest sessions of final week are done/skipped
      const weekStartDate = new Date(profile.startDate);
      weekStartDate.setDate(weekStartDate.getDate() + (week - 1) * 7);
      let allDone = true;
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStartDate);
        d.setDate(d.getDate() + i);
        const di = dateToISO(d);
        const dInfo = getDayTypeForDate(profile, di);
        if (dInfo.type === 'REST') continue;
        const sk = sessionKey(di);
        const s = sessions[sk];
        if (!s || (!s.done && !s.skipped)) {
          allDone = false;
          break;
        }
      }
      if (allDone && Object.keys(sessions).length > 0) {
        setShowSummary(true);
      }
    }
  }, [state, loaded, summaryDismissed]);

  // Welcome message when conv is empty AND setupComplete just happened
  useEffect(() => {
    if (!state || !loaded || welcomeFiredRef.current) return;
    if (state.profile.setupComplete && (!state.conv || state.conv.length === 0)) {
      welcomeFiredRef.current = true;
      const macros = calcMacros(state.profile, state.profile.weight);
      const styleName = WORKOUT_STYLES.find((s) => s.id === state.profile.workoutStyle)?.name;
      const goalName = GOAL_OPTIONS.find((g) => g.id === state.profile.goal)?.name;
      const welcomeText = `🔥 **Let's go, ${state.profile.name || 'athlete'}!** Locked in for **${state.profile.weeks} weeks** of **${styleName}** — focus: **${goalName}**.\n\n**Daily targets:** ${macros.calories} cal · ${macros.protein}p · ${macros.carbs}c · ${macros.fat}f\n\nI've built your program around your schedule. Hit your sessions, log honestly, and I'll adapt your weights week-to-week. Ask me anything — workout questions, food swaps, pace targets, recovery. **Let's build.**`;
      setState((p) => ({ ...p, conv: [{ role: 'assistant', content: welcomeText }] }));
    }
  }, [state, loaded]);

  // Onboarding complete handler
  const completeSetup = (newProfile) => {
    setState((p) => ({
      ...p,
      profile: newProfile,
      week: 1,
      conv: [],
    }));
    welcomeFiredRef.current = false;
  };

  const acknowledgeSummary = () => {
    setState((p) => ({ ...p, profile: { ...p.profile, summaryAcknowledged: true } }));
    setShowSummary(false);
  };

  const startNewProgram = () => {
    setState((p) => ({
      ...p,
      profile: { ...p.profile, summaryAcknowledged: true, setupComplete: false },
      week: 1,
      sessions: {},
      conv: [],
    }));
    welcomeFiredRef.current = false;
    setShowSummary(false);
  };

  const handleCoachPrompt = (text) => {
    setPendingPrompt(text);
    setCoachOpen(true);
  };

  // Loading state
  if (!loaded || !state) {
    return (
      <ErrorBoundary>
        <GlobalStyles />
        <div className="recomp-app" style={{
          background: BG, minHeight: '100vh', color: '#fff',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Helvetica, Arial, sans-serif', padding: 20,
        }}>
          <div style={{ animation: 'recomp-pulse 2s ease-in-out infinite', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 48, letterSpacing: 2, marginBottom: 18 }}>
              <span style={{ color: ACCENT }}>RE</span><span style={{ color: ORANGE }}>COMP</span>
            </div>
            <div style={{ width: 120, height: 6, background: CARD2, borderRadius: 3, overflow: 'hidden', margin: '0 auto' }}>
              <div style={{
                width: '60%', height: '100%',
                background: ACCENT,
                animation: 'recomp-pulse 1.4s ease-in-out infinite',
              }} />
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Setup wizard
  if (!state.profile.setupComplete) {
    return (
      <ErrorBoundary>
        <GlobalStyles />
        <div className="recomp-app" style={{
          background: BG, minHeight: '100vh', color: '#fff', fontFamily: 'Helvetica, Arial, sans-serif',
        }}>
          <SetupScreen onComplete={completeSetup} />
        </div>
      </ErrorBoundary>
    );
  }

  const { profile, week, wlog } = state;
  const currentWeight = wlog.length ? [...wlog].sort((a, b) => (a.date < b.date ? 1 : -1))[0].weight : profile.weight;

  // Phase pill
  let phaseName = '';
  let phaseColor = ACCENT;
  if (profile.workoutStyle === 'rp_hyp') {
    const wd = rpWeekData(week, profile.weeks);
    phaseName = wd.phase;
    phaseColor = wd.phase === 'RP DELOAD' ? PURPLE : ACCENT;
  } else if (profile.workoutStyle === 'hyrox' || profile.workoutStyle === 'hyrox_hybrid') {
    const ph = hyroxPhase(week, profile.weeks);
    phaseName = ph.name;
    phaseColor = ph.color;
  } else {
    const ph = phaseForWeek(week, profile.weeks);
    phaseName = ph.phase;
    phaseColor = PHASE_COLORS[ph.phase] || ACCENT;
  }

  return (
    <ErrorBoundary>
      <GlobalStyles />
      <div className="recomp-app" style={{
        background: BG, minHeight: '100vh', color: '#fff',
        fontFamily: 'Helvetica, Arial, sans-serif',
        maxWidth: 480, margin: '0 auto',
        position: 'relative',
        paddingBottom: 60,
      }}>
        {/* Header */}
        <div style={{
          height: 50,
          display: 'flex', alignItems: 'center',
          padding: '0 12px',
          gap: 8,
          borderBottom: `1px solid ${BORDER}`,
          position: 'relative',
          background: BG,
        }}>
          <div style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 22, letterSpacing: 1.5 }}>
            <span style={{ color: ACCENT }}>RE</span><span style={{ color: ORANGE }}>COMP</span>
          </div>
          <div style={{
            background: `${phaseColor}22`,
            color: phaseColor,
            padding: '3px 8px',
            borderRadius: 999,
            fontSize: 9,
            fontFamily: 'Impact, Arial Black, sans-serif',
            letterSpacing: 1,
          }}>{phaseName} WK{week}</div>
          <div style={{ flex: 1 }} />
          <div style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 13, color: TEXT_DIM, letterSpacing: 1 }}>
            {currentWeight}<span style={{ fontSize: 9 }}>LBS</span>
          </div>
          <button onClick={() => setActiveTab('backup')} style={{
            background: 'transparent', color: TEXT_DIM, border: `1px solid ${BORDER}`,
            padding: '4px 8px', borderRadius: 6, fontSize: 9, cursor: 'pointer',
            fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: 1,
          }}>BACKUP</button>
          {/* Bottom gradient line */}
          <div style={{
            position: 'absolute', bottom: -1, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, ${ACCENT}, ${ORANGE}, transparent)`,
          }} />
        </div>

        {/* Tab strip */}
        <div style={{
          display: 'flex',
          gap: 0,
          overflowX: 'auto',
          borderBottom: `1px solid ${BORDER}`,
          padding: '0 6px',
          background: BG,
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              background: 'transparent',
              color: activeTab === t.id ? ACCENT : TEXT_MUTED,
              border: 'none',
              borderBottom: `2px solid ${activeTab === t.id ? ACCENT : 'transparent'}`,
              padding: '9px 14px',
              cursor: 'pointer',
              fontFamily: 'Impact, Arial Black, sans-serif',
              letterSpacing: 1,
              fontSize: 11,
              whiteSpace: 'nowrap',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: 12 }}>
          {activeTab === 'dashboard' && <Dashboard state={state} onTab={setActiveTab} onCoachPrompt={handleCoachPrompt} />}
          {activeTab === 'workouts' && <Workouts state={state} setState={setState} />}
          {activeTab === 'runs' && <Runs state={state} setState={setState} />}
          {activeTab === 'metrics' && <Metrics state={state} setState={setState} />}
          {activeTab === 'food' && <Food state={state} setState={setState} onCoachPrompt={handleCoachPrompt} />}
          {activeTab === 'journal' && <Journal state={state} setState={setState} />}
          {activeTab === 'backup' && <Backup state={state} setState={setState} onShowSummary={() => setShowSummary(true)} />}
        </div>

        {/* Coach FAB */}
        {!coachOpen && (
          <button onClick={() => setCoachOpen(true)} style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 80,
            width: 54, height: 54,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${ACCENT}, ${ORANGE})`,
            border: 'none',
            cursor: 'pointer',
            fontSize: 22,
            boxShadow: `0 6px 20px rgba(232,255,71,.4)`,
          }}>🤖</button>
        )}

        {/* Coach drawer */}
        <CoachDrawer
          open={coachOpen}
          onClose={() => setCoachOpen(false)}
          state={state}
          setState={setState}
          setActiveTab={setActiveTab}
          pendingPrompt={pendingPrompt}
          clearPendingPrompt={() => setPendingPrompt(null)}
        />

        {/* Program Summary modal */}
        {showSummary && (
          <ProgramSummary
            state={state}
            onClose={() => { setShowSummary(false); setSummaryDismissed(true); }}
            onAcknowledge={acknowledgeSummary}
            onStartNew={startNewProgram}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default RecompApp;
