# 02 — MISSION Phase A: 프로젝트 탐사 + Audit Report

> **누가 읽나**: Claude Code
> **목적**: 본 프로젝트 현황 + 충돌 가능성 + Open Questions 도출
> **소요 시간**: ~30분
> **결과물**: `docs/handoff-marketing-landing/AUDIT_REPORT.md`
> **⛔️ 절대 코드 작성하지 말 것** — 이 Phase는 탐사만

---

## 🎯 Mission

본 채팅 AI(Claude.ai)가 Jayden과 5시간 동안 진행한 마케팅 랜딩페이지 통합 작업을, 본 프로젝트(`apps/web/`)에 안전하게 진입할 수 있도록 **현황을 정확히 파악하고 충돌 가능성을 식별**한다.

코드 작성은 **이 Phase에서 절대 금지**. Phase B(다음 미션)에서 PRD + Plan v1 작성 → Jayden 승인 → 별도 세션에서 구현 시작.

---

## 📋 전제 — 시작 전 의무 (Pre-Mission)

### Step 0 — 컨텍스트 흡수 (5분)

```bash
# 1. 글로벌 가이드라인
cat /Volumes/jayden-ssd/projects/hesya/CLAUDE.md

# 2. 현재 진행 상황
head -200 /Volumes/jayden-ssd/projects/hesya/PROGRESS.md
tail -100 /Volumes/jayden-ssd/projects/hesya/PROGRESS.md

# 3. 선행 컨텍스트 (본 채팅 AI가 정리한 모든 배경)
cat /Volumes/jayden-ssd/projects/hesya/docs/handoff-marketing-landing/01_CONTEXT_BRIEFING.md

# 4. 자산 매핑 (Higgsfield 영상/이미지 16개)
cat /Volumes/jayden-ssd/projects/hesya/docs/handoff-marketing-landing/04_ASSETS_INVENTORY.md

# 5. 디자인 reference 처리 원칙
cat /Volumes/jayden-ssd/projects/hesya/docs/handoff-marketing-landing/05_DESIGN_REFERENCE_GUIDE.md
```

흡수 후 Jayden에게 1줄 보고:

> "Phase A 시작 — CLAUDE.md / PROGRESS.md / 컨텍스트 5개 모두 흡수 완료. 인벤토리 시작합니다."

---

## 🔍 Audit Step 1 — 본 프로젝트 구조 정밀 탐사

CLAUDE.md "Pre-Plan Inventory" 절차 5단계 의무 수행:

### 1.1 키워드 grep (마케팅 관련 기존 자산 검색)

```bash
cd /Volumes/jayden-ssd/projects/hesya

# 1.1.1 기존 marketing/landing 관련 파일
grep -rln "marketing\|landing\|hero" apps/web/src/ packages/ \
  --include="*.tsx" --include="*.ts" 2>/dev/null

# 1.1.2 (marketing) route group 존재 여부
find apps/web/src/app -type d -name "(marketing)" 2>/dev/null

# 1.1.3 root page.tsx / layout.tsx 존재 + 내용
ls -la apps/web/src/app/[locale]/page.tsx 2>/dev/null
ls -la apps/web/src/app/[locale]/layout.tsx 2>/dev/null
cat apps/web/src/app/[locale]/page.tsx 2>/dev/null

# 1.1.4 기존 마케팅 컴포넌트
grep -rln "TrustBar\|FeaturedSalon\|UGCWall\|KVerified" \
  packages/shared-ui/src/ apps/web/src/ \
  --include="*.tsx" 2>/dev/null
```

### 1.2 작업 영역 ls

```bash
# 1.2.1 app/[locale] 전체 구조 (사용자가 store/ 폴더 확인 못 했던 부분)
ls -la apps/web/src/app/\[locale\]/

# 1.2.2 store 도메인 존재 여부
ls apps/web/src/app/\[locale\]/store/ 2>/dev/null && echo "✅ store 존재" || echo "❌ store 없음"

# 1.2.3 apps/web/public 현재 상태
ls -la apps/web/public/ 2>/dev/null

# 1.2.4 shared-ui 패키지
ls packages/shared-ui/src/
find packages/shared-ui/src -name "*.tsx" 2>/dev/null | head -20

# 1.2.5 translations 구조
ls packages/translations/messages/
ls packages/translations/messages/ko/ 2>/dev/null | head -20

# 1.2.6 디자인 토큰 위치 확인
find apps/web/src -name "tokens.css" 2>/dev/null
find packages -name "tokens.css" 2>/dev/null
ls docs/design/reference/tokens.css 2>/dev/null
```

### 1.3 외부 디자인 reference 자산 확인

본 채팅 AI가 가정한 위치들. 실제로 존재하는지 검증:

```bash
# 1.3.1 디자인 reference (마스터 80 files)
ls docs/design/reference/ 2>/dev/null | wc -l
wc -l docs/design/reference/tokens.css 2>/dev/null
wc -l docs/design/reference/components.css 2>/dev/null

# 1.3.2 Claude Design 마케팅 랜딩 HTML
ls -la "/Volumes/jayden-ssd/projects/hesya/web/public/landingpage/Hesya Landing.html" 2>/dev/null
wc -l "/Volumes/jayden-ssd/projects/hesya/web/public/landingpage/Hesya Landing.html" 2>/dev/null

# 1.3.3 web/public/landingpage 전체 (외부 디자인 reference)
ls /Volumes/jayden-ssd/projects/hesya/web/public/landingpage/ 2>/dev/null | wc -l

# 1.3.4 Higgsfield 자산 16개
ls /Volumes/jayden-ssd/projects/hesya/web/public/assets/videos/ 2>/dev/null
ls /Volumes/jayden-ssd/projects/hesya/web/public/assets/images/ 2>/dev/null

# 1.3.5 web/ 폴더가 본 프로젝트 어딘가에 의존성 있는지
grep -rn "web/public/landingpage\|web/public/assets" \
  apps/ packages/ docs/ \
  --include="*.ts" --include="*.tsx" --include="*.md" --include="*.json" \
  2>/dev/null | head -10
```

### 1.4 시연 prerequisite 검증 (L-082)

```bash
# 1.4.1 dev 서버 실행 가능
cat apps/web/package.json | grep "\"dev\""

# 1.4.2 빌드 명령 확인
cat package.json | grep "\"build\""

# 1.4.3 마지막 PR 빌드 성공 여부 (PROGRESS.md에서 확인)
grep -i "build\|vercel" PROGRESS.md | tail -10

# 1.4.4 현재 main 깨끗한지
cd /Volumes/jayden-ssd/projects/hesya && git status
git log --oneline -10
```

### 1.5 디자인 토큰 비교 (마스터 vs 마케팅)

```bash
# 1.5.1 마스터에만 있는 토큰
echo "━━━━━ 마스터(350줄)에만 있는 토큰 ━━━━━"
comm -23 \
  <(grep -oE '^\s+--[a-z0-9-]+:' docs/design/reference/tokens.css 2>/dev/null | sort -u) \
  <(grep -oE '^\s+--[a-z0-9-]+:' web/public/landingpage/tokens.css 2>/dev/null | sort -u)

# 1.5.2 마케팅에만 있는 토큰 (마스터에 머지 필요할 수도)
echo "━━━━━ 마케팅(198줄)에만 있는 토큰 ━━━━━"
comm -13 \
  <(grep -oE '^\s+--[a-z0-9-]+:' docs/design/reference/tokens.css 2>/dev/null | sort -u) \
  <(grep -oE '^\s+--[a-z0-9-]+:' web/public/landingpage/tokens.css 2>/dev/null | sort -u)
```

---

## 🔍 Audit Step 2 — 충돌 가능성 분석

위 결과를 바탕으로 다음 충돌 시나리오 각각에 대해 평가:

### 충돌 A — 자산 위치

| 질문                                                           | 답                        |
| -------------------------------------------------------------- | ------------------------- |
| `apps/web/public/` 폴더 존재?                                  | ✅/❌                     |
| `apps/web/public/assets/` 폴더 이미 있음?                      | ✅/❌                     |
| `web/public/assets/` → `apps/web/public/assets/` 이동 시 충돌? | ✅/❌                     |
| 자산 16개 검증 가능?                                           | ✅/❌ (영상 8 + 이미지 8) |

### 충돌 B — 랜딩 라우트

| 질문                                                   | 답                                                     |
| ------------------------------------------------------ | ------------------------------------------------------ |
| `apps/web/src/app/[locale]/page.tsx` 존재?             | ✅/❌                                                  |
| 존재한다면 내용은?                                     | 보일러플레이트 / design-system 데모 / 의미 있는 페이지 |
| `(marketing)` route group 이미 존재?                   | ✅/❌                                                  |
| `[locale]/layout.tsx` 내용 (전역 nav/footer 포함 여부) | 요약                                                   |

### 충돌 C — 디자인 토큰

| 질문                                                             | 답    |
| ---------------------------------------------------------------- | ----- |
| 마스터 토큰(350줄)이 본 프로젝트에서 import되는 위치?            | 경로  |
| 마케팅 토큰(198줄)이 마스터 부분집합인가?                        | ✅/❌ |
| 마케팅에만 있는 새 토큰 개수?                                    | N개   |
| 새 토큰이 추가되어야 하는가, 또는 마스터 토큰으로 대체 가능한가? | 판단  |

### 충돌 D — 컴포넌트

| 질문                                                                           | 답          |
| ------------------------------------------------------------------------------ | ----------- |
| `packages/shared-ui/`에 재사용 가능한 마케팅 컴포넌트?                         | 목록        |
| 이름 충돌 가능성 (예: 기존 `Hero`)?                                            | ✅/❌       |
| 마케팅 페이지가 `shared-ui`를 사용해야 하는가, `_components/` 격리해야 하는가? | 판단 + 근거 |

### 충돌 E — i18n

| 질문                                                    | 답               |
| ------------------------------------------------------- | ---------------- |
| 6 locale 확인 (ko/en/ja/zh-CN/zh-TW/th)?                | 실제 locale 목록 |
| 기존 `messages/ko/` 구조 (namespace 분리 패턴)?         | 요약             |
| 마케팅 namespace를 `marketing.json`으로 신규 추가 가능? | ✅/❌            |

---

## 🔍 Audit Step 3 — 본 채팅 AI의 가정 검증

본 채팅 AI가 가정했지만 검증되지 않은 항목들:

| #   | 가정                                                                 | 검증 결과 | 정정 필요? |
| --- | -------------------------------------------------------------------- | --------- | ---------- |
| 1   | 본 프로젝트 = Next.js 16.2.4 + Better Auth + Drizzle                 | ⏳        |            |
| 2   | next-intl 6 locale 모두 작동 중                                      | ⏳        |            |
| 3   | route group은 반드시 `[locale]` 안에 (CLAUDE.md 규칙)                | ⏳        |            |
| 4   | `docs/design/reference/`가 마스터 SSoT (80 files)                    | ⏳        |            |
| 5   | `web/public/landingpage/`는 본 프로젝트와 무관한 임시 폴더           | ⏳        |            |
| 6   | `apps/web/public/` 자산 폴더가 정답 (Next.js 정적 호스팅)            | ⏳        |            |
| 7   | 마케팅 라우트는 `[locale]/(marketing)/page.tsx`가 정답               | ⏳        |            |
| 8   | 현재 진행 중인 다른 P0/P1 작업과 충돌 없음 (PROGRESS.md 차단 요소 0) | ⏳        |            |

각각 ✅(확인) / ❌(반증) / ⚠️(부분 검증)로 표시.

---

## 📝 Audit Report 작성

위 1~3 단계 결과를 종합해서 `docs/handoff-marketing-landing/AUDIT_REPORT.md` 작성. 형식은 다음을 따를 것:

```markdown
# Audit Report — Marketing Landing 통합 Phase A

**작성**: Claude Code, 2026-MM-DD
**소요**: ~30분
**결과**: ✅ Green / ⚠️ Yellow / 🔴 Red (한 단어)

---

## 1. Executive Summary (BLUF, 5줄)

- 본 채팅 AI 가정 검증: N/8 확인, M/8 정정 필요
- 충돌 위험: A/B/C/D/E 중 N개에서 발견
- Open Questions: N개 (Jayden 답변 필요)
- Phase B(PRD + Plan v1) 진행 가능 여부: ✅/⚠️/🔴
- 가장 큰 리스크: [한 줄 요약]

## 2. Inventory 결과 (위 Audit Step 1)

(grep / ls / find / wc 결과를 그대로 인용 + 해석)

## 3. 충돌 분석 (Audit Step 2)

(A~E 각 충돌의 평가표)

## 4. 가정 검증 (Audit Step 3)

(8개 가정 각각 ✅/❌/⚠️)

## 5. ❓ OPEN QUESTIONS (Jayden 답변 필요)

Jayden의 답변 없이는 PRD를 정확히 작성할 수 없는 항목들:

### Q1. [질문]

- 배경: [왜 모호한지]
- 옵션 A: [선택지 1] — 장단점
- 옵션 B: [선택지 2] — 장단점
- 페르소나 권장: [추천 + 근거]
- Jayden 답변: ****\_\_\_****

### Q2. ...

(보통 3~5개의 OPEN QUESTIONS가 나옴)

## 6. 페르소나 권장 다음 단계

위 모든 결과를 종합한 **Phase B 진행 추천 사항**:

- Phase B PRD에 반영할 핵심 결정 사항
- 별도 처리 필요 항목 (예: 자산 이동, 토큰 머지)
- Phase C(구현) 시작 전 추가 검증 필요 항목

## 7. OAR 종합 보고 (Jayden용)

### Observation

(발견한 주요 사실)

### Action

(이 Audit에서 수행한 모든 작업)

### Rationale

(이 Audit의 결론과 근거)
```

---

## ⛔️ 절대 하지 말 것

1. ❌ **어떤 코드도 작성하지 말 것** (.tsx, .ts, .css, .json 신규/수정 0개)
2. ❌ **추측 답변 금지** — 불확실하면 OPEN QUESTIONS에 추가
3. ❌ **PROGRESS.md 갱신 금지**
4. ❌ **기존 파일 수정 금지** (`docs/design/reference/`, `web/public/landingpage/` 포함)
5. ❌ **Phase B 작업으로 넘어가지 말 것** — Audit Report 작성 후 멈추기
6. ❌ **자산 이동 명령 실행 금지** — Phase B에서 PRD로 다룰 것
7. ❌ **Audit Report에 "30%, 70%" 등 자기평가 % 표시 금지** — L-082 e2e 시연 기준

---

## ✅ Phase A 완료 조건

- [ ] CLAUDE.md + PROGRESS.md + 핸드오프 패키지 5개 모두 읽음
- [ ] Audit Step 1 (5단계 인벤토리) 완료
- [ ] Audit Step 2 (5가지 충돌 분석) 완료
- [ ] Audit Step 3 (8개 가정 검증) 완료
- [ ] `docs/handoff-marketing-landing/AUDIT_REPORT.md` 작성 완료
- [ ] OAR 보고서 형식으로 Jayden에 출력

---

## 🎯 보고 후 다음 단계

Audit Report 제출 후:

1. **Jayden이 OPEN QUESTIONS에 답변**
2. **Jayden이 Audit Report 검토 + 승인**
3. **Phase B 시작** — `03_MISSION_PHASE_B_PRD_AND_PLAN.md` 미션 받기

**Phase A 종료 시 출력 마지막 줄**:

> "✅ Phase A 완료. Audit Report 작성 완료. Jayden님, OPEN QUESTIONS 답변 + Phase A 승인 부탁드립니다. 승인 후 Phase B(PRD + Plan v1)로 진행하겠습니다."

---

## 🆘 트러블슈팅

| 증상                                 | 대응                                                |
| ------------------------------------ | --------------------------------------------------- |
| 핸드오프 패키지가 없거나 다른 위치   | Jayden에게 위치 확인 요청. 그 전까지 작업 시작 금지 |
| `web/public/landingpage/` 폴더 없음  | Jayden에게 zip 압축 푼 위치 확인 요청               |
| `apps/web/public/`이 비어있거나 충돌 | OPEN QUESTIONS에 명시                               |
| `[locale]/page.tsx` 충돌 가능        | OPEN QUESTIONS에 명시                               |
| git 상태 dirty                       | OPEN QUESTIONS에 명시 + 작업 일시 중단              |

---

## 📌 시작 한 줄 명령 (Jayden이 채팅창에 입력)

> "`/Volumes/jayden-ssd/projects/hesya/docs/handoff-marketing-landing/02_MISSION_PHASE_A_AUDIT.md` 읽고 Phase A 미션 시작해줘"

이 명령을 받으면 Claude Code는 이 파일 처음부터 끝까지 따른다.
