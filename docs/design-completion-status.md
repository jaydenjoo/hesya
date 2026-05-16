# Design Completion Status — 24 페이지 100% 정합 트랙

> 최종 갱신: 2026-05-17 (세션 47 시작 전 임시 저장).
> 별도 트랙 (새 랜딩페이지 개발)으로 잠시 pivot 전 진척 보존.
>
> 본 문서: [docs/design-completion-epic-plan.md](./design-completion-epic-plan.md)의 24 페이지 진척을 PR 검증 결과로 갱신한 living tracker.

## 핵심 발견 (세션 45~46)

`design-completion-epic-plan.md`의 % 라벨은 **PR history 미반영 outdated**. 4 페이지 모두 plan label보다 20~70%포인트 더 높았음:

| 페이지               | plan label | 실제 (검증) | 차이    |
| -------------------- | ---------- | ----------- | ------- |
| A1 Admin Dashboard   | 85%        | ~95%        | +10     |
| O1 Store Dashboard   | 30%        | 100%        | **+70** |
| C4 Customer Sign-in  | 75%        | ~95%        | +20     |
| O9 Owner Store Login | 75%        | ~95%        | +20     |

비유: design-completion-epic-plan은 작년 사진. 그동안 집수리(PR)를 많이 해서 실제 상태가 훨씬 더 좋음.

## 검증된 4 페이지

| 페이지               | 세션 | PR 수                      | 100% 정합   | 비고                                                                   |
| -------------------- | ---- | -------------------------- | ----------- | ---------------------------------------------------------------------- |
| A1 Admin Dashboard   | 45   | 4 PR (#324/#326/#327/#328) | ~95%        | audit rail 4단계 polish — avatar column 미적용 (DAL 확장 prerequisite) |
| C4 Customer Sign-in  | 46   | 0 PR (인벤토리만)          | ~95%        | 클래스 수 66 vs reference 55 — over-implemented                        |
| O1 Store Dashboard   | 46   | 10 PR (#329~#338)          | **100%** ⭐ | 12 위젯 풀 정합 + mock-fixtures pattern + 숨겨진 버그 2건 fix          |
| O9 Owner Store Login | 46   | 0 PR (인벤토리만)          | ~95%        | 클래스 수 116 vs reference 104 — over-implemented                      |

## 24 페이지 전체 현황

### Customer (10 페이지)

| #   | 페이지                  | plan label | 실제        | 비고                                              |
| --- | ----------------------- | ---------- | ----------- | ------------------------------------------------- |
| C1  | Customer Landing        | 85%        | 🟡 미검증   | **세션 47부터 신규 랜딩으로 별도 트랙 시작 예정** |
| C2  | Customer Chat           | 60%        | 🟡 미검증   | -                                                 |
| C3  | Customer MyPage         | 80%        | 🟡 미검증   | -                                                 |
| C4  | Customer Sign-in        | 75%        | ⭐ **~95%** | 검증됨                                            |
| C5  | Customer Store Detail   | 65%        | 🟡 미검증   | -                                                 |
| C6  | Booking Schedule        | 60%        | 🟡 미검증   | -                                                 |
| C7  | Booking Confirmation    | 40%        | 🟡 미검증   | label 낮음 — 실제 누락 가능                       |
| C8  | Payment                 | 55%        | 🟡 미검증   | mock-first                                        |
| C9  | AI Photo Analysis       | 50%        | 🟡 미검증   | Epic B (별도 트랙)                                |
| C10 | Store Photos (Customer) | 25%        | 🟡 미검증   | label 가장 낮음                                   |

### Owner (9 페이지)

| #   | 페이지              | plan label | 실제                      | 비고                 |
| --- | ------------------- | ---------- | ------------------------- | -------------------- |
| O1  | **Store Dashboard** | 30%        | ⭐ **100%**               | 세션 46 완료 (10 PR) |
| O2  | Owner Inbox         | 75%        | 🟡 미검증 (PR #160+ 누적) | 다음 트랙 후보       |
| O3  | Owner Bookings      | 65%        | 🟡 미검증                 | -                    |
| O4  | Owner Services      | 60%        | 🟡 미검증                 | -                    |
| O5  | Owner Customers     | 40%        | 🟡 미검증                 | label 낮음           |
| O6  | Owner Analytics     | 60%        | 🟡 미검증                 | -                    |
| O7  | Owner Store Photos  | 65%        | 🟡 미검증                 | -                    |
| O8  | Owner Settings      | 60%        | 🟡 미검증                 | -                    |
| O9  | Owner Store Login   | 75%        | ⭐ **~95%**               | 검증됨               |

### Admin (5 페이지)

| #   | 페이지              | plan label | 실제        | 비고                                |
| --- | ------------------- | ---------- | ----------- | ----------------------------------- |
| A1  | **Admin Dashboard** | 85%        | ⭐ **~95%** | 세션 45 4단계 polish 완료           |
| A2  | Admin AI Cost       | 65%        | 🟡 미검증   | -                                   |
| A3  | Admin KYC           | 65%        | 🟡 미검증   | -                                   |
| A4  | Admin Payments      | 55%        | 🟡 미검증   | -                                   |
| A5  | Admin Login         | 0%         | 🟡 미검증   | owner sign-in 공유 — 폐기 가능 옵션 |

## 통계

| 지표               | 값                                 |
| ------------------ | ---------------------------------- |
| 검증 페이지        | **4 / 24 (17%)**                   |
| 100% 정합 도달     | **1 페이지 (O1)**                  |
| 95% 도달           | **3 페이지 (A1, C4, O9)**          |
| 세션 45~46 누적 PR | 14 (세션 45 polish 4 + 세션 46 10) |
| 전체 누적 PR       | 114 (세션 44: 88 → +26)            |

## 발견된 숨겨진 버그 (세션 46)

subagent 인벤토리 없었으면 못 봤을 시각 디테일:

1. **AiAccuracyTile SVG 12% 축소 렌더** (PR #331) — `width="140" viewBox="0 0 160 160"` 불일치
2. **BrightSpot rotating fade 미작동** (PR #334) — `fadeIn` keyframe이 globals.css에 정의 안 됨

## 브랜드 폰트 통일 (세션 46)

3 위젯 (KVerified, NationalityTile, AiInsight)이 모두 Fraunces italic으로 통일됨 — luxury feel 일관 신호.

## 미검증 20 페이지 처리 전략

| 우선순위 | 페이지                                              | 이유                                                                         |
| -------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| 🔴 P0    | C2 Chat, C5 Store Detail, O2 Inbox                  | label 60~75% — outdated 패턴 (4 페이지 검증 결과로 예측: 실제 80~95% 가능성) |
| 🟡 P1    | C7 / C10 / A5                                       | label 0~40% — 실제 누락 또는 미구현 가능성, 신규 개발 필요할 수도            |
| 🟢 P2    | 나머지 (O3/O4/O5/O6/O7/O8 + A2/A3/A4 + C3/C6/C8/C9) | label 55~65% — outdated 의심하되 우선순위 낮음                               |

## 권장 흐름 (트랙 복귀 시)

**Option α (빠른 검증)**: subagent 1회로 미검증 20 페이지 한 번에 인벤토리 → 실제 grade 표 산출. 1 PR 0 (탐색만). 가장 효율적.

**Option β (실제 polish)**: P0 페이지 1~2개 (예: O2 Owner Inbox) subagent + polish. O1 패턴 반복.

## 세션 47 (현재) — 별도 트랙 진행 중

**Jayden 결정 (2026-05-17)**: 위 100% 정합 트랙 잠시 보류 → 새 hesya 랜딩페이지 기획 + 디자인 소스 보유, 별도 트랙으로 진행.

이후 본 트랙 복귀 시 위 "권장 흐름" 참조.

## 관련 문서

- [PROGRESS.md](../PROGRESS.md) — 세션별 상세 PR 목록
- [docs/design-completion-epic-plan.md](./design-completion-epic-plan.md) — 원본 24 페이지 plan (% 라벨 outdated)
