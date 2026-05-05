import "server-only";
import {
  and,
  asc,
  desc,
  eq,
  messages,
  type Channel,
  type DbClient,
  type MessageMetadata,
} from "@hesya/database";

type Message = typeof messages.$inferSelect;
type Direction = "inbound" | "outbound";

export async function insertMessage(
  db: DbClient,
  input: {
    conversationId: string;
    channel: Channel;
    direction: Direction;
    originalText: string;
    externalMessageId?: string;
    status?: string;
    /** Epic 1B-Tone-1 — 4 tone variations 포함 (1B-Tone-3에서 채워짐). */
    metadata?: MessageMetadata;
  },
): Promise<Message | null> {
  const defaultStatus =
    input.status ?? (input.direction === "outbound" ? "sent" : null);

  const inserted = await db
    .insert(messages)
    .values({
      conversationId: input.conversationId,
      channel: input.channel,
      direction: input.direction,
      originalText: input.originalText,
      externalMessageId: input.externalMessageId,
      status: defaultStatus,
      metadata: input.metadata,
    })
    .onConflictDoNothing()
    .returning();

  if (inserted[0]) return inserted[0];

  // conflict 발생 — externalMessageId 없으면 조회 불가, null 반환 (caller가 처리)
  if (!input.externalMessageId) return null;

  const existing = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.channel, input.channel),
        eq(messages.externalMessageId, input.externalMessageId),
      ),
    )
    .limit(1);

  // race condition: insert와 select 사이에 row 삭제 → null 반환 (caller 결정)
  return existing[0] ?? null;
}

export async function listByConversation(
  db: DbClient,
  conversationId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<Message[]> {
  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))
    .limit(opts.limit ?? 200)
    .offset(opts.offset ?? 0);
}

/**
 * messageId로 단건 조회. Phase B-2 AI 트리거가 inbound 검증·conversationId 추출에 사용.
 */
export async function findMessageById(
  db: DbClient,
  id: string,
): Promise<Message | null> {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * inbound 메시지에 AI 응답 발생 마킹. Phase B-2 중복 트리거 방어.
 *
 * **Race-safe**: `WHERE ai_responded = false` conditional UPDATE + RETURNING.
 * 동시 호출 시 한 트랜잭션만 1 row 반환, 나머지는 0 row → false. caller가
 * 두 번째 generateReply/insert를 차단할 수 있다 (TOCTOU 방어).
 *
 * 반환값: false → true 전환이 실제 발생했으면 `true`, 이미 true였으면 `false`.
 */
export async function markAIResponded(
  db: DbClient,
  messageId: string,
): Promise<boolean> {
  const updated = await db
    .update(messages)
    .set({ aiResponded: true })
    .where(and(eq(messages.id, messageId), eq(messages.aiResponded, false)))
    .returning({ id: messages.id });
  return updated.length > 0;
}

/**
 * 직전 N개 메시지를 ASC(오래된→최신) 순서로 반환. Phase B-2 AI 트리거가
 * `buildPrompt.recentMessages` 입력으로 사용.
 *
 * 구현: DESC + limit으로 최신 N개만 fetch한 뒤 reverse → 메모리 비용 O(N).
 * `listByConversation`(ASC + offset)은 페이지네이션용이라 끝쪽 N개를 뽑으려면
 * 전체 count 조회가 필요해 부적합.
 */
export async function listRecentByConversation(
  db: DbClient,
  conversationId: string,
  limit: number,
): Promise<Message[]> {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
  return rows.reverse();
}

/**
 * outbound 메시지에 번역본 저장. Phase B-3a 자동 번역이 호출.
 *
 * 멱등 — 같은 messageId 재호출 시 단순 overwrite (사장 수정 후 재번역 시나리오 허용).
 * race-safe claim 불필요 — 번역은 idempotent하고 사장 검수 전 백그라운드 작업이라
 * 중복 호출 비용이 낮음 (`markAIResponded`와 동기화되는 outbound 1건당 0~1회).
 *
 * **방어적 가드**: `direction='outbound'` 조건으로 inbound 메시지의 translated_text
 * 덮어쓰기 차단 (B-3a review LOW — 미래 caller 오용 방어).
 */
export async function markTranslated(
  db: DbClient,
  messageId: string,
  data: { translatedText: string; languageTo: string },
): Promise<void> {
  await db
    .update(messages)
    .set({
      translatedText: data.translatedText,
      languageTo: data.languageTo,
    })
    .where(and(eq(messages.id, messageId), eq(messages.direction, "outbound")));
}

export async function markFailed(
  db: DbClient,
  messageId: string,
): Promise<void> {
  await db
    .update(messages)
    .set({ status: "failed" })
    .where(eq(messages.id, messageId));
}

/**
 * Phase B-3c — '그대로 보내기' 클릭 시 ai_draft outbound를 sending으로 잠금.
 *
 * **Race-safe**: `WHERE status='ai_draft'` conditional UPDATE + RETURNING.
 * 동시 두 클릭 → 한 트랜잭션만 1 row 반환, 나머지는 0 row → null.
 * caller가 두 번째 IG send 호출을 차단할 수 있다 (L-058 패턴).
 *
 * **Ownership 가드**: messages는 store_id가 없으므로 caller가 conversation
 * 조회로 store_id 일치를 검증한 뒤 본 함수를 호출. 본 함수는 status 가드만
 * 담당하여 단일 책임 유지.
 *
 * 반환값: claim 성공 시 row, 이미 처리됐거나 messageId 없으면 null.
 */
export async function claimAiDraftForSend(
  db: DbClient,
  messageId: string,
): Promise<Message | null> {
  const updated = await db
    .update(messages)
    .set({ status: "sending" })
    .where(and(eq(messages.id, messageId), eq(messages.status, "ai_draft")))
    .returning();
  return updated[0] ?? null;
}

/**
 * Phase B-3c — IG send 성공 시 status='sending' → 'sent' 전환 + external_message_id 저장.
 *
 * **방어적 가드**: `WHERE status='sending'`로 잠금된 row만 업데이트
 * (이미 sent/failed/ai_draft에 덮어쓰기 차단). 멱등 — claim 안 된 row 호출 시 no-op.
 */
export async function markMessageSent(
  db: DbClient,
  messageId: string,
  externalMessageId: string,
): Promise<void> {
  await db
    .update(messages)
    .set({ status: "sent", externalMessageId })
    .where(and(eq(messages.id, messageId), eq(messages.status, "sending")));
}

/**
 * Phase B-3c — IG send 실패/window expired 시 status='sending' → 'ai_draft' 복원.
 *
 * 사장이 알림 보고 재시도 가능. **방어적 가드**: `WHERE status='sending'`로
 * 잠금된 row만 복원 (이미 sent된 row의 status를 ai_draft로 되돌리기 차단).
 */
export async function revertAiDraftClaim(
  db: DbClient,
  messageId: string,
): Promise<void> {
  await db
    .update(messages)
    .set({ status: "ai_draft" })
    .where(and(eq(messages.id, messageId), eq(messages.status, "sending")));
}
