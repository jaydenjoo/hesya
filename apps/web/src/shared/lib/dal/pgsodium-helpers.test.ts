import { describe, it, expect, beforeAll } from "vitest";
import { createDbClient, type DbClient } from "@hesya/database";
import { encryptToken, decryptToken } from "./pgsodium-helpers";

/**
 * 통합 테스트 — 실제 Supabase DB(vault 확장 활성)에 연결.
 *
 * `DATABASE_URL` env가 dev branch / test DB를 가리킬 때만 실행. 미설정 시
 * skip (CI에서 안전하게 통과). 헬퍼가 `db`를 인자로 받기 때문에 env 모듈
 * 검증과 디커플됨 — 테스트는 env.ts 로드 X.
 */
const url = process.env.HESYA_TEST_DATABASE_URL;
const hasDb = Boolean(url);

describe.skipIf(!hasDb)("vault token helpers (integration)", () => {
  let db: DbClient;
  beforeAll(() => {
    db = createDbClient(url!);
  });

  it("암호화-복호화 라운드트립 통과", async () => {
    const original = "ig_long_lived_token_abc123";
    const encrypted = await encryptToken(db, original);
    expect(Buffer.isBuffer(encrypted)).toBe(true);
    expect(encrypted.length).toBe(16);

    const decrypted = await decryptToken(db, encrypted);
    expect(decrypted).toBe(original);
  });

  it("동일 평문도 매번 다른 secret_id 생성 (vault row가 다름)", async () => {
    const a = await encryptToken(db, "foo");
    const b = await encryptToken(db, "foo");
    expect(a.equals(b)).toBe(false);

    expect(await decryptToken(db, a)).toBe("foo");
    expect(await decryptToken(db, b)).toBe("foo");
  });
});

describe("vault token helpers (pure validation)", () => {
  it("16바이트가 아닌 buffer는 거부", async () => {
    const fakeDb = {} as DbClient;
    await expect(decryptToken(fakeDb, Buffer.alloc(8))).rejects.toThrow(
      /expected 16-byte/,
    );
  });
});
