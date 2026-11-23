import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

// 종류 파악용 전체 유물 페이지(/all.html): 상설 유물 이름 + 사진만, 기획전은 뺀다.
const data = JSON.parse(readFileSync(new URL("../../public/assets/data/all.json", import.meta.url), "utf8"));
const items = data.groups.flatMap((g) => g.items);

test("전체 유물: 모든 칸에 이름과 있는 사진 파일이 있고, 이름이 겹치지 않는다", () => {
  assert.ok(items.length >= 40);
  for (const it of items) {
    assert.ok(it.name && it.img, JSON.stringify(it));
    assert.deepEqual(Object.keys(it).sort(), ["img", "name"]);   // 내용은 아직 넣지 않는다
    assert.ok(existsSync(new URL(`../../public/assets/img/${it.img}`, import.meta.url)), it.img);
  }
  assert.equal(new Set(items.map((it) => it.name)).size, items.length);
});

test("전체 유물: 기획전 유물은 없다", () => {
  const names = items.map((it) => it.name).join("|");
  for (const x of ["김성락", "김제덕", "리플렛", "자료집", "각궁 재료", "예궁", "깍지", "궁대", "궁도", "상장", "원고", "활터"]) {
    assert.ok(!names.includes(x), x);
  }
});

test("전체 유물: all/ 폴더에는 쓰는 사진만 있다", () => {
  const used = items.filter((it) => it.img.startsWith("all/")).map((it) => it.img.slice(4)).sort();
  assert.deepEqual(readdirSync(new URL("../../public/assets/img/all/", import.meta.url)).sort(), used);
});
