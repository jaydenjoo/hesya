# PROGRESS.md

> **세션 시작 시 첫 번째로 읽는 파일** (settings.json SessionStart hook)

## 현재 위치

- **Phase**: Setup (Spec / Design / Impl / Review)
- **Epic**: Day 0 Setup
- **Task**: **S-11 GitHub Actions CI — PR #1 CI green. main 머지 대기**
- **상태**: 진행중
- **작업 브랜치**: `chore/s-11-github-actions-ci` (PR #1, main 머지 대기)
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
- 🟡 **Phase 1A 디자인 시스템 구현** — main 머지 완료 (5/10 섹션, `3a7a62c`). Section 6~10 다음 세션
  - **방향 변경 (2026-05-01)**: 처음 단순 코드 검증 카탈로그(6 섹션)로 만들었으나 Jayden이 핸드오프 HTML과 시각 비교 후 "1:1 재현" 결정. 4원칙 1번에 따라 시간 재추정 (3~5h → 13~16h) 후 옵션 A2 채택.
  - **1:1 재현 전략**: 핸드오프 components.css·tokens.css를 `apps/web/src/styles/handoff/`로 복사 + page.tsx를 핸드오프 jsx 구조 그대로 React 19로 포팅 + 클래스명 유지. 시각 100% 일치 보장.
  - **Section 1~4 완료 (이번 세션)**: Hero(156px italic wordmark + ㅎ→H morph SVG + 5 lang tags + meta), Section 2 Color(brand 6 + semantic 4 + neutrals 6 + dark mode 6, swatch grid + hex chip), Section 3 Type(typeRows 6 + bodyRows 4 + Mono + Korean rules 4 callouts), Section 4 Space(spacing scale 13 + radius 6 + shadow 5 + motion 4) + JumpBar nav + footer. build clean.
  - **토큰 매핑**: `apps/web/src/app/globals.css` 전면 교체. shadcn 변수 → Hesya 매핑(primary=amber-500, secondary=peach-100, muted=peach-200, destructive=#DC3545 유지) + Hesya 고유 토큰(peach 3단/amber 2단/navy-900) + Trust 레이어(kverified-gold/trust-rose/share-glow) + radius 5단(8/12/16/20/24px) + 한글 helper(`.kr` + `:lang(ko)` word-break: keep-all + line-height 1.8). dark mode 보류(Phase 1 범위 밖).
  - **폰트 교체**: Geist/Playfair → **Fraunces (display) + Source Sans 3 (body en) + JetBrains Mono** (next/font/google) + **Pretendard Variable self-host** (`pretendard` npm 패키지 import). CDN 차단 환경(중국 등) 외국인 사용자 한글 fallback 위험 제거.
  - **shadcn 12개 컴포넌트 설치**: button/card/input/select/calendar/dialog/sheet/sonner/badge/avatar/tabs/navigation-menu — `apps/web/src/components/ui/`에 자동 생성. 모두 Hesya 토큰 자동 적용.
  - **packages/shared-ui 셋업**: `package.json` main/types/exports 명시 (L-013), tsconfig.json, **AiFlow.tsx + IosFrame.tsx stub** + index.ts. AiFlow는 Inbox·Chat·Photo Analysis가 공유하는 AI 흐름 (E1-7 진입 시 본격 구현), IosFrame은 PWA 데스크톱 미리보기 (개발 전용).
  - **K-Verified Badge** (`apps/web/src/components/trust/KVerifiedBadge.tsx`): PRD § 6.5 시각 트러스트 시스템. 골드 별 아이콘 + "Korea Government Verified" / "정부 검증 매장" 라벨. caller 책임으로 `verification_status` 게이팅.
  - **`/design-system` 카탈로그 페이지** (`apps/web/src/app/design-system/page.tsx`): 6 섹션(Color/Typography/Radius/Components/Trust System/Shared UI). 14개 컴포넌트 한 화면에 노출 → 시각 회귀 1회 검증.
  - **TDD Guard 필터 확장**: `packages/shared-ui/src/*.{ts,tsx}`, `apps/*/src/app/design-system/page.tsx`, `apps/*/src/app/globals.css`, `apps/*/src/components/{ui,trust}/*.tsx` allowlist (선언적 mirroring + visual regression verification, 같은 rationale로 schema·shared-types와 동일).
  - 검증: `pnpm --filter @hesya/shared-ui type-check` clean / `pnpm --filter @hesya/web build` clean / `/sign-in` 200 OK / `/design-system` 200 OK (○ Static prerendered) / `/api/auth/sign-in/social` 200 OK 회귀 / Supabase 16/16 RLS 유지
  - **Section 5 완료 (이번 세션)**: 12개 컴포넌트 블록 (Button 5×4 matrix, Card plain/accent/photo/KPI 4종, Input 7가지 상태, Select single/multi/searchable, Datepicker 캘린더+슬롯 인터랙션, Modal, Sheet 모바일+데스크톱, Toast 4종, Badge 5 row, Avatar 4 row, Tabs 5개 언어, Navigation 데스크톱 헤더+사이드바+모바일 탭바). 핸드오프 app-2.jsx 1:1 포팅.
  - **분리 전략**: page.tsx는 server component 유지(Section 1~4 정적 prerender) + `_section-5.tsx` ('use client') + `_icons.tsx` (lucide-style 36+ 아이콘 객체) 별도. /design-system 여전히 ○ Static prerendered (build 결과).
  - **회귀 fix**: Hero `hero-meta`의 "10 sections" → 핸드오프 원본대로 "9 sections" 복원 (1:1 재현 정합성).
  - **TDD Guard 필터 확장**: `*/apps/*/src/app/design-system/page.tsx` → `*/apps/*/src/app/design-system/*.tsx`로 와일드카드 (page.tsx + \_icons.tsx + 향후 \_section-N.tsx 모두 declarative mirroring of handoff jsx, verification = build + 시각 회귀).
  - 검증: `tsc --noEmit` clean / `next build` clean (○ Static prerendered) / `/design-system` 200 OK 128KB / component-block × 12, matrix-row × 25, nav-side-item × 14 모두 렌더 / `/api/auth/sign-in/social` 200 OK 회귀
  - **Playwright 자동 검증 ✅ 통과** (이번 세션): Tabs 한국어→English→日本語 본문 정확 갱신 / Datepicker 14→22 + 11:30 슬롯 + full×4 disabled×2 정상 / Select Single open→items 4→네일선택→자동닫힘 / Select Multi-chip stopPropagation OK / Field input focused+filled 클래스 / JumpBar #s5 클릭 scrollY 0→8007.5 viewport 도달 / 콘솔 에러 0건 / 핸드오프 HTML 동일 뷰포트 비교 시각 일치
  - **main 머지 완료**: `git merge --no-ff chore/phase-1a-design-system → 3a7a62c`, push origin main + chore 브랜치 보존. .gitignore에 `.playwright-mcp/`, `/design-system-full.png`, `/handoff-original-full.png`, `/s5-*.png` 추가 (시각 회귀 검증 산출물 자동 무시).
  - **Section 6~10 다음 세션 (약 7~10h)**: Icons (app-3.jsx 36+ icon 카탈로그) / Imagery / Grid (8-12 col) / A11y (WCAG 2.2 AA 체크리스트) / Female lens (UGC card + BeforeAfter, app-4.jsx 65 className 5 인터랙션). 새 브랜치 `chore/phase-1a-section-6-10` 시작 권장.
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
- ✅ **S-11 GitHub Actions CI** — 브랜치 `chore/s-11-github-actions-ci` ([PR #1](https://github.com/jaydenjoo/hesya/pull/1), main 머지 대기)
  - **Jayden 승인 3건**: D1 dummy env inline / D2 test placeholder (vitest 미도입) / D3 concurrency cancel-in-progress
  - **재작성 대상**: 기존 `.github/workflows/ci.yml` 은 init-project.sh v10.0의 broken stub이었음 (pnpm 9 vs 10.28.2, tsc 직접, --max-warnings turbo 비호환, env 7개 누락 → 매 main push 5번 fail 누적)
  - **새 ci.yml**: `pnpm/action-setup@v4` (packageManager auto-detect) + `actions/setup-node@v4 with node-version-file: .nvmrc + cache: pnpm` + concurrency cancel-in-progress + `permissions: contents: read + pull-requests: read` (L-025) + dummy env 9개 inline + `pnpm -r type-check` / `pnpm lint` / `pnpm build` / gitleaks-action@v2 + test placeholder
  - **`.nvmrc` 신설** (Node 22 LTS pin) — CI/local 일관성, 외부 컨트리뷰터 onboarding effort 감소
  - **CI debug 2 cycle**: (1) run #2 build fail — turbo strict env mode가 child process로 env 차단 (L-024). 해결: `turbo.json` build task에 `env: [9 keys]` allowlist 추가. (2) run #3 build/type-check/lint 통과했으나 gitleaks 403 — workflow permissions block 누락 (L-025). 해결: `permissions: contents: read, pull-requests: read` 명시.
  - 검증 G1~G5 ✅: yaml syntax OK / `env -i pnpm install --frozen-lockfile + type-check 6/6 + lint + build` 모두 isolated dummy env로 통과 / **CI run #3 green** ([actions/runs/25217747596](https://github.com/jaydenjoo/hesya/actions/runs/25217747596))
  - **새 교훈 2건**: L-024 (turbo strict env mode → task별 env allowlist 명시 필수), L-025 (workflow permissions block — third-party action PR API 접근 시 명시 부여)
  - **Jayden 외부 작업 (Task 머지 후 1분)**: GitHub repo Settings → Branches → Branch protection rules → main → "Require status checks to pass before merging" + `validate` 체크 선택. CI green을 main 머지 강제 게이트로 활성화.
- ✅ **S-9 next-intl 6개 언어 라우팅** — main 머지 완료 (`6513204`)
  - **Jayden 승인 4건** (2026-05-01): D1 6언어(ko/en/ja/zh-CN/zh-TW/vi, PLAN 따름) / D2 default `en` (외국인 1차 사용자) / D3 `localePrefix: 'always'` (SEO C+ 핵심) / D4 A안 최소(Common.signIn 1키만)
  - **packages/translations 활성화**: `package.json` main/types/exports 명시 (L-013), `src/index.ts` (LOCALES 상수 + Locale 타입 + DEFAULT_LOCALE + LOCALE_LABELS), `messages/{en,ko,ja,zh-CN,zh-TW,vi}.json` 6개 (각각 Common.signIn 1키), `tsconfig.json`
  - **apps/web 통합**: `next-intl@4.11.0` 설치 + `@hesya/translations` workspace dep 추가 + `next.config.ts` 에 `createNextIntlPlugin("./src/i18n/request.ts")` wrap + `src/i18n/{routing,request,navigation}.ts` 생성 (defineRouting + getRequestConfig + createNavigation)
  - **`proxy.ts` 표준 채택** (L-022): 처음 `middleware.ts`로 시작했으나 Next 16.2 build에서 deprecation 경고 발견 → `proxy.ts`로 즉시 rename. 빌드 결과 `ƒ Proxy (Middleware)` 라벨로 확인.
  - **라우트 `[locale]/` 이동** (`git mv` 히스토리 보존): `app/page.tsx` + `app/sign-in/` + `app/design-system/` → `app/[locale]/` 하위. `app/api/` 는 i18n 무관하므로 그대로 유지.
  - **`[locale]/layout.tsx` 가 root 역할** (L-023): root `app/layout.tsx` 삭제 (`git rm`), `[locale]/layout.tsx`가 `<html lang={locale}><body><NextIntlClientProvider>` 책임 + `setRequestLocale(locale)` + `generateStaticParams()` (LOCALES.map). hasLocale 가드 후 notFound() 패턴.
  - **env wiring → `instrumentation.ts`로 격상** (L-003 → L-023): 기존 root `layout.tsx`의 `import "@/shared/config/env"`를 `apps/web/src/instrumentation.ts`의 `register()` dynamic import로 이전. server boot 1회 실행, page+api 모든 라우트 진입 전 평가.
  - **sign-in 번역**: `useTranslations('Common')` → `t('signIn')`. 6개 locale 별 정확한 카피 ("Sign in with Google" / "Google로 로그인" / "Googleでログイン" / "使用 Google 登录" / "使用 Google 登入" / "Đăng nhập bằng Google").
  - **TDD Guard 필터 확장**: `*/apps/*/src/i18n/*.ts`, `*/apps/*/proxy.ts|*/apps/*/middleware.ts`, `*/apps/*/src/app/[locale]/{layout.tsx,page.tsx,sign-in/page.tsx,design-system/*.tsx}`, `*/packages/translations/src/*.ts`, `*/packages/translations/messages/*.json`, `*/apps/*/src/instrumentation.ts` allowlist (모두 declarative wiring + i18n data, 검증 = build + curl 200 OK per locale).
  - 검증 G1~G5 ✅: `pnpm --filter @hesya/translations type-check` clean / `pnpm --filter @hesya/web build` clean (21 static pages = 6 locales × 3 routes + 3 base, deprecation 0건) / `/` → 307 redirect → `/en` (default + always) / 6 locale 홈 200 / 6 sign-in 200 + locale별 정확한 button text / `/api/auth/sign-in/social` 200 OK 회귀 / Supabase 16/16 tables RLS active 유지
  - **새 교훈 2건**: L-022 (Next 16 middleware → proxy 컨벤션), L-023 ([locale]/layout.tsx가 root 역할 + instrumentation.ts로 env wiring 격상)

### 변경 통계

- 15+ commits (snapshot → ... → S-3 → S-4 → S-18 → S-19 → S-5 → S-6 → S-20) / 약 115 files
- husky·gitleaks·lint-staged·prettier 모두 자동 통과
- 빌드 검증: tsc clean / next build / dev sign-in/social 200 OK / Supabase 16 tables RLS ACTIVE / OAuth flow E2E 통과 / Zod parse smoke 4/4 / backup-verify sanity 5/5

## 다음 세션 할 일

### S-20 후속 (자동, 추가 작업 없음)

- 다음 일요일 2026-05-03 03:00 KST 자동 schedule cron 실행 → GitHub Actions UI에서 ✓ 확인 (Jayden, 1주 후 1분)
- 분기별 (2026-08-01 경) `bash scripts/backup-restore-test.sh` 1회 (Jayden, 5분)

### 권장 진행 순서 (Phase 1A 후 Setup 마무리 → 본 기능)

Jayden 승인 (2026-05-01): T2 안전 경로 채택. 의존성·가치 우선순위.

1. ~~**S-9 next-intl 5개 언어** (3h)~~ — ✅ 완료 (6언어 ko/en/ja/zh-CN/zh-TW/vi, default `en`, prefix `always`)
2. ~~**S-11 GitHub Actions CI** (3h)~~ — ✅ 완료 (PR #1 CI green, dummy env inline, turbo env allowlist, workflow permissions)
3. **S-21 Tiptap 에디터** (6h, 다음 세션) — Epic 1 인박스 답변 작성에 사용
4. **S-10 Sentry + PostHog** (2h) — 운영 관측, 배포 전
5. **SS-1~3 Staging** (8h) — Vercel Preview + Supabase staging 분리
6. **Epic 9 매장 KYC 자동 검증** 진입 (60h) — 본 기능 첫 단추 (의존성 그래프상 Epic 4·12 모두 후속)

### S-22 PWA SW (Phase 1.5 시점, 후순위)

- Epic 5 대면 통역 (Phase 1.5)에 필요 → Day 46~ 시점에 진행 (지금 X)

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
- 2026-05-01 — Phase 1A 디자인 시스템 인프라 (Hesya 토큰 + Fraunces·Source Sans 3·Pretendard self-host + shadcn 12 + AiFlow/IosFrame stub + KVerifiedBadge) — `chore/phase-1a-design-system` commit `56169e1`
- 2026-05-01 — Phase 1A 1:1 재현 Section 1~4 (Hero · Color · Type · Space + JumpBar + footer, 핸드오프 components.css·tokens.css 그대로 import) — `chore/phase-1a-design-system` commit `d5ae666`
- 2026-05-01 — L-017 추가 (디자인 1:1 재현 견적 보정 룰: CSS 라인·jsx 인터랙션·자산 직접 측정 필수)
- 2026-05-01 — Phase 1A 1:1 재현 Section 5 (12개 컴포넌트 블록, app-2.jsx 1:1 포팅, \_icons + \_section-5 분리, page.tsx server 유지, ○ Static prerender 유지, Hero 9 sections fix) — `chore/phase-1a-design-system` commit `5e820d3`
- 2026-05-01 — Phase 1A 5/10 Playwright 자동 검증 (Tabs/Datepicker/Select/Field/JumpBar 모두 핸드오프 동일 인터랙션, 콘솔 에러 0) + main 머지 `3a7a62c` + GitHub push origin/main
- 2026-05-01 — Phase 1A Section 6+7 (icons + imagery, app-3.jsx 1:1, \_icons.tsx 'use client' 제거 → server prerender 가능) — `chore/phase-1a-section-6-10` commit `f38c10d`
- 2026-05-01 — Phase 1A Section 8+9 (grid + a11y, app-3.jsx 1:1, breakpoints/12-col/4-col/bento + WCAG 2.2 AA 7개 체크리스트) — commit `9c36ef0`
- 2026-05-01 — Phase 1A Section 10 (female lens, app-4.jsx 1:1, \_section-10.tsx client 8 sub-sections + BeforeAfter 자동 sweep + drag) — commit `19a2b91`
- 2026-05-01 — 새 핸드오프 zip 검증 (prettier 정규화 후 tokens/components/app-1~4/Hesya Design System.html 모두 IDENTICAL → 새 핸드오프 = 기존 + minify, 의미 변경 0)
- 2026-05-01 — Phase 1A 10/10 main 머지 완료 (`445c7cd`, 3 commits) + GitHub push origin/main + L-021 추가 (use client는 client API 실제 사용 모듈에만)
- 2026-05-01 — S-9 next-intl 6개 언어 라우팅 (Jayden 4 결정 승인: 6언어/en default/always prefix/A안 최소) + middleware → proxy.ts (L-022) + root layout 제거하고 [locale]/layout.tsx 가 root + instrumentation.ts로 env wiring 격상 (L-023) — `chore/s-9-next-intl-locales` → main `6513204`
- 2026-05-01 — S-11 GitHub Actions CI (Jayden 3 결정 승인: dummy env / test placeholder / concurrency) + broken init-stub 재작성 + .nvmrc node 22 + L-024 turbo strict env allowlist + L-025 workflow permissions block + CI run #3 green — `chore/s-11-github-actions-ci` ([PR #1](https://github.com/jaydenjoo/hesya/pull/1))

## 마지막 업데이트

- 2026-05-01 (S-11 CI #3 green PR #1, main 머지 대기. 다음 세션 S-21 Tiptap 에디터 약 6h)
