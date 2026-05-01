# PROGRESS.md

> **세션 시작 시 첫 번째로 읽는 파일** (settings.json SessionStart hook)

## 현재 위치

- **Phase**: Setup (Spec / Design / Impl / Review)
- **Epic**: Day 0 Setup
- **Task**: **S-19 + S-5 완료 (옵션 A 순서). 다음은 S-6 (Zod 타입) 진입 대기**
- **상태**: 진행중
- **작업 브랜치**: `main` (S-18·S-19·S-5 모두 머지 완료, push 대기)
- **백업 태그**: `backup/before-monorepo-2026-04-30`

## 누적 완료 내역 (2026-04-30 ~ 2026-05-01)

### 학습·검토

- ✅ docs/ 10개 문서 전체 학습 (PRD v1.2, DECISIONS v1.1, DEVELOPMENT-PLAN v1.2, BRAND-NAMING v1.0, README v1.0 등)
- ✅ PRD 검토 완료 — GAP 5건 식별 (G1 브랜드명 / G2 Epic 12 누락 / G3 모노레포vs단일앱 / G4 인프라 비용 표 오해 / G5 PROGRESS 미동기화)
- ✅ Phase 1 Epic/Task 분해 종합 (Setup 50h + Epic 1·2·3·4·9·11·12·SS 총 약 344h, 5주 캘린더)

### 통합 지시서 v1.0 (Jayden 작성) 기반 5단계 작업

- ✅ **Step 0** 사전 점검 (pwd / git / src 구조 / pnpm 10.28.2 / node v25.5.0)
- ✅ **Step 1** Git 안전 백업: snapshot commit (`6b2aaa0`) + 브랜치 분기 + 백업 태그
- ✅ **Step 2 (D1)** Visit K → Hesya 일괄 치환 (4개 문서, 총 40건 패턴 치환, 잔존 0건) — commit `04a8c03`
- ✅ **Step 3.1 (D3)** PRD § 13에 Epic 12 (관리자 패널 + 8종 운영자 플로우, 60h) 추가 — commit `5933694`
- ✅ **Step 3.2 (D3)** PRD § 6.4 인프라 비용 표에 "AI 변동비 별도" 주석 + DECISIONS § 2.1 링크 — commit `bc1d7ed`
- ✅ **Step 4 (D2)** 모노레포 재구조화 (apps/web + packages/{auth,database,shared-types,shared-ui,translations}) — commit `51c4149`
  - 4.1 영향 분석 / 4.2 루트 워크스페이스 / 4.3 폴더 골격 / 4.4 git mv 23건 / 4.5 packages package.json + .gitkeep / 4.6 .gitignore 보강 / 4.7 pnpm install (7 workspaces 인식) / 4.8 4단 검증 게이트 PASS
  - 부수 처리: tsconfig backup·package-lock.json 제거, lint-staged eslint를 @hesya/web 필터로 교정, next.config.ts에 turbopack.root 명시(빌드 경고 제거)
- ✅ **Step 5** PROGRESS.md 최종 갱신 + learnings.md에 L-001 기록 — commit `ced4f1f`
- ✅ **Step 6** main 머지 (`38c3808`, --no-ff) + GitHub push (jaydenjoo/hesya)
- ✅ **TDD Guard 영구 정리** `.claude/hooks/tdd-guard-filtered.sh` 도입, setup·config 파일 allowlist — commit `d7bb096` → main `2e08dc7`
- ✅ **S-3 Supabase Pro 활성화 + 환경변수** — commit `71cc65b` (브랜치 `chore/s-3-supabase-env`, main 머지 완료)
  - Jayden 외부 작업: hesya-prod 프로젝트 Singapore → Seoul 이전, Pro 결제 활성화
  - apps/web/.env.local에 4개 키 입력 (URL/anon/service_role/DATABASE_URL)
  - env.ts Zod 스키마에서 Supabase 4개 필드 활성화
  - apps/web/src/app/layout.tsx에 `import "@/shared/config/env"` 추가 → Next runtime 평가 시 즉시 검증
  - 포트 4200 동기화 (apps/web/package.json scripts + env.ts default)
  - @supabase/supabase-js 설치
  - tdd-guard filter 보강: stdin JSON 파싱 + env.ts·layout.tsx allowlist 추가
  - 빌드 검증: `Environments: .env.local` 인식, Zod parse 통과, 정적 페이지 4개 정상
- ✅ **S-4 DB Schema v0001** — main 머지 완료 (`87af54e`)
  - PRD § 7 의 11개 테이블 (stores·store_verifications·staff·services·customers·messages·bookings·payments·reviews·aftercare_messages·store_reports)을 Drizzle ORM 스키마로 정의
  - packages/database 의존성: drizzle-orm 0.45 / drizzle-kit 0.31 / postgres 3.4 / dotenv / tsx
  - drizzle.config.ts, tsconfig.json, src/client.ts(`createDbClient`), src/schema/{11파일} + index.ts
  - migrations/0000_first_molten_man.sql (11 tables / 13 FKs / 3 CHECK)
  - **Supabase MCP `apply_migration`로 hesya-prod (Seoul, Pro)에 적용** → `list_tables` 11개 확인
  - TDD Guard 필터 확장: `packages/*/src/schema/*.ts`, `packages/*/src/client.ts` allowlist (L-005)
  - Q1~Q5 권장안 모두 적용: Better Auth 별도(S-18) / SQL CHECK / ON DELETE NO ACTION / hesya-prod 직접 / 인덱스 PK+FK만
- ✅ **S-18 Better Auth + Google OAuth + 자체 가입** — 브랜치 `chore/s-18-better-auth` (main 머지 대기)
  - **Step 0** Jayden 외부 작업: Google Cloud OAuth 2.0 Client ID 발급 (hesya-prod 프로젝트, redirect URI `http://localhost:4200/api/auth/callback/google`, 테스트 사용자 hidream72@gmail.com 등록), `.env.local`에 BETTER_AUTH_URL/SECRET + GOOGLE_CLIENT_ID/SECRET 4개 키 추가
  - **Step 1** packages/auth: better-auth 1.6.9 + @hesya/database workspace dep, `createAuth({db,secret,baseURL,google})` 팩토리 + `createAuthClient` re-export, `usePlural:true`(PG 예약어 `user` 회피) + `advanced.database.generateId:"uuid"`(L-008)
  - **Step 2** DB 마이그레이션 `0001_watery_ezekiel_stane.sql`: 4개 테이블 (users·sessions·accounts·verifications), uuid+defaultRandom, timestamp withTimezone, ON DELETE CASCADE (인증 도메인 표준 — 비즈니스 도메인 NO ACTION과 의도적 분리), Supabase apply → `list_tables` 15/15
  - **Step 3** apps/web 통합: env.ts 4개 키 활성화, `lib/auth.ts`(createAuth + db 주입), `app/api/auth/[...all]/route.ts`(toNextJsHandler), apps/web에 better-auth direct dep 명시화
  - **Step 4** 검증: tsc clean / build clean / DB 연결 OK (Shared Pooler IPv4) / sign-in/social 200 OK / **실 OAuth flow 통과** → users·accounts·sessions·verifications 각 1 row 생성 (Supabase MCP `execute_sql` 검증)
  - 결정 변경: D1 (a) Better Auth CLI 자동 → **(b) 수동 작성**으로 변경 (createAuth 팩토리 패턴이라 CLI 정적 분석 깨짐 + 다른 11 tables와 일관성)
  - TDD Guard 필터 확장: `packages/auth/src/index.ts`, `apps/*/src/lib/auth.ts`, `apps/*/src/app/api/auth/*`, `apps/*/src/app/sign-in/page.tsx`, `packages/*/src/schema/*/*.ts`(nested) allowlist
  - 외부 작업 결과 발견: Supabase 직접 host(IPv6 only) → Shared Pooler 토글 ON으로 IPv4 호환 (L-007)
  - 검증용 임시 페이지: `apps/web/src/app/sign-in/page.tsx` ("use client" + authClient.signIn.social) — 향후 실제 sign-in 페이지가 들어오면 덮어씀
- ✅ **S-19 멀티테넌시 store_owners 조인 테이블** — main 머지 완료 (`35eea9c`)
  - 옵션 A 결정: PLAN 표 순서(S-5→...→S-19) 대신 의존성 우선 순서(S-19→S-5) 채택. RLS 매장 운영자 정책의 전제조건이 store_owners이기 때문.
  - schema/store-owners.ts: composite PK (user_id, store_id) + role CHECK ('owner','manager') + created_at
  - FK 정책: user_id → users(id) **ON DELETE CASCADE** (auth 도메인 표준), store_id → stores(id) **NO ACTION** (비즈니스 도메인 표준)
  - migrations/0002_outstanding_naoko.sql Supabase apply → list_tables 16개 (auth 4 + business 11 + store_owners 1)
  - customers.user_id FK는 추가 안 함 (외국 고객은 비회원, external_id+channel로 식별 — DECISIONS § 1.2 + PRD § 1)
- ✅ **S-5 RLS v0001** — main 머지 완료 (`b6ed6d1`)
  - 16 테이블 모두 ENABLE ROW LEVEL SECURITY (정책 0개 = default deny)
  - 전략: anon/authenticated 차단 + service_role(BYPASSRLS)만 접근 = Server Action 패턴 강제
  - migrations/0003_rls_v0001.sql + manual journal/snapshot entry (drizzle-kit는 RLS 무지)
  - 3중 검증: list_tables rls_enabled=true / get_advisors INFO×16 (의도) / SET ROLE anon SELECT 0 row / service_role baseline 1 row / `/api/auth/sign-in/social` 200 OK 회귀 OK
  - v0002+ 후속 (이번 범위 밖): Better Auth↔Supabase JWT 브리지 + StoreOwner/Designer/Staff 매장별 정책 + Admin 정책

### 변경 통계

- 13+ commits (snapshot → ... → S-3 → S-4 → S-18 → S-19 → S-5) / 약 95 files
- husky·gitleaks·lint-staged·prettier 모두 자동 통과
- 빌드 검증: tsc clean / next build / dev sign-in/social 200 OK / Supabase 16 tables RLS ACTIVE / OAuth flow E2E 통과

## 다음 세션 할 일

### main push (Jayden 명시 승인 시) — S-18·S-19·S-5 3개 머지가 origin 보다 앞서 있음

### Day 0 본 Setup 계속

- **S-6** Zod + TypeScript 타입 (shared-types에서 schema → 입력/출력 타입 export, 4h) ← 다음 우선
- **S-20** Cloudflare R2 외부 백업 cron (6h)
- **S-21** Tiptap 에디터 컴포넌트 (6h)
- **S-22** PWA Service Worker + Web Push (6h)

### RLS v0002+ (Phase 1 본 기능 시작 전 또는 동반)

- Better Auth ↔ Supabase JWT 브리지 (auth.uid() = users.id 매핑)
- StoreOwner/Designer/Staff 매장별 정책 (store_owners 조인)
- Admin 전용 정책 (KYC, 분쟁, 차단)
- Customer Storage RLS (DECISIONS § 1.6 표 기준)

### .env.example 작성 (보류 항목)

- 1인 작업 단계에서는 env.ts 자체가 source of truth. 팀 합류 또는 첫 외부 contributor 시점에 .env.example 별도 작성 (.env\*는 Write/Bash 차단되므로 Jayden 직접 1회 cp 필요)

### 디자인 작업 (병렬 진행 가능, 코드와 별개)

- 도구: [Claude Design](https://claude.ai/design) (Anthropic Labs)
- 가이드: `docs/DESIGN-PLAN.md` v1.0 — Phase 1 총 23페이지 (P0 14 / P1 9), 디자인 시스템 v3.0 베이스
- Jayden 작업 → Prototype 공유 → frontend-dev 에이전트가 shadcn/ui + Tailwind 코드로 변환
- 결정 대기: brand 색상(파랑/코랄), 첫 작업 시작점(시스템 vs 페이지)

## 차단 요소

- 없음

## 세션 이력

- 2026-04-30 17:24 — 프로젝트 초기화 (init-project.sh v10.0)
- 2026-04-30 17:55~18:00 — docs/ 학습 + GAP 5건 검토 + 통합 지시서 v1.0 수령 + Step 0~3 완료 (4 commits, 46 files)
- 2026-04-30 18:00~18:30 — Step 4 모노레포 재구조화 + Step 5 문서화 (commit `51c4149`)
- 2026-04-30 18:30~19:00 — Step 6 main 머지 + GitHub push (`38c3808`) + TDD Guard 영구 필터 도입 (`2e08dc7`)
- 2026-04-30 20:00~21:30 — S-3 Supabase Pro Seoul 이전 + 환경변수 활성화 + 빌드 검증 통과 (`71cc65b`)
- 2026-04-30 22:00~23:30 — S-4 DB Schema v0001 (Drizzle 11 tables + Supabase apply + TDD filter 확장) — `chore/s-4-db-schema-v0001` → main `87af54e`
- 2026-04-30 ~ 2026-05-01 — S-18 Better Auth + Google OAuth (5단계 OAR 사이클, 약 4h, 실 OAuth flow E2E 통과) — `chore/s-18-better-auth` → main `93356a5`
- 2026-05-01 — S-19 store_owners 조인 테이블 (옵션 A: 의존성 우선 순서) — `chore/s-19-store-owners` → main `35eea9c`
- 2026-05-01 — S-5 RLS v0001 (16 테이블 default deny + Server Action 강제 + Better Auth 회귀 OK) — `chore/s-5-rls-v0001` → main `b6ed6d1`

## 마지막 업데이트

- 2026-05-01 (S-19 + S-5 완료, S-6 진입 가능, push 대기)
