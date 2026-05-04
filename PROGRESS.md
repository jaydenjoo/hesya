# PROGRESS.md

> **세션 시작 시 첫 번째로 읽는 파일** (settings.json SessionStart hook)

## 현재 위치

- **Phase**: Phase 1 진행 중
- **Epic**: **Epic 1 통합 다국어 인박스** — 1A 인프라 + Instagram PoC
- **Task**: **Phase A 완료 ✅** + **Phase B 완료 ✅ (PR #20 머지)** → **다음**: prod migration 적용 (🔴 별 세션) → Phase C 진입 (T07 DAL부터)
- **상태**: Phase B 머지 완료. Supabase dev branch 삭제됨 (비용 정지). 차단 요소 없음.
- **작업 브랜치**: `chore/session-save-phase-b-merged` (origin/main `8cbb7ba` 기준 분기, 세션 save용)
- **이전 PR**: [hesya#20](https://github.com/jaydenjoo/hesya/pull/20) Phase B — DB 마이그레이션 + Drizzle 스키마 + Vault 토큰 헬퍼 → main `8cbb7ba` ✅ (Jayden squash merge)
- **그 이전 PR**: [hesya#19](https://github.com/jaydenjoo/hesya/pull/19) Phase A — runbook + 6 에러 클래스 + Server Action Sentry → main `19d2f1a` ✅
- **Prod URL**: `https://hesya-web.vercel.app` (Vercel project `jaydens-projects-f5e92399/hesya-web`)
- **Supabase prod**: `bnlyzlfsxtjpzzydjjuv` (hesya-prod, Northeast Asia Seoul)
- **백업 태그**: `backup/before-monorepo-2026-04-30`

## 다음 세션 할 일 (우선순위)

### 1. 🔴 Prod migration v0011 적용 (별 세션, Jayden 옆에서)

CLAUDE.md "🔴 보안 중요" 룰: prod schema 변경은 AI 자동 적용 금지. Jayden이 옆에서 1회씩 명령.

```
mcp__supabase-local__apply_migration(
  project_id = "bnlyzlfsxtjpzzydjjuv",
  name = "0011_inbox_conversations",
  query = <packages/database/migrations/0011_inbox_conversations.sql 전문>
)
```

검증 (Phase B에서 dev branch에서 했던 것과 동일):

- `list_tables(project_id="bnlyzlfsxtjpzzydjjuv", schemas=["public"])` — conversations + store_integrations 등장
- messages 컬럼 3개 추가 확인
- 인덱스 5개 (idx*conversations*_, idx*messages*_, idx_customers_channel_external)
- RLS 정책 2개 (conversations_store_owner, store_integrations_store_owner)
- pgsodium extension 활성

검증 통과 후 Sentry / Vercel 모니터링 5분 이상 관찰.

### 2. Phase C 시작 — DAL (T07~T09, ~3h)

plan: docs/superpowers/plans/2026-05-04-epic-1a-inbox-instagram.md § Phase C

- T07 `dal/conversations.ts` (upsert / get / list / unread / window)
- T08 `dal/messages.ts`
- T09 `dal/customers.ts`

⚠️ **plan 보강 필요**: T07~T09 테스트가 `@/test-helpers/db`에서 `resetDb`/`seedStore`/`seedCustomer`를 import하는데 코드베이스에 미존재. **T06.5 (test-helpers/db 인프라 구축)** 작업을 plan에 추가하고 우선 진행 후 T07~T09.

## 차단 요소

없음. PR 머지 완료, dev branch 삭제, 외부 의존성 OK.

## 마지막 업데이트

- 날짜: 2026-05-04 P.M. (Phase B PR #20 머지 + dev branch 삭제 + 세션 save)

## 이번 세션 완료 (2026-05-04 P.M. — Phase B 완주 + PR #20 머지)

### 1. T04 Migration v0011 dev branch 적용 + 검증

- `mcp__supabase-local__apply_migration` 호출 → 성공
- 검증 5/5: 테이블 2개, messages 컬럼 3개, 인덱스 5개, RLS 2개, pgsodium 3.1.8
- Drizzle journal 수동 entry idx=11 추가 (L-010 패턴)
- 첫 commit: `61120cd feat(db): v0011 conversations + store_integrations + messages 확장 + RLS`

### 2. T05 Drizzle 스키마 TypeScript

- 신규: `conversations.ts` (UNIQUE + 2 인덱스), `store-integrations.ts` (PK 복합 + bytea customType)
- 확장: `messages.ts` (3 컬럼 + 2 인덱스), `customers.ts` (UNIQUE 부분 인덱스)
- `index.ts` re-export
- `@hesya/database` + `@hesya/web` type-check 통과
- commit: `a944d3d feat(db): Drizzle 스키마`

### 3. T06 Vault 기반 토큰 암호화 헬퍼 (plan 결함 2개 수정)

dev branch 검증 중 plan 코드 결함 2개 발견:

- 결함 1: `pgsodium.crypto_aead_det_encrypt`는 deterministic이라 "동일 평문 ≠ 다른 암호문" 테스트와 모순.
- 결함 2: Supabase에서 `pgsodium.crypto_*`는 `supabase_admin`/`pgsodium_keyiduser` 전용 → postgres role 차단. SECURITY DEFINER 래퍼도 owner 제약으로 막힘.

해결: Supabase 공식 추상화 `vault.create_secret` + `vault.decrypted_secrets` view 사용.

- `store_integrations.access_token_encrypted BYTEA`에 vault.secrets row의 UUID(16바이트)를 저장
- 같은 평문 호출 → 새 vault row → 다른 BYTEA로 random 효과 자동 확보
- 헬퍼는 db를 인자로 받아 env 결합 제거 (테스트 시 stub db 주입 가능)
- 통합 테스트는 `HESYA_TEST_DATABASE_URL` env 게이트 (CI 안전)

검증: vitest 17 files / 101 pass / 2 skip ✓ + type-check 6 패키지 모두 ✓ + dev branch SQL 라운드트립 ✓

commit: `57e88fb feat(dal): vault 토큰 암호화 헬퍼`

### 4. CI fix — Buffer → Uint8Array

CI validate Type Check 실패: packages/shared-types tsconfig에 node types 미포함 → Buffer 미인식 (TS2591). bytea customType을 Uint8Array로 변경 (Buffer는 부모 Uint8Array 서브타입이라 consumer 호환).

commit: `e411d2d fix(db): bytea customType을 Uint8Array로 변경`

### 5. dev branch 삭제 (비용 정지)

- `mcp__supabase-local__delete_branch(branch_id="8aeb72db-43ef-49fc-9a05-8443437e7d2d")` ✓
- list_branches 후속 호출에서 main만 남음 확인
- 총 청구 시간 약 1.5h × $0.01344 ≈ ₩28

### 6. PR #20 생성 + Jayden squash 머지

- 4 commits (`5e15477` 이전 세션 save + `61120cd` T04 + `a944d3d` T05 + `57e88fb` T06 + `e411d2d` CI fix)
- CI 모두 pass (validate, Vercel, Vercel Preview Comments)
- Jayden 직접 squash 머지 → main `8cbb7ba`
- L-045 패턴 재발 (이전 세션 잔재 spec/plan commit이 로컬 main에 다시 남음) → `git reset --hard origin/main` (Jayden 직접, hook 차단)

### 7. learnings.md 신규 1건 (L-048)

- L-048: AI plan 코드는 검증 안 거친 가정. dev branch 시험에서 결함 2개 동시 발견 (deterministic vs random nonce 모순 + Supabase pgsodium 권한 차단). 해결: Supabase 공식 추상화 (vault) 우선 시도 룰.

### 만들지 않은 것 (Not Doing)

- ❌ Prod migration v0011/v0012 적용 — 🔴 별 세션 (Jayden 옆에서)
- ❌ Phase C T07~T09 — plan 보강(test-helpers/db) 후 별 세션
- ❌ v0012 SECURITY DEFINER 래퍼 SQL — vault 전환으로 불필요해져 작성 파일 삭제
- ❌ 통합 테스트 실 실행 — `HESYA_TEST_DATABASE_URL` 셋업 후 별 task

### 자체 정정 (4원칙 1번 — Surface Assumptions)

- T06 plan 코드를 그대로 따랐다면 prod에서 권한 거부로 실패했을 것. dev branch 시험으로 사전 발견 → vault 전환.
- L-045가 또 재발 — 이전 세션의 main 직접 commit 잔재가 두 번 연속 시퀀스로 발현. 다음부터 새 작업 브랜치 분기 시 항상 `git checkout -b <name> origin/main`만 사용 (로컬 main 신뢰 X).

## 이전 세션 완료 (2026-05-04 — PR #19 머지 + Supabase MCP 전환 + Phase B 시작)

PR #19 squash merged → main `19d2f1a` (Phase A: runbook, 6 에러 클래스, Server Action Sentry).
Supabase MCP 원격 → 로컬 npx 전환 (L-046).
Phase B T04 SQL 작성 + dev branch 생성 (다음 세션에서 적용 예정 = 이번 세션에서 완주).

## (보류) E9-6 OCR smoke test

β-test 매장 모집 시 실제 영업신고증 사진 1~3장 자연 확보 → 그때 baseline 1회 측정 → `docs/kyc-ocr-baseline.md` 작성. 인터넷/합성 샘플은 baseline 의미 약함.
