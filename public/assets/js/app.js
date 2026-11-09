// 앱 시안: 유물 격자(2열, 틈 없음) → 유물 카드. 고를 것 탭들도 이 그리기 함수를 빌려 쓴다.
import { esc } from "./core.js";

export const LAYOUTS = { C1: "한마디형 + 퀴즈", C8: "퀴즈 먼저", C3: "대본형" };
export const DEFAULTS = { layout: "C1", img: "photo", name: "over", hero: "photo" };
// 배경을 지운 사진이 있는 유물 (그림 처리 탭 시험용, 손질 전)
const CUTS = { rest: "rest", making: "making", singijeon: "singijeon" };

const ARROW_LEFT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';

function picture(s, mode) {
  if (mode === "cut" && CUTS[s.id]) return { src: `/assets/img/cut/${CUTS[s.id]}.png`, cut: true };
  return { src: `/assets/img/photo/${s.photo}.jpg`, cut: false };
}

export function tile(s, o = {}) {
  const mode = o.img || DEFAULTS.img, name = o.name || DEFAULTS.name;
  const p = picture(s, mode);
  const imgStyle = mode === "bw" ? ' style="filter:grayscale(1) contrast(1.1)"' : "";
  const inner = mode === "text"
    ? `<div class="tile__text">${esc(s.name)}</div>`
    : `<img src="${p.src}" alt="${esc(s.name)}" loading="lazy"${imgStyle}${p.cut ? ' class="is-cut"' : ""}>`;
  const label = name === "over" && mode !== "text" ? `<span class="tile__name">${esc(s.name)}</span>` : "";
  const below = name === "below" ? `<span class="tile__below">${esc(s.name)}</span>` : "";
  return `<a class="tile${p.cut ? " tile--cut" : ""}${name === "below" ? " tile--below" : ""}" href="#/a/${s.id}" data-id="${s.id}">${inner}${label}${below}</a>`;
}

export function home(stops, o = {}) {
  return `<header class="home__head"><div class="home__brand"><img src="/assets/img/brand/bucheon-bow-museum.png" alt="부천활박물관" width="57" height="49"></div>
    <h1 class="home__title">아이가 멈춘 곳을<br>눌러 주세요</h1><div class="home__sub">유물 ${stops.length}점 · 순서 없이 골라 보세요</div></header>
    <div class="feed">${stops.map((s) => tile(s, o)).join("")}</div>
    <footer class="home__foot">시안 · 학예사 검수 전. 내용은 박물관 설명판 원문을 옮긴 것입니다.</footer>`;
}

function hero(s, o) {
  const mode = o.hero || DEFAULTS.hero;
  const back = o.noBack ? "" : `<a class="back" href="#/" aria-label="목록으로">${ARROW_LEFT}</a>`;
  if (mode === "cut" && CUTS[s.id]) return `<div class="hero hero--cut"><img src="/assets/img/cut/${CUTS[s.id]}.png" alt="${esc(s.name)}">${back}</div>`;
  if (mode === "card") return `<div class="hero-card"><div class="hero hero--rounded"><img src="/assets/img/photo/${s.photo}.jpg" alt="${esc(s.name)}"></div>${back}</div>`;
  const bw = mode === "bw" ? ' style="filter:grayscale(1) contrast(1.1)"' : "";
  return `<div class="hero"><img src="/assets/img/photo/${s.photo}.jpg" alt="${esc(s.name)}"${bw}>${back}</div>`;
}

const sec = (cls, label, text) => `<section class="sec sec--${cls}"><div class="sec__label">${label}</div><div class="sec__text">${esc(text)}</div></section>`;
const quizBtn = (s, label) => (s.quiz ? `<button type="button" class="btn-quiz" data-quiz="${s.id}">${label}</button>` : "");
const more = (s) => `<details class="more"><summary>아이가 더 물어보면</summary><p>${esc(s.more)}</p><p class="src">근거: ${esc(s.source)}</p></details>`;

const BODY = {
  C1: (s) => `${sec("look", "같이 볼 곳", s.look)}${sec("tell", "들려줄 이야기", s.tell)}${sec("ask", "물어볼 것", s.ask)}${quizBtn(s, "퀴즈로 물어보기")}${more(s)}`,
  C3: (s) => `<div class="sec__label">이렇게 말해 보세요</div><div class="bubbles">
      <div class="bub">"우리 이거 같이 보자. ${esc(s.look.replace(/보세요\.$/, "보자."))}"</div>
      <div class="bub">"${esc(s.tell)}"</div><div class="bub bub--ask">"${esc(s.ask)}"</div></div>${more(s)}`,
  C8: (s) => `<section class="quizcard"><div class="sec__label">활동지 문제 · ${quizzes(s).length}개</div><div class="quizcard__q">${esc(s.quiz.q)}</div>
      ${quizBtn(s, "퀴즈 시작")}</section>
      ${sec("look", "같이 볼 곳", s.look)}${sec("tell", "들려줄 이야기", s.tell)}${more(s)}`,
};

export function detail(s, o = {}) {
  const layout = BODY[o.layout] ? o.layout : DEFAULTS.layout;
  return `<article class="detail">${hero(s, o)}<div class="d__body">
    <div><div class="d__zone">${esc(s.zone)}</div><h1 class="d__title">${esc(s.headline)}</h1></div>
    ${BODY[layout](s)}
    ${o.noBack ? "" : '<a class="btn-wide" href="#/">다른 유물 보기</a>'}</div></article>`;
}

export function wire(root) {
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-ladder]");
    if (!b) return;
    const open = b.getAttribute("aria-expanded") !== "true";
    b.setAttribute("aria-expanded", String(open));
    b.nextElementSibling.hidden = !open;
  });
}

// ---------- 듀오링고식 퀴즈 (C1 아래 버튼, C8은 퀴즈 먼저) ----------
// 부모가 아이에게 문제를 읽어 주고, 아이가 말한 답을 부모가 누른다. 하트·연속 기록·순위는 넣지 않는다.
const CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
export const quizzes = (s) => [s.quiz, ...(s.extraQuiz || [])].filter(Boolean);

export function openQuiz(root, s, onDone) {
  const qs = quizzes(s);
  let i = 0, picked = null, right = 0;
  const frame = root.closest(".dphone__screen");
  if (frame) { frame.scrollTop = 0; frame.style.overflow = "hidden"; }
  const box = document.createElement("div");
  box.className = "quiz";
  root.append(box);
  const close = () => { box.classList.add("quiz--out"); setTimeout(() => box.remove(), 220); if (frame) frame.style.overflow = ""; };
  function step(dir = "next") {
    const q = qs[i];
    picked = null;
    box.innerHTML = `<div class="quiz__top"><button class="quiz__x" type="button" data-q="close" aria-label="닫기">${CLOSE}</button>
      <div class="quiz__bar"><span style="width:${(i / qs.length) * 100}%"></span></div></div>
      <div class="quiz__stage quiz__stage--${dir}"><div class="quiz__hint-label">아이에게 물어보세요</div>
        <div class="quiz__q">${esc(q.q)}</div>
        <div class="quiz__choices">${q.choices.map((c) => `<button type="button" class="quiz__c" data-q="pick" data-v="${esc(c)}">${esc(c)}</button>`).join("")}</div>
        ${q.hint ? `<button type="button" class="quiz__hintbtn" data-q="hint">힌트 보기</button><div class="quiz__hint" hidden>${esc(q.hint)}</div>` : ""}</div>
      <div class="quiz__foot"><button type="button" class="quiz__go" data-q="check" disabled>확인</button></div>`;
  }
  function finish() {
    box.innerHTML = `<div class="quiz__top"><button class="quiz__x" type="button" data-q="close" aria-label="닫기">${CLOSE}</button>
      <div class="quiz__bar"><span style="width:100%"></span></div></div>
      <div class="quiz__stage quiz__stage--next quiz__end"><div class="quiz__big">${right}/${qs.length}</div>
        <div class="quiz__q">${right === qs.length ? "다 맞혔어요!" : "잘했어요!"}</div>
        <p class="quiz__endtext">이제 이야기를 들려줄 차례예요.</p></div>
      <div class="quiz__foot"><button type="button" class="quiz__go" data-q="done">이야기 보기</button></div>`;
  }
  box.addEventListener("click", (e) => {
    const b = e.target.closest("[data-q]");
    if (!b) return;
    const act = b.dataset.q, q = qs[i];
    if (act === "close") close();
    else if (act === "hint") { b.nextElementSibling.hidden = false; b.remove(); }
    else if (act === "pick" && !box.querySelector(".quiz__sheet")) {
      picked = b.dataset.v;
      box.querySelectorAll(".quiz__c").forEach((x) => x.classList.toggle("is-on", x === b));
      box.querySelector(".quiz__go").disabled = false;
    } else if (act === "check" && picked !== null) {
      const ok = picked === q.answer;
      if (ok) right++;
      box.querySelector(".quiz__bar span").style.width = `${((i + 1) / qs.length) * 100}%`;
      box.querySelectorAll(".quiz__c").forEach((x) => {
        if (x.dataset.v === q.answer) x.classList.add("is-right");
        else if (x.classList.contains("is-on")) x.classList.add("is-wrong");
        x.disabled = true;
      });
      const foot = box.querySelector(".quiz__foot");
      foot.outerHTML = `<div class="quiz__sheet quiz__sheet--${ok ? "ok" : "bad"}"><div class="quiz__verdict">${ok ? "정답이에요!" : "아쉬워요"}</div>
        <div class="quiz__answer">${ok ? "아이에게 크게 칭찬해 주세요." : `정답은 <b>${esc(q.answer)}</b>`}</div>
        <button type="button" class="quiz__go" data-q="next">계속</button></div>`;
    } else if (act === "next") {
      i++;
      if (i < qs.length) step("next"); else finish();
    } else if (act === "done") { close(); if (onDone) onDone(); }
  });
  step("open");
}

export function wireQuiz(root, getStop) {
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-quiz]");
    if (!b) return;
    const host = b.closest(".app") || root;
    const s = getStop(b.dataset.quiz);
    if (s) openQuiz(host, s, () => host.querySelector(".sec--tell")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  });
}
