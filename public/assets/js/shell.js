// '고를 것' 탭들의 공통 머리말. 앱 시안과 같은 어두운 바탕에 맞춘다.
const TABS = [
  ["/", "앱 시안"], ["/pick-card.html", "카드 모양"], ["/pick-image.html", "그림 처리"], ["/pick-look.html", "색·글꼴"],
  ["/structure.html", "구조"], ["/content.html", "콘텐츠"], ["/designs.html", "디자인 참고"], ["/gallery.html", "이전 시안"],
];

export function shell() {
  const here = location.pathname === "/index.html" ? "/" : location.pathname;
  const bar = document.createElement("header");
  bar.className = "dbar";
  bar.innerHTML = `<div class="dbar__in"><a class="dbar__home" href="/pick-card.html">고를 것</a><nav>${TABS.map(
    ([h, t]) => `<a href="${h}"${h === here ? ' aria-current="page"' : ""}>${t}</a>`).join("")}</nav>
    <span class="dbar__tag">시안 · 학예사 검수 전</span></div>`;
  document.body.prepend(bar);
}

// 휴대폰 틀 하나: 앱 화면을 그대로 넣는다
export const phone = (label, inner, style = "") =>
  `<div class="dphone"><div class="dphone__bar"><span>부모 휴대폰</span><span>${label}</span></div><div class="dphone__screen app" style="${style}">${inner}</div></div>`;
