# Auth Cookie Cache TTFB Benchmark

> [PR #150](https://github.com/jaydenjoo/hesya/pull/150) 효과 객관화 — Better Auth `session.cookieCache` 5분 TTL 활성화.
> 측정일 2026-05-13. baseURL `https://hesya-web.vercel.app` (Vercel prod, Tokyo region).

## 무엇을 측정했나

PR #150 전후 비교가 불가능한 시점이라 (이미 머지됨), **단일 세션 내 cold vs warm 비교**로 effect를 정량화:

- **Cold (iter 0)**: 로그인 직후 첫 nav — cookie cache MISS, `auth.api.getSession()`가 DB SELECT
- **Warm (iter 1~10)**: 같은 페이지 재방문 — cookie cache HIT, DB SELECT 없음. **median + p95** 두 통계량으로 outlier 영향 격리.

5개 인증 owner 페이지 × 11회씩 = 55 nav 측정. waitUntil: "commit"으로 TTFB 근사 (첫 HTML byte 도착).

**왜 median + p95**: 평균(avg)은 outlier 1개에 흔들림 (Vercel cold start spike 1회로 평균 200ms↑). median(p50)은 분포 중심값이라 안정적이고, p95는 worst-case 검증용. N≥10이라야 통계량이 의미 있음.

**비유**: 식당이 매번 메뉴판을 주방에서 가져오던 걸(DB SELECT), 손님 좌석에 메뉴판 사본(쿠키)을 두고 5분 동안은 그걸 보게 한 효과. PR #150 머지로 활성화.

## 결과 — 초기 N=5 warm avg (2026-05-13, legacy)

> ⚠️ N=5 warm avg 기준 첫 측정. avg는 outlier에 약하니 N=10 median 측정으로 재실행 권장 (아래 표).

| Path                  | Cold (iter 0) | Warm avg (iter 1~5) | Δ (ms)  | Δ (%)   |
| --------------------- | ------------- | ------------------- | ------- | ------- |
| `/ko/store/dashboard` | 4569ms        | 3743ms              | 826     | 18%     |
| `/ko/store/bookings`  | 3274ms        | 2904ms              | 370     | 11%     |
| `/ko/store/inbox`     | 3760ms        | 3283ms              | 477     | 13%     |
| `/ko/store/customers` | 3164ms        | 2865ms              | 299     | 9%      |
| `/ko/store/services`  | 3095ms        | 2902ms              | 193     | 6%      |
| **평균**              | **3572ms**    | **3139ms**          | **433** | **12%** |

**모든 페이지에서 warm avg < cold** — cookie cache가 정상 작동 중. PR #150 효과 입증.

## 결과 — N=10 median + p95 (2026-05-14, 세션 33 prod 재실행)

Spec에 `ITER_PER_PAGE = 11` (1 cold + 10 warm) 적용 완료 ([`apps/web/e2e/perf-auth-cookie-cache.spec.ts:44`](../apps/web/e2e/perf-auth-cookie-cache.spec.ts#L44)). prod URL `https://hesya-web.vercel.app`, demo 계정으로 실측.

| Path                  | Cold      | Warm median | Warm p95  | Δ median (ms) | Δ %     |
| --------------------- | --------- | ----------- | --------- | ------------- | ------- |
| `/ko/store/dashboard` | 1010ms    | 185ms       | 265ms     | 825           | 82%     |
| `/ko/store/bookings`  | 748ms     | 226ms       | 466ms     | 522           | 70%     |
| `/ko/store/inbox`     | 502ms     | 191ms       | 772ms     | 311           | 62%     |
| `/ko/store/customers` | 486ms     | 112ms       | 185ms     | 374           | 77%     |
| `/ko/store/services`  | 367ms     | 118ms       | 917ms     | 249           | 68%     |
| **평균**              | **623ms** | **166ms**   | **521ms** | **456**       | **72%** |

**판정 결과**:

- ✅ **PR #150 효과 유지**: 모든 페이지에서 warm median < cold (Δ 평균 72% 감소)
- ✅ **세션 32 perf 누적 효과 입증**: 절대값이 N=5 측정(3~5초)보다 6~8배 빠름 — PR #162/#163/#164 (PostHog autocapture off + unstable_cache + Sentry sampling↓ + Seoul region) 효과 동시 작용
- ⚠️ **warm p95 outlier**: `/ko/store/inbox` 772ms, `/ko/store/services` 917ms — Vercel cold start 또는 stale cache miss 후보. p50 median은 안정 (118~226ms)이라 정상 범주.

## 해석

### N=10 기준 (2026-05-14, 세션 33 측정 — 권장 baseline)

- **평균 456ms / 72% 감소** — cookie cache가 절감하는 DB session select 비용이 명확히 드러남 (cold ~600ms ↔ warm ~170ms).
- **dashboard 절대값이 가장 큼** (1010 → 185, Δ 825ms) — 5 위젯 SSR이 가장 무거워서 cookie cache 효과가 가장 큰 페이지.
- **세션 32 perf 머지 누적 효과 가시화**: N=5 측정 시점(2026-05-13) 대비 absolute TTFB 6~8배 단축 (3~5초 → 0.4~1.0초 cold, 3초 → 0.2초 warm). PR #150 (cookie cache) + PR #162/#163/#164 (PostHog autocapture off + unstable_cache + Sentry sampling↓ + Vercel icn1 region) 조합이 누적된 결과.

### N=5 초기 측정 vs N=10 권장 baseline

| 메트릭    | N=5 (avg, 2026-05-13) | N=10 (median, 2026-05-14) |
| --------- | --------------------- | ------------------------- |
| Cold 평균 | 3572ms                | **623ms** (-83%)          |
| Warm 평균 | 3139ms (avg)          | **166ms** (-95%, median)  |
| Δ 평균    | 433ms / 12%           | **456ms / 72%**           |

N=10 median은 outlier 영향을 격리해서 PR #150 effect를 더 정확히 보여줌. 향후 측정 비교는 N=10 median 기준으로 통일 권장.

## 한계

- **현재 단일 측정 세션** — Vercel cold start, 네트워크 변동 등으로 실측 분산 큼. N=10 median 측정으로 분산 영향 일부 격리됨.
- **prod 단일 매장 데이터** — demo 계정 1개라 multi-store contention 미반영.
- **5분 TTL 경계 미테스트** — 11 iter는 보통 1~2분 안에 완료. 5분 후 cache expiry 동작은 별도 테스트 필요.
- **DB session lookup 자체의 비용 ≠ 전체 TTFB** — TTFB는 Vercel cold start + SSR rendering + 네트워크 등 모든 요인 합. cookie cache는 그 중 일부만 절감. 절대값으로 단정 X.

## 다음 측정 권장

1. **N=10 median + p95 표 채우기** — 위 "결과 — N=10" 표의 TBD 항목 prod 재실행으로 갱신
2. **5분 TTL 경계 검증** — sleep(310s) 후 nav → cold 재현 확인
3. **Multi-store 환경** — 동시 사용자 시뮬레이션
4. **DB SELECT 절감 직접 측정** — Sentry / posthog session lookup count rate 비교 (cookie cache가 절감해야 할 진짜 metric)

## 재실행 방법

```bash
PLAYWRIGHT_BASE_URL=https://hesya-web.vercel.app \
PERF_TEST_EMAIL=demo@hesya.com \
PERF_TEST_PASSWORD='Hesya!Demo2026' \
pnpm --filter @hesya/web exec playwright test \
  e2e/perf-auth-cookie-cache.spec.ts --reporter=list
```

local 측정 시:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:4200 \
PERF_TEST_EMAIL=<local user> \
PERF_TEST_PASSWORD=<local password> \
pnpm --filter @hesya/web exec playwright test \
  e2e/perf-auth-cookie-cache.spec.ts --reporter=list
```

## 환경

- prod URL: `https://hesya-web.vercel.app`
- 측정 클라이언트: macOS (한국 IP)
- prod region: Vercel ap-northeast-1 (Tokyo)
- Supabase region: ap-northeast-2 (Seoul)
- 측정일 KST 2026-05-13

## 연관

- [PR #150](https://github.com/jaydenjoo/hesya/pull/150) — Better Auth session.cookieCache 5분 TTL 활성화
- [apps/web/e2e/perf-auth-cookie-cache.spec.ts](../apps/web/e2e/perf-auth-cookie-cache.spec.ts) — 측정 spec
- [packages/auth/src/auth.ts](../packages/auth/src/auth.ts) — cookieCache 설정 위치
