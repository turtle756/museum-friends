// 디자인 방향 시안: 유명 서비스가 공개한 디자인 규칙(DESIGN.md)의 값으로 같은 부모 카드를 입혀 본다.
// 출처: VoltAgent/awesome-design-md (MIT). 브랜드 글꼴은 공개 글꼴이 아니라 비슷한 한글 글꼴로 바꿨다.
const SANS = '"Noto Sans KR", system-ui, sans-serif';
const SERIF = '"Noto Serif KR", "Nanum Myeongjo", serif';
const SYSTEM = 'system-ui, -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

// 공통 기본값. 테마마다 바뀌는 값만 덮어쓴다.
const BASE = {
  bg: "#ffffff", surface: "#ffffff", text: "#111111", muted: "#666666", accent: "#111111", onAccent: "#ffffff",
  line: "transparent", bw: "0px", radius: "12px", btnR: "8px", shadow: "none",
  head: SANS, headW: "700", headS: "1.55rem", headT: "-0.01em", headC: "", headShadow: "none",
  body: SANS, labelBg: "transparent", labelC: "#666666", labelR: "0px", labelT: "0", labelCase: "none", labelPad: "0",
  ruleW: "", ruleC: "", imgBg: "#ffffff", imgPad: "0px", bubbleBg: "", askC: "",
};

// 우리 16색으로 바꿀 때 쓰는 역할별 색 (밝은 테마 / 어두운 테마)
export const OURS_LIGHT = {
  bg: "#FFFAF0", surface: "#F1E4CA", text: "#24160F", muted: "#5E3621", accent: "#B8322A", onAccent: "#FFFAF0",
  lineColor: "#DDB984", labelBg: "#F3D17E", labelC: "#24160F", imgBg: "#FFFAF0", headC: "#24160F", askC: "#7E1C17",
};
export const OURS_DARK = {
  bg: "#24160F", surface: "#3D2418", text: "#FFFAF0", muted: "#DDB984", accent: "#E3A238", onAccent: "#24160F",
  lineColor: "#5E3621", labelBg: "#5E3621", labelC: "#F3D17E", imgBg: "#3D2418", headC: "#FFFAF0", askC: "#E3A238",
};

export const DESIGN_SYSTEMS = [
  {
    id: "apple", name: "Apple", ref: "apple",
    one: "사진이 주인공인 전시장. 밝은 회색 바탕, 큰 굵은 제목, 파란 버튼 하나.",
    keys: ["밝음", "사진 크게", "알약 버튼"],
    t: { bg: "#f5f5f7", surface: "#ffffff", text: "#1d1d1f", muted: "#7a7a7a", accent: "#0066cc", radius: "18px", btnR: "9999px",
      head: SYSTEM, body: SYSTEM, headW: "700", headS: "1.7rem", headT: "-0.02em", labelC: "#7a7a7a" },
  },
  {
    id: "airbnb", name: "Airbnb", ref: "airbnb",
    one: "따뜻하고 친근한 여행 앱. 흰 바탕, 둥근 사진에 옅은 그림자, 빨간 점 하나.",
    keys: ["친근함", "둥근 사진", "빨강 한 점"],
    t: { bg: "#ffffff", surface: "#f7f7f7", text: "#222222", muted: "#6a6a6a", accent: "#ff385c", line: "#dddddd", bw: "1px",
      radius: "14px", btnR: "8px", shadow: "0 6px 16px rgba(0,0,0,.12)", headS: "1.45rem", headT: "-0.02em", labelC: "#222222", askC: "#e00b41" },
  },
  {
    id: "notion", name: "Notion", ref: "notion",
    one: "문서처럼 정돈된 작업공간. 얇은 회색 선, 넉넉한 여백, 색 꼬리표.",
    keys: ["정돈", "얇은 선", "색 꼬리표"],
    t: { bg: "#ffffff", surface: "#ffffff", text: "#1f1f1f", muted: "#6b6b6b", accent: "#5645d4", line: "#e6e6e6", bw: "1px",
      radius: "12px", btnR: "8px", headS: "1.6rem", headT: "-0.03em", labelBg: "#ffe8d4", labelC: "#793400", labelR: "6px", labelPad: "1px 8px" },
  },
  {
    id: "claude", name: "Claude", ref: "claude",
    one: "문학 잡지 같은 따뜻한 크림색. 명조 제목, 선과 그림자 대신 색 덩어리로 구분.",
    keys: ["크림 바탕", "명조 제목", "그림자 없음"],
    t: { bg: "#faf9f5", surface: "#efe9de", text: "#141413", muted: "#6c6a64", accent: "#cc785c", radius: "12px", btnR: "8px",
      head: SERIF, headW: "500", headS: "1.7rem", headT: "-0.02em", labelBg: "#e8e0d2", labelC: "#141413", labelR: "9999px", labelPad: "2px 10px", askC: "#a9583e" },
  },
  {
    id: "wired", name: "Wired", ref: "wired",
    one: "기술 잡지 지면. 흑백, 직각, 굵은 명조 제목, 단락 사이 가는 선.",
    keys: ["흑백", "직각", "잡지 지면"],
    t: { bg: "#ffffff", surface: "#ffffff", text: "#000000", muted: "#757575", accent: "#000000", radius: "0px", btnR: "0px",
      head: '"Nanum Myeongjo", serif', headW: "800", headS: "1.9rem", headT: "-0.02em", body: SERIF,
      labelC: "#000000", labelT: "0.12em", labelCase: "uppercase", ruleW: "1px", ruleC: "#000000", imgBg: "#f5f5f5" },
  },
  {
    id: "uber", name: "Uber", ref: "uber",
    one: "흑백 두 색과 아주 굵은 고딕. 버튼은 전부 알약 모양.",
    keys: ["고대비", "굵은 고딕", "알약 버튼"],
    t: { bg: "#ffffff", surface: "#f3f3f3", text: "#000000", muted: "#5e5e5e", accent: "#000000", radius: "16px", btnR: "999px",
      headW: "800", headS: "1.75rem", headT: "-0.02em", labelBg: "#000000", labelC: "#ffffff", labelR: "999px", labelPad: "2px 10px" },
  },
  {
    id: "starbucks", name: "Starbucks", ref: "starbucks",
    one: "카페처럼 따뜻한 크림과 초록. 둥근 카드에 아주 옅은 그림자, 초록 제목.",
    keys: ["크림+초록", "둥근 카드", "편안함"],
    t: { bg: "#f2f0eb", surface: "#ffffff", text: "#1f1f1f", muted: "#6b6b6b", accent: "#00754A", radius: "12px", btnR: "50px",
      shadow: "0 0 .5px rgba(0,0,0,.14), 0 1px 1px rgba(0,0,0,.24)", headC: "#006241", headS: "1.55rem", askC: "#006241",
      labelBg: "#d4e9e2", labelC: "#1E3932", labelR: "50px", labelPad: "2px 10px" },
  },
  {
    id: "nintendo-2001", name: "Nintendo 2001", ref: "nintendo-2001",
    one: "2001년 게임기 홈페이지. 금속판 같은 입체 테두리, 보랏빛 바탕, 주황 버튼.",
    keys: ["레트로", "입체 금속판", "장난감"],
    mid: true,
    t: { bg: "#7a8aba", surface: "#ffffff", text: "#21242e", muted: "#21242e", accent: "#ecab37", onAccent: "#21242e",
      line: "#3d4f97", bw: "1px", radius: "4px", btnR: "2px",
      shadow: "inset 2px 2px 0 rgba(255,255,255,.9), inset -2px -2px 0 rgba(33,36,46,.35)",
      headW: "900", headS: "1.55rem", headT: "0", headC: "#ffffff", headShadow: "2px 2px 0 #21242e",
      labelBg: "#ecab37", labelC: "#21242e", labelR: "2px", labelT: "0.06em", labelCase: "uppercase", labelPad: "1px 8px", imgBg: "#dedede", askC: "#3d4f97" },
  },
  {
    id: "spotify", name: "Spotify", ref: "spotify",
    one: "음악 앱처럼 어두운 화면. 내용만 밝게 떠오르고, 초록 버튼 하나.",
    keys: ["어두움", "몰입", "초록 한 점"],
    dark: true,
    t: { bg: "#121212", surface: "#181818", text: "#ffffff", muted: "#b3b3b3", accent: "#1ed760", onAccent: "#000000",
      radius: "8px", btnR: "9999px", headW: "800", headS: "1.6rem", headT: "-0.02em", labelC: "#b3b3b3", labelT: "0.08em",
      labelCase: "uppercase", imgBg: "#181818" },
  },
];

// 테마 값 → CSS 변수 문자열. ours=true 이면 모양(모서리·글꼴·선 두께)은 두고 색만 우리 팔레트로.
export function dsVars(ds, ours = false) {
  const t = { ...BASE, ...ds.t };
  if (ours) {
    const o = ds.dark ? OURS_DARK : OURS_LIGHT;
    Object.assign(t, {
      bg: ds.mid ? "#A86E3E" : o.bg, surface: o.surface, text: o.text, muted: ds.mid ? "#24160F" : o.muted,
      accent: o.accent, onAccent: o.onAccent, imgBg: o.imgBg, askC: o.askC,
      headC: ds.mid ? "#FFFAF0" : o.headC,
      line: t.bw !== "0px" ? (ds.mid ? "#5E3621" : o.lineColor) : "transparent",
      ruleC: t.ruleW ? o.text : "",
      labelBg: t.labelBg === "transparent" ? "transparent" : o.labelBg,
      labelC: t.labelBg === "transparent" ? o.muted : o.labelC,
      headShadow: ds.mid ? "2px 2px 0 #24160F" : t.headShadow,
    });
  }
  const v = {
    "--bg": t.bg, "--surface": t.surface, "--text": t.text, "--muted": t.muted, "--accent": t.accent, "--on-accent": t.onAccent,
    "--line": t.line, "--bw": t.bw, "--radius": t.radius, "--btn-r": t.btnR, "--shadow": t.shadow,
    "--head": t.head, "--head-w": t.headW, "--head-s": t.headS, "--head-t": t.headT, "--head-c": t.headC || t.text,
    "--head-shadow": t.headShadow, "--body": t.body, "--label-bg": t.labelBg, "--label-c": t.labelC, "--label-r": t.labelR,
    "--label-t": t.labelT, "--label-case": t.labelCase, "--label-pad": t.labelPad,
    "--rule-w": t.ruleW || t.bw, "--rule-c": t.ruleC || t.line, "--img-bg": t.imgBg, "--bubble-bg": t.bubbleBg || t.surface,
    "--ask-c": t.askC || t.accent,
  };
  return Object.entries(v).map(([k, val]) => `${k}:${val}`).join(";");
}
