const RACE_DATE="2026-10-18";
const WORKER_API_BASE="https://run10k-weather-scheduler.raw1159.workers.dev";
const SUWON={latitude:37.2636,longitude:127.0286};
const SEOUL={latitude:37.5145,longitude:127.1059};
const STORAGE_KEYS={done:"run58_done_",note:"run58_note_",dist:"run58_dist_",time:"run58_time_",rpe:"run58_rpe_",weight:"run58_weight_",pain:"run58_pain_"};
const WEATHER_CACHE_KEY="run58_weather_cache_v3";
const AUTO_KEY="run58_weather_auto_enabled_v3";
const LOCK_KEY="run58_lock_";
const LOCK_DATE_KEY="run58_lock_date_";
const ACTUAL_DATE_KEY="run58_actual_date_";
const DEFER_KEY="run58_defer_";
const SEARCH_DAYS=7;

const workouts=[
  {date:"2026-09-01",type:"easy",title:"Easy 3.5~4km",desc:"7:15~7:35/km\nRPE 4~5\n첫 1km를 가장 천천히"},
  {date:"2026-09-04",type:"easy",title:"Easy 4km",desc:"7:10~7:30/km\n일정한 페이스 유지"},
  {date:"2026-09-07",type:"long",title:"Long Easy 5km",desc:"7:15~7:40/km\n마지막까지 여유를 남기기"},
  {date:"2026-09-09",type:"easy",title:"Easy 4.5km",desc:"7:10~7:35/km\n편안한 연속주"},
  {date:"2026-09-11",type:"quality",title:"4분 지속주 × 4",desc:"1km Easy\n(4분 @ 6:30~6:40/km + 2분 회복) × 4\nCooldown\n\n6분 초반까지 과속하지 않기"},
  {date:"2026-09-14",type:"long",title:"Long Easy 6km",desc:"7:15~7:45/km\n속도가 아니라 거리 적응이 목적"},
  {date:"2026-09-16",type:"easy",title:"Easy 5km",desc:"7:10~7:35/km\nRPE 4~5"},
  {date:"2026-09-18",type:"quality",title:"1.5km Tempo × 2",desc:"1km Easy\n1.5km @ 6:20~6:30/km\n3분 회복\n1.5km @ 6:20~6:30/km\nCooldown"},
  {date:"2026-09-21",type:"long",title:"Long Easy 7km",desc:"7:15~7:45/km\n끝났을 때 완전히 탈진하지 않기"},
  {date:"2026-09-23",type:"easy",title:"Easy 5km",desc:"7:10~7:35/km\n회복성 러닝"},
  {date:"2026-09-25",type:"quality",title:"1km × 3",desc:"1km Easy\n1km @ 6:05~6:15/km × 3\n세트 사이 3분 걷기/조깅\nCooldown\n\n세 세트 페이스를 최대한 일정하게"},
  {date:"2026-09-28",type:"long",title:"Long Easy 8km",desc:"7:15~7:45/km\n기록 도전 금지"},
  {date:"2026-09-30",type:"easy",title:"Easy 4km",desc:"7:10~7:35/km\n10/2 테스트 대비 가볍게"},
  {date:"2026-10-02",type:"quality",title:"⭐ 5km 기록 테스트",desc:"워밍업 10~15분 후 5km 연속주\n\n28분대 → Sub-60 가능성 높음\n29:00~29:30 → Sub-60 도전 가능\n29:30~30:30 → 공격적인 목표\n30:30+ → 실전 페이스 재검토"},
  {date:"2026-10-05",type:"long",title:"Long Easy 8.5~9km",desc:"7:15~7:45/km\n대회 전 가장 중요한 거리 적응\n기록 도전 금지"},
  {date:"2026-10-07",type:"easy",title:"Easy 4~5km",desc:"7:10~7:35/km\n다리 피로 회복"},
  {date:"2026-10-09",type:"quality",title:"⭐ Goal Pace 1km × 4",desc:"1km Easy\n1km @ 5:55~6:05/km × 4\n세트 사이 3분 회복\nCooldown\n\n마지막 세트까지 페이스 유지가 핵심"},
  {date:"2026-10-12",type:"easy",title:"Easy 6km",desc:"7:10~7:35/km\n마지막 중거리 훈련\n절대 강하게 뛰지 않기"},
  {date:"2026-10-13",type:"easy",title:"Easy 4km + Strides",desc:"Easy 4km\n20초 가속주 × 4\n가속주 사이 60~90초 회복\n전력질주 금지"},
  {date:"2026-10-14",type:"rest",title:"휴식",desc:"걷기는 가능\n다리 피로 회복"},
  {date:"2026-10-15",type:"quality",title:"Race Pace 자극",desc:"Easy 20분\n1분 @ 5:55~6:05/km × 3\n사이 2분 Easy\n훈련 효과보다 페이스 감각 유지"},
  {date:"2026-10-16",type:"rest",title:"완전 휴식",desc:"러닝 금지\n수면과 수분 섭취"},
  {date:"2026-10-17",type:"rest",title:"대회 전날",desc:"완전 휴식 또는 15~20분 산책\n새로운 운동·음식 금지\n신발과 복장 준비"},
  {date:"2026-10-18",type:"race",title:"🏁 STYLE RUN 10K",desc:"SUB 60 도전\n\n0~2km : 6:05/km 전후\n2~5km : 5:58~6:00/km\n5~8km : 5:55~6:00/km\n8~10km : 남은 체력으로\n\n목표 : 59:59 이내\n초반에 시간을 저축하려 하지 않기"}
];

function koreaToday(){return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())}
function koreaNowParts(){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date());
  const get=t=>parts.find(p=>p.type===t)?.value||"00";
  let hour=Number(get("hour"));if(hour===24)hour=0;
  return{date:`${get("year")}-${get("month")}-${get("day")}`,hour,minute:Number(get("minute"))};
}
function parseDate(date){return new Date(date+"T12:00:00+09:00")}
function dateAdd(date,days){const d=parseDate(date);d.setDate(d.getDate()+days);return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"}).format(d)}
function dayDiff(from,to){return Math.round((parseDate(to)-parseDate(from))/86400000)}
function maxDate(a,b){return a>b?a:b}
function validDateString(v){return /^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(parseDate(v).getTime())}
function getWeekday(date){return new Intl.DateTimeFormat("ko-KR",{weekday:"short",timeZone:"Asia/Seoul"}).format(parseDate(date))}
function getMonthDay(date){const[,m,d]=date.split("-");return `${Number(m)}/${Number(d)}`}
function weekKey(date){const d=parseDate(date),m=new Date(d),day=d.getDay();m.setDate(d.getDate()+(day===0?-6:1-day));return new Intl.DateTimeFormat("ko-KR",{month:"long",day:"numeric",timeZone:"Asia/Seoul"}).format(m)}
function formatKoreaTime(iso){if(!iso)return"";return new Intl.DateTimeFormat("ko-KR",{timeZone:"Asia/Seoul",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(iso))}

function readStorage(prefix,date){return localStorage.getItem(prefix+date)||""}
function writeStorage(prefix,date,value){localStorage.setItem(prefix+date,value)}
function isDone(date){return readStorage(STORAGE_KEYS.done,date)==="1"}
function isLocked(date){return localStorage.getItem(LOCK_KEY+date)==="1"}
function autoEnabled(){const v=localStorage.getItem(AUTO_KEY);return v===null?true:v==="1"}
function setAutoEnabled(v){localStorage.setItem(AUTO_KEY,v?"1":"0")}
function toggleAutoWeather(){setAutoEnabled(!autoEnabled());renderSchedule()}
function getDefer(date){try{return JSON.parse(localStorage.getItem(DEFER_KEY+date)||"null")}catch(e){return null}}
function clearDefer(date){localStorage.removeItem(DEFER_KEY+date);renderSchedule()}
function deferLabel(reason){return reason==="sick"?"🤒 몸상태":reason==="schedule"?"📅 일정":"📌 날짜 지정"}
function deferWorkout(baseDate,effectiveDate,reason){
  const today=koreaToday(),anchor=maxDate(today,effectiveDate||baseDate);let notBefore="";
  if(reason==="sick")notBefore=dateAdd(anchor,2);
  else if(reason==="schedule")notBefore=dateAdd(anchor,1);
  else{
    const value=prompt("이 날짜 이후로 다시 배치할게. YYYY-MM-DD 형식으로 입력해줘.",dateAdd(anchor,1));
    if(value===null)return;
    if(!validDateString(value)){alert("날짜 형식이 올바르지 않아. 예: 2026-09-12");return}
    if(value>=RACE_DATE){alert("대회 당일 이후로는 훈련을 미룰 수 없어.");return}
    notBefore=value;
  }
  localStorage.setItem(DEFER_KEY+baseDate,JSON.stringify({reason,notBefore,createdAt:new Date().toISOString()}));
  localStorage.removeItem(LOCK_KEY+baseDate);
  localStorage.removeItem(LOCK_DATE_KEY+baseDate);
  renderSchedule();
}

let weatherMap={},raceWeatherMap={},hourlyWeatherMap={},raceHourlyWeatherMap={},forecastFetchedAt="",weatherSource="";

function weatherText(code){if(code===0)return"☀️ 맑음";if([1,2].includes(code))return"🌤 대체로 맑음";if(code===3)return"☁️ 흐림";if([45,48].includes(code))return"🌫 안개";if([51,53,55,56,57].includes(code))return"🌦 이슬비";if([61,63,65,66,67,80,81,82].includes(code))return"🌧 비";if([71,73,75,77,85,86].includes(code))return"🌨 눈";if([95,96,99].includes(code))return"⛈ 뇌우";return"🌡 날씨"}
function badForOutdoor(w){return!!w&&([95,96,99].includes(w.code)||w.precipitation>=70||[65,67,82].includes(w.code))}
function hourlyBad(h){return!!h&&([95,96,99].includes(h.code)||h.precipitationProbability>=70||h.precipitation>=0.5||[65,67,82].includes(h.code))}
function getWeatherFor(workout,date){return workout.type==="race"?raceWeatherMap[date]:weatherMap[date]}
function getHourlyFor(workout,date){return workout.type==="race"?(raceHourlyWeatherMap[date]||[]):(hourlyWeatherMap[date]||[])}
function requiredSafeHours(workout){return workout.type==="easy"?1:2}
function remainingRunWindow(workout,date){
  if(date!==koreaToday()||!isRunningWorkout(workout))return null;
  const rows=getHourlyFor(workout,date);if(!rows.length)return null;
  const now=koreaNowParts(),startHour=now.minute===0?now.hour:now.hour+1,needed=requiredSafeHours(workout);
  const remaining=rows.filter(r=>r.hour>=startHour&&r.hour<=22);
  if(!remaining.length)return{hasHourly:true,available:false,needed,startHour};
  let streak=[];
  for(const row of remaining){
    if(hourlyBad(row)){streak=[];continue}
    if(streak.length&&row.hour!==streak[streak.length-1].hour+1)streak=[];
    streak.push(row);
    if(streak.length>=needed){
      const first=streak[streak.length-needed],last=streak[streak.length-1];
      return{hasHourly:true,available:true,needed,start:`${String(first.hour).padStart(2,"0")}:00`,end:`${String(last.hour+1).padStart(2,"0")}:00`,rows:streak.slice(-needed)};
    }
  }
  return{hasHourly:true,available:false,needed,startHour};
}
function weatherBadForDate(workout,date){
  const window=remainingRunWindow(workout,date);if(window&&window.hasHourly)return!window.available;
  return badForOutdoor(getWeatherFor(workout,date));
}
function getWeatherAdvice(w,workout){
  if(!w)return{level:"",text:"예보 범위 밖입니다. 날짜가 가까워지면 자동으로 표시됩니다."};
  const{code,max,precipitation,wind}=w;
  if([95,96,99].includes(code))return{level:"danger",text:"일별 예보에 뇌우가 포함되어 있습니다. 오늘 일정 여부는 현재 시각 이후 시간별 예보를 우선합니다."};
  if(precipitation>=70)return{level:"warning",text:"하루 최대 강수확률이 높습니다. 오늘은 남은 시간별 예보에 안전한 러닝 구간이 있는지 별도로 판단합니다."};
  if(max>=30)return{level:"warning",text:"매우 더움: RPE 기준. 페이스 20~40초/km 완화 또는 거리 10~20% 축소."};
  if(max>=28)return{level:"warning",text:"더운 날씨: 목표보다 15~30초/km 느려도 정상입니다."};
  if(wind>=30)return{level:"warning",text:"강풍 가능성: 페이스보다 RPE를 우선하세요."};
  if(precipitation>=40)return{level:"warning",text:"비 가능성 있음. 젖은 노면에서는 코너·내리막 속도를 낮추세요."};
  if(workout.type==="quality"&&max>=15&&max<=24&&precipitation<30&&wind<25)return{level:"",text:"✅ 품질훈련하기 좋은 조건입니다."};
  if(workout.type==="race")return{level:"",text:"대회 날씨입니다. 기온·강수·바람을 기준으로 최종 페이스를 결정하세요."};
  return{level:"",text:"예보상 큰 기상 제한은 없습니다."};
}

function workerHoursToMap(state){
  const map={};
  const today=state?.today;
  if(!today?.date||!Array.isArray(today.remainingHours))return map;
  map[today.date]=today.remainingHours.map(row=>({
    time:row.time,
    hour:Number(String(row.time).slice(11,13)),
    code:row.code,
    temperature:row.temperature,
    precipitationProbability:row.precipitationProbability??0,
    precipitation:row.precipitation??0,
    wind:row.wind??0
  }));
  return map;
}
function applyWorkerState(state){
  if(!state?.suwonDaily||!state?.seoulDaily)throw new Error("invalid worker weather payload");
  weatherMap=state.suwonDaily;
  raceWeatherMap=state.seoulDaily;
  hourlyWeatherMap=workerHoursToMap(state);
  raceHourlyWeatherMap={};
  forecastFetchedAt=state.generatedAt||new Date().toISOString();
  weatherSource="worker";
  localStorage.setItem(WEATHER_CACHE_KEY,JSON.stringify({
    savedAt:Date.now(),fetchedAt:forecastFetchedAt,source:"worker",weatherMap,raceWeatherMap,hourlyWeatherMap,raceHourlyWeatherMap
  }));
}
async function fetchWorkerWeather(force=false){
  const url=`${WORKER_API_BASE}/api/weather${force?"?refresh=1":""}`;
  const response=await fetch(url,{cache:"no-store",headers:{Accept:"application/json"}});
  if(!response.ok)throw new Error(`worker weather fetch failed: ${response.status}`);
  return response.json();
}
async function fetchForecast(location){
  const url="https://api.open-meteo.com/v1/forecast"+`?latitude=${location.latitude}&longitude=${location.longitude}`+"&daily="+["weather_code","temperature_2m_max","temperature_2m_min","precipitation_probability_max","wind_speed_10m_max"].join(",")+"&hourly="+["weather_code","temperature_2m","precipitation_probability","precipitation","wind_speed_10m"].join(",")+"&timezone=Asia%2FSeoul&forecast_days=16";
  const r=await fetch(url);if(!r.ok)throw new Error("weather fetch failed");
  const data=await r.json(),daily={},hourly={};
  data.daily.time.forEach((date,i)=>daily[date]={code:data.daily.weather_code[i],max:data.daily.temperature_2m_max[i],min:data.daily.temperature_2m_min[i],precipitation:data.daily.precipitation_probability_max[i],wind:data.daily.wind_speed_10m_max[i]});
  data.hourly.time.forEach((time,i)=>{const date=time.slice(0,10),hour=Number(time.slice(11,13));if(!hourly[date])hourly[date]=[];hourly[date].push({time,hour,code:data.hourly.weather_code[i],temperature:data.hourly.temperature_2m[i],precipitationProbability:data.hourly.precipitation_probability[i],precipitation:data.hourly.precipitation[i],wind:data.hourly.wind_speed_10m[i]})});
  return{daily,hourly};
}
function applyLocalCache(maxAgeMs=3*60*60*1000){
  const raw=localStorage.getItem(WEATHER_CACHE_KEY);if(!raw)return false;
  try{
    const p=JSON.parse(raw);
    if(!p.savedAt||Date.now()-p.savedAt>maxAgeMs||!p.weatherMap)return false;
    weatherMap=p.weatherMap||{};raceWeatherMap=p.raceWeatherMap||{};hourlyWeatherMap=p.hourlyWeatherMap||{};raceHourlyWeatherMap=p.raceHourlyWeatherMap||{};
    forecastFetchedAt=p.fetchedAt||new Date(p.savedAt).toISOString();weatherSource=p.source||"cache";
    return true;
  }catch(e){return false}
}
async function loadDirectFallback(){
  const[suwon,seoul]=await Promise.all([fetchForecast(SUWON),fetchForecast(SEOUL)]);
  weatherMap=suwon.daily;hourlyWeatherMap=suwon.hourly;raceWeatherMap=seoul.daily;raceHourlyWeatherMap=seoul.hourly;
  forecastFetchedAt=new Date().toISOString();weatherSource="direct";
  localStorage.setItem(WEATHER_CACHE_KEY,JSON.stringify({savedAt:Date.now(),fetchedAt:forecastFetchedAt,source:"direct",weatherMap,raceWeatherMap,hourlyWeatherMap,raceHourlyWeatherMap}));
}
let weatherLoading=false,lastWeatherLoadAt=0;
async function loadWeather(force=false){
  if(weatherLoading)return;
  weatherLoading=true;
  const status=document.getElementById("weatherStatus");
  if(status)status.textContent=force?"Cloudflare 서버에서 최신 예보를 강제로 갱신하는 중...":"Cloudflare 서버 예보를 확인하는 중...";
  try{
    const state=await fetchWorkerWeather(force);
    applyWorkerState(state);
    lastWeatherLoadAt=Date.now();
    if(status)status.textContent=`☁️ Cloudflare 서버 · ${formatKoreaTime(forecastFetchedAt)} 갱신 · 서버는 30분마다 자동 확인`;
    renderSchedule();
  }catch(workerError){
    console.warn("Worker weather unavailable; falling back to Open-Meteo",workerError);
    try{
      await loadDirectFallback();
      lastWeatherLoadAt=Date.now();
      if(status)status.textContent=`⚠️ Cloudflare 연결 실패 · ${formatKoreaTime(forecastFetchedAt)} Open-Meteo 직접 예보 사용`;
      renderSchedule();
    }catch(directError){
      console.error(directError);
      if(applyLocalCache()){
        if(status)status.textContent=`⚠️ 네트워크 오류 · ${formatKoreaTime(forecastFetchedAt)} 저장 예보 사용`;
      }else if(status)status.textContent="⚠️ 날씨 정보를 불러오지 못했습니다. 수동 미루기와 기존 일정은 유지됩니다.";
      renderSchedule();
    }
  }finally{weatherLoading=false}
}

function isRunningWorkout(w){return["easy","long","quality"].includes(w.type)}
function isHardWorkout(w){return["long","quality"].includes(w.type)}
function minGapDays(a,b){return(["quality","long"].includes(a)||["quality","long"].includes(b))?2:1}
function priority(type){return type==="race"?4:type==="quality"?3:type==="long"?2:type==="easy"?1:0}
function weatherPenalty(w){if(!w)return 0;let s=0;if(w.precipitation>=40)s+=18;else if(w.precipitation>=20)s+=6;if(w.wind>=30)s+=12;if(w.max>=30)s+=10;else if(w.max>=28)s+=5;return s}
function nextImportantAnchor(index,entries){for(let j=index+1;j<entries.length;j++){const n=entries[j];if(n.type==="race")return{date:n.date,type:n.type,hard:true,fixed:true};if(isDone(n.date))return{date:localStorage.getItem(ACTUAL_DATE_KEY+n.date)||n.date,type:n.type,hard:isHardWorkout(n),fixed:true};if(isLocked(n.date))return{date:localStorage.getItem(LOCK_DATE_KEY+n.date)||n.date,type:n.type,hard:isHardWorkout(n),fixed:true};if(["quality","long"].includes(n.type))return{date:n.date,type:n.type,hard:true,fixed:false}}return{date:RACE_DATE,type:"race",hard:true,fixed:true}}
function candidateScore(workout,candidate,startDate,nextAnchor){let score=dayDiff(startDate,candidate)*10+Math.max(0,dayDiff(workout.date,candidate))*2;score+=weatherPenalty(getWeatherFor(workout,candidate));if(nextAnchor){const gap=dayDiff(candidate,nextAnchor.date),need=minGapDays(workout.type,nextAnchor.type);if(gap<need)score+=nextAnchor.fixed?10000:600;else if(gap===need)score+=10;else if(gap===need+1)score+=2}return score}

function buildAdaptiveSchedule(){
  const today=koreaToday(),weatherAuto=autoEnabled(),taperProtect=dateAdd(RACE_DATE,-2);
  const entries=workouts.map(w=>({...w,effectiveDate:w.date,moved:false,moveReason:"",scheduleWarning:"",suggestSkip:false,manual:getDefer(w.date)}));
  const restDates=new Set(workouts.filter(w=>w.type==="rest").map(w=>w.date)),occupied=new Map();let previousRun=null;
  for(let i=0;i<entries.length;i++){
    const w=entries[i];
    if(w.type==="race"){w.effectiveDate=w.date;occupied.set(w.date,w.date);previousRun={date:w.date,type:w.type};continue}
    if(w.type==="rest"||!isRunningWorkout(w))continue;
    if(isDone(w.date)){w.effectiveDate=localStorage.getItem(ACTUAL_DATE_KEY+w.date)||w.date;occupied.set(w.effectiveDate,w.date);previousRun={date:w.effectiveDate,type:w.type};continue}
    if(isLocked(w.date)){w.effectiveDate=localStorage.getItem(LOCK_DATE_KEY+w.date)||w.date;occupied.set(w.effectiveDate,w.date);previousRun={date:w.effectiveDate,type:w.type};continue}
    const manual=w.manual,weatherTriggered=weatherAuto&&weatherBadForDate(w,w.date),past=dayDiff(w.date,today)>0;
    if(past&&!manual&&!weatherTriggered){w.effectiveDate=w.date;occupied.set(w.date,w.date);previousRun={date:w.date,type:w.type};continue}
    let startDate=w.date;const reasons=[];
    if(manual){startDate=maxDate(startDate,manual.notBefore);reasons.push(`${deferLabel(manual.reason)}로 미룸`)}
    if(previousRun){const required=minGapDays(previousRun.type,w.type),earliest=dateAdd(previousRun.date,required);if(earliest>startDate){startDate=earliest;reasons.push("앞 훈련과 회복 간격 확보")}}
    if(weatherTriggered){const win=remainingRunWindow(w,w.date);reasons.push(win&&win.hasHourly?"현재 시각 이후 안전한 러닝 시간 없음":"비/뇌우 예보")}
    if(startDate>=taperProtect&&w.date<taperProtect){w.suggestSkip=true;w.scheduleWarning="대회 2일 전 보호 구간까지 밀렸습니다. 이 훈련은 억지로 보충하지 말고 생략을 권장합니다.";continue}
    const nextAnchor=nextImportantAnchor(i,entries);let best=null,bestScore=Infinity;
    for(let offset=0;offset<=SEARCH_DAYS;offset++){
      const candidate=dateAdd(startDate,offset);
      if(candidate>=RACE_DATE||candidate>=taperProtect)break;
      if(occupied.has(candidate)||restDates.has(candidate))continue;
      if(weatherAuto&&weatherBadForDate(w,candidate))continue;
      if(previousRun&&dayDiff(previousRun.date,candidate)<minGapDays(previousRun.type,w.type))continue;
      const score=candidateScore(w,candidate,startDate,nextAnchor);if(score<bestScore){best=candidate;bestScore=score}
    }
    if(!best){if(priority(w.type)<=1||startDate>=dateAdd(RACE_DATE,-4)){w.suggestSkip=true;w.scheduleWarning="회복 간격·보호 휴식일·대회 일정을 모두 지키면서 넣을 날짜가 없습니다. 이 훈련은 생략을 권장합니다."}else w.scheduleWarning="7일 안에서 안전한 이동 날짜를 찾지 못했습니다. AUTO를 끄거나 날짜를 직접 지정해 확인하세요.";continue}
    w.effectiveDate=best;w.moved=best!==w.date;
    if(w.moved){if(best>startDate)reasons.push("뒤 핵심 훈련까지 고려해 최적 날짜 선택");w.moveReason=reasons.length?reasons.join(" + "):"전체 일정 최적화"}
    occupied.set(best,w.date);previousRun={date:best,type:w.type};
  }
  return entries;
}

function timeToSeconds(v){if(!v)return 0;const p=v.split(":").map(Number);if(p.length===3)return p[0]*3600+p[1]*60+p[2];if(p.length===2)return p[0]*60+p[1];return 0}
function calculatePace(date){const dist=parseFloat(readStorage(STORAGE_KEYS.dist,date)),sec=timeToSeconds(readStorage(STORAGE_KEYS.time,date));if(!dist||!sec)return"";const total=Math.round(sec/dist),m=Math.floor(total/60),s=String(total%60).padStart(2,"0");return`${m}'${s}\"/km`}
function typeLabel(w){return w.type==="easy"?"EASY":w.type==="long"?"LONG":w.type==="quality"?"QUALITY":w.type==="race"?"RACE":"REST"}
function escapeHtml(v){return String(v||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}
function recordField(date,label,prefix,placeholder,type="text"){const v=readStorage(prefix,date);return`<div class="field"><label>${label}</label><input type="${type}" value="${escapeHtml(v)}" placeholder="${placeholder}" oninput="writeStorage('${prefix}','${date}',this.value);refreshPace('${date}')"></div>`}
function setDone(baseDate,effectiveDate,checked){writeStorage(STORAGE_KEYS.done,baseDate,checked?"1":"");if(checked)localStorage.setItem(ACTUAL_DATE_KEY+baseDate,effectiveDate);else localStorage.removeItem(ACTUAL_DATE_KEY+baseDate);renderSchedule()}
function setLocked(baseDate,effectiveDate,checked){if(checked){localStorage.setItem(LOCK_KEY+baseDate,"1");localStorage.setItem(LOCK_DATE_KEY+baseDate,effectiveDate)}else{localStorage.removeItem(LOCK_KEY+baseDate);localStorage.removeItem(LOCK_DATE_KEY+baseDate)}renderSchedule()}

function renderSchedule(){
  const container=document.getElementById("schedule"),today=koreaToday();if(!container)return;
  const adaptive=buildAdaptiveSchedule().sort((a,b)=>(a.effectiveDate||a.date).localeCompare(b.effectiveDate||b.date)||a.date.localeCompare(b.date));
  let html="",previousWeek="";
  adaptive.forEach(w=>{
    const shownDate=w.effectiveDate||w.date,week=weekKey(shownDate);if(week!==previousWeek){html+=`<div class="week-label">${week} 주</div>`;previousWeek=week}
    const done=isDone(w.date),locked=isLocked(w.date),weather=getWeatherFor(w,shownDate),advice=getWeatherAdvice(weather,w),manual=getDefer(w.date),window=remainingRunWindow(w,shownDate);
    const classes=["workout",shownDate===today?"today":"",done?"completed":"",w.type==="race"?"race":"",w.moved?"moved":"",w.suggestSkip?"skip":""].join(" ");
    let weatherHtml="";
    if(weather){
      const windowHtml=window&&window.hasHourly?(window.available?`<div class="hourly-window weather-advice good">✅ 지금 이후 러닝 가능 구간: ${window.start}~${window.end} · 오늘 일정 유지/복귀 가능</div>`:`<div class="hourly-window weather-advice danger">⛔ 지금 이후 필요한 연속 러닝 구간을 찾지 못함 · AUTO ON이면 이동 대상</div>`):"";
      weatherHtml=`<div class="weather"><div class="weather-line">${weatherText(weather.code)} · ${weather.min}~${weather.max}℃ · 하루 최대 비 ${weather.precipitation}% · 바람 ${Math.round(weather.wind)}km/h</div><div class="weather-advice ${advice.level}">${advice.text}</div>${windowHtml}</div>`;
    }else weatherHtml=`<div class="weather"><div class="weather-line">🌤 예보 대기</div><div class="weather-advice">${advice.text}</div></div>`;
    const moveHtml=w.moved?`<div class="move-banner">🔄 ${getMonthDay(w.date)} → ${getMonthDay(shownDate)} 이동 · ${w.moveReason}</div>`:"";
    const manualHtml=manual?`<div class="manual-banner">${deferLabel(manual.reason)} · ${getMonthDay(manual.notBefore)} 이후 가능한 날로 재배치</div>`:"";
    const warningHtml=w.scheduleWarning?`<div class="warning-banner">⚠️ ${w.scheduleWarning}</div>`:"";
    const pace=calculatePace(w.date);
    const deferButtons=isRunningWorkout(w)&&!done?`<div class="defer-actions"><button class="mini-btn sick" onclick="deferWorkout('${w.date}','${shownDate}','sick')">🤒 몸상태로 미루기</button><button class="mini-btn schedule" onclick="deferWorkout('${w.date}','${shownDate}','schedule')">📅 일정으로 미루기</button><button class="mini-btn custom" onclick="deferWorkout('${w.date}','${shownDate}','custom')">📌 날짜 지정</button>${manual?`<button class="mini-btn cancel" onclick="clearDefer('${w.date}')">↩ 미루기 취소</button>`:""}</div>`:"";
    html+=`<article class="${classes}" id="day-${w.date}"><div class="workout-top"><div class="date-box"><div class="monthday">${getMonthDay(shownDate)}</div><div class="weekday">${getWeekday(shownDate)}</div>${w.moved?`<div class="original-date">원래 ${getMonthDay(w.date)}</div>`:""}</div><div class="workout-main"><div class="workout-title">${w.title}</div><div class="chips"><span class="chip ${w.type}">${typeLabel(w)}</span>${shownDate===today?'<span class="chip">TODAY</span>':""}${w.moved?'<span class="chip moved">MOVED</span>':""}${manual?'<span class="chip manual">MANUAL</span>':""}${locked?'<span class="chip locked">LOCKED</span>':""}${w.suggestSkip?'<span class="chip skip">SKIP 권장</span>':""}</div><div class="workout-desc">${w.desc}</div></div></div>${manualHtml}${moveHtml}${warningHtml}${weatherHtml}<div class="complete-row"><label class="check-wrap"><input type="checkbox" ${done?"checked":""} onchange="setDone('${w.date}','${shownDate}',this.checked)"><span>훈련 완료</span></label>${isRunningWorkout(w)&&!done?`<label class="lock-wrap"><input type="checkbox" ${locked?"checked":""} onchange="setLocked('${w.date}','${shownDate}',this.checked)"><span>🔒 날짜 고정</span></label>`:""}</div>${deferButtons}<details><summary>운동 기록 입력</summary><div class="record-grid">${recordField(w.date,"거리 (km)",STORAGE_KEYS.dist,"예: 5.00","number")}${recordField(w.date,"시간",STORAGE_KEYS.time,"예: 35:10")}${recordField(w.date,"RPE (1~10)",STORAGE_KEYS.rpe,"예: 5","number")}${recordField(w.date,"체중 (kg)",STORAGE_KEYS.weight,"선택","number")}${recordField(w.date,"통증 (0~10)",STORAGE_KEYS.pain,"예: 0","number")}<div class="field"><label>평균 페이스</label><input id="pace-${w.date}" value="${pace}" placeholder="자동 계산" disabled></div><div class="field record-note"><label>메모</label><textarea placeholder="신발, 무릎 상태, 날씨, 심박, 케이던스 등" oninput="writeStorage('${STORAGE_KEYS.note}','${w.date}',this.value)">${escapeHtml(readStorage(STORAGE_KEYS.note,w.date))}</textarea></div></div></details></article>`;
  });
  container.innerHTML=html;updateSummary();updateAutoUI();
}
function refreshPace(date){const el=document.getElementById(`pace-${date}`);if(el)el.value=calculatePace(date)}
function updateSummary(){const days=dayDiff(koreaToday(),RACE_DATE);document.getElementById("dday").textContent=days>=0?`D-${days}`:"완료";const done=workouts.filter(w=>isDone(w.date)).length;document.getElementById("doneCount").textContent=`${done}/${workouts.length}`}
function updateAutoUI(){const enabled=autoEnabled(),button=document.getElementById("autoToggle"),label=document.getElementById("autoLabel");if(!button||!label)return;button.textContent=enabled?"AUTO ON":"AUTO OFF";button.className=`btn ${enabled?"on":"off"}`;label.textContent=enabled?"날씨 자동 재배치 활성화":"날씨 자동 재배치 OFF · 수동 미루기는 유지"}
function exportData(){const data={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key&&key.startsWith("run58_"))data[key]=localStorage.getItem(key)}const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="style-run-training-backup.json";a.click();URL.revokeObjectURL(url)}
function restoreData(event){const file=event.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const data=JSON.parse(reader.result);Object.entries(data).forEach(([key,value])=>{if(key.startsWith("run58_"))localStorage.setItem(key,value)});alert("기록을 복원했습니다.");location.reload()}catch(e){alert("백업 파일을 읽을 수 없습니다.")}};reader.readAsText(file)}

function refreshWeatherOnResume(){if(Date.now()-lastWeatherLoadAt<5*60*1000)return;loadWeather(false)}
document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshWeatherOnResume()});
window.addEventListener("focus",refreshWeatherOnResume);
setInterval(()=>{if(!document.hidden)loadWeather(false)},30*60*1000);

renderSchedule();
loadWeather(false);
