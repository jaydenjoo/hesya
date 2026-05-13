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
 * Open redirect 방지 — 매장 영역(`/{locale}/store/*`) whitelist만 허용.
 * 외부 도메인 차단 + Better Auth verify 후 dashboard로 보내야 하므로
 * 매장 외 path는 모두 dashboard로 fallback.
 */
function sanitizeCallback(raw: string | undefined, locale: string): string {
  const fallback = `/${locale}/store/dashboard`;
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (!raw.startsWith(`/${locale}/store/`)) return fallback;
  return raw;
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function SignInPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { callbackUrl } = await searchParams;
  const safeCallback = sanitizeCallback(callbackUrl, locale);

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
