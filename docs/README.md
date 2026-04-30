# Hesya — K-Beauty Inbound SaaS

> **5분 인덱스 (Single Source of Index)**
> 마지막 업데이트: 2026-04-29
> 상태: 🟡 Day 0 Setup 시작 전 (사전 준비 단계)

---

## 한 줄 정의

전국 K-뷰티 매장(미용업 5종 + 자유업 4종)이 외국인 손님을 직접 잡을 수 있게 해주는 **다국어 통합 운영 SaaS**. 마사지·의료 영역 일체 제외.

---

## 5분 안에 파악하기

### 시장 모멘텀 (2026-04-29 검증)

| 지표                  | 수치                    | 출처                  |
| --------------------- | ----------------------- | --------------------- |
| 외국인 환자 (2025)    | **201만 명** (+72% YoY) | 보건복지부 2026.04.24 |
| 의료관광 총액         | **12.5조 원**           | 산업연구원 2026.04    |
| 부산 1Q 외국인 거래액 | **+530%**               | 크리에이트립 2026.04  |
| Phase 1 Y3 ARR 목표   | **약 17.5억**           | PRD § 8.2             |

### Not Doing (가장 중요한 결정)

- ❌ 마사지·스파·테라피 (의료법 88조 1호, **5년 이하 징역 또는 5천만 원**)
- ❌ 한방 시술·한의원 (의료해외진출법)
- ❌ 의료기기 매장 (LED·고주파·레이저)
- ❌ 자체 PG 등록·시술 쿠폰 직판매·자체 의료광고
- 📄 상세: `PRD.md` § 0.5

### 차별화 (Hamilton Helmer 7 Powers)

- **Counter-Positioning**: 강남언니=의료 SaaS / 크리에이트립=마켓플레이스 / **Hesya=비의료 미용업 매장 락인 SaaS**
- **시장 공백**: 비의료 미용업 5종 + 자유업 4종 SaaS = **선두 부재**, 18~24개월 골든 윈도우

---

## 📚 문서 인덱스 (이해관계자별)

| 누구                           | 읽을 문서                                     | 읽는 이유                     |
| ------------------------------ | --------------------------------------------- | ----------------------------- |
| **투자자·VC**                  | `PRD.md` § 0~3 + § 8                          | 시장·페르소나·매출 시뮬레이션 |
| **CTO 후보** (2026-06 합류)    | 4개 모두                                      | 전체 구조                     |
| **변호사**                     | `PRD.md` § 0.5 + § 12                         | Not Doing + 법적 검증 10항목  |
| **디자이너·UX** (2026-08 합류) | `PRD.md` § 5 + `DECISIONS.md` § 1.4·1.10·1.11 | 플로우 + UI 결정              |
| **개발자** (Lead·Worker)       | `DECISIONS.md` + `DEVELOPMENT-PLAN.md`        | 구현                          |
| **Jayden**                     | 4개 모두                                      | 의사결정                      |

---

## 🗂️ 4개 문서 빠른 참조

### 1. `README.md` (이 파일)

- 5분 안에 전체 파악
- 이해관계자별 문서 안내
- 현재 상태 요약

### 2. `PRD.md` — What & Why

| 섹션 | 내용                                                     |
| ---- | -------------------------------------------------------- |
| § 0  | Executive Summary, Not Doing                             |
| § 1  | 문제 (매장·고객)                                         |
| § 2  | 페르소나 (S1~S5, C1~C3)                                  |
| § 3  | 요구사항 (P0/P1/P2)                                      |
| § 4  | 8 모듈 (인박스·결제·예약·통역·환급·후기·대시보드·마케팅) |
| § 5  | 5종 플로우 다이어그램                                    |
| § 6  | 아키텍처·기술 스택                                       |
| § 7  | DB 스키마                                                |
| § 8  | 가격·매출                                                |
| § 9  | 마일스톤 (Day 1~180)                                     |
| § 10 | KPI                                                      |
| § 11 | 리스크 (R1~R12)                                          |
| § 12 | Open Questions (변호사 자문 10건)                        |
| § 13 | Epic→Task 분해                                           |

### 3. `DECISIONS.md` — How

| 섹션       | 내용                                                                                |
| ---------- | ----------------------------------------------------------------------------------- |
| § 0        | Executive Summary, 13개 결정 종합표                                                 |
| § 1.1~1.13 | 카테고리별 결정 상세 (인증·RBAC·콘텐츠·알림·파일·관리자·API·SEO·a11y·스테이징·백업) |
| § 2        | 비용 종합표 (단계별, 매장당 분담)                                                   |
| § 3        | 시간·일정 영향                                                                      |
| § 4        | v1.0 → v1.1 변경 영향 정산                                                          |
| § 5        | 검증 출처 (1차 출처 9건)                                                            |
| § 6        | 다음 액션                                                                           |
| § 7        | 종합 평가                                                                           |

### 4. `DEVELOPMENT-PLAN.md` — When & Who

| 섹션 | 내용                                                       |
| ---- | ---------------------------------------------------------- |
| § 0  | Executive Summary, BLUF                                    |
| § 1  | DBIAV 프레임워크 (설계·빌드·검증·에이전트·축적)            |
| § 2  | Epic 의존성 분석 + 병렬화 매트릭스                         |
| § 3  | Epic별 Task 분해 (Setup·1·2·3·4·9·12 + Phase 1.5)          |
| § 4  | tmux 6창 병렬 작업 설계 + Git Worktree 6개                 |
| § 5  | 검증 게이트 (자동 4단 + 보안 + Day 30 베타)                |
| § 6  | Day 1~37 간트차트 + 단계별 도입 (R2 Day 0, Staging Day 30) |
| § 7  | 폴더 구조                                                  |
| § 8  | 리스크 대응 (DR1~DR7)                                      |

---

## 핵심 의사결정 빠른 참조

| 의사결정                   | 위치                      | 결과                                                    |
| -------------------------- | ------------------------- | ------------------------------------------------------- |
| **무엇을 만들지** (8 모듈) | PRD § 4                   | 인박스·결제·예약·통역·환급·후기·대시보드·마케팅         |
| **무엇을 안 만들지**       | PRD § 0.5                 | 마사지·의료·한방·의료기기 일체                          |
| **누구에게** (페르소나)    | PRD § 2                   | 매장 5종 (S1~S5) + 고객 3종 (C1~C3)                     |
| **인증**                   | DECISIONS § 1.1           | Better Auth + Supabase + Google + 자체 가입             |
| **DB·스토리지**            | DECISIONS § 1.6 + PRD § 7 | Supabase Pro + Cloudflare R2 백업                       |
| **결제 통합**              | PRD § 4 모듈 2            | Stripe + Alipay + WeChat + LINE Pay + PayPay + UnionPay |
| **관리자 패널**            | DECISIONS § 1.7~1.8       | 자체 빌드 + 8종 운영자 플로우 풀세트                    |
| **일정**                   | DEVELOPMENT-PLAN § 6      | Day 1~37 (5주, 안전 여유)                               |
| **병렬 작업**              | DEVELOPMENT-PLAN § 4      | tmux 6창 + Git Worktree 6개 + Agent Teams               |

---

## 💰 비용 한눈에

| 단계              | 월 비용       | 매장당 분담                     |
| ----------------- | ------------- | ------------------------------- |
| Day 0 (Setup)     | 약 11만 원    | —                               |
| Day 30 (베타 5곳) | 약 32만 원    | 약 7,800원 (Pro 19.9만 원의 4%) |
| 매장 50곳         | 약 189만 원   | 약 780원                        |
| 매장 100곳 🟡     | 약 386만 원   | 약 1,800원                      |
| Y3 600곳 🟡       | 약 2,244만 원 | 약 300원                        |

**인프라 마진**: Y3 약 84% (AI-native SaaS 업계 평균 65% 대비 양호) ✅

📄 상세: `DECISIONS.md` § 2

---

## 🛠️ 기술 스택

```
Frontend:    Next.js 16.2.4 LTS (App Router + Turbopack + React 19.2)
             + Tailwind CSS v4 + shadcn/ui + Pretendard 폰트
DB·Auth·Storage·Realtime: Supabase Pro
인증:         Better Auth + Google OAuth + 자체 가입
AI:           Claude Sonnet 4.6 (일상) + Opus 4.7 (Vision·복잡 분석)
워크플로우:    n8n on Elest.io
결제:         Stripe Korea + Alipay+ Connect + WeChat Pay + LINE Pay + PayPay + UnionPay
모니터링:     Sentry + PostHog
백업:         Day 0 Cloudflare R2 외부 → 매장 50~100곳 PITR 28일
배포:         Vercel Pro
RBAC:         5단 풀 (Admin·StoreOwner·Designer·Staff·Customer)
다국어:       next-intl + 5개 언어 (ko, en, ja, zh-CN, zh-TW, vi)
콘텐츠:       Tiptap OSS
알림:         PWA Web Push + 이메일 폴백 (Resend Free)
API:          Server Actions + Route Handlers (Next.js 16 권장)
SEO:          C+ 풀 + 핵심 AEO (FAQ 스키마, 매장별 영문 요약)
a11y:         WCAG AA 풀 + 핵심 페이지 AAA
```

📄 상세: `DECISIONS.md` § 1

---

## 📅 일정 한눈에

```
Week 1 (Day 1~7)   — Setup (Better Auth, R2 백업, OAuth 셋업) + 인터뷰 30곳
Week 2 (Day 8~14)  — Epic 1 (인박스) + Epic 3 (예약) + Epic 9 (KYC) 시작
Week 3 (Day 15~21) — + Epic 4 (대시보드) + Epic 12 (관리자 패널) 시작
Week 4 (Day 22~28) — + Epic 2 (결제) + 통합 테스트 + Day 28: Staging 셋업
Week 5 (Day 29~37) — Epic 12 완료 + SEO·a11y + Day 37: 베타 5곳 배포
```

📄 상세: `DEVELOPMENT-PLAN.md` § 6

---

## 🚦 현재 상태

### ✅ 확정

- **13개 기술 결정** (DECISIONS v1.1 FINAL, 검증 완료)
- **일정**: Day 1~37 (5주, 안전 여유)
- **OAuth 범위**: Phase 1은 자체 가입 + Google만 → Phase 1.5에서 Kakao·Apple·LINE·WeChat 추가

### ⏳ 미정

- **시드 매장 5곳 위치** → 인터뷰 30곳 결과 후 결정 (Day 1~14)
- **Day 0 Setup 시작 일자** → Jayden 협의 필요

### 🟢 즉시 시작 가능 (D3 결정 전)

- GitHub Private Repo 생성
- Cloudflare 계정 + R2 버킷
- Google Cloud Console + OAuth Client
- 도메인 결정·구매
- Better Auth 공식 문서 사전 학습 (Lead 3~4h)

---

## 🔄 변경 이력

| 버전                  | 일자       | 변경                                                   |
| --------------------- | ---------- | ------------------------------------------------------ |
| README v1.0           | 2026-04-29 | 단일 인덱스 신규 작성                                  |
| PRD v1.2              | 2026-04-29 | 1차 출처 13개 카테고리 검증 반영                       |
| DECISIONS v1.0        | 2026-04-29 | 4 라운드 + 단계별 도입 결정                            |
| DECISIONS v1.1 FINAL  | 2026-04-29 | 검증 후 Q1·Q10·Q11 변경 (Better Auth, SEO C+, a11y B+) |
| DEVELOPMENT-PLAN v1.2 | 2026-04-29 | DECISIONS v1.1 FINAL 반영 통합본                       |

---

## 📂 폴더 구조 (계획)

```
hesya/                                   # 프로젝트 루트
├── README.md                              # ← 이 파일
├── PRD.md                                 # 비즈니스·시장·페르소나
├── DECISIONS.md                           # 기술 결정·비용·검증
├── DEVELOPMENT-PLAN.md                    # 일정·Task·tmux 설계
├── apps/
│   └── web/                               # Next.js 16.2.4 메인 앱
├── packages/
│   ├── database/                          # Supabase 마이그레이션
│   ├── shared-types/                      # TypeScript + Zod
│   ├── shared-ui/                         # 디자인 시스템 v3.0
│   └── translations/                      # 5개 언어 메시지
├── n8n-workflows/                         # n8n 워크플로우 JSON
├── supabase/
│   └── functions/                         # Edge Functions
├── scripts/
│   ├── start-agent-team.sh                # tmux 6창 launch
│   ├── validate.sh                        # 자동 검증 4단
│   └── security-validate.sh               # 🔴 보안 게이트
├── .claude/
│   ├── agents/                            # 서브에이전트 정의
│   ├── settings.json                      # taskBudgets 등
│   └── hooks.json
├── docs/
│   ├── learnings.md                       # 컴파운드 지식
│   └── PROGRESS.md                        # 매일 진행 상황
└── AGENTS.md                              # Next.js 16 자동 생성
```

---

## 🎯 다음 액션 (Jayden 결정 시)

1. ✅ 4개 문서 (README + PRD + DECISIONS + DEVELOPMENT-PLAN) 검토·승인
2. ⏳ Day 0 Setup 시작 일자 결정 (D3)
3. ⏳ 사전 준비 진행 (GitHub Repo, Cloudflare R2, Google OAuth, 도메인)
4. ⏳ 인터뷰 30곳 + 시드 매장 5곳 LOI 진행 (Day 1~14)
5. ⏳ Day 0 Setup 24 Task 시작 (Better Auth + Next.js 16.2.4)

---

## 검증 출처 종합

🟢 **9건 1차 출처 검증 완료** (2026-04 기준):

- 보건복지부, 산업연구원, 크리에이트립 (시장)
- Supabase, Cloudflare R2, Vercel, WorkOS (가격)
- Better Auth, LogRocket, Search Engine Journal, W3C WCAG (기술 결정)

📄 상세: `DECISIONS.md` § 5

---

**문서 끝.**

> 어떤 문서를 봐야 할지 모르겠다면 이 README를 먼저 읽으세요.
> 결정·합의된 사항은 PRD·DECISIONS에 기록되어 있습니다.
> 실제 구현·일정은 DEVELOPMENT-PLAN에 있습니다.
