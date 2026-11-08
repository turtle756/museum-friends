// 부모 카드 시안 8종. 같은 정류장 내용을 서로 다른 모양으로 보여 준다.
import { esc, icon, stopImage, museumMap } from "./core.js";

const top = (s, total) => `<div class="pcard__top"><span>정류장 ${s.no} / ${total}</span><span>${esc(s.name)}</span></div>`;
const img = (s, theme) => `<div class="pcard__img">${stopImage(s, theme)}</div>`;
const row = (label, text, cls = "") => `<div class="pcard__row ${cls}"><span class="pcard__label">${label}</span><div>${esc(text)}</div></div>`;
const more = (s) => `<details><summary>아이가 더 물어보면</summary><p>${esc(s.more)}</p><p class="small muted">근거: ${esc(s.source)}</p></details>`;

export const CARD_LAYOUTS = [
  {
    id: "C1", name: "한마디형",
    idea: "맨 위 큰 한 줄만 보고도 말을 시작한다. 아래는 볼 곳, 이야기, 질문 순서.",
    pros: ["한 번 보고 바로 말할 수 있다", "정보 순서가 대화 순서와 같다"], cons: ["글이 네 덩어리라 길어 보일 수 있다"],
    render: (s, o) => `${top(s, o.total)}${img(s, o.theme)}<div class="pcard__head">${esc(s.headline)}</div>
      ${row("같이 볼 곳", s.look)}${row("들려줄 이야기", s.tell)}${row("물어볼 것", s.ask, "pcard__ask")}${more(s)}`,
  },
  {
    id: "C2", name: "질문 먼저형",
    idea: "아이에게 던질 퀴즈가 맨 위. 부모는 정답을 눌러서 확인하고 이야기로 넘어간다.",
    pros: ["아이가 바로 참여한다", "종이 퀴즈와 잘 맞는다"], cons: ["이야기보다 퀴즈가 중심이 된다"],
    render: (s, o) => `${top(s, o.total)}<div class="pcard__head">${esc(s.quiz.q)}</div>
      <ul class="choice-list">${s.quiz.choices.map((c) => `<li data-answer="${c === s.quiz.answer}">${esc(c)}</li>`).join("")}</ul>
      <button class="btn btn--gold" data-act="reveal">정답 보기</button>
      <div data-reveal hidden>${row("정답", `${s.quiz.answer}. ${s.quiz.hint || ""}`)}${img(s, o.theme)}${row("들려줄 이야기", s.tell)}</div>`,
  },
  {
    id: "C3", name: "대본형",
    idea: "부모가 그대로 읽어도 되는 말풍선. 말투까지 정해 준다.",
    pros: ["설명이 어려운 부모도 바로 따라 한다"], cons: ["읽는 동안 휴대폰을 오래 본다", "말투가 어색하면 오히려 방해"],
    render: (s, o) => `${top(s, o.total)}${img(s, o.theme)}<p class="pcard__label">이렇게 말해 보세요</p>
      <div class="bubble">"우리 이거 같이 보자. ${esc(s.look.replace(/보세요\.$/, "보자."))}"</div><div class="bubble">"${esc(s.tell)}"</div><div class="bubble pcard__ask">"${esc(s.ask)}"</div>${more(s)}`,
  },
  {
    id: "C4", name: "3칸 만화형",
    idea: "보기, 들려주기, 물어보기를 그림 아이콘 3칸으로. 글은 칸마다 한 줄.",
    pros: ["아이콘만 봐도 순서를 안다", "가장 짧다"], cons: ["이야기의 깊이가 줄어든다"],
    render: (s, o) => `${top(s, o.total)}<div class="pcard__head">${esc(s.headline)}</div>${img(s, o.theme)}
      <div class="panels3"><div class="panel">${icon("look")}<div><b>보기</b><br>${esc(s.look)}</div></div>
      <div class="panel">${icon("talk")}<div><b>들려주기</b><br>${esc(s.tell.split(". ")[0])}.</div></div>
      <div class="panel">${icon("ask")}<div><b>물어보기</b><br>${esc(s.ask)}</div></div></div>${more(s)}`,
  },
  {
    id: "C5", name: "넘기는 카드형",
    idea: "한 화면에 하나씩. 보기, 이야기, 질문을 넘겨 가며 본다.",
    pros: ["한 번에 보는 글이 가장 적다"], cons: ["넘기는 동작이 늘어난다"],
    render: (s, o) => `${top(s, o.total)}<div data-swipe data-i="0">
      <div class="swipe__card" data-step>${img(s, o.theme)}<div class="pcard__head">${esc(s.headline)}</div><div>${esc(s.look)}</div></div>
      <div class="swipe__card" data-step hidden><span class="pcard__label">들려줄 이야기</span><div>${esc(s.tell)}</div></div>
      <div class="swipe__card" data-step hidden><span class="pcard__label">물어볼 것</span><div class="pcard__head pcard__ask">${esc(s.ask)}</div>${more(s)}</div>
      <div class="swipe__dots"><span class="on"></span><span></span><span></span></div>
      <button class="btn" data-act="next">다음</button></div>`,
  },
  {
    id: "C6", name: "체크리스트형",
    idea: "할 일 3개를 체크하며 진행. 다 체크하면 다음 정류장.",
    pros: ["부모가 해냈다는 느낌(성취감)이 생긴다"], cons: ["숙제처럼 느껴질 수 있다"],
    render: (s, o) => `${top(s, o.total)}${img(s, o.theme)}<div class="pcard__head">${esc(s.headline)}</div>
      <ul class="check-list"><li><label><input type="checkbox"><span><b>같이 보기</b> ${esc(s.look)}</span></label></li>
      <li><label><input type="checkbox"><span><b>이야기해 주기</b> ${esc(s.tell)}</span></label></li>
      <li><label><input type="checkbox"><span><b>물어보기</b> ${esc(s.ask)}</span></label></li></ul>`,
  },
  {
    id: "C7", name: "지도 중심형",
    idea: "약도에서 지금 위치를 보여 주고, 그 아래 한마디. 길 찾기가 중심.",
    pros: ["다음 정류장을 찾기 쉽다", "아이가 뛰어가도 위치를 놓치지 않는다"], cons: ["작은 화면에서 지도가 작다"],
    render: (s, o) => `${top(s, o.total)}<div class="mapmini">${museumMap({ stops: o.stops, highlight: s.id, labelZones: false })}</div>
      <div class="pcard__head">${esc(s.headline)}</div>${row("같이 볼 곳", s.look)}${row("들려줄 이야기", s.tell)}${more(s)}`,
  },
  {
    id: "C8", name: "정답지형 (활동지 짝꿍)",
    idea: "아이 활동지의 문제와 짝을 이룬다. 힌트를 단계별로 열어서 '아슬아슬하게' 맞히게 돕는다.",
    pros: ["교수님이 말한 긴장감과 성취감", "부모가 퀴즈 진행자가 된다"], cons: ["활동지가 꼭 있어야 한다"],
    render: (s, o) => `${top(s, o.total)}<p class="pcard__label">활동지 ${s.no}번 문제</p><div class="pcard__head">${esc(s.quiz.q)}</div>
      <div class="ladder"><button data-act="ladder" aria-expanded="false">힌트 1 · 어디를 보면 될까</button><div hidden>${esc(s.look)}</div>
      <button data-act="ladder" aria-expanded="false">힌트 2 · 거의 다 왔어</button><div hidden>${esc(s.quiz.hint || "")}</div>
      <button data-act="ladder" aria-expanded="false">정답</button><div hidden><b>${esc(s.quiz.answer)}</b> · ${esc(s.tell)}</div></div>`,
  },
];

export function renderCard(layoutId, stop, opts) {
  const L = CARD_LAYOUTS.find((l) => l.id === layoutId) || CARD_LAYOUTS[0];
  return `<article class="pcard ${L.id.toLowerCase()} theme-${opts.theme || "pixel"}">${L.render(stop, opts)}</article>`;
}

export function wireCards(root) {
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const card = b.closest(".pcard");
    if (b.dataset.act === "reveal") {
      card.querySelector("[data-reveal]").hidden = false;
      card.querySelectorAll('.choice-list li[data-answer="true"]').forEach((li) => li.classList.add("is-answer"));
      b.hidden = true;
    } else if (b.dataset.act === "next") {
      const box = b.closest("[data-swipe]");
      const steps = box.querySelectorAll("[data-step]");
      const i = (Number(box.dataset.i) + 1) % steps.length;
      box.dataset.i = i;
      steps.forEach((el, k) => (el.hidden = k !== i));
      box.querySelectorAll(".swipe__dots span").forEach((d, k) => d.classList.toggle("on", k === i));
      b.textContent = i === steps.length - 1 ? "처음으로" : "다음";
    } else if (b.dataset.act === "ladder") {
      const open = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", String(open));
      b.nextElementSibling.hidden = !open;
    }
  });
}
