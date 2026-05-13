/**
 * 매장 사장 magic link 인증 이메일 발송 (한국어 1개 톤).
 *
 * Better Auth magic-link plugin이 callbackURL path로 owner 흐름 식별 시 본 함수 호출.
 * customer-magic-link.ts와 분리 — 손님 다국어 톤과 사장 한국어 톤이 섞이지 않도록.
 *
 * 보안:
 *   - 토큰 만료 15분 + rate-limit 5분/3회 (Better Auth plugin 설정)
 *   - sender = RESEND_FROM_EMAIL
 *   - MOCK_NOTIFICATION 시 로그만 (로컬 dev:demo)
 */
import "server-only";
import { Resend } from "resend";

const SUBJECT = "Hesya — 매장 매니저 로그인 링크";

const body = (url: string) => `안녕하세요, Hesya 매장 매니저님!

아래 링크를 클릭하면 매장 관리 페이지에 로그인됩니다 (15분 후 만료):

${url}

본인이 요청하지 않았다면 이 메일은 무시하셔도 됩니다.

— Hesya 팀`;

let _resend: Resend | null = null;
function getResend(apiKey: string): Resend {
  if (!_resend) _resend = new Resend(apiKey);
  return _resend;
}

export async function sendOwnerMagicLink(input: {
  email: string;
  url: string;
}): Promise<void> {
  const { env } = await import("@/shared/config/env");
  if (env.MOCK_NOTIFICATION) {
    const { logMockEmail } = await import("./mock-helper");
    logMockEmail({
      kind: "magic-link:owner",
      to: input.email,
      subject: SUBJECT,
      bodyPreview: input.url,
    });
    return;
  }
  try {
    const result = await getResend(env.RESEND_API_KEY).emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: input.email,
      subject: SUBJECT,
      text: body(input.url),
    });
    if (result.error) {
      console.error(
        `[owner-magic-link] Resend failed (${input.email}):`,
        result.error,
      );
      return;
    }
    console.info(
      `[owner-magic-link] sent (${input.email}) id=${result.data?.id ?? "?"}`,
    );
  } catch (err) {
    console.error(
      `[owner-magic-link] threw (${input.email}):`,
      err instanceof Error ? err.message : err,
    );
  }
}
