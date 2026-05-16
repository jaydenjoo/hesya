# Plan v1 — Marketing Landing Page

> **버전**: v1 (Phase B 산출, 2026-05-17)
> **PRD**: [`PRD-marketing-landing.md`](PRD-marketing-landing.md)
> **선행 산출**: [`AUDIT_REPORT.md`](handoff-marketing-landing/AUDIT_REPORT.md) (Phase A)
> **상태**: Jayden 승인 대기 (승인 후 T1부터 별도 세션 순차 실행)
> **총 예상**: 11 Tasks · ~12h (1.5일)
> **자기평가 목표**: T11 통과 후 90%+ (L-082 e2e 기준)

---

## ⚠️ OPEN QUESTIONS 처리 (PRD 동일)

본 Plan은 6개 OPEN QUESTIONS에 **default 권장값** 가정. Jayden 답변 후 Plan v2 갱신.

| Q   | Default                                                      | Task 영향              |
| --- | ------------------------------------------------------------ | ---------------------- |
| Q1  | A1 (복사)                                                    | T1                     |
| Q2  | B2 (기존 page 교체)                                          | T4 / T11               |
| Q3  | E1 (MarketingLanding namespace)                              | T2 / T3                |
| Q4  | M1 (CSS-only motion)                                         | T5~T8 (deps 추가 없음) |
| Q5  | autoplay+muted+playsinline+preload="metadata"+reduced-motion | T5                     |
| Q6  | T11에서 합산 갱신                                            | T11                    |

---

## 섹션 0 — Pre-Plan Inventory 결과 (CLAUDE.md 의무)

[`AUDIT_REPORT.md`](handoff-marketing-landing/AUDIT_REPORT.md) 전체가 본 Plan의 Pre-Plan Inventory에 해당. 핵심 발견 요약:

### 0.1 키워드 grep

- `(marketing)` route group: **0건** — 신규 안전
- `Landing` i18n namespace: 6 locales 모두 존재 (4 keys, 기존 features/landing 사용)
- `features/landing/`: γ.2.3.5 미니 모듈 (LandingHero / LandingFooter / GreetingTicker + tests)
- `KVerified` 류: 3개 별개 컴포넌트 — \_components/에 격리 권장

### 0.2 작업 영역 ls

- `apps/web/src/app/[locale]/page.tsx`: 1010B (γ.2.3.5 미니 Landing, `@/features/landing` 사용)
- `apps/web/src/app/[locale]/layout.tsx`: 2730B (Fraunces + Source Sans 3 + JetBrains Mono + Pretendard 이미 wire)
- `apps/web/public/`: CRA boilerplate 5 svg만. **`assets/` 폴더 없음**
- `apps/web/src/features/landing/`: 4 components + 3 tests

### 0.3 외부 reference 자산

- `docs/design/reference/`: **83 files** (master SSoT)
- `web/public/landingpage/Hesya Landing.html`: 76KB / **1949 lines**, `<section>` 11개, `<video>` 0개 (placeholder만, line 1232 주석)
- `web/public/assets/videos/`: **8 mp4** ✅
- `web/public/assets/images/`: **8 png** ✅

### 0.4 데모 prerequisite

- `pnpm dev`: `next dev -p 4200` (포트 4200)
- `pnpm build`: `next build`
- `pnpm type-check`: turbo run type-check
- `pnpm --filter @hesya/web test`: vitest 518+ cases
- Git: main, clean (handoff/ untracked만)
- 최근 commit: `8b768b2 docs(design): design-completion-status.md`

### 0.5 토큰 비교

```
diff docs/design/reference/tokens.css web/public/landingpage/tokens.css       → empty
diff docs/design/reference/tokens.css apps/web/src/styles/handoff/tokens.css  → empty
diff docs/design/reference/tokens.css docs/design/handoff/tokens.css          → empty
```

**모두 byte-identical 350 lines**. globals.css에 직접 인라인.

### 0.6 결정

- [x] **신규 marketing landing 진행 OK** — (marketing) 경로 충돌 0, 토큰 충돌 0, 폰트 wire 완료
- [x] 기존 features/landing/ 보존 (B2 default, Q2 답변 후 cleanup 결정)
- [x] i18n 신규 namespace `MarketingLanding` (E1 default)
- [x] 자산 복사 (A1 default)
- [x] CSS-only motion (M1 default, deps 추가 없음)

---

## 섹션 1 — Task 분해 (11개)

각 Task는 30분~2시간 단위. **한 번에 1 Task만**, tsc → lint → build → test 통과 후 다음.

### 의존성 그래프

```
T1 ─┐
    ├─→ T4 ─→ T5 ─→ T6 ─→ T7 ─→ T8 ─→ T9 ─→ T10 ─→ T11
T2 ─┤        (Hero+BA) (HIW+Sa+UGC) (Sa+B2B+Tr) (FAQ+CTA+Ftr)
    │
    └─→ T3
```

### Task 표

| #   | Task                                                 | 신규/수정 파일                                                                           | 예상 | 의존성     | 검증                                                                                 |
| --- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---- | ---------- | ------------------------------------------------------------------------------------ |
| T1  | 자산 16개 복사 + 용량 확인                           | `apps/web/public/assets/{videos,images}/` (신규 폴더 + 16 파일)                          | 10m  | -          | `ls apps/web/public/assets/videos \| wc -l` == 8, images == 8, `du -sh` < 100MB 확인 |
| T2  | `ko.json`에 `MarketingLanding` namespace 신규        | `packages/translations/messages/ko.json` (수정)                                          | 1h   | -          | type-check 통과, key 수 50+ 확인                                                     |
| T3  | 5 locale 번역 동기화 (en/ja/zh-CN/zh-TW/vi)          | `packages/translations/messages/{en,ja,zh-CN,zh-TW,vi}.json` (수정)                      | 1h   | T2         | type-check 통과, 6 locales key set identical 검증                                    |
| T4  | `[locale]/page.tsx` 교체 + 11 컴포넌트 골격          | `apps/web/src/app/[locale]/page.tsx` (수정), `_components/Marketing*.tsx` × 11 (신규)    | 30m  | -          | `pnpm --filter @hesya/web dev` 응답, `/ko` 200 OK                                    |
| T5  | Hero + BeforeAfter (영상/포스터 wire)                | `_components/MarketingHero.tsx`, `_components/MarketingBeforeAfter.tsx`                  | 2h   | T1, T2, T4 | `/ko` Hero 영상 자동재생 + BA slider 동작                                            |
| T6  | HowItWorks + SalonsGrid + UGC Wall                   | `_components/MarketingHowItWorks.tsx`, `MarketingSalonsGrid.tsx`, `MarketingUgcWall.tsx` | 2h   | T5         | `/ko` 추가 3 sections 렌더링                                                         |
| T7  | Safety + B2BOwners + Trending                        | `_components/MarketingSafety.tsx`, `MarketingB2bOwners.tsx`, `MarketingTrending.tsx`     | 2h   | T6         | `/ko` 추가 3 sections 렌더링                                                         |
| T8  | FAQ + FinalCta + Footer                              | `_components/MarketingFaq.tsx`, `MarketingFinalCta.tsx`, `MarketingFooter.tsx`           | 1.5h | T7         | `/ko` 11 sections 모두 렌더링                                                        |
| T9  | a11y / perf 검증 (axe + Lighthouse + reduced-motion) | (검증 only, 발견 시 수정 PR)                                                             | 1h   | T8         | Lighthouse Mobile Perf 80+ / A11y 95+ / CLS 0                                        |
| T10 | Vercel preview deploy                                | `.vercel/` (이미 wire), 본 PR을 main 머지 또는 preview branch push                       | 30m  | T9         | preview URL 동작, 6 locales 라우팅 정상                                              |
| T11 | Jayden e2e 시연 + PROGRESS / design-completion 갱신  | `PROGRESS.md`, `docs/design-completion-status.md` (수정)                                 | 30m  | T10        | Jayden 데스크톱 + iOS Safari + Android Chrome OK + 자기평가 90%+ 갱신                |

**총 ~12시간 (1.5일)**.

---

## 섹션 2 — 시연 prerequisite 검증 (L-082)

각 Task별 시연 조건. 코드 머지 완료 ≠ 시연 가능.

| Task | 시연 조건                                                                           | 비-prerequisite 시 대응                        |
| ---- | ----------------------------------------------------------------------------------- | ---------------------------------------------- |
| T1   | `apps/web/public/assets/videos/hero-silk-petal.mp4` 등 16 파일 ls + 용량 100MB 미만 | 100MB 초과 시 R1 대응 (ffmpeg 압축 또는 Blob)  |
| T2   | `messages/ko.json` 신규 namespace `MarketingLanding` 50+ keys, type-check 통과      | 누락 key 추가                                  |
| T3   | 6 locales 동일 key set (script로 검증)                                              | 누락 locale 보충                               |
| T4   | `localhost:4200/ko` 200 OK, 보일러플레이트 페이지 사라짐 + 빈 marketing layout 표시 | 라우팅 충돌 검토                               |
| T5   | `/ko` 접속 시 hero-silk-petal.mp4 자동재생 (Chrome) + BA slider drag 동작           | iOS Safari `playsinline` 확인 필수             |
| T6   | `/ko` 6 살롱 이미지 lazy-load + UGC 3 카드 표시                                     | next/image priority 검토                       |
| T7   | `/ko` Safety / B2B / Trending 3 sections 렌더링 (디자인 정합)                       | reference HTML 대조                            |
| T8   | `/ko` 11 sections 모두 렌더링 + FAQ 아코디언 동작 + Footer link                     | 누락 section 추가                              |
| T9   | Lighthouse Mobile Performance 80+ / Accessibility 95+ / CLS 0 / INP < 200ms         | 80 미만 시 영상 최적화 (poster preload, codec) |
| T10  | preview URL 6 locales 모두 200 OK, 영상 재생, Lighthouse 본 환경 80+                | Vercel deploy size 한도 확인                   |
| T11  | Jayden 데스크톱(Mac/PC) + iOS Safari + Android Chrome 직접 OK + 자기평가 90%+       | 시연 실패 시 해당 Task로 되돌아감              |

---

## 섹션 3 — 검증 체크리스트 (Task 단위 공통)

각 Task 완료 시 다음 모두 통과:

- [ ] `pnpm --filter @hesya/web type-check` 통과 (turbo)
- [ ] `pnpm lint` 통과
- [ ] `pnpm --filter @hesya/web build` 경고 0건
- [ ] `pnpm --filter @hesya/web test` 기존 vitest 518+ 통과 유지 (regression 0)
- [ ] T9 한정: Lighthouse Mobile Performance 80+ / Accessibility 95+ / Best Practices 90+ / SEO 95+
- [ ] T9 한정: `axe-core` 자동 a11y 위반 0
- [ ] T9 한정: `prefers-reduced-motion` 토글 시 영상 자동재생 차단 확인

---

## 섹션 4 — 위험 요소 (PRD 섹션 9 매핑)

| #   | 위험                                                     | 대응 Task         | 임계 신호                                                                            |
| --- | -------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ |
| R1  | 영상 8개 100MB+ → Vercel deploy size 초과                | T1                | `du -sh apps/web/public/assets/videos` 80MB+ 시 ffmpeg 압축 (HEVC/AV1 권장)          |
| R2  | iOS Safari 자동재생 실패                                 | T5                | 실 iPhone에서 hero 영상 정지 시 `muted` + `playsinline` 명시 + JS toggle             |
| R3  | LCP > 2.5s                                               | T5, T9            | Lighthouse LCP 2.5s 초과 시: poster preload, 영상 lazy, 외부 RUM (PostHog) 측정      |
| R4  | 6 locales 번역 품질 (Claude 자동 번역)                   | T3                | T3 완료 후 ko 마스터 vs 5 locale 1:1 lint 검토. Native speaker 검수는 Phase 2로 분리 |
| R5  | features/landing/ dead code (B2 default 시)              | T4 (또는 후속 PR) | Q2 답변 후 cleanup 또는 삭제 결정                                                    |
| R6  | Hesya Landing.html `<video>` 0개 — 디자인 의도 해석 차이 | T5~T8             | 04_ASSETS_INVENTORY.md 매핑 표 엄격 준수. 불명확 시 Jayden 확인                      |
| R7  | 한국어 word-break:keep-all 미적용                        | T2, T5~T8         | 모든 .kr 텍스트 클래스 의무. globals.css 또는 컴포넌트 base style 추가               |
| R8  | 6 locales json key drift (동기화 깨짐)                   | T3                | 자동 script (`tools/check-locale-parity.ts` 등) 도입 검토 (별도 task)                |

---

## 섹션 5 — Not Doing (PRD 섹션 4 동일)

본 Plan 범위 외:

1. ❌ Supabase 회원가입 / sign-in 로직 변경
2. ❌ `docs/design/reference/` 마스터 수정
3. ❌ `web/public/landingpage/` 정적 HTML 수정
4. ❌ `(marketing)/travelers/`, `(marketing)/owners/` (Phase 2)
5. ❌ 기존 `/c/`, `/store/`, `/admin/`, `/design-system/` 디자인/기능 변경
6. ❌ 새 DAL / auth guard / DB 스키마
7. ❌ Vercel Blob / Git LFS 이전
8. ❌ A/B 테스트 도구
9. ❌ PostHog 신규 이벤트
10. ❌ 모바일 PWA / customer landing 변경
11. ❌ Blog / CMS
12. ❌ Newsletter / 이메일 캡처

---

## 섹션 6 — Subagent 진단 의무 (P0 Epic 기준)

**본 작업 우선순위 평가**: 🟡 **P1 (중요, P0 아님)**.

- 베타 5곳 매칭(phase ζ)을 막는 차단 요소 아님 → P0 아님
- 외부 시연 환경 개선(외부 누구나 동일 URL로 hesya.com 첫 인상 받기) → P1
- 따라서 senior-engineer + code-explorer subagent **의무 호출 대상 아님**

**그러나 권장 사용처**:

- T4 진입 직전: `code-explorer` 1회 — `[locale]/page.tsx` 교체 시 의도치 않게 다른 페이지/테스트에 영향 검토
- T11 직전: `code-reviewer` 1회 — 11 컴포넌트 전체 독립 코드 리뷰
- T9 후 / T10 전: `qa-tester` 1회 — Lighthouse / axe / 6 locales 시연 시나리오 자동화 검토

P1 작업이지만 같은 영역 PR 3개+ 누적 또는 가정 깨짐 시그널 감지 시 **즉시 P0로 격상 + subagent 의무 진단** (L-082 정신).

---

## 섹션 7 — 세션 운영 가이드

### 7.1 다음 세션 시작 시 (T1)

```
1. /start 스킬 자동 실행 (PROGRESS.md 등 흡수)
2. "Plan-marketing-landing-v1.md T1부터 시작" 명령
3. T1 → tsc → lint → build → test → 다음 Task
```

### 7.2 Task 간 분리 원칙

- T1 (10m), T4 (30m), T10 (30m), T11 (30m)은 1 세션에 묶기 OK
- T2 + T3 (총 2h)는 1 세션 OK (번역 작업 흐름 유지)
- T5~T8 (각 1.5~2h)은 **각 1 세션** (Bunch metrics 과부하 방지)
- T9 (1h)는 1 세션 (검증 집중)

총 **6~7 세션** 예상 (Jayden 시간대 분산 가능).

### 7.3 PR 전략

- Feature branch: `feat/marketing-landing`
- Sub-task별 마이크로 PR (T1, T2+T3, T4, T5, T6, T7, T8, T9, T10) → main에 머지 (Phase 1-γ.0 fix 패턴)
- T11은 머지 후 시연

### 7.4 롤백 가이드

- T1 자산 복사 롤백: `rm -rf apps/web/public/assets/`
- T4 page 교체 롤백: git revert (기존 `[locale]/page.tsx` 1010B 복원)
- T2/T3 번역 롤백: ko.json 등에서 MarketingLanding namespace 삭제
- Lighthouse 미달 시 T9에서 영상 압축 / poster preload 등 보정 → T10 재시도

---

## 섹션 8 — 승인 후 다음 단계

1. **Jayden 검토**: PRD + Plan v1 함께 검토
2. **OPEN QUESTIONS 답변**: Q1~Q6 명시 답변 (또는 default 채택 명시)
3. **승인 명시**: "PRD + Plan 승인" 또는 "Plan v2 갱신 필요"
4. **승인 시**: 별도 세션 시작 → T1부터 순차 실행
5. **변경 필요 시**: Plan v2 갱신 → 재승인

---

## 부록 A — Default vs Alternative 옵션 정리

PRD/Plan에서 default 채택한 권장값. Q1~Q6 답변 시 변경.

| Q   | Default                         | Alt 1                      | Alt 2                     | Plan 영향 (요약)                              |
| --- | ------------------------------- | -------------------------- | ------------------------- | --------------------------------------------- |
| Q1  | A1 (복사)                       | A2 (이동 git mv)           | A3 (next.config rewrite)  | T1만 변경                                     |
| Q2  | B2 (기존 page 교체)             | B1 ((marketing) 분리)      | B3 (/about 별도)          | T4 (라우트), T11 (시연 URL)                   |
| Q3  | E1 (MarketingLanding namespace) | E2 (Landing 확장 50+ keys) | -                         | T2, T3 (key 위치)                             |
| Q4  | M1 (CSS-only)                   | M2 (motion 설치 ~30KB)     | M3 (gsap 설치 ~50KB)      | T0 (deps 추가), T5~T8 (모션 코드)             |
| Q5  | autoplay+muted+playsinline+meta | autoplay 차단 + 클릭 재생  | poster only (영상 미사용) | T5 (hero 영상 처리)                           |
| Q6  | T11에서 합산                    | Phase B 시작 시 합산       | Phase 종료 시 1회         | PROGRESS / design-completion-status 갱신 시점 |

---

## 부록 B — 미션 문서(03_MISSION_PHASE_B) 가정 정정

미션 문서의 부정확한 가정 2건 정정 (Phase A 검증 결과 반영):

| #   | 미션 가정                                                             | 실제                                                     | 본 Plan 반영             |
| --- | --------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------ |
| 1   | 6 locale = "ko/en/ja/zh-CN/zh-TW/**th**"                              | 실제는 **vi** (Vietnamese)                               | T3에서 vi 사용           |
| 2   | T2/T3 = `packages/translations/messages/{locale}/marketing.json` 폴더 | 실제는 단일 파일 `messages/{locale}.json` (ko.json 54KB) | T2/T3에서 namespace 추가 |

---

## 부록 C — 변경 이력

| 버전 | 날짜       | 변경                                                           |
| ---- | ---------- | -------------------------------------------------------------- |
| v1   | 2026-05-17 | Phase B 산출 초안. OPEN QUESTIONS 6 default 적용. T1~T11 분해. |
