# Hesya 운영 Runbook

## 1. 마이그레이션 롤백 정책 (v0011~)

### 규칙

- v0011 이후 모든 마이그레이션은 **상단 주석에 `-- ROLLBACK:` 블록 강제**.
- Drizzle Kit이 down migration을 자동 생성하지 않으므로 수동 작성.
- 핫픽스 상황에서 Supabase Studio SQL Editor에 `ROLLBACK:` 블록을 복사하여 직접 실행.
- v0010 이전 마이그레이션은 소급 X (senior-engineer 권장).

### 형식

```sql
-- migrations/NNNN_short_name.sql
-- Epic X TaskY: 한 줄 설명
--
-- ROLLBACK:
--   DROP TABLE foo;
--   ALTER TABLE bar DROP COLUMN baz;
```

## 2. ngrok 무료 정적 도메인 (1A Instagram webhook)

### 셋업

```bash
# 1. ngrok 무료 가입 → dashboard.ngrok.com
# 2. authtoken 설정 (한 번만):
ngrok config add-authtoken <token>
# 3. 자동 할당된 dev domain 확인:
#    dashboard.ngrok.com → Universal Gateway → Domains
#    → ngrok-free.app (또는 .ngrok-free.dev) 도메인 1개가 이미 할당되어 있음
# 4. 그 도메인으로 endpoint 시작:
ngrok http --url=<your-assigned-name>.ngrok-free.app 3000
```

- 한도: HTTP 20k req/월, 1GB/월, 동시 endpoint 3개 (1A PoC 충분)
- 자동 할당된 도메인은 영구 고정 (계정 유지 한). 매번 같은 URL.
- `IG_REDIRECT_URI`, Meta webhook subscription URL 모두 이 도메인 사용.

## 3. Meta App Review (1A 외부 의존)

### 사전 조건

- Meta Developer Account (Jayden 명의)
- Meta App 생성 (Business 타입)
- 더미 매장 IG Business + FB Page 연결
- Business Verification 신청 (검증 며칠~)

### App Review 신청 시기

- 1A 메인 코드 완료 후 (G1~G9 dev mode 통과 후)
- 신청 permissions: `instagram_business_basic`, `instagram_business_manage_messages`
- 검토 기간: 평균 2~7일, 일부 케이스 2개월 stuck 사례

### App Review 통과 전 한계

- Development mode = 25 test users만 webhook 수신
- 1A G1~G10 검증은 dev mode + Jayden 외부 IG 1개 test user로 충분

## 4. 베타 매장 onboarding 절차 (Phase 1-β)

### Pre-flight (Jayden)

1. `ADMIN_EMAILS`에 Jayden 이메일 등록 확인 (Vercel prod env)
2. Supabase prod에 0022 마이그 적용 확인:
   `SELECT bot_mode FROM stores LIMIT 1;` (0이상이면 OK, 컬럼 없으면 마이그 미적용)
3. Sentry `phase=onboarding:*` alert 채널 활성

### 매장 owner 시점

1. 매장 owner 컨택 → 사전 인터뷰 30분 → 동의서 → URL 전달:
   `https://hesya-web.vercel.app/sign-in?next=/onboarding/kyc`
2. Google OAuth 로그인 → 폼 채움:
   - 매장명 / 사업자번호 (10자리) / 대표자 / 전화 / 주소
   - 영업신고증 사진 URL (Supabase Storage 또는 외부 호스팅)
   - 자기신고 3건 모두 체크
3. 제출 → "검토 중" 화면 (30s 폴링)

### Jayden (admin) 시점

1. 신청 알림 (Sentry 또는 매뉴얼 모니터링)
2. `/admin/store-verifications` → 상세 → 영업신고증 이미지 육안 검토
3. 사업자번호 국세청 홈택스 직접 조회 (자동 안 함)
4. 미용업 5종 + 자유업 4종 카테고리 적합 시 "승인", 마사지/의료기기/한방
   의심 시 "거절" + 사유

### 매장 owner — 승인 후

1. "승인됨" 화면 → "Instagram 연결" 링크 → OAuth flow
2. 외국 고객 DM 수신 대기 → AI 초안 → 검수·승인 모드 (default)
3. 1주 + 메시지 10건+ 누적 후 회고 인터뷰

### 운영 모니터링 (Jayden, 매일 SQL)

```sql
SELECT
  COUNT(*) FILTER (WHERE draft_status='pending_review') AS pending,
  COUNT(*) FILTER (WHERE draft_status='sent' AND (edited_from_ai IS NOT TRUE)) AS sent_no_edit,
  COUNT(*) FILTER (WHERE draft_status='sent' AND edited_from_ai=true) AS sent_edited,
  COUNT(*) FILTER (WHERE draft_status='skipped') AS skipped
FROM messages WHERE store_id=$BETA_STORE_ID;
```

> Note: `approveDraft` server action transitions `pending_review → approved → sent` sequentially within a single action, so successful approvals never linger at `approved`. Only `editAndSend` sets `edited_from_ai=true`; `approveDraft` leaves it as default (NULL), counted via `IS NOT TRUE`.

H1 수정률 = `sent_edited / (sent_no_edit + sent_edited)`.
