import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

import { detail, home, intro, quizBtn, quizzes, sortKo, tile } from "../../public/assets/js/app.js";

const data = JSON.parse(readFileSync(new URL("../../public/assets/data/stops.json", import.meta.url), "utf8"));
const all = [...data.stops, ...(data.extras || [])];
const items = all.filter((s) => s.grid !== false);

test("유물 id가 겹치지 않고 사진 파일이 모두 있다", () => {
  assert.equal(new Set(all.map((s) => s.id)).size, all.length);
  for (const s of all) assert.ok(existsSync(new URL(`../../public/assets/img/photo/${s.photo}.jpg`, import.meta.url)), s.id);
});

test("격자의 모든 유물에 퀴즈가 있다 (퀴즈를 풀어야 체크가 붙으므로)", () => {
  for (const s of items) assert.ok(quizzes(s).length >= 1, s.id);
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

test("퀴즈 푼 유물에만 체크가 붙는다", () => {
  const seen = new Set([items[0].id]);
  assert.match(tile(items[0], { seen }), /tile__seen/);
  assert.doesNotMatch(tile(items[1], { seen }), /tile__seen/);
});

test("틀린 것이 있는 유물은 격자에 체크 대신 다시 도전(↻) 표시", () => {
  const [a, b] = items;
  const o = { seen: new Set([a.id, b.id]), scores: { [a.id]: { right: 2, total: 2 }, [b.id]: { right: 1, total: 2 } } };
  assert.doesNotMatch(tile(a, o), /tile__seen--retry/);
  assert.match(tile(a, o), /M5 12\.5l4\.5 4\.5L19 7\.5/);          // ✓
  assert.match(tile(b, o), /tile__seen tile__seen--retry/);
  assert.doesNotMatch(tile(b, o), /M5 12\.5l4\.5 4\.5L19 7\.5/);   // ✓ 없음
});

test("방금 처음 푼 유물만 체크가 톡 나타난다", () => {
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
  assert.match(html, /<b>1<\/b> 풀었어요/);
});

test("모든 유물 카드가 빈 값 없이 그려진다", () => {
  for (const s of items) {
    const html = detail(s);
    assert.match(html, /class="detail"/);
    assert.doesNotMatch(html, /undefined|null/, s.id);
  }
});

test("'아이가 더 물어보면'은 처음부터 펼쳐져 있다", () => {
  for (const s of items.filter((x) => x.more)) assert.match(detail(s), /<details class="more" open>/, s.id);
});

test("카드에 '물어볼 것' 칸이 없고 퀴즈 풀어보기 버튼만 있다", () => {
  for (const s of items) {
    const html = detail(s);
    assert.doesNotMatch(html, /물어볼 것|sec--ask/, s.id);
    assert.match(html, /data-quiz=/, s.id);
  }
});

test("같이 볼 곳은 없고, 문단 속 강조 표시(**)도 없다", () => {
  for (const x of [...data.stops, ...data.extras]) {
    assert.ok(!("look" in x), x.id);
    for (const k of ["headline", "tell", "imagine", "more"]) assert.ok(!(x[k] || "").includes("**"), `${x.id}.${k}`);
    for (const p of x.story || []) assert.ok(!p.includes("**"), `${x.id}.story`);
  }
  for (const x of items) assert.doesNotMatch(detail(x), /같이 볼 곳/, x.id);
});

test("자막은 2~3줄, 줄마다 짧게(16자 이하), 첫마디 바로 아래", () => {
  for (const x of items.filter((y) => y.caps)) {
    assert.ok(x.caps.length >= 2 && x.caps.length <= 3 && x.caps.every((c) => c.length <= 16), x.id);
    assert.match(detail(x), /class="d__title">[^<]+<\/h1><div class="caps"><span class="cap">/, x.id);
  }
});

test("이야기 한 편 카드: 제목 아래 짧은 문단들, 자막·들려줄 이야기·상상 이야기 칸은 없음", () => {
  const withStory = items.filter((x) => x.story);
  assert.ok(withStory.length >= 1);
  for (const x of withStory) {
    const html = detail(x);
    assert.match(html, /<section class="story"><p/, x.id);
    assert.equal((html.match(/<p( class="say")?>/g) || []).length - (x.more ? 1 : 0), x.story.length, x.id);
    assert.doesNotMatch(html, /class="caps"|sec--tell|sec--imagine|진짜 역사 아님/, x.id);
    assert.ok(x.story.every((p) => p.length > 0 && p.length <= 90), x.id);   // 잠깐씩 읽어도 읽히게: 문단은 짧게
  }
});

test("들어가기 전 안내 화면: 화면 전체가 버튼이고 AI 대신 여기서 찾으라는 말이 있다", () => {
  const html = intro();
  assert.match(html, /^<button type="button" class="intro" data-intro>/);
  assert.match(html, /AI에게 묻지 말고/);
  assert.match(html, /화면을 누르면 시작해요/);
});

test("상상 이야기는 '진짜 역사 아님' 칸에만 들어간다", () => {
  for (const s of items.filter((x) => x.imagine)) {
    assert.match(detail(s), /sec--imagine[\s\S]*진짜 역사 아님/, s.id);
  }
});

test("퀴즈 버튼은 결과에 따라 바뀐다 (안 풂 / 다 맞힘 / 다시 도전)", () => {
  const s = items.find((x) => quizzes(x).length >= 2) || items[0];
  assert.match(quizBtn(s), /class="btn-quiz" data-quiz=[^>]*>퀴즈 풀어보기</);
  assert.match(quizBtn(s, { right: 2, total: 2 }), /btn-quiz--perfect[\s\S]*다 맞혔어요[\s\S]*다시 풀기/);
  assert.match(quizBtn(s, { right: 1, total: 2 }), /btn-quiz--retry[\s\S]*1\/2 맞혔어요[\s\S]*다시 도전/);
  assert.match(detail(s, { score: { right: 1, total: 2 } }), /btn-quiz--retry/);
});

test("카드의 뒤로 버튼에 부천활박물관 로고가 있다", () => {
  const html = detail(items[0]);
  assert.match(html, /<a class="back back--brand" href="#\/" aria-label="목록으로">/);
  assert.match(html, /bow-logo-dark\.png/);
  assert.match(html, /bow-logo-light\.png/);
});

test("첫 화면 맨 아래에 공식 사이트 버튼이 있다", () => {
  assert.match(home(items), /class="sitebtn" href="https:\/\/www\.bcmuseum\.or\.kr\/ko\/pages\/intro\?tab=tab2" target="_blank" rel="noopener"/);
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
    assert.ok(s.source && s.headline && (s.tell || s.story), s.id);
    assert.ok(quizzes(s).length >= 1, s.id);
  }
});
