"use server";

/**
 * Plan v3 M2.6 — customer-side 예약 생성 server action.
 *
 * Mock 결제 페이지의 폼 제출 시 호출. booking + payment row를 단일 transaction
 * 으로 insert. 손님 이름·이메일·메시지는 `bookings.notesMultilang` jsonb에 저장
 * (customers row 생성은 channel="web" CHECK constraint 갱신 부담 회피 — 향후
 * M4.x에서 정식 customer 식별 정리).
 *
 * 인증: 손님 측은 인증 없음 (외부 손님). 매장 검증은 storeId가 auto_approved
 * 인지 + service/staff가 해당 매장 소속인지 server-side check.
 *
 * Rate limit: ip 또는 email 기반 5분/3회 (스팸 차단). 본 milestone은 email 기준.
 */

import {
  createDbClient,
  eq,
  payments,
  services,
  staff,
  stores,
} from "@hesya/database";
import { bookings as bookingsTable } from "@hesya/database";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

import { combineToIso } from "@/features/booking-customer/time-slots";
import { env } from "@/shared/config/env";
import { checkRateLimit, RateLimitError } from "@/shared/lib/rate-limit";

const PAYMENT_METHOD_TO_PROVIDER: Record<string, string> = {
  stripe: "mock_stripe",
  alipay: "mock_alipay",
  wechat: "mock_wechat",
};

const RATE_LIMIT = { max: 3, windowSec: 300 } as const;

const inputSchema = z.object({
  storeId: z.uuid(),
  serviceId: z.uuid(),
  staffId: z.uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  message: z.string().trim().max(500).optional(),
  locale: z.string().min(2).max(8),
  paymentMethod: z.enum(["stripe", "alipay", "wechat"]),
  mockTxId: z.string().regex(/^mock_[a-z0-9_]+$/i),
});

export type CreateBookingResult =
  | { ok: true; bookingId: string; paymentId: string }
  | {
      ok: false;
      error:
        | "invalid_input"
        | "rate_limited"
        | "store_unavailable"
        | "service_mismatch"
        | "staff_mismatch"
        | "internal";
      message: string;
    };

export async function createBookingAction(
  input: unknown,
): Promise<CreateBookingResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_input",
      message: "필수 필드가 누락되었거나 형식이 올바르지 않습니다.",
    };
  }

  try {
    // email 기준 rate-limit. IP는 Vercel edge에서 안정적으로 못 받음.
    await checkRateLimit(`booking:${parsed.data.email}`, RATE_LIMIT);
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
    const [storeRow] = await db
      .select({ id: stores.id, status: stores.verificationStatus })
      .from(stores)
      .where(eq(stores.id, parsed.data.storeId))
      .limit(1);
    if (!storeRow || storeRow.status !== "auto_approved") {
      return {
        ok: false,
        error: "store_unavailable",
        message: "매장 예약이 일시 중단되었습니다.",
      };
    }

    const [svcRow] = await db
      .select()
      .from(services)
      .where(eq(services.id, parsed.data.serviceId))
      .limit(1);
    if (!svcRow || svcRow.storeId !== parsed.data.storeId) {
      return {
        ok: false,
        error: "service_mismatch",
        message: "선택한 시술이 매장 정보와 일치하지 않습니다.",
      };
    }

    const [stfRow] = await db
      .select()
      .from(staff)
      .where(eq(staff.id, parsed.data.staffId))
      .limit(1);
    if (!stfRow || stfRow.storeId !== parsed.data.storeId) {
      return {
        ok: false,
        error: "staff_mismatch",
        message: "선택한 디자이너가 매장 정보와 일치하지 않습니다.",
      };
    }

    const scheduledAt = new Date(
      combineToIso(parsed.data.date, parsed.data.time),
    );

    // notesMultilang에 booker 정보 + 메시지 (현 locale key)
    const notesMultilang: Record<string, unknown> = {
      booker: {
        name: parsed.data.name,
        email: parsed.data.email,
      },
    };
    if (parsed.data.message) {
      notesMultilang[parsed.data.locale] = parsed.data.message;
    }

    const result = await db.transaction(async (tx) => {
      const [bookingRow] = await tx
        .insert(bookingsTable)
        .values({
          storeId: parsed.data.storeId,
          serviceId: parsed.data.serviceId,
          staffId: parsed.data.staffId,
          scheduledAt,
          status: "scheduled",
          totalPriceKrw: svcRow.priceKrw,
          depositPaidKrw: svcRow.priceKrw,
          paymentMethod: parsed.data.paymentMethod,
          notesMultilang,
        })
        .returning({ id: bookingsTable.id });

      if (!bookingRow) {
        throw new Error("booking insert returned no row");
      }

      const [paymentRow] = await tx
        .insert(payments)
        .values({
          bookingId: bookingRow.id,
          amountKrw: svcRow.priceKrw,
          provider:
            PAYMENT_METHOD_TO_PROVIDER[parsed.data.paymentMethod] ?? "mock",
          providerTransactionId: parsed.data.mockTxId,
          status: "succeeded",
        })
        .returning({ id: payments.id });
      if (!paymentRow) {
        throw new Error("payment insert returned no row");
      }

      return { bookingId: bookingRow.id, paymentId: paymentRow.id };
    });

    return { ok: true, ...result };
  } catch (err) {
    Sentry.captureException(err, {
      tags: {
        route: "action:create-booking-customer",
        storeIdShort: parsed.data.storeId.slice(0, 8),
      },
    });
    return {
      ok: false,
      error: "internal",
      message: "예약 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    };
  }
}
