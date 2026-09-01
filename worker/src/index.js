const STATE_KEY="weather_state_v1";
const TIMEZONE="Asia/Seoul";
const STALE_MS=75*60*1000;
const SUWON={name:"Suwon",latitude:37.2636,longitude:127.0286};
const SEOUL={name:"Jamsil",latitude:37.5145,longitude:127.1059};
const THUNDER_CODES=new Set([95,96,99]);
const STRONG_RAIN_CODES=new Set([65,67,82]);

function allowedOrigin(env,request){
  const origin=request.headers.get("Origin")||"";
  const configured=env.ALLOWED_ORIGIN||"https://dev-sjyong.github.io";
  return origin===configured?origin:configured;
}
function corsHeaders(env,request){return{
  "Access-Control-Allow-Origin":allowedOrigin(env,request),
  "Access-Control-Allow-Methods":"GET, OPTIONS",
  "Access-Control-Allow-Headers":"Content-Type",
  "Access-Control-Max-Age":"86400",
  "Cache-Control":"no-store"
}}
function json(data,status,env,request){return new Response(JSON.stringify(data,null,2),{status,headers:{"Content-Type":"application/json; charset=utf-8",...corsHeaders(env,request)}})}
function kstParts(date=new Date()){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:TIMEZONE,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(date);
  const v=Object.fromEntries(parts.map(p=>[p.type,p.value]));
  return{date:`${v.year}-${v.month}-${v.day}`,hour:Number(v.hour),minute:Number(v.minute),second:Number(v.second),text:`${v.year}-${v.month}-${v.day}T${v.hour}:${v.minute}:${v.second}+09:00`};
}
function nextWholeHourKey(now=kstParts()){
  if(now.minute===0&&now.second===0)return`${now.date}T${String(now.hour).padStart(2,"0")}:00`;
  const d=new Date(`${now.date}T${String(now.hour).padStart(2,"0")}:00:00+09:00`);d.setTime(d.getTime()+3600000);
  const next=kstParts(d);return`${next.date}T${String(next.hour).padStart(2,"0")}:00`;
}
function addHours(localDateTime,hours){const d=new Date(`${localDateTime}:00+09:00`);d.setTime(d.getTime()+hours*3600000);const p=kstParts(d);return`${p.date}T${String(p.hour).padStart(2,"0")}:00`}
function isUnsafeHour(h){return THUNDER_CODES.has(h.code)||STRONG_RAIN_CODES.has(h.code)||h.precipitationProbability>=70||h.precipitation>=0.5}
function findSafeWindow(hours,requiredHours){
  for(let i=0;i<=hours.length-requiredHours;i++){
    let safe=true;
    for(let j=0;j<requiredHours;j++){
      const point=hours[i+j],previous=j===0?null:hours[i+j-1];
      if(isUnsafeHour(point)||(previous&&point.time!==addHours(previous.time,1))){safe=false;break}
    }
    if(safe)return{start:hours[i].time,end:addHours(hours[i+requiredHours-1].time,1),hours:requiredHours};
  }
  return null;
}
function compactHour(data,index){return{time:data.hourly.time[index],code:data.hourly.weather_code[index],temperature:data.hourly.temperature_2m[index],precipitationProbability:data.hourly.precipitation_probability[index]??0,precipitation:data.hourly.precipitation[index]??0,wind:data.hourly.wind_speed_10m[index]??0}}
function dailyMap(data){const result={};data.daily.time.forEach((date,i)=>{result[date]={code:data.daily.weather_code[i],max:data.daily.temperature_2m_max[i],min:data.daily.temperature_2m_min[i],precipitation:data.daily.precipitation_probability_max[i]??0,wind:data.daily.wind_speed_10m_max[i]??0}});return result}
async function fetchForecast(location){
  const params=new URLSearchParams({latitude:String(location.latitude),longitude:String(location.longitude),timezone:TIMEZONE,forecast_days:"16",hourly:["weather_code","temperature_2m","precipitation_probability","precipitation","wind_speed_10m"].join(","),daily:["weather_code","temperature_2m_max","temperature_2m_min","precipitation_probability_max","wind_speed_10m_max"].join(",")});
  const response=await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if(!response.ok)throw new Error(`${location.name} Open-Meteo error: ${response.status}`);
  return response.json();
}
function buildTodayAssessment(suwonData,generatedAt){
  const now=kstParts(generatedAt),from=nextWholeHourKey(now);
  const remaining=suwonData.hourly.time.map((_,i)=>compactHour(suwonData,i)).filter(h=>h.time.startsWith(`${now.date}T`)&&h.time>=from);
  const easyWindow=findSafeWindow(remaining,1),hardWindow=findSafeWindow(remaining,2);
  return{date:now.date,assessedAt:now.text,assessmentFrom:from,rules:{easyRequiredHours:1,hardRequiredHours:2,unsafePrecipitationProbability:70,unsafeHourlyPrecipitationMm:0.5,thunderCodes:[...THUNDER_CODES],strongRainCodes:[...STRONG_RAIN_CODES]},easy:{canRun:Boolean(easyWindow),safeWindow:easyWindow},hard:{canRun:Boolean(hardWindow),safeWindow:hardWindow},remainingHours:remaining};
}
async function buildState(){
  const generatedAt=new Date();
  const[suwonData,seoulData]=await Promise.all([fetchForecast(SUWON),fetchForecast(SEOUL)]);
  return{version:1,source:"Open-Meteo",generatedAt:generatedAt.toISOString(),generatedAtKst:kstParts(generatedAt).text,today:buildTodayAssessment(suwonData,generatedAt),suwonDaily:dailyMap(suwonData),seoulDaily:dailyMap(seoulData)};
}
async function refreshState(env){if(!env.WEATHER_STATE)throw new Error("WEATHER_STATE KV binding is missing");const state=await buildState();await env.WEATHER_STATE.put(STATE_KEY,JSON.stringify(state));return state}
function isStale(state){return!state?.generatedAt||Date.now()-new Date(state.generatedAt).getTime()>STALE_MS}
async function readState(env){if(!env.WEATHER_STATE)return null;return env.WEATHER_STATE.get(STATE_KEY,"json")}

export default{
  async fetch(request,env){
    if(request.method==="OPTIONS")return new Response(null,{status:204,headers:corsHeaders(env,request)});
    if(request.method!=="GET")return json({error:"Method not allowed"},405,env,request);
    const url=new URL(request.url);
    if(url.pathname==="/api/health"){
      const state=await readState(env);
      return json({ok:true,service:"10km-run-weather-scheduler",hasState:Boolean(state),stateGeneratedAt:state?.generatedAt||null,stale:isStale(state)},200,env,request);
    }
    if(url.pathname==="/api/weather"){
      try{
        const forceRefresh=url.searchParams.get("refresh")==="1";
        let state=forceRefresh?await refreshState(env):await readState(env);
        if(!forceRefresh&&isStale(state))state=await refreshState(env);
        return json(state,200,env,request);
      }catch(error){return json({error:"Weather state unavailable",message:error instanceof Error?error.message:String(error)},503,env,request)}
    }
    return json({service:"10km-run-weather-scheduler",endpoints:["/api/health","/api/weather","/api/weather?refresh=1"]},200,env,request);
  },
  async scheduled(_controller,env,ctx){ctx.waitUntil(refreshState(env).catch(error=>console.error("Scheduled weather refresh failed",error)))}
};
