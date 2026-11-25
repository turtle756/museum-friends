// 부천활박물관 부모 카드: 유물 격자(2열, 틈 없음, 가나다순) → 유물 카드(C1) → 듀오링고식 퀴즈.
// 11/9 확정: 격자 G1(사진 + 이름 얹기), 카드 사진 H2(둥근 카드), 퀴즈 푼 유물 체크, 기본 어두운 화면 + 밝은 화면 전환.
// 11/12: 첫 화면 머리는 인스타 프로필식(공식 로고 · 숫자 · 한 줄 소개), 듀오링고식 반응(눌림, 결과 표시, 진동, 색종이).
import { esc } from "./core.js";

const icon = (d, w = 2.2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ARROW_LEFT = icon('<path d="M15 5l-7 7 7 7"/>', 2.4);
const CHECK = icon('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 3);
const CLOSE = icon('<path d="M6 6l12 12M18 6L6 18"/>', 2.6);
const SUN = icon('<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>', 2);
const OUT = icon('<path d="M7 17L17 7M9 7h8v8"/>', 2.2);
const RETRY = icon('<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v3.8h3.8"/>', 2.4);
const MOON = icon('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>', 2);

// ---------- 기기에 남기는 것: 퀴즈를 끝까지 푼 유물(체크), 밝게/어둡게 (저장 못 해도 화면은 동작) ----------
// 11/16: 카드를 열기만 해서는 체크하지 않는다(잘못 누른 카드가 체크되는 실수 방지). 예전 '연 것' 기록과 섞이지 않게 저장 이름도 바꿈.
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* 무시 */ } },
};
export function loadSeen() { try { return new Set(JSON.parse(store.get("mf-done") || "[]")); } catch { return new Set(); } }
export function markSeen(id) { const s = loadSeen(); s.add(id); store.set("mf-done", JSON.stringify([...s])); return s; }
export function clearSeen() { store.set("mf-done", "[]"); store.set("mf-score", "{}"); return new Set(); }
// 퀴즈 결과: 유물마다 가장 잘한 점수 { right, total } (다시 풀어 더 맞히면 바뀜)
export function loadScores() { try { return JSON.parse(store.get("mf-score") || "{}") || {}; } catch { return {}; } }
export function saveScore(id, right, total) {
  const all = loadScores();
  if (!all[id] || right >= all[id].right) all[id] = { right, total };
  store.set("mf-score", JSON.stringify(all));
  return all[id];
}
export function getTheme() { return store.get("mf-theme") === "light" ? "light" : "dark"; }
export function setTheme(v) { store.set("mf-theme", v); document.documentElement.dataset.theme = v; }
export const sortKo = (list) => [...list].sort((a, b) => a.name.localeCompare(b.name, "ko"));
// 검색: 유물 이름에서 띄어쓰기·대소문자를 무시하고 찾는다 ("천자 총통" → 천자총통)
const norm = (t) => String(t || "").replace(/\s+/g, "").toLowerCase();
export const matches = (name, q) => !norm(q) || norm(name).includes(norm(q));
const SEARCH = icon('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>', 2.2);
// 검색어가 바뀔 때 격자를 다시 그리지 않고 칸만 숨긴다 (입력 중 화면이 깜빡이지 않게)
export function filterFeed(root, q) {
  let shown = 0;
  root.querySelectorAll(".feed .tile").forEach((t) => {
    t.hidden = !matches(t.querySelector(".tile__name").textContent, q);
    if (!t.hidden) shown++;
  });
  const empty = root.querySelector("[data-empty]");
  if (empty) empty.hidden = shown > 0;
}

// ---------- 들어가기 전 안내 화면: 아무 곳이나 누르면 격자로 ----------
export function intro() {
  const logo = (v) => `<img class="logo logo--${v}" src="/assets/img/brand/bow-logo-${v}.png" alt="부천활박물관" width="180" height="30">`;
  return `<button type="button" class="intro" data-intro>${logo("dark")}${logo("light")}
    <span class="intro__title">AI에게 묻지 말고<br>여기서 찾아보세요</span>
    <span class="intro__text">이야기 속 숫자와 이름은 모두<br>부천활박물관 설명판에서 가져왔어요.</span>
    <span class="intro__tap">화면을 누르면 시작해요</span></button>`;
}

// ---------- 격자 ----------
export const SITE = "https://www.bcmuseum.or.kr/ko/pages/intro?tab=tab2";   // 공식 사이트의 부천활박물관 소개
export function tile(s, o = {}) {
  const sc = o.scores && o.scores[s.id], retry = !!sc && sc.right < sc.total;   // 틀린 것이 있으면 ✓ 대신 ↻
  const seen = o.seen && o.seen.has(s.id)
    ? `<span class="tile__seen${retry ? " tile__seen--retry" : ""}${o.fresh === s.id ? " is-new" : ""}" title="${retry ? "다시 도전할 유물" : "퀴즈 다 맞힌 유물"}">${retry ? RETRY : CHECK}</span>` : "";
  return `<a class="tile${seen ? " is-seen" : ""}" href="#/a/${s.id}" data-id="${s.id}"${matches(s.name, o.query) ? "" : " hidden"}><img src="/assets/img/photo/${s.photo}.jpg" alt="${esc(s.name)}" loading="lazy"><span class="tile__name">${esc(s.name)}</span>${seen}</a>`;
}

export function home(items, o = {}) {
  const list = sortKo(items);
  const n = o.seen ? list.filter((s) => o.seen.has(s.id)).length : 0;
  const light = o.theme === "light";
  const logo = (v) => `<img class="logo logo--${v}" src="/assets/img/brand/bow-logo-${v}.png" alt="부천활박물관" width="168" height="28">`;
  return `<div class="home__bar"><h1 class="home__logo">${logo("dark")}${logo("light")}</h1>
      <button type="button" class="themebtn" data-theme-toggle aria-label="${light ? "어둡게 보기" : "밝게 보기"}">${light ? MOON : SUN}</button></div>
    <header class="home__head"><div class="home__stats"><span><b>${list.length}</b> 유물</span><span${o.fresh ? ' class="is-bump"' : ""}><b>${n}</b> 풀었어요</span></div>
      <p class="home__bio">아이와 함께 보는 유물 이야기 카드</p></header>
    <label class="search">${SEARCH}<input type="search" data-search value="${esc(o.query || "")}" placeholder="유물 이름으로 찾기" aria-label="유물 이름으로 찾기" autocomplete="off" enterkeyhint="search"></label>
    <div class="feed">${list.map((s) => tile(s, o)).join("")}</div>
    <p class="feed__empty" data-empty${list.some((s) => matches(s.name, o.query)) ? " hidden" : ""}>찾는 유물이 없어요</p>
    <footer class="home__foot"><a class="sitebtn" href="${SITE}" target="_blank" rel="noopener">부천활박물관 공식 사이트${OUT}</a>${n ? '<button type="button" class="linkbtn" data-clear-seen>체크 모두 지우기</button><br>' : ""}이야기 속 숫자와 이름은 부천활박물관 설명판에서 가져왔어요.</footer>`;
}

// 격자 사진: 다 받아지면 서서히 나타나게 (이미 받아 둔 사진은 바로)
export function settle(root) {
  root.querySelectorAll(".tile img").forEach((img) => {
    const show = () => img.classList.add("is-in");
    if (img.complete) show(); else { img.addEventListener("load", show, { once: true }); img.addEventListener("error", show, { once: true }); }
  });
}

// ---------- 유물 카드 (C1: 한마디 → 볼 곳 → 이야기 → 질문 → 퀴즈 → 더 물어보면) ----------
// 11/16 이야기 한 편(story): 첫마디가 제목, 짧은 문단을 이어서. 따옴표로 시작하는 대사 문단은 굵게(훑어 읽기 쉽게),
// ★로 시작하는 줄은 빌드업 끝에 터지는 기술명 한 방 — 크게·금색으로(★ 자체는 보이지 않음).
const storyLine = (raw) => {
  const boom = raw.startsWith("★"), p = boom ? raw.slice(1) : raw;
  const cls = boom ? "say boom" : p.startsWith('"') ? "say" : "";
  return `<p${cls ? ` class="${cls}"` : ""}>${esc(p)}</p>`;
};
const storyHtml = (s) => (s.story ? `<section class="story">${s.story.map(storyLine).join("")}</section>` : "");
export const quizzes = (s) => [s.quiz, ...(s.extraQuiz || [])].filter(Boolean);
// 퀴즈 버튼: 안 풀었으면 흰 버튼, 다 맞혔으면 초록, 틀린 게 있으면 주황 (듀오링고 색)
export function quizBtn(s, score) {
  if (!quizzes(s).length) return "";
  if (!score) return `<button type="button" class="btn-quiz" data-quiz="${s.id}">퀴즈 풀어보기</button>`;
  const perfect = score.right >= score.total;
  return `<button type="button" class="btn-quiz btn-quiz--${perfect ? "perfect" : "retry"}" data-quiz="${s.id}">${perfect ? CHECK : RETRY}`
    + `<span>${perfect ? "다 맞혔어요" : `${score.right}/${score.total} 맞혔어요`}</span><small>${perfect ? "다시 풀기" : "다시 도전"}</small></button>`;
}
const backLogo = (v) => `<img class="logo logo--${v}" src="/assets/img/brand/bow-logo-${v}.png" alt="" width="102" height="17">`;

export function detail(s, o = {}) {
  const back = o.noBack ? "" : `<a class="back back--brand" href="#/" aria-label="목록으로">${ARROW_LEFT}${backLogo("dark")}${backLogo("light")}</a>`;
  const quiz = quizBtn(s, o.score);
  const more = s.more ? `<details class="more" open><summary>아이가 더 물어보면</summary><p>${esc(s.more)}</p><p class="src">근거: ${esc(s.source)}</p></details>`
    : `<p class="src">근거: ${esc(s.source)}</p>`;
  return `<article class="detail"><div class="hero-card"><div class="hero hero--rounded"><img src="/assets/img/photo/${s.photo}.jpg" alt="${esc(s.name)}"></div>${back}</div>
    <div class="d__body"><div><div class="d__zone">${esc(s.zone)}</div><h1 class="d__title">${esc(s.headline)}</h1></div>
    ${storyHtml(s)}${quiz}${more}
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
export function openQuiz(root, s, onDone, onSolved) {
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
    if (onSolved) onSolved(s.id, right, qs.length);   // 마지막 문제까지 답하면 체크(맞고 틀림 무관)와 점수 저장
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

export function wireQuiz(root, getItem, onSolved) {
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-quiz]");
    if (!b) return;
    const s = getItem(b.dataset.quiz);
    if (s) openQuiz(root, s, () => root.querySelector(".sec--tell")?.scrollIntoView({ behavior: "smooth", block: "start" }), onSolved);
  });
}
