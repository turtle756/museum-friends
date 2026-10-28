// 아이의 대답 뒤에 붙는 조사를 고른다. 예: "젤리" + {을/를} → "젤리를", "사탕" + {을/를} → "사탕을"
// content/tour.yaml 의 line 에서 쓰는 조사 칸과 같은 목록이다 (museum_friends/content.py PARTICLES).

const PAIRS = {
  "을/를": ["을", "를"],
  "이/가": ["이", "가"],
  "은/는": ["은", "는"],
  "과/와": ["과", "와"],
  "아/야": ["아", "야"],
  "으로/로": ["으로", "로"],
};

export const PARTICLES = Object.keys(PAIRS);

// 숫자를 한국어로 읽었을 때의 받침: 영(ㅇ) 일(ㄹ) 이 삼(ㅁ) 사 오 육(ㄱ) 칠(ㄹ) 팔(ㄹ) 구
const DIGIT_SOUND = { 0: "other", 1: "l", 2: "", 3: "other", 4: "", 5: "", 6: "other", 7: "l", 8: "l", 9: "" };
const SKIP = /[\s.,!?~'"’”)\]]/;

// 마지막 소리: "" 받침 없음, "l" ㄹ받침, "other" 그 밖의 받침, null 알 수 없음
export function finalSound(text) {
  const s = String(text ?? "");
  for (let i = s.length - 1; i >= 0; i -= 1) {
    const ch = s[i];
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const jong = (code - 0xac00) % 28;
      if (jong === 0) return "";
      return jong === 8 ? "l" : "other";
    }
    if (ch >= "0" && ch <= "9") return DIGIT_SOUND[ch];
    const lower = ch.toLowerCase();
    if (lower >= "a" && lower <= "z") {
      if (lower === "l" || lower === "r") return "l"; // 엘, 알
      if (lower === "m" || lower === "n") return "other"; // 엠, 엔
      return "";
    }
    if (SKIP.test(ch)) continue;
    return null;
  }
  return null;
}

export function chooseParticle(pair, sound) {
  const [withFinal, withoutFinal] = PAIRS[pair];
  if (pair === "으로/로") return sound === "other" ? withFinal : withoutFinal;
  return sound === "l" || sound === "other" ? withFinal : withoutFinal;
}

// "나는 {답}{을/를} 날려 보내고 싶어" 의 {답}에 대답을 넣고, 조사 칸은 바로 앞 글자에 맞춘다.
export function fillLine(template, answer) {
  const clean = String(answer ?? "").trim();
  const re = /\{([^{}]+)\}/g;
  let out = "";
  let last = 0;
  let match;
  while ((match = re.exec(template)) !== null) {
    out += template.slice(last, match.index);
    const key = match[1];
    if (key === "답") out += clean;
    else if (PAIRS[key]) out += chooseParticle(key, finalSound(out));
    else out += match[0];
    last = re.lastIndex;
  }
  return out + template.slice(last);
}
