import assert from "node:assert/strict";
import { test } from "node:test";

import { home, matches } from "../../public/assets/js/app.js";

const items = [
  { id: "cheonja", name: "천자총통", photo: "cheonja" },
  { id: "bakdu", name: "박두", photo: "bakdu" },
  { id: "rest", name: "각궁 (김장환 제작)", photo: "rest" },
];

test("검색: 이름에서 띄어쓰기를 무시하고 찾는다", () => {
  assert.ok(matches("천자총통", "천자 총통"));
  assert.ok(matches("각궁 (김장환 제작)", "김장환"));
  assert.ok(matches("박두", ""));
  assert.ok(!matches("박두", "총통"));
});

test("검색창이 첫 화면 숫자 아래에 있고, 검색어가 있으면 안 맞는 칸은 숨긴다", () => {
  const html = home(items, { query: "총통" });
  assert.match(html, /<\/header>\s*<label class="search">/);
  assert.match(html, /data-search value="총통"/);
  assert.match(html, /data-id="cheonja">/);                 // 보이는 칸
  assert.match(html, /data-id="bakdu" hidden>/);            // 숨긴 칸
  assert.match(html, /data-empty hidden>찾는 유물이 없어요/);   // 맞는 게 있으면 안내 숨김
});

test("맞는 유물이 없으면 안내 문구가 보인다", () => {
  const html = home(items, { query: "없는유물" });
  assert.match(html, /data-empty>찾는 유물이 없어요/);
});
