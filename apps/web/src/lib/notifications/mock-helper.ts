/**
 * Plan v3 M4.1 — MOCK_NOTIFICATION 공통 헬퍼.
 *
 * env.MOCK_NOTIFICATION=true면 Resend.emails.send 우회 + console.info 출력만.
 * 사업자 등록 / Resend 도메인 검증 전에 외부인 시연 환경에서 사용.
 *
 * 모듈 load 시점 env Zod parse trigger 회피 — caller가 env.MOCK_NOTIFICATION
 * 값을 인자로 넘김 (이미 동적 import한 env 객체에서).
 */

export interface MockEmail {
  kind: string;
  to: string;
  subject: string;
  bodyPreview?: string;
}

export function logMockEmail(input: MockEmail): void {
  const preview = input.bodyPreview
    ? ` body="${input.bodyPreview.slice(0, 80)}…"`
    : "";
  console.info(
    `[mock-notify] ${input.kind} → ${input.to} subject="${input.subject}"${preview}`,
  );
}
