/**
 * Plan v3 M3.4 — 외국인 손님 magic link 인증 이메일 발송.
 *
 * Better Auth magic-link plugin에 sendMagicLink 함수로 주입. 손님의 본인
 * 식별 흐름:
 *   1) /c/sign-in 폼에 email 입력
 *   2) Better Auth → magicLink 토큰 생성 → 본 함수 호출 → Resend 이메일
 *   3) 손님이 메일에서 링크 클릭 → 자동 verify → mypage 진입
 *
 * 보안:
 *   - 토큰 만료 15분 (Better Auth plugin 설정)
 *   - rate-limit 5분/3회 (Better Auth plugin 설정)
 *   - sender = RESEND_FROM_EMAIL (검증된 도메인). 검증 안 된 도메인은 Resend가 거절.
 *
 * 다국어:
 *   - 손님 locale은 URL 쿼리(`?locale=xx`)에서 파생. magic link plugin은 raw url을
 *     전달하므로, ?locale 파라미터를 url에서 파싱하여 6 locale 분기.
 *   - locale fallback 우선순위: url ?locale → en
 */
import "server-only";
import { Resend } from "resend";

type SupportedLocale = "ko" | "en" | "ja" | "vi" | "zh-CN" | "zh-TW";
const DEFAULT_LOCALE: SupportedLocale = "en";

const LOCALE_KEYS: Record<string, SupportedLocale> = {
  ko: "ko",
  en: "en",
  ja: "ja",
  vi: "vi",
  "zh-cn": "zh-CN",
  "zh-tw": "zh-TW",
};

const TEMPLATES: Record<
  SupportedLocale,
  { subject: string; body: (url: string) => string }
> = {
  ko: {
    subject: "Hesya — 로그인 링크",
    body: (url) => `안녕하세요!

아래 링크를 클릭하면 Hesya에 로그인됩니다 (15분 후 만료):

${url}

본인이 요청하지 않았다면 이 메일은 무시하세요.

— Hesya 팀`,
  },
  en: {
    subject: "Hesya — Your sign-in link",
    body: (url) => `Hello!

Click the link below to sign in to Hesya (expires in 15 minutes):

${url}

If you didn't request this, you can safely ignore this email.

— The Hesya Team`,
  },
  ja: {
    subject: "Hesya — ログインリンク",
    body: (url) => `こんにちは!

下のリンクをクリックするとHesyaにログインできます(15分後に有効期限切れ):

${url}

ご自身でリクエストされていない場合は、このメールを無視してください。

— Hesyaチーム`,
  },
  vi: {
    subject: "Hesya — Liên kết đăng nhập",
    body: (url) => `Xin chào!

Nhấp vào liên kết dưới đây để đăng nhập vào Hesya (hết hạn sau 15 phút):

${url}

Nếu bạn không yêu cầu, vui lòng bỏ qua email này.

— Đội ngũ Hesya`,
  },
  "zh-CN": {
    subject: "Hesya — 登录链接",
    body: (url) => `您好!

点击下面的链接登录Hesya(15分钟后过期):

${url}

如果不是您本人请求,请忽略此邮件。

— Hesya 团队`,
  },
  "zh-TW": {
    subject: "Hesya — 登入連結",
    body: (url) => `您好!

點擊下方連結登入Hesya(15分鐘後過期):

${url}

若非您本人請求,請忽略此郵件。

— Hesya 團隊`,
  },
};

function pickLocale(url: string): SupportedLocale {
  try {
    const parsed = new URL(url);
    const raw = parsed.searchParams.get("locale")?.toLowerCase();
    if (raw && LOCALE_KEYS[raw]) return LOCALE_KEYS[raw];
  } catch {
    // url parse 실패 — locale fallback
  }
  return DEFAULT_LOCALE;
}

let _resend: Resend | null = null;
function getResend(apiKey: string): Resend {
  if (!_resend) _resend = new Resend(apiKey);
  return _resend;
}

export async function sendCustomerMagicLink(input: {
  email: string;
  url: string;
}): Promise<void> {
  const { env } = await import("@/shared/config/env");
  const locale = pickLocale(input.url);
  const tmpl = TEMPLATES[locale];
  try {
    const result = await getResend(env.RESEND_API_KEY).emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: input.email,
      subject: tmpl.subject,
      text: tmpl.body(input.url),
    });
    if (result.error) {
      console.error(
        `[customer-magic-link] Resend failed (${input.email}):`,
        result.error,
      );
      return;
    }
    console.info(
      `[customer-magic-link] sent (${input.email}, ${locale}) id=${result.data?.id ?? "?"}`,
    );
  } catch (err) {
    console.error(
      `[customer-magic-link] threw (${input.email}):`,
      err instanceof Error ? err.message : err,
    );
  }
}
