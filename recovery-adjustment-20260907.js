(() => {
  // 2026-09-09 ~ 2026-09-15: 주 4회 러닝 + 2회 가벼운 걷기 + 1회 완전 휴식 테스트
  // 거리/시간은 범위가 아니라 고정값으로 지정한다.
  // 9/8 복귀 러닝: 4.64km / 30:30 / 6:34/km / 평균 HR 161 / 후반 HR 173 / 상승 42m
  // Easy 기준은 고정 페이스보다 대화 가능 + RPE 3~4 + 후반 통제 우선.
  // 9/10부터 마운자로 12.5mg 증량 예정이므로 메스꺼움/어지럼/탈수/섭취 저하가 있으면 러닝을 걷기 또는 휴식으로 바꾼다.

  const adjustments = {
    "2026-09-04": {
      type: "rest",
      title: "훈련 미실시 · 보충 안 함",
      desc: "9/4~9/6 훈련 공백\n빠진 훈련은 몰아서 보충하지 않기\n회복 후 계획대로 다시 시작"
    },
    "2026-09-07": {
      type: "rest",
      title: "피부 회복 · 완전 휴식",
      desc: "병변이 넓어 병원 진료 및 치료 중\n의사 권고에 따라 러닝과 땀나는 운동은 쉬기\n오늘의 훈련은 회복"
    },
    "2026-09-09": {
      type: "easy",
      title: "Easy 3km · 주 4회 테스트 ①",
      desc: "거리 3km 고정\n어제보다 확실히 가볍게\n대화 가능한 강도 · RPE 3~4\n페이스 숫자보다 호흡과 몸 상태 우선\n마지막 가속 금지\n3km가 끝나고 더 뛸 여력이 있어도 종료\n피부 가려움·붉은기·화끈거림이 올라오면 즉시 종료"
    },
    "2026-09-11": {
      type: "easy",
      title: "Easy 5km · 주 4회 테스트 ②",
      desc: "거리 5km 고정\n대화 가능한 강도 · RPE 3~4\n첫 1km는 의도적으로 여유 있게\n후반에도 호흡과 폼이 편해야 성공\n9/10 증량 후 메스꺼움·어지럼·탈수 느낌이 있으면 걷기로 대체"
    },
    "2026-09-14": {
      type: "rest",
      title: "완전 휴식 · 회복 체크",
      desc: "러닝 없음\n주 4회 테스트 중 유일한 완전 휴식일\n다리 피로·수면·피부·식욕·수분 상태 확인\n가벼운 일상 활동 외 운동은 하지 않기"
    },
    "2026-09-16": {
      type: "quality",
      title: "4분 지속주 × 3 · 테스트 후 재평가",
      desc: "9/9~9/15 주 4회 테스트 결과를 먼저 평가\n회복이 안정적일 때만 진행\n1km Easy 워밍업\n(4분 @ 6:20~6:30/km + 2분 아주 느린 조깅/걷기) × 3\n1km Cooldown\n피로·피부 증상이 남으면 Easy 4.5km로 대체"
    },
    "2026-09-18": {
      type: "easy",
      title: "Easy 5km",
      desc: "거리 5km 고정\n대화 가능한 강도 · RPE 3~4\n9/16 피로가 남으면 훈련 자체를 Easy 4km로 변경\n회복성 러닝"
    },
    "2026-09-21": {
      type: "long",
      title: "Long Easy 7.5km",
      desc: "거리 7.5km 고정\n대화 가능한 강도 · RPE 4~5\n기록 도전 금지\n6km 이후에도 호흡과 폼이 무너지지 않는 것이 목표"
    },
    "2026-09-23": {
      type: "easy",
      title: "Easy 5km + Strides",
      desc: "Easy 5km · 대화 가능한 강도\n상태 좋으면 마지막에 20초 가속주 × 3\n가속주 사이 75초 걷기/조깅\n전력질주 금지"
    },
    "2026-09-25": {
      type: "quality",
      title: "1km × 3 · 10K 페이스 접근",
      desc: "1.5km Easy 워밍업\n1km @ 6:05~6:15/km × 3\n세트 사이 3분 걷기/느린 조깅\n1km Cooldown\n첫 세트를 가장 보수적으로"
    },
    "2026-09-28": {
      type: "long",
      title: "Long Easy 8.5km",
      desc: "거리 8.5km 고정\n대화 가능한 강도 · RPE 4~5\n기록 도전 금지\n60분 전후 지속주에 적응\n후반 페이스 상승 없이 끝까지 일정하게"
    },
    "2026-09-30": {
      type: "easy",
      title: "Easy 4.5km",
      desc: "거리 4.5km 고정\n대화 가능한 강도 · RPE 3~4\n10/2 5km 테스트를 위해 다리를 가볍게 만들기"
    },
    "2026-10-02": {
      type: "quality",
      title: "⭐ 5km 기록 테스트",
      desc: "워밍업 15분 + 가벼운 가속 2회\n5km 연속주\n1km 6:05 전후로 시작 후 점진적으로 판단\n\n29:30 이내 → Sub-60 준비 순조로움\n29:30~30:15 → 도전 가능, 지구력 보강\n30:15+ → 실전 목표 페이스 재평가\n초반 과속 금지"
    },
    "2026-10-05": {
      type: "long",
      title: "Long Easy 9km · 최장거리",
      desc: "거리 9km 고정\n대화 가능한 강도 · RPE 4~5\n대회 전 최장거리 적응\n기록 도전 금지\n마지막 1km까지 여유 있게 유지"
    },
    "2026-10-07": {
      type: "easy",
      title: "Easy 4.5km",
      desc: "거리 4.5km 고정\n대화 가능한 강도 · RPE 3~4\n10/5 장거리 피로 제거가 목적"
    },
    "2026-10-09": {
      type: "quality",
      title: "⭐ Goal Pace 1km × 4",
      desc: "1.5km Easy 워밍업\n1km @ 5:58~6:05/km × 4\n세트 사이 3분 느린 조깅/걷기\n1km Cooldown\n첫 세트부터 5:50대로 당기지 않기\n4세트 모두 비슷한 페이스가 목표"
    },
    "2026-10-12": {
      type: "easy",
      title: "Easy 6km · 테이퍼 시작",
      desc: "거리 6km 고정\n대화 가능한 강도 · RPE 3~4\n거리 욕심 금지\n훈련 효과보다 피로 제거 우선"
    },
    "2026-10-13": {
      type: "easy",
      title: "Easy 4km + Strides",
      desc: "Easy 4km\n20초 가속주 × 3\n가속주 사이 75초 완전 회복\n상쾌한 느낌으로 종료"
    },
    "2026-10-14": {
      type: "rest",
      title: "휴식",
      desc: "러닝 없음\n가벼운 걷기와 스트레칭 정도\n수면과 수분 섭취 우선"
    },
    "2026-10-15": {
      type: "quality",
      title: "Race Pace 자극 · 짧게",
      desc: "Easy 20분\n1분 @ 5:58~6:05/km × 3\n사이 2분 Easy\n총 운동량을 늘리지 않기\n목표는 피로가 아니라 페이스 감각"
    },
    "2026-10-16": {
      type: "rest",
      title: "완전 휴식",
      desc: "러닝 금지\n수면·수분·평소 식사 유지\n새 운동과 강한 스트레칭 금지"
    },
    "2026-10-17": {
      type: "rest",
      title: "대회 전날",
      desc: "완전 휴식 또는 20분 가벼운 산책\n새 음식·새 장비 금지\n신발·복장·번호표 준비\n탄수화물을 평소보다 지나치게 줄이지 않기"
    },
    "2026-10-18": {
      type: "race",
      title: "🏁 STYLE RUN 10K · SUB 60",
      desc: "목표 59:59 이내\n\n0~2km : 6:03~6:07/km\n2~5km : 5:58~6:02/km\n5~8km : 5:58~6:00/km 유지\n8~10km : 호흡·다리 상태가 좋으면 점진 가속\n\n초반에 시간을 저축하려 하지 않기\n5km 통과 목표 약 30:00"
    }
  };

  const trialWeek = [
    {
      date: "2026-09-10",
      type: "rest",
      title: "가벼운 걷기 45분",
      desc: "45분 고정\n숨이 차지 않는 편한 걷기 · RPE 1~2\n운동이 아니라 회복과 일상 활동량 확보가 목적\n마운자로 12.5mg 증량일: 메스꺼움·어지럼·수분 섭취 저하 확인"
    },
    {
      date: "2026-09-12",
      type: "rest",
      title: "가벼운 걷기 45분",
      desc: "45분 고정\n편한 산책 · RPE 1~2\n땀이 많이 나는 속도로 걷지 않기\n피부 반응과 다리 피로 확인"
    },
    {
      date: "2026-09-13",
      type: "long",
      title: "Long Easy 6.5km · 주 4회 테스트 ③",
      desc: "거리 6.5km 고정\n대화 가능한 강도 · RPE 4 이하\n페이스보다 편안하게 거리를 소화하는 것이 목표\n마지막까지 가속하지 않기\n끝났을 때 1km 이상 더 뛸 수 있을 느낌으로 종료"
    },
    {
      date: "2026-09-15",
      type: "easy",
      title: "Easy 4.5km · 주 4회 테스트 ④",
      desc: "거리 4.5km 고정\n대화 가능한 강도 · RPE 3~4\n이번 주 빈도 테스트의 마지막 러닝\n기록 도전·가속주 없음\n운동 직후와 다음날 다리/피부/피로를 기록해 주 4회 유지 여부 판단"
    }
  ];

  workouts.forEach(workout => {
    const adjustment = adjustments[workout.date];
    if (adjustment) Object.assign(workout, adjustment);
  });

  trialWeek.forEach(item => {
    const existing = workouts.find(workout => workout.date === item.date);
    if (existing) Object.assign(existing, item);
    else workouts.push(item);
  });

  workouts.sort((a, b) => a.date.localeCompare(b.date));

  if (typeof renderSchedule === "function") renderSchedule();
})();
