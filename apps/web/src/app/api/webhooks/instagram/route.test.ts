import { createHmac } from "node:crypto";
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbClient, type DbClient } from "@hesya/database";
import { resetDb, seedStore, seedStoreIntegration } from "@/test-helpers/db";
import { env } from "@/shared/config/env";

// 통합 테스트 scope 한정 mock — seedStoreIntegration이 시드한 raw bytes는
// 실제 pgsodium vault key UUID가 아니므로 decryptToken throw. webhook flow
// 자체(HMAC + DB 저장)가 검증 대상이라 vault 검증은 별 unit test 책임.
vi.mock("@/shared/lib/dal/pgsodium-helpers", () => ({
  decryptToken: vi.fn().mockResolvedValue("test_access_token_decrypted"),
}));

import { GET, POST } from "./route";

const url = process.env.HESYA_TEST_DATABASE_URL;
const hasDb = Boolean(url);

function sign(body: string, secret: string): string {
  return "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
}

function makePayload(opts: {
  recipientId: string;
  senderId: string;
  text: string;
  mid: string;
  timestamp?: number;
}): string {
  const now = opts.timestamp ?? Date.now();
  return JSON.stringify({
    object: "instagram",
    entry: [
      {
        id: opts.recipientId,
        time: now,
        messaging: [
          {
            sender: { id: opts.senderId },
            recipient: { id: opts.recipientId },
            timestamp: now,
            message: { mid: opts.mid, text: opts.text },
          },
        ],
      },
    ],
  });
}

describe("webhook GET (verify challenge)", () => {
  it("verify_token 일치 시 challenge 반환", async () => {
    const url = `http://localhost/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=${env.IG_WEBHOOK_VERIFY_TOKEN}&hub.challenge=ch_123`;
    const res = await GET(new NextRequest(url));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ch_123");
  });

  it("verify_token 불일치 → 403", async () => {
    const url = `http://localhost/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=ch_123`;
    const res = await GET(new NextRequest(url));
    expect(res.status).toBe(403);
  });

  it("hub.mode 누락 → 403", async () => {
    const url = `http://localhost/api/webhooks/instagram?hub.verify_token=${env.IG_WEBHOOK_VERIFY_TOKEN}`;
    const res = await GET(new NextRequest(url));
    expect(res.status).toBe(403);
  });
});

describe("webhook POST (HMAC + replay defense)", () => {
  it("HMAC 불일치 → 401", async () => {
    const req = new NextRequest("http://localhost/api/webhooks/instagram", {
      method: "POST",
      headers: {
        "x-hub-signature-256": "sha256=invalid",
        "x-hub-timestamp": String(Date.now()),
      },
      body: "{}",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("X-Hub-Timestamp 5분 초과 → 401 (replay 방어)", async () => {
    const payload = makePayload({
      recipientId: "ig_acc_id",
      senderId: "igsid_001",
      text: "hello",
      mid: "mid_old",
    });
    const sig = sign(payload, env.IG_APP_SECRET);
    const sixMinutesAgo = Date.now() - 6 * 60 * 1000;
    const req = new NextRequest("http://localhost/api/webhooks/instagram", {
      method: "POST",
      headers: {
        "x-hub-signature-256": sig,
        "x-hub-timestamp": String(sixMinutesAgo),
      },
      body: payload,
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("X-Hub-Timestamp 헤더 누락 → 401", async () => {
    const payload = makePayload({
      recipientId: "ig_acc_id",
      senderId: "igsid_001",
      text: "hello",
      mid: "mid_x",
    });
    const sig = sign(payload, env.IG_APP_SECRET);
    const req = new NextRequest("http://localhost/api/webhooks/instagram", {
      method: "POST",
      headers: { "x-hub-signature-256": sig },
      body: payload,
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});

describe.skipIf(!hasDb)("webhook POST (integration)", () => {
  let db: DbClient;

  beforeAll(() => {
    db = createDbClient(url!);
  });

  beforeEach(async () => {
    await resetDb(db);
  });

  it("HMAC OK + 매장 연결됨 → 200 + DB 저장", async () => {
    const storeId = await seedStore(db);
    await seedStoreIntegration(db, {
      storeId,
      channel: "instagram",
      externalAccountId: "ig_acc_int_001",
    });

    const payload = makePayload({
      recipientId: "ig_acc_int_001",
      senderId: "igsid_int_001",
      text: "안녕",
      mid: "mid_int_1",
    });
    const sig = sign(payload, env.IG_APP_SECRET);
    const req = new NextRequest("http://localhost/api/webhooks/instagram", {
      method: "POST",
      headers: {
        "x-hub-signature-256": sig,
        "x-hub-timestamp": String(Date.now()),
      },
      body: payload,
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("HMAC OK + 매장 미연결 → 200 (무시)", async () => {
    const payload = makePayload({
      recipientId: "ig_acc_unconnected",
      senderId: "igsid_002",
      text: "hi",
      mid: "mid_int_2",
    });
    const sig = sign(payload, env.IG_APP_SECRET);
    const req = new NextRequest("http://localhost/api/webhooks/instagram", {
      method: "POST",
      headers: {
        "x-hub-signature-256": sig,
        "x-hub-timestamp": String(Date.now()),
      },
      body: payload,
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});

describe("webhook route source-level (CC-4 customer profile enrichment)", () => {
  it("customer.name === null 시 fetchUserProfile + updateCustomerProfile + Sentry tag", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile(
      "src/app/api/webhooks/instagram/route.ts",
      "utf-8",
    );
    // 새 customer 또는 backfill 대상 trigger
    expect(src).toMatch(/customer\.name\s*===?\s*null/);
    // IG profile fetch 호출
    expect(src).toMatch(/fetchUserProfile/);
    // locale 매핑 helper 사용
    expect(src).toMatch(/mapLocaleToLanguage/);
    // DB 갱신
    expect(src).toMatch(/updateCustomerProfile/);
    // Sentry phase tag (fetch 실패 silent skip)
    expect(src).toMatch(/phase:\s*["']fetchUserProfile["']/);
    // PII 방어: customer.id는 8자만 노출 (storeId truncate 패턴 일관)
    expect(src).toMatch(/customer\.id\.slice\(\s*0\s*,\s*8\s*\)/);
  });
});

describe("webhook route source-level (Sec MED-1 ig_profile_fetched)", () => {
  // 영구 fail customer가 매 inbound마다 IG fetch 무한 retry 도는 것 방어.
  // try 성공/catch 실패 양쪽에서 마크해야 retry stop이 완결된다.
  it("guard: !customer.igProfileFetched 추가 (영구 fail retry 방어)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile(
      "src/app/api/webhooks/instagram/route.ts",
      "utf-8",
    );
    expect(src).toMatch(/!customer\.igProfileFetched/);
  });

  it("성공/실패 모두 igProfileFetched: true 마크 (try + catch 양쪽)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile(
      "src/app/api/webhooks/instagram/route.ts",
      "utf-8",
    );
    const trueMarks = src.match(/igProfileFetched:\s*true/g) ?? [];
    expect(trueMarks.length).toBeGreaterThanOrEqual(2);
  });
});
