import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ValidationError, WebhookSignatureError } from "@/shared/lib/errors";
import { createInstagramAdapter } from "./instagram-adapter";
import type { InstagramApiClient } from "./instagram-api-client";

const SECRET = "test_app_secret";

function sign(body: string, secret: string): string {
  return "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
}

const samplePayload = JSON.stringify({
  object: "instagram",
  entry: [
    {
      time: 1714780800000,
      id: "ig_acc_id",
      messaging: [
        {
          sender: { id: "igsid_user_001" },
          recipient: { id: "ig_acc_id" },
          timestamp: 1714780800000,
          message: { mid: "mid_abc", text: "안녕하세요, 단발 가능?" },
        },
      ],
    },
  ],
});

describe("instagramAdapter.parseInbound", () => {
  const adapter = createInstagramAdapter({} as InstagramApiClient);

  it("HMAC 일치 → InboundMessage[] 반환", async () => {
    const sig = sign(samplePayload, SECRET);
    const list = await adapter.parseInbound(samplePayload, sig, SECRET);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      channel: "instagram",
      externalMessageId: "mid_abc",
      senderExternalId: "igsid_user_001",
      recipientExternalId: "ig_acc_id",
      text: "안녕하세요, 단발 가능?",
    });
  });

  it("HMAC 불일치 → WebhookSignatureError", async () => {
    const sig = "sha256=invalid";
    await expect(
      adapter.parseInbound(samplePayload, sig, SECRET),
    ).rejects.toBeInstanceOf(WebhookSignatureError);
  });

  it("payload에 message 없음 (read receipt 등) → 빈 배열", async () => {
    const noMsg = JSON.stringify({
      object: "instagram",
      entry: [
        {
          id: "x",
          time: 1,
          messaging: [
            {
              sender: { id: "a" },
              recipient: { id: "b" },
              timestamp: 1,
              read: { mid: "m" },
            },
          ],
        },
      ],
    });
    const sig = sign(noMsg, SECRET);
    const list = await adapter.parseInbound(noMsg, sig, SECRET);
    expect(list).toHaveLength(0);
  });
});

describe("instagramAdapter.sendOutbound", () => {
  it("API client에 올바른 인자 전달, externalMessageId 반환", async () => {
    const calls: Array<{
      recipientId: string;
      text: string;
      pageId: string;
      accessToken: string;
    }> = [];
    const fakeClient: Partial<InstagramApiClient> = {
      sendMessage: async (input) => {
        calls.push(input);
        return { messageId: "mid_out_123" };
      },
    };
    const adapter = createInstagramAdapter(fakeClient as InstagramApiClient);
    const result = await adapter.sendOutbound(
      { externalRecipientId: "igsid_user_001", text: "네! 가능합니다." },
      { accessToken: "tok_abc", externalPageId: "page_id_1" },
    );
    expect(result).toEqual({ externalMessageId: "mid_out_123" });
    expect(calls[0]).toMatchObject({
      recipientId: "igsid_user_001",
      text: "네! 가능합니다.",
      pageId: "page_id_1",
      accessToken: "tok_abc",
    });
  });

  it("externalPageId 없으면 throw", async () => {
    const fakeClient: Partial<InstagramApiClient> = {
      sendMessage: async () => ({ messageId: "x" }),
    };
    const adapter = createInstagramAdapter(fakeClient as InstagramApiClient);
    await expect(
      adapter.sendOutbound(
        { externalRecipientId: "igsid_user_001", text: "x" },
        { accessToken: "tok_abc" },
      ),
    ).rejects.toThrow(/pageId/);
  });
});

describe("instagramAdapter.exchangeCode", () => {
  it("short → long-lived → /me 호출 후 ExchangeCodeResult 반환", async () => {
    const fakeClient: Partial<InstagramApiClient> = {
      exchangeShortLivedToken: async () => ({
        accessToken: "short_tok",
        userId: "u1",
      }),
      exchangeLongLivedToken: async () => ({
        accessToken: "long_tok",
        expiresIn: 60 * 60 * 24 * 60, // 60 days
      }),
      getMe: async () => ({ id: "ig_acc_id", username: "demo_salon" }),
    };
    const adapter = createInstagramAdapter(fakeClient as InstagramApiClient, {
      appId: "app1",
      appSecret: "secret",
    });
    const r = await adapter.exchangeCode("auth_code", "https://example.com/cb");
    expect(r.accessToken).toBe("long_tok");
    expect(r.externalAccountId).toBe("ig_acc_id");
    expect(r.externalAccountName).toBe("demo_salon");
    expect(r.scopes).toEqual([
      "instagram_business_basic",
      "instagram_business_manage_messages",
    ]);
    expect(r.expiresAt!.getTime()).toBeGreaterThan(Date.now());
  });

  it("appId/appSecret 없으면 exchangeCode 호출 시 throw", async () => {
    const adapter = createInstagramAdapter({} as InstagramApiClient);
    await expect(
      adapter.exchangeCode("code", "https://example.com/cb"),
    ).rejects.toThrow(/appId|appSecret/);
  });
});

describe("instagramAdapter (pure)", () => {
  it("createInstagramAdapter exports channel='instagram'", () => {
    const adapter = createInstagramAdapter({} as InstagramApiClient);
    expect(adapter.channel).toBe("instagram");
  });
});

describe("instagramAdapter payload validation (H-3 Zod)", () => {
  it("HMAC 통과 + JSON 파싱 실패 → ValidationError", async () => {
    const adapter = createInstagramAdapter({} as InstagramApiClient);
    const malformed = "{ not valid json";
    const sig = sign(malformed, SECRET);
    await expect(
      adapter.parseInbound(malformed, sig, SECRET),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("HMAC 통과 + schema 위반 (object='facebook') → ValidationError", async () => {
    const adapter = createInstagramAdapter({} as InstagramApiClient);
    const wrong = JSON.stringify({ object: "facebook", entry: [] });
    const sig = sign(wrong, SECRET);
    await expect(
      adapter.parseInbound(wrong, sig, SECRET),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("HMAC 통과 + entry 누락 → ValidationError", async () => {
    const adapter = createInstagramAdapter({} as InstagramApiClient);
    const noEntry = JSON.stringify({ object: "instagram" });
    const sig = sign(noEntry, SECRET);
    await expect(
      adapter.parseInbound(noEntry, sig, SECRET),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("instagramAdapter HMAC verify (timing-safe 보안)", () => {
  it("HMAC 길이 다른 sig도 throw (length leak 방지)", async () => {
    const adapter = createInstagramAdapter({} as InstagramApiClient);
    const shortSig = "sha256=short";
    await expect(
      adapter.parseInbound(samplePayload, shortSig, SECRET),
    ).rejects.toBeInstanceOf(WebhookSignatureError);
    const longSig = "sha256=" + "a".repeat(200);
    await expect(
      adapter.parseInbound(samplePayload, longSig, SECRET),
    ).rejects.toBeInstanceOf(WebhookSignatureError);
  });

  it("instagram-adapter.ts: length short-circuit 패턴 부재 (timingSafeEqual 무조건 호출)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile("src/lib/inbox/instagram-adapter.ts", "utf-8");
    expect(src).not.toMatch(
      /sigBuf\.length\s*!==\s*expBuf\.length\s*\|\|\s*!timingSafeEqual/,
    );
  });
});
