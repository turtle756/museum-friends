// 공통: 유물 데이터 읽기, HTML 이스케이프
let cache = null;
export async function loadStops() {
  if (!cache) cache = await (await fetch("/assets/data/stops.json")).json();
  return cache;
}

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
