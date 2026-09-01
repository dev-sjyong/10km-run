# Cloudflare Worker + Cron + KV 설정

현재 저장소에는 날씨 스케줄러 Worker 코드가 포함되어 있습니다.

## 구성

- `worker/src/index.js`: Open-Meteo 조회, 일정 재계산, Push 구독 저장·변경 감지·알림 전송
- `sw.js`: 백그라운드 Push 수신, 알림 표시, 알림 클릭 시 앱 열기
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

### Web Push VAPID 키 준비 (최초 1회)

키 쌍을 생성합니다. 명령은 키를 화면에만 출력하며 파일로 저장하지 않습니다.

```bash
npm run vapid:generate
```

출력된 두 값을 안전한 비밀번호 관리자에 보관한 뒤 Cloudflare Worker secret으로 등록합니다.

```bash
npx wrangler secret put VAPID_PUBLIC_KEY
npx wrangler secret put VAPID_PRIVATE_KEY
```

`VAPID_PRIVATE_KEY`는 절대로 `wrangler.jsonc`, 소스 코드, GitHub 커밋에 넣지 않습니다. Worker secret은 이후 GitHub Actions가 Worker를 다시 배포해도 유지됩니다. 별도의 Cloudflare 환경을 만들 경우에는 그 환경에도 두 secret을 각각 등록해야 합니다.

### Worker 배포

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
GET /api/push/public-key
POST /api/push/subscriptions
DELETE /api/push/subscriptions
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

Cron은 새 예보를 저장하기 전에 이전 예보로 계산한 자동 일정과 새 예보로 계산한 자동 일정을 비교합니다. 브라우저가 구독할 때 동기화한 완료·날짜 고정·수동 미루기 상태를 반영하며, 실제 유효 날짜가 바뀐 경우에만 이동 또는 복귀 Push를 보냅니다. 만료된 구독(404/410)은 KV에서 자동 제거합니다.

## 브라우저에서 알림 켜기

배포 후 페이지의 `알림 켜기` 버튼을 누르고 알림 권한을 허용합니다. iPhone/iPad의 Web Push는 Safari에서 사이트를 홈 화면에 추가한 뒤 홈 화면 앱으로 실행해야 합니다.

## 일정 상태 우선순위

브라우저의 기존 `run58_*` localStorage 기록은 그대로 유지하며 다음 우선순위로 병합합니다.

```text
완료 / 날짜 고정
> 🤒 몸상태·📅 일정·📌 날짜 지정
> Cloudflare 날씨 판단
> 기본 훈련 일정
```
