import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createDbClient } from "@hesya/database";
import { env } from "@/shared/config/env";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";
import {
  getConversationById,
  listByStore,
} from "@/shared/lib/dal/conversations";
import { listByConversation } from "@/shared/lib/dal/messages";
import { getCustomerById } from "@/shared/lib/dal/customers";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";

export async function GET(req: NextRequest): Promise<NextResponse> {
  let session;
  try {
    session = await requireStoreOwnerAuth();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    Sentry.captureException(err, { tags: { route: "inbox:refresh" } });
    throw err;
  }

  const db = createDbClient(env.DATABASE_URL);
  const conversations = await listByStore(db, session.storeId);

  const activeId = req.nextUrl.searchParams.get("activeId");
  const messages: Record<string, unknown> = {};
  // Customer 확장 (CC-5) — active conversation의 customer 정보 동봉.
  // ContextPanel이 name/totalVisits/ltvKrw/notes 표시에 사용.
  const customers: Record<string, unknown> = {};
  if (activeId) {
    // IDOR 방어: activeId가 호출자 매장의 conversation인지 검증.
    const conv = await getConversationById(db, activeId);
    if (!conv) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (conv.storeId !== session.storeId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    messages[activeId] = await listByConversation(db, activeId);
    const customer = await getCustomerById(db, conv.customerId);
    if (customer) customers[activeId] = customer;
  }

  return NextResponse.json({ conversations, messages, customers });
}
