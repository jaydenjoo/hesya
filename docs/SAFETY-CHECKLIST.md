# SAFETY-CHECKLIST.md — 배포 전 13개 체크

> ⚠️ **scripts/safe-deploy.sh가 자동 검증**. 통과 못하면 배포 차단.

## 자동 검증 (5개)

1. [ ] **타입 체크**: `pnpm tsc --noEmit` 통과
2. [ ] **린트**: `pnpm lint --max-warnings 0` 통과
3. [ ] **빌드**: `pnpm build` 통과
4. [ ] **시크릿 누출**: `gitleaks detect --no-git` 통과
5. [ ] **환경변수 누락**: `.env.example`과 `.env` 변수명 일치

## 수동 검증 (8개)

6. [ ] **모든 Server Action에 `requireAuth()` 호출됨**
   - 검증: `grep -r "use server" src/ | xargs grep -L "requireAuth"`
7. [ ] **Supabase RLS 활성화** (해당 시)
   - Supabase Dashboard → Authentication → Policies
8. [ ] **CSP 헤더 적용됨** (next.config.ts)
9. [ ] **rate-limit 적용** (비싼 작업 — AI 호출, 결제 등)
10. [ ] **에러 메시지 일반화** (이메일 존재 여부 노출 X 등)
11. [ ] **HTTPS 강제** (Vercel 자동, 자체 호스팅 시 확인)
12. [ ] **로그에 PII 노출 없음** (이메일/전화/주민번호 등)
13. [ ] **결제 로직 (🔴) — 사람 리뷰 완료**

## 등급별 추가 체크

### 🔴 결제·본인인증

- [ ] 모든 금액 계산 서버 검증
- [ ] idempotency key (이중 결제 방지)
- [ ] Webhook 서명 검증
- [ ] 감사 로그 기록 (activity_logs)
- [ ] Codex 외부 LLM 교차 검증 완료 (`/codex review`)

### 🟡 인증·개인정보

- [ ] 비밀번호 zod 검증 (8자+ 복잡도)
- [ ] 세션 만료 처리
- [ ] 비밀번호 재설정 토큰 짧은 TTL (1시간)

## 통과 기록

배포 일자 / 통과 항목 / 책임자

| 일자 | 환경 | 통과 | 미통과 | 책임자 |
| ---- | ---- | ---- | ------ | ------ |
| -    | -    | -    | -      | -      |
