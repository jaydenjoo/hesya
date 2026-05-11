# 베타 데모 가이드

> 본인 PC + 휴대폰에서 가상 매장 / 사장 / 외국인 고객 화면을 클릭 시연하는 절차.
> 베타 매장이 아직 없는 단계의 가상 시연용. **외부 공개 X**.

## ⚠️ 안전 (먼저 읽기)

1. **로컬 DB만** — `HESYA_TEST_DATABASE_URL`은 `localhost` / `127.0.0.1` / `test` / `supabase.local`만 허용. prod URL이 들어가면 시드 스크립트가 throw하고 종료.
2. **시드 = DB 전체 reset** — `pnpm seed:demo` 실행 시 로컬 DB의 테스트 테이블이 모두 비워짐. 보존하고 싶은 데이터가 있으면 먼저 백업.
3. **IG 토큰은 mock** — 실제 Instagram API 호출은 일어나지 않음. `pending_review` 초안 승인 시 IG mock 서버로 전송 (port 4201).
4. **ngrok 시연 끝나면 즉시 Ctrl+C** — 터널이 살아 있는 동안 누구나 사장 입장으로 접근 가능 (`E2E_AUTH_USER_ID` bypass 활성). 시연 끝나면 바로 종료.

---

## 사전 준비 (한 번만)

### 1. 로컬 Supabase 기동

```bash
cd /Volumes/jayden-ssd/projects/hesya
supabase start
```

처음 실행 시 약 2분 소요 (Docker 이미지 pull). 이후엔 5~10초.

> 로컬 Supabase는 `127.0.0.1:54322`에서 PostgreSQL을 노출. URL 형태:
> `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

### 2. `.env.local` 환경변수 설정

`apps/web/.env.local`에 다음이 있어야 함 (이미 설정되어 있으면 skip):

```bash
# 시드 스크립트가 사용 (로컬만 허용 — prod URL은 throw)
HESYA_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Next.js dev 서버가 사용 (로컬 시연 시 동일하게)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

> 비유 — `HESYA_TEST_DATABASE_URL`은 "안전 라벨이 붙은 테스트 DB 주소". 시드 스크립트가 이 라벨을 확인하고 prod 주소면 거부함. `DATABASE_URL`은 Next.js 서버가 평소 보는 주소.

### 3. ngrok 설치 (휴대폰 시연용)

```bash
brew install ngrok/ngrok/ngrok
ngrok config add-authtoken <token>   # https://dashboard.ngrok.com/auth/your-authtoken
```

> 무료 플랜은 매번 URL이 바뀜. 휴대폰에서 한 번씩 새 URL 입력 필요.

---

## 시연 시작 (매번)

### 터미널 1 — 시드 + 사장 dev 서버

```bash
pnpm seed:demo
pnpm dev:demo
```

- `seed:demo`: 가상 매장 2개, 사장 1명, 외국인 고객 3명 (영/일/중), AI 초안 6건을 로컬 DB에 시드.
- `dev:demo`: IG mock 서버(port 4201) 백그라운드 기동 + Next.js dev 서버(port 4200) foreground. `E2E_AUTH_USER_ID` / `E2E_ADMIN_EMAIL` / `IG_API_BASE_URL` 자동 주입 → 사장 + 운영자 인증 모두 우회 + IG 발송이 mock으로 향함. Ctrl+C 시 mock 서버도 같이 종료.

브라우저에서:

- 사장 inbox: `http://localhost:4200/ko/store/inbox`
- 운영자 큐: `http://localhost:4200/ko/admin/store-verifications`

### 터미널 2 — ngrok 터널 (휴대폰 시연 시)

```bash
pnpm tunnel
```

출력 예시:

```
Forwarding   https://abcd-1234-5678.ngrok-free.app -> http://localhost:4200
```

휴대폰 브라우저에 위 ngrok URL을 입력하면 본인 PC와 동일한 사장 화면 접속.

> 📱 휴대폰 접속 시 주소 끝에 `/ko/store/inbox`를 붙여야 사장 inbox로 직행.

---

## 시연 시나리오

### A. 사장 입장 — AI 초안 검수 모드 (Phase 1-β H1)

1. `/ko/store/inbox` 진입 → 좌측에 외국인 고객 3명 (영/일/중)의 thread 노출.
2. thread 클릭 → 우측에 inbound 메시지 + AI 초안 (`pending_review`) 표시.
3. **DraftReviewPanel** 가시. 옵션 3가지:
   - **승인 + 전송** — 그대로 IG mock으로 발송, DB `messages.status='sent'`.
   - **수정 + 전송** — 텍스트 편집 후 발송 (`edited_from_ai=true` 기록 — H1 수정률 데이터).
   - **건너뛰기** — 초안 폐기 (`draft_status='skipped'`).
4. 발송된 메시지는 thread 마지막에 outbound로 표시.

> H1 = "사장이 AI 초안을 50% 이하로만 수정한다"는 가설. 위 3가지 액션이 H1 수정률 측정의 데이터 경로.

### B. 운영자 입장 — KYC 수동 심사

1. `/ko/admin/store-verifications` 진입 → 사장 inbox와 동일하게 **로그인 우회** (`pnpm dev:demo`가 `E2E_ADMIN_EMAIL`을 자동 주입해 `requireAdminEmail` 가드 통과).
2. 큐에 `manual_review` 상태 매장 1건 (Hesya 데모 네일샵) 노출.
3. 클릭 → 사업자 정보 + 자가 선언 4건 + 승인/거부 버튼.

> ⚠️ 데모상 사장 계정과 운영자 계정이 같은 user (`demo-owner@hesya.local`)로 시뮬됨. 실제 베타에서는 분리된 두 계정 필요. `NODE_ENV !== "production"` 가드로 prod에서는 절대 작동 안 함.

### C. 사장 입장 — 예약 관리 (Phase 1-δ Epic 3 owner-side)

1. `/ko/store/bookings` 진입 → 예약 10건 list. 컬럼 5개 (예약일시 / 시술 / 디자이너 / 금액 / 상태).
2. **5-status filter pill**: `all / scheduled / completed / no_show / cancelled`. 클릭 시 query param 갱신 + 서버 재조회.
3. row 클릭 → `/ko/store/bookings/[id]` 상세 진입 → 정보 7행 (예약일시 / 시술 / 디자이너 / 금액 / 예약금 / 결제방법 / 상태) + 3 terminal action 버튼.
4. **3 terminal action**: 완료 (`completed`) / 노쇼 (`no_show`) / 취소 (`cancelled`). 클릭 시 `updateBookingStatusAction` 호출 → DB 갱신 → revalidate. 이미 terminal 상태면 액션 버튼 hide.

> ✅ owner-side CRUD만 구현. **customer-side 셀프 예약 + 결제는 Phase 1-δ Epic 2/ζ 단계**.
> ⚠️ 데모 예약은 모두 단일 첫 고객에게 round-robin. 베타에서는 IG DM 컨버전 후 실 고객 매칭.

### D. 사장 입장 — 대시보드 KPI (Phase 1-ε Epic 4)

1. `/ko/store/dashboard` 진입 → 12 KPI grid. 5개 active + 7개 coming-soon.
2. **Active KPI 5종**:
   - 미응답 메시지 (Epic 1 wire)
   - 분쟁 (Epic 12.4 wire — 시드된 1건)
   - KYC 상태 (Epic 9 wire — 매장 #1 `auto_approved`)
   - **시술 분포 donut** (Recharts, hesya 6색 팔레트) — 본 월 예약 기반
   - **디자이너 분포 donut** — 본 월 예약 기반
3. coming-soon 7종: 월 매출 / 객단가 / 재방문률 / 노쇼율 / 국적 분포 등 — Epic 2/3 customer-side 도입 시 자연 활성화.

> 💡 시나리오 C에서 예약 상태를 `completed`로 바꾼 후 D 새로고침 → 시술/디자이너 분포 donut에 즉시 반영됨. 같은 데이터셋의 2-route 활용 시연.

---

## 시드 데이터 명세

| 항목                   | 내용                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| 사장 user id           | `00000000-0000-0000-0000-000000000001` (= `E2E_AUTH_USER_ID`)                                    |
| 매장 #1                | "Hesya 데모 헤어샵 (강남)" — `auto_approved`, hair_general                                       |
| 매장 #2                | "Hesya 데모 네일샵 (수동 심사 대기)" — `manual_review`, nail                                     |
| IG 연동                | 매장 #1에만 (mock token, account `ig_demo_auto`)                                                 |
| 고객 #1                | 영어 — "Hi! Do you have time for a haircut today at 3pm?"                                        |
| 고객 #2                | 일본어 — "こんにちは!明日カットの予약は可能ですか?"                                              |
| 고객 #3                | 중국어 — "你好,今天下午4点可以做烫发吗?"                                                         |
| AI 초안                | 각 고객당 1개 (`status=ai_draft`, `draft_status=pending_review`)                                 |
| 시술 5종 (매장 #1)     | 커트 35,000 / 펌 120,000 / 염색 95,000 / 트리트먼트 55,000 / 두피 케어 70,000 (₩, ko·en·ja 라벨) |
| 디자이너 3명 (매장 #1) | A (ko·en) / B (ko·ja) / C (ko)                                                                   |
| 예약 10건 (매장 #1)    | 시술·디자이너 round-robin, 상태 mix — scheduled 3 / completed 5 / no_show 1 / cancelled 1        |
| 분쟁 #1 (매장 #1)      | `status=open`, category `complaint` (Epic 12.4 시연용)                                           |
| API 정책 알림 #1       | `source=meta-blog`, `status=new` (Epic 12.8 admin 큐 시연용)                                     |
| 메시징 윈도우          | 모든 conversation은 23시간 후 만료 (활성)                                                        |

`pnpm seed:demo` 재실행 시 위 상태로 매번 reset됨.

---

## 트러블슈팅

| 증상                                             | 원인 / 해결                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HESYA_TEST_DATABASE_URL은 localhost/...만 허용` | `.env.local`이 prod URL을 가리키는 중. 위 2번 세팅 확인.                                                                                                                                                                                                                                                                         |
| 시드는 됐는데 inbox가 비어 있음                  | dev 서버에 `E2E_AUTH_USER_ID`가 안 박힘 → `pnpm dev:demo`가 아닌 `pnpm dev`로 실행했을 가능성.                                                                                                                                                                                                                                   |
| AI 초안 승인 클릭 시 "메시징 윈도우 만료" 에러   | 시드 후 24시간 이상 경과 → `pnpm seed:demo` 재실행.                                                                                                                                                                                                                                                                              |
| ngrok URL 접속 시 ERR_NGROK_3200                 | ngrok 무료 플랜 동시 터널 1개 제한. 다른 ngrok 프로세스 종료 후 재시도.                                                                                                                                                                                                                                                          |
| `vault.create_secret` 에러                       | 로컬 Supabase가 안 켜졌거나 vault extension 누락. `supabase status` 확인 후 `supabase start`.                                                                                                                                                                                                                                    |
| 승인+전송 클릭 후 panel 사라지지 않고 stuck      | IG mock 서버 미가동 → `accept-ai-draft`가 실 IG API 호출 fail → `draft_status='approved'` stuck. `pnpm dev:demo`로 띄우면 mock(port 4201)이 자동 기동. 이미 stuck된 row는 시드 재실행 또는 SQL `UPDATE messages SET draft_status='pending_review' WHERE direction='outbound' AND status='ai_draft' AND draft_status='approved';` |
| `pnpm seed:demo` 시 connection slots 부족        | dev 서버 + Supabase Studio가 connection 점유. 시드 전 dev 서버 일시 종료(Ctrl+C) 후 시드 → 재시작.                                                                                                                                                                                                                               |

---

## Phase 2 예고 — 외부인 데모 환경 (Phase 1-ζ.1/ζ.2)

본 가이드는 **본인 PC 시연용**. 외부인이 직접 데모 URL을 클릭해 사장 입장을 시뮬해야 한다면 다른 인프라가 필요:

- 옵션 C: `demo.hesya.com` + 신규 Supabase 프로젝트 + 매일 자정 cron 시드 리셋 (~$25/월)
- **트리거 조건** (3개 동시 충족 시 ζ.1 실행):
  1. Jayden 사업자 등록 완료 (현재 보류 — `project_phase_1d_blocked.md`)
  2. 베타 매장 후보 1~2곳 확보 (직접 미팅 또는 도큐먼트 공유)
  3. δ Epic 2 결제 인프라 진입 (Stripe Connect onboarding 최소 1매장 완료)
- **사전 승인 필수**: Supabase 신규 프로젝트 + Vercel 신규 프로젝트 생성 = 외부 리소스 = Jayden 명시 승인 (`feedback_no_unauthorized_resource_creation.md`)
- 본 가이드는 ζ.1 도입 시 `demo.hesya.com` 도메인 + 매직링크 로그인 안내 섹션을 추가하는 방식으로 진화 예정.

자세한 설계는 `docs/learnings.md` L-081 참조.
