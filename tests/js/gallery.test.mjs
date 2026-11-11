import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

import { detail, home, quizzes, sortKo, tile } from "../../public/assets/js/app.js";

const data = JSON.parse(readFileSync(new URL("../../public/assets/data/stops.json", import.meta.url), "utf8"));
const all = [...data.stops, ...(data.extras || [])];
const items = all.filter((s) => s.grid !== false);

test("유물 id가 겹치지 않고 사진 파일이 모두 있다", () => {
  assert.equal(new Set(all.map((s) => s.id)).size, all.length);
  for (const s of all) assert.ok(existsSync(new URL(`../../public/assets/img/photo/${s.photo}.jpg`, import.meta.url)), s.id);
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

test("방금 처음 본 유물만 체크 표시가 톡 나타난다", () => {
  const seen = new Set([items[0].id, items[1].id]);
  assert.match(tile(items[0], { seen, fresh: items[0].id }), /tile__seen is-new/);
  assert.doesNotMatch(tile(items[1], { seen, fresh: items[0].id }), /is-new/);
});

test("첫 화면 머리: 공식 로고(어두운·밝은 화면용)가 있고 숫자가 맞다", () => {
  const html = home(items, { seen: new Set([items[0].id]) });
  for (const v of ["dark", "light"]) {
    assert.match(html, new RegExp(`bow-logo-${v}\\.png`));
    assert.ok(existsSync(new URL(`../../public/assets/img/brand/bow-logo-${v}.png`, import.meta.url)), v);
  }
  assert.match(html, new RegExp(`<b>${items.length}</b> 유물`));
  assert.match(html, /<b>1<\/b> 봤어요/);
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

test("첫 화면이 불러오는 이름이 app.js에 모두 있다 (빈 화면 방지)", async () => {
  const html = readFileSync(new URL("../../public/index.html", import.meta.url), "utf8");
  const mod = await import("../../public/assets/js/app.js");
  const m = html.match(/import \{([^}]+)\} from "\/assets\/js\/app\.js"/);
  assert.ok(m, "app.js import 줄");
  for (const name of m[1].split(",").map((x) => x.trim())) assert.equal(typeof mod[name], "function", name);
});

test("추가 유물은 모두 근거 설명판과 퀴즈가 있다", () => {
  for (const s of data.extras) {
    assert.ok(s.source && s.headline && s.tell && s.look && s.ask, s.id);
    assert.ok(quizzes(s).length >= 1, s.id);
  }
});
