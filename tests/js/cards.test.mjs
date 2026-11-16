import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { VARIANTS, page } from "../../public/assets/js/cards.js";

const data = JSON.parse(readFileSync(new URL("../../public/assets/data/stops.json", import.meta.url), "utf8"));
const all = [...data.stops, ...(data.extras || [])].filter((s) => s.grid !== false);
const withCard = all.filter((s) => s.card);

test("카드 시안은 8개 이상이고 이름이 겹치지 않는다", () => {
  assert.ok(VARIANTS.length >= 8);
  assert.equal(new Set(VARIANTS.map((v) => v.id)).size, VARIANTS.length);
});

test("카드 내용: 종류, 전투력(1~999), 스킬 이름과 글이 있다", () => {
  assert.ok(withCard.length >= 1);
  for (const s of withCard) {
    const c = s.card;
    assert.ok(c.cat && c.skill && c.text, s.id);
    assert.ok(Number.isInteger(c.power) && c.power >= 1 && c.power <= 999, s.id);
  }
});

test("모든 시안이 카드마다 빈 값 없이 그려지고 뒷면도 있다", () => {
  const html = page(all);
  assert.doesNotMatch(html, /undefined|null|NaN/);
  for (const v of VARIANTS) {
    const start = html.indexOf(`<section class="vsec" id="v-${v.id}">`);
    assert.ok(start >= 0, v.id);
    const sec = html.slice(start, html.indexOf("</section>", start));
    assert.equal((sec.match(/class="card card--/g) || []).length, withCard.length + 1, v.id);
    assert.match(sec, /card--back/, v.id);
  }
});

test("앱 맨 위 띠에 카드 시안으로 가는 임시 링크가 있다", () => {
  const html = readFileSync(new URL("../../public/index.html", import.meta.url), "utf8");
  assert.match(html, /<div class="devstrip">.*<a href="\/cards\.html">카드 시안<\/a>/);
});
