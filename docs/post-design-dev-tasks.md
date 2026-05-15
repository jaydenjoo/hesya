# 디자인 100% 작업 후 마무리 개발 task 리스트 (2026-05-15 작성)

> 본 문서는 Owner Dashboard 풀 디자인 Epic (PDF 청사진 5~7일) **완료 후** 베타 출시 직전 마무리로 진행할 코드 작업 목록.
> 작성 배경: 세션 34 종료 시점 inventory + PROGRESS 갱신 + L-082 정직성 점검 결과.
> 활용: Jayden이 디자인 작업 마무리 후 본 문서 순서대로 진행. 각 항목별 prerequisite + 시간 추정 + 작업 위치 명시.

---

## 즉시 진행 가능 (prerequisite 0건, 1~3h 분량)

### 🟢 A. PR #194 신규 컴포넌트 테스트 백필 (1.5~2h)

**대상 (3개 컴포넌트, 모두 NO_TEST 상태)**:

```
apps/web/src/features/customer-auth/email-password-form.tsx
apps/web/src/features/customer-auth/google-oauth-button.tsx
apps/web/src/features/customer-auth/sign-in-form.tsx  (M3.4부터 존재)
```

**작업**:

- vitest + `@testing-library/react`로 form submit / error state / disabled / demo prefill prop 검증
- Owner sign-in-form 패턴 참고 (`apps/web/src/features/store-auth/`)
- 단일 PR로 묶음, 예상 +120~180 line

**가치**: PR #194 신규 컴포넌트 회귀 방어 + L-082 시연 prerequisite 안정성.

---

### 🟢 C. Customer store detail Unsplash → self-host (1h)

**대상**:

```typescript
// apps/web/src/app/[locale]/c/store/[id]/page.tsx:37
// TODO: 베타 출시 직전 self-host (Vercel Blob / public/)으로 교체 — Unsplash 의존 제거.
```

**작업**:

- 매장 카드 hero 이미지 5~10장을 `next/image` + Vercel Blob 또는 `public/` 정적 파일로 self-host
- 외부 도메인 의존 제거 (베타 출시 차단선)

**가치**: prod 안정성 + 외부 의존 차단.

---

### 🟢 F. L-082 시연 % 객관 검증 (subagent 위임, 1h)

**작업**:

- PROGRESS 명시 "M3 owner 100% / M4 admin 100% / Sprint 2 mock-first 12 페이지"가 정직한지 객관 측정
- `code-explorer` + `senior-engineer` subagent로 페이지 단위 실 데이터 충족도 grep
- 결과를 PROGRESS.md L-082 시연 % 섹션에 반영

**가치**: 본 세션 34 인사이트(PROGRESS stale될 수 있음) 재발 방지 — 정기 객관 검증 cadence.

---

### 🟢 J. 보안 audit — 본 세션 변경분 (1~2h)

**대상 (PR #194 보안 영향 점검)**:

1. `NEXT_PUBLIC_DEMO_AUTOFILL=true`가 prod에서 default 켜진 채 출시되면 demo 계정 노출 — 베타 매장 매칭 시점에 toggle 검토
2. Google OAuth callback URL 화이트리스트 검증
3. `customer-guard.ts`의 `upsertCustomerByEmail` email duplicate 처리 견고성
4. 새 form 컴포넌트에 XSS / CSRF / clickjacking 가능성 검토

**작업**: `security-reviewer` subagent 위임.

**가치**: 🔴 RED 프로젝트 정책 정합 (돈/신분/법 영역).

---

### 🟢 I. PRD §1063 등 미구현 feature gap 검증 (subagent, 1~2h)

**작업**:

- `docs/PRD.md` v1.2 (2026-04-29) 정독 — subagent 위임
- Epic 1~5 명시 기능 중 미구현 항목 inventory
- "만들지 않을 것" 섹션과 현재 코드 비교 (드리프트 검출)
- 결과를 PROGRESS의 다음 세션 시작점 후보로 추가

**가치**: PRD 명시 ↔ 코드 정합성 baseline.

---

## 데이터 prerequisite 후 진행 (베타 매장 매칭 또는 운영 누적 후)

### 🟡 B. Sprint 2C admin 페이지 3개 실 데이터 wire

| 페이지                                   | 현재 Mock 데이터                                               | 실 데이터 wire 작업                                    |
| ---------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| `/admin/ai-cost`                         | budgetForecast / hourlyHeatmap / endpointCosts / anomalyAlerts | 4 DAL 신규 (8h) — `messages.aiModel` 누적 prerequisite |
| `/admin/payment-monitoring`              | transactions / paymentStats / anomalies                        | 3 DAL 신규 (6h) — Epic 2 결제 도입 prerequisite        |
| `/admin/store-verifications` (KYC queue) | mockKycQueue 8건 + mockKycQueueStats                           | 2 DAL 신규 (4h) — KYC 신청 데이터 prerequisite         |

**총**: 18h. 모두 베타 출시 후 prod 데이터 누적 1주~1개월 후 의미.

**가치**: mock → 실 데이터 전환 = L-082 정직성.

---

### 🟡 D. ai-accuracy H1 metric 정교화 (Epic 1)

**대상**:

```typescript
// apps/web/src/shared/lib/dal/ai-accuracy.ts:73
// TODO(Epic1): 베타 운영 1주 후 H1 수정률 분포 분석 결과로 metric 정의 정교화.
```

**작업**:

- 베타 1주 운영 후 실 데이터 분포 분석 → metric 정의 갱신
- 약 4~6h

**Prerequisite**: 베타 출시 + 1주 데이터.

---

### 🟡 E. payments 집계 최적화 (Epic 2)

**대상**:

```typescript
// apps/web/src/shared/lib/dal/payments.ts:55
// TODO(Epic2): payments 일 1000건 넘기면 row fetch + JS 집계 → drizzle
```

**작업**:

- 베타 5곳 × 일 200건 = 1000건 도달 시 점진 전환
- 약 2~3h

**Prerequisite**: 일 1000건 도달 (베타 출시 후 수개월).

---

## 정책/인프라 작업 (시점 의존)

### 🟡 G. CI 자동 trigger 복원 (2026-06-01 후, L-093/L-097)

**작업**:

- GitHub Actions Free 한도 리셋 후 `on: pull_request` + `on: push` 활성화
- 최적화 동반:
  - `paths-ignore: ['docs/**']` (docs-only PR skip)
  - `e2e-integration` nightly schedule만 + `concurrency.cancel-in-progress: true` (이미 적용)
- 30분~1h

**가치**: L-097 main 회귀 silent 누적 차단.

---

### 🟡 H. dep 버전 업데이트 audit (월 1회 cadence 권장)

**대상**:

- Better Auth / Next.js 16 / Drizzle / vitest 4→5 등 major bump 검토
- L-096 (vitest poolOptions silent ignore) 같은 회귀 예방

**작업**:

- 각 dep 별 마이그 가이드 + 회귀 dispatch
- 1~2일 (변동성 큼)

**Prerequisite**: 시점 합의 + dep CHANGELOG 점검.

---

## 종합 우선순위 추천

| 우선순위 | 작업                       | 시간   | prerequisite       |
| -------- | -------------------------- | ------ | ------------------ |
| **1**    | A. 테스트 백필             | 1.5~2h | 없음               |
| **2**    | F. L-082 객관 검증         | 1h     | 없음               |
| **3**    | C. Unsplash → self-host    | 1h     | 없음 (베타 차단선) |
| **4**    | J. 보안 audit (subagent)   | 1~2h   | 없음               |
| **5**    | I. PRD gap 검증 (subagent) | 1~2h   | 없음               |
| 6        | G. CI 복원                 | 0.5~1h | **2026-06-01 후**  |
| 7        | H. dep 마이그              | 1~2일  | 시점 합의          |
| 8        | B/D/E. 데이터 wire         | 18h+   | **베타 매장 매칭** |

**1~5번 (총 5.5~8h)** = 디자인 작업 완료 후 베타 출시 직전 마무리 분량.

---

## 진행 시 흐름

1. 디자인 100% 작업 완료 (별도 Epic)
2. 본 문서 우선순위 1~5 순차 진행 — 단일 세션 또는 2~3 세션 분할
3. 각 작업 시 PR 단위 + CI dispatch + main sanity 정착 cadence (세션 34 패턴)
4. 6번 (CI 복원)은 시점 도달 시 별도 진행
5. 7~8번 (dep / 데이터 wire)는 베타 출시 후 누적 데이터 + 데이터 prerequisite 충족 시점

---

## 참조

- 세션 34 PROGRESS.md 다음 세션 시작점 (`/Volumes/jayden-ssd/projects/hesya/PROGRESS.md`)
- L-082 (PROGRESS 자기평가 e2e 시연 기준)
- L-093 / L-096 / L-097 / L-100 (CI / vitest 회귀 정책)
- 본 세션 PDF 검토 결과 — Owner Dashboard 풀 디자인 Epic 5~7일 별도

본 문서는 디자인 작업과 직교 차원의 코드 마무리 목록입니다. 디자인 진행과 병렬 가능하지만, 단일 인력 / 컨텍스트 보호 위해 순차 권장.
