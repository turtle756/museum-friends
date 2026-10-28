// 진행 상황과 아이의 대답은 이 폰의 localStorage 에만 둔다.
// store 는 { get(key), set(key, value), remove(key) } 모양이면 된다. 테스트에서는 가짜 저장소를 넣는다.

export const PROGRESS_KEY = "mf:progress:v1";

export function newProgress(tourId, visit, now = new Date()) {
  return { v: 1, tourId, visit, index: 0, found: {}, startedAt: now.toISOString(), completedAt: null };
}

export function loadProgress(store, tourId) {
  const raw = store.get(PROGRESS_KEY);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    const valid =
      p && p.v === 1 && p.tourId === tourId && typeof p.visit === "string" &&
      Number.isInteger(p.index) && p.index >= 0 && p.found && typeof p.found === "object";
    return valid ? p : null;
  } catch {
    return null;
  }
}

export function saveProgress(store, progress) {
  store.set(PROGRESS_KEY, JSON.stringify(progress));
}

export function clearProgress(store) {
  store.remove(PROGRESS_KEY);
}

export function isComplete(progress, total) {
  return Boolean(progress) && progress.index >= total;
}

export function markFound(progress, code, record, total, now = new Date()) {
  const index = Math.min(progress.index + 1, total);
  return {
    ...progress,
    index,
    found: { ...progress.found, [code]: { ...record, at: now.toISOString() } },
    completedAt: index >= total ? (progress.completedAt ?? now.toISOString()) : progress.completedAt,
  };
}
