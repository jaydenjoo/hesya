# 베타 매장 Onboarding 체크리스트

> Phase 1-ζ.7 베타 1~2곳 onboarding 단계에서 매장 사장과 함께 점검하는 항목.
> 본 문서는 사전 작성 — 실제 실행은 Jayden 사업자 등록 완료 후.

## ⚠️ 사전 안내 (베타 모집 시 명시)

1. **베타 = 무료 단계** — 정산·수수료 없음. 단, 외국인 응답 자동화 기능에 한해 제공.
2. **결제 위젯 미포함** — Stripe/Alipay/WeChat 통합은 Phase 1-δ Epic 2 (베타 중반 도입 예정). 베타 초기에는 메시지 자동 응답 + KYC + 대시보드만.
3. **데이터 보존 정책** — 베타 기간 중 매장·고객·메시지·예약 데이터는 Supabase prod에 저장. 베타 종료 후 마이그/삭제 정책은 Jayden과 별도 합의.
4. **베타 종료 조건** — 베타 5곳 모두 1주일 무사고 운영 (Sentry critical 0건 + 외국인 응답 < 3분 + AI 초안 수정률 ≤ 50%) 시 정식 출시 진입.
5. **베타 SLA** — 메시지 응답 < 3분 (자동), 시스템 다운 시 6시간 내 복구, Jayden 직접 연락 가능 (이메일/카카오).

## 0. 사전 준비 (Jayden 측)

- [ ] Jayden 사업자 등록 완료 (개인 또는 법인)
- [ ] `demo.hesya.com` Phase 2 인프라 도입 완료 (ζ.1/ζ.2) — Supabase 신규 + Vercel 신규 + cron 시드 리셋
- [ ] 베타 약정서 초안 작성 (무료·기간·SLA·데이터 정책)
- [ ] 데모 영상 또는 라이브 시연 자료 (`docs/demo-guide.md` 기반 워크스루)

## 1. 매장 측 사전 자료 (사장이 준비)

베타 진입 전 사장에게 안내. 1주일 이내 수집 목표.

### 1-1. 사업자 정보

- [ ] 사업자등록증 사진 또는 PDF (정면, 그림자/광 반사 없음)
- [ ] 통신판매업 신고증 (해당 시)
- [ ] 매장 주소·전화·영업시간 (KYC 수동 심사 대비)
- [ ] 사장 본인 신분증 (베타 약정 동의자 확인용, Hesya는 보관하지 않음)

### 1-2. Instagram 비즈니스 계정

- [ ] IG 일반 계정 → **비즈니스 계정 전환** 완료 (Meta Business Suite 접속 가능)
- [ ] Facebook 페이지 연결 (IG 비즈니스 필수 조건)
- [ ] Meta Business Suite에서 메시지 권한 확인 (`pages_messaging`, `instagram_basic`, `instagram_manage_messages`)

> 💡 IG 일반 계정인 경우 Hesya 연동 불가. 전환은 IG 앱 → 설정 → 계정 → 프로페셔널 계정으로 전환.

### 1-3. 매장 시술 정보 (선택, 분포 KPI 시연용)

- [ ] 주요 시술 5~10종 + 가격 (예: 커트 35,000 / 펌 120,000)
- [ ] 디자이너/스타일리스트 명단 + 가능 언어 (베타 첫 주는 사장만으로도 진행 가능)

## 2. Hesya 측 onboarding 시퀀스

### 2-1. 계정 생성 (1일 이내)

- [ ] 매장 사장 이메일로 Hesya 매직링크 발송 (또는 Google OAuth)
- [ ] 매장 record 생성 (`stores` table) — 상태 `manual_review` 또는 `auto_approved`
- [ ] `store_owners` join row 생성

### 2-2. KYC 심사 (Hesya 측 1~2일)

- [ ] 매장 사장이 제출한 사업자등록증 + 자가 선언 4건 검토
- [ ] `auto_approved` (자동) 또는 `manual_review` (수동 검토 후 승인) 결정
- [ ] 거부 시 사유 + 재제출 안내

### 2-3. IG 연동 (사장 ~ 10분)

- [ ] 사장이 매장 inbox에서 "Instagram 연결" 클릭 → Meta OAuth flow
- [ ] Hesya가 IG access_token 수령 (Vault 저장, RLS 보호)
- [ ] webhook 등록 확인 (메시지 수신 테스트 1건)

### 2-4. 첫 시연 워크스루 (Jayden + 사장 ~ 30분, 화상 또는 대면)

- [ ] `docs/demo-guide.md` 시나리오 A (AI 초안 검수) — 사장이 직접 클릭
- [ ] 시나리오 C (예약 관리) — owner-side CRUD 안내
- [ ] 시나리오 D (대시보드 KPI) — 미응답 / 분쟁 / 시술 분포 explain
- [ ] Q&A — 응답 어조 / 다국어 / 환불 정책 / 결제 도입 시점 등

### 2-5. 베타 운영 1주차 (Jayden 측 daily 점검)

- [ ] Sentry critical error 0건 확인 (매일 아침 09:00)
- [ ] PostHog 이벤트 — `ai_draft_approved` / `ai_draft_edited` / `ai_draft_skipped` 비율 (수정률 ≤ 50% 가설 H1)
- [ ] 외국인 응답 시간 — `messages.created_at` (inbound) → `messages.sent_at` (outbound) p95 < 3분
- [ ] 매장당 일 평균 외국인 메시지 ≥ 5건 도달 여부
- [ ] 1주차 종료 시 사장 만족도 인터뷰 (5분, 카카오톡 또는 전화)

## 3. 베타 5곳 확대 트리거 (ζ.8 진입)

베타 1~2곳 1주 무사고 + 사장 만족도 OK 시:

- [ ] 추가 베타 후보 모집 (외국인 손님 비중 30%+ 매장 우선 — 강남/홍대/이태원 등)
- [ ] 매장별 onboarding 반복 (위 2-1 ~ 2-5)
- [ ] 베타 5곳 채워지면 1주일 stability watch
- [ ] critical metric 모두 목표 도달 시 정식 출시 (Phase 2) 결정

## 4. 베타 종료 시 (정식 출시 진입 전)

- [ ] 베타 매장 5곳에 정식 약정 + 수수료 구조 (TBD) 안내
- [ ] 결제 위젯 도입 완료 (Phase 1-δ Epic 2)
- [ ] 모든 베타 매장 데이터 prod 유지 또는 마이그
- [ ] Sentry/PostHog 이벤트 룰 정식화
- [ ] 약정서 v1 → v2 (수수료 포함)로 갱신

## 5. 비상 절차

| 상황                       | 대응                                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| Sentry critical error 발생 | Jayden 즉시 알림 → 6시간 내 hotfix → 사장 안내                                                 |
| IG webhook 수신 끊김       | Meta Business Suite에서 webhook 재등록 → 매장 inbox 새로고침                                   |
| 외국인 응답 시간 > 3분     | LLM rate limit 확인 → Anthropic quota 점검 → 필요 시 사장에게 임시 수동 응답 안내              |
| 사장이 베타 중단 요청      | 데이터 export 제공 (CSV) → DB 매장 row `inactive` flag → 24시간 내 IG 연동 해제                |
| KYC 자동 승인 실패율 > 40% | data.go.kr 응답 지연 또는 한도 초과 가능성 → Sentry tag `kyc-source` 확인 → 수동 심사 fallback |

## 관련 문서

- 데모 가이드: `docs/demo-guide.md` (시나리오 A~D)
- 개발 계획: `docs/DEVELOPMENT-PLAN.md`
- Phase 1-ζ 상세: `docs/Plan-v2-scenario-B.md`
- PRD: `docs/PRD.md` (v1.2)
- 차단 요소: 메모리 `project_phase_1d_blocked.md` (Jayden 사업자 미보유)
