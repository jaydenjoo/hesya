import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getInstagramOAuthUrl } from "@/features/inbox";
import { getOwnerShellData } from "@/features/shell/get-owner-shell-data";
import { OwnerShell } from "@/features/shell/owner-shell";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

// OAuth callback route handler가 ?error=...로 내려보낼 수 있는 카테고리만 허용.
// URL을 통한 reflected content injection을 차단.
// 추가 시 callback route(`apps/web/src/app/api/oauth/instagram/callback/route.ts`)와 동기화.
const ALLOWED_OAUTH_ERRORS = ["exchange_failed", "state_mismatch"] as const;
type OAuthError = (typeof ALLOWED_OAUTH_ERRORS)[number];

function isAllowedError(value: string | undefined): value is OAuthError {
  return (
    value !== undefined &&
    (ALLOWED_OAUTH_ERRORS as readonly string[]).includes(value)
  );
}

export default async function ConnectPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;

  try {
    await requireStoreOwnerAuth();
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      redirect(`/${locale}/sign-in`);
    }
    throw err;
  }

  const shell = await getOwnerShellData();
  if (!shell) redirect(`/${locale}/sign-in`);

  const t = await getTranslations("Inbox.notConnected");
  const tFailed = await getTranslations("Inbox.connect");
  const errorCode = isAllowedError(sp.error) ? sp.error : null;

  async function start() {
    "use server";
    const url = await getInstagramOAuthUrl();
    redirect(url);
  }

  return (
    <OwnerShell
      currentLocale={locale}
      storeName={shell.storeName}
      userName={shell.userName}
      userInitial={shell.userInitial}
    >
      <div className="mx-auto max-w-xl px-6 py-10">
        <header className="mb-8 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            Operator · Inbox · Connect
          </p>
          <h1 className="font-heading text-3xl font-semibold italic tracking-tight text-hesya-navy-900">
            {t("title")}
          </h1>
          <p className="text-sm text-hesya-navy-900/65">{t("description")}</p>
        </header>

        {errorCode ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              {tFailed("failed", { reason: errorCode })}
            </AlertDescription>
          </Alert>
        ) : null}

        <form action={start}>
          <Button type="submit">{t("button")}</Button>
        </form>
      </div>
    </OwnerShell>
  );
}
