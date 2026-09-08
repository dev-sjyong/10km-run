(() => {
  const INDEX_LAT = 37.2636;
  const INDEX_LON = 127.0286;
  const INDEX_CACHE_KEY = "run58_running_index_cache_v1";
  const INDEX_CACHE_MS = 20 * 60 * 1000;
  const THUNDER_CODES = new Set([95, 96, 99]);
  const STRONG_RAIN_CODES = new Set([65, 67, 82]);

  function injectStyles() {
    if (document.getElementById("running-index-style")) return;
    const style = document.createElement("style");
    style.id = "running-index-style";
    style.textContent = `
      .run-index-panel{overflow:hidden}
      .run-index-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
      .run-index-main{display:grid;grid-template-columns:116px 1fr;gap:14px;align-items:center;margin-top:10px}
      .run-index-score{width:116px;height:116px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0b1220;border:7px solid #334155;box-shadow:inset 0 0 0 1px rgba(255,255,255,.03)}
      .run-index-score strong{font-size:38px;line-height:1;font-weight:950}.run-index-score span{margin-top:5px;font-size:11px;color:var(--sub);font-weight:800}
      .run-index-score.excellent{border-color:#22c55e}.run-index-score.good{border-color:#4ade80}.run-index-score.normal{border-color:#facc15}.run-index-score.caution{border-color:#fb923c}.run-index-score.bad{border-color:#fb7185}
      .run-index-label{font-size:22px;font-weight:950}.run-index-best{margin-top:5px;color:#dbeafe;font-size:14px;font-weight:850}.run-index-meta{margin-top:8px;color:var(--sub);font-size:12px;line-height:1.65}
      .run-index-hour-title{margin-top:15px;font-size:12px;color:var(--sub);font-weight:850}
      .run-index-hours{display:flex;gap:7px;overflow-x:auto;padding:8px 0 3px;scrollbar-width:none}.run-index-hours::-webkit-scrollbar{display:none}
      .run-index-hour{min-width:78px;background:#0b1220;border:1px solid #263247;border-radius:13px;padding:9px 8px;text-align:center}
      .run-index-hour .time{font-size:11px;color:var(--sub)}.run-index-hour .score{font-size:20px;font-weight:950;margin-top:2px}.run-index-hour .temp{font-size:10px;color:#cbd5e1;margin-top:2px}
      .run-index-hour.excellent,.run-index-hour.good{border-color:#166534}.run-index-hour.normal{border-color:#854d0e}.run-index-hour.caution{border-color:#9a3412}.run-index-hour.bad{border-color:#9f1239}
      .run-index-note{margin-top:11px;padding:9px 10px;border-radius:11px;background:#0b1220;color:#94a3b8;font-size:11px;line-height:1.6}
      .run-index-error{color:#fda4af;font-size:13px;padding:6px 0}
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
    panel.innerHTML = `
      <div class="run-index-head">
        <div class="panel-title" style="margin:0">🏃 오늘 러닝 지수</div>
        <button class="btn" id="runningIndexRefresh" type="button">지수 새로고침</button>
      </div>
      <div id="runningIndexBody"><div class="weather-desc" style="margin-top:9px">수원 시간별 날씨로 러닝 지수를 계산하는 중...</div></div>
    `;
    panels[0].insertAdjacentElement("afterend", panel);
    document.getElementById("runningIndexRefresh")?.addEventListener("click", () => refreshRunningIndex(true));
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  function scoreClass(score) {
    if (score >= 90) return "excellent";
    if (score >= 75) return "good";
    if (score >= 60) return "normal";
    if (score >= 40) return "caution";
    return "bad";
  }

  function scoreLabel(score) {
    if (score >= 90) return "최고";
    if (score >= 75) return "좋음";
    if (score >= 60) return "보통";
    if (score >= 40) return "주의";
    return "비추천";
  }

  function scoreAdvice(score) {
    if (score >= 90) return "러닝하기 아주 좋은 조건입니다.";
    if (score >= 75) return "편하게 달리기 좋은 조건입니다.";
    if (score >= 60) return "러닝 가능. 페이스보다 체감강도를 우선하세요.";
    if (score >= 40) return "더위·습도·비·바람 부담이 있습니다. 거리나 페이스를 줄이세요.";
    return "실외 러닝을 권하지 않는 조건입니다.";
  }

  function weatherPenalty(row) {
    let score = 100;
    const feels = Number.isFinite(row.apparent) ? row.apparent : row.temperature;
    const humidity = row.humidity;
    const rainChance = row.precipitationProbability || 0;
    const rain = row.precipitation || 0;
    const wind = row.wind || 0;

    // 러닝에 가장 편한 체감온도를 대략 5~18℃로 두고 양쪽으로 감점.
    if (feels < -5) score -= 45;
    else if (feels < 0) score -= 30;
    else if (feels < 5) score -= 12;
    else if (feels <= 18) score -= 0;
    else if (feels <= 22) score -= (feels - 18) * 1.5;
    else if (feels <= 26) score -= 6 + (feels - 22) * 3;
    else if (feels <= 30) score -= 18 + (feels - 26) * 5;
    else score -= 38 + (feels - 30) * 7;

    // 더운 환경에서 높은 습도는 체열 방출을 어렵게 하므로 추가 감점.
    if (Number.isFinite(humidity) && feels >= 18 && humidity > 65) {
      score -= Math.min(18, (humidity - 65) * 0.55);
    }

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

  function koreaNow() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false
    }).formatToParts(new Date());
    const get = type => parts.find(p => p.type === type)?.value || "00";
    let hour = Number(get("hour"));
    if (hour === 24) hour = 0;
    return { date: `${get("year")}-${get("month")}-${get("day")}`, hour, minute: Number(get("minute")) };
  }

  function parseForecast(data) {
    const rows = [];
    const h = data.hourly || {};
    (h.time || []).forEach((time, i) => {
      rows.push({
        time,
        date: time.slice(0, 10),
        hour: Number(time.slice(11, 13)),
        code: h.weather_code?.[i] ?? 0,
        temperature: h.temperature_2m?.[i] ?? 0,
        apparent: h.apparent_temperature?.[i],
        humidity: h.relative_humidity_2m?.[i],
        precipitationProbability: h.precipitation_probability?.[i] ?? 0,
        precipitation: h.precipitation?.[i] ?? 0,
        wind: h.wind_speed_10m?.[i] ?? 0
      });
    });
    return rows;
  }

  async function fetchIndexWeather(force = false) {
    if (!force) {
      try {
        const cached = JSON.parse(localStorage.getItem(INDEX_CACHE_KEY) || "null");
        if (cached?.savedAt && Date.now() - cached.savedAt < INDEX_CACHE_MS && Array.isArray(cached.rows)) return cached.rows;
      } catch (_) {}
    }

    const params = new URLSearchParams({
      latitude: String(INDEX_LAT), longitude: String(INDEX_LON), timezone: "Asia/Seoul", forecast_days: "3",
      hourly: ["weather_code", "temperature_2m", "apparent_temperature", "relative_humidity_2m", "precipitation_probability", "precipitation", "wind_speed_10m"].join(",")
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);
    const rows = parseForecast(await response.json());
    localStorage.setItem(INDEX_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), rows }));
    return rows;
  }

  function fallbackRows() {
    try {
      const today = typeof koreaToday === "function" ? koreaToday() : koreaNow().date;
      const rows = (hourlyWeatherMap?.[today] || []).map(r => ({
        time: r.time || `${today}T${String(r.hour).padStart(2, "0")}:00`,
        date: today, hour: r.hour, code: r.code, temperature: r.temperature,
        apparent: r.temperature, humidity: null,
        precipitationProbability: r.precipitationProbability || 0,
        precipitation: r.precipitation || 0, wind: r.wind || 0
      }));
      return rows;
    } catch (_) { return []; }
  }

  function bestWindow(rows, requiredHours = 2) {
    let best = null;
    for (let i = 0; i <= rows.length - requiredHours; i++) {
      const slice = rows.slice(i, i + requiredHours);
      const consecutive = slice.every((row, j) => j === 0 || row.hour === slice[j - 1].hour + 1);
      if (!consecutive) continue;
      const avg = Math.round(slice.reduce((sum, row) => sum + row.score, 0) / slice.length);
      if (!best || avg > best.score) best = { score: avg, start: slice[0].hour, end: slice[slice.length - 1].hour + 1, rows: slice };
    }
    return best;
  }

  function avg(values) {
    const valid = values.filter(Number.isFinite);
    return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
  }

  function renderIndex(rawRows) {
    const body = document.getElementById("runningIndexBody");
    if (!body) return;
    const now = koreaNow();
    let todayRows = rawRows
      .filter(r => r.date === now.date && r.hour >= now.hour && r.hour <= 22)
      .map(r => ({ ...r, score: weatherPenalty(r) }));

    if (!todayRows.length) {
      body.innerHTML = `<div class="run-index-error">오늘 남은 시간의 시간별 예보가 없습니다.</div>`;
      return;
    }

    const best = bestWindow(todayRows, Math.min(2, todayRows.length));
    const mainScore = best?.score ?? todayRows[0].score;
    const mainClass = scoreClass(mainScore);
    const representative = best?.rows || [todayRows[0]];
    const apparent = avg(representative.map(r => r.apparent));
    const humidity = avg(representative.map(r => r.humidity));
    const rainChance = Math.max(...representative.map(r => r.precipitationProbability || 0));
    const wind = avg(representative.map(r => r.wind));
    const bestText = best ? `${String(best.start).padStart(2, "0")}:00~${String(best.end).padStart(2, "0")}:00` : "현재 시간대";

    const hourly = todayRows.slice(0, 9).map(row => `
      <div class="run-index-hour ${scoreClass(row.score)}">
        <div class="time">${String(row.hour).padStart(2, "0")}:00</div>
        <div class="score">${row.score}</div>
        <div class="temp">체감 ${Math.round(Number.isFinite(row.apparent) ? row.apparent : row.temperature)}℃</div>
      </div>`).join("");

    body.innerHTML = `
      <div class="run-index-main">
        <div class="run-index-score ${mainClass}"><strong>${mainScore}</strong><span>/ 100</span></div>
        <div>
          <div class="run-index-label">${scoreLabel(mainScore)} · ${scoreAdvice(mainScore)}</div>
          <div class="run-index-best">⭐ 오늘 추천 시간 ${bestText}</div>
          <div class="run-index-meta">체감 ${apparent == null ? "-" : `${Math.round(apparent)}℃`} · 습도 ${humidity == null ? "-" : `${Math.round(humidity)}%`} · 비 ${Math.round(rainChance)}% · 바람 ${wind == null ? "-" : `${Math.round(wind)}km/h`}</div>
        </div>
      </div>
      <div class="run-index-hour-title">시간대별 지수 · 지금부터</div>
      <div class="run-index-hours">${hourly}</div>
      <div class="run-index-note">자체 러닝 지수입니다. Open-Meteo의 체감온도·습도·강수·바람·뇌우를 0~100점으로 환산하며 웨더뉴스의 공식 지수가 아닙니다. <strong>날씨가 좋아도 통증·질환·의사의 운동 제한이 있으면 몸 상태와 의료진 지침이 우선</strong>입니다.</div>
    `;
  }

  async function refreshRunningIndex(force = false) {
    const body = document.getElementById("runningIndexBody");
    if (body && force) body.innerHTML = `<div class="weather-desc" style="margin-top:9px">최신 시간별 예보로 다시 계산하는 중...</div>`;
    try {
      renderIndex(await fetchIndexWeather(force));
    } catch (error) {
      console.warn("Running index weather fetch failed", error);
      const fallback = fallbackRows();
      if (fallback.length) renderIndex(fallback);
      else if (body) body.innerHTML = `<div class="run-index-error">러닝 지수를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>`;
    }
  }

  window.refreshRunningIndex = refreshRunningIndex;
  injectStyles();
  injectPanel();
  refreshRunningIndex(false);
  setInterval(() => { if (!document.hidden) refreshRunningIndex(false); }, 30 * 60 * 1000);
})();
