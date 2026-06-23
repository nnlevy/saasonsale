export type Profile = {
  focusType: string;
  pacing: string;
  tone: string;
};

export type Attempt = {
  lessonId: string;
  stepKey: string;
  correct: boolean;
  answeredAtISO: string;
};

export type LearningState = {
  profile?: Profile;
  completedLessonIds: string[];
  attempts: Attempt[];
  streak: { currentDays: number; lastCompletionISO?: string };
  cp: { total: number };
  glow: { current: number; max: number; lastRegenISO: string };
  stepStrength: Record<string, number>;
  responses: Record<string, string>;
};

export const defaultLearningState = (): LearningState => ({
  completedLessonIds: [],
  attempts: [],
  streak: { currentDays: 0 },
  cp: { total: 0 },
  glow: { current: 5, max: 5, lastRegenISO: new Date().toISOString() },
  stepStrength: {},
  responses: {},
});

const toDayKey = (iso: string) => new Date(iso).toISOString().slice(0, 10);

export const updateStreak = (streak: LearningState["streak"], completionISO: string) => {
  if (!streak.lastCompletionISO) {
    return { currentDays: 1, lastCompletionISO: completionISO };
  }
  const now = Date.parse(toDayKey(completionISO));
  const prev = Date.parse(toDayKey(streak.lastCompletionISO));
  const diffDays = Math.round((now - prev) / 86400000);
  if (diffDays <= 0) return { ...streak, lastCompletionISO: completionISO };
  if (diffDays === 1) return { currentDays: streak.currentDays + 1, lastCompletionISO: completionISO };
  return { currentDays: 1, lastCompletionISO: completionISO };
};

export const computeLevel = (cp: number) => Math.floor(cp / 200) + 1;

export const regenGlow = (glow: LearningState["glow"], nowISO: string) => {
  const elapsedHours = Math.floor((Date.parse(nowISO) - Date.parse(glow.lastRegenISO)) / 3600000);
  if (elapsedHours <= 0) return glow;
  return {
    ...glow,
    current: Math.min(glow.max, glow.current + elapsedHours),
    lastRegenISO: nowISO,
  };
};

export const applyLessonCompletion = (
  state: LearningState,
  lessonId: string,
  baseCp: number,
  bonusCp: number,
  completionISO: string,
) => {
  const completedSet = new Set(state.completedLessonIds);
  completedSet.add(lessonId);
  return {
    ...state,
    completedLessonIds: [...completedSet],
    cp: { total: state.cp.total + baseCp + bonusCp },
    streak: updateStreak(state.streak, completionISO),
  };
};

export const registerStepResult = (
  state: LearningState,
  lessonId: string,
  stepKey: string,
  correct: boolean,
  answeredAtISO: string,
) => {
  const strength = state.stepStrength[stepKey] ?? 0;
  return {
    ...state,
    attempts: [...state.attempts, { lessonId, stepKey, correct, answeredAtISO }],
    stepStrength: {
      ...state.stepStrength,
      [stepKey]: correct ? Math.min(5, strength + 1) : Math.max(0, strength - 2),
    },
    glow: {
      ...state.glow,
      current: Math.max(0, Math.min(state.glow.max, state.glow.current + (correct ? 0.3 : -0.4))),
    },
  };
};

export const selectPracticeSteps = (
  attempts: Attempt[],
  stepStrength: Record<string, number>,
  limit = 6,
) => {
  const score = new Map<string, number>();
  const now = Date.now();
  attempts.forEach((attempt) => {
    const ageDays = (now - Date.parse(attempt.answeredAtISO)) / 86400000;
    const weakness = 5 - (stepStrength[attempt.stepKey] ?? 0);
    const penalty = attempt.correct ? 0 : 3;
    const next = ageDays + weakness + penalty;
    score.set(attempt.stepKey, Math.max(score.get(attempt.stepKey) ?? 0, next));
  });
  return [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([stepKey]) => stepKey);
};
