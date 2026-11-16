import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { VARIANTS, back, card, page } from "../../public/assets/js/cards.js";

const data = JSON.parse(readFileSync(new URL("../../public/assets/data/stops.json", import.meta.url), "utf8"));
const all = [...data.stops, ...(data.extras || [])].filter((s) => s.grid !== false);
const withCard = all.filter((s) => s.card);
const css = readFileSync(new URL("../../public/assets/css/cards.css", import.meta.url), "utf8");

test("카드 시안은 결정 5-1과 예비 2-1 두 개만 남는다", () => {
  assert.deepEqual(VARIANTS.map((v) => [v.label, v.tag]), [["5-1", "결정"], ["2-1", "예비"]]);
});

test("카드 내용: 종류, 전투력(1~999), 스킬 이름 1~3개, 뒷면 이야기", () => {
  assert.ok(withCard.length >= 1);
  for (const s of withCard) {
    const c = s.card;
    assert.ok(c.cat && c.story, s.id);
    assert.ok(Number.isInteger(c.power) && c.power >= 1 && c.power <= 999, s.id);
    assert.ok(Array.isArray(c.skills) && c.skills.length >= 1 && c.skills.length <= 3 && c.skills.every((k) => k && k.length <= 12), s.id);
  }
});

test("모든 시안이 카드마다 빈 값 없이 그려지고, 뒷면(이야기)도 있다", () => {
  const html = page(all);
  assert.doesNotMatch(html, /undefined|null|NaN/);
  for (const v of VARIANTS) {
    const start = html.indexOf(`id="v-${v.id}"`);
    assert.ok(start >= 0, v.id);
    const sec = html.slice(start, html.indexOf("</section>", start));
    assert.equal((sec.match(/class="card card--/g) || []).length, withCard.length + 1, v.id);
    if (v.back.motif) assert.match(sec, /card--back[^>]*><div class="card__motif/, v.id);
    else assert.match(sec, /card--back[^>]*><div class="card__backin"><div class="card__story">/, v.id);   // 5-1: 무늬·이름판 없이 깨끗한 뒷면
    assert.match(sec, new RegExp(`<span>시안 ${v.label} · ${v.tag}</span>`), v.id);
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

test("그림 카드: 고른 8장만, 유물마다 그림 한 장 + 앞뒤 짝, 남은 그림 파일만 있다", async () => {
  const { existsSync, readdirSync } = await import("node:fs");
  const arts = withCard.filter((s) => s.card.art);
  assert.equal(arts.length, 8);
  for (const s of arts) {
    assert.equal(s.card.art.length, 1, s.id);
    assert.ok(existsSync(new URL(`../../public/assets/img/art/${s.card.art[0].file}`, import.meta.url)), s.id);
  }
  const files = readdirSync(new URL("../../public/assets/img/art/", import.meta.url));
  assert.deepEqual(files.sort(), arts.map((s) => s.card.art[0].file).sort());   // 안 쓰는 그림은 지움
  const html = page(all);
  const sec = html.slice(html.indexOf('id="v-art"'), html.indexOf("</section>", html.indexOf('id="v-art"')));
  assert.equal((sec.match(/class="card card--plan card--plan-back"/g) || []).length, 8);
  assert.equal((sec.match(/card--back/g) || []).length, 8);
  assert.doesNotMatch(sec, /card__motif|card__plate/);
});

test("5-1 스킬 칸에는 점선 네모가 없다", () => {
  assert.doesNotMatch(css, /\.card--plan \.card__skill \{[^}]*dashed/);
  assert.doesNotMatch(css, /\.card__skill \{[^}]*dashed/);
});

test("앱 맨 위 띠에 카드 시안으로 가는 임시 링크가 있다", () => {
  const html = readFileSync(new URL("../../public/index.html", import.meta.url), "utf8");
  assert.match(html, /<div class="devstrip">.*<a href="\/cards\.html">카드 시안<\/a>/);
});
