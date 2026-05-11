# PROGRESS.md

> **세션 시작 시 첫 번째로 읽는 파일** (settings.json SessionStart hook).
> ⚠️ **자기평가 갱신 규칙 (L-082)**: % 표시는 "코드 머지 완료"가 아닌 **"사용자 입장 e2e 시연 가능 여부"**로만 정의. AI 자체 평가 → 객관적 측정(grep / test count / subagent 진단 / 실제 시연)으로 교차 검증 의무.

## 현재 위치 (2026-05-11 세션 9 종료 시점)

- **Phase**: **Plan v3 Mock-first M1 5/5 완료** (M1.1~M1.5) + ζ.4 stress test 시드 완료 + CI 비활성화 (γ.1 100% + γ.2 완료 + ε Epic 4 35% + δ Epic 3 50%)
- **시나리오**: B (풀 P0 베타 — PRD 원안) 위에 **v3 Mock-first 5 phase 추가** (`docs/Plan-v3-mock-first.md`)
- **베타 5곳 출시 가능 시점**: Plan v3 M2~M5 완료(4~6주) + Jayden 사업자 등록 + ζ.7~ζ.8 (2주) = **약 6~8주**
- **세션 9 머지** (10건):
  - [#112](https://github.com/jaydenjoo/hesya/pull/112) ζ.4 통합 부하 시드 + booking Sentry tag (`72acef4`)
  - [#113](https://github.com/jaydenjoo/hesya/pull/113) Plan v3 + Mock env flag 5개 도입 **M1.1** (`e94ff84`)
  - CI workflow 비활성화 (Free 한도 소진 대응, `3ef39cd`)
  - [#114](https://github.com/jaydenjoo/hesya/pull/114) **M1.2** `MOCK_KYC=true` 분기 (`ca168a3`)
  - **M1.3** `MOCK_IG_OAUTH=true` 분기 (main 직접 `f031878`)
  - **M1.4** Sign-in 정식화 + locale selector 활성화 (main 직접 `842e0be`)
  - **M1.5** `docs/external-demo-guide.md` 신규 (main 직접 `5073713`)
- **세션 9 시드 검증** (실 실행 통과):
  - `unset ANTHROPIC_API_KEY && pnpm seed:stress-test` 성공 (매장 5곳 / 메시지 250건 / 예약 50건 / 분쟁 5건 / API 정책 알림 3건 / admin KYC 큐 4건)
- **세션 9 인프라 변경**:
  - **GitHub Actions CI 자동 trigger 비활성화** (`workflow_dispatch`만 유지) — Free 한도 2000분/월 소진 + 결제 잔액 없음. Vercel preview build + 로컬 `pnpm test` 검증으로 갈음.
- **세션 9 Mock 인프라 (M1 전체 결과)**:
  - `MOCK_KYC=true` → data.go.kr 호출 skip + 자동 통과 (외부인 회원가입 자동 진입)
  - `MOCK_IG_OAUTH=true` → Meta 동의 화면 skip + 가짜 access_token + DB upsert (외부인 IG 연결 시뮬)
  - Sign-in locale selector → 6 locale 즉시 전환 (next-intl router.replace)
  - **외부 데모 가능 시점**: Vercel Preview env에 5 MOCK\_\* 등록 + redeploy → 외부인 시뮬 enable (단, M2 customer-side는 아직 비활성)
- **누적 교훈**: L-001 ~ **L-093** (세션 9 신규 1건 — GitHub Actions Free 한도 + Spending Budget $0 조합 차단)

## P0 Epic 객관 완성도 (세션 9 M1 완료 후 — Mock 분기 도입으로 외부 시뮬 enable)

| Epic                | 세션 8 % | 본 세션 9 %                 | 갭                                                                                                   |
| ------------------- | -------- | --------------------------- | ---------------------------------------------------------------------------------------------------- |
| E1 인박스           | 71%      | **75%** (+4, M1.3 Mock IG)  | 디자인 정합성 2/5. WhatsApp/카카오/LINE 0%. **M1.3 IG OAuth Mock 도입 완료** → 외부인 연결 시뮬 가능 |
| **E2 결제 위젯** 🔴 | 17%      | **17%** (변동 X)            | DB 스키마만. **M2.5 Mock 결제 UI** 도입 후 자연 활성화 (외부인 시뮬 가능)                            |
| **E3 예약 시스템**  | 50%      | **50%** (변동 X)            | owner-side CRUD 완료. **M2.3/2.4/2.6 customer-side + Mock 결제** 도입 후 100% 도달 가능              |
| **E4 대시보드**     | 35%      | **35%** (변동 X)            | ε shell + 실측 5 KPI. M3.1 services / M3.2 customers 도입 후 추가 KPI active                         |
| E9 KYC 🔴           | 93%      | **96%** (+3, M1.2 Mock KYC) | **M1.2 `MOCK_KYC=true` 분기 도입 완료** → 외부인 회원가입 자동 통과. γ.2.3.3 디자인 정합 잔여        |
| **E12 관리자** 🔴   | 100%     | **100%** (변동 X)           | E12-1~10 완료 + ζ.4 stress test 큐 시연 통과                                                         |

**P0 평균: 62%** (+1, E1·E9 Mock 분기 외부 시뮬 enable). Plan v3 M1 phase 완료 → M2~M5 (4~5주) 남음.

### Public surfaces (P0 Epic 외 신규 카테고리, γ.2.3.5)

| 영역             | 상태 | 비고                                                                             |
| ---------------- | ---- | -------------------------------------------------------------------------------- |
| Landing (`/`)    | ✅   | create-next-app 보일러플레이트 폐기 + Hesya brand hero (5-lang ticker, 6 locale) |
| Design system    | ✅   | 1273줄, Hesya 토큰 다수 사용 (grep 미정합 0건, 검수만)                           |
| 마케팅 sub-pages | 0%   | 가격/About/Blog/FAQ — 베타 출시 후 phase                                         |

> ⚠️ E12-9 매장 해지는 e2e 통과 (owner 요청 → 취소 + admin 큐 cancelled). γ.2.1 KYC→inbox은 admin 클릭 + DB 검증 통과. **prod 시나리오 (실 OAuth 로그인 + 실 IG webhook 수신)**은 다음 phase에서 검증.
> ⚠️ E9 +1은 시각 정합성만 (단위 테스트 className 기반). KYC submit/pending demo 시연은 미인증 user seed 보강 후 가능 — 별 PR 후보.
> ✅ γ.2.3.4/5 시연 prerequisite는 dev-demo.sh가 E2E_ADMIN_EMAIL inject로 자동 충족 (admin) / public route로 자동 충족 (landing) — 별 PR 불요.

## 본 세션 9 (2026-05-11) — ζ.4 stress test + Plan v3 M1 phase 완전 진행 (5/5)

### Scope (8개 큰 작업)

1. **ζ.4 stress test 시드** ([#112](https://github.com/jaydenjoo/hesya/pull/112)) — 통합 부하 250 메시지 + Sentry tag 보강
2. **Plan v3 + M1.1 Mock env flag** ([#113](https://github.com/jaydenjoo/hesya/pull/113)) — Mock-first 5 phase 분해 + env 5개 도입
3. **GitHub Actions CI 자동 trigger 비활성화** (`3ef39cd`) — Free 한도 소진 대응
4. **M1.2 `MOCK_KYC=true` 분기** ([#114](https://github.com/jaydenjoo/hesya/pull/114), `ca168a3`) — data.go.kr 호출 skip
5. **M1.3 `MOCK_IG_OAUTH=true` 분기** (`f031878`) — Meta 동의 화면 skip + 가짜 token 발급
6. **M1.4 Sign-in 정식화** (`842e0be`) — locale selector 활성화 + 임시 페이지 마커 제거
7. **M1.5 외부 데모 가이드** (`5073713`) — `docs/external-demo-guide.md` 신규
8. (M1 phase 5/5 완료 — Plan v3 5 phase 중 첫 milestone 종료)

PostHog 이벤트 / Mock 분기 stub은 다음 phase scope.

### 산출물

#### 1. `apps/web/scripts/seed-stress-test.ts` 신규

LLM 호출 0건 (직접 insert), HESYA_TEST_DATABASE_URL prod URL 가드 (fixture 재사용):

- 매장 5곳: #1 `auto_approved` + IG + 사장 owner (inbox/dashboard stress) / #2~5 `manual_review` + storeVerifications (admin 큐 stress)
- 사장 1명 (DEMO_USER_ID), 고객 25명 (en/ja/zh/vi/th 5종 × 5)
- conversation 25개, **메시지 250건** (inbound 125 + outbound 125, status mix pending_review 75 / sent 25 / skipped 25)
- 시술 5종 + 디자이너 3명 (매장 #1)
- **예약 50건** (매장 #1, statusCycle 10-pattern)
- **분쟁 5건** (매장 #1, category mix complaint 3 / refund 1 / no_show 1)
- **API 정책 알림 3건**

`pnpm seed:stress-test` 실 실행 통과 확인 ✅.

#### 2. `apps/web/src/lib/booking/actions.ts` Sentry tag 보강

surgical change (4원칙 3번):

- import `* as Sentry from "@sentry/nextjs"` (1 line)
- 인증 try-catch unknown error 분기에 `Sentry.captureException(err, { tags: { route: "action:booking-update", phase: "auth" } })`
- rate-limit try-catch unknown error 분기에 동일 패턴 `phase: "rate-limit"`

기존 패턴 재사용 (`webhook:instagram`, `queue:inbox-process-inbound` 등과 일관). dispute / kyc / store-cancellation actions는 ζ.5 보강 후보.

#### 3. `docs/stress-test-guide.md` 신규

- 시드 실행 절차 (L-091 unset ANTHROPIC_API_KEY prefix 의무)
- 시드 데이터 표 + 검증 시나리오 4단계 (E1 inbox 250 / E9 KYC 4 / E12 분쟁 5 + 정책 3 / E4 대시보드 + 예약 50)
- Core Web Vitals 2026 측정 기준 (LCP < 2.5s / INP < 200ms / CLS < 0.1)
- Sentry tag 검증 절차 + 트러블슈팅 5건
- ζ.8 stability watch 재실행 절차

#### 4. package.json script 등록

- `apps/web/package.json` — `"seed:stress-test"` 추가
- root `package.json` — workspace forwarding script 추가

### 검증

- `pnpm --filter @hesya/web type-check` ✅ 0 errors
- `pnpm --filter @hesya/web lint` ✅
- `pnpm --filter @hesya/web test --run` ✅ 661 passed / 103 skipped (regression 0건)
- `pnpm seed:stress-test` 실 실행 ✅ (DB 시드 console 출력 매칭)

### Known Issue 발견 + 즉시 해결

**증상**: 초기 시드 실행 시 dispute `category=system` PostgreSQL check constraint 23514 위반.
**원인**: `disputes_category_check` enum은 `no_show / refund / complaint` 3종만 허용. `system` 카테고리 없음.
**해결**: `system` → `no_show`로 교체. 동시에 docs도 동기화.
**규칙**: 새 시드 작성 시 enum 값은 DB schema의 check constraint를 먼저 확인.

### 변경 파일

PR #112 (ζ.4):

- `apps/web/scripts/seed-stress-test.ts` 신규 (+~370)
- `apps/web/src/lib/booking/actions.ts` Sentry tag (+7)
- `apps/web/package.json` + root `package.json` script 등록
- `docs/stress-test-guide.md` 신규 (+~100)

PR #113 (M1.1):

- `apps/web/src/shared/config/env.ts` MOCK\_\* 5개 + mockFlag helper (+24)
- `.github/workflows/ci.yml` MOCK\_\* 3 job env block (+17)
- `docs/Plan-v3-mock-first.md` 신규 (+225)

CI 비활성화 (main 직접 push):

- `.github/workflows/ci.yml` — `pull_request` + `push` trigger 주석 처리, `workflow_dispatch`만 유지

### L-093 — GitHub Actions Free 한도 + Budget $0 조합 차단 (신규)

**상황**: PR #112/#113 모두 CI fail (3 job 모두 10초 안에 abort, step 0개). main push runs는 `conclusion=skipped`.

**원인**: 본 repo가 Private + Free plan → 2000분/월 무료 한도. 5월 누적 (hesya + 다른 private repo 합산) 도달. Spending Budget 5개 SKU 모두 `$0 / Stop usage=Yes`로 차단. 결제 잔액도 0.

**해결**: ci.yml의 자동 trigger 제거 → workflow_dispatch만 유지. CI 분 소비 0. Vercel preview build (type-check + build) + 로컬 `pnpm test` (661 단위) + lint-staged pre-commit (prettier + eslint + gitleaks)로 검증 갈음.

**규칙**:

1. **Private + Free repo는 CI 분 소비를 무시하면 안 됨** — 단일 repo에서도 PR 15분 × N PR + main push 15분 = 빠르게 누적
2. **여러 private repo 합산** — 본 hesya만이 아니라 모든 Jayden private repo의 합산이 한도에 영향
3. **Spending Budget UI에서 모든 SKU `$0/Stop usage=Yes` 패턴 = 한도 초과 시 즉시 차단**. 잔액과 별개로 운영자 명시 설정 필요
4. **CI 차단 시 대안**: (a) Public 전환 / (b) Self-hosted runner / (c) **Vercel + 로컬 검증** (본 case 선택) / (d) 한도 리셋 대기
5. **6월 1일(UTC) 한도 리셋 후 결정**: ci.yml 재활성화 시 `paths-ignore: ['docs/**']` + e2e-integration nightly + concurrency cancel 적극 활용

**비유**: "검사관 채용한 회사가 월 무료 노동 시간 한도 초과 + 추가 결제 미설정 → 검사관 출근 거부. 회사는 자체 직원(Vercel)이랑 사내 자동 검사(lint-staged)로 임시 대체."

### M1.2~M1.5 산출물 요약

#### M1.2 `MOCK_KYC=true` 분기 (PR #114, `ca168a3`)

- `apps/web/src/lib/kyc/mock-nts-client.ts` 신규 — `valid="01"` + `b_stt="계속사업자"` 자동 응답
- `apps/web/src/lib/kyc/mock-localdata-client.ts` 신규 — 입력 echo + `SALS_STTS_CD="01"` (영업중) + `OPN_ATMY_GRP_CD="200"` (자유업 그룹)
- `apps/web/src/lib/kyc/actions.ts` — 2 곳에 env-flag 분기 (`ntsData`, `searchResult`)
- 단위 테스트 11건 (mock-nts 5 + mock-localdata 6) ✅
- **외부인 시뮬 효과**: 사업자등록번호 아무 10자리 + 개업일자 8자리 → 자동 `auto_approved` 진입 (LocalData 매칭 100%)

#### M1.3 `MOCK_IG_OAUTH=true` 분기 (`f031878`)

- `apps/web/src/features/inbox/actions/connect-instagram.ts` — env-flag 분기로 mock callback URL 직접 redirect (Meta 동의 화면 skip)
- `apps/web/src/app/api/oauth/instagram/callback/route.ts` — `buildMockExchangeResult` helper + try 블록 분기 (exchangeCode skip + subscribeWebhook skip + 가짜 token/expiresAt/scopes)
- 가짜 token: `mock_token_<32hex>`, externalAccountId: `mock_ig_<storeId-8자>`, scopes: `instagram_business_basic` + `instagram_business_manage_messages`
- 단위 테스트 4건 (env-mocked) ✅
- **외부인 시뮬 효과**: `/store/inbox/connect` "Instagram 연결" 클릭 → 즉시 연결 완료 + DB upsert (UI 일관성: `webhookSubscribed=true` flag)

#### M1.4 Sign-in 정식화 (`842e0be`)

- `apps/web/src/app/[locale]/sign-in/page.tsx` — `LOCALE_LABEL` 객체 → `LOCALES` array 변환, FormPanel에 `locales` + `currentLocale` props 전달
- `apps/web/src/app/[locale]/sign-in/form-panel.tsx` — disabled chip → 작동하는 `<select>` (next-intl `useRouter` + `usePathname`)
- `apps/web/src/app/[locale]/sign-in/sign-in.css` — `.sl-lang-chip:focus-within` + `.sl-lang-select` 스타일 추가
- `CLAUDE.md` — Known Gotchas의 "임시 검증 페이지" 마커 제거
- **외부인 시뮬 효과**: 좌상단 🌐 selector로 6 locale 즉시 전환 (ko/en/ja/vi/zh-CN/zh-TW)

#### M1.5 외부 데모 가이드 (`5073713`)

- `docs/external-demo-guide.md` 신규 — 5단계 흐름 (회원가입 → KYC 자동 통과 → IG 연동 시뮬 → 메시지 시뮬 → 예약/결제) + Vercel Preview env 설정 + 사업자 등록 후 swap 절차 + 트러블슈팅 표 6건
- **타겟**: 외부 베타 후보 / 디자인 검토자 / Jayden 친구 (Mock 모드 사전 안내 + 격리 DB 명시)

### 검증

- `pnpm --filter @hesya/web type-check` ✅ 0 errors
- `pnpm --filter @hesya/web lint` ✅
- `pnpm --filter @hesya/web test --run` ✅ 676 passed / 103 skipped (M1.2 +5 mock-nts + M1.2 +6 mock-localdata + M1.3 +4 connect-instagram-mock)
- `pnpm --filter @hesya/web build` ✅ Compiled successfully

### 다음 세션 가이드 — Plan v3 M2 진입 (customer-side + Mock 결제)

| Milestone                            | 우선순위 | 예상 | 비고                                                                                    |
| ------------------------------------ | -------- | ---- | --------------------------------------------------------------------------------------- |
| **M2.1 `/c/store/[slug]/page`**      | 🥇 1순위 | 2일  | 매장 detail public 페이지 (시술 5종 + 디자이너 3명 표시, 외부인 view-only)              |
| **M2.2 `/c/store/[slug]/photos`**    | 2순위    | 1일  | 매장 사진 gallery (시드된 placeholder 5장)                                              |
| **M2.3 `/book/schedule` 페이지**     | 3순위    | 2일  | 디자이너 선택 + 시술 선택 + 시간 슬롯 선택 (Asia/Seoul, 30분 grid)                      |
| **M2.4 `/book/confirm` 페이지**      | 4순위    | 1일  | 예약 요약 + 손님 정보 폼 + "결제 진행" 버튼                                             |
| **M2.5 `MOCK_PAYMENT=true` Mock UI** | 5순위    | 2일  | 가짜 Stripe/Alipay/WeChat 결제 페이지 (즉시 succeeded 응답)                             |
| **M2.6 createBookingAction**         | 6순위    | 1일  | customer-side 예약 생성 + 결제 record + 가짜 IG 메시지 발송 (alpha: 매장 #1 IG channel) |
| **M2.7 6 locale i18n**               | 7순위    | 1일  | namespace `bookingCustomer` (시술 라벨 / 디자이너 라벨 / 시간 / 결제 안내 / 트러블슈팅) |

총 M2 phase 예상 ~10일 (2주). 머지 방식: branch + PR + 로컬 `pnpm test` 통과 후 main 직접 squash (CI 비활성화 상태). Mock 분기 패턴은 M1.2~M1.3 코드 (`env.MOCK_*` flag) 참고.

## 직전 세션 8 (2026-05-11) — Phase 1-ζ Prep (베타 매칭 docs 준비)

### Scope (docs only — 코드 변경 없음)

세션 7 (Epic 3 owner-side + Dashboard KPI wire) 직후, 베타 출시 critical path 진입을 위한 docs 준비. **외부 리소스 생성 (ζ.1/ζ.2 Supabase·Vercel) + 베타 매장 onboarding 실행 (ζ.7)** 은 Jayden 사업자 등록 완료 후 → 본 세션 scope 밖. 사업자 등록과 무관한 사전 작성 가능 docs에 집중.

### L-089 prod 배포 검증

세션 7 머지 (`9d66efd` docs / `c9704bf` PR #111) Vercel Production:

- `9d66efd` Production **success** (2026-05-11 07:45)
- `c9704bf` Production **success** (2026-05-11 07:42)
- → 수동 redeploy 불필요. L-089 자동 통과.

### 산출물

#### 1. `docs/demo-guide.md` 갱신

- **시드 데이터 명세 표** — 세션 7에서 추가된 시드 5종 행 신규:
  - 시술 5종 (커트 35,000 / 펌 120,000 / 염색 95,000 / 트리트먼트 55,000 / 두피 케어 70,000)
  - 디자이너 3명 (A ko·en / B ko·ja / C ko)
  - 예약 10건 (상태 mix: scheduled 3 / completed 5 / no_show 1 / cancelled 1)
  - 분쟁 1건 (Epic 12.4 시연용)
  - API 정책 알림 1건 (Epic 12.8 admin 큐 시연용)
- **시연 시나리오 신규 2개**:
  - **C. 사장 — 예약 관리** (`/ko/store/bookings` + `/[id]`): 5-status filter pill + detail 7행 + 3 terminal action
  - **D. 사장 — 대시보드 KPI** (`/ko/store/dashboard`): 12 KPI 중 5 active (미응답 / 분쟁 / KYC / 시술 분포 donut / 디자이너 분포 donut) + 7 coming-soon
  - 두 시나리오 연계 시연 팁: C에서 예약 `completed` 변경 → D 새로고침 시 donut 즉시 반영
- **Phase 2 예고 섹션** — ζ.1 trigger 3-조건 명시 (사업자 등록 / 베타 후보 1~2곳 확보 / Stripe Connect 1매장 진입). 외부 리소스 = Jayden 명시 승인 필수 재차 명기.

#### 2. `docs/beta-onboarding-checklist.md` 신규

베타 매장 사장과 함께 점검하는 항목을 5 단계로 분해:

- **0. Jayden 측 사전 준비** — 사업자 등록 / demo.hesya.com 인프라 / 약정서 초안 / 데모 영상
- **1. 매장 측 사전 자료** — 사업자등록증 / IG 비즈니스 계정 전환 / 시술 정보 (선택)
- **2. Hesya onboarding 시퀀스** — 계정 생성 → KYC 심사 → IG 연동 → 첫 워크스루 → 1주차 daily 점검
- **3. 베타 5곳 확대 트리거** (ζ.8 진입 조건)
- **4. 베타 종료 시** (정식 출시 진입 전 약정 v2 갱신)
- **5. 비상 절차 5 상황** — Sentry critical / IG webhook 끊김 / 응답 시간 > 3분 / 사장 중단 요청 / KYC 자동 승인률 < 60%

베타 SLA 명시: 메시지 응답 < 3분 (자동), 다운 시 6시간 내 복구, 결제 위젯 미포함 (베타 중반 도입).

### 다음 세션 분기 (사업자 등록 시점 의존)

| 분기                       | 조건                          | 예상  | 비고                                                |
| -------------------------- | ----------------------------- | ----- | --------------------------------------------------- |
| **(B) δ Epic 2 결제**      | 사업자 등록 미완 OK           | 2~3주 | 🔴 RED. Stripe 인프라 (DB·테스트 키)부터 진입 가능  |
| **(D) ζ.4 stress test**    | 사업자 등록 미완 OK           | 1일   | 50+ 메시지/매장 통합 부하 + Sentry tag 보강         |
| **(D) ζ.5 monitoring**     | 사업자 등록 미완 OK           | 1일   | PostHog 이벤트 인벤토리 + 누락 보강                 |
| **(D) ζ.1 demo.hesya.com** | **사업자 등록 후**            | 2일   | Supabase/Vercel 신규 — Jayden 명시 승인 + 예산 합의 |
| **(D) ζ.7 베타 onboard**   | **사업자 등록 후 + ζ.1 완료** | 1주   | 본 체크리스트 실행                                  |

### 변경 파일

- `docs/demo-guide.md` (+~50 / -~10)
- `docs/beta-onboarding-checklist.md` 신규 (+~110)
- `PROGRESS.md` (세션 8 섹션 추가 + 헤더 갱신)

### Vercel 배포

- docs only — Vercel 자동 배포 트리거 (production deployment 진행)

## 직전 세션 7 (2026-05-11) — Phase 1-δ (Epic 3 예약 owner-side + Dashboard KPI wire)

### 머지된 PR

| #                                                   | Task                                            | 상태                |
| --------------------------------------------------- | ----------------------------------------------- | ------------------- |
| [#111](https://github.com/jaydenjoo/hesya/pull/111) | Epic 3 owner-side bookings + Dashboard KPI wire | ✅ 머지 (`c9704bf`) |

### Phase 1-δ — Epic 3 예약 시스템 (Scope B': owner-side CRUD + 디자이너/시술 KPI wire)

**Scope 의사결정**: Plan v1에서 4개 옵션 비교 후 B' 채택.

- ❌ A. Full PRD per spec (customer-side + 결제 + 다국어 페이지) — Epic 2 결제 0건이라 불가
- ❌ B. owner-side만 (CRUD만, dashboard wire 없음) — 시연 가치 한계
- ✅ **B'. owner-side CRUD + dashboard 분포 KPI wire** — 같은 데이터셋 2번 활용, "베타 매장이 IG DM 받은 예약 추적" 시연 가능
- ❌ C. customer-side stub 우선 (결제 mock) — 결제 mock = 베타 출시 위험

### Owner-side 구현

**DAL** (`apps/web/src/shared/lib/dal/`):

- `bookings.ts` — `listBookingsByStore` (filter), `getBooking`, `updateBookingStatus` (storeId match 이중 검증), `countBookingsByService`, `countBookingsByStaff` (월 분포 KPI용)
- `services.ts` — `listServicesByStore` (nameKo asc), `listServicesByIds`
- `staff.ts` — `listStaffByStore` (name asc), `listStaffByIds`
- 단위 + integration tests (5 unit + 9 integration, HESYA_TEST_DATABASE_URL 게이트)

**Server Action** (`apps/web/src/lib/booking/actions.ts`):

- `updateBookingStatusAction` — zod 검증 + `requireStoreOwnerAuth` + `checkRateLimit` (30/60s, 분쟁 20/60s보다 완화) + storeId match (DAL + action 이중)

**Routes**:

- `/[locale]/store/bookings?status=…` — 5 status filter (all / scheduled / completed / no_show / cancelled)
- `/[locale]/store/bookings/[id]` — 정보 + 3 terminal action (다른 storeId는 notFound로 위장)

**Feature 컴포넌트** (`apps/web/src/features/booking/`):

- `bookings-list.tsx` (server) — γ.2.3.4 5-signal pattern 재사용:
  1. Filter pill 3-state (`border-gray-200` / hover `border-navy` / active `bg-hesya-navy-900 text-hesya-peach-50`)
  2. Table row `border-hesya-peach-100` + hover `bg-hesya-peach-50/40`
  3. Status badge tone 4종 (scheduled peach / completed emerald / no_show red / cancelled gray)
  4. Detail link `text-hesya-amber-500 hover:underline`
  5. `buildServiceLabels` locale-aware (ko/en/ja/zh-CN/zh-TW/vi)
- `booking-detail.tsx` (client) — `useTransition` + 3 terminal action. amber primary + peach borders. terminal 시 액션 hide.

### Dashboard KPI Wire

`/[locale]/store/dashboard`:

- coming-soon → active 2개 (시술 분포 / 디자이너 분포)
- 신규 컴포넌트 `distribution-pie.tsx` (Recharts donut, hesya 6색 팔레트, h-24, innerRadius 20 / outerRadius 40)
- `getCurrentMonthRange()` Asia/Seoul 월 범위
- 12 KPI 현황: **5 active** (미응답 / 분쟁 / KYC / 시술 분포 / 디자이너 분포) + 7 coming-soon (월 매출 / 객단가 / 재방문률 / 노쇼율 / 국적 분포 등)

### i18n Bookings namespace 6 locales

`ko / en / ja / vi / zh-CN / zh-TW`: title / subtitle / filterAll / 4 status filter / 5 columns / 4 status label / empty / detail / 7 fields / 5 actions.

### Demo seed 보강

`apps/web/scripts/seed-beta-demo.ts`:

- 시술 5종 (커트 / 펌 / 염색 / 트리트먼트 / 두피 케어, 다국어 라벨)
- 디자이너 3명 (A/B/C, 언어 mix)
- 예약 10건 status mix (scheduled 3 / completed 5 / no_show 1 / cancelled 1) — 분포 KPI 시연용

`apps/web/e2e/fixtures/db.ts` resetDb 확장: services + staff delete 추가 (FK chain `bookings → services → stores`).

### 검증

- `pnpm type-check` ✅ 0 errors
- `pnpm lint` ✅ 0 errors / 0 warnings
- `pnpm --filter @hesya/web test` ✅ 661 passed / 103 skipped (integration DB gate)
- `pnpm --filter @hesya/web build` ✅ Compiled successfully, 새 routes `/store/bookings`·`/store/bookings/[id]` 등록 확인
- Playwright 4 캡처 (데스크탑 list + detail + dashboard wired KPI / 모바일 list) ✅
- CI 4단 통과 (Vercel preview / e2e-smoke / e2e-integration / validate) → auto-merge

3 commit (`f2fb349` 본체 + `a6f16af` resetDb FK fix + `158adef` 단위 테스트 동기화).

총 30 files / +1718/-8 / 신규 unit/integration tests 18개.

### L-092 — resetDb 다중 위치 동기화 누락

**증상**: PR #111 CI e2e-integration + validate 둘 다 실패. FK violation `services_store_id_stores_id_fk on table services` + 단위 테스트 `resetDb deletes tables in FK-safe order` assertion mismatch.

**원인**: resetDb가 **3 군데**에 있는데 1개만 갱신:

1. ✅ `apps/web/e2e/fixtures/db.ts` (Playwright E2E용) — 처음에 services + staff 추가함
2. ❌ `apps/web/src/test-helpers/db.ts` (vitest integration용) — 누락
3. ❌ `apps/web/src/test-helpers/db.test.ts` (resetDb 호출 순서 단위 테스트) — assertion 누락

**해결**: a6f16af / 158adef 2 PR-내 추가 commit으로 동기화.

**규칙 (L-092)**: "production code의 resetDb 류 helper를 수정할 때, 같은 이름 함수가 **2곳 이상**에 있는지 grep 의무". `grep -rn "export async function resetDb" apps/web/` 결과 모든 위치 확인 → 동시 갱신 + 그 helper를 호출하는 단위 테스트 assertion도 함께 갱신.

**Pre-Plan Inventory에 추가할 절차**: 새 테이블 추가 시 `grep -rn "delete(.*tables)" apps/web/src/test-helpers apps/web/e2e/fixtures` 의무.

### Vercel 배포

- PR #111 `c9704bf` → main 자동 배포 (Vercel deployment 진행)

## 직전 세션 6 (2026-05-11) — Phase 1-ε (Epic 4 대시보드 인프라)

### 머지된 PR

| #                                                   | Task                                         | 상태                |
| --------------------------------------------------- | -------------------------------------------- | ------------------- |
| [#110](https://github.com/jaydenjoo/hesya/pull/110) | Epic 4 매장 운영 대시보드 인프라 + KPI shell | ✅ 머지 (`3976a55`) |

### Phase 1-ε — Epic 4 대시보드 (Scope C: 인프라 + Shell + 실측 3 KPI)

**Scope 의사결정**: Plan v1에서 3개 옵션 비교 후 C 채택.

- ❌ A. Full per PRD (12 KPI 실 차트) — Epic 2/3 데이터 0건 → 시연 가치 0
- ❌ B. Shell만, KPI 실측 0개 — 너무 minimal
- ✅ **C. 인프라 + Shell + 실측 3개** — 시각 약속 + Recharts 깔아두기 + Epic 2/3 도입 시 wire only

활성 KPI 3개 (현 phase 측정 가능):

- **미응답 메시지** — `conversations.unread_count` sum (open만), subtext "N 열린 대화"
- **처리 중 분쟁** — `disputes.status IN open|in_review`, SLA 초과 시 subtext
- **KYC 상태** — `stores.verification_status` (5상태 다국어)

Coming-soon placeholder 9개 (Epic 2/3 도입 후 wire):

- 월 매출 / 평균 객단가 / 재방문률 / 노쇼율 / 국적 분포 / 시술 분포 / 디자이너 분포 등

### 시각 시그널

| 영역   | Active                   | Coming-soon                                 |
| ------ | ------------------------ | ------------------------------------------- |
| Border | `border-hesya-peach-100` | `border-dashed border-hesya-peach-200`      |
| BG     | `white`                  | `bg-hesya-peach-50/60`                      |
| 값 색  | `text-hesya-navy-900`    | `text-hesya-navy-900/35` (fade)             |
| 부가   | subtext 표시             | uppercase "데이터 적재 후 자동 활성화" caps |

반응형: mobile **1col** / sm **2col** / lg **4col**.

### 인프라

- `recharts ^3.8.1` 설치 (apps/web)
- `@hesya/database` facade에 `count` / `sum` export 추가 (drizzle-orm 캡슐화 유지)

### i18n Dashboard namespace 6 locales

`ko / en / ja / vi / zh-CN / zh-TW` 모두: title / subtitle / 12 KPI labels / 5 KYC states / units / coming-soon notes / footer.

### 검증

- `pnpm --filter @hesya/web type-check` ✅ 0 errors
- `pnpm lint` ✅ 0 errors / 0 warnings
- `pnpm --filter @hesya/web exec vitest run src/features/dashboard src/shared/lib/dal/dashboard` ✅ 13 passed (7 component + 6 DAL integration)
- `pnpm --filter @hesya/web build` ✅ Compiled successfully
- Playwright `/ko/store/dashboard` 데스크탑 4-col + 모바일 1-col 시각 ✅
- CI 4단 통과 (Vercel preview / e2e-smoke / e2e-integration / validate) → auto-merge

18 files / +1207/-11 / 신규 unit tests 13개.

### Vercel 배포

- PR #110 `3976a55` → main 자동 배포 (Vercel deployment 진행)

## 직전 세션 5 (2026-05-11) — Phase 1-γ.2.3.5 (γ.2.3 5-split 마무리)

### 머지된 PR

| #                                                   | Task                                            | 상태                |
| --------------------------------------------------- | ----------------------------------------------- | ------------------- |
| [#109](https://github.com/jaydenjoo/hesya/pull/109) | γ.2.3.5 Hesya landing 신규 + design-system 검수 | ✅ 머지 (`b9a6d68`) |

### Phase 1-γ.2.3.5 — Hesya Landing 신규 (보일러플레이트 폐기)

**중대한 발견 (Pre-Plan Inventory)**: `app/[locale]/page.tsx`가 여전히 `create-next-app` 보일러플레이트 상태 ("Deploy Now / Documentation"). prod 첫인상에 직접 영향 — 베타 출시 전 차단.

**Scope 의사결정**: B (minimal Hesya hero) 채택 — A (full 646줄 reference) / C (placeholder)와 비교.

신규 컴포넌트 (`features/landing/`):

1. **greeting-ticker.tsx** (client) — 5개 언어 인사 cycling 3.2s 주기 (en/ko/ja/zh/vi). kr Pretendard bold 26px / non-kr italic display 28px. Amber underline (28~36px) 활성 인사 따라 width 전환. `motion-reduce` 존중.
2. **landing-hero.tsx** (server) — peach-50 bg + navy-900 + amber-500 CTA → `/[locale]/sign-in` (사장님 단일 CTA). Sub copy max-w 30ch / navy-900/75. Customer note (검색은 베타 합류 후).
3. **landing-footer.tsx** (server) — 미니멀 (브랜드 마크 + locale 스위처 5개 + hint). Active aria-current + 비활성 hover amber-500.

i18n Landing namespace 6 locales 추가: subCopy / ownerCta / customerNote / footerHint (ko, en, ja, vi, zh-CN, zh-TW).

`app/[locale]/page.tsx` 65줄 보일러플레이트 → ~33줄 server component (next-intl getTranslations + hero/footer 조립).

### Design system 검수

`app/[locale]/design-system/page.tsx` (1273줄) — grep 미정합 0건 확인 (이미 Hesya 토큰 19건 적용 완료). Surgical 수정 불요.

### 검증

- `pnpm --filter @hesya/web type-check` ✅ 0 errors
- `pnpm lint` ✅ 0 errors / 0 warnings
- `pnpm --filter @hesya/web exec vitest run src/features/landing` ✅ 12 passed (ticker 6 + hero 3 + footer 3)
- `pnpm --filter @hesya/web build` ✅ Compiled successfully
- Playwright `/ko`, `/en`, `/ja` 시각 캡처 ✅ (greeting ticker cycling 작동 — 3개 다른 시점 caught)
- CI 4단 통과 (Vercel preview / e2e-smoke / e2e-integration / validate) → auto-merge

14 files / +354/-58 / 신규 unit tests 12개.

### Vercel 배포

- PR #109 `b9a6d68` → main 자동 배포 (Vercel deployment 진행)

## 직전 세션 4 (2026-05-11) — Phase 1-γ.2.3.4

### 머지된 PR

| #                                                   | Task                                              | 상태                |
| --------------------------------------------------- | ------------------------------------------------- | ------------------- |
| [#108](https://github.com/jaydenjoo/hesya/pull/108) | γ.2.3.4 admin 8큐 디자인 정합성 적용 (5종 시그널) | ✅ 머지 (`38e9bd8`) |

### Phase 1-γ.2.3.4 — Admin 8큐 디자인 정합성

`docs/design/reference/admin-*.css` (admin-kyc / admin-chrome 등 5 reference) palette 기반 5종 시각 시그널 적용. **DB / Server Action / chrome 변경 0건**.

1. **PageHeader h1**: `text-3xl font-bold` → `text-2xl + tracking-[-0.02em] + text-hesya-navy-900`
2. **Filter pills**: `bg-black/text-white` → 3-state pill (default `border-gray-200` / hover `border-navy` / active `bg-navy text-peach-50`)
3. **Table row**: `border-b` → `border-hesya-peach-100` + hover `bg-hesya-peach-50/40`
4. **SLA / Status badge**: `text-red-600 / orange-600` → 초과 `bg-peach-100 text-red-500` / 경고 `text-hesya-amber-500`
5. **Detail link**: `text-blue-600 underline` → `text-hesya-amber-500 hover:underline`

적용 영역 (18 file):

- **features (5)**: `features/admin/components/{disputes-list, dispute-detail, store-verifications-list, store-verification-detail}.tsx` + `features/store-deletion/components/admin-deletion-queue.tsx`
- **admin/\* page.tsx (10)**: 8개 route + 2개 `[id]/page.tsx` — h1 + inline UI 토큰 정합
  - 4개 큐 inline UI: ai-accuracy / api-policy-alerts / payment-monitoring / store-reports
  - kyc-test: h1 + 4 primary button만 (WCAG AAA 주석 영역 보존)
  - store-deletion 강제해지 form: red semantic 유지 (위험 액션 의도)
- **신규 테스트 (3)**: disputes-list.test.tsx (8 cases) + admin-deletion-queue.test.tsx (6 cases) + store-verifications-list.test.tsx (+2 visual)

총 18 files / +476/-134 / 신규 시각 시그널 unit tests 16개.

### L-082 시연 prerequisite 자동 충족

`dev-demo.sh`가 `E2E_ADMIN_EMAIL=demo-owner@hesya.local` + `E2E_AUTH_USER_ID` inject → `requireAdminEmail()` 즉시 우회 조건 (NODE_ENV !== production && E2E_ADMIN_EMAIL 있음) → `/ko/admin/*` 직접 접근 가능 → Playwright 8 페이지 캡처 시각 정합성 검증 통과.

별 PR (dev-demo seed 미인증 user 보강)은 **불필요** — bypass 작동.

### 검증

- `pnpm --filter @hesya/web type-check` ✅ 0 errors
- `pnpm lint` ✅ 0 errors / 0 warnings
- `pnpm --filter @hesya/web exec vitest run src/features/admin src/features/store-deletion` ✅ 19 passed
- `pnpm --filter @hesya/web build` ✅ Compiled successfully
- Playwright 8 admin 페이지 시각 정합성 검증 ✅ (캡처: `.playwright-mcp/admin-*.png`)
- CI 4단 통과 (Vercel preview / e2e-smoke / e2e-integration / validate) → auto-merge

### Vercel 배포

- PR #108 `38e9bd8` → main 자동 배포 진행 (deployment `AARDxtRUvRYoed7LrFbuKEx2wZ6r`)

## 직전 세션 3 (2026-05-10) — Phase 1-γ.2.3.2 + γ.2.3.3

### 머지된 PR

| #                                                   | Task                                                                | 상태                 |
| --------------------------------------------------- | ------------------------------------------------------------------- | -------------------- |
| [#106](https://github.com/jaydenjoo/hesya/pull/106) | γ.2.3.2 inbox 메인 thread + draft review 디자인 정합성 (5종 시그널) | ✅ 머지 (`d041080`)  |
| [#107](https://github.com/jaydenjoo/hesya/pull/107) | γ.2.3.3 KYC submit/pending Hesya 토큰 + sign-in 회귀 검증           | ✅ 머지 (`098d9f0b`) |

### Phase 1-γ.2.3.2 — Inbox 메인 thread + draft review (Col 2)

reference `docs/design/reference/inbox-app.jsx` Col 2 영역 시각 시그널 5종 매핑. **DB/로직 변경 0건**.

1. **ThreadHeader** (.ix-thread-head): h-16 + 36px avatar + peach-100 border + meta row (11px gray-500). Badge → span(meta pattern).
2. **MessageView stream** (.ix-stream): `bg-hesya-peach-50` + `px-5 py-4 gap-2.5` (message-list).
3. **MessageBubble** (.ix-msg/.ix-bubble): inbound peach-50 → peach-100, max-w 75% → 78%, asymmetric corner (outbound 우하 4px / inbound 좌하 4px), `<time>` 버블 외부로 분리, bubble-trans border 색 정합 (customer navy/10, owner white/25).
4. **DraftReviewPanel** (.ix-assist): `motion-safe slide-in-from-bottom-2 220ms` 추가, 승인+전송 emerald-500 → amber-500 (Hesya 디자인 토큰 정합 + primary action), 무시 ghost 명시적 bg-transparent.
5. **vitest.setup.ts** N8N_WEBHOOK_SECRET stub 추가 (env schema 동기화 — 본 PR 검증 차단 방지).

10 files / +157/-43. 신규 시각 시그널 단위 테스트 8개 추가.

### Phase 1-γ.2.3.3 — Onboarding sign-in/KYC submit/KYC pending

3 페이지 묶음:

- **Sign-in (변경 0줄)**: 이미 reference `login-store-app.jsx` 80%+ 매칭 (첫 40 클래스 동일). 차이 ~159줄은 의도된 누락 영역 (Hesya는 Google OAuth 단일 → email/password form scope 외). Playwright 회귀 캡처로 회귀 없음 확인.
- **KYC submit page + KycForm**: Hesya 토큰 0% → 100%. 검은 버튼(bg-black) → amber-500 primary, generic input border → peach-200 + amber-500 focus ring, fieldset peach-50/60 + peach-200 border, kr Pretendard 라벨.
- **KYC pending page + PendingStatus**: 5상태별 시각 분리 StatusCard (warn/success/error/neutral) — manual_review(amber-500/peach-100), auto_approved(emerald-500/emerald-50 + amber primary CTA), rejected(red-500/red-50), pending(peach-200/peach-50), session_expired(warn + ghost CTA). 공통: rounded-2xl + border-l-4 + 아이콘 9x9 원형.

6 files / +211/-32. 신규 시각 시그널 단위 테스트 7개 (kyc-form 3 + pending-status 4).

### 시연 prerequisite 한계 (L-082) — KYC submit/pending

demo 환경에 미인증 user seed 부재 → 직접 접근 시 sign-in redirect. **단위 테스트 className 기반 검증으로 갈음**. demo seed 보강은 별 PR 후보 (γ.2.3 후속 또는 ζ 단계).

### 검증

- `pnpm --filter @hesya/web type-check` ✅ 0 errors (양 PR)
- `pnpm lint` ✅ 0 issues
- `pnpm --filter @hesya/web exec vitest run src/features/inbox` ✅ 276 passed (γ.2.3.2)
- `pnpm --filter @hesya/web exec vitest run src/features/onboarding` ✅ 20 passed (γ.2.3.3)
- 누적 신규 시각 시그널 unit tests 15개 (γ.2.3.2: 8 + γ.2.3.3: 7)
- 시각 검증:
  - γ.2.3.2: Playwright /ko/store/inbox + thread 선택 + Col 2 캡처 ✅ reference 매칭 확인
  - γ.2.3.3: Playwright /ko/sign-in 회귀 캡처 ✅ reference 매칭 유지. KYC submit/pending은 redirect로 단위 테스트 갈음

### Vercel 배포

- PR #106 `d041080` → main 자동 배포 ✅ (deployment ID `EXVxdjXi7x233PgGPhNNTd5NZ8j4`)
- PR #107 `098d9f0b` → main 자동 배포 (CI 직후 자동 배포 진행)

## 직전 세션 2 (2026-05-10) — Phase 1-γ.2.3.1

### 머지

| #                                                   | Task                                                              | 상태                |
| --------------------------------------------------- | ----------------------------------------------------------------- | ------------------- |
| [#105](https://github.com/jaydenjoo/hesya/pull/105) | γ.2.3.1 inbox 좌측 thread list 디자인 정합성 (5종 시그널)         | ✅ 머지 (`26dc381`) |
| `5c13f71`                                           | docs L-091 추가 + PROGRESS.md "알려진 환경 이슈" 정정 (main 직접) | ✅ push 완료        |

### Phase 1-γ.2.3.1 — Inbox 좌측 thread list/item 디자인 정합성

- 5종 디자인 시그널 적용 (reference `docs/design/reference/inbox-app.jsx` Col 1 + `inbox.css` `.ix-thread-row`):
  1. **active 좌측 3px amber bar** (`before:` pseudo) — 현재 thread 시각 강조
  2. **avatar 4색 cycling** (peach-200 / peach-100 / peach-50 / trust-rose, customerId 해시 결정적)
  3. **avatar 38px + channel icon 18px + peach-50 ring** — reference size/border 매칭
  4. **unread bg subtle** (`bg-hesya-peach-100/40` Tailwind v4 alpha modifier) — 읽지 않은 thread 시각 차이
  5. **row separator peach-100** (옅음) — reference border-bottom과 일치
- thread-item.tsx ~35줄 / thread-list.tsx 2줄 / thread-item.test.tsx +50줄(4 신규 테스트)
- 시각 검증 통과: pnpm dev:demo + Playwright로 active state + 우측 ThreadView 정상 작동 캡처
- **범위 OUT** (4원칙 2번 — 데이터 한계 / 별 PR 약속 유지): Filter pill / 채널 chip / Search bar / Foot tag (AI 대기·urgent·done) / ThreadHeader (Col 2)

### L-091 — Claude Code shell 환경 진단 (세션 핵심 발견)

- **증상**: Claude Code 안에서 `pnpm dev:demo` 실행 시 zod 2 에러 (ANTHROPIC_API_KEY format + N8N_WEBHOOK_SECRET undefined)
- **근본 원인**: Claude Code CLI host가 subshell에 `ANTHROPIC_API_KEY=""` (빈 문자열) 자동 inject → `@next/env`는 process.env에 이미 있는 키 skip → .env.local의 정상 값 무력화
- **해결**: `unset ANTHROPIC_API_KEY && pnpm dev:demo` (한 줄)
- **메타**: PROGRESS.md "알려진 환경 이슈" 섹션의 _"Jayden .env.local의 sk-ant- prefix 형식 점검 필요"_ 기재는 오진단. Jayden 환경은 정상 (`sk-ant-api03...` 108자), Claude Code shell이 원인.
- **세션 2 추가 메모리**: `env_claude_code_shell_anthropic_key.md` (project type) — 향후 모든 Hesya 세션에서 인지

### 검증

- `pnpm --filter @hesya/web type-check` ✅ 0 errors
- `pnpm lint` ✅ 0 issues
- thread-item 12 tests + thread-list/empty/header/shell 15 tests = 27 inbox tests ✅
- Tailwind v4 alpha modifier (`bg-hesya-peach-100/40`) ✅ 컴파일 + 렌더 정상
- Vercel Preview build ✅ — prod 빌드 환경에서도 컴파일 통과
- 시각 검증 ✅ — Playwright로 active 좌측 amber bar / avatar 4색 cycling 캡처 확인

## 본 세션 1 (2026-05-10) — Phase 1-γ.1.5 ~ γ.2.2 일괄 진행

### 머지된 PR / 커밋 (5건)

| #                                                   | Task                                                         | 상태              |
| --------------------------------------------------- | ------------------------------------------------------------ | ----------------- |
| `50f363d`                                           | Housekeeping (데모 PNG 7개 정리 + .gitignore 보강)           | ✅ main 직접 push |
| [#101](https://github.com/jaydenjoo/hesya/pull/101) | γ.1.5 E12-9 매장 해지·데이터 삭제 (soft-delete + 30일 grace) | ✅ 머지 (8819487) |
| [#102](https://github.com/jaydenjoo/hesya/pull/102) | γ.1.6 Epic 12 통합 E2E (admin 6개 큐 순회)                   | ✅ 머지 (513eab7) |
| [#103](https://github.com/jaydenjoo/hesya/pull/103) | γ.2.1 KYC→inbox 통합 E2E (admin 진짜 클릭 승인 + draft 전송) | ✅ 머지 (369d125) |
| [#104](https://github.com/jaydenjoo/hesya/pull/104) | γ.2.2 NTS audit log + edge case 보강 (6 unit tests)          | ✅ 머지 (af97fc7) |

### Phase 1-γ.1.5 — 매장 해지·데이터 삭제 (E12-9)

- 0025 manual SQL 마이그: `stores.deleted_at` + `store_deletion_requests` 테이블
- **FK ON DELETE SET NULL + `store_name_snapshot`** 패턴 — cascade 후에도 audit trail 보존
- DAL: `requestStoreDeletion / cancelStoreDeletion / listDeletionRequestsForAdmin / purgeExpiredStoreDeletions`
- Server Actions: owner self-request + admin admin-request (rate-limit 적용)
- Cron: `/api/cron/cascade-delete-expired-stores` (timing-safe Bearer, PII 미반환)
- Webhook routing block: `findStoreByExternalAccount`에 `isNull(stores.deletedAt)` 추가 → soft-deleted 매장으로 IG 메시지 라우팅 차단
- e2e 통과: owner 요청 → grace 카운트 → 취소 → admin 큐 cancelled

### Phase 1-γ.1.6 — Epic 12 통합 E2E

- `e2e/epic-12-integration.spec.ts` 단일 spec: admin 6개 큐 순회 (분쟁 → 결제이상 → AI정확도 → API정책 → 매장해지 → KYC)
- 시드: 1 admin + 1 store + 분쟁 1 + API alert 1 + 해지 요청 1 → 6 페이지 모두 헤딩 + row 검증
- E12 75% → 100%

### Phase 1-γ.2.1 — KYC→inbox 통합 E2E

- `e2e/kyc-to-inbox-flow.spec.ts`: phase-1-beta가 cover 못 하던 갭 (admin DB update 시뮬 → admin 진짜 클릭 승인)
- 시나리오 8단계: manual_review seed → admin 큐 → 상세 → 승인 클릭 → DB `auto_approved` 검증 → IG integration seed → owner inbox → "승인+전송" → DB `sent`
- E9 KYC 88% → 92%

### Phase 1-γ.2.2 — NTS audit log + edge case

- `kyc-log-repo.ts`: KycLogRepo (audit log immutable trail, PII 2차 저장 회피 — 성공 시 `extracted` 미포함, 실패 시 error code만)
- `nts-client.test.ts`: 6 unit tests (5xx 3회 재시도, 4xx 즉시 fail, network reject, 200 + invalid JSON, 200 + data[] empty, 정상 흐름)
- `actions.ts`: `extractOcrFromLicenseAction` 실패 path도 audit log 기록
- 보안 review (subagent): NO-GO HIGH (PII 2차 저장) → 정제 → GO. L-090 (gitleaks placeholder) 신규.

### Vercel/Env 진단 — 본 세션 추가 교훈 (L-088 ~ L-090, L-087 정확화)

- **L-088**: Vercel Dashboard env 등록 후 마스킹 (Encrypted/Sensitive Sensitive)은 **정상 동작**. UI에서 값이 사라진 것처럼 보여도 저장은 완료된 상태.
- **L-089**: env 갱신만으로는 자동 redeploy 안 됨 — Vercel Dashboard에서 **수동 redeploy 의무**.
- **L-090**: gitleaks `generic-api-key` entropy 임계는 ≈3.7+ → 테스트 fake key는 `REPLACE_ME_FAKE_*` prefix로 entropy < 3.5 유지.
- **L-087 정확화**: `openssl rand -base64 32`는 32 byte raw → **44 char base64 출력**. Vercel `min(32)` Zod 검증은 char count 기준 → 44 char OK.

### 검증

- `pnpm type-check` ✅ tsc 0 errors (모든 PR)
- `pnpm lint` ✅ 0 issues
- `pnpm --filter @hesya/web test` ✅ 본 세션 신규 케이스 모두 통과 (NTS 6 unit + E12 6큐 통합 + γ.2.1 8단계)
- e2e: store-deletion ✅ / epic-12-integration ✅ / kyc-to-inbox-flow ✅
- Vercel Production: PR #100 머지 후 `4387501` success (이전 세션 기록), 본 세션 PR은 모두 main 머지만 — **수동 redeploy 미실행** (L-089 적용 — 필요 시 다음 세션 첫 행동에서 redeploy)

## 다음 세션 가이드 — δ Epic 2/3 (Stripe + 예약) 또는 ζ 베타 매칭 prep

📄 **상세 plan**: `docs/Plan-v2-scenario-B.md`

### 다음 세션 첫 행동

1. PROGRESS.md 본 파일 확인 (현재 위치 = **ζ prep docs 완료**, 다음 분기 선택)
2. **L-091 확인** docs/learnings.md — Claude Code shell이 `ANTHROPIC_API_KEY=""` inject. dev 띄울 때 `unset ANTHROPIC_API_KEY &&` prefix 의무.
3. **세션 8 docs 배포 검증** — main 머지 후 자동 배포 확인 (Vercel deployment, L-089). docs only라 critical 영향 X.
4. **분기 결정** (사업자 등록 시점에 따라 진로 달라짐):
   - **(B) δ Epic 2 결제 Phase 1** (Stripe DB + 테스트 키 인프라) — 1~2일 예상. 🔴 RED 보안. 실 결제 X, 인프라만. 사업자 등록 무관.
   - **(D) ζ.4 통합 stress test** — 1일. 50+ 메시지/매장 부하 시드 + Sentry tag 보강. 사업자 등록 무관.
   - **(D) ζ.5 monitoring 강화** — 1일. PostHog 이벤트 인벤토리 + 누락 보강. 사업자 등록 무관.
   - **(B+D 권장 순서)**: ζ.4 → ζ.5 → δ Epic 2 결제 본격 진입 → 사업자 등록 후 ζ.1/ζ.7
   - **(A) γ.3 Epic 1 채널 확장** (WhatsApp / 카카오 / LINE) — ⚠️ Jayden 사업자 미보유 → 보류 유지
   - **(D) ζ.1 demo.hesya.com Phase 2** — ⚠️ 사업자 등록 + 외부 리소스 Jayden 명시 승인 필요 → 보류
5. 선택한 phase의 plan v1 작성 (Pre-Plan Inventory 의무):
   - 작업 영역 grep + 키워드 검색
   - 시연 prerequisite 검증 (L-082)
   - 인벤토리 결과 plan v1 첨부

### 베타 onboarding 자료 준비 완료 ✅

- `docs/demo-guide.md` 시나리오 A~D + 시드 명세 갱신
- `docs/beta-onboarding-checklist.md` 5-단계 체크리스트 + 비상 절차 5 상황
- Jayden 사업자 등록 완료 시 ζ.7 본격 실행 가능

### Phase 1-γ.2.3 — 디자인 정합성 5-split ✅ **마무리 완료**

`docs/design/reference/` 80 files (claude.ai/design 출력) 기반 단계적 적용:

| 단계    | 영역                                            | 예상  | 상태    |
| ------- | ----------------------------------------------- | ----- | ------- |
| γ.2.3.1 | Inbox 좌측 thread list + 헤더 디자인 토큰 적용  | 1일   | ✅ 완료 |
| γ.2.3.2 | Inbox 메인 thread + draft review 패널           | 1일   | ✅ 완료 |
| γ.2.3.3 | Sign-in / KYC submit / KYC pending 페이지       | 1일   | ✅ 완료 |
| γ.2.3.4 | Admin 8큐 (분쟁/검토/해지/AI/결제/API/신고/KYC) | 0.5일 | ✅ 완료 |
| γ.2.3.5 | Landing (보일러플레이트 폐기) + design-system   | 0.5일 | ✅ 완료 |

**모든 핵심 사용자 surface 디자인 정합성 적용 완료.**

### Phase 1-γ.3 — Epic 1 채널 확장 (1.5~2주)

WhatsApp / 카카오 / LINE adapter + 통합 시연.

### Phase 1-δ — Epic 2 결제 + Epic 3 예약 (3~4주)

Stripe + Alipay + WeChat + 한국은행 환율 + 다국어 예약 페이지.

### Phase 1-ε — Epic 4 대시보드 (1주)

Recharts KPI 12개.

### Phase 1-ζ — 통합 검증 + 베타 매장 매칭 (1~2주)

demo.hesya.com Phase 2 도입 + 베타 1~2곳 onboarding.

### 베타 5곳 출시 — 약 3~5주 후

## 차단 요소

- ⚠️ γ.3 Epic 1 채널 확장 (WhatsApp / 카카오 / LINE) — Jayden 사업자 미보유 → 보류 유지.
- 그 외 차단 요소 없음.

## 마지막 업데이트

- 날짜: 2026-05-11 (세션 9 종료)
- 세션 9 작업 시간: ~4h (ζ.4 stress test + M1.1 Mock env flag + CI 차단 진단 + 비활성화 + PROGRESS)
- 세션 9 머지: [#112](https://github.com/jaydenjoo/hesya/pull/112) `72acef4` + [#113](https://github.com/jaydenjoo/hesya/pull/113) `e94ff84` (둘 다 admin override squash 머지, CI 차단 우회)
- 세션 9 인프라: GitHub Actions CI 자동 trigger 비활성화 → 향후 분 소비 0 (Vercel + 로컬 검증)
- 세션 9 누적 교훈: L-093 (Free + Budget $0 조합 차단)
- **P0 평균 변동 없음 (61%)** — ζ.4 시드 인프라 + Plan v3 + Mock env 인프라만. 코드 분기 stub 0 (M1.2부터 실 분기)

## 컨텍스트 관리 강화 — 누적 (L-082 → L-091)

1. **PROGRESS 자기평가는 e2e 시연 기준** (L-082)
2. **destructive CLI 명령 글로벌 정밀화** (L-083)
3. **subagent 진단 의무화**: P0 Epic 작업 전 senior-engineer + code-explorer
4. **PR 같은 영역 3개+ 누적 시 회고 trigger** (L-082)
5. **새 env 도입 PR 5-layer → 7-layer 정합성 의무** (L-084 → L-087 → 세션 1 L-088/089 추가)
6. **시연 prerequisite 3-layer 격리 검증 의무** (L-085)
7. **PR 머지 직전 main HEAD 검증 의무** (L-086 — squash merge timing fix 누락 차단)
8. **새 env 도입은 Vercel Production+Preview+Development 3환경 등록 + 수동 redeploy** (L-087 + L-089)
9. **Vercel UI Encrypted/Sensitive 마스킹은 정상 동작** (L-088)
10. **gitleaks 우회는 `REPLACE_ME_FAKE_*` placeholder 패턴** (L-090)
11. **audit log에 PII 2차 저장 금지** (γ.2.2 보안 review fix)
12. **Claude Code shell이 `ANTHROPIC_API_KEY=""` inject — dev 띄울 때 `unset` prefix 의무** (L-091 신규, 세션 2)
13. **PROGRESS.md "알려진 환경 이슈" 추측 진단 금지** (L-091 메타 — 본 항목 정정 trigger)

## 알려진 환경 이슈 (다음 세션 scope 밖)

- **Claude Code shell ANTHROPIC_API_KEY 빈 값 inject** (L-091): 정상 터미널 영향 X, Claude Code 안 dev 시작 시 `unset ANTHROPIC_API_KEY` prefix 의무. 영구 가드는 `dev-demo.sh` 첫 줄 추가 후속 PR 후보.
- 베타·prod 출시 직전 일괄 secret rotation 예정 (N8N_WEBHOOK_SECRET 임시값 포함)
- Vercel Production 세션 1 PR (#101~#104) + 세션 2 PR (#105) 자동 배포는 main 머지 후 진행되나, **L-089 적용 시 다음 세션에서 명시적 검증 권장**

## 관련 문서

- PRD: `docs/PRD.md` (v1.2)
- 개발 계획: `docs/DEVELOPMENT-PLAN.md` (v1.2 FINAL)
- Plan v2 상세: `docs/Plan-v2-scenario-B.md`
- 디자인 참조: `docs/design/reference/` (80 files, claude.ai/design 출력)
- 디자인 가이드: `docs/DESIGN-PLAN.md`
- 데모 가이드: `docs/demo-guide.md`
- ADR: `docs/DECISIONS.md`
- 교훈: `docs/learnings.md` (L-001~**L-091**)
- 글로벌 규칙: `~/.claude/CLAUDE.md` v3.2
- 인벤토리 절차: `~/.claude/rules/inventory-protocol.md`
- 프로젝트 규칙: `CLAUDE.md` (5-Layer 문서 구조)
