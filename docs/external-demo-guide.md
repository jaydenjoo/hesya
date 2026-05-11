# 외부 데모 가이드 (Plan v3 Mock-first)

> Vercel Preview URL만 받으면 **Hesya의 모든 흐름을 사업자 없이 체험** 가능.
> 본 가이드는 **외부 베타 후보 / 디자인 검토자 / Jayden 친구** 대상.

## ⚠️ 사전 안내

1. **Mock 모드**: 외부 데모 환경의 모든 외부 연동(KYC / IG OAuth / 결제 / 알림)은 가짜 응답. 실 사업자등록증·실 IG 계정·실 결제 X.
2. **격리 DB**: Vercel Preview는 prod와 다른 격리 DB 사용 → 데이터 입력해도 실 운영 영향 0.
3. **베타 출시 후 ≠ 현재**: 본 데모는 사업자 등록 + 결제사 가입 전 단계의 시뮬. 정식 운영 시 동작 차이 있음 (가짜 → 실 연동 swap).
4. **공유 범위**: 외부에 공유 시 영업 비밀 누출 위험 낮으나, **결제 위젯이 Mock**이라는 점 명시 필수.

## 외부인 시뮬 흐름 (5단계)

### 1. 회원가입 (1분)

- Vercel Preview URL의 `/sign-in` 접속
- "Google로 로그인" 클릭 → 실 Google OAuth (본인 Gmail 사용)
- 로그인 후 `/onboarding/kyc` 자동 진입

> Locale selector (좌상단 🌐)로 6 언어 (한국어 / English / 日本語 / Tiếng Việt / 中文 简体 / 中文 繁體) 전환 가능.

### 2. KYC 자동 통과 (10초)

- 사업자등록 입력 (3 필드):
  - 사업자등록번호: 아무 10자리 숫자 (예: `1234567890`)
  - 개업일자: YYYYMMDD 8자리 (예: `20200101`)
  - 대표자명: 아무 이름
- **자동 통과** ✅ — `MOCK_KYC=true`로 data.go.kr 호출 skip + 자동 valid 응답
- LocalData 매장 매칭도 자동 100% → `auto_approved` 진입

> 실 운영에서는 사업자등록증 진위확인 + LocalData 매장 매칭 → 실패 시 admin 수동 심사 분기.

### 3. Instagram 연동 시뮬 (1분)

- `/store/inbox/connect` → "Instagram 연결" 클릭
- 가짜 OAuth flow → **즉시 연결 완료** ✅ (실 Meta 동의 화면 우회)
- DB에 가짜 access_token + page_id 저장 → "연결됨" 상태

> 실 운영에서는 Meta Business 동의 화면 → 사용자 승인 → access_token 받음.

### 4. 메시지 시뮬 (즉시)

- `/store/inbox` → 외국인 손님 메시지 thread + AI 초안 (이미 시드된 데이터)
- AI 초안 검수:
  - **승인 + 전송** — Mock 발송 (실 Instagram API 호출 X)
  - **수정 + 전송** — 텍스트 편집 후 발송
  - **건너뛰기** — 초안 폐기

> 시드: 매장 #1에 메시지 6건 (en/ja/zh 손님 각 1명) 또는 stress test 시 250건.

### 5. 매장 detail public 페이지 (M2.1 ✅)

외국인 손님 시선에서 매장 정보 view:

- `/c/store/<매장 UUID>` 접속 (인증 불필요)
- 매장명 / 주소 / 시술 5종 (이름·가격·소요시간) / 디자이너 3명 (이름·언어)
- 6 locale 모두 자동 인식 (`/ko/c/store/...` `/en/c/store/...` `/ja/c/store/...` 등)
- "사진 갤러리 →" 링크로 M2.2 페이지 진입
- "예약 진행" CTA 표시 (M2.3 schedule 페이지가 도착할 때까지 비활성)

> 매장 UUID는 시드 실행 출력 로그 또는 Jayden에게 요청. seed-beta-demo 매장 #1은
> `auto_approved` 상태로 즉시 노출 가능.

### 5-2. 매장 사진 gallery (M2.2 ✅)

- `/c/store/<매장 UUID>/photos` — 디자이너 3명 portfolio 총 15장 placeholder
- 3-컬럼 grid (모바일 2-컬럼) + hover scale 효과
- placeholder는 placehold.co (hesya peach/amber/navy 팔레트, 외부 의존 0건)
- 실 운영에서는 사장이 사장 측 "사진 관리" 페이지(M3.5)에서 사진 업로드

### 5-3. 예약 시간 선택 (M2.3 ✅)

- 매장 detail 페이지에서 "예약 진행" 버튼 → `/c/store/<UUID>/book/schedule`
- 4-step 선택: 시술 → 디자이너 → 날짜 (30일 chip) → 시간 (10:00~19:30, 30분 단위 20 chip)
- 모두 선택 시 "다음 단계 →" 활성화 → confirm 페이지로 URL search params 전달
- conflict 체크는 M2.6 server action에서 atomic (race-safe)

### 5-4. 예약 확정 stub (M2.4 다음 milestone)

- `/c/store/<UUID>/book/confirm` — 현재 search params echo만 (정식 폼 + 결제 진행은 다음 세션)

### 6. owner-side 예약 관리 시뮬 (customer-side는 M2 이후 활성화)

- `/store/bookings` — 예약 리스트 (이미 시드된 50건)
- 5-status filter (scheduled / completed / no_show / cancelled / all)
- 예약 detail → 3 terminal action (완료 / 노쇼 / 취소)

> **Customer-side 셀프 예약 + 결제 페이지는 M2.3~M2.6에서 추가 예정** (Mock Stripe/Alipay/WeChat UI).

### Admin 입장 (선택)

- 외부인이 `/admin/store-verifications` 접근 → 권한 차단 (admin이 아니라서)
- 데모 시연 시 Jayden이 admin 권한으로 직접 보여주거나, demo-guide.md (본인 PC 시연용) 활용

## Vercel Preview URL 받는 법

1. GitHub repo PR 페이지의 Vercel 봇 댓글에서 URL 확인
2. 또는 직접 받은 URL (Jayden 공유)
3. URL 형식: `https://hesya-<hash>-jaydens-projects-f5e92399.vercel.app`

## 데이터 초기화 (Reset)

- Vercel Preview의 격리 DB는 자동 reset 안 됨
- Mock 상태 reset이 필요하면 **Jayden에게 요청** (시드 스크립트 재실행)
- 매장 record / 메시지는 누적되어 시뮬에 영향 가능

## ⚠️ Jayden 측 사전 설정 (1회만)

Vercel Dashboard → Project Settings → Environment Variables → **Preview** 환경에 등록:

```
MOCK_KYC=true
MOCK_IG_OAUTH=true
MOCK_PAYMENT=true            (M2.5 이후 활성)
MOCK_NOTIFICATION=true       (M4.1 이후 활성)
MOCK_MULTI_CHANNEL=true      (M4.2 이후 활성)
```

→ 등록 후 Preview Deploy 트리거 (다음 PR push 시 자동 적용)

## 사업자 등록 후 swap 절차

Jayden 사업자 등록 + 결제사 KYB 완료 후:

1. Vercel Production env에서 `MOCK_*` 5개 모두 `false`로 변경
2. 실 secret 등록 (data.go.kr / Meta App / Stripe Connect / Alipay / WeChat)
3. 수동 redeploy (L-089)
4. 베타 매장 1~2곳 onboarding 시작 (`docs/beta-onboarding-checklist.md`)

상세: `docs/Plan-v3-mock-first.md` § 4.

## 트러블슈팅

| 증상                                       | 원인 / 해결                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------- |
| `/sign-in` Google OAuth 실패               | Vercel Preview env에 `GOOGLE_CLIENT_ID/SECRET` 누락. Jayden 확인.               |
| KYC 입력 후 "NTS API 오류" 표시            | `MOCK_KYC` env 미등록 또는 `false`. Jayden Vercel UI 확인.                      |
| Instagram 연결 시 "Meta OAuth 페이지" 도달 | `MOCK_IG_OAUTH=false` 상태. Vercel Preview env 확인.                            |
| `/store/inbox` 메시지 0건                  | 시드 미실행. Jayden에게 시드 요청 (또는 다른 외부인이 메시지 안 보냄).          |
| 예약 페이지 (`/store/bookings`) 진입 차단  | 매장 owner 인증 필요. Google OAuth로 로그인했으면 자동 통과.                    |
| 결제 페이지 (`/c/pay/...`) 404             | **M2 phase 진행 중** — customer-side 페이지 아직 미구현. 출시 후 활성화 예정.   |
| `/c/store/<UUID>` 404                      | UUID 형식 오류 또는 `auto_approved`가 아닌 매장. 시드 매장 #1 UUID Jayden 확인. |

## 관련 문서

- 전체 Plan: `docs/Plan-v3-mock-first.md`
- 본인 PC 시연: `docs/demo-guide.md`
- 베타 onboarding: `docs/beta-onboarding-checklist.md`
- Stress test: `docs/stress-test-guide.md`
