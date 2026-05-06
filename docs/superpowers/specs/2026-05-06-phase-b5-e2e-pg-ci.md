# Phase B-5 — e2e 시나리오 + Supabase CLI in CI

> 작성일: 2026-05-06 | 상태: 진행 중 (PR #68)
> 의존: Epic 1 1A/1B/Customer 시리즈 머지 완료
> 후속: 신규 e2e 시나리오(AI 응답→번역→발송)는 별 PR

---

## 1. WHY (목적)

### 문제

현재 vitest **40 test skipped** + e2e 2 test skipped. 모두 `HESYA_TEST_DATABASE_URL` (또는 `E2E_AUTH_USER_ID`) 환경 변수 부재 시 자동 skip.

**영향**:

- Phase B-2 trigger / B-3a translate / B-3c send / B-4 RAG 등 **integration 시나리오의 회귀 방어 0**
- 머지 PR이 unit test만 통과해도 prod 흐름 깨질 가능성 (Drizzle 시그니처 drift, RLS 정책 충돌, vault 키 회전 등)
- 베타 매장 도입 시 첫 실 트래픽에서 발견 → 사장 신뢰 하락

### 목표

**검증 가능한 목표**:

- CI에서 PostgreSQL + pgsodium + pgvector + auth.uid() 모두 동작하는 환경 구축
- skipped test 5건 (3 integration + 2 e2e) **자동 활성화** (env 주입만으로)
- 신규 e2e 시나리오 1건 (AI 응답 → 번역 → 발송) 추가 가능 발판
- e2e-smoke wall time 영향 ≤ +2분 (별 job으로 분리하여 smoke는 빠르게 유지)

---

## 2. WHAT (만들 것)

### 2.1 새 CI job: `e2e-integration`

별 job — `e2e-smoke`와 분리하여 smoke는 ~1.5분 유지, integration은 더 무거운 setup 허용.

```yaml
e2e-integration:
  runs-on: ubuntu-latest
  timeout-minutes: 15
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4 (cache: pnpm)
    - uses: supabase/setup-cli@v1
    - run: supabase start  # PG + pgsodium + pgvector + auth 포함 (~90~120s)
    - run: extract HESYA_TEST_DATABASE_URL from `supabase status`
    - run: pnpm --filter @hesya/web test  # integration test 자동 활성화
    - run: pnpm --filter @hesya/web e2e inbox.spec.ts  # 신규 시나리오
```

### 2.2 환경 변수 동적 추출

`supabase status` 출력에서 `DB URL` 라인 grep → `HESYA_TEST_DATABASE_URL` 환경 변수로 export. 이후 step들이 자동 사용.

### 2.3 skipped test 자동 활성화 (코드 변경 0)

기존 `describe.skipIf(!hasDb)` 패턴이 env 있으면 자동 활성화. **별도 코드 변경 불요** — env 주입이 핵심.

활성화되는 테스트:

- `dal/conversations.test.ts` 6건
- `dal/customers.test.ts` 7건
- `dal/messages.test.ts` (수)
- `dal/store-tone-examples.test.ts` (수)
- `dal/store-knowledge.test.ts` (수)
- `dal/stores.test.ts` 5건
- `dal/store-owners.test.ts` 3건
- `dal/store-integrations.test.ts` 4건
- `webhooks/instagram/route.test.ts` 2건 (integration)
- `features/inbox/ai/generate-and-store-reply.integration.test.ts` 3건
- `tests/e2e/inbox.spec.ts` 2건 (`E2E_AUTH_USER_ID` 추가 필요)

**총 ~40 vitest skipped + 2 e2e skipped** 대부분 활성화.

### 2.4 만들지 않을 것 (이번 PR)

- ❌ 신규 e2e 시나리오 (AI 응답→번역→발송) — 별 PR (PR 9b)
- ❌ E2E_AUTH_USER_ID 시드 데이터 자동 생성 — 별 단계 (필요 시 별 yml step)
- ❌ supabase migration 자동 적용 (`supabase db reset` + drizzle migrate) — 첫 시도 후 필요 시 추가

---

## 3. HOW (구현 단계)

### Step 1: Spec (이 문서)

### Step 2: ci.yml 변경

- `e2e-integration` job 추가
- env는 e2e-smoke와 동일 (yaml anchor 미지원으로 복제)
- `supabase/setup-cli@v1` + `supabase start` + `supabase status` parsing

### Step 3: PR push → CI 실행 검증

- supabase start 성공/실패 확인
- HESYA_TEST_DATABASE_URL 정확히 추출되는지 확인
- skipped test 5건 자동 활성화 확인

### Step 4: 실패 시 후속

- supabase start 시간 초과 → cache 추가
- migration 자동 적용 단계 추가
- 별 PR로 fix

---

## 4. 결정 사항

| 결정                          | 채택   | 거부 이유                                         |
| ----------------------------- | ------ | ------------------------------------------------- |
| Supabase CLI in CI            | ✅ (a) | 공식 패턴, pgsodium/pgvector 호환 (Plan agent 🟢) |
| PostgreSQL service container  | ❌ (b) | pgsodium 수동 빌드 필요, 유지비용 ↑               |
| e2e-integration 별 job        | ✅     | smoke wall time 유지 + 무거운 setup 허용          |
| supabase start 매 PR          | ✅     | 분당 비용 미미, 캐싱은 다음 단계                  |
| migration 자동 적용 (이번 PR) | ❌     | 첫 시도 fail 시점에 결정 — 점진적 도입            |

---

## 5. 검증 기준 (Goal-Driven)

- [ ] `e2e-integration` job이 ci.yml에 추가되고 PR push 시 실행됨
- [ ] `supabase start`가 90~150초 안에 성공
- [ ] `HESYA_TEST_DATABASE_URL` 환경 변수가 후속 step에 정상 주입
- [ ] vitest skipped 40 → ≤ 5 (e2e 별도 카운트)
- [ ] e2e-smoke wall time 무영향 (≤ 2분 유지)

---

## 6. 비용 / 리스크

- **CI 분당 비용**: GitHub Actions hosted runner ~$0.008/분. supabase start ~120s + test ~3분 = +5분/PR ≈ $0.04/PR. 무시 가능.
- **첫 PR fail 가능성**: 중. migration 자동 적용 누락 시 integration test fail. 별 PR로 fix.
- **e2e flake**: 낮음. supabase가 fresh DB 제공 → state 격리 확실.

---

## 7. References

- Supabase docs: GitHub Actions integration (`supabase/setup-cli@v1`)
- L-024: env.ts dummy values for CI build
- L-053: e2e-smoke / validate env 동기화 의무
- L-063: Playwright cache로 e2e-smoke ~1.5분 단축
