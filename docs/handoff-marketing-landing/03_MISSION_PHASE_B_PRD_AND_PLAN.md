# 03 — MISSION Phase B: PRD + Plan v1 작성

> **누가 읽나**: Claude Code
> **전제**: Phase A `AUDIT_REPORT.md` 작성 완료 + Jayden이 OPEN QUESTIONS 답변 + Phase A 승인 완료
> **목적**: 실행 가능한 PRD + Task 분해 Plan v1 작성
> **소요 시간**: ~45분
> **결과물**: `docs/PRD-marketing-landing.md` + `docs/Plan-marketing-landing-v1.md`
> **⛔️ 코드 작성하지 말 것** — Phase B도 문서 작성만

---

## 🎯 Mission

Phase A에서 도출한 **현황 + Open Questions 답변**을 바탕으로:

1. **PRD** (Product Requirements Document) — Jayden 승인용
2. **Plan v1** — Task 분해 + 의존성 + 검증 기준

두 문서를 작성. 본 프로젝트의 **L-082 e2e 시연 기준** + **Pre-Plan Inventory** 의무를 100% 준수.

---

## 📋 전제 — 시작 전 의무

### 0.1 Phase A 결과 흡수

```bash
# 1. Audit Report 정독
cat /Volumes/jayden-ssd/projects/hesya/docs/handoff-marketing-landing/AUDIT_REPORT.md

# 2. Jayden 답변 확인 (대화에서 명시적으로 받은 답변)
# 채팅 컨텍스트에 Jayden 답변이 있는지 확인. 없으면 작업 중단.
```

### 0.2 Jayden 답변 검증

Phase A의 OPEN QUESTIONS 모두 답변을 받았는지 체크:

```
[ ] Q1. ___________ → 답변: ___________
[ ] Q2. ___________ → 답변: ___________
[ ] Q3. ___________ → 답변: ___________
...
```

**미답변 항목이 1개라도 있으면 Phase B 시작 금지**. Jayden에게 답변 요청 후 재개.

### 0.3 기존 문서 위치 확인

```bash
# PRD 보관 폴더
ls /Volumes/jayden-ssd/projects/hesya/docs/
# 기존 PRD 형식 참고
cat /Volumes/jayden-ssd/projects/hesya/docs/PRD.md 2>/dev/null | head -100
```

---

## 📝 작성물 1 — PRD (Product Requirements Document)

`docs/PRD-marketing-landing.md` 작성. 다음 12개 섹션 의무:

### 섹션 1. 목적

마케팅 랜딩페이지를 본 Next.js 16 프로젝트(`apps/web/`)에 통합. 외국인 여행자가 hesya.com 첫 방문 시 → Customer PWA 가입 진입 흐름. 차별점: 한국식 환대 + 5개 언어 + K-Verified 살롱 + AI 스타일 매칭.

### 섹션 2. 사용자 시나리오 (e2e 시연 기준 — L-082)

**시나리오 A — 한국어 메인**:

1. 사용자 `/ko` 접속 → 마케팅 랜딩 hero
2. CTA 클릭 → `/ko/c/sign-in` 이동
3. 가입 후 `/ko/c/mypage` 진입
4. **시연 통과**: 톤 일관, 자산 LCP < 2.5s, 디자인 정합

**시나리오 B — 사업자**:
(Phase A Q&A에 따라 결정 — sign-in?role=owner 또는 별도 페이지)

**시나리오 C — 다국어**:

1. 6 locale (ko/en/ja/zh-CN/zh-TW/th) 자동 라우팅
2. Korean Typography는 ko만 적용

### 섹션 3. 기능 명세 (Phase A 결과 반영)

#### 3.1 라우트 구조 (Phase A 충돌 분석 B 결과 반영)

(Audit Report에서 확정된 라우트 구조를 그대로 명시)

#### 3.2 디자인 시스템 통합 (Phase A 충돌 C 결과 반영)

- 토큰 소스: `docs/design/reference/tokens.css` (Phase A 검증된 정확한 위치)
- 마케팅 토큰 차이: (Phase A에서 발견한 N개 새 토큰 — 머지/대체/추가 결정)

#### 3.3 자산 (16개)

- 위치: (Phase A에서 결정된 경로)
- 사용 매핑: `04_ASSETS_INVENTORY.md` 참조

#### 3.4 다국어 (i18n)

- locale: (Phase A에서 검증된 실제 locale 목록)
- 메시지 키: `packages/translations/messages/{locale}/marketing.json` 신규
- 변환 원칙: 옵션 A (한글 메인 + 영문 보조) — `05_DESIGN_REFERENCE_GUIDE.md` 참조

#### 3.5 영상/이미지 통합

- `<video autoplay muted loop playsinline preload="metadata" poster=...>`
- `prefers-reduced-motion` 존중
- 명시적 `width`/`height` 또는 `aspect-ratio` (CLS 0)
- LCP < 2.5s, INP < 200ms

#### 3.6 접근성

- WCAG 2.2 AA
- 키보드 전용 플로우
- aria-label / focus-visible

### 섹션 4. ⛔️ Not Doing (10개 항목)

이번 PRD 범위 외:

1. ❌ Supabase 회원가입 연동 — sign-in으로 redirect만
2. ❌ `docs/design/reference/` 마스터 수정
3. ❌ `web/public/landingpage/` 정적 HTML 수정
4. ❌ `(marketing)/travelers/`, `owners/` 페이지 (Phase 2)
5. ❌ 기존 `/c/`, `/store/`, `/admin/` 디자인 변경
6. ❌ 새 DAL / auth guard / DB 스키마 추가
7. ❌ Vercel Blob 이전 (트래픽 임계 도달 전까지)
8. ❌ A/B 테스트 도구 통합
9. ❌ PostHog 신규 이벤트 (page view 기본만)
10. ❌ 모바일 PWA Customer Landing 변경

(Phase A에서 추가 발견된 Not Doing 항목 있으면 추가)

### 섹션 5. 완료 기준

#### 5.1 코드 머지 기준

(체크리스트 — Phase A 검증된 컴포넌트 목록 기반)

#### 5.2 e2e 시연 기준 (L-082)

(시연 통과 조건 — Phase A에서 확인한 실제 dev 환경 기반)

#### 5.3 자기평가 목표

90%+ (e2e 시연 통과 + 디자인 정합 + a11y/perf 검증)

### 섹션 6. Task 분해 (요약)

11개 Task 예상. 자세한 분해는 Plan v1에.

### 섹션 7. 보안 고려사항

- 보안 등급: 🟡 YELLOW (마케팅, PII 수집 X)
- CSP 위반 가능성 확인 필요

### 섹션 8. 종속성

- ✅ Higgsfield 자산 16개
- ✅ Claude Design 출력 (`web/public/landingpage/`)
- ✅ 디자인 마스터 (`docs/design/reference/`)
- ⏳ Phase A Open Questions 답변 (모두 완료 가정)

### 섹션 9. 리스크 & 완화

(Phase A 충돌 분석 결과 기반 5가지 리스크 매트릭스)

### 섹션 10. 후속 작업 (이번 PRD 범위 외)

- `(marketing)/travelers/page.tsx`, `owners/page.tsx`
- 블로그 CMS
- A/B 테스트
- Vercel Blob 이전

### 섹션 11. 승인 체크리스트

- [ ] Jayden Phase A AUDIT_REPORT 검토 완료
- [ ] Jayden OPEN QUESTIONS 모두 답변 완료
- [ ] Jayden PRD 검토 완료
- [ ] Jayden Plan v1 검토 완료
- [ ] Jayden 최종 e2e 시연 (Task 11 완료 후)

### 섹션 12. 참고 문서

(이미 알려진 모든 reference 경로)

---

## 📝 작성물 2 — Plan v1

`docs/Plan-marketing-landing-v1.md` 작성.

### Plan v1 섹션 0 — Pre-Plan Inventory 결과 (CLAUDE.md 의무)

Phase A AUDIT_REPORT 결과를 그대로 첨부.

### Plan v1 섹션 1 — Task 분해

각 Task는 30분~2시간 단위. **한 번에 1 Task만** 진행 (사용자 메모리 규칙).

| #   | Task                                              | 파일                                                     | 예상  | 의존성     | 검증               |
| --- | ------------------------------------------------- | -------------------------------------------------------- | ----- | ---------- | ------------------ |
| T1  | 자산 16개 위치 정정 (Phase A 결정 위치로)         | `apps/web/public/assets/`                                | 10min | -          | ls 16개 확인       |
| T2  | `marketing.json` 메시지 키 — 한국어 마스터 작성   | `packages/translations/messages/ko/marketing.json`       | 1h    | -          | type-check 통과    |
| T3  | T2 결과 → 5 locale 번역 (en/ja/zh-CN/zh-TW/th)    | `packages/translations/messages/{locale}/marketing.json` | 1h    | T2         | type-check         |
| T4  | `(marketing)/layout.tsx` 골격                     | `apps/web/src/app/[locale]/(marketing)/layout.tsx`       | 30min | -          | dev 서버 4200 응답 |
| T5  | `(marketing)/page.tsx` + Hero + TrustBar 컴포넌트 | + `_components/`                                         | 2h    | T1, T2, T4 | dev `/ko` 렌더링   |
| T6  | HowItWorks + AIMatch + FeaturedSalons             | \_components/                                            | 2h    | T5         | dev 렌더링         |
| T7  | UGCWall + SafetyFemaleLens + B2BOwners            | \_components/                                            | 2h    | T6         | dev 렌더링         |
| T8  | Trending + FAQ + FinalCTA + Footer                | \_components/                                            | 1.5h  | T7         | dev 렌더링         |
| T9  | a11y / perf 검증 (Lighthouse + axe)               | -                                                        | 1h    | T8         | Lighthouse 90+     |
| T10 | Vercel preview deploy                             | -                                                        | 30min | T9         | preview URL 작동   |
| T11 | Jayden e2e 시연 + PROGRESS.md 갱신 (90%+)         | PROGRESS.md                                              | 30min | T10        | Jayden OK          |

총 ~12시간 (1.5일).

### Plan v1 섹션 2 — 시연 prerequisite 검증 (L-082)

각 Task별로 시연 prerequisite 명시:

- T5 완료 시 시연 조건: `localhost:4200/ko` 접속 시 hero 영상 자동 재생 + 텍스트 한국어 메인
- T8 완료 시 시연 조건: 전체 섹션 12개 모두 렌더링 + CLS 0
- T11 시연 조건: Jayden이 데스크톱 + 모바일 브라우저로 직접 확인 + OK

### Plan v1 섹션 3 — 검증 체크리스트

Task 단위:

- [ ] `pnpm type-check` 통과 (turbo)
- [ ] `pnpm lint` 통과
- [ ] `pnpm --filter @hesya/web build` 경고 0건
- [ ] `pnpm --filter @hesya/web test` 기존 vitest 통과 유지
- [ ] (T9) Lighthouse Performance 90+ / Accessibility 95+

### Plan v1 섹션 4 — 위험 요소

(Phase A 충돌 분석 5가지 + Phase A에서 추가 발견된 위험 반영)

### Plan v1 섹션 5 — Not Doing

PRD 섹션 4 그대로 복사.

### Plan v1 섹션 6 — Subagent 진단 의무 (P0 Epic 기준)

본 작업이 P0이라면 senior-engineer + code-explorer subagent 호출 의무 (CLAUDE.md L-082).

(Phase A에서 판단된 우선순위에 따라 결정)

---

## ⛔️ 절대 하지 말 것

1. ❌ **어떤 코드도 작성하지 말 것** (.tsx, .ts, .css, .json 신규/수정 0개)
2. ❌ **Task 자체를 시작하지 말 것** — T1조차도 별도 세션 + Jayden 승인 후
3. ❌ **PROGRESS.md 갱신 금지**
4. ❌ **Phase A에서 받은 답변을 모호하게 해석 금지** — Jayden에 재확인 요청
5. ❌ **이번 작업 외 부수 작업 추가 금지** (스코프 크리프)

---

## ✅ Phase B 완료 조건

- [ ] Phase A AUDIT_REPORT 정독
- [ ] Jayden OPEN QUESTIONS 답변 모두 흡수
- [ ] `docs/PRD-marketing-landing.md` 12개 섹션 작성
- [ ] `docs/Plan-marketing-landing-v1.md` 6개 섹션 + Task 11개 분해
- [ ] OAR 보고서 형식으로 Jayden에 출력

---

## 🎯 보고 후 다음 단계

PRD + Plan v1 제출 후:

1. **Jayden 검토 + 수정 의견**
2. **Jayden 승인** ("PRD + Plan 승인" 명시)
3. **별도 Claude Code 세션 시작** — `/clear` 또는 새 채팅
4. **T1부터 순차 실행** — Task 단위로 1개씩, tsc → lint → build → test 통과 후 다음

**Phase B 종료 시 출력 마지막 줄**:

> "✅ Phase B 완료. PRD + Plan v1 작성 완료. Jayden님, 두 문서 검토 + 승인 부탁드립니다. 승인 후 별도 세션에서 T1(자산 위치 정정)부터 시작합니다."

---

## 📌 시작 한 줄 명령 (Jayden이 채팅창에 입력)

Phase A 완료 + Open Questions 답변 후:

> "OPEN QUESTIONS 답변: [답변 본문]. 이제 `/Volumes/jayden-ssd/projects/hesya/docs/handoff-marketing-landing/03_MISSION_PHASE_B_PRD_AND_PLAN.md` 읽고 Phase B 진행해줘"
