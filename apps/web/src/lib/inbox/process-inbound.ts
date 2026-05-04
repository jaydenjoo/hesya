/**
 * Webhook inbound 메시지 후처리 hook.
 *
 * - **1A**: 빈 함수 (DB 저장만으로 충분).
 * - **1C**: AI 자동 응답 + 번역 + RAG 트리거 (queue 또는 fire-and-forget).
 *
 * Webhook route handler가 fire-and-forget으로 호출 → 200 OK 응답을 막지 않음.
 *
 * @see docs/superpowers/specs/2026-05-04-epic-1a-inbox-instagram-design.md § 2.5
 */
export async function processInbound(messageId: string): Promise<void> {
  // 1A intentionally empty — messageId는 1C에서 AI 응답 트리거에 사용 예정.
  void messageId;
}
