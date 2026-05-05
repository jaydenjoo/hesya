import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getInstagramOAuthUrl } from "@/features/inbox";

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
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const t = await getTranslations("Inbox.notConnected");
  const tFailed = await getTranslations("Inbox.connect");
  const errorCode = isAllowedError(sp.error) ? sp.error : null;

  async function start() {
    "use server";
    const url = await getInstagramOAuthUrl();
    redirect(url);
  }

  return (
    <main className="mx-auto max-w-xl space-y-4 p-8">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      {errorCode ? (
        <Alert variant="destructive">
          <AlertDescription>
            {tFailed("failed", { reason: errorCode })}
          </AlertDescription>
        </Alert>
      ) : null}
      <p className="text-muted-foreground">{t("description")}</p>
      <form action={start}>
        <Button type="submit">{t("button")}</Button>
      </form>
    </main>
  );
}
