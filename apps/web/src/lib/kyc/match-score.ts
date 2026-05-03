/**
 * NTS ↔ LOCALDATA 매장 매칭 점수화.
 *
 * 비유: 두 명함을 비교할 때 "가게 이름이 6, 주소가 4 정도로 중요해" 하고
 * 가중치를 두는 것. 이름은 사장이 의도해서 등록하는 값(중복 적음),
 * 주소는 표기 변형이 많아 살짝 신뢰도 낮음.
 *
 * 임계값 0.85는 D7 결정 — Phase 1.5에서 50건 이상 데이터로 정밀화 예약.
 */
import {
  MATCH_THRESHOLD,
  type MatchScoreInput,
  type MatchScoreResult,
} from "@hesya/shared-types";
import { normalizeBusinessName } from "./normalize-business-name";
import { normalizeAddress } from "./normalize-address";
import { levenshteinSimilarity } from "./levenshtein";

const NAME_WEIGHT = 0.6;
const ADDRESS_WEIGHT = 0.4;

export function computeMatchScore(input: MatchScoreInput): MatchScoreResult {
  const ntsName = normalizeBusinessName(input.ntsName);
  const localdataName = normalizeBusinessName(input.localdataName);
  const ntsAddress = normalizeAddress(input.ntsAddress);
  const localdataAddress = normalizeAddress(input.localdataAddress);

  const nameScore = levenshteinSimilarity(ntsName, localdataName);
  const addressScore = levenshteinSimilarity(ntsAddress, localdataAddress);
  const totalScore = nameScore * NAME_WEIGHT + addressScore * ADDRESS_WEIGHT;

  return {
    nameScore,
    addressScore,
    totalScore,
    matched: totalScore >= MATCH_THRESHOLD,
  };
}
