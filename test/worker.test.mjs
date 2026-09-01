import test from "node:test";
import assert from "node:assert/strict";
import {scheduleChanges} from "../worker/src/index.js";

function state(canRun){
  return{today:{date:"2026-09-01",easy:{canRun},hard:{canRun}},suwonDaily:{},seoulDaily:{}};
}

test("weather becoming unsafe produces a move",()=>{
  const changes=scheduleChanges(state(true),state(false),{autoEnabled:true});
  assert.deepEqual(changes[0],{action:"이동",title:"Easy 3.5~4km",baseDate:"2026-09-01",from:"2026-09-01",to:"2026-09-02"});
});

test("weather becoming safe produces a return",()=>{
  const changes=scheduleChanges(state(false),state(true),{autoEnabled:true});
  assert.deepEqual(changes[0],{action:"복귀",title:"Easy 3.5~4km",baseDate:"2026-09-01",from:"2026-09-02",to:"2026-09-01"});
});

test("auto off suppresses weather schedule notifications",()=>{
  assert.deepEqual(scheduleChanges(state(true),state(false),{autoEnabled:false}),[]);
});
