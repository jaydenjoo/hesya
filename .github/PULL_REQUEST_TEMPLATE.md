## 요약 (Why)

<!-- 이 PR이 왜 필요한가? 1~3줄 -->

## 변경사항 (What)

<!-- 무엇이 바뀌었나? bullet -->

- ...

## 검증 (How verified)

- [ ] `pnpm tsc --noEmit` 통과
- [ ] `pnpm lint --max-warnings 0` 통과
- [ ] `pnpm build` 통과
- [ ] 핵심 기능 수동 테스트 (golden path)
- [ ] 엣지 케이스 (에러/빈 데이터/대량 데이터)
- [ ] 모바일 반응형

## 보안 체크 (Security)

- [ ] Server Action 모두에 `requireAuth()` 호출됨
- [ ] DB 접근 DAL 거침 (`shared/lib/dal/`)
- [ ] 환경변수 zod 검증됨
- [ ] 시크릿/PII 로깅 없음

## 디자인 체크 (해당 시)

- [ ] 안티-AI 룩 (보라/인디고/violet/purple/blue 사용 X)
- [ ] `@theme` 토큰만 사용 (하드코딩 색상 X)
- [ ] 둥근 pill / soft shadow 사용 X

## 스크린샷 / 영상 (UI 변경 시)

<!-- 첨부 -->

## 다관점 리뷰 (선택)

- [ ] code-reviewer
- [ ] security-reviewer (🟡🔴 등급)
- [ ] factual-reviewer
- [ ] senior-engineer
- [ ] consistency-reviewer

## 다음 Task

<!-- 머지 후 자연스럽게 따라오는 작업? -->
