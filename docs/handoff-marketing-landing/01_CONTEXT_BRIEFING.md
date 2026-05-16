# 01 — Context Briefing (Claude Code 선행 정보)

> 이 문서는 본 채팅 AI(Claude.ai)와 Jayden이 5시간 동안 진행한 작업의 **전체 컨텍스트 요약**입니다. Claude Code는 이걸 먼저 읽고 미션을 이해해야 합니다.

---

## 1. 프로젝트 정체

- **이름**: Hesya
- **본질**: 외국인 손님 응대 자동화 SaaS (한국 미용업/자유업)
- **타깃**: Phase 1 베타 5곳 (Day 91~120)
- **보안 등급**: 🔴 RED (RLS / Auth / 결제 / 마이그)
- **본 프로젝트 위치**: `/Volumes/jayden-ssd/projects/hesya/`

---

## 2. Jayden의 정체성

- **역할**: Vibe Architect (비개발자, 디렉터, 의사결정권자)
- **AI 사용 철학**: "Human sets the Vibe, AI handles the Code"
- **선호 워크플로우**:
  - BLUF (결론 먼저)
  - OAR 보고 (Observation / Action / Rationale)
  - 비유로 설명 (전문용어 단독 사용 금지)
  - 한 번에 1 Task만 진행
  - 단계 분리 (한 번에 다 하기 X)
- **신호 단어**:
  - "확신해?" → 답변 자체 재검증
  - "오늘 기준" → 자동 웹 검색
  - "공식 문서 기준" → 출처 인용 의무
  - "모르면 모른다고 해" → 정직 모드

---

## 3. 이번 미션의 큰 그림

### 배경

- Jayden은 Hesya 본 프로젝트(`apps/web/`)를 이미 개발 중 (누적 70 PR 머지, 디자인 정합 90% 완료)
- **마케팅 랜딩페이지**는 아직 없거나 보일러플레이트만 폐기된 상태 (PROGRESS.md γ.2.3.5 완료 표시)
- 외부에서 받은 **Claude Design 결과물** (정적 HTML, 1949줄) + **Higgsfield 영상/이미지 16개** 보유

### 목표

외부 디자인 결과물을 **본 Next.js 16 프로젝트 (`apps/web/`)에 React/TypeScript로 통합**.

### 핵심 결정 사항 (본 채팅에서 합의 완료)

| 항목        | 결정                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------- |
| 통합 방식   | **B1 — `apps/web/src/app/[locale]/(marketing)/page.tsx` 라우트 그룹** (단, Phase A에서 재검증) |
| 한글 변환   | **옵션 A — 한글 메인 + 영문 보조**                                                             |
| 다국어      | next-intl 6 locale 모두 지원 (ko/en/ja/zh-CN/zh-TW/th)                                         |
| 자산 위치   | `apps/web/public/assets/{videos,images}/` (이동 필요 — Phase A 확인)                           |
| 디자인 토큰 | `docs/design/reference/tokens.css` 350줄 마스터 사용                                           |
| 작업 도구   | Claude Code 위임 (본 채팅 AI는 SSD 접근 불가)                                                  |

---

## 4. 본 채팅 AI가 이미 확인한 사실

### 4.1 본 프로젝트 스택 (확정)

| 영역       | 확정 사실                                                        |
| ---------- | ---------------------------------------------------------------- |
| 프레임워크 | Next.js 16.2.4 + React 19.2                                      |
| Auth       | Better Auth (Supabase Auth 아님)                                 |
| DB         | PostgreSQL (Supabase host) + Drizzle ORM                         |
| Migrations | HYBRID (0010까지 drizzle / 0011~ manual SQL)                     |
| i18n       | next-intl 4.11 + `src/proxy.ts` middleware                       |
| Queue      | QStash (Upstash)                                                 |
| Workspace  | pnpm + Turborepo, port 4200                                      |
| Packages   | `@hesya/{auth, database, shared-types, shared-ui, translations}` |

### 4.2 본 프로젝트 라우트 구조 (확정)

```
apps/web/src/app/[locale]/
├── admin/       (8큐 운영자 도메인)
├── c/           (Customer 도메인: chat, mypage, photo-analyze, sign-in)
├── sign-in/     (공통 로그인)
├── design-system/ (디자인 토큰 데모)
└── (store/ 폴더 존재 여부는 Phase A에서 확인 필요)
```

### 4.3 디자인 자산 (확정)

| 위치                                        | 내용                                                     | 줄/개수           |
| ------------------------------------------- | -------------------------------------------------------- | ----------------- |
| `docs/design/reference/`                    | **마스터 SSoT (claude.ai/design 출력 80개 파일)**        | 80 files          |
| `docs/design/reference/tokens.css`          | 디자인 토큰 마스터                                       | **350줄**         |
| `docs/design/reference/components.css`      | 컴포넌트 라이브러리 마스터                               | **2,248줄**       |
| `web/public/landingpage/`                   | 이번 작업 디자인 reference (5월 16일 Claude Design 출력) | 82개 파일         |
| `web/public/landingpage/Hesya Landing.html` | 본 랜딩 HTML                                             | **1,949줄, 76KB** |
| `web/public/assets/videos/`                 | Higgsfield 영상 8개                                      | 8 files           |
| `web/public/assets/images/`                 | Higgsfield 이미지 8개                                    | 8 files           |

⚠️ **주의**: `web/public/` 위치는 Next.js 정적 호스팅 외부. `apps/web/public/`로 이동 필요. **단 Phase A에서 `apps/web/` 기존 폴더 구조 확인 후 결정**.

### 4.4 본 프로젝트 워크플로우 규칙 (`CLAUDE.md` 인용)

- **Pre-Plan Inventory 의무** (5분, Plan 작성 전)
- **PROGRESS 자기평가는 e2e 시연 기준** (L-082)
- **route group은 반드시 `[locale]` 안에** — i18n 충돌 방지
- **새 DAL은 `apps/web/src/shared/lib/dal/` 사용** — 중복 금지
- **새 가드 만들기 전 `grep -rn "guard\|require" apps/web/src/shared/lib/` 의무**
- **`pnpm --filter @hesya/database db:generate` 금지** — manual SQL 마이그 충돌
- **Next.js 16에서 `middleware.ts` 금지** — `src/proxy.ts`가 middleware 자리

### 4.5 PROGRESS.md 최근 상태

- 마지막 세션: **세션 44 (2026-05-16)**
- 누적 머지: **70 PR**
- 마지막 라운드: Phase 1-ε (Owner Deletion Panel 디자인 정합) 완료
- 다음 후보: Phase 1-γ.1 KYC E2E 또는 Epic 12 admin panel
- 차단 요소: 없음

---

## 5. 본 채팅 AI가 모르는 것 (Claude Code가 확인해야 함)

Phase A에서 반드시 검증할 항목:

1. ❓ `apps/web/` 폴더에 **이미 어떤 마케팅 관련 파일이 있는지** (page.tsx 등)
2. ❓ `apps/web/public/` 폴더 현재 상태 (자산 폴더 이미 존재? 충돌?)
3. ❓ `apps/web/src/app/[locale]/page.tsx` 존재 여부 + 내용
4. ❓ `apps/web/src/app/[locale]/store/` 폴더 존재 여부 (CLAUDE.md 언급은 있지만 find 결과에 없었음)
5. ❓ `packages/translations/messages/` 구조 + 기존 keyspace
6. ❓ `packages/shared-ui/` 컴포넌트 중 마케팅에 재사용 가능한 것
7. ❓ `web/public/` 폴더가 본 프로젝트와 별개인지, 또는 무언가 의존성이 있는지

---

## 6. 결정적 충돌 가능성 (Phase A에서 확인 필요)

### 충돌 시나리오 A — 자산 위치

- `apps/web/public/` 폴더가 이미 존재하면 → `assets/` 하위 폴더만 추가
- 충돌 없으면 → `web/public/assets/`에서 이동

### 충돌 시나리오 B — 랜딩 라우트

- `apps/web/src/app/[locale]/page.tsx`가 이미 있으면 → 내용 확인 후 결정
  - 보일러플레이트면 → 교체
  - 의미 있는 페이지면 → `(marketing)/` 그룹으로 이동 또는 별도 경로

### 충돌 시나리오 C — 디자인 토큰

- `docs/design/reference/tokens.css` (350줄) vs `web/public/landingpage/tokens.css` (198줄)
- 마스터(350줄) 우선. 마케팅 zip의 토큰은 부분집합 또는 별도 추가가 있는지 검증

### 충돌 시나리오 D — 컴포넌트 중복

- `packages/shared-ui/` 또는 `apps/web/src/components/`에 이미 Hero, TrustBar, SalonCard 등 존재 가능
- 마케팅 페이지가 같은 이름으로 만들면 중복

---

## 7. 핸드오프 패키지의 위치 가정

Claude Code는 다음 경로에서 패키지를 찾을 수 있어야 합니다:

```
/Volumes/jayden-ssd/projects/hesya/docs/handoff-marketing-landing/
├── 00_README.md
├── 01_CONTEXT_BRIEFING.md (이 파일)
├── 02_MISSION_PHASE_A_AUDIT.md
├── 03_MISSION_PHASE_B_PRD_AND_PLAN.md
├── 04_ASSETS_INVENTORY.md
└── 05_DESIGN_REFERENCE_GUIDE.md
```

만약 다른 위치에 있으면 Jayden에게 확인 요청.

---

## 8. 이번 미션을 받는 Claude Code의 첫 행동

다음 4가지를 차례로 수행:

```bash
# 1. CLAUDE.md 읽기 (세션 시작 프로토콜)
cat /Volumes/jayden-ssd/projects/hesya/CLAUDE.md

# 2. PROGRESS.md 헤더 + 꼬리
head -200 /Volumes/jayden-ssd/projects/hesya/PROGRESS.md
tail -100 /Volumes/jayden-ssd/projects/hesya/PROGRESS.md

# 3. 핸드오프 패키지 5개 파일 모두 읽기
ls /Volumes/jayden-ssd/projects/hesya/docs/handoff-marketing-landing/

# 4. Phase A 미션 파일 정독
cat /Volumes/jayden-ssd/projects/hesya/docs/handoff-marketing-landing/02_MISSION_PHASE_A_AUDIT.md
```

그 후 Phase A 미션 수행.

---

## 9. 핵심 원칙 요약

> "정직한 모름 > 그럴듯한 추측"

확실하지 않으면 **OPEN QUESTIONS**에 추가. 추측으로 메우지 말 것. Jayden 메모리 규칙: "모르면 모른다고 답하기 = 도움이 되려는 본능에 굴복하지 말 것".

---

이제 `02_MISSION_PHASE_A_AUDIT.md`를 읽고 Phase A 미션을 시작합니다.
