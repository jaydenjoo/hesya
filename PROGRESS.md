# PROGRESS.md

> **세션 시작 시 첫 번째로 읽는 파일** (settings.json SessionStart hook)

## 현재 위치

- **Phase**: Setup (Spec / Design / Impl / Review)
- **Epic**: Day 0 Setup
- **Task**: **Phase 1A 디자인 시스템 코드 통합 완료. Jayden 시각 회귀 검토 + 머지 대기**
- **상태**: 진행중
- **작업 브랜치**: `chore/phase-1a-design-system` (검증 후 main 머지 예정)
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
- ✅ **S-6 Zod + TypeScript 타입** — 브랜치 `chore/s-6-shared-types` (main 머지 대기)
  - 12개 비즈니스 도메인 파일 작성 (stores·store-verifications·store-owners·staff·services·customers·messages·bookings·payments·reviews·aftercare-messages·store-reports). Auth 4 테이블은 Better Auth 자체 타입 사용으로 제외.
  - **호환 충돌 발견 → 옵션 3 채택** (L-012): drizzle-zod 0.8.3 peer는 `drizzle-orm >=0.36.0` 선언이지만 실제 타입 시그니처가 0.45.2와 충돌(`Property 'config' is protected`). drizzle-orm `latest=0.45.2`이고 `/zod` subpath는 1.0 RC만에 있어 메이저 업이 RC stage 진입 = 자해. → drizzle-zod 외부 패키지 제거, 수동 `z.object({...})` + Drizzle `$inferSelect`/`$inferInsert` 분리.
  - 매핑 컨벤션: nullable+default → `nullish()` (Insert) / `nullable()` (Select). enum CHECK 4종은 `as const` 배열 + `z.enum()` (`STORE_CATEGORIES` 9, `STORE_VERIFICATION_STATUSES` 4, `STORE_OWNER_ROLES` 2, `MESSAGE_DIRECTIONS` 2). uuid → `z.string().uuid()`, numeric → `z.string()` (drizzle 기본), date → `z.string()`, timestamp → `z.date()`, jsonb/array → `z.unknown()` / `z.string().array()`.
  - **package.json `main`/`types`/`exports` 명시** (L-013): 누락 시 deps 등록만으로는 Turbopack 모듈 해석 실패 → `Module not found`. `./src/index.ts` 진입점 명시 후 build clean.
  - 검증: `pnpm --filter @hesya/shared-types type-check` clean / `pnpm --filter @hesya/web build` clean / Zod parse smoke 4종(정상·name누락·enum오류·타입호환) 통과 / `/api/auth/sign-in/social` 200 OK 회귀 / Supabase 16 테이블 rls_enabled=true 유지
  - TDD Guard 필터 확장: `packages/shared-types/src/*.ts` allowlist (스키마와 동일하게 declarative 미러링 — verification = tsc + build + parse smoke)
- ✅ **디자인 핸드오프 v1.0 통합** — 브랜치 `chore/design-handoff-v1`
  - 출처: Jayden이 [Claude Design](https://claude.ai/design)에서 제작한 24개 HTML 페이지 + tokens.css + 40 JSX 시각 참조 (총 80 files / 1.3MB) — `hesya.zip` (`hesya-handoff.zip`은 Anthropic README만 추가된 동일 내용, 80/80 hash 일치 확인)
  - 자산 위치: `docs/design/handoff/` (HANDOFF-README.md + INDEX.md + 80 원본 파일)
  - 페이지 매핑: 23 product page (DESIGN-PLAN 23개와 page-for-page 일치) + 1 디자인 시스템 가이드 = 24
  - **확정 결정 (보류 → 채택)**:
    - **Brand 색상**: § 4 권장안(따뜻한 코랄/살구) 채택. Peach 50/100/200 + Amber 500/600 + Navy 900
    - **폰트**: Fraunces (display) + Source Sans 3 (en body) + Pretendard Variable (kr body) + JetBrains Mono — 모두 글로벌 v4.1 허용 리스트 안
    - **Motion**: fast 120 / normal 220 / slow 420 ms (글로벌보다 sharp)
  - **신규 컨셉 추가**:
    - **K-Verified 골드 트러스트 시스템** — `--kverified-gold #D4AF37` + `--trust-rose` + `--share-glow` 3단 레이어. PRD § 6.5 신규 섹션 추가 (외국인 트러스트 핵심 UX, KYC 통과 매장 단일 강조)
    - **AiFlow 컴포넌트** — Inbox·Chat·Photo Analysis 가로지르는 AI 응답 흐름 시각화. `packages/shared-ui/src/AiFlow.tsx` 구현 예정
    - **IosFrame 컴포넌트** — PWA 모바일 미리보기. `packages/shared-ui/src/IosFrame.tsx` 구현 예정 (개발 시 iOS Safe Area + status bar 시뮬레이션)
  - **공용 컴포넌트 12개 → 14개로 확장** (DESIGN-PLAN § 4.5)
  - 갱신 문서: PRD § 6.5 (K-Verified 시스템), DESIGN-PLAN § 4 (토큰 확정 + 핸드오프 매핑 위치), docs/design/handoff/INDEX.md (페이지 인덱스 + 코드 매핑 가이드)
  - 구현 원칙 (handoff README): "Match the visual output; **don't copy the prototype's internal structure**" — JSX 그대로 import 금지, Next.js 16.2 + Tailwind v4 + shadcn/ui로 재작성
- 🟡 **Phase 1A 디자인 시스템 구현** — 브랜치 `chore/phase-1a-design-system` (Jayden 시각 회귀 검토 대기)
  - **토큰 매핑**: `apps/web/src/app/globals.css` 전면 교체. shadcn 변수 → Hesya 매핑(primary=amber-500, secondary=peach-100, muted=peach-200, destructive=#DC3545 유지) + Hesya 고유 토큰(peach 3단/amber 2단/navy-900) + Trust 레이어(kverified-gold/trust-rose/share-glow) + radius 5단(8/12/16/20/24px) + 한글 helper(`.kr` + `:lang(ko)` word-break: keep-all + line-height 1.8). dark mode 보류(Phase 1 범위 밖).
  - **폰트 교체**: Geist/Playfair → **Fraunces (display) + Source Sans 3 (body en) + JetBrains Mono** (next/font/google) + **Pretendard Variable self-host** (`pretendard` npm 패키지 import). CDN 차단 환경(중국 등) 외국인 사용자 한글 fallback 위험 제거.
  - **shadcn 12개 컴포넌트 설치**: button/card/input/select/calendar/dialog/sheet/sonner/badge/avatar/tabs/navigation-menu — `apps/web/src/components/ui/`에 자동 생성. 모두 Hesya 토큰 자동 적용.
  - **packages/shared-ui 셋업**: `package.json` main/types/exports 명시 (L-013), tsconfig.json, **AiFlow.tsx + IosFrame.tsx stub** + index.ts. AiFlow는 Inbox·Chat·Photo Analysis가 공유하는 AI 흐름 (E1-7 진입 시 본격 구현), IosFrame은 PWA 데스크톱 미리보기 (개발 전용).
  - **K-Verified Badge** (`apps/web/src/components/trust/KVerifiedBadge.tsx`): PRD § 6.5 시각 트러스트 시스템. 골드 별 아이콘 + "Korea Government Verified" / "정부 검증 매장" 라벨. caller 책임으로 `verification_status` 게이팅.
  - **`/design-system` 카탈로그 페이지** (`apps/web/src/app/design-system/page.tsx`): 6 섹션(Color/Typography/Radius/Components/Trust System/Shared UI). 14개 컴포넌트 한 화면에 노출 → 시각 회귀 1회 검증.
  - **TDD Guard 필터 확장**: `packages/shared-ui/src/*.{ts,tsx}`, `apps/*/src/app/design-system/page.tsx`, `apps/*/src/app/globals.css`, `apps/*/src/components/{ui,trust}/*.tsx` allowlist (선언적 mirroring + visual regression verification, 같은 rationale로 schema·shared-types와 동일).
  - 검증: `pnpm --filter @hesya/shared-ui type-check` clean / `pnpm --filter @hesya/web build` clean / `/sign-in` 200 OK / `/design-system` 200 OK (○ Static prerendered) / `/api/auth/sign-in/social` 200 OK 회귀 / Supabase 16/16 RLS 유지
  - **Jayden 검토 단계 (다음)**: dev 서버 → `localhost:4200/design-system` 방문 → 6 섹션 시각 확인 → shadcn 컴포넌트가 Hesya amber/peach 색으로 렌더링되는지, 한글 본문이 Pretendard로 렌더링되는지 → 어긋난 부분 있으면 재매핑
- ✅ **S-20 Cloudflare R2 외부 백업 cron** — main 머지 완료 (`d0ab61f` + 후속 fix `79f1dad`)
  - 코드 산출물: `.github/workflows/weekly-backup.yml` (cron `0 18 * * 6` + workflow_dispatch), `scripts/backup-verify.sh`, `scripts/backup-restore-test.sh`
  - **PG 버전 미스매치 fix** (L-016): Ubuntu 24.04 runner의 default PG client는 16.13인데 Supabase는 17.6 → 첫 실행 fail. PGDG로 17 install은 했지만 default symlink가 16을 가리켜 PATH 우선순위에서 16이 먼저. 해결: `echo "/usr/lib/postgresql/17/bin" >> "$GITHUB_PATH"`로 17 binary 경로를 PATH 앞에 prepend. fix commit `636c11c` → main `79f1dad`
  - Jayden 외부 작업 완료: Cloudflare R2 활성화 + `hesya-backups` 버킷 + 90일 lifecycle rule + Account API 토큰(Object Read & Write, hesya-backups 한정) + Supabase Session pooler URL 확보 + GitHub Secrets 5개 등록
  - **첫 실행 (workflow_dispatch) ✅ Success**: 46초 완료, `backup-2026-05-01.sql.gz` 8KB R2 업로드, 16/16 tables verified
  - **복구 테스트 ✅ 통과**: 로컬 Docker PG 17 컨테이너 → restore → 16 테이블 모두 존재, Better Auth row count 정확히 일치 (accounts 1 / sessions 1 / users 1 / verifications 4), 비즈니스 12 테이블 0 row (아직 데이터 입력 전, 정상)
  - 자동 schedule: 다음 일요일 2026-05-03 03:00 KST부터 주간 자동 실행. 추가 작업 없음
  - **결정 변경 (DECISIONS § 1.13 정정)**: "Supabase Edge Function cron" → **GitHub Actions cron**. Edge Function = Deno runtime이라 pg_dump 바이너리 호출 불가능. GitHub Actions는 Ubuntu runner + PGDG `postgresql-client-17` 정확 매칭 + Secrets 안전 보관 + 무료 + 실패 시 GitHub UI 이메일 알림.
  - 산출물: `.github/workflows/weekly-backup.yml` (cron `0 18 * * 6` = Sat 18:00 UTC = Sun 03:00 KST + workflow_dispatch), `scripts/backup-verify.sh` (gzip + SQL 헤더 + 16 테이블 자동 검증), `scripts/backup-restore-test.sh` (분기별 수동 Docker PG 17 복원 테스트)
  - 자동 검증 단계: pg_dump → gzip -9 → backup-verify.sh → aws s3 cp R2 (S3 호환 endpoint)
  - backup-verify.sh sanity 5/5 통과: 파일 누락 / 깨진 gzip / SQL 헤더 누락 / 15 테이블 누락 / 16 테이블 통과 케이스
  - **Jayden 외부 작업 (Task 머지 전 선행 필수)**:
    1. Cloudflare 계정 → R2 활성화 → 버킷 `hesya-backups` 생성
    2. R2 → "Manage API tokens" → S3 호환 토큰 발급 (Object Read & Write, `hesya-backups` 한정)
    3. Supabase 대시보드 → Database → Connection String → **Session mode (port 5432)** URL 복사 (Transaction mode 6543은 pg_dump fail)
    4. GitHub repo `jaydenjoo/hesya` → Settings → Secrets 5개: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`(=`hesya-backups`), `BACKUP_DATABASE_URL`(Session pooler URL)
    5. R2 버킷 → Lifecycle rules → "Delete after 90 days"
    6. GitHub Actions UI → `Weekly DB Backup to R2` workflow → `Run workflow` (workflow_dispatch) → 성공 확인 + R2 콘솔에 `backup-YYYY-MM-DD.sql.gz` 도착 확인
    7. (1회) 로컬 `bash scripts/backup-restore-test.sh ./backup-YYYY-MM-DD.sql.gz` 실행 → 16 테이블 row count 확인
  - 다음 일요일 자동 실행 후 GitHub Actions UI에서 success 확인하면 PROGRESS 클로즈

### 변경 통계

- 15+ commits (snapshot → ... → S-3 → S-4 → S-18 → S-19 → S-5 → S-6 → S-20) / 약 115 files
- husky·gitleaks·lint-staged·prettier 모두 자동 통과
- 빌드 검증: tsc clean / next build / dev sign-in/social 200 OK / Supabase 16 tables RLS ACTIVE / OAuth flow E2E 통과 / Zod parse smoke 4/4 / backup-verify sanity 5/5

## 다음 세션 할 일

### S-20 후속 (자동, 추가 작업 없음)

- 다음 일요일 2026-05-03 03:00 KST 자동 schedule cron 실행 → GitHub Actions UI에서 ✓ 확인 (Jayden, 1주 후 1분)
- 분기별 (2026-08-01 경) `bash scripts/backup-restore-test.sh` 1회 (Jayden, 5분)

### Day 0 본 Setup 계속 (다음 Task 선택)

- **S-21** Tiptap 에디터 컴포넌트 (6h)
- **S-22** PWA Service Worker + Web Push (6h)
- **Phase 1A** 디자인 시스템 구현 (tokens.css → globals.css + shadcn 14개) — 디자인 핸드오프 v1.0 통합됐으니 진입 가능

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
- 2026-05-01 — S-6 shared-types 12 도메인 (drizzle-zod 호환 충돌 → 수동 Zod + Drizzle inferred 타입 분리) — `chore/s-6-shared-types` → main `0c31ff6`
- 2026-05-01 — S-20 R2 weekly backup workflow + verify/restore scripts (DECISIONS § 1.13 정정: Edge Function → GitHub Actions) — `chore/s-20-r2-backup` → main `d0ab61f`
- 2026-05-01 — 디자인 핸드오프 v1.0 통합 (24 HTML + tokens.css + JSX 참조 1.3MB) + 브랜드/폰트/Motion 확정 + K-Verified 골드 시스템 신설 — `chore/design-handoff-v1` → main `1f1272e`
- 2026-05-01 — S-20 PG 버전 미스매치 fix (PGDG postgresql-17 PATH prepend) + 첫 백업 + 복구 테스트 통과 → S-20 완전 클로즈 — `fix/s-20-pg-dump-path-17` → main `79f1dad`
- 2026-05-01 — Phase 1A 디자인 시스템 (Hesya 토큰 + Fraunces·Source Sans 3·Pretendard self-host + shadcn 12 + AiFlow/IosFrame stub + KVerifiedBadge + /design-system) — `chore/phase-1a-design-system` (Jayden 시각 회귀 검토 대기)

## 마지막 업데이트

- 2026-05-01 (Phase 1A 코드 통합 완료, /design-system 시각 회귀 검토 대기)
