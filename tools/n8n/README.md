# Hesya × n8n 워크플로

> Phase 1-γ.1.4 (E12-8) — 외부 RSS 채널 정책 변경을 hesya admin 큐로 자동 수집.

## 호환 버전

- **n8n 2.16.0** (2026-04-07 release) 또는 그 이후 호환 버전 (typeVersion 변경 없음 시점 기준)
- 노드 typeVersion: Schedule 1.3 / RSS Feed Read 1.2 / IF 2.3 / HTTP Request 4.4

## 워크플로 목록

| 파일                           | 용도                                                        |
| ------------------------------ | ----------------------------------------------------------- |
| `api-policy-rss.workflow.json` | Meta Developers Blog RSS 30분마다 폴링 → hesya webhook 발송 |

## 1. n8n 환경변수 설정

n8n 인스턴스에서 다음 두 변수를 설정 (Settings → Variables, 또는 self-host 시 `~/.n8n/.env`):

```bash
HESYA_WEBHOOK_URL=https://hesya.example.com/api/webhooks/n8n-rss
HESYA_WEBHOOK_SECRET=<32자 이상 랜덤>  # openssl rand -base64 32
```

> **중요**: `HESYA_WEBHOOK_SECRET`는 hesya 측 `N8N_WEBHOOK_SECRET` 환경변수와 **동일 값**이어야 함. 두 시스템 모두에 설정 후 시크릿 매니저로 동기화 권장.

## 2. 워크플로 임포트

n8n UI:

1. **Workflows** → **Import from File**
2. `api-policy-rss.workflow.json` 선택
3. 노드별 credential 미사용 (HTTP Request의 인증은 헤더 기반) — 별도 credential 설정 불필요
4. 임포트 후 **Save** (active 상태는 일단 OFF로 import됨)

## 3. 활성화 전 검증

활성화하기 전에 **Execute Workflow** 버튼으로 1회 수동 실행:

- ✅ **RSS — Meta Developers Blog**: title/link/guid/isoDate 필드가 있는 item 출력 확인
- ✅ **Has GUID or Link**: branch 분기 정상 (대부분 true로 통과)
- ✅ **Notify Hesya**: 200 응답 + `{ "ok": true, "inserted": true | false }` JSON 본문

문제가 있으면 hesya 측 로그 확인:

```bash
# Vercel logs
vercel logs <prod-deployment> --since 5m | grep "n8n-rss"

# 로컬 dev:demo
# Sentry warnings 'n8n-rss webhook secret mismatch' or 'api-policy-alert received'
```

## 4. 활성화

검증 완료 후 워크플로 우상단 **Active** 토글 ON. 30분마다 자동 실행 시작.

## 5. RSS 채널 추가 (확장)

Meta blog 외에 채널 추가는 워크플로 복제 + RSS URL + `source` 필드 변경:

| Source            | RSS URL (검증 필요)                                                          |
| ----------------- | ---------------------------------------------------------------------------- |
| meta-blog         | https://developers.facebook.com/blog/feed                                    |
| whatsapp-business | https://developers.facebook.com/docs/whatsapp/changelog (RSS 가능 여부 확인) |
| line-developers   | https://developers.line.biz/en/news/ (RSS 미지원 시 scrape 필요)             |
| kakao-developers  | https://developers.kakao.com/ (RSS 미지원 시 별도)                           |

n8n 노드의 `source` 필드 (HTTP Request `jsonBody` 안)를 채널별로 변경. hesya 측 `api_policy_alerts` 테이블의 unique(source, guid)로 채널별 중복 차단.

## 6. 트러블슈팅

### "401 invalid secret"

- n8n 측 `HESYA_WEBHOOK_SECRET` ≠ hesya 측 `N8N_WEBHOOK_SECRET`. 양쪽 환경변수 비교.

### "422 invalid body"

- RSS feed가 변경되어 `title`/`link`/`guid` 중 일부가 비어 있음. n8n 측 expression 결과를 Execute로 확인.
- `JSON.stringify()` 누락으로 expression이 literal 문자열로 전송됨 (typeVersion 4.4 함정). 본 워크플로는 모든 표현식이 `JSON.stringify()`로 감싸져 있는지 확인.

### 200 + inserted=false 반복

- 정상. RSS feed에 새 entry가 없으면 unique(source, guid) 충돌로 idempotent skip. n8n 측 noise 줄이려면 IF 노드를 Static Data 비교로 교체 가능.

## 출처

- n8n docs: https://docs.n8n.io/release-notes/
- Schedule Trigger: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/
- RSS Feed Read: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.rssfeedread/
- HTTP Request: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/
- 본 워크플로 typeVersion 검증: n8n@2.16.0 git tag, 2026-05-10 확인
