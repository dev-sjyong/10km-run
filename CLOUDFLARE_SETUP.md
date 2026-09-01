# Cloudflare Worker + Cron + KV 설정

현재 저장소에는 날씨 스케줄러 Worker 코드가 포함되어 있습니다.

## 구성

- `worker/src/index.js`: Open-Meteo 조회, 현재 시각 이후 안전 러닝 구간 계산, KV 저장, API 제공
- `wrangler.jsonc`: Worker, Cron, KV 바인딩 설정
- `package.json`: Wrangler 실행 스크립트

## 1. 의존성 설치

```bash
npm install
```

## 2. Cloudflare 로그인

```bash
npx wrangler login
```

## 3. KV namespace 생성

```bash
npm run cf:kv:create
```

출력되는 KV namespace ID를 `wrangler.jsonc`의 아래 항목에 넣습니다.

```json
{
  "binding": "WEATHER_STATE",
  "id": "REPLACE_WITH_KV_NAMESPACE_ID"
}
```

## 4. 배포

```bash
npm run cf:deploy
```

배포 후 표시되는 Worker URL을 기록합니다.

예:

```text
https://run10k-weather-scheduler.<subdomain>.workers.dev
```

## 5. API 확인

```text
GET /api/health
GET /api/weather
```

`/api/weather` 응답에는 다음 정보가 포함됩니다.

- 서버가 날씨를 확인한 시각
- 오늘 현재 시각 이후 Easy 1시간 안전 구간
- 오늘 현재 시각 이후 QUALITY/LONG 2시간 연속 안전 구간
- 수원 16일 일별 예보
- 잠실/서울 16일 일별 예보

## 오늘 안전 시간 판단 기준

다음 중 하나면 해당 시간은 러닝 불가 시간으로 처리합니다.

- 뇌우 코드 95, 96, 99
- 강한 비 코드 65, 67, 82
- 강수확률 70% 이상
- 시간당 강수량 0.5mm 이상

Easy는 최소 1시간, QUALITY/LONG은 최소 2시간 연속 안전 구간이 있어야 오늘 진행 가능으로 판단합니다.

## Cron

현재 Cron은 30분마다 실행합니다.

```text
*/30 * * * *
```

Cloudflare Cron Trigger는 UTC 기준으로 실행되지만 Worker 내부에서 `Asia/Seoul` 기준으로 오늘 날짜와 현재 시각을 계산합니다.

## 다음 단계

Worker 배포 URL이 확정되면 `index.html`에서 `/api/weather`를 읽도록 연결합니다. 브라우저의 `run58_*` localStorage 기록은 그대로 유지하고 다음 우선순위로 병합합니다.

```text
완료 / 날짜 고정
> 🤒 몸상태·📅 일정·📌 날짜 지정
> Cloudflare 날씨 판단
> 기본 훈련 일정
```
