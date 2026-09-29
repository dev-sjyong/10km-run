import {buildPushPayload} from "@block65/webcrypto-web-push";

const STATE_KEY="weather_state_v1",SUB_PREFIX="push_subscription_v1:",TIMEZONE="Asia/Seoul",STALE_MS=75*60*1000,RACE_DATE="2026-10-18",SEARCH_DAYS=7;
const SUWON={name:"Suwon",latitude:37.2636,longitude:127.0286},SEOUL={name:"Jamsil",latitude:37.5145,longitude:127.1059};
const THUNDER_CODES=new Set([95,96,99]),STRONG_RAIN_CODES=new Set([65,67,82]);
const workouts=[
  ["2026-09-16","easy","🩹 회복 대기 · Easy 4.5km 취소"],
  ["2026-09-17","rest","🩹 회복 대기"],
  ["2026-09-18","rest","약속 · 완전 휴식"],
  ["2026-09-19","rest","🩹 회복 상태 확인"],
  ["2026-09-20","rest","회복 · 가벼운 걷기"],
  ["2026-09-21","easy","복귀 Easy 3km"],
  ["2026-09-23","easy","Easy 4.5km"],
  ["2026-09-25","quality","1km × 3 · 10K 페이스 접근"],
  ["2026-09-27","rest","🩹 회복 마무리 · 러닝 없음"],
  ["2026-09-28","easy","복귀 테스트 · Easy 3km"],
  ["2026-09-30","easy","Easy 4km"],
  ["2026-10-02","easy","Easy 5km"],
  ["2026-10-04","long","Long Easy 6.5km"],
  ["2026-10-06","easy","Easy 4.5km"],
  ["2026-10-08","quality","10K Pace 1km × 3"],
  ["2026-10-11","long","Long Easy 8km"],
  ["2026-10-13","easy","Easy 4.5km · 테이퍼"],
  ["2026-10-15","quality","Race Pace 자극 · 짧게"],
  ["2026-10-16","rest","완전 휴식"],
  ["2026-10-17","rest","대회 전날"],
  ["2026-10-18","race","🏁 STYLE RUN 10K · SUB 60"]
].map(([date,type,title])=>({date,type,title}));

function allowedOrigin(env,request){const origin=request.headers.get("Origin")||"",configured=env.ALLOWED_ORIGIN||"https://dev-sjyong.github.io";return origin===configured?origin:configured}
function corsHeaders(env,request){return{"Access-Control-Allow-Origin":allowedOrigin(env,request),"Access-Control-Allow-Methods":"GET, POST, DELETE, OPTIONS","Access-Control-Allow-Headers":"Content-Type","Access-Control-Max-Age":"86400","Cache-Control":"no-store","Vary":"Origin"}}
function json(data,status,env,request){return new Response(JSON.stringify(data,null,2),{status,headers:{"Content-Type":"application/json; charset=utf-8",...corsHeaders(env,request)}})}
function kstParts(date=new Date()){const parts=new Intl.DateTimeFormat("en-CA",{timeZone:TIMEZONE,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(date),v=Object.fromEntries(parts.map(p=>[p.type,p.value]));return{date:`${v.year}-${v.month}-${v.day}`,hour:Number(v.hour),minute:Number(v.minute),second:Number(v.second),text:`${v.year}-${v.month}-${v.day}T${v.hour}:${v.minute}:${v.second}+09:00`}}
function nextWholeHourKey(now=kstParts()){if(now.minute===0&&now.second===0)return`${now.date}T${String(now.hour).padStart(2,"0")}:00`;const d=new Date(`${now.date}T${String(now.hour).padStart(2,"0")}:00:00+09:00`);d.setTime(d.getTime()+3600000);const next=kstParts(d);return`${next.date}T${String(next.hour).padStart(2,"0")}:00`}
function parseDate(date){return new Date(`${date}T12:00:00+09:00`)}
function dateAdd(date,days){const d=parseDate(date);d.setDate(d.getDate()+days);return new Intl.DateTimeFormat("en-CA",{timeZone:TIMEZONE,year:"numeric",month:"2-digit",day:"2-digit"}).format(d)}
function dayDiff(from,to){return Math.round((parseDate(to)-parseDate(from))/86400000)}
function addHours(local,hours){const d=new Date(`${local}:00+09:00`);d.setTime(d.getTime()+hours*3600000);const p=kstParts(d);return`${p.date}T${String(p.hour).padStart(2,"0")}:00`}
function isUnsafeHour(h){return THUNDER_CODES.has(h.code)||STRONG_RAIN_CODES.has(h.code)||h.precipitationProbability>=70||h.precipitation>=0.5}
function findSafeWindow(hours,required){for(let i=0;i<=hours.length-required;i++){let safe=true;for(let j=0;j<required;j++){const point=hours[i+j],previous=j?hours[i+j-1]:null;if(isUnsafeHour(point)||(previous&&point.time!==addHours(previous.time,1))){safe=false;break}}if(safe)return{start:hours[i].time,end:addHours(hours[i+required-1].time,1),hours:required}}return null}
function compactHour(data,i){return{time:data.hourly.time[i],code:data.hourly.weather_code[i],temperature:data.hourly.temperature_2m[i],precipitationProbability:data.hourly.precipitation_probability[i]??0,precipitation:data.hourly.precipitation[i]??0,wind:data.hourly.wind_speed_10m[i]??0}}
function dailyMap(data){const result={};data.daily.time.forEach((date,i)=>result[date]={code:data.daily.weather_code[i],max:data.daily.temperature_2m_max[i],min:data.daily.temperature_2m_min[i],precipitation:data.daily.precipitation_probability_max[i]??0,wind:data.daily.wind_speed_10m_max[i]??0});return result}
async function fetchForecast(location){const params=new URLSearchParams({latitude:String(location.latitude),longitude:String(location.longitude),timezone:TIMEZONE,forecast_days:"16",past_days:"2",hourly:["weather_code","temperature_2m","precipitation_probability","precipitation","wind_speed_10m"].join(","),daily:["weather_code","temperature_2m_max","temperature_2m_min","precipitation_probability_max","wind_speed_10m_max"].join(",")}),response=await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);if(!response.ok)throw new Error(`${location.name} Open-Meteo error: ${response.status}`);return response.json()}
function buildTodayAssessment(data,generatedAt){const now=kstParts(generatedAt),from=nextWholeHourKey(now),remaining=data.hourly.time.map((_,i)=>compactHour(data,i)).filter(h=>h.time.startsWith(`${now.date}T`)&&h.time>=from),easy=findSafeWindow(remaining,1),hard=findSafeWindow(remaining,2);return{date:now.date,assessedAt:now.text,assessmentFrom:from,rules:{easyRequiredHours:1,hardRequiredHours:2,unsafePrecipitationProbability:70,unsafeHourlyPrecipitationMm:0.5,thunderCodes:[...THUNDER_CODES],strongRainCodes:[...STRONG_RAIN_CODES]},easy:{canRun:Boolean(easy),safeWindow:easy},hard:{canRun:Boolean(hard),safeWindow:hard},remainingHours:remaining}}
async function buildState(){const generatedAt=new Date(),[suwon,seoul]=await Promise.all([fetchForecast(SUWON),fetchForecast(SEOUL)]);return{version:1,source:"Open-Meteo",generatedAt:generatedAt.toISOString(),generatedAtKst:kstParts(generatedAt).text,today:buildTodayAssessment(suwon,generatedAt),suwonDaily:dailyMap(suwon),seoulDaily:dailyMap(seoul)}}
async function refreshState(env){if(!env.WEATHER_STATE)throw new Error("WEATHER_STATE KV binding is missing");const state=await buildState();await env.WEATHER_STATE.put(STATE_KEY,JSON.stringify(state));return state}
function isStale(state){return!state?.generatedAt||Date.now()-new Date(state.generatedAt).getTime()>STALE_MS}
async function readState(env){return env.WEATHER_STATE?.get(STATE_KEY,"json")||null}

function isRunning(w){return["easy","long","quality"].includes(w.type)}
function isHard(w){return["long","quality"].includes(w.type)}
function minGap(a,b){return(["quality","long"].includes(a)||["quality","long"].includes(b))?2:1}
function weatherBad(state,w,date){if(date===state?.today?.date){const assessment=w.type==="easy"?state.today.easy:state.today.hard;return assessment?.canRun===false}const d=(w.type==="race"?state?.seoulDaily:state?.suwonDaily)?.[date];return Boolean(d&&(THUNDER_CODES.has(d.code)||STRONG_RAIN_CODES.has(d.code)||d.precipitation>=70))}
function weatherPenalty(state,w,date){const d=(w.type==="race"?state?.seoulDaily:state?.suwonDaily)?.[date];if(!d)return 0;let s=0;if(d.precipitation>=40)s+=18;else if(d.precipitation>=20)s+=6;if(d.wind>=30)s+=12;if(d.max>=30)s+=10;else if(d.max>=28)s+=5;return s}
function normalizeUser(v={}){return{autoEnabled:v.autoEnabled!==false,done:v.done&&typeof v.done==="object"?v.done:{},locked:v.locked&&typeof v.locked==="object"?v.locked:{},lockDates:v.lockDates&&typeof v.lockDates==="object"?v.lockDates:{},actualDates:v.actualDates&&typeof v.actualDates==="object"?v.actualDates:{},defers:v.defers&&typeof v.defers==="object"?v.defers:{}}}
function adaptiveSchedule(state,value={}){
  const user=normalizeUser(value),today=state?.today?.date||kstParts().date,taper=dateAdd(RACE_DATE,-2),entries=workouts.map(w=>({...w,effectiveDate:w.date})),rest=new Set(workouts.filter(w=>w.type==="rest").map(w=>w.date)),occupied=new Map();let previous=null;
  const nextAnchor=i=>{for(let j=i+1;j<entries.length;j++){const n=entries[j];if(n.type==="race")return{date:n.date,type:n.type,fixed:true};if(user.done[n.date])return{date:user.actualDates[n.date]||n.date,type:n.type,fixed:true};if(user.locked[n.date])return{date:user.lockDates[n.date]||n.date,type:n.type,fixed:true};if(isHard(n))return{date:n.date,type:n.type,fixed:false}}return{date:RACE_DATE,type:"race",fixed:true}};
  for(let i=0;i<entries.length;i++){const w=entries[i];if(w.type==="race"){occupied.set(w.date,w.date);previous={date:w.date,type:w.type};continue}if(!isRunning(w))continue;if(user.done[w.date]){w.effectiveDate=user.actualDates[w.date]||w.date;occupied.set(w.effectiveDate,w.date);previous={date:w.effectiveDate,type:w.type};continue}if(user.locked[w.date]){w.effectiveDate=user.lockDates[w.date]||w.date;occupied.set(w.effectiveDate,w.date);previous={date:w.effectiveDate,type:w.type};continue}
    const manual=user.defers[w.date],past=dayDiff(w.date,today)>0,triggered=!past&&user.autoEnabled&&weatherBad(state,w,w.date);if(past&&!manual){occupied.set(w.date,w.date);previous={date:w.date,type:w.type};continue}let start=w.date;if(manual?.notBefore>start)start=manual.notBefore;if(previous){const earliest=dateAdd(previous.date,minGap(previous.type,w.type));if(earliest>start)start=earliest}if(start>=taper&&w.date<taper)continue;
    const anchor=nextAnchor(i);let best=null,bestScore=Infinity;for(let offset=0;offset<=SEARCH_DAYS;offset++){const candidate=dateAdd(start,offset);if(candidate>=RACE_DATE||candidate>=taper)break;if(occupied.has(candidate)||rest.has(candidate)||(user.autoEnabled&&weatherBad(state,w,candidate)))continue;if(previous&&dayDiff(previous.date,candidate)<minGap(previous.type,w.type))continue;let score=dayDiff(start,candidate)*10+Math.max(0,dayDiff(w.date,candidate))*2+weatherPenalty(state,w,candidate);const gap=dayDiff(candidate,anchor.date),need=minGap(w.type,anchor.type);if(gap<need)score+=anchor.fixed?10000:600;else if(gap===need)score+=10;else if(gap===need+1)score+=2;if(score<bestScore){best=candidate;bestScore=score}}if(!best)continue;w.effectiveDate=best;occupied.set(best,w.date);previous={date:best,type:w.type}}
  return entries.filter(isRunning);
}
function scheduleChanges(oldState,newState,userState){if(!oldState||!newState||userState?.autoEnabled===false)return[];const before=new Map(adaptiveSchedule(oldState,userState).map(w=>[w.date,w]));return adaptiveSchedule(newState,userState).flatMap(after=>{const old=before.get(after.date);if(!old||old.effectiveDate===after.effectiveDate)return[];return[{action:after.effectiveDate===after.date?"복귀":"이동",title:after.title,baseDate:after.date,from:old.effectiveDate,to:after.effectiveDate}]})}
function monthDay(date){const[,m,d]=date.split("-");return`${Number(m)}/${Number(d)}`}
function pushMessage(changes){const first=changes[0],more=changes.length>1?` 외 ${changes.length-1}건`:"";return{title:`🏃 훈련 일정 ${first.action}`,body:`${first.title}: ${monthDay(first.from)} → ${monthDay(first.to)}${more}`,url:"./",tag:"run10k-weather-schedule",changes}}

function validEndpoint(endpoint){try{const u=new URL(endpoint),h=u.hostname;return u.protocol==="https:"&&(h==="fcm.googleapis.com"||h==="updates.push.services.mozilla.com"||h==="web.push.apple.com"||h.endsWith(".push.apple.com")||h.endsWith(".notify.windows.com"))}catch{return false}}
function validSubscription(s){return Boolean(s&&validEndpoint(s.endpoint)&&typeof s.keys?.p256dh==="string"&&s.keys.p256dh.length>20&&typeof s.keys?.auth==="string"&&s.keys.auth.length>8)}
async function subscriptionKey(endpoint){const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(endpoint));return SUB_PREFIX+[...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,"0")).join("")}
async function bodyJson(request){const text=await request.text();if(text.length>32768)throw new Error("Request body too large");return JSON.parse(text)}
async function saveSubscription(request,env){const body=await bodyJson(request),subscription=body.subscription;if(!validSubscription(subscription))throw new Error("Invalid push subscription");await env.WEATHER_STATE.put(await subscriptionKey(subscription.endpoint),JSON.stringify({subscription,userState:normalizeUser(body.userState),updatedAt:new Date().toISOString()}));return{ok:true}}
async function deleteSubscription(request,env){const{endpoint}=await bodyJson(request);if(typeof endpoint!=="string"||!validEndpoint(endpoint))throw new Error("Invalid push endpoint");await env.WEATHER_STATE.delete(await subscriptionKey(endpoint));return{ok:true}}
async function listSubscriptions(env){const records=[];let cursor;do{const page=await env.WEATHER_STATE.list({prefix:SUB_PREFIX,cursor});for(const item of page.keys){const record=await env.WEATHER_STATE.get(item.name,"json");if(record)records.push({key:item.name,record})}cursor=page.list_complete?undefined:page.cursor}while(cursor);return records}
async function sendPush(env,subscription,message){if(!env.VAPID_PUBLIC_KEY||!env.VAPID_PRIVATE_KEY)throw new Error("VAPID secrets are not configured");const payload=await buildPushPayload({data:JSON.stringify(message),options:{ttl:3600,urgency:"normal",topic:"run10k-schedule"}},subscription,{subject:env.VAPID_SUBJECT||"https://dev-sjyong.github.io/10km-run/",publicKey:env.VAPID_PUBLIC_KEY,privateKey:env.VAPID_PRIVATE_KEY});return fetch(subscription.endpoint,payload)}
async function notifyChanges(env,oldState,newState){if(!oldState||!env.VAPID_PUBLIC_KEY||!env.VAPID_PRIVATE_KEY)return;const records=await listSubscriptions(env);await Promise.all(records.map(async({key,record})=>{const changes=scheduleChanges(oldState,newState,record.userState);if(!changes.length)return;try{const response=await sendPush(env,record.subscription,pushMessage(changes));if(response.status===404||response.status===410)await env.WEATHER_STATE.delete(key);else if(!response.ok)console.error("Push rejected",response.status)}catch(error){console.error("Push failed",error)}}))}
async function refreshAndNotify(env){const oldState=await readState(env),newState=await refreshState(env);await notifyChanges(env,oldState,newState);return newState}

export default{
  async fetch(request,env){if(request.method==="OPTIONS")return new Response(null,{status:204,headers:corsHeaders(env,request)});const url=new URL(request.url);
    if(url.pathname==="/api/health"&&request.method==="GET"){const state=await readState(env);return json({ok:true,service:"10km-run-weather-scheduler",hasState:Boolean(state),stateGeneratedAt:state?.generatedAt||null,stale:isStale(state),pushConfigured:Boolean(env.VAPID_PUBLIC_KEY&&env.VAPID_PRIVATE_KEY)},200,env,request)}
    if(url.pathname==="/api/weather"&&request.method==="GET"){try{const force=url.searchParams.get("refresh")==="1";let state=force?await refreshAndNotify(env):await readState(env);if(!force&&isStale(state))state=await refreshAndNotify(env);return json(state,200,env,request)}catch(error){return json({error:"Weather state unavailable",message:error instanceof Error?error.message:String(error)},503,env,request)}}
    if(url.pathname==="/api/push/public-key"&&request.method==="GET")return json({available:Boolean(env.VAPID_PUBLIC_KEY&&env.VAPID_PRIVATE_KEY),publicKey:env.VAPID_PUBLIC_KEY||null},200,env,request);
    if(url.pathname==="/api/push/subscriptions"&&request.method==="POST"){try{return json(await saveSubscription(request,env),201,env,request)}catch(error){return json({error:error instanceof Error?error.message:String(error)},400,env,request)}}
    if(url.pathname==="/api/push/subscriptions"&&request.method==="DELETE"){try{return json(await deleteSubscription(request,env),200,env,request)}catch(error){return json({error:error instanceof Error?error.message:String(error)},400,env,request)}}
    if(request.method!=="GET")return json({error:"Method not allowed"},405,env,request);return json({service:"10km-run-weather-scheduler",endpoints:["/api/health","/api/weather","/api/weather?refresh=1","/api/push/public-key","/api/push/subscriptions"]},200,env,request)},
  async scheduled(_controller,env,ctx){ctx.waitUntil(refreshAndNotify(env).catch(error=>console.error("Scheduled weather refresh failed",error)))}
};

export{adaptiveSchedule,scheduleChanges};
