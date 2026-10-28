import assert from "node:assert/strict";
import { test } from "node:test";

import { fillLine, finalSound } from "../../public/js/josa.js";

test("받침 없는 말 뒤에는 를", () => {
  assert.equal(fillLine("나는 {답}{을/를} 날려 보내고 싶은 화차야!", "젤리"), "나는 젤리를 날려 보내고 싶은 화차야!");
});

test("받침 있는 말 뒤에는 을", () => {
  assert.equal(fillLine("나는 {답}{을/를} 맞혀 보고 싶은 활이야!", "사탕"), "나는 사탕을 맞혀 보고 싶은 활이야!");
});

test("으로/로는 ㄹ받침 뒤에서 로", () => {
  assert.equal(fillLine("{답}{으로/로} 가자", "물"), "물로 가자");
  assert.equal(fillLine("{답}{으로/로} 가자", "집"), "집으로 가자");
  assert.equal(fillLine("{답}{으로/로} 가자", "바다"), "바다로 가자");
});

test("이/가, 은/는, 과/와, 아/야", () => {
  assert.equal(fillLine("{답}{이/가}", "곰"), "곰이");
  assert.equal(fillLine("{답}{은/는}", "토끼"), "토끼는");
  assert.equal(fillLine("{답}{과/와}", "별"), "별과");
  assert.equal(fillLine("{답}{아/야}", "민준"), "민준아");
});

test("숫자는 읽는 소리로 판단", () => {
  assert.equal(fillLine("{답}{을/를}", "3"), "3을");
  assert.equal(fillLine("{답}{을/를}", "2"), "2를");
  assert.equal(fillLine("{답}{으로/로}", "1"), "1로");
});

test("영어 끝 글자", () => {
  assert.equal(fillLine("{답}{을/를}", "ball"), "ball을");
  assert.equal(fillLine("{답}{을/를}", "pizza"), "pizza를");
});

test("끝의 문장부호와 공백은 건너뛰고 판단", () => {
  assert.equal(finalSound("사탕! "), "other");
  assert.equal(finalSound("젤리~"), "");
});

test("알 수 없는 끝 글자는 받침 없는 쪽", () => {
  assert.equal(finalSound("★"), null);
  assert.equal(fillLine("{답}{을/를}", "★"), "★를");
});

test("조사 칸이 없는 대사는 대답만 넣음", () => {
  assert.equal(fillLine("나는 {답}처럼 생긴 화살촉이 되고 싶어!", " 하트 "), "나는 하트처럼 생긴 화살촉이 되고 싶어!");
});
