import test from 'node:test';
import assert from 'node:assert/strict';
import { applyLessonCompletion, computeLevel, defaultLearningState, regenGlow, selectPracticeSteps } from '../src/react-app/lib/learning-core.mjs';

test('streak increments on consecutive days and resets on gaps', () => {
  let state = defaultLearningState();
  state = applyLessonCompletion(state, 'a', 10, 0, '2026-02-20T10:00:00Z');
  state = applyLessonCompletion(state, 'b', 10, 0, '2026-02-21T10:00:00Z');
  assert.equal(state.streak.currentDays, 2);
  state = applyLessonCompletion(state, 'c', 10, 0, '2026-02-24T10:00:00Z');
  assert.equal(state.streak.currentDays, 1);
});

test('cp and level calculations', () => {
  let state = defaultLearningState();
  state = applyLessonCompletion(state, 'a', 150, 50, '2026-02-20T10:00:00Z');
  assert.equal(state.cp.total, 200);
  assert.equal(computeLevel(state.cp.total), 2);
});

test('glow regens with elapsed hours', () => {
  const glow = { current: 1, max: 5, lastRegenISO: '2026-02-20T00:00:00Z' };
  const next = regenGlow(glow, '2026-02-20T03:00:00Z');
  assert.equal(next.current, 4);
});

test('practice selection prioritizes weak + incorrect', () => {
  const attempts = [
    { stepKey: 's1', correct: false, answeredAtISO: '2026-02-20T00:00:00Z' },
    { stepKey: 's2', correct: true, answeredAtISO: new Date().toISOString() },
  ];
  const chosen = selectPracticeSteps(attempts, { s1: 0, s2: 4 }, 1);
  assert.deepEqual(chosen, ['s1']);
});
