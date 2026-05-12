/**
 * E12-4 분쟁 처리 결과 알림 (terminal 전이 — resolved / rejected).
 *
 * 베타 단계 단순화 (Plan-v2-scenario-B Q4 결정):
 *   - 한국어 단일 (kyc-result는 다국어 6개 — disputes는 사장 대상이라 한국어 fixed)
 *   - 이메일 1건 (인박스 메시지·다국어는 다음 phase)
 *
 * 발송 실패는 caller 응답에 영향 없음 (kyc-result 패턴 — try/catch + console.error).
 */
import "server-only";

import { createDbClient, eq, users } from "@hesya/database";
import { Resend } from "resend";

import { env } from "@/shared/config/env";
import { getDispute } from "@/shared/lib/dal/disputes";
import { logMockEmail } from "./mock-helper";

const resend = new Resend(env.RESEND_API_KEY);

export interface DisputeNotificationInput {
  disputeId: string;
  status: "resolved" | "rejected";
  resolution: string | null;
}

export async function sendDisputeNotification(
  input: DisputeNotificationInput,
): Promise<void> {
  const db = createDbClient(env.DATABASE_URL);

  const dispute = await getDispute(db, input.disputeId);
  if (!dispute) {
    console.error("[dispute] 알림 대상 dispute 없음:", input.disputeId);
    return;
  }
  if (!dispute.filedByUserId) {
    console.error("[dispute] filedByUserId 없음, 알림 skip:", input.disputeId);
    return;
  }

  const rows = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, dispute.filedByUserId))
    .limit(1);
  const email = rows[0]?.email;
  if (!email) {
    console.error(
      "[dispute] 사장 이메일 없음, 알림 skip:",
      dispute.filedByUserId,
    );
    return;
  }

  const subject =
    input.status === "resolved"
      ? "[Hesya] 분쟁 처리가 완료되었습니다"
      : "[Hesya] 분쟁 신청이 거절되었습니다";

  const lines = [
    `안녕하세요. 신청하신 분쟁(#${dispute.id.slice(0, 8)})에 대한 결과를 안내드립니다.`,
    "",
    `· 카테고리: ${formatCategory(dispute.category)}`,
    `· 처리 상태: ${input.status === "resolved" ? "해결" : "거절"}`,
    input.resolution ? `· 처리 메모: ${input.resolution}` : null,
    "",
    "추가 문의는 hello@hesya.app으로 회신 주세요.",
  ].filter((line): line is string => line !== null);

  if (env.MOCK_NOTIFICATION) {
    logMockEmail({
      kind: "dispute-result",
      to: email,
      subject,
      bodyPreview: lines.join(" "),
    });
    return;
  }

  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: email,
    subject,
    text: lines.join("\n"),
  });
}

function formatCategory(category: string): string {
  switch (category) {
    case "no_show":
      return "노쇼";
    case "refund":
      return "환불 요청";
    case "complaint":
      return "컴플레인";
    default:
      return category;
  }
}
