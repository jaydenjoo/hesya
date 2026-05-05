import { NextRequest, NextResponse } from "next/server";
import { createDbClient } from "@hesya/database";
import { env } from "@/shared/config/env";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";
import { listByStore } from "@/shared/lib/dal/conversations";
import { listByConversation } from "@/shared/lib/dal/messages";
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
    throw err;
  }

  const db = createDbClient(env.DATABASE_URL);
  const conversations = await listByStore(db, session.storeId);

  const activeId = req.nextUrl.searchParams.get("activeId");
  const messages: Record<string, unknown> = {};
  if (activeId) {
    messages[activeId] = await listByConversation(db, activeId);
  }

  return NextResponse.json({ conversations, messages });
}
