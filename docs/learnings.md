# 교훈 기록 (Compound Engineering)

> **기록 원칙**: 증상 → 원인 → 해결 → **규칙** (규칙이 핵심)
>
> **기록 트리거**:
>
> - 에러 2회 이상 반복
> - 30분 이상 소요된 문제
> - AI가 방향을 이탈한 케이스
> - 설계 결정 (왜 이 방식을 선택했나)
>
> **기록 안 함**: 단순 오타, 1분 해결, 일회성 환경 문제

---

## 템플릿

### [YYYY-MM-DD] 제목

**증상**: 무엇이 어떻게 잘못됐는가

**원인**: 왜 그랬는가 (근본 원인까지)

**해결**: 어떻게 고쳤는가

**규칙** ⭐: 다음엔 이렇게 하면 재발 방지

- 규칙 1
- 규칙 2

**확인 방법**: 이 규칙이 지켜지는지 어떻게 자동 검증?

- ESLint 룰? Hook? CI? 사람 리뷰?

---

## 기록

### [2026-04-30] husky/lint-staged의 prettier 자동 재포맷이 Edit 도구와 충돌

**증상**: PRD.md를 Edit으로 수정 → commit (husky pre-commit hook의 lint-staged가 prettier로 자동 재포맷) → 같은 파일에 추가 Edit 시도 → `File has been modified since read, either by the user or by a linter` 에러로 차단됨.

**원인**: husky pre-commit hook이 lint-staged → prettier --write 를 자동 실행하도록 설정되어 있어, commit 직후 디스크 상의 파일이 직전에 Read 했던 상태와 달라진다. Edit 도구는 "Read한 시점 이후 수정됐는지" 확인하기 때문에 재 Read 없이 Edit하면 실패.

**해결**: 직전 Read의 시점이 commit 이전이면, commit 이후 동일 파일에 Edit하기 전에 반드시 다시 Read를 호출하여 최신 상태(prettier 재포맷 결과)를 확인한 뒤 Edit한다. 영향받은 영역만 좁게 Read하면 빠르다.

**규칙** ⭐:

1. `*.{md,ts,tsx,json,css}` 파일은 commit 시 prettier가 재포맷할 가능성이 매우 높다. **commit 후 같은 파일에 추가 Edit이 필요하면 반드시 Read를 다시 호출**한다.
2. 한 메시지에 여러 Edit을 보낼 때, 같은 `file_path`를 가진 Edit이 2개 이상이면 race condition 위험 → 라운드를 나누거나 sequential하게 작성한다.
3. lint-staged가 표 정렬·빈 줄 추가 등 형식 변경을 가하므로, Edit의 `old_string`은 **들여쓰기·공백·정렬을 정확히 일치**시켜야 한다 (Read에서 본 그대로 복사).

**확인 방법**:

- 자동 검증 가능: pre-commit hook에 prettier가 있는지(`.husky/pre-commit` + `lint-staged.config.js`) 확인 → 있으면 1·2·3 규칙 자동 적용
- 인간 리뷰: PR 단계에서 Edit-commit 사이클이 많은 경우 잔존 매칭 실패 흔적 검토

---
