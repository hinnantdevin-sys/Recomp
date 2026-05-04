import React, { useState, useEffect, useRef } from "react";

const KEY = "recomp_data";
async function save(d) { try { await window.storage.set(KEY, JSON.stringify(d)); } catch {} }
async function load() { try { const r = await window.storage.get(KEY); return r?.value ? JSON.parse(r.value) : null; } catch { return null; } }
async function clear() { try { await window.storage.delete(KEY); } catch {} }

const C = { bg:"#09090b",s1:"#111115",s2:"#17171c",s3:"#1e1e26",bd:"#25252f",acc:"#e8ff47",a2:"#ff6b35",a3:"#60a5fa",a4:"#4ade80",a5:"#a78bfa",a6:"#fbbf24",tx:"#eff0f4",mu:"#5a5a6e",mu2:"#7a7a8e" };

const PHASES = {
  4: [
    {sets:3,reps:"12-15",rpe:"RPE 6-7",tempo:"20X1",rest:"90s",ph:"ACCUMULATION",note:""},
    {sets:4,reps:"8-12",rpe:"RPE 7-8",tempo:"31X1",rest:"2min",ph:"HYPERTROPHY",note:"Wk 2: Add 5-10 lbs. Eccentric slows to 3s."},
    {sets:4,reps:"6-8",rpe:"RPE 8",tempo:"31X1",rest:"2min",ph:"HYPERTROPHY",note:"Wk 3: Add 5 more lbs. 2-3 reps in reserve."},
    {sets:3,reps:"8-10",rpe:"RPE 5-6",tempo:"20X1",rest:"90s",ph:"DELOAD",note:"Wk 4: Drop to 60% of Wk 3. Recovery only."}
  ],
  def: [
    {sets:3,reps:"12-15",rpe:"RPE 6",tempo:"20X1",rest:"90s",ph:"ACCUMULATION",note:""},
    {sets:4,reps:"12-15",rpe:"RPE 6-7",tempo:"21X1",rest:"90s",ph:"ACCUMULATION",note:"Wk 2: Add 1 set. Same load — own the volume."},
    {sets:4,reps:"10-12",rpe:"RPE 7",tempo:"21X1",rest:"2min",ph:"ACCUMULATION",note:"Wk 3: Add 5 lbs. Reps tighten to 10-12."},
    {sets:4,reps:"8-12",rpe:"RPE 7-8",tempo:"31X1",rest:"2min",ph:"HYPERTROPHY",note:"NEW PHASE: Hypertrophy. Eccentric 3s. Add 5-10 lbs."},
    {sets:4,reps:"8-10",rpe:"RPE 7-8",tempo:"31X1",rest:"2min",ph:"HYPERTROPHY",note:"Wk 5: Add 5 lbs. Rep range 8-10."},
    {sets:5,reps:"8-10",rpe:"RPE 8",tempo:"31X1",rest:"2min",ph:"HYPERTROPHY",note:"Wk 6: Peak volume — 5 sets A1/A2. Same load as Wk 5."},
    {sets:4,reps:"4-6",rpe:"RPE 8-9",tempo:"21X0",rest:"3min",ph:"INTENSIFICATION",note:"NEW PHASE: Intensification. Add 10-15 lbs over Wk 6."},
    {sets:5,reps:"4-6",rpe:"RPE 8-9",tempo:"21X0",rest:"3min",ph:"INTENSIFICATION",note:"Wk 8: Heaviest week. Add 5 lbs from Wk 7."},
    {sets:4,reps:"2-4",rpe:"RPE 9-10",tempo:"10X0",rest:"4min",ph:"REALIZATION",note:"NEW PHASE: Realization. Max load. Add 5-10 lbs."},
    {sets:3,reps:"8-10",rpe:"RPE 5-6",tempo:"20X1",rest:"90s",ph:"DELOAD",note:"DELOAD: 60% of Wk 9. Recovery — not a workout."},
    {sets:4,reps:"12-15",rpe:"RPE 6-7",tempo:"21X1",rest:"90s",ph:"ACCUMULATION",note:"Block 2: Start 10 lbs heavier than Wk 1."},
    {sets:4,reps:"8-12",rpe:"RPE 7-8",tempo:"31X1",rest:"2min",ph:"HYPERTROPHY",note:"Wk 12: Add 10-15 lbs over Wk 4 weights."}
  ]
};

const PC = {ACCUMULATION:C.a4,HYPERTROPHY:C.a3,INTENSIFICATION:C.a6,REALIZATION:C.a2,DELOAD:C.a5};
const DEFAULT_DAYS = [{day:"MON",type:"PUSH",col:C.a2},{day:"TUE",type:"PULL",col:C.a3},{day:"WED",type:"CARDIO",col:C.a6},{day:"THU",type:"LEGS",col:C.a4},{day:"FRI",type:"FULL",col:C.a5},{day:"SAT",type:"REST",col:C.mu},{day:"SUN",type:"REST",col:C.mu}];
const DAYS = DEFAULT_DAYS; // legacy alias
const WORKOUT_TYPES = [
  {type:"PUSH",col:C.a2,label:"Push"},
  {type:"PULL",col:C.a3,label:"Pull"},
  {type:"LEGS",col:C.a4,label:"Legs"},
  {type:"FULL",col:C.a5,label:"Full Body"},
  {type:"CARDIO",col:C.a6,label:"Cardio"},
  {type:"REST",col:C.mu,label:"Rest"}
];
const DAY_LABELS = ["MON","TUE","WED","THU","FRI","SAT","SUN"];

// Get the user's schedule, falling back to default
function getSchedule(profile){
  if(profile?.schedule&&Array.isArray(profile.schedule)&&profile.schedule.length===7){
    return profile.schedule.map((type,i)=>{
      const wt=WORKOUT_TYPES.find(w=>w.type===type)||WORKOUT_TYPES[5];
      return {day:DAY_LABELS[i],type:wt.type,col:wt.col};
    });
  }
  return DEFAULT_DAYS;
}
const MOODS = ["😤","😴","😐","💪","🔥"];

const EX = {
  pushA:[["Barbell Bench Press","Controlled descent, drive full ROM"],["DB Incline Press","3s down, pause, explode up"],["Cable Lateral Raise","Lead with elbow, slight lean"],["Tricep Rope Pushdown","Full extension, elbows pinned"],["Cable Chest Fly","Wide arc, squeeze at center"],["Overhead Tricep Ext","Elbows forward, full stretch"]],
  pushB:[["Overhead Press","Brace hard, slight arc overhead"],["DB Flat Press","3s eccentric, control stretch"],["Cable Front Raise","Smooth arc, no momentum"],["EZ Bar Skull Crusher","Elbows fixed, lower to forehead"],["DB Lateral Raise","Lead with elbows, slight lean"],["Tricep Dip","Upright torso, full ROM"]],
  pullA:[["BB Bent-Over Row","45° hinge, pull to lower chest, 2s squeeze"],["Lat Pulldown Wide","Initiate with lats, full ROM"],["Seated Cable Row","Full extension, pause, row to navel"],["DB Hammer Curl","Strict, no swing"],["Cable Rear Delt Fly","Lead with elbows wide"],["DB Preacher Curl","Full stretch at bottom"]],
  pullB:[["Pull-Up","Dead hang, full ROM, 3s lowering"],["Single-Arm DB Row","Row to hip, 2s hold"],["Face Pull Cable","Pull to forehead, external rotate"],["Incline DB Curl","Full stretch, 3s eccentric"],["Straight-Arm Pulldown","Sweep to hips, squeeze lats"],["Reverse Curl","Overhand grip, elbows fixed"]],
  legsA:[["Back Squat","Brace, drive knees out, 3s down"],["Romanian Deadlift","Hinge deep, 3s eccentric"],["Leg Press","Full ROM, mid-platform, 3s down"],["Nordic Hamstring Curl","Slow eccentric, minimal hands"],["Walking Lunge","Long stride, upright torso"],["Leg Extension","Pause 1s at top"]],
  legsB:[["Bulgarian Split Squat","Front foot out, 3s down"],["Hex Bar Deadlift","Flat back, drive hips through"],["Seated Leg Curl","Full ROM, 3s eccentric"],["Leg Press","High wide stance, glute focus"],["Hip Thrust","Full extension, squeeze at top"],["Standing Calf Raise","Full stretch, pause at top"]],
  full:[["Goblet Squat","Elbows up, deep squat"],["DB Push Press","Dip, explosive press, control down"],["Trap Bar Deadlift","Neutral spine, drive hips through"],["Chin-Up","Supinated grip, full ROM, 3s down"],["DB Walking Lunge","Long stride, alternating legs"],["Plank to Push-Up","Hips level throughout"]]
};

function getPhase(w,tot){const a=parseInt(tot)===4?PHASES[4]:PHASES.def;return a[Math.max(0,Math.min(parseInt(w),a.length)-1)];}
function getEx(t,w){const o=parseInt(w)%2===1;if(t==="PUSH")return o?EX.pushA:EX.pushB;if(t==="PULL")return o?EX.pullA:EX.pullB;if(t==="LEGS")return o?EX.legsA:EX.legsB;if(t==="FULL")return EX.full;return EX.full;}

// RP Hypertrophy methodology - volume landmarks per muscle group (sets per week)
// MV=Maintenance, MEV=Min Effective, MAV=Max Adaptive, MRV=Max Recoverable
const RP_LANDMARKS = {
  Chest: {MV:6,MEV:10,MAV:14,MRV:22},
  Back: {MV:8,MEV:10,MAV:16,MRV:25},
  Shoulders: {MV:8,MEV:8,MAV:16,MRV:26},
  Biceps: {MV:5,MEV:8,MAV:14,MRV:20},
  Triceps: {MV:4,MEV:6,MAV:12,MRV:18},
  Quads: {MV:6,MEV:8,MAV:14,MRV:20},
  Hamstrings: {MV:3,MEV:6,MAV:12,MRV:16},
  Glutes: {MV:0,MEV:0,MAV:8,MRV:16},
  Calves: {MV:6,MEV:8,MAV:14,MRV:20}
};

// RP mesocycle: 4-6 weeks accumulation + deload. Sets ramp from MEV→MRV. RIR drops 3→0.
function getRPWeek(w, mesoLen) {
  const ml = parseInt(mesoLen) || 5;
  const wn = parseInt(w);
  const deloadWeek = ml; // last week is deload
  const accumWeeks = ml - 1;
  if (wn >= deloadWeek) return {week:wn, type:"DELOAD", rir:"4-5 RIR", setMult:0.5, repRange:"8-10", note:"Deload — 50% sets, light loads. Recover for next meso."};
  // Linear progression across accumulation
  const progress = (wn - 1) / Math.max(1, accumWeeks - 1); // 0 to 1
  const rir = Math.max(0, Math.round(3 - progress * 3));
  const setMult = 1 + progress * 0.5; // 1x MEV → 1.5x MEV (toward MRV)
  return {week:wn, type:"ACCUMULATION", rir:`${rir} RIR`, setMult, repRange:wn<=2?"8-12":wn<=4?"6-10":"5-8", note:wn===1?"Week 1: Establish baseline. Track pump, soreness, workload.":`Week ${wn}: Add ${wn-1} set${wn>2?"s":""} per muscle from week 1. Drop RIR to ${rir}.`};
}

// RP Push/Pull/Legs split with muscle groups
const RP_SPLIT = {
  PUSH: [
    {muscle:"Chest", exercises:["Barbell Bench Press","DB Incline Press","Cable Chest Fly"]},
    {muscle:"Shoulders", exercises:["Overhead Press","Cable Lateral Raise","DB Lateral Raise"]},
    {muscle:"Triceps", exercises:["Tricep Rope Pushdown","Overhead Tricep Extension"]}
  ],
  PULL: [
    {muscle:"Back", exercises:["Lat Pulldown Wide","Barbell Row","Seated Cable Row","Face Pull Cable"]},
    {muscle:"Biceps", exercises:["DB Hammer Curl","Incline DB Curl"]}
  ],
  LEGS: [
    {muscle:"Quads", exercises:["Back Squat","Leg Press","Leg Extension"]},
    {muscle:"Hamstrings", exercises:["Romanian Deadlift","Seated Leg Curl"]},
    {muscle:"Glutes", exercises:["Hip Thrust"]},
    {muscle:"Calves", exercises:["Standing Calf Raise"]}
  ],
  FULL: [
    {muscle:"Chest", exercises:["DB Flat Press"]},
    {muscle:"Back", exercises:["Pull-Up","Single-Arm DB Row"]},
    {muscle:"Quads", exercises:["Goblet Squat"]},
    {muscle:"Hamstrings", exercises:["Hex Bar Deadlift"]},
    {muscle:"Shoulders", exercises:["DB Push Press"]}
  ]
};

// Calculate sets per exercise for RP based on muscle landmarks and week progression
function getRPSets(muscle, weekData, exerciseCount) {
  const landmark = RP_LANDMARKS[muscle];
  if (!landmark) return 3;
  if (weekData.type === "DELOAD") return Math.max(2, Math.round(landmark.MEV / exerciseCount * 0.5));
  // Distribute weekly volume across sessions (assume muscle hit 1-2x/week, exercises split that volume)
  const weeklyVolume = Math.round(landmark.MEV * weekData.setMult);
  const perExercise = Math.max(2, Math.round(weeklyVolume / exerciseCount / 1.5));
  return Math.min(perExercise, 5);
}

function calcMacros(p,cw){
  const w=parseFloat(cw)||parseFloat(p.weight);
  const wt=parseFloat(p.targetWeight)||w;
  const wp=Math.max(w,wt);
  const h=(parseFloat((p.height||"69").replace(/[^0-9.]/g,"").substring(0,3))||69)*2.54;
  const bmr=p.sex==="male"?10*w*0.453592+6.25*h-5*parseFloat(p.age)+5:10*w*0.453592+6.25*h-5*parseFloat(p.age)-161;
  const m={sedentary:1.2,lightly_active:1.375,moderately_active:1.55,very_active:1.725};
  const tdee=Math.round(bmr*(m[p.activity]||1.55));
  let tc=tdee;if(p.goal==="fat_loss")tc=tdee-500;else if(p.goal==="muscle_gain")tc=tdee+300;
  const protein=Math.round(wp);const fat=Math.round((tc*.25)/9);const carbs=Math.round((tc-protein*4-fat*9)/4);
  const lbs=parseFloat((w-wt).toFixed(1));
  const pct=wt!==parseFloat(p.weight)?Math.min(100,Math.max(0,Math.round((parseFloat(p.weight)-w)/(parseFloat(p.weight)-wt)*100))):w<=wt?100:0;
  return {tdee,targetCals:tc,protein,fat,carbs,lbsToGo:lbs,pctToGoal:pct};
}

function wtGuide(goal,ph){
  const c=goal==="fat_loss",r=goal==="recomp";
  if(ph==="ACCUMULATION")return c?"65-70% 1RM — retention focus, not max load":r?"60-70% 1RM — add weight only with 2+ reps in reserve":"65-75% 1RM — add 5 lbs when all reps feel controlled";
  if(ph==="HYPERTROPHY")return c?"70-75% 1RM — hold load steady, stimulus over max weight":r?"70-78% 1RM — small jumps if RPE stays in range":"70-80% 1RM — add 5-10 lbs/week when top of rep range is easy";
  if(ph==="INTENSIFICATION")return c?"78-82% 1RM — controlled jumps, recovery is limited":"82-90% 1RM — push hard, add 5-10 lbs/week";
  if(ph==="REALIZATION")return"88-95% 1RM — max effort, near-max singles on primary lifts";
  return"60% of last heavy week — quality reps only, true recovery";
}

const IMP = {fontFamily:"Impact,Arial,sans-serif"};
const card = {background:C.s1,border:`1px solid ${C.bd}`,borderRadius:8,overflow:"hidden"};
const hbtn = {background:"transparent",border:`1px solid ${C.bd}`,color:C.mu,padding:"3px 9px",borderRadius:3,...IMP,fontSize:10,letterSpacing:1,textTransform:"uppercase",cursor:"pointer"};
const abtn = (col)=>({background:col||C.acc,color:"#000",border:"none",padding:"6px 14px",borderRadius:4,...IMP,fontSize:11,fontWeight:900,letterSpacing:"1.5px",textTransform:"uppercase",cursor:"pointer"});
const inp = {background:C.s2,border:`1px solid ${C.bd}`,color:C.tx,padding:"6px 10px",borderRadius:4,fontSize:13,outline:"none"};
const lbl9 = {display:"block",...IMP,fontSize:9,letterSpacing:2,textTransform:"uppercase",color:C.mu,marginBottom:4};
const imp = (sz,col)=>({...IMP,fontSize:sz||11,letterSpacing:2,textTransform:"uppercase",color:col||C.mu2});

function Setup({onStart}){
  const [f,setF]=useState({name:"",age:"",sex:"male",height:"",weight:"",targetWeight:"",goal:"fat_loss",activity:"very_active",weeks:"8",experience:"advanced",equipment:"full_gym",workoutStyle:"functional_bb"});
  const [sched,setSched]=useState(()=>{
    try{return [...(DEFAULT_SCHEDULES?.functional_bb||["PUSH","PULL","CARDIO","LEGS","FULL","REST","REST"])];}
    catch(e){return ["PUSH","PULL","CARDIO","LEGS","FULL","REST","REST"];}
  });
  const [showSchedEdit,setShowSchedEdit]=useState(false);
  const [stylePicked,setStylePicked]=useState(false);

  // When workout style changes, update the schedule to that style's default
  useEffect(()=>{
    if(!stylePicked){
      try{
        const def=(DEFAULT_SCHEDULES&&DEFAULT_SCHEDULES[f.workoutStyle])||DEFAULT_SCHEDULES?.functional_bb||["PUSH","PULL","CARDIO","LEGS","FULL","REST","REST"];
        setSched([...def]);
      }catch(e){}
    }
  },[f.workoutStyle]);

  const s=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const fi=(id,lbl,type="text",ph="")=><div style={{marginBottom:10}}><label style={lbl9}>{lbl}</label><input type={type} value={f[id]} onChange={s(id)} placeholder={ph} style={{width:"100%",...inp}}/></div>;
  const fs=(id,lbl,opts)=><div style={{marginBottom:10}}><label style={lbl9}>{lbl}</label><select value={f[id]} onChange={s(id)} style={{width:"100%",...inp}}>{opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>;
  const go=()=>{
    try{
      const mac=calcMacros(f,f.weight);
      onStart({...f,...mac,schedule:sched});
    }catch(e){
      alert("Error creating profile: "+e.message);
    }
  };
  const g2=(a,b)=><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{a}{b}</div>;
  const styleTypes=(STYLE_DAY_TYPES&&STYLE_DAY_TYPES[f.workoutStyle])||STYLE_DAY_TYPES?.functional_bb||[
    {type:"PUSH",col:C.a2,label:"Push"},{type:"PULL",col:C.a3,label:"Pull"},
    {type:"LEGS",col:C.a4,label:"Legs"},{type:"FULL",col:C.a5,label:"Full Body"},
    {type:"CARDIO",col:C.a6,label:"Cardio"},{type:"REST",col:C.mu,label:"Rest"}
  ];
  const presets=(SPLIT_PRESETS&&SPLIT_PRESETS[f.workoutStyle])||[];
  const setDayType=(idx,type)=>{const next=[...sched];next[idx]=type;setSched(next);setStylePicked(true);};
  const applyPreset=(preset)=>{setSched([...preset.schedule]);setStylePicked(true);};
  const workoutDayCount=sched.filter(t=>t!=="REST").length;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.93)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400,padding:14}}>
      <div style={{background:C.s1,border:`1px solid ${C.bd}`,borderTop:`3px solid ${C.acc}`,borderRadius:6,padding:22,width:"100%",maxWidth:430,maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{...IMP,fontSize:26,letterSpacing:4,color:C.acc,marginBottom:3}}>RECOMP</div>
        <div style={{fontSize:12,color:C.mu,marginBottom:16}}>Functional Bodybuilding AI Coach</div>
        {fi("name","Your Name","text","First name")}
        {g2(fi("age","Age","number","30"),fs("sex","Sex",[["male","Male"],["female","Female"]]))}
        {fi("height","Height","text","5ft 9in")}
        {g2(fi("weight","Current Weight (lbs)","number","185"),fi("targetWeight","Target Weight (lbs)","number","170"))}
        {fs("goal","Primary Goal",[["fat_loss","Fat Loss / Cut"],["muscle_gain","Muscle Gain"],["recomp","Body Recomposition"],["performance","Athletic Performance"]])}
        {g2(fs("activity","Activity Level",[["sedentary","Sedentary"],["lightly_active","Lightly Active"],["moderately_active","Moderately Active"],["very_active","Very Active"]]),fs("weeks","Program Length",[["4","4 Weeks"],["8","8 Weeks"],["10","10 Weeks"],["12","12 Weeks"],["16","16 Weeks"]]))}
        {fs("workoutStyle","Workout Style",[
          ["rp_hypertrophy","RP Hypertrophy — Mesocycle, MEV/MAV/MRV, RIR progression, auto-volume"],
          ["hyrox_hybrid","HYROX Hybrid — Race prep + heavy lifting + kettlebell complexes"],
          ["functional_bb","Functional Bodybuilding — Supersets, RPE, aesthetics + performance"],
          ["traditional_bb","Traditional Bodybuilding — Isolation, hypertrophy, physique focus"],
          ["crossfit","CrossFit — WODs, AMRAP, EMOM, Olympic lifting, conditioning"],
          ["hyrox","HYROX — Race prep, functional strength + cardio endurance"],
          ["powerlifting","Powerlifting — Squat, bench, deadlift focus, max strength"],
          ["athletic","Athletic Performance — Sport conditioning, speed, power, agility"],
          ["hiit","HIIT / Circuit — High intensity, minimal rest, full body circuits"]
        ])}
        {g2(fs("experience","Experience",[["beginner","Beginner"],["intermediate","Intermediate"],["advanced","Advanced"]]),fs("equipment","Equipment",[["full_gym","Full Gym"],["home_dumbbells","Home Dumbbells"],["bodyweight","Bodyweight Only"]]))}

        <div style={{marginBottom:12,marginTop:6}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <label style={lbl9}>Weekly Schedule</label>
            <button type="button" onClick={()=>setShowSchedEdit(s=>!s)} style={{...hbtn,fontSize:9,padding:"3px 8px"}}>{showSchedEdit?"DONE":"CUSTOMIZE"}</button>
          </div>
          {!showSchedEdit?(
            <div style={{padding:"8px 6px",background:C.s2,border:`1px solid ${C.bd}`,borderRadius:5}}>
              <div style={{display:"flex",gap:3}}>
                {sched.map((t,i)=>{
                  const wt=styleTypes.find(w=>w.type===t)||{type:"REST",col:C.mu,label:"Rest"};
                  return(
                    <div key={i} style={{flex:1,textAlign:"center"}}>
                      <div style={{...IMP,fontSize:9,color:C.tx,letterSpacing:.5,marginBottom:2}}>{DAY_LABELS[i].slice(0,1)}</div>
                      <div style={{...IMP,fontSize:7,color:wt.col,letterSpacing:.3,padding:"2px 0",lineHeight:1.2}}>{wt.label.toUpperCase().replace(/[()].*/,"").trim().slice(0,8)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ):(
            <div style={{padding:"8px",background:C.s2,border:`1px solid ${C.bd}`,borderRadius:5}}>
              {presets.length>0&&(
                <div style={{marginBottom:8}}>
                  <div style={{...imp(8,C.mu),marginBottom:4}}>QUICK PRESETS</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {presets.map(p=>(
                      <button key={p.name} type="button" onClick={()=>applyPreset(p)} style={{...hbtn,fontSize:9,padding:"3px 7px"}}>{p.name}</button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {DAY_LABELS.map((dl,i)=>(
                  <div key={i}>
                    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                      <div style={{...IMP,fontSize:11,fontWeight:900,color:C.tx,letterSpacing:1,width:32,flexShrink:0}}>{dl}</div>
                      <div style={{...IMP,fontSize:9,color:(styleTypes.find(t=>t.type===sched[i])||{}).col||C.mu,letterSpacing:.3}}>{((styleTypes.find(t=>t.type===sched[i])||{}).label||"Rest").toUpperCase()}</div>
                    </div>
                    <div style={{display:"flex",gap:2,flexWrap:"wrap",paddingLeft:37}}>
                      {styleTypes.map(t=>{
                        const sel=sched[i]===t.type;
                        return(
                          <button key={t.type} type="button" onClick={()=>setDayType(i,t.type)} style={{flex:"1 1 auto",minWidth:50,background:sel?t.col:"transparent",color:sel?(t.type==="REST"?C.tx:"#000"):t.col,border:`1px solid ${sel?t.col:C.bd}`,padding:"3px 4px",borderRadius:3,...IMP,fontSize:8,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>{t.label.toUpperCase().slice(0,12)}</button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{fontSize:10,color:C.mu,marginTop:4}}>{workoutDayCount} workout day{workoutDayCount!==1?"s":""} per week</div>
        </div>

        <button onClick={go} style={{width:"100%",background:C.acc,color:"#000",border:"none",padding:11,borderRadius:4,...IMP,fontSize:13,fontWeight:900,letterSpacing:3,textTransform:"uppercase",cursor:"pointer",marginTop:6}}>BUILD MY PROGRAM</button>
      </div>
    </div>
  );
}

// RP Hypertrophy session renderer with pump/soreness/workload feedback
function RPSession({week, dayType, mesoLen, sessions, setSessions, coachMsg, sk}){
  const wd = getRPWeek(week, mesoLen);
  const muscles = RP_SPLIT[dayType] || [];
  const saved = sessions[sk] || {};
  const [setLogs, setSetLogs] = useState(saved.setLogs || {});
  const [feedback, setFeedback] = useState(saved.feedback || {});
  const [notes, setNotes] = useState(saved.notes || "");
  const [done, setDone] = useState(saved.done || false);
  const go = useRef(false);

  useEffect(()=>{
    go.current = false;
    const s = sessions[sk] || {};
    setSetLogs(s.setLogs || {});
    setFeedback(s.feedback || {});
    setNotes(s.notes || "");
    setDone(s.done || false);
  }, [sk]);

  useEffect(()=>{
    if(!go.current){go.current=true;return;}
    setSessions(prev=>({...prev, [sk]:{...(prev[sk]||{}), setLogs, feedback, notes, done, savedAt:new Date().toISOString(), rp:true}}));
  }, [setLogs, feedback, notes, done]);

  const updSet = (n,i,f,v)=>{const k=`${n}__${i}`;setSetLogs(p=>({...p,[k]:{...(p[k]||{}),[f]:v}}));};
  const togSet = (n,i)=>{const k=`${n}__${i}`;setSetLogs(p=>({...p,[k]:{...(p[k]||{}),done:!(p[k]?.done)}}));};
  const updFb = (muscle, field, val) => setFeedback(p=>({...p, [muscle]:{...(p[muscle]||{}), [field]:val}}));

  return (
    <>
      <div style={{...card, marginBottom:10}}>
        <div style={{padding:"11px 13px", borderBottom:`1px solid ${C.bd}`, display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <div style={{flex:1}}>
            <div style={{...IMP, fontSize:16, fontWeight:900, color:C.acc}}>RP — {dayType} (Week {wd.week})</div>
            <div style={{fontSize:10, color:C.mu, marginTop:2}}>RP Hypertrophy · Mesocycle Week {wd.week}/{mesoLen}</div>
          </div>
          <div style={{...imp(10, wd.type==="DELOAD"?C.a5:C.acc), padding:"3px 9px", border:`1px solid ${wd.type==="DELOAD"?C.a5:C.acc}`, borderRadius:4}}>{wd.type}</div>
        </div>
        <div style={{padding:"8px 13px", borderBottom:`1px solid ${C.bd}`, display:"flex", gap:14, fontSize:11, color:C.mu2, flexWrap:"wrap"}}>
          <span><strong style={{color:C.tx}}>Reps:</strong> {wd.repRange}</span>
          <span><strong style={{color:C.tx}}>Intensity:</strong> <span style={{color:C.acc}}>{wd.rir}</span></span>
          <span><strong style={{color:C.tx}}>Volume:</strong> {Math.round(wd.setMult*100)}% of MEV</span>
        </div>
        {wd.note && (
          <div style={{background:"rgba(232,255,71,.06)", border:"1px solid rgba(232,255,71,.2)", borderRadius:5, padding:"7px 11px", margin:"8px 13px", fontSize:11, color:C.acc, lineHeight:1.5}}>
            <strong>WK {wd.week}:</strong> {wd.note}
          </div>
        )}

        {muscles.map((m, mi) => {
          const setsPerEx = getRPSets(m.muscle, wd, m.exercises.length);
          const land = RP_LANDMARKS[m.muscle];
          return (
            <div key={mi} style={{borderTop:`1px solid ${C.bd}`, padding:"10px 13px"}}>
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8}}>
                <div>
                  <div style={{...IMP, fontSize:13, fontWeight:800, color:C.a3, letterSpacing:1}}>{m.muscle.toUpperCase()}</div>
                  {land && <div style={{fontSize:9, color:C.mu, marginTop:1}}>MEV {land.MEV} · MAV {land.MAV} · MRV {land.MRV} sets/wk</div>}
                </div>
                <div style={{...imp(10, C.acc), padding:"2px 8px", borderRadius:3, background:"rgba(232,255,71,.08)", border:"1px solid rgba(232,255,71,.2)"}}>{setsPerEx} × {wd.repRange}</div>
              </div>
              {m.exercises.map((ex, ei) => {
                const prev = getPrevLog(sessions, ex, sk);
                const sugg = getSuggestedWeight(prev, wd, "performance", wd.repRange, true, m.muscle);
                const indCol = sugg?.indicator==="up"?C.a4:sugg?.indicator==="down"?"#f87171":sugg?.indicator==="deload"?C.a5:C.acc;
                const indIcon = sugg?.indicator==="up"?"↑":sugg?.indicator==="down"?"↓":sugg?.indicator==="deload"?"↓":"→";
                return (
                  <div key={ei} style={{padding:"8px 0", borderTop: ei>0 ? `1px solid rgba(255,255,255,.04)`:"none"}}>
                    <div style={{display:"flex", alignItems:"flex-start", gap:9}}>
                      <div style={{flex:1, fontSize:13, fontWeight:600}}>{ex}</div>
                      <button onClick={()=>coachMsg(`Swap ${ex} for ${m.muscle} in my RP Hypertrophy ${dayType} workout. Week ${wd.week}, ${wd.rir}, ${setsPerEx}×${wd.repRange}. Give 3 alternatives that hit the same muscle.`)} style={{...hbtn, fontSize:9, padding:"2px 7px", flexShrink:0}}>SWAP</button>
                    </div>
                    {sugg && (
                      <div style={{display:"flex", alignItems:"center", gap:8, padding:"5px 8px", background:`rgba(${indCol===C.a4?"74,222,128":indCol==="#f87171"?"248,113,113":indCol===C.a5?"167,139,250":"232,255,71"},.06)`, border:`1px solid rgba(${indCol===C.a4?"74,222,128":indCol==="#f87171"?"248,113,113":indCol===C.a5?"167,139,250":"232,255,71"},.18)`, borderRadius:4, margin:"6px 0"}}>
                        <div style={{...IMP, fontSize:14, fontWeight:900, color:indCol, flexShrink:0}}>{indIcon} {sugg.weight}</div>
                        <div style={{fontSize:9, color:C.mu, lineHeight:1.4, flex:1}}>{sugg.note}</div>
                      </div>
                    )}
                    <div style={{marginTop:4, display:"flex", flexDirection:"column", gap:4}}>
                      {Array.from({length:setsPerEx},(_,i)=>{
                        const k = `${ex}__${i}`; const lg = setLogs[k] || {};
                        return (
                          <div key={i} style={{display:"flex", gap:6, alignItems:"center"}}>
                            <div style={{width:30, height:26, background:lg.done?C.acc:C.s3, borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center", ...IMP, fontSize:11, fontWeight:900, color:lg.done?"#000":C.mu, border:`1px solid ${lg.done?C.acc:C.bd}`, flexShrink:0}}>{i+1}</div>
                            <input type="number" value={lg.weight||""} onChange={e=>updSet(ex,i,"weight",e.target.value)} placeholder={sugg?`${sugg.weight}`:"lbs"} style={{flex:1, height:26, ...inp, padding:"0 8px", ...IMP, fontWeight:700, fontSize:12, border:`1px solid ${lg.done?"rgba(232,255,71,.4)":C.bd}`}}/>
                            <input type="number" value={lg.reps||""} onChange={e=>updSet(ex,i,"reps",e.target.value)} placeholder="reps" style={{width:50, height:26, ...inp, padding:"0 8px", ...IMP, fontWeight:700, fontSize:12, border:`1px solid ${lg.done?"rgba(232,255,71,.4)":C.bd}`}}/>
                            <button onClick={()=>togSet(ex,i)} style={{width:26, height:26, borderRadius:4, border:`1px solid ${lg.done?C.acc:C.bd}`, background:lg.done?C.acc:"transparent", color:lg.done?"#000":C.mu, cursor:"pointer", fontSize:11, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>✓</button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Per-muscle RP feedback */}
              <div style={{marginTop:10, padding:"8px 10px", background:C.s2, border:`1px solid ${C.bd}`, borderRadius:5}}>
                <div style={{...imp(9, C.mu), marginBottom:6}}>POST-{m.muscle.toUpperCase()} FEEDBACK</div>
                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6}}>
                  {[
                    {key:"pump", label:"PUMP", emojis:["💀","😐","💪","🔥","🌋"], desc:["None","Low","Mod","Great","Insane"]},
                    {key:"workload", label:"WORKLOAD", emojis:["🐌","😎","😅","😤","💀"], desc:["Easy","Pretty","Avg","Pushed","Too much"]},
                    {key:"soreness", label:"SORENESS", emojis:["😴","😌","😬","🥵","🪦"], desc:["None","Healed","A bit","Sore","Crushed"]}
                  ].map(({key, label, emojis, desc})=>(
                    <div key={key}>
                      <div style={{fontSize:9, color:C.mu, marginBottom:3, letterSpacing:1, textAlign:"center"}}>{label}</div>
                      <div style={{display:"flex", gap:2, justifyContent:"center"}}>
                        {emojis.map((em,i)=>{
                          const sel = feedback[m.muscle]?.[key] === i;
                          return (
                            <button key={i} onClick={()=>updFb(m.muscle, key, i)} style={{background:sel?"rgba(232,255,71,.15)":"transparent", border:`1px solid ${sel?C.acc:C.bd}`, borderRadius:4, padding:"3px 0", flex:1, cursor:"pointer", fontSize:13}} title={desc[i]}>{em}</button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                {feedback[m.muscle] && Object.keys(feedback[m.muscle]).length === 3 && (
                  <div style={{marginTop:6, fontSize:10, color:C.a4, textAlign:"center"}}>✓ Feedback logged — will adjust next session</div>
                )}
              </div>
            </div>
          );
        })}

        <div style={{padding:"10px 13px", borderTop:`1px solid ${C.bd}`, display:"flex", gap:8, flexWrap:"wrap"}}>
          <button onClick={()=>coachMsg(`Explain RP methodology for week ${wd.week} of my mesocycle. ${dayType} day. Why ${wd.rir}? When should I add a set vs hold volume?`)} style={hbtn}>EXPLAIN RP</button>
          <button onClick={()=>coachMsg(`Based on my pump/workload/soreness feedback for this ${dayType} session, what should I adjust next session?`)} style={hbtn}>ANALYZE FEEDBACK</button>
        </div>
      </div>

      <div style={card}>
        <div style={{padding:"9px 13px", borderBottom:`1px solid ${C.bd}`, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div style={imp(12,C.mu2)}>SESSION LOG</div>
          {done && <div style={{...imp(10,C.a4), border:`1px solid ${C.a4}`, padding:"2px 8px", borderRadius:3}}>✓ DONE</div>}
        </div>
        <div style={{padding:"12px 13px"}}>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes — overall pump, mind-muscle, technique cues, what to adjust..." style={{width:"100%", background:C.s2, border:`1px solid ${C.bd}`, color:C.tx, padding:"8px 10px", borderRadius:4, fontSize:12, resize:"none", minHeight:60, outline:"none", lineHeight:1.6, fontFamily:"inherit"}}/>
          <label style={{display:"flex", alignItems:"center", gap:6, fontSize:12, color:C.mu2, cursor:"pointer", marginTop:8}}>
            <input type="checkbox" checked={done} onChange={e=>setDone(e.target.checked)} style={{accentColor:C.acc, width:14, height:14}}/>Mark Complete
            <span style={{...imp(10,C.mu), marginLeft:8}}>AUTO-SAVED</span>
          </label>
        </div>
      </div>
    </>
  );
}

// HYROX programming - 8 stations + 8x 1km runs. Race-specific periodization.
// Standards: Open Men sled push 152kg/sled pull 103kg, Open Women sled push 102kg/sled pull 78kg
// Sandbag lunges: M 20kg / W 10kg. Wall balls: M 6kg/10ft / W 4kg/9ft (75 reps M / 75 reps W in pairs, 100 in singles)

const HYROX_STATIONS = [
  {name:"SkiErg", distance:"1000m", focus:"Lats + posterior chain", note:"Hip drive, full extension, finish at hips"},
  {name:"Sled Push", distance:"50m", focus:"Quads + drive", note:"M: 152kg / W: 102kg. Low hips, drive through legs"},
  {name:"Sled Pull", distance:"50m", focus:"Back + arms", note:"M: 103kg / W: 78kg. Wide stance, pull hand-over-hand"},
  {name:"Burpee Broad Jumps", distance:"80m", focus:"Full body conditioning", note:"~20-25 reps. Pace yourself — this kills people"},
  {name:"Rowing", distance:"1000m", focus:"Full body conditioning", note:"Legs-back-arms. Target 1:50-2:10 /500m pace"},
  {name:"Farmers Carry", distance:"200m", focus:"Grip + core", note:"M: 24kg KB each / W: 16kg KB each. No drops if possible"},
  {name:"Sandbag Lunges", distance:"100m", focus:"Quads + glutes", note:"M: 20kg / W: 10kg. Knee taps ground, alternate legs"},
  {name:"Wall Balls", distance:"75-100 reps", focus:"Legs + shoulders", note:"M: 6kg/10ft / W: 4kg/9ft. Squat depth, ball above target line"}
];

// HYROX weekly programming by phase
function getHyroxWorkout(week, dayType, totalWeeks) {
  const tw = parseInt(totalWeeks) || 8;
  const wk = parseInt(week);
  // Phase: Base (weeks 1 to ~40%), Build (next 40%), Race-specific (last 20%)
  const phasePct = wk / tw;
  const phase = phasePct <= 0.4 ? "BASE" : phasePct <= 0.8 ? "BUILD" : phasePct < 1 ? "RACE PREP" : "TAPER";
  const isDeload = wk === tw;

  if (isDeload) {
    return {
      phase: "TAPER",
      title: dayType==="PUSH"?"Easy Strength":dayType==="PULL"?"Pull Recovery":dayType==="LEGS"?"Light Legs":dayType==="FULL"?"Race Sim Light":"Recovery",
      blocks: [
        {label:"DELOAD WEEK", items:[
          {name:"All movements at 50-60% intensity", sets:"2-3", reps:"6-8", note:"Quality reps, no fatigue"},
          {name:"Z2 run 20-25 min", sets:"-", reps:"-", note:"Easy pace, conversational"}
        ]}
      ]
    };
  }

  // PUSH = Strength (Lower) + Sled work / Heavy carries
  if (dayType === "PUSH") {
    return {
      phase, title:"Strength (Lower) + Sled",
      blocks: [
        {label:"STRENGTH BLOCK — 25 min", items:[
          {name:"Back Squat", sets:phase==="BASE"?"4":phase==="BUILD"?"5":"4", reps:phase==="BASE"?"6-8":phase==="BUILD"?"4-6":"3-5", note:`${phase==="BASE"?"75-80%":phase==="BUILD"?"82-87%":"85-90%"} 1RM. Foundation for sled push.`},
          {name:"Romanian Deadlift", sets:"4", reps:"8-10", note:"Hamstring/glute strength for compromised running"},
          {name:"Bulgarian Split Squat", sets:"3", reps:"8 each leg", note:"Single-leg stability for lunges"}
        ]},
        {label:"SLED CONDITIONING — 20 min", items:[
          {name:"Sled Push", sets:phase==="BASE"?"4":phase==="BUILD"?"5":"6", reps:"50m heavy", note:"M: 152kg / W: 102kg race weight. 1:1 work:rest"},
          {name:"Sled Pull", sets:"4", reps:"50m heavy", note:"M: 103kg / W: 78kg. Hand-over-hand technique"},
          {name:"Farmer Carry", sets:"3", reps:"100m", note:"Heavy KBs. Grip work for race day"}
        ]}
      ]
    };
  }

  // PULL = Run intervals + SkiErg/Row threshold
  if (dayType === "PULL") {
    const interval = phase==="BASE" ? "6×400m @ 5K pace, 90s rest" : phase==="BUILD" ? "5×800m @ 10K pace, 2min rest" : "4×1km @ race pace, 2min rest";
    const ski = phase==="BASE" ? "5×500m SkiErg, 90s rest" : phase==="BUILD" ? "4×750m SkiErg, 2min rest" : "3×1000m SkiErg @ race pace";
    const row = phase==="BASE" ? "5×500m Row, 90s rest" : phase==="BUILD" ? "4×750m Row, 2min rest" : "3×1000m Row @ race pace";
    return {
      phase, title:"Run Intervals + Ergs",
      blocks: [
        {label:"RUN INTERVALS — 30 min", items:[
          {name:"Run Warm-up", sets:"-", reps:"10 min easy", note:"Build to 70% HR, dynamic mobility"},
          {name:"Track/Treadmill Intervals", sets:"-", reps:interval, note:"Maintain pace across all reps"},
          {name:"Cool Down", sets:"-", reps:"5 min easy", note:""}
        ]},
        {label:"ERG WORK — 20 min", items:[
          {name:"SkiErg Intervals", sets:"-", reps:ski, note:"Target 1:50-2:00/500m for men, 2:05-2:15 for women"},
          {name:"Row Intervals", sets:"-", reps:row, note:"Damper 5-7. Legs-back-arms sequence"}
        ]}
      ]
    };
  }

  // LEGS = Strength (Upper) + Wall Balls/Burpees
  if (dayType === "LEGS") {
    return {
      phase, title:"Strength (Upper) + Stations",
      blocks: [
        {label:"UPPER STRENGTH — 20 min", items:[
          {name:"Pull-Up", sets:"4", reps:phase==="BASE"?"6-8":"AMRAP", note:"Weighted if able. Back strength = better SkiErg/Row"},
          {name:"Overhead Press", sets:"4", reps:"6-8", note:"Shoulder strength for wall balls"},
          {name:"Bent-Over Row", sets:"3", reps:"8-10", note:"Posterior chain durability"}
        ]},
        {label:"STATION SKILL WORK — 25 min", items:[
          {name:"Wall Balls", sets:"5", reps:phase==="BASE"?"15":phase==="BUILD"?"20":"25 unbroken", note:"M: 6kg/10ft / W: 4kg/9ft. Build to unbroken sets of 25-30"},
          {name:"Burpee Broad Jumps", sets:"4", reps:"10 reps", note:"60s rest. Practice efficient race pace"},
          {name:"Sandbag Lunges", sets:"3", reps:"50m", note:"M: 20kg / W: 10kg. Front-rack hold"}
        ]}
      ]
    };
  }

  // FULL = HYROX simulation / compromised running ("Roxzone")
  if (dayType === "FULL") {
    if (phase === "BASE") {
      return {
        phase, title:"Mini HYROX Simulation",
        blocks: [
          {label:"4 ROUNDS — Compromised Running Intro", items:[
            {name:"Run", sets:"-", reps:"500m", note:"Moderate pace"},
            {name:"Wall Balls", sets:"-", reps:"25 reps", note:""},
            {name:"Run", sets:"-", reps:"500m", note:""},
            {name:"Burpee Broad Jumps", sets:"-", reps:"10 reps", note:""}
          ]},
          {label:"FINISHER", items:[
            {name:"Sandbag Carry", sets:"-", reps:"200m", note:"Bear hug. Just survive."}
          ]}
        ]
      };
    } else if (phase === "BUILD") {
      return {
        phase, title:"Half HYROX Simulation",
        blocks: [
          {label:"4 ROUNDS — Race Pace Practice", items:[
            {name:"Run", sets:"-", reps:"1km", note:"Race pace (target sub-5:00 men, sub-5:30 women)"},
            {name:"Station 1: SkiErg", sets:"-", reps:"500m", note:""},
            {name:"Run", sets:"-", reps:"1km", note:""},
            {name:"Station 2: Sled Push (light)", sets:"-", reps:"50m", note:"60-70% race weight"},
            {name:"Run", sets:"-", reps:"1km", note:""},
            {name:"Station 3: Burpee Broad Jumps", sets:"-", reps:"40m (~12 reps)", note:""},
            {name:"Run", sets:"-", reps:"1km", note:""},
            {name:"Station 4: Wall Balls", sets:"-", reps:"40 reps", note:""}
          ]}
        ]
      };
    } else {
      return {
        phase, title:"Full HYROX Race Sim",
        blocks: [
          {label:"FULL RACE SIMULATION", items:[
            {name:"1km Run + 1000m SkiErg", sets:"-", reps:"Round 1", note:"Race pace. Time it."},
            {name:"1km Run + 50m Sled Push", sets:"-", reps:"Round 2", note:"Race weight if available"},
            {name:"1km Run + 50m Sled Pull", sets:"-", reps:"Round 3", note:""},
            {name:"1km Run + 80m Burpee Broad Jumps", sets:"-", reps:"Round 4", note:""},
            {name:"1km Run + 1000m Row", sets:"-", reps:"Round 5", note:""},
            {name:"1km Run + 200m Farmer Carry", sets:"-", reps:"Round 6", note:""},
            {name:"1km Run + 100m Sandbag Lunges", sets:"-", reps:"Round 7", note:""},
            {name:"1km Run + 75-100 Wall Balls", sets:"-", reps:"Round 8", note:"Target sub-1:25:00 men, sub-1:35:00 women"}
          ]}
        ]
      };
    }
  }

  // CARDIO day - long Z2 + threshold
  return {
    phase, title:"Z2 Endurance Run",
    blocks: [
      {label:"LONG STEADY STATE", items:[
        {name:"Z2 Run", sets:"-", reps:phase==="BASE"?"45-60 min":phase==="BUILD"?"60-75 min":"45 min easy", note:"HR 65-75% max. Conversational. Build aerobic base."}
      ]}
    ]
  };
}

// HYROX session renderer
function HyroxSession({week, dayType, totalWeeks, sessions, setSessions, coachMsg, sk}) {
  const wo = getHyroxWorkout(week, dayType, totalWeeks);
  const saved = sessions[sk] || {};
  const [setLogs, setSetLogs] = useState(saved.setLogs || {});
  const [notes, setNotes] = useState(saved.notes || "");
  const [done, setDone] = useState(saved.done || false);
  const [raceTime, setRaceTime] = useState(saved.raceTime || "");
  const go = useRef(false);

  useEffect(()=>{
    go.current = false;
    const s = sessions[sk] || {};
    setSetLogs(s.setLogs || {});
    setNotes(s.notes || "");
    setDone(s.done || false);
    setRaceTime(s.raceTime || "");
  }, [sk]);

  useEffect(()=>{
    if(!go.current){go.current=true;return;}
    setSessions(prev=>({...prev, [sk]:{...(prev[sk]||{}), setLogs, notes, done, raceTime, savedAt:new Date().toISOString(), hyrox:true}}));
  }, [setLogs, notes, done, raceTime]);

  const updSet = (n,i,f,v)=>{const k=`${n}__${i}`;setSetLogs(p=>({...p,[k]:{...(p[k]||{}),[f]:v}}));};
  const togSet = (n,i)=>{const k=`${n}__${i}`;setSetLogs(p=>({...p,[k]:{...(p[k]||{}),done:!(p[k]?.done)}}));};
  const phaseColor = wo.phase==="BASE"?C.a3:wo.phase==="BUILD"?C.a6:wo.phase==="RACE PREP"?C.a2:C.a5;

  return (
    <>
      <div style={{...card, marginBottom:10}}>
        <div style={{padding:"11px 13px", borderBottom:`1px solid ${C.bd}`, display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <div style={{flex:1}}>
            <div style={{...IMP, fontSize:16, fontWeight:900, color:C.a2}}>HYROX — {wo.title}</div>
            <div style={{fontSize:10, color:C.mu, marginTop:2}}>HYROX Race Prep · Week {week}/{totalWeeks}</div>
          </div>
          <div style={{...imp(10, phaseColor), padding:"3px 9px", border:`1px solid ${phaseColor}`, borderRadius:4}}>{wo.phase}</div>
        </div>

        {dayType==="FULL" && wo.phase!=="BASE" && (
          <div style={{padding:"9px 13px", borderBottom:`1px solid ${C.bd}`, background:"rgba(255,107,53,.05)"}}>
            <div style={{...imp(10, C.a2), marginBottom:6}}>RACE TIME (mm:ss)</div>
            <input value={raceTime} onChange={e=>setRaceTime(e.target.value)} placeholder="e.g. 1:24:35" style={{...inp, width:"100%", fontSize:13, ...IMP, fontWeight:700, letterSpacing:2}}/>
            <div style={{fontSize:10, color:C.mu, marginTop:5}}>Targets: Open M sub-1:25 / Open W sub-1:35 / Pro sub-1:00 (men) / sub-1:10 (women)</div>
          </div>
        )}

        {wo.blocks.map((block, bi) => (
          <div key={bi} style={{borderTop: bi>0 ? `1px solid ${C.bd}`:"none", padding:"10px 13px"}}>
            <div style={{...imp(10, C.a2), marginBottom:8}}>{block.label}</div>
            {block.items.map((item, ii) => {
              const numSets = parseInt(item.sets) || 0;
              return (
                <div key={ii} style={{padding:"7px 0", borderTop: ii>0 ? `1px solid rgba(255,255,255,.04)`:"none"}}>
                  <div style={{display:"flex", alignItems:"flex-start", gap:9}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13, fontWeight:600}}>{item.name}</div>
                      <div style={{fontSize:11, color:C.mu2, marginTop:2}}>
                        {item.sets!=="-" && <strong style={{color:C.tx}}>{item.sets} × {item.reps}</strong>}
                        {item.sets==="-" && <strong style={{color:C.tx}}>{item.reps}</strong>}
                        {item.note && <><br/><span style={{fontSize:10, fontStyle:"italic", color:C.mu}}>{item.note}</span></>}
                      </div>
                    </div>
                    {item.name && numSets===0 && (
                      <button onClick={()=>coachMsg(`How do I scale "${item.name}" for HYROX week ${week}? Goal is race prep.`)} style={{...hbtn, fontSize:9, padding:"2px 7px", flexShrink:0}}>SCALE</button>
                    )}
                  </div>
                  {numSets > 0 && (
                    <div style={{marginTop:6, display:"flex", flexDirection:"column", gap:4}}>
                      {Array.from({length:numSets},(_,i)=>{
                        const k = `${item.name}__${i}`; const lg = setLogs[k] || {};
                        return (
                          <div key={i} style={{display:"flex", gap:6, alignItems:"center"}}>
                            <div style={{width:30, height:26, background:lg.done?C.acc:C.s3, borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center", ...IMP, fontSize:11, fontWeight:900, color:lg.done?"#000":C.mu, border:`1px solid ${lg.done?C.acc:C.bd}`, flexShrink:0}}>{i+1}</div>
                            <input type="number" value={lg.weight||""} onChange={e=>updSet(item.name,i,"weight",e.target.value)} placeholder="lbs/kg" style={{flex:1, height:26, ...inp, padding:"0 8px", ...IMP, fontWeight:700, fontSize:12, border:`1px solid ${lg.done?"rgba(232,255,71,.4)":C.bd}`}}/>
                            <input type="text" value={lg.reps||""} onChange={e=>updSet(item.name,i,"reps",e.target.value)} placeholder="reps/time" style={{width:62, height:26, ...inp, padding:"0 8px", ...IMP, fontWeight:700, fontSize:11, border:`1px solid ${lg.done?"rgba(232,255,71,.4)":C.bd}`}}/>
                            <button onClick={()=>togSet(item.name,i)} style={{width:26, height:26, borderRadius:4, border:`1px solid ${lg.done?C.acc:C.bd}`, background:lg.done?C.acc:"transparent", color:lg.done?"#000":C.mu, cursor:"pointer", fontSize:11, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>✓</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        <div style={{padding:"10px 13px", borderTop:`1px solid ${C.bd}`, display:"flex", gap:8, flexWrap:"wrap"}}>
          <button onClick={()=>coachMsg(`Explain HYROX phase "${wo.phase}" and what I should focus on this week. I'm ${week} of ${totalWeeks} weeks out from race.`)} style={hbtn}>EXPLAIN PHASE</button>
          <button onClick={()=>coachMsg(`HYROX race day strategy — pacing, fueling, station-specific tips. ${totalWeeks-week} weeks until race.`)} style={hbtn}>RACE STRATEGY</button>
          <button onClick={()=>coachMsg(`What HYROX times should I be hitting on each station for my goal? Open or Pro division?`)} style={hbtn}>STATION TIMES</button>
        </div>
      </div>

      <div style={card}>
        <div style={{padding:"9px 13px", borderBottom:`1px solid ${C.bd}`, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div style={imp(12,C.mu2)}>SESSION LOG</div>
          {done && <div style={{...imp(10,C.a4), border:`1px solid ${C.a4}`, padding:"2px 8px", borderRadius:3}}>✓ DONE</div>}
        </div>
        <div style={{padding:"12px 13px"}}>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Splits, weights, how it felt, what to adjust..." style={{width:"100%", background:C.s2, border:`1px solid ${C.bd}`, color:C.tx, padding:"8px 10px", borderRadius:4, fontSize:12, resize:"none", minHeight:60, outline:"none", lineHeight:1.6, fontFamily:"inherit"}}/>
          <label style={{display:"flex", alignItems:"center", gap:6, fontSize:12, color:C.mu2, cursor:"pointer", marginTop:8}}>
            <input type="checkbox" checked={done} onChange={e=>setDone(e.target.checked)} style={{accentColor:C.acc, width:14, height:14}}/>Mark Complete
            <span style={{...imp(10,C.mu), marginLeft:8}}>AUTO-SAVED</span>
          </label>
        </div>
      </div>
    </>
  );
}

// HYROX HYBRID - blends HYROX race prep + heavy strength training + kettlebell complexes
// Designed for athletes who want race readiness AND hypertrophy/strength gains
// Weekly split: Mon=Heavy Lower+Sled, Tue=KB Complex+Run, Wed=Heavy Upper+Stations, Thu=Z2/Recovery, Fri=Race Sim/Hybrid Conditioning

function getHybridWorkout(week, dayType, totalWeeks) {
  const tw = parseInt(totalWeeks) || 12;
  const wk = parseInt(week);
  const phasePct = wk / tw;
  const phase = phasePct <= 0.4 ? "BASE" : phasePct <= 0.75 ? "BUILD" : phasePct < 1 ? "PEAK" : "TAPER";
  const isDeload = wk === tw;

  if (isDeload) {
    return {
      phase: "TAPER",
      title: "Recovery + Mobility",
      blocks: [
        {label:"DELOAD", items:[
          {name:"All lifts at 50-60% intensity", sets:"2-3", reps:"5-6", note:"Quality reps, no fatigue. Stay sharp."},
          {name:"KB Halos + Goblet Squat (light)", sets:"3", reps:"8-10 each", note:"Mobility-focused"},
          {name:"Z2 Run", sets:"-", reps:"20-25 min", note:"Conversational pace only"}
        ]}
      ]
    };
  }

  // MONDAY = Heavy Lower + Sled (strength priority + race-specific)
  if (dayType === "PUSH") {
    return {
      phase, title: "Heavy Lower + Sled",
      blocks: [
        {label:"PRIMARY STRENGTH — 25 min", items:[
          {name:"Back Squat", sets:phase==="BASE"?"5":phase==="BUILD"?"5":"4",
           reps:phase==="BASE"?"5":phase==="BUILD"?"3-5":"2-3",
           note:`${phase==="BASE"?"75-80%":phase==="BUILD"?"82-87%":"88-92%"} 1RM. Build leg strength for sled push.`},
          {name:"Trap Bar Deadlift", sets:"4", reps:phase==="BASE"?"6":"4-5",
           note:`${phase==="BASE"?"75%":phase==="BUILD"?"82%":"87%"} 1RM. Posterior chain power.`},
          {name:"Bulgarian Split Squat", sets:"3", reps:"8 each leg", note:"Single-leg strength for sandbag lunges"}
        ]},
        {label:"KETTLEBELL ACCESSORY — 12 min", items:[
          {name:"KB Goblet Squat", sets:"3", reps:"12-15", note:"Heavy KB. Front-loaded squat pattern"},
          {name:"KB Single-Leg RDL", sets:"3", reps:"8 each leg", note:"Hip stability + balance"}
        ]},
        {label:"SLED CONDITIONING — 20 min", items:[
          {name:"Sled Push (race weight)", sets:phase==="BASE"?"4":phase==="BUILD"?"5":"6",
           reps:"50m", note:"M: 152kg / W: 102kg. 1:1 work:rest"},
          {name:"Sled Pull", sets:"4", reps:"50m heavy", note:"M: 103kg / W: 78kg. Hand-over-hand"},
          {name:"Heavy Farmer Carry", sets:"3", reps:"100m", note:"Heaviest KBs available. Grip endurance."}
        ]}
      ]
    };
  }

  // TUESDAY = KB Complex + Run Intervals (conditioning + work capacity)
  if (dayType === "PULL") {
    const interval = phase==="BASE" ? "6×400m @ 5K pace, 90s rest" : phase==="BUILD" ? "5×800m @ 10K pace, 2min rest" : "4×1km @ race pace, 2min rest";
    return {
      phase, title: "KB Complex + Run Intervals",
      blocks: [
        {label:"KB COMPLEX BLOCK — 20 min", items:[
          {name:`KB Clean & Press Complex (${phase==="BASE"?"3":phase==="BUILD"?"4":"5"} rounds)`,
           sets:"-", reps:"5 swings + 5 cleans + 5 press + 5 squats each side",
           note:`M: 24kg KB / W: 16kg KB. Rest 90s between rounds. Full body integration.`},
          {name:`KB Snatch Test`, sets:"-",
           reps:phase==="BASE"?"5×10 each side":"5×12 each side",
           note:"Race-specific power endurance. M: 24kg / W: 16kg"},
          {name:"KB Turkish Get-Up", sets:"3", reps:"3 each side",
           note:"Heavy KB. Total body stability."}
        ]},
        {label:"RUN INTERVALS — 25 min", items:[
          {name:"Run Warm-up", sets:"-", reps:"10 min easy", note:"Build to 70% HR"},
          {name:"Track/Treadmill Intervals", sets:"-", reps:interval, note:"Maintain pace across all reps"},
          {name:"Cool Down Jog", sets:"-", reps:"5 min", note:""}
        ]},
        {label:"FINISHER — 8 min", items:[
          {name:"EMOM 8: 10 KB Swings (heavy) + 5 Burpees",
           sets:"-", reps:"8 rounds", note:"M: 32kg KB / W: 24kg KB. Compromised conditioning."}
        ]}
      ]
    };
  }

  // WEDNESDAY = CARDIO day - Z2 long run + station skill (active recovery)
  // (Routed through cardio path naturally - HYROX Hybrid uses CARDIO day for long Z2)

  // THURSDAY = Heavy Upper + Stations
  if (dayType === "LEGS") {
    return {
      phase, title: "Heavy Upper + Stations",
      blocks: [
        {label:"PRIMARY UPPER STRENGTH — 25 min", items:[
          {name:"Weighted Pull-Up", sets:"5",
           reps:phase==="BASE"?"5":phase==="BUILD"?"3-5":"2-3",
           note:`${phase==="BASE"?"BW+25 lbs":phase==="BUILD"?"BW+40 lbs":"BW+55 lbs"} or AMRAP. Back strength = better SkiErg/Row.`},
          {name:"Standing Overhead Press", sets:"4",
           reps:phase==="BASE"?"6":"4-5",
           note:`${phase==="BASE"?"75%":phase==="BUILD"?"82%":"88%"} 1RM. Wall ball shoulder strength.`},
          {name:"Pendlay Row", sets:"4", reps:"6-8",
           note:"Explosive pull from floor. Sled pull simulation."}
        ]},
        {label:"KETTLEBELL UPPER — 12 min", items:[
          {name:"KB Push Press (alternating)", sets:"4", reps:"6 each side",
           note:"M: 24kg / W: 16kg. Power output for race day."},
          {name:"KB Renegade Row", sets:"3", reps:"8 each side",
           note:"M: 20kg KB / W: 12kg KB. Anti-rotation core + back."}
        ]},
        {label:"STATION SKILL WORK — 22 min", items:[
          {name:"Wall Balls", sets:"5",
           reps:phase==="BASE"?"15 unbroken":phase==="BUILD"?"20 unbroken":"25 unbroken",
           note:"M: 6kg/10ft / W: 4kg/9ft. Build to unbroken sets of 30."},
          {name:"Burpee Broad Jumps", sets:"4", reps:"10 reps", note:"60s rest. Race pace efficiency."},
          {name:"Sandbag Front-Rack Lunge", sets:"3", reps:"50m",
           note:"M: 20kg / W: 10kg. Quad/glute endurance."}
        ]}
      ]
    };
  }

  // FRIDAY = Race Simulation OR Hybrid Conditioning depending on phase
  if (dayType === "FULL") {
    if (phase === "BASE") {
      return {
        phase, title: "Hybrid Conditioning Circuit",
        blocks: [
          {label:"4 ROUNDS for time", items:[
            {name:"Run", sets:"-", reps:"400m", note:"Moderate pace"},
            {name:"KB Swings (heavy)", sets:"-", reps:"20 reps", note:"M: 32kg / W: 24kg"},
            {name:"Wall Balls", sets:"-", reps:"20 reps", note:""},
            {name:"KB Goblet Squats", sets:"-", reps:"15 reps", note:"M: 24kg / W: 16kg"},
            {name:"Burpees", sets:"-", reps:"10 reps", note:""}
          ]},
          {label:"FINISHER", items:[
            {name:"Sandbag Bear Hug Carry", sets:"-", reps:"200m", note:"Just survive. Mental toughness."}
          ]}
        ]
      };
    } else if (phase === "BUILD") {
      return {
        phase, title: "Half HYROX + KB Hybrid",
        blocks: [
          {label:"HYBRID RACE SIM", items:[
            {name:"Run", sets:"-", reps:"1km", note:"Race pace"},
            {name:"SkiErg", sets:"-", reps:"500m", note:""},
            {name:"Run", sets:"-", reps:"1km", note:""},
            {name:"KB Snatches", sets:"-", reps:"30 reps (15/side)", note:"M: 24kg / W: 16kg"},
            {name:"Run", sets:"-", reps:"1km", note:""},
            {name:"Sled Push (75% race weight)", sets:"-", reps:"50m", note:""},
            {name:"Run", sets:"-", reps:"1km", note:""},
            {name:"Wall Balls + KB Swings", sets:"-", reps:"30 + 30", note:"Alternating"}
          ]}
        ]
      };
    } else {
      return {
        phase, title: "Full HYROX Race Simulation",
        blocks: [
          {label:"FULL RACE SIM (time it)", items:[
            {name:"1km Run + 1000m SkiErg", sets:"-", reps:"Round 1", note:"Race pace"},
            {name:"1km Run + 50m Sled Push", sets:"-", reps:"Round 2", note:"Race weight"},
            {name:"1km Run + 50m Sled Pull", sets:"-", reps:"Round 3", note:""},
            {name:"1km Run + 80m Burpee Broad Jumps", sets:"-", reps:"Round 4", note:""},
            {name:"1km Run + 1000m Row", sets:"-", reps:"Round 5", note:""},
            {name:"1km Run + 200m Farmer Carry", sets:"-", reps:"Round 6", note:""},
            {name:"1km Run + 100m Sandbag Lunges", sets:"-", reps:"Round 7", note:""},
            {name:"1km Run + 75-100 Wall Balls", sets:"-", reps:"Round 8", note:"Targets: M sub-1:25 / W sub-1:35"}
          ]}
        ]
      };
    }
  }

  // CARDIO day - Long Z2 + station skill work (active recovery)
  return {
    phase, title: "Z2 Endurance + Skill",
    blocks: [
      {label:"LONG Z2 RUN", items:[
        {name:"Z2 Run", sets:"-",
         reps:phase==="BASE"?"45-60 min":phase==="BUILD"?"60-75 min":"45 min easy",
         note:"HR 65-75% max. Conversational. Aerobic base building."}
      ]},
      {label:"STATION SKILL FINISHER — 10 min", items:[
        {name:"KB Get-Ups", sets:"3", reps:"2 each side", note:"Light KB. Mobility-focused."},
        {name:"Wall Ball Practice", sets:"3", reps:"15 reps", note:"Focus on form, not pace"}
      ]}
    ]
  };
}

// HYROX Hybrid session renderer (reuses HyroxSession structure but with different programming)
function HybridSession({week, dayType, totalWeeks, sessions, setSessions, coachMsg, sk}) {
  const wo = getHybridWorkout(week, dayType, totalWeeks);
  const saved = sessions[sk] || {};
  const [setLogs, setSetLogs] = useState(saved.setLogs || {});
  const [notes, setNotes] = useState(saved.notes || "");
  const [done, setDone] = useState(saved.done || false);
  const [raceTime, setRaceTime] = useState(saved.raceTime || "");
  const go = useRef(false);

  useEffect(()=>{
    go.current = false;
    const s = sessions[sk] || {};
    setSetLogs(s.setLogs || {});
    setNotes(s.notes || "");
    setDone(s.done || false);
    setRaceTime(s.raceTime || "");
  }, [sk]);

  useEffect(()=>{
    if(!go.current){go.current=true;return;}
    setSessions(prev=>({...prev, [sk]:{...(prev[sk]||{}), setLogs, notes, done, raceTime, savedAt:new Date().toISOString(), hybrid:true}}));
  }, [setLogs, notes, done, raceTime]);

  const updSet = (n,i,f,v)=>{const k=`${n}__${i}`;setSetLogs(p=>({...p,[k]:{...(p[k]||{}),[f]:v}}));};
  const togSet = (n,i)=>{const k=`${n}__${i}`;setSetLogs(p=>({...p,[k]:{...(p[k]||{}),done:!(p[k]?.done)}}));};
  const phaseColor = wo.phase==="BASE"?C.a3:wo.phase==="BUILD"?C.a6:wo.phase==="PEAK"?C.a2:C.a5;

  return (
    <>
      <div style={{...card, marginBottom:10}}>
        <div style={{padding:"11px 13px", borderBottom:`1px solid ${C.bd}`, display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <div style={{flex:1}}>
            <div style={{...IMP, fontSize:16, fontWeight:900, color:C.acc}}>HYBRID — {wo.title}</div>
            <div style={{fontSize:10, color:C.mu, marginTop:2}}>HYROX + Strength + KB · Week {week}/{totalWeeks}</div>
          </div>
          <div style={{...imp(10, phaseColor), padding:"3px 9px", border:`1px solid ${phaseColor}`, borderRadius:4}}>{wo.phase}</div>
        </div>

        {dayType==="FULL" && wo.phase!=="BASE" && (
          <div style={{padding:"9px 13px", borderBottom:`1px solid ${C.bd}`, background:"rgba(232,255,71,.05)"}}>
            <div style={{...imp(10, C.acc), marginBottom:6}}>RACE/SIM TIME</div>
            <input value={raceTime} onChange={e=>setRaceTime(e.target.value)} placeholder="e.g. 1:24:35 or AMRAP score" style={{...inp, width:"100%", fontSize:13, ...IMP, fontWeight:700, letterSpacing:2}}/>
            <div style={{fontSize:10, color:C.mu, marginTop:5}}>HYROX targets: Open M sub-1:25 / Open W sub-1:35 / Pro sub-1:00 (M) / sub-1:10 (W)</div>
          </div>
        )}

        {wo.blocks.map((block, bi) => (
          <div key={bi} style={{borderTop: bi>0 ? `1px solid ${C.bd}`:"none", padding:"10px 13px"}}>
            <div style={{...imp(10, C.acc), marginBottom:8}}>{block.label}</div>
            {block.items.map((item, ii) => {
              const numSets = parseInt(item.sets) || 0;
              const prev = numSets > 0 ? getPrevLog(sessions, item.name, sk) : null;
              return (
                <div key={ii} style={{padding:"7px 0", borderTop: ii>0 ? `1px solid rgba(255,255,255,.04)`:"none"}}>
                  <div style={{display:"flex", alignItems:"flex-start", gap:9}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13, fontWeight:600}}>{item.name}</div>
                      <div style={{fontSize:11, color:C.mu2, marginTop:2}}>
                        {item.sets!=="-" && <strong style={{color:C.tx}}>{item.sets} × {item.reps}</strong>}
                        {item.sets==="-" && <strong style={{color:C.tx}}>{item.reps}</strong>}
                        {item.note && <><br/><span style={{fontSize:10, fontStyle:"italic", color:C.mu}}>{item.note}</span></>}
                      </div>
                    </div>
                    <button onClick={()=>coachMsg(`Swap "${item.name}" in my HYROX Hybrid week ${week} ${dayType} workout. Phase: ${wo.phase}. Give 3 alternatives that match my equipment.`)} style={{...hbtn, fontSize:9, padding:"2px 7px", flexShrink:0}}>SWAP</button>
                  </div>
                  {prev && prev.weight && (
                    <div style={{display:"flex", alignItems:"center", gap:8, padding:"4px 8px", background:"rgba(232,255,71,.06)", border:"1px solid rgba(232,255,71,.18)", borderRadius:4, margin:"5px 0"}}>
                      <div style={{...IMP, fontSize:13, fontWeight:900, color:C.acc, flexShrink:0}}>→ {prev.weight}</div>
                      <div style={{fontSize:9, color:C.mu, lineHeight:1.4, flex:1}}>Last: {prev.weight}lbs × {prev.reps}reps</div>
                    </div>
                  )}
                  {numSets > 0 && (
                    <div style={{marginTop:6, display:"flex", flexDirection:"column", gap:4}}>
                      {Array.from({length:numSets},(_,i)=>{
                        const k = `${item.name}__${i}`; const lg = setLogs[k] || {};
                        return (
                          <div key={i} style={{display:"flex", gap:6, alignItems:"center"}}>
                            <div style={{width:30, height:26, background:lg.done?C.acc:C.s3, borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center", ...IMP, fontSize:11, fontWeight:900, color:lg.done?"#000":C.mu, border:`1px solid ${lg.done?C.acc:C.bd}`, flexShrink:0}}>{i+1}</div>
                            <input type="number" value={lg.weight||""} onChange={e=>updSet(item.name,i,"weight",e.target.value)} placeholder={prev?.weight?`${prev.weight}`:"lbs/kg"} style={{flex:1, height:26, ...inp, padding:"0 8px", ...IMP, fontWeight:700, fontSize:12, border:`1px solid ${lg.done?"rgba(232,255,71,.4)":C.bd}`}}/>
                            <input type="text" value={lg.reps||""} onChange={e=>updSet(item.name,i,"reps",e.target.value)} placeholder="reps" style={{width:62, height:26, ...inp, padding:"0 8px", ...IMP, fontWeight:700, fontSize:11, border:`1px solid ${lg.done?"rgba(232,255,71,.4)":C.bd}`}}/>
                            <button onClick={()=>togSet(item.name,i)} style={{width:26, height:26, borderRadius:4, border:`1px solid ${lg.done?C.acc:C.bd}`, background:lg.done?C.acc:"transparent", color:lg.done?"#000":C.mu, cursor:"pointer", fontSize:11, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>✓</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        <div style={{padding:"10px 13px", borderTop:`1px solid ${C.bd}`, display:"flex", gap:8, flexWrap:"wrap"}}>
          <button onClick={()=>coachMsg(`Explain HYROX Hybrid phase "${wo.phase}" — what's the focus this week? I'm ${week}/${totalWeeks}.`)} style={hbtn}>EXPLAIN PHASE</button>
          <button onClick={()=>coachMsg(`KB sizing recommendations for HYROX Hybrid — what weight should I use for swings, snatches, get-ups based on my level?`)} style={hbtn}>KB SIZING</button>
          <button onClick={()=>coachMsg(`How should I balance heavy lifting with race prep? Am I doing too much volume?`)} style={hbtn}>BALANCE</button>
        </div>
      </div>

      <div style={card}>
        <div style={{padding:"9px 13px", borderBottom:`1px solid ${C.bd}`, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div style={imp(12,C.mu2)}>SESSION LOG</div>
          {done && <div style={{...imp(10,C.a4), border:`1px solid ${C.a4}`, padding:"2px 8px", borderRadius:3}}>✓ DONE</div>}
        </div>
        <div style={{padding:"12px 13px"}}>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Lifts, KB weights, splits, how it felt..." style={{width:"100%", background:C.s2, border:`1px solid ${C.bd}`, color:C.tx, padding:"8px 10px", borderRadius:4, fontSize:12, resize:"none", minHeight:60, outline:"none", lineHeight:1.6, fontFamily:"inherit"}}/>
          <label style={{display:"flex", alignItems:"center", gap:6, fontSize:12, color:C.mu2, cursor:"pointer", marginTop:8}}>
            <input type="checkbox" checked={done} onChange={e=>setDone(e.target.checked)} style={{accentColor:C.acc, width:14, height:14}}/>Mark Complete
            <span style={{...imp(10,C.mu), marginLeft:8}}>AUTO-SAVED</span>
          </label>
        </div>
      </div>
    </>
  );
}

function RunsView({runs,setRuns,coachMsg}){
  const [showAdd,setShowAdd]=useState(false);
  const [filter,setFilter]=useState("all");
  const localToday=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};
  const [form,setForm]=useState({date:localToday(),distance:"",unit:"mi",timeH:"",timeM:"",timeS:"",type:"easy",hr:"",notes:"",elevation:"",route:""});

  const reset=()=>setForm({date:localToday(),distance:"",unit:"mi",timeH:"",timeM:"",timeS:"",type:"easy",hr:"",notes:"",elevation:"",route:""});

  const totalSec=()=>(parseInt(form.timeH)||0)*3600+(parseInt(form.timeM)||0)*60+(parseInt(form.timeS)||0);

  const addRun=()=>{
    const d=parseFloat(form.distance);const t=totalSec();
    if(!d||d<=0||!t)return;
    const distMi=form.unit==="km"?d*0.621371:d;
    const distKm=form.unit==="km"?d:d*1.60934;
    const paceSec=t/distMi; // sec per mile
    const paceKmSec=t/distKm; // sec per km
    const entry={
      id:Date.now(),
      date:form.date,
      distance:d,
      unit:form.unit,
      distMi:Math.round(distMi*100)/100,
      distKm:Math.round(distKm*100)/100,
      seconds:t,
      paceSec:Math.round(paceSec),
      paceKmSec:Math.round(paceKmSec),
      type:form.type,
      hr:parseInt(form.hr)||null,
      elevation:parseInt(form.elevation)||null,
      route:form.route||"",
      notes:form.notes||""
    };
    setRuns(r=>[...r,entry]);
    reset();
    setShowAdd(false);
  };

  const fmtTime=(sec)=>{
    const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=Math.floor(sec%60);
    return h>0?`${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${m}:${String(s).padStart(2,"0")}`;
  };

  const fmtPace=(secPer)=>{
    if(!secPer||!isFinite(secPer))return "—";
    const m=Math.floor(secPer/60),s=Math.floor(secPer%60);
    return `${m}:${String(s).padStart(2,"0")}`;
  };

  const filtered=filter==="all"?runs:runs.filter(r=>r.type===filter);
  const sorted=[...filtered].sort((a,b)=>b.date.localeCompare(a.date));

  // Stats
  const totalMi=runs.reduce((s,r)=>s+r.distMi,0);
  const totalKm=runs.reduce((s,r)=>s+r.distKm,0);
  const totalSeconds=runs.reduce((s,r)=>s+r.seconds,0);
  const totalRuns=runs.length;
  // This week
  const today=new Date();today.setHours(0,0,0,0);
  const weekStart=new Date(today);weekStart.setDate(today.getDate()-((today.getDay()+6)%7));
  const wkRuns=runs.filter(r=>new Date(r.date+"T00:00:00")>=weekStart);
  const wkMi=wkRuns.reduce((s,r)=>s+r.distMi,0);
  // PRs by common distances
  const findPR=(targetMi,tolerance=0.05)=>{
    const candidates=runs.filter(r=>Math.abs(r.distMi-targetMi)/targetMi<=tolerance);
    if(!candidates.length)return null;
    return candidates.reduce((best,r)=>!best||r.seconds<best.seconds?r:best,null);
  };
  const prs=[
    {name:"1 Mile",mi:1,pr:findPR(1,0.05)},
    {name:"5K",mi:3.1069,pr:findPR(3.1069,0.05)},
    {name:"10K",mi:6.2137,pr:findPR(6.2137,0.05)},
    {name:"Half Marathon",mi:13.1094,pr:findPR(13.1094,0.04)},
    {name:"Marathon",mi:26.2188,pr:findPR(26.2188,0.04)}
  ];

  const RUN_TYPES=[
    {v:"easy",l:"Easy / Z2",col:C.a4},
    {v:"intervals",l:"Intervals",col:C.a2},
    {v:"tempo",l:"Tempo",col:C.a6},
    {v:"long",l:"Long Run",col:C.a3},
    {v:"race",l:"Race",col:C.a5},
    {v:"trail",l:"Trail",col:C.a4},
    {v:"recovery",l:"Recovery",col:C.mu2}
  ];

  return(
    <div style={{height:"100%",overflowY:"auto",padding:14}}>

      {/* Stats summary */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:11}}>
        <div style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:6,padding:"10px 8px",textAlign:"center"}}>
          <div style={{...IMP,fontSize:20,color:C.acc}}>{totalRuns}</div>
          <div style={{fontSize:9,color:C.mu,letterSpacing:1,marginTop:2}}>TOTAL RUNS</div>
        </div>
        <div style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:6,padding:"10px 8px",textAlign:"center"}}>
          <div style={{...IMP,fontSize:20,color:C.a3}}>{totalMi.toFixed(1)}</div>
          <div style={{fontSize:9,color:C.mu,letterSpacing:1,marginTop:2}}>TOTAL MILES</div>
        </div>
        <div style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:6,padding:"10px 8px",textAlign:"center"}}>
          <div style={{...IMP,fontSize:20,color:C.a4}}>{wkMi.toFixed(1)}</div>
          <div style={{fontSize:9,color:C.mu,letterSpacing:1,marginTop:2}}>THIS WEEK MI</div>
        </div>
      </div>

      {/* PRs */}
      {prs.some(p=>p.pr)&&(
        <div style={{...card,marginBottom:11}}>
          <div style={{padding:"9px 13px",borderBottom:`1px solid ${C.bd}`,...imp(11,C.a2)}}>🏆 PERSONAL RECORDS</div>
          <div style={{padding:"10px 13px",display:"flex",flexDirection:"column",gap:6}}>
            {prs.filter(p=>p.pr).map(p=>(
              <div key={p.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",background:C.s2,borderRadius:5,border:`1px solid ${C.bd}`}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600}}>{p.name}</div>
                  <div style={{fontSize:10,color:C.mu,marginTop:1}}>{new Date(p.pr.date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{...IMP,fontSize:16,color:C.acc,letterSpacing:1}}>{fmtTime(p.pr.seconds)}</div>
                  <div style={{fontSize:10,color:C.mu}}>{fmtPace(p.pr.paceSec)}/mi</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add button */}
      <button onClick={()=>setShowAdd(s=>!s)} style={{...abtn(),width:"100%",marginBottom:11}}>{showAdd?"CANCEL":"+ LOG NEW RUN"}</button>

      {/* Add run form */}
      {showAdd&&(
        <div style={{...card,marginBottom:11,borderTop:`3px solid ${C.acc}`}}>
          <div style={{padding:"12px 13px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:9}}>
              <div>
                <label style={lbl9}>Date</label>
                <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={{...inp,width:"100%"}}/>
              </div>
              <div>
                <label style={lbl9}>Type</label>
                <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={{...inp,width:"100%"}}>
                  {RUN_TYPES.map(t=><option key={t.v} value={t.v}>{t.l}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:8,marginBottom:9}}>
              <div>
                <label style={lbl9}>Distance</label>
                <input type="number" step="0.01" value={form.distance} onChange={e=>setForm({...form,distance:e.target.value})} placeholder="3.1" style={{...inp,width:"100%"}}/>
              </div>
              <div>
                <label style={lbl9}>Unit</label>
                <select value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} style={{...inp,width:"100%"}}>
                  <option value="mi">Miles</option>
                  <option value="km">KM</option>
                </select>
              </div>
            </div>
            <label style={lbl9}>Time</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:9}}>
              <input type="number" value={form.timeH} onChange={e=>setForm({...form,timeH:e.target.value})} placeholder="HR" style={{...inp,textAlign:"center"}}/>
              <input type="number" value={form.timeM} onChange={e=>setForm({...form,timeM:e.target.value})} placeholder="MIN" style={{...inp,textAlign:"center"}}/>
              <input type="number" value={form.timeS} onChange={e=>setForm({...form,timeS:e.target.value})} placeholder="SEC" style={{...inp,textAlign:"center"}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:9}}>
              <div>
                <label style={lbl9}>Avg HR (opt)</label>
                <input type="number" value={form.hr} onChange={e=>setForm({...form,hr:e.target.value})} placeholder="bpm" style={{...inp,width:"100%"}}/>
              </div>
              <div>
                <label style={lbl9}>Elevation (ft)</label>
                <input type="number" value={form.elevation} onChange={e=>setForm({...form,elevation:e.target.value})} placeholder="0" style={{...inp,width:"100%"}}/>
              </div>
            </div>
            <div style={{marginBottom:9}}>
              <label style={lbl9}>Route (opt)</label>
              <input value={form.route} onChange={e=>setForm({...form,route:e.target.value})} placeholder="Trinity Trail loop" style={{...inp,width:"100%"}}/>
            </div>
            <div style={{marginBottom:11}}>
              <label style={lbl9}>Notes</label>
              <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="How did it feel?" style={{...inp,width:"100%",minHeight:50,resize:"none",fontFamily:"inherit"}}/>
            </div>
            <button onClick={addRun} disabled={!form.distance||!totalSec()} style={{...abtn(),width:"100%",opacity:!form.distance||!totalSec()?.4:1}}>SAVE RUN</button>
          </div>
        </div>
      )}

      {/* Filter chips */}
      {runs.length>0&&(
        <div style={{display:"flex",gap:5,overflowX:"auto",marginBottom:9,paddingBottom:3}}>
          <button onClick={()=>setFilter("all")} style={{...hbtn,fontSize:10,padding:"4px 9px",borderColor:filter==="all"?C.acc:C.bd,color:filter==="all"?C.acc:C.mu}}>ALL</button>
          {RUN_TYPES.map(t=>{
            const count=runs.filter(r=>r.type===t.v).length;
            if(!count)return null;
            return(<button key={t.v} onClick={()=>setFilter(t.v)} style={{...hbtn,fontSize:10,padding:"4px 9px",borderColor:filter===t.v?t.col:C.bd,color:filter===t.v?t.col:C.mu,whiteSpace:"nowrap"}}>{t.l.toUpperCase()} ({count})</button>);
          })}
        </div>
      )}

      {/* Run history */}
      {runs.length===0?(
        <div style={{textAlign:"center",padding:30,color:C.mu,fontSize:12}}>
          <div style={{fontSize:32,marginBottom:8}}>🏃</div>
          No runs logged yet. Tap LOG NEW RUN to start tracking.
        </div>
      ):sorted.length===0?(
        <div style={{textAlign:"center",padding:18,color:C.mu,fontSize:12}}>No runs match this filter.</div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {sorted.map(r=>{
            const rt=RUN_TYPES.find(t=>t.v===r.type)||RUN_TYPES[0];
            return(
              <div key={r.id} style={{...card,padding:"10px 12px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                      <span style={{...IMP,fontSize:10,padding:"2px 7px",borderRadius:3,background:`${rt.col}20`,color:rt.col,letterSpacing:1}}>{rt.l.toUpperCase()}</span>
                      <span style={{fontSize:10,color:C.mu}}>{new Date(r.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:3}}>
                      <div><span style={{...IMP,fontSize:18,color:C.acc}}>{r.distance}</span> <span style={{fontSize:11,color:C.mu}}>{r.unit}</span></div>
                      <div><span style={{...IMP,fontSize:14,color:C.tx}}>{fmtTime(r.seconds)}</span></div>
                      <div><span style={{...IMP,fontSize:13,color:C.a3}}>{fmtPace(r.paceSec)}</span><span style={{fontSize:10,color:C.mu}}>/mi</span></div>
                    </div>
                    {(r.hr||r.elevation||r.route)&&(
                      <div style={{display:"flex",gap:9,fontSize:10,color:C.mu,flexWrap:"wrap",marginTop:3}}>
                        {r.hr&&<span>❤️ {r.hr} bpm</span>}
                        {r.elevation&&<span>⛰️ {r.elevation} ft</span>}
                        {r.route&&<span style={{fontStyle:"italic"}}>📍 {r.route}</span>}
                      </div>
                    )}
                    {r.notes&&<div style={{fontSize:11,color:C.mu2,marginTop:5,lineHeight:1.4}}>{r.notes}</div>}
                  </div>
                  <button onClick={()=>{if(confirm("Delete this run?"))setRuns(rl=>rl.filter(x=>x.id!==r.id));}} style={{background:"transparent",border:"none",color:C.mu,cursor:"pointer",fontSize:14,lineHeight:1,padding:0}}>×</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProgramSummary({profile,wlog,sessions,runs,onAcknowledge,onStartNew}){
  const startWeight=parseFloat(profile.weight);
  const endWeight=wlog.length?wlog[wlog.length-1].weight:startWeight;
  const weightChange=(endWeight-startWeight).toFixed(1);
  const targetReached=profile.targetWeight?Math.abs(endWeight-parseFloat(profile.targetWeight))<2:false;

  // Find lifting PRs (heaviest weight × reps for each unique exercise across all sessions)
  const liftPRs={};
  Object.values(sessions||{}).forEach(s=>{
    if(!s.setLogs)return;
    Object.entries(s.setLogs).forEach(([k,v])=>{
      if(!v.weight||!v.reps)return;
      const exName=k.split("__")[0];
      const w=parseFloat(v.weight);const r=parseInt(v.reps);
      if(!w||!r)return;
      // Estimated 1RM (Brzycki formula)
      const e1rm=r===1?w:w*(36/(37-Math.min(r,15)));
      const existing=liftPRs[exName];
      if(!existing||e1rm>existing.e1rm){
        liftPRs[exName]={weight:w,reps:r,e1rm:Math.round(e1rm),date:s.savedAt||""};
      }
    });
  });
  const topLifts=Object.entries(liftPRs).sort((a,b)=>b[1].e1rm-a[1].e1rm).slice(0,8);

  // Session completion stats
  const totalSessions=Object.values(sessions||{}).length;
  const completed=Object.values(sessions||{}).filter(s=>s.done).length;
  const skipped=Object.values(sessions||{}).filter(s=>s.skipped).length;
  const completionRate=totalSessions?Math.round((completed/totalSessions)*100):0;

  // Run stats
  const runStats={
    total:runs?.length||0,
    miles:(runs||[]).reduce((s,r)=>s+(r.distMi||0),0),
    longestRun:(runs||[]).reduce((b,r)=>!b||r.distMi>b.distMi?r:b,null),
    fastestPace:(runs||[]).reduce((b,r)=>!b||r.paceSec<b.paceSec?r:b,null)
  };

  const fmtTime=(sec)=>{
    if(!sec)return "—";
    const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=Math.floor(sec%60);
    return h>0?`${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${m}:${String(s).padStart(2,"0")}`;
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.95)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,padding:14,overflow:"auto"}}>
      <div style={{background:C.s1,border:`2px solid ${C.acc}`,borderRadius:10,padding:0,width:"100%",maxWidth:460,maxHeight:"94vh",overflowY:"auto",boxShadow:`0 0 40px ${C.acc}30`}}>

        {/* Header */}
        <div style={{padding:"22px 18px",textAlign:"center",borderBottom:`1px solid ${C.bd}`,background:`linear-gradient(135deg,${C.acc}15 0%,transparent 100%)`}}>
          <div style={{fontSize:38,marginBottom:6}}>🏆</div>
          <div style={{...IMP,fontSize:22,fontWeight:900,letterSpacing:3,color:C.acc,marginBottom:3}}>PROGRAM COMPLETE</div>
          <div style={{fontSize:12,color:C.mu}}>{profile.weeks}-Week {({rp_hypertrophy:"RP Hypertrophy",hyrox_hybrid:"HYROX Hybrid",functional_bb:"Functional Bodybuilding",traditional_bb:"Traditional Bodybuilding",crossfit:"CrossFit",hyrox:"HYROX",powerlifting:"Powerlifting",athletic:"Athletic Performance",hiit:"HIIT / Circuit"})[profile.workoutStyle]||profile.workoutStyle}</div>
        </div>

        {/* Body weight */}
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.bd}`}}>
          <div style={{...imp(10,C.a3),marginBottom:10}}>BODY WEIGHT</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:8,alignItems:"center",textAlign:"center"}}>
            <div>
              <div style={{fontSize:9,color:C.mu,letterSpacing:1,marginBottom:3}}>START</div>
              <div style={{...IMP,fontSize:24,color:C.tx}}>{startWeight}</div>
              <div style={{fontSize:9,color:C.mu}}>lbs</div>
            </div>
            <div style={{...IMP,fontSize:18,color:C.mu}}>→</div>
            <div>
              <div style={{fontSize:9,color:C.mu,letterSpacing:1,marginBottom:3}}>FINISH</div>
              <div style={{...IMP,fontSize:24,color:C.acc}}>{endWeight}</div>
              <div style={{fontSize:9,color:C.mu}}>lbs</div>
            </div>
          </div>
          <div style={{marginTop:11,padding:"8px 10px",background:weightChange<0?"rgba(74,222,128,.1)":weightChange>0?"rgba(96,165,250,.1)":C.s2,border:`1px solid ${weightChange<0?C.a4:weightChange>0?C.a3:C.bd}`,borderRadius:5,textAlign:"center"}}>
            <span style={{...IMP,fontSize:14,color:weightChange<0?C.a4:weightChange>0?C.a3:C.tx,letterSpacing:1}}>{weightChange>=0?"+":""}{weightChange} LBS</span>
            {profile.targetWeight&&<span style={{fontSize:10,color:C.mu,marginLeft:8}}>target: {profile.targetWeight} lbs {targetReached?"✓ REACHED":""}</span>}
          </div>
        </div>

        {/* Workout completion */}
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.bd}`}}>
          <div style={{...imp(10,C.a4),marginBottom:10}}>WORKOUT CONSISTENCY</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7}}>
            <div style={{textAlign:"center",padding:"8px 4px",background:C.s2,borderRadius:5,border:`1px solid ${C.bd}`}}>
              <div style={{...IMP,fontSize:20,color:C.a4}}>{completed}</div>
              <div style={{fontSize:9,color:C.mu,letterSpacing:1,marginTop:2}}>COMPLETED</div>
            </div>
            <div style={{textAlign:"center",padding:"8px 4px",background:C.s2,borderRadius:5,border:`1px solid ${C.bd}`}}>
              <div style={{...IMP,fontSize:20,color:"#f87171"}}>{skipped}</div>
              <div style={{fontSize:9,color:C.mu,letterSpacing:1,marginTop:2}}>SKIPPED</div>
            </div>
            <div style={{textAlign:"center",padding:"8px 4px",background:C.s2,borderRadius:5,border:`1px solid ${C.bd}`}}>
              <div style={{...IMP,fontSize:20,color:C.acc}}>{completionRate}%</div>
              <div style={{fontSize:9,color:C.mu,letterSpacing:1,marginTop:2}}>RATE</div>
            </div>
          </div>
        </div>

        {/* Lifting PRs */}
        {topLifts.length>0&&(
          <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.bd}`}}>
            <div style={{...imp(10,C.a2),marginBottom:10}}>🏋️ LIFTING PRS (EST. 1RM)</div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {topLifts.map(([name,pr])=>(
                <div key={name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",background:C.s2,borderRadius:5,border:`1px solid ${C.bd}`}}>
                  <div style={{flex:1,fontSize:12,fontWeight:600}}>{name}</div>
                  <div style={{textAlign:"right"}}>
                    <div style={{...IMP,fontSize:14,color:C.acc}}>{pr.weight} lbs × {pr.reps}</div>
                    <div style={{fontSize:9,color:C.mu}}>~{pr.e1rm} 1RM</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Run stats */}
        {runStats.total>0&&(
          <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.bd}`}}>
            <div style={{...imp(10,C.a3),marginBottom:10}}>🏃 RUNNING TOTALS</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:7}}>
              <div style={{padding:"8px 10px",background:C.s2,borderRadius:5,border:`1px solid ${C.bd}`}}>
                <div style={{fontSize:9,color:C.mu,letterSpacing:1,marginBottom:2}}>TOTAL RUNS</div>
                <div style={{...IMP,fontSize:18,color:C.acc}}>{runStats.total}</div>
              </div>
              <div style={{padding:"8px 10px",background:C.s2,borderRadius:5,border:`1px solid ${C.bd}`}}>
                <div style={{fontSize:9,color:C.mu,letterSpacing:1,marginBottom:2}}>TOTAL MILES</div>
                <div style={{...IMP,fontSize:18,color:C.acc}}>{runStats.miles.toFixed(1)}</div>
              </div>
              {runStats.longestRun&&(
                <div style={{padding:"8px 10px",background:C.s2,borderRadius:5,border:`1px solid ${C.bd}`}}>
                  <div style={{fontSize:9,color:C.mu,letterSpacing:1,marginBottom:2}}>LONGEST</div>
                  <div style={{...IMP,fontSize:14,color:C.tx}}>{runStats.longestRun.distMi.toFixed(2)} mi</div>
                  <div style={{fontSize:9,color:C.mu}}>{fmtTime(runStats.longestRun.seconds)}</div>
                </div>
              )}
              {runStats.fastestPace&&(
                <div style={{padding:"8px 10px",background:C.s2,borderRadius:5,border:`1px solid ${C.bd}`}}>
                  <div style={{fontSize:9,color:C.mu,letterSpacing:1,marginBottom:2}}>FASTEST PACE</div>
                  <div style={{...IMP,fontSize:14,color:C.tx}}>{Math.floor(runStats.fastestPace.paceSec/60)}:{String(runStats.fastestPace.paceSec%60).padStart(2,"0")}/mi</div>
                  <div style={{fontSize:9,color:C.mu}}>{runStats.fastestPace.distMi.toFixed(2)} mi run</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{padding:"14px 18px",display:"flex",flexDirection:"column",gap:8}}>
          <button onClick={onStartNew} style={{...abtn(),padding:"11px"}}>START NEW PROGRAM</button>
          <button onClick={onAcknowledge} style={{...abtn("transparent"),border:`1px solid ${C.bd}`,color:C.tx,padding:"9px"}}>VIEW DETAILS LATER</button>
        </div>
      </div>
    </div>
  );
}

function CardioDay({week,phase,goal,coachMsg,sessions,setSessions,sk}){
  const saved=sessions[sk]||{};
  const [notes,setNotes]=useState(saved.notes||"");
  const [done,setDone]=useState(saved.done||false);
  const go=useRef(false);
  useEffect(()=>{go.current=false;const s=sessions[sk]||{};setNotes(s.notes||"");setDone(s.done||false);},[sk]);
  useEffect(()=>{
    if(!go.current){go.current=true;return;}
    setSessions(prev=>({...prev,[sk]:{...(prev[sk]||{}),notes,done,savedAt:new Date().toISOString()}}));
  },[notes,done]);
  const w=parseInt(week),c=goal==="fat_loss",pf=goal==="performance";
  let method,dur,intens,proto;
  if(c){if(w<=3){method="Zone 2 Steady State";dur="35 min";intens="65-70% max HR";proto="35 min continuous: assault bike, rower, or incline walk. HR 130-140 bpm. Conversational pace — never breathless.";}else if(w<=6){method="Zone 2 + HIIT";dur="40 min";intens="Zone 2 + 85-90% HR sprints";proto="25 min Zone 2, then 8 rounds: 20s all-out sprint / 40s easy recovery.";}else if(w<=9){method="HIIT + Cool-Down";dur="45 min";intens="90%+ HR peaks";proto="10 rounds: 30s max effort / 90s walk. Finish with 15 min Zone 2 cool-down.";}else{method="Zone 2 Deload";dur="30 min";intens="60-65% max HR";proto="30 min easy Zone 2 only. Deload — flush and recover.";}}else if(pf){if(w<=3){method="Aerobic Base";dur="30 min";intens="70% max HR";proto="30 min continuous row or bike at 70% HR.";}else if(w<=6){method="Tempo Intervals";dur="35 min";intens="80-85% HR";proto="5 min warm-up, 4×5 min at 80-85% HR, 2 min easy between, 5 min cool-down.";}else if(w<=9){method="VO2 Max Intervals";dur="40 min";intens="90-95% HR peaks";proto="6×3 min at 90-95% HR with 3 min recovery.";}else{method="Recovery Cardio";dur="25 min";intens="60% max HR";proto="25 min easy. Deload — keep HR low.";}}else{if(w<=3){method="Low-Impact Zone 2";dur="25 min";intens="60-65% max HR";proto="25 min incline walk or easy bike. HR 120-130.";}else if(w<=6){method="Moderate Zone 2";dur="30 min";intens="65-70% max HR";proto="30 min row or bike. Steady aerobic. Don't interfere with muscle recovery.";}else if(w<=9){method="Zone 2 + Intervals";dur="30 min";intens="Zone 2 + 85% peaks";proto="20 min Zone 2, then 4×30s sprints with 2 min easy.";}else{method="Recovery Cardio";dur="20 min";intens="55-60% max HR";proto="20 min easy walk or light bike.";}}
  return(<>
    <div style={{...card,marginBottom:10}}>
      <div style={{padding:"11px 13px",borderBottom:`1px solid ${C.bd}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{...IMP,fontSize:16,fontWeight:900,color:C.a6}}>WED — CARDIO</div>
        <div style={{...imp(10,C.a6),padding:"3px 9px",border:`1px solid ${C.a6}`,borderRadius:4}}>{goal.replace("_"," ").toUpperCase()}</div>
      </div>
      <div style={{padding:"8px 13px",borderBottom:`1px solid ${C.bd}`,display:"flex",gap:14,fontSize:11,color:C.mu2,flexWrap:"wrap"}}>
        <span><strong style={{color:C.tx}}>Method:</strong> {method}</span>
        <span><strong style={{color:C.tx}}>Duration:</strong> {dur}</span>
        <span><strong style={{color:C.tx}}>Intensity:</strong> <span style={{color:C.a6}}>{intens}</span></span>
      </div>
      <div style={{padding:"12px 13px",borderBottom:`1px solid ${C.bd}`}}>
        <div style={{background:C.s2,border:`1px solid ${C.bd}`,borderRadius:6,padding:"12px 14px"}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>{method}</div>
          <div style={{fontSize:12,color:C.mu2,lineHeight:1.7}}>{proto}</div>
          <div style={{marginTop:10,display:"flex",gap:8,flexWrap:"wrap"}}>
            <div style={{background:C.s3,border:`1px solid ${C.bd}`,borderRadius:4,padding:"4px 10px",fontSize:11}}><span style={{...imp(9,C.mu)}}>Duration </span><span style={{...imp(11,C.a6)}}>{dur}</span></div>
            <div style={{background:C.s3,border:`1px solid ${C.bd}`,borderRadius:4,padding:"4px 10px",fontSize:11}}><span style={{...imp(9,C.mu)}}>Intensity </span><span style={{...imp(11,C.a6)}}>{intens.split(" — ")[0]}</span></div>
          </div>
        </div>
      </div>
      <div style={{padding:"10px 13px",display:"flex",gap:8}}>
        <button onClick={()=>coachMsg(`Cardio plan for Week ${w}, ${goal.replace("_"," ")} goal. Equipment: assault bike, rower, treadmill.`)} style={hbtn}>CUSTOMIZE</button>
        <button onClick={()=>coachMsg("What are my cardio heart rate zones?")} style={hbtn}>HR ZONES</button>
      </div>
    </div>
    <div style={card}>
      <div style={{padding:"9px 13px",borderBottom:`1px solid ${C.bd}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={imp(12,C.mu2)}>SESSION LOG</div>
        {done&&<div style={{...imp(10,C.a4),border:`1px solid ${C.a4}`,padding:"2px 8px",borderRadius:3}}>✓ DONE</div>}
      </div>
      <div style={{padding:"12px 13px"}}>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Duration, avg HR, how it felt..." style={{width:"100%",background:C.s2,border:`1px solid ${C.bd}`,color:C.tx,padding:"8px 10px",borderRadius:4,fontSize:12,resize:"none",minHeight:60,outline:"none",lineHeight:1.6,fontFamily:"inherit"}}/>
        <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:C.mu2,cursor:"pointer",marginTop:8}}>
          <input type="checkbox" checked={done} onChange={e=>setDone(e.target.checked)} style={{accentColor:C.acc,width:14,height:14}}/>Mark Complete
          <span style={{...imp(10,C.mu),marginLeft:8}}>AUTO-SAVED</span>
        </label>
      </div>
    </div>
  </>);
}

// Find the most recent logged set data for a given exercise across all sessions
function getPrevLog(sessions, exName, currentSk) {
  // Find all session keys that have data for this exercise, excluding current session
  const entries = Object.entries(sessions)
    .filter(([sk, s]) => sk !== currentSk && s.setLogs)
    .filter(([sk, s]) => Object.keys(s.setLogs).some(k => k.startsWith(exName + "__")))
    .sort((a, b) => {
      // Sort by savedAt descending to get most recent
      const ta = a[1].savedAt || "0";
      const tb = b[1].savedAt || "0";
      return tb.localeCompare(ta);
    });
  if (!entries.length) return null;
  const [prevSk, prevSess] = entries[0];
  // Gather all sets for this exercise from that session
  const sets = Object.entries(prevSess.setLogs)
    .filter(([k]) => k.startsWith(exName + "__"))
    .map(([k, v]) => ({ idx: parseInt(k.split("__")[1]), ...v }))
    .sort((a, b) => a.idx - b.idx);
  if (!sets.length) return null;
  // Return average weight and reps from completed sets, or all sets if none marked done
  const completed = sets.filter(s => s.done && s.weight);
  const useSets = completed.length ? completed : sets.filter(s => s.weight);
  if (!useSets.length) return null;
  const avgW = useSets.reduce((sum, s) => sum + parseFloat(s.weight || 0), 0) / useSets.length;
  const avgR = useSets.reduce((sum, s) => sum + parseFloat(s.reps || 0), 0) / useSets.length;
  const maxR = Math.max(...useSets.map(s => parseFloat(s.reps || 0)));
  const minR = Math.min(...useSets.filter(s => s.reps).map(s => parseFloat(s.reps || 0)));
  // Pull feedback from that session for the muscle (RP only)
  const feedback = prevSess.feedback || null;
  return {
    weight: Math.round(avgW * 10) / 10,
    reps: Math.round(avgR),
    maxReps: maxR,
    minReps: isFinite(minR) ? minR : maxR,
    setCount: useSets.length,
    completedAll: useSets.length === sets.length && sets.every(s => s.done),
    sessionKey: prevSk,
    feedback
  };
}

// Parse a rep range like "8-12" or "12-15" into {min, max}
function parseRepRange(range) {
  if (!range) return { min: 8, max: 12 };
  const m = String(range).match(/(\d+)\s*[-–]\s*(\d+)/);
  if (m) return { min: parseInt(m[1]), max: parseInt(m[2]) };
  const single = parseInt(range);
  return isFinite(single) ? { min: single, max: single } : { min: 8, max: 12 };
}

// Smart autoregulation — adjusts weight based on actual performance vs rep target
// Returns {weight, note, indicator} where indicator is "up"|"hold"|"down"|"deload"
function getSuggestedWeight(prevLog, phase, goal, repRangeStr, isRP, muscle) {
  if (!prevLog || !prevLog.weight) return null;
  const w = prevLog.weight;
  const phaseStr = typeof phase === "string" ? phase : (phase?.ph || phase?.type || "");

  // Deload — always drop to 60%, no autoregulation needed
  if (phaseStr === "DELOAD") {
    return { weight: Math.round(w * 0.6 * 2) / 2, note: `Deload — 60% of ${w} lbs`, indicator: "deload" };
  }

  // Parse the target rep range for this week
  const range = parseRepRange(repRangeStr);
  const targetMin = range.min;
  const targetMax = range.max;
  const lastMaxReps = prevLog.maxReps || prevLog.reps;
  const lastMinReps = prevLog.minReps || prevLog.reps;
  const lastAvgReps = prevLog.reps;

  // Performance categories
  const hitTopOfRange = lastMinReps >= targetMax; // ALL sets hit top of range
  const exceededRange = lastMaxReps > targetMax + 1; // went past top
  const hitRange = lastAvgReps >= targetMin && lastAvgReps <= targetMax;
  const missedReps = lastAvgReps < targetMin;
  const completedAll = prevLog.completedAll;

  // RP-specific: factor in feedback (pump/workload/soreness for the muscle)
  let fbAdjust = 0; // -1 = back off, 0 = normal, +1 = push harder
  let fbNote = "";
  if (isRP && muscle && prevLog.feedback && prevLog.feedback[muscle]) {
    const fb = prevLog.feedback[muscle];
    const workload = fb.workload; // 0=easy, 4=too much
    const soreness = fb.soreness; // 0=none, 4=crushed
    const pump = fb.pump; // 0=none, 4=insane
    if (workload >= 4 || soreness >= 4) { fbAdjust = -1; fbNote = " · backing off (workload/soreness flagged)"; }
    else if (workload <= 1 && soreness <= 1 && pump <= 2) { fbAdjust = 1; fbNote = " · pushing harder (low workload/soreness)"; }
  }

  // Goal-based progression aggressiveness
  const cutting = goal === "fat_loss";
  const bulking = goal === "muscle_gain";

  // Compute jump
  let jump = 0;
  let note = "";
  let indicator = "hold";

  if (!completedAll || missedReps) {
    // Failed to hit reps — hold or drop
    if (lastAvgReps < targetMin - 2) {
      jump = -5;
      note = `Drop ${Math.abs(jump)} lbs — missed reps last time (${lastAvgReps} avg, target ${targetMin}+)`;
      indicator = "down";
    } else {
      jump = 0;
      note = `Hold ${w} lbs — didn't quite hit target (${lastAvgReps} avg, target ${targetMin}-${targetMax})`;
      indicator = "hold";
    }
  } else if (hitTopOfRange || exceededRange) {
    // Crushed it — push the load
    if (cutting) {
      jump = 5;
      note = `+5 lbs — hit top of range (${lastMinReps}+ on all sets)`;
    } else if (bulking) {
      jump = exceededRange ? 10 : 5;
      note = `+${jump} lbs — ${exceededRange ? "exceeded" : "hit top of"} range`;
    } else {
      jump = 5;
      note = `+5 lbs — hit top of range`;
    }
    indicator = "up";
  } else if (hitRange) {
    // Hit mid-range — small bump or hold
    if (cutting) {
      jump = lastAvgReps >= (targetMin + targetMax) / 2 ? 2.5 : 0;
      note = jump > 0 ? `+2.5 lbs — solid in range` : `Hold ${w} lbs — earn another rep first`;
    } else {
      jump = 2.5;
      note = `+2.5 lbs — in range, push it`;
    }
    indicator = jump > 0 ? "up" : "hold";
  }

  // Apply RP feedback adjustment
  if (fbAdjust === -1 && jump > 0) { jump = 0; note = `Hold ${w} lbs${fbNote}`; indicator = "hold"; }
  else if (fbAdjust === -1 && jump === 0) { jump = -5; note = `Drop 5 lbs${fbNote}`; indicator = "down"; }
  else if (fbAdjust === 1 && jump >= 0) { jump += 2.5; note += fbNote; }

  const finalWeight = Math.max(0, Math.round((w + jump) * 2) / 2); // round to nearest 0.5
  const fullNote = note + ` · last: ${w}lbs × ${lastAvgReps}reps${prevLog.setCount > 1 ? ` (${prevLog.setCount} sets)` : ""}`;

  return { weight: finalWeight, note: fullNote, indicator };
}

function WorkoutView({profile,week,sessions,setSessions,coachMsg,onUpdateProfile}){
  const [vw,setVw]=useState(week);
  const [vd,setVd]=useState(0);
  const [setLogs,setSetLogs]=useState({});
  const [notes,setNotes]=useState("");
  const [done,setDone]=useState(false);
  const go=useRef(false);
  const go2=useRef(false);

  useEffect(()=>{setVw(week);},[week]);

  const isRP=profile.workoutStyle==="rp_hypertrophy";
  const isHybrid=profile.workoutStyle==="hyrox_hybrid";
  const isHyrox=profile.workoutStyle==="hyrox";
  const p=isRP?getRPWeek(vw,profile.weeks):(isHybrid||isHyrox?{ph:"",sets:"",reps:"",rpe:"",tempo:"",rest:"",note:""}:getPhase(vw,profile.weeks));
  const baseSchedule=getSchedule(profile);
  // Apply per-week overrides (for moving/skipping single days without changing recurring schedule)
  const weekOverrides=(profile.weekOverrides||{})[`w${vw}`]||{};
  const schedule=baseSchedule.map((d,i)=>{
    if(weekOverrides[i]){
      const styleTypes=getStyleDayTypes(profile);
      const wt=styleTypes.find(w=>w.type===weekOverrides[i])||{type:weekOverrides[i],col:C.mu,label:weekOverrides[i]};
      return {...d,type:wt.type,col:wt.col,label:wt.label,overridden:true,originalType:d.type};
    }
    return d;
  });
  const ds=schedule[vd]||schedule[0]||{day:"MON",type:"REST",col:C.mu,label:"Rest"};
  const effectiveType=getEffectiveType(ds.type);
  const sk=`w${vw}d${vd}`;
  const sess=sessions[sk]||{};

  const [showMoveMenu,setShowMoveMenu]=useState(null); // dayIdx being moved

  // Move a workout from one day to another (within the week only)
  const moveWorkout=(fromIdx,toIdx)=>{
    if(fromIdx===toIdx)return;
    const fromType=schedule[fromIdx].type;
    const toType=schedule[toIdx].type;
    const wkKey=`w${vw}`;
    const newOverrides={...(profile.weekOverrides||{})};
    if(!newOverrides[wkKey])newOverrides[wkKey]={};
    // Swap the two days for this week
    newOverrides[wkKey][fromIdx]=toType;
    newOverrides[wkKey][toIdx]=fromType;
    if(onUpdateProfile)onUpdateProfile({...profile,weekOverrides:newOverrides});
    setShowMoveMenu(null);
    setVd(toIdx); // jump to where the workout moved
  };

  // Mark a day as skipped (without rescheduling)
  const skipDay=(dayIdx)=>{
    setSessions(prev=>({...prev,[`w${vw}d${dayIdx}`]:{...(prev[`w${vw}d${dayIdx}`]||{}),skipped:true,savedAt:new Date().toISOString()}}));
    setShowMoveMenu(null);
  };

  // Reset overrides for this week
  const resetWeek=()=>{
    const newOverrides={...(profile.weekOverrides||{})};
    delete newOverrides[`w${vw}`];
    if(onUpdateProfile)onUpdateProfile({...profile,weekOverrides:newOverrides});
  };

  // Detect missed workouts (past days this week that aren't done and aren't rest/skipped)
  const today=new Date();
  const todayDayIdx=(today.getDay()+6)%7; // Mon=0, Sun=6
  const missedDays=[];
  if(vw===week){ // only show missed for current week
    schedule.forEach((d,i)=>{
      if(i<todayDayIdx&&d.type!=="REST"){
        const sess2=sessions[`w${vw}d${i}`]||{};
        if(!sess2.done&&!sess2.skipped){
          missedDays.push({idx:i,type:d.type,label:d.label||d.type,day:d.day});
        }
      }
    });
  }

  const hasOverrides=Object.keys(weekOverrides).length>0;

  useEffect(()=>{
    go.current=false;go2.current=false;
    const s=sessions[sk]||{};
    setSetLogs(s.setLogs||{});setNotes(s.notes||"");setDone(s.done||false);
  },[sk]);

  useEffect(()=>{
    if(!go.current){go.current=true;return;}
    setSessions(prev=>({...prev,[sk]:{...(prev[sk]||{}),notes,done,setLogs,savedAt:new Date().toISOString()}}));
  },[notes,done]);

  useEffect(()=>{
    if(!go2.current){go2.current=true;return;}
    setSessions(prev=>({...prev,[sk]:{...(prev[sk]||{}),notes,done,setLogs,savedAt:new Date().toISOString()}}));
  },[setLogs]);

  const exList=(ds.type!=="REST"&&effectiveType!=="CARDIO")?getEx(effectiveType,vw):[];
  const aS=p.sets>3?p.sets-1:3;
  let ar=p.rpe;
  if(ar.includes("9-10"))ar="RPE 8-9";else if(ar.includes("8-9"))ar="RPE 7-8";else if(ar.includes("RPE 8"))ar="RPE 7-8";else if(ar.includes("7-8"))ar="RPE 7";
  const cond=vw<=3?"3 Rounds: 12 Cal Row + 10 KB Swings + 8 Box Jumps":vw<=6?"EMOM 10min: Odd=10 KB Swings, Even=8 Box Jumps":"AMRAP 8min: 8 Burpees + 12 KB Swings + 10 Wall Balls";
  const wu={PUSH:"Band Pull-Apart + Shoulder CARs",PULL:"Dead Hang + Scapula Pulls",LEGS:"Hip Flexor + Glute Bridge",FULL:"Thoracic Rotation + Hip 90/90"}[ds.type]||"";
  const updSet=(n,i,f,v)=>{const k=`${n}__${i}`;setSetLogs(p=>({...p,[k]:{...(p[k]||{}),[f]:v}}));};
  const togSet=(n,i)=>{const k=`${n}__${i}`;setSetLogs(p=>({...p,[k]:{...(p[k]||{}),done:!(p[k]?.done)}}));};

  const SetLog=({name,numSets})=>{
    const prev=getPrevLog(sessions,name,sk);
    const sugg=getSuggestedWeight(prev,p.ph,profile.goal,p.reps,false,null);
    const indCol = sugg?.indicator==="up"?C.a4:sugg?.indicator==="down"?"#f87171":sugg?.indicator==="deload"?C.a5:C.acc;
    const indIcon = sugg?.indicator==="up"?"↑":sugg?.indicator==="down"?"↓":sugg?.indicator==="deload"?"↓":"→";
    return(<div style={{marginTop:8,display:"flex",flexDirection:"column",gap:4}}>
      {sugg&&(
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",background:`rgba(${indCol===C.a4?"74,222,128":indCol==="#f87171"?"248,113,113":indCol===C.a5?"167,139,250":"232,255,71"},.06)`,border:`1px solid rgba(${indCol===C.a4?"74,222,128":indCol==="#f87171"?"248,113,113":indCol===C.a5?"167,139,250":"232,255,71"},.18)`,borderRadius:4,marginBottom:6}}>
          <div style={{...IMP,fontSize:14,fontWeight:900,color:indCol,flexShrink:0}}>{indIcon} {sugg.weight}</div>
          <div style={{fontSize:9,color:C.mu,lineHeight:1.4,flex:1}}>{sugg.note}</div>
        </div>
      )}
      <div style={{display:"flex",gap:6,marginBottom:2}}>
        <div style={{width:32,...imp(9),textAlign:"center"}}>SET</div>
        <div style={{flex:1,...imp(9)}}>WEIGHT (lbs)</div>
        <div style={{width:52,...imp(9)}}>REPS</div>
        <div style={{width:28}}/>
      </div>
      {Array.from({length:numSets},(_,i)=>{
        const k=`${name}__${i}`;const lg=setLogs[k]||{};
        return(
          <div key={i} style={{display:"flex",gap:6,alignItems:"center"}}>
            <div style={{width:32,height:28,background:lg.done?C.acc:C.s3,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",...IMP,fontSize:12,fontWeight:900,color:lg.done?"#000":C.mu,border:`1px solid ${lg.done?C.acc:C.bd}`,flexShrink:0}}>{i+1}</div>
            <input type="number" value={lg.weight||""} onChange={e=>updSet(name,i,"weight",e.target.value)} placeholder={sugg?`${sugg.weight}`:"lbs"} style={{flex:1,height:28,...inp,padding:"0 8px",...IMP,fontWeight:700,fontSize:13,border:`1px solid ${lg.done?"rgba(232,255,71,.4)":C.bd}`}}/>
            <input type="number" value={lg.reps||""} onChange={e=>updSet(name,i,"reps",e.target.value)} placeholder="reps" style={{width:52,height:28,...inp,padding:"0 8px",...IMP,fontWeight:700,fontSize:13,border:`1px solid ${lg.done?"rgba(232,255,71,.4)":C.bd}`}}/>
            <button onClick={()=>togSet(name,i)} style={{width:28,height:28,borderRadius:4,border:`1px solid ${lg.done?C.acc:C.bd}`,background:lg.done?C.acc:"transparent",color:lg.done?"#000":C.mu,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✓</button>
          </div>
        );
      })}
    </div>);
  };

  const ExBlock=({label,exercises,sets,rpe,warmup})=>(
    <div style={{padding:"10px 13px",borderBottom:`1px solid ${C.bd}`}}>
      <div style={{...imp(10,C.a2),marginBottom:7}}>{label}</div>
      {exercises.map(([name,note],i)=>(
        <div key={i} style={{padding:"8px 0",borderBottom:i<exercises.length-1?`1px solid rgba(255,255,255,.04)`:"none"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:9}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600}}>{name}</div>
              <div style={{fontSize:11,color:C.mu2,marginTop:2,lineHeight:1.4}}>
                <strong style={{color:C.tx}}>{sets}x{p.reps} @ {p.tempo}</strong>
                <br/><span style={{fontSize:10,fontStyle:"italic",color:C.mu}}>{note}</span>
              </div>
            </div>
            <div style={{...imp(11,C.acc),padding:"2px 7px",borderRadius:3,background:"rgba(232,255,71,.08)",border:"1px solid rgba(232,255,71,.2)",whiteSpace:"nowrap",flexShrink:0}}>{rpe}</div>
            <button onClick={()=>coachMsg(`Swap ${name} in my Wk ${vw} ${ds.type} workout. Phase: ${p.ph} (${p.sets}x${p.reps} @ ${p.rpe}). Give 3 alternatives with movement pattern, equipment, and form note.`)} style={{...hbtn,fontSize:9,padding:"2px 7px",flexShrink:0}}>SWAP</button>
          </div>
          {!warmup&&<div style={{marginTop:6,padding:"5px 8px",background:"rgba(96,165,250,.06)",border:"1px solid rgba(96,165,250,.15)",borderRadius:4,fontSize:10,color:C.a3,lineHeight:1.5}}>{wtGuide(profile.goal,p.ph)}</div>}
          {!warmup&&<SetLog name={name} numSets={typeof sets==="number"?sets:parseInt(sets)||3}/>}
        </div>
      ))}
    </div>
  );

  return(
    <div style={{height:"100%",overflowY:"auto",padding:14}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
        <div>
          <div style={{...IMP,fontSize:20,fontWeight:900,letterSpacing:2}}>WEEK {vw}</div>
          <div style={{fontSize:11,color:C.mu,marginTop:1}}>{isRP?`${p.type||"WEEK"} — ${p.repRange||""} reps @ ${p.rir||""}`:isHybrid?"HYROX Hybrid":isHyrox?"HYROX Race Prep":`${p.ph||""} — ${p.sets||""}x${p.reps||""} @ ${p.rpe||""} — ${p.tempo||""}`}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,marginLeft:"auto"}}>
          <button onClick={()=>setVw(v=>Math.max(1,v-1))} style={{...hbtn,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
          <select value={vw} onChange={e=>setVw(parseInt(e.target.value))} style={{background:C.s2,border:`1px solid ${C.bd}`,color:C.tx,padding:"4px 8px",borderRadius:4,...IMP,fontSize:11,outline:"none"}}>
            {Array.from({length:parseInt(profile.weeks)},(_,i)=><option key={i+1} value={i+1}>Week {i+1}</option>)}
          </select>
          <button onClick={()=>setVw(v=>Math.min(parseInt(profile.weeks),v+1))} style={{...hbtn,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
        </div>
      </div>
      {p.note&&vw>1&&!isRP&&<div style={{background:"rgba(232,255,71,.06)",border:"1px solid rgba(232,255,71,.2)",borderRadius:6,padding:"8px 12px",marginBottom:12,fontSize:12,color:C.acc,lineHeight:1.5}}><strong>WK {vw}:</strong> {p.note}</div>}
      <div style={{display:"flex",gap:5,marginBottom:12,overflowX:"auto"}}>
        {schedule.map((d,i)=>{
          const sess2=sessions[`w${vw}d${i}`]||{};
          const done2=sess2.done;
          const skipped=sess2.skipped;
          const on=i===vd;
          const shortLbl=d.label?d.label.toUpperCase().replace(/[()].*/,"").trim().slice(0,12):d.type;
          const borderCol=on?C.acc:done2?C.a4:skipped?"#f87171":d.overridden?C.a6:C.bd;
          return(<div key={i} onClick={()=>d.type!=="REST"&&setVd(i)} style={{padding:"6px 9px",...IMP,fontSize:11,letterSpacing:1,textTransform:"uppercase",cursor:d.type==="REST"?"default":"pointer",border:`1px solid ${borderCol}`,borderRadius:5,whiteSpace:"nowrap",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:on?C.acc:"transparent",color:on?"#000":done2?C.a4:skipped?"#f87171":C.mu,opacity:d.type==="REST"&&!on?0.5:1,minWidth:62,position:"relative"}}>
            <span style={{fontSize:11}}>{d.day}</span>
            <span style={{fontSize:8,letterSpacing:.5,color:on?"inherit":d.col,maxWidth:60,overflow:"hidden",textOverflow:"ellipsis"}}>{shortLbl}</span>
            {done2&&<span style={{position:"absolute",top:-4,right:-4,fontSize:8,background:C.a4,color:"#000",borderRadius:6,padding:"0 3px",fontWeight:900}}>✓</span>}
            {skipped&&<span style={{position:"absolute",top:-4,right:-4,fontSize:8,background:"#f87171",color:"#fff",borderRadius:6,padding:"0 3px",fontWeight:900}}>×</span>}
            {d.overridden&&!done2&&!skipped&&<span style={{position:"absolute",top:-4,right:-4,fontSize:7,background:C.a6,color:"#000",borderRadius:6,padding:"0 3px",fontWeight:900}}>↔</span>}
          </div>);
        })}
      </div>

      {/* Missed workouts banner */}
      {missedDays.length>0&&(
        <div style={{...card,marginBottom:10,borderLeft:`3px solid ${C.a6}`,background:"rgba(251,191,36,.05)"}}>
          <div style={{padding:"9px 12px",borderBottom:`1px solid ${C.bd}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{...imp(11,C.a6)}}>⚠️ MISSED THIS WEEK</div>
            <div style={{fontSize:10,color:C.mu}}>{missedDays.length} workout{missedDays.length>1?"s":""}</div>
          </div>
          <div style={{padding:"10px 12px"}}>
            {missedDays.map((m,mi)=>{
              const isToday=todayDayIdx===m.idx;
              const todayIsRest=schedule[todayDayIdx]?.type==="REST";
              return(
                <div key={m.idx} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderTop:mi>0?`1px solid rgba(255,255,255,.04)`:"none"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600}}>{m.day} — {m.label}</div>
                    <div style={{fontSize:10,color:C.mu,marginTop:1}}>Not completed</div>
                  </div>
                  <div style={{display:"flex",gap:5}}>
                    {!isToday&&todayDayIdx<7&&(
                      <button onClick={()=>moveWorkout(m.idx,todayDayIdx)} style={{...hbtn,fontSize:9,padding:"3px 7px",borderColor:C.acc,color:C.acc}}>MOVE TO TODAY</button>
                    )}
                    <button onClick={()=>skipDay(m.idx)} style={{...hbtn,fontSize:9,padding:"3px 7px"}}>SKIP IT</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day actions bar - move/skip current day */}
      {ds.type!=="REST"&&!sess.done&&(
        <div style={{display:"flex",gap:6,marginBottom:10,alignItems:"center"}}>
          <button onClick={()=>setShowMoveMenu(showMoveMenu===vd?null:vd)} style={{...hbtn,fontSize:10,padding:"5px 10px"}}>↔ MOVE THIS DAY</button>
          <button onClick={()=>skipDay(vd)} style={{...hbtn,fontSize:10,padding:"5px 10px"}}>× SKIP</button>
          {hasOverrides&&<button onClick={resetWeek} style={{...hbtn,fontSize:10,padding:"5px 10px",borderColor:C.a6,color:C.a6,marginLeft:"auto"}}>RESET WEEK</button>}
        </div>
      )}

      {/* Move menu - swap with another day */}
      {showMoveMenu===vd&&(
        <div style={{...card,marginBottom:10,borderLeft:`3px solid ${C.a6}`}}>
          <div style={{padding:"9px 12px",borderBottom:`1px solid ${C.bd}`,...imp(10,C.a6)}}>SWAP {ds.day} ({ds.label||ds.type}) WITH:</div>
          <div style={{padding:"8px",display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:5}}>
            {schedule.map((d,i)=>{
              if(i===vd)return null;
              const sess2=sessions[`w${vw}d${i}`]||{};
              return(
                <button key={i} onClick={()=>moveWorkout(vd,i)} style={{padding:"6px 8px",background:C.s2,border:`1px solid ${C.bd}`,borderRadius:4,textAlign:"left",cursor:"pointer",color:C.tx}}>
                  <div style={{...IMP,fontSize:10,fontWeight:900,color:C.tx}}>{d.day}</div>
                  <div style={{fontSize:10,color:d.col,marginTop:1}}>{d.label||d.type}</div>
                  {sess2.done&&<div style={{fontSize:8,color:C.a4,marginTop:1}}>✓ Done</div>}
                  {sess2.skipped&&<div style={{fontSize:8,color:"#f87171",marginTop:1}}>× Skipped</div>}
                </button>
              );
            })}
          </div>
          <div style={{padding:"6px 12px",fontSize:10,color:C.mu,lineHeight:1.4,borderTop:`1px solid ${C.bd}`}}>
            Swap only affects this week. Your recurring schedule stays the same.
          </div>
        </div>
      )}
      {ds.type==="REST"?(
        <div style={{...card,padding:"32px 20px",textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:10}}>🛌</div>
          <div style={{...IMP,fontSize:18,fontWeight:800,letterSpacing:2,color:C.mu2,marginBottom:6}}>REST DAY</div>
          <div style={{fontSize:12,color:C.mu,marginBottom:14}}>Light walk, mobility, foam rolling.</div>
          <button onClick={()=>coachMsg("Give me a mobility and recovery routine for today")} style={hbtn}>GET RECOVERY ROUTINE</button>
        </div>
      ):profile.workoutStyle==="hyrox_hybrid"?(
        <HybridSession week={vw} dayType={effectiveType} totalWeeks={profile.weeks} sessions={sessions} setSessions={setSessions} coachMsg={coachMsg} sk={sk}/>
      ):profile.workoutStyle==="hyrox"?(
        <HyroxSession week={vw} dayType={effectiveType} totalWeeks={profile.weeks} sessions={sessions} setSessions={setSessions} coachMsg={coachMsg} sk={sk}/>
      ):effectiveType==="CARDIO"?(
        <CardioDay week={vw} phase={p} goal={profile.goal} coachMsg={coachMsg} sessions={sessions} setSessions={setSessions} sk={sk}/>
      ):profile.workoutStyle==="rp_hypertrophy"?(
        <RPSession week={vw} dayType={effectiveType} mesoLen={profile.weeks} sessions={sessions} setSessions={setSessions} coachMsg={coachMsg} sk={sk}/>
      ):(
        <>
          <div style={{...card,marginBottom:10}}>
            <div style={{padding:"11px 13px",borderBottom:`1px solid ${C.bd}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{flex:1}}>
                <div style={{...IMP,fontSize:16,fontWeight:900,color:ds.col}}>{ds.day} — {ds.label||ds.type} ({vw%2===1?"A":"B"})</div>
                {profile.workoutStyle&&<div style={{fontSize:10,color:C.mu,marginTop:2}}>{({rp_hypertrophy:"RP Hypertrophy",hyrox_hybrid:"HYROX Hybrid",functional_bb:"Functional Bodybuilding",traditional_bb:"Traditional Bodybuilding",crossfit:"CrossFit",hyrox:"HYROX",powerlifting:"Powerlifting",athletic:"Athletic Performance",hiit:"HIIT / Circuit"})[profile.workoutStyle]||profile.workoutStyle}</div>}
              </div>
              <div style={{...imp(10,ds.col),padding:"3px 9px",border:`1px solid ${ds.col}`,borderRadius:4}}>{ds.label||ds.type}</div>
            </div>
            <div style={{padding:"8px 13px",borderBottom:`1px solid ${C.bd}`,display:"flex",gap:12,fontSize:11,color:C.mu2,flexWrap:"wrap"}}>
              <span><strong style={{color:C.tx}}>Sets/Reps:</strong> {p.sets}x{p.reps}</span>
              <span><strong style={{color:C.tx}}>RPE:</strong> {p.rpe}</span>
              <span><strong style={{color:C.tx}}>Tempo:</strong> <span style={{color:C.a5}}>{p.tempo}</span></span>
              <span><strong style={{color:C.tx}}>Rest:</strong> {p.rest}</span>
            </div>
            {p.note&&vw>1&&<div style={{background:"rgba(232,255,71,.08)",border:"1px solid rgba(232,255,71,.2)",borderRadius:5,padding:"6px 11px",margin:"8px 13px 0",fontSize:11,color:C.acc,lineHeight:1.5}}><strong>WK {vw}:</strong> {p.note}</div>}
            <ExBlock label="WARM-UP (5-8 min)" exercises={[[wu,"Prime target muscles, not exhausting them"]]} sets="2-3" rpe="RPE 4-5" warmup={true}/>
            {exList.length>=2&&<ExBlock label={`A1/A2 — PRIMARY SUPERSET — Rest ${p.rest}`} exercises={exList.slice(0,2)} sets={p.sets} rpe={p.rpe} warmup={false}/>}
            {exList.length>=4&&<ExBlock label={`B1/B2 — ACCESSORY SUPERSET — Rest ${p.rest}`} exercises={exList.slice(2,4)} sets={aS} rpe={ar} warmup={false}/>}
            {exList.length>=6&&<ExBlock label="C1/C2 — ISOLATION FINISHER — Rest 60s" exercises={exList.slice(4,6)} sets={Math.max(2,aS-1)} rpe="RPE 7" warmup={false}/>}
            <div style={{padding:"10px 13px"}}>
              <div style={{...imp(10,C.a2),marginBottom:7}}>CONDITIONING FINISHER</div>
              <div style={{display:"flex",alignItems:"flex-start",gap:9,padding:"7px 0"}}>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{cond}</div><div style={{fontSize:11,color:C.mu2,marginTop:2}}>Aerobic conditioning — maintain pace</div></div>
                <div style={{...imp(11,C.acc),padding:"2px 7px",borderRadius:3,background:"rgba(232,255,71,.08)",border:"1px solid rgba(232,255,71,.2)",whiteSpace:"nowrap"}}>RPE 7-8</div>
              </div>
            </div>
          </div>
          <div style={card}>
            <div style={{padding:"9px 13px",borderBottom:`1px solid ${C.bd}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={imp(12,C.mu2)}>SESSION LOG</div>
              {done&&<div style={{...imp(10,C.a4),border:`1px solid ${C.a4}`,padding:"2px 8px",borderRadius:3}}>✓ DONE</div>}
            </div>
            <div style={{padding:"12px 13px"}}>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes — RPE hit, how it felt, what to adjust..." style={{width:"100%",background:C.s2,border:`1px solid ${C.bd}`,color:C.tx,padding:"8px 10px",borderRadius:4,fontSize:12,resize:"none",minHeight:60,outline:"none",lineHeight:1.6,fontFamily:"inherit"}}/>
              <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:C.mu2,cursor:"pointer",marginTop:8}}>
                <input type="checkbox" checked={done} onChange={e=>setDone(e.target.checked)} style={{accentColor:C.acc,width:14,height:14}}/>Mark Complete
                <span style={{...imp(10,C.mu),marginLeft:8}}>AUTO-SAVED</span>
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FoodView({profile,food,setFood}){
  const [date,setDate]=useState(new Date());
  const [q,setQ]=useState("");const [searching,setSearching]=useState(false);const [results,setResults]=useState([]);
  const [manual,setManual]=useState({n:"",c:"",p:"",cb:"",f:""});
  const ds=date.toISOString().slice(0,10);
  const today=new Date();today.setHours(0,0,0,0);
  const diff=Math.round((date-today)/86400000);
  const lbl2=diff===0?"TODAY":diff===-1?"YESTERDAY":date.toLocaleDateString("en-US",{month:"short",day:"numeric"}).toUpperCase();
  const entries=food[ds]||[];
  let tc=0,tp=0,tcb=0,tf=0;entries.forEach(e=>{tc+=e.c||0;tp+=e.p||0;tcb+=e.cb||0;tf+=e.f||0;});

  // RP Diet: 7-day rolling weekly average calorie tracking
  const weekDays = [];
  for (let i=0;i<7;i++){const d=new Date(date);d.setDate(d.getDate()-(6-i));weekDays.push(d);}
  const weekData = weekDays.map(d=>{
    const k=d.toISOString().slice(0,10);
    const ents=food[k]||[];
    let c=0,p=0,cb=0,f=0;
    ents.forEach(e=>{c+=e.c||0;p+=e.p||0;cb+=e.cb||0;f+=e.f||0;});
    return {date:d, key:k, cal:c, prot:p, carb:cb, fat:f, count:ents.length};
  });
  const wkAvgCal = weekData.filter(d=>d.count>0).length ? Math.round(weekData.reduce((s,d)=>s+d.cal,0)/Math.max(1,weekData.filter(d=>d.count>0).length)) : 0;
  const wkTotalDays = weekData.filter(d=>d.count>0).length;

  // RP Day Balance: how the rest of today should look based on remaining macros
  const remCal = profile.targetCals - Math.round(tc);
  const remProt = profile.protein - Math.round(tp);
  const remCarb = profile.carbs - Math.round(tcb);
  const remFat = profile.fat - Math.round(tf);

  const add=(n,c,p,cb,f)=>setFood(prev=>({...prev,[ds]:[...(prev[ds]||[]),{n,c:parseFloat(c)||0,p:parseFloat(p)||0,cb:parseFloat(cb)||0,f:parseFloat(f)||0}]}));
  const search=async(customQ)=>{
    const queryStr=customQ||q;
    if(!queryStr)return;setSearching(true);setResults([]);
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:1200,
          system:`You are a comprehensive nutrition database covering BOTH whole foods AND national restaurant chains. Return ONLY a valid JSON array of up to 8 results.
Each item must be: {"name":"food name","serving":"serving size","cal":number,"prot":number,"carb":number,"fat":number}

COVERAGE:
1. Whole/grocery foods → use USDA FoodData Central values. Include common serving sizes (e.g. "1 cup (240ml)", "3oz (85g)", "1 large").
2. National restaurant chains → use the chain's PUBLISHED nutrition data. Include the brand in the name. Examples:
   - Chipotle (bowls, burritos, sides, proteins)
   - Chick-fil-A (sandwiches, nuggets, salads, sides)
   - Starbucks (drinks, food, oatmeal)
   - McDonald's, Burger King, Wendy's
   - Subway, Jersey Mike's, Jimmy John's
   - Panera, Cava, Sweetgreen
   - Taco Bell, Qdoba, Moe's
   - Olive Garden, Texas Roadhouse, Cheesecake Factory, Outback
   - Domino's, Pizza Hut, Papa John's
   - Dunkin', Tim Hortons
   - Five Guys, In-N-Out, Shake Shack, Whataburger
   - Buffalo Wild Wings, Applebee's, Chili's
   - Panda Express, P.F. Chang's
   - Jamba, Smoothie King, Tropical Smoothie
   - Crumbl, Krispy Kreme
   - Costco / Sam's Club food court items

QUERY HANDLING:
- "chipotle chicken bowl" → return Chipotle bowl variations (white rice, brown rice, with/without specific ingredients)
- "starbucks latte" → return common Starbucks lattes in different sizes
- Brand name only → return their most popular items
- Generic food → return USDA whole food results
- Mix of both if relevant (e.g. "protein shake" → grocery options + national chain options)

Be accurate — these macros directly affect someone's diet plan. If unsure of exact values, omit that item rather than guess.
Return ONLY the JSON array, no markdown, no explanation.`,
          messages:[{role:"user",content:queryStr}]
        })
      });
      const d=await r.json();
      const raw=d.content?.[0]?.text||"[]";
      const s=raw.indexOf("["),e2=raw.lastIndexOf("]");
      const items=s>=0&&e2>s?JSON.parse(raw.slice(s,e2+1)):[];
      setResults(items.filter(x=>x.name&&x.cal>=0));
    }catch(e){setResults([]);}
    setSearching(false);
  };
  const pct=(v,t)=>t?Math.min(100,(v/t)*100):0;
  return(
    <div style={{height:"100%",overflowY:"auto",padding:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11}}>
        <button onClick={()=>setDate(d=>{const n=new Date(d);n.setDate(n.getDate()-1);return n;})} style={hbtn}>PREV</button>
        <div style={{...IMP,fontSize:14,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>{lbl2}</div>
        <button onClick={()=>setDate(d=>{const n=new Date(d);n.setDate(n.getDate()+1);return n;})} style={hbtn}>NEXT</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginBottom:11}}>
        {[[Math.round(tc),"Cal",C.acc,profile.targetCals],[Math.round(tp)+"g","Prot",C.a3,profile.protein],[Math.round(tcb)+"g","Carb",C.a6,profile.carbs],[Math.round(tf)+"g","Fat",C.a5,profile.fat]].map(([v,l,col,t])=>(
          <div key={l} style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:6,padding:"8px 6px",textAlign:"center"}}>
            <div style={{...IMP,fontSize:19,color:col}}>{v}</div>
            <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:1,color:C.mu,marginTop:1}}>{l}</div>
            <div style={{fontSize:9,color:C.mu}}>/ {t}{l!=="Cal"?"g":""}</div>
            <div style={{height:3,background:C.bd,borderRadius:2,marginTop:5,overflow:"hidden"}}><div style={{height:"100%",width:pct(parseFloat(v),t)+"%",background:col,borderRadius:2}}/></div>
          </div>
        ))}
      </div>

      {/* RP Day Balance */}
      <div style={{...card, marginBottom:11, borderLeft:`3px solid ${C.acc}`}}>
        <div style={{padding:"8px 13px", borderBottom:`1px solid ${C.bd}`, ...imp(10), color:C.acc, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <span>DAY BALANCE — REMAINING</span>
          <span style={{fontSize:9, color:C.mu, letterSpacing:1}}>{entries.length} meal{entries.length!==1?"s":""} logged</span>
        </div>
        <div style={{padding:"10px 13px", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:7}}>
          {[[remCal,"CAL",C.acc],[remProt,"PROT",C.a3],[remCarb,"CARB",C.a6],[remFat,"FAT",C.a5]].map(([v,l,col])=>{
            const num=parseInt(v);
            const isOver=num<0;
            return(
              <div key={l} style={{textAlign:"center", padding:"6px 4px", background:C.s2, borderRadius:5, border:`1px solid ${isOver?"rgba(248,113,113,.3)":C.bd}`}}>
                <div style={{...IMP, fontSize:16, color:isOver?"#f87171":col}}>{isOver?"":"+"}{v}{l!=="CAL"?"g":""}</div>
                <div style={{fontSize:9, color:C.mu, marginTop:1, letterSpacing:1}}>{isOver?"OVER":"LEFT"}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RP 7-Day Weekly Average */}
      <div style={{...card, marginBottom:11}}>
        <div style={{padding:"8px 13px", borderBottom:`1px solid ${C.bd}`, ...imp(10), display:"flex", justifyContent:"space-between"}}>
          <span>7-DAY ROLLING AVERAGE</span>
          <span style={{fontSize:9, color:C.mu}}>{wkTotalDays}/7 days logged</span>
        </div>
        <div style={{padding:"10px 13px"}}>
          <div style={{display:"flex", alignItems:"baseline", gap:6, marginBottom:9}}>
            <div style={{...IMP, fontSize:24, color:C.acc}}>{wkAvgCal}</div>
            <div style={{fontSize:11, color:C.mu}}>avg cal/day</div>
            {wkTotalDays>0 && (
              <div style={{marginLeft:"auto", fontSize:11, fontWeight:700, padding:"2px 7px", borderRadius:3, background: Math.abs(wkAvgCal-profile.targetCals)<100 ? "rgba(74,222,128,.15)" : "rgba(248,113,113,.15)", color: Math.abs(wkAvgCal-profile.targetCals)<100 ? C.a4 : "#f87171"}}>
                {wkAvgCal-profile.targetCals>=0?"+":""}{wkAvgCal-profile.targetCals} vs target
              </div>
            )}
          </div>
          <div style={{display:"flex", gap:3, alignItems:"flex-end", height:38}}>
            {weekData.map((d,i)=>{
              const onDay = d.key === ds;
              const h = profile.targetCals ? Math.min(100, (d.cal/profile.targetCals)*100) : 0;
              const overUnder = profile.targetCals ? d.cal/profile.targetCals : 0;
              const col = d.count===0 ? C.bd : overUnder>1.15 ? "#f87171" : overUnder<0.85 ? C.a6 : C.a4;
              return (
                <div key={i} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, cursor:"pointer"}} onClick={()=>setDate(new Date(d.date))}>
                  <div style={{width:"100%", height:30, background:C.s2, borderRadius:2, overflow:"hidden", display:"flex", alignItems:"flex-end", border: onDay?`1px solid ${C.acc}`:"none"}}>
                    <div style={{width:"100%", height:`${h}%`, background:col, transition:"height .3s"}}/>
                  </div>
                  <div style={{fontSize:8, color:onDay?C.acc:C.mu, letterSpacing:.5}}>{d.date.toLocaleDateString("en-US",{weekday:"narrow"})}</div>
                </div>
              );
            })}
          </div>
          <div style={{fontSize:10, color:C.mu, marginTop:7, lineHeight:1.4, textAlign:"center"}}>
            RP method: weekly average matters more than daily perfection. You can shift cals between days.
          </div>
        </div>
      </div>

      <div style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:8,padding:11,marginBottom:11}}>
        <div style={{...imp(10,C.acc),marginBottom:8}}>SEARCH FOOD · USDA + RESTAURANTS</div>
        <div style={{display:"flex",gap:6,marginBottom:6}}>
          <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder='Search foods OR restaurants: "chipotle bowl", "starbucks latte"...' style={{flex:1,...inp,fontSize:12}}/>
          <button onClick={()=>search()} disabled={searching} style={{background:C.a2,color:"#fff",border:"none",padding:"6px 11px",borderRadius:4,...IMP,fontSize:10,fontWeight:700,textTransform:"uppercase",cursor:"pointer"}}>{searching?"...":"SEARCH"}</button>
        </div>
        <div style={{display:"flex",gap:4,overflowX:"auto",marginBottom:8,paddingBottom:3}}>
          {[
            ["🌯 Chipotle","chipotle"],
            ["🐔 Chick-fil-A","chick-fil-a popular menu items"],
            ["☕ Starbucks","starbucks"],
            ["🥪 Subway","subway"],
            ["🍔 McDonald's","mcdonalds"],
            ["🥗 Cava","cava"],
            ["🥙 Panera","panera"],
            ["🌮 Taco Bell","taco bell"],
            ["🍕 Domino's","dominos"],
            ["🍩 Dunkin'","dunkin"],
            ["🥩 Texas Roadhouse","texas roadhouse"],
            ["🍳 Eggs","eggs"],
            ["🍗 Chicken","chicken breast"],
            ["🍚 Rice","white rice brown rice"]
          ].map(([label,query])=>(
            <button key={label} onClick={()=>{setQ(query);search(query);}} style={{background:C.s2,border:`1px solid ${C.bd}`,color:C.tx,padding:"4px 9px",borderRadius:14,fontSize:11,whiteSpace:"nowrap",cursor:"pointer",flexShrink:0}}>{label}</button>
          ))}
        </div>
        {results.length>0&&<div style={{background:C.bg,border:`1px solid ${C.bd}`,borderRadius:4,marginBottom:6,maxHeight:220,overflowY:"auto"}}>
          <div style={{padding:"5px 10px",borderBottom:`1px solid ${C.bd}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:C.s2}}>
            <span style={{...imp(9,C.mu)}}>{results.length} RESULT{results.length!==1?"S":""} · TAP TO ADD</span>
            <button onClick={()=>{setResults([]);setQ("");}} style={{background:"transparent",border:"none",color:C.mu,cursor:"pointer",fontSize:14,lineHeight:1,padding:0}}>×</button>
          </div>
          {results.map((item,i)=>{
            const added=(food[ds]||[]).some(e=>e.n===item.name+" ("+item.serving+")");
            return(
              <div key={i} onClick={()=>add(item.name+" ("+item.serving+")",item.cal,item.prot,item.carb,item.fat)} style={{padding:"7px 10px",cursor:"pointer",borderBottom:i<results.length-1?`1px solid ${C.bd}`:"none",display:"flex",alignItems:"center",gap:8,background:added?"rgba(74,222,128,.05)":"transparent"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:500}}>{item.name} <span style={{fontSize:10,color:C.mu}}>({item.serving})</span></div>
                  <div style={{fontSize:10,marginTop:1}}><span style={{color:C.acc}}>{Math.round(item.cal)}cal</span> · <span style={{color:C.a3}}>{Math.round(item.prot)}g P</span> · <span style={{color:C.a6}}>{Math.round(item.carb)}g C</span> · <span style={{color:C.a5}}>{Math.round(item.fat)}g F</span></div>
                </div>
                <div style={{...IMP,fontSize:11,fontWeight:900,color:added?C.a4:C.acc,letterSpacing:1,flexShrink:0}}>{added?"✓ ADDED":"+ ADD"}</div>
              </div>
            );
          })}
        </div>}
        <div style={{...imp(10,C.acc),marginBottom:8,marginTop:10}}>MANUAL ENTRY</div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",gap:5,marginBottom:7}}>
          {[["n","Name","Chicken"],["c","Cal","0"],["p","Prot","0"],["cb","Carbs","0"],["f","Fat","0"]].map(([k,l,ph])=>(
            <div key={k}><label style={{...lbl9,fontSize:9,marginBottom:3}}>{l}</label>
            <input value={manual[k]} onChange={e=>setManual(m=>({...m,[k]:e.target.value}))} placeholder={ph} type={k==="n"?"text":"number"} style={{width:"100%",...inp,padding:"5px 8px",fontSize:11}}/></div>
          ))}
        </div>
        <button onClick={()=>{if(!manual.n)return;add(manual.n,manual.c,manual.p,manual.cb,manual.f);setManual({n:"",c:"",p:"",cb:"",f:""});}} style={{...abtn(),fontSize:10}}>+ ADD TO LOG</button>
      </div>
      {entries.length===0?<div style={{textAlign:"center",padding:22,color:C.mu,fontSize:12}}>No food logged yet.</div>:(
        <><div style={{...imp(10),padding:"4px 0 7px",borderBottom:`1px solid ${C.bd}`,marginBottom:7}}>{entries.length} item{entries.length!==1?"s":""} logged</div>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {entries.map((e,i)=>(
            <div key={i} style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:4,padding:"6px 10px",display:"flex",alignItems:"center",gap:8}}>
              <div style={{flex:1,fontSize:12,fontWeight:500}}>{e.n}</div>
              <div style={{display:"flex",gap:7,fontSize:10}}><span style={{color:C.acc,fontWeight:700}}>{Math.round(e.c)}cal</span><span style={{color:C.a3,fontWeight:700}}>{Math.round(e.p)}P</span><span style={{color:C.a6,fontWeight:700}}>{Math.round(e.cb)}C</span><span style={{color:C.a5,fontWeight:700}}>{Math.round(e.f)}F</span></div>
              <button onClick={()=>setFood(prev=>{const u=[...(prev[ds]||[])];u.splice(i,1);return{...prev,[ds]:u};})} style={{background:"transparent",border:"none",color:C.mu,cursor:"pointer",fontSize:14,lineHeight:1}}>×</button>
            </div>
          ))}
        </div></>
      )}
    </div>
  );
}

function MetricsView({profile,wlog,setWlog}){
  const [inp2,setInp2]=useState("");
  const latest=wlog.length?wlog[wlog.length-1].weight:parseFloat(profile.weight);
  const change=(latest-parseFloat(profile.weight)).toFixed(1);
  const pct=profile.targetWeight&&parseFloat(profile.targetWeight)!==parseFloat(profile.weight)?Math.min(100,Math.max(0,Math.round((parseFloat(profile.weight)-latest)/(parseFloat(profile.weight)-parseFloat(profile.targetWeight))*100))):0;
  return(
    <div style={{height:"100%",overflowY:"auto",padding:14}}>
      {profile.targetWeight&&(
        <div style={{...card,marginBottom:12}}>
          <div style={{padding:"10px 13px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <div style={{fontSize:12,color:C.mu2}}>Goal Progress</div>
              <div style={{...IMP,fontSize:13,color:C.acc}}>{pct}% to goal</div>
            </div>
            <div style={{height:8,background:C.bd,borderRadius:4,overflow:"hidden",marginBottom:8}}>
              <div style={{height:"100%",width:pct+"%",background:`linear-gradient(90deg,${C.a3},${C.acc})`,borderRadius:4,transition:"width .6s"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.mu}}>
              <span>Start: {profile.weight} lbs</span>
              <span style={{color:parseFloat(change)<0?C.a4:C.a2}}>{Math.abs(parseFloat(change))} lbs {parseFloat(change)<0?"lost":"gained"}</span>
              <span>Target: {profile.targetWeight} lbs</span>
            </div>
          </div>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div style={card}>
          <div style={{padding:"8px 13px",borderBottom:`1px solid ${C.bd}`,...imp(10)}}>LOG WEIGHT</div>
          <div style={{padding:"11px 13px"}}>
            <div style={{display:"flex",gap:7,marginBottom:9}}>
              <input type="number" step="0.1" value={inp2} onChange={e=>setInp2(e.target.value)} placeholder="lbs" style={{...inp,flex:1}}/>
              <button onClick={()=>{const v=parseFloat(inp2);if(!v||v<50)return;setWlog(l=>[...l,{date:new Date().toISOString(),weight:v}]);setInp2("");}} style={abtn()}>LOG</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:200,overflowY:"auto"}}>
              {wlog.slice().reverse().slice(0,10).map((e,i,arr)=>{const prev=arr[i+1];const dd=prev?(e.weight-prev.weight).toFixed(1):null;return(
                <div key={i} style={{background:C.s2,border:`1px solid ${C.bd}`,borderRadius:4,padding:"5px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{color:C.mu,fontSize:11}}>{new Date(e.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
                  <span style={{...IMP,fontSize:15,color:C.acc}}>{e.weight} lbs</span>
                  <span style={{fontSize:11,fontWeight:700,color:dd===null?C.mu:dd<0?C.a4:dd>0?"#f87171":C.mu}}>{dd===null?"--":dd<0?dd:"+"+dd}</span>
                </div>
              );})}
            </div>
          </div>
        </div>
        <div style={card}>
          <div style={{padding:"8px 13px",borderBottom:`1px solid ${C.bd}`,...imp(10)}}>MACROS & STATS</div>
          <div style={{padding:"11px 13px"}}>
            {[["Start",profile.weight+" lbs",C.acc],["Current",latest+" lbs",C.acc],["Target",(profile.targetWeight||"—")+" lbs",C.a3],["Change",(change>=0?"+":"")+change+" lbs",change<0?C.a4:"#f87171"],["Calories",profile.targetCals+" kcal",C.acc],["Protein",profile.protein+"g",C.a3],["Carbs",profile.carbs+"g",C.a6],["Fat",profile.fat+"g",C.a5]].map(([l,v,col])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 8px",background:C.s2,borderRadius:4,border:`1px solid ${C.bd}`,marginBottom:4}}>
                <span style={{fontSize:11,color:C.mu}}>{l}</span>
                <span style={{...IMP,fontSize:14,fontWeight:800,color:col}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function JournalView({jlog,setJlog}){
  const [date,setDate]=useState(new Date());
  const [mood,setMood]=useState(-1);const [notes,setNotes]=useState("");
  const ds=date.toISOString().slice(0,10);
  const today=new Date();today.setHours(0,0,0,0);
  const diff=Math.round((date-today)/86400000);
  const lbl2=diff===0?"TODAY":diff===-1?"YESTERDAY":date.toLocaleDateString("en-US",{month:"short",day:"numeric"}).toUpperCase();
  useEffect(()=>{const e=jlog[ds];setNotes(e?.notes||"");setMood(e?.mi??-1);},[ds,jlog]);
  const sv=()=>setJlog(prev=>({...prev,[ds]:{notes,mi:mood,savedAt:new Date().toISOString()}}));
  return(
    <div style={{height:"100%",overflowY:"auto",padding:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11}}>
        <button onClick={()=>setDate(d=>{const n=new Date(d);n.setDate(n.getDate()-1);return n;})} style={hbtn}>PREV</button>
        <div style={{...IMP,fontSize:14,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>{lbl2}</div>
        <button onClick={()=>setDate(d=>{const n=new Date(d);n.setDate(n.getDate()+1);return n;})} style={hbtn}>NEXT</button>
      </div>
      <div style={{...card,marginBottom:10}}>
        <div style={{padding:"8px 13px",borderBottom:`1px solid ${C.bd}`,...imp(10)}}>MOOD / ENERGY</div>
        <div style={{padding:"11px 13px",display:"flex",gap:7}}>{MOODS.map((m,i)=><button key={i} onClick={()=>setMood(i)} style={{background:mood===i?"rgba(232,255,71,.1)":C.s2,border:`1px solid ${mood===i?C.acc:C.bd}`,padding:"5px 10px",borderRadius:20,fontSize:17,cursor:"pointer"}}>{m}</button>)}</div>
      </div>
      <div style={{...card,marginBottom:10}}>
        <div style={{padding:"8px 13px",borderBottom:`1px solid ${C.bd}`,...imp(10)}}>TODAY'S NOTES</div>
        <div style={{padding:"11px 13px"}}>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="How did training go? Weights used, how you felt..." style={{width:"100%",background:C.s2,border:`1px solid ${C.bd}`,color:C.tx,padding:"8px 10px",borderRadius:4,fontSize:12,resize:"none",minHeight:90,outline:"none",lineHeight:1.65,fontFamily:"inherit"}}/>
          <button onClick={sv} style={{...abtn(),marginTop:8}}>SAVE ENTRY</button>
        </div>
      </div>
      <div style={card}>
        <div style={{padding:"8px 13px",borderBottom:`1px solid ${C.bd}`,...imp(10)}}>PAST ENTRIES</div>
        <div style={{padding:"11px 13px"}}>
          {Object.keys(jlog).length===0?<div style={{color:C.mu,fontSize:12}}>No entries yet.</div>:
          Object.entries(jlog).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,10).map(([k,e])=>(
            <div key={k} style={{background:C.s2,border:`1px solid ${C.bd}`,borderRadius:5,padding:"9px 11px",marginBottom:6}}>
              <div style={{...imp(10),display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                <span style={{fontSize:15}}>{e.mi>=0&&e.mi<MOODS.length?MOODS[e.mi]:""}</span>
                {new Date(k+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}
              </div>
              <div style={{fontSize:12,lineHeight:1.6}}>{(e.notes||"").substring(0,160)}{(e.notes||"").length>160?"...":""}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CoachDrawer({open,onClose,profile,week,initMsg,onInitConsumed,sessions,wlog,food}){
  const [conv,setConv]=useState([]);const [msg,setMsg]=useState("");const [loading,setLoading]=useState(false);
  const ref=useRef(null);
  const sentInit=useRef(false);
  useEffect(()=>{
    if(open&&initMsg&&!sentInit.current){sentInit.current=true;send(initMsg);if(onInitConsumed)onInitConsumed();}
    if(!open)sentInit.current=false;
  },[open,initMsg]);
  const sys=()=>{
    const p=getPhase(week,profile.weeks);
    const gl={fat_loss:"fat loss",muscle_gain:"muscle building",recomp:"recomposition",performance:"athletic performance"};
    const styleMap={rp_hypertrophy:"RP Hypertrophy: Mesocycle-based, MEV/MAV/MRV volume landmarks per muscle, RIR drops 3→0 across 4-6 weeks, deload last week, pump/soreness/workload feedback adjusts next session volume",functional_bb:"Functional Bodybuilding: supersets A1/A2, RPE-based, aesthetics + performance",traditional_bb:"Traditional Bodybuilding: isolation exercises, hypertrophy focus, physique",crossfit:"CrossFit: WODs, AMRAP, EMOM, Olympic lifting, high conditioning",hyrox:"HYROX: race prep, functional strength + cardio endurance circuits",powerlifting:"Powerlifting: squat/bench/deadlift focus, max strength, heavy triples/singles",athletic:"Athletic Performance: sport conditioning, speed, power, agility work",hiit:"HIIT/Circuit: high intensity intervals, minimal rest, full body circuits"};

    // Build recent session summary (last 5 sessions with set data)
    const recentSessions = Object.entries(sessions||{})
      .filter(([,s])=>s.setLogs&&Object.keys(s.setLogs).length>0)
      .sort((a,b)=>(b[1].savedAt||"0").localeCompare(a[1].savedAt||"0"))
      .slice(0,5);
    const sessionSummary = recentSessions.length ? recentSessions.map(([sk,s])=>{
      const day = DAYS[parseInt(sk.replace(/w\d+d/,""))]?.type||"";
      const wkNum = sk.match(/w(\d+)/)?.[1]||"?";
      const sets = Object.entries(s.setLogs)
        .filter(([,v])=>v.weight)
        .map(([k,v])=>{const name=k.split("__")[0];return `${name}: ${v.weight}lbs×${v.reps||"?"}`;})
        .slice(0,6).join(", ");
      return `Wk${wkNum} ${day}${s.done?" ✓":""}: ${sets}`;
    }).join("\n") : "No sessions logged yet.";

    // Weight trend
    const wtTrend = (wlog||[]).slice(-5).map(e=>`${new Date(e.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}: ${e.weight}lbs`).join(", ") || "No weight entries yet.";

    // Today's food log
    const today = new Date().toISOString().slice(0,10);
    const todayFood = (food||{})[today]||[];
    let ftc=0,ftp=0,ftcb=0,ftf=0;
    todayFood.forEach(e=>{ftc+=e.c||0;ftp+=e.p||0;ftcb+=e.cb||0;ftf+=e.f||0;});
    const remaining = {cal:profile.targetCals-Math.round(ftc),prot:profile.protein-Math.round(ftp),carb:profile.carbs-Math.round(ftcb),fat:profile.fat-Math.round(ftf)};
    const foodSummary = todayFood.length
      ? `Logged today: ${Math.round(ftc)}cal / ${Math.round(ftp)}gP / ${Math.round(ftcb)}gC / ${Math.round(ftf)}gF\nRemaining: ${remaining.cal}cal / ${remaining.prot}gP / ${remaining.carb}gC / ${remaining.fat}gF`
      : "No food logged today.";

    return `You are RECOMP, an elite AI fitness coach. Direct, specific, evidence-based. You have full access to this athlete's data.

ATHLETE: ${profile.name} | ${profile.age}yo | ${profile.sex} | ${profile.height} | ${profile.weight}lbs → target: ${profile.targetWeight||"not set"}lbs | Goal: ${gl[profile.goal]||profile.goal}
Experience: ${profile.experience} | Equipment: ${profile.equipment} | Week ${week}/${profile.weeks}
Macros targets: ${profile.targetCals}cal / ${profile.protein}gP / ${profile.carbs}gC / ${profile.fat}gF
Training style: ${styleMap[profile.workoutStyle||"functional_bb"]||profile.workoutStyle}
CURRENT PHASE: ${p.ph} — ${p.sets}x${p.reps} @ ${p.rpe} — ${p.tempo} tempo
${p.note?"THIS WEEK: "+p.note+"\n":""}
SPLIT: Mon=Push, Tue=Pull, Wed=Cardio, Thu=Legs, Fri=Full Body, weekends off. A/B alternate weekly.

RECENT WORKOUT SESSIONS (actual logged data):
${sessionSummary}

WEIGHT HISTORY (recent):
${wtTrend}

TODAY'S NUTRITION:
${foodSummary}

CAPABILITIES — you can:
- Analyze the athlete's actual logged weights and suggest progressions
- Review recent sessions and identify trends (e.g. stalling, inconsistency)
- Suggest what to eat to hit remaining macros (give specific foods with portions)
- Track weight trend and comment on rate of loss/gain vs goal
- Answer any training, nutrition, recovery, or programming question
- Suggest exercise swaps matched to their training style and equipment
- Set reminders or goals the athlete mentions

When asked about remaining macros or what to eat: give specific food suggestions with amounts that hit the remaining targets. Be precise (e.g. "2 cups of 2% cottage cheese = 440cal, 52gP, 18gC, 10gF — that covers most of your remaining protein").
Always tailor exercise and programming advice to the athlete's training style.`;
  };
  const send=async(m)=>{
    if(!m.trim()||loading)return;
    const nc=[...conv,{role:"user",content:m}];setConv(nc);setMsg("");setLoading(true);
    try{const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:sys(),messages:nc.slice(-20)})});const d=await r.json();setConv(c=>[...c,{role:"assistant",content:d.content?.[0]?.text||"Error."}]);}catch{setConv(c=>[...c,{role:"assistant",content:"Connection error."}]);}
    setLoading(false);
  };
  useEffect(()=>{if(ref.current)ref.current.scrollTop=ref.current.scrollHeight;},[conv,loading]);
  const qb=[
    ["THIS WEEK","Explain this week's phase, what changed from last week, and key focus"],
    ["MY SESSIONS","Review my recent logged sessions. How are my lifts progressing? Any stalls?"],
    ["FILL MACROS","Based on what I've eaten today, what should I eat to hit my remaining macro targets?"],
    ["WEIGHT TREND","Analyze my recent weight entries. Am I on track for my goal?"],
    ["PROGRESS","Based on my logged weights, how should I progress my lifts this week?"],
    ["CARDIO","Cardio protocol for today based on my goal and current week"],
    ["RECOVERY","I'm sore — should I rest or train? What's best for my goal right now?"],
    ["MEALS","High protein meal ideas tailored to my goal and macros"]
  ];
  return(
    <div style={{position:"fixed",bottom:0,right:0,width:"100%",maxWidth:420,height:"68vh",background:C.s1,borderTop:`2px solid ${C.acc}`,borderLeft:`1px solid ${C.bd}`,borderRadius:"12px 0 0 0",zIndex:300,display:"flex",flexDirection:"column",transform:open?"translateY(0)":"translateY(100%)",transition:"transform .3s ease",boxShadow:"-4px -4px 30px rgba(0,0,0,.6)"}}>
      <div style={{padding:"9px 13px",borderBottom:`1px solid ${C.bd}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{...IMP,fontSize:13,fontWeight:800,letterSpacing:2,textTransform:"uppercase",color:C.acc}}>RECOMP COACH</div>
        <button onClick={onClose} style={{background:"transparent",border:`1px solid ${C.bd}`,color:C.mu,width:26,height:26,borderRadius:4,fontSize:15,cursor:"pointer"}}>✕</button>
      </div>
      <div style={{padding:"7px 11px",borderBottom:`1px solid ${C.bd}`,display:"flex",gap:4,overflowX:"auto",flexShrink:0}}>
        {qb.map(([l,m])=><button key={l} onClick={()=>send(m)} style={{...hbtn,whiteSpace:"nowrap",fontSize:10,padding:"3px 8px"}}>{l}</button>)}
      </div>
      <div ref={ref} style={{flex:1,overflowY:"auto",padding:11}}>
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {conv.map((m,i)=>(
            <div key={i} style={{display:"flex",gap:7,flexDirection:m.role==="user"?"row-reverse":"row"}}>
              <div style={{width:27,height:27,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",...IMP,fontWeight:900,fontSize:10,flexShrink:0,background:m.role==="assistant"?`linear-gradient(135deg,${C.acc},${C.a2})`:C.s3,color:m.role==="assistant"?"#000":C.tx,border:m.role==="user"?`1px solid ${C.bd}`:"none"}}>
                {m.role==="assistant"?"AI":(profile.name?.[0]?.toUpperCase()||"U")}
              </div>
              <div style={{maxWidth:"84%"}}><div style={{padding:"8px 10px",borderRadius:5,fontSize:12,lineHeight:1.6,background:m.role==="assistant"?"#13131a":C.s3,border:`1px solid ${C.bd}`,borderLeft:m.role==="assistant"?`3px solid ${C.acc}`:`1px solid ${C.bd}`}} dangerouslySetInnerHTML={{__html:m.content.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\*\*(.*?)\*\*/g,"<strong style='color:#e8ff47'>$1</strong>").replace(/\n/g,"<br>")}}/></div>
            </div>
          ))}
          {loading&&<div style={{display:"flex",gap:7,alignItems:"center"}}>
            <div style={{width:27,height:27,borderRadius:4,background:`linear-gradient(135deg,${C.acc},${C.a2})`,display:"flex",alignItems:"center",justifyContent:"center",...IMP,fontWeight:900,fontSize:10,color:"#000"}}>AI</div>
            <div style={{padding:"8px 10px",borderRadius:5,background:"#13131a",border:`1px solid ${C.bd}`,borderLeft:`3px solid ${C.acc}`,display:"flex",gap:4,alignItems:"center"}}>
              {[0,.2,.4].map((d,i)=><div key={i} style={{width:4,height:4,background:C.mu,borderRadius:"50%",animation:`pulse ${1.2}s ${d}s ease-in-out infinite`}}/>)}
            </div>
          </div>}
        </div>
      </div>
      <div style={{background:C.bg,borderTop:`1px solid ${C.bd}`,padding:"9px 11px",display:"flex",gap:6,alignItems:"flex-end",flexShrink:0}}>
        <textarea value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send(msg);}}} placeholder="Ask your coach..." rows={1} style={{flex:1,background:C.s2,border:`1px solid ${C.bd}`,color:C.tx,padding:"7px 9px",borderRadius:4,fontSize:12,resize:"none",minHeight:34,maxHeight:85,outline:"none",lineHeight:1.5,fontFamily:"inherit"}}/>
        <button onClick={()=>send(msg)} disabled={loading||!msg.trim()} style={{...abtn(),height:34,padding:"0 13px",opacity:loading||!msg.trim()?0.4:1,cursor:loading||!msg.trim()?"not-allowed":"pointer",flexShrink:0}}>SEND</button>
      </div>
    </div>
  );
}

function Dashboard({profile,week,wlog,food,openCoach,onUpdateProfile}){
  const isRP=profile.workoutStyle==="rp_hypertrophy";
  const isHyrox=profile.workoutStyle==="hyrox";
  const isHybrid=profile.workoutStyle==="hyrox_hybrid";
  const isSpecial=isRP||isHyrox||isHybrid;
  const showRaceCountdown=true;
  const tw=parseInt(profile.weeks)||8;
  const wk=parseInt(week)||1;
  const [editingRace,setEditingRace]=useState(false);
  const [raceInput,setRaceInput]=useState(profile.raceDate||"");
  const [raceName,setRaceName]=useState(profile.raceName||"HYROX RACE");

  // Calculate days until race
  let daysToRace=null,raceDateObj=null,raceFmt="";
  if(profile.raceDate){
    raceDateObj=new Date(profile.raceDate+"T00:00:00");
    const today=new Date();today.setHours(0,0,0,0);
    daysToRace=Math.ceil((raceDateObj-today)/86400000);
    raceFmt=raceDateObj.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"});
  }

  const saveRace=()=>{
    onUpdateProfile({...profile,raceDate:raceInput,raceName:raceName||"HYROX RACE"});
    setEditingRace(false);
  };

  const clearRace=()=>{
    onUpdateProfile({...profile,raceDate:"",raceName:""});
    setEditingRace(false);
    setRaceInput("");
  };

  let phName="WEEK", phSub="", phCol=C.acc;
  if(isRP){
    const p=getRPWeek(wk,tw);
    phName=p.type;phSub=`${p.rir} · ${p.repRange} reps`;phCol=p.type==="DELOAD"?C.a5:C.acc;
  } else if(isHyrox||isHybrid){
    const phasePct=wk/tw;
    const ph=phasePct<=0.4?"BASE":phasePct<=0.75?"BUILD":phasePct<1?(isHybrid?"PEAK":"RACE PREP"):"TAPER";
    phName=ph;phSub=isHybrid?"HYROX + Lifting + KB":"HYROX Race Prep";
    phCol=ph==="BASE"?C.a3:ph==="BUILD"?C.a6:ph==="TAPER"?C.a5:C.a2;
  } else {
    const p=getPhase(wk,tw);
    phName=p.ph||"WEEK";phSub=`${p.sets||""}x${p.reps||""} · ${p.rpe||""}`;phCol=PC[p.ph]||C.acc;
  }
  const latest=wlog.length?wlog[wlog.length-1].weight:parseFloat(profile.weight);
  const delta=wlog.length>1?(wlog[wlog.length-1].weight-wlog[wlog.length-2].weight).toFixed(1):null;
  const today=new Date().toISOString().slice(0,10);const te=food[today]||[];
  let tc=0,tp=0,tcb=0,tf=0;te.forEach(e=>{tc+=e.c||0;tp+=e.p||0;tcb+=e.cb||0;tf+=e.f||0;});
  const pct=(v,t)=>t?Math.min(100,(v/t)*100):0;
  const Mini=({v,l,col,t})=>(
    <div style={{background:C.s2,borderRadius:4,padding:"7px 5px",textAlign:"center"}}>
      <div style={{...IMP,fontSize:17,color:col}}>{v}</div>
      <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:1,color:C.mu,marginTop:1}}>{l}</div>
      <div style={{height:3,background:C.bd,borderRadius:2,marginTop:4,overflow:"hidden"}}><div style={{height:"100%",width:pct(parseFloat(v),t)+"%",background:col,borderRadius:2}}/></div>
    </div>
  );

  // Determine countdown urgency color
  const cdCol=daysToRace===null?C.mu:daysToRace<0?C.mu:daysToRace<=7?C.a2:daysToRace<=21?C.a6:daysToRace<=56?C.acc:C.a3;
  const cdLabel=daysToRace===null?"":daysToRace<0?"PASSED":daysToRace===0?"RACE DAY":daysToRace===1?"DAY":"DAYS";

  return(
    <div style={{height:"100%",overflowY:"auto",padding:14}}>

      {/* HYROX Race Countdown - always visible regardless of workout style */}
      {showRaceCountdown&&(
        <div style={{position:"relative",marginBottom:14,borderRadius:10,overflow:"hidden",background:profile.raceDate?`linear-gradient(135deg, #0a0a0f 0%, ${cdCol}15 50%, #0a0a0f 100%)`:`linear-gradient(135deg,${C.s1} 0%,${C.s2} 100%)`,border:`2px solid ${profile.raceDate?cdCol:C.bd}`,boxShadow:profile.raceDate?`0 0 30px ${cdCol}25, 0 4px 20px rgba(0,0,0,.4)`:"0 4px 12px rgba(0,0,0,.3)"}}>

          {/* Decorative racing stripe */}
          {profile.raceDate&&!editingRace&&(
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,transparent,${cdCol},transparent)`,animation:"pulse 2.5s ease-in-out infinite"}}/>
          )}

          <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.bd}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(0,0,0,.25)"}}>
            <div style={{...IMP,fontSize:12,letterSpacing:2,color:profile.raceDate?cdCol:C.a2,display:"flex",alignItems:"center",gap:7}}>
              <span style={{fontSize:18}}>🏁</span>
              <span style={{fontWeight:900}}>{profile.raceName||"RACE COUNTDOWN"}</span>
            </div>
            <button onClick={()=>{setEditingRace(e=>!e);setRaceInput(profile.raceDate||"");setRaceName(profile.raceName||"HYROX RACE");}} style={{...hbtn,fontSize:9,padding:"3px 9px"}}>{editingRace?"CANCEL":profile.raceDate?"EDIT":"SET DATE"}</button>
          </div>

          {editingRace?(
            <div style={{padding:"14px"}}>
              <label style={{...lbl9,fontSize:9,marginBottom:3}}>Race Name</label>
              <input value={raceName} onChange={e=>setRaceName(e.target.value)} placeholder="HYROX Dallas 2026" style={{width:"100%",...inp,fontSize:12,marginBottom:8}}/>
              <label style={{...lbl9,fontSize:9,marginBottom:3}}>Race Date</label>
              <input type="date" value={raceInput} onChange={e=>setRaceInput(e.target.value)} style={{width:"100%",...inp,fontSize:12,marginBottom:10}}/>
              <div style={{display:"flex",gap:6}}>
                <button onClick={saveRace} disabled={!raceInput} style={{...abtn(),flex:1,opacity:!raceInput?.4:1}}>SAVE</button>
                {profile.raceDate&&<button onClick={clearRace} style={{...abtn("transparent"),border:"1px solid #f87171",color:"#f87171"}}>REMOVE</button>}
              </div>
            </div>
          ):profile.raceDate?(
            <div style={{padding:"22px 14px 18px",textAlign:"center",position:"relative"}}>

              {/* Big countdown number with stroke effect */}
              <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:10,marginBottom:6}}>
                <div style={{...IMP,fontSize:78,fontWeight:900,lineHeight:.85,color:cdCol,letterSpacing:1,textShadow:`0 0 25px ${cdCol}55, 0 0 50px ${cdCol}30`,filter:`drop-shadow(0 2px 8px ${cdCol}40)`}}>{daysToRace<0?Math.abs(daysToRace):daysToRace}</div>
                <div style={{...IMP,fontSize:20,fontWeight:900,color:cdCol,letterSpacing:3,opacity:.9}}>{cdLabel}</div>
              </div>

              <div style={{fontSize:12,color:C.tx,marginBottom:10,fontWeight:600,letterSpacing:.5}}>{raceFmt}</div>

              {/* Phase indicator with animated background */}
              <div style={{display:"inline-block",padding:"6px 14px",borderRadius:20,background:`${cdCol}18`,border:`1px solid ${cdCol}55`,...IMP,fontSize:11,letterSpacing:2,color:cdCol,fontWeight:900}}>
                {daysToRace===0?"🏁 GO TIME — TRUST YOUR PREP":daysToRace<0?"RACE COMPLETE":daysToRace<=7?"⚡ RACE WEEK — RECOVER":daysToRace<=21?"⚡ TAPER ZONE — RECOVERY MATTERS":daysToRace<=56?"🔥 PEAK PHASE — PUSH HARD":daysToRace<=84?"📈 BUILD BLOCK — CONSISTENCY":"🏗️ BASE BUILDING — STAY THE COURSE"}
              </div>

              {/* Weeks/months remaining (extra context) */}
              {daysToRace>7&&(
                <div style={{display:"flex",justifyContent:"center",gap:18,marginTop:14,paddingTop:12,borderTop:`1px solid rgba(255,255,255,.06)`}}>
                  <div>
                    <div style={{...IMP,fontSize:18,color:C.tx,fontWeight:900}}>{Math.floor(daysToRace/7)}</div>
                    <div style={{fontSize:9,color:C.mu,letterSpacing:1.5,...IMP}}>WEEKS</div>
                  </div>
                  <div style={{width:1,background:C.bd}}/>
                  <div>
                    <div style={{...IMP,fontSize:18,color:C.tx,fontWeight:900}}>{daysToRace%7}</div>
                    <div style={{fontSize:9,color:C.mu,letterSpacing:1.5,...IMP}}>DAYS</div>
                  </div>
                  {daysToRace>=30&&(
                    <>
                      <div style={{width:1,background:C.bd}}/>
                      <div>
                        <div style={{...IMP,fontSize:18,color:C.tx,fontWeight:900}}>{Math.floor(daysToRace/30)}</div>
                        <div style={{fontSize:9,color:C.mu,letterSpacing:1.5,...IMP}}>MONTHS</div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ):(
            <div style={{padding:"20px 14px",textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:6}}>🏁</div>
              <div style={{...IMP,fontSize:14,fontWeight:800,letterSpacing:1.5,color:C.tx,marginBottom:4}}>SET YOUR RACE DATE</div>
              <div style={{fontSize:11,color:C.mu,marginBottom:12,lineHeight:1.5}}>Track your countdown to race day with auto-updating daily progress</div>
              <button onClick={()=>setEditingRace(true)} style={{...abtn(C.a2),fontSize:11,padding:"8px 18px",letterSpacing:2}}>+ ADD RACE DATE</button>
            </div>
          )}
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div style={card}>
          <div style={{padding:"9px 13px",borderBottom:`1px solid ${C.bd}`,...imp(11)}}>WEIGHT</div>
          <div style={{padding:"12px 13px"}}>
            <div style={{display:"flex",alignItems:"baseline",gap:6}}>
              <div style={{...IMP,fontSize:32,lineHeight:1,color:C.acc}}>{latest}</div>
              <div style={{...IMP,fontSize:13,color:C.mu}}>lbs</div>
              {delta&&<div style={{fontSize:11,fontWeight:700,padding:"2px 7px",borderRadius:3,marginLeft:4,background:delta<0?"rgba(74,222,128,.15)":"rgba(248,113,113,.15)",color:delta<0?C.a4:"#f87171"}}>{delta>=0?"+":""}{delta}</div>}
            </div>
            <div style={{fontSize:11,color:C.mu,marginTop:3}}>Start: {profile.weight} lbs{profile.targetWeight?" → Target: "+profile.targetWeight+" lbs":""}</div>
          </div>
        </div>
        <div style={card}>
          <div style={{padding:"9px 13px",borderBottom:`1px solid ${C.bd}`,...imp(11)}}>TODAY MACROS</div>
          <div style={{padding:"12px 13px"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5}}>
              <Mini v={Math.round(tc)} l="Cal" col={C.acc} t={profile.targetCals}/>
              <Mini v={Math.round(tp)} l="Prot" col={C.a3} t={profile.protein}/>
              <Mini v={Math.round(tcb)} l="Carb" col={C.a6} t={profile.carbs}/>
              <Mini v={Math.round(tf)} l="Fat" col={C.a5} t={profile.fat}/>
            </div>
            <div style={{fontSize:10,color:C.mu,marginTop:6,textAlign:"center"}}>{profile.targetCals} cal / {profile.protein}g P / {profile.carbs}g C / {profile.fat}g F</div>
          </div>
        </div>
        <div style={card}>
          <div style={{padding:"9px 13px",borderBottom:`1px solid ${C.bd}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={imp(11)}>{isRP?"MESOCYCLE":isSpecial?"PHASE":"PHASE"}</div><div style={{fontSize:10,color:C.mu}}>Wk {wk}/{tw}</div>
          </div>
          <div style={{padding:"12px 13px"}}>
            <div style={{background:C.s2,borderRadius:6,padding:"10px 12px"}}>
              <div style={{...IMP,fontSize:13,fontWeight:800,letterSpacing:1,color:phCol}}>{phName}</div>
              <div style={{fontSize:11,color:C.mu,margin:"3px 0 7px"}}>{phSub}</div>
              <div style={{height:4,background:C.bd,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:(wk/tw*100)+"%",background:phCol,borderRadius:2,transition:"width .6s"}}/></div>
            </div>
          </div>
        </div>
        <div style={card}>
          <div style={{padding:"9px 13px",borderBottom:`1px solid ${C.bd}`,...imp(11)}}>QUICK COACH</div>
          <div style={{padding:"12px 13px"}}>
            <div style={{fontSize:11,color:C.mu2,marginBottom:8}}>Tap 🤖 or a quick prompt.</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {[["THIS WEEK","Explain this week and what changed"],["MACROS","My macro targets"],["CARDIO","Cardio protocol for today"],["RECOVERY","I'm sore — rest or train?"]].map(([l,m])=>(
                <button key={l} onClick={()=>openCoach(m)} style={{...hbtn,fontSize:10,padding:"4px 9px"}}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackupView({profile,week,wlog,food,jlog,sessions,runs,conv,onImport,onReset,onSetWeek,onUpdateProfile,onShowSummary}){
  const [wkInp,setWkInp]=useState(String(week));
  const [editing,setEditing]=useState(false);
  const [pf,setPf]=useState({name:profile.name||"",age:profile.age||"",sex:profile.sex||"male",height:profile.height||"",weight:profile.weight||"",targetWeight:profile.targetWeight||"",goal:profile.goal||"fat_loss",activity:profile.activity||"very_active",experience:profile.experience||"advanced",equipment:profile.equipment||"full_gym",workoutStyle:profile.workoutStyle||"functional_bb",weeks:profile.weeks||"8"});
  const sp=k=>e=>setPf(p=>({...p,[k]:e.target.value}));
  let preview;
  try{preview=calcMacros({...profile,...pf},pf.weight);}
  catch(e){preview={tdee:0,targetCals:0,protein:0,carbs:0,fat:0,lbsToGo:0,pctToGoal:0};}
  const savePf=()=>{
    try{
      const updated={...profile,...pf,...calcMacros({...profile,...pf},pf.weight)};
      onUpdateProfile(updated);
      setEditing(false);
    }catch(e){alert("Error saving profile: "+e.message);}
  };
  const fi2=(id,lbl,type="text",ph="")=><div style={{marginBottom:8}}><label style={{...lbl9,fontSize:9,marginBottom:3}}>{lbl}</label><input type={type} value={pf[id]} onChange={sp(id)} placeholder={ph} style={{width:"100%",...inp,background:C.s3}}/></div>;
  const fs2=(id,lbl,opts)=><div style={{marginBottom:8}}><label style={{...lbl9,fontSize:9,marginBottom:3}}>{lbl}</label><select value={pf[id]} onChange={sp(id)} style={{width:"100%",...inp,background:C.s3}}>{opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>;
  const g2=(a,b)=><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{a}{b}</div>;
  const exp=()=>{const d={version:9,exported:new Date().toISOString(),profile,week,wlog,food,jlog,sessions,runs,conversation:conv};const b=new Blob([JSON.stringify(d,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="recomp-backup-"+new Date().toISOString().slice(0,10)+".json";a.click();URL.revokeObjectURL(a.href);};
  const imp2=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{const d=JSON.parse(ev.target.result);if(!d.profile?.name){alert("Invalid backup.");return;}onImport(d);}catch{alert("Invalid file.");}};r.readAsText(f);e.target.value="";};
  const bk=(title,desc,children)=>(
    <div style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:8,padding:14,marginBottom:10}}>
      <div style={{...imp(11,C.acc),marginBottom:5}}>{title}</div>
      <div style={{fontSize:12,color:C.mu2,lineHeight:1.6,marginBottom:9}}>{desc}</div>
      {children}
    </div>
  );
  return(
    <div style={{height:"100%",overflowY:"auto",padding:14}}>
      <ScheduleEditor profile={profile} onUpdateProfile={onUpdateProfile}/>
      <div style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:8,padding:14,marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:editing?14:0}}>
          <div>
            <div style={{...imp(11,C.acc),marginBottom:3}}>EDIT PROFILE</div>
            {!editing&&<div style={{fontSize:12,color:C.mu2}}>Update weight, target weight, goals, macros.</div>}
          </div>
          <button onClick={()=>setEditing(e=>!e)} style={{...hbtn,borderColor:editing?"#f87171":C.bd,color:editing?"#f87171":C.mu2}}>{editing?"CANCEL":"EDIT"}</button>
        </div>
        {editing&&(
          <div>
            {g2(fi2("name","Name"),fi2("age","Age","number"))}
            {g2(fi2("height","Height"),fs2("sex","Sex",[["male","Male"],["female","Female"]]))}
            {g2(fi2("weight","Current Weight (lbs)","number"),fi2("targetWeight","Target Weight (lbs)","number","175"))}
            {fs2("goal","Primary Goal",[["fat_loss","Fat Loss / Cut"],["muscle_gain","Muscle Gain"],["recomp","Body Recomposition"],["performance","Athletic Performance"]])}
            {g2(fs2("activity","Activity Level",[["sedentary","Sedentary"],["lightly_active","Lightly Active"],["moderately_active","Moderately Active"],["very_active","Very Active"]]),fs2("experience","Experience",[["beginner","Beginner"],["intermediate","Intermediate"],["advanced","Advanced"]]))}
            {fs2("equipment","Equipment",[["full_gym","Full Gym"],["home_dumbbells","Home Dumbbells"],["bodyweight","Bodyweight Only"]])}
            {fs2("workoutStyle","Workout Style",[
              ["rp_hypertrophy","RP Hypertrophy"],
              ["hyrox_hybrid","HYROX Hybrid (Race + Lifting + KB)"],
              ["functional_bb","Functional Bodybuilding"],
              ["traditional_bb","Traditional Bodybuilding"],
              ["crossfit","CrossFit"],
              ["hyrox","HYROX"],
              ["powerlifting","Powerlifting"],
              ["athletic","Athletic Performance"],
              ["hiit","HIIT / Circuit"]
            ])}
            {fs2("weeks","Program Length",[["4","4 Weeks"],["8","8 Weeks"],["10","10 Weeks"],["12","12 Weeks"],["16","16 Weeks"]])}
            <div style={{background:C.s2,border:`1px solid ${C.bd}`,borderRadius:6,padding:"10px 12px",marginBottom:12}}>
              <div style={{...imp(9,C.mu),marginBottom:6}}>NEW MACRO PREVIEW</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,textAlign:"center"}}>
                {[[preview.targetCals,"Cal",C.acc],[preview.protein+"g","Prot",C.a3],[preview.carbs+"g","Carb",C.a6],[preview.fat+"g","Fat",C.a5]].map(([v,l,col])=>(
                  <div key={l}><div style={{...IMP,fontSize:16,color:col}}>{v}</div><div style={{fontSize:9,textTransform:"uppercase",letterSpacing:1,color:C.mu}}>{l}</div></div>
                ))}
              </div>
            </div>
            <button onClick={savePf} style={abtn()}>SAVE CHANGES</button>
          </div>
        )}
      </div>
      {bk("EXPORT BACKUP","Download all your data.",<button onClick={exp} style={abtn()}>DOWNLOAD BACKUP</button>)}
      {bk("PROGRAM SUMMARY","See your stats: weight change, lifting PRs, run totals, completion rate.",<button onClick={onShowSummary} style={abtn(C.a4)}>VIEW SUMMARY</button>)}
      {bk("IMPORT BACKUP","Restore a previous backup file.",<><input type="file" id="impf" accept=".json" style={{display:"none"}} onChange={imp2}/><button onClick={()=>document.getElementById("impf").click()} style={{...abtn("transparent"),border:`1px solid ${C.acc}`,color:C.acc}}>UPLOAD BACKUP</button></>)}
      {bk("SET WEEK","Manually set your current program week.",<div style={{display:"flex",gap:8,alignItems:"center"}}><input type="number" value={wkInp} onChange={e=>setWkInp(e.target.value)} min="1" max="12" style={{...inp,width:65}}/><button onClick={()=>{const v=parseInt(wkInp);if(!v||v<1||v>parseInt(profile.weeks))return;onSetWeek(v);}} style={abtn()}>SET WEEK</button></div>)}
      {bk("RESET","Wipe all data and start over.",<button onClick={()=>{if(confirm("Reset ALL data?"))onReset();}} style={{...abtn("transparent"),border:"1px solid #f87171",color:"#f87171"}}>RESET ALL</button>)}
    </div>
  );
}

// Error boundary - prevents white screens on render crashes
class ErrorBoundary extends React.Component {
  constructor(props){super(props);this.state={hasError:false,error:null};}
  static getDerivedStateFromError(error){return {hasError:true,error};}
  componentDidCatch(error,info){console.error("Recomp crash:",error,info);}
  render(){
    if(this.state.hasError){
      return (
        <div style={{minHeight:"100vh",background:"#09090b",color:"#eff0f4",padding:20,fontFamily:"Helvetica,Arial,sans-serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <div style={{maxWidth:480,width:"100%",background:"#111115",border:"1px solid #25252f",borderRadius:8,padding:20,textAlign:"center"}}>
            <div style={{fontSize:38,marginBottom:10}}>⚠️</div>
            <div style={{fontFamily:"Impact,Arial,sans-serif",fontSize:20,letterSpacing:2,color:"#e8ff47",marginBottom:8}}>SOMETHING BROKE</div>
            <div style={{fontSize:13,color:"#7a7a8e",marginBottom:14,lineHeight:1.5}}>
              The app hit an error. Your data is safe in storage. This usually happens after a major update — clearing the cached data fixes it.
            </div>
            {this.state.error&&(
              <div style={{background:"#17171c",border:"1px solid #25252f",borderRadius:5,padding:"8px 10px",marginBottom:12,fontSize:11,color:"#f87171",fontFamily:"monospace",textAlign:"left",maxHeight:120,overflowY:"auto"}}>
                {String(this.state.error?.message||this.state.error)}
              </div>
            )}
            <div style={{display:"flex",gap:8,flexDirection:"column"}}>
              <button onClick={()=>{this.setState({hasError:false,error:null});}} style={{background:"#e8ff47",color:"#000",border:"none",padding:"10px",borderRadius:4,fontFamily:"Impact,Arial,sans-serif",fontSize:12,fontWeight:900,letterSpacing:2,cursor:"pointer"}}>TRY AGAIN</button>
              <button onClick={async()=>{
                try{await window.storage?.delete?.("recomp_data");}catch(e){}
                try{localStorage.clear();}catch(e){}
                window.location.reload();
              }} style={{background:"transparent",color:"#f87171",border:"1px solid #f87171",padding:"10px",borderRadius:4,fontFamily:"Impact,Arial,sans-serif",fontSize:12,fontWeight:900,letterSpacing:2,cursor:"pointer"}}>RESET ALL DATA & RELOAD</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function RecompCore(){
  const [ready,setReady]=useState(false);
  const [profile,setProfile]=useState(null);
  const [tab,setTab]=useState("dashboard");
  const [week,setWeek]=useState(1);
  const [sessions,setSessions]=useState({});
  const [wlog,setWlog]=useState([]);
  const [food,setFood]=useState({});
  const [jlog,setJlog]=useState({});
  const [runs,setRuns]=useState([]);
  const [conv,setConv]=useState([]);
  const [coachOpen,setCoachOpen]=useState(false);
  const [pendingMsg,setPendingMsg]=useState(null);
  const [showSummary,setShowSummary]=useState(false);
  const saveTimer=useRef(null);

  // Load on mount
  useEffect(()=>{
    load().then(d=>{
      try{
        if(d?.profile){
          // Migrate old data — ensure all expected fields exist
          const safeProfile={...d.profile};
          if(!safeProfile.workoutStyle)safeProfile.workoutStyle="functional_bb";
          if(!safeProfile.weeks)safeProfile.weeks="8";
          // Validate schedule against current style's valid types (defensive — constants may not be loaded yet)
          try{
            if(safeProfile.schedule&&Array.isArray(safeProfile.schedule)&&typeof STYLE_DAY_TYPES!=="undefined"){
              const styleConfig=STYLE_DAY_TYPES[safeProfile.workoutStyle]||STYLE_DAY_TYPES.functional_bb;
              const validTypes=styleConfig.map(t=>t.type);
              if(!safeProfile.schedule.every(t=>validTypes.includes(t))||safeProfile.schedule.length!==7){
                safeProfile.schedule=DEFAULT_SCHEDULES[safeProfile.workoutStyle]||DEFAULT_SCHEDULES.functional_bb;
              }
            }
          }catch(e){console.warn("Schedule validation skipped:",e);}
          setProfile(safeProfile);
          setWeek(parseInt(d.week)||1);
          setSessions(d.sessions&&typeof d.sessions==="object"?d.sessions:{});
          setWlog(Array.isArray(d.wlog)?d.wlog:[]);
          setFood(d.food&&typeof d.food==="object"?d.food:{});
          setJlog(d.jlog&&typeof d.jlog==="object"?d.jlog:{});
          setRuns(Array.isArray(d.runs)?d.runs:[]);
          setConv(Array.isArray(d.conv)?d.conv:[]);
        }
      }catch(e){
        console.error("Load error:",e);
      }
      setReady(true);
    }).catch(e=>{
      console.error("Storage error:",e);
      setReady(true);
    });
  },[]);

  // Save on change
  useEffect(()=>{
    if(!ready||!profile)return;
    clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(()=>{
      save({profile,week,sessions,wlog,food,jlog,runs,conv});
    },1000);
  },[profile,week,sessions,wlog,food,jlog,runs,conv,ready]);

  // Detect program completion — show summary when user reaches final week and all sessions done
  useEffect(()=>{
    if(!profile||!ready)return;
    const tw=parseInt(profile.weeks)||8;
    if(week<tw)return;
    if(profile.summaryAcknowledged)return;
    // Check if all non-rest sessions of the final week are done or skipped
    const schedule=getSchedule(profile);
    const finalWeekDone=schedule.every((d,i)=>{
      if(d.type==="REST")return true;
      const s=sessions[`w${tw}d${i}`];
      return s?.done||s?.skipped;
    });
    if(finalWeekDone&&Object.keys(sessions).length>0){
      setShowSummary(true);
    }
  },[profile,week,sessions,ready]);

  // Inject keyframe styles
  useEffect(()=>{
    if(document.getElementById("recomp-styles"))return;
    const s=document.createElement("style");s.id="recomp-styles";
    s.textContent="@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}*{box-sizing:border-box}::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-thumb{background:#2f2f3a;border-radius:2px}";
    document.head.appendChild(s);
  },[]);

  const handleStart=p=>{
    const mac=calcMacros(p,p.weight);
    const full={...p,...mac};
    setProfile(full);setWeek(1);setSessions({});setWlog([]);setFood({});setJlog({});setRuns([]);setConv([]);
    save({profile:full,week:1,sessions:{},wlog:[],food:{},jlog:{},runs:[],conv:[]});
    setCoachOpen(true);
    setPendingMsg(`Greet ${p.name} and welcome them to their ${p.weeks}-week FBB program for ${p.goal.replace("_"," ")}. Split: Mon=Push, Tue=Pull, Wed=Cardio, Thu=Legs, Fri=Full Body, weekends off. A/B alternate weekly with progressive overload. Macros: ${mac.targetCals}cal, ${mac.protein}gP, ${mac.carbs}gC, ${mac.fat}gF. Target weight: ${p.targetWeight||"not set"} lbs. Be energetic and brief.`);
  };

  const handleReset=async()=>{await clear();setProfile(null);setWeek(1);setSessions({});setWlog([]);setFood({});setJlog({});setRuns([]);setConv([]);setCoachOpen(false);setShowSummary(false);};
  const handleImport=d=>{const p={...d.profile,...calcMacros(d.profile,d.profile.weight)};setProfile(p);setWeek(d.week||1);setWlog(d.wlog||[]);setFood(d.food||{});setJlog(d.jlog||{});setRuns(d.runs||[]);setSessions(d.sessions||{});setConv(d.conversation||[]);save({profile:p,week:d.week||1,sessions:d.sessions||{},wlog:d.wlog||[],food:d.food||{},jlog:d.jlog||{},runs:d.runs||[],conv:d.conversation||[]});alert("Restored!");};
  const handleUpdateProfile=updated=>{
    // If workout style changed, validate schedule against new style's valid types
    try{
      if(profile&&updated.workoutStyle&&updated.workoutStyle!==profile.workoutStyle&&typeof STYLE_DAY_TYPES!=="undefined"){
        const validTypes=(STYLE_DAY_TYPES[updated.workoutStyle]||STYLE_DAY_TYPES.functional_bb).map(t=>t.type);
        const currentSched=updated.schedule||profile.schedule;
        if(currentSched&&Array.isArray(currentSched)){
          const allValid=currentSched.every(t=>validTypes.includes(t));
          if(!allValid){
            updated.schedule=DEFAULT_SCHEDULES[updated.workoutStyle]||DEFAULT_SCHEDULES.functional_bb;
          }
        }
      }
    }catch(e){console.warn("Profile validation skipped:",e);}
    setProfile(updated);
  };
  const openCoach=msg=>{setCoachOpen(true);if(msg)setPendingMsg(msg);};

  // Coach action handlers — let the AI directly modify app state
  const coachLogWeight=(w)=>setWlog(l=>[...l,{date:new Date().toISOString(),weight:w}]);
  const coachAddFood=(date,entry)=>setFood(prev=>({...prev,[date]:[...(prev[date]||[]),entry]}));
  const coachClearFoodDay=(date)=>setFood(prev=>{const c={...prev};delete c[date];return c;});
  const coachSetSession=(sk,patch)=>setSessions(prev=>({...prev,[sk]:{...(prev[sk]||{}),...patch,savedAt:new Date().toISOString()}}));
  const coachSaveJournal=(date,entry)=>setJlog(prev=>({...prev,[date]:{...entry,savedAt:new Date().toISOString()}}));
  const coachSwitchTab=(t)=>setTab(t);

  // Compute live macros
  const currentWeight=wlog.length?wlog[wlog.length-1].weight:profile?.weight;
  const activeProfile=profile&&currentWeight?{...profile,...calcMacros(profile,currentWeight)}:profile;
  if(!ready)return(
    <div style={{background:C.bg,height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{...IMP,fontSize:30,letterSpacing:5,color:C.acc}}>RE<span style={{color:C.a2}}>COMP</span></div>
      <div style={{width:120,height:3,background:C.bd,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:"60%",background:C.acc,animation:"pulse 1.5s ease-in-out infinite"}}/></div>
    </div>
  );

  if(!profile)return <Setup onStart={handleStart}/>;

  const isRP=profile.workoutStyle==="rp_hypertrophy";
  const isHyrox=profile.workoutStyle==="hyrox";
  const isHybrid=profile.workoutStyle==="hyrox_hybrid";
  const tw=parseInt(profile.weeks)||8;
  const wk=parseInt(week)||1;
  let phName="WEEK", phCol=C.acc;
  if(isRP){
    const phData=getRPWeek(wk,tw);
    phName=phData.type;phCol=phData.type==="DELOAD"?C.a5:C.acc;
  } else if(isHyrox||isHybrid){
    const phasePct=wk/tw;
    phName=phasePct<=0.4?"BASE":phasePct<=0.75?"BUILD":phasePct<1?(isHybrid?"PEAK":"RACE PREP"):"TAPER";
    phCol=phName==="BASE"?C.a3:phName==="BUILD"?C.a6:phName==="TAPER"?C.a5:C.a2;
  } else {
    const phData=getPhase(wk,tw);
    phName=phData.ph||"WEEK";phCol=PC[phData.ph]||C.acc;
  }
  const tabs=["dashboard","workouts","runs","metrics","food","journal","backup"];

  return(
    <div style={{background:C.bg,color:C.tx,fontFamily:"Helvetica,Arial,sans-serif",height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{background:C.s1,borderBottom:`1px solid ${C.bd}`,height:50,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 14px",flexShrink:0,position:"relative"}}>
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.acc},${C.a2},transparent)`}}/>
        <div style={{display:"flex",alignItems:"center",gap:10,position:"relative"}}>
          <div style={{...IMP,fontSize:22,letterSpacing:4,color:C.acc}}>RE<span style={{color:C.a2}}>COMP</span></div>
          <div style={{...IMP,fontSize:10,letterSpacing:"1.5px",textTransform:"uppercase",padding:"3px 9px",borderRadius:20,border:`1px solid ${phCol}`,color:phCol,background:"rgba(0,0,0,.4)"}}>{phName} WK{week}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,position:"relative"}}>
          <span style={{...IMP,fontSize:11,color:C.mu,letterSpacing:1}}>{currentWeight} lbs</span>
          <button onClick={()=>setTab("backup")} style={hbtn}>BACKUP</button>
          <button onClick={handleReset} style={{...hbtn,borderColor:"#f87171",color:"#f87171"}}>RESET</button>
        </div>
      </div>
      <div style={{background:C.s1,borderBottom:`1px solid ${C.bd}`,display:"flex",flexShrink:0,overflowX:"auto"}}>
        {tabs.map(t=><div key={t} onClick={()=>setTab(t)} style={{padding:"9px 14px",...IMP,fontSize:12,letterSpacing:"1.5px",textTransform:"uppercase",color:tab===t?C.acc:C.mu,cursor:"pointer",borderBottom:tab===t?`2px solid ${C.acc}`:"2px solid transparent",whiteSpace:"nowrap",flexShrink:0}}>{t.toUpperCase()}</div>)}
      </div>
      <div style={{flex:1,overflow:"hidden"}}>
        {tab==="dashboard"&&<Dashboard profile={activeProfile} week={week} wlog={wlog} food={food} openCoach={openCoach} onUpdateProfile={handleUpdateProfile}/>}
        {tab==="workouts"&&<WorkoutView profile={activeProfile} week={week} sessions={sessions} setSessions={setSessions} coachMsg={m=>openCoach(m)} onUpdateProfile={handleUpdateProfile}/>}
        {tab==="runs"&&<RunsView runs={runs} setRuns={setRuns} coachMsg={openCoach}/>}
        {tab==="metrics"&&<MetricsView profile={activeProfile} wlog={wlog} setWlog={setWlog}/>}
        {tab==="food"&&<FoodView profile={activeProfile} food={food} setFood={setFood}/>}
        {tab==="journal"&&<JournalView jlog={jlog} setJlog={setJlog}/>}
        {tab==="backup"&&<BackupView profile={activeProfile} week={week} wlog={wlog} food={food} jlog={jlog} sessions={sessions} runs={runs} conv={conv} onImport={handleImport} onReset={handleReset} onUpdateProfile={handleUpdateProfile} onShowSummary={()=>setShowSummary(true)} onSetWeek={v=>{setWeek(v);setTab("workouts");openCoach(`I set my program to Week ${v}. Briefly confirm the phase and the key focus this week.`);}}/>}
      </div>
      <button onClick={()=>setCoachOpen(o=>!o)} style={{position:"fixed",bottom:18,right:18,zIndex:200,width:52,height:52,borderRadius:"50%",background:`linear-gradient(135deg,${C.acc},${C.a2})`,color:"#000",border:"none",fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 20px rgba(232,255,71,.25)`}}>🤖</button>
      <CoachDrawer open={coachOpen} onClose={()=>setCoachOpen(false)} profile={activeProfile} week={week} initMsg={pendingMsg} onInitConsumed={()=>setPendingMsg(null)} sessions={sessions} wlog={wlog} food={food} jlog={jlog} runs={runs}
        onUpdateProfile={handleUpdateProfile}
        onSetWeek={setWeek}
        onLogWeight={coachLogWeight}
        onAddFood={coachAddFood}
        onClearFoodDay={coachClearFoodDay}
        onSetSession={coachSetSession}
        onSaveJournal={coachSaveJournal}
        onSwitchTab={coachSwitchTab}
        onAddRun={(entry)=>setRuns(r=>[...r,{id:Date.now(),...entry}])}
      />
      {showSummary&&<ProgramSummary profile={activeProfile} wlog={wlog} sessions={sessions} runs={runs} onAcknowledge={()=>{handleUpdateProfile({...profile,summaryAcknowledged:true});setShowSummary(false);}} onStartNew={()=>{handleReset();setShowSummary(false);}}/>}
    </div>
  );
}

export default function Recomp(){
  return <ErrorBoundary><RecompCore/></ErrorBoundary>;
}
