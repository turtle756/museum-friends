import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { VARIANTS, back, card, page } from "../../public/assets/js/cards.js";

const data = JSON.parse(readFileSync(new URL("../../public/assets/data/stops.json", import.meta.url), "utf8"));
const all = [...data.stops, ...(data.extras || [])].filter((s) => s.grid !== false);
const withCard = all.filter((s) => s.card);

test("카드 시안은 8개 이상이고 이름이 겹치지 않는다", () => {
  assert.ok(VARIANTS.length >= 8);
  assert.equal(new Set(VARIANTS.map((v) => v.id)).size, VARIANTS.length);
});

test("카드 내용: 종류, 전투력(1~999), 스킬 이름 1~3개, 뒷면 이야기", () => {
  assert.ok(withCard.length >= 1);
  for (const s of withCard) {
    const c = s.card;
    assert.ok(c.cat && c.story, s.id);
    assert.ok(Array.isArray(c.skills) && c.skills.length >= 1 && c.skills.length <= 3 && c.skills.every((k) => k && k.length <= 12), s.id);
    assert.ok(Number.isInteger(c.power) && c.power >= 1 && c.power <= 999, s.id);
  }
});

test("모든 시안이 카드마다 빈 값 없이 그려지고 뒷면도 있다", () => {
  const html = page(all);
  assert.doesNotMatch(html, /undefined|null|NaN/);
  for (const v of VARIANTS) {
    const start = html.indexOf(`id="v-${v.id}"`);
    assert.ok(start >= 0, v.id);
    const sec = html.slice(start, html.indexOf("</section>", start));
    assert.equal((sec.match(/class="card card--/g) || []).length, withCard.length + 1, v.id);
    assert.match(sec, /card--back/, v.id);
  }
});

test("앞면에는 설명글이 없고 이야기는 뒷면에만 있다", () => {
  const v = VARIANTS[0], s = withCard[0];
  const front = card(s, v, 1);
  assert.doesNotMatch(front, /<p>/);
  assert.ok(!front.includes(s.card.story));
  assert.equal((front.match(/card__skill-name/g) || []).length, s.card.skills.length);
  assert.ok(back(v, s).includes(s.card.story));
});

test("수정판은 원래 시안 바로 아래에 붙고, 뒷면에 전통 문양이 들어간다", () => {
  const html = page(all);
  VARIANTS.forEach((v, i) => {
    if (!v.base) return;
    const parent = VARIANTS.slice(0, i).reverse().find((x) => !x.base);
    assert.equal(parent.id, v.base, v.id);
    const start = html.indexOf(`id="v-${v.id}"`);
    const sec = html.slice(start, html.indexOf("</section>", start));
    assert.match(sec, new RegExp(`card--back[^>]*>${v.back ? "<div class=\"card__motif" : ""}`), v.id);
    assert.match(sec, new RegExp(`<span>시안 ${v.label}</span>`), v.id);
  });
});

test("앱 맨 위 띠에 카드 시안으로 가는 임시 링크가 있다", () => {
  const html = readFileSync(new URL("../../public/index.html", import.meta.url), "utf8");
  assert.match(html, /<div class="devstrip">.*<a href="\/cards\.html">카드 시안<\/a>/);
});
