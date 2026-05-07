/**
 * Phase 1-β Task D — stores.bot_mode 토글 (owner 전용).
 *
 * `false` → owner 검수·승인 모드 (기본). 이후 inbound는 draft_status='pending_review'.
 * `true`  → AI 자동 응답 (legacy ai_draft 흐름 유지). H1 학습 가설 검증용 토글.
 */
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createDbClient } from "@hesya/database";
import { env } from "@/shared/config/env";
import { captureServerActionError } from "@/instrumentation";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";
import { setStoreBotMode } from "@/shared/lib/dal/stores";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";

const inputSchema = z.object({
  storeId: z.uuid(),
  nextValue: z.boolean(),
});

export type ToggleBotModeResult =
  | { ok: true }
  | {
      ok: false;
      error: "validation" | "unauthorized" | "forbidden" | "server_error";
    };

export async function toggleBotMode(input: {
  storeId: string;
  nextValue: boolean;
}): Promise<ToggleBotModeResult> {
  let session;
  try {
    session = await requireStoreOwnerAuth();
  } catch (err) {
    if (err instanceof UnauthorizedError)
      return { ok: false, error: "unauthorized" };
    if (err instanceof ForbiddenError) return { ok: false, error: "forbidden" };
    throw err;
  }

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };
  const { storeId, nextValue } = parsed.data;

  if (storeId !== session.storeId) {
    return { ok: false, error: "forbidden" };
  }

  try {
    const db = createDbClient(env.DATABASE_URL);
    await setStoreBotMode(db, storeId, nextValue);
    revalidatePath(`/[locale]/store/inbox`, "page");
    return { ok: true };
  } catch (err) {
    captureServerActionError(err, {
      action: "inbox.toggleBotMode",
      userId: session.userId,
      storeId: session.storeId,
    });
    return { ok: false, error: "server_error" };
  }
}
