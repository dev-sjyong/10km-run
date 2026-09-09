(() => {
  // 2026-09-08 복귀 러닝 반영
  // 4.64km / 30:30 / 6:34/km / 평균 HR 161 / 후반 HR 173 / 상승 42m
  // 해석: 러닝 감각은 유지됐지만 Easy보다 강도가 높았으므로
  // 9/9은 회복, 이후 거리 적응을 먼저 복구하고 강도는 단계적으로 재도입한다.
  const adjustments = {
    "2026-09-09": {
      type: "rest",
      title: "회복 · 완전 휴식",
      desc: "9/8 복귀 러닝 4.64km 완료\n평균 6:34/km · 평균 HR 161로 Easy보다 강했음\n오늘은 보충 훈련 없이 회복\n피부 가려움·붉은기 재발 여부 확인"
    },
    "2026-09-11": {
      type: "easy",
      title: "Easy 4.5~5km · 강도 낮추기",
      desc: "7:10~7:40/km 또는 대화 가능한 강도\nRPE 4 이하\n첫 1km는 7:30/km보다 느리게 시작 가능\n마지막 가속 금지 · 피부 반응 있으면 즉시 종료"
    },
    "2026-09-14": {
      type: "long",
      title: "Long Easy 6.5km",
      desc: "7:10~7:40/km\nRPE 4~5\n목표는 속도가 아니라 45~50분 편안하게 움직이기\n끝났을 때 1~2km 더 뛸 여유를 남기기"
    },
    "2026-09-16": {
      type: "quality",
      title: "4분 지속주 × 3 · 품질훈련 복귀",
      desc: "1km Easy 워밍업\n(4분 @ 6:20~6:30/km + 2분 아주 느린 조깅/걷기) × 3\n1km 내외 Cooldown\n마지막 반복도 같은 강도로 끝낼 수 있을 때만 진행\n피부·피로가 남으면 Easy 4~5km로 대체"
    },
    "2026-09-18": {
      type: "easy",
      title: "Easy 5km",
      desc: "7:10~7:35/km\nRPE 4 이하\n9/16 피로가 남으면 4km로 단축\n회복성 러닝"
    },
    "2026-09-21": {
      type: "long",
      title: "Long Easy 7.5km",
      desc: "7:10~7:40/km\n기록 도전 금지\n6km 이후에도 호흡과 폼이 무너지지 않는 것이 목표"
    },
    "2026-09-23": {
      type: "easy",
      title: "Easy 5km + Strides",
      desc: "Easy 5km @ 7:10~7:35/km\n상태 좋으면 마지막에 20초 가속주 × 3\n가속주 사이 60~90초 걷기/조깅\n전력질주 금지"
    },
    "2026-09-25": {
      type: "quality",
      title: "1km × 3 · 10K 페이스 접근",
      desc: "1~1.5km Easy 워밍업\n1km @ 6:05~6:15/km × 3\n세트 사이 3분 걷기/느린 조깅\n1km 내외 Cooldown\n첫 세트를 가장 보수적으로"
    },
    "2026-09-28": {
      type: "long",
      title: "Long Easy 8.5km",
      desc: "7:10~7:40/km\n기록 도전 금지\n60분 전후 지속주에 적응\n후반 페이스 상승 없이 끝까지 일정하게"
    },
    "2026-09-30": {
      type: "easy",
      title: "Easy 4~4.5km",
      desc: "7:15~7:40/km\nRPE 3~4\n10/2 5km 테스트를 위해 다리를 가볍게 만들기"
    },
    "2026-10-02": {
      type: "quality",
      title: "⭐ 5km 기록 테스트",
      desc: "워밍업 10~15분 + 가벼운 가속 2회\n5km 연속주\n1km 6:05 전후로 시작 후 점진적으로 판단\n\n29:30 이내 → Sub-60 준비 순조로움\n29:30~30:15 → 도전 가능, 지구력 보강\n30:15+ → 실전 목표 페이스 재평가\n초반 과속 금지"
    },
    "2026-10-05": {
      type: "long",
      title: "Long Easy 9km · 최장거리",
      desc: "7:10~7:40/km\n대회 전 최장거리 적응\n기록 도전 금지\n마지막 1km까지 여유 있게 유지"
    },
    "2026-10-07": {
      type: "easy",
      title: "Easy 4.5km",
      desc: "7:15~7:40/km\nRPE 3~4\n10/5 장거리 피로 제거가 목적"
    },
    "2026-10-09": {
      type: "quality",
      title: "⭐ Goal Pace 1km × 4",
      desc: "1~1.5km Easy 워밍업\n1km @ 5:58~6:05/km × 4\n세트 사이 3분 느린 조깅/걷기\nCooldown\n첫 세트부터 5:50대로 당기지 않기\n4세트 모두 비슷한 페이스가 목표"
    },
    "2026-10-12": {
      type: "easy",
      title: "Easy 5.5~6km · 테이퍼 시작",
      desc: "7:15~7:40/km\nRPE 3~4\n거리 욕심 금지\n훈련 효과보다 피로 제거 우선"
    },
    "2026-10-13": {
      type: "easy",
      title: "Easy 3.5~4km + Strides",
      desc: "Easy 3.5~4km\n20초 가속주 × 3\n가속주 사이 60~90초 완전 회복\n상쾌한 느낌으로 종료"
    },
    "2026-10-14": {
      type: "rest",
      title: "휴식",
      desc: "러닝 없음\n가벼운 걷기와 스트레칭 정도\n수면과 수분 섭취 우선"
    },
    "2026-10-15": {
      type: "quality",
      title: "Race Pace 자극 · 짧게",
      desc: "Easy 15~20분\n1분 @ 5:58~6:05/km × 3\n사이 2분 Easy\n총 운동량을 늘리지 않기\n목표는 피로가 아니라 페이스 감각"
    },
    "2026-10-16": {
      type: "rest",
      title: "완전 휴식",
      desc: "러닝 금지\n수면·수분·평소 식사 유지\n새 운동과 강한 스트레칭 금지"
    },
    "2026-10-17": {
      type: "rest",
      title: "대회 전날",
      desc: "완전 휴식 또는 15~20분 가벼운 산책\n새 음식·새 장비 금지\n신발·복장·번호표 준비\n탄수화물을 평소보다 지나치게 줄이지 않기"
    },
    "2026-10-18": {
      type: "race",
      title: "🏁 STYLE RUN 10K · SUB 60",
      desc: "목표 59:59 이내\n\n0~2km : 6:03~6:07/km\n2~5km : 5:58~6:02/km\n5~8km : 5:58~6:00/km 유지\n8~10km : 호흡·다리 상태가 좋으면 점진 가속\n\n초반에 시간을 저축하려 하지 않기\n5km 통과 목표 약 30:00"
    }
  };

  workouts.forEach(workout => {
    const adjustment = adjustments[workout.date];
    if (adjustment) Object.assign(workout, adjustment);
  });

  if (typeof renderSchedule === "function") renderSchedule();
})();
