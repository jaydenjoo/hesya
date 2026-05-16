# Hesya Marketing Landing 통합 — Claude Code 위임 패키지

> **2026-05-16 작성 (v2 — 다운로드 경로 정정)**
> **위임 대상**: Claude Code (사용자의 Mac mini, `/Volumes/jayden-ssd/projects/hesya/`)
> **위임 사유**: 본 채팅 AI는 사용자 SSD에 직접 접근 불가. Claude Code가 직접 탐사 + 의사결정.
> **사용자 환경**: Claude.ai 다운로드 경로 = `/Volumes/jayden-ssd/다운로드/` (외장 SSD)

---

## 📦 이 패키지 구성

| #   | 파일                                     | 누가 읽나   | 목적                                                             |
| --- | ---------------------------------------- | ----------- | ---------------------------------------------------------------- |
| 0   | **`00_README.md`** (이 파일)             | Jayden      | 패키지 사용법                                                    |
| 1   | **`01_CONTEXT_BRIEFING.md`**             | Claude Code | 지금까지의 모든 컨텍스트 + 현재 상태                             |
| 2   | **`02_MISSION_PHASE_A_AUDIT.md`**        | Claude Code | **Phase A** — 프로젝트 탐사 + 현황 보고 (코드 작성 X)            |
| 3   | **`03_MISSION_PHASE_B_PRD_AND_PLAN.md`** | Claude Code | **Phase B** — Phase A 결과 + Jayden 답변 기반 PRD + Plan v1 작성 |
| 4   | **`04_ASSETS_INVENTORY.md`**             | Claude Code | 16개 자산 매핑표 + 현재 위치 + 사용 위치                         |
| 5   | **`05_DESIGN_REFERENCE_GUIDE.md`**       | Claude Code | 디자인 reference 위치 + 변환 원칙 (한글 메인 + 영문 보조)        |

---

## 🚀 사용자(Jayden) 액션 — 4단계

### Step 1 — 패키지를 프로젝트 안에 배치 (1분)

⚠️ **Claude.ai 다운로드 경로가 외장 SSD로 설정되어 있음** (`/Volumes/jayden-ssd/다운로드/`). 한글 폴더명이라 터미널에서 따옴표 처리 의무.

#### Step 1-A — 다운로드된 파일 확인 (10초)

```bash
ls "/Volumes/jayden-ssd/다운로드/" | grep -E "0[0-5]_.*\.md"
```

**기대 결과**: 6개 파일 표시

- `00_README.md`
- `01_CONTEXT_BRIEFING.md`
- `02_MISSION_PHASE_A_AUDIT.md`
- `03_MISSION_PHASE_B_PRD_AND_PLAN.md`
- `04_ASSETS_INVENTORY.md`
- `05_DESIGN_REFERENCE_GUIDE.md`

#### Step 1-B — 핸드오프 폴더 생성 + 이동 (안전 모드, 30초)

```bash
# 1. 기존 핸드오프 폴더가 있으면 자동 백업 (덮어쓰기 방지)
[ -d /Volumes/jayden-ssd/projects/hesya/docs/handoff-marketing-landing ] && \
  mv /Volumes/jayden-ssd/projects/hesya/docs/handoff-marketing-landing \
     /Volumes/jayden-ssd/projects/hesya/docs/handoff-marketing-landing.bak.$(date +%Y%m%d-%H%M%S) && \
  echo "✅ 기존 폴더 자동 백업됨"

# 2. 새 폴더 생성
mkdir -p /Volumes/jayden-ssd/projects/hesya/docs/handoff-marketing-landing

# 3. 6개 .md 파일 이동 (한글 폴더명 따옴표 처리)
mv "/Volumes/jayden-ssd/다운로드/"0*_*.md \
   /Volumes/jayden-ssd/projects/hesya/docs/handoff-marketing-landing/

# 4. 검증
echo "━━━━━ 이동된 파일 (목표: 6개) ━━━━━"
ls /Volumes/jayden-ssd/projects/hesya/docs/handoff-marketing-landing/
echo ""
echo "━━━━━ 총 파일 수 ━━━━━"
ls /Volumes/jayden-ssd/projects/hesya/docs/handoff-marketing-landing/ | wc -l
echo "(목표: 6)"
```

**기대 결과**:

- 6개 .md 파일 모두 이동
- 기존 폴더가 있었다면 `.bak.YYYYMMDD-HHMMSS`로 자동 백업

비유 — 책장을 옮길 때 기존 책장도 그대로 두고 옆에 새 책장을 두는 안전 모드입니다. 실수해도 복구 가능.

### Step 2 — Claude Code 실행 (Phase A)

```bash
cd /Volumes/jayden-ssd/projects/hesya
claude --model sonnet
```

채팅창에 한 줄만:

```
docs/handoff-marketing-landing/02_MISSION_PHASE_A_AUDIT.md 읽고 Phase A 미션 시작해줘
```

Claude Code가 **Pre-Plan Inventory 보고서**를 작성하고 멈춥니다 (코드 작성 0).

### Step 3 — Phase A 결과 검토 + 질문 답변 (15분)

Claude Code의 **AUDIT REPORT**를 받으면:

- 발견된 충돌·리스크 확인
- **OPEN QUESTIONS (Jayden 답변 필요)** 항목에 답변
- 답변을 채팅에 그대로 입력

### Step 4 — Phase B 시작 (PRD + Plan v1)

```
docs/handoff-marketing-landing/03_MISSION_PHASE_B_PRD_AND_PLAN.md 읽고 PRD + Plan v1 작성해줘
```

Claude Code가 PRD 초안 + Plan v1 작성. Jayden 검토 + 승인 후 → **다음 세션에서 Task 단위 구현 시작**.

---

## ⚠️ 핵심 규칙 — Claude Code가 100% 준수해야 함

### 절대 하지 말 것

1. ❌ **Phase A에서 코드 작성 금지** — 탐사 + 보고서만
2. ❌ **Phase B에서 코드 작성 금지** — PRD + Plan만, Jayden 승인 후 Task 시작
3. ❌ **CLAUDE.md / PROGRESS.md 미독 상태에서 시작 금지**
4. ❌ **`docs/design/reference/` 마스터 파일 수정 금지** — 80개 파일 SSoT
5. ❌ **`web/public/landingpage/` 정적 HTML 수정 금지** — 디자인 reference 보존
6. ❌ **추측 답변 금지** — 불확실하면 OPEN QUESTIONS에 추가
7. ❌ **스코프 크리프 금지** — Phase A는 탐사, Phase B는 PRD, 코드는 별도 세션

### 반드시 할 것

1. ✅ **CLAUDE.md + PROGRESS.md 먼저 읽기** (세션 시작 프로토콜)
2. ✅ **Pre-Plan Inventory 5단계 수행** (CLAUDE.md 의무)
3. ✅ **OAR 보고서 형식** (Observation / Action / Rationale)
4. ✅ **현재 자기평가는 e2e 시연 통과 후에만 갱신** (L-082)

---

## 🎯 미션 전체 흐름

```
[Phase A — Audit] ✅ 이 패키지 사용
  └─ Claude Code가 프로젝트 탐사
  └─ AUDIT REPORT + OPEN QUESTIONS 작성
  └─ Jayden 검토 + 답변

[Phase B — Plan] ✅ 이 패키지 사용
  └─ Claude Code가 PRD + Plan v1 작성
  └─ Jayden 검토 + 승인

[Phase C — Implement] ⏳ 별도 세션
  └─ Task 1, 2, 3... 순차 머지
  └─ 각 Task tsc + lint + build + test 통과 후 다음

[Phase D — Demo] ⏳ Jayden 시연 후 PROGRESS.md 갱신
```

비유 — 영화 제작에서 사전조사(헌팅) → 시나리오 → 촬영 → 편집 → 시사회 단계와 같습니다. 시사회 통과 전 자기 평가 금지.

---

## 📌 Phase A 패키지 사용 시 주의

Claude Code 채팅창에 **`02_MISSION_PHASE_A_AUDIT.md` 한 번만 전달**하면 됩니다. Phase A 안에 다음 파일들 자동 참조 지시가 포함됨:

- `01_CONTEXT_BRIEFING.md` (선행 컨텍스트)
- `04_ASSETS_INVENTORY.md` (자산 매핑)
- `05_DESIGN_REFERENCE_GUIDE.md` (디자인 reference 처리)

즉 사용자는 **02 파일 경로만 알려주면** 됩니다.

---

## 🆘 트러블슈팅

### 패키지 배치 단계 (Step 1)

| 증상                                                           | 원인                                       | 해결                                           |
| -------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------- |
| `ls: /Volumes/jayden-ssd/다운로드/: No such file or directory` | 다운로드 경로 변경됨 또는 한글 인코딩 문제 | 실제 경로 확인: `ls /Volumes/jayden-ssd/`      |
| `grep -E "0[0-5]_.*\.md"` 결과 빈 출력                         | Claude.ai에서 아직 다운로드 안 됨          | 채팅 위 6개 파일 위젯에서 다시 다운로드        |
| `mv` 명령에서 "No such file or directory"                      | 6개 파일이 아직 다운로드 폴더에 없음       | Step 1-A로 돌아가 파일 존재 확인               |
| 6개 미만 이동됨                                                | 일부 파일 다운로드 누락                    | 누락 파일만 채팅에서 재다운로드 후 `mv` 재실행 |
| `.bak.*` 폴더가 너무 많이 생김                                 | 패키지를 여러 번 받아 백업 누적            | 오래된 백업 폴더 수동 삭제                     |

### Claude Code 실행 단계 (Step 2 이후)

| 증상                           | 대응                                               |
| ------------------------------ | -------------------------------------------------- |
| Claude Code가 코드 작성 시작   | "Phase A는 audit만이라고 했어. 코드 작성 중단해줘" |
| Claude Code가 추측으로 답변    | "확실하지 않으면 OPEN QUESTIONS에 추가하라고 했어" |
| Claude Code가 PROGRESS.md 미독 | "PROGRESS.md 먼저 읽고 시작해"                     |
| Phase A 보고서가 너무 짧음     | "Pre-Plan Inventory 5단계 모두 했는지 다시 확인"   |
| Phase B에서 PRD가 모호함       | 본 채팅으로 돌아와서 답변 정리 후 재시도           |

---

## 📚 부록 — Claude.ai 다운로드 경로가 외장 SSD인 경우 일반 패턴

[확신: 🟢 macOS Finder + Chrome/Safari 다운로드 동작 검증된 패턴]

사용자 환경에서 Claude.ai → Chrome (또는 Safari) → 외장 SSD로 다운로드 경로 변경 설정 시:

| 경로 종류               | 일반 사용자   | Jayden의 환경                   |
| ----------------------- | ------------- | ------------------------------- |
| Mac 기본 Downloads      | `~/Downloads` | (사용 안 함)                    |
| Claude.ai 직접 다운로드 | `~/Downloads` | `/Volumes/jayden-ssd/다운로드/` |
| 한글 폴더명 처리        | (해당 없음)   | 따옴표 `"…/다운로드/"` 의무     |

이 패턴은 SSD 용량 활용 + Mac 내장 디스크 부담 경감을 위한 합리적 설정입니다. 단, 외장 SSD 분리 시 다운로드 실패 가능성 존재 — 작업 중에는 SSD 항상 연결 유지 권장.

---

## 🔄 변경 이력

- **2026-05-16 v2 (현재)**: Claude.ai 다운로드 경로를 `/Volumes/jayden-ssd/다운로드/`로 정정. 백업 안전장치 추가.
- 2026-05-16 v1: 초안 (Downloads/Desktop 가정)
