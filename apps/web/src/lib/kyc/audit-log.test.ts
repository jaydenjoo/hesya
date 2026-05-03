/**
 * E9-12 audit-log helper 단위 테스트.
 *
 * helper는 INSERT 호출자 (DB 의존). 실 INSERT는 Supabase MCP smoke로 검증.
 * 단위 테스트는 input → repository에 전달되는 row shape 정확성만 검증.
 *
 * mock repository: db.insert() 대신 capture function 주입 → row 검증.
 */
import { describe, expect, it } from "vitest";
import { logKycEvent, type KycEventInsert } from "./audit-log";

function makeRepo() {
  const captured: KycEventInsert[] = [];
  return {
    captured,
    insert: async (row: KycEventInsert) => {
      captured.push(row);
    },
  };
}

describe("logKycEvent", () => {
  it("nts_check: verificationId + eventData 포함된 row INSERT", async () => {
    const repo = makeRepo();
    await logKycEvent({
      repo,
      verificationId: "11111111-1111-1111-1111-111111111111",
      eventType: "nts_check",
      eventData: { b_no: "1234567890", valid: "01" },
      actorUserId: "22222222-2222-2222-2222-222222222222",
    });
    expect(repo.captured).toHaveLength(1);
    expect(repo.captured[0]).toMatchObject({
      verificationId: "11111111-1111-1111-1111-111111111111",
      eventType: "nts_check",
      eventData: { b_no: "1234567890", valid: "01" },
      actorUserId: "22222222-2222-2222-2222-222222222222",
    });
  });

  it("cron_revalidate: actorUserId 없으면 row에 누락", async () => {
    const repo = makeRepo();
    await logKycEvent({
      repo,
      verificationId: "33333333-3333-3333-3333-333333333333",
      eventType: "cron_revalidate",
      eventData: { totalScore: 0.42 },
    });
    expect(repo.captured).toHaveLength(1);
    expect(repo.captured[0].actorUserId).toBeUndefined();
  });

  it("INSERT 실패해도 throw X (KYC 응답에 영향 없음)", async () => {
    const failingRepo = {
      insert: async () => {
        throw new Error("DB connection lost");
      },
    };
    await expect(
      logKycEvent({
        repo: failingRepo,
        verificationId: "44444444-4444-4444-4444-444444444444",
        eventType: "status_change",
        eventData: { from: "pending", to: "auto_approved" },
      }),
    ).resolves.toBeUndefined();
  });

  it("eventData 없어도 동작 (notification_sent 기본 케이스)", async () => {
    const repo = makeRepo();
    await logKycEvent({
      repo,
      verificationId: "55555555-5555-5555-5555-555555555555",
      eventType: "notification_sent",
    });
    expect(repo.captured).toHaveLength(1);
    expect(repo.captured[0].eventData).toBeUndefined();
  });
});
