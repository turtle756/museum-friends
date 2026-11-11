// 부천활박물관 부모 카드: 유물 격자(2열, 틈 없음, 가나다순) → 유물 카드(C1) → 듀오링고식 퀴즈.
// 11/9 확정: 격자 G1(사진 + 이름 얹기), 카드 사진 H2(둥근 카드), 본 유물 표시, 기본 어두운 화면 + 밝은 화면 전환.
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
  const seen = o.seen && o.seen.has(s.id) ? `<span class="tile__seen" title="본 유물">${CHECK}</span>` : "";
  return `<a class="tile${seen ? " is-seen" : ""}" href="#/a/${s.id}" data-id="${s.id}"><img src="/assets/img/photo/${s.photo}.jpg" alt="${esc(s.name)}" loading="lazy"><span class="tile__name">${esc(s.name)}</span>${seen}</a>`;
}

export function home(items, o = {}) {
  const list = sortKo(items);
  const n = o.seen ? list.filter((s) => o.seen.has(s.id)).length : 0;
  const light = o.theme === "light";
  return `<header class="home__head"><button type="button" class="themebtn" data-theme-toggle aria-label="${light ? "어둡게 보기" : "밝게 보기"}">${light ? MOON : SUN}</button>
    <div class="home__brand"><img src="/assets/img/brand/bucheon-bow-museum.png" alt="부천활박물관" width="57" height="49"></div>
    <h1 class="home__title">아이가 멈춘 곳을<br>눌러 주세요</h1><div class="home__sub">유물 ${list.length}점 · 가나다순${n ? ` · ${n}점 봤어요` : ""}</div></header>
    <div class="feed">${list.map((s) => tile(s, o)).join("")}</div>
    <footer class="home__foot">${n ? '<button type="button" class="linkbtn" data-clear-seen>본 표시 모두 지우기</button><br>' : ""}시안 · 학예사 검수 전. 내용은 박물관 설명판 원문을 옮긴 것입니다.</footer>`;
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
      box.querySelector(".quiz__foot").outerHTML = `<div class="quiz__sheet quiz__sheet--${ok ? "ok" : "bad"}"><div class="quiz__verdict">${ok ? "정답이에요!" : "아쉬워요"}</div>
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
