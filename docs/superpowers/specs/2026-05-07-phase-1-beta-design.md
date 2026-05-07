---
date: 2026-05-07
status: draft
type: design-spec
related:
  - docs/PRD.md (§13 Epic 1 / Epic 9 / Epic 12)
  - docs/learnings.md (L-079 PRD-only planning 함정)
  - PROGRESS.md (Conformance Audit 2026-05-07)
  - docs/superpowers/specs/2026-05-07-qstash-migration.md (Phase 1C closure)
naming:
  loose: "Phase 1.5"
  formal: "Phase 1-β (Beta-Ready Slice)"
  reason: "PRD §13의 'Phase 1.5' = Epic 5·6·7·8 (모듈 4·5·6·8) 와 충돌 회피"
---

# Phase 1-β — Beta-Ready Slice

> **목적**: 베타 매장 1곳 + 외국 고객 1명이 실제로 메시지를 주고받는 데 꼭 필요한 최소 슬라이스만 빼서 별 마일스톤으로 정의. Phase 1 closure의 부분집합이며, 베타 학습 결과로 잔여분 우선순위 재조정.

## 0. Executive Summary

| 항목                      | 값                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| 학습 단위                 | 베타 매장 1곳 + 외국 고객 N명 (1주 운영)                                                   |
| 핵심 가설                 | "AI 초안 → owner 검수·승인" 모드의 수정률이 매장 시간을 줄여주는 수준 (PRD §268 토글 정신) |
| 신규 페이지               | Owner 4개 + Admin 1개                                                                      |
| 신규 마이그               | 1건 (0023) — ALTER 4건                                                                     |
| 신규 테이블               | 0개 (기존 `store_verifications` / `store_owners` / `stores` / `messages` 재사용)           |
| 추정 시간                 | 약 19~21h, 3~4 세션                                                                        |
| Phase 1 closure 합류 시점 | 베타 1주 운영 + 회고 후                                                                    |

## 1. 문제·맥락

### 1.1 핵심 모순 (Conformance Audit 2026-05-07 발견)

| 영역                             | Coverage | 의미                              |
| -------------------------------- | -------- | --------------------------------- |
| Epic 1 인박스 (AI 응답·번역·RAG) | **62%**  | 작동함 — webhook → AI → DB        |
| Epic 12 관리자 패널              | **18%**  | 트리거 2/8, 처리 UI 0/8           |
| Store UI (매장 owner 진입 경로)  | **9%**   | 매장 owner sign-in/dashboard 부재 |

**모순**: Inbox는 작동하지만 매장 owner가 들어와서 볼 곳이 없음 → 베타 1곳 진입 경로 0.

### 1.2 Phase 1 closure 차단 사유

- Phase 1D (결제·다채널 WhatsApp/Kakao/LINE) — Jayden 사업자 등록 대기 중
- Epic 4 대시보드 — 디자인 8개 대기
- 따라서 Phase 1 풀 closure를 끝까지 짓는 건 비현실 → **베타 학습용 슬라이스 분기**

### 1.3 메타 학습 (L-079 적용)

본 spec 작성 전 Pre-Plan Inventory 5분 실행 결과 design 가정 2개가 깨졌고, 둘 다 **scope 축소** 방향이었다. 자세한 결과는 §10에 첨부.

## 2. 학습 가설

| ID            | 가설                                                                    | 측정 metric                            | 1주 후 결정 영향                                  |
| ------------- | ----------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------- |
| **H1 (핵심)** | "AI 초안 → owner 수정·승인" 모드의 수정률이 매장 시간을 실제로 줄여준다 | 무수정 % / 부분 수정 % / 전면 재작성 % | Bot 자동 모드 진입 가능 여부                      |
| H2            | 매장 owner가 sign-up → KYC 승인 → 첫 로그인까지 self-serve로 도달       | 가입 시작 → 첫 로그인 시간             | Phase 1 closure 시 KYC OCR/Vision 자동화 우선순위 |
| H3 (시그널)   | 외국 고객이 AI 응답 받고 예약 의도까지 표명 (결제는 Phase 1D 보류)      | 메시지 → 예약 의도 표명 %              | Phase 1D resume 시 결제 위젯 노출 위치            |

## 3. Scope IN

### 3.1 Owner 측 4 페이지

| #   | 페이지                             | 핵심 기능                                                                             | 디자인 ref                         |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------- |
| O1  | Sign-up + KYC 폼                   | Better Auth Google OAuth → 사업자번호 / 매장명 / 전화 / 주소 / 영업신고증 사진 업로드 | `docs/design/reference/` 매장 가입 |
| O2  | 검토 대기 화면                     | "신청 접수, 24~48h 내 승인" + 상태 폴링 (`/api/store/me/status`)                      | 신규 작성 (lo-fi)                  |
| O3  | Inbox 검수·승인                    | Bot/Owner 토글 (매장별 1개) + AI 초안 → 수정 / 승인 / 전송 / skip                     | `docs/design/reference/` Inbox     |
| O4  | Instagram 연결 + 매장 status badge | 기존 OAuth 흐름에 진입 경로 + verificationStatus 표시                                 | 기존 + 보강                        |

### 3.2 Admin 측 1 페이지

| #   | 페이지                                      | 핵심 기능                                                                                                  |
| --- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| A1  | 매장 검토 큐 (`/admin/store-verifications`) | 목록 (status=manual_review) + 상세 + 승인/거절 + 사유 입력. 기존 `lib/kyc/actions.ts` server action 재사용 |

## 4. Scope OUT (명시적 후순위)

| 항목                                                                | 합류 시점                 | 이유                                                             |
| ------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------- |
| KYC OCR (Claude Opus 4.7 Vision)                                    | Phase 1 closure           | 베타 1곳 매뉴얼 검토 충분                                        |
| 국세청 사업자등록 진위 API                                          | Phase 1 closure           | 매뉴얼 검토 충분                                                 |
| LOCALDATA 자동 매칭                                                 | Phase 1 closure           | 매뉴얼 검토 충분                                                 |
| PRD §268 Vision 사진 분석 (Inbox)                                   | Phase 1 closure           | 베타에선 텍스트만, 사진 도착 시 "사진 매장 직접 문의" auto-reply |
| Epic 4 대시보드 (Recharts 12 KPI)                                   | Phase 1 closure           | 데이터 0건 무의미                                                |
| Epic 3 예약 / Epic 11 SEO                                           | Phase 1 closure           | 가설 검증 무관                                                   |
| Epic 12 잔여 7종 플로우 (PRD §1057 #2~#8, Task 분해상 E12-3~E12-11) | Phase 1 closure           | 베타 1곳 발화 0                                                  |
| Epic 2 결제 + WhatsApp/Kakao/LINE 채널                              | Phase 1D (사업자 등록 후) | 차단                                                             |
| Epic 5·6·7·8 (PRD 정의 Phase 1.5)                                   | Day 60+                   | 본채 미완                                                        |

## 5. Data Model 변경

### 5.1 기존 재사용 (Inventory 결과)

| 테이블                                  | 재사용 항목                                                                                                                            |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `store_owners`                          | user ↔ store M:N junction. role enum ('owner','manager'). 신규 가입 시 row insert                                                      |
| `store_verifications`                   | business*number / nts*_ / localdata\__ / ocr\_\* / verification_status enum / reviewed_by / reviewed_at — KYC 워크플로우 전체 모델링됨 |
| `stores.verificationStatus`             | enum ('pending','auto_approved','manual_review','rejected')                                                                            |
| `stores.businessLicenseNumber/ImageUrl` | KYC 폼 입력 → 직접 stores 행 갱신                                                                                                      |
| `kyc_verification_logs`                 | actor_user_id 감사 로그                                                                                                                |
| `messages.aiModel`                      | PR #80에서 추가됨 — Phase 1.5 비용 분석에 재사용                                                                                       |

### 5.2 신규 추가 (마이그 0023)

```sql
-- 0022_phase_1_beta_review_mode.sql 또는 0023_... (§10.4 N1 진행 여부 따름)
ALTER TABLE stores
  ADD COLUMN bot_mode boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN stores.bot_mode IS
  'false=owner 검수·승인, true=AI 자동 전송. Phase 1-β 학습 가설 H1 토글.';

ALTER TABLE messages
  ADD COLUMN draft_status text,
  ADD COLUMN reviewed_by uuid,
  ADD COLUMN edited_from_ai boolean;

ALTER TABLE messages
  ADD CONSTRAINT messages_draft_status_check
  CHECK (draft_status IS NULL
    OR draft_status IN ('pending_review','approved','sent','skipped','direct'));

COMMENT ON COLUMN messages.draft_status IS
  'NULL=수신 메시지. pending_review=AI 초안 대기. approved/sent/skipped=owner 처리. direct=owner 직접 작성(Phase 1-β 후 합류).';
COMMENT ON COLUMN messages.edited_from_ai IS
  'AI 초안과 최종 전송 텍스트가 다른지. H1 수정률 분석용.';

-- RLS는 기존 정책 그대로 적용 (store_owners 기반)
```

### 5.3 RLS

신규 컬럼만 추가이므로 기존 RLS 정책(0017/0019/0022) 그대로 적용. 신규 RLS 정책 0건.

## 6. Sequence — 5 Task

```
Task A: 마이그 0023 + DAL 갱신             [~1h]   prerequisite
   ↓
Task B: Owner Sign-up + KYC 폼 + 검토 대기   [~5h]
Task C: Admin 매장 검토 큐                   [~3h]   ← B와 병렬 가능
Task D: Inbox 검수·승인 (Bot/Owner 토글)     [~8h]   ← B+C와 병렬 가능
   ↓ (B+C+D 모두 끝난 후)
Task E: E2E 베타 시뮬레이션 + 운영 readme    [~3h]
```

**총 약 19~21h, 3~4 세션** (1 세션 6~8h).

**병렬 위임**: B / C / D는 schema 의존만 있고 서로 독립 → 1 세션에 3 subagent 동시 진행 옵션. dispatching-parallel-agents skill 후보.

### Task별 세부

| Task | 산출물                                                                                                                                                                                                          | 검증 게이트                                                    |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| A    | `0023_phase_1_beta_review_mode.sql` + drizzle schema 갱신 + DAL 헬퍼 (getStoreBotMode, setMessageDraftStatus)                                                                                                   | tsc / lint / vitest 0 regression / Jayden 수동 apply (🔴 prod) |
| B    | `/sign-up`, `/onboarding/kyc`, `/onboarding/pending` 라우트. server action `submitKycApplication` (storeVerifications insert + storeOwners insert + stores insert)                                              | manual flow 1회 + tsc / lint / vitest                          |
| C    | `/admin/store-verifications` 라우트 (requireAdminEmail 가드). 기존 `lib/kyc/actions.ts` 재사용 + UI만 신규                                                                                                      | manual flow 1회 + tsc / lint / vitest                          |
| D    | Inbox 페이지에 Bot/Owner 토글 + 검수·승인 UI. server action `approveDraft` / `editAndSend` / `skipDraft`. AI generation flow가 bot_mode=false면 draft_status='pending_review'로 멈춤, true면 기존대로 즉시 전송 | manual flow 1회 + 신규 vitest 5건+                             |
| E    | playwright E2E 1건 + `docs/runbook.md`에 베타 onboarding 절차 1 페이지                                                                                                                                          | E2E 통과                                                       |

## 7. Risk & Open Questions

| Risk                                                                        | 완화                                                                                                   |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Better Auth ↔ Supabase RLS `auth.uid()` 브릿지 부재 (PROGRESS Phase 2 후보) | service_role bypass 그대로 사용. anon/authenticated 키 사용 시 Phase 2로 미룸                          |
| KYC 매뉴얼 검토 SLA                                                         | 베타 1곳 24h 약속, 실제 1h 내 처리 (Jayden 직접)                                                       |
| Bot 모드 토글 — 매장별 vs 메시지별                                          | **매장별 1 토글**로 시작. 메시지별은 H1 결과로 결정                                                    |
| 사진 메시지 도착 시 응답 품질                                               | "사진은 매장에 직접 문의 권장" auto-reply (Vision은 Phase 1 closure)                                   |
| 본 마이그 hybrid 함정 (L-079 리스크)                                        | manual SQL only. `db:generate` 절대 금지. `packages/database/CLAUDE.md` 절차 그대로                    |
| draft_status='pending_review' 상태 메시지가 무한 적체                       | E12-7 (PRD AI 응답 정확도 모니터링) — Phase 1-β scope OUT. 베타 1곳에선 SQL 직접 + Sentry alert로 감시 |

## 8. 성공 기준 (Phase 1-β 종료 조건)

- [ ] 베타 매장 1곳: sign-up → KYC 승인 → IG 연결 → DM 1건+ 처리 (E2E)
- [ ] 첫 처리 메시지로부터 1주 내 메시지 10건+ 누적, H1 수정률 분포 데이터 확보
- [ ] H1·H2·H3에 대한 1차 결론 (다음 단계 결정 근거)
- [ ] 베타 회고 + `docs/learnings.md` L-080+ 1건+

## 9. 베타 매장 selection criteria

- Jayden 직접 컨택 (홍대·해운대·강남 중 1곳)
- 외국 고객 비중 ≥ 20% 매장
- 사전 인터뷰 30분 + 동의서 + onboarding 1일 동행
- Phase 1-β 종료 후 무료 운영 1개월 보상 (Phase 2 의료 진입 시 우대)

## 10. Pre-Plan Inventory 결과 (L-079 적용)

### 10.1 키워드 grep

```bash
grep -rn "owner_user_id|kyc_status|kyc_submission|bot_mode|draft_status" \
     packages/database/src/schema/ apps/web/src/shared/lib/dal/
```

| 키워드           | 결과                            | 해석                                                                      |
| ---------------- | ------------------------------- | ------------------------------------------------------------------------- |
| `bot_mode`       | 0건                             | 신규 추가 OK                                                              |
| `draft_status`   | 0건                             | 신규 추가 OK                                                              |
| `kyc_submission` | 0건                             | **하지만** `store_verifications`가 동일 도메인 — 중복 신규 X, 기존 재사용 |
| `reviewed_by`    | `store_verifications.ts:61` 1건 | KYC reviewed_by 이미 모델링됨                                             |

### 10.2 인접 자산 (`packages/database/src/schema/` 19 파일)

기존 KYC·매장 관련 schema 풀세트:

- `stores.ts` — businessLicenseNumber, businessLicenseImageUrl, verificationStatus enum 4단계 이미 존재
- `store_owners.ts` — user ↔ store M:N junction. 신규 추가 불필요
- `store_verifications.ts` — business_number, NTS 결과, LOCALDATA 매칭, OCR, 자기신고, reviewed_by, verification_status 전부 존재
- `kyc_verification_logs.ts` — actor_user_id 감사 로그
- `store_reports.ts` — 외부 신고 (Phase 1-β scope OUT, schema는 있음)
- `store_tone_examples.ts`, `store_knowledge.ts` — RAG 인프라

### 10.3 admin 가드 사용처

```bash
grep -rln "requireAdminEmail" apps/web/src/
```

```
apps/web/src/lib/kyc/actions.ts          ← KYC 승인 server action 이미 있음
apps/web/src/lib/store-reports/actions.ts
apps/web/src/shared/lib/admin-guard.ts
apps/web/src/shared/lib/admin-guard.test.ts
apps/web/src/shared/lib/CLAUDE.md
```

→ Admin 매장 검토 큐 (Task C)는 **UI만 신규**, server action 재사용.

### 10.4 최근 마이그 5건

```
0017_rls_initplan_optimization.sql
0018_customers_ig_profile_fetched.sql
0019_rls_remaining_tables.sql
0020_advisor_cleanup.sql
0021_customers_preferred_designer_100.sql
```

신규 마이그 번호: **0022 또는 0023** (가용 번호). PROGRESS.md "다음 세션 후보 #2 N1+N3"가 0022 messages RLS InitPlan으로 예약되어 있음.

- N1 먼저 진행 → Phase 1-β 마이그는 **0023**
- N1 미진행 → Phase 1-β 마이그는 **0022** 로 reassign 가능 (hybrid 마이그 절차 `packages/database/CLAUDE.md` 따름)

Plan 단계에서 N1 진행 여부 확정 후 결정.

### 10.5 인벤토리가 design을 바꾼 부분

| Design v1 (인벤토리 전)                                            | Design v2 (인벤토리 후)                                                                  |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `kyc_submissions` 신규 테이블                                      | **삭제** — `store_verifications` 재사용                                                  |
| `stores.owner_user_id` 신규 FK                                     | **삭제** — `store_owners` junction 재사용                                                |
| `stores.kyc_status` enum 신규                                      | **삭제** — `verificationStatus` 재사용                                                   |
| `stores.kyc_reviewed_at` / `kyc_reviewed_by` / `kyc_reject_reason` | **삭제** — `store_verifications.reviewed_at` / `reviewed_by` / `rejection_reason` 재사용 |
| Task B 추정 6h                                                     | **5h** — 신규 테이블 schema 작업 0                                                       |
| Task C 추정 4h                                                     | **3h** — server action 재사용                                                            |
| 총 ~24h                                                            | **약 19~21h**                                                                            |

**결정**: 인벤토리 결과 모든 변경 적용. 신규 테이블 0건, ALTER 4건만.

## 11. 다음 단계

1. 본 spec → Jayden 검토 → 승인
2. `superpowers:writing-plans` skill로 implementation plan 작성 (Task A~E 각각의 RED-first TDD 사이클)
3. 첫 Task 진행 — Task A (마이그 + DAL) 가 prerequisite, 나머지 B/C/D는 병렬 위임 후보
