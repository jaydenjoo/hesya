/**
 * E9-3 분해 3단계 검증 스크립트 (일회용).
 *
 * Server Action `matchStoreToLocaldata`는 Better Auth admin 가드 + rate limit이
 * 걸려 있어 인증 없이 직접 호출 불가. 이 스크립트는 인증 레이어를 우회하고
 * 핵심 비즈니스 흐름만 그대로 실행해 실 LOCALDATA API + 실 DB UPDATE를 검증.
 *
 * 흐름은 actions.ts의 matchStoreToLocaldata와 동일 — searchBeautyShops →
 * computeMatchScore 후보 루프 → store_verifications UPDATE.
 *
 * 실행: pnpm --filter @hesya/database exec tsx ../../apps/web/scripts/verify-e9-3-match.ts
 */
import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(__dirname, "../.env.local") });

import { createDbClient, eq, storeVerifications } from "@hesya/database";
import {
  extractLocaldataItems,
  localdataSearchResponseSchema,
  type LocaldataItem,
  type MatchScoreResult,
} from "@hesya/shared-types";
import { computeMatchScore } from "../src/lib/kyc/match-score";

const LOCALDATA_ENDPOINT = "https://apis.data.go.kr/1741000/beauty_salons/info";

async function fetchLocaldataCandidates(
  bplcNm: string,
  roadNmAddr: string,
  numOfRows = 50,
) {
  const apiKey = process.env.KOREA_LOCALDATA_API_KEY;
  if (!apiKey) {
    throw new Error("KOREA_LOCALDATA_API_KEY 미설정 (.env.local 확인)");
  }
  // production localdata-client.ts와 동일 — cond[FIELD::LIKE] 패턴 + returnType
  const params = new URLSearchParams({
    serviceKey: apiKey,
    pageNo: "1",
    numOfRows: String(numOfRows),
    returnType: "json",
    "cond[BPLC_NM::LIKE]": bplcNm,
    "cond[ROAD_NM_ADDR::LIKE]": roadNmAddr,
  });
  const res = await fetch(`${LOCALDATA_ENDPOINT}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`LOCALDATA HTTP ${res.status}`);
  }
  const json = (await res.json()) as unknown;
  const parsed = localdataSearchResponseSchema.parse(json);
  const items = extractLocaldataItems(parsed);
  const totalCount = parsed.response?.body?.totalCount ?? null;
  return { items, totalCount };
}

const VERIFICATION_ID = "68d52d69-f678-4335-a03b-53f6c154f8f7";
const BPLC_NM = "청담";
const ROAD_NM_ADDR = "강남구";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL 미설정 (.env.local 확인)");
  }
  const db = createDbClient(databaseUrl);

  console.log("\n=== E9-3 매칭 흐름 검증 ===\n");
  console.log(`verificationId: ${VERIFICATION_ID}`);
  console.log(`bplcNm: ${BPLC_NM}`);
  console.log(`roadNmAddr: ${ROAD_NM_ADDR}\n`);

  console.log("[1/4] LOCALDATA 후보 검색...");
  const result = await fetchLocaldataCandidates(BPLC_NM, ROAD_NM_ADDR, 50);
  console.log(
    `  → 후보 ${result.items.length}건 (totalCount=${result.totalCount})\n`,
  );

  if (result.items.length === 0) {
    console.log("후보 0건 — 매칭 없이 종료");
    process.exit(0);
  }

  console.log("[2/4] 각 후보에 매칭 점수 계산...");
  let bestScore: MatchScoreResult | null = null;
  let bestCandidate: LocaldataItem | null = null;
  for (const item of result.items) {
    const score = computeMatchScore({
      ntsName: BPLC_NM,
      ntsAddress: ROAD_NM_ADDR,
      localdataName: item.BPLC_NM,
      localdataAddress: item.ROAD_NM_ADDR,
    });
    if (!bestScore || score.totalScore > bestScore.totalScore) {
      bestScore = score;
      bestCandidate = item;
    }
  }
  console.log(
    `  → 최고 점수: name=${bestScore?.nameScore.toFixed(3)} addr=${bestScore?.addressScore.toFixed(3)} total=${bestScore?.totalScore.toFixed(3)} matched=${bestScore?.matched}`,
  );
  console.log(
    `  → 매칭 후보: ${bestCandidate?.BPLC_NM} @ ${bestCandidate?.ROAD_NM_ADDR}\n`,
  );

  console.log("[3/4] store_verifications UPDATE...");
  await db
    .update(storeVerifications)
    .set({
      localdataMatched: bestScore?.matched ?? false,
      localdataBusinessType: bestCandidate?.OPN_ATMY_GRP_CD ?? null,
      localdataStatus: bestCandidate?.SALS_STTS_CD ?? null,
      updatedAt: new Date(),
    })
    .where(eq(storeVerifications.id, VERIFICATION_ID));
  console.log("  → UPDATE 완료\n");

  console.log("[4/4] DB 행 검증 (SELECT)...");
  const [updated] = await db
    .select({
      id: storeVerifications.id,
      businessNumber: storeVerifications.businessNumber,
      ntsValidationResult: storeVerifications.ntsValidationResult,
      localdataMatched: storeVerifications.localdataMatched,
      localdataBusinessType: storeVerifications.localdataBusinessType,
      localdataStatus: storeVerifications.localdataStatus,
      updatedAt: storeVerifications.updatedAt,
    })
    .from(storeVerifications)
    .where(eq(storeVerifications.id, VERIFICATION_ID))
    .limit(1);

  console.log("  → ", JSON.stringify(updated, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error("실패:", err);
  process.exit(1);
});
