# QStash 전환 (Vercel Queue beta 이탈)

> 작성: 2026-05-07
> 트리거: L-076 (Vercel Queue beta trigger registration deployment pinning 결함)
> 관련: L-072, L-074, L-076, PROGRESS.md Task 13

## 1. Goal-Driven 검증 기준

작업 완료 = 다음 4개 조건 모두 충족.

- [ ] G1. `enqueueProcessInbound(messageId)` 인터페이스 변경 0 — 호출처(`webhooks/instagram/route.ts`) 코드 무수정
- [ ] G2. Prod publish 1건 → worker route 진입 → `generateAndStoreReply` 정상 호출 (Vercel Functions logs로 확인)
- [ ] G3. 의도적 invalid payload 1건 → 4회 retry 후 Sentry alert 도달 (`phase=queue:inbox.process-inbound:dlq` tag)
- [ ] G4. Vercel Queue `inbox-process-inbound` topic + `experimentalTriggers` config 완전 제거 — stuck 메시지 retry 정지

## 2. Why (진단 결과)

본 세션 진단 (Method 1, 코드 변경 0):

- `hesya-web.vercel.app` alias = 최신 deployment(`aj554w05l`, PR #76 D6 workaround 포함) 가리킴
- 그러나 worker invoke = **옛 deployment(`esra9g1py`, PR #76 머지 전)** 에서 발생
- 메시지 1건 (`Q-1M0zeW2mOqC8I12gNUJP13GZZr7Sdnxi`)이 13시간째 정확히 15분 간격 무한 retry — 모두 500
- **결론: trigger registration이 새 deployment로 migration 안 되는 베타 server-side 결함**. Customer-side patch 불가능.

대안: QStash (Upstash, GA, Vercel Marketplace native).

## 3. 변경 범위 (4 source + 2 test + 1 config + 1 verify)

| 파일                                                             | 변경 내용                                                                                                |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `apps/web/src/lib/inbox/queue.ts`                                | `@vercel/queue.send` → `@upstash/qstash` `Client.publishJSON`. 인터페이스 동일 (`enqueueProcessInbound`) |
| `apps/web/src/app/api/queue/inbox-process-inbound/route.ts`      | `handleCallback` → `verifySignatureAppRouter` + 직접 retry/DLQ 정책                                      |
| `apps/web/vercel.json`                                           | `functions.experimentalTriggers` block 완전 제거 (G4)                                                    |
| `apps/web/package.json`                                          | `@upstash/qstash` 추가, `@vercel/queue` 제거                                                             |
| `apps/web/src/lib/inbox/queue.test.ts`                           | mock 대상 교체 (`@upstash/qstash`)                                                                       |
| `apps/web/src/app/api/queue/inbox-process-inbound/route.test.ts` | mock 대상 교체 + retry header 시뮬레이션                                                                 |
| `apps/web/scripts/verify-qstash.ts`                              | 신규. publish 1건으로 worker invoke + Sentry capture까지 검증                                            |

`apps/web/src/shared/config/env.ts`도 신규 환경변수 3개 추가.

## 4. API Mapping

| 측면             | Vercel Queue (현재)                           | QStash (전환 후)                                                        |
| ---------------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| Publish          | `send(topic, payload)`                        | `client.publishJSON({ url, body, retries: 3 })`                         |
| Topic 라우팅     | `vercel.json` `experimentalTriggers`          | URL 기반 (worker route URL을 publish 시 직접 지정)                      |
| Retry directive  | `{ afterSeconds }` (D6에서 폐기)              | `Upstash-Retries` 헤더 또는 `retries` 파라미터                          |
| Retry backoff    | visibility timeout 60s 균일 (D6)              | 12s → 2m28s → 30m8s (default exp) — 우리 정책: `retries: 3` 후 자동 DLQ |
| Retry count read | `metadata.deliveryCount` (1-based)            | `Upstash-Retried` header (0-based)                                      |
| 조기 종료        | `{ acknowledge: true }`                       | `489` + `Upstash-NonRetryable-Error: true` 응답                         |
| DLQ              | 우리 코드에서 `Sentry.captureException` + ack | QStash native DLQ (console 관리) + 우리 코드 동시 Sentry capture        |
| Signature 검증   | (없음, vercel internal)                       | `verifySignatureAppRouter` middleware 의무                              |

## 5. Retry/DLQ 정책 (D6 → QStash)

```
publish:
  retries: 3  // 총 4회 attempt (initial + 3 retries)

worker (route.ts):
  const retried = Number(request.headers.get("Upstash-Retried") ?? 0)  // 0..3
  try {
    await generateAndStoreReply(messageId)
    return 200 OK
  } catch (err) {
    if (retried >= 3) {
      // 마지막 시도: Sentry capture + 200 OK로 종결
      Sentry.captureException(err, {
        tags: { phase: "queue:inbox.process-inbound:dlq" },
        extra: { messageId, retried }
      })
      return 200 OK  // QStash DLQ 진입 안 막고 우리 alert만 보냄
    }
    return 500  // QStash가 자동 retry
  }
```

**특징**:

- Retry 백오프가 12s/2m28s/30m8s로 D6의 60s 균일보다 길어짐 → 사용자 응답 지연 최대 30분
- 단 **메시지 유실 0** + DLQ 자동
- 운영상 inbox 응답이 30분+ 지연되면 메시지 자체에 문제 있는 시그널이라 정상 패턴

## 6. 환경변수 (Vercel Marketplace 자동 prov)

```
QSTASH_TOKEN              # publish용
QSTASH_CURRENT_SIGNING_KEY  # signature 검증
QSTASH_NEXT_SIGNING_KEY     # signature 검증 (rotation 대비)
QSTASH_URL                  # https://qstash.upstash.io (default)
```

`env.ts`에 Zod schema로 추가, `turbo.json` env allowlist에도 4개 추가.

## 7. Migration 단계 (실행 순서)

1. **본 spec 머지** — 결정 근거 영구 기록
2. **소스 코드 변경 PR (브랜치: `task/13-qstash-migration`)**
   - `pnpm --filter @hesya/web add @upstash/qstash` + remove `@vercel/queue`
   - `queue.ts`, `route.ts`, `vercel.json`, env schema 수정
   - 테스트 mock 업데이트
   - `verify-qstash.ts` 작성
3. **(Jayden 작업)** Vercel Marketplace에서 Upstash QStash integration 연결 → `hesya-web` project에 환경변수 자동 prov
4. **PR 머지 + prod deploy**
5. **prod 검증** — `verify-qstash.ts` 1회 정상 publish + 1회 invalid publish (G2 + G3)
6. **별 PR**: stuck 메시지 정리 (Vercel Queue dashboard에서 manual cancel 또는 그대로 expire 대기)

## 8. Rollback Plan

`enqueueProcessInbound` 인터페이스가 그대로라 git revert 1회로 즉시 원상복구. 단 D6 workaround도 함께 복구되니 베타 결함 risk 재발 — Rollback은 비상시에만 사용.

## 9. Cleanup (G4)

- `vercel.json`에서 `experimentalTriggers` block 완전 제거 (마이그 PR에 포함)
- Vercel Queue dashboard `inbox-process-inbound` topic — Vercel docs에 topic 삭제 API 명시 안 됨 → message expire 자연 종료 또는 staff 문의
- `@vercel/queue` package 제거 (PR에 포함)

## 10. 향후 fallback 평가 (별 spec)

QStash가 우리 inbox use case에 fit이 안 맞을 경우(예상 안 함, 보험 차원):

- **Trigger.dev v4** — GA, Vercel native integration, self-host 가능, multi-step workflow도 지원
- **Inngest** — step functions 강점, $75/mo

본 마이그 후 12주 운영 데이터 (publish 성공률, retry 분포, DLQ 빈도) 모니터링 후 별도 결정.

## 11. learnings.md 업데이트 (마이그 PR과 동시)

L-077 신규 추가:

- 증상: Vercel Queue beta trigger registration이 새 deployment로 migration 안 됨
- 진단: alias는 최신, worker invoke는 옛 deployment로 향함 (vercel logs로 deployment URL 확인이 결정적 단서)
- 규칙: 베타 인프라가 deploy 후 동작 변경되면 customer-side patch 한계. abstraction layer + GA 인프라 즉시 전환이 정공법
- 연관: L-072, L-074, L-076

## 12. PROGRESS.md 업데이트 (마이그 PR 머지 후)

- Task 13 closure: ✅ QStash 전환 완료
- L-076 closure: 베타 인프라 결함 + abstraction을 활용한 GA 전환으로 영구 해결
- 다음: Phase 1Cd hook / 1D multi-channel
