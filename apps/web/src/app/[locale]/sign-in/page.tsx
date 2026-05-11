import { BrandPanel } from "./brand-panel";
import { FormPanel } from "./form-panel";
import "./sign-in.css";

const LOCALES = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "zh-CN", label: "中文 (简体)" },
  { code: "zh-TW", label: "中文 (繁體)" },
] as const;

/**
 * Open redirect 방지 — 내부 경로만 허용 (`/`로 시작, `//` 차단).
 * 외부 도메인이나 protocol-relative URL을 callbackUrl로 받으면 OAuth flow에서
 * 사용자를 외부 사이트로 보낼 위험. 매우 보수적으로 검증.
 */
function sanitizeCallback(raw: string | undefined): string {
  if (!raw) return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//")) return "/";
  return raw;
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function SignInPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { callbackUrl } = await searchParams;
  const safeCallback = sanitizeCallback(callbackUrl);

  return (
    <div className="sl-app" data-screen-label="Store Login">
      <BrandPanel />
      <FormPanel
        callbackUrl={safeCallback}
        currentLocale={locale}
        locales={LOCALES}
      />
    </div>
  );
}
