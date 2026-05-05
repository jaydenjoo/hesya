import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getInstagramOAuthUrl } from "@/features/inbox/actions/connect-instagram";

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const t = await getTranslations("Inbox.notConnected");
  const tFailed = await getTranslations("Inbox.connect");

  async function start() {
    "use server";
    const url = await getInstagramOAuthUrl();
    redirect(url);
  }

  return (
    <main className="mx-auto max-w-xl space-y-4 p-8">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      {sp.error ? (
        <Alert variant="destructive">
          <AlertDescription>
            {tFailed("failed", { reason: sp.error })}
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
