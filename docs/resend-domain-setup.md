# Resend 도메인 검증 가이드

> 외부 사장에게 magic link / KYC 결과 / 분쟁 결과 메일을 보내기 위한 **베타 출시 차단선** 작업.
> 작성일 2026-05-13. 코드 측 변경 0건 — 전부 외부 콘솔 + DNS + Vercel env 작업.

## 왜 필요한가

현재 prod `RESEND_FROM_EMAIL`은 Resend 무료 기본 sender(`onboarding@resend.dev` 류)로 추정. 외부 사장이 받는 메일에 **"resend.dev"가 그대로 보임** → 신뢰도 낮음 + 스팸함 직행 가능성.

**비유**: 식당이 음식 배달 보낼 때 박스에 "쿠팡잇츠"만 찍혀 있는 것 vs "강남 헤어샵 ← 쿠팡잇츠" 둘 다 찍힌 것. 받는 사람이 누가 보낸 건지 즉시 알 수 있어야 열어본다.

검증 완료 시 sender가 `noreply@hesya.kr` (또는 `hello@hesya.com`)이 되고, 수신함에 "Hesya" 브랜드명이 노출됨.

## 0단계 — 도메인 보유 확인 (prerequisite)

이 작업의 prerequisite. **도메인이 없으면 1단계 진행 불가**.

| 옵션           | 가격(연)          | 추천 용도                                              |
| -------------- | ----------------- | ------------------------------------------------------ |
| `hesya.kr`     | ~₩22,000 (가비아) | 한국 시장 대상 베타 ⭐                                 |
| `hesya.com`    | ~$12 (Namecheap)  | 글로벌 확장 시. 한국 사장에게는 .kr이 더 신뢰감 ↑ 가능 |
| `hesya.app`    | ~$15 (Google)     | 앱·SaaS 톤. 한국 사장 인지도 낮음                      |
| `gethesya.com` | ~$12              | hesya.com 이미 점유면 대안 (Stripe Atlas 등 SaaS 관례) |

**추천**: `hesya.kr` (한국 자영업자 베타 5곳 대상이라 .kr이 가장 친숙). `hesya.com` 동시 확보 권장 (브랜드 보호 + 추후 글로벌 확장).

**구매 후 확인사항**:

- [ ] 도메인 등록 완료
- [ ] DNS 제어판 접근 가능 (Cloudflare로 옮기면 가장 편함 — 무료 + Vercel 연동 ↑)

⚠️ **사업자 명의 vs 개인 명의 결정**: 베타 출시 후 사업자 등록 시 도메인 이전 비용 발생 가능. Jayden 메모리상 사업자 미보유 상태 → 개인 명의로 시작 OK.

## 1단계 — Resend 콘솔 도메인 추가

1. [resend.com/domains](https://resend.com/domains) 로그인
2. **Add Domain** 클릭
3. 도메인 입력: `hesya.kr` (메인 도메인, 또는 서브도메인 `mail.hesya.kr`)
4. Region 선택: **Tokyo (ap-northeast-1)** — 한국 가까움 + 한국 사장에게 빠른 발송
5. **Add** 클릭 → DNS 레코드 5개 표시됨

**비유**: 식당 사업자 등록 신청처럼, 가게 주소(도메인) + 사장 신분증(DNS 레코드) 둘 다 제출해야 영업 허가 나옴.

## 2단계 — DNS 레코드 추가

Resend가 표시하는 5개 레코드를 DNS 제어판에 등록.

### 레코드 종류

| Type  | Name                | Value                         | 용도                                  |
| ----- | ------------------- | ----------------------------- | ------------------------------------- |
| `MX`  | `send`              | `feedback-smtp.<region>...`   | Bounce / complaint 수집 (Resend 받음) |
| `TXT` | `send`              | `v=spf1 include:amazonses...` | SPF (발신자 IP 인증)                  |
| `TXT` | `resend._domainkey` | `p=MIIB...`                   | DKIM (메일 서명, 위변조 방지)         |
| `TXT` | `_dmarc`            | `v=DMARC1; p=none;...`        | DMARC (SPF/DKIM 실패 시 정책)         |
| `TXT` | `<root>`            | `resend-verification=...`     | 도메인 소유 증명                      |

### Cloudflare에 등록 (추천)

1. Cloudflare 대시보드 → 도메인 선택 → **DNS** → **Records**
2. Resend 화면의 5개 레코드를 하나씩 **Add Record** 클릭하며 복붙
3. ⚠️ **Cloudflare proxy(주황 구름) 끄기** — 메일 레코드는 proxy 불가 ("DNS only" 회색 구름)
4. TTL: Auto (Cloudflare 기본)

### 가비아에 등록 (`.kr` 도메인 일반)

1. 가비아 My가비아 → DNS 관리 → 해당 도메인 → DNS 설정
2. 레코드 추가 → Type / Host / Value 입력
3. 가비아는 SPF·DKIM 등록 UI가 다소 헷갈리니, 화면 캡처 떠서 Claude에게 보여주면 한 줄씩 매핑 도와줌

## 3단계 — DNS Propagation 대기 + 검증

1. DNS 등록 후 **5분~수시간** 대기 (TTL 따라). Cloudflare는 보통 5분 안.
2. Resend 콘솔 → 해당 도메인 → **Verify DNS Records** 클릭
3. 5개 레코드 모두 ✅ 표시되면 검증 완료
4. 일부만 ✅면 Resend가 "Pending" 표시 + 무엇이 안 됐는지 알려줌

**진단 명령 (Mac)**:

```bash
dig TXT hesya.kr +short                       # 루트 verification TXT
dig TXT send.hesya.kr +short                  # SPF
dig TXT resend._domainkey.hesya.kr +short     # DKIM
dig TXT _dmarc.hesya.kr +short                # DMARC
dig MX send.hesya.kr +short                   # MX
```

결과가 비어있으면 DNS 아직 전파 안 됨. 30분 더 대기.

## 4단계 — Vercel env 변경

검증 완료 후 prod env 갱신. **이 명령은 Jayden 직접 실행 권장** (시크릿 환경 변경이라 명시 승인 필요).

```bash
# 1. 기존 값 제거
vercel env rm RESEND_FROM_EMAIL production

# 2. 새 값 추가 (display name 포함 형식)
vercel env add RESEND_FROM_EMAIL production
# 입력값: Hesya <noreply@hesya.kr>
```

⚠️ **display name 형식 주의**: `Hesya <noreply@hesya.kr>` (꺽쇠 안에 이메일). 한글 display name (`헤시야 <noreply@hesya.kr>`)도 가능하지만 일부 메일 클라이언트에서 깨질 수 있으니 영문 권장.

**대안 sender 후보**:

- `Hesya <noreply@hesya.kr>` — 일반적 (회신 불가 안내)
- `Hesya <hello@hesya.kr>` — 친근한 톤
- `Hesya 알림 <notify@hesya.kr>` — 알림 전용 명시

## 5단계 — 재배포 + 검증

```bash
# 1. Vercel 강제 재배포 (env 변경 반영)
vercel --prod

# 또는 GitHub main에 빈 commit push로 자동 배포 트리거
git commit --allow-empty -m "chore: trigger redeploy after RESEND_FROM_EMAIL update"
git push
```

**E2E 검증 (사용자 입장)**:

1. `https://hesya-web.vercel.app/ko/sign-in` 접속 (또는 future custom domain)
2. 본인 이메일 입력 → magic link 받기
3. 수신함에서 sender 확인:
   - ✅ "Hesya <noreply@hesya.kr>" 표시
   - ✅ 스팸함이 아닌 받은편지함에 직행
   - ✅ Gmail "이 메일은 hesya.kr에서 보낸 것이 맞습니다" 인증 표시 (DKIM 통과 시 자물쇠 아이콘)

검증 실패 시:

- 스팸함 직행 → DMARC 정책 강화 (`p=none` → `p=quarantine`) — Resend 도메인 30일 사용 후 권장
- Resend 콘솔 → Activity 탭에서 발송 로그 + bounce 사유 확인

## 6단계 — 모니터링

- **Resend Dashboard** → Activity: 발송 / bounce / complaint 통계
- **Free plan 한도**: 3,000건/월 (베타 5곳 × 일 평균 10건 = 1,500건/월. 한도 내).
- Free 한도 80% 도달 시 Resend가 메일 알림 보냄.
- 한도 초과 시 Pro plan ($20/월, 50K건) 업그레이드 필요.

## Known Issues / Gotchas

- ⚠️ **`onboarding@resend.dev`은 무료 sender이지만 production 부적합** — 받는 사람 신뢰도 0. 베타 출시 전 본 가이드 따라 도메인 검증 의무.
- ⚠️ **DMARC `p=reject` 즉시 적용 금지** — 도메인 신뢰도 누적 전(보통 30일+)에 강한 정책 적용하면 정상 메일도 거절될 수 있음. `p=none`으로 시작 → 모니터링 후 단계적 강화.
- ⚠️ **Cloudflare proxy 켜진 채로 MX/TXT 추가 시 fail** — proxy 끄기 의무.
- ⚠️ **Vercel env 변경 후 재배포 안 하면 반영 안 됨** — `vercel --prod` 또는 빈 commit push 필요.
- ⚠️ **display name 안 쓰면 받는 사람에게 raw email만 표시** — "noreply@hesya.kr"이 그대로 보임. 브랜딩 위해 `Hesya <...>` 형식 권장.

## 코드 측 변경 영향

**없음.** 모든 변경이 환경변수 값에 흡수됨.

- 4 파일이 `from: env.RESEND_FROM_EMAIL` 사용 중 ([owner-magic-link.ts:50](../apps/web/src/lib/notifications/owner-magic-link.ts), [customer-magic-link.ts:149](../apps/web/src/lib/notifications/customer-magic-link.ts), [kyc-result.ts:295](../apps/web/src/lib/notifications/kyc-result.ts), [dispute-result.ts:82](../apps/web/src/lib/notifications/dispute-result.ts))
- env value를 `Hesya <noreply@hesya.kr>` 형식으로 등록하면 자동으로 display name 적용
- `z.email()` 검증은 `Hesya <noreply@hesya.kr>` 형식도 통과 (RFC 5322 email format)

> 만약 검증 통과 안 되면 (z.email이 raw email만 허용) → `env.ts` 82 line의 schema를 `z.string().regex(/^.+ <[^@]+@[^>]+>$|^[^@]+@[^>]+$/)`로 변경. 이번 PR에서는 생략 — 실제 등록 후 검증.

## 체크리스트

- [ ] 0. 도메인 보유 (`hesya.kr` 권장)
- [ ] 1. Resend 콘솔 Add Domain (Tokyo region)
- [ ] 2. DNS 레코드 5개 등록
- [ ] 3. DNS propagation + Resend 검증 통과
- [ ] 4. Vercel env `RESEND_FROM_EMAIL` 변경 (display name 포함)
- [ ] 5. 재배포 + E2E 메일 발송 검증
- [ ] 6. Resend Activity 모니터링 1주일 (bounce / complaint 추이)

## 연관 문서

- [docs/runbook.md](runbook.md) — 운영 진단 절차
- [docs/beta-launch-gap-analysis.md](beta-launch-gap-analysis.md) — 베타 출시 차단선 전체
- [apps/web/src/shared/config/env.ts:77-82](../apps/web/src/shared/config/env.ts) — env schema 정의

## 진행 상태 (2026-05-13)

- ✅ 가이드 문서 작성
- ⏸️ Jayden 외부 액션 대기 (도메인 결정 + 구매 + DNS + 검증 + Vercel env 변경)

> **다음 액션**: 도메인 (`hesya.kr` 또는 다른 후보) 결정 → 0단계부터 진행. 막힐 시 본 가이드 단계별로 Claude와 다시 진행 가능.
