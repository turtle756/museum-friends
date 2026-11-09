import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

test("디자인 방향 테마는 모든 변수를 채우고, 우리 16색 모드에서는 팔레트 색만 쓴다", async () => {
  const { DESIGN_SYSTEMS, dsVars } = await import("../../public/assets/js/designs.js");
  const { COLORS } = await import("../../public/assets/js/core.js");
  const palette = new Set(Object.values(COLORS).map((c) => c.toLowerCase()));
  for (const d of DESIGN_SYSTEMS) {
    for (const ours of [false, true]) {
      const css = dsVars(d, ours);
      assert.doesNotMatch(css, /undefined|null|:;/, `${d.id} ${ours}`);
      if (!ours) continue;
      for (const key of ["--bg", "--surface", "--text", "--accent", "--on-accent", "--head-c", "--ask-c"]) {
        const val = css.match(new RegExp(`${key}:([^;]+)`))[1].toLowerCase();
        assert.ok(palette.has(val), `${d.id} ${key}=${val} 은 16색이 아님`);
      }
    }
  }
});
