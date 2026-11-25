// 아이에게 주는 유물 카드(코팅한 실물 카드로 인쇄). 카드 내용은 stops.json의 card 칸(종류, 전투력, 스킬 이름, 뒷면 이야기, 그림).
// 전투력은 고증이 아니라 아이 눈에 세 보이는 정도. 앞면에는 설명글을 두지 않는다(그림·이름·전투력·스킬 이름만).
// 최종: 5-1 설계도 틀 + AI 그림 12장. 인쇄는 tools/print_cards.mjs(A4 PDF, 실제 크기 63×88mm).
import { esc } from "./core.js";

const CAT = { 총통: "cannon", 신기전: "rocket", 활: "bow", 화살: "arrow" };
const CLS = "card card--plan";
// 카드 제목: 격자 이름과 다르게 쓸 때만 card.name (예: 격자 "각궁 (김장환 제작)" → 카드 "각궁")
const cname = (s) => s.card.name || s.name;
// 남색 바탕이라 흰 로고
const logo = `<img src="/assets/img/brand/bow-logo-dark.png" alt="부천활박물관" width="168" height="28">`;

// 만화식 말풍선: 그림 위에 HTML로 얹는다(생성 그림에 한글을 쓰게 하면 글자가 깨져서). x·y는 그림 칸 기준 %, tail은 꼬리 방향.
const TAILS = ["left", "right", "down"];   // 꼬리 방향: 왼쪽·오른쪽(가운데 높이), 아래(왼쪽에서 1/3 지점)
const bubble = (b) => (b ? `<div class="bubble bubble--${TAILS.includes(b.tail) ? b.tail : "left"}" style="left:${+b.x}%;top:${+b.y}%">${esc(b.text).replace(/\n/g, "<br>")}</div>` : "");

// 아이 카드 12장: 카드 내용이 있는 유물, 전투력 높은 순. 카드 번호 No.01~ 도 이 순서.
export const kidCards = (all) => all.filter((s) => s.card).sort((a, b) => b.card.power - a.card.power);

// 앞면: 그림(card.art[0]) + 말풍선, 전투력 눈금, 종류·이름, 스킬 이름, 로고·번호
export function card(s, no) {
  const c = s.card, art = (c.art || [])[0];
  const src = art ? `/assets/img/art/${art.file}` : `/assets/img/photo/${s.photo}.jpg`;
  return `<article class="${CLS}" data-cat="${CAT[c.cat] || "etc"}" style="--p:${c.power / 1000}">
    <div class="card__photo${art ? " card__photo--art" : ""}"><img src="${src}" alt="${esc(cname(s))}">${art ? bubble(art.bubble) : ""}</div>
    <div class="card__power"><span>전투력</span><b>${c.power}</b></div>
    <div class="card__head"><span class="card__cat">${esc(c.cat)}</span><h3 class="card__name">${esc(cname(s))}</h3></div>
    <div class="card__skill">${c.skills.map((k) => `<b class="card__skill-name">${esc(k)}</b>`).join("")}</div>
    <div class="card__foot">${logo}<span class="card__no">No.${String(no).padStart(2, "0")}</span></div>
  </article>`;
}

// 뒷면: 유물 이름과 이야기 + 로고 (무늬·이름판 없이 카드 바탕 위에 그대로)
export function back(s) {
  return `<article class="${CLS} card--back"><div class="card__backin"><div class="card__story"><h4>${esc(cname(s))}</h4><p>${esc(s.card.story)}</p></div>${logo}</div></article>`;
}

// 인쇄 쪽: A4 한 쪽에 3×3장. 앞면 쪽 다음에 같은 카드의 뒷면 쪽이 오고, 뒷면은 줄마다 좌우를 뒤집어
// 양면 인쇄(긴 쪽 넘김)에서 앞뒤가 맞는다. 빈칸은 자리만 차지해 뒤집힌 위치가 어긋나지 않게 한다.
export function sheets(all, per = 9, cols = 3) {
  const list = kidCards(all), out = [];
  const empty = '<div class="sheet__empty"></div>';
  for (let i = 0; i < list.length; i += per) {
    const page = list.slice(i, i + per);
    const fronts = page.map((s, k) => card(s, i + k + 1));
    while (fronts.length % cols) fronts.push(empty);
    const backs = [];
    for (let r = 0; r < fronts.length / cols; r++) {
      const row = page.slice(r * cols, r * cols + cols).map(back);
      while (row.length < cols) row.push(empty);
      backs.push(...row.reverse());
    }
    out.push(`<section class="sheet sheet--front"><div class="sheet__grid">${fronts.join("")}</div></section>`);
    out.push(`<section class="sheet sheet--back"><div class="sheet__grid">${backs.join("")}</div></section>`);
  }
  return out.join("\n");
}
