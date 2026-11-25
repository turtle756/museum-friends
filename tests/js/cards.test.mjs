import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

import { back, card, kidCards, sheets } from "../../public/assets/js/cards.js";

const data = JSON.parse(readFileSync(new URL("../../public/assets/data/stops.json", import.meta.url), "utf8"));
const all = [...data.stops, ...(data.extras || [])].filter((s) => s.grid !== false);
const withCard = all.filter((s) => s.card);
const css = readFileSync(new URL("../../public/assets/css/cards.css", import.meta.url), "utf8");

test("카드 내용: 종류, 전투력(1~999), 스킬 이름 1~3개, 뒷면 이야기", () => {
  assert.ok(withCard.length >= 1);
  for (const s of withCard) {
    const c = s.card;
    assert.ok(c.cat && c.story, s.id);
    assert.ok(Number.isInteger(c.power) && c.power >= 1 && c.power <= 999, s.id);
    assert.ok(Array.isArray(c.skills) && c.skills.length >= 1 && c.skills.length <= 3 && c.skills.every((k) => k && k.length <= 12), s.id);
  }
});

test("아이 카드는 손에 쥘 만한 실물 유물 12장이고, 그림·설명판·재료 묶음은 카드가 없다", () => {
  assert.equal(withCard.length, 12);
  for (const name of ["득중정어사도", "북새선은도", "삼국시대의 활", "각궁 재료"]) {
    const s = all.find((x) => x.name === name);
    assert.ok(s, name);              // 부모 앱에는 그대로 남는다
    assert.equal(s.card, undefined, name);
  }
});

test("카드는 5-1 설계도 틀 + AI 그림 한 장씩으로 고정, 그림 파일은 쓰는 것만 있다", () => {
  const used = [];
  for (const s of withCard) {
    assert.equal((s.card.art || []).length, 1, s.id);
    const a = s.card.art[0];
    used.push(a.file);
    assert.ok(existsSync(new URL(`../../public/assets/img/art/${a.file}`, import.meta.url)), a.file);
    const b = a.bubble;
    assert.ok(b && b.text && ["left", "right", "down"].includes(b.tail), a.file);
    assert.ok(!(b.x > 75 && b.y < 26), a.file);   // 오른쪽 위 전투력 눈금 자리는 비운다
    const front = card(s, 1);
    assert.match(front, /class="card card--plan"/);
    assert.ok(front.includes(`/assets/img/art/${a.file}`), s.id);
  }
  assert.deepEqual(readdirSync(new URL("../../public/assets/img/art/", import.meta.url)).sort(), used.sort());
  assert.doesNotMatch(css, /card--catalog|vsec|\.pick/);   // 예비 시안·시안 페이지 꾸밈은 지움
});

test("앞면에는 설명글이 없고 이야기는 뒷면에만 있다", () => {
  const s = withCard[0];
  const front = card(s, 1);
  assert.doesNotMatch(front, /<p>/);
  assert.ok(!front.includes(s.card.story));
  assert.equal((front.match(/card__skill-name/g) || []).length, s.card.skills.length);
  assert.ok(back(s).includes(s.card.story));
  assert.match(back(s), /card--back"><div class="card__backin"><div class="card__story">/);   // 무늬·이름판 없는 깨끗한 뒷면
});

test("카드 번호는 12장 안에서 전투력 순 No.01~No.12", () => {
  const list = kidCards(all);
  assert.deepEqual(list.map((s) => s.card.power), [...list.map((s) => s.card.power)].sort((a, b) => b - a));
  const html = sheets(all);
  const nos = [...html.matchAll(/No\.(\d\d)/g)].map((m) => +m[1]);
  assert.deepEqual(nos, Array.from({ length: 12 }, (_, i) => i + 1));
});

test("인쇄 쪽: 앞면 쪽 다음에 뒷면 쪽, 뒷면은 줄마다 좌우를 뒤집는다(양면 긴 쪽 넘김)", () => {
  const html = sheets(all);
  const pages = html.split(/(?=<section class="sheet )/);
  assert.equal(pages.length, 4);   // 9장 + 3장 → 앞·뒤·앞·뒤
  assert.deepEqual(pages.map((p) => p.match(/sheet--(front|back)/)[1]), ["front", "back", "front", "back"]);
  const list = kidCards(all);
  const names = (p) => [...p.matchAll(/<article class="card card--plan( card--back)?"[^]*?<(?:h3 class="card__name"|h4)>([^<]+)</g)].map((m) => m[2]);
  const nm = (s) => s.card.name || s.name;
  assert.deepEqual(names(pages[0]), list.slice(0, 9).map(nm));
  const firstRowBack = names(pages[1]).slice(0, 3);
  assert.deepEqual(firstRowBack, list.slice(0, 3).map(nm).reverse());
  // 3장만 있는 쪽: 앞면은 왼쪽부터, 뒷면은 오른쪽부터(빈칸 자리 유지)
  assert.equal((pages[2].match(/sheet__empty/g) || []).length, 0);
  assert.deepEqual(names(pages[3]), list.slice(9, 12).map(nm).reverse());
  assert.match(css, /@page \{ size: A4; margin: 0; \}/);
  assert.match(css, /\.sheet \.card \{ --w: 63mm;/);   // 실제 카드 크기
});

test("앱에는 시안·검수 문구와 임시 띠가 없다 (최종본)", () => {
  const files = ["../../public/index.html", "../../public/assets/js/app.js", "../../public/assets/css/app.css"];
  for (const f of files) {
    const t = readFileSync(new URL(f, import.meta.url), "utf8");
    assert.doesNotMatch(t, /시안|검수|devstrip|cards\.html/, f);
  }
  assert.ok(!existsSync(new URL("../../public/cards.html", import.meta.url)));
});

test("5-1 스킬 칸에는 점선 네모가 없다", () => {
  assert.doesNotMatch(css, /\.card__skill \{[^}]*dashed/);
});
