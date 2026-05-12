# Mock → Real 전환 절차 (Plan v3 M5.5)

> **사업자 등록 + 외부 베타 1~2곳 확보 후 진행**. Mock 모드에서 실 연동으로 toggle하는 단계별 절차.
> 본 문서는 베타 진입 critical path. 누락 시 Mock UI는 동작하나 외부 시스템(NTS, Meta, Stripe, Resend)과 단절.

## 5개 MOCK env flag 개요

| Env 변수             | Mock 동작                                      | 실 연동 후 동작                                           |
| -------------------- | ---------------------------------------------- | --------------------------------------------------------- |
| `MOCK_KYC`           | NTS(국세청) + LocalData(지자체) Mock 응답      | 실 NTS 사업자등록 진위확인 + LocalData 미용업 인허가 매칭 |
| `MOCK_IG_OAUTH`      | Instagram 동의 화면 우회 + Mock 토큰 발급      | Meta Graph API OAuth + webhook subscribe                  |
| `MOCK_PAYMENT`       | 3-tab Mock 결제 UI (Stripe/Alipay/WeChat 시뮬) | Stripe Connect + Alipay/WeChat plus 실 정산               |
| `MOCK_NOTIFICATION`  | Resend 우회 + console.info만                   | KYC 결과 / 분쟁 / magic link 이메일 실제 발송             |
| `MOCK_MULTI_CHANNEL` | WhatsApp/카카오/LINE Mock webhook 시드         | 실 WhatsApp Business / 카카오비즈 / LINE Notify webhook   |

## 전환 순서 (의존성 따라)

```
Phase A: 사업자 등록 + Resend 도메인 + Stripe Connect 가입
   ↓
Phase B: MOCK_NOTIFICATION=false (Resend 검증 후 즉시 toggle)
   ↓
Phase C: MOCK_KYC=false (사업자등록증 발급 직후, 운영자 1매장으로 검증)
   ↓
Phase D: MOCK_IG_OAUTH=false (Meta 비즈니스 매니저 등록 + 앱 검수 통과 후)
   ↓
Phase E: MOCK_PAYMENT=false (Stripe Connect 첫 가맹점 가입 + 정산 흐름 검증 후)
   ↓
Phase F (선택): MOCK_MULTI_CHANNEL=false (WhatsApp/카카오/LINE 비즈니스 계정 발급 후)
```

## Phase A — 사전 외부 등록 (Jayden 작업)

### A.1 사업자 등록

- 한국 국세청 사업자등록 (개인사업자 또는 법인). 미용업 4종 + 알선업 1종 권장.
- 결과: 사업자등록증 PDF + 사업자등록번호 10자리.

### A.2 Resend 도메인 검증

- [resend.com](https://resend.com/domains)에서 `@hesya.app` 또는 `@hesya.kr` 도메인 추가.
- DNS TXT/MX 레코드 등록 → Resend 검증 통과.
- `RESEND_FROM_EMAIL` env에 `noreply@hesya.app` 등 설정.

### A.3 Stripe Connect 계정

- [stripe.com/connect](https://stripe.com/connect) Express 계정 신청.
- 사업자 정보 + 정산 계좌 등록.
- API key (`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`) 발급.

### A.4 Meta 비즈니스 매니저 + 앱

- [business.facebook.com](https://business.facebook.com) 계정 + 비즈니스 등록.
- Meta for Developers → Instagram Graph API 앱 생성.
- 앱 검수 (review) — Instagram messaging permission 신청. **2~4주 소요**.

## Phase B — `MOCK_NOTIFICATION=false`

가장 먼저 전환 (외부 의존성 최소).

### B.1 사전 체크

- [ ] Resend 도메인 검증 완료 (A.2)
- [ ] `RESEND_API_KEY` valid (test 발송 1건 성공)
- [ ] `RESEND_FROM_EMAIL`이 검증된 도메인의 주소

### B.2 토글 절차

```bash
# Vercel env (prod)
vercel env rm MOCK_NOTIFICATION production
vercel env add MOCK_NOTIFICATION production
# 값 입력: false (또는 미설정 — default false)

# 로컬 .env.local
MOCK_NOTIFICATION=false
```

### B.3 검증

- `/admin/disputes` → 분쟁 status='resolved' 변경 → 사장 이메일 수신 확인
- `/store/onboarding/kyc` → 사장 KYC 결과 알림 수신 확인
- `/c/sign-in` → magic link 수신 확인 (6 locale 별 별도 테스트)

## Phase C — `MOCK_KYC=false`

NTS + LocalData 실 API 통합.

### C.1 사전 체크

- [ ] 운영자 1매장 사업자등록번호 확보 (실 등록증)
- [ ] NTS API key (없으면 [hometax.go.kr](https://www.hometax.go.kr) 사업자 진위확인 무료 사용)
- [ ] LocalData (지자체 미용업 인허가) API 접근 — [data.go.kr](https://www.data.go.kr) 공공데이터 활용센터 신청

### C.2 절차

```bash
MOCK_KYC=false
NTS_API_KEY=...
LOCALDATA_API_KEY=...
```

- `lib/kyc/nts-client.ts` / `lib/kyc/localdata-client.ts`가 실 API 호출 (이미 구현)

### C.3 검증

- `/store/onboarding/kyc`에 운영자 실 사업자등록증 입력
- 자동 매칭 → auto_approved 또는 manual_review 분기
- 실패 시 LocalData hit-rate가 낮을 가능성 (작은 동네 미용실은 인허가 등록 안 된 경우 있음) — manual_review fallback OK

## Phase D — `MOCK_IG_OAUTH=false`

Meta 앱 검수 통과 후.

### D.1 사전 체크

- [ ] Meta 앱 검수 통과 — Instagram messaging permission 활성
- [ ] `META_APP_ID` + `META_APP_SECRET` env 설정
- [ ] webhook callback URL = `https://hesya.app/api/webhooks/instagram` 등록 (Meta 앱 설정)
- [ ] webhook verify token 동기화 (`META_WEBHOOK_VERIFY_TOKEN`)

### D.2 절차

```bash
MOCK_IG_OAUTH=false
META_APP_ID=...
META_APP_SECRET=...
META_WEBHOOK_VERIFY_TOKEN=...
```

### D.3 검증

- `/store/inbox/connect` → "Instagram 연결" → Meta 동의 화면 → 토큰 발급 + webhook subscribe
- 실 IG 계정에서 DM 1건 전송 → inbox에 5초 이내 표시
- AI 응답 generate → 검수 후 발송 → IG에 메시지 도착

## Phase E — `MOCK_PAYMENT=false`

Stripe Connect 가맹점 가입 후.

### E.1 사전 체크

- [ ] 첫 가맹점 Stripe Connect Express 계정 가입 (사장 본인 신원/계좌 등록)
- [ ] `STRIPE_SECRET_KEY` (live mode) 설정
- [ ] webhook endpoint = `https://hesya.app/api/webhooks/stripe` 등록 (Stripe Dashboard)
- [ ] Stripe webhook signing secret (`STRIPE_WEBHOOK_SECRET`)

### E.2 절차

```bash
MOCK_PAYMENT=false
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

- 결제 페이지 (`/c/store/[id]/pay`)가 mock 3-tab 대신 실 Stripe 결제 UI로 전환 (별 phase 구현 필요 — 현재는 Mock UI만 존재).

### E.3 검증

- 손님이 실 카드로 ₩1,000 테스트 결제 → Stripe Dashboard에서 charge 확인 → booking row 생성
- 매장 정산 흐름 (월 1회 / 즉시) Stripe Connect 정책 확인
- 환불 / 분쟁 흐름 → admin disputes 페이지 연동

## Phase F (선택) — `MOCK_MULTI_CHANNEL=false`

WhatsApp Business / 카카오비즈 / LINE Notify 비즈니스 계정 발급 후.

- 가장 시간 오래 걸림 (각 채널 별 비즈니스 인증 1~3개월).
- 베타 5곳 출시에 필수 X — Instagram + Mock 3채널로 시연 가능.
- Phase 2에서 진행.

## 베타 출시 전 최종 체크리스트

베타 5곳 출시 직전에 다음 확인:

- [ ] Phase B 완료 (이메일 발송 OK)
- [ ] Phase C 완료 (KYC 실 매칭 OK)
- [ ] Phase D 완료 또는 보류 (Meta 검수 못 받으면 Mock 유지 + 시연 시 양해)
- [ ] Phase E 완료 또는 보류 (Stripe 미가입 시 Mock 결제 + 사용자 동의 필요)

> Phase D/E가 보류된 베타는 **"기능 시연 베타"**로 분류. 실 결제·실 IG 메시지 없이 UI/UX 검증만.

## 보안 (🔴 RED)

- Mock 시 외부 시스템에 데이터 안 보냄 — 안전.
- Real 전환 시 모든 토큰 vault 저장 + .env.local에 평문 보관 금지.
- 첫 toggle은 prod이 아닌 **staging branch** preview에서 검증 후 prod로.

## 롤백 절차

각 phase 토글 후 문제 발생 시:

```bash
# 즉시 mock으로 복귀
vercel env rm MOCK_<NAME> production
vercel env add MOCK_<NAME> production
# 값: true
vercel deploy --prod
```

배포 직후 1~2분 내 trafic 정상화 확인. Sentry / PostHog 대시보드로 에러율 모니터.

## Vercel preview 데모 환경 (Plan v3 M5.1)

prod 토글 전 외부인이 PR/branch URL로 전 흐름 시연하는 환경.

### 설정 (Vercel project settings)

1. **MOCK\_\* 5개 모두 `true`** (Preview Environment only):
   - `MOCK_KYC=true` / `MOCK_IG_OAUTH=true` / `MOCK_PAYMENT=true`
   - `MOCK_NOTIFICATION=true` / `MOCK_MULTI_CHANNEL=true`

2. **인증 우회 env** (Preview only):
   - `DEMO_USER_ID=<seed:demo가 시드한 매장 사장 user UUID>` → owner-side 자동 로그인
   - `DEMO_CUSTOMER_EMAIL=demo@hesya.app` → customer-side mypage 자동 로그인

3. **격리 DB**:
   - `DATABASE_URL=<demo 전용 Supabase 프로젝트>` (prod와 분리)
   - 또는 `hesya-prod` 프로젝트의 별도 schema 사용 (`demo_*` prefix)

### 동작

- preview deployment URL에 접속 → owner sign-in 우회 → `/store/dashboard` 자동 진입.
- `/c/mypage` 접속 → customer sign-in 우회 → demo 손님 마이페이지 자동 진입.

### 보안 (🔴 RED)

- **prod에서 절대 작동 안 함** — guard 코드가 `env.VERCEL_ENV === "preview"` 확인.
- DEMO env가 prod에 설정되어도 VERCEL_ENV='production'이라 분기 차단.
- 그래도 prod env에 DEMO\_\* 변수 설정 금지 (이중 차단).

### 코드 위치

- `apps/web/src/shared/lib/store-owner-guard.ts` (L57~) — VERCEL_ENV='preview' + DEMO_USER_ID 분기
- `apps/web/src/shared/lib/customer-guard.ts` (L45~) — VERCEL_ENV='preview' + DEMO_CUSTOMER_EMAIL 분기

## 관련

- env 정의: `apps/web/src/shared/config/env.ts` L138~155
- Plan v3 M1 phase: `docs/Plan-v3-mock-first.md` §1.M1
- 베타 onboarding: `docs/beta-onboarding-checklist.md`
