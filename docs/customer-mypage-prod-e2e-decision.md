# Customer MyPage prod e2e 시연 — 옵션 비교 + 권장 (2026-05-15)

> 세션 33/34에서 명시된 "Customer MyPage prod e2e — magic link 자동화 불가, manual 시연 또는 OAuth fallback 추가 결정 필요"의 결정 문서.

## 배경

- 외부 데모 baseline: `https://hesya-web.vercel.app/ko` (memory `feedback_demo_no_personal_env_dependency.md`)
- Owner Login은 이미 PR #146에서 Email + Password 직접 로그인 + `NEXT_PUBLIC_DEMO_AUTOFILL` 데모 자동입력 적용 → 외부 누구나 즉시 시연 가능.
- **Customer MyPage 한계**: 현재 customer 인증 흐름은 **Magic Link 단일**. 외부 시연자가 임의 이메일 입력 → Magic Link 메일 도착 대기 → 클릭 → 진입. 자동화 불가하고, 본인 이메일에 의존 (외부 누구나 baseline 위반).

## 옵션 A — Manual 시연 가이드 (외부 액션 없음, 즉시 적용 가능)

**요지**: 외부 시연자가 본인 이메일로 1회 Magic Link 받고 진입하는 절차를 명문화. 본 가이드를 `/ko/c/mypage` 페이지 또는 README에 노출.

**Pros**:

- 코드 변경 0건
- 외부 액션 (도메인/OAuth 설정) 없음
- 베타 약정서/데모 영상 촬영 시점에 한 번 본인 메일로 진입한 영상 사용 가능

**Cons**:

- 외부 시연자가 본인 메일 클릭 + 인증 진행 부담 (이메일 round-trip 30초~수 분)
- L-082 "외부 누구나 동일 URL/계정으로 끝까지 시연 가능해야 함" 위반 (개인 메일 의존)
- 메일 수신함 접근 못 하는 시연자는 시연 불가

## 옵션 B — Customer OAuth fallback 추가 (Google OAuth, owner와 같은 패턴)

**요지**: Owner Login (PR #144~#146)과 같이 Customer Login에도 Google OAuth + Email/Password 직접 로그인 추가. demo 계정 `demo-customer@hesya.com` 미리 생성하여 `NEXT_PUBLIC_CUSTOMER_DEMO_AUTOFILL`로 prefill.

**Pros**:

- 외부 누구나 baseline 동일 페이지에서 즉시 customer 시연 가능 (L-082 충족)
- 베타 출시 후 실 고객도 Google OAuth로 가입 가능 (UX 개선)
- 기존 Owner OAuth 인프라 재사용 (Better Auth + Google provider 이미 설정됨)

**Cons**:

- 코드 변경 약 3~4h (sign-in page, customer guard, demo 계정 seed, 6 locale i18n)
- Customer는 별도 DB row 모델 (`customers` table) — `users` (auth) 와 link 필요. Owner와는 다른 join 패턴.
- Customer가 OAuth로 회원가입 시 `customers` row 자동 생성 로직 필요 (Better Auth onSession hook 또는 first-page-visit insert)

## 옵션 C — Customer 인증 자체를 베타 단계까지 보류 (현 상태 유지)

**요지**: Customer MyPage prod 시연 없이 mock 페이지로만 진행. PR #178 Customer Chat은 mock 대화로 100% 시연 가능, MyPage는 베타 출시 후 실 고객 가입과 함께 활성화.

**Pros**:

- 코드 0건, 외부 액션 0건
- 베타 출시 전까지 자원 절약 (베타 5곳 매장 매칭이 우선순위 상위)

**Cons**:

- M3/M4 시연 100% 라인업에서 customer 영역만 mock — 시연 영상 촬영 시 customer flow 누락
- 베타 출시 후 첫 실 고객 onboarding 시 새 인증 흐름 검증해야 함 (출시 후 검증 = 리스크)

## 권장 (Claude 의견 — Jayden 최종 결정 필요)

**옵션 B (Customer OAuth fallback) 권장** — 다음 근거:

1. L-082 "외부 누구나 동일 URL/계정" 원칙 + memory `feedback_demo_no_personal_env_dependency.md` 정합
2. Owner OAuth 인프라 재사용 → 신규 R&D 비용 작음 (3~4h)
3. 베타 출시 후 실 고객 UX 동일 (베타→prod 갭 0)
4. 시연 영상 촬영 시 customer flow까지 끊김 없음

**다음 단계** (옵션 B 채택 시):

1. Customer sign-in page (`/[locale]/c/sign-in`) 추가 — Owner sign-in과 같은 디자인 패턴 (brand panel + form)
2. `customer-guard.ts` (Better Auth session + customers row join) 추가
3. Demo customer 계정 seed (`demo-customer@hesya.com` / `Hesya!DemoCustomer2026`) prod에 1회 INSERT
4. `NEXT_PUBLIC_CUSTOMER_DEMO_AUTOFILL=demo-customer@hesya.com` env 추가
5. Customer OAuth callback에 `customers` row upsert 로직 (Better Auth onSession 또는 first-visit middleware)
6. CustomerLanding의 "로그인" CTA를 `/c/sign-in`으로 link
7. 6 locale i18n (en/ko/ja/zh/vi/es)

**옵션 A 채택 시**: `docs/customer-mypage-manual-demo-guide.md` 추가 + README에 노출. 코드 변경 0건, 30분 작업.

**옵션 C 채택 시**: PROGRESS.md "Customer MyPage prod e2e" 항목 베타 출시 후로 이연 + 본 문서 폐기.

## 결정 (Jayden 기록)

- [ ] 옵션 A (Manual 가이드)
- [ ] 옵션 B (Customer OAuth fallback, 권장)
- [ ] 옵션 C (베타까지 보류)

결정 후 본 문서를 commit 또는 후속 PR로 진행.
