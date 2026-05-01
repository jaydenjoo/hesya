"use client";

import { createAuthClient } from "@hesya/auth/client";
import { useTranslations } from "next-intl";

const authClient = createAuthClient();

export default function SignInPage() {
  const t = useTranslations("Common");

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-2xl font-semibold">
        Hesya — Sign In (S-18 검증)
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        Better Auth + Google OAuth 동작 검증용 임시 페이지입니다.
      </p>
      <button
        type="button"
        onClick={() =>
          authClient.signIn.social({
            provider: "google",
            callbackURL: "/",
          })
        }
        className="w-full rounded border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50"
      >
        {t("signIn")}
      </button>
    </main>
  );
}
