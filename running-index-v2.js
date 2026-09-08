(() => {
  const MOVE_BELOW = 40;
  const NORMAL_MIN = 60;
  const THUNDER_CODES = new Set([95, 96, 99]);
  const STRONG_RAIN_CODES = new Set([65, 67, 82]);

  function injectStyles() {
    if (document.getElementById("running-index-style")) return;
    const style = document.createElement("style");
    style.id = "running-index-style";
    style.textContent = `
      .run-index-panel{overflow:hidden}.run-index-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
      .run-index-main{display:grid;grid-template-columns:116px 1fr;gap:14px;align-items:center;margin-top:10px}
      .run-index-score{width:116px;height:116px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0b1220;border:7px solid #334155;box-shadow:inset 0 0 0 1px rgba(255,255,255,.03)}
      .run-index-score strong{font-size:38px;line-height:1;font-weight:950}.run-index-score span{margin-top:5px;font-size:11px;color:var(--sub);font-weight:800}
      .run-index-score.excellent{border-color:#22c55e}.run-index-score.good{border-color:#4ade80}.run-index-score.normal{border-color:#facc15}.run-index-score.caution{border-color:#fb923c}.run-index-score.bad{border-color:#fb7185}
      .run-index-label{font-size:22px;font-weight:950}.run-index-best{margin-top:5px;color:#dbeafe;font-size:14px;font-weight:850}.run-index-meta{margin-top:8px;color:var(--sub);font-size:12px;line-height:1.65}
      .run-index-hour-title{margin-top:15px;font-size:12px;color:var(--sub);font-weight:850}.run-index-hours{display:flex;gap:7px;overflow-x:auto;padding:8px 0 3px;scrollbar-width:none}.run-index-hours::-webkit-scrollbar{display:none}
      .run-index-hour{min-width:78px;background:#0b1220;border:1px solid #263247;border-radius:13px;padding:9px 8px;text-align:center}.run-index-hour .time{font-size:11px;color:var(--sub)}.run-index-hour .score{font-size:20px;font-weight:950;margin-top:2px}.run-index-hour .temp{font-size:10px;color:#cbd5e1;margin-top:2px}
      .run-index-hour.excellent,.run-index-hour.good{border-color:#166534}.run-index-hour.normal{border-color:#854d0e}.run-index-hour.caution{border-color:#9a3412}.run-index-hour.bad{border-color:#9f1239}
      .run-index-note{margin-top:11px;padding:9px 10px;border-radius:11px;background:#0b1220;color:#94a3b8;font-size:11px;line-height:1.6}.run-index-error{color:#fda4af;font-size:13px;padding:6px 0}
      @media(max-width:460px){.run-index-main{grid-template-columns:94px 1fr}.run-index-score{width:94px;height:94px;border-width:6px}.run-index-score strong{font-size:31px}.run-index-label{font-size:19px}}
    `;
    document.head.appendChild(style);
  }

  function injectPanel() {
    if (document.getElementById("runningIndexPanel")) return;
    const panels = document.querySelectorAll(".panel");
    if (!panels.length) return;
    const panel = document.createElement("section");
    panel.className = "panel run-index-panel";
    panel.id = "runningIndexPanel";
    panel.innerHTML = `<div class="run-index-head"><div class="panel-title" style="margin:0">🏃 오늘 러닝 지수</div><button class="btn" id="runningIndexRefresh" type="button">지수 새로고침</button></div><div id="runningIndexBody"><div class="weather-desc" style="margin-top:9px">Cloudflare 서버의 러닝 지수를 확인하는 중...</div></div>`;
    panels[0].insertAdjacentElement("afterend", panel);
    document.getElementById("runningIndexRefresh")?.addEventListener("click", () => refreshRunningIndex(true));
  }

  function scoreClass(score){if(score>=90)return"excellent";if(score>=75)return"good";if(score>=60)return"normal";if(score>=40)return"caution";return"bad"}
  function scoreLabel(score){if(score>=90)return"최고";if(score>=75)return"좋음";if(score>=60)return"보통";if(score>=40)return"주의";return"비추천"}
  function avg(values){const valid=values.filter(Number.isFinite);return valid.length?valid.reduce((a,b)=>a+b,0)/valid.length:null}
  function hourText(local){if(!local)return"";return local.slice(11,16)}

  function scheduledWorkout() {
    try {
      const today = koreaToday();
      return buildAdaptiveSchedule().find(w => isRunningWorkout(w) && !isDone(w.date) && (w.effectiveDate || w.date) === today) || null;
    } catch (_) { return null; }
  }

  function fallbackAssessment(rows, required) {
    function ok(row,min){return !hourlyBad(row)&&(row.runningIndex??0)>=min}
    function best(min){let result=null;for(let i=0;i<=rows.length-required;i++){const slice=rows.slice(i,i+required);if(!slice.every((row,j)=>(!j||row.hour===slice[j-1].hour+1)&&ok(row,min)))continue;const score=Math.round(slice.reduce((sum,row)=>sum+(row.runningIndex||0),0)/slice.length);if(!result||score>result.bestScore)result={canRun:true,mode:min===NORMAL_MIN?"normal":"reduced",bestScore:score,safeWindow:{start:slice[0].time,end:`${slice[slice.length-1].time.slice(0,11)}${String(slice[slice.length-1].hour+1).padStart(2,"0")}:00`,rows:slice}}}return result}
    return best(NORMAL_MIN)||best(MOVE_BELOW)||{canRun:false,mode:"move",bestScore:rows.length?Math.max(...rows.map(r=>r.runningIndex||0)):null,safeWindow:null};
  }

  async function fetchState(force=false) {
    const response = await fetch(`${WORKER_API_BASE}/api/weather${force?"?refresh=1":""}`, { cache:"no-store", headers:{Accept:"application/json"} });
    if (!response.ok) throw new Error(`worker ${response.status}`);
    return response.json();
  }

  function renderState(state) {
    const body=document.getElementById("runningIndexBody");if(!body)return;
    const workout=scheduledWorkout(),key=workout?.type==="easy"?"easy":"hard",required=key==="easy"?1:2;
    const rows=(state?.today?.remainingHours||[]).map(row=>({...row,hour:Number(String(row.time).slice(11,13)),runningIndex:Number.isFinite(row.runningIndex)?row.runningIndex:0}));
    const assessment=state?.today?.runningIndex?.[key]||state?.today?.[key]||fallbackAssessment(rows,required);
    const score=assessment?.bestScore??(rows.length?Math.max(...rows.map(r=>r.runningIndex)):0),mode=assessment?.mode||(score>=NORMAL_MIN?"normal":score>=MOVE_BELOW?"reduced":"move"),window=assessment?.safeWindow;
    const representative=window?.rows?.length?window.rows:(rows.slice(0,Math.max(1,required)));
    const apparent=avg(representative.map(r=>r.apparent??r.temperature)),humidity=avg(representative.map(r=>r.humidity)),rainChance=representative.length?Math.max(...representative.map(r=>r.precipitationProbability||0)):0,wind=avg(representative.map(r=>r.wind));
    const bestText=window?`${hourText(window.start)}~${hourText(window.end)}`:"오늘 적정 구간 없음";
    const policyText=mode==="normal"?"정상 훈련 가능":mode==="reduced"?"일정 유지 · 거리/페이스 완화":"AUTO ON이면 다음 적절한 날로 이동";
    const hourly=rows.slice(0,9).map(row=>`<div class="run-index-hour ${scoreClass(row.runningIndex)}"><div class="time">${String(row.hour).padStart(2,"0")}:00</div><div class="score">${row.runningIndex}</div><div class="temp">체감 ${Math.round(row.apparent??row.temperature)}℃</div></div>`).join("");
    body.innerHTML=`<div class="run-index-main"><div class="run-index-score ${scoreClass(score)}"><strong>${score}</strong><span>/ 100</span></div><div><div class="run-index-label">${scoreLabel(score)} · ${policyText}</div><div class="run-index-best">⭐ ${bestText}${workout?` · ${workout.type.toUpperCase()} 기준`:""}</div><div class="run-index-meta">체감 ${apparent==null?"-":`${Math.round(apparent)}℃`} · 습도 ${humidity==null?"-":`${Math.round(humidity)}%`} · 비 ${Math.round(rainChance)}% · 바람 ${wind==null?"-":`${Math.round(wind)}km/h`}</div></div></div><div class="run-index-hour-title">시간대별 지수 · 서버가 30분마다 갱신</div><div class="run-index-hours">${hourly||'<div class="run-index-error">오늘 남은 시간 예보가 없습니다.</div>'}</div><div class="run-index-note">자체 러닝 지수: <strong>60+</strong> 정상 · <strong>40~59</strong> 일정 유지/강도 완화 · <strong>40 미만</strong> 남은 적정 구간이 없으면 자동 이동. 뇌우·강한 비 등 안전 조건은 별도로 제외합니다. <strong>의사의 운동 제한과 몸 상태가 항상 우선</strong>입니다.</div>`;
  }

  async function refreshRunningIndex(force=false){const body=document.getElementById("runningIndexBody");if(body&&force)body.innerHTML='<div class="weather-desc" style="margin-top:9px">서버 예보와 자동 일정을 다시 계산하는 중...</div>';try{renderState(await fetchState(force))}catch(error){console.warn("Running index state failed",error);if(body)body.innerHTML='<div class="run-index-error">러닝 지수를 불러오지 못했습니다. 날씨 자동 일정의 저장 예보를 확인해 주세요.</div>'}}

  window.refreshRunningIndex=refreshRunningIndex;
  injectStyles();injectPanel();refreshRunningIndex(false);
  setInterval(()=>{if(!document.hidden)refreshRunningIndex(false)},30*60*1000);
})();
