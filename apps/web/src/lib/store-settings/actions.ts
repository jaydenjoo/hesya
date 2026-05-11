"use server";

/**
 * Plan v3 M3.3 — 매장 설정 (이름/전화/주소/영업시간) server action.
 *
 * 인가: requireStoreOwnerAuth → session.storeId 본인 매장만 갱신.
 * Rate limit: 60s / 30회.
 */

import * as Sentry from "@sentry/nextjs";
import { createDbClient, type BusinessHours } from "@hesya/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { env } from "@/shared/config/env";
import { updateStoreSettings } from "@/shared/lib/dal/stores";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { checkRateLimit, RateLimitError } from "@/shared/lib/rate-limit";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

const RATE_LIMIT = { max: 30, windowSec: 60 } as const;

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const hoursSchema = z
  .object({
    open: z.string().regex(HHMM, "HH:mm 형식"),
    close: z.string().regex(HHMM, "HH:mm 형식"),
  })
  .nullable();

const businessHoursSchema = z
  .object({
    mon: hoursSchema.optional(),
    tue: hoursSchema.optional(),
    wed: hoursSchema.optional(),
    thu: hoursSchema.optional(),
    fri: hoursSchema.optional(),
    sat: hoursSchema.optional(),
    sun: hoursSchema.optional(),
  })
  .nullable();

const inputSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  address: z
    .object({
      line1: z.string().trim().max(200).optional(),
      city: z.string().trim().max(80).optional(),
      country: z.string().trim().max(80).optional(),
    })
    .nullable()
    .optional(),
  businessHours: businessHoursSchema.optional(),
});

export type UpdateStoreSettingsResult =
  | { ok: true; storeId: string }
  | {
      ok: false;
      error:
        | "unauthorized"
        | "forbidden"
        | "rate_limited"
        | "invalid_input"
        | "internal";
      message: string;
    };

export async function updateStoreSettingsAction(
  input: unknown,
): Promise<UpdateStoreSettingsResult> {
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
      tags: { route: "action:store-settings", phase: "auth" },
    });
    throw err;
  }

  try {
    await checkRateLimit(`store-settings:${session.userId}`, RATE_LIMIT);
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
    await updateStoreSettings(db, {
      storeId: session.storeId,
      name: parsed.data.name,
      phone: parsed.data.phone,
      address: parsed.data.address,
      businessHours: parsed.data.businessHours as
        | BusinessHours
        | null
        | undefined,
    });
    revalidatePath("/store/settings");
    return { ok: true, storeId: session.storeId };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "action:store-settings", phase: "update" },
    });
    return { ok: false, error: "internal", message: "설정 저장 실패" };
  }
}
