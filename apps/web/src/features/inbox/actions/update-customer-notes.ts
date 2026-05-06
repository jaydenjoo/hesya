"use server";

import { revalidatePath } from "next/cache";
import { createDbClient } from "@hesya/database";
import { env } from "@/shared/config/env";
import { captureServerActionError } from "@/instrumentation";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";
import { getConversationById } from "@/shared/lib/dal/conversations";
import { updateCustomerNotes as dalUpdateCustomerNotes } from "@/shared/lib/dal/customers";
import { ForbiddenError, ValidationError } from "@/shared/lib/errors";
import { updateCustomerNotesInputSchema } from "../schema";

/**
 * Customer 확장 (CC-6) — 사장이 ContextPanel에서 customer 메모 편집.
 *
 * **Ownership 흐름**: conversationId로 conversation 조회 → conv.storeId가 사장
 * 매장과 일치하는지 + conv.customerId가 input customerId와 일치하는지 검증.
 * 둘 중 하나라도 어긋나면 ForbiddenError. 미존재는 ValidationError (enumeration
 * 방어 — 다른 매장 conversation 존재 여부 노출 X).
 *
 * **빈 입력은 null로 저장** = 메모 삭제. allergyNote/preferredDesigner 둘 다
 * nullable + optional zod 검증.
 */
export async function updateCustomerNotes(input: {
  conversationId: string;
  customerId: string;
  allergyNote?: string | null;
  preferredDesigner?: string | null;
}): Promise<{ ok: true }> {
  const session = await requireStoreOwnerAuth();
  try {
    const parsed = updateCustomerNotesInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError("입력 형식 오류", parsed.error.issues);
    }

    const db = createDbClient(env.DATABASE_URL);
    const conv = await getConversationById(db, parsed.data.conversationId);
    if (!conv) throw new ValidationError("대화를 찾을 수 없습니다");
    if (conv.storeId !== session.storeId) throw new ForbiddenError();
    if (conv.customerId !== parsed.data.customerId) throw new ForbiddenError();

    const result = await dalUpdateCustomerNotes(db, parsed.data.customerId, {
      allergyNote: parsed.data.allergyNote ?? null,
      preferredDesigner: parsed.data.preferredDesigner ?? null,
    });
    if (!result) {
      throw new Error("updateCustomerNotes: update returned empty");
    }

    revalidatePath("/[locale]/store/inbox", "page");
    return { ok: true as const };
  } catch (err) {
    captureServerActionError(err, {
      action: "inbox.updateCustomerNotes",
      userId: session.userId,
      storeId: session.storeId,
    });
    throw err;
  }
}
