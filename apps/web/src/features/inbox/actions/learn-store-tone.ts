"use server";

import { createDbClient } from "@hesya/database";
import { env } from "@/shared/config/env";
import { captureServerActionError } from "@/instrumentation";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";
import { insertToneExample } from "@/shared/lib/dal/store-tone-examples";
import { ValidationError } from "@/shared/lib/errors";
import { checkRateLimit } from "@/shared/lib/rate-limit";
import { learnStoreToneInputSchema } from "../schema";

/**
 * Phase 2-B — 매장 톤 학습.
 *
 * 사장이 Composer textarea에 답변을 작성한 뒤 "🎙️ 내 매장 톤 학습 →"
 * 버튼을 명시적으로 클릭하면 호출된다. 본 텍스트는 다음 AI 답변 생성 시
 * `generate-reply.ts`의 system prompt에 few-shot reference로 주입된다.
 *
 * **명시 학습만**: outbound 자동 저장은 별 Task (privacy + 사장 통제권).
 * **PII 노출 방지**: 입력 텍스트는 Sentry tag/extra에 직접 포함하지 않는다.
 * captureServerActionError가 storeId 8자만 노출하는 표준 패턴 사용.
 */
export async function learnStoreTone(input: {
  text: string;
}): Promise<{ ok: true; exampleId: string }> {
  const session = await requireStoreOwnerAuth();
  // Phase 2-B Sec S1 — 시간당 30회 rate limit. RateLimitError는 사용자 의도
  // 거절(브루트 클릭 또는 봇 등)이라 try 밖에 두어 captureServerActionError
  // 호출 회피 (Sentry 노이즈 0). 클라이언트는 learnToneError 메시지 표시.
  await checkRateLimit(`learnTone:${session.storeId}`, {
    max: 30,
    windowSec: 3600,
  });
  try {
    const parsed = learnStoreToneInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError("입력 형식 오류", parsed.error.issues);
    }

    const db = createDbClient(env.DATABASE_URL);
    const example = await insertToneExample(
      db,
      session.storeId,
      parsed.data.text,
    );
    if (!example) {
      throw new Error("learnStoreTone: insert returned empty");
    }
    return { ok: true as const, exampleId: example.id };
  } catch (err) {
    captureServerActionError(err, {
      action: "inbox.learnStoreTone",
      userId: session.userId,
      storeId: session.storeId,
    });
    throw err;
  }
}
