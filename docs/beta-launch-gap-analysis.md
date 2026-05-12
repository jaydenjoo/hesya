# 베타 출시 Prerequisite 갭 분석 (2026-05-12, 세션 19)

> Plan v3 M1~M5 거의 완료 직후 시점. PRD `Phase 1 베타 5곳` 출시 조건과 현재 상태를 매핑하여 잔여 갭을 식별한다.
> 기준: L-082 — % 표시는 코드 머지 완료가 아닌 **사용자 입장 e2e 시연 가능 여부**.

## 0. 요약 (BLUF)

- **Plan v3 코드 작업 100% 완료**: M1 5/5 + M2 7/7 + M3 5/5 + M4 5/5 (M4.2 본 세션 완료) + M5 4/5 (M5.4만 Jayden 외부 작업)
- **출시 차단 항목 1개 (Jayden 외부)**: 사업자 등록 + 결제사 KYB
- **출시 차단 항목 2개 (시연 prerequisite)**: 외부 데모 환경(Vercel Preview env 등록) + 베타 매장 5곳 매칭
- **결론**: 코드 측면에서 베타 출시 prerequisite **90% 충족**. 잔여 10%는 외부 작업(사업자/결제사/매장 매칭)이 핵심.

## 1. PRD 베타 출시 조건 vs 현재

PRD `docs/PRD.md` § 5.4 (매장 사용자 플로우) + `docs/beta-onboarding-checklist.md` § 0 사전 준비 기준.

| PRD 조건                                                                       | 상태                  | 잔여                                                                   |
| ------------------------------------------------------------------------------ | --------------------- | ---------------------------------------------------------------------- |
| Jayden 사업자 등록 완료                                                        | ❌ 미완               | **Jayden 외부 작업** (개인 또는 법인)                                  |
| `demo.hesya.com` Phase 2 인프라 (Supabase 신규 + Vercel 신규 + cron 시드 리셋) | ❌ 미완               | ζ.1/ζ.2 — 베타 1주 전                                                  |
| 베타 약정서 초안 (무료·기간·SLA·데이터 정책)                                   | ❌ 미완               | Jayden 작성 (1~2일)                                                    |
| 데모 영상 또는 라이브 시연 자료                                                | 🟡 부분               | `docs/demo-guide.md` + `external-demo-guide.md` 작성 완료. 영상 미작성 |
| 매장 측 IG 비즈니스 계정 + Meta 권한                                           | n/a                   | 매장 매칭 후                                                           |
| KYC 자동 통과 (`auto_approved`)                                                | ✅ Mock OK / Real 미  | `MOCK_KYC=false` swap 후 data.go.kr 키 등록 시 활성                    |
| Meta IG OAuth 실 연동                                                          | ✅ Mock OK / Real 미  | `MOCK_IG_OAUTH=false` swap 후 Meta App 등록 시 활성                    |
| 결제 위젯 통합 (Stripe/Alipay/WeChat)                                          | 🟡 Mock UI / Real KYB | 베타 중반 도입 (Phase 1-δ Epic 2). 베타 초기 무결제 운영 가능          |
| Sentry critical 0건                                                            | ✅ 코드 OK            | 베타 운영 1주차 daily 점검                                             |
| 외국인 응답 p95 < 3분                                                          | ✅ 코드 OK            | 베타 운영 측정                                                         |
| AI 초안 수정률 ≤ 50% (가설 H1)                                                 | ✅ 코드 OK            | 베타 운영 측정                                                         |

## 2. P0 Epic 완성도 객관 (L-082 시연 기준)

세션 9 PROGRESS 자기평가 + 본 세션 9건 머지 반영.

| Epic                | 시연 가능 흐름                                                                                   | 자기평가 % | 잔여                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------ | ---------- | --------------------------------------------------------------------------------- |
| **E1 인박스**       | IG OAuth Mock → AI 초안 → 승인/수정/skip → skip 큐 (M4.2)                                        | **80%**    | 실 IG webhook (real swap 후) / WhatsApp·Kakao·LINE (Phase 1-D)                    |
| **E2 결제 위젯** 🔴 | Mock UI 3-tab (Stripe/Alipay/WeChat) → `mock_<id>` payment row                                   | **60%**    | 실 KYB + Stripe Connect 통합 (베타 중반)                                          |
| **E3 예약 시스템**  | customer 4-step → 결제 → atomic insert / owner 5-status 관리 / 다국어 가격                       | **95%**    | conflict 영구 차단 (#27 partial unique index) + skip 큐 (본 세션) 완료. 실 운영만 |
| **E4 대시보드**     | 4 KPI active (revenue / avg / no-show / nationality mix) + Inbox/Disputes/KYC tiles              | **70%**    | rebookRate / treatment·designer mix (베타 데이터 누적 후)                         |
| **E9 KYC** 🔴       | data.go.kr Mock 자동 통과 + LocalData 매칭 + admin 수동 큐                                       | **96%**    | 실 NTS API 키 (real swap 후) / 디자인 정합 1건                                    |
| **E12 관리자** 🔴   | `/admin/dashboard` 통합 (alert chip 4 + KPI 4 + audit) + ai-cost 14일 sparkline + 8 sub-page hub | **100%**   | —                                                                                 |

**P0 평균**: 84% (세션 9 62% → +22p). M4.2 + 본 세션 분석으로 6 Epic 모두 시연 가능 흐름 보유.

## 3. 외부 데모 환경 갭 (M5.4)

`docs/external-demo-guide.md` 가이드 작성 완료 (본 세션 보강 → M3.1~M5.1 신규 흐름 9건 추가). 잔여:

| 항목                                            | 상태                                                   |
| ----------------------------------------------- | ------------------------------------------------------ |
| `MOCK_KYC=true` Vercel Preview 등록             | Jayden 외부 작업                                       |
| `MOCK_IG_OAUTH=true` 등록                       | Jayden 외부 작업                                       |
| `MOCK_PAYMENT=true` 등록                        | Jayden 외부 작업                                       |
| `MOCK_NOTIFICATION=true` 등록                   | Jayden 외부 작업                                       |
| `MOCK_MULTI_CHANNEL=true` 등록                  | Jayden 외부 작업                                       |
| `DEMO_USER_ID` 등록 (시드 매장 #1 owner)        | Jayden 외부 작업 — `pnpm seed:beta-demo` 출력에서 copy |
| `DEMO_CUSTOMER_EMAIL` 등록 (시드 손님 #1 email) | Jayden 외부 작업 — 시드 출력에서 copy                  |
| 등록 후 redeploy 트리거 (L-089)                 | Jayden 외부 작업                                       |
| 외부인 1명 시연 통과 (가이드 5단계 + 6,7,8)     | M5.4 완료 마크 trigger                                 |

> M5.4는 Jayden 외부 작업 통과 + 외부인 1명 시연 통과 시 완료 마크. 코드 측면 작업 0.

## 4. ζ.7 베타 1~2곳 진입 prerequisite

| 항목                                                                           | 상태                 | 잔여 작업                                                        |
| ------------------------------------------------------------------------------ | -------------------- | ---------------------------------------------------------------- |
| Plan v3 M1~M5 완료                                                             | ✅ 95% (M5.4만 외부) | M5.4                                                             |
| Jayden 사업자 등록                                                             | ❌                   | Jayden 외부                                                      |
| `demo.hesya.com` Phase 2 인프라 (Supabase 신규 / Vercel 신규 / cron 시드 리셋) | ❌                   | ζ.1/ζ.2 (1주)                                                    |
| Mock → Real swap 완료 (`MOCK_*` 5개 false + 실 secret 등록)                    | ❌                   | 사업자 등록 후 (1~2일) — `docs/mock-swap-procedure.md` Phase A-F |
| 베타 약정서                                                                    | ❌                   | Jayden 작성 (1~2일)                                              |
| 베타 후보 매장 매칭 (외국인 비중 30%+ 강남/홍대/이태원 우선)                   | ❌                   | Jayden 영업 (병렬)                                               |
| 데모 영상 (5분 walkthrough)                                                    | ❌                   | Jayden 외부 (영상 도구 사용)                                     |
| Sentry/PostHog dashboard daily 점검 셋업                                       | 🟡 부분              | 베타 1주 전                                                      |

## 5. 다음 phase 분해 (베타 출시까지 4 phase)

### Phase ζ.5 (외부 시연 가능화, 0.5주 — Jayden 외부 작업 중심)

- M5.4 Vercel Preview env 7개 등록 + redeploy
- 외부인 1명 시연 (가이드 5단계 + 6,7,8 walk-through)
- M5 완료 마크 → Plan v3 100%

### Phase ζ.6 (사업자 + Real swap prerequisite, 1~2주 — Jayden 외부 중심)

- Jayden 사업자 등록 (개인 또는 법인)
- data.go.kr API 키 발급
- Meta Business App 등록 (IG OAuth)
- Stripe Connect / Alipay / WeChat KYB 시작 (병렬, Stripe Connect는 미완이라도 베타 초기 진입 가능)
- 베타 약정서 v1 작성
- 베타 후보 매장 1~2곳 영업 시작

### Phase ζ.7 (베타 1~2곳, 1주 — 코드 + 운영 혼합)

- `demo.hesya.com` Phase 2 인프라 셋업 (Supabase 신규 / Vercel 신규 / cron 시드 리셋)
- Mock → Real swap (`MOCK_*` 5개 false + 실 secret 등록 + redeploy)
- 베타 매장 1~2곳 onboarding (`docs/beta-onboarding-checklist.md` 시퀀스 2-1 ~ 2-4)
- 1주차 운영 점검 (Sentry critical 0 / 응답 p95 < 3분 / 수정률 ≤ 50%)

### Phase ζ.8 (베타 5곳 확대, 1주 — 운영 중심)

- 추가 매장 3곳 매칭 + onboarding
- 5곳 stability watch
- critical metric 통과 시 Phase 2 (정식 출시) 진입 결정

**총 소요**: 코드 0주 + Jayden 외부 작업 ≈ 3~4주 (사업자 등록 1주 + 매장 매칭 1~2주 + 베타 운영 1~2주). 결제사 KYB는 베타 중반 추가.

## 6. 본 세션 19 (2026-05-12) 진행 정리

- A. M5.4 외부 데모 가이드 보강 (M3.1~M5.1 신규 흐름 9건 추가 + `DEMO_USER_ID`/`DEMO_CUSTOMER_EMAIL` 등록 절차)
- B. M4.2 Inbox skip 큐 UI (deferred 해제, owner-side read-only)
  - `listSkippedMessagesByStore` DAL (최근 30일 + storeId + outbound + draftStatus='skipped' 필터)
  - `/[locale]/store/inbox-skipped` page + 6 locale i18n
  - 사이드바 nav active matching 정확화 (`startsWith` → `exact || startsWith + "/"`)
- C. 본 갭 분석 문서

검증: type-check ✅ / lint ✅ / vitest 704 ✅ / build ✅ (신규 라우트 등록 확인)

## 7. 관련 문서

- PRD: `docs/PRD.md` (v1.2)
- Plan v3 (Mock-first): `docs/Plan-v3-mock-first.md`
- 시나리오 B (사업자 후 풀 P0): `docs/Plan-v2-scenario-B.md`
- 베타 onboarding: `docs/beta-onboarding-checklist.md`
- Mock swap 절차: `docs/mock-swap-procedure.md`
- 외부 데모 가이드: `docs/external-demo-guide.md`
- 본인 PC 시연: `docs/demo-guide.md`
