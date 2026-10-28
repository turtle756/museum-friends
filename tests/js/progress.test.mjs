import assert from "node:assert/strict";
import { test } from "node:test";

import {
  PROGRESS_KEY,
  clearProgress,
  isComplete,
  loadProgress,
  markFound,
  newProgress,
  saveProgress,
} from "../../public/js/progress.js";

function fakeStore() {
  const data = new Map();
  return {
    get: (key) => (data.has(key) ? data.get(key) : null),
    set: (key, value) => data.set(key, value),
    remove: (key) => data.delete(key),
    data,
  };
}

const NOW = new Date("2026-11-07T10:00:00Z");

test("저장한 진행 상황을 다시 읽는다", () => {
  const store = fakeStore();
  const p = newProgress("hwal", "visit-1", NOW);
  saveProgress(store, p);
  assert.deepEqual(loadProgress(store, "hwal"), p);
});

test("다른 투어나 깨진 기록은 무시한다", () => {
  const store = fakeStore();
  saveProgress(store, newProgress("other", "visit-1", NOW));
  assert.equal(loadProgress(store, "hwal"), null);
  store.set(PROGRESS_KEY, "{broken");
  assert.equal(loadProgress(store, "hwal"), null);
});

test("친구를 만나면 다음 카드로, 마지막이면 완주", () => {
  let p = newProgress("hwal", "visit-1", NOW);
  p = markFound(p, "101", { answer: "젤리", line: "나는 젤리를…", attempts: 1 }, 2, NOW);
  assert.equal(p.index, 1);
  assert.equal(p.found["101"].answer, "젤리");
  assert.equal(isComplete(p, 2), false);
  p = markFound(p, "102", { answer: "", line: "기본 대사", attempts: 0 }, 2, NOW);
  assert.equal(isComplete(p, 2), true);
  assert.equal(p.completedAt, NOW.toISOString());
});

test("기록 지우기", () => {
  const store = fakeStore();
  saveProgress(store, newProgress("hwal", "visit-1", NOW));
  clearProgress(store);
  assert.equal(loadProgress(store, "hwal"), null);
  assert.equal(store.data.size, 0);
});

test("진행 상황이 없으면 완주 아님", () => {
  assert.equal(isComplete(null, 3), false);
});
