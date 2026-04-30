# 비개발자 안전 워크플로우 (Jayden 표준)

> v10.2 자동 생성 — 바이브코딩 4단계 + 임시방편 차단 + 하네스 엔지니어링

---

## 📋 4단계 표준 흐름

```
[Step 1: 계획]      → 코드 작성 X, 검증된 계획만
[Step 2: 분업]      → 전문 에이전트 협업
[Step 3: 에러]      → 근본 원인 (임시방편 금지)
[Step 4: 완료]      → 검증 게이트 통과 후 배포
```

---

## 🎯 Step 1: 계획 (코딩 X)

### 흐름

```
1. 아이디어 → /spec 스킬
   → docs/PRD.md 자동 작성 (12 섹션)

2. /spec-design 스킬
   → 기술 설계 + 데이터 흐름 + 컴포넌트 구조

3. /autoplan 스킬 ⭐ (가장 중요)
   → 4명 자동 검토:
     · CEO 관점 (제품 가치)
     · Eng 관점 (아키텍처)
     · Design 관점 (UX/일관성)
     · DevEx 관점 (개발자 경험)
   → 6원칙으로 자동 결정
   → "취향 결정"만 Jayden에게 질문

4. /check-design 스킬
   → 기존 코드와 충돌 검사

5. Jayden 승인 후 → Step 2
```

### 명령어 시퀀스 (복붙용)

```
/spec                  # 1단계: PRD 작성
/spec-design           # 2단계: 기술 설계
/autoplan              # 3단계: 4관점 자동 검토 ⭐
/check-design          # 4단계: 코드 충돌 검사
```

### ⚠️ 절대 금지

- 계획 없이 코딩 시작
- /autoplan 건너뛰고 바로 구현
- "Not Doing" 섹션 없는 PRD

---

## 🤝 Step 2: 분업 (병렬/순차)

### 글로벌 전문 에이전트 6명 (~/.claude/agents/)

| 에이전트         | 역할                      | 호출 시점       |
| ---------------- | ------------------------- | --------------- |
| **architect**    | 시스템 설계, 모듈 경계    | 큰 변경 시작    |
| **db-engineer**  | 스키마, 마이그레이션, RLS | DB 구조 변경    |
| **backend-dev**  | API, Server Action        | 비즈니스 로직   |
| **frontend-dev** | React, shadcn, Tailwind   | UI 작업         |
| **ux-designer**  | UX 설계, 컴포넌트 선택    | 페이지 레이아웃 |
| **qa-tester**    | 테스트, 엣지 케이스       | 기능 완성 후    |

### 패턴 A: Sequential (권장 — 비개발자에 안전)

```
architect → db-engineer → backend-dev → frontend-dev → qa-tester
```

각 단계가 이전 결과 위에 쌓아 올림 → 충돌 없음.

### 패턴 B: Parallel + Orchestrator (속도 ↑)

```
[main Claude]
   ├─→ db-engineer    (병렬)
   ├─→ backend-dev    (병렬)
   ├─→ frontend-dev   (병렬)
   └─→ ux-designer    (병렬)
        ↓
[main이 통합 + 충돌 해결]
```

### 패턴 C: Git Worktree (대규모 — 5개+ 기능 동시)

```bash
# 각 기능별 독립 폴더 + 별도 Claude 세션
git worktree add ../my-app-auth feature/auth
git worktree add ../my-app-board feature/board
git worktree add ../my-app-payment feature/payment

# 5개 Claude Code 세션 동시 진행 → main에 머지
```

### Feature-Based 폴더로 자동 분리

```
src/features/
├── auth/        ← 로그인 (독립)
├── board/       ← 게시판 (독립)
└── payment/     ← 결제 (독립)
```

> 각 feature는 `index.ts`로만 외부 노출 → 충돌 없이 합쳐짐.

### 명령어 시퀀스

```
사용자: 로그인 기능 만들어줘

Claude (자동):
  → architect 에이전트 (전체 설계)
  → db-engineer 에이전트 (users 테이블)
  → backend-dev 에이전트 (auth Server Action)
  → frontend-dev 에이전트 (LoginForm 컴포넌트)
  → qa-tester 에이전트 (테스트)
  → code-reviewer + security-reviewer (통합 검토)
```

---

## 🔧 Step 3: 에러 발생 시 (Iron Law)

### 🏛️ Iron Law (철의 법칙)

> **"NO FIXES WITHOUT ROOT CAUSE FIRST"**
> 근본 원인 파악 전에는 절대 수정 금지

### ⛔ 임시방편 4대 패턴 (자동 차단)

```typescript
// ❌ #1: 에러 삼킴
try {
  doSomething();
} catch {}

// ❌ #2: 타입 우회
// @ts-ignore
const x = badData;

// ❌ #3: 타이밍 우회
setTimeout(() => fixIt(), 1000);

// ❌ #4: 무조건 폴백
if (!data) return defaultData;
```

→ ESLint 룰로 **자동 차단**됨.

### ✅ 올바른 흐름: /investigate 스킬 (4단계)

```
사용자: "버튼이 안 눌려"

Claude → /investigate 스킬 자동 발동:

┌──────────────────────────────────────────┐
│ Phase 1: 조사 (Investigate)              │
│ - 어떤 버튼? 어떤 페이지?                │
│ - 콘솔 에러? 네트워크 에러?              │
│ - 재현 가능한 단계?                       │
│ → 추측 금지. 증거만.                     │
├──────────────────────────────────────────┤
│ Phase 2: 분석 (Analyze)                  │
│ - 코드 흐름 추적                          │
│ - 비슷한 에러 전에 있었나?                │
│ - "왜 이렇게 작동하는지" 모델 구축        │
├──────────────────────────────────────────┤
│ Phase 3: 가설 (Hypothesize)              │
│ - "이게 원인이라면 X도 발생해야 함"      │
│ - 증명 (코드 수정 전!)                   │
│ - 가설 틀림 → Phase 1 다시              │
├──────────────────────────────────────────┤
│ Phase 4: 구현 (Implement)                │
│ - 근본 원인 수정                          │
│ - 회귀 테스트 추가                        │
│ - learnings.md에 교훈 기록                │
└──────────────────────────────────────────┘
```

### 보조 도구

- **silent-failure-hunter** 에이전트 — 에러 삼킴 자동 탐지
- **factual-reviewer** 에이전트 — AI 환각 잡기
- **tdd-guard** (글로벌) — 테스트 없이 수정 자동 차단
- **/codex** — 외부 LLM 교차 검증

### 명령어 (에러 발생 시)

```
/investigate           # 4단계 근본 원인 (절대 추측 금지)
/fix                   # 체계적 수정
/focused-fix           # 한 모듈 끝까지 작동하게
```

### ⚠️ 절대 금지

- "임시로 try-catch로 감싸자"
- "@ts-ignore 일단 넣자"
- "setTimeout으로 일단 동작하게"
- "기본값 넣고 넘어가자"

→ 모두 **임시방편**. /investigate가 강제로 막음.

---

## ✅ Step 4: 완료 검증

### 자동 게이트 (CI/CD)

```
[코드 작성]
  → tdd-guard (테스트 없이 수정 차단)
  → tsc PostToolUse Hook (타입 즉시 체크)

[git commit]
  → husky pre-commit:
    · gitleaks (시크릿 차단)
    · lint-staged (변경 파일 lint+format)
  → commitlint (메시지 형식)

[git push / PR]
  → GitHub Actions:
    · tsc --noEmit
    · pnpm lint --max-warnings 0
    · pnpm build
    · gitleaks detect

[배포 직전]
  → pnpm safe:deploy:
    · 자동 5개 (tsc/lint/build/gitleaks/env)
    · 수동 8개 (Server Action 인증, RLS, CSP, etc.)

[배포 후]
  → /canary 스킬 (5분 모니터링)
```

### 수동 검증 (최종)

```
/done                              # 검증 게이트 통과 확인
/verification-before-completion    # 완료 선언 전 검증
/health                            # 코드 품질 0~10 점수
```

### 명령어

```bash
pnpm safe:commit "feat: 메시지"   # 자동 검증 + 커밋
pnpm safe:deploy                  # 13개 체크 + Vercel 배포
```

---

## 🚨 비상시 명령어

| 상황                | 명령어              | 효과               |
| ------------------- | ------------------- | ------------------ |
| 30분+ 막힘          | /investigate        | 4단계 강제         |
| 작업 상태 저장      | /checkpoint         | 다음 세션 재개용   |
| 위험한 작업 시작 전 | /freeze 또는 /guard | 디렉토리 격리      |
| 회귀 발생 의심      | /qa-only            | QA 자동 + 보고만   |
| 디자인 망가짐       | /design-review      | 시각적 QA          |
| AI 코드 의심        | /codex              | 외부 LLM 교차 검증 |

---

## 🎓 비개발자 권장 습관 5가지

1. **계획 없이 코딩 X** — /autoplan 통과 전엔 손도 대지 말 것
2. **에러 = /investigate** — 추측 금지, 4단계 강제
3. **30분 막히면 멈춤** — learnings.md 기록 후 /clear, /investigate로 재시작
4. **임시방편 = 함정** — try-catch / @ts-ignore / setTimeout 금지
5. **completion ≠ working** — /done 통과 전엔 "끝났다" 선언 X

---

---

## 🦸 Superpowers 통합 (선택, 강력 권장)

obra/superpowers는 Anthropic 공식 마켓 등재된 14개 스킬 패키지.
v10.3 워크플로우와 자동 연동됨.

### 설치 (Claude Code 세션에서)

```
/plugin install superpowers@claude-plugins-official
```

설치 확인:

```
/plugin list
```

### Phase별 Superpowers 스킬 매핑

#### Phase 2 (계획) 강화

| v10.2 표준    | + Superpowers                    |
| ------------- | -------------------------------- |
| /spec         | + /brainstorming (Socratic 질문) |
| /spec-design  | + /writing-plans (5분 단위 Task) |
| /autoplan     | (그대로)                         |
| /check-design | (그대로)                         |
| /spec-tasks   | + /executing-plans (체크포인트)  |

#### Phase 3 (개발) 강화 ⭐ 핵심

| v10.2 표준        | + Superpowers                         |
| ----------------- | ------------------------------------- |
| planner 에이전트  | + /writing-plans 스킬                 |
| 분업 (글로벌 6명) | + **/dispatching-parallel-agents** ⭐ |
| 단일 세션         | + **/using-git-worktrees** (5개 동시) |
| code-reviewer     | + /requesting-code-review (요청 표준) |
|                   | + /receiving-code-review (수용 표준)  |

#### Phase 3D (에러) 강화

| v10.2 표준             | + Superpowers                                |
| ---------------------- | -------------------------------------------- |
| /investigate (4단계)   | + /systematic-debugging (같은 4단계, 표준화) |
| code-reviewer Iron Law | + /verification-before-completion            |

#### Phase 4 (완료) 강화

| v10.2 표준       | + Superpowers                     |
| ---------------- | --------------------------------- |
| /done            | + /finishing-a-development-branch |
| pnpm safe:commit | (그대로)                          |

### Jayden 추천 — 즉시 활용할 3개 스킬

1. **/dispatching-parallel-agents** ⭐
   - 분업+합치기 자동화
   - "로그인+게시판+결제 동시에" 가능
   - Git worktree 자동 활용

2. **/systematic-debugging** ⭐
   - /investigate와 거의 동일 (둘 다 사용 가능)
   - Iron Law 표준 패턴

3. **/test-driven-development**
   - RED→GREEN→REFACTOR 자동
   - tdd-guard와 시너지

### 설치 후 첫 사용 시퀀스

```
✋ Jayden: /plugin install superpowers@claude-plugins-official
🤖 Claude: 설치 완료
✋ Jayden: /using-superpowers
🤖 Claude: Superpowers 시스템 소개 출력
✋ Jayden: 새 기능 개발 시 → /brainstorming → /writing-plans → ...
```

---

## 📚 추가 참고

- `CLAUDE.md` — 프로젝트 규칙 (이 워크플로우 요약)
- `docs/PRD-template.md` — PRD 작성 템플릿
- `docs/SAFETY-CHECKLIST.md` — 배포 전 13개 체크
- `docs/learnings.md` — 교훈 기록 (재발 방지)
- `src/features/README.md` — Feature 경계 규칙
- `src/shared/lib/dal/README.md` — DB 접근 패턴
