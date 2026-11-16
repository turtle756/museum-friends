// 아이에게 주는 유물 카드 시안: 같은 카드(사진·이름·전투력·스킬)를 디자인만 바꿔 여러 벌 그린다.
// 카드 내용은 stops.json의 card 칸. 전투력은 고증이 아니라 아이 눈에 세 보이는 정도, 스킬은 설명판 사실을 풀어 쓴 글.
import { esc } from "./core.js";

// logo: 카드 바탕이 어두우면 흰 로고(dark), 밝으면 원색 로고(light)
export const VARIANTS = [
  { id: "gallery", name: "전시실", logo: "dark", desc: "부모 앱과 한 벌. 어두운 바탕, 둥근 사진 창, 흰 알약 전투력." },
  { id: "catalog", name: "한지 도록", logo: "light", desc: "박물관 도록처럼 한지색 바탕과 가는 금색 테두리, 전투력은 빨간 낙관 도장." },
  { id: "full", name: "꽉 찬 사진", logo: "dark", desc: "유물 사진이 카드 전체. 전투력은 오른쪽 위에 아주 크게." },
  { id: "case", name: "진열장", logo: "light", desc: "흰 진열대 위 유물과 박물관 이름표. 전투력은 놋쇠 명패." },
  { id: "plan", name: "설계도", logo: "dark", desc: "남색 모눈 설계도. 전투력만큼 차오르는 동그란 눈금." },
  { id: "bow", name: "활시위", logo: "light", desc: "부천활박물관 로고의 활 곡선과 빨간 마름모를 그대로 쓴 흑백빨강." },
  { id: "target", name: "과녁", logo: "dark", desc: "짙은 초록 활터. 전투력은 과녁 한가운데." },
  { id: "pop", name: "스티커", logo: "light", desc: "굵은 검은 테두리와 종류별 원색. 아이 손에 쥐는 스티커 느낌." },
  { id: "flag", name: "오방색 깃발", logo: "light", desc: "위쪽 오방색 띠와 종류별 깃발에 걸린 전투력." },
  { id: "min", name: "흰 카드", logo: "light", desc: "흰 바탕에 사진을 가로로 꽉 채우고 숫자만 크게. 기념품 엽서 느낌." },
  { id: "vert", name: "세로 이름", logo: "dark", desc: "옛 이름표처럼 이름을 세로로 쓰고, 짙은 먹색 바탕에 금색 글씨." },
  { id: "gold", name: "금테 소장판", logo: "dark", desc: "검은 바탕에 금색 이중 테두리, 금메달 전투력. 모아 두고 싶은 소장 카드." },
];

const CAT = { 총통: "cannon", 신기전: "rocket", 활: "bow", 화살: "arrow" };
const logo = (v) => `<img src="/assets/img/brand/bow-logo-${v.logo}.png" alt="부천활박물관" width="168" height="28">`;

export function card(s, v, no) {
  const c = s.card;
  return `<article class="card card--${v.id}" data-cat="${CAT[c.cat] || "etc"}" style="--p:${c.power / 1000}">
    <div class="card__photo"><img src="/assets/img/photo/${s.photo}.jpg" alt="${esc(s.name)}" loading="lazy"></div>
    <div class="card__power"><span>전투력</span><b>${c.power}</b></div>
    <div class="card__head"><span class="card__cat">${esc(c.cat)}</span><h3 class="card__name">${esc(s.name)}</h3></div>
    <div class="card__skill"><b class="card__skill-name">${esc(c.skill)}</b><p>${esc(c.text)}</p></div>
    <div class="card__foot">${logo(v)}<span class="card__no">No.${String(no).padStart(2, "0")}</span></div>
  </article>`;
}

export function back(v) {
  return `<article class="card card--${v.id} card--back" data-cat="cannon"><div class="card__backin">${logo(v)}<span class="card__backtext">유물 카드</span></div></article>`;
}

// all: 격자에 나오는 유물 전체(카드 번호 = 가나다순 자리). 카드 내용이 있는 유물만 전투력 높은 순으로 그린다.
export function page(all) {
  const order = [...all].sort((a, b) => a.name.localeCompare(b.name, "ko")).map((s) => s.id);
  const cards = all.filter((s) => s.card).sort((a, b) => b.card.power - a.card.power);
  return VARIANTS.map((v, i) => `<section class="vsec" id="v-${v.id}"><h2><span>시안 ${i + 1}</span>${esc(v.name)}</h2><p>${esc(v.desc)}</p>
    <div class="row">${cards.map((s) => card(s, v, order.indexOf(s.id) + 1)).join("")}${back(v)}</div></section>`).join("");
}
