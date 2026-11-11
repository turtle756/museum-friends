import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

import { detail, home, quizzes, sortKo, tile } from "../../public/assets/js/app.js";

const data = JSON.parse(readFileSync(new URL("../../public/assets/data/stops.json", import.meta.url), "utf8"));
const items = [...data.stops, ...(data.extras || [])];

test("유물 id가 겹치지 않고 사진 파일이 모두 있다", () => {
  assert.equal(new Set(items.map((s) => s.id)).size, items.length);
  for (const s of items) assert.ok(existsSync(new URL(`../../public/assets/img/photo/${s.photo}.jpg`, import.meta.url)), s.id);
});

test("퀴즈 정답은 보기 안에 있다", () => {
  for (const s of items) for (const q of quizzes(s)) assert.ok(q.choices.includes(q.answer), `${s.id}: ${q.q}`);
});

test("격자는 가나다순이고 모든 유물이 한 칸씩 있다", () => {
  const html = home(items);
  assert.equal((html.match(/class="tile[ "]/g) || []).length, items.length);
  const names = sortKo(items).map((s) => s.name);
  const shown = [...html.matchAll(/class="tile__name">([^<]+)</g)].map((m) => m[1].replace(/&#39;/g, "'").replace(/&amp;/g, "&"));
  assert.deepEqual(shown, names);
});

test("본 유물에만 표시가 붙는다", () => {
  const seen = new Set([items[0].id]);
  assert.match(tile(items[0], { seen }), /tile__seen/);
  assert.doesNotMatch(tile(items[1], { seen }), /tile__seen/);
});

test("모든 유물 카드가 빈 값 없이 그려진다", () => {
  for (const s of items) {
    const html = detail(s);
    assert.match(html, /class="detail"/);
    assert.doesNotMatch(html, /undefined|null/, s.id);
  }
});

test("공유·저장·로그인 같은 기능이 없다", () => {
  const html = home(items) + items.map((s) => detail(s)).join("");
  assert.doesNotMatch(html, /공유|저장하기|로그인|좋아요/);
});
