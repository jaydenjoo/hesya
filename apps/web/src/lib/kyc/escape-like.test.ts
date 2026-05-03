/**
 * LOCALDATA `cond[FIELD::LIKE]` 파라미터에 사용자 입력을 그대로 넣으면
 * `%`/`_`이 와일드카드로 해석되어 의도와 다른 검색 결과가 나옴. ANSI SQL
 * LIKE escape 규약(`\` `%` `_`)을 적용해 리터럴 매칭 보장.
 *
 * 실 거동: data.go.kr 측이 backslash escape를 무시하더라도 입력 문자열에 그
 * 문자가 없으면 영향 0 — 안전한 기본값.
 */
import { describe, expect, it } from "vitest";
import { escapeLocaldataLike } from "./escape-like";

describe("escapeLocaldataLike", () => {
  it("plain한 문자열은 변경 없이 그대로 반환", () => {
    expect(escapeLocaldataLike("청담미용실")).toBe("청담미용실");
    expect(escapeLocaldataLike("Seoul Hair")).toBe("Seoul Hair");
    expect(escapeLocaldataLike("")).toBe("");
  });

  it("`%` (percent) → `\\%`로 escape", () => {
    expect(escapeLocaldataLike("50% off")).toBe("50\\% off");
    expect(escapeLocaldataLike("%%%")).toBe("\\%\\%\\%");
  });

  it("`_` (underscore) → `\\_`로 escape", () => {
    expect(escapeLocaldataLike("hair_salon")).toBe("hair\\_salon");
    expect(escapeLocaldataLike("___")).toBe("\\_\\_\\_");
  });

  it("`\\` (backslash) → `\\\\`로 escape (다른 escape 보다 먼저 처리)", () => {
    expect(escapeLocaldataLike("path\\to\\store")).toBe("path\\\\to\\\\store");
    // backslash + percent를 한 번에 처리해도 두 번 escape되지 않아야 함
    expect(escapeLocaldataLike("\\%")).toBe("\\\\\\%");
  });
});
