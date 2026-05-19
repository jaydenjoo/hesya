# 이상행동 / 이상접근 방어 Audit — 2026-05-19

> **목적**: Hesya 베타 5곳 출시 (Phase 1-ζ.7) 직전 보안 검증. 외부 손님 / 비인증 외부인 / 위조 헤더 / mass scrape / prompt injection 시도에 대한 방어 layer 매핑 + E2E 검증 spec 작성.
> **보안 등급**: 🔴 RED (돈/신분/법). 본 audit의 fail 항목은 베타 출시 차단 요인.
> **실행 컨텍스트**: 본 audit은 코드 baseline + E2E spec 정의 단계. **실제 spec 실행은 `HESYA_TEST_DATABASE_URL` (Supabase local 또는 격리 DB) + Docker 가동된 환경에서 별 세션 (Jayden 로컬)**.

## 방어 Layer 매핑

### L1. 인증 가드 (Auth Guards)

| 가드                         | 위치                                    | 기반                                                      | Callsites                          |
| ---------------------------- | --------------------------------------- | --------------------------------------------------------- | ---------------------------------- |
| `requireAdminRole()`         | `shared/lib/admin-role-guard.ts`        | Better Auth + `users.role='admin'` (DB 컬럼, 마이그 0030) | 18 admin pages/actions             |
| `requireStoreOwnerAuth()`    | `shared/lib/store-owner-guard.ts`       | Better Auth + `store_owners` join                         | 매장 owner actions                 |
| `requireCustomerAuth()`      | `shared/lib/customer-guard.ts`          | Better Auth + `customers.email` upsert                    | customer-mypage / booking customer |
| `verifySignatureAppRouter()` | `@upstash/qstash` HOF                   | QStash HMAC                                               | `/api/queue/inbox-process-inbound` |
| Meta x-hub-signature-256     | `instagram-adapter.ts` → `parseInbound` | Meta App secret HMAC-SHA256                               | `/api/webhooks/instagram`          |
| `verifyN8nRssSignature`      | `/api/webhooks/n8n-rss`                 | n8n secret                                                | `/api/webhooks/n8n-rss`            |

E2E bypass envs (NODE_ENV !== "production"에서만):

- `E2E_AUTH_USER_ID` — owner-guard 우회
- `E2E_CUSTOMER_EMAIL` — customer-guard 우회

### L2. Rate-limit (Upstash Sliding Window, prefix `hesya:rl`)

| 사이트                                   | 키                              | 한도        |
| ---------------------------------------- | ------------------------------- | ----------- |
| `customer-mypage/actions::unsave`        | `mypage:unsave:${customerId}`   | 10 / 60s    |
| `customer-mypage/actions::submit-review` | `mypage:review:${customerId}`   | 10 / 60s    |
| `booking/customer-actions::create`       | `booking:${email}`              | (코드 확인) |
| `sign-in/actions` (owner + customer)     | `signin:${email}` 또는 IP-based | (코드 확인) |
| `disputes/actions`                       | dispute action별                | (코드 확인) |
| `kyc/actions`                            | KYC submit / approve / reject   | (코드 확인) |
| `learn-store-tone`                       | 매장당                          | (코드 확인) |

Upstash Redis: `hesya-rate-limit-prod`, Tokyo region, Free tier 500K/월.

### L3. 입력 검증 (Zod schemas)

- 모든 Server Action 진입점 `inputSchema.safeParse(input)` (Zod) — UUID / string max / email 등 boundary 검증.
- 검증 실패 시 `{ ok: false, error: "validation" }` envelope (사용자 노출 안전 메시지).

### L4. IDOR 가드 (Server-side ownership check)

| Action                          | 검증 패턴                                                                     |
| ------------------------------- | ----------------------------------------------------------------------------- |
| `submitReviewAction`            | `bookingRow.customerId !== session.customerId` → `booking_mismatch`           |
| `unsaveStoreAction`             | DAL이 `WHERE customerId = $1` 필터 → 본인 row만 영향. 영향 0건이 정상 silent. |
| `acceptAiDraft` / `editAndSend` | conversation.storeId === session.storeId 가드 (`accept-ai-draft.ts` § 86)     |
| Admin actions                   | `requireAdminRole` 통과 후 storeId 파라미터는 admin 권한 전제                 |

### L5. SQL injection 방어

- Drizzle ORM `eq()`, `sql<typed>\`\`` template — parameterized queries.
- raw SQL은 fixture (`vault.create_secret`)에서만, 사용자 입력 금지.
- UUID 컬럼은 Postgres가 invalid → throw → notFound (404) 응답으로 정상 안전.

### L6. XSS / Reflected injection

- Next.js 자동 escape (React JSX) — `<script>` 직접 렌더 차단.
- ALLOWED_OAUTH_ERRORS 화이트리스트 (`store/inbox/connect/page.tsx`).
- `dangerouslySetInnerHTML` 사용처 grep 의무 (현재 audit: 0 사용).

### L7. Webhook 서명 검증

- Instagram: `x-hub-signature-256` HMAC-SHA256 (App secret) — `WebhookSignatureError` → 401.
- QStash: `Upstash-Signature` HMAC — `verifySignatureAppRouter` HOF → 자동 401/403.
- n8n-rss: 별도 시그니처 검증 (코드 확인).

### L8. LLM01 Prompt injection 방어

- **현재 baseline**: `recentMessages.text` (외부 손님 inbound 원문)이 Anthropic API user content로 sanitize 없이 전달. `generate-and-store-reply.ts` 주석 명시.
- **방어 메커니즘**: `ai_draft` 상태로 사장 검수 강제 (`draftStatus = "pending_review"` if `botMode=false`). 자동 발송 차단 = injection이 LLM에 도달해도 사장이 마지막 게이트.
- **`botMode=true` 매장은 자동 발송 모드** — 사장이 매장 설정에서 ON 한 경우만. Phase 1-β baseline은 `botMode=false`. **베타 매장은 `botMode=false` 강제 권장**.
- **향후**: 자동 발송 도입 시 prompt injection guardrail 재검토 의무 (`generate-reply.ts` system prompt 강화 + 출력 filter).

### L9. File upload 검증

- KYC 이미지 업로드 — `business_license_image_url` 컬럼. 업로드 경로 + MIME 화이트리스트 검증 코드 확인 필요 (TODO: audit 후 별 PR).
- 후속 stress test ζ.4에서 oversized / non-image MIME / 악성 파일명 시나리오 추가 필요.

## E2E spec 인벤토리 (2026-05-19 본 PR 후)

| File                             | 시나리오 수          | 영역                                                            |
| -------------------------------- | -------------------- | --------------------------------------------------------------- |
| `customer-security.spec.ts`      | 14 (기존 7 + 신규 7) | URL 조작 / store visibility / XSS / cookie / 헤더 / mass enum   |
| `customer-abuse.spec.ts` (NEW)   | 9                    | IDOR / Rate-limit / robots indexing / CSRF / prompt injection   |
| `admin-security.spec.ts` (NEW)   | 22                   | admin/owner 미인증 / 위조 헤더 / webhook 서명 / admin mass enum |
| `customer-flow.spec.ts`          | (기존)               | golden-path                                                     |
| `customer-mypage-flow.spec.ts`   | (기존)               | mypage 통합                                                     |
| `epic-12-integration.spec.ts`    | (기존)               | admin 워크플로                                                  |
| `kyc-to-inbox-flow.spec.ts`      | (기존)               | KYC → inbox 통합                                                |
| `phase-1-beta.spec.ts`           | (기존)               | golden-path                                                     |
| `store-deletion.spec.ts`         | (기존)               | E12-9                                                           |
| `inbox.spec.ts`                  | (기존)               | Epic 1                                                          |
| `perf-auth-cookie-cache.spec.ts` | (기존)               | TTFB benchmark                                                  |
| `smoke.spec.ts`                  | (기존)               | infra smoke                                                     |

총 약 **70+ E2E 시나리오**. 본 PR 신규 추가 **22 시나리오**.

## 신규 spec에서 발견한 갭 (별 fix PR 예상)

본 audit + spec 작성 중 식별한 baseline 보완 항목. 별도 PR로 처리:

| 갭                                                      | 영향                          | 우선순위     | 후속 PR 가이드                                                                                   |
| ------------------------------------------------------- | ----------------------------- | ------------ | ------------------------------------------------------------------------------------------------ |
| `robots.txt` 부재                                       | 검색엔진이 admin/store 인덱싱 | P0           | `apps/web/src/app/robots.ts` 신규 — `/admin*`, `/*/admin*`, `/*/store*`, `/*/c/mypage*` Disallow |
| `/c/mypage` noindex 메타 부재                           | 손님 개인정보 인덱싱 위험     | P0           | `c/mypage/page.tsx::generateMetadata` → `robots: { index: false }`                               |
| 미인증 owner route noindex 부재                         | 매장 정보 인덱싱 위험         | P1           | `store/layout.tsx::generateMetadata` (인증 가드 별개)                                            |
| Rate-limit 모든 customer-facing action에 적용 확인 미완 | 일부 endpoint 폭주 취약       | P1           | `grep checkRateLimit` 결과 vs 모든 server action 매핑                                            |
| KYC 이미지 업로드 MIME / 크기 검증                      | 악성 파일 업로드              | P1           | KYC submit 진입점 audit                                                                          |
| LLM01 — `botMode=true` 매장 prompt injection guardrail  | 자동 발송 매장 위험           | P2 (Phase 2) | 베타는 `botMode=false` 강제 → P2 자동발송 도입 시 필수                                           |

## 실행 prerequisite

### 로컬 (Jayden 환경)

```bash
# 1. Docker Desktop 가동 (현재 미가동 — Jayden 수동)
open -a Docker

# 2. Supabase local stack 기동 (Postgres + Auth + Storage)
supabase start

# 3. HESYA_TEST_DATABASE_URL 추출
# supabase status에서 "DB URL" 값 (보통 postgresql://postgres:postgres@127.0.0.1:54322/postgres)
export HESYA_TEST_DATABASE_URL="<위 URL>"

# 4. 마이그레이션 적용 (Drizzle 0010까지 + manual SQL 0011~)
# packages/database/CLAUDE.md 절차 따름
cd packages/database && pnpm db:migrate:test  # (실제 명령은 db CLAUDE.md 참조)
cd ../..

# 5. E2E 실행 (전체)
unset ANTHROPIC_API_KEY  # L-091 — 빈 값 inject 차단
pnpm --filter @hesya/web e2e

# 또는 본 PR 신규 spec만
pnpm --filter @hesya/web e2e -- customer-security customer-abuse admin-security
```

### Vercel preview (Jayden)

Preview deploy URL에 대해서는 본 spec 실행 안 됨 (격리 DB 의무 + `E2E_CUSTOMER_EMAIL` bypass가 prod NODE_ENV에서 차단). 로컬에서만 실행.

## 본 PR 산출

1. `apps/web/e2e/customer-security.spec.ts` 확장 (Section E-H 7 신규)
2. `apps/web/e2e/customer-abuse.spec.ts` 신규 (Section I-M 9 시나리오)
3. `apps/web/e2e/admin-security.spec.ts` 신규 (Section N-S 22 시나리오)
4. `docs/security/abnormal-access-audit-2026-05-19.md` (본 문서)

## 차기 액션

1. Jayden 로컬에서 본 spec 실행 (Docker + supabase start 후) → fail 항목 식별
2. fail 항목별 별 fix PR — 위 갭 표 우선순위 P0부터
3. Phase 1-ζ.4 stress test 시점에 본 spec 재실행 (regression 가드)
4. 정기 audit — Phase 2 자동발송 도입 시 LLM01 guardrail 추가 audit

## 관련

- `docs/PRD.md` v1.2 § 보안
- `docs/Plan-v2-scenario-B.md` Phase 1-ζ
- `apps/web/src/shared/lib/CLAUDE.md` — 가드 카탈로그
- `apps/web/sentry.server.config.ts` — 운영 가시성
- L-082 — e2e 시연 기준 자기평가
- L-104 — 검증 protocol 정직성
- 본 PR의 신규 ζ.5 analytics — abnormal access 패턴 PostHog 이벤트 모니터링 가능
