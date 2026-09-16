(() => {
  // RUN58 coach override: recovery wait + 2026-09-16 ~ 2026-10-31 schedule.
  // Pain/fatigue misses are not pushed back. 10/18 STYLE RUN stays fixed.
  const adjustments = {
    "2026-09-16": {type:"easy",title:"🩹 회복 대기 · Easy 4.5km 취소",desc:"현재 발날 통증으로 러닝 취소\n빠진 4.5km는 뒤로 밀어 보충하지 않기\n정상 보행·계단에서 통증이 없고 붓기·국소 압통이 없을 때만 복귀 판단"},
    "2026-09-17": {type:"rest",title:"🩹 회복 대기",desc:"러닝 없음\n발 상태 확인\n통증이 남아 있으면 계속 회복 대기"},
    "2026-09-18": {type:"rest",title:"약속 · 완전 휴식",desc:"러닝 없음\n약속 일정 우선\n수분과 수면 챙기기"},
    "2026-09-19": {type:"rest",title:"🩹 회복 상태 확인",desc:"러닝을 자동 재개하지 않음\n걷기에서 통증이 남으면 회복 대기 유지\n밀린 훈련 보충 금지"},
    "2026-09-20": {type:"rest",title:"회복 · 가벼운 걷기",desc:"통증이 없을 때만 30~45분 편한 걷기\n통증이 있으면 걷기도 생략"},
    "2026-09-21": {type:"easy",title:"복귀 Easy 3km",desc:"회복 완료 조건을 충족했을 때만 실시\n3km @ 7:20~7:40/km\nRPE 3 이하\n발 통증이 다시 나타나면 즉시 종료하고 회복 대기"},
    "2026-09-23": {type:"easy",title:"Easy 4.5km",desc:"4.5km @ 7:15~7:35/km\n대화 가능한 강도 · RPE 3~4\n마지막 가속 금지"},
    "2026-09-25": {type:"quality",title:"1km × 3 · 10K 페이스 접근",desc:"1.5km Easy 워밍업\n1km @ 6:05~6:15/km × 3\n세트 사이 3분 걷기/느린 조깅\n1km Cooldown\n통증이 완전히 사라진 상태에서만 실시"},
    "2026-09-27": {type:"long",title:"Long Easy 7km",desc:"7km @ 7:15~7:40/km\n대화 가능한 강도 · RPE 4 이하\n기록 도전·마지막 가속 금지"},
    "2026-09-29": {type:"easy",title:"Easy 4.5km",desc:"4.5km @ 7:15~7:35/km\nRPE 3~4\n회복 목적"},
    "2026-10-02": {type:"quality",title:"⭐ 5km 기록 테스트",desc:"1.5km Easy 워밍업 + 가벼운 가속 2회\n5km 기록 테스트\n초반 과속 금지\n기록뿐 아니라 후반 유지·RPE·통증 여부까지 함께 평가\n1km Cooldown"},
    "2026-10-04": {type:"easy",title:"Recovery Easy 4km",desc:"4km @ 7:30~7:50/km\nRPE 2~3\n5km 테스트 피로 제거"},
    "2026-10-06": {type:"long",title:"Long Easy 8.5km",desc:"8.5km @ 7:15~7:40/km\n대화 가능한 강도 · RPE 4 이하\n기록 도전 금지"},
    "2026-10-08": {type:"easy",title:"Easy 4.5km",desc:"4.5km @ 7:15~7:35/km\nRPE 3~4\n다리를 가볍게 유지"},
    "2026-10-10": {type:"quality",title:"⭐ Goal Pace 1km × 4",desc:"1.5km Easy 워밍업\n1km @ 5:58~6:05/km × 4\n세트 사이 3분 느린 조깅/걷기\n1km Cooldown\n4세트 모두 비슷한 페이스가 목표"},
    "2026-10-12": {type:"easy",title:"Easy 5km · 테이퍼",desc:"5km @ 7:15~7:35/km\n대화 가능한 강도 · RPE 3~4\n거리 욕심 금지"},
    "2026-10-14": {type:"easy",title:"Easy 4km + Strides",desc:"Easy 4km @ 7:20~7:40/km\n20초 가속주 × 3\n가속주 사이 75초 완전 회복\n전력질주 금지"},
    "2026-10-15": {type:"quality",title:"Race Pace 자극 · 짧게",desc:"Easy 20분\n1분 @ 5:58~6:05/km × 3\n사이 2분 Easy\n피로를 남기지 않고 페이스 감각만 확인"},
    "2026-10-16": {type:"rest",title:"완전 휴식",desc:"러닝 금지\n수면·수분·평소 식사 유지\n새 운동과 강한 스트레칭 금지"},
    "2026-10-17": {type:"rest",title:"대회 전날",desc:"완전 휴식 또는 20분 가벼운 산책\n새 음식·새 장비 금지\n신발·복장·번호표 준비"},
    "2026-10-18": {type:"race",title:"🏁 STYLE RUN 10K · SUB 60",desc:"목표 59:59 이내\n\n0~2km : 6:03~6:07/km\n2~5km : 5:58~6:02/km\n5~8km : 5:58~6:00/km\n8~10km : 상태가 좋으면 점진 가속\n\n5km 통과 목표 약 30:00\n초반에 시간을 저축하려 하지 않기"},
    "2026-10-19": {type:"rest",title:"대회 다음날 · 완전 휴식",desc:"러닝 없음\n가벼운 일상 활동만\n통증 여부 확인"},
    "2026-10-20": {type:"rest",title:"Recovery · 걷기 30~45분",desc:"편한 걷기 30~45분\nRPE 1~2\n통증이 있으면 생략"},
    "2026-10-21": {type:"easy",title:"Recovery Easy 4km",desc:"4km @ 7:20~7:50/km\nRPE 2~3\n대회 후 첫 러닝 · 기록 욕심 금지"},
    "2026-10-23": {type:"easy",title:"Easy 5km",desc:"5km @ 7:10~7:35/km\n대화 가능한 강도 · RPE 3~4"},
    "2026-10-25": {type:"long",title:"Long Easy 7km",desc:"7km @ 7:10~7:35/km\nRPE 4 이하\n마지막 가속 금지"},
    "2026-10-27": {type:"easy",title:"Easy 5km + Strides",desc:"Easy 5km @ 7:10~7:35/km\n20초 가속주 × 4\n가속주 사이 75초 걷기/조깅\n전력질주 금지"},
    "2026-10-29": {type:"quality",title:"Tempo 3km",desc:"1.5km Easy 워밍업\n3km @ 6:15~6:25/km\n1km Cooldown\n대회 후 첫 Quality · 여유를 남기기"},
    "2026-10-31": {type:"long",title:"Long Easy 8km",desc:"8km @ 7:10~7:35/km\nRPE 4 이하\n10월 마무리 · 기록 도전 금지"}
  };

  const plannedDates=new Set(Object.keys(adjustments));
  for(let i=workouts.length-1;i>=0;i--){const w=workouts[i];if(w.date>="2026-09-16"&&w.date<="2026-10-31"&&!plannedDates.has(w.date))workouts.splice(i,1)}
  Object.entries(adjustments).forEach(([date,a])=>{const w=workouts.find(x=>x.date===date);if(w)Object.assign(w,a);else workouts.push({date,...a})});
  workouts.sort((a,b)=>a.date.localeCompare(b.date));

  const RECOVERY_KEY="run58_recovery_wait_v1";
  const originalDeferWorkout=window.deferWorkout;
  const originalRenderSchedule=window.renderSchedule;
  let initialTodayPositioned=false;
  function recoveryState(){try{return JSON.parse(localStorage.getItem(RECOVERY_KEY)||"null")}catch(e){return null}}
  function startRecovery(baseDate){
    const today=koreaToday();
    localStorage.setItem(RECOVERY_KEY,JSON.stringify({active:true,startDate:today<baseDate?today:baseDate,createdAt:new Date().toISOString()}));
    localStorage.removeItem(DEFER_KEY+baseDate);localStorage.removeItem(LOCK_KEY+baseDate);localStorage.removeItem(LOCK_DATE_KEY+baseDate);
    renderSchedule();
  }
  window.finishRecovery=function(){localStorage.removeItem(RECOVERY_KEY);renderSchedule()};
  window.deferWorkout=function(baseDate,effectiveDate,reason){if(reason==="sick"){startRecovery(baseDate);return}return originalDeferWorkout(baseDate,effectiveDate,reason)};

  function positionTodayAtTop(){
    if(initialTodayPositioned)return;
    const schedule=document.getElementById("schedule");if(!schedule)return;
    const today=koreaToday();
    const todayCard=document.getElementById("day-"+today)||schedule.querySelector(".workout.today");
    if(!todayCard)return;
    initialTodayPositioned=true;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const top=todayCard.getBoundingClientRect().top+window.scrollY-12;
      window.scrollTo({top:Math.max(0,top),behavior:"auto"});
    }));
  }

  function decorateRecoveryUI(){
    document.querySelectorAll(".mini-btn.sick").forEach(btn=>{btn.textContent="🩹 회복 대기";btn.title="통증·부상·심한 피로 시 훈련을 뒤로 밀지 않고 회복 대기로 전환"});
    const schedule=document.getElementById("schedule");if(!schedule)return;
    const state=recoveryState();let panel=document.getElementById("recoveryWaitPanel");
    if(state?.active){
      if(!panel){panel=document.createElement("section");panel.id="recoveryWaitPanel";panel.className="panel";schedule.parentNode.insertBefore(panel,schedule)}
      panel.innerHTML='<div class="panel-title">🩹 회복 대기 중</div><div class="legend">통증·부상·심한 피로로 러닝을 일시 중지했습니다.<br>밀린 훈련은 뒤로 보내지 않습니다. 회복 후에는 그날 이후 예정된 일정부터 이어갑니다.</div><div style="margin-top:10px"><button class="btn on" onclick="finishRecovery()">✅ 회복 완료 · 일정 복귀</button></div>';
      document.querySelectorAll(".workout").forEach(card=>{
        if(card.classList.contains("race")||card.classList.contains("completed"))return;
        const id=card.id||"",date=id.startsWith("day-")?id.slice(4):"";if(!date||date<state.startDate)return;
        const check=card.querySelector('.check-wrap input[type="checkbox"]');if(check)check.disabled=true;
        card.querySelectorAll(".defer-actions button,.lock-wrap input").forEach(el=>el.disabled=true);
        if(!card.querySelector(".recovery-wait-banner")){const b=document.createElement("div");b.className="warning-banner recovery-wait-banner";b.textContent="🩹 회복 대기 중 · 이 훈련은 지금 수행하거나 보충하지 않습니다.";const top=card.querySelector(".workout-top");if(top)top.insertAdjacentElement("afterend",b)}
      });
    }else if(panel)panel.remove();
    positionTodayAtTop();
  }
  window.renderSchedule=function(){const r=originalRenderSchedule();queueMicrotask(decorateRecoveryUI);return r};
  renderSchedule();decorateRecoveryUI();
})();