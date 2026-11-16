// 아이에게 주는 유물 카드 시안: 같은 카드(사진·이름·전투력·스킬)를 디자인만 바꿔 여러 벌 그린다.
// 카드 내용은 stops.json의 card 칸. 전투력은 고증이 아니라 아이 눈에 세 보이는 정도, 스킬은 설명판 사실을 풀어 쓴 글.
import { esc } from "./core.js";

// logo: 카드 바탕이 어두우면 흰 로고(dark), 밝으면 원색 로고(light)
export const VARIANTS = [
  { id: "gallery", name: "전시실", logo: "dark", desc: "부모 앱과 한 벌. 어두운 바탕, 둥근 사진 창, 흰 알약 전투력." },
  { id: "catalog", name: "한지 도록", logo: "light", desc: "박물관 도록처럼 한지색 바탕과 가는 금색 테두리, 전투력은 빨간 낙관 도장." },
  // 11/16 수정판: 11번(세로 이름)의 먹색·금색을 포인트로, 뒷면에 전통 문양을 흐리게
  { id: "catalog-gold", base: "catalog", label: "2-1", name: "한지 도록 · 금색 포인트", logo: "light", back: { motif: "lotus", layout: "center" },
    desc: "금색 이중 테두리, 이름 밑 금색 줄, 도장에 금테. 뒷면 가운데 연화문(수막새 연꽃무늬)." },
  { id: "catalog-band", base: "catalog", label: "2-2", name: "한지 도록 · 먹색 이름띠", logo: "light", back: { motif: "lotus", layout: "corners" },
    desc: "이름 자리에 11번의 먹색 띠와 금색 글씨. 뒷면 오른쪽 위·왼쪽 아래에 연화문." },
  { id: "catalog-seal", base: "catalog", label: "2-3", name: "한지 도록 · 금박 도장", logo: "light", back: { motif: "aja", layout: "field" },
    desc: "빨간 도장 대신 11번의 먹색 바탕 금박 도장. 뒷면 전체에 아자문(亞자 창살)." },
  { id: "catalog-frame", base: "catalog", label: "2-4", name: "한지 도록 · 먹 액자", logo: "light", back: { motif: "noe", layout: "corners" },
    desc: "먹색 굵은 테 안에 금색 선을 두른 액자. 뒷면 오른쪽 위·왼쪽 아래에 뇌문(단청 번개무늬)." },
  { id: "full", name: "꽉 찬 사진", logo: "dark", desc: "유물 사진이 카드 전체. 전투력은 오른쪽 위에 아주 크게." },
  { id: "case", name: "진열장", logo: "light", desc: "흰 진열대 위 유물과 박물관 이름표. 전투력은 놋쇠 명패." },
  { id: "plan", name: "설계도", logo: "dark", desc: "남색 모눈 설계도. 전투력만큼 차오르는 동그란 눈금." },
  { id: "plan-back", base: "plan", label: "5-1", name: "설계도 · 뒷면 칠보문", logo: "dark", back: { motif: "chilbo", layout: "field" },
    desc: "앞면은 그대로, 뒷면 전체에 칠보문(겹친 원 무늬)과 가운데 이름판." },
  { id: "plan-gold", base: "plan", label: "5-2", name: "설계도 · 금색 포인트", logo: "dark", back: { motif: "taegeuk", layout: "center" },
    desc: "노랑·하늘색 대신 11번의 금색 눈금과 테두리. 뒷면 가운데 삼태극." },
  { id: "plan-ink", base: "plan", label: "5-3", name: "설계도 · 먹색 바탕", logo: "dark", back: { motif: "lotus", layout: "center" },
    desc: "남색 대신 11번의 먹색 바탕에 금색 모눈. 옛 도면 느낌. 뒷면 가운데 연화문." },
  { id: "plan-red", base: "plan", label: "5-4", name: "설계도 · 빨강 포인트", logo: "dark", back: { motif: "chilbo", layout: "corners" },
    desc: "로고의 빨강을 눈금과 스킬 이름에. 뒷면 오른쪽 위·왼쪽 아래에 칠보문이 번지듯." },
  { id: "bow", name: "활시위", logo: "light", desc: "부천활박물관 로고의 활 곡선과 빨간 마름모를 그대로 쓴 흑백빨강." },
  { id: "target", name: "과녁", logo: "dark", desc: "짙은 초록 활터. 전투력은 과녁 한가운데." },
  { id: "pop", name: "스티커", logo: "light", desc: "굵은 검은 테두리와 종류별 원색. 아이 손에 쥐는 스티커 느낌." },
  { id: "flag", name: "오방색 깃발", logo: "light", desc: "위쪽 오방색 띠와 종류별 깃발에 걸린 전투력." },
  { id: "min", name: "흰 카드", logo: "light", desc: "흰 바탕에 사진을 가로로 꽉 채우고 숫자만 크게. 기념품 엽서 느낌." },
  { id: "vert", name: "세로 이름", logo: "dark", desc: "옛 이름표처럼 이름을 세로로 쓰고, 짙은 먹색 바탕에 금색 글씨." },
  { id: "gold", name: "금테 소장판", logo: "dark", desc: "검은 바탕에 금색 이중 테두리, 금메달 전투력. 모아 두고 싶은 소장 카드." },
];

const CAT = { 총통: "cannon", 신기전: "rocket", 활: "bow", 화살: "arrow" };
const cls = (v) => `card--${v.base || v.id}${v.base ? ` card--${v.id}` : ""}`;

// ---------- 뒷면 전통 문양 (선은 currentColor, 흐리기는 CSS) ----------
const f2 = (n) => +n.toFixed(2);
// 연화문: 수막새 기와의 연꽃 — 바깥 테, 구슬 띠(연주문), 꽃잎 8장(안쪽 줄), 사이잎, 씨방
function lotus(sw = 1.4) {
  let p = "";
  for (let k = 0; k < 8; k++) {
    const a = k * 45;
    p += `<path d="M50 14C59 22 59 35 50 42C41 35 41 22 50 14Z" transform="rotate(${a} 50 50)"/><path d="M50 20C54.5 25 54.5 32 50 36C45.5 32 45.5 25 50 20Z" transform="rotate(${a} 50 50)"/><path d="M50 17V27" transform="rotate(${a + 22.5} 50 50)"/>`;
  }
  let seeds = '<circle cx="50" cy="50" r="1.5" fill="currentColor"/>';
  for (let k = 0; k < 6; k++) { const t = (k * 60 * Math.PI) / 180; seeds += `<circle cx="${f2(50 + 5 * Math.cos(t))}" cy="${f2(50 + 5 * Math.sin(t))}" r="1.2" fill="currentColor"/>`; }
  return `<g fill="none" stroke="currentColor" stroke-width="${sw}"><circle cx="50" cy="50" r="47"/><circle cx="50" cy="50" r="43.5" stroke-width="${f2(sw * 1.9)}" stroke-linecap="round" stroke-dasharray="0.01 5.47"/><circle cx="50" cy="50" r="40"/>${p}<circle cx="50" cy="50" r="9"/>${seeds}</g>`;
}
// 삼태극: 가운데에서 바깥으로 휘는 세 갈래 (경계는 반지름 R/2 반원, 태극과 같은 방식)
function taegeuk() {
  const C = 50, R = 46, r = R / 2, pt = (d) => [f2(C + R * Math.cos((d * Math.PI) / 180)), f2(C + R * Math.sin((d * Math.PI) / 180))];
  let s = "";
  [0.9, 0.45, 0.12].forEach((op, k) => {
    const [x1, y1] = pt(-90 + k * 120), [x2, y2] = pt(30 + k * 120);
    s += `<path d="M${C} ${C}A${f2(r)} ${f2(r)} 0 0 1 ${x1} ${y1}A${R} ${R} 0 0 1 ${x2} ${y2}A${f2(r)} ${f2(r)} 0 0 0 ${C} ${C}Z" fill="currentColor" fill-opacity="${op}" stroke="currentColor" stroke-width="1.2"/>`;
  });
  return `<g>${s}<circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="currentColor" stroke-width="1.4"/></g>`;
}
// 칠보문: 칸 꼭짓점마다 원(반지름 = 칸/√2)을 겹친 무늬 / 아자문: 亞자 창살
const chilboPat = (id, t) => `<pattern id="${id}" width="${t}" height="${t}" patternUnits="userSpaceOnUse"><g fill="none" stroke="currentColor" stroke-width="${f2(t * 0.05)}">${[[0, 0], [t, 0], [0, t], [t, t]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${f2(t / Math.SQRT2)}"/>`).join("")}</g></pattern>`;
const ajaPat = (id, t) => `<pattern id="${id}" width="${t}" height="${t}" patternUnits="userSpaceOnUse"><path transform="scale(${f2(t / 20)})" d="M6 2H14V6H18V14H14V18H6V14H2V6H6ZM10 0V2M10 18V20M0 10H2M18 10H20" fill="none" stroke="currentColor" stroke-width="1"/></pattern>`;
// 뇌문: 단청 테두리의 번개무늬 한 마디(10×10)를 위쪽·오른쪽 띠로 이어 붙인 모서리 장식
const KEY = "M0 9.4H10M9.4 9.4V.6H1.6V7.2H7.2V3.4H4.4";
function noeCorner() {
  let s = "";
  for (let i = 0; i < 10; i++) s += `<path d="${KEY}" transform="translate(${i * 10 - 6} 4)"/>`;
  for (let j = 1; j < 10; j++) s += `<path d="${KEY}" transform="translate(84 ${j * 10 + 4}) rotate(90 5 5)"/>`;
  return `<g fill="none" stroke="currentColor" stroke-width="1.1">${s}<path d="M0 2.5H95.5V100M0 15.5H82.5V100" stroke-width=".8"/></g>`;
}
function cornerSvg(motif, id) {
  let body = "";
  if (motif === "lotus") body = `<g transform="translate(100 0) scale(1.9) translate(-50 -50)">${lotus(0.75)}</g>`;
  else if (motif === "noe") body = noeCorner();
  else if (motif === "chilbo") body = `<defs><radialGradient id="${id}-g" cx="1" cy="0" r="1"><stop offset=".15" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><mask id="${id}-m"><rect width="100" height="100" fill="url(#${id}-g)"/></mask>${chilboPat(`${id}-p`, 12)}</defs><rect width="100" height="100" fill="url(#${id}-p)" mask="url(#${id}-m)"/>`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${body}</svg>`;
}
function motif(v) {
  const b = v.back;
  if (!b) return "";
  let inner;
  if (b.layout === "center") inner = `<svg viewBox="0 0 100 100" aria-hidden="true">${b.motif === "taegeuk" ? taegeuk() : lotus()}</svg>`;
  else if (b.layout === "corners") inner = cornerSvg(b.motif, `${v.id}-a`) + cornerSvg(b.motif, `${v.id}-b`);
  else inner = `<svg viewBox="0 0 63 88" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>${b.motif === "aja" ? ajaPat(`${v.id}-f`, 9) : chilboPat(`${v.id}-f`, 8)}</defs><rect width="63" height="88" fill="url(#${v.id}-f)"/></svg>`;
  return `<div class="card__motif card__motif--${b.layout}">${inner}</div>`;
}
const logo = (v) => `<img src="/assets/img/brand/bow-logo-${v.logo}.png" alt="부천활박물관" width="168" height="28">`;

export function card(s, v, no) {
  const c = s.card;
  return `<article class="card ${cls(v)}" data-cat="${CAT[c.cat] || "etc"}" style="--p:${c.power / 1000}">
    <div class="card__photo"><img src="/assets/img/photo/${s.photo}.jpg" alt="${esc(s.name)}" loading="lazy"></div>
    <div class="card__power"><span>전투력</span><b>${c.power}</b></div>
    <div class="card__head"><span class="card__cat">${esc(c.cat)}</span><h3 class="card__name">${esc(s.name)}</h3></div>
    <div class="card__skill"><b class="card__skill-name">${esc(c.skill)}</b><p>${esc(c.text)}</p></div>
    <div class="card__foot">${logo(v)}<span class="card__no">No.${String(no).padStart(2, "0")}</span></div>
  </article>`;
}

export function back(v) {
  const mark = `${logo(v)}<span class="card__backtext">유물 카드</span>`;
  const field = v.back && v.back.layout === "field";
  return `<article class="card ${cls(v)} card--back" data-cat="cannon">${motif(v)}<div class="card__backin">${field ? `<div class="card__plate">${mark}</div>` : mark}</div></article>`;
}

// all: 격자에 나오는 유물 전체(카드 번호 = 가나다순 자리). 카드 내용이 있는 유물만 전투력 높은 순으로 그린다.
export function page(all) {
  const order = [...all].sort((a, b) => a.name.localeCompare(b.name, "ko")).map((s) => s.id);
  const cards = all.filter((s) => s.card).sort((a, b) => b.card.power - a.card.power);
  let n = 0;
  return VARIANTS.map((v) => `<section class="vsec${v.base ? " vsec--sub" : ""}" id="v-${v.id}"><h2><span>시안 ${v.label || ++n}</span>${esc(v.name)}</h2><p>${esc(v.desc)}</p>
    <div class="row">${cards.map((s) => card(s, v, order.indexOf(s.id) + 1)).join("")}${back(v)}</div></section>`).join("");
}
