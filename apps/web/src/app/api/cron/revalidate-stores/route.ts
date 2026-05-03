/**
 * E9-10 분기별 자동 재검증 (cron Route Handler).
 *
 * 트리거: Vercel Cron이 분기별로 GET 호출
 *   Authorization: Bearer ${CRON_SECRET} 헤더 검증
 *
 * 흐름:
 *   1. CRON_SECRET 검증 (외부 임의 호출 차단)
 *   2. store_verifications에서 next_revalidation_due ≤ NOW() row 조회
 *      (페이지네이션 50건씩, localdata_bplc_nm/road_nm_addr 둘 다 not null인 row만)
 *   3. 각 row의 저장된 LOCALDATA 키워드로 재검색 → 매칭 → 영업 상태 변경 시 갱신
 *   4. matched=false 또는 status가 폐업(03)으로 바뀌면 verification_status를
 *      'manual_review'로 변경 → E9-8 매뉴얼 큐에서 admin 처리 필요
 *
 * SLA: 7일 (DECISIONS § 1.8 운영자 플로우 #4 분기별 재검증 결과).
 *
 * 호출자가 아닌 외부 webhook이라 Server Action이 아닌 Route Handler 사용
 * (DECISIONS § 1.9). Server Action은 form-action 흐름에 묶여 외부 호출 어려움.
 *
 * P2: LOCALDATA 호출은 searchBeautyShops()로 일원화 — retry/timeout/abort/
 * LocaldataApiError 분류 무료. envelope schema 직접 import 제거.
 */
import { NextResponse } from "next/server";
import {
  and,
  createDbClient,
  eq,
  isNotNull,
  lte,
  storeVerifications,
} from "@hesya/database";
import type { LocaldataItem } from "@hesya/shared-types";
import { env } from "@/shared/config/env";
import { computeMatchScore } from "@/lib/kyc/match-score";
import { searchBeautyShops } from "@/lib/kyc/localdata-client";

const PAGE_SIZE = 50;
const REVALIDATION_INTERVAL_MS = 90 * 24 * 60 * 60 * 1000; // 분기별
const CRON_SEARCH_NUM_OF_ROWS = 20;

const db = createDbClient(env.DATABASE_URL);

interface RevalidationStat {
  total: number;
  changedStatus: number;
  flaggedManualReview: number;
  errors: number;
}

async function revalidateOne(row: {
  id: string;
  localdataBplcNm: string;
  localdataRoadNmAddr: string;
  localdataStatus: string | null;
}): Promise<"changed" | "unchanged" | "manual_review" | "error"> {
  try {
    const { items } = await searchBeautyShops({
      bplcNm: row.localdataBplcNm,
      roadNmAddr: row.localdataRoadNmAddr,
      pageNo: 1,
      numOfRows: CRON_SEARCH_NUM_OF_ROWS,
    });
    if (items.length === 0) {
      // 후보 0건 — 매장이 LOCALDATA에서 사라짐 → 매뉴얼 검토
      await db
        .update(storeVerifications)
        .set({
          verificationStatus: "manual_review",
          rejectionReason: "LOCALDATA에서 매장 정보 사라짐 (재검증 시점)",
          lastRevalidationAt: new Date(),
          nextRevalidationDue: new Date(Date.now() + REVALIDATION_INTERVAL_MS),
          updatedAt: new Date(),
        })
        .where(eq(storeVerifications.id, row.id));
      return "manual_review";
    }

    let bestCandidate: LocaldataItem | null = null;
    let bestTotalScore = -1;
    for (const item of items) {
      const score = computeMatchScore({
        ntsName: row.localdataBplcNm,
        ntsAddress: row.localdataRoadNmAddr,
        localdataName: item.BPLC_NM,
        localdataAddress: item.ROAD_NM_ADDR,
      });
      if (score.totalScore > bestTotalScore) {
        bestTotalScore = score.totalScore;
        bestCandidate = item;
      }
    }

    const newStatus = bestCandidate?.SALS_STTS_CD ?? null;
    const statusChanged = newStatus !== row.localdataStatus;
    // 폐업(03) 또는 매칭 실패 → 매뉴얼 검토 큐
    const needsManualReview = newStatus === "03" || bestTotalScore < 0.85;

    await db
      .update(storeVerifications)
      .set({
        localdataStatus: newStatus,
        localdataBusinessType: bestCandidate?.OPN_ATMY_GRP_CD ?? null,
        verificationStatus: needsManualReview
          ? "manual_review"
          : "auto_approved",
        rejectionReason: needsManualReview
          ? newStatus === "03"
            ? "LOCALDATA 영업 상태가 폐업으로 변경"
            : `재검증 매칭 점수 ${bestTotalScore.toFixed(3)} < 0.85`
          : null,
        lastRevalidationAt: new Date(),
        nextRevalidationDue: new Date(Date.now() + REVALIDATION_INTERVAL_MS),
        updatedAt: new Date(),
      })
      .where(eq(storeVerifications.id, row.id));

    if (needsManualReview) return "manual_review";
    return statusChanged ? "changed" : "unchanged";
  } catch (err) {
    console.error(`[cron] revalidate row ${row.id} failed:`, err);
    return "error";
  }
}

export async function GET(req: Request) {
  // CRON_SECRET 검증 — Vercel Cron의 Authorization Bearer 헤더와 비교
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const stat: RevalidationStat = {
    total: 0,
    changedStatus: 0,
    flaggedManualReview: 0,
    errors: 0,
  };

  // 페이지네이션 — next_revalidation_due 만료된 row를 PAGE_SIZE씩 처리.
  // 각 row 처리 후 next_revalidation_due가 90일 후로 갱신되므로 다음 페이지
  // query는 자연히 다른 row만 본다. (limit/offset 패턴의 페이지 사이 중복/누락
  // 위험 회피 — 처리한 row는 query 조건에서 자동 제외)
  for (;;) {
    const candidates = await db
      .select({
        id: storeVerifications.id,
        localdataBplcNm: storeVerifications.localdataBplcNm,
        localdataRoadNmAddr: storeVerifications.localdataRoadNmAddr,
        localdataStatus: storeVerifications.localdataStatus,
      })
      .from(storeVerifications)
      .where(
        and(
          lte(storeVerifications.nextRevalidationDue, new Date()),
          isNotNull(storeVerifications.localdataBplcNm),
          isNotNull(storeVerifications.localdataRoadNmAddr),
        ),
      )
      .limit(PAGE_SIZE);

    if (candidates.length === 0) break;

    for (const row of candidates) {
      if (!row.localdataBplcNm || !row.localdataRoadNmAddr) continue;
      stat.total += 1;
      const result = await revalidateOne({
        id: row.id,
        localdataBplcNm: row.localdataBplcNm,
        localdataRoadNmAddr: row.localdataRoadNmAddr,
        localdataStatus: row.localdataStatus,
      });
      if (result === "changed") stat.changedStatus += 1;
      if (result === "manual_review") stat.flaggedManualReview += 1;
      if (result === "error") stat.errors += 1;
    }

    if (candidates.length < PAGE_SIZE) break;
  }

  return NextResponse.json({ ok: true, stat });
}
