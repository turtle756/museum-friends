// 아이 활동지 시안 8종 (A4 인쇄용). 흑백 인쇄에서도 구분되게 색보다 모양과 선으로 구분한다.
import { esc, icon, museumMap } from "./core.js";

const head = (title, sub) => `<header class="sh-head"><div><div class="sh-title">${title}</div><div class="sh-sub">${sub}</div></div>
  <div class="sh-name">이름 <span></span></div></header>`;
const choices = (q) => `<div class="sh-choices">${q.choices.map((c) => `<span><i></i>${esc(c)}</span>`).join("")}</div>`;
const stampCircle = (label = "") => `<div class="sh-stamp">${label}</div>`;
const foot = (t) => `<footer class="sh-foot">${t}</footer>`;
const ART = (s) => (s.pixel ? `<img class="px sh-art" src="/assets/img/pixel/${s.pixel}.png" alt="">` : `<div class="sh-art sh-art--icon">${icon("look", 40)}</div>`);

export const SHEETS = [
  {
    id: "S1", name: "퀴즈지", orientation: "portrait",
    idea: "정류장마다 3지선다 문제 하나. 정답은 부모 휴대폰에만 있다. 맞히면 옆 동그라미에 도장이나 별.",
    pros: ["가장 익숙하고 만들기 쉽다", "부모가 퀴즈 진행자가 된다"], cons: ["시험지처럼 느껴질 수 있다"],
    render: (st) => [`${head("활 탐험 퀴즈", "정답은 엄마 아빠 휴대폰 속에 있어요!")}
      <div class="sh-qgrid">${st.map((s) => `<section class="sh-q"><div class="sh-qn">${s.no}</div>${ART(s)}
        <div class="sh-qbody"><b>${esc(s.quiz.q)}</b>${choices(s.quiz)}</div>${stampCircle()}</section>`).join("")}</div>
      ${foot("다 풀었으면 엄마 아빠에게 '참 잘했어요'를 받아요.")}`],
  },
  {
    id: "S2", name: "탐험 지도형", orientation: "portrait",
    idea: "박물관 약도 위에 정류장 번호. 아이가 지도를 들고 다음 정류장을 찾아간다. 길 찾기 자체가 놀이.",
    pros: ["아이가 동선을 이끈다", "뛰쳐나가도 지도로 돌아온다"], cons: ["약도가 정확해야 한다(현장 확인 필요)"],
    render: (st) => [`${head("활 박물관 탐험 지도", "번호를 따라가며 숨은 유물을 찾아요")}
      <div class="sh-map">${museumMap({ stops: st, labelZones: true })}</div>
      <ol class="sh-maplist">${st.map((s) => `<li><b>${esc(s.name)}</b> · ${esc(s.look)} ${stampCircle()}</li>`).join("")}</ol>
      ${foot("약도는 관람 안내 지도를 옮겨 그린 시안입니다.")}`],
  },
  {
    id: "S3", name: "도장판 + 종이접기 활", orientation: "portrait",
    idea: "앞면은 도장판, 뒷면은 활 접기 도안. 끝나면 안내데스크에서 활을 접고 기념사진.",
    pros: ["넘치는 에너지를 손 활동으로 푼다", "집에 가져갈 결과물이 생긴다"], cons: ["접기 도안을 팀이 직접 검증해야 한다"],
    render: (st) => [
      `${head("활 탐험 도장판", "정류장을 지날 때마다 도장 칸을 채워요")}
       <div class="sh-board">${st.map((s) => `<div class="sh-cell">${icon("stamp", 34)}<b>${s.no}. ${esc(s.name)}</b>${stampCircle()}</div>`).join("")}</div>
       <div class="sh-big">${icon("star", 60)}<div>도장을 다 모으면<br><b>뒷면의 활을 접어요!</b></div></div>`,
      `${head("종이 활 접기", "도장판을 다 채운 사람만 접을 수 있어요")}
       <div class="sh-steps">${[1, 2, 3, 4, 5, 6].map((n) => `<div class="sh-step"><span>${n}</span><div class="sh-ph">접기 그림 ${n}</div></div>`).join("")}</div>
       <div class="note">자리표시: 팀이 실제로 활을 접어 보고, 단계 사진을 픽셀 그림으로 바꿔 채웁니다.</div>
       <div class="sh-photo">${icon("look", 40)}<div>완성한 활을 들고<br><b>기념사진 찰칵!</b><br><span class="small">사진은 우리 가족 휴대폰에만</span></div></div>`,
    ],
  },
  {
    id: "S4", name: "접으면 정답", orientation: "portrait",
    idea: "오른쪽 정답 띠를 뒤로 접어 숨긴다. 다 풀고 펼치면 정답과 '참 잘했어요'가 나온다. 직원도 도장도 필요 없다.",
    pros: ["직원 없이 도장 효과", "종이접기와 이어진다"], cons: ["아이가 먼저 펼쳐 볼 수 있다(부모가 지켜야 함)"],
    render: (st) => [`${head("접어서 푸는 활 퀴즈", "점선을 따라 오른쪽 띠를 뒤로 접고 시작해요")}
      <div class="sh-fold"><div class="sh-fold__q">${st.map((s) => `<div class="sh-fq"><span class="sh-qn">${s.no}</span><div><b>${esc(s.quiz.q)}</b>${choices(s.quiz)}</div></div>`).join("")}</div>
      <div class="sh-fold__a"><div class="sh-fold__tip">${icon("fold", 30)} 여기를 뒤로 접기</div>${st.map((s) => `<div class="sh-fa">${s.no}. ${esc(s.quiz.answer)}</div>`).join("")}
      <div class="sh-fold__stamp">참 잘했어요</div></div></div>`],
  },
  {
    id: "S5", name: "무과 시험지 + 홍패", orientation: "portrait",
    idea: "아이는 오늘 무과 시험을 보는 응시생. 다 풀면 부모가 홍패(합격 증서)에 서명해 준다.",
    pros: ["이야기 몰입이 강하다", "부모가 시험관이 되어 성취감"], cons: ["홍패 고증을 학예사에게 확인해야 한다"],
    render: (st) => [
      `<div class="sh-exam">${head("무과 시험지", "응시생은 정류장마다 한 과목씩 풀어요")}
       ${st.map((s, i) => `<section class="sh-eq"><div class="sh-eqn">제${i + 1}과</div><div><b>${esc(s.quiz.q)}</b>${choices(s.quiz)}</div></section>`).join("")}
       ${foot("시험관(엄마 아빠)이 채점해요. 모두 맞히면 다음 장의 홍패를 받아요.")}</div>`,
      `<div class="sh-hong"><div class="sh-hong__in"><div class="sh-hong__t">紅牌 홍패</div><div class="sh-hong__big">급 제</div>
       <p>위 응시생 <span class="sh-line"></span> 은(는)<br>부천활박물관 무과 시험에서<br>모든 과목을 통과하였기에<br>이 홍패를 내린다.</p>
       <div class="sh-hong__sign">시험관 <span class="sh-line"></span> (서명)</div></div></div>
       <div class="note">확인 필요: 홍패는 조선 시대 문과·무과 합격 증서로 알려져 있다. 문구와 모양은 학예사 검수 후 확정.</div>`,
    ],
  },
  {
    id: "S6", name: "궁시장 견습생 수첩", orientation: "portrait",
    idea: "아이는 오늘 활 장인의 견습생. 재료 7가지를 찾아 체크하고, 마지막에 나만의 활을 그린다.",
    pros: ["각궁 제작 이야기와 딱 맞는다", "박물관의 재료 카드 체험대와 이어진다"], cons: ["재료 전시가 상설인지 확인 필요"],
    render: () => [`${head("궁시장 견습생 수첩", "활 하나를 만들려면 재료 7가지가 필요해요")}
      <div class="sh-mats">${["대나무", "뽕나무", "참나무", "물소뿔", "쇠심줄", "화피", "민어부레"].map((m) => `<div class="sh-mat"><div class="sh-box"></div><b>${m}</b><span>찾았어요 □</span></div>`).join("")}</div>
      <div class="sh-order"><b>만드는 순서 8단계</b><ol>${["재료 손질", "활 몸체 만들기", "물소뿔 붙이기", "쇠심줄 올리기", "건조하기", "배궁하기", "화피 단장", "각궁 완성"].map((t) => `<li>${t} □</li>`).join("")}</ol></div>
      <div class="sh-drawbig"><b>견습생이 만든 나만의 활</b></div>`],
  },
  {
    id: "S7", name: "보고 그리기형", orientation: "portrait",
    idea: "정답 대신 '보고 그리기'. 아이는 실물을 오래 보고 그린다. 정답이 없어 틀릴 걱정이 없다.",
    pros: ["실물을 가장 오래 본다", "어린 아이도 할 수 있다"], cons: ["경쟁심과 긴장감은 약하다"],
    render: (st) => [`${head("보고 그려요", "실물을 잘 보고 그려 보세요. 정답은 없어요!")}
      <div class="sh-draws">${st.slice(0, 6).map((s) => `<section class="sh-draw"><b>${s.no}. ${esc(s.name)}</b><div class="small">${esc(s.look)}</div><div class="sh-drawbox"></div></section>`).join("")}</div>`],
  },
  {
    id: "S8", name: "한 장 미니북", orientation: "landscape",
    idea: "A4 한 장을 접고 가운데만 잘라 8쪽 미니북으로. 접는 과정 자체가 종이접기 놀이.",
    pros: ["종이 한 장으로 책 한 권", "박물관이 일반 프린터로 뽑을 수 있다"], cons: ["처음 접는 가족에게 설명이 필요하다"],
    render: (st) => {
      const pick = st.slice(0, 6);
      const page = (inner, rot = false) => `<div class="mb-p${rot ? " mb-rot" : ""}"><div class="mb-in">${inner}</div></div>`;
      // 정류장이 6곳보다 적으면 남는 쪽은 '그려 보기' 쪽으로 채운다
      const sp = (s) => (s ? `<div class="mb-no">${s.no}</div>${ART(s)}<b>${esc(s.name)}</b><div class="small">${esc(s.quiz.q)}</div>${choices(s.quiz)}`
        : `<b>오늘 가장 기억에 남는 것을 그려요</b><div class="sh-drawbox" style="width:100%"></div>`);
      const cover = `<div class="mb-cover">${icon("bow", 56)}<b>나의 활<br>탐험 책</b><div class="small">부천활박물관</div></div>`;
      const back = `<div class="mb-cover">${icon("stamp", 56)}<b>참 잘했어요</b><div class="sh-stamp sh-stamp--big"></div></div>`;
      // 흔히 쓰는 8쪽 접지 배치: 윗줄(거꾸로) 5·4·3·2쪽, 아랫줄 6·7·8(뒤표지)·1(표지)쪽
      return [`<div class="mb">${page(sp(pick[3]), true)}${page(sp(pick[2]), true)}${page(sp(pick[1]), true)}${page(sp(pick[0]), true)}
        ${page(sp(pick[4]))}${page(sp(pick[5]))}${page(back)}${page(cover)}</div>
        <div class="mb-guide">가운데 가로선의 가운데 두 칸 사이만 자르고 접습니다. 쪽 순서는 팀이 한 장 접어 보고 확정합니다.</div>`];
    },
  },
];

export function renderSheet(id, stops) {
  const S = SHEETS.find((x) => x.id === id) || SHEETS[0];
  return S.render(stops).map((p) => `<div class="sheet sheet--${S.orientation}">${p}</div>`).join("");
}
