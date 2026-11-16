// 아이에게 주는 유물 카드. 카드 내용은 stops.json의 card 칸(종류, 전투력, 스킬 이름, 뒷면 이야기).
// 전투력은 고증이 아니라 아이 눈에 세 보이는 정도. 앞면에는 설명글을 두지 않는다(사진·이름·전투력·스킬 이름만).
// 11/16 결정: 5-1(설계도, 뒷면은 무늬·이름판 없이 깨끗하게). 2-1(한지 도록 + 금색 포인트)은 예비(뒷면 역시 무늬 없음). 나머지 시안은 삭제(git 기록에 남음).
import { esc } from "./core.js";

// logo: 카드 바탕이 어두우면 흰 로고(dark), 밝으면 원색 로고(light)
export const VARIANTS = [
  { id: "plan-back", base: "plan", label: "5-1", tag: "결정", name: "설계도 · 깨끗한 뒷면", logo: "dark", back: { layout: "plain" },
    desc: "남색 모눈 설계도, 전투력만큼 차오르는 동그란 눈금. 뒷면은 모눈 위에 이름·이야기·로고만." },
  { id: "catalog-gold", base: "catalog", label: "2-1", tag: "예비", name: "한지 도록 · 금색 포인트", logo: "light", back: { layout: "plain" },
    desc: "한지색 바탕, 금색 이중 테두리, 빨간 낙관 도장 전투력. 뒷면은 한지 바탕 위에 이름·이야기·로고만." },
];

const CAT = { 총통: "cannon", 신기전: "rocket", 활: "bow", 화살: "arrow" };
const cls = (v) => `card--${v.base} card--${v.id}`;

const logo = (v) => `<img src="/assets/img/brand/bow-logo-${v.logo}.png" alt="부천활박물관" width="168" height="28">`;

// 만화식 말풍선: 그림 위에 HTML로 얹는다(생성 그림에 한글을 쓰게 하면 글자가 깨져서). x·y는 사진 칸 기준 %, tail은 꼬리 방향.
const TAILS = ["left", "right", "down"];   // 꼬리 방향: 왼쪽·오른쪽(가운데 높이), 아래(왼쪽에서 1/3 지점)
const bubble = (b) => (b ? `<div class="bubble bubble--${TAILS.includes(b.tail) ? b.tail : "left"}" style="left:${+b.x}%;top:${+b.y}%">${esc(b.text).replace(/\n/g, "<br>")}</div>` : "");

// art: 사진 대신 쓸 생성 그림 { file, bubble? } (/assets/img/art/). 없으면 실제 사진.
export function card(s, v, no, art) {
  const c = s.card;
  const src = art ? `/assets/img/art/${art.file}` : `/assets/img/photo/${s.photo}.jpg`;
  return `<article class="card ${cls(v)}" data-cat="${CAT[c.cat] || "etc"}" style="--p:${c.power / 1000}">
    <div class="card__photo${art ? " card__photo--art" : ""}"><img src="${src}" alt="${esc(s.name)}" loading="lazy">${art ? bubble(art.bubble) : ""}</div>
    <div class="card__power"><span>전투력</span><b>${c.power}</b></div>
    <div class="card__head"><span class="card__cat">${esc(c.cat)}</span><h3 class="card__name">${esc(s.name)}</h3></div>
    <div class="card__skill">${c.skills.map((k) => `<b class="card__skill-name">${esc(k)}</b>`).join("")}</div>
    <div class="card__foot">${logo(v)}<span class="card__no">No.${String(no).padStart(2, "0")}</span></div>
  </article>`;
}

// 뒷면: 유물 이름과 이야기 + 로고 (무늬·이름판 없이 카드 바탕 위에 그대로)
export function back(v, s) {
  return `<article class="card ${cls(v)} card--back" data-cat="cannon"><div class="card__backin"><div class="card__story"><h4>${esc(s.name)}</h4><p>${esc(s.card.story)}</p></div>${logo(v)}</div></article>`;
}

// all: 격자에 나오는 유물 전체(카드 번호 = 가나다순 자리). 카드 내용이 있는 유물만 전투력 높은 순으로 그린다.
export function page(all) {
  const order = [...all].sort((a, b) => a.name.localeCompare(b.name, "ko")).map((s) => s.id);
  const cards = all.filter((s) => s.card).sort((a, b) => b.card.power - a.card.power);
  // 그림 카드 8장(기획자가 고른 한 장씩): 유명 만화 장면의 자세를 빌린 우리 캐릭터, 유물은 실제 사진을 참조해 생성. 앞면·뒷면 짝으로.
  const v0 = VARIANTS[0], arts = cards.filter((s) => s.card.art && s.card.art.length);
  const artSec = arts.length ? `<section class="vsec" id="v-art"><h2><span>그림 카드 · 고른 ${arts.length}장</span>5-1 틀</h2><p>앞면과 뒷면을 짝지어 놓았습니다. 유명 만화 장면의 자세를 빌린 우리 캐릭터, 유물은 실제 사진을 참조해 그림.</p>
    <div class="row">${arts.map((s) => card(s, v0, order.indexOf(s.id) + 1, s.card.art[0]) + back(v0, s)).join("")}</div></section>` : "";
  return artSec + VARIANTS.map((v) => `<section class="vsec" id="v-${v.id}"><h2><span>시안 ${v.label} · ${v.tag}</span>${esc(v.name)}</h2><p>${esc(v.desc)}</p>
    <div class="row">${cards.map((s) => card(s, v, order.indexOf(s.id) + 1)).join("")}${back(v, cards[0])}</div></section>`).join("");
}
