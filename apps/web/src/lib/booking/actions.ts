"use server";

/**
 * Epic 3 (δ phase) — booking Server Actions (owner-side).
 *
 * Owner가 자기 매장 예약의 상태를 변경 (completed / cancelled / no_show).
 * 생성은 phase ζ + Epic 2 결제 통합 후.
 *
 * 인가:
 *   - requireStoreOwnerAuth → throw (UnauthorizedError / ForbiddenError)
 *   - DAL `updateBookingStatus`가 storeId match도 추가 검증 (이중 안전)
 *   - checkRateLimit (60s / 30회) — booking 상태 변경 빈번 가능, 분쟁 20회보다 완화
 */

import { createDbClient } from "@hesya/database";
import { z } from "zod";

import { env } from "@/shared/config/env";
import {
  BOOKING_STATUSES,
  getBooking,
  updateBookingStatus,
  type BookingStatus,
} from "@/shared/lib/dal/bookings";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { checkRateLimit, RateLimitError } from "@/shared/lib/rate-limit";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

const RATE_LIMIT = { max: 30, windowSec: 60 } as const;

const inputSchema = z.object({
  bookingId: z.uuid(),
  status: z.enum(
    BOOKING_STATUSES as readonly [BookingStatus, ...BookingStatus[]],
  ),
});

export type UpdateBookingStatusResult =
  | { ok: true; bookingId: string; status: BookingStatus }
  | {
      ok: false;
      error:
        | "unauthorized"
        | "forbidden"
        | "rate_limited"
        | "invalid_input"
        | "not_found";
      message: string;
    };

export async function updateBookingStatusAction(input: {
  bookingId: string;
  status: BookingStatus;
}): Promise<UpdateBookingStatusResult> {
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
    throw err;
  }

  try {
    await checkRateLimit(`booking-status:${session.userId}`, {
      max: RATE_LIMIT.max,
      windowSec: RATE_LIMIT.windowSec,
    });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return { ok: false, error: "rate_limited", message: err.message };
    }
    throw err;
  }

  const db = createDbClient(env.DATABASE_URL);
  const existing = await getBooking(db, parsed.data.bookingId);
  if (!existing || existing.storeId !== session.storeId) {
    return {
      ok: false,
      error: "not_found",
      message: "예약을 찾을 수 없거나 권한이 없습니다",
    };
  }
  const updated = await updateBookingStatus(db, {
    id: parsed.data.bookingId,
    storeId: session.storeId,
    status: parsed.data.status,
  });
  if (!updated) {
    return {
      ok: false,
      error: "not_found",
      message: "예약을 찾을 수 없습니다",
    };
  }
  return { ok: true, bookingId: updated.id, status: parsed.data.status };
}
