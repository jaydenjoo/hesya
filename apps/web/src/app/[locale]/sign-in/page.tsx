import { BrandPanel } from "./brand-panel";
import { FormPanel } from "./form-panel";
import "./sign-in.css";

const LOCALE_LABEL: Record<string, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  vi: "Tiếng Việt",
  "zh-CN": "中文 (简体)",
  "zh-TW": "中文 (繁體)",
};

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
  const localeLabel = LOCALE_LABEL[locale] ?? "한국어";

  return (
    <div className="sl-app" data-screen-label="Store Login">
      <BrandPanel />
      <FormPanel callbackUrl={safeCallback} localeLabel={localeLabel} />
    </div>
  );
}
