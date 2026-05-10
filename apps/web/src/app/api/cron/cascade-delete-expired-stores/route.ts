/**
 * E12-9 매장 해지 cascade hard-delete cron (PRD §1068, SLA 30일 grace).
 *
 * 트리거: Vercel Cron이 매일 GET 호출 (vercel.json schedule).
 *   Authorization: Bearer ${CRON_SECRET} 헤더 — timing-safe 비교 (L-086 패턴).
 *
 * 흐름:
 *   1. CRON_SECRET 검증
 *   2. purgeExpiredStoreDeletions(limit=50) — scheduled_purge_at <= now AND not
 *      cancelled/purged 행을 stores DELETE (FK CASCADE로 모든 비즈니스 데이터)
 *   3. 결과 JSON 반환 (purged store id 목록)
 *
 * batch limit=50 — Vercel Function timeout 보호. 대량 적체 시 다음 day cron tick
 * 에서 이어서 처리 (scheduled_purge_at 오름차순).
 */
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

import { createDbClient } from "@hesya/database";

import { purgeExpiredStoreDeletions } from "@/shared/lib/dal/store-deletion";
import { env } from "@/shared/config/env";

const PURGE_LIMIT = 50;

function timingSafeBearerEquals(header: string, expected: string): boolean {
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  if (!timingSafeBearerEquals(authHeader, `Bearer ${env.CRON_SECRET}`)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = createDbClient(env.DATABASE_URL);
  const result = await purgeExpiredStoreDeletions(db, { limit: PURGE_LIMIT });

  // PII 노출 회피 — 카운트만 반환 (Vercel cron 응답이 대시보드/로그에 기록됨).
  // 실제 처리된 storeId는 store_deletion_requests.purgedAt 컬럼에 보존.
  return NextResponse.json({
    ok: true,
    purgedCount: result.purgedStoreIds.length,
    failedCount: result.failedStoreIds.length,
  });
}
