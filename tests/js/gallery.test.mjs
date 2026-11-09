import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

import { CARD_LAYOUTS, renderCard } from "../../public/assets/js/cards.js";
import { museumMap, MAP_POS } from "../../public/assets/js/core.js";
import { ROUTES, STAMPS, STRATEGIES, THEMES } from "../../public/assets/js/options.js";
import { SHEETS, renderSheet } from "../../public/assets/js/sheets.js";

const { stops } = JSON.parse(readFileSync(new URL("../../public/assets/data/stops.json", import.meta.url), "utf8"));
const ids = new Set(stops.map((s) => s.id));

test("정류장마다 퀴즈 정답이 보기 안에 있다", () => {
  for (const s of stops) {
    assert.ok(s.quiz.choices.includes(s.quiz.answer), s.id);
    for (const q of s.extraQuiz || []) assert.ok(q.choices.includes(q.answer), `${s.id} 추가 문제`);
  }
});

test("정류장 번호는 1부터 차례대로이고 약도 위치가 있다", () => {
  stops.forEach((s, i) => {
    assert.equal(s.no, i + 1);
    assert.ok(MAP_POS[s.id], `${s.id} 약도 위치`);
  });
});

test("동선은 있는 정류장만 가리킨다", () => {
  for (const r of ROUTES) for (const id of r.stops) assert.ok(ids.has(id), `${r.id}: ${id}`);
});

test("이야기 틀은 있는 정류장만 가리킨다", () => {
  for (const t of THEMES) for (const [id] of t.links) assert.ok(ids.has(id), `${t.id}: ${id}`);
});

test("전략 조합은 있는 시안만 가리킨다", () => {
  const has = (arr, id) => arr.some((x) => x.id === id);
  for (const s of STRATEGIES) {
    const c = s.combo;
    assert.ok(has(CARD_LAYOUTS, c.card), `${s.id} 카드`);
    assert.ok(c.sheet === null || has(SHEETS, c.sheet), `${s.id} 활동지`);
    assert.ok(has(STAMPS, c.stamp), `${s.id} 도장`);
    assert.ok(has(THEMES, c.theme), `${s.id} 이야기`);
    assert.ok(has(ROUTES, c.route), `${s.id} 동선`);
  }
});

test("모든 카드가 모든 정류장과 그림 스타일에서 그려진다", () => {
  for (const L of CARD_LAYOUTS) for (const s of stops) for (const theme of ["pixel", "trad", "mix"]) {
    const html = renderCard(L.id, s, { total: stops.length, theme, stops });
    assert.match(html, /<article class="pcard/);
    assert.doesNotMatch(html, /undefined/, `${L.id} ${s.id} ${theme}`);
  }
});

test("모든 활동지가 전체 동선과 짧은 동선에서 그려진다", () => {
  for (const r of ROUTES) {
    const st = r.stops.map((id, i) => ({ ...stops.find((s) => s.id === id), no: i + 1 }));
    for (const S of SHEETS) {
      const html = renderSheet(S.id, st);
      assert.match(html, /class="sheet sheet--/);
      assert.doesNotMatch(html, /undefined/, `${S.id} ${r.id}`);
    }
  }
});

test("약도는 강조한 정류장을 빨갛게 칠한다", () => {
  const svg = museumMap({ stops, highlight: "singijeon" });
  assert.match(svg, /^<svg/);
  assert.equal((svg.match(/#B8322A/g) || []).length, 1);
});

test("디자인 참고 페이지의 캡처 이미지가 모두 있다", () => {
  const html = readFileSync(new URL("../../public/designs.html", import.meta.url), "utf8");
  const ids = [...html.matchAll(/\["([a-z]+)", "[^"]+", "[^"]*", "https:/g)].map((m) => m[1]);
  assert.ok(ids.length >= 16, `캡처 ${ids.length}개`);
  for (const id of ids) assert.ok(existsSync(new URL(`../../public/assets/img/ref/${id}.jpg`, import.meta.url)), id);
});

test("앱 시안: 격자와 카드가 모든 유물·모든 방식에서 그려진다", async () => {
  const { home, detail, tile, quizzes, LAYOUTS } = await import("../../public/assets/js/app.js");
  const h = home(stops);
  assert.equal((h.match(/class="tile[ "]/g) || []).length, stops.length);
  for (const s of stops) {
    for (const img of ["photo", "bw", "cut", "text"]) for (const name of ["over", "none", "below"]) {
      assert.doesNotMatch(tile(s, { img, name }), /undefined/, `${s.id} ${img} ${name}`);
    }
    for (const layout of Object.keys(LAYOUTS)) for (const hero of ["photo", "card", "cut", "bw"]) {
      const html = detail(s, { layout, hero });
      assert.match(html, /class="detail"/);
      assert.doesNotMatch(html, /undefined/, `${s.id} ${layout} ${hero}`);
    }
    for (const q of quizzes(s)) assert.ok(q.choices.includes(q.answer), `${s.id} 퀴즈`);
  }
});

test("앱 시안에는 공유·저장·로그인 같은 기능이 없다", async () => {
  const { home, detail } = await import("../../public/assets/js/app.js");
  const html = home(stops) + stops.map((s) => detail(s, { layout: "C1" })).join("");
  assert.doesNotMatch(html, /공유|저장하기|로그인|좋아요/);
});
