(() => {
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
      title: "복귀 체크 20~30분",
      desc: "의사 지침 우선\n병변이 충분히 안정되고 운동 가능한 상태일 때만\n7:30~8:00/km 또는 더 느리게 · RPE 3~4\n피부 증상이 다시 심해지면 즉시 중단"
    },
    "2026-09-11": {
      type: "easy",
      title: "Easy 4~5km · 복귀 2회차",
      desc: "7:15~7:45/km\nRPE 4~5\n속도 훈련 금지 · 편안한 연속주"
    },
    "2026-09-14": {
      type: "long",
      title: "Long Easy 6km",
      desc: "7:15~7:45/km\n피부와 컨디션이 안정적일 때만\n속도가 아니라 거리 적응이 목적"
    },
    "2026-09-16": {
      type: "quality",
      title: "4분 지속주 × 3 · 강도 복귀",
      desc: "1km Easy\n(4분 @ 6:30~6:40/km + 2분 회복) × 3\nCooldown\n첫 강도 복귀이므로 여유를 남기기"
    },
    "2026-09-18": {
      type: "easy",
      title: "Easy 5km",
      desc: "7:10~7:35/km\n회복성 러닝\n9/16 피로가 남으면 거리 단축"
    }
  };

  workouts.forEach(workout => {
    const adjustment = adjustments[workout.date];
    if (adjustment) Object.assign(workout, adjustment);
  });

  if (typeof renderSchedule === "function") renderSchedule();
})();
