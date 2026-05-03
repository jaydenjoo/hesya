/**
 * NTS ↔ LOCALDATA 매장 매칭 점수화 공유 타입.
 *
 * Epic 9 § Step 1·2 통합 — `apps/web/src/lib/kyc/match-score.ts`의
 * `computeMatchScore` 입출력 타입과 임계값. Server Action(actions.ts)이
 * 결과 union 멤버로 노출 시 클라이언트도 같은 형태로 수신.
 *
 * 임계값 0.85는 D7 결정 — Phase 1.5에서 50건+ 데이터로 정밀화 예약.
 */

export const MATCH_THRESHOLD = 0.85;

export interface MatchScoreInput {
  ntsName: string | null | undefined;
  ntsAddress: string | null | undefined;
  localdataName: string | null | undefined;
  localdataAddress: string | null | undefined;
}

export interface MatchScoreResult {
  nameScore: number;
  addressScore: number;
  totalScore: number;
  matched: boolean;
}
