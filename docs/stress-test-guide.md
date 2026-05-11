# Stress Test 가이드 (Phase 1-ζ.4)

> 베타 출시 직전 stability watch용 통합 부하 시드 + 검증 절차.
> seed-beta-demo가 가벼운 시연(메시지 6건)이라면 본 시드는 부하 시연(메시지 250건).

## ⚠️ 안전

- **로컬 DB만** — `HESYA_TEST_DATABASE_URL`은 `localhost / 127.0.0.1 / test / supabase.local`만 허용. prod URL 들어가면 fixture가 throw.
- **시드 = DB 전체 reset** — 매번 resetDb 후 시드. 보존하고 싶은 데이터가 있으면 먼저 백업.
- **LLM 호출 0건** — 모든 메시지/AI 초안은 직접 insert. Anthropic 비용 0.
- **Claude Code shell에서 실행 시 ANTHROPIC_API_KEY 해제** (L-091) — 시드 자체에는 영향 없으나 이후 `dev:demo`에 필요.

## 시드 실행

```bash
unset ANTHROPIC_API_KEY && pnpm seed:stress-test    # L-091 prefix
pnpm dev:demo                                       # 데모 서버 기동
```

`seed:stress-test` 실행 결과 console 출력 (예):

```
[stress-seed] ✓ 시드 완료
  사장 user id           : 00000000-0000-0000-0000-000000000001
  매장 #1 (inbox stress) : <uuid>
  매장 #2~5 (admin 큐)   : 4 건
  메시지                 : 250 건
  예약                   : 50 건
  분쟁                   : 5 건
  API 정책 알림           : 3 건
```

## 시드 데이터

| 영역          | 양      | 비고                                                                                              |
| ------------- | ------- | ------------------------------------------------------------------------------------------------- |
| 매장 #1       | 1       | `auto_approved` + IG 연동 + 사장 owner (inbox/대시보드 stress 대상)                               |
| 매장 #2~5     | 4       | `manual_review` + storeVerifications (admin store-verifications 큐 stress)                        |
| 고객          | 25      | 매장 #1, 언어 mix (en / ja / zh / vi / th 5종 × 5)                                                |
| Conversation  | 25      | 매장 #1, customer 1:1                                                                             |
| 메시지        | **250** | conversation당 inbound 5 + outbound 5. outbound status mix: pending_review 3 / sent 1 / skipped 1 |
| 시술          | 5       | 매장 #1, seed-beta-demo와 동일 (커트/펌/염색/트리트먼트/두피케어)                                 |
| 디자이너      | 3       | 매장 #1, A·B·C                                                                                    |
| 예약          | **50**  | 매장 #1, 상태 mix (statusCycle 10-pattern 반복)                                                   |
| 분쟁          | **5**   | 매장 #1, category mix (complaint 3 / refund 1 / no_show 1)                                        |
| API 정책 알림 | 3       | meta-blog source, `status=new`                                                                    |

## 검증 시나리오 (4단계)

### 1. E1 Inbox stress — `/ko/store/inbox`

- ✅ thread list 좌측에 25 thread 표시 (언어 다양성: en/ja/zh/vi/th)
- ✅ thread 클릭 시 메시지 10건 (inbound 5 + outbound 5) 우측 렌더링
- 📏 **측정**: 페이지 첫 진입 LCP < 2.5s, thread 클릭 후 우측 메시지 INP < 200ms (Core Web Vitals 2026 기준)
- ⚠️ pending_review 초안 75건 (25 conv × 3) — DraftReviewPanel 우선 노출 확인

### 2. E9 KYC 큐 stress — `/ko/admin/store-verifications`

- ✅ admin 큐에 4건 노출 (매장 #2~5, 모두 `manual_review`)
- ✅ 클릭 → storeVerifications 정보 + 자가 선언 4건 + 승인/거부 버튼 표시
- 📏 **측정**: 큐 list load < 1s

### 3. E12 분쟁 + 정책 큐 stress

- `/ko/store/disputes` — 사장 분쟁 5건 표시 (매장 #1)
- `/ko/admin/disputes` — admin 분쟁 큐 5건 (category mix)
- `/ko/admin/api-policy-alerts` — 3건 `status=new`
- 📏 **측정**: 각 큐 load < 1s

### 4. E4 대시보드 + 예약 stress — `/ko/store/dashboard` + `/ko/store/bookings`

- ✅ dashboard 시술 분포 donut — 50건 예약 기반, 5색 팔레트
- ✅ dashboard 디자이너 분포 donut — 50건 예약 기반, 3 segment
- ✅ bookings list — 5-status filter pill 클릭 시 reset 시 50건 표시
- 📏 **측정**: dashboard 첫 진입 LCP < 2.5s (Recharts donut 2개 lazy load 포함)

## Sentry tag 검증

stress test 중 booking status 변경 시 알 수 없는 에러 발생 시 Sentry에 다음 tag로 검색 가능 (본 PR로 추가):

- `route: "action:booking-update"` + `phase: "auth"` — 인증/인가 단계 unknown error
- `route: "action:booking-update"` + `phase: "rate-limit"` — rate limit 단계 unknown error

기존 tag (변동 없음):

- `route: "inbox:refresh"` / `"oauth:instagram"` / `"webhook:instagram"` / `"webhook:n8n-rss"` / `"queue:inbox-process-inbound"`

**누락 영역 (다음 ζ.5 phase에서 보강 대상)**: `dispute actions`, `kyc actions`, `store-cancellation actions`, `notifications`.

## 베타 출시 직전 재실행 (ζ.8)

베타 5곳 stability watch 진입 시 본 시드 + 검증 시나리오 4단계를 재실행:

1. seed 후 4단계 모두 ✅ → ζ.8 stability watch 1주일 시작
2. 시나리오 1~4 중 1개 이상 ❌ → 차단. hotfix 후 재실행.
3. Core Web Vitals 미달 (LCP > 2.5s / INP > 200ms / CLS > 0.1) → 페이지 최적화 후 재실행.

## 트러블슈팅

| 증상                                               | 원인 / 해결                                                                                                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `HESYA_TEST_DATABASE_URL은 localhost/...만 허용`   | `.env.local`이 prod URL을 가리키는 중. demo-guide 2번 세팅 확인.                                                                                       |
| 시드 후 inbox에 thread 0건                         | `E2E_AUTH_USER_ID`가 dev 서버에 안 박힘 → `pnpm dev:demo`로 실행했는지 확인 (그냥 `pnpm dev`는 인증 우회 안 됨).                                       |
| 시드 timeout / connection slots 부족               | dev 서버 + Supabase Studio가 connection 점유. 시드 전 dev 서버 Ctrl+C → 시드 → 재시작.                                                                 |
| dashboard donut 빈 화면                            | 예약 50건은 시드되었으나 본 월 범위 (Asia/Seoul) 밖. statusCycle pattern 확인 — `(i - 20) * 86400000`로 ±20일 분포. 시드 시점이 월 경계면 일부만 노출. |
| Sentry에 `action:booking-update` tag로 검색 시 0건 | stress test 중 booking actions가 핸들된 에러만 발생한 정상 케이스. unknown error 시에만 tag 캡처.                                                      |

## 관련 문서

- 데모 가이드: `docs/demo-guide.md` (경량 시연용)
- 베타 onboarding: `docs/beta-onboarding-checklist.md`
- Phase 1-ζ 상세: `docs/Plan-v2-scenario-B.md` (ζ.4 1일 / ζ.8 재실행)
- 교훈: `docs/learnings.md` (L-091 ANTHROPIC_API_KEY / L-092 resetDb 동기화)
