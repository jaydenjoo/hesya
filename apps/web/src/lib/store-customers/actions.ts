"use server";

/**
 * Plan v3 M3.2 — 매장 customer 메모 편집 server action.
 *
 * 인가: requireStoreOwnerAuth → session.storeId. DAL `isCustomerInStore`로
 * customer가 해당 매장에 속하는지 (conversations.storeId match) 검증 후 update.
 *
 * Rate limit: 메모 편집은 사장 행위, 60s / 30회.
 */

import * as Sentry from "@sentry/nextjs";
import { createDbClient } from "@hesya/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { env } from "@/shared/config/env";
import {
  isCustomerInStore,
  updateCustomerNotes,
} from "@/shared/lib/dal/customers";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { checkRateLimit, RateLimitError } from "@/shared/lib/rate-limit";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

const RATE_LIMIT = { max: 30, windowSec: 60 } as const;

const inputSchema = z.object({
  customerId: z.uuid(),
  allergyNote: z.string().trim().max(500).optional().nullable(),
  preferredDesigner: z.string().trim().max(100).optional().nullable(),
});

export type UpdateCustomerNotesResult =
  | { ok: true; customerId: string }
  | {
      ok: false;
      error:
        | "unauthorized"
        | "forbidden"
        | "rate_limited"
        | "invalid_input"
        | "not_in_store"
        | "internal";
      message: string;
    };

export async function updateCustomerNotesAction(
  input: unknown,
): Promise<UpdateCustomerNotesResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input", message: parsed.error.message };
  }

  let session;
  try {
    session = await requireStoreOwnerAuth();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { ok: false, error: "unauthorized", message: err.message };
    }
    if (err instanceof ForbiddenError) {
      return { ok: false, error: "forbidden", message: err.message };
    }
    Sentry.captureException(err, {
      tags: { route: "action:customer-notes", phase: "auth" },
    });
    throw err;
  }

  try {
    await checkRateLimit(`customer-notes:${session.userId}`, RATE_LIMIT);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return {
        ok: false,
        error: "rate_limited",
        message: "잠시 후 다시 시도해주세요.",
      };
    }
    throw err;
  }

  const db = createDbClient(env.DATABASE_URL);

  try {
    const owns = await isCustomerInStore(
      db,
      session.storeId,
      parsed.data.customerId,
    );
    if (!owns) {
      return {
        ok: false,
        error: "not_in_store",
        message: "해당 손님은 매장과 연결되어 있지 않습니다.",
      };
    }
    await updateCustomerNotes(db, parsed.data.customerId, {
      allergyNote: parsed.data.allergyNote ?? null,
      preferredDesigner: parsed.data.preferredDesigner ?? null,
    });
    revalidatePath("/store/customers");
    return { ok: true, customerId: parsed.data.customerId };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "action:customer-notes", phase: "update" },
    });
    return { ok: false, error: "internal", message: "메모 저장 실패" };
  }
}
