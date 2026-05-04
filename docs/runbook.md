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
# 2. authtoken 받아서:
ngrok config add-authtoken <token>
# 3. 정적 도메인 발급 (자동 할당, 변경 X):
ngrok http 3000  # → https://<your-name>.ngrok-free.app
```

- 한도: HTTP 20k req/월, 1GB/월, 동시 endpoint 3개 (1A PoC 충분)
- URL은 영구 고정. 매번 같은 URL.
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
