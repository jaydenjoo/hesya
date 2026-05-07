# Phase 1C — fire-and-forget processInbound을 Vercel Queue로 분리

> ⚠️ **DEPRECATED (2026-05-07)**: 본 spec은 historical reference. Vercel Queue beta의
> trigger registration deployment pinning 결함(L-077)으로 QStash로 영구 전환됨.
> **현행 spec**: [`2026-05-07-qstash-migration.md`](./2026-05-07-qstash-migration.md).
> D6 workaround도 PR #78에서 완전 교체됨.
>
> 작성일: 2026-05-06 | 상태: ~~design 승인~~ → **superseded**
> 의존: Epic 1 1A/1B/Customer/follow-up + B-5 enforced 머지 완료 (PR #68~#72)
> 후속: Phase 1D (multi-channel) 시 QStash 패턴을 채널별로 확장

---

## 1. WHY (목적)

### 문제

현재 webhook route(`apps/web/src/app/api/webhooks/instagram/route.ts:156`)가 inbound 메시지 처리 후 AI 응답 생성을 **같은 request 안에서 fire-and-forget**으로 호출:

```ts
void processInbound(inserted.id).catch((e) =>
  Sentry.captureException(e, { tags: { phase: "processInbound" } }),
);
```

**영향**:

1. **Meta webhook 5s ACK 윈도우 위험**: AI 응답 생성(~3-5s) 중 webhook handler가 끝나기 전 함수 timeout 또는 콜드 스타트 시 5s 초과 가능. Meta가 5s 안에 ACK 못 받으면 retry 폭증 → 메시지 중복 처리.
2. **retry 책임 모호**: `void Promise.catch()` 패턴은 throw 시 Sentry로만 보고, 자동 재시도 X. transient 장애(Anthropic 502, DB connection lost) 시 메시지 영구 손실.
3. **observability 부족**: queue dashboard 없어 "현재 처리 중인 inbound 개수" 같은 운영 지표 X.
4. **Vercel Function timeout 위험**: Fluid Compute 환경에서 webhook 함수가 처리 끝까지 살아있어야 함. Function timeout(default 300s) 안전이지만 cold start + AI latency 합쳐 위험.

### 목표 (검증 가능)

- **webhook ACK 시간 3-5s → 200-500ms** (10x 안전마진, Meta retry 폭증 0 보장)
- **retry 자동화**: transient 실패 3회 exponential backoff, 영구 실패는 DLQ 격리 + Sentry alert
- **invocation 분리**: webhook은 enqueue 책임만, AI 비즈니스 로직은 별 worker endpoint
- **회귀 0**: `generateAndStoreReply`/`processInbound` 비즈니스 로직 100% 동일

---

## 2. WHAT (만들 것)

### 2.1 신규 파일

| 파일                                                             | 역할                                                                                                        |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `apps/web/src/lib/inbox/queue.ts`                                | Vercel Queue client + topic 상수(`INBOX_PROCESS_INBOUND_TOPIC`) + `enqueueProcessInbound(messageId)` helper |
| `apps/web/src/app/api/queue/inbox-process-inbound/route.ts`      | Worker endpoint — Vercel Queues가 호출. payload Zod 검증 → `generateAndStoreReply(messageId)`               |
| `apps/web/src/lib/inbox/queue.test.ts`                           | enqueue 단위 test (mock fetch / Vercel SDK)                                                                 |
| `apps/web/src/app/api/queue/inbox-process-inbound/route.test.ts` | Worker route 시나리오 test (Zod 검증 / skip / throw / 멱등)                                                 |

### 2.2 수정 파일

| 파일                                                          | 변경                                                                                                                                                              |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/app/api/webhooks/instagram/route.ts` (라인 156) | `void processInbound(inserted.id).catch(...)` → `await enqueueProcessInbound(inserted.id)`. enqueue 실패 시 Sentry capture + 200 OK 그대로 (Meta retry 폭증 방어) |
| `apps/web/src/lib/inbox/process-inbound.ts`                   | **변경 없음** (단순 wrapper 유지). worker가 호출                                                                                                                  |
| `apps/web/src/shared/config/env.ts`                           | (필요 시) Vercel Queue 토큰 신규 env 추가. SDK가 자동 inject 가능성도 검토                                                                                        |
| `apps/web/src/app/api/webhooks/instagram/route.test.ts`       | `processInbound` mock 검증 → `enqueueProcessInbound` mock 검증으로 갱신                                                                                           |

### 2.3 Queue Payload + Worker Response Convention

**Payload (작은 단위)**:

```ts
type ProcessInboundJob = {
  messageId: string; // UUID
};
```

**Worker response → Vercel Queue 동작 (D6 callback workaround 적용)**:

| 상황                                                | HTTP | Queue 동작                                                  |
| --------------------------------------------------- | ---- | ----------------------------------------------------------- |
| `generateAndStoreReply` 성공                        | 200  | 완료                                                        |
| Skip (`already_responded`, `invalid_store_name` 등) | 200  | 정상 흐름, retry X (멱등)                                   |
| Transient throw, deliveryCount 1~3                  | 5xx  | server-side visibility timeout(60s) 만료 후 자동 redelivery |
| deliveryCount 4 도달                                | 200  | DLQ 격리 — Sentry capture + acknowledge (재시도 안 함)      |

### 2.4 Architecture 흐름도

**Before**:

```
Meta webhook → POST /api/webhooks/instagram (~3-5s)
              ├─ HMAC 검증
              ├─ DB INSERT
              ├─ void processInbound(id).catch(Sentry)  ← 동기 ~3-5s
              └─ return 200 OK
```

**After**:

```
Meta webhook → POST /api/webhooks/instagram (~200-500ms)
              ├─ HMAC 검증
              ├─ DB INSERT
              ├─ await enqueueProcessInbound(messageId)  ← ~50ms
              └─ return 200 OK

Vercel Queue → POST /api/queue/inbox-process-inbound (별 process)
              ├─ Zod 검증
              ├─ generateAndStoreReply(messageId)  ← ~3-5s OK
              └─ retry/DLQ 자동 (3회 exp backoff)
```

---

## 3. 결정 (Decisions)

### D1. Queue 기술: **Vercel Queues** (public beta)

- Vercel 플랫폼 native, 추가 인프라/비용 0, Fluid Compute 위에서 worker
- 베타지만 Anthropic Vercel 가이드(2026-02-27 기준) 명시 권장
- 트래픽 작은 베타 시점이라 베타 risk 무시 가능
- 대안 (Upstash QStash GA / Inngest)은 외부 의존 또는 overkill

### D2. Retry 정책: **3회 + 60s 균일 (D6 callback workaround로 임시)**

- ~~3회 exponential backoff (1s, 5s, 30s)~~ — SDK 0.1.6 callback push 모드 결함으로 비활성. **D6 참조**.
- 현재: 3회 retry, 간격은 server-side visibility timeout(60s) 균일. 4번째 시도 시 DLQ.
- Anthropic transient error(502, rate limit) 자동 복구는 60s 후 재시도로 동일 효과
- 영구 실패 ~3분 안에 DLQ 격리 → 비용 누수 방어 (1+5+30s = 36s 대비 5배 느림)
- `markAIResponded` race-safe claim으로 멱등 보장 → retry 안전
- SDK fix 후 1+5+30s 패턴 복구 예정 (별 PR)

### D3. DLQ 처리: **Sentry alert만**

- 베타 시점 트래픽 0~몇 매장 → admin UI 누적 시 별 PR
- Hesya 기존 Sentry 활용 패턴과 일관
- Sentry → Slack/Email integration은 별 작업

### D4. Migration: **Big Bang** (단일 PR)

- 트래픽 작아 영향 범위 극히 작음
- Feature flag/phased는 추가 코드 비용 > 안전 이득
- 문제 시 git revert + redeploy(~5min) 충분

### D5. Webhook enqueue 실패 시 동작: **Sentry capture + 200 OK 반환**

- Meta retry 폭증 방어가 메시지 1건 누락보다 우선
- enqueue 실패는 이론상 매우 드뭄 (Vercel infra)
- enqueue 실패 빈도 모니터링 → 임계값 초과 시 alert (Sentry 자동)

### D6. Callback retry workaround (`@vercel/queue` 0.1.6 결함)

- **결함**: callback push 모드에서 retry handler가 `{ afterSeconds: N }` 반환 시 SDK가 `changeVisibility(PATCH /lease/{handle})`를 호출하나 server가 404 응답 → SDK가 silent catch 후 callback 200 응답 → server가 ack로 처리 → **메시지 1회 invoke 후 종결**
- **진단**: SDK 소스 `dist/index.mjs` 라인 386-401 (catch 후 finalizePayload + return). 받은 receiptHandle은 v2beta callback의 `ce-vqsreceipthandle` 헤더에서 추출되며, polling 모드의 `lease` 엔드포인트와 호환되지 않음.
- **Workaround**: retry handler에서 `deliveryCount < 4` 시 `undefined` 반환 → SDK가 throw 전파 → callback 5xx → server-side visibility timeout(60s) 만료 후 자동 redelivery. `deliveryCount === 4` 시 `{ acknowledge: true }`로 DLQ 진입.
- **비용**: 의도한 1+5+30s 패턴 손실, 60s 균일 retry로 변경. 총 retry 시간 36s → ~3분.
- **후속**: `vercel/sdk` repo에 issue 등록 (`docs/superpowers/specs/2026-05-06-vercel-queue-callback-retry-issue.md`). SDK fix 시 1+5+30s 복구.

---

## 4. 만들지 않을 것 (Not Doing)

- ❌ **Admin DLQ UI** — Sentry alert만 (D3). 누적 시 별 PR.
- ❌ **Feature flag toggle** — Big Bang (D4).
- ❌ **E2E 시나리오 in this PR** — Vercel Queue dev 환경 셋업이 별 작업. 별 PR(advisory).
- ❌ **`generateAndStoreReply` 비즈니스 로직 변경** — invocation 패턴만 변경.
- ❌ **multi-channel queue 분기** (instagram/whatsapp/kakao 별 topic) — Phase 1D에서 도입.
- ❌ **Slack/Email Sentry 연동** — 별 작업, 운영 채널 결정 후.
- ❌ **enqueue 후 webhook이 추가 처리** (e.g., realtime broadcast) — 1A 패턴 유지.

---

## 5. 검증 기준

### 5.1 단위 테스트

- `queue.test.ts`: `enqueueProcessInbound`이 정확한 topic + payload로 fetch 호출. SDK mock으로 검증.
- `worker route.test.ts`: 4 시나리오 — (a) Zod payload 검증, (b) skip → 200, (c) throw → 5xx, (d) 멱등.
- `webhook route.test.ts` 갱신: `processInbound` 호출 검증 → `enqueueProcessInbound` 호출 검증.

### 5.2 통합 테스트

- 기존 `webhook route integration` 11건 — 회귀 0
- 신규 `worker route integration` 4건 — DB-gated (HESYA_TEST_DATABASE_URL)

### 5.3 prod 검증 (배포 후)

- Vercel Queue dashboard에서 메시지 enqueue + dequeue 확인
- 한 inbound 메시지 → webhook ACK ≤ 500ms (Vercel Logs)
- AI 응답이 인박스 polling으로 도착 (회귀 0)
- Sentry alert 채널 정상 작동 (DLQ entry 시 즉시 alert) — 의도적 invalid payload로 테스트 1회

### 5.4 회귀 0 보장

- `generateAndStoreReply` 자체 코드 변경 없음 → AI 응답 생성 흐름 동일
- 기존 304 vitest pass 유지
- 새 vitest +N (queue + worker route)

---

## 6. 위험 + 완화

| 위험                                    | 가능성 | 영향                                                              | 완화                                                                                                  |
| --------------------------------------- | ------ | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Vercel Queues beta 안정성               | 중     | 메시지 enqueue 실패 → Sentry alert + 사장 인박스 새로고침 안 보임 | 베타 시점 트래픽 작음. 문제 시 revert 빠름. enqueue 실패 시 webhook 200 OK는 그대로 (Meta retry 방어) |
| SDK callback retry 결함 (D6)            | 확정   | 의도한 1+5+30s 백오프 → 60s 균일로 변경 (총 retry ~3분)           | D6 workaround로 retry 흐름 자체는 보장. SDK upstream fix 시 별 PR로 복구.                             |
| Vercel Queue dev 환경 부재              | 중     | 로컬 개발 시 enqueue가 어떻게 동작?                               | dev에서는 SDK가 즉시 worker 호출 또는 mock. 검증은 preview 배포에서                                   |
| Worker endpoint URL 보안                | 낮     | Vercel Queue가 호출하는 URL을 외부에서 직접 호출 가능?            | Vercel Queue가 보안 토큰 자동 inject (SDK가 검증). 추가 검토 필요                                     |
| webhook → enqueue → worker 추가 latency | 낮     | AI 응답 도착 ~수백 ms~수 초 늦음                                  | 인박스 polling refresh로 자동 도착. 사장 인지 차이 0                                                  |
| 환경 변수 mismatch (dev/prod)           | 중     | 잘못 배포 시 enqueue 토큰 dev → prod                              | Vercel CLI `vercel env diff` 검증 (deploy 전 확인)                                                    |

---

## 7. 의존성 (External)

- Vercel Pro 요금제 (Vercel Queues 사용 가능 여부 확인 필요 — 메모리 명시: hesya-web Vercel project 존재)
- Vercel CLI `vercel queue` 명령 (dashboard 접근 + topic 생성용)
- Sentry alert 채널이 Slack/Email로 연결되어 있어야 (별 작업, 본 spec 외)

---

## 8. 후속 작업 (Out of Scope)

- 🟢 **PR 1Cb (E2E)**: Vercel Queue dev preview 환경에서 webhook → queue → worker 흐름 e2e (advisory job 또는 manual smoke)
- 🟢 **PR 1Cc (Admin DLQ UI)**: 누적 시 별 페이지에서 DLQ 메시지 목록 + 재시도 버튼
- 🟢 **PR 1D (multi-channel)**: instagram/whatsapp/kakao 별 topic 분기 + adapter Map cache
