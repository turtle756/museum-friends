// 부천활박물관 부모 카드: 유물 격자(2열, 틈 없음, 가나다순) → 유물 카드(C1) → 듀오링고식 퀴즈.
// 11/9 확정: 격자 G1(사진 + 이름 얹기), 카드 사진 H2(둥근 카드), 본 유물 표시, 기본 어두운 화면 + 밝은 화면 전환.
// 11/12: 첫 화면 머리는 인스타 프로필식(공식 로고 · 숫자 · 한 줄 소개), 듀오링고식 반응(눌림, 결과 표시, 진동, 색종이).
import { esc } from "./core.js";

const icon = (d, w = 2.2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ARROW_LEFT = icon('<path d="M15 5l-7 7 7 7"/>', 2.4);
const CHECK = icon('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 3);
const CLOSE = icon('<path d="M6 6l12 12M18 6L6 18"/>', 2.6);
const SUN = icon('<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>', 2);
const MOON = icon('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>', 2);

// ---------- 기기에 남기는 것: 본 유물, 밝게/어둡게 (저장 못 해도 화면은 동작) ----------
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* 무시 */ } },
};
export function loadSeen() { try { return new Set(JSON.parse(store.get("mf-seen") || "[]")); } catch { return new Set(); } }
export function markSeen(id) { const s = loadSeen(); s.add(id); store.set("mf-seen", JSON.stringify([...s])); return s; }
export function clearSeen() { store.set("mf-seen", "[]"); return new Set(); }
export function getTheme() { return store.get("mf-theme") === "light" ? "light" : "dark"; }
export function setTheme(v) { store.set("mf-theme", v); document.documentElement.dataset.theme = v; }
export const sortKo = (list) => [...list].sort((a, b) => a.name.localeCompare(b.name, "ko"));

// ---------- 격자 ----------
export function tile(s, o = {}) {
  const seen = o.seen && o.seen.has(s.id) ? `<span class="tile__seen${o.fresh === s.id ? " is-new" : ""}" title="본 유물">${CHECK}</span>` : "";
  return `<a class="tile${seen ? " is-seen" : ""}" href="#/a/${s.id}" data-id="${s.id}"><img src="/assets/img/photo/${s.photo}.jpg" alt="${esc(s.name)}" loading="lazy"><span class="tile__name">${esc(s.name)}</span>${seen}</a>`;
}

export function home(items, o = {}) {
  const list = sortKo(items);
  const n = o.seen ? list.filter((s) => o.seen.has(s.id)).length : 0;
  const light = o.theme === "light";
  const logo = (v) => `<img class="logo logo--${v}" src="/assets/img/brand/bow-logo-${v}.png" alt="부천활박물관" width="168" height="28">`;
  return `<div class="home__bar"><h1 class="home__logo">${logo("dark")}${logo("light")}</h1>
      <button type="button" class="themebtn" data-theme-toggle aria-label="${light ? "어둡게 보기" : "밝게 보기"}">${light ? MOON : SUN}</button></div>
    <header class="home__head"><div class="home__stats"><span><b>${list.length}</b> 유물</span><span${o.fresh ? ' class="is-bump"' : ""}><b>${n}</b> 봤어요</span></div>
      <p class="home__bio">아이와 함께 보는 유물 이야기 카드</p></header>
    <div class="feed">${list.map((s) => tile(s, o)).join("")}</div>
    <footer class="home__foot">${n ? '<button type="button" class="linkbtn" data-clear-seen>본 표시 모두 지우기</button><br>' : ""}시안 · 학예사 검수 전. 내용은 박물관 설명판 원문을 옮긴 것입니다.</footer>`;
}

// 격자 사진: 다 받아지면 서서히 나타나게 (이미 받아 둔 사진은 바로)
export function settle(root) {
  root.querySelectorAll(".tile img").forEach((img) => {
    const show = () => img.classList.add("is-in");
    if (img.complete) show(); else { img.addEventListener("load", show, { once: true }); img.addEventListener("error", show, { once: true }); }
  });
}

// ---------- 유물 카드 (C1: 한마디 → 볼 곳 → 이야기 → 질문 → 퀴즈 → 더 물어보면) ----------
const sec = (cls, label, text) => (text ? `<section class="sec sec--${cls}"><div class="sec__label">${label}</div><div class="sec__text">${esc(text)}</div></section>` : "");
export const quizzes = (s) => [s.quiz, ...(s.extraQuiz || [])].filter(Boolean);

export function detail(s, o = {}) {
  const back = o.noBack ? "" : `<a class="back" href="#/" aria-label="목록으로">${ARROW_LEFT}</a>`;
  const quiz = quizzes(s).length ? `<button type="button" class="btn-quiz" data-quiz="${s.id}">퀴즈로 물어보기</button>` : "";
  const more = s.more ? `<details class="more"><summary>아이가 더 물어보면</summary><p>${esc(s.more)}</p><p class="src">근거: ${esc(s.source)}</p></details>`
    : `<p class="src">근거: ${esc(s.source)}</p>`;
  return `<article class="detail"><div class="hero-card"><div class="hero hero--rounded"><img src="/assets/img/photo/${s.photo}.jpg" alt="${esc(s.name)}"></div>${back}</div>
    <div class="d__body"><div><div class="d__zone">${esc(s.zone)}</div><h1 class="d__title">${esc(s.headline)}</h1></div>
    ${sec("look", "같이 볼 곳", s.look)}${sec("tell", "들려줄 이야기", s.tell)}${sec("ask", "물어볼 것", s.ask)}${quiz}${more}
    ${o.noBack ? "" : '<a class="btn-wide" href="#/">다른 유물 보기</a>'}</div></article>`;
}

// ---------- 듀오링고식 퀴즈 ----------
const calm = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
// 소리 대신 진동 (전시실은 조용해야 해서). 아이폰 사파리는 진동을 지원하지 않아 그냥 넘어간다.
const buzz = (pattern) => { try { if (navigator.vibrate) navigator.vibrate(pattern); } catch { /* 무시 */ } };
// 다 맞혔을 때 색종이: 점수 위치에서 터져 위로 솟았다가 떨어진다. 색은 듀오링고 신호색.
function confetti(host) {
  if (calm() || !Element.prototype.animate) return;
  const colors = ["#58cc02", "#ffc800", "#1cb0f6", "#ff4b4b", "#ce82ff", "#fafafa"];
  const layer = document.createElement("div");
  layer.className = "confetti";
  host.append(layer);
  const w = host.clientWidth, h = host.clientHeight;
  for (let k = 0; k < 64; k++) {
    const p = document.createElement("i");
    p.style.background = colors[k % colors.length];
    if (k % 3 === 0) p.style.borderRadius = "50%";
    layer.append(p);
    const dx = (Math.random() - 0.5) * w, up = h * (0.18 + Math.random() * 0.22), spin = (Math.random() - 0.5) * 1440;
    p.animate([
      { transform: "translate(0, 0) rotate(0deg)", opacity: 1, easing: "cubic-bezier(.15, .7, .3, 1)" },
      { transform: `translate(${dx * 0.55}px, ${-up}px) rotate(${spin * 0.4}deg)`, opacity: 1, offset: 0.3, easing: "cubic-bezier(.5, 0, .9, .5)" },
      { transform: `translate(${dx}px, ${h * 0.7}px) rotate(${spin}deg)`, opacity: 0 },
    ], { duration: 1500 + Math.random() * 800, delay: Math.random() * 100, fill: "forwards" });
  }
  setTimeout(() => layer.remove(), 2600);
}
// 부모가 아이에게 문제를 읽어 주고, 아이가 말한 답을 부모가 누른다. 하트·연속 기록·순위는 넣지 않는다.
export function openQuiz(root, s, onDone) {
  const qs = quizzes(s);
  let i = 0, picked = null, right = 0;
  const box = document.createElement("div");
  box.className = "quiz";
  root.append(box);
  const close = () => { box.classList.add("quiz--out"); setTimeout(() => box.remove(), 220); };
  const top = (w) => `<div class="quiz__top"><button class="quiz__x" type="button" data-q="close" aria-label="닫기">${CLOSE}</button>
    <div class="quiz__bar"><span style="width:${w}%"></span></div></div>`;
  function step(dir) {
    const q = qs[i];
    picked = null;
    box.innerHTML = `${top((i / qs.length) * 100)}
      <div class="quiz__stage quiz__stage--${dir}"><div class="quiz__hint-label">아이에게 물어보세요</div>
        <div class="quiz__q">${esc(q.q)}</div>
        <div class="quiz__choices">${q.choices.map((c) => `<button type="button" class="quiz__c" data-q="pick" data-v="${esc(c)}">${esc(c)}</button>`).join("")}</div>
        ${q.hint ? `<button type="button" class="quiz__hintbtn" data-q="hint">힌트 보기</button><div class="quiz__hint" hidden>${esc(q.hint)}</div>` : ""}</div>
      <div class="quiz__foot"><button type="button" class="quiz__go" data-q="check" disabled>확인</button></div>`;
  }
  function finish() {
    box.innerHTML = `${top(100)}<div class="quiz__stage quiz__stage--next quiz__end"><div class="quiz__big">${right}/${qs.length}</div>
        <div class="quiz__q">${right === qs.length ? "다 맞혔어요!" : "잘했어요!"}</div><p class="quiz__endtext">이제 이야기를 들려줄 차례예요.</p></div>
      <div class="quiz__foot"><button type="button" class="quiz__go" data-q="done">이야기 보기</button></div>`;
    if (right === qs.length) { buzz([15, 50, 15]); confetti(box); }
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
      buzz(ok ? 20 : [40, 60, 40]);
      box.querySelector(".quiz__bar span").style.width = `${((i + 1) / qs.length) * 100}%`;
      box.querySelectorAll(".quiz__c").forEach((x) => {
        if (x.dataset.v === q.answer) x.classList.add("is-right");
        else if (x.classList.contains("is-on")) x.classList.add("is-wrong");
        x.disabled = true;
      });
      box.querySelector(".quiz__foot").outerHTML = `<div class="quiz__sheet quiz__sheet--${ok ? "ok" : "bad"}"><div class="quiz__verdict"><span class="quiz__mark">${ok ? CHECK : CLOSE}</span>${ok ? "정답이에요!" : "아쉬워요"}</div>
        <div class="quiz__answer">${ok ? "아이에게 크게 칭찬해 주세요." : `정답은 <b>${esc(q.answer)}</b>`}</div>
        <button type="button" class="quiz__go" data-q="next">계속</button></div>`;
    } else if (act === "next") {
      i++;
      if (i < qs.length) step("next"); else finish();
    } else if (act === "done") { close(); if (onDone) onDone(); }
  });
  step("open");
}

export function wireQuiz(root, getItem) {
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-quiz]");
    if (!b) return;
    const s = getItem(b.dataset.quiz);
    if (s) openQuiz(root, s, () => root.querySelector(".sec--tell")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  });
}
