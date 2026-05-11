"use server";

/**
 * Plan v3 M3.1 — 매장 시술 CRUD server actions (owner-side).
 *
 * 인가: `requireStoreOwnerAuth` → session.storeId만 신뢰. payload의 storeId
 * 받지 않음 (조작 차단). DAL이 storeId match로 이중 검증.
 *
 * Rate limit: 시술 생성/수정/삭제는 사장 행위라 빈번하지 않음. 60s / 30회.
 */

import * as Sentry from "@sentry/nextjs";
import { createDbClient } from "@hesya/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { env } from "@/shared/config/env";
import { countBookingsByService } from "@/shared/lib/dal/bookings";
import {
  createService,
  deleteService,
  updateService,
} from "@/shared/lib/dal/services";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { checkRateLimit, RateLimitError } from "@/shared/lib/rate-limit";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

const RATE_LIMIT = { max: 30, windowSec: 60 } as const;

const serviceInputSchema = z.object({
  nameKo: z.string().trim().min(1).max(100),
  nameEn: z.string().trim().max(100).optional().nullable(),
  nameJa: z.string().trim().max(100).optional().nullable(),
  nameZhCn: z.string().trim().max(100).optional().nullable(),
  nameZhTw: z.string().trim().max(100).optional().nullable(),
  nameVi: z.string().trim().max(100).optional().nullable(),
  priceKrw: z.number().int().min(0).max(100_000_000),
  durationMinutes: z.number().int().min(1).max(1440).optional().nullable(),
  category: z.string().trim().max(50).optional().nullable(),
});

const updateInputSchema = serviceInputSchema.extend({
  id: z.uuid(),
});

const deleteInputSchema = z.object({
  id: z.uuid(),
});

type ServerActionError =
  | "unauthorized"
  | "forbidden"
  | "rate_limited"
  | "invalid_input"
  | "in_use"
  | "not_found"
  | "internal";

type Result<T> =
  | ({ ok: true } & T)
  | { ok: false; error: ServerActionError; message: string };

async function authorize(): Promise<
  | { ok: true; storeId: string; userId: string }
  | {
      ok: false;
      error: Exclude<
        ServerActionError,
        "internal" | "not_found" | "rate_limited" | "invalid_input" | "in_use"
      >;
      message: string;
    }
> {
  try {
    const session = await requireStoreOwnerAuth();
    return { ok: true, storeId: session.storeId, userId: session.userId };
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { ok: false, error: "unauthorized", message: err.message };
    }
    if (err instanceof ForbiddenError) {
      return { ok: false, error: "forbidden", message: err.message };
    }
    Sentry.captureException(err, {
      tags: { route: "action:store-services", phase: "auth" },
    });
    throw err;
  }
}

export async function createServiceAction(
  input: unknown,
): Promise<Result<{ id: string }>> {
  const parsed = serviceInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input", message: parsed.error.message };
  }

  const auth = await authorize();
  if (!auth.ok) return auth;

  try {
    await checkRateLimit(`store-services:${auth.userId}`, RATE_LIMIT);
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

  try {
    const db = createDbClient(env.DATABASE_URL);
    const row = await createService(db, auth.storeId, parsed.data);
    revalidatePath("/store/services");
    return { ok: true, id: row.id };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "action:store-services", phase: "create" },
    });
    return { ok: false, error: "internal", message: "시술 등록 실패" };
  }
}

export async function updateServiceAction(
  input: unknown,
): Promise<Result<{ id: string }>> {
  const parsed = updateInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input", message: parsed.error.message };
  }

  const auth = await authorize();
  if (!auth.ok) return auth;

  try {
    await checkRateLimit(`store-services:${auth.userId}`, RATE_LIMIT);
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

  try {
    const db = createDbClient(env.DATABASE_URL);
    const row = await updateService(db, {
      id: parsed.data.id,
      storeId: auth.storeId,
      nameKo: parsed.data.nameKo,
      nameEn: parsed.data.nameEn,
      nameJa: parsed.data.nameJa,
      nameZhCn: parsed.data.nameZhCn,
      nameZhTw: parsed.data.nameZhTw,
      nameVi: parsed.data.nameVi,
      priceKrw: parsed.data.priceKrw,
      durationMinutes: parsed.data.durationMinutes,
      category: parsed.data.category,
    });
    if (!row) {
      return {
        ok: false,
        error: "not_found",
        message: "시술을 찾을 수 없습니다.",
      };
    }
    revalidatePath("/store/services");
    return { ok: true, id: row.id };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "action:store-services", phase: "update" },
    });
    return { ok: false, error: "internal", message: "시술 수정 실패" };
  }
}

export async function deleteServiceAction(
  input: unknown,
): Promise<Result<{ deleted: boolean }>> {
  const parsed = deleteInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input", message: parsed.error.message };
  }

  const auth = await authorize();
  if (!auth.ok) return auth;

  try {
    await checkRateLimit(`store-services:${auth.userId}`, RATE_LIMIT);
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

  try {
    const db = createDbClient(env.DATABASE_URL);
    // 사용 중 검사: 해당 service로 예약된 booking이 있으면 차단 (FK NO ACTION).
    // wide range — 전체 history. countBookingsByService는 dashboard용으로
    // month range 시그니처라 여기선 안전한 wide window 전달.
    const usage = await countBookingsByService(db, auth.storeId, {
      fromDate: new Date(0),
      toDate: new Date("9999-12-31"),
    });
    const used = usage.find((u) => u.key === parsed.data.id);
    if (used && used.count > 0) {
      return {
        ok: false,
        error: "in_use",
        message: `예약 ${used.count}건에서 사용 중인 시술은 삭제할 수 없습니다.`,
      };
    }
    const result = await deleteService(db, {
      id: parsed.data.id,
      storeId: auth.storeId,
    });
    if (!result.deleted) {
      return {
        ok: false,
        error: "not_found",
        message: "시술을 찾을 수 없습니다.",
      };
    }
    revalidatePath("/store/services");
    return { ok: true, deleted: true };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "action:store-services", phase: "delete" },
    });
    return { ok: false, error: "internal", message: "시술 삭제 실패" };
  }
}
