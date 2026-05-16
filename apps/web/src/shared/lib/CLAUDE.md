# apps/web/src/shared/lib — Guards & DAL

이 폴더는 모든 feature가 의존하는 공유 라이브러리입니다. **변경 전 영향 범위 확인 필수**.

## Auth Guards (2종)

⚠️ 신규 가드/인증 함수 만들기 전 이 표 + `grep -rn "require\|guard" .` 필수.

| 함수                         | 파일                   | 용도                                                          | 사용처       |
| ---------------------------- | ---------------------- | ------------------------------------------------------------- | ------------ |
| ✅ `requireAdminRole()`      | `admin-role-guard.ts`  | DB `users.role='admin'` 기반 (마이그 0030). admin 코드 기본값 | 18 callsites |
| ✅ `requireStoreOwnerAuth()` | `store-owner-guard.ts` | 매장 owner (`store_owners` 테이블 join)                       | 매장 actions |

> 과거 두 stub은 모두 삭제됨: `auth-guard.ts` (`requireAuth` / `requireAdmin`) 2026-05-08 Phase 1-γ.0 fix #2, `admin-guard.ts` (`requireAdminEmail` + `ADMIN_EMAILS` env) 세션 45 γ.2 마이그 완료 후 cleanup. 향후 정식 가드 도입 시 `admin-role-guard.ts` / `store-owner-guard.ts`처럼 명시적 명명으로 새 파일에 작성 (`auth-guard.ts` / `admin-guard.ts` 이름은 stub 트라우마로 재사용 금지).

### 마이그 히스토리 (γ.1 + γ.2, 세션 45 — 8 PR)

`requireAdminEmail` → `requireAdminRole` 점진 마이그 100% 완료:

- **γ.1 (PR #313)**: `requireAdminRole` 함수 + `users.role` 컬럼 + 마이그 0030. Jayden 수동 apply (column + role UPDATE).
- **γ.2 batch 1 (PR #316)**: `approveStoreKyc`, `rejectStoreKyc` (2 server actions)
- **γ.2 batch 2 (PR #317)**: `lib/kyc/actions.ts` (6 callsites) + `AdminRoleGuardResult.email` 필드 추가
- **γ.2 batch 3 (PR #318)**: disputes list/detail + store-deletion (3 admin pages)
- **γ.2 batch 4 (PR #319)**: dashboard + store-verifications list/detail + ai-accuracy + ai-cost + api-policy-alerts + payment-monitoring (7 admin pages)
- **γ.2 batch 5 (PR #320)**: `admin-shell-layout.tsx` + `lib/store-reports/actions.ts` (shell + 1 action)
- **γ.2 batch 6 (PR #321)**: cron `revalidate-stores` recipient → `findFirstAdminEmail` DAL
- **γ.2 batch 7 (PR #323)**: `lib/disputes/actions.ts` + `lib/store-deletion/actions.ts` (`adminGuardChain` 2개)
- **Cleanup**: `admin-guard.ts` + `admin-guard.test.ts` + `ADMIN_EMAILS` env (vitest.setup + env.ts) 삭제 — γ.2 callsite 0건 확인 후.

### 가드 return 패턴

- `requireStoreOwnerAuth` → Session 객체 직접 반환 (실패 시 throw/redirect)
- `requireAdminRole` → `{ ok: true; userId; email; role: "admin" } | { ok: false; error; message }` 객체 반환

→ 새 가드 만들 때 위 두 패턴 중 하나 선택. **혼합 금지**.

## DAL (Data Access Layer)

위치: `dal/`. 10+ 모듈 + `.test.ts` 동반.

| 모듈 (`dal/<name>.ts`)   | 담당 테이블                                 |
| ------------------------ | ------------------------------------------- |
| conversations / messages | 통합 인박스                                 |
| customers                | 외국인 고객                                 |
| stores / store-owners    | 매장 + owner 관계                           |
| store-integrations       | 채널 연동 (IG/WhatsApp/etc)                 |
| store-knowledge          | 매장 지식 (pgvector)                        |
| store-tone-examples      | tone learning                               |
| pgsodium-helpers         | 토큰 암호화 (`access_token_encrypted` 컬럼) |

### DAL 컨벤션

- 자세한 패턴: `dal/README.md`
- 새 DAL 추가: `dal/<name>.ts` + `dal/<name>.test.ts` 쌍 (vitest)
- service-role direct connection 사용 (RLS bypass) — 입력 검증은 application layer 책임

## 기타

| 파일                   | 용도                                                                 |
| ---------------------- | -------------------------------------------------------------------- |
| `errors.ts`            | 에러 응답 표준화                                                     |
| `errors.test.ts`       | 위 테스트                                                            |
| `rate-limit.ts`        | 레이트 리밋 (`@upstash/ratelimit` sliding window, prefix `hesya:rl`) |
| `rate-limit.test.ts`   | 위 테스트 (Upstash 라이브러리 mock)                                  |
| `sanitize-url.ts`      | URL 검증/정제                                                        |
| `sanitize-url.test.ts` | 위 테스트                                                            |

## 신규 추가 시 의무

1. **신규 가드 함수**: `grep -rn "require\|guard" .` 결과 plan에 첨부 → 중복 0건 검증
2. **신규 DAL 모듈**: `<name>.ts` + `<name>.test.ts` 쌍, 기존 패턴 일치
3. 보안 🔴 — 가드/RLS 변경은 Jayden 수동 검증

## 변경 영향 평가 (PR 시 체크)

이 폴더 파일을 수정하는 PR은:

- [ ] 가드 변경 → 모든 호출처 영향 (`requireAdminRole`은 18 callsites)
- [ ] DAL 변경 → 같은 모듈 import한 features 모두 영향
- [ ] Test 동반 (vitest 518+ 통과 의무)
- [ ] Jayden 보안 수동 검증 (해당 시)

## 관련

- 프로젝트 루트 `<repo>/CLAUDE.md` — 전체 토폴로지
- `apps/web/src/shared/lib/dal/README.md` — DAL 상세 컨벤션
