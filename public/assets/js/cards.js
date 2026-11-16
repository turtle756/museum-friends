// 아이에게 주는 유물 카드. 카드 내용은 stops.json의 card 칸(종류, 전투력, 스킬 이름, 뒷면 이야기).
// 전투력은 고증이 아니라 아이 눈에 세 보이는 정도. 앞면에는 설명글을 두지 않는다(사진·이름·전투력·스킬 이름만).
// 11/16 결정: 5-1(설계도 + 뒷면 칠보문). 2-1(한지 도록 + 금색 포인트)은 예비. 나머지 시안은 삭제(git 기록에 남음).
import { esc } from "./core.js";

// logo: 카드 바탕이 어두우면 흰 로고(dark), 밝으면 원색 로고(light)
export const VARIANTS = [
  { id: "plan-back", base: "plan", label: "5-1", tag: "결정", name: "설계도 · 뒷면 칠보문", logo: "dark", back: { motif: "chilbo", layout: "field" },
    desc: "남색 모눈 설계도, 전투력만큼 차오르는 동그란 눈금. 뒷면 전체에 칠보문과 가운데 이름판." },
  { id: "catalog-gold", base: "catalog", label: "2-1", tag: "예비", name: "한지 도록 · 금색 포인트", logo: "light", back: { motif: "lotus", layout: "center" },
    desc: "한지색 바탕, 금색 이중 테두리, 빨간 낙관 도장 전투력. 뒷면 가운데 연화문(수막새 연꽃무늬)." },
];

const CAT = { 총통: "cannon", 신기전: "rocket", 활: "bow", 화살: "arrow" };
const cls = (v) => `card--${v.base} card--${v.id}`;
const f2 = (n) => +n.toFixed(2);

// ---------- 뒷면 전통 문양 (선은 currentColor, 흐리기는 CSS) ----------
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
// 칠보문: 칸 꼭짓점마다 원(반지름 = 칸/√2)을 겹친 무늬
const chilboPat = (id, t) => `<pattern id="${id}" width="${t}" height="${t}" patternUnits="userSpaceOnUse"><g fill="none" stroke="currentColor" stroke-width="${f2(t * 0.05)}">${[[0, 0], [t, 0], [0, t], [t, t]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${f2(t / Math.SQRT2)}"/>`).join("")}</g></pattern>`;
function motif(v) {
  const b = v.back;
  const inner = b.layout === "center"
    ? `<svg viewBox="0 0 100 100" aria-hidden="true">${lotus()}</svg>`
    : `<svg viewBox="0 0 63 88" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>${chilboPat(`${v.id}-f`, 8)}</defs><rect width="63" height="88" fill="url(#${v.id}-f)"/></svg>`;
  return `<div class="card__motif card__motif--${b.layout}">${inner}</div>`;
}
const logo = (v) => `<img src="/assets/img/brand/bow-logo-${v.logo}.png" alt="부천활박물관" width="168" height="28">`;

// art: 사진 대신 쓸 생성 그림 파일 이름(/assets/img/art/). 없으면 실제 사진.
export function card(s, v, no, art) {
  const c = s.card;
  const src = art ? `/assets/img/art/${art}` : `/assets/img/photo/${s.photo}.jpg`;
  return `<article class="card ${cls(v)}" data-cat="${CAT[c.cat] || "etc"}" style="--p:${c.power / 1000}">
    <div class="card__photo${art ? " card__photo--art" : ""}"><img src="${src}" alt="${esc(s.name)}" loading="lazy"></div>
    <div class="card__power"><span>전투력</span><b>${c.power}</b></div>
    <div class="card__head"><span class="card__cat">${esc(c.cat)}</span><h3 class="card__name">${esc(s.name)}</h3></div>
    <div class="card__skill">${c.skills.map((k) => `<b class="card__skill-name">${esc(k)}</b>`).join("")}</div>
    <div class="card__foot">${logo(v)}<span class="card__no">No.${String(no).padStart(2, "0")}</span></div>
  </article>`;
}

// 뒷면: 유물 이름과 이야기 + 로고 (문양 위에)
export function back(v, s) {
  const mark = `<div class="card__story"><h4>${esc(s.name)}</h4><p>${esc(s.card.story)}</p></div>${logo(v)}`;
  const field = v.back.layout === "field";
  return `<article class="card ${cls(v)} card--back" data-cat="cannon">${motif(v)}<div class="card__backin">${field ? `<div class="card__plate">${mark}</div>` : mark}</div></article>`;
}

// all: 격자에 나오는 유물 전체(카드 번호 = 가나다순 자리). 카드 내용이 있는 유물만 전투력 높은 순으로 그린다.
export function page(all) {
  const order = [...all].sort((a, b) => a.name.localeCompare(b.name, "ko")).map((s) => s.id);
  const cards = all.filter((s) => s.card).sort((a, b) => b.card.power - a.card.power);
  // 시험: 생성 그림 카드(유명 장면의 자세를 빌린 우리 캐릭터, 대포는 실제 사진을 참조). 줄 맨 끝은 지금의 사진 카드.
  const v0 = VARIANTS[0], arts = cards.filter((s) => s.card.art && s.card.art.length);
  const artSec = arts.length ? `<section class="vsec" id="v-art"><h2><span>시험 · 그림 카드</span>5-1 틀 + 생성 그림</h2><p>사진 대신 생성한 그림(유명 장면의 자세를 빌린 우리 캐릭터, 대포는 실제 사진을 참조해 그림). 줄 맨 끝은 지금의 사진 카드.</p>
    <div class="row">${arts.map((s) => s.card.art.map((a) => card(s, v0, order.indexOf(s.id) + 1, a)).join("") + card(s, v0, order.indexOf(s.id) + 1)).join("")}</div></section>` : "";
  return artSec + VARIANTS.map((v) => `<section class="vsec" id="v-${v.id}"><h2><span>시안 ${v.label} · ${v.tag}</span>${esc(v.name)}</h2><p>${esc(v.desc)}</p>
    <div class="row">${cards.map((s) => card(s, v, order.indexOf(s.id) + 1)).join("")}${back(v, cards[0])}</div></section>`).join("");
}
