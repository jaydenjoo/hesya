"use server";

/**
 * Plan v3 M3.4 — customer mypage server actions.
 *
 *   - unsaveStore: 찜 해제
 *   - submitReview: 리뷰 등록 (booking 완료한 손님만)
 *
 * 인증: requireCustomerAuth로 본인 customer 검증. bookingId/storeId는 본인
 * customerId와의 매칭 확인 (server-side ownership 검증).
 */
import { bookings, createDbClient, eq } from "@hesya/database";
import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { env } from "@/shared/config/env";
import { requireCustomerAuth } from "@/shared/lib/customer-guard";
import {
  submitCustomerReview,
  unsaveStoreForCustomer,
} from "@/shared/lib/dal/customer-mypage";
import { UnauthorizedError } from "@/shared/lib/errors";
import { checkRateLimit, RateLimitError } from "@/shared/lib/rate-limit";

const RATE_LIMIT = { max: 10, windowSec: 60 } as const;

const unsaveSchema = z.object({
  storeId: z.uuid(),
  locale: z.string().min(2).max(8),
});

export type UnsaveResult =
  | { ok: true }
  | {
      ok: false;
      error: "unauthorized" | "invalid_input" | "rate_limited" | "internal";
      message: string;
    };

export async function unsaveStoreAction(input: unknown): Promise<UnsaveResult> {
  const parsed = unsaveSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_input",
      message: "잘못된 요청입니다.",
    };
  }
  let session;
  try {
    session = await requireCustomerAuth();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return {
        ok: false,
        error: "unauthorized",
        message: "로그인이 필요합니다.",
      };
    }
    throw err;
  }
  try {
    await checkRateLimit(`mypage:unsave:${session.customerId}`, RATE_LIMIT);
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
    await unsaveStoreForCustomer(db, session.customerId, parsed.data.storeId);
    revalidatePath(`/${parsed.data.locale}/c/mypage`);
    return { ok: true };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "action:mypage-unsave-store" },
    });
    return {
      ok: false,
      error: "internal",
      message: "잠시 후 다시 시도해주세요.",
    };
  }
}

const reviewSchema = z.object({
  bookingId: z.uuid(),
  storeId: z.uuid(),
  rating: z.number().int().min(1).max(5),
  content: z.string().trim().min(2).max(2000),
  language: z.string().min(2).max(8),
  locale: z.string().min(2).max(8),
});

export type SubmitReviewResult =
  | { ok: true; reviewId: string }
  | {
      ok: false;
      error:
        | "unauthorized"
        | "invalid_input"
        | "rate_limited"
        | "booking_mismatch"
        | "internal";
      message: string;
    };

export async function submitReviewAction(
  input: unknown,
): Promise<SubmitReviewResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_input",
      message: "별점과 내용을 확인해주세요.",
    };
  }
  let session;
  try {
    session = await requireCustomerAuth();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return {
        ok: false,
        error: "unauthorized",
        message: "로그인이 필요합니다.",
      };
    }
    throw err;
  }
  try {
    await checkRateLimit(`mypage:review:${session.customerId}`, RATE_LIMIT);
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
    // 보안: bookingId가 본인 customerId 소유 + storeId 일치 검증.
    const [bookingRow] = await db
      .select({
        customerId: bookings.customerId,
        storeId: bookings.storeId,
        status: bookings.status,
      })
      .from(bookings)
      .where(eq(bookings.id, parsed.data.bookingId))
      .limit(1);
    if (
      !bookingRow ||
      bookingRow.customerId !== session.customerId ||
      bookingRow.storeId !== parsed.data.storeId ||
      bookingRow.status !== "completed"
    ) {
      return {
        ok: false,
        error: "booking_mismatch",
        message: "리뷰를 작성할 수 없는 예약입니다.",
      };
    }
    const { id } = await submitCustomerReview(db, {
      customerId: session.customerId,
      bookingId: parsed.data.bookingId,
      storeId: parsed.data.storeId,
      rating: parsed.data.rating,
      content: parsed.data.content,
      language: parsed.data.language,
    });
    revalidatePath(`/${parsed.data.locale}/c/mypage`);
    return { ok: true, reviewId: id };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "action:mypage-submit-review" },
    });
    return {
      ok: false,
      error: "internal",
      message: "잠시 후 다시 시도해주세요.",
    };
  }
}
