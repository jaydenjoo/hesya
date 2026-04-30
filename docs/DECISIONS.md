# Visit K Phase 1 — 최종 결정 보고서 (DECISIONS v1.1 FINAL)

> **문서 버전**: v1.1 FINAL (검증·수정 완료)
> **작성일**: 2026-04-29
> **이전 버전**: v1.0 (라운드 1~4 결정) → **v1.1 (검증 후 Q1·Q10·Q11 변경)**
> **검증 일자**: 2026-04-29 (1차 출처 9건 웹 검증 완료)
> **이 문서의 역할**: Visit K Phase 1 기술 결정 단일 진실 공급원 (Single Source of Truth)
> **다음 단계**: Day 0 Setup 즉시 시작 가능 상태

---

## 0. Executive Summary (BLUF)

### 0.1 한 줄 요약
**13개 결정 모두 OSS / 기존 인프라 안 → 추가 SaaS 0개 / 시간 투자 +154h (검증 후 -20h 절약) / 단계별 안전 도입**

### 0.2 13개 최종 결정 (검증 완료)

| # | 카테고리 | 최종 결정 | 월 비용 | 시간 |
|---|---|---|---|---|
| 1 | 인증 ⚠️ **변경됨** | **Better Auth + Supabase DB** | $0 | +8h |
| 2 | RBAC | B. 5단 풀 (Admin·StoreOwner·Designer·Staff·Customer) | $0 | 기본 |
| 3 | 멀티테넌시 | B. Phase 1부터 멀티 매장 | $0 | +8h |
| 4 | 콘텐츠 에디터 | B. Tiptap OSS | $0 | +6h |
| 5 | 알림 | D. PWA Web Push + 이메일 폴백 | $0 | +6h |
| 6 | 파일 업로드 | A. Supabase Storage 단독 | $0 | 기본 |
| 7 | 관리자 패널 | E. 자체 빌드 + Claude Code Agent Teams | $0 | 50~60h |
| 8 | 운영자 플로우 | C. 8종 풀세트 | $0 | +50h |
| 9 | API | C. Server Actions + Route Handlers | $0 | 기본 |
| 10 | SEO ⚠️ **변경됨** | **C+ SEO 풀 + 핵심 AEO 요소만** | $0 | +16h |
| 11 | 접근성 ⚠️ **변경됨** | **B+ AA 풀 + 핵심 페이지 AAA** | $0 | +16h |
| 12 | 스테이징·CI/CD | 단계별 (Day 30에 Staging 추가) | Day 30~ +$25 | +1일 (Day 30) |
| 13 | DB 백업 | 단계별 (Day 0 R2 → 매장 50~100곳 PITR) | Day 0 +$0~3, 매장 50~100곳 +$100 | +6h (Day 0) |
| | **합계** | | **+$28/월 (Day 30)** | **+약 154h** |

### 0.3 단계별 비용 흐름

```
Day 0 (Setup)     ──► +$0~3/월   (R2 외부 백업, 거의 무료)
Day 30 (베타 5곳) ──► +$28/월     (Staging 환경 추가)
매장 50~100곳     ──► +$128/월    (PITR 28일 추가)
매장 600곳 (Y3)   ──► +$128/월    (그대로, 매장당 분담 ~230원)
```

### 0.4 v1.1에서 v1.0 대비 변경된 3개 결정 — 검증 근거

| Q | 변경 이유 | 1차 출처 |
|---|---|---|
| Q1 | Auth.js팀이 2025-09 Better Auth로 합류, Auth.js는 보안 패치 모드. Auth.js팀 자체가 신규 프로젝트엔 Better Auth 권장 | better-auth.com/blog/authjs-joins-better-auth, LogRocket 2026-04 |
| Q10 | Search Engine Journal 30만 도메인 연구: llms.txt 채택 10.13%, AI 인용 효과 미미. Question-led H2가 +28% AI 인용 효과 검증 | Search Engine Journal 2026, Growth Engines 12 B2B 사례 |
| Q11 | W3C 자체가 WCAG AAA "일부 콘텐츠 달성 불가능" 명시. AA가 법적 표준. 다국어 음성은 Phase 1.5 모듈 4와 통합 | W3C WCAG 2.2 공식 |

---

## 1. 카테고리별 최종 결정 상세

### 1.1 인증 & 권한 (#1) — Better Auth + Supabase DB ⚠️ v1.1 변경

**비용**: $0/월 (OSS, MIT)
**셋업**: +8h (Auth.js v5 대비 -4h, 더 단순)

**Better Auth 선택 근거**:
- 🟢 Auth.js팀이 2025-09 Better Auth로 합류 (better-auth.com/blog/authjs-joins-better-auth)
- 🟢 Auth.js v5는 Beta 상태 + 보안 패치 모드만 (출시 일정 미정)
- 🟢 Better Auth는 **Stable** 상태, 활발히 개발
- 🟢 Next.js 16 `proxy.ts` 완전 호환
- 🟢 Drizzle ORM 직접 통합 (어댑터 불필요)
- 🟢 **Framework-agnostic**: Phase 2 React Native 마이그레이션 비용 0
- 🟢 Passkey/WebAuthn 내장
- 🟢 즉시 세션 무효화 가능 (DB 직접)

**구현 영역**:
- `apps/web/lib/auth.ts` — Better Auth 설정
- `apps/web/app/api/auth/[...all]/route.ts` — 핸들러
- `packages/database/migrations/0003_auth_tables.sql` — 사용자·세션·계정 테이블
- Supabase는 DB·세션 저장소로 활용

**제공 기능**:
- Passkey/WebAuthn (내장)
- 소셜 로그인: Google, Apple, GitHub, LINE, generic-oauth-plugin (Kakao·WeChat 등)
- MFA (TOTP + WebAuthn)
- 이메일·비밀번호 + 매직 링크
- 세션 관리 (DB 기반, 즉시 무효화)

**Auth.js v5 대비 마이그레이션 부담**:
- Day 0 Setup이라 마이그레이션 없음 (그린필드)
- 기존 Auth.js v4 사용 경험은 약간 도움 (개념 유사)
- 학습 곡선 약 3~4h (Better Auth 공식 문서 + Next.js 16 가이드)

**Phase 2 React Native 시 영향**:
- Better Auth는 framework-agnostic → 동일 API로 React Native 사용
- Auth.js v5 선택 시 별도 구현 필요 → **Better Auth로 미래 비용 0**

---

### 1.2 사용자 관리 / RBAC (#2) — B. 5단 풀 (변경 없음)

**비용**: $0/월

**5단 액터 매트릭스**:

| 역할 | 핵심 권한 |
|---|---|
| **Admin** (Visit K 운영자) | KYC 승인, 분쟁 처리, 매장 차단, 8종 운영자 플로우 |
| **StoreOwner** (매장 사장) | 자기 매장 전체 R/W, 직원·디자이너 관리 |
| **Designer** (디자이너) | 자기 시술·예약 R/W, 포트폴리오 |
| **Staff** (매장 직원) | 자기 매장 인박스·예약 R/W |
| **Customer** (외국인 고객) | 자기 데이터 R/W |

**구현 파일**:
- `packages/shared-types/src/rbac.ts` — Role enum + permission matrix
- `apps/web/proxy.ts` — 역할 체크 (Next.js 16 — middleware.ts 아님)
- Supabase RLS 정책 — 매장·고객 격리

---

### 1.3 멀티테넌시 (#2 확장) — B. Phase 1부터 멀티 매장 (변경 없음)

**비용**: $0/월 (+8h)

**모델**: 1명 사장 = 여러 매장 (`store_owners` 조인 테이블)

```sql
CREATE TABLE store_owners (
  user_id UUID REFERENCES auth_users(id),
  store_id UUID REFERENCES stores(id),
  role TEXT CHECK (role IN ('owner', 'manager')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, store_id)
);
```

---

### 1.4 콘텐츠 에디터 (#3) — B. Tiptap OSS (변경 없음)

**비용**: $0/월 (MIT)
**셋업**: +6h

**활용 영역**:
- 매장 소개 페이지 (5개 언어)
- 시술 메뉴 상세
- 디자이너 포트폴리오 설명
- 인박스 답변 작성 (Epic 1 통합)

**Phase 2 후보**: Tiptap Pro ($149+/월) — 협업 에디팅, 매장 100곳 이후

---

### 1.5 알림 시스템 (#4) — D. PWA Web Push + 이메일 폴백 (변경 없음)

**비용**: $0/월 (OSS / Resend Free 3K/월)
**셋업**: +6h

**3-Tier 도달 전략**:
1. PWA Web Push (즉시)
2. 이메일 폴백 (Resend Free, PWA 미설치 시 자동)
3. 인앱 벨 아이콘 (대시보드)

**Phase 1.5 추가 검토**: 카카오 알림톡 (월 21~24만 원) — 매장 100곳 도달 시 ROI 재평가

---

### 1.6 파일 업로드 (#5) — A. Supabase Storage 단독 (변경 없음)

**비용**: $0/월 (Supabase Pro 100GB 포함)

**저장 영역 + RLS**:

| 영역 | RLS | 비고 |
|---|---|---|
| KYC: 영업신고증 | 🔴 Admin·StoreOwner 본인만 | OCR 후 30일 후 원본 삭제 |
| 디자이너 포트폴리오 | 매장 단위 공개 | — |
| 고객 시술 참고 사진 | 본인만 | Vision 분석 후 7일 후 자동 삭제 |
| 시술 결과 (Before/After) | 매장 + 동의 고객 | 동의 필수 |

**Phase 2 마이그레이션 권장**: 매장 100곳 시 R2 + Storage 하이브리드

---

### 1.7 관리자 패널 (#7) — E. 자체 빌드 + Agent Teams (변경 없음)

**비용**: $0/월
**시간**: 50~60h

**Epic 12 신규 추가**:

```
apps/web/app/(admin)/
├── kyc-queue/        — 매뉴얼 검토 큐
├── reports/          — 외부 신고 처리
├── disputes/         — 분쟁 처리
├── revalidations/    — 분기별 재검증
├── payments/         — 결제 정산·이상 거래
├── ai-quality/       — AI 응답 정확도
├── api-policy/       — API 정책 변경 대응
└── store-deletion/   — 매장 해지·데이터 삭제
```

**tmux Window 5 신규**: `worker-admin` (Sonnet 4.6)
**Worktree**: `visit-k-admin` (신규)

---

### 1.8 운영자 플로우 8종 풀세트 (#7 확장) — C. 8종 (변경 없음)

**비용**: $0/월 (+50h)

**8종 + SLA**:

| # | 플로우 | 트리거 | SLA |
|---|---|---|---|
| 1 | KYC 매뉴얼 검토 큐 | LOCALDATA 매칭 실패·OCR<70%·키워드 의심 | 24~48h |
| 2 | 외부 신고 → 매장 차단 | 고객·경쟁사 제보 | 6h 긴급 / 72h 일반 |
| 3 | 분쟁 처리 (노쇼·환불) | 매장↔고객 분쟁 | 5영업일 |
| 4 | 분기별 재검증 결과 | LOCALDATA 영업 상태 변경 | 7일 |
| 5 | 결제 이상 거래 🔴 | 환불 비율·정산 불일치 | 매일 |
| 6 | AI 응답 정확도 | 정확도 < 90% | 즉시 |
| 7 | API 정책 변경 | 인스타·왓츠앱 ToS (n8n RSS) | 7일 |
| 8 | 매장 해지·데이터 삭제 | 해지·약관 위반 | 30일 (법정 기한) |

---

### 1.9 API 설계 (#14) — C. Server Actions + Route Handlers (변경 없음)

**비용**: $0/월 (Next.js 16 내장)

**구분**:
- **Server Actions** (`'use server'`): 매장·고객·관리자 페이지 → `apps/web/lib/actions/`
- **Route Handlers** (`route.ts`): 외부 webhook (인스타·왓츠앱·Stripe·Alipay·WeChat·국세청·LOCALDATA) → `apps/web/app/api/`

**보안 강화**: Better Auth + Server Actions 조합으로 CVE-2025-29927 (Next.js middleware bypass) 영향 최소화. Better Auth는 DB 기반 세션 검증으로 middleware-only 의존 회피.

---

### 1.10 SEO (#9) — C+ SEO 풀 + 핵심 AEO 요소 ⚠️ v1.1 변경

**비용**: $0/월 (모든 도구 OSS / 무료 등록)
**시간**: +16h (이전 D 24h 대비 -8h)

**구성** (D에서 효과 검증된 부분만 유지):

**기본·표준** (PRD Epic 11에 이미 정의):
- 메타·sitemap·robots
- LocalBusiness Schema.org
- hreflang 5개 언어 (ko, en, ja, zh-CN, zh-TW, vi)

**풀** (+12h):
- 다국어 sitemap (언어별 분리)
- Naver Search Advisor / Bing Webmaster / Baidu Webmaster / Yandex Webmaster
- semantic HTML 강화

**핵심 AEO 요소** (+4h, 효과 검증된 것만):
- ✅ FAQ 스키마 (Question-led H2 + 한 문장 답변) — Growth Engines 12 B2B 사례 +28% AI 인용 향상
- ✅ 매장별 영문 요약 콘텐츠 (E-E-A-T)
- ✅ 구조화된 listicle (boundary 명확)

**제거된 항목** (효과 미검증):
- ❌ llms.txt — 30만 도메인 연구 결과 채택 10.13%, AI 인용 효과 없음
- ❌ 동적 OG 이미지 별도 생성 — 일반 OG로 충분, ROI 낮음

**활용 사례**:
- "best K-beauty hair salon Seoul" → ChatGPT 답변에 Visit K 매장 인용
- "韓國美髮店推薦" → Perplexity 매장 카드 노출
- "おすすめ 韓国 ヘアサロン" → AI 검색 결과 상위

**Phase 1.5/2 재평가**: 매장 100곳 도달 시 llms.txt + 동적 OG 효과 재검토

---

### 1.11 접근성 / a11y (#12) — B+ AA 풀 + 핵심 페이지 AAA ⚠️ v1.1 변경

**비용**: $0/월 (디자인 시스템 v3.0 자체 a11y 친화)
**시간**: +16h (이전 C 24h 대비 -8h)

**구성**:

**전체 사이트 — WCAG AA 풀** (+12h):
1. axe-core CI 통합 — 매 PR 자동 점검
2. 키보드 탐색 풀 지원 (Tab 순서, focus-visible)
3. 스크린리더 라벨·랜드마크 ARIA
4. 색상 대비 4.5:1 (디자인 시스템 v3.0 이미 충족)
5. alt 텍스트 (5개 언어)
6. 시맨틱 HTML

**핵심 페이지 — AAA 강화** (+4h):
- 예약 페이지·결제 페이지·KYC 페이지에만 AAA 적용
  - 색상 대비 7:1
  - 시간 제한 없음 (예약 시 충분한 시간 보장)
  - 키보드 단축키
  - 스킵 링크

**다국어 음성 안내 — Phase 1.5 모듈 4 통합** (Phase 1엔 텍스트만):
- 모듈 4 ElevenLabs 인프라 재활용 (Phase 1.5)
- Phase 1엔 텍스트 기반 안내 + ARIA live region

**제거된 항목** (W3C 자체가 일부 달성 불가 명시):
- ❌ 모든 동영상 수어 통역 — Visit K 인박스/리뷰 영상에 적용 불가능
- ❌ 모든 페이지 3,000자 요약 — 시술 설명에 부담
- ❌ 전체 사이트 색상 대비 7:1 — 디자인 시스템 일부 변경 필요, 시각적 부담

**법적 충분성**: 한국·EU·미국 모두 WCAG AA 기준. AA 풀로 법적 의무 100% 충족.

---

### 1.12 스테이징 + CI/CD (#13) — 단계별 (변경 없음) ⭐

**Day 0~30**: A 유지 (Prod만 + Vercel Preview, $0)
**Day 30~** (베타 시작): B 추가 (+$25/월 Staging)
**Phase 1.5 추가 검토**: Playwright E2E (매장 50곳 도달 시)

---

### 1.13 DB 백업 (#13 보안) — 단계별 (변경 없음) ⭐

**Day 0**: R2 외부 주간 백업 (+$0~3/월, +6h)
**매장 50~100곳**: PITR 28일 추가 (+$100/월)

**구현 방식 (Day 0)**:
```
Supabase Edge Function cron (매주 일요일 03:00 KST)
1. pg_dump → backup-{YYYY-MM-DD}.sql.gz
2. Cloudflare R2 업로드 (S3 호환 API)
3. 90일 보관 (R2 무료 한도 안에서)
4. Slack/Discord 알림
5. 월 1회 복구 테스트
```

---

## 2. 비용 종합표 (검증 후 — v1.1 최종)

### 2.1 단계별 월 비용

| 항목 | Day 0 | Day 30 | 매장 50곳 | 매장 100곳 🟡 | Y3 600곳 🟡 |
|---|---|---|---|---|---|
| **고정 인프라** | | | | | |
| Vercel Pro | 2.8만 | 2.8만 | 2.8만 | 5.6만 (2시트) | 5.6만 |
| Supabase Pro | 4.9만 | 4.9만 | 4.9만 | 4.9만 | 84만 (Team) |
| Staging ⭐ | 0 | +3.5만 | 3.5만 | 3.5만 | 3.5만 |
| Cloudflare R2 | 0 | 0 | 0 | 0 | ~1만 |
| R2 외부 백업 ⭐ | +0.4만 | 0.4만 | 0.4만 | 0.4만 | 0.4만 |
| PITR 28일 ⭐ | 0 | 0 | 0 | +14만 | 14만 |
| 도메인 .kr | 0.2만 | 0.2만 | 0.2만 | 0.2만 | 0.2만 |
| Sentry / PostHog | 0 | 0 | 0 | ~5만 | ~30만 |
| n8n (Elest.io) | 2.8만 | 2.8만 | 2.8만 | 5만 | 15만 |
| **고정 소계** | **약 11만 원** | **약 14만 원** | **약 15만 원** | **약 38만 원** | **약 154만 원** |
| **AI 변동비** | 0 | 약 18만 원 | 약 174만 원 | 약 348만 원 | 약 2,090만 원 |
| **총 월 비용** | **약 11만 원** | **약 32만 원** | **약 189만 원** | **약 386만 원** | **약 2,244만 원** |
| **연간 환산** | 130만 원 | 380만 원 | 2,270만 원 | 4,630만 원 | 약 2.7억 원 |

### 2.2 PRD ARR 대비 인프라 마진

| 단계 | ARR | 인프라 비용 (연) | **마진** |
|---|---|---|---|
| Y1 (베타 30곳) | 약 0.5억 | 약 380만 원 | **약 92%** ✅ |
| Y2 (200곳) | 약 4.1억 | 약 4,600만 원 | **약 89%** ✅ |
| Y3 (600곳, 구독) | 약 14억 | 약 2.7억 원 | **약 81%** ✅ |
| Y3 (구독 + 결제) | 약 17.5억 | 약 2.7억 원 | **약 84%** ✅ |

### 2.3 매장당 분담 (현실 감각)

| 단계 | 매장 분담 / 월 | Pro 19.9만 원 대비 |
|---|---|---|
| Day 30 베타 5곳 | 매장당 약 7,800원 | **4%** |
| 매장 50곳 | 매장당 약 780원 | **0.4%** |
| 매장 100곳 | 매장당 약 1,800원 | **0.9%** |
| 매장 600곳 | 매장당 약 300원 | **0.15%** |

---

## 3. 시간 / 일정 영향 (검증 후 — v1.1 최종)

### 3.1 추가 작업 시간 (v1.0 → v1.1 절약 -20h)

| 카테고리 | v1.0 | **v1.1 (검증 후)** | 절약 |
|---|---|---|---|
| Q1 인증 (Auth.js → Better Auth) | 12h | **8h** | -4h |
| 멀티테넌시 | 8h | 8h | — |
| Tiptap | 6h | 6h | — |
| PWA Push + 이메일 폴백 | 6h | 6h | — |
| Epic 12 자체 빌드 | 30h | 30h | — |
| 8종 운영자 플로우 풀세트 | 50h | 50h | — |
| Q10 SEO (D → C+) | 24h | **16h** | -8h |
| Q11 a11y (C → B+) | 24h | **16h** | -8h |
| Day 0 R2 백업 | 6h | 6h | — |
| Day 30 Staging 셋업 | 8h | 8h | — |
| **누적 추가** | 174h | **154h** | **-20h** |
| 기존 PRD § 13 | 280h | 280h | — |
| **최종 총합** | 454h | **434h** | **-20h** |

### 3.2 일정 옵션 (검증 후 단축 가능)

| 옵션 | 캘린더 | 비고 |
|---|---|---|
| **(b) Day 1~37** | 5주 | 이전 권장 (v1.0) |
| **(b') Day 1~35 ⭐ 권장** | 5주 (이틀 단축) | v1.1 검증 절약분 반영 |
| (c) Day 1~45 | 6.5주 | 가장 안전 |

### 3.3 (b') Day 1~35 권장 일정 요약

```
Week 1 (Day 1~7)   — Setup + 인터뷰
                     ⭐ R2 외부 백업 + Better Auth 셋업

Week 2 (Day 8~14)  — Epic 1·3·9 시작

Week 3 (Day 15~21) — + Epic 4 + Epic 12 시작 (admin Worker tmux 6창)

Week 4 (Day 22~28) — + Epic 2 (결제) + 통합 테스트
                     ⭐ Staging 환경 셋업 (Day 26~28)

Week 5 (Day 29~35) — Epic 12 완료 + SEO·a11y 마무리 + 베타 5곳 배포
                     - Day 33: Alpha v0.2 → Beta v0.1 게이트
                     - Day 35: 시드 5곳 배포
```

---

## 4. v1.0 → v1.1 변경 영향 정산

### 4.1 변경된 3개 결정의 종합 영향

| 항목 | 그대로 (v1.0) | 변경 후 (v1.1) |
|---|---|---|
| Q1 비용 | $0 | $0 |
| Q1 시간 | 12h | 8h (-4h) |
| Q1 위험 | Auth.js Beta 의존 | **Stable Better Auth** ✅ |
| Q1 Phase 2 | RN 별도 구현 | **0 마이그레이션** ✅ |
| Q10 비용 | $0 | $0 |
| Q10 시간 | 24h | 16h (-8h) |
| Q10 효과 | llms.txt 효과 미검증 | **검증된 것만** (FAQ 스키마 +28%) ✅ |
| Q11 비용 | $0 | $0 |
| Q11 시간 | 24h | 16h (-8h) |
| Q11 효과 | AAA 일부 달성 불가 | **법적 충분 + 핵심 AAA** ✅ |
| **총 시간** | 174h | **154h (-20h)** |
| **총 비용** | $0 | **$0** (변동 없음) |

### 4.2 검증으로 얻은 가치

✅ **Auth.js Beta 의존성 제거** — 향후 보안·기능 업데이트 안정성 확보
✅ **Phase 2 React Native 비용 0** — Better Auth framework-agnostic
✅ **효과 미검증 SEO 8h 제거** — 매장 100곳 시점에 재평가 가능
✅ **AAA 달성 불가 항목 제거** — 법적 의무(AA) 100% + 핵심 페이지 AAA
✅ **2.5일 일정 여유** (Day 1~37 → Day 1~35)

---

## 5. 검증 출처 (1차 출처 9건)

| 항목 | 출처 | 검증일 |
|---|---|---|
| 🟢 Supabase 가격 | supabase.com/pricing | 2026-04-24 |
| 🟢 Cloudflare R2 ($0.015/GB, egress 무료) | developers.cloudflare.com/r2/pricing | 2026-04 |
| 🟢 WorkOS AuthKit (1M MAU 무료) | workos.com/pricing + Kinde | 2026-03 |
| 🟢 Vercel Pro ($20/시트, 1TB) | vercel.com/docs/pricing | 2026-02-27 |
| 🟢 Auth.js → Better Auth 합류 | better-auth.com/blog, LogRocket | 2025-09 / 2026-04 |
| 🟢 Better Auth Next.js 16 호환 | better-auth.com/docs | 2026-04 |
| 🟢 llms.txt 채택률·효과 | Search Engine Journal (30만 도메인) | 2026-04 |
| 🟢 Question-led H2 +28% AI 인용 | Growth Engines (12 B2B 사례) | 2026-04 |
| 🟢 W3C WCAG 2.2 AAA | w3.org/TR/WCAG22 | 2026 (지속 갱신) |
| 🟡 Supabase PITR ~$100/월 | Pro Add-on | 시점 의존, 재확인 권장 |
| 🟡 카카오 알림톡 7~9원/건 | 한국 시장 알려진 가격대 | 발송 대행사 견적 시점 변동 |

---

## 6. 다음 액션 (Day 0 Setup 즉시 시작 가능)

### 6.1 Jayden 결정 필요 (4개)

| # | 항목 | 옵션 |
|---|---|---|
| **D1** | 시드 매장 5곳 위치 | (a) 서울만 / (b) 서울+부산 / (c) 서울+부산+제주 |
| **D2** | 일정 옵션 | (b') Day 1~35 ⭐ / (b) Day 1~37 / (c) Day 1~45 |
| **D3** | Day 0 Setup 시작 일자 | 2026-05-01(목) / 5월 4일(월) / 협의 |
| **D4** | OAuth 제공자 우선순위 | (a) Google·Kakao 1순위 / (b) Google·Apple·LINE / (c) 모두 |

### 6.2 즉시 시작 가능한 항목

1. ✅ DECISIONS v1.1 FINAL 승인
2. ⏳ DEVELOPMENT-PLAN v1.0 + PATCH v1.1 + 본 v1.1 변경 사항을 v1.2 통합본으로 합치기
3. ⏳ Day 0 Setup 22 Task 시작 (D3 결정 후)
4. ⏳ Better Auth 공식 문서 사전 학습 (Lead 3~4h)
5. ⏳ R2 버킷 생성 + Cloudflare 계정 셋업 (Day 0 사전 준비)

### 6.3 Phase 1.5/2 재평가 트리거

| 트리거 | 재평가 항목 |
|---|---|
| 매장 50곳 도달 | PITR 28일 추가 |
| 매장 100곳 도달 | (1) R2 + Storage 하이브리드 / (2) 카카오 알림톡 / (3) Tiptap Pro / (4) llms.txt 재평가 / (5) 동적 OG |
| 매장 200곳 도달 | Vercel 시트 추가, Supabase Pro → Team |
| Phase 2 시작 (Day 270+) | (1) React Native (Better Auth 그대로 사용 ✅) / (2) Playwright E2E / (3) WorkOS SSO |

---

## 7. 종합 평가

### 7.1 라운드 1~4 + 검증 결과의 강점

✅ **추가 SaaS 구독 0개** — 모든 결정 OSS / 기존 인프라
✅ **인프라 마진 80%+ 유지** — Y3까지 안정
✅ **단계별 안전 도입** — Day 0 → Day 30 → 매장 50~100곳
✅ **검증 기반 결정** — 효과 미검증 항목 제거, 시간 -20h 절약
✅ **PRD 보안 분류 준수** — 🔴 RED 데이터 이중 보호 (Day 30+)
✅ **Better Auth 선택** — Auth.js Beta 의존 제거, Phase 2 RN 친화
✅ **법적 의무 충족** — WCAG AA 풀 + 핵심 페이지 AAA
✅ **AI 검색 시대 대응** — 검증된 AEO 요소 (FAQ 스키마, 매장별 영문 요약)

### 7.2 정직한 위험·약점

⚠️ **AI 변동비** — 베타 30곳 약 105만 원/월 (1-hour caching으로 30~50% 절감 가능)
⚠️ **Better Auth 학습 곡선** — Lead 3~4h 필요 (그러나 Auth.js v5보다 단순)
⚠️ **8종 운영자 플로우 +50h** — 인지 부담 큼, tmux 6창 운영 필요
⚠️ **Day 30 Staging까지 Prod 직접 배포** — 매장 0곳 시점이라 위험 낮으나 인지 필요
⚠️ **PITR은 매장 50~100곳 도달 후** — 그 사이 사고 시 7일 백업 + R2 주간 백업으로 복구

### 7.3 다음 결정 트리거 시각화

```
Day 0          Day 30        매장 50곳    매장 100곳   매장 200곳   Phase 2
  │              │              │            │            │            │
  │ Better Auth │ Staging      │ PITR        │ R2 하이브리드 │ Vercel 시트 │ React Native
  │ R2 백업     │ 추가         │ 추가        │ 카카오 알림톡 │ Supabase    │ (Better Auth
  │ Day 0 11만   │ Day 30 32만  │ +14만       │ Tiptap Pro?  │  Team       │  그대로 ✅)
  │              │              │             │ llms.txt 재  │             │
  │              │              │             │ 동적 OG 재   │             │
  v              v              v             v             v             v
```

---

**문서 끝.**

> 본 v1.1 FINAL은 13개 결정의 단일 진실 공급원입니다.
> 다음 산출물: DEVELOPMENT-PLAN v1.2 (v1.0 + 본 v1.1 통합본).
> Jayden의 D1·D2·D3·D4 결정 후 Day 0 Setup 시작 가능.
