# 외부 데모 환경 감사 — Hesya prod (2026-05-13)

> **목적**: 외부 불특정 다수가 `https://hesya-web.vercel.app`에서 끝까지 시연 가능한지 검증. 사업자 발급 전 베타 매장 모집/홍보용 환경.
>
> **방법**: Playwright로 prod에서 실 흐름 e2e + 환경변수/시드 상태 확인. 모두 검증된 사실만 기록. 추정은 명시.

## 1. 환경 활성화 상태 (2026-05-13 기준)

### Mock 환경변수 — prod 활성화

| ENV                              | 상태 | 효과                                                                  |
| -------------------------------- | ---- | --------------------------------------------------------------------- |
| `MOCK_IG_OAUTH=true`             | ✅   | Instagram 연결 클릭 → Meta OAuth 화면 건너뜀 → 가짜 token 저장        |
| `MOCK_KYC=true`                  | ✅   | KYC 가짜 사업자번호 → 자동 승인                                       |
| `MOCK_PAYMENT=true`              | ✅   | 결제 페이지에 "⚠️ Mock 모드" 배지 + 결제 클릭 시 가짜 영수증          |
| `MOCK_NOTIFICATION=true`         | ✅   | Resend 실 메일 발송 차단 (외부 시연자 가짜 메일에 발송 X)             |
| `NEXT_PUBLIC_DEMO_AUTOFILL=true` | ✅   | 사인인 페이지에 demo@hesya.com / Hesya!Demo2026 자동 입력 + 안내 표시 |

### Prod DB 시드 (PR #148 머지 완료)

| 항목                | 데이터 양                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------- |
| Stores              | 1 (Hesya 데모 헤어샵 강남, auto_approved)                                                    |
| Services            | **5건** 한·영·일·중·베 5개국 번역                                                            |
| Staff               | **3명** (David KO·EN / 민지 / Yuki KO·JA) + Unsplash portfolio 사진                          |
| Customers           | **3명** (Mei Tanaka JP / Linh Nguyen VN / Sarah Park US) + 알러지 + 선호 디자이너 메모       |
| Conversations       | **3** (Instagram / Kakao / WhatsApp 채널 mix)                                                |
| Messages            | **7** (한·일·베·영 양국어 + AI 응답 draft 패턴)                                              |
| Bookings            | **5** (status mix: scheduled 2 / completed 2 / no_show 1) — 외부 시연자가 만든 row 별도 누적 |
| Store knowledge FAQ | **5건** (영업시간 / 결제 / 외국어 / 주차 / 시술 시간) 한·영                                  |

## 2. 시연 시나리오 4종 — 끝까지 가능 여부

### A. 손님 흐름 (외국인 손님 → 매장 발견 → 예약 → 결제)

| 단계           | URL                              | 결과                                                                     |
| -------------- | -------------------------------- | ------------------------------------------------------------------------ |
| 1. 랜딩        | `/ko`                            | ⚠️ **"손님 페이지로" CTA 누락** — 외부 시연자가 손님 흐름 시작점 못 찾음 |
| 2. 손님 허브   | `/ko/c`                          | ✅ 검색 + 지역 필터 + 매장 1곳 노출                                      |
| 3. 매장 상세   | `/ko/c/store/{id}`               | ✅ 시술 5건 + 디자이너 3명 + portfolio 사진                              |
| 4. 예약 스케줄 | `/ko/c/store/{id}/book/schedule` | ✅ 시술 + 디자이너 + 날짜 + 시간 선택                                    |
| 5. 예약 확인   | `/ko/c/store/{id}/book/confirm`  | ✅ 손님 정보 입력                                                        |
| 6. 결제        | `/ko/c/store/{id}/pay`           | ✅ "⚠️ Mock 모드" 배지 + 30% 선결제                                      |
| 7. 완료        | `/ko/c/store/{id}/pay/success`   | ✅ "예약이 확정되었습니다" + bookingId 생성                              |

### B. 사장 흐름 (로그인 → 인박스 응대 → 매장 운영)

| 단계         | URL                   | 결과                                                                                     |
| ------------ | --------------------- | ---------------------------------------------------------------------------------------- |
| 1. 사인인    | `/ko/sign-in`         | ✅ demo 계정 자동 입력 + "데모 자격증명 자동 입력됨" 안내                                |
| 2. 대시보드  | `/ko/store/dashboard` | ✅ 월 매출 ₩315K / 노쇼율 20% / 평균 객단가 ₩63K / 국적 분포 5건                         |
| 3. 인박스    | `/ko/store/inbox`     | ✅ 3 스레드 (IG/KT/WA), 미답 1 / 완료 2 (단, **customer.name 대신 UUID prefix 표시** ⚠️) |
| 4. 예약 관리 | `/ko/store/bookings`  | ✅ 6건 status mix (예정 3 / 완료 2 / 노쇼 1). 단 3건은 service column "—" 누락 ⚠️        |
| 5. 고객      | `/ko/store/customers` | ✅ 3명 국적/언어/매출/알러지/선호 디자이너                                               |
| 6. 시술      | `/ko/store/services`  | ✅ 5건 한·영·일·중·베 번역                                                               |
| 7. 지식      | `/ko/store/knowledge` | ✅ FAQ 5건 한·영                                                                         |
| 8. 설정      | `/ko/store/settings`  | ✅ 매장 정보 / 영업시간 / 주소 편집                                                      |

### C. 신규 매장 가입 (KYC 가짜 사업자번호 → 자동 승인)

| 단계        | URL                        | 결과                                                                                                      |
| ----------- | -------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1. 진입     | `/ko/onboarding/kyc`       | ⚠️ **랜딩에서 진입 링크 없음** — URL 직접 입력 또는 사인인 페이지 "처음이신가요? 무료 매장 가입" 링크로만 |
| 2. KYC 입력 | 같은 URL                   | ✅ 매장명/번호/대표자/전화/주소/영업신고증 URL + 자기신고 3건 체크                                        |
| 3. 제출     | → `/ko/onboarding/pending` | ✅ 즉시 "승인됨!" + "Instagram 연결로 다음 단계 진행" 안내                                                |

### D. 운영자 (admin) — 외부 시연자는 보지 못함

| 경로          | 가드                                            | 외부                                                  |
| ------------- | ----------------------------------------------- | ----------------------------------------------------- |
| `/ko/admin/*` | `requireAdminEmail` (ADMIN_EMAILS 화이트리스트) | ❌ 차단. 외부 시연자에게 보일 필요 없음 (의도된 설계) |

## 3. 외부 시연 차단선 (남은 것)

| #     | 차단선                                                                   | 영향                                                        | 우선순위              |
| ----- | ------------------------------------------------------------------------ | ----------------------------------------------------------- | --------------------- |
| **1** | 랜딩(`/ko`)에 손님 페이지(`/ko/c`) 진입 링크 없음                        | 외부 시연자가 손님 흐름 시작점 못 찾음. URL 직접 전달 필요  | 🔴 High (시연 진입성) |
| **2** | 인박스 thread 미리보기에 customer.name 대신 UUID prefix(`00000030`) 표시 | 디자인 임팩트 ↓, 사장 시연 시 어색                          | 🟡 Medium (디자인)    |
| **3** | Bookings 3건에 serviceId 누락 → service column "—" 표시                  | 시드 데이터 결함. 사장 시연 시 어색                         | 🟡 Medium (디자인)    |
| **4** | Navigation 속도 3.5~5초 (sidebar persist는 OK)                           | 외부 시연자 메뉴 클릭 시 답답함                             | 🔴 High (UX)          |
| **5** | demo 계정 full owner 권한 — 외부 시연자가 데이터 파괴 가능               | 시연 후 데이터 망가지면 다음 시연자에게 영향                | 🟡 Medium (안전)      |
| **6** | 매장 사진 ("매장 사진 준비 중" 표시)                                     | store_photos 테이블 X. 외부 시연 시 매장 사진 영역 비어보임 | 🟡 Medium (디자인)    |

## 4. 보안 안전성 (RED 프로젝트 — 외부 노출 검토)

✅ RLS + service_role pattern으로 직접 DB 접근 차단
✅ `DEMO_USER_ID` bypass는 `VERCEL_ENV='preview'`일 때만 — prod 미작동
✅ `E2E_AUTH_USER_ID` bypass는 `NODE_ENV !== 'production'`일 때만 — prod 미작동
✅ `listPublicStores`는 `auto_approved + deletedAt IS NULL` 필터 — 베타 신청 중 매장 미노출
✅ Mock 모드는 외부 API (Stripe/NTS/Resend/Meta) 실 호출 차단
⚠️ demo 계정 비밀번호 노출 baseline (자동입력 prop로 외부 누구나 로그인) — 의도된 행동

## 5. 베타 출시 차단선 (사업자 발급 후)

| 영역      | 외부 데모 (현재)       | 베타 정식                                  |
| --------- | ---------------------- | ------------------------------------------ |
| Instagram | MOCK_IG_OAUTH ✅       | Meta App Review → Live mode                |
| KYC       | MOCK_KYC ✅            | NTS 실연동 + 운영자 수동                   |
| 결제      | MOCK_PAYMENT ✅        | Stripe / Alipay+ / LINE Pay / WeChat       |
| 알림      | MOCK_NOTIFICATION ✅   | Resend 도메인 검증 + WhatsApp Business API |
| 도메인    | `hesya-web.vercel.app` | `hesya.com` 또는 `hesya.kr`                |

## 6. 결론 — 외부 시연 % 자기평가 (L-082 룰)

**80%** — 모든 핵심 흐름 (손님/사장/신규 가입) 끝까지 가능. 4개 mock 활성 + 풍성한 시드. 단 4가지 차단선 (#1 랜딩 진입성, #2 UUID 표시, #3 service 누락, #4 navigation 속도) 해결 시 95%+. #5 (안전) + #6 (사진)은 부가.

## 7. 다음 PR plan (우선순위)

1. **Minor fix PR** — 차단선 #1 + #2 + #3 일괄 (1 PR, 2~3h)
2. **Perf PR** — 차단선 #4 (Vercel region + Better Auth caching + DAL dedup, 1~2h)
3. **별도 후속 (사업자 매칭 시점)** — Phase 4 안전장치 (nightly demo reset cron) + 매장 사진 시드
