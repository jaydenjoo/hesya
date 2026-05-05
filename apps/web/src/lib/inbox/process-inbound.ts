/**
 * Webhook inbound 메시지 후처리 hook.
 *
 * **Phase B-2** — AI 응답 초안 생성 및 저장 트리거. IG 발송은 Phase B-3.
 *
 * Webhook route handler가 fire-and-forget으로 호출하며 `.catch()`로 Sentry에
 * 보고함 → 본 함수는 generateAndStoreReply의 throw를 그대로 전파한다.
 * skip 사유(이미 응답함, 매장 정보 부족 등)는 정상 흐름이라 silent.
 *
 * @see docs/superpowers/specs/2026-05-04-epic-1a-inbox-instagram-design.md § 2.5
 */
import { generateAndStoreReply } from "@/features/inbox/ai/generate-and-store-reply";

export async function processInbound(messageId: string): Promise<void> {
  await generateAndStoreReply(messageId);
}
