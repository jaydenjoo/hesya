import "server-only";
import { headers } from "next/headers";
import { createDbClient } from "@hesya/database";
import { auth } from "@/lib/auth";
import { env } from "@/shared/config/env";
import {
  findCustomerByEmail,
  touchCustomerLastSeen,
  upsertCustomerByEmail,
} from "./dal/customers";
import { UnauthorizedError } from "./errors";

/**
 * Plan v3 M3.4 — 외국인 손님 (customer) 세션 가드.
 *
 * Better Auth 세션 (magic link 인증 후)에서 user.email을 가져와 customers
 * 테이블의 row와 매칭. 미존재 시 자동 upsert (auth user.email == customers.email
 * 1:1 매핑 보장).
 *
 * **owner와의 분리**: owner는 store_owners 테이블로 별도 식별. customer
 * 세션이 store_owners에 없는 게 정상 — 두 역할은 서로 배타적이지 않으나
 * 본 가드는 customer 식별만 책임.
 *
 * **E2E bypass**: `E2E_CUSTOMER_EMAIL` env로 강제 customer email 주입.
 * prod NODE_ENV에서는 작동 안 함.
 *
 * @throws UnauthorizedError 세션 없음 또는 email 없음
 */
export interface CustomerSession {
  userId: string;
  customerId: string;
  email: string;
  name: string | null;
}

export async function requireCustomerAuth(): Promise<CustomerSession> {
  const db = createDbClient(env.DATABASE_URL);

  // E2E bypass — prod 차단
  if (env.NODE_ENV !== "production" && process.env.E2E_CUSTOMER_EMAIL) {
    const email = process.env.E2E_CUSTOMER_EMAIL;
    const customer = await upsertCustomerByEmail(db, { email });
    return {
      userId: customer.id,
      customerId: customer.id,
      email,
      name: customer.name,
    };
  }

  // Plan v3 M5.1 — Vercel preview demo bypass. VERCEL_ENV='preview' + DEMO_CUSTOMER_EMAIL.
  // 외부 데모 URL에서 /c/mypage 인증 없이 진입 가능. prod (VERCEL_ENV='production')에선 차단.
  if (env.VERCEL_ENV === "preview" && env.DEMO_CUSTOMER_EMAIL) {
    const customer = await upsertCustomerByEmail(db, {
      email: env.DEMO_CUSTOMER_EMAIL,
    });
    return {
      userId: customer.id,
      customerId: customer.id,
      email: env.DEMO_CUSTOMER_EMAIL,
      name: customer.name,
    };
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    throw new UnauthorizedError("로그인이 필요합니다");
  }

  const email = session.user.email;
  let customer = await findCustomerByEmail(db, email);
  if (!customer) {
    // Better Auth 세션은 있으나 customers row 미존재 — magic link 첫 가입 + booking 없는 케이스.
    customer = await upsertCustomerByEmail(db, {
      email,
      name: session.user.name ?? null,
    });
  }

  // 비동기 fire-and-forget — last seen 갱신 (실패해도 흐름 차단 X)
  void touchCustomerLastSeen(db, customer.id).catch(() => undefined);

  return {
    userId: session.user.id,
    customerId: customer.id,
    email,
    name: customer.name,
  };
}
