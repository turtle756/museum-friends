// 시안 갤러리 공통: 데이터, 머리말, 픽셀 아이콘, 박물관 약도
export const COLORS = {
  K: "#24160F", D: "#3D2418", B: "#5E3621", M: "#84502D", W: "#A86E3E", T: "#C9965A", O: "#DDB984",
  P: "#F1E4CA", H: "#FFFAF0", R: "#7E1C17", r: "#B8322A", J: "#DB5F35", G: "#E3A238", Y: "#F3D17E",
  S: "#5F5B58", s: "#A39C94",
};

const NAV = [
  ["index.html", "처음"], ["strategies.html", "큰 전략"], ["themes.html", "이야기 틀"], ["cards.html", "부모 카드"],
  ["sheets.html", "아이 활동지"], ["stamps.html", "도장 방식"], ["styles.html", "그림 스타일"], ["designs.html", "디자인 방향"], ["routes.html", "동선"],
  ["compare.html", "비교표"],
];

export function chrome() {
  const here = location.pathname.split("/").pop() || "index.html";
  const bar = document.createElement("header");
  bar.className = "gbar noprint";
  bar.innerHTML = `<div class="gbar__in"><a class="gbar__home" href="/">유물 친구 시안 갤러리</a><nav>${NAV.map(
    ([href, label]) => `<a href="/${href}"${href === here ? ' aria-current="page"' : ""}>${label}</a>`,
  ).join("")}</nav><span class="gtag">시안 · 학예사 검수 전</span></div>`;
  document.body.prepend(bar);
  const foot = document.createElement("footer");
  foot.className = "gfoot noprint";
  foot.textContent = "가톨릭대학교 웹프로그래밍 팀 프로젝트 회의용 시안 · 부천활박물관 공식 자료가 아닙니다 · 사진은 팀 현장 촬영, 사용 허락 확인 전";
  document.body.append(foot);
}

let cache = null;
export async function loadStops() {
  if (!cache) cache = await (await fetch("/assets/data/stops.json")).json();
  return cache;
}

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function stopImage(stop, theme = "pixel") {
  if (theme !== "trad" && stop.pixel) {
    return `<img class="px" src="/assets/img/pixel/${stop.pixel}.png" alt="${esc(stop.name)} 픽셀 그림(실제 사진 바탕)">`;
  }
  return `<img src="/assets/img/photo/${stop.photo}.jpg" alt="${esc(stop.name)} 현장 사진">`;
}

// ---------- 픽셀 아이콘 (16색 팔레트, 굵은 먹색 테두리) ----------
const ICONS = {
  look: [
    "................", "................", "................", "....KKKKKKKK....", "..KKHHHHHHHHKK..", ".KHHHHKKKKHHHHK.",
    "KHHHHKDDDDKHHHHK", "KHHHHKDHDDKHHHHK", "KHHHHKDDDDKHHHHK", ".KHHHHKKKKHHHHK.", "..KKHHHHHHHHKK..", "....KKKKKKKK....",
    "................", "................", "................", "................",
  ],
  talk: [
    "................", ".KKKKKKKKKKKKKK.", "KHHHHHHHHHHHHHHK", "KHHHHHHHHHHHHHHK", "KHHGGHHGGHHGGHHK", "KHHGGHHGGHHGGHHK",
    "KHHHHHHHHHHHHHHK", "KHHHHHHHHHHHHHHK", ".KKKKKHHKKKKKKK.", ".....KHK........", "....KHK.........", "....KK..........",
    "................", "................", "................", "................",
  ],
  ask: [
    "................", ".KKKKKKKKKKKKKK.", "KHHHHHHHHHHHHHHK", "KHHHHHrrrrHHHHHK", "KHHHHrrHHrrHHHHK", "KHHHHHHHHrrHHHHK",
    "KHHHHHHHrrHHHHHK", "KHHHHHHrrHHHHHHK", "KHHHHHHHHHHHHHHK", "KHHHHHHrrHHHHHHK", ".KKKKKHHKKKKKKK.", ".....KHK........",
    "....KHK.........", "....KK..........", "................", "................",
  ],
  stamp: [
    "................", ".....KKKKKK.....", "...KKrrrrrrKK...", "..KrrHHHHHHrrK..", ".KrrHHrrrrHHrrK.", ".KrHHrHHHHrHHrK.",
    "KrrHrHHHHHHrHrrK", "KrHHrHHHHHHrHHrK", "KrHHrHHHHHHrHHrK", "KrrHrHHHHHHrHrrK", ".KrHHrHHHHrHHrK.", ".KrrHHrrrrHHrrK.",
    "..KrrHHHHHHrrK..", "...KKrrrrrrKK...", ".....KKKKKK.....", "................",
  ],
  bow: [
    "......KK........", ".....KWWK.......", "....KWWKs.......", "...KWWK.s.......", "..KWWK..s.......", "..KWK...s.......",
    ".KWWK...s.......", ".KrrK...s.......", ".KrrK...s.......", ".KWWK...s.......", "..KWK...s.......", "..KWWK..s.......",
    "...KWWK.s.......", "....KWWKs.......", ".....KWWK.......", "......KK........",
  ],
  arrow: [
    "............KKK.", "...........KSSK.", "..........KSSK..", ".........KSSK...", "........KWWK....", ".......KWWK.....",
    "......KWWK......", ".....KWWK.......", "....KWWK........", "..KKWWK.........", ".KrKWK..........", "KrrKK...........",
    "KrrrK...........", ".KrrK...........", "..KK............", "................",
  ],
  fold: [
    "................", ".KKKKKKKKKK.....", ".KHHHHHHHHKK....", ".KHHHHHHHHKOK...", ".KHHHHHHHHKOOK..", ".KHHHHHHHHKKKKK.",
    ".KHHHHHHHHHHHHK.", ".KHHrrrrrrHHHHK.", ".KHHHHHHHHHHHHK.", ".KHHrrrrHHHHHHK.", ".KHHHHHHHHHHHHK.", ".KHHrrrrrrHHHHK.",
    ".KHHHHHHHHHHHHK.", ".KKKKKKKKKKKKKK.", "................", "................",
  ],
  star: [
    ".......KK.......", "......KGGK......", "......KGGK......", ".....KGGGGK.....", "KKKKKKGGGGKKKKKK", "KYGGGGGGGGGGGGYK",
    ".KYGGGGGGGGGGYK.", "..KYGGGGGGGGYK..", "...KGGGGGGGGK...", "...KGGGGGGGGK...", "..KGGGGKKGGGGK..", "..KGGGK..KGGGK..",
    ".KGGKK....KKGGK.", ".KKK........KKK.", "................", "................",
  ],
  map: [
    "................", "KKKKKKKKKKKKKKKK", "KHHHHHKOOOOOKHHK", "KHHHHHKOOOOOKHHK", "KHHrHHKOOOOOKHHK", "KHrrrHKOOrOOKHHK",
    "KHHrHHKOrrrOKHHK", "KHHHHHKOOrOOKHHK", "KKKKKKKOOOOOKHHK", "KHHHHHKOOOOOKHHK", "KHHHHHKKKKKKKHHK", "KHHHHHHHHHHHHHHK",
    "KKKKKKKKKKKKKKKK", "................", "................", "................",
  ],
  check: [
    "................", "............KKK.", "...........KGGK.", "..........KGGK..", ".........KGGK...", ".KKK....KGGK....",
    "KGGK...KGGK.....", ".KGGK.KGGK......", "..KGGKGGK.......", "...KGGGK........", "....KGK.........", ".....K..........",
    "................", "................", "................", "................",
  ],
};

export function icon(name, size = 48) {
  const rows = ICONS[name];
  if (!rows) return "";
  let rects = "";
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== ".") rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${COLORS[ch]}"/>`;
  }));
  return `<svg viewBox="0 0 16 16" width="${size}" height="${size}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

// ---------- 박물관 약도 (관람 안내 지도를 옮겨 그린 추정도) ----------
export const MAP_POS = {
  desk: [244, 372], sidae: [400, 118], rest: [470, 150], fire: [540, 118], jeongjo: [612, 150],
  arrows: [676, 118], making: [744, 172], exam: [392, 228], singijeon: [347, 312],
};
const ZONES = [
  [33, 37, 195, 119, "영상 및 세미나실"], [237, 40, 109, 49, "모형"], [596, 40, 115, 43, "대사례도"],
  [857, 57, 128, 132, "화장실"], [335, 96, 385, 94, "시대별화살 · 화살의 종류"], [33, 250, 140, 150, "입구"],
  [304, 271, 87, 83, "신기전"], [461, 235, 231, 132, "체험공간"], [698, 248, 122, 119, "기획전시실"], [826, 261, 122, 133, "기증자 전시실"],
];
const ROUTE = "199,298 238,298 270,261 270,152 346,122 462,99 564,103 702,106 718,129 666,169 676,205 753,205 830,208 852,251 801,232 692,228 583,212 500,212 430,241 426,331 359,374 279,344";

export function museumMap({ stops = [], highlight = null, route = ROUTE, showRoute = true, numbered = true, labelZones = true } = {}) {
  const zones = ZONES.map(([x, y, w, h, label]) => `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#F1E4CA" stroke="#5E3621" stroke-width="3"/>${
    labelZones ? `<text x="${x + 8}" y="${y + h - 8}" font-size="14" fill="#5E3621" font-weight="700">${label}</text>` : ""}</g>`).join(""); // 번호 칸과 겹치지 않게 왼쪽 아래에
  const marks = stops.map((s, i) => {
    const [x, y] = MAP_POS[s.id] || [0, 0];
    const on = highlight === s.id;
    return `<g><rect x="${x - 15}" y="${y - 15}" width="30" height="30" fill="${on ? "#B8322A" : "#E3A238"}" stroke="#24160F" stroke-width="4"/><text x="${x}" y="${y + 6}" text-anchor="middle" font-size="17" font-weight="900" fill="${on ? "#FFFAF0" : "#24160F"}">${numbered ? i + 1 : ""}</text></g>`;
  }).join("");
  const [dx, dy] = MAP_POS.desk;
  return `<svg viewBox="0 0 1000 430" role="img" aria-label="부천활박물관 약도(관람 안내 지도를 옮겨 그린 추정도)">
<rect x="18" y="18" width="970" height="400" fill="#FFFAF0" stroke="#24160F" stroke-width="6"/>${zones}
${showRoute ? `<polyline points="${route}" fill="none" stroke="#DB5F35" stroke-width="4" stroke-dasharray="10 8"/>` : ""}
<g><rect x="${dx - 46}" y="${dy - 14}" width="92" height="28" fill="#5E3621" stroke="#24160F" stroke-width="3"/><text x="${dx}" y="${dy + 6}" text-anchor="middle" font-size="14" fill="#F3D17E" font-weight="800">안내데스크</text></g>
${marks}</svg>`;
}
