(() => {
  const MOVE_BELOW = 40;
  const NORMAL_MIN = 60;
  const RUN_END_HOUR = 22;
  const STATE_CACHE_KEY = "run58_running_index_scheduler_state_v1";
  const THUNDER_CODES = new Set([95, 96, 99]);
  const STRONG_RAIN_CODES = new Set([65, 67, 82]);
  let dailyIndexMap = {};

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function scoreRow(row) {
    if (Number.isFinite(row.runningIndex)) return row.runningIndex;
    let score = 100;
    const feels = Number.isFinite(row.apparent) ? row.apparent : row.temperature;
    const humidity = row.humidity;
    const rainChance = row.precipitationProbability || 0;
    const rain = row.precipitation || 0;
    const wind = row.wind || 0;
    if (feels < -5) score -= 45;
    else if (feels < 0) score -= 30;
    else if (feels < 5) score -= 12;
    else if (feels <= 18) score -= 0;
    else if (feels <= 22) score -= (feels - 18) * 1.5;
    else if (feels <= 26) score -= 6 + (feels - 22) * 3;
    else if (feels <= 30) score -= 18 + (feels - 26) * 5;
    else score -= 38 + (feels - 30) * 7;
    if (Number.isFinite(humidity) && feels >= 18 && humidity > 65) score -= Math.min(18, (humidity - 65) * 0.55);
    if (rainChance > 20) score -= Math.min(28, (rainChance - 20) * 0.45);
    if (rain >= 3) score -= 60;
    else if (rain >= 1) score -= 42;
    else if (rain >= 0.5) score -= 28;
    else if (rain >= 0.1) score -= 12;
    if (wind > 15) score -= Math.min(32, (wind - 15) * 1.1);
    if (THUNDER_CODES.has(row.code)) score = Math.min(score, 5);
    else if (STRONG_RAIN_CODES.has(row.code)) score = Math.min(score, 18);
    return Math.round(clamp(score, 0, 100));
  }

  function bestWindow(rows, needed, minScore) {
    let best = null;
    for (let i = 0; i <= rows.length - needed; i++) {
      const slice = rows.slice(i, i + needed);
      const ok = slice.every((row, j) => {
        const previous = j ? slice[j - 1] : null;
        return (!previous || row.hour === previous.hour + 1) && !hourlyBad(row) && scoreRow(row) >= minScore;
      });
      if (!ok) continue;
      const score = Math.round(slice.reduce((sum, row) => sum + scoreRow(row), 0) / slice.length);
      if (!best || score > best.score) best = { score, rows: slice, start: slice[0].hour, end: slice[slice.length - 1].hour + 1 };
    }
    return best;
  }

  function loadCachedState() {
    try {
      const cached = JSON.parse(localStorage.getItem(STATE_CACHE_KEY) || "null");
      if (cached?.savedAt && Date.now() - cached.savedAt < 3 * 60 * 60 * 1000) dailyIndexMap = cached.suwonRunIndex || {};
    } catch (_) {}
  }

  const originalWorkerHoursToMap = workerHoursToMap;
  workerHoursToMap = function (state) {
    const map = originalWorkerHoursToMap(state);
    const today = state?.today;
    if (!today?.date || !Array.isArray(today.remainingHours)) return map;
    map[today.date] = today.remainingHours.map(row => ({
      time: row.time,
      hour: Number(String(row.time).slice(11, 13)),
      code: row.code,
      temperature: row.temperature,
      apparent: row.apparent ?? row.temperature,
      humidity: row.humidity ?? null,
      precipitationProbability: row.precipitationProbability ?? 0,
      precipitation: row.precipitation ?? 0,
      wind: row.wind ?? 0,
      runningIndex: Number.isFinite(row.runningIndex) ? row.runningIndex : undefined
    }));
    return map;
  };

  const originalApplyWorkerState = applyWorkerState;
  applyWorkerState = function (state) {
    dailyIndexMap = state?.suwonRunIndex || {};
    try { localStorage.setItem(STATE_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), suwonRunIndex: dailyIndexMap })); } catch (_) {}
    originalApplyWorkerState(state);
  };

  remainingRunWindow = function (workout, date) {
    if (date !== koreaToday() || !isRunningWorkout(workout)) return null;
    const rows = getHourlyFor(workout, date);
    if (!rows.length) return null;
    const now = koreaNowParts();
    const startHour = now.minute === 0 ? now.hour : now.hour + 1;
    const needed = requiredSafeHours(workout);
    const remaining = rows.filter(row => row.hour >= startHour && row.hour < RUN_END_HOUR);
    if (!remaining.length) return { hasHourly: true, available: false, needed, startHour, mode: "move", bestScore: null };
    const normal = bestWindow(remaining, needed, NORMAL_MIN);
    if (normal) return { hasHourly: true, available: true, needed, mode: "normal", score: normal.score, start: `${String(normal.start).padStart(2, "0")}:00`, end: `${String(normal.end).padStart(2, "0")}:00`, rows: normal.rows };
    const reduced = bestWindow(remaining, needed, MOVE_BELOW);
    if (reduced) return { hasHourly: true, available: true, needed, mode: "reduced", score: reduced.score, start: `${String(reduced.start).padStart(2, "0")}:00`, end: `${String(reduced.end).padStart(2, "0")}:00`, rows: reduced.rows };
    const bestScore = Math.max(...remaining.map(scoreRow));
    return { hasHourly: true, available: false, needed, startHour, mode: "move", bestScore };
  };

  function futureAssessment(workout, date) {
    const key = workout.type === "easy" ? "easy" : "hard";
    return dailyIndexMap?.[date]?.[key] || null;
  }

  weatherBadForDate = function (workout, date) {
    const window = remainingRunWindow(workout, date);
    if (window?.hasHourly) return !window.available;
    const assessment = futureAssessment(workout, date);
    if (assessment) return assessment.canRun === false || assessment.mode === "move";
    return badForOutdoor(getWeatherFor(workout, date));
  };

  const originalCandidateScore = candidateScore;
  candidateScore = function (workout, candidate, startDate, nextAnchor) {
    let score = originalCandidateScore(workout, candidate, startDate, nextAnchor);
    const assessment = futureAssessment(workout, candidate);
    if (!assessment) return score;
    if (assessment.mode === "reduced") {
      if (candidate === workout.date) score -= weatherPenalty(getWeatherFor(workout, candidate));
      else score += 18;
    } else if (assessment.mode === "normal" && Number.isFinite(assessment.bestScore)) {
      score += Math.max(0, (80 - assessment.bestScore) / 5);
    }
    return score;
  };

  function assessmentForShownDate(workout, shownDate) {
    if (shownDate === koreaToday()) return remainingRunWindow(workout, shownDate);
    return futureAssessment(workout, shownDate);
  }

  function decorateSchedule() {
    let adaptive;
    try { adaptive = buildAdaptiveSchedule(); } catch (_) { return; }
    adaptive.forEach(workout => {
      if (!isRunningWorkout(workout) || isDone(workout.date)) return;
      const shownDate = workout.effectiveDate || workout.date;
      const assessment = assessmentForShownDate(workout, shownDate);
      const article = document.getElementById(`day-${workout.date}`);
      if (!article || !assessment) return;
      const mode = assessment.mode;
      const score = assessment.score ?? assessment.bestScore;
      const hourly = article.querySelector(".hourly-window");
      if (shownDate === koreaToday() && hourly) {
        if (mode === "normal") {
          hourly.className = "hourly-window weather-advice good";
          hourly.textContent = `✅ 러닝 지수 ${score ?? 60}+ · ${assessment.start}~${assessment.end} 정상 훈련 가능`;
        } else if (mode === "reduced") {
          hourly.className = "hourly-window weather-advice warning";
          hourly.textContent = `🟠 러닝 지수 ${score ?? "40~59"} · ${assessment.start}~${assessment.end} 일정 유지, 강도 완화`;
        } else {
          hourly.className = "hourly-window weather-advice danger";
          hourly.textContent = `⛔ 오늘 남은 시간 러닝 지수 40 미만 · AUTO ON이면 일정 이동`;
        }
      }
      if (mode === "reduced") {
        const weather = article.querySelector(".weather");
        if (weather && !article.querySelector(".run-index-reduced-banner")) {
          const banner = document.createElement("div");
          banner.className = "manual-banner run-index-reduced-banner";
          banner.innerHTML = `🟠 러닝 지수 ${score ?? "40~59"} · <strong>일정 유지 / 강도 완화</strong><br>거리 10~20% 단축 · 목표 페이스 15~30초/km 완화 · RPE 우선`;
          weather.insertAdjacentElement("beforebegin", banner);
        }
      }
    });
  }

  const originalRenderSchedule = renderSchedule;
  renderSchedule = function () {
    originalRenderSchedule();
    decorateSchedule();
  };

  function addRuleText() {
    const box = document.querySelector(".auto-rules");
    if (!box || document.getElementById("runIndexAutoRule")) return;
    const div = document.createElement("div");
    div.id = "runIndexAutoRule";
    div.style.marginTop = "7px";
    div.innerHTML = "• 🏃 러닝 지수: <strong>60+</strong> 정상 · <strong>40~59</strong> 일정 유지/강도 완화 · <strong>40 미만</strong> 오늘 남은 적정 구간이 없으면 자동 이동";
    box.appendChild(div);
  }

  window.getRunIndexScheduleState = () => ({ moveBelow: MOVE_BELOW, normalMin: NORMAL_MIN, suwonRunIndex: dailyIndexMap });
  loadCachedState();
  addRuleText();
  renderSchedule();
})();
