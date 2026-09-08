import test from "node:test";
import assert from "node:assert/strict";
import {adaptiveSchedule,scheduleChanges,runningIndexScore,assessRunWindows} from "../worker/src/index-v2.js";

function legacyState(canRun){
  return{today:{date:"2026-09-01",easy:{canRun},hard:{canRun}},suwonDaily:{},seoulDaily:{}};
}

function indexState(mode,score,canRun=mode!=="move"){
  const assessment={canRun,mode,bestScore:score};
  return{
    today:{date:"2026-09-01",easy:assessment,hard:assessment,runningIndex:{easy:assessment,hard:assessment}},
    suwonDaily:{},seoulDaily:{},suwonRunIndex:{},seoulRunIndex:{}
  };
}

test("weather becoming unsafe produces a move",()=>{
  const changes=scheduleChanges(legacyState(true),legacyState(false),{autoEnabled:true});
  assert.deepEqual(changes[0],{action:"이동",title:"Easy 3.5~4km",baseDate:"2026-09-01",from:"2026-09-01",to:"2026-09-02"});
});

test("weather becoming safe produces a return",()=>{
  const changes=scheduleChanges(legacyState(false),legacyState(true),{autoEnabled:true});
  assert.deepEqual(changes[0],{action:"복귀",title:"Easy 3.5~4km",baseDate:"2026-09-01",from:"2026-09-02",to:"2026-09-01"});
});

test("auto off suppresses weather schedule notifications",()=>{
  assert.deepEqual(scheduleChanges(legacyState(true),legacyState(false),{autoEnabled:false}),[]);
});

test("running index 40 to 59 keeps the original date",()=>{
  const schedule=adaptiveSchedule(indexState("reduced",52),{autoEnabled:true});
  assert.equal(schedule[0].effectiveDate,"2026-09-01");
});

test("running index below 40 moves to the next usable date",()=>{
  const state=indexState("move",35,false);
  state.suwonRunIndex["2026-09-02"]={easy:{canRun:true,mode:"normal",bestScore:82},hard:{canRun:true,mode:"normal",bestScore:82}};
  const schedule=adaptiveSchedule(state,{autoEnabled:true});
  assert.equal(schedule[0].effectiveDate,"2026-09-02");
});

test("running index 60 or higher is normal training",()=>{
  const assessment=assessRunWindows([{time:"2026-09-01T18:00",runningIndex:80,temperature:18,apparent:18,humidity:50,precipitationProbability:0,precipitation:0,wind:5,code:0}],1);
  assert.equal(assessment.mode,"normal");
  assert.equal(assessment.canRun,true);
});

test("running index scoring returns 100 in mild dry conditions",()=>{
  assert.equal(runningIndexScore({temperature:15,apparent:15,humidity:50,precipitationProbability:0,precipitation:0,wind:5,code:0}),100);
});
